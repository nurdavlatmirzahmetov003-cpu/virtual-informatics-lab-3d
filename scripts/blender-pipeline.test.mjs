import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { validateConfig, checkOutput, verify } from './blender/verify-glb.mjs';

const base = {
  name: 'demo',
  input: 'assets-src/sketchfab/demo.glb',
  output: 'assets-src/blender/demo/demo.glb',
  parts: [
    { id: 'shell', rules: [{ groups: '^Case' }], explode: [0, 0, 1] },
    { id: 'board', fallback: true },
  ],
  ports: [{ type: 'usb_a', part: 'shell' }],
};

test('validateConfig accepts a minimal valid config', () => {
  assert.deepEqual(validateConfig(base), []);
});

test('validateConfig rejects duplicate ids, missing fallback, bad regex and unknown port parts', () => {
  const bad = {
    ...base,
    parts: [
      { id: 'shell', rules: [{ groups: '(' }] },
      { id: 'shell', rules: [{ materials: 'x' }] },
      { id: 'Bad-Id', rules: [] },
    ],
    ports: [{ type: 'hdmi', part: 'nowhere' }],
  };
  const errors = validateConfig(bad);
  assert.ok(errors.some((e) => e.includes('unique')));
  assert.ok(errors.some((e) => e.includes('fallback')));
  assert.ok(errors.some((e) => e.includes('regex')));
  assert.ok(errors.some((e) => e.includes('snake_case')));
  assert.ok(errors.some((e) => e.includes('no rules')));
  assert.ok(errors.some((e) => e.includes('unknown part')));
});

test('checkOutput finds missing parts, misplaced ports and a LOD that is not lighter', () => {
  const info = {
    triangles: 100,
    parts: { shell: { node: 'shell', triangles: 60, explode: [0, 1, 0] } },
    ports: [{ name: 'port_usb_a_1', type: 'usb_a', parent: 'board' }],
  };
  const errors = checkOutput(base, info, { triangles: 120 });
  assert.ok(errors.some((e) => e.includes('"board" missing')));
  assert.ok(errors.some((e) => e.includes('expected "shell"')));
  assert.ok(errors.some((e) => e.includes('LOD1')));

  const ok = {
    triangles: 100,
    parts: { shell: { node: 'shell', triangles: 60, explode: [0, 1, 0] }, board: { node: 'board', triangles: 40, explode: [0, 0, 0] } },
    ports: [{ name: 'port_usb_a_1', type: 'usb_a', parent: 'shell' }],
  };
  assert.deepEqual(checkOutput(base, ok, { triangles: 50 }), []);
});

test('every committed pipeline config is valid (and its output, when built, matches it)', async () => {
  const dir = path.join(import.meta.dirname, 'blender', 'configs');
  const files = [
    ...readdirSync(dir).filter((f) => f.endsWith('.json')),
    ...readdirSync(path.join(dir, 'products')).filter((f) => f.endsWith('.json')).map((f) => path.join('products', f)),
  ];
  assert.ok(files.length > 1);
  for (const f of files) {
    const r = await verify(path.join(dir, f));
    assert.deepEqual(r.errors, [], `${f}: ${r.errors.join('; ')}`);
  }
});

test('every catalog product with its own model has a pipeline config (and vice versa)', () => {
  const dir = path.join(import.meta.dirname, 'blender', 'configs', 'products');
  const configs = new Set(readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)));
  const catalog = readFileSync(path.join(import.meta.dirname, '..', 'src', 'data', 'hardware', 'catalog.ts'), 'utf8');
  const own = new Set([...catalog.matchAll(/P\('([a-z0-9-]+)'\)/g)].map((m) => m[1]));
  assert.deepEqual([...own].sort(), [...configs].sort());
});

test('every port marker label is translated (V2-2b markers feed the V2-6 port tooltips)', () => {
  const dir = path.join(import.meta.dirname, 'blender', 'configs');
  const files = [
    ...readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => path.join(dir, f)),
    ...readdirSync(path.join(dir, 'products')).filter((f) => f.endsWith('.json')).map((f) => path.join(dir, 'products', f)),
  ];
  const labels = new Set(files.flatMap((f) => (JSON.parse(readFileSync(f, 'utf8')).ports ?? []).map((p) => p.label).filter(Boolean)));
  assert.ok(labels.size > 10);
  for (const lang of ['kk', 'ru', 'en']) {
    const dict = JSON.parse(readFileSync(path.join(import.meta.dirname, '..', 'src', 'locales', `${lang}.json`), 'utf8'));
    for (const key of labels) assert.equal(typeof key.split('.').reduce((o, k) => o?.[k], dict), 'string', `${lang}: ${key}`);
  }
});
