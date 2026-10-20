/**
 * Cables of the lab (0.37), procedural but no longer plain rings: a hank of
 * cable bundled with a hook-and-loop tie, both ends hanging down to a plug
 * shaped like the real connector (HDMI's trapezoid, DisplayPort's cut corner,
 * the oval USB-C, the flat USB-A, the 3.5 mm pin with its rings, the clear
 * RJ-45 with its latch). Two geometries per cable: the coloured parts (cable,
 * tie, plug housings — vertex colours) and the metal contacts.
 * Origin: the hook point; the cable hangs down about 0.32 m.
 */
import { BoxGeometry, CatmullRomCurve3, CylinderGeometry, ExtrudeGeometry, Shape, TubeGeometry, Vector3, type BufferGeometry } from 'three';
import { mergePieces, type Piece, type Vec3 } from '../classroom/mergeParts';

export type CableKind = 'hdmi_cable' | 'displayport_cable' | 'usb_c_cable' | 'usb_a_cable' | 'audio_cable' | 'ethernet_cable';

interface Style {
  jacket: string;
  housing: string;
  /** Jacket radius (m). */
  r: number;
  tie: string;
}

export const CABLE_STYLES: Readonly<Record<CableKind, Style>> = {
  hdmi_cable: { jacket: '#1d2026', housing: '#14161a', r: 0.0036, tie: '#ef4444' },
  displayport_cable: { jacket: '#22252c', housing: '#191b20', r: 0.0034, tie: '#f59e0b' },
  usb_c_cable: { jacket: '#eef0f4', housing: '#e4e7ec', r: 0.0022, tie: '#5f7bff' },
  usb_a_cable: { jacket: '#2a2d34', housing: '#2a2d34', r: 0.0026, tie: '#22c55e' },
  audio_cable: { jacket: '#1f8f4c', housing: '#2a2d34', r: 0.0022, tie: '#a855f7' },
  ethernet_cable: { jacket: '#3b82f6', housing: '#2563eb', r: 0.0028, tie: '#f5b83d' },
};

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

/** A flat extruded outline (plug shells), centred, extruded along +Y (the plug's length). */
function shell(points: readonly [number, number][], length: number): BufferGeometry {
  const s = new Shape();
  points.forEach(([x, z], i) => (i ? s.lineTo(x, z) : s.moveTo(x, z)));
  s.closePath();
  const g = new ExtrudeGeometry(s, { depth: length, bevelEnabled: false });
  // shape in XY → plug cross-section in XZ, length along −Y (pointing down)
  g.rotateX(Math.PI / 2);
  return g;
}

/** Metal contact end and plastic housing of one plug, its tip at the origin pointing down (−Y). */
function plug(kind: CableKind, housing: string): { colored: Piece[]; metal: Piece[] } {
  switch (kind) {
    case 'hdmi_cable':
      return {
        metal: [{ geo: shell([[-0.007, 0.00225], [0.007, 0.00225], [0.007, -0.0005], [0.0052, -0.00225], [-0.0052, -0.00225], [-0.007, -0.0005]], 0.0095) }],
        colored: [{ geo: new BoxGeometry(0.021, 0.03, 0.0105), at: [0, 0.0245, 0], color: housing }, { geo: new CylinderGeometry(0.0045, 0.006, 0.012, 14), at: [0, 0.045, 0], color: housing }],
      };
    case 'displayport_cable':
      return {
        metal: [{ geo: shell([[-0.0083, 0.0024], [0.0083, 0.0024], [0.0083, -0.0024], [-0.0058, -0.0024], [-0.0083, 0.0001]], 0.009) }],
        colored: [
          { geo: new BoxGeometry(0.022, 0.03, 0.0105), at: [0, 0.024, 0], color: housing },
          { geo: new BoxGeometry(0.008, 0.007, 0.002), at: [0, 0.022, 0.0058], color: '#5c6270' },
          { geo: new CylinderGeometry(0.0045, 0.006, 0.012, 14), at: [0, 0.045, 0], color: housing },
        ],
      };
    case 'usb_c_cable': {
      const r = 0.0013;
      const pts: [number, number][] = [];
      for (let i = 0; i <= 16; i++) {
        const a = (i / 16) * Math.PI;
        pts.push([0.0029 + Math.sin(a) * r, Math.cos(a) * r]);
      }
      for (let i = 0; i <= 16; i++) {
        const a = (i / 16) * Math.PI;
        pts.push([-0.0029 - Math.sin(a) * r, -Math.cos(a) * r]);
      }
      return {
        metal: [{ geo: shell(pts, 0.0066) }],
        colored: [{ geo: new BoxGeometry(0.012, 0.022, 0.006), at: [0, 0.0175, 0], color: housing }, { geo: new CylinderGeometry(0.003, 0.0038, 0.01, 12), at: [0, 0.033, 0], color: housing }],
      };
    }
    case 'usb_a_cable':
      return {
        metal: [{ geo: new BoxGeometry(0.012, 0.012, 0.0045), at: [0, 0.006, 0] }],
        colored: [
          { geo: new BoxGeometry(0.0102, 0.006, 0.0018), at: [0, 0.006, -0.0006], color: '#3b6bff' },
          { geo: new BoxGeometry(0.016, 0.026, 0.0085), at: [0, 0.025, 0], color: housing },
          { geo: new CylinderGeometry(0.0035, 0.0048, 0.01, 12), at: [0, 0.042, 0], color: housing },
        ],
      };
    case 'audio_cable':
      return {
        metal: [
          { geo: new CylinderGeometry(0.00175, 0.00175, 0.014, 16), at: [0, 0.007, 0] },
          { geo: new CylinderGeometry(0.0011, 0.00175, 0.0018, 16), at: [0, 0.0009, 0] },
        ],
        colored: [
          // the black insulating rings between tip, ring and sleeve
          { geo: new CylinderGeometry(0.0018, 0.0018, 0.0006, 16), at: [0, 0.0042, 0], color: '#0b0c10' },
          { geo: new CylinderGeometry(0.0018, 0.0018, 0.0006, 16), at: [0, 0.0072, 0], color: '#0b0c10' },
          { geo: new CylinderGeometry(0.0042, 0.0042, 0.02, 18), at: [0, 0.024, 0], color: housing },
          { geo: new CylinderGeometry(0.0028, 0.0038, 0.009, 14), at: [0, 0.0385, 0], color: housing },
        ],
      };
    case 'ethernet_cable':
      return {
        metal: [...[-3.5, -2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5].map((k) => ({ geo: new BoxGeometry(0.0006, 0.004, 0.0004), at: [k * 0.00102, 0.0025, 0.0062] as Vec3 }))],
        colored: [
          // the clear plug body, its latch and the boot
          { geo: new BoxGeometry(0.0118, 0.021, 0.0135), at: [0, 0.0105, 0], color: '#d9e6f2' },
          { geo: new BoxGeometry(0.0068, 0.014, 0.0022), at: [0, 0.012, -0.0078], rot: [0.25, 0, 0], color: '#cfe0ef' },
          { geo: new CylinderGeometry(0.0045, 0.0065, 0.016, 14), at: [0, 0.029, 0], color: housing },
        ],
      };
  }
}

