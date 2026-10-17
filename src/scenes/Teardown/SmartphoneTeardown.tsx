/**
 * Smartphone teardown (V2-5b; real model 2026-10): a licensed 6.1″ phone
 * teardown model (td-phone, logos removed) with its real internal layout —
 * board and cameras at the top, battery in the middle, Taptic-style vibration
 * motor and loudspeaker at the bottom. It lies face up on the mat; the SIM
 * tray slides out of the side, the display lifts off to the left and the
 * insides come out upwards and are set out on the right.
 *
 * Frame (from the model): origin at the centre of the phone's back, +Y the
 * screen side, −Z the top edge (cameras), +Z the bottom edge.
 */
import { useEffect, useMemo } from 'react';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { rel, route, type Vec3 } from '@/lib/teardown/timeline';
import { TEARDOWNS } from '@/data/teardown/teardowns';
import { useMonitorWallpaper } from '@/scenes/DeskScene/models/useMonitorWallpaper';
import { TeardownPart, type PartMotion } from './TeardownPart';
import { useModelParts, type ModelPart } from './modelParts';

const ORDER = TEARDOWNS.smartphone.parts;
const LIFT: Vec3 = [0, 0.035, 0];
/** Clearance above the mat where parts are laid down. */
const MAT = 0.0004;

/** Where each part lands on the mat (x, z); y follows from its own height. */
const REST: Record<string, readonly [number, number]> = {
  display: [-0.115, 0],
  battery: [0.165, 0.035],
  cameras: [0.085, -0.025],
  mainboard: [0.235, -0.01],
  speaker: [0.085, 0.065],
  vibration: [0.085, 0.025],
  sim_tray: [0.085, -0.074],
};

function motions(parts: Record<string, ModelPart>): Record<string, PartMotion> {
  const rest = (id: string): Vec3 => [REST[id][0], MAT + parts[id].size[1] / 2, REST[id][1]];
  const up = (id: string, clear = 0.01): PartMotion => {
    const at = parts[id].at;
    return { at, path: route(LIFT, rel(at, rest(id)), clear), label: [0, parts[id].size[1] / 2 + 0.006, 0] };
  };
  const sim = parts.sim_tray.at;
  const simRest = rest('sim_tray');
  return {
    // pushed out of the side with a pin, lifted over the phone and set down on the right
    sim_tray: {
      at: sim,
      path: [[-0.03, 0, 0], [-0.03, 0.03, 0], [simRest[0] - sim[0], 0.03, simRest[2] - sim[2]], rel(sim, simRest)],
      label: [0, 0.004, 0],
    },
    display: up('display', 0.02),
    battery: up('battery'),
    cameras: up('cameras'),
    mainboard: up('mainboard'),
    speaker: up('speaker'),
    vibration: up('vibration'),
  };
}

export default function SmartphoneTeardown() {
  const t = useT();
  const name = (id: string) => t(`teardown.smartphone.parts.${id}.name` as TranslationKey);
  const parts = useModelParts('td-phone');
  const wallpaper = useMonitorWallpaper(720, 1560);
  useEffect(() => wallpaper(parts.display.object), [parts, wallpaper]);
  const motion = useMemo(() => motions(parts), [parts]);
  return (
    <group>
      {/* what stays on the mat: frame, back glass, charging port */}
      {['frame', 'usb_port'].map((id) => (
        <primitive key={id} object={parts[id].object} position={[...parts[id].at]} />
      ))}
      {ORDER.map((id, i) => (
        <TeardownPart key={id} id={id} index={i} name={name(id)} motion={motion[id]}>
          <primitive object={parts[id].object} />
        </TeardownPart>
      ))}
    </group>
  );
}
