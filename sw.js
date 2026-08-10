const CACHE='prompt-ai-shell-v25';
const SHELL=['/','/index.html','/styles.css','/app.js','/cloud.js','/admin-console.js','/admin-console-core.js','/admin-ai-ui.js','/owner-access.js','/intro-flow-fix.js','/ui-regression-fixes.js','/project-start-ui.js','/stability-ui.js','/mode-flow-ui.js','/system-ai-routing.js','/preview-ai-admin.js','/system-ai-studio.js','/product-polish.js','/sandbox-preview.js','/workflow-cleanup.js','/generator-selection.js','/manifest.webmanifest','/sitebrief-logo.svg','/intro.mp4','/intro.webm'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==location.origin||new URL(event.request.url).pathname.startsWith('/api/'))return;
  event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response}).catch(()=>caches.match(event.request).then(hit=>hit||caches.match('/index.html'))));
});
