/**
 * Admin CLI (V2-8). The first administrator is created here, by a person
 * typing the password at the prompt — it is never generated, printed,
 * logged or stored anywhere except as a scrypt hash.
 *
 *   npm run server:create-admin
 */
import { createInterface } from 'node:readline';
import { stdin, stdout } from 'node:process';
import { openDb, migrate, type Db } from './db';
import { loadEnv, serverConfig } from './env';
import { audit } from './audit';
import { passwordProblem, PASSWORD_MIN } from './auth/password';
import { createUser, loginProblem, normalizeLogin, userByLogin } from './users';

/** Non-interactive core (tested): validates and creates the admin. */
export async function createAdmin(db: Db, input: { login: string; displayName: string; password: string }) {
  const user = await createUser(db, { ...input, role: 'admin' });
  audit(db, 'admin.create.cli', { target: user.id, detail: 'cli' });
  return user;
}

function ask(question: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout });
  return new Promise((resolve) => rl.question(question, (a) => (rl.close(), resolve(a))));
}

/** Reads a line without echoing it (the password never appears on screen). */
function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    stdout.write(question);
    const input = stdin;
    let value = '';
    const onData = (buf: Buffer) => {
      for (const ch of buf.toString('utf8')) {
        if (ch === '\r' || ch === '\n') {
          input.setRawMode?.(false);
          input.pause();
          input.off('data', onData);
          stdout.write('\n');
          resolve(value);
          return;
        }
        if (ch === '\u0003') process.exit(130); // Ctrl+C
        if (ch === '\u007f' || ch === '\b') value = value.slice(0, -1);
        else value += ch;
      }
    };
    input.setRawMode?.(true);
    input.resume();
    input.on('data', onData);
  });
}

async function main() {
  const [command] = process.argv.slice(2);
  if (command !== 'create-admin') {
    console.log('Usage: npm run server:create-admin');
    process.exit(1);
  }
  loadEnv();
  const db = openDb(serverConfig().dbFile);
  migrate(db);
  console.log('Create an administrator account. The password is typed by you and is stored only as a hash.');
  const login = normalizeLogin(await ask('Login (Latin letters, digits, . _ -): '));
  if (loginProblem(login)) return fail('The login must be 3–32 characters: a–z, 0–9, dot, dash or underscore.');
  if (userByLogin(db, login)) return fail('That login already exists.');
  const displayName = (await ask('Display name: ')).trim() || login;
  const password = await askHidden(`Password (at least ${PASSWORD_MIN} characters, letters and digits): `);
  const problem = passwordProblem(password);
  if (problem) return fail(problem === 'tooShort' ? `Too short: at least ${PASSWORD_MIN} characters.` : problem === 'tooSimple' ? 'Too simple: mix letters with digits or symbols.' : 'Too long.');
  const again = await askHidden('Repeat the password: ');
  if (again !== password) return fail('The passwords do not match.');
  const user = await createAdmin(db, { login, displayName, password });
  console.log(`Administrator "${user.login}" created.`);
}

function fail(message: string) {
  console.error(message);
  process.exit(1);
}

if (process.argv[1]?.endsWith('cli.ts')) void main();
