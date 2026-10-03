import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addDevice, addressProblem, connect, connectDevices, connectToDevice, diagnose, disconnect, emptyNetwork, l2Path,
  moveDevice, NETWORK_TASKS, NETWORK_TASK_IDS, parseIp, parseMask, ping, removeDevice, updateHostConfig, updateInterface,
} from '../src/labs/NetworkLab/index.ts';
import { grade, startAttempt } from '../src/services/grading/index.ts';

const cfg = (net, id, ip, extra = {}) => updateHostConfig(net, id, { ip, mask: '255.255.255.0', ...extra });
const link = (net, a, b) => {
  const r = connectDevices(net, a, b);
  assert.equal(r.error, null, `${a}-${b}: ${r.error}`);
  return r.network;
};

/** PC1, PC2 on SW1 in 192.168.1.0/24 */
function lan() {
  let n = emptyNetwork();
  n = addDevice(n, 'pc', 100, 100);
  n = addDevice(n, 'pc', 100, 300);
  n = addDevice(n, 'switch', 400, 200);
  n = cfg(n, 'PC1', '192.168.1.10');
  n = cfg(n, 'PC2', '192.168.1.11');
  return link(link(n, 'PC1', 'SW1'), 'PC2', 'SW1');
}

/** lan() + R1 (g0 192.168.1.1 on SW1, g1 10.0.0.1 → SRV1 10.0.0.10) */
function routed() {
  let n = lan();
  n = addDevice(n, 'router', 600, 200);
  n = addDevice(n, 'server', 800, 200);
  n = updateInterface(n, 'R1', 'g0', { ip: '192.168.1.1', mask: '255.255.255.0' });
  n = updateInterface(n, 'R1', 'g1', { ip: '10.0.0.1', mask: '255.255.255.0' });
  n = cfg(n, 'SRV1', '10.0.0.10', { gateway: '10.0.0.1' });
  n = connect(n, { device: 'R1', port: 'g0' }, { device: 'SW1', port: 'p8' }).network;
  n = connect(n, { device: 'R1', port: 'g1' }, { device: 'SRV1', port: 'eth0' }).network;
  for (const pc of ['PC1', 'PC2']) n = updateHostConfig(n, pc, { gateway: '192.168.1.1' });
  return n;
}

test('IPv4 parsing, masks and reserved addresses', () => {
  assert.equal(parseIp('192.168.1.10'), 0xc0a8010a);
  for (const bad of ['999.1.1.1', '1.2.3', '1.2.3.4.5', 'a.b.c.d', '']) assert.equal(parseIp(bad), null, bad);
  assert.ok(parseMask('255.255.255.0'));
  assert.equal(parseMask('255.0.255.0'), null);
  assert.equal(parseMask('255.255.255.255'), null);
  assert.equal(addressProblem('', '255.255.255.0'), 'noIp');
  assert.equal(addressProblem('192.168.1.300', '255.255.255.0'), 'invalidIp');
  assert.equal(addressProblem('192.168.1.10', '255.0.255.0'), 'invalidMask');
  for (const reserved of ['192.168.1.0', '192.168.1.255', '127.0.0.1', '0.1.2.3', '224.0.0.1']) assert.equal(addressProblem(reserved, '255.255.255.0'), 'reservedIp', reserved);
  assert.equal(addressProblem('10.1.2.3', '255.0.0.0'), null);
});

test('cabling rules: port kinds, Wi-Fi only via access point, busy ports, auto port choice', () => {
  let n = emptyNetwork();
  for (const t of ['pc', 'smartphone', 'switch', 'accessPoint', 'laptop']) n = addDevice(n, t, 0, 0);
  assert.equal(connectDevices(n, 'PHONE1', 'SW1').error, 'kindMismatch');
  assert.equal(connectDevices(n, 'PHONE1', 'LAPTOP1').error, 'wifiNeedsAccessPoint');
  n = link(n, 'PHONE1', 'AP1');
  assert.equal(n.links.at(-1).medium, 'wifi');
  n = link(n, 'PC1', 'SW1');
  assert.equal(connectDevices(n, 'PC1', 'SW1').error, 'alreadyLinked');
  let m = addDevice(n, 'pc', 0, 0);
  assert.equal(connectDevices(m, 'PC2', 'PC1').error, 'noFreePort', 'PC1 has one Ethernet port and it is used');
  m = connectToDevice(m, { device: 'PC2', port: 'eth0' }, 'SW1').network;
  assert.deepEqual(m.links.at(-1).b, { device: 'SW1', port: 'p2' }, 'first free switch port');
  assert.equal(connect(addDevice(m, 'pc', 0, 0), { device: 'PC3', port: 'eth0' }, { device: 'SW1', port: 'p2' }).error, 'portBusy');
  assert.equal(disconnect(m, m.links.at(-1).id).links.length, m.links.length - 1);
  assert.equal(removeDevice(m, 'SW1').links.some((l) => l.a.device === 'SW1' || l.b.device === 'SW1'), false);
});

