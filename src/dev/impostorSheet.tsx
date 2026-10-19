/* eslint-disable react-refresh/only-export-components -- a page entry, not a module */
/**
 * Dev-only page (vite dev: /dev/impostors.html, never built): renders every
 * lab device once, three-quarter view, each fitted into its own tile of a
 * grid, so scripts/make-impostors.mjs can save the canvas as the overview
 * impostor atlas (public/assets/textures/lab-impostors.webp) and the tile
 * table (src/data/lab/impostors.json).
 */
import { Suspense, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrthographicCamera } from '@react-three/drei';
import { Box3, SRGBColorSpace, Vector3, type Group } from 'three';
import { DEVICES } from '@/data/devices/devices';
import { DeviceModel } from '@/scenes/LabSpace/devices/DeviceModel';
import { CableCoil } from '@/scenes/LabSpace/devices/v24bDevices';
import { IMPOSTOR_GRID } from '@/scenes/LabSpace/devices/impostorGrid';

const { cols, tile, yaw, pitch } = IMPOSTOR_GRID;
const CABLES = new Set(['hdmi_cable', 'displayport_cable', 'usb_c_cable', 'usb_a_cable', 'audio_cable']);
const IDS = DEVICES.map((d) => d.id);
const rows = Math.ceil(IDS.length / cols);
const HDRI = '/assets/hdr/studio_small_09_1k.hdr';

type Meta = { id: string; col: number; row: number; w: number; h: number; base: number };
const metas = new Map<string, Meta>();

/** Fits one device into its 1 × 1 cell once its models stopped changing for a few frames. */
function Cell({ id, index }: { id: string; index: number }) {
  const outer = useRef<Group>(null);
  const inner = useRef<Group>(null);
  const stable = useRef({ key: '', frames: 0, done: false });
  const col = index % cols;
  const row = Math.floor(index / cols);
  useFrame(() => {
    const o = outer.current;
    const g = inner.current;
    if (!o || !g || stable.current.done) return;
    g.scale.setScalar(1);
    g.position.set(0, 0, 0);
    o.updateMatrixWorld(true);
    const box = new Box3().setFromObject(g, true);
    if (box.isEmpty()) return;
    const key = box.min.toArray().concat(box.max.toArray()).map((v) => v.toFixed(4)).join();
    if (key !== stable.current.key) {
      stable.current = { key, frames: 0, done: false };
      return;
    }
    if (++stable.current.frames < 20) return;
    const size = box.getSize(new Vector3());
    const centre = box.getCenter(new Vector3()).sub(o.position);
    const s = 0.94 / Math.max(size.x, size.y);
    g.scale.setScalar(s);
    g.position.set(-centre.x * s, -centre.y * s, 0);
    // metres on screen (ortho, camera looking along −Z) and where the base (y = 0 of the device) sits in the tile
    metas.set(id, { id, col, row, w: size.x, h: size.y, base: (0 - (box.min.y - o.position.y)) / size.y });
    stable.current.done = true;
  });
  return (
    <group ref={outer} position={[col + 0.5, -(row + 0.5), 0]}>
      <group ref={inner}>
        <group rotation={[pitch, yaw, 0]}>{CABLES.has(id) ? <CableCoil kind={id as 'hdmi_cable'} /> : <DeviceModel id={id} display />}</group>
      </group>
    </group>
  );
}

function Report() {
  const [done, setDone] = useState(false);
  useFrame(({ gl }) => {
    if (done || metas.size < IDS.length) return;
    setDone(true);
    // two more frames so the last fit is drawn, then publish the sheet
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        (window as unknown as { __impostors: unknown }).__impostors = { png: gl.domElement.toDataURL('image/png'), cols, rows, tile, items: [...metas.values()] };
      }),
    );
  });
  return null;
}

function Sheet() {
  useLayoutEffect(() => {
    document.title = `impostors: ${IDS.length}`;
  }, []);
  return (
    <Canvas
      style={{ width: cols * tile, height: rows * tile }}
      dpr={1}
      gl={{ alpha: true, preserveDrawingBuffer: true, antialias: true }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.outputColorSpace = SRGBColorSpace;
      }}
    >
      <OrthographicCamera makeDefault left={0} right={cols} top={0} bottom={-rows} near={-50} far={50} position={[0, 0, 10]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[-2, 4, 5]} intensity={2.2} />
      <Suspense fallback={null}>
        <Environment files={HDRI} />
        {IDS.map((id, i) => (
          <Cell key={id} id={id} index={i} />
        ))}
        <Report />
      </Suspense>
    </Canvas>
  );
}

createRoot(document.getElementById('root')!).render(<Sheet />);
