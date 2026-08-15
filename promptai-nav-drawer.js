(()=>{
  'use strict';
  // Die Navigation wird eine Schublade von links statt eines Kastens oben rechts.
  //
  // Wichtig ist, wie: es wird kein zweites Menü gebaut. Das bestehende #topbarMenu behält jeden
  // Knopf, jeden Handler und jede Tarif-Sperre - es bekommt nur eine andere Form und zwei fehlende
  // Einträge dazu. Ein nachgebautes Menü hätte bedeutet, jede Berechtigung ein zweites Mal zu
  // pflegen, und die zweite Kopie wäre die gewesen, die irgendwann falsch ist.
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  // Nur was im Menü wirklich fehlt, und es löst den echten Knopf der Startseite aus, damit
  // Tarifsperre und Ablauf an einer Stelle geprüft bleiben. "Bibliothek" und "Verlauf"
  // standen hier doppelt: sie öffnen dieselben Fenster wie die vorhandenen Einträge
  // "Projekte" und "Projektstände". "Projekt prüfen" ist in die Auswahlliste am Textfeld
  // gewandert.
  const WORK=[
    ['Probelauf','workspaceBuildSiteBtn']
  ];

  function styles(){
    if($('#promptNavDrawerStyles'))return;
    const s=document.createElement('style');s.id='promptNavDrawerStyles';s.textContent=`
      /* Die Schublade liegt ueber der Kopfzeile - damit lag sie auch ueber ihrem eigenen Knopf,
         und ein zweiter Klick darauf kam nie an. Zu ging sie dann nur mit Esc oder ueber den
         Vorhang, obwohl jeder zuerst denselben Knopf noch einmal drueckt. Der Knopf liegt jetzt
         darueber und schliesst wieder, was er geoeffnet hat. */
      html.prompt-full-redesign #topbarMenuToggle{z-index:2147483003!important}
      html.prompt-full-redesign .prompt-drawer-close{
        position:absolute!important;top:10px!important;right:12px!important;z-index:3!important;
        width:38px!important;height:38px!important;min-height:38px!important;padding:0!important;
        border:1px solid var(--line)!important;border-radius:11px!important;
        background:var(--surface)!important;color:var(--ink)!important;
        font:700 19px/1 Arial,Helvetica,sans-serif!important;cursor:pointer!important;
      }
      html.prompt-full-redesign .topbar-menu{
        position:fixed!important;inset:0 0 0 auto!important;top:0!important;bottom:0!important;right:0!important;left:auto!important;
        z-index:2147483001!important;display:flex!important;flex-direction:column!important;gap:0!important;
        width:min(320px,86vw)!important;max-height:none!important;height:100dvh!important;
        padding:0!important;border:0!important;border-left:1px solid var(--line)!important;border-radius:0!important;
        background:var(--surface)!important;box-shadow:none!important;overflow:hidden!important;
        transform:translateX(101%);transition:transform var(--t-slow,260ms) var(--ease,ease);
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
      /* "Projekte" und "Bibliothek" öffneten dasselbe Fenster - der doppelte Eintrag verschwindet
         hier, weil die Regel darüber jeden sichtbaren Knopf mit !important auf display:flex setzt. */
      html.prompt-full-redesign .topbar-menu button[data-drawer-hidden="1"]{display:none!important}
      /* Keine Symbole in der Schublade: zwei Zeichen unter zehn Wörtern sahen aus wie
         Reste, nicht wie System. Jetzt beginnt jede Zeile auf derselben Linie. */
      html.prompt-full-redesign .topbar-menu button svg{display:none!important}
      /* Der Schalter für Hell/Dunkel steht in promptai-full-app-design.css: diese Ebene
         wird als <link> nach diesem <style> eingehängt und gewinnt jeden Gleichstand. */
      /* Profil ist der eine Knopf unten - Einstellungen und Abmelden hängen daran. */
      html.prompt-full-redesign .topbar-menu #accountBtn:not([hidden]){
        margin-top:auto!important;min-height:56px!important;
        border:1px solid var(--line)!important;background:var(--surface-soft)!important;
      }
      /* app.js hängt unter "Profil" eine zweite Zeile mit dem angemeldeten Konto. Seit der
         Eintrag ein Flex-Element ist, stand sie als zweites Element in derselben Zeile und wurde
         auf null Breite gequetscht - also war nirgends mehr zu sehen, wer angemeldet ist. Sie
         bekommt eine eigene Zeile zurück. */
      /* justify-content:center kam aus der Knopf-Grundregel und blieb hier stehen: "Profil" stand
         als einziger Eintrag mittig, während alle anderen links auf einer Linie beginnen. */
      /* In der Zeile nebeneinander liefen Beschriftung und Kontozeile ueber den Knopf hinaus und
         standen mittig - justify-content wollte hier partout nicht greifen. Als Spalte ist die
         Frage erledigt: align-items bestimmt die Ausrichtung, und die beiden Zeilen stehen
         untereinander links, wie jeder andere Eintrag. */
      html.prompt-full-redesign .topbar-menu #accountBtn:not([hidden]){
        display:flex!important;flex-direction:column!important;flex-wrap:nowrap!important;
        align-items:flex-start!important;justify-content:center!important;
        gap:2px!important;text-align:left!important;
        padding-top:8px!important;padding-bottom:8px!important;
      }
      /* flex:1 hat die freie Breite nicht aufgenommen - die Zeile blieb mittig. Volle Breite
         beendet die Diskussion: der Text beginnt links wie in jeder anderen Zeile. */
      html.prompt-full-redesign .topbar-menu #accountBtn .prompt-drawer-account-label{
        width:100%!important;text-align:left!important;
      }
      html.prompt-full-redesign .topbar-menu #accountBtn .account-btn-meta{
        display:block!important;width:100%!important;margin-top:0!important;text-align:left!important;
        color:var(--muted)!important;font-size:10px!important;font-weight:600!important;
        overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;
      }
      html.prompt-full-redesign .topbar-menu>button.prompt-drawer-out{color:var(--danger)!important}
      /* Gesperrte Einträge verschwinden nicht mehr - man sieht, dass es sie gibt, und woran es
         liegt. Der Tarif steht rechts, wie im Ablauf-Menü der Konsole. */
      html.prompt-full-redesign .topbar-menu button[data-drawer-tier]:after{
        content:attr(data-drawer-tier);margin-left:auto;
        color:var(--upgrade,#e9781f)!important;font-size:9px;font-weight:900;letter-spacing:.1em;
      }
      html.prompt-full-redesign .topbar-menu button[data-drawer-tier]{color:var(--muted)!important}
      /* Ein neuer Support-Eingang bekommt einen Punkt - im Menü und am Eintrag selbst. */
      html.prompt-full-redesign .topbar-menu button[data-drawer-dot="1"]:after{
        content:'';margin-left:auto;width:9px;height:9px;border-radius:50%;
        background:var(--logo-blue,var(--accent))!important;
      }
      html.prompt-full-redesign #topbarMenuToggle.prompt-drawer-has-dot:after{
        content:'';position:absolute;top:6px;right:6px;width:9px;height:9px;border-radius:50%;
        background:var(--logo-blue,var(--accent));
      }
      /* Kein position:relative hier. Der Knopf ist bereits absolut in der Kopfzeile platziert und
         damit Bezugsrahmen genug für den Punkt. Ein position:relative mit einer Klasse mehr im
         Selektor schlug die absolute Platzierung und schob den Knopf aus der Kopfzeile heraus -
         sichtbar wurde das erst, sobald der Punkt tatsächlich erschien. */
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
  const ORDER={accountBtn:90,openSettingsBtn:60,themeToggleBtn:61,adminBtn:65,menuSupportBtn:66,subscriptionMenuBtn:55,installAppBtn:70,upgradeMenuBtn:50,resetBtn:75};
  function sortEntry(node){
    const text=(node.textContent||'').trim();
    if(node.dataset.drawerTarget)return 10;          // die vier Arbeitswege zuerst
    if(node.id&&ORDER[node.id]!==undefined)return ORDER[node.id];
    if(/impressum|datenschutz|nutzungsbedingungen|agb|cookies/i.test(text))return 95;
    if(/^abmelden$/i.test(text))return 99;
    if(/bibliothek|projekt/i.test(text))return 20;   // Projekte, Projektstände
    return 50;
  }
  // Support lag als vierter Block unten im Profil, wo ihn niemand sucht. Er wird ein eigener
  // Menüpunkt - und zwar derselbe Abschnitt, nicht eine zweite Kopie des Formulars: der Eintrag
  // öffnet das Profil und klappt den vorhandenen Support-Block auf.
  function supportEntry(menu){
    if($('#menuSupportBtn',menu))return;
    const account=$('#accountBtn');if(!account)return;
    const button=document.createElement('button');
    button.type='button';button.className='text-btn';button.id='menuSupportBtn';button.textContent='Support';
    button.addEventListener('click',()=>{
      close();
      setTimeout(()=>{
        $('#accountBtn')?.click();
        setTimeout(()=>{
          const card=document.querySelector('.account-support-card');if(!card)return;
          // Beim Oeffnen gleich die eigenen Anfragen samt Antwort nachladen.
          window.PromptAiSupport?.refresh?.();
          // Der Block ist eingeklappt (collapseSections) - erst öffnen, dann hinscrollen.
          const head=card.querySelector('.account-section-head, :scope > div:first-child');
          if(card.dataset.collapsed==='1'||card.classList.contains('is-collapsed'))head?.click();
          card.scrollIntoView({behavior:'smooth',block:'center'});
          document.querySelector('#supportSubject')?.focus({preventScroll:true});
        },260);
      },80);
    });
    menu.appendChild(button);
  }

  // Gesperrt heißt sichtbar-mit-Grund: die Startseiten-Kacheln führen den nötigen Tarif bereits
  // in data-plan-label, also wird genau der gespiegelt statt hier ein zweites Mal gepflegt.
  function lockFromTarget(button,target){
    const locked=Boolean(target&&(target.disabled||target.getAttribute('aria-disabled')==='true'||target.classList.contains('home-plan-locked')));
    const tier=String(target?.dataset.planLabel||'PRO');
    if(locked)button.dataset.drawerTier=`ab ${tier.charAt(0)+tier.slice(1).toLowerCase()}`;
    else delete button.dataset.drawerTier;
    return locked;
  }
  // Alle anderen Einträge tragen ihren Text in einem <span>. Der Kontoeintrag trägt ihn als
  // nackten Textknoten, und der wird im Flex-Container zu einem anonymen Element, das sich der
  // Ausrichtung der übrigen Zeilen entzieht - deshalb stand "Profil" als einziges mittig.
  // Ein echtes <span> reiht sich ein wie der Rest.
  function wrapAccountLabel(){
    const button=$('#accountBtn');if(!button)return;
    for(const node of [...button.childNodes]){
      if(node.nodeType!==3)continue;
      const text=node.textContent.trim();
      if(!text){node.remove();continue}
      const span=document.createElement('span');
      span.className='prompt-drawer-account-label';span.textContent=text;
      button.replaceChild(span,node);
    }
  }
  // Die Schublade legt sich ueber die ganze rechte Seite - also auch ueber ihren eigenen Knopf.
  // Ein zweiter Klick darauf landet deshalb auf der Schublade und tut nichts, und auf dem Telefon
  // gibt es kein Esc. Sie bekommt darum ein eigenes Kreuz, genau dort, wo der Knopf war.
  function ensureCloseButton(menu){
    if($('#promptDrawerClose',menu))return;
    const button=document.createElement('button');
    button.type='button';button.id='promptDrawerClose';button.className='prompt-drawer-close';
    button.setAttribute('aria-label','Menü schließen');button.textContent='×';
    button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();close()});
    menu.prepend(button);
  }
  function shell(){
    const menu=$('#topbarMenu');if(!menu)return false;
    ensureCloseButton(menu);
    wrapAccountLabel();
    // Die zwei fehlenden Arbeitswege: sie klicken den echten Knopf der Startseite, damit
    // Tarifsperre und Ablauf dort bleiben, wo sie schon geprüft werden.
    for(const [label,targetId] of WORK){
      if($(`[data-drawer-target="${targetId}"]`,menu))continue;
      // Kein zweiter Eintrag für etwas, das das Menü schon führt.
      if($$(':scope > button',menu).some(b=>b.textContent.trim().toLowerCase()===label.toLowerCase()))continue;
      const button=document.createElement('button');
      button.type='button';button.className='text-btn';button.dataset.drawerTarget=targetId;
      button.innerHTML=`<span>${label}</span>`;
      button.addEventListener('click',()=>{
        const target=$('#'+targetId);
        // Gesperrt: der Tarif-Dialog ist die ehrliche Antwort, nicht ein Knopf, der nichts tut.
        if(lockFromTarget(button,target)){close();setTimeout(()=>document.querySelector('#plansDialog')?.showModal(),80);return}
        close();setTimeout(()=>target?.click(),60);
      });
      menu.appendChild(button);
    }
    // Den Tarifhinweis nach jedem Durchlauf frisch stellen - der Tarif kann sich zur Laufzeit
    // ändern (Login, Upgrade), und dann stimmt das Schild sonst nicht mehr.
    for(const [,targetId] of WORK){
      const entry=$(`[data-drawer-target="${targetId}"]`,menu);
      if(entry)lockFromTarget(entry,$('#'+targetId));
    }
    supportEntry(menu);
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
    // Der Vorhang heisst nicht ueberall gleich: die Schublade legt .topbar-menu-backdrop an, eine
    // spaetere Ebene #promptFinalMenuBackdrop - und auf den hoerte niemand. Ergebnis: bei offenem
    // Menue schloss kein Klick mehr, und auf dem Telefon gibt es kein Esc. Deshalb schliesst jetzt
    // jeder Klick ausserhalb der Schublade; der eigene Knopf bleibt aussen vor, der schaltet selbst.
    document.addEventListener('click',e=>{
      const menu=$('#topbarMenu');
      if(!menu||!menu.classList.contains('open'))return;
      if(e.target.closest?.('#topbarMenu'))return;
      // Der eigene Knopf oeffnet nur, er schaltet nicht um - deshalb schliesst er hier, bevor
      // sein Oeffnen-Handler ueberhaupt dran ist. Sonst ginge die Schublade auf und sofort wieder
      // auf, und der zweite Klick faende nie ein Ende.
      if(e.target.closest?.('#topbarMenuToggle')){e.preventDefault();e.stopPropagation()}
      close();
    },true);
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
  // Der Punkt am Verwaltungs-Eintrag ist im geschlossenen Menü nicht zu sehen - deshalb trägt
  // ihn der Menüknopf in der Kopfzeile mit, solange eine Anfrage offen ist.
  function supportDot(open){
    const toggle=$('#topbarMenuToggle');
    if(toggle)toggle.classList.toggle('prompt-drawer-has-dot',Boolean(open));
  }
  function init(){styles();shell();watch();bind();
    window.addEventListener('promptai:support-open',event=>supportDot(Number(event.detail?.open)>0));
    let n=0;const t=setInterval(()=>{shell();if(++n>12)clearInterval(t)},400)}
  window.PromptAiNavDrawer={close};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
