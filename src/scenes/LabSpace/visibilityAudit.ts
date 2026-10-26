/**
 * Visibility audit of the lab (0.37): every sign, banner, poster and logo is
 * tagged `userData.signage = '<name>'`; from the overview and from the camera
 * stop of the zone it belongs to (the nearest one), rays go to a 3 × 3 grid of
 * points on it. A point is hidden when something else is hit first. Run in the
 * page (window.__labAudit, ?debug or dev) by scripts/lab-visibility.test.mjs.
 */
import { Box3, PerspectiveCamera, Raycaster, Vector3, type Mesh, type Object3D } from 'three';
import { LAB_OVERVIEW, LAB_ZONES } from '@/data/lab/zones';
import { overviewShot, zoneShot } from '@/lib/lab/navigation';

export interface SignageReport {
  name: string;
  /** Camera stop it was checked from: 'overview' or a zone id. */
  from: string;
  visible: number;
  total: number;
  /** What hid the first hidden point. */
  hiddenBy?: string;
}

/** Signage tag for `userData`. */
export const signage = (name: string) => ({ signage: name });

const visibleChain = (o: Object3D | null) => {
  for (let p = o; p; p = p.parent) if (!p.visible) return false;
  return true;
};

function describe(o: Object3D) {
  const names: string[] = [];
  for (let p: Object3D | null = o; p && names.length < 3; p = p.parent) if (p.name) names.push(p.name);
  const m = o as Mesh;
  const mat = Array.isArray(m.material) ? m.material[0] : m.material;
  return names.join(' < ') || `${o.type}${mat?.name ? `(${mat.name})` : ''}` || o.uuid.slice(0, 8);
}

/** Corners and centre (3 × 3) of the face of a flat sign, slightly inset, in world space. */
function samplePoints(mesh: Mesh): Vector3[] {
  mesh.geometry.computeBoundingBox();
  const b = mesh.geometry.boundingBox as Box3;
  const pts: Vector3[] = [];
  const thin = (['x', 'y', 'z'] as const).reduce((a, k) => (b.max[k] - b.min[k] < b.max[a] - b.min[a] ? k : a), 'z' as 'x' | 'y' | 'z');
  const axes = (['x', 'y', 'z'] as const).filter((k) => k !== thin);
  for (const u of [0.12, 0.5, 0.88])
    for (const v of [0.12, 0.5, 0.88]) {
      const p = new Vector3();
      p[axes[0]] = b.min[axes[0]] + (b.max[axes[0]] - b.min[axes[0]]) * u;
      p[axes[1]] = b.min[axes[1]] + (b.max[axes[1]] - b.min[axes[1]]) * v;
      p[thin] = b.max[thin];
      pts.push(mesh.localToWorld(p));
    }
  return pts;
}

function stopsFor(position: Vector3) {
  const near = [...LAB_ZONES].sort((a, b) => Math.hypot(a.center[0] - position.x, a.center[1] - position.z) - Math.hypot(b.center[0] - position.x, b.center[1] - position.z))[0];
  return [
    { from: 'overview', at: new Vector3(...overviewShot().position) },
    { from: near.id, at: new Vector3(...zoneShot(near).position) },
  ];
}

/** Checks every tagged sign of `scene`; returns one row per sign × stop it faces. */
export function auditSignage(scene: Object3D): SignageReport[] {
  scene.updateMatrixWorld(true);
  const signs: Mesh[] = [];
  scene.traverse((o) => {
    if ((o as Mesh).isMesh && o.userData.signage && visibleChain(o)) signs.push(o as Mesh);
  });
  const ray = new Raycaster();
  const out: SignageReport[] = [];
  for (const sign of signs) {
    const points = samplePoints(sign);
    const centre = points[4];
    const normal = new Vector3(0, 0, 1).transformDirection(sign.matrixWorld);
    for (const stop of stopsFor(centre)) {
      // a sign is only meant to be read from its front
      if (normal.dot(stop.at.clone().sub(centre).normalize()) < 0.05) continue;
      let visible = 0;
      let hiddenBy: string | undefined;
      for (const p of points) {
        const dir = p.clone().sub(stop.at);
        const dist = dir.length();
        ray.set(stop.at, dir.normalize());
        ray.far = dist - 0.01;
        const hit = ray.intersectObject(scene, true).find((h) => h.object !== sign && visibleChain(h.object) && !h.object.userData.signage && !h.object.userData.noOcclude);
        if (!hit) visible++;
        else hiddenBy ??= `${describe(hit.object)} at ${hit.point.toArray().map((v) => v.toFixed(2)).join(',')}`;
      }
      out.push({ name: sign.userData.signage, from: stop.from, visible, total: points.length, hiddenBy });
    }
  }
  return out;
}

export interface ScreenReport {
  name: string;
  mirrored: boolean;
  upsideDown: boolean;
}

/**
 * Every screen that shows our wallpaper (a canvas texture on a "Screen"
 * material): seen from its front, the picture must run left → right and
 * bottom → top, i.e. the logo is never mirrored or upside down.
 */
