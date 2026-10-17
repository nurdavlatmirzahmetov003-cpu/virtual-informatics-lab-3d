/**
 * Tablet teardown (V2-5b; real models 2026-10): a licensed tablet model
 * (dev-tablet: housing and display) with internals from the phone teardown
 * model (td-phone: battery cells, board, cameras, speakers, port), sized to
 * a tablet's layout — two battery cells either side of a long narrow board,
 * a speaker in every corner, the port on its own small board. It lies face
 * up (landscape); the display lifts off and is laid behind it, the insides
 * are set out in front.
 *
 * Frame: origin at the centre of the back, +Z towards the camera,
 * tablet 250 × 175 mm.
 */
import { useEffect, useMemo, type ReactNode } from 'react';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { rel, route, type Vec3 } from '@/lib/teardown/timeline';
import { TEARDOWNS } from '@/data/teardown/teardowns';
import { useMonitorWallpaper } from '@/scenes/DeskScene/models/useMonitorWallpaper';
import { CameraModule } from './pieces';
import { fitScale, groundOffset, placePoint, useModelParts, type ModelPart } from './modelParts';
import { PartModel } from './PartModel';
import { TeardownPart, type PartMotion } from './TeardownPart';

const ORDER = TEARDOWNS.tablet.parts;
const W = 0.25;
const LIFT: Vec3 = [0, 0.05, 0];
const REST = 0.0004;
const BASE = 0.0012;

const up = (at: Vec3, rest: Vec3, label: Vec3, clear = 0.015): PartMotion => ({ at, path: route(LIFT, rel(at, rest), clear), label });

/** The upright portrait model laid face up, landscape: screen up, its top edge towards −X. */
const LAY: Vec3 = [-Math.PI / 2, Math.PI / 2, 0];

const motions = (displayAt: Vec3): Record<string, PartMotion> => ({
  display: up(displayAt, [0, REST, -0.215], [0, 0.006, -0.06], 0.03),
  battery: up([0, BASE, 0.01], [-0.08, REST, 0.205], [0, 0.008, 0]),
  cameras: up([-0.05, BASE, -0.075], [0.21, REST, 0.15], [0, 0.01, 0]),
  mainboard: up([0, BASE + 0.0006, 0.005], [0.115, REST, 0.205], [0, 0.008, -0.04]),
  speakers: up([0, BASE, 0], [0.02, REST, 0.33], [-0.114, 0.01, 0.074]),
  usb_port: up([W / 2 - 0.009, BASE, 0], [0.21, REST, 0.25], [0, 0.008, 0]),
});

const CORNERS: readonly Vec3[] = [
  [-0.114, 0, -0.074],
  [0.114, 0, -0.074],
  [-0.114, 0, 0.074],
  [0.114, 0, 0.074],
];

/** Two phone-type cells either side of the board, joined by a flex. */
function Battery({ cell }: { cell: ModelPart }) {
  const scale = fitScale(cell.size, [0, 0, 0], [0.085, 0.135]);
  return (
    <group>
      {[-1, 1].map((s) => (
        <PartModel key={s} part={cell} scale={scale} at={[s * 0.062, (cell.size[1] * scale) / 2, 0]} copy={s > 0} />
      ))}
      <mesh position={[0, 0.0012, -0.055]}>
        <boxGeometry args={[0.04, 0.0003, 0.006]} />
        <meshStandardMaterial color="#d4a017" metalness={0.6} roughness={0.35} />
      </mesh>
    </group>
  );
}

function Speakers({ speaker }: { speaker: ModelPart }) {
  const scale = fitScale(speaker.size, [0, 0, 0], [0.032, 0.022]);
  return (
    <group>
      {CORNERS.map((c, i) => (
        <PartModel key={i} part={speaker} scale={scale} at={[c[0], (speaker.size[1] * scale) / 2, c[2]]} copy={i > 0} />
      ))}
    </group>
  );
}

export default function TabletTeardown() {
  const t = useT();
  const name = (id: string) => t(`teardown.tablet.parts.${id}.name` as TranslationKey);
  const tablet = useModelParts('dev-tablet');
  const phone = useModelParts('td-phone');
  const wallpaper = useMonitorWallpaper(1080, 1560);
  useEffect(() => wallpaper(tablet.display.object), [tablet, wallpaper]);
  // landscape footprint W × L; the model is portrait
  const scale = W / Math.max(tablet.housing.size[1], tablet.display.size[1]);
  const offset = useMemo(() => groundOffset([tablet.housing, tablet.display], LAY, scale, 'YXZ'), [tablet, scale]);
  const motion = useMemo(() => motions(placePoint(tablet.display.at, LAY, scale, offset, 'YXZ')), [tablet, scale, offset]);
  const content = useMemo<Record<string, ReactNode>>(
    () => ({
      display: <PartModel part={tablet.display} rot={LAY} order="YXZ" scale={scale} />,
      battery: <Battery cell={phone.battery} />,
      cameras: (
        <group>
          <PartModel part={phone.cameras} scale={fitScale(phone.cameras.size, [0, 0, 0], [0.036, 0.04])} at={[-0.035, 0.002, 0]} />
          <group position={[0.05, 0, -0.006]}>
            <CameraModule r={0.002} h={0.0024} />
          </group>
        </group>
      ),
      mainboard: <PartModel part={phone.mainboard} scale={fitScale(phone.mainboard.size, [0, 0, 0], [0.06, 0.16])} at={[0, 0.001, 0]} />,
      speakers: <Speakers speaker={phone.speaker} />,
      usb_port: <PartModel part={phone.usb_port} rot={[0, Math.PI / 2, 0]} scale={fitScale(phone.usb_port.size, [0, Math.PI / 2, 0], [0.014, 0.03])} />,
    }),
    [tablet, phone, scale],
  );
  return (
    <group>
      <PartModel part={tablet.housing} rot={LAY} order="YXZ" scale={scale} at={placePoint(tablet.housing.at, LAY, scale, offset, 'YXZ')} />
      {ORDER.map((id, i) => (
        <TeardownPart key={id} id={id} index={i} name={name(id)} motion={motion[id]}>
          {content[id]}
        </TeardownPart>
      ))}
    </group>
  );
}
