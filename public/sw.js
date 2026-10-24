/**
 * BitLab offline (0.37). Installing the worker caches the app shell: the
 * page, the scripts and styles of every route (the build writes their list
 * to precache.json) and the fonts — so the pages, the 2D labs and Bit's
 * built-in answers open without a network. 3D models and textures are
 * cached the first time they are seen. /api is never cached: accounts,
 * scores and Bit's model answers always go to the server.
 */
const SHELL = 'bitlab-shell-v1';
const RUNTIME = 'bitlab-runtime-v1';
const scope = new URL(self.registration.scope);
const local = (path) => new URL(path, scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL);
      let files = [];
      try {
        files = await (await fetch(local('precache.json'), { cache: 'no-store' })).json();
      } catch {
        /* a dev build has no list: only the page itself */
      }
      const urls = ['./', 'manifest.webmanifest', 'favicon.svg', 'icons/icon-192.png', ...files].map(local);
      // one missing file must not stop the rest
      await Promise.all(urls.map((u) => cache.add(new Request(u, { cache: 'reload' })).catch(() => undefined)));
      // files of an older build are not needed any more
      const keep = new Set(urls);
      for (const req of await cache.keys()) if (!keep.has(req.url)) await cache.delete(req);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) if (name !== SHELL && name !== RUNTIME) await caches.delete(name);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== scope.origin || url.pathname.startsWith(`${scope.pathname}api/`) || url.pathname.startsWith('/api/')) return;

  // pages: the network first (fresh content), the cached shell when offline — the router takes it from there
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(async () => (await caches.match(local('./'))) ?? Response.error()),
    );
    return;
  }

  // built files carry a hash in their name and never change: the cache first.
  // Other files (models, textures) can be replaced under the same name: the cached copy now,
  // a fresh one fetched in the background for next time.
  const hashed = /-[\w-]{8,}\.\w+$/.test(url.pathname);
  event.respondWith(
    (async () => {
      const hit = await caches.match(req);
      const refresh = () =>
        fetch(req).then((res) => {
          if (res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(RUNTIME).then((c) => c.put(req, copy)).catch(() => undefined);
          }
          return res;
        });
      if (hit) {
        if (!hashed) event.waitUntil(refresh().catch(() => undefined));
        return hit;
      }
      return refresh();
    })(),
  );
});
