/**
 * Class mode (0.37): the phone remote's commands reach only the same
 * teacher's projector screens, are checked for shape, and the screen's
 * state goes back to the phone; students cannot connect.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { RemoteHub, asCommand } from '../server/live/remote.ts';

let n = 0;
const socket = () => {
  const c = { id: ++n, open: true, got: [], handlers: [], closers: [], send: (d) => c.got.push(d), close: (code) => ((c.open = false), (c.code = code), c.closers.forEach((f) => f())), onMessage: (fn) => c.handlers.push(fn), onClose: (fn) => c.closers.push(fn) };
  c.say = (m) => c.handlers.forEach((fn) => fn(m));
  c.last = (t) => [...c.got].reverse().find((m) => m.t === t);
  return c;
};
const user = (id, role) => ({ id, role, display_name: id });

test('commands are checked for shape', () => {
  assert.deepEqual(asCommand({ t: 'zone', dir: 1 }), { t: 'zone', dir: 1 });
  assert.equal(asCommand({ t: 'zone', dir: 5 }), null);
  assert.deepEqual(asCommand({ t: 'zoneTo', zone: 'network' }), { t: 'zoneTo', zone: 'network' });
  assert.equal(asCommand({ t: 'zoneTo', zone: 'moon' }), null);
  assert.equal(asCommand({ t: 'ask', text: 'x'.repeat(201) }), null);
  assert.deepEqual(asCommand({ t: 'ask', text: '  Процессор деген не?  ' }), { t: 'ask', text: 'Процессор деген не?' });
  assert.equal(asCommand({ t: 'eval', code: 'alert(1)' }), null);
});

test('a teacher\'s phone steers only that teacher\'s screens; the screen reports back; students are refused', () => {
  const hub = new RemoteHub();
  const screenA = socket();
  const phoneA = socket();
  const screenB = socket();
  hub.connect(user('tA', 'teacher'), 'screen', screenA);
  hub.connect(user('tB', 'teacher'), 'screen', screenB);
  hub.connect(user('tA', 'teacher'), 'remote', phoneA);
  assert.equal(phoneA.last('presence').screens, 1);
  assert.equal(screenA.last('presence').remotes, 1);

  phoneA.say({ t: 'zoneTo', zone: 'network' });
  assert.deepEqual(screenA.last('command').command, { t: 'zoneTo', zone: 'network' });
  assert.equal(screenB.last('command'), undefined, 'another teacher\'s projector is not touched');
  assert.equal(phoneA.last('sent').screens, 1);

  phoneA.say({ t: 'hack' });
  assert.equal(phoneA.last('error').code, 'badCommand');

  screenA.say({ t: 'state', zone: 'network', speaking: true, sentence: 'Маршрутизатор желілерді байланыстырады.' });
  assert.deepEqual(phoneA.last('state'), { t: 'state', zone: 'network', speaking: true, sentence: 'Маршрутизатор желілерді байланыстырады.' });

  const kid = socket();
  hub.connect(user('s1', 'student'), 'remote', kid);
  assert.equal(kid.open, false);
  assert.equal(kid.last('error').code, 'teachersOnly');

  screenA.close();
  assert.equal(phoneA.last('presence').screens, 0, 'the phone sees the projector go');
});