/** The cable's path: hook, a bundled hank of two loops, then both ends down to their plugs. */
function hankPath(): { hank: Vector3[]; leftEnd: Vector3[]; rightEnd: Vector3[] } {
  const hank: Vector3[] = [];
  // two elongated loops, slightly apart in depth, hanging from the hook
  for (let i = 0; i <= 40; i++) {
    const a = (i / 40) * Math.PI * 4 + Math.PI / 2;
    hank.push(v(Math.cos(a) * 0.055, -0.09 + Math.sin(a) * 0.085, 0.008 * Math.sin(a * 0.5)));
  }
  const leftEnd = [v(-0.02, -0.17, 0.004), v(-0.035, -0.22, 0.012), v(-0.03, -0.27, 0.01), v(-0.025, -0.305, 0.01)];
  const rightEnd = [v(0.02, -0.17, -0.004), v(0.04, -0.21, -0.01), v(0.045, -0.26, -0.008), v(0.042, -0.29, -0.006)];
  return { hank, leftEnd, rightEnd };
}

export function cableGeometry(kind: CableKind): { colored: BufferGeometry; metal: BufferGeometry } {
  const s = CABLE_STYLES[kind];
  const { hank, leftEnd, rightEnd } = hankPath();
  const tube = (pts: Vector3[], seg: number) => new TubeGeometry(new CatmullRomCurve3(pts), seg, s.r, 8, false);
  const end = (pts: Vector3[]) => pts[pts.length - 1];
  const p = plug(kind, s.housing);
  const at = (q: Vector3): Vec3 => [q.x, q.y, q.z];
  // the plug hangs at the end of each tail, its housing towards the cable
  const place = (pieces: Piece[], tip: Vector3): Piece[] => pieces.map((pc) => ({ ...pc, parents: [{ at: at(tip.clone().add(v(0, -0.048, 0))) }] }));
  const colored: Piece[] = [
    { geo: tube(hank, 160), color: s.jacket },
    { geo: tube([hank[0], v(0.012, 0.0, 0), v(0.01, 0.04, 0)], 12), color: s.jacket },
    { geo: tube(leftEnd, 24), color: s.jacket },
    { geo: tube(rightEnd, 24), color: s.jacket },
    // the hook-and-loop tie round the hank
    { geo: new BoxGeometry(0.03, 0.016, 0.024), at: [0, -0.005, 0], color: s.tie },
    ...place(p.colored, end(leftEnd)),
    ...place(plug(kind, s.housing).colored, end(rightEnd)),
  ];
  const metal: Piece[] = [...place(p.metal, end(leftEnd)), ...place(plug(kind, s.housing).metal, end(rightEnd))];
  return { colored: mergePieces(colored, true), metal: mergePieces(metal) };
}