export function auditScreens(scene: Object3D): ScreenReport[] {
  scene.updateMatrixWorld(true);
  const out: ScreenReport[] = [];
  scene.traverse((o) => {
    const mesh = o as Mesh;
    if (!mesh.isMesh || !visibleChain(mesh)) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const mat = mats.find((m) => m.name === 'Screen') as (Mesh['material'] & { map?: { image?: unknown; repeat: { x: number; y: number }; flipY: boolean } }) | undefined;
    const map = mat?.map;
    if (!map || !(map.image instanceof HTMLCanvasElement)) return;
    const pos = mesh.geometry.attributes.position;
    const uv = mesh.geometry.attributes.uv;
    if (!pos || !uv || pos.count < 3) return;
    const pts: Vector3[] = [];
    for (let i = 0; i < pos.count; i++) pts.push(new Vector3().fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld));
    // the screen's front: the normal of its best-fit plane, towards where the face normals point
    const nAttr = mesh.geometry.attributes.normal;
    const normal = new Vector3();
    if (nAttr) for (let i = 0; i < nAttr.count; i++) normal.add(new Vector3().fromBufferAttribute(nAttr, i).transformDirection(mesh.matrixWorld));
    if (normal.lengthSq() < 1e-9) return;
    normal.normalize();
    const worldUp = Math.abs(normal.y) > 0.9 ? new Vector3(0, 0, -1) : new Vector3(0, 1, 0);
    const right = new Vector3().crossVectors(worldUp, normal).normalize();
    const up = new Vector3().crossVectors(normal, right).normalize();
    let su = 0;
    let sv = 0;
    const mean = pts.reduce((a, p) => a.add(p), new Vector3()).divideScalar(pts.length);
    let mu = 0;
    let mv = 0;
    for (let i = 0; i < uv.count; i++) {
      mu += uv.getX(i);
      mv += uv.getY(i);
    }
    mu /= uv.count;
    mv /= uv.count;
    for (let i = 0; i < uv.count; i++) {
      const d = pts[i].clone().sub(mean);
      su += d.dot(right) * (uv.getX(i) - mu);
      sv += d.dot(up) * (uv.getY(i) - mv);
    }
    // texture.repeat < 0 flips the picture; a canvas texture is drawn with flipY, so v grows upwards
    su *= Math.sign(map.repeat.x);
    sv *= Math.sign(map.repeat.y) * (map.flipY ? 1 : -1);
    out.push({ name: describe(mesh), mirrored: su < 0, upsideDown: sv < 0 });
  });
  return out;
}

export interface SignOverlap {
  /** Camera stop: 'overview' or a zone id (its own sign against the others). */
  from: string;
  a: string;
  b: string;
}

/** Screen rectangle (normalised device coordinates) of a mesh's bounding box, or null when it is behind the camera. */
function screenRect(mesh: Mesh, camera: PerspectiveCamera) {
  mesh.geometry.computeBoundingBox();
  const b = mesh.geometry.boundingBox as Box3;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const x of [b.min.x, b.max.x])
    for (const y of [b.min.y, b.max.y])
      for (const z of [b.min.z, b.max.z]) {
        const p = mesh.localToWorld(new Vector3(x, y, z));
        if (p.clone().applyMatrix4(camera.matrixWorldInverse).z > -camera.near) return null;
        p.project(camera);
        x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y);
      }
  return { x0, y0, x1, y1 };
}

/**
 * V4 §3.1: zone signs never cover each other on screen — from the overview
 * (every pair) and from each zone's camera stop (its own sign against the
 * others). `aspect` and `fov` are the live canvas's and camera's.
 */
export function auditSignOverlap(scene: Object3D, aspect: number, fov: number): SignOverlap[] {
  scene.updateMatrixWorld(true);
  const signs: Mesh[] = [];
  scene.traverse((o) => {
    if ((o as Mesh).isMesh && String(o.userData.signage ?? '').startsWith('zone-sign:') && visibleChain(o)) signs.push(o as Mesh);
  });
  const shots = [{ from: 'overview', ...overviewShot() }, ...LAB_ZONES.map((z) => ({ from: z.id as string, ...zoneShot(z) }))];
  const out: SignOverlap[] = [];
  for (const shot of shots) {
    const camera = new PerspectiveCamera(shot.from === 'overview' ? LAB_OVERVIEW.fov : fov, aspect, 0.1, 100);
    camera.position.set(...shot.position);
    camera.lookAt(...shot.target);
    camera.updateMatrixWorld(true);
    const rects = signs.map((s) => ({ name: String(s.userData.signage), rect: screenRect(s, camera), depth: s.getWorldPosition(new Vector3()).distanceTo(camera.position) })).filter((r) => r.rect && r.rect.x1 > -1 && r.rect.x0 < 1 && r.rect.y1 > -1 && r.rect.y0 < 1);
    for (let i = 0; i < rects.length; i++)
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i];
        const b = rects[j];
        // from a zone stop only that zone's own sign matters
        if (shot.from !== 'overview' && a.name !== `zone-sign:${shot.from}` && b.name !== `zone-sign:${shot.from}`) continue;
        // a far sign seen past a near one is depth, not a collision: only signs at a similar distance can clash
        if (Math.abs(a.depth - b.depth) > 3) continue;
        const ra = a.rect!;
        const rb = b.rect!;
        if (ra.x0 < rb.x1 && rb.x0 < ra.x1 && ra.y0 < rb.y1 && rb.y0 < ra.y1) out.push({ from: shot.from, a: a.name, b: b.name });
      }
  }
  return out;
}
