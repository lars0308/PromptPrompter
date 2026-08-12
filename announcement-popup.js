(()=>{
  'use strict';
  // Admin announcements used to stack as small toasts in the bottom right corner, where they were
  // easy to miss. They now open as one large dialog per announcement. Dismissing closes it for
  // this app session; opening the app (or the page) again brings it back until the admin removes
  // the announcement in the admin settings. sessionStorage is exactly the right scope: it survives
  // the internal reload the app does when a project starts, so coming back to the start page never
  // re-opens a notice the visitor already read.
  const SEEN_KEY='prompt-ai-announcement-seen-v1';
  const EYEBROWS={info:'MITTEILUNG',success:'NEU',warning:'WICHTIG',critical:'ACHTUNG'};
  const LEVELS=['info','success','warning','critical'];
  const MAX_WAIT_MS=180000;
  let queue=[],dialog=null,current=null,waiting=0,waitUntil=0;

  const seen=()=>{try{return new Set(JSON.parse(sessionStorage.getItem(SEEN_KEY)||'[]'))}catch{return new Set()}};
  const remember=id=>{try{const set=seen();set.add(String(id));sessionStorage.setItem(SEEN_KEY,JSON.stringify([...set]))}catch{}};

  function styles(){
    if(document.getElementById('announcementPopupStyles'))return;
    const s=document.createElement('style');s.id='announcementPopupStyles';
    // Several polish layers stretch every dialog to the full viewport, so this one centres its card
    // inside whatever box it is given instead of relying on the dialog element's own size.
    s.textContent=`#announcementDialog.announcement-dialog{display:none;padding:18px!important;border:0!important;border-radius:0!important;background:transparent!important;color:var(--ink);box-shadow:none!important}#announcementDialog.announcement-dialog[open]{display:grid!important;place-items:center!important}.announcement-dialog::backdrop{background:color-mix(in srgb,var(--ink) 46%,transparent);backdrop-filter:blur(6px)}.announcement-shell{position:relative;display:grid;gap:14px;width:min(560px,100%);max-height:calc(100dvh - 36px);overflow:auto;padding:38px 32px 32px;border:1px solid var(--line);border-top:4px solid var(--announcement-accent,var(--accent));border-radius:20px;background:var(--paper);box-shadow:0 28px 70px rgba(12,20,26,.24);text-align:center}.announcement-close{position:absolute;top:12px;right:12px;width:40px;height:40px;border:1px solid var(--line);border-radius:50%;background:var(--surface);color:var(--ink);font-size:22px;line-height:1;cursor:pointer}.announcement-eyebrow{color:var(--announcement-accent,var(--accent));font-size:10px;font-weight:850;letter-spacing:.14em}.announcement-shell h2{margin:0;font-size:clamp(24px,5.4vw,32px);line-height:1.15;letter-spacing:-.03em}.announcement-shell p{margin:0;color:var(--muted);font-size:14px!important;line-height:1.6;white-space:pre-line}.announcement-accept{width:100%;margin-top:8px}#announcementDialog[open] .announcement-shell{animation:announcementPop .24s cubic-bezier(.2,.8,.3,1)}@keyframes announcementPop{from{opacity:0;transform:translateY(14px) scale(.96)}to{opacity:1;transform:none}}@media(prefers-reduced-motion:reduce){#announcementDialog[open] .announcement-shell{animation:none}}@media(max-width:560px){.announcement-shell{padding:34px 20px 24px}}`;
    document.head.appendChild(s);
  }
  function build(){
    if(dialog)return dialog;
    styles();
    dialog=document.createElement('dialog');
    dialog.id='announcementDialog';
    dialog.className='announcement-dialog';
    dialog.innerHTML='<div class="announcement-shell"><button type="button" class="announcement-close" aria-label="Mitteilung schließen">×</button><span class="announcement-eyebrow">MITTEILUNG</span><h2></h2><p></p><button type="button" class="solid-btn announcement-accept">Verstanden</button></div>';
    document.body.appendChild(dialog);
    dialog.querySelector('.announcement-close').addEventListener('click',()=>dialog.close());
    dialog.querySelector('.announcement-accept').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
    dialog.addEventListener('close',()=>{if(current){remember(current.id);current=null}if(!queue.length)return;waitUntil=Date.now()+MAX_WAIT_MS;setTimeout(whenVisible,220)});
    return dialog;
  }
  function next(){
    if(current||!queue.length)return;
    const item=queue.shift();
    const box=build();
    current=item;
    const level=LEVELS.includes(item.level)?item.level:'info';
    box.dataset.level=level;
    box.querySelector('.announcement-shell').style.setProperty('--announcement-accent',level==='critical'?'#d75245':level==='warning'?'#d99a32':level==='success'?'#4c9a68':'var(--accent)');
    box.querySelector('.announcement-eyebrow').textContent=EYEBROWS[level];
    box.querySelector('h2').textContent=item.title||'Mitteilung';
    box.querySelector('p').textContent=item.body||'';
    try{box.showModal()}catch{current=null}
  }
  // Two things have to be out of the way first: the boot screen (it hides everything else) and the
  // gates that open after this one would - the cookie consent and the maintenance blocker. A dialog
  // opened later lands above this one in the top layer, which would leave an unreachable
  // announcement underneath. Anything already open (the account/login dialog) is fine: showModal()
  // puts the announcement on top of it. Waiting is bounded - if a gate stays open for minutes, the
  // announcement simply returns on the next app open.
  function whenVisible(){
    clearTimeout(waiting);
    if(Date.now()>waitUntil)return;
    const blocked=document.documentElement.classList.contains('prompt-app-booting')||document.querySelector('#cookieBanner[open],#maintenanceDialog[open]');
    if(blocked){waiting=setTimeout(whenVisible,300);return}
    next();
  }
  function accept(list){
    const dismissed=seen();
    queue=(Array.isArray(list)?list:[]).filter(item=>item&&item.id&&!dismissed.has(String(item.id))&&(item.title||item.body));
    if(!queue.length)return;
    waitUntil=Date.now()+MAX_WAIT_MS;
    whenVisible();
  }
  window.addEventListener('promptai:announcements',event=>accept(event.detail?.announcements));
  // The fetch may have resolved before this script was parsed.
  if(window.PromptAiAnnouncements)accept(window.PromptAiAnnouncements);
})();
