import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useT } from '@/hooks/useT';
import hardware from '@/data/assets/hardware.json';
import specSources from '@/data/hardware/spec-sources.json';
import styles from './CreditsPage.module.css';

export default function CreditsPage() {
  const t = useT();
  return <PageLayout title={t('credits.title')} subtitle={t('credits.body')} eyebrow="VIRTUAL INFORMATICS LAB · 3D">
    <Link to="/" className={styles.back}><ArrowLeft size={16} />{t('nav.home')}</Link>
    <div className={styles.grid}>{hardware.map(asset => <article key={asset.file} className={styles.card}>
      <span className={styles.license}>CC BY 4.0</span>
      <h2>{asset.name}</h2>
      <p>{asset.author}</p>
      <div className={styles.links}>
        <a href={asset.url} target="_blank" rel="noreferrer">Sketchfab <ExternalLink size={13} /></a>
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">{t('credits.license')}</a>
      </div>
    </article>)}</div>
    <p className={styles.note}>{t('credits.edits')}</p>
    <p className={styles.note}>{t('credits.environment')} <a href="https://polyhaven.com/a/studio_small_09" target="_blank" rel="noreferrer">Studio Small 09 · Sergej Majboroda</a>; <a href="https://polyhaven.com/a/wood_table_001" target="_blank" rel="noreferrer">Wood Table 001</a>; <a href="https://polyhaven.com/a/concrete_floor_painted" target="_blank" rel="noreferrer">Concrete Floor Painted</a>.</p>
    <p className={styles.note}>{t('credits.specs')} <a href={specSources.motherboard.url} target="_blank" rel="noreferrer">ASUS PRIME X570-P</a> · <a href={specSources.gpu.url} target="_blank" rel="noreferrer">MSI RTX 3080 Gaming X Trio 10G</a> · {specSources.verifiedOn}.</p>
  </PageLayout>;
}
