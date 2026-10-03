import { lazy, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Boxes, Eye, List, Pause, Play, Rotate3d, RotateCcw, SkipForward, Sparkles, X } from 'lucide-react';
import { SceneCanvas } from '@/components/3d/SceneCanvas';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { formatKZT } from '@/lib/studio/pricing';
import { useAssemblyStore } from '@/store/assemblyStore';
import { useSceneStatus } from '@/store/sceneStatusStore';
import { SetupAssemblyTimeline } from '@/scenes/SetupStudio/assembly/SetupAssemblyTimeline';
import { resetAssemblyRig } from '@/scenes/SetupStudio/assembly/assemblyRig';
import { SetupConfiguration } from './SetupConfiguration';
import { SetupAssistant } from './SetupAssistant';
import { useAssistantStore } from '@/store/assistantStore';
import { useStudioBuild } from './useStudioBuild';
import styles from './AssemblyPresentation.module.css';

const AssemblyScene = lazy(() => import('@/scenes/SetupStudio/assembly/AssemblyScene'));

export default function AssemblyPresentationPage() {
  const t = useT();
  useDocumentTitle(t('assembly.title'));
  const reduced = useReducedMotion();
  const ready = useSceneStatus((s) => s.ready);
  const a = useAssemblyStore();
  const { resolved, price, empty } = useStudioBuild();
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    resetAssemblyRig(false);
    useAssemblyStore.getState().begin();
    return () => resetAssemblyRig(true);
  }, []);
  const running = a.phase === 'assembling';
  const caption = t(`assembly.steps.${a.step.id}` as TranslationKey);
  if (empty) return <div className={styles.empty}><h1>{t('assembly.title')}</h1><p>{t('studio.final.empty')}</p><Link to="/studio">{t('studio.final.edit')}</Link></div>;
  return <div className={styles.stage}>
    <SceneCanvas initialCamera="ASSEMBLY_START" label={t('studio.sceneLabel')}><AssemblyScene /></SceneCanvas>
    <SetupAssemblyTimeline build={resolved} ready={ready} reduced={reduced} runId={a.runId} skipToken={a.skipToken} onStep={a.setStep} onProgress={(p) => setProgress(Math.floor(p * 100) / 100)} onComplete={a.finish} />
    <header className={styles.heading}>
      <Link to="/studio"><ArrowLeft size={15} />{t('studio.final.edit')}</Link>
      <span className={styles.eyebrow}>{t('assembly.eyebrow')}</span>
      <h1>{t('assembly.title')}</h1>
      <p>{running ? t('assembly.subtitle') : t('assembly.finished')}</p>
    </header>
    {running ? <section className={styles.playing} aria-label={t('assembly.progress')}>
      <div className={styles.caption}><span>{String(a.step.index).padStart(2, '0')} / {a.step.total || '—'}</span><strong aria-live="polite">{caption}</strong></div>
      <progress max={1} value={progress} aria-label={t('assembly.progress')} />
      <button onClick={a.skip}><SkipForward size={15} />{t('assembly.skip')}</button>
    </section> : <>
      <div className={styles.tools} role="toolbar" aria-label={t('assembly.controls')}>
        {([{id:'orbit', icon:Rotate3d, label:'orbit'}, {id:'inside', icon:Eye, label:'inside'}, {id:'exploded', icon:Boxes, label:'exploded'}] as const).map(({id, icon:Icon, label}) => <button key={id} onClick={() => a.setView(id)} aria-pressed={a.view === id}><Icon size={16} />{t(`assembly.${label}` as TranslationKey)}</button>)}
        <button onClick={a.toggleAutoRotate} aria-pressed={a.autoRotate} aria-label={t('studio.view.autoRotate')}>{a.autoRotate ? <Pause size={16} /> : <Play size={16} />}</button>
        <button onClick={a.replay}><RotateCcw size={16} />{t('assembly.replay')}</button>
        <button onClick={a.toggleConfig} aria-pressed={a.configOpen}><List size={16} />{t('assembly.config')}</button>
        <button onClick={() => useAssistantStore.getState().openImprove(t('assistant.improve.prompt'))}><Sparkles size={16} />{t('assistant.improve.button')}</button>
      </div>
      {!a.configOpen && <div className={styles.price}><span>{t('studio.summary.total')}</span><strong>{formatKZT(price.total)}</strong><small>{t('studio.demoPrice')}</small></div>}
      {a.configOpen && <aside className={styles.configuration} aria-label={t('assembly.config')}>
        <header><h2>{t('assembly.config')}</h2><button onClick={a.toggleConfig} aria-label={t('anatomy.close')}><X size={18} /></button></header>
        <SetupConfiguration />
      </aside>}
      <p className={styles.hint}>{t('studio.view.hint')}</p>
      <SetupAssistant launcher={false} />
    </>}
  </div>;
}
