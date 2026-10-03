/* WhatBites service worker — makes the app work without signal.
 * - App files: stored on install; network first (3.5 s timeout on weak signal), stored copy otherwise
 * - AI library + its WebAssembly files (cdn.jsdelivr.net): stored after first download, then used offline
 * - Species photos (upload.wikimedia.org): stored after first view
 * - The AI model itself is stored by Transformers.js in its own cache
 * - Live data (weather, map, fish records) goes to the network; the app saves its own copy for offline use
 */
const VERSION = 'v19';
const APP = `whatbites-app-${VERSION}`;
const CDN = 'whatbites-cdn-v1';
const IMG = 'whatbites-img-v1';
const SHELL = ['./', 'index.html', 'style.css', 'engine.js', 'scene.js', 'trip.js', 'vision.js', 'app.js',
  'manifest.json', 'icon.svg', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', (e) => e.waitUntil(
  caches.open(APP).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())));

self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('whatbites-') && ![APP, CDN, IMG].includes(k)).map((k) => caches.delete(k))))
    .then(() => self.clients.claim())));

function timeout(ms) { return new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)); }

async function networkFirst(req) {
  const cache = await caches.open(APP);
  try {
    const res = await Promise.race([fetch(req, { cache: 'no-cache' }), timeout(3500)]);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === 'navigate') return (await cache.match('index.html')) || Response.error();
    return Response.error();
  }
}

async function cacheFirst(req, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
  return res;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) e.respondWith(networkFirst(req));
  else if (url.hostname === 'cdn.jsdelivr.net') e.respondWith(cacheFirst(req, CDN));
  else if (url.hostname === 'upload.wikimedia.org') e.respondWith(cacheFirst(req, IMG));
  // everything else (APIs, model files handled by Transformers.js) goes straight to the network
});
