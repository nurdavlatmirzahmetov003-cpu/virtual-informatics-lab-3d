/** A tiny `:param` router shared by the classroom and admin routes. */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { HttpError } from './http';

export interface RouteCtx {
  req: IncomingMessage;
  res: ServerResponse;
  ip: string;
  /** Parsed query string. */
  query: URLSearchParams;
}

export type Handler = (ctx: RouteCtx, params: Record<string, string>) => Promise<void> | void;

function compile(pattern: string) {
  const names: string[] = [];
  const re = new RegExp(`^${pattern.replace(/:(\w+)/g, (_, n: string) => (names.push(n), '([^/]+)'))}$`);
  return (path: string) => {
    const m = re.exec(path);
    return m ? Object.fromEntries(names.map((n, i) => [n, decodeURIComponent(m[i + 1])])) : null;
  };
}

export function createRouter() {
  const routes: Array<{ method: string; match: (p: string) => Record<string, string> | null; handler: Handler }> = [];
  return {
    on(method: string, pattern: string, handler: Handler) {
      routes.push({ method, match: compile(pattern), handler });
    },
    /** True when a route answered; 405 when the path exists with another method. */
    async route(ctx: RouteCtx, method: string, path: string): Promise<boolean> {
      let pathMatched = false;
      for (const r of routes) {
        const params = r.match(path);
        if (!params) continue;
        pathMatched = true;
        if (r.method !== method) continue;
        await r.handler(ctx, params);
        return true;
      }
      if (pathMatched) throw new HttpError(405, 'method');
      return false;
    },
  };
}
