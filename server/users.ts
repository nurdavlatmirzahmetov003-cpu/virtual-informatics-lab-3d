/** Users: creation with validation, lookup, the public shape sent to the browser. */
import { randomUUID } from 'node:crypto';
import type { Db } from './db';
import { hashPassword, passwordProblem } from './auth/password';
import { HttpError } from './http';

export const ROLES = ['admin', 'teacher', 'student'] as const;
export type Role = (typeof ROLES)[number];

export interface UserRow {
  id: string;
  login: string;
  display_name: string;
  role: Role;
  password_hash: string;
  school_id: string | null;
  disabled: number;
  created_at: number;
  last_login_at: number | null;
}

export interface PublicUser {
  id: string;
  login: string;
  displayName: string;
  role: Role;
}

export const publicUser = (u: UserRow): PublicUser => ({ id: u.id, login: u.login, displayName: u.display_name, role: u.role });

/** Logins: 3–32 characters, Latin letters, digits, dot, dash, underscore; case-insensitive. */
export const normalizeLogin = (login: string) => login.trim().toLowerCase();
export const loginProblem = (login: string) => (/^[a-z0-9._-]{3,32}$/.test(login) ? null : 'badLogin');

export function userByLogin(db: Db, login: string): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE login = ?').get(normalizeLogin(login)) as UserRow | undefined;
}

export function userById(db: Db, id: string): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
}

export async function createUser(db: Db, input: { login: string; displayName: string; role: Role; password: string }, now = Date.now()): Promise<UserRow> {
  const login = normalizeLogin(input.login);
  const displayName = input.displayName.trim().slice(0, 80);
  if (loginProblem(login)) throw new HttpError(400, 'badLogin');
  if (!displayName) throw new HttpError(400, 'badName');
  if (!ROLES.includes(input.role)) throw new HttpError(400, 'badRole');
  const pw = passwordProblem(input.password);
  if (pw) throw new HttpError(400, `password.${pw}`);
  if (userByLogin(db, login)) throw new HttpError(409, 'loginTaken');
  const row: UserRow = {
    id: randomUUID(),
    login,
    display_name: displayName,
    role: input.role,
    password_hash: await hashPassword(input.password),
    school_id: null,
    disabled: 0,
    created_at: now,
    last_login_at: null,
  };
  db.prepare('INSERT INTO users (id, login, display_name, role, password_hash, school_id, disabled, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    row.id,
    row.login,
    row.display_name,
    row.role,
    row.password_hash,
    row.school_id,
    row.disabled,
    row.created_at,
    row.last_login_at,
  );
  return row;
}

export function listUsers(db: Db) {
  return (db.prepare('SELECT * FROM users ORDER BY role, login').all() as unknown as UserRow[]).map((u) => ({
    ...publicUser(u),
    disabled: !!u.disabled,
    createdAt: u.created_at,
    lastLoginAt: u.last_login_at,
  }));
}

export const countAdmins = (db: Db) => (db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'").get() as { n: number }).n;
