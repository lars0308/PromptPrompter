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
  function init(){shell();watch();bind();
    window.addEventListener('promptai:support-open',event=>supportDot(Number(event.detail?.open)>0));
    let n=0;const t=setInterval(()=>{shell();if(++n>12)clearInterval(t)},400)}
  window.PromptAiNavDrawer={close};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
