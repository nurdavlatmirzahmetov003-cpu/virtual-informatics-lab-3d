/**
 * Password hashing with scrypt (node:crypto). Stored as
 * `scrypt$N$r$p$<salt base64>$<hash base64>`; verification is constant-time.
 */
import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from 'node:crypto';

const scrypt = (password: string, salt: Buffer, keylen: number, opts: ScryptOptions) =>
  new Promise<Buffer>((resolve, reject) => scryptCb(password, salt, keylen, opts, (err, key) => (err ? reject(err) : resolve(key))));

const PARAMS = { N: 16384, r: 8, p: 1 } as const;
const KEYLEN = 32;

export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 200;

/** Why a new password is refused, or null. Passwords are typed by people — never generated or stored in code. */
export function passwordProblem(password: string): 'tooShort' | 'tooLong' | 'tooSimple' | null {
  if (password.length < PASSWORD_MIN) return 'tooShort';
  if (password.length > PASSWORD_MAX) return 'tooLong';
  // at least two kinds of characters (letters, digits, symbols)
  const kinds = [/[a-zA-Zа-яА-ЯәғқңөұүһіӘҒҚҢӨҰҮҺІ]/, /\d/, /[^a-zA-Z0-9а-яА-ЯәғқңөұүһіӘҒҚҢӨҰҮҺІ]/].filter((r) => r.test(password)).length;
  return kinds < 2 ? 'tooSimple' : null;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, KEYLEN, { ...PARAMS, maxmem: 64 * 1024 * 1024 });
  return ['scrypt', PARAMS.N, PARAMS.r, PARAMS.p, salt.toString('base64'), key.toString('base64')].join('$');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, n, r, p, saltB64, hashB64] = stored.split('$');
  if (algo !== 'scrypt' || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64');
  const key = await scrypt(password, Buffer.from(saltB64, 'base64'), expected.length, { N: Number(n), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024 });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** A hash to verify against when the login does not exist, so timing does not reveal valid logins. */
let dummy: Promise<string> | null = null;
export const dummyHash = () => (dummy ??= hashPassword(randomBytes(12).toString('hex')));