test('a PC never forwards frames for others', () => {
  let n = emptyNetwork();
  for (let i = 0; i < 3; i++) n = addDevice(n, 'laptop', 0, 0);
  n = connect(n, { device: 'LAPTOP1', port: 'eth0' }, { device: 'LAPTOP2', port: 'eth0' }).network;
  assert.equal(l2Path(n, 'LAPTOP1', 'LAPTOP3'), null);
});

test('PING inside one LAN: success path and each failure with where it stopped', () => {
  const n = lan();
  const ok = ping(n, 'PC1', 'PC2');
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.hops, ['PC1', 'SW1', 'PC2', 'SW1', 'PC1'], 'request and reply');

  const unplugged = disconnect(n, n.links[1].id);
  const r1 = ping(unplugged, 'PC1', 'PC2');
  assert.equal(r1.reason, 'targetNoCable');
  assert.equal(r1.stoppedAt, 'SW1');
  assert.equal(ping(unplugged, 'PC2', 'PC1').reason, 'noCable');

  const other = cfg(n, 'PC2', '192.168.2.11');
  const r2 = ping(other, 'PC1', 'PC2');
  assert.equal(r2.reason, 'differentSubnet');
  assert.equal(r2.stoppedAt, 'PC1');
  assert.equal(r2.params.srcNet, '192.168.1.0/24');

  assert.equal(ping(cfg(n, 'PC2', '192.168.1.10'), 'PC1', 'PC2').reason, 'duplicateIp');
  assert.equal(ping(cfg(n, 'PC2', ''), 'PC1', 'PC2').reason, 'targetNoIp');
  assert.equal(ping(cfg(n, 'PC1', '192.168.1.255'), 'PC1', 'PC2').reason, 'reservedIp');
  assert.equal(ping(n, 'PC1', 'SW1').reason, 'targetNoIp', 'a switch has no IP');
  assert.equal(ping(n, 'SW1', 'PC1').reason, 'sourceNotHost');
});

test('PING through a router: gateway, routing, reply path', () => {
  const n = routed();
  const ok = ping(n, 'PC1', 'SRV1');
  assert.equal(ok.ok, true, JSON.stringify(ok));
  assert.deepEqual(ok.hops, ['PC1', 'SW1', 'R1', 'SRV1', 'R1', 'SW1', 'PC1']);
  assert.equal(ping(n, 'PC1', 'R1').ok, true, 'router answers on its LAN interface');

  assert.equal(ping(updateHostConfig(n, 'PC1', { gateway: '' }), 'PC1', 'SRV1').reason, 'differentSubnet');
  assert.equal(ping(updateHostConfig(n, 'PC1', { gateway: '192.168.1.254' }), 'PC1', 'SRV1').reason, 'gatewayUnreachable');
  assert.equal(ping(updateHostConfig(n, 'PC1', { gateway: '10.0.0.1' }), 'PC1', 'SRV1').reason, 'gatewayOutsideSubnet');
  assert.equal(ping(updateHostConfig(n, 'PC1', { gateway: '192.168.1.11' }), 'PC1', 'SRV1').reason, 'gatewayNotRouter');

  const noReply = ping(updateHostConfig(n, 'SRV1', { gateway: '' }), 'PC1', 'SRV1');
  assert.equal(noReply.ok, false);
  assert.equal(noReply.direction, 'reply', 'the request arrived, the answer could not return');
  assert.equal(noReply.stoppedAt, 'SRV1');

  const unknownNet = ping(cfg(n, 'SRV1', '10.0.5.10', { gateway: '10.0.0.1' }), 'PC1', 'SRV1');
  assert.equal(unknownNet.reason, 'noRoute');
  assert.equal(unknownNet.stoppedAt, 'R1');

  const unplugged = disconnect(n, n.links.find((l) => l.a.port === 'g1').id);
  assert.equal(ping(unplugged, 'PC1', 'SRV1').reason, 'routerPortNoCable');

  // same subnet on the far side of the router: ARP never crosses a router
  const behind = cfg(n, 'SRV1', '192.168.1.50', { gateway: '192.168.1.1' });
  assert.equal(ping(behind, 'PC1', 'SRV1').reason, 'sameSubnetBehindRouter');
});

test('Wi-Fi devices reach the LAN through an access point', () => {
  let n = lan();
  n = addDevice(n, 'accessPoint', 0, 0);
  n = addDevice(n, 'smartphone', 0, 0);
  n = cfg(n, 'PHONE1', '192.168.1.30');
  n = link(link(n, 'AP1', 'SW1'), 'PHONE1', 'AP1');
  assert.deepEqual(ping(n, 'PHONE1', 'PC1').hops.slice(0, 4), ['PHONE1', 'AP1', 'SW1', 'PC1']);
});

test('diagnose lists addressing mistakes per device', () => {
  let n = routed();
  n = cfg(n, 'PC2', '192.168.1.10', { gateway: '10.0.0.1', dns: 'dns.local' });
  const codes = diagnose(n).map((i) => `${i.device}:${i.code}`);
  assert.ok(codes.includes('PC2:duplicateIp'));
  assert.ok(codes.includes('PC2:gatewayOutsideSubnet'));
  assert.ok(codes.includes('PC2:dnsInvalid'));
  n = updateInterface(n, 'R1', 'g1', { ip: '192.168.1.200' });
  assert.ok(diagnose(n).some((i) => i.code === 'interfacesOverlap'));
});

