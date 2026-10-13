/**
 * Failed-login limiter: per IP + login, and per IP overall, in a sliding
 * window. A success clears the login's counter. In memory: a restart resets
 * it, which is fine for one school server.
 */
export class LoginLimiter {
  private fails = new Map<string, number[]>();
  readonly perLogin: number;
  readonly perIp: number;
  readonly windowMs: number;

  constructor(perLogin = 5, perIp = 20, windowMs = 15 * 60_000) {
    this.perLogin = perLogin;
    this.perIp = perIp;
    this.windowMs = windowMs;
  }

  private recent(key: string, now: number) {
    const list = (this.fails.get(key) ?? []).filter((t) => now - t < this.windowMs);
    this.fails.set(key, list);
    return list;
  }

  /** Seconds to wait, or 0 when another try is allowed. */
  retryAfter(ip: string, login: string, now = Date.now()): number {
    const a = this.recent(`${ip}|${login}`, now);
    const b = this.recent(ip, now);
    const blocked = [a.length >= this.perLogin ? a : null, b.length >= this.perIp ? b : null].filter(Boolean) as number[][];
    if (!blocked.length) return 0;
    return Math.ceil(Math.max(...blocked.map((l) => l[0] + this.windowMs - now)) / 1000);
  }

  fail(ip: string, login: string, now = Date.now()) {
    for (const k of [`${ip}|${login}`, ip]) this.recent(k, now).push(now);
  }

  succeed(ip: string, login: string) {
    this.fails.delete(`${ip}|${login}`);
  }

  /** Keys blocked right now: "ip|login" pairs and whole IPs (for the admin's security page). */
  blocked(now = Date.now()): Array<{ key: string; ip: string; login: string | null; fails: number; retryAfter: number }> {
    const out: Array<{ key: string; ip: string; login: string | null; fails: number; retryAfter: number }> = [];
    for (const key of [...this.fails.keys()]) {
      const list = this.recent(key, now);
      const isPair = key.includes('|');
      if (list.length < (isPair ? this.perLogin : this.perIp)) continue;
      const [ip, login] = isPair ? key.split('|') : [key, null];
      out.push({ key, ip, login, fails: list.length, retryAfter: Math.ceil((list[0] + this.windowMs - now) / 1000) });
    }
    return out;
  }

  /** Lifts a block early (the admin unblocks someone who mistyped). */
  clear(key: string): boolean {
    return this.fails.delete(key);
  }
}
