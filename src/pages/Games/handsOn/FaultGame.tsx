/**
 * «Find the fault» (0.37): five broken computers, one at a time. The card
 * shows what this one does (the POST result, the beeps, how it copes with a
 * game — SystemSim's own symptoms); the six suspects stand on the bench in
 * 3D. Tap the part to blame. The same rules as the class fault race.
 */
import { useState } from 'react';
import { Html, RoundedBox } from '@react-three/drei';
import { Stethoscope } from 'lucide-react';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { symptomsOf } from '@/labs/LiveGames/races';
import { FAULT_IDS, type FaultId } from '@/labs/SystemSim/faults';
import { PRODUCT } from '@/scenes/LabSpace/devices/deviceAssets';
import { Product } from '@/scenes/LabSpace/zones/common';
import { SymptomList } from '@/pages/Live/RaceBoards';
import { GameStage } from './GameStage';
import type { HandsOnView } from './types';
import styles from './HandsOn.module.css';

const k = (s: string) => s as TranslationKey;

/** Each suspect: its model, where it stands on the bench, and how big it is shown. */
const SUSPECTS: Record<FaultId, { product: string; x: number; scale: number; rotY?: number; tilt?: number }> = {
  ram: { product: PRODUCT.ram, x: -0.8, scale: 1.8 },
  gpu: { product: PRODUCT.gpu, x: -0.48, scale: 0.85 },
  monitor: { product: PRODUCT.monitor, x: -0.16, scale: 0.42 },
  storage: { product: PRODUCT.ssd_nvme, x: 0.16, scale: 2.6, tilt: -0.9 },
  cooler: { product: PRODUCT.cooler_air, x: 0.48, scale: 1 },
  psu: { product: PRODUCT.psu, x: 0.8, scale: 1 },
};

function Suspect({ id, name, hot, pick, row }: { id: FaultId; name: string; hot: boolean; pick: () => void; row: number }) {
  const s = SUSPECTS[id];
  return (
    <group position={[s.x, 0, 0]}>
      <RoundedBox args={[0.24, 0.03, 0.22]} radius={0.008} position-y={0.015} receiveShadow>
        <meshStandardMaterial color={hot ? '#2c6f8f' : '#33414d'} roughness={0.7} />
      </RoundedBox>
      <group
        position-y={0.03}
        rotation-y={s.rotY ?? 0}
        onClick={(e) => {
          e.stopPropagation();
          pick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        <group rotation-x={s.tilt ?? 0} scale={s.scale}>
          <Product product={s.product} />
        </group>
        {/* an invisible box: the whole spot is the target, not just the model's surface */}
        <mesh position-y={0.1}>
          <boxGeometry args={[0.24, 0.2, 0.22]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
      {/* every other label a row lower, so long names never overlap */}
      <Html position={[0, -0.005, 0.14 + row * 0.07]} center zIndexRange={[20, 0]}>
        <button type="button" className={styles.tag3d} data-hot={hot || undefined} onClick={pick}>
          {name}
        </button>
      </Html>
    </group>
  );
}

export default function FaultGame({ state, faults, move, ...live }: HandsOnView) {
  const t = useT();
  const [hot, setHot] = useState<FaultId | null>(null);
  const round = state.round ?? 0;
  const rounds = live.rounds ?? faults.length;
  const fault = faults[Math.min(round, faults.length - 1)];
  const symptoms = live.symptoms !== undefined ? live.symptoms : fault ? symptomsOf(fault) : null;
  const suspectName = (f: FaultId) => t(k(`games3d.fault.suspects.${f}`));
  const pick = (f: FaultId) => {
    setHot(f);
    move({ t: 'diagnose', cause: f });
  };

  return (
    <div className={styles.game}>
      <section className={styles.card} aria-label={t('live.fault.look')}>
        <p className={styles.round}>
          <Stethoscope size={16} aria-hidden="true" /> {t('live.fault.round', { n: Math.min(round + 1, rounds), of: rounds })}
        </p>
        <div className={styles.dots} aria-hidden="true">
          {Array.from({ length: rounds }, (_, i) => (
            <i key={i} data-state={i < round ? 'done' : i === round ? 'now' : 'todo'} />
          ))}
        </div>
        {symptoms && !state.done && <SymptomList s={symptoms} />}
        <p className={styles.ask}>{t('games3d.fault.ask')}</p>
      </section>
      <div className={styles.stage}>
        <GameStage label={t('games3d.fault.scene')} position={[0, 0.5, 1.02]} target={[0, 0.07, 0.04]} table={[1.95, 0.6]}>
          {FAULT_IDS.map((f, i) => (
            <Suspect key={f} id={f} name={suspectName(f)} hot={hot === f} pick={() => pick(f)} row={i % 2} />
          ))}
        </GameStage>
      </div>
      <section className={styles.tray} aria-label={t('games3d.fault.ask')}>
        <div className={styles.tiles}>
          {FAULT_IDS.map((f) => (
            <button key={f} type="button" className={styles.tile} onClick={() => pick(f)}>
              {suspectName(f)}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
