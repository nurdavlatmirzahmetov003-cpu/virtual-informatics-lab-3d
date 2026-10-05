import { useMemo, useState } from 'react';
import { Droplets, Fan, Snowflake } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { fmt } from '@/labs/Experiments/quiz';
import { COOLERS, CPU, conclusion, exercise, questions, thermal, warmUp, type Cooler } from '@/labs/Experiments/cpuTemp';
import { ExperimentFrame, LineChart, Segmented, Slider, Stat } from '../parts';
import styles from '../ExperimentLab.module.css';

const ICON = { stock: Fan, tower: Snowflake, liquid: Droplets } as const;

/** 30 °C → teal, 95 °C → red, for the die. */
const heat = (c: number) => `hsl(${Math.max(0, 190 - ((c - 30) / 65) * 190)} 85% 55%)`;

export default function CpuTemp() {
  const t = useT();
  const [load, setLoad] = useState(60);
  const [cooler, setCooler] = useState<Cooler>('tower');
  const s = thermal(load, cooler);
  const curve = useMemo(() => warmUp(load, cooler).map((p) => ({ x: p.t, y: p.c })), [load, cooler]);
  const qs = useMemo(() => questions(), []);
  const ex = useMemo(() => exercise(), []);

  return (
    <ExperimentFrame id="cpuTemp" conclusion={conclusion(load, cooler)} questions={qs} exercise={ex}>
      <div className={styles.controls}>
        <Slider label={t('experiments.cpuTemp.load')} value={load} min={0} max={100} step={5} unit="%" onChange={setLoad} />
        <Segmented
          label={t('experiments.cpuTemp.cooler')}
          value={cooler}
          onChange={setCooler}
          options={COOLERS.map((c) => {
            const Icon = ICON[c];
            return { id: c, label: <><Icon size={14} aria-hidden="true" /> {t(`experiments.cpuTemp.coolers.${c}`)}</> };
          })}
        />
      </div>

      <div className={styles.visualRow}>
        <div className={styles.cpuChip} style={{ ['--heat' as string]: heat(s.tempC) }} data-throttle={s.throttling}>
          <div className={styles.cpuDie}>
            <b>{fmt(s.tempC, 0)}°C</b>
            <small>{fmt(s.clockGHz, 1)} GHz</small>
          </div>
        </div>
        <div className={styles.stats}>
          <Stat label={t('experiments.cpuTemp.power')} value={fmt(s.powerW, 0)} unit="W" />
          <Stat label={t('experiments.cpuTemp.temp')} value={fmt(s.tempC, 0)} unit="°C" tone={s.throttling ? 'bad' : s.tempC > 80 ? 'warn' : 'ok'} />
          <Stat label={t('experiments.cpuTemp.clock')} value={fmt(s.clockGHz, 2)} unit="GHz" tone={s.throttling ? 'warn' : undefined} />
          <Stat label={t('experiments.cpuTemp.throttle')} value={t(s.throttling ? 'experiments.cpuTemp.throttleOn' : 'experiments.cpuTemp.throttleOff')} tone={s.throttling ? 'bad' : 'ok'} />
        </div>
      </div>

      <LineChart
        points={curve}
        xMax={120}
        yMin={20}
        yMax={105}
        limit={CPU.tjmax}
        limitLabel={t('experiments.cpuTemp.tjmax', { t: CPU.tjmax })}
        xLabel={t('experiments.cpuTemp.time')}
        yLabel={t('experiments.cpuTemp.chart')}
      />
    </ExperimentFrame>
  );
}
