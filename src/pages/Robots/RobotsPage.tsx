/**
 * V4 §4 «Біздің роботтар»: meet every robot of the lab — a 360° viewer with
 * its idle, work and unlocked animations, an info card (name, job, level,
 * energy and what it is doing right now in the yard, a fun fact, its skill),
 * the wardrobe and the training (coins from the student's XP and tips), and
 * the robot's tips in Bit's voice. The yard keeps living while this page is
 * open (the same simulation as the lab's zone 11).
 */
import { Suspense, lazy, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Backpack, BadgeCheck, Battery, BatteryCharging, Box, Coins, Crown, Glasses, GraduationCap, HardHat, Headphones, Lightbulb, Lock, Ribbon, RotateCw, Shirt, Tent, Undo2, ZoomIn, ZoomOut, type LucideIcon } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { ROSTER, isRobotId, robotById, type RobotId } from '@/data/robots/roster';
import { tipsOf, TIPS } from '@/data/robots/tips';
import type { TranslationKey } from '@/lib/i18n';
import { useGame } from '@/hooks/useGame';
import { useQualityPreset } from '@/hooks/useQualityPreset';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { useT } from '@/hooks/useT';
import { useSettingsStore } from '@/store/settingsStore';
import { useBitStore } from '@/store/bitStore';
import { useAuthStore } from '@/store/authStore';
import { useRobotsStore } from '@/store/robotsStore';
import { ANIM_LEVEL, ITEMS, MAX_LEVEL, SKILL_LEVEL, UNLOCKS, WEAR_SLOTS, WEARABLE, balance, canWear, levelOfRobot, trainCost, type RobotAnim, type WardrobeSlot } from '@/services/robots/economy';
import { advanceYard, yardWorld } from '@/services/robots/yardSim';
import { sayRobotTip } from '@/services/robots/robotTips';
import type { LifeState } from '@/lib/robots/life';
import type { RobotViewerHandle } from './RobotViewer3D';
import styles from './RobotsPage.module.css';

const RobotViewer3D = lazy(() => import('./RobotViewer3D'));
const k = (s: string) => s as TranslationKey;
const ANIMS: readonly RobotAnim[] = ['idle', 'work', 'wave', 'dance'];
const ITEM_ICON: Record<string, LucideIcon> = { cap: HardHat, headphones: Headphones, kalpak: Tent, gradcap: GraduationCap, crown: Crown, glasses: Glasses, scarf: Ribbon, backpack: Backpack, badge: BadgeCheck };

/** The yard's live state of one robot, refreshed twice a second while the page is open. */
function useYardState(robot: RobotId) {
  const low = useQualityPreset().level === 'low';
  const levels = useRobotsStore((s) => s.save.levels);
  const reduced = useReducedMotion();
  const world = useMemo(() => yardWorld(low, levels), [low, levels]);
  const [, tick] = useState(0);
  useEffect(() => {
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      if (!reduced) advanceYard(world, (now - last) / 1000, 0.1);
      last = now;
      tick((n) => n + 1);
    }, 500);
    return () => window.clearInterval(id);
  }, [world, reduced]);
  const a = world.agents.find((x) => x.id === robot)!;
  return { state: a.state as LifeState, battery: a.battery };
}

