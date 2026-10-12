import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  CONNECT_EXERCISES, CONNECT_TASK_IDS, DHCP_STEPS, ETHERNET_SCENARIO, NETWORKS, PC_SCENARIO, PORT_KINDS, SCHOOL_KEY, SCHOOL_SSID,
  dhcpLease, emptyPlugState, endsOf, join, plugProblem, tryPlug, unplug,
} from '../src/labs/ConnectLab/index.ts';
import { grade, startAttempt } from '../src/services/grading/index.ts';

const dicts = Object.fromEntries(['kk', 'ru', 'en'].map((l) => [l, JSON.parse(readFileSync(new URL(`../src/locales/${l}.json`, import.meta.url), 'utf8'))]));
const get = (obj, key) => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
const plugAll = (s, pairs) => pairs.reduce((st, [e, p]) => tryPlug(s, st, e, p).state, emptyPlugState());

test('PC: plugs only fit their own socket shape', () => {
  const s = PC_SCENARIO;
  const st = emptyPlugState();
  assert.equal(plugProblem(s, st, 'keyboard', 'motherboard.usb_a_1'), null);
  assert.equal(plugProblem(s, st, 'keyboard', 'motherboard.ethernet_1'), 'shape');
  assert.equal(plugProblem(s, st, 'keyboard', 'motherboard.usb_c_1'), 'shape', 'USB-A is not USB-C');
  assert.equal(plugProblem(s, st, 'monitor', 'gpu.displayport_1'), 'shape', 'HDMI does not fit DisplayPort');
  assert.equal(plugProblem(s, st, 'speakers', 'motherboard.audio_3_5_1'), null);
  assert.equal(plugProblem(s, st, 'power', 'psu.power_ac_1'), null);
});

test('PC: with a graphics card the monitor goes into the card, not the board', () => {
  const s = PC_SCENARIO;
  assert.equal(plugProblem(s, emptyPlugState(), 'monitor', 'motherboard.hdmi_1'), 'igpu');
  assert.equal(plugProblem(s, emptyPlugState(), 'monitor', 'gpu.hdmi_1'), null);
  // without a card the board's output is the right one
  assert.equal(plugProblem({ ...s, discreteGpu: false }, emptyPlugState(), 'monitor', 'motherboard.hdmi_1'), null);
});

test('refused plugs are counted as mistakes; ports take one plug; unplug frees them', () => {
  const s = PC_SCENARIO;
  let st = tryPlug(s, emptyPlugState(), 'keyboard', 'motherboard.usb_a_1').state;
  const r = tryPlug(s, st, 'mouse', 'motherboard.usb_a_1');
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'occupied');
  assert.equal(r.state.mistakes.length, 1);
  st = unplug(r.state, 'keyboard');
  assert.equal(tryPlug(s, st, 'mouse', 'motherboard.usb_a_1').ok, true);
});

test('PC task: fully connected scores 10; mistakes cost only the care points', () => {
  const ex = CONNECT_EXERCISES.pc;
  const good = plugAll(PC_SCENARIO, [['monitor', 'gpu.hdmi_1'], ['keyboard', 'motherboard.usb_a_1'], ['mouse', 'motherboard.usb_a_2'], ['speakers', 'motherboard.audio_3_5_1'], ['power', 'psu.power_ac_1']]);
  const r = grade(ex, good, startAttempt(ex.id)).report;
  assert.equal(r.score, 10);
  assert.equal(r.status, 'completed');
  const sloppy = { ...good, mistakes: [{ end: 'monitor', port: 'motherboard.hdmi_1', reason: 'igpu' }, { end: 'keyboard', port: 'motherboard.ethernet_1', reason: 'shape' }] };
  const r2 = grade(ex, sloppy, startAttempt(ex.id)).report;
  assert.ok(r2.score < 10 && r2.score >= 8, `two mistakes: ${r2.score}`);
  assert.equal(r2.status, 'completed');
  const half = plugAll(PC_SCENARIO, [['keyboard', 'motherboard.usb_a_1']]);
  assert.equal(grade(ex, half, startAttempt(ex.id)).report.status, 'incomplete');
});

test('Ethernet: router LAN, not WAN; the two ends go to different devices', () => {
  const s = ETHERNET_SCENARIO;
  assert.equal(plugProblem(s, emptyPlugState(), 'patch.a', 'router.ethernet_0'), 'wan');
  assert.equal(plugProblem(s, emptyPlugState(), 'patch.a', 'laptop.usb_c_1'), 'shape');
  const one = tryPlug(s, emptyPlugState(), 'patch.a', 'router.ethernet_2').state;
  assert.equal(plugProblem(s, one, 'patch.b', 'router.ethernet_3'), 'sameDevice');
  const both = tryPlug(s, one, 'patch.b', 'laptop.ethernet_1').state;
  const ex = CONNECT_EXERCISES.ethernet;
  assert.equal(grade(ex, both, startAttempt(ex.id)).report.score, 10);
  // either end can go either way
  const swapped = plugAll(s, [['patch.b', 'router.ethernet_1'], ['patch.a', 'laptop.ethernet_1']]);
  assert.equal(grade(ex, swapped, startAttempt(ex.id)).report.score, 10);
});

