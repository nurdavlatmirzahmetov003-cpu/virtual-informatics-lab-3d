/**
 * Learning content texts (V2-10): devices, anatomy, teardowns, tasks and
 * quiz questions, lab descriptions — in kk / ru / en. The shipped locale
 * files are the defaults; a saved text overrides one key in one language
 * for every visitor (the server checks the key and the {placeholders}).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RotateCcw, Save, Search } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { LANGUAGES, LANGUAGE_LABELS, loadLanguage, shippedDictionary, type Language } from '@/lib/i18n';
import { adminApi, type Override } from '@/services/admin/api';
import { useAuthStore } from '@/store/authStore';
import { useSiteStore, type PublicSite } from '@/store/siteStore';
import { formatDateTime } from '../Progress/dates';
import { useAdminError } from './util';
import cls from '../Classroom/Classroom.module.css';
import auth from '../Auth/Auth.module.css';
import styles from './Admin.module.css';

const PAGE = 80;
const vars = (s: string) => [...new Set(s.match(/\{\w+\}/g) ?? [])].sort();

function flatten(node: unknown, prefix: string, out: Array<[string, string]>) {
  if (typeof node === 'string') out.push([prefix, node]);
  else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  return out;
}

function lookup(dict: unknown, key: string): string {
  let node: unknown = dict;
  for (const part of key.split('.')) node = node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined;
  return typeof node === 'string' ? node : '';
}

function Editor({ textKey, edits, onSaved }: { textKey: string; edits: Map<string, Override>; onSaved: (content: PublicSite['content']) => void }) {
  const t = useT();
  const errorText = useAdminError();
  const csrf = useAuthStore((s) => s.csrf);
  const defaults = useMemo(() => Object.fromEntries(LANGUAGES.map((l) => [l, lookup(shippedDictionary(l), textKey)])) as Record<Language, string>, [textKey]);
  const current = useCallback((l: Language) => edits.get(`${l}:${textKey}`)?.value ?? defaults[l], [edits, textKey, defaults]);
  const [draft, setDraft] = useState<Record<Language, string>>(() => Object.fromEntries(LANGUAGES.map((l) => [l, current(l)])) as Record<Language, string>);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const need = vars(defaults.kk);

  const save = async (lang: Language, value: string | null) => {
    if (!csrf) return;
    if (value !== null && vars(value).join() !== need.join()) return setMsg({ ok: false, text: t('admin.content.needVars', { vars: need.join(' ') || '—' }) });
    try {
      const r = await adminApi.setText(textKey, lang, value, csrf);
      onSaved(r.overrides);
      if (value === null) setDraft({ ...draft, [lang]: defaults[lang] });
      setMsg({ ok: true, text: r.result === 'reset' ? t('admin.content.resetDone', { lang: LANGUAGE_LABELS[lang] }) : t('admin.content.saved', { lang: LANGUAGE_LABELS[lang] }) });
    } catch (e) {
      setMsg({ ok: false, text: errorText(e) });
    }
  };

  return (
    <div className={styles.editor}>
      <code className={styles.keyName}>{textKey}</code>
      {need.length > 0 && <p className={cls.hint}>{t('admin.content.keepVars', { vars: need.join(' ') })}</p>}
      {LANGUAGES.map((l) => {
        const edit = edits.get(`${l}:${textKey}`);
        const changed = draft[l] !== current(l);
        return (
          <div key={l} className={styles.langBlock}>
            <div className={styles.langHead}>
              <b>{LANGUAGE_LABELS[l]}</b>
              {edit ? <span className={styles.editedTag}>{t('admin.content.edited', { by: edit.by ?? '—', time: formatDateTime(edit.updatedAt) })}</span> : <span className={styles.sub}>{t('admin.content.default')}</span>}
            </div>
            <textarea value={draft[l]} onChange={(e) => setDraft({ ...draft, [l]: e.target.value })} rows={Math.min(8, Math.max(2, Math.ceil(draft[l].length / 70)))} maxLength={4000} aria-label={`${textKey} — ${LANGUAGE_LABELS[l]}`} />
            {edit && <p className={styles.defaultText}>{t('admin.content.defaultWas', { text: defaults[l] })}</p>}
            <div className={cls.row}>
              <button type="button" className={auth.primary} disabled={!changed || !draft[l].trim()} onClick={() => save(l, draft[l])}>
                <Save size={15} aria-hidden="true" /> {t('admin.save')}
              </button>
              {edit && (
                <button type="button" className={auth.secondary} onClick={() => save(l, null)}>
                  <RotateCcw size={15} aria-hidden="true" /> {t('admin.content.reset')}
                </button>
              )}
            </div>
          </div>
        );
      })}
      {msg && (
        <p className={msg.ok ? auth.ok : auth.error} role={msg.ok ? 'status' : 'alert'}>
          {msg.text}
        </p>
      )}
    </div>
  );
}

export function ContentTab() {
  const t = useT();
  const errorText = useAdminError();
  const applyContent = useSiteStore((s) => s.applyContent);
  const [sections, setSections] = useState<string[]>([]);
  const [section, setSection] = useState('devices');
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [ready, setReady] = useState(false);
  const [q, setQ] = useState('');
  const [editedOnly, setEditedOnly] = useState(false);
  const [limit, setLimit] = useState(PAGE);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    adminApi
      .content()
      .then((r) => {
        setSections(r.sections);
        setOverrides(r.overrides);
      })
      .catch((e) => setError(errorText(e)));
  }, [errorText]);
  useEffect(() => {
    reload();
    // the editor shows all three languages side by side
    Promise.all([loadLanguage('ru'), loadLanguage('en')]).then(() => setReady(true));
  }, [reload]);

  const edits = useMemo(() => new Map(overrides.map((o) => [`${o.lang}:${o.key}`, o])), [overrides]);
  const editedKeys = useMemo(() => new Set(overrides.map((o) => o.key)), [overrides]);
  const entries = useMemo(() => (ready ? flatten(shippedDictionary('kk')?.[section], section, []) : []), [ready, section]);
  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return entries.filter(([key, kk]) => {
      if (editedOnly && !editedKeys.has(key)) return false;
      if (!needle) return true;
      if (key.toLowerCase().includes(needle) || kk.toLowerCase().includes(needle)) return true;
      return LANGUAGES.some((l) => (edits.get(`${l}:${key}`)?.value ?? lookup(shippedDictionary(l), key)).toLowerCase().includes(needle));
    });
  }, [entries, q, editedOnly, editedKeys, edits]);

  return (
    <div className={styles.stack}>
      <p className={cls.hint}>{t('admin.content.intro')}</p>
      {error && (
        <p className={auth.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.contentGrid}>
        <section className={auth.panel}>
          <div className={styles.filters}>
            <select
              value={section}
              onChange={(e) => {
                setSection(e.target.value);
                setSelected(null);
                setLimit(PAGE);
              }}
              aria-label={t('admin.content.section')}
            >
              {sections.map((s) => (
                <option key={s} value={s}>
                  {t(`admin.content.sections.${s}` as Parameters<typeof t>[0])}
                </option>
              ))}
            </select>
            <label className={styles.search}>
              <Search size={16} aria-hidden="true" />
              <input value={q} onChange={(e) => (setQ(e.target.value), setLimit(PAGE))} placeholder={t('admin.content.search')} aria-label={t('admin.content.search')} />
            </label>
            <label className={styles.checkInline}>
              <input type="checkbox" checked={editedOnly} onChange={(e) => setEditedOnly(e.target.checked)} /> {t('admin.content.editedOnly', { n: editedKeys.size })}
            </label>
          </div>
          <p className={cls.hint}>{t('admin.content.found', { n: matches.length })}</p>
          <ul className={styles.keyList}>
            {matches.slice(0, limit).map(([key, kk]) => (
              <li key={key}>
                <button type="button" className={styles.keyItem} aria-current={key === selected} onClick={() => setSelected(key)}>
                  <span>{edits.get(`kk:${key}`)?.value ?? kk}</span>
                  <small>
                    {key.slice(section.length + 1)}
                    {editedKeys.has(key) && <i className={styles.dotEdited} aria-label={t('admin.content.editedShort')} />}
                  </small>
                </button>
              </li>
            ))}
          </ul>
          {matches.length > limit && (
            <button type="button" className={auth.secondary} onClick={() => setLimit(limit + PAGE)}>
              {t('admin.content.more', { n: matches.length - limit })}
            </button>
          )}
        </section>
        <section className={`${auth.panel} ${styles.editorPanel}`}>
          {selected ? (
            <Editor
              key={selected}
              textKey={selected}
              edits={edits}
              onSaved={(content) => {
                applyContent(content);
                reload();
              }}
            />
          ) : (
            <p className={cls.empty}>{t('admin.content.pick')}</p>
          )}
        </section>
      </div>
    </div>
  );
}
