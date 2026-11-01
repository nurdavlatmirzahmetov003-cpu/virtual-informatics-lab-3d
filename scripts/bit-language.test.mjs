/**
 * Bit speaks the site language only (owner's report, 2026-11-01: with KK
 * chosen, panels were read first by a foreign voice, then in Kazakh). The
 * KK / RU / EN switch decides; a switch drops what was queued; a browser
 * voice of another language never reads; each language is its own recording.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { bitVoice, browserVoiceIndex } from '../src/services/bit/voice.ts';
import { ttsKey } from '../server/bitVoice.ts';

const v = (lang, name = lang, localService = true) => ({ lang, name, localService });

test('the browser voice is one of the site language or none — Kazakh is never read by an English or Russian voice', () => {
  assert.equal(browserVoiceIndex('kk', [v('en-US'), v('ru-RU', 'Microsoft Irina')]), null);
  assert.equal(browserVoiceIndex('kk', []), null, 'voices not loaded yet: no default (English) voice');
  assert.equal(browserVoiceIndex('kk', [v('en-US'), v('kk-KZ', 'Microsoft Aigul')]), 1);
  assert.equal(browserVoiceIndex('ru', [v('en-US'), v('ru-RU')]), 1);
  assert.equal(browserVoiceIndex('en', [v('ru-RU'), v('kk-KZ')]), null);
});

test('a text is queued once, in the site language; switching the language drops the old queue', () => {
  bitVoice.stop();
  bitVoice.setLanguage('kk');
  const kk = 'Витринада ең әдемі модельдер тұр. Әр тұғырда модельдің аты жазылған.';
  bitVoice.say(kk);
  const queued = bitVoice.pending;
  assert.ok(queued.length >= 1);
  assert.ok(queued.every((q) => q.lang === 'kk'));
  assert.equal(queued.map((q) => q.text).join(' '), kk, 'each sentence once, nothing else before or after');
  // the same language again changes nothing
  bitVoice.setLanguage('kk');
  assert.equal(bitVoice.pending.length, queued.length);
  // RU pressed mid-speech: nothing of the Kazakh queue is spoken any more
  bitVoice.setLanguage('ru');
  assert.deepEqual(bitVoice.pending, []);
  bitVoice.say('Привет, я Бит.');
  assert.deepEqual(bitVoice.pending, [{ text: 'Привет, я Бит.', lang: 'ru' }]);
  bitVoice.stop();
  bitVoice.setLanguage('kk');
});

test('each language is its own recording in the voice cache', () => {
  const text = 'Setup Studio';
  assert.notEqual(ttsKey('Kore', 'kk', text), ttsKey('Kore', 'en', text));
  assert.notEqual(ttsKey('Kore', 'kk', text), ttsKey('Kore', 'ru', text));
});
