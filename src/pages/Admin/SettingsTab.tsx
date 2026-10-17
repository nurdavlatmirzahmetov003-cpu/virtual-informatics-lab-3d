/** Site settings: the banner for everyone, switches the server enforces, session length. */
import { useEffect, useState, type FormEvent } from 'react';
import { Save } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { LANGUAGES, LANGUAGE_LABELS } from '@/lib/i18n';
import { adminApi, type SiteSettings } from '@/services/admin/api';
import { useAuthStore } from '@/store/authStore';
import { useSiteStore } from '@/store/siteStore';
import { useAdminError } from './util';
import cls from '../Classroom/Classroom.module.css';
import auth from '../Auth/Auth.module.css';
import styles from './Admin.module.css';

type Toggle = 'allowJoinByCode' | 'allowTeacherRegistration' | 'aiEnabled' | 'leaderboardsEnabled' | 'leaderboardAnonymous';
const TOGGLES: Toggle[] = ['allowJoinByCode', 'allowTeacherRegistration', 'aiEnabled', 'leaderboardsEnabled', 'leaderboardAnonymous'];

export function SettingsTab() {
  const t = useT();
  const errorText = useAdminError();
  const csrf = useAuthStore((s) => s.csrf);
  const [s, setS] = useState<SiteSettings | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    adminApi
      .settings()
      .then((r) => setS(r.settings))
      .catch((e) => setMsg({ ok: false, text: errorText(e) }));
  }, [errorText]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!csrf || !s) return;
    try {
      const r = await adminApi.saveSettings(s, csrf);
      setS(r.settings);
      setMsg({ ok: true, text: t('admin.settings.saved') });
      void useSiteStore.getState().load(); // the banner shows at once
    } catch (err) {
      setMsg({ ok: false, text: errorText(err) });
    }
  };

  if (!s) return msg ? <p className={auth.error}>{msg.text}</p> : <div aria-busy="true" />;
  return (
    <form className={styles.settings} onSubmit={save}>
      <section className={auth.panel}>
        <h2>{t('admin.settings.bannerTitle')}</h2>
        <p className={cls.hint}>{t('admin.settings.bannerHint')}</p>
        {LANGUAGES.map((l) => (
          <label key={l} className={auth.field}>
            <span>{LANGUAGE_LABELS[l]}</span>
            <input value={s.banner[l]} onChange={(e) => setS({ ...s, banner: { ...s.banner, [l]: e.target.value } })} maxLength={300} />
          </label>
        ))}
        <div className={styles.segmented} role="radiogroup" aria-label={t('admin.settings.tone')}>
          {(['info', 'warning'] as const).map((tone) => (
            <label key={tone} data-on={s.banner.tone === tone}>
              <input type="radio" name="tone" checked={s.banner.tone === tone} onChange={() => setS({ ...s, banner: { ...s.banner, tone } })} />
              {t(`admin.settings.tones.${tone}`)}
            </label>
          ))}
        </div>
      </section>

      <section className={auth.panel}>
        <h2>{t('admin.settings.rulesTitle')}</h2>
        {TOGGLES.map((k) => (
          <label key={k} className={styles.check}>
            <input type="checkbox" checked={s[k]} onChange={(e) => setS({ ...s, [k]: e.target.checked })} />
            <span>
              <b>{t(`admin.settings.${k}`)}</b>
              <small>{t(`admin.settings.${k}Hint`)}</small>
            </span>
          </label>
        ))}
        <label className={auth.field}>
          <span>{t('admin.settings.sessionHours')}</span>
          <input type="number" min={1} max={72} value={s.sessionHours} onChange={(e) => setS({ ...s, sessionHours: Number(e.target.value) })} required />
          <small>{t('admin.settings.sessionHint')}</small>
        </label>
      </section>

      <div className={styles.saveBar}>
        {msg && (
          <p className={msg.ok ? auth.ok : auth.error} role={msg.ok ? 'status' : 'alert'}>
            {msg.text}
          </p>
        )}
        <button type="submit" className={auth.primary}>
          <Save size={16} aria-hidden="true" /> {t('admin.settings.save')}
        </button>
      </div>
    </form>
  );
}
