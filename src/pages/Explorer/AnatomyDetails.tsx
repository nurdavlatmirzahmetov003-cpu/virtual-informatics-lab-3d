import { LANGUAGE_LABELS, LANGUAGES, translate } from '@/lib/i18n';
import type { AnatomyItem } from '@/data/hardware/anatomy';
import { useT } from '@/hooks/useT';
import { PLACEMENTS } from '@/scenes/HardwareExplorer/layout';
import { itemKey } from './anatomyText';
import styles from './AnatomyDetails.module.css';

/** Educational content of one device; shared by the 3D panel and the list view. */
export function AnatomyDetails({ item, headingLevel = 3 }: { item: AnatomyItem; headingLevel?: 3 | 4 }) {
  const t = useT();
  const H = `h${headingLevel}` as const;
  const placement = PLACEMENTS[item.category].find((p) => p.id === item.id);
  const magnify = placement?.magnify ?? 1;

  return (
    <div className={styles.details}>
      <section aria-label={t('anatomy.sections.names')}>
        <H className={styles.heading}>{t('anatomy.sections.names')}</H>
        <ul className={styles.names}>
          {LANGUAGES.map((lang) => (
            <li key={lang} lang={lang}>
              <span>{LANGUAGE_LABELS[lang]}</span>
              <strong>{translate(lang, itemKey(item.id, 'name'))}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <H className={styles.heading}>{t('anatomy.sections.description')}</H>
        <p className={styles.text}>{t(itemKey(item.id, 'description'))}</p>
      </section>

      <section>
        <H className={styles.heading}>{t('anatomy.sections.purpose')}</H>
        <p className={styles.text}>{t(itemKey(item.id, 'purpose'))}</p>
      </section>

      <section>
        <H className={styles.heading}>{t('anatomy.sections.specs')}</H>
        <dl className={styles.specs}>
          {item.specs.map((s) => (
            <div key={s}>
              <dt>{t(itemKey(item.id, `specs.${s}.label`))}</dt>
              <dd>{t(itemKey(item.id, `specs.${s}.value`))}</dd>
            </div>
          ))}
        </dl>
        <p className={styles.caption}>{t('anatomy.specsCaption')}</p>
      </section>

      <section className={styles.compat}>
        <H className={styles.heading}>{t('anatomy.sections.compat')}</H>
        <p className={styles.text}>{t(itemKey(item.id, 'compat'))}</p>
      </section>

      {(placement && !placement.models) || magnify > 1 ? (
        <p className={styles.caption}>
          {placement && !placement.models ? t('anatomy.placeholder') : t('anatomy.magnified', { factor: magnify })}
        </p>
      ) : null}
    </div>
  );
}
