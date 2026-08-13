(()=>{
  'use strict';
  // Die Navigation wird eine Schublade von links statt eines Kastens oben rechts.
  //
  // Wichtig ist, wie: es wird kein zweites Menü gebaut. Das bestehende #topbarMenu behält jeden
  // Knopf, jeden Handler und jede Tarif-Sperre - es bekommt nur eine andere Form und zwei fehlende
  // Einträge dazu. Ein nachgebautes Menü hätte bedeutet, jede Berechtigung ein zweites Mal zu
  // pflegen, und die zweite Kopie wäre die gewesen, die irgendwann falsch ist.
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const ICON=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${n}</svg>`;
  const ICONS={
    library:ICON('<path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>'),
    build:ICON('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18"/>'),
    check:ICON('<path d="M12 3l7 3v6c0 4-3 7-7 9c-4-2-7-5-7-9V6z"/><path d="M9 12l2 2l4-4"/>'),
    history:ICON('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 4v4h4"/><path d="M12 8v4l3 2"/>')
  };
  // Was in der Schublade oben stehen soll und welcher vorhandene Knopf es auslöst. Nur was im
  // Menü fehlt - Bibliotheken, Projekte und Projektstände liegen bereits drin.
  // Dieselben vier Wege wie die Werkzeugreihe der Startseite - sie lösen genau deren Knopf aus,
  // damit Tarifsperre und Ablauf an einer Stelle geprüft bleiben.
  const WORK=[
    ['Bibliothek','workspaceLibraryBtn',ICONS.library],
    ['Probelauf','workspaceBuildSiteBtn',ICONS.build],
    ['Projekt prüfen','workspacePreviewBtn',ICONS.check],
    ['Verlauf','projectHistoryBtn',ICONS.history]
  ];

  function styles(){
    if($('#promptNavDrawerStyles'))return;
    const s=document.createElement('style');s.id='promptNavDrawerStyles';s.textContent=`
      html.prompt-full-redesign .topbar-menu{
        position:fixed!important;inset:0 auto 0 0!important;top:0!important;bottom:0!important;left:0!important;right:auto!important;
        z-index:2147482900!important;display:flex!important;flex-direction:column!important;gap:0!important;
        width:min(320px,86vw)!important;max-height:none!important;height:100dvh!important;
        padding:0!important;border:0!important;border-right:1px solid var(--line)!important;border-radius:0!important;
        background:var(--surface)!important;box-shadow:none!important;overflow:hidden!important;
        transform:translateX(-101%);transition:transform var(--t-slow,260ms) var(--ease,ease);
        visibility:hidden;
      }
      html.prompt-full-redesign .topbar-menu.open,
      html.prompt-full-redesign .topbar-menu[data-open="true"]{
        display:flex!important;transform:none;visibility:visible;animation:none!important;
      }
      /* Der Kopf trägt die Marke, damit die Schublade nicht wie ein Kontextmenü wirkt. */
      html.prompt-full-redesign .topbar-menu:before{
        content:'PROMPT.AI';flex:0 0 auto;display:block;
        padding:22px 20px 14px;border-bottom:1px solid var(--line);
        color:var(--logo-blue,var(--accent));font:850 10px/1 ui-monospace,SFMono-Regular,monospace;letter-spacing:.16em;
      }
      /* Ein Fluss statt Container: die Reihenfolge kommt aus order, damit kein Knoten
         umgehängt werden muss. Alles scrollt, Profil und Abmelden stehen unten fest. */
      html.prompt-full-redesign .topbar-menu>*{flex:0 0 auto}
      html.prompt-full-redesign .topbar-menu{padding:0 10px 10px!important;overflow-y:auto!important;overscroll-behavior:contain}
      html.prompt-full-redesign .topbar-menu button:not([hidden]),
      html.prompt-full-redesign .topbar-menu a:not([hidden]){
        display:flex!important;align-items:center!important;gap:11px!important;
        width:100%!important;min-height:46px!important;padding:0 12px!important;
        border:0!important;border-radius:8px!important;background:transparent!important;
        color:var(--ink)!important;font-size:14px!important;font-weight:650!important;text-align:left!important;
        justify-content:flex-start!important;
      }
      html.prompt-full-redesign .topbar-menu button:hover:not(:disabled){background:var(--surface-soft)!important}
      html.prompt-full-redesign .topbar-menu button svg{flex:0 0 auto;width:19px;height:19px;color:var(--logo-blue,var(--accent))}
      /* Einträge ohne Symbol (Projekte, Einstellungen, Abmelden ...) begannen 30px
         weiter links als die mit - die Schrift steht jetzt bei allen auf einer Linie.
         Ihnen Symbole einzusetzen hieße, in fremde Knöpfe zu schreiben, deren Text
         andere Ebenen laufend neu setzen. */
      html.prompt-full-redesign .topbar-menu>button:not(:has(svg)):not(#accountBtn):not(.upgrade-btn){padding-left:42px!important}
      /* Profil ist der eine Knopf unten - Einstellungen und Abmelden hängen daran. */
      html.prompt-full-redesign .topbar-menu #accountBtn:not([hidden]){
        margin-top:auto!important;min-height:56px!important;
        border:1px solid var(--line)!important;background:var(--surface-soft)!important;
      }
      html.prompt-full-redesign .topbar-menu>button.prompt-drawer-out{color:var(--danger)!important}
      html.prompt-full-redesign .topbar-menu .prompt-drawer-legal,
      html.prompt-full-redesign .topbar-menu>div:has(>button.prompt-drawer-legal){
        display:flex!important;flex-wrap:wrap!important;gap:0 14px!important;
        width:auto!important;min-height:0!important;padding:8px 12px 0!important;
        border-top:1px solid var(--line)!important;background:transparent!important;
      }
      html.prompt-full-redesign .topbar-menu .prompt-drawer-legal button,
      html.prompt-full-redesign .topbar-menu .prompt-drawer-legal a,
      html.prompt-full-redesign .topbar-menu>button.prompt-drawer-legal{
        width:auto!important;min-height:32px!important;padding:0!important;
        font-size:11px!important;font-weight:600!important;color:var(--muted)!important;
      }
      /* Der Vorhang schließt die Schublade und dunkelt den Rest ab. */
      html.prompt-full-redesign .topbar-menu-backdrop:not([hidden]){
        position:fixed!important;inset:0!important;z-index:2147482800!important;display:block!important;
        background:var(--scrim)!important;backdrop-filter:blur(2px)!important;
        animation:promptBackdropIn var(--t-base,180ms) var(--ease,ease) both;
      }
      @media(prefers-reduced-motion:reduce){html.prompt-full-redesign .topbar-menu{transition:none}}
    `;document.head.appendChild(s);
  }

  // Kein Knopf wird verschoben. Der erste Versuch hat die vorhandenen Einträge in neue Container
  // umgehängt - und prompt eine Ausnahme ausgelöst: andere Skripte fügen ihre Einträge relativ zu
  // diesen Knoten ein (insertBefore), und deren Bezugspunkt war plötzlich kein direktes Kind des
  // Menüs mehr. Die Reihenfolge macht jetzt CSS über `order`, die Knöpfe bleiben, wo sie sind.
  const ORDER={accountBtn:90,openSettingsBtn:60,themeToggleBtn:61,adminBtn:65,subscriptionMenuBtn:55,installAppBtn:70,upgradeMenuBtn:50,resetBtn:75};
  function sortEntry(node){
    const text=(node.textContent||'').trim();
    if(node.dataset.drawerTarget)return 10;          // die vier Arbeitswege zuerst
    if(node.id&&ORDER[node.id]!==undefined)return ORDER[node.id];
    if(/impressum|datenschutz|nutzungsbedingungen|agb|cookies/i.test(text))return 95;
    if(/^abmelden$/i.test(text))return 99;
    if(/bibliothek|projekt/i.test(text))return 20;   // Projekte, Projektstände
    return 50;
  }
  function shell(){
    const menu=$('#topbarMenu');if(!menu)return false;
    // Die zwei fehlenden Arbeitswege: sie klicken den echten Knopf der Startseite, damit
    // Tarifsperre und Ablauf dort bleiben, wo sie schon geprüft werden.
    for(const [label,targetId,icon] of WORK){
      if($(`[data-drawer-target="${targetId}"]`,menu))continue;
      // Kein zweiter Eintrag für etwas, das das Menü schon führt.
      if($$(':scope > button',menu).some(b=>b.textContent.trim().toLowerCase()===label.toLowerCase()))continue;
      const button=document.createElement('button');
      button.type='button';button.className='text-btn';button.dataset.drawerTarget=targetId;
      button.innerHTML=`${icon}<span>${label}</span>`;
      button.addEventListener('click',()=>{close();setTimeout(()=>$('#'+targetId)?.click(),60)});
      menu.appendChild(button);
    }
    for(const node of $$(':scope > *',menu)){
      const rank=sortEntry(node);
      node.style.order=String(rank);
      node.classList.toggle('prompt-drawer-legal',rank===95);
      node.classList.toggle('prompt-drawer-out',rank===99);
    }
    return true;
  }

  const backdrop=()=>$('#topbarMenuBackdrop')||$('.topbar-menu-backdrop');
  function close(){
    const menu=$('#topbarMenu');if(!menu)return;
    menu.classList.remove('open');menu.removeAttribute('data-open');
    const b=backdrop();if(b)b.hidden=true;
    document.documentElement.classList.remove('prompt-drawer-open');
  }
  function bind(){
    // Esc und der Vorhang schließen; sonst bleibt die Schublade offen, weil sie kein Dialog ist.
    document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
    document.addEventListener('click',e=>{if(e.target.closest?.('.topbar-menu-backdrop'))close()},true);
    document.addEventListener('click',e=>{
      const inside=e.target.closest?.('#topbarMenu');
      if(inside&&e.target.closest('button,a')&&!e.target.closest('.theme-toggle'))setTimeout(close,40);
    },false);
    new MutationObserver(()=>{
      const menu=$('#topbarMenu');if(!menu)return;
      document.documentElement.classList.toggle('prompt-drawer-open',menu.classList.contains('open'));
    }).observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['class','data-open']});
  }
  // Andere Ebenen hängen ihre Einträge später ein - ohne Nachsortieren stünden die ganz oben,
  // weil sie keinen order-Wert haben und 0 vor 10 kommt.
  function watch(){
    const menu=$('#topbarMenu');if(!menu)return;
    let pending=0;
    new MutationObserver(()=>{clearTimeout(pending);pending=setTimeout(shell,60)}).observe(menu,{childList:true});
  }
  function init(){styles();shell();watch();bind();let n=0;const t=setInterval(()=>{shell();if(++n>12)clearInterval(t)},400)}
  window.PromptAiNavDrawer={close};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
