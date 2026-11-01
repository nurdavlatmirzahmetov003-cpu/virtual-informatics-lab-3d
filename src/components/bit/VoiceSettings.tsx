/**
 * Bit's voice settings (V4 §10), a sheet over the conversation: auto-read,
 * the voice (women's, men's, in between), the speaking style, the speed and
 * emotion — every choice with its own Preview. Saved for the signed-in
 * student on the server, for a guest in this browser (bitStore).
 */
import { useState } from 'react';
import { ArrowLeft, Play, Square } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { useSettingsStore } from '@/store/settingsStore';
import type { TranslationKey } from '@/lib/i18n';
import { useBitStore } from '@/store/bitStore';
import { bitVoice, useVoiceStore } from '@/services/bit/voice';
import { BIT_VOICES, VOICE_PREVIEW, VOICE_SPEEDS, VOICE_STYLES, type VoicePrefs } from '@/services/bit/voicePrefs';
import styles from './VoiceSettings.module.css';

const KINDS = ['female', 'male', 'neutral'] as const;

export function VoiceSettings({ onClose, geminiVoice }: { onClose: () => void; geminiVoice: boolean }) {
  const t = useT();
  const language = useSettingsStore((s) => s.language);
  const profile = useBitStore((s) => s.profile);
  const autoRead = useBitStore((s) => s.voice);
  const sync = useBitStore((s) => s.prefsSync);
  const notice = useVoiceStore((s) => s.notice);
  const previewing = useVoiceStore((s) => s.owner === 'voice-preview');
  const [playing, setPlaying] = useState<string | null>(null);
  const set = useBitStore.getState().setProfile;

  /** One Preview button: what it changes, and what it plays. */
  const play = (id: string, patch: Partial<VoicePrefs>, joy = false) => {
    if (previewing && playing === id) {
      bitVoice.stop();
      return;
    }
    setPlaying(id);
    bitVoice.preview(VOICE_PREVIEW[language][joy ? 'joy' : 'hello'], { ...profile, ...patch });
  };
  const preview = (id: string, patch: Partial<VoicePrefs>, label: string, joy = false) => {
    const on = previewing && playing === id;
    return (
      <button type="button" className={styles.preview} onClick={() => play(id, patch, joy)} aria-pressed={on} aria-label={`${on ? t('bit.voiceSettings.stop') : t('bit.voiceSettings.preview')}: ${label}`}>
        {on ? <Square size={14} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}
        <span>{on ? t('bit.voiceSettings.stop') : t('bit.voiceSettings.preview')}</span>
      </button>
    );
  };

  const k = (key: string) => t(`bit.voiceSettings.${key}` as TranslationKey);

  return (
    <div className={styles.sheet} role="region" aria-labelledby="bit-voice-title">
      <header className={styles.head}>
        <button type="button" className={styles.back} onClick={onClose} aria-label={k('back')} title={k('back')}>
          <ArrowLeft size={18} />
        </button>
        <h3 id="bit-voice-title">{k('title')}</h3>
      </header>

      <div className={styles.body}>
        <label className={styles.switchRow}>
          <span>
            <strong>{k('autoRead')}</strong>
            <small>{k('autoReadHint')}</small>
          </span>
          <input type="checkbox" role="switch" checked={autoRead} onChange={(e) => (e.target.checked ? useBitStore.getState().setVoice(true) : (bitVoice.stop(), useBitStore.getState().setVoice(false)))} />
        </label>

        <fieldset className={styles.group}>
          <legend>{k('voice')}</legend>
          {KINDS.map((kind) => (
            <div key={kind} className={styles.kind}>
              <span className={styles.kindName}>{k(`kinds.${kind}`)}</span>
              {BIT_VOICES.filter((v) => v.kind === kind).map((v) => (
                <div key={v.id} className={styles.option} data-on={profile.voice === v.id || undefined}>
                  <label>
                    <input type="radio" name="bit-voice" checked={profile.voice === v.id} onChange={() => set({ voice: v.id })} />
                    <span>
                      {k(`voices.${v.id}`)}
                      <small>{v.id}</small>
                    </span>
                  </label>
                  {preview(`voice:${v.id}`, { voice: v.id }, k(`voices.${v.id}`))}
                </div>
              ))}
            </div>
          ))}
        </fieldset>

        <fieldset className={styles.group}>
          <legend>{k('style')}</legend>
          {VOICE_STYLES.map((s) => (
            <div key={s} className={styles.option} data-on={profile.style === s || undefined}>
              <label>
                <input type="radio" name="bit-style" checked={profile.style === s} onChange={() => set({ style: s })} />
                <span>{k(`styles.${s}`)}</span>
              </label>
              {preview(`style:${s}`, { style: s }, k(`styles.${s}`))}
            </div>
          ))}
        </fieldset>

        <fieldset className={styles.group}>
          <legend>{k('speed')}</legend>
          <div className={styles.speeds}>
            {VOICE_SPEEDS.map((v) => (
              <label key={v} className={styles.speed} data-on={profile.speed === v || undefined}>
                <input type="radio" name="bit-speed" checked={profile.speed === v} onChange={() => set({ speed: v })} />
                <span>{k(`speeds.${v === 1 ? 'normal' : v < 1 ? 'slow' : 'fast'}`)}</span>
              </label>
            ))}
          </div>
          {preview(`speed:${profile.speed}`, {}, k('speed'))}
        </fieldset>

        <fieldset className={styles.group}>
          <legend>{k('emotion')}</legend>
          <label className={styles.switchRow}>
            <span>
              <strong>{k('emotionOn')}</strong>
              <small>{k('emotionHint')}</small>
            </span>
            <input type="checkbox" role="switch" checked={profile.emotion} onChange={(e) => set({ emotion: e.target.checked })} />
          </label>
          {preview(`emotion:${profile.emotion}`, {}, k('emotion'), true)}
        </fieldset>

        {notice === 'quota' && <p className={styles.notice}>{t('bit.quota')}</p>}
        {!geminiVoice && <p className={styles.notice}>{k('browserOnly')}</p>}
        <p className={styles.saved}>{sync === 'saved' ? k('savedAccount') : sync === 'saving' ? k('saving') : sync === 'offline' ? k('savedOffline') : k('savedLocal')}</p>
      </div>
    </div>
  );
}
