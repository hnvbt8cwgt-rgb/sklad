// Офлайн-работа: всё нужное хранится в телефоне. Страница открывается из кэша сразу,
// а при появлении интернета тихо подтягивает новую версию.
const CACHE = 'sklad-20261123-0130';
const CORE = [
  './', './index.html', './manifest.webmanifest', './icon-180.png', './icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('sklad-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const isPage = req.mode === 'navigate';
  const key = isPage ? './index.html' : req;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(key, { ignoreSearch: isPage });
    const net = fetch(req).then(r => {
      if (r && (r.ok || r.type === 'opaque')) c.put(key, r.clone());
      return r;
    }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    const r = await net;
    return r || new Response('Нет связи', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }));
});