// ---------------------------------------------------------------------------
// Graded tasks

const run = (task, net) => grade(task, net, startAttempt(task.id, 0), 0).report;

function solve(id) {
  const task = NETWORK_TASKS[id];
  let n = task.start();
  if (id === 'connect3') {
    n = addDevice(n, 'switch', 500, 300);
    for (const pc of ['PC1', 'PC2', 'PC3']) n = link(n, pc, 'SW1');
  }
  if (id === 'routerLan') {
    n = addDevice(n, 'router', 500, 100);
    n = addDevice(n, 'switch', 500, 300);
    n = addDevice(n, 'pc', 200, 500);
    n = addDevice(n, 'laptop', 700, 500);
    n = updateInterface(n, 'R1', 'g0', { ip: '192.168.0.1' });
    n = link(n, 'R1', 'SW1');
    n = cfg(n, 'PC1', '192.168.0.10', { gateway: '192.168.0.1' });
    n = cfg(n, 'LAPTOP1', '192.168.0.11', { gateway: '192.168.0.1' });
    n = link(link(n, 'PC1', 'SW1'), 'LAPTOP1', 'SW1');
  }
  if (id === 'addressing') {
    ['PC1', 'PC2', 'LAPTOP1', 'PRN1'].forEach((h, i) => {
      n = cfg(n, h, `192.168.10.${20 + i}`, { gateway: '192.168.10.1', dns: '10.10.0.10' });
    });
  }
  if (id === 'repair') {
    n = link(n, 'PC2', 'SW1');
    n = updateHostConfig(n, 'PC3', { ip: '192.168.1.12' });
    n = updateHostConfig(n, 'LAPTOP1', { ip: '192.168.1.15' });
    n = updateHostConfig(n, 'PRN1', { gateway: '192.168.1.1' });
  }
  return n;
}

test('every task starts unsolved and a correct solution scores 10/10', () => {
  for (const id of NETWORK_TASK_IDS) {
    const task = NETWORK_TASKS[id];
    assert.equal(task.gradingRules.reduce((s, r) => s + r.points, 0), 10, `${id} rule points`);
    assert.equal(task.hints.length, 3);
    const before = run(task, task.start());
    assert.equal(before.status, 'incomplete', id);
    assert.ok(before.score < 10, `${id} start ${before.score}`);
    const after = run(task, solve(id));
    assert.equal(after.status, 'completed', `${id}: ${JSON.stringify(after.outcomes.filter((o) => !o.passed))}`);
    assert.equal(after.score, 10);
  }
});

test('grading reads topology, not layout', () => {
  for (const id of NETWORK_TASK_IDS) {
    let n = solve(id);
    for (const d of n.devices) n = moveDevice(n, d.id, 1000 - d.x, 620 - d.y);
    assert.equal(run(NETWORK_TASKS[id], n).score, 10, id);
  }
});

test('the broken network explains each fault', () => {
  const report = run(NETWORK_TASKS.repair, NETWORK_TASKS.repair.start());
  const keys = report.outcomes.flatMap((o) => o.feedback.map((f) => `${o.id}:${f.key}:${f.params?.name ?? ''}`));
  assert.ok(keys.includes('cables:network.feedback.issue.noCable:PC2'), keys.join('\n'));
  assert.ok(keys.some((k) => k.startsWith('uniqueIps:network.feedback.issue.duplicateIp')));
  assert.ok(keys.includes('lanSubnet:network.feedback.wrongSubnet:LAPTOP1'));
  assert.ok(keys.includes('gateways:network.feedback.wrongGateway:PRN1'));
  const pingFail = report.outcomes.find((o) => o.id === 'pingServer').feedback[0];
  assert.match(pingFail.detail.key, /^network\.ping\./);
  assert.ok(report.score > 0 && report.score < 10, `partial credit ${report.score}`);
});

test('partial credit: two of three computers cabled', () => {
  const task = NETWORK_TASKS.connect3;
  let n = addDevice(task.start(), 'switch', 500, 300);
  n = link(link(n, 'PC1', 'SW1'), 'PC2', 'SW1');
  const r = run(task, n);
  assert.equal(r.status, 'incomplete');
  assert.ok(r.score >= 5 && r.score <= 7, String(r.score));
  assert.ok(r.outcomes.find((o) => o.id === 'allCabled').feedback.some((f) => f.params.name === 'PC3'));
});

test('deleting a prepared device fails clearly instead of passing', () => {
  const task = NETWORK_TASKS.addressing;
  const r = run(task, removeDevice(solve('addressing'), 'PRN1'));
  assert.equal(r.status, 'incomplete');
  assert.ok(r.outcomes.some((o) => o.feedback.some((f) => f.key === 'network.feedback.deviceMissing')));
});
