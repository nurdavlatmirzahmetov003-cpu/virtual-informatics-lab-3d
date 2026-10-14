/**
 * `npm start` — the whole local site in one terminal: the lab server
 * (accounts, classes, admin; :8787) and the Vite site (:5173), with
 * prefixed output. Ctrl+C stops both. Runs from the project folder
 * whatever folder it was started from.
 */
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const win = process.platform === 'win32';
const colors = { server: '\x1b[36m', site: '\x1b[35m' };

const children = [
  ['server', 'npm run server'],
  ['site', 'npm run dev'],
].map(([name, cmd]) => {
  const child = spawn(cmd, { cwd: root, shell: true, env: { ...process.env, FORCE_COLOR: '1' } });
  const tag = `${colors[name]}[${name}]\x1b[0m `;
  const pipe = (stream, out) => {
    let rest = '';
    stream.on('data', (chunk) => {
      const lines = (rest + chunk).split(/\r?\n/);
      rest = lines.pop();
      for (const line of lines) out.write(tag + line + '\n');
    });
  };
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  child.on('exit', (code) => {
    process.stdout.write(`${tag}stopped (${code ?? 'signal'})\n`);
    stopAll();
  });
  return child;
});

console.log('\n  Site:   http://localhost:5173\n  Server: http://localhost:8787   (Ctrl+C stops both)\n');

let stopping = false;
function stopAll() {
  if (stopping) return;
  stopping = true;
  for (const c of children) {
    if (c.exitCode !== null) continue;
    // npm starts its own children: end the whole tree
    if (win) spawnSync('taskkill', ['/pid', String(c.pid), '/T', '/F'], { stdio: 'ignore' });
    else c.kill('SIGTERM');
  }
  setTimeout(() => process.exit(0), 300);
}
process.on('SIGINT', stopAll);
process.on('SIGTERM', stopAll);
