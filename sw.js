// Offline support: keeps a copy of the app on the phone.
const CACHE="workouts-v1";
const SHELL=["./","index.html","workouts.js","manifest.webmanifest","icon-180.png","icon-192.png","icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
function timeout(ms){return new Promise((_,rej)=>setTimeout(()=>rej(new Error("timeout")),ms))}
self.addEventListener("fetch",e=>{
  const req=e.request;if(req.method!=="GET")return;
  const url=new URL(req.url);
  const fresh=req.mode==="navigate"||url.pathname.endsWith("/")||url.pathname.endsWith("index.html")||url.pathname.endsWith("workouts.js");
  if(fresh&&url.origin===location.origin){
    // Network first so new workouts show up; fall back to the saved copy offline.
    e.respondWith(Promise.race([fetch(req),timeout(4000)]).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));return res})
      .catch(()=>caches.match(req).then(r=>r||caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.match(req).then(r=>r||fetch(req).then(res=>{if(res.ok||res.type==="opaque"){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return res})));
});
