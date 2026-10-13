const CACHE='hayra-reader-v3';
const pages=Array.from({length:34},(_,i)=>'./pages/page-'+String(i+1).padStart(2,'0')+'.jpg');
const audio=Array.from({length:34},(_,i)=>'./audio/page-'+String(i+1).padStart(2,'0')+'.mp3');
const ASSETS=['./','./index.html'].concat(pages,audio);
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{}).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(cached=>cached||fetch(e.request).then(res=>{if(res&&res.ok&&res.type==='basic'){const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return res}).catch(()=>caches.match('./index.html'))))});