test('Wi-Fi: only the secured school network with its key is full marks', () => {
  assert.deepEqual(join(SCHOOL_SSID, SCHOOL_KEY), { joined: true });
  assert.deepEqual(join(SCHOOL_SSID, 'bilim'), { joined: false, reason: 'wrongKey' });
  assert.deepEqual(join('Mektep-Guest', '12345'), { joined: false, reason: 'wep' });
  assert.deepEqual(join('Free_WiFi_Kafe', ''), { joined: true }, 'open networks join (with a warning in the UI)');
  assert.deepEqual(join('TP-Link_8F2A', 'anything'), { joined: false, reason: 'wrongKey' });
  const ex = CONNECT_EXERCISES.wifi;
  assert.equal(grade(ex, { joined: SCHOOL_SSID, joinedOpen: false, wrongKeys: 0 }, startAttempt(ex.id)).report.score, 10);
  const risky = grade(ex, { joined: SCHOOL_SSID, joinedOpen: true, wrongKeys: 1 }, startAttempt(ex.id)).report;
  assert.ok(risky.score <= 6, `joined an open network first: ${risky.score}`);
  const open = grade(ex, { joined: 'Free_WiFi_Kafe', joinedOpen: true, wrongKeys: 0 }, startAttempt(ex.id)).report;
  assert.equal(open.status, 'incomplete');
  assert.equal(open.score, 0);
  assert.ok(NETWORKS.some((n) => n.security === 'open') && NETWORKS.some((n) => n.security === 'wep'), 'the list shows the risky kinds too');
});

test('DHCP: a lease from the router pool, four DORA messages', () => {
  const a = dhcpLease('laptop-eth');
  const b = dhcpLease('laptop-wifi');
  assert.notEqual(a.ip, b.ip);
  for (const l of [a, b]) {
    assert.match(l.ip, /^192\.168\.1\.(1\d\d)$/);
    assert.equal(l.gateway, '192.168.1.1');
    assert.equal(l.mask, '255.255.255.0');
  }
  assert.deepEqual([...DHCP_STEPS], ['discover', 'offer', 'request', 'ack']);
});

test('every Connection Lab text exists in kk, ru and en', () => {
  const ends = [...endsOf(PC_SCENARIO), ...endsOf(ETHERNET_SCENARIO)];
  for (const [lang, d] of Object.entries(dicts)) {
    for (const k of PORT_KINDS) assert.equal(typeof get(d, `connect.ports.${k}`), 'string', `${lang}: port ${k}`);
    for (const r of ['shape', 'igpu', 'wan', 'occupied', 'sameDevice']) assert.equal(typeof get(d, `connect.why.${r}`), 'string', `${lang}: why ${r}`);
    for (const id of CONNECT_TASK_IDS) {
      for (const k of ['title', 'short', 'instructions', 'expected', 'hint']) assert.equal(typeof get(d, `connect.tasks.${id}.${k}`), 'string', `${lang}: ${id}.${k}`);
      for (const rule of CONNECT_EXERCISES[id].gradingRules) assert.equal(typeof get(d, rule.label.key), 'string', `${lang}: ${rule.label.key}`);
    }
    for (const c of [...PC_SCENARIO.cables, ...ETHERNET_SCENARIO.cables]) assert.equal(typeof get(d, `connect.cables.${c.id}`), 'string', `${lang}: cable ${c.id}`);
    for (const e of ends) assert.ok(e.id);
    for (const step of DHCP_STEPS) assert.equal(typeof get(d, `connect.dhcp.${step}`), 'string', `${lang}: dhcp ${step}`);
    for (const s of ['open', 'wep', 'wpa2', 'wpa3']) assert.equal(typeof get(d, `connect.wifi.security.${s}`), 'string', `${lang}: security ${s}`);
    for (const k of ['monitorMissing', 'inputMissing', 'audioMissing', 'powerMissing', 'mistakes', 'laptopMissing', 'lanMissing', 'notJoined', 'insecureJoined', 'wrongNetwork', 'joinedOpen', 'wrongKeys']) {
      assert.equal(typeof get(d, `connect.feedback.${k}`), 'string', `${lang}: feedback ${k}`);
    }
  }
});
