// V4 §13: a quick proofreading pass over Kazakh text — node dev/kk-proof.mjs [files…]
// Flags: a word mixing Latin and Cyrillic letters (a look-alike typed by mistake), letters Kazakh does
// not use (ё, ъ outside loanwords), common Russianisms, doubled spaces, a space before punctuation.
import { readFileSync } from 'node:fs';

const files = process.argv.slice(2).length ? process.argv.slice(2) : ['src/locales/kk.json', 'docs/DEMO_SCRIPT.md', 'DEPLOY_GCP.md'];
const RUSSIANISMS = [/\bадрес/i, /\bпожалуйста/i, /\bспасибо/i, /\bнастройк/i, /\bзагрузк/i, /\bтоже\b/i, /\bили\b/i, /\bдля\b/i, /\bесли\b/i, /\bкогда\b/i];
const out = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const lines = file.endsWith('.json') ? Object.entries(flat(JSON.parse(text))).map(([k, v]) => [k, String(v)]) : text.split('\n').map((l, i) => [`${file}:${i + 1}`, l]);
  for (const [where, line] of lines) {
    // code, URLs, commands and placeholders are not prose
    const prose = line.replace(/`[^`]*`/g, 'X').replace(/https?:\/\/\S+/g, 'X').replace(/\{[^}]*\}/g, 'X');
    if (file.endsWith('.md') && /^\s*(\$|gcloud|docker|sudo|git|npm|curl|bash|cd |cp |ls |\(|PROJECT=|REGION=|ZONE=|BILLING=|  --)/.test(line)) continue;
    for (const w of prose.match(/[\p{L}]+/gu) ?? []) {
      if (/[a-z]/i.test(w) && /[а-яәғқңөұүһі]/i.test(w)) out.push(`${where}: mixed letters «${w}»`);
    }
    if (/ё/i.test(prose)) out.push(`${where}: ё «${prose.trim().slice(0, 60)}»`);
    for (const r of RUSSIANISMS) if (r.test(prose)) out.push(`${where}: Russian word ${r} «${prose.trim().slice(0, 60)}»`);
    if (/\S {2,}\S/.test(prose.replace(/^\s+/, '')) && !file.endsWith('.md')) out.push(`${where}: doubled space`);
    if (/[\p{L}] [,.;:!?](\s|$)/u.test(prose)) out.push(`${where}: space before punctuation «${prose.trim().slice(0, 60)}»`);
  }
}
console.log(out.length ? out.join('\n') : 'clean');
console.log(`${out.length} notes in ${files.join(', ')}`);

function flat(o, p = '') {
  return Object.fromEntries(Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? Object.entries(flat(v, `${p}${k}.`)) : [[`${p}${k}`, v]])));
}
