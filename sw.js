/* ===================================================
   Service Worker — מלאי המטבח PWA
   אחראי על: cache קבצים סטטיים, תמיכת offline,
   סנכרון ברקע כשהרשת חוזרת
   =================================================== */

const CACHE_NAME = 'kitchen-inventory-v9';

/* רשימת קבצים סטטיים לשמירה ב-cache */
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.webmanifest',
    './styles/base.css',
    './styles/theme-dark.css',
    './styles/home.css',
    './styles/scanner.css',
    './styles/list.css',
    './styles/product.css',
    './scripts/config.js',
    './scripts/store.js',
    './scripts/api.js',
    './scripts/sync.js',
    './scripts/scanner.js',
    './scripts/inventory.js',
    './scripts/israeli-catalog.js',
    './scripts/nostr-bridge.js',
    './scripts/product-lookup.js',
    './scripts/products.js',
    './scripts/shortages.js',
    './scripts/ui.js',
    './scripts/router.js',
    './scripts/pwa-install.js',
    './scripts/app.js'
];

/* ---- Install — שמירת כל הקבצים הסטטיים ב-cache ---- */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

/* ---- Activate — ניקוי cache ישן ---- */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

/* ---- Fetch — Cache First, Network Fallback ---- */
self.addEventListener('fetch', (event) => {
    /* בקשות API לא עוברות cache — רק קבצים סטטיים */
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request).catch(() =>
                new Response(JSON.stringify({ error: 'offline' }), {
                    headers: { 'Content-Type': 'application/json' }
                })
            )
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cached => {
            return cached || fetch(event.request).then(response => {
                /* שמירת תשובות חדשות ב-cache */
                if (response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            });
        }).catch(() =>
            caches.match('./index.html')
        )
    );
});

/* ---- Sync — סנכרון פעולות ממתינות כשהרשת חוזרת ---- */
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-inventory') {
        event.waitUntil(
            self.clients.matchAll().then(clients => {
                clients.forEach(client => client.postMessage({ type: 'SYNC_NOW' }));
            })
        );
    }
});
