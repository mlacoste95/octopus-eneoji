var CACHE_NAME = "octopus-shell-v16";
var PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "https://cdn.jsdelivr.net/npm/firebase@10.14.1/firebase-app-compat.js",
  "https://cdn.jsdelivr.net/npm/firebase@10.14.1/firebase-auth-compat.js",
  "https://cdn.jsdelivr.net/npm/firebase@10.14.1/firebase-firestore-compat.js",
  "https://cdn.jsdelivr.net/npm/firebase@10.14.1/firebase-storage-compat.js"
];

self.addEventListener("install", function(event){
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(PRECACHE_URLS);
    })
  );
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(names.filter(function(n){ return n !== CACHE_NAME; }).map(function(n){ return caches.delete(n); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(event){
  var req = event.request;
  if(req.method !== "GET") return;

  var isNavigation = req.mode === "navigate";
  // Only handle the app shell itself and the precached CDN scripts.
  // Everything else (Firestore, Storage, Auth, any other API call) must
  // pass straight through untouched, or Firebase's own offline/retry
  // handling breaks.
  if(!isNavigation && PRECACHE_URLS.indexOf(req.url) === -1) return;

  var cacheKey = isNavigation ? "./index.html" : req;

  event.respondWith(
    caches.match(cacheKey).then(function(cached){
      var fetchPromise = fetch(req).then(function(response){
        if(response && response.status === 200){
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(cacheKey, copy); });
        }
        return response;
      }).catch(function(){ return cached; });
      return cached || fetchPromise;
    })
  );
});
