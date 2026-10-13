/**
 * Database backups (V2-10): consistent snapshots with `VACUUM INTO`, kept as
 * files in BACKUP_DIR; restore copies a checked snapshot over the live
 * database with SQLite's backup API (the open connection sees it at once),
 * after an automatic "before-restore" snapshot. A restore or an upload is
 * accepted only if it is a sound lab database with an active admin.
 */
import { mkdirSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync, backup } from 'node:sqlite';
import type { Db } from './db';
import { HttpError } from './http';

export interface BackupInfo {
  name: string;
  size: number;
  createdAt: number;
}

const NAME = /^[A-Za-z0-9._-]{1,120}\.db$/;
const SQLITE_HEADER = 'SQLite format 3\0';
export const MAX_UPLOAD = 200 * 1024 * 1024;

export function checkName(name: string) {
  if (!NAME.test(name) || name.includes('..')) throw new HttpError(400, 'badName');
  return name;
}

const stamp = (now: number) => new Date(now).toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);

export function listBackups(dir: string): BackupInfo[] {
  mkdirSync(dir, { recursive: true });
  return readdirSync(dir)
    .filter((f) => NAME.test(f))
    .map((name) => {
      const st = statSync(join(dir, name));
      return { name, size: st.size, createdAt: st.mtimeMs };
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** A consistent snapshot of the live database. */
export function createBackup(db: Db, dir: string, label: 'manual' | 'auto' | 'before-restore', now = Date.now()): BackupInfo {
  mkdirSync(dir, { recursive: true });
  let name = `lab-${stamp(now)}-${label}.db`;
  for (let i = 2; listBackups(dir).some((b) => b.name === name); i++) name = `lab-${stamp(now)}-${label}-${i}.db`;
  const file = join(dir, name);
  db.exec(`VACUUM INTO '${file.replace(/'/g, "''")}'`);
  const st = statSync(file);
  return { name, size: st.size, createdAt: st.mtimeMs };
}

/** Throws 400 unless the file is an intact lab database with at least one active admin. */
export function verifyBackup(file: string) {
  let probe: DatabaseSync | null = null;
  try {
    probe = new DatabaseSync(file, { readOnly: true });
    const ok = (probe.prepare('PRAGMA quick_check').get() as { quick_check: string }).quick_check === 'ok';
    const tables = new Set((probe.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as Array<{ name: string }>).map((r) => r.name));
    if (!ok || !tables.has('users') || !tables.has('schema_migrations')) throw new Error('not a lab database');
    const admins = (probe.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND disabled = 0").get() as { n: number }).n;
    if (!admins) throw new Error('no admin');
  } catch {
    throw new HttpError(400, 'badBackup');
  } finally {
    probe?.close();
  }
}

/** Saves an uploaded database file into the backup folder (checked first). */
export function saveUpload(dir: string, data: Buffer, now = Date.now()): BackupInfo {
  if (data.length < 512 || data.subarray(0, 16).toString('latin1') !== SQLITE_HEADER) throw new HttpError(400, 'badBackup');
  mkdirSync(dir, { recursive: true });
  const name = `upload-${stamp(now)}.db`;
  const file = join(dir, name);
  writeFileSync(file, data);
  try {
    verifyBackup(file);
  } catch (e) {
    unlinkSync(file);
    throw e;
  }
  const st = statSync(file);
  return { name, size: st.size, createdAt: st.mtimeMs };
}

/** Replaces the live database with a backup; returns the safety snapshot taken first. */
export async function restoreBackup(db: Db, liveFile: string, dir: string, name: string, now = Date.now()): Promise<BackupInfo> {
  if (liveFile === ':memory:') throw new HttpError(400, 'memoryDb');
  const file = join(dir, checkName(name));
  try {
    statSync(file);
  } catch {
    throw new HttpError(404, 'notFound');
  }
  verifyBackup(file);
  const safety = createBackup(db, dir, 'before-restore', now);
  const source = new DatabaseSync(file, { readOnly: true });
  try {
    await backup(source, liveFile);
  } finally {
    source.close();
  }
  return safety;
}

export function deleteBackup(dir: string, name: string) {
  try {
    unlinkSync(join(dir, checkName(name)));
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(404, 'notFound');
  }
}
