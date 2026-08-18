(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const SIMPLE_START_KEY='prompt-ai-v1-simple-start';
  const FRESH_WEBSITE_KEY='prompt-ai-fresh-website-v1';
  const PREVIEW_MANUAL_KEY='prompt-ai-preview-format-manual-v1';
  // 'referenzen' faellt aus der sichtbaren Reihe: die Anhaenge kommen von der Startseite.
  const FLOW_ORDER=['beschreibung','rueckmeldung','vorschau','feinschliff','prompt'];
  let settleTimer=0;
  const setText=(node,value)=>{if(node&&node.textContent!==value)node.textContent=value};

  const currentMode=()=>$('.mode-switch button.active')?.dataset.mode||document.documentElement.dataset.promptMode||'guided';
  const currentStep=()=>Number($('.step-panel.active')?.dataset.stepPanel||0);
  const simpleMode=()=>['guided','auto'].includes(currentMode());
  const workflowVisible=()=>Boolean($('#workflowApp')&&!$('#workflowApp').hidden);


  function shortHome(){
    const wrap=$('.welcome-hero')?.firstElementChild;if(!wrap)return;
    let welcome=$('.home-welcome',wrap);if(!welcome){welcome=document.createElement('p');welcome.className='home-welcome';wrap.insertBefore(welcome,wrap.firstChild)}
    const name=$('#userDisplayName')?.value?.trim()||String(window.SiteBriefCloud?.user?.user_metadata?.display_name||window.SiteBriefCloud?.user?.user_metadata?.name||'').trim();
    setText(welcome,window.SiteBriefCloud?.user?(name?`Willkommen zurück, ${name.split(/\s+/)[0]}.`:'Willkommen zurück.'):'Willkommen bei Prompt.ai.');
    setText($('.home-intro-copy',wrap),'Wähle, was du erstellen möchtest.');
    const copies={workspaceNewProjectBtn:['Internetseite erstellen','Website beschreiben, Rückfragen klären, Vorschau wählen.'],workspaceFreePromptBtn:['Freier Prompt','Text, Bild, Video, Musik, Präsentation, Code & mehr.'],workspaceRevisionBtn:['Website überarbeiten','Bestehende Seite gezielt ändern.'],workspacePreviewBtn:['Projekt prüfen','Gebautes Projekt als Vorschau prüfen.'],workspaceLastProjectBtn:['Letztes Projekt','Gespeicherten Stand fortsetzen.'],workspaceLibraryBtn:['Bibliothek','Vorlagen, Module, Skills & Projekte.']};
    for(const [id,[title,sub]] of Object.entries(copies)){const button=$(`#${id}`);if(!button)continue;setText($('strong',button),title);setText($('small',button),sub)}
    setText($('#homeTierNote'),(window.PromptAiAccess?.plan||'free')==='free'?'Weitere Werkzeuge sind ab Pro verfügbar.':'Deine freigeschalteten Werkzeuge sind bereit.');
  }

  function shortModeChoice(){
    const dialog=$('#projectModeDialog');if(!dialog)return;
    const copy={guided:'Nur wichtige Rückfragen. Die Vorschau bleibt deine Entscheidung.',auto:'Prompt.ai entscheidet die Details und führt dich schnell zur Vorschau.',expert:'Alle Einstellungen selbst steuern.'};
    $$('[data-project-mode]',dialog).forEach(button=>setText($('small',button),copy[button.dataset.projectMode]||''));
  }

  function shortIntake(){
    const dialog=$('#simpleIntakeDialog');if(!dialog)return;
    const website=/INTERNETSEITE/i.test($('#simpleIntakeKicker')?.textContent||'');
    setText($('#simpleIntakeLead'),website?'Beschreib kurz, was entstehen soll. Danach kommen Referenzen und nur nötige Rückfragen.':'Beschreib kurz dein Ziel. Prompt.ai zeigt danach nur passende Einstellungen.');
    setText($('#simpleIntakeExample'),website?'Tipp: Branche, Ort, Stil, Farben und wichtige Funktionen kannst du direkt hier nennen.':'Stichpunkte reichen.');
  }

  function validateSimpleIntake(event){
    if(!event.target.closest?.('#simpleIntakeContinue'))return;
    const website=/INTERNETSEITE/i.test($('#simpleIntakeKicker')?.textContent||''),text=$('#simpleIntakeText')?.value.trim()||'';
    if(!$('#simpleIntakeDialog')?.open||!website||text.length>=20)return;
    event.preventDefault();event.stopImmediatePropagation();setText($('#simpleIntakeError'),'Bitte beschreib die Internetseite in mindestens 20 Zeichen.');
  }

  function cleanMenu(){
    const menu=$('#topbarMenu');if(!menu)return;
    const reset=$('#resetBtn');if(reset&&!reset.hidden)reset.hidden=true;
    const projects=$('#openLibraryBtn'),profile=$('#accountBtn'),subscription=$('#subscriptionMenuBtn'),admin=$('#adminBtn'),settings=$('#openSettingsBtn'),upgrade=$('#upgradeMenuBtn'),signout=$('#signOutBtn');
    if(subscription)setText(subscription,'Abonnement');setText(admin,'Verwaltung');setText(settings,'Einstellungen');setText(signout,'Abmelden');
    let libraries=$('#menuLibrariesBtn');if(!libraries){libraries=document.createElement('button');libraries.type='button';libraries.id='menuLibrariesBtn';libraries.className='text-btn';libraries.textContent='Bibliothek';libraries.addEventListener('click',()=>{
      const source=$('#openLibraryBtn');
      // Gesperrt öffnet die Tarifseite, statt stillschweigend nichts zu tun.
      if(!source||source.hidden){document.querySelector('#plansDialog')?.showModal();return}
      source.click();setTimeout(()=>document.querySelector('[data-library-tab="templates"]')?.click(),80);
    });menu.appendChild(libraries)}
    // "Projekte" und "Bibliothek" öffneten beide dasselbe Fenster - ein Eintrag genügt. Der
    // Knopf selbst bleibt im DOM, weil app.js und andere Skripte ihn anklicken; nur sein Platz
    // im Menü fällt weg. `hidden` bleibt dabei unangetastet, denn genau daran hängt die
    // Tarifauskunft (app.js setzt hidden=!rules.modules).
    // Nicht über style.display: die Schublade setzt display:flex!important auf jeden sichtbaren
    // Eintrag und gewinnt gegen eine Inline-Angabe. Ein Merkmal, auf das ihre eigene Regel hört.
    if(projects&&projects.dataset.drawerHidden!=='1')projects.dataset.drawerHidden='1';
    // Sichtbar mit Preisschild statt unsichtbar: im kostenlosen Tarif sieht man, dass es die
    // Bibliothek gibt und was sie kostet.
    if(libraries.hidden)libraries.hidden=false;
    const libraryLocked=!projects||projects.hidden;
    if(libraryLocked)libraries.dataset.drawerTier='ab Pro';else delete libraries.dataset.drawerTier;
    const history=$('#projectHistoryBtn'),legalRow=$('#menuLegalRow'),installApp=$('#installAppBtn');
    [libraries,projects,history,profile,subscription,admin,settings,installApp,legalRow,upgrade,signout].filter(Boolean).forEach(node=>menu.appendChild(node));
  }

  function themeQuick(){
    const actions=$('.top-actions'),toggle=$('#topbarMenuToggle'),menu=$('#topbarMenu');if(!actions||!toggle||!menu)return;
    let button=$('#menuThemeQuick');if(!button){button=document.createElement('button');button.id='menuThemeQuick';button.type='button';button.className='menu-theme-quick';button.setAttribute('aria-label','Darstellung wechseln');button.addEventListener('click',()=>$('#themeToggleBtn')?.click());actions.insertBefore(button,toggle)}
    const open=menu.classList.contains('open')||menu.dataset.open==='true'||toggle.getAttribute('aria-expanded')==='true',dark=document.documentElement.dataset.theme==='dark';button.classList.toggle('show',open);setText(button,dark?'☀':'◐');const title=dark?'Helles Design':'Dunkles Design';if(button.title!==title)button.title=title;
  }

  function syncFlow(){
    const n=currentStep(),active=simpleMode()&&workflowVisible();document.documentElement.classList.toggle('prompt-simple-workflow',active);
    if(active&&n===6){setText($('#generateConceptsBtn'),'Vorschau erstellen');const fresh=sessionStorage.getItem(FRESH_WEBSITE_KEY)==='1',manual=sessionStorage.getItem(PREVIEW_MANUAL_KEY)==='1',format=$('#previewFormat');if(fresh&&!manual&&format&&format.value!=='html'){format.value='html';format.dispatchEvent(new Event('change',{bubbles:true}))}if(fresh)sessionStorage.removeItem(FRESH_WEBSITE_KEY)}
  }

  // "Selbst einstellen" heisst: jeder Schritt bleibt sichtbar und in der Hand des Nutzers. Ueber
  // Schritt 1 hinwegzuspringen nahm dort genau die Angaben weg, die die Startseite gar nicht
  // abfragt - Projektname, Projektart, Hauptziel, Zielgruppe und den besonderen Wunsch. In den
  // beiden gefuehrten Ablaeufen bleibt es beim Vorspringen: dort ist der Sinn, dass Prompt.ai
  // entscheidet.
  function skipDuplicateDescription(){let simple=false;try{simple=sessionStorage.getItem(SIMPLE_START_KEY)==='1'}catch{}if(!simple||!workflowVisible()||currentStep()!==1)return;if(currentMode()==='expert')return;const description=$('#projectDescription')?.value.trim()||'';if(description.length<20)return;const panel=$('#stepProject');if(panel?.dataset.uxAutoForward==='1')return;panel.dataset.uxAutoForward='1';setTimeout(()=>{if(currentStep()===1)$('#stepProject .next-btn')?.click()},90)}

  // Die Referenzen-Seite fragt Link, Screenshot und PDF ab - genau das haengt man aber schon auf
  // der Startseite ans Textfeld (Plus-Knopf), und Adressen aus der Beschreibung wandern ohnehin
  // automatisch in die Liste. Ein zweites Mal danach zu fragen ist ein Schritt ohne Inhalt.
  // Der Schritt selbst bleibt bestehen - an ihm haengen Felder, Grenzen und die Nutzlast fuer die
  // KI; er wird nur nicht mehr angezeigt. In "Selbst einstellen" bleibt er sichtbar, dort ist der
  // Sinn, dass man jeden Schritt sieht.
  // Nicht sofort: die Uebergabe von der Startseite steuert den Ablauf in den ersten Sekunden
  // selbst auf Schritt 2, und ein Klick mitten hinein verpufft. Erst wenn der Schritt eine
  // Sekunde ruhig steht, wird weitergeschaltet - und nur einmal.
  const REFS_SETTLE_MS=900,REFS_RETRY_MS=900,REFS_GIVE_UP_MS=15000;
  function skipReferenceStep(){
    if(!workflowVisible()||currentStep()!==2||currentMode()==='expert')return;
    const panel=$('#stepReferences');if(!panel)return;
    const now=Date.now(),seen=Number(panel.dataset.uxRefsSeen||0);
    if(!seen){panel.dataset.uxRefsSeen=String(now);return}
    // Erst wenn der Schritt kurz ruhig steht - und dann in Abstaenden erneut, bis er wirklich
    // weiterspringt. Ein einzelner Versuch verpufft, solange die Uebergabe noch selbst steuert.
    if(now-seen<REFS_SETTLE_MS||now-seen>REFS_GIVE_UP_MS)return;
    const last=Number(panel.dataset.uxRefsTried||0);
    if(now-last<REFS_RETRY_MS)return;
    panel.dataset.uxRefsTried=String(now);
    $('#stepReferences .next-btn')?.click();
  }

  function cleanClarification(){
    const dialog=$('#clarificationDialog');if(!dialog)return;const head=$('.dialog-head>div',dialog);if(head){setText($('span',head),'RÜCKMELDUNG');setText($('h2',head),'Kurz abstimmen')}const warnings=$('#clarificationWarnings');if(warnings&&!warnings.hidden)warnings.hidden=true;
    $('#clarificationBackgroundNote')?.remove();
    setText($('#saveClarificationsBtn'),'Weiter zur Vorschau');setText($('#deferClarificationsBtn'),'Ohne Antwort weiter');
  }

  function sanitizeStatus(){
    const bad=/(AI Gateway|credit card|vercel\.com|add-credit-card|KI-Verbindung nicht verfügbar|Einstellungen\s*→\s*KI-Verbindungen|API.?Key|payment required)/i,intro=$('#clarificationIntro');if(intro&&bad.test(intro.textContent||''))setText(intro,'Die Online-Prüfung war gerade nicht verfügbar. Prompt.ai nutzt die lokale Prüfung und führt dich normal weiter.');const status=$('#generationStatus');if(status&&bad.test(status.textContent||'')){status.className='generation-status notice';setText(status,$$('#conceptGallery .concept-option').length?'Vorschau ist bereit. Prompt.ai hat automatisch eine verfügbare Fallback-Vorschau genutzt.':'Prompt.ai nutzt automatisch die verfügbare lokale Vorschau.')}
  }

  function subscriptionProration(){
    const body=$('#subscriptionOverviewBody'),hero=$('.sub-hero h3',body||document);if(!body||!hero||hero.textContent.trim()!=='Pro'){$('#subProrationNote')?.remove();return}const actions=$('.sub-actions',body);if(!actions)return;setText($('[data-sub-portal="update"]',actions),'Auf Ultimate upgraden');let note=$('#subProrationNote');if(note)return;note=document.createElement('div');note.id='subProrationNote';note.className='sub-proration-note';note.innerHTML='<strong>Upgrade innerhalb der Laufzeit</strong>Beim Wechsel auf Ultimate berechnet Stripe jetzt nur die anteilige Differenz bis zum nächsten Abrechnungstermin. Ab der nächsten regulären Abrechnung gilt der normale Ultimate-Preis.';actions.insertAdjacentElement('beforebegin',note);
  }

  function settle(){shortHome();shortModeChoice();shortIntake();cleanMenu();themeQuick();syncFlow();skipDuplicateDescription();skipReferenceStep();cleanClarification();sanitizeStatus();subscriptionProration()}
  function schedule(){clearTimeout(settleTimer);settleTimer=setTimeout(settle,20)}
  function observe(){new MutationObserver(schedule).observe(document.body,{childList:true})}
  function bind(){document.addEventListener('click',validateSimpleIntake,true);document.addEventListener('click',event=>{if(event.target.closest?.('#workspaceNewProjectBtn')){try{sessionStorage.setItem(FRESH_WEBSITE_KEY,'1');sessionStorage.removeItem(PREVIEW_MANUAL_KEY)}catch{}}schedule()},true);$('#previewFormat')?.addEventListener('change',event=>{if(event.isTrusted)try{sessionStorage.setItem(PREVIEW_MANUAL_KEY,'1')}catch{}},true);window.addEventListener('promptai:access',schedule);window.addEventListener('sitebrief:admin',schedule);window.addEventListener('pageshow',schedule);window.SiteBriefCloud?.subscribe?.(schedule)}
  function init(){bind();observe();settle();let tries=0;const timer=setInterval(()=>{settle();if(++tries>24)clearInterval(timer)},180)}
  window.PromptAiUxFlow={order:FLOW_ORDER,settle};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
