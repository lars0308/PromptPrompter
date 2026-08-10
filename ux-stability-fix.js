(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const SIMPLE_START_KEY='prompt-ai-v1-simple-start';
  const FRESH_WEBSITE_KEY='prompt-ai-fresh-website-v1';
  const PREVIEW_MANUAL_KEY='prompt-ai-preview-format-manual-v1';
  const FLOW_ORDER=['beschreibung','referenzen','rueckmeldung','vorschau','feinschliff','prompt'];
  let settleTimer=0;

  const currentMode=()=>$('.mode-switch button.active')?.dataset.mode||document.documentElement.dataset.promptMode||'guided';
  const currentStep=()=>Number($('.step-panel.active')?.dataset.stepPanel||0);
  const simpleMode=()=>['guided','auto'].includes(currentMode());
  const workflowVisible=()=>Boolean($('#workflowApp')&&!$('#workflowApp').hidden);

  function installStyles(){
    if($('#uxStabilityFixStyles'))return;
    const style=document.createElement('style');
    style.id='uxStabilityFixStyles';
    style.textContent=`
      .project-mode-card{position:relative!important;overflow:hidden!important}.project-mode-card:before{right:14px!important;top:13px!important;z-index:1!important}.project-mode-frame{isolation:isolate!important}
      .project-mode-close,.simple-intake-close,.guided-clean-exit,.close-dialog,.offer-close,.agent-launch-close,[data-sub-close]{display:grid!important;place-items:center!important;width:42px!important;height:42px!important;min-width:42px!important;padding:0!important;border:1px solid var(--ui-line,var(--line))!important;border-radius:50%!important;background:var(--ui-card,var(--surface))!important;color:var(--ink)!important;font:700 21px/1 Arial,sans-serif!important;box-shadow:none!important;transform:none!important}
      .project-mode-close:hover,.simple-intake-close:hover,.guided-clean-exit:hover,.close-dialog:hover,.offer-close:hover,[data-sub-close]:hover{background:var(--ui-soft,var(--surface-soft))!important;border-color:color-mix(in srgb,var(--ui-blue,var(--accent)) 45%,var(--ui-line,var(--line)))!important}
      html[data-clean-project-flow="1"] body.prompt-unified-ui>.topbar,html.prompt-intake-open body.prompt-unified-ui>.topbar{display:none!important}
      #themeToggleBtn{display:none!important}.menu-theme-quick{display:none!important;flex:0 0 auto;width:44px;height:44px;padding:0;border:1px solid var(--ui-line,var(--line));border-radius:12px;background:var(--ui-card,var(--surface));color:var(--ink);font-size:19px;place-items:center}.menu-theme-quick.show{display:grid!important}
      .topbar-menu:before{content:'PROMPT.AI'!important}.topbar-menu #resetBtn{display:none!important}.topbar-menu #signOutBtn{margin-top:4px!important;border-top:1px solid var(--ui-line,var(--line))!important;border-radius:0!important;padding-top:10px!important}.topbar-menu #upgradeMenuBtn{color:var(--upgrade,#e9781f)!important;font-weight:850!important}
      .home-welcome{margin:0 0 9px 4px;color:var(--muted);font-size:11px;font-weight:700}.home-intro-copy{max-width:520px!important;margin-top:12px!important;font-size:13px!important;line-height:1.4!important}.welcome-quick-actions>button small{line-height:1.3!important}.home-tier-note{font-size:9px!important}
      .project-mode-head p{max-width:520px!important;font-size:12px!important;line-height:1.4!important}.project-mode-card small{font-size:11px!important;line-height:1.4!important}.project-mode-foot{font-size:9px!important}
      .simple-intake-body>p{max-width:600px!important;margin:13px 0 20px!important;font-size:12px!important;line-height:1.45!important}.simple-intake-example{font-size:9px!important}.simple-intake-field textarea{min-height:220px!important}
      html[data-clean-project-flow="1"] .guided-clean-lead{max-width:620px!important;font-size:11px!important;line-height:1.45!important;margin:8px 0 18px!important}
      html[data-clean-project-flow="1"] #modeFlowPanel,html[data-clean-project-flow="1"] .guided-auto-loading{display:none!important}
      .flow-transition-compact{display:none;margin:0 auto;width:min(760px,100%);padding:clamp(34px,8vh,82px) 18px;text-align:center}.flow-transition-compact.show{display:block}.flow-transition-compact span{display:block;color:var(--ui-blue,var(--accent));font-size:9px;font-weight:850;letter-spacing:.11em}.flow-transition-compact strong{display:block;margin-top:8px;font-size:clamp(27px,6vw,42px);letter-spacing:-.04em}.flow-transition-compact small{display:block;max-width:430px;margin:8px auto 0;color:var(--muted);font-size:11px;line-height:1.45}.flow-transition-compact i{display:block;width:110px;height:3px;margin:20px auto 0;border-radius:99px;background:var(--ui-line,var(--line));overflow:hidden}.flow-transition-compact i:after{content:'';display:block;width:42%;height:100%;background:var(--ui-blue,var(--accent));animation:uxTrack 1s ease-in-out infinite}@keyframes uxTrack{from{transform:translateX(-120%)}to{transform:translateX(330%)}}
      html.prompt-review-transition #workflowApp .step-panel.active{display:none!important}html.prompt-review-transition #flowTransitionCompact{display:block!important}
      #clarificationDialog .dialog-frame{width:min(720px,calc(100vw - 28px))!important}#clarificationWarnings{display:none!important}#clarificationDialog .clarification-intro{margin:0 0 12px!important;color:var(--muted)!important;font-size:11px!important;line-height:1.45!important}.clarification-background-note{display:block;margin:0 0 16px;padding:10px 12px;border:1px solid var(--ui-line,var(--line));border-radius:10px;background:var(--ui-soft,var(--surface-soft));color:var(--muted);font-size:9px;line-height:1.45}.clarification-question{border-color:var(--ui-line,var(--line))!important;border-radius:12px!important;box-shadow:none!important}.clarification-actions{gap:8px!important}
      .generation-status{font-size:10px!important;line-height:1.45!important}.generation-status.error{color:var(--muted)!important}
      .sub-proration-note{margin:12px 0 0;padding:12px 14px;border:1px solid color-mix(in srgb,var(--ui-blue,var(--accent)) 30%,var(--ui-line,var(--line)));border-radius:11px;background:color-mix(in srgb,var(--ui-blue,var(--accent)) 6%,var(--ui-card,var(--surface)));color:var(--muted);font-size:9px;line-height:1.5}.sub-proration-note strong{display:block;margin-bottom:3px;color:var(--ink);font-size:10px}
      @media(max-width:820px){html[data-clean-project-flow="1"] body.prompt-unified-ui #workflowApp{padding-top:0!important}.menu-theme-quick{width:42px;height:42px}.project-mode-head p{margin-right:42px!important}.flow-transition-compact{min-height:58dvh;align-content:center}.flow-transition-compact.show{display:grid!important}.clarification-actions{display:grid!important;grid-template-columns:1fr!important}.clarification-actions button{width:100%!important}}
    `;
    document.head.appendChild(style);
  }

  function shortHome(){
    const wrap=$('.welcome-hero')?.firstElementChild;
    if(!wrap)return;
    let welcome=$('.home-welcome',wrap);
    if(!welcome){welcome=document.createElement('p');welcome.className='home-welcome';wrap.insertBefore(welcome,wrap.firstChild)}
    const name=$('#userDisplayName')?.value?.trim()||String(window.SiteBriefCloud?.user?.user_metadata?.display_name||window.SiteBriefCloud?.user?.user_metadata?.name||'').trim();
    welcome.textContent=window.SiteBriefCloud?.user?(name?`Willkommen zurück, ${name.split(/\s+/)[0]}.`:'Willkommen zurück.'):'Willkommen bei Prompt.ai.';
    const intro=$('.home-intro-copy',wrap);if(intro)intro.textContent='Internetseite oder freier Prompt – Prompt.ai führt dich direkt weiter.';
    const copies={workspaceNewProjectBtn:['Internetseite erstellen','Website beschreiben, Rückfragen klären, Vorschau wählen.'],workspaceFreePromptBtn:['Freier Prompt','Text, Bild, Video, Musik, Präsentation, Code & mehr.'],workspaceRevisionBtn:['Website überarbeiten','Bestehende Seite gezielt ändern.'],workspacePreviewBtn:['Projekt prüfen','Gebautes Projekt als Vorschau prüfen.'],workspaceLastProjectBtn:['Letztes Projekt','Gespeicherten Stand fortsetzen.'],workspaceLibraryBtn:['Bibliothek','Vorlagen, Module, Skills & Projekte.']};
    for(const [id,[title,sub]] of Object.entries(copies)){const button=$(`#${id}`);if(!button)continue;const strong=$('strong',button),small=$('small',button);if(strong)strong.textContent=title;if(small)small.textContent=sub}
    const note=$('#homeTierNote');if(note)note.textContent=(window.PromptAiAccess?.plan||'free')==='free'?'Weitere Werkzeuge sind ab Pro verfügbar.':'Deine freigeschalteten Werkzeuge sind bereit.';
  }

  function shortModeChoice(){
    const dialog=$('#projectModeDialog');if(!dialog)return;
    const lead=$('.project-mode-head p',dialog);if(lead)lead.textContent='Wähle, wie viel Prompt.ai für dich übernehmen soll.';
    const copy={guided:'Nur wichtige Rückfragen. Die Vorschau bleibt deine Entscheidung.',auto:'Prompt.ai entscheidet die Details und führt dich schnell zur Vorschau.',expert:'Alle Einstellungen selbst steuern.'};
    $$('[data-project-mode]',dialog).forEach(button=>{const small=$('small',button);if(small)small.textContent=copy[button.dataset.projectMode]||''});
    const foot=$('.project-mode-foot',dialog);if(foot)foot.textContent='Geführt: Free · Auto: Pro · Experte: Ultimate';
  }

  function shortIntake(){
    const dialog=$('#simpleIntakeDialog');if(!dialog)return;
    const website=/INTERNETSEITE/i.test($('#simpleIntakeKicker')?.textContent||'');
    const lead=$('#simpleIntakeLead');if(lead)lead.textContent=website?'Beschreib kurz, was entstehen soll. Danach kommen Referenzen und nur nötige Rückfragen.':'Beschreib kurz dein Ziel. Prompt.ai zeigt danach nur passende Einstellungen.';
    const example=$('#simpleIntakeExample');if(example)example.textContent=website?'Tipp: Branche, Ort, Stil, Farben und wichtige Funktionen kannst du direkt hier nennen.':'Stichpunkte reichen.';
  }

  function validateSimpleIntake(event){
    if(!event.target.closest?.('#simpleIntakeContinue'))return;
    const website=/INTERNETSEITE/i.test($('#simpleIntakeKicker')?.textContent||'');
    const text=$('#simpleIntakeText')?.value.trim()||'';
    if(!$('#simpleIntakeDialog')?.open||!website||text.length>=20)return;
    event.preventDefault();event.stopImmediatePropagation();
    const error=$('#simpleIntakeError');if(error)error.textContent='Bitte beschreib die Internetseite in mindestens 20 Zeichen.';
  }

  function cleanMenu(){
    const menu=$('#topbarMenu');if(!menu)return;
    const reset=$('#resetBtn');if(reset)reset.hidden=true;
    const projects=$('#openLibraryBtn');if(projects)projects.textContent='Projekte';
    const profile=$('#accountBtn');if(profile)profile.textContent=window.SiteBriefCloud?.user?'Profil':'Anmelden';
    const admin=$('#adminBtn');if(admin)admin.textContent='Verwaltung';
    const settings=$('#openSettingsBtn');if(settings)settings.textContent='Einstellungen';
    const upgrade=$('#upgradeMenuBtn');if(upgrade)upgrade.textContent='Upgraden';
    const signout=$('#signOutBtn');if(signout)signout.textContent='Abmelden';
    let libraries=$('#menuLibrariesBtn');
    if(!libraries){
      libraries=document.createElement('button');libraries.type='button';libraries.id='menuLibrariesBtn';libraries.className='text-btn';libraries.textContent='Bibliotheken';
      libraries.addEventListener('click',()=>{const source=$('#openLibraryBtn');if(!source||source.hidden)return;source.click();setTimeout(()=>document.querySelector('[data-library-tab="templates"]')?.click(),80)});
      menu.appendChild(libraries);
    }
    libraries.hidden=!projects||projects.hidden;
    [$(`#installAppBtn`),libraries,projects,profile,admin,settings,upgrade,signout].filter(Boolean).forEach(node=>menu.appendChild(node));
  }

  function themeQuick(){
    const actions=$('.top-actions'),toggle=$('#topbarMenuToggle'),menu=$('#topbarMenu');if(!actions||!toggle||!menu)return;
    let button=$('#menuThemeQuick');
    if(!button){button=document.createElement('button');button.id='menuThemeQuick';button.type='button';button.className='menu-theme-quick';button.setAttribute('aria-label','Darstellung wechseln');button.addEventListener('click',()=>$('#themeToggleBtn')?.click());actions.insertBefore(button,toggle)}
    const open=menu.classList.contains('open')||menu.dataset.open==='true'||toggle.getAttribute('aria-expanded')==='true';
    button.classList.toggle('show',open);const dark=document.documentElement.dataset.theme==='dark';button.textContent=dark?'☀':'◐';button.title=dark?'Helles Design':'Dunkles Design';
  }

  function ensureTransition(){
    const workspace=$('#workflowApp .workspace');if(!workspace)return null;
    let box=$('#flowTransitionCompact');if(box)return box;
    box=document.createElement('section');box.id='flowTransitionCompact';box.className='flow-transition-compact';box.innerHTML='<div><span>RÜCKMELDUNG</span><strong>Briefing wird kurz geprüft</strong><small>Nur offene Punkte, die die Vorschau wirklich verändern, werden gleich abgefragt.</small><i></i></div>';workspace.prepend(box);return box;
  }

  function syncFlow(){
    const n=currentStep(),active=simpleMode()&&workflowVisible();
    document.documentElement.classList.toggle('prompt-simple-workflow',active);
    const transition=active&&[3,4,5].includes(n)&&!$('#clarificationDialog')?.open;
    document.documentElement.classList.toggle('prompt-review-transition',transition);
    const box=ensureTransition();
    if(box){
      box.classList.toggle('show',transition);
      const label=$('span',box),strong=$('strong',box),small=$('small',box);
      if(n===3){if(label)label.textContent='RÜCKMELDUNG';if(strong)strong.textContent='Briefing wird kurz geprüft';if(small)small.textContent='Nur offene Punkte, die die Vorschau wirklich verändern, werden abgefragt.'}
      else{if(label)label.textContent='VORSCHAU';if(strong)strong.textContent='Vorschau wird vorbereitet';if(small)small.textContent='Deine Antworten und Referenzen werden jetzt zusammengeführt.'}
    }
    if(active&&n===2){const next=$('#stepReferences .next-btn');if(next)next.innerHTML='Rückmeldung prüfen <i>→</i>'}
    if(active&&n===6){
      const generate=$('#generateConceptsBtn');if(generate)generate.textContent='Vorschau erstellen';
      const fresh=sessionStorage.getItem(FRESH_WEBSITE_KEY)==='1',manual=sessionStorage.getItem(PREVIEW_MANUAL_KEY)==='1',format=$('#previewFormat');
      if(fresh&&!manual&&format&&format.value!=='html'){format.value='html';format.dispatchEvent(new Event('change',{bubbles:true}))}
      if(fresh)sessionStorage.removeItem(FRESH_WEBSITE_KEY);
    }
  }

  function skipDuplicateDescription(){
    let simple=false;try{simple=sessionStorage.getItem(SIMPLE_START_KEY)==='1'}catch{}
    if(!simple||!workflowVisible()||currentStep()!==1)return;
    const description=$('#projectDescription')?.value.trim()||'';if(description.length<20)return;
    const panel=$('#stepProject');if(panel?.dataset.uxAutoForward==='1')return;
    panel.dataset.uxAutoForward='1';
    setTimeout(()=>{if(currentStep()===1)$('#stepProject .next-btn')?.click()},90);
  }

  function cleanClarification(){
    const dialog=$('#clarificationDialog');if(!dialog)return;
    const head=$('.dialog-head>div',dialog);if(head){const kicker=$('span',head),title=$('h2',head);if(kicker)kicker.textContent='RÜCKMELDUNG';if(title)title.textContent='Kurz abstimmen'}
    const intro=$('#clarificationIntro');if(intro)intro.textContent='Bevor die Vorschau entsteht, klären wir nur Punkte, die das Ergebnis wirklich verändern.';
    const warnings=$('#clarificationWarnings');if(warnings)warnings.hidden=true;
    let note=$('#clarificationBackgroundNote');
    if(!note&&$('#clarificationQuestions')){note=document.createElement('small');note.id='clarificationBackgroundNote';note.className='clarification-background-note';note.textContent='Datenschutz, Impressum, Barrierefreiheit, Sicherheit und Performance laufen als Hintergrundprüfung weiter.';$('#clarificationQuestions').insertAdjacentElement('beforebegin',note)}
    const save=$('#saveClarificationsBtn');if(save)save.textContent='Weiter zur Vorschau';
    const defer=$('#deferClarificationsBtn');if(defer)defer.textContent='Ohne Antwort weiter';
  }

  function sanitizeStatus(){
    const bad=/(AI Gateway|credit card|vercel\.com|add-credit-card|KI-Verbindung nicht verfügbar|Einstellungen\s*→\s*KI-Verbindungen|API.?Key|payment required)/i;
    const intro=$('#clarificationIntro');if(intro&&bad.test(intro.textContent||''))intro.textContent='Die Online-Prüfung war gerade nicht verfügbar. Prompt.ai nutzt die lokale Prüfung und führt dich normal weiter.';
    const status=$('#generationStatus');
    if(status&&bad.test(status.textContent||'')){status.className='generation-status notice';status.textContent=$$('#conceptGallery .concept-option').length?'Vorschau ist bereit. Prompt.ai hat automatisch eine verfügbare Fallback-Vorschau genutzt.':'Prompt.ai nutzt automatisch die verfügbare lokale Vorschau.'}
  }

  function subscriptionProration(){
    const body=$('#subscriptionOverviewBody'),hero=$('.sub-hero h3',body||document);if(!body||!hero||hero.textContent.trim()!=='Pro'){$('#subProrationNote')?.remove();return}
    const actions=$('.sub-actions',body);if(!actions)return;
    const upgrade=$('[data-sub-portal="update"]',actions);if(upgrade)upgrade.textContent='Auf Ultimate upgraden';
    let note=$('#subProrationNote');if(note)return;
    note=document.createElement('div');note.id='subProrationNote';note.className='sub-proration-note';note.innerHTML='<strong>Upgrade innerhalb der Laufzeit</strong>Beim Wechsel auf Ultimate berechnet Stripe jetzt nur die anteilige Differenz bis zum nächsten Abrechnungstermin. Ab der nächsten regulären Abrechnung gilt der normale Ultimate-Preis.';actions.insertAdjacentElement('beforebegin',note);
  }

  function settle(){shortHome();shortModeChoice();shortIntake();cleanMenu();themeQuick();syncFlow();skipDuplicateDescription();cleanClarification();sanitizeStatus();subscriptionProration()}
  function schedule(){clearTimeout(settleTimer);settleTimer=setTimeout(settle,20)}
  function observe(){new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','open','hidden','aria-expanded','data-open']})}
  function bind(){
    document.addEventListener('click',validateSimpleIntake,true);
    document.addEventListener('click',event=>{if(event.target.closest?.('#workspaceNewProjectBtn')){try{sessionStorage.setItem(FRESH_WEBSITE_KEY,'1');sessionStorage.removeItem(PREVIEW_MANUAL_KEY)}catch{}}schedule()},true);
    $('#previewFormat')?.addEventListener('change',event=>{if(event.isTrusted)try{sessionStorage.setItem(PREVIEW_MANUAL_KEY,'1')}catch{}},true);
    window.addEventListener('promptai:access',schedule);window.addEventListener('sitebrief:admin',schedule);window.addEventListener('pageshow',schedule);window.SiteBriefCloud?.subscribe?.(schedule);
  }
  function init(){installStyles();bind();observe();settle();let tries=0;const timer=setInterval(()=>{settle();if(++tries>24)clearInterval(timer)},180)}
  window.PromptAiUxFlow={order:FLOW_ORDER,settle};
  installStyles();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
