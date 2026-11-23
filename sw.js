// SPDX-License-Identifier: MIT OR Apache-2.0
// Offline cache for the installable editor (Rig Tablet). vite.config.js fills in the cache name
// and the list of built files and writes this out as sw.js; it is not bundled itself.

const CACHE = "rig-tablet-0.5.1-1of5o7l-imgdelete1";
const FILES = ["./","assets/app-O6qaiBkc.js","assets/aseprite-Dq70idiK.js","assets/dist-BISDhMXN.js","assets/dist-js-CGPjRG15.js","assets/dist-js-CmtiOpsg.js","assets/dist-js-DvfKKs8d.js","assets/gif-VmFIG2lv.js","assets/interop-BYtR0Jw9.js","assets/main-BqGsmy1c.css","assets/main-CVWDhsYX.js","assets/offline-Dm1hfR66.js","assets/output-CyLOa8ob.js","assets/panel-D8b-JhzL.js","assets/path-CiM2TmSP.js","assets/pngworker-DmxWEtbT.js","assets/prefs-CEXtYwJn.js","assets/render-BQU7Izf6.js","assets/renderer-GFtNoTVq.js","assets/rigby2d-icon-dark-CGr4vMEi.svg","assets/rolldown-runtime-hePW80VL.js","assets/splash-GZuKtjde.js","assets/spritesheetworker-DN9SdPFE.js","assets/svgimport-DCvIDS7v.js","assets/tablet-fixes.js","assets/themeui-CItxSFNN.js","assets/themeui-CNIZOYgX.css","assets/webview-CvNWatMx.js","assets/whisper.worker-CQ5k5vU2.js","assets/window-pHGx5qse.js","assets/worker-CK5aNBIl.js","index.html","manifest.webmanifest","panel.html","pwa/apple-touch-icon.png","pwa/icon-192.png","pwa/icon-512.png","pwa/icon-maskable-512.png","pyodide/pyodide-lock.json","pyodide/pyodide.asm.mjs","pyodide/pyodide.asm.wasm","pyodide/pyodide.mjs","pyodide/python_stdlib.zip"];

self.addEventListener('install', (event) => {
  // Take over at once: the editor's own files are cached first (small), the big Python runtime
  // afterwards in the background, so an update reaches the iPad in seconds, not minutes.
  self.skipWaiting();
  const core = FILES.filter((f) => !f.startsWith('pyodide/'));
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await Promise.all(core.map((f) => cache.add(new Request(f, { cache: 'reload' })).catch(() => {})));
    })(),
  );
});

// The big files: after the new version is running (not part of the install wait).
async function cacheBig() {
  const cache = await caches.open(CACHE);
  for (const f of FILES.filter((x) => x.startsWith('pyodide/')))
    if (!(await cache.match(f, { ignoreVary: true }))) await cache.add(new Request(f, { cache: 'reload' })).catch(() => {});
}

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key.startsWith('rig-tablet-') && key !== CACHE) await caches.delete(key);
      await self.clients.claim();
      cacheBig();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      // Opening the app: the newest page from the network when it answers quickly (so updates show
      // up at once), else the cached one, so it starts without internet. Its hashed scripts are then
      // fetched (and cached) below when the cache does not have them yet.
      if (req.mode === 'navigate') {
        const cached = (await cache.match(req, { ignoreSearch: true, ignoreVary: true })) || (await cache.match('./', { ignoreVary: true }));
        try {
          const res = await Promise.race([fetch(req, { cache: 'no-store' }), new Promise((_, no) => setTimeout(() => no(new Error('slow')), cached ? 3000 : 30000))]);
          if (res.ok) {
            cache.put('./', res.clone());
            return res;
          }
        } catch {
          // Offline or slow: the cached page below.
        }
        if (cached) return cached;
      }
      const hit = await cache.match(req, { ignoreSearch: true, ignoreVary: true });
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res.ok && res.type === 'basic') cache.put(req, res.clone());
        return res;
      } catch (err) {
        if (req.mode === 'navigate') {
          const page = await cache.match('./', { ignoreVary: true });
          if (page) return page;
        }
        throw err;
      }
    })(),
  );
});
