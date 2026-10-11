/**
 * Network, power & cables and mobile zones (devices detailed in V2-4b).
 * Devices stand in tidy rows on pads with name plates, like the V2-4a
 * exhibits; a click opens the device's name and short description.
 * [PLACEHOLDER] models: devices/v24bDevices.tsx.
 */
import { DeviceSpot, ExhibitTable } from '../devices/Exhibit';
import { DeviceModel } from '../devices/DeviceModel';
import { CableCoil } from '../devices/v24bDevices';
import type { ZoneContentProps } from './zoneData';

export function NetworkZone({ detail, accent }: ZoneContentProps) {
  const full = detail === 'full';
  return (
    <>
      <group position={[-1.05, 0, -0.55]}>
        <DeviceSpot id="server_rack" accent={accent} padSize={[0.7, 0.66]} plate={full} plateZ={0.42}>
          <DeviceModel id="server_rack" />
        </DeviceSpot>
      </group>
      <group position={[0.45, 0, -0.35]}>
        <ExhibitTable
          width={1.9}
          depth={0.7}
          accent={accent}
          detail={detail}
          hero={['router']}
          rows={[{ z: -0.02, depth: 0.3, items: [{ id: 'router', w: 1.2 }, { id: 'switch', w: 1.1 }, { id: 'nic' }, { id: 'ethernet_cable', w: 0.9 }] }]}
        />
      </group>
    </>
  );
}

const WALL_CABLES = ['hdmi_cable', 'displayport_cable', 'usb_c_cable', 'usb_a_cable', 'audio_cable'] as const;

export function PowerZone({ detail, accent }: ZoneContentProps) {
  const full = detail === 'full';
  return (
    <>
      {/* pegboard: every cable on its own hook, name plate under it */}
      <group position={[0.2, 0, -1.1]}>
        <mesh position-y={1.45}>
          <boxGeometry args={[2.3, 1.1, 0.03]} />
          <meshStandardMaterial color="#c9a27a" roughness={0.8} />
        </mesh>
        {full && WALL_CABLES.map((id, i) => (
          <group key={id} position={[-0.88 + i * 0.44, 1.12, 0.02]}>
            <DeviceSpot id={id} accent={accent} padSize={[0.4, 0.1]} bare plate={full} plateZ={0.08}>
              {/* hanging on its hook in front of the board; the plate sits under the coil */}
              <group position-y={0.36}>
                <CableCoil kind={id} />
              </group>
            </DeviceSpot>
          </group>
        ))}
      </group>
      <group position={[-1.12, 0, -0.45]}>
        <DeviceSpot id="ups" accent={accent} padSize={[0.3, 0.5]} plate={full} plateZ={0.32}>
          <DeviceModel id="ups" />
        </DeviceSpot>
      </group>
      <group position={[0.4, 0, -0.3]}>
        <ExhibitTable
          width={1.7}
          depth={0.62}
          accent={accent}
          detail={detail}
          rows={[{ z: 0, depth: 0.26, items: [{ id: 'docking_station', w: 1.2 }, { id: 'usb_hub' }, { id: 'card_reader' }] }]}
        />
      </group>
    </>
  );
}

export function MobileZone({ detail, accent }: ZoneContentProps) {
  return (
    <ExhibitTable
      width={3.0}
      depth={0.8}
      accent={accent}
      detail={detail}
      hero={['laptop']}
      rows={[{ z: 0, depth: 0.34, items: [{ id: 'laptop', w: 1.2 }, { id: 'smartphone', w: 0.8 }, { id: 'tablet' }, { id: 'all_in_one', w: 1.6 }, { id: 'smartwatch', w: 0.7 }, { id: 'sbc', w: 0.7 }] }]}
    />
  );
}
