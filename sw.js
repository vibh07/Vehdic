importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCr4X0JCSg3GOLTbltdWihl5a4GZs6ipq8",
  projectId: "vehdic",
  messagingSenderId: "544387227261",
  appId: "1:544387227261:web:0ab1783048eb866ce55b14"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: './logo.png', // Apna logo path daalo
    badge: './logo.png',
    vibrate:[200, 100, 200]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// TUMHARA BAAKI KA SW.JS CODE NICHE RAHEGA...
// // ── VEHDIC SERVICE WORKER — Cache First, Network Fallback ────────────────────
const CACHE = 'vehdic-v2';
const CORE = [
  './',
  './index.html',
  './script.js',
  './style.css',
  './manifest.json',
  './icon.png',
];

// On install — cache all core assets immediately
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

// On activate — delete old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - Core app files (html/js/css): Cache first, update in background (stale-while-revalidate)
// - Google Fonts / Firebase SDK: Cache first (they're versioned, safe to cache long)
// - Product images (anadi.co.in): Cache first, fallback to placeholder SVG
// - Firebase API calls (rtdb): Network only (must be live data)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Firebase Realtime DB & Auth API — always network, never cache
  if (url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('identitytoolkit') ||
      url.hostname.includes('securetoken.google.com') ||
      url.pathname.includes('/.lp')) {
    return; // let it go to network normally
  }

  // Firebase SDK + Google Fonts — cache forever (versioned URLs)
  if (url.hostname.includes('gstatic.com') ||
      url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(resp => {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return resp;
        });
      })
    );
    return;
  }

  // Product images — cache first, SVG placeholder on error
  if (url.hostname.includes('anadi.co.in') || e.request.destination === 'image') {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(resp => {
          if (resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return resp;
        }).catch(() => {
          // Return a warm placeholder SVG when offline
          return new Response(
            `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
              <rect width="400" height="400" fill="#f5ede0"/>
              <text x="200" y="215" font-size="80" text-anchor="middle">🌿</text>
              <text x="200" y="280" font-size="16" text-anchor="middle" fill="#b85c1a" font-family="sans-serif">Vehdic</text>
            </svg>`,
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        });
      })
    );
    return;
  }

  // Core app files — stale-while-revalidate
  e.respondWith(
    caches.match(e.request).then(cached => {
      const networkFetch = fetch(e.request).then(resp => {
        if (resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => cached); // if network fails, return cache
      // Return cache instantly, update in background
      return cached || networkFetch;
    })
  );
});
