// Service Worker for パワーループPRO 在庫モニター
const CACHE_NAME = 'powerloop-monitor-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// インストール時にキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// アクティベート時に古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// フェッチ時の戦略: Network First → Cache Fallback
self.addEventListener('fetch', event => {
  // CORSプロキシへのリクエストはキャッシュしない
  if (event.request.url.includes('allorigins') ||
      event.request.url.includes('corsproxy')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// プッシュ通知を受信した場合
self.addEventListener('push', event => {
  const options = {
    body: 'パワーループPRO Mサイズの在庫が復活しました！',
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: 'stock-alert',
    requireInteraction: true,
    actions: [
      { action: 'open', title: '購入ページを開く' },
      { action: 'dismiss', title: '閉じる' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('🎉 在庫復活！パワーループPRO', options)
  );
});

// 通知クリック
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('https://shop.taitai.jp/?pid=179970628')
    );
  }
});
