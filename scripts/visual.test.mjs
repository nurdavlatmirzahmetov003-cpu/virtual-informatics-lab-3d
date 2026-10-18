import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { isThemeMode, nextThemeMode, resolveTheme, SCENE_PALETTES, THEME_MODES } from '../src/lib/theme/index.ts';
import { HD_MODELS, hdFile, isTieredModel, lodFile, modelLevels } from '../src/lib/three/modelUrls.ts';
import { QUALITY_LEVELS, QUALITY_PRESETS } from '../src/lib/quality/presets.ts';

const root = path.resolve(import.meta.dirname, '..');

test('theme modes resolve and cycle', () => {
  assert.equal(resolveTheme('dark', 'light'), 'dark');
  assert.equal(resolveTheme('light', 'dark'), 'light');
  assert.equal(resolveTheme('system', 'light'), 'light');
  assert.equal(resolveTheme('system', 'dark'), 'dark');
  let mode = 'dark';
  const seen = [];
  for (let i = 0; i < THEME_MODES.length; i++) {
    seen.push(mode);
    mode = nextThemeMode(mode);
  }
  assert.equal(mode, 'dark');
  assert.deepEqual([...seen].sort(), [...THEME_MODES].sort());
  assert.ok(isThemeMode('light') && !isThemeMode('blue') && !isThemeMode(undefined));
  for (const p of Object.values(SCENE_PALETTES)) assert.ok(p.exposure > 0.8 && p.exposure < 1.5 && p.envBoost >= 1);
});

test('close-up (_hd) files: names, and the build script builds the same set', () => {
  assert.equal(hdFile('/assets/models/hardware/gpu_triple_fan.glb'), '/assets/models/hardware/gpu_triple_fan_hd.glb');
  assert.equal(hdFile('hardware/monitor_ultrawide.glb'), null);
  assert.equal(lodFile('hardware/speakers.glb'), 'hardware/speakers_lod1.glb');
  const script = readFileSync(path.join(root, 'scripts/optimize-assets.mjs'), 'utf8');
  const list = script.match(/const HD = new Set\(\[([^\]]+)\]\)/)[1].match(/'([^']+)'/g).map((s) => s.slice(1, -1));
  assert.deepEqual([...list].sort(), [...HD_MODELS].sort());
});

test('quality presets: AA everywhere, filtering grows with quality, 2K and SMAA only with post-processing', () => {
  let previous = 0;
  for (const level of QUALITY_LEVELS) {
    const p = QUALITY_PRESETS[level];
    assert.ok(p.antialias, `${level}: antialias`);
    assert.ok(p.anisotropy >= previous, `${level}: anisotropy grows`);
    previous = p.anisotropy;
    if (p.smaa) assert.ok(p.postprocessing, `${level}: SMAA needs the post chain`);
    if (p.hdTextures) assert.ok(p.lodBias === 0, `${level}: 2K textures only on High/Ultra`);
    assert.ok(p.dpr[1] <= 2);
  }
  assert.equal(QUALITY_PRESETS.low.hdTextures, false);
  assert.equal(QUALITY_PRESETS.medium.hdTextures, false);
});

/** WCAG relative luminance contrast. */
function contrast(a, b) {
  const lum = (hex) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test('both themes keep text contrast ≥ 4.5:1 on the page and panel backgrounds', () => {
  const css = readFileSync(path.join(root, 'src/styles/tokens.css'), 'utf8');
  const block = (selector) => css.slice(css.indexOf(selector), css.indexOf('}', css.indexOf(selector)));
  const tokens = (text) => Object.fromEntries([...text.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\b/gi)].map((m) => [m[1], m[2]]));
  const dark = tokens(block(':root {'));
  const light = { ...dark, ...tokens(block(":root[data-theme='light']")) };
  for (const [name, t] of Object.entries({ dark, light })) {
    for (const fg of ['text', 'text-muted', 'text-dim', 'accent', 'success', 'warning', 'danger', 'violet', 'mint']) {
      for (const bg of ['bg', 'bg-elevated']) {
        const c = contrast(t[fg], t[bg]);
        assert.ok(c >= 4.5, `${name}: --${fg} on --${bg} is ${c.toFixed(2)}:1`);
      }
    }
  }
});

test('per-product models: one file per quality level, the next lighter one far away', () => {
  const f = 'assets/models/products/mon-dell-u2724d.glb';
  assert.ok(isTieredModel(f));
  assert.ok(!isTieredModel('assets/models/products/mon-dell-u2724d_lod1.glb'));
  assert.ok(!isTieredModel('assets/models/hardware/psu.glb'));
  assert.deepEqual(modelLevels(f, 0), { near: f, far: f.replace('.glb', '_lod1.glb') });
  assert.deepEqual(modelLevels(f, 1), { near: f.replace('.glb', '_lod1.glb'), far: f.replace('.glb', '_lod2.glb') });
  assert.deepEqual(modelLevels(f, 2), { near: f.replace('.glb', '_lod2.glb'), far: null });
  assert.deepEqual(modelLevels(f, 0, true), { near: f.replace('.glb', '_lod2.glb'), far: null });
  // shared hardware models keep their two levels
  assert.deepEqual(modelLevels('hardware/speakers.glb', 1), { near: 'hardware/speakers.glb', far: 'hardware/speakers_lod1.glb' });
  assert.deepEqual(modelLevels('hardware/speakers.glb', 2), { near: 'hardware/speakers_lod1.glb', far: null });
  assert.deepEqual(modelLevels('hardware/psu.glb', 2), { near: 'hardware/psu.glb', far: null });
});

test('brand: one name everywhere, the logo files draw the same mark as the component', async () => {
  const { BRAND } = await import('../src/config/brand.ts');
  const { translate, loadLanguage } = await import('../src/lib/i18n/index.ts');
  for (const lang of ['kk', 'ru', 'en']) {
    await loadLanguage(lang);
    const title = translate(lang, 'app.title');
    assert.ok(title.startsWith(BRAND.name), `${lang}: ${title}`);
    assert.ok(!title.includes('{'), `${lang}: placeholder left in ${title}`);
  }
  // an explicit variable still wins over the global one
  assert.equal(translate('kk', 'app.short', { brand: 'X' }), 'X');
  const component = readFileSync(path.join(root, 'src/components/brand/BrandMark.tsx'), 'utf8');
  for (const file of ['public/favicon.svg', 'public/brand/logo.svg', 'public/brand/logo-full.svg']) {
    const svg = readFileSync(path.join(root, file), 'utf8');
    for (const shape of ['M22 13v35', 'cx="33.5" cy="37.5" r="10.5"', 'cx="45.5" cy="17.5" r="5.5"']) {
      assert.ok(svg.includes(shape) && component.includes(shape), `${file}: ${shape}`);
    }
  }
});
