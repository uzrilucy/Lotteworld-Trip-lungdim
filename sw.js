/* 롯데월드 여행수첩 - 오프라인 캐시 */
var VERSION = "lw-trip-v2-1";
var SHELL = ["./", "index.html", "manifest.webmanifest", "vendor/leaflet.js", "vendor/leaflet.css",
             "icons/icon-192.png", "icons/icon-512.png", "icons/icon-180.png"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION && k !== "lw-tiles"; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  // 지도 타일: 한 번 본 곳은 저장해 두고, 통신이 느릴 때 다시 사용
  if (url.hostname === "tile.openstreetmap.org") {
    e.respondWith(caches.open("lw-tiles").then(function (c) {
      return c.match(req).then(function (hit) {
        return hit || fetch(req).then(function (res) { c.put(req, res.clone()); return res; });
      });
    }));
    return;
  }
  if (url.origin !== self.location.origin) return;
  // 앱 파일: 네트워크 우선(새 버전 반영), 실패하면 저장본
  e.respondWith(fetch(req).then(function (res) {
    var copy = res.clone();
    caches.open(VERSION).then(function (c) { c.put(req, copy); });
    return res;
  }).catch(function () {
    return caches.match(req).then(function (hit) { return hit || caches.match("index.html"); });
  }));
});