export default function RobotsPage() {
  const t = useT();
  const [params, setParams] = useSearchParams();
  const fromUrl = params.get('robot');
  const robot: RobotId = isRobotId(fromUrl) ? fromUrl : 'guide';
  const r = robotById(robot);
  const [anim, setAnim] = useState<RobotAnim>('idle');
  const [spin, setSpin] = useState(true);
  const [slot, setSlot] = useState<WardrobeSlot>('hat');
  const [news, setNews] = useState('');
  const viewer = useRef<RobotViewerHandle>(null);

  const save = useRobotsStore((s) => s.save);
  const sync = useRobotsStore((s) => s.sync);
  const signedIn = useAuthStore((s) => s.status === 'signedIn');
  const xp = useGame().xp.total;
  const coins = balance(xp, save);
  const level = levelOfRobot(save, robot);
  const worn = save.wear[robot] ?? {};
  const live = useYardState(robot);
  const name = t(k(`robots.list.${robot}.name`));

  useEffect(() => void useRobotsStore.getState().load(), []);
  // an animation the robot has not unlocked falls back to idle (another robot picked)
  const shownAnim: RobotAnim = level >= ANIM_LEVEL[anim] ? anim : 'idle';

  const pick = (id: RobotId) => {
    setParams((p) => {
      p.set('robot', id);
      return p;
    }, { replace: true });
  };

  const trainNow = () => {
    const res = useRobotsStore.getState().train(robot, xp);
    if (res.ok) setNews(t('robots.train.done', { name, level: res.level }));
  };

  const heardHere = tipsOf(robot).filter((x) => save.tips.includes(x.id)).length;
  const nextUnlocks = UNLOCKS[level + 1] ?? [];
  const items = ITEMS.filter((i) => i.slot === slot);
  const canSlot = WEARABLE[robot].includes(slot);

  return (
    <PageLayout title={t('robots.title')} eyebrow={t('robots.eyebrow')} subtitle={t('robots.lead')}>
      <nav className={styles.roster} aria-label={t('robots.pick')}>
        {ROSTER.map((x) => (
          <button key={x.id} type="button" className={styles.pick} aria-pressed={x.id === robot} style={{ '--robot': x.accent } as CSSProperties} onClick={() => pick(x.id)}>
            <span className={styles.dot} aria-hidden="true" />
            <span className={styles.pickName}>{t(k(`robots.list.${x.id}.name`))}</span>
            <span className={styles.pickLevel}>{t('robots.card.level')} {levelOfRobot(save, x.id)}</span>
          </button>
        ))}
      </nav>

      <div className={styles.top}>
        <section className={styles.viewerCard} style={{ '--robot': r.accent } as CSSProperties}>
          <div className={styles.viewer}>
            <Suspense fallback={<div className={styles.viewerLoading} aria-busy="true" />}>
              <RobotViewer3D ref={viewer} robot={robot} pose={shownAnim} spin={spin} wear={worn} label={t('robots.viewer.label', { name })} />
            </Suspense>
            <div className={styles.viewTools}>
              <button type="button" className={styles.tool} aria-pressed={spin} onClick={() => setSpin((v) => !v)} aria-label={t('robots.viewer.spin')} title={t('robots.viewer.spin')}>
                <RotateCw size={17} aria-hidden="true" />
              </button>
              <button type="button" className={styles.tool} onClick={() => viewer.current?.zoom(1)} aria-label={t('robots.viewer.zoomIn')} title={t('robots.viewer.zoomIn')}>
                <ZoomIn size={17} aria-hidden="true" />
              </button>
              <button type="button" className={styles.tool} onClick={() => viewer.current?.zoom(-1)} aria-label={t('robots.viewer.zoomOut')} title={t('robots.viewer.zoomOut')}>
                <ZoomOut size={17} aria-hidden="true" />
              </button>
              <button type="button" className={styles.tool} onClick={() => viewer.current?.reset()} aria-label={t('robots.viewer.reset')} title={t('robots.viewer.reset')}>
                <Undo2 size={17} aria-hidden="true" />
              </button>
            </div>
            <p className={styles.viewHint}>{t('robots.viewer.hint')}</p>
          </div>
          <div className={styles.anims} role="group" aria-label={t('robots.viewer.label', { name })}>
            {ANIMS.map((a) => {
              const locked = level < ANIM_LEVEL[a];
              return (
                <button key={a} type="button" className={styles.anim} aria-pressed={shownAnim === a} disabled={locked} title={locked ? t('robots.viewer.locked', { level: ANIM_LEVEL[a] }) : undefined} onClick={() => setAnim(a)}>
                  {locked && <Lock size={13} aria-hidden="true" />} {t(k(`robots.viewer.anims.${a}`))}
                </button>
              );
            })}
          </div>
        </section>

        <section className={styles.card} style={{ '--robot': r.accent } as CSSProperties} aria-labelledby="robot-name">
          <header className={styles.cardHead}>
            <h2 id="robot-name">{name}</h2>
            <span className={styles.levelBadge}>
              {t('robots.card.level')} {level} / {MAX_LEVEL}
            </span>
          </header>
          <dl className={styles.facts}>
            <div>
              <dt>{t('robots.card.job')}</dt>
              <dd>{t(k(`robots.list.${robot}.job`))}</dd>
            </div>
            <div>
              <dt>{t('robots.card.energy')}</dt>
              <dd>
                <span className={styles.energy}>
                  {live.state === 'charging' ? <BatteryCharging size={18} aria-hidden="true" /> : <Battery size={18} aria-hidden="true" />}
                  <span className={styles.energyBar} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(live.battery * 100)} aria-label={t('robots.card.energy')}>
                    <span style={{ width: `${Math.round(live.battery * 100)}%` }} data-low={live.battery < 0.25 || undefined} />
                  </span>
                  <b>{live.state === 'away' ? '—' : `${Math.round(live.battery * 100)}%`}</b>
                </span>
                <small className={styles.now}>
                  {t('robots.card.now')}: {live.state === 'away' ? t('robots.card.inHall') : t(k(`robots.states.${live.state}`))}
                </small>
              </dd>
            </div>
            <div>
              <dt>{t('robots.card.topic')}</dt>
              <dd>{t(k(`robots.topics.${r.topic}`))}</dd>
            </div>
            <div>
              <dt>{t('robots.card.fact')}</dt>
              <dd>{t(k(`robots.list.${robot}.fact`))}</dd>
            </div>
            <div>
              <dt>{t('robots.card.skill')}</dt>
              <dd>
                <b>{t(k(`robots.list.${robot}.skill`))}</b> — {level >= SKILL_LEVEL ? t('robots.card.skillEffect') : t('robots.card.skillLocked', { level: SKILL_LEVEL })}
              </dd>
            </div>
          </dl>
          <div className={styles.tipRow}>
            <button type="button" className={styles.tipButton} onClick={() => sayRobotTip(robot, 'click', useSettingsStore.getState().language, useBitStore.getState().voice)}>
              <Lightbulb size={17} aria-hidden="true" /> {t('robots.tips.ask')}
            </button>
            <small>{t('robots.tips.heard', { n: heardHere, total: tipsOf(robot).length })}</small>
          </div>
          {r.inHall && (
            <Link className={styles.labLink} to="/lab?zone=robots">
              <Box size={16} aria-hidden="true" /> {t('lab.zones.robots.name')}
            </Link>
          )}
        </section>
      </div>

      <div className={styles.bottom}>
        <section className={styles.panel} aria-labelledby="wallet-title">
          <h2 id="wallet-title" className={styles.panelTitle}>
            <Coins size={18} aria-hidden="true" /> {t('robots.wallet.coins')}: <b className={styles.coins}>{coins}</b>
          </h2>
          <p className={styles.muted}>
            {t('robots.wallet.xp')}: {xp} · {t('robots.tips.heard', { n: save.tips.length, total: TIPS.length })}
          </p>
          <p className={styles.muted}>{t('robots.wallet.how')}</p>
          <p className={styles.sync} data-sync={sync}>
            {!signedIn ? t('robots.wallet.guest') : sync === 'offline' ? t('robots.wallet.offline') : sync === 'saved' ? t('robots.wallet.saved') : ' '}
          </p>

          <h3 className={styles.subTitle}>{t('robots.train.title')}</h3>
          {level >= MAX_LEVEL ? (
            <p className={styles.muted}>{t('robots.train.max')}</p>
          ) : (
            <>
              <button type="button" className={styles.trainButton} disabled={coins < trainCost(level)} onClick={trainNow}>
                {t('robots.train.button', { price: trainCost(level) })}
              </button>
              <p className={styles.muted}>{t('robots.train.unlocks', { what: nextUnlocks.map((u) => t(k(`robots.train.unlock.${u}`))).join(', ') })}</p>
            </>
          )}
          <p className={styles.news} role="status" aria-live="polite">
            {news}
          </p>
        </section>

        <section className={styles.panel} aria-labelledby="wardrobe-title">
          <h2 id="wardrobe-title" className={styles.panelTitle}>
            {t('robots.wardrobe.title')}
          </h2>
          <div className={styles.slots} role="tablist" aria-label={t('robots.wardrobe.title')}>
            {WEAR_SLOTS.map((s) => (
              <button key={s} type="button" role="tab" aria-selected={slot === s} className={styles.slot} onClick={() => setSlot(s)}>
                {t(k(`robots.wardrobe.slots.${s}`))}
              </button>
            ))}
          </div>
          {!canSlot ? (
            <p className={styles.muted}>{t('robots.wardrobe.cannot')}</p>
          ) : (
            <ul className={styles.items} role="tabpanel">
              {items.map((it) => {
                const owned = save.owned.includes(it.id);
                const on = worn[it.slot] === it.id;
                const check = canWear(save, robot, it.id);
                return (
                  <li key={it.id} className={styles.item} data-on={on || undefined}>
                    <span className={styles.swatch} style={it.color ? { background: it.color, color: '#fff' } : undefined} aria-hidden="true">
                      {(() => {
                        const Icon = it.color ? Shirt : (ITEM_ICON[it.id] ?? Shirt);
                        return <Icon size={20} />;
                      })()}
                    </span>
                    <span className={styles.itemText}>
                      <b>{t(k(`robots.wardrobe.items.${it.id}`))}</b>
                      <small>{owned ? t('robots.wardrobe.owned') : it.level > 1 ? t('robots.wardrobe.needLevel', { level: it.level }) : ' '}</small>
                    </span>
                    {!owned ? (
                      <button type="button" className={styles.itemButton} disabled={coins < it.price} title={coins < it.price ? t('robots.wardrobe.notEnough') : undefined} onClick={() => useRobotsStore.getState().buy(it.id, xp)}>
                        {t('robots.wardrobe.buy', { price: it.price })}
                      </button>
                    ) : on ? (
                      <button type="button" className={styles.itemButton} onClick={() => useRobotsStore.getState().wear(robot, it.slot, null)}>
                        {t('robots.wardrobe.takeOff')}
                      </button>
                    ) : check === 'level' ? (
                      <span className={styles.locked}>
                        <Lock size={13} aria-hidden="true" /> {t('robots.wardrobe.needLevel', { level: it.level })}
                      </span>
                    ) : (
                      <button type="button" className={styles.itemButton} data-primary="" onClick={() => useRobotsStore.getState().wear(robot, it.slot, it.id)}>
                        {t('robots.wardrobe.wear')}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </PageLayout>
  );
}
