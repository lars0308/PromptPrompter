(()=>{
  'use strict';
  const $=(selector,root=document)=>root?.querySelector?.(selector)||null;
  let settleTimer=0;
  window.PromptAiHomeFinalLock=true;

  const icons={
    website:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M3.8 12h16.4M12 3.5c2.2 2.4 3.4 5.2 3.4 8.5S14.2 18.1 12 20.5C9.8 18.1 8.6 15.3 8.6 12S9.8 5.9 12 3.5Z"/></svg>',
    prompt:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 17.5-.5 3 3-.5L18.8 8.7a2.1 2.1 0 0 0-3-3L5 17.5Z"/><path d="m13.9 7.7 2.4 2.4"/></svg>',
    revision:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6.1 8.4A7.5 7.5 0 0 1 18.7 7L20 9M4 15l1.3 2A7.5 7.5 0 0 0 18 15.6"/></svg>',
    folder:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 7.5h6l2-2h9v13h-17z"/></svg>',
    shield:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 19 6v5.2c0 4.3-2.6 7.5-7 9.3-4.4-1.8-7-5-7-9.3V6l7-2.5Z"/><path d="m9 12 2 2 4-4"/></svg>',
    history:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5v5h5"/><path d="M5.6 16.5A8 8 0 1 0 4 10l2.7-2.2"/><path d="M12 8v4l3 2"/></svg>'
  };

  function installStyles(){
    if($('#promptAiHomeFinalStyles'))return;
    const style=document.createElement('style');style.id='promptAiHomeFinalStyles';style.textContent=`
      html.prompt-home-surface{--home-bg:#f4f7fa;--home-card:#fff;--home-panel:#111923;--home-line:#d9e1e8;--home-soft:#edf3f7;--home-blue:#4b9bd2;--home-blue-deep:#246b9d;--home-orange:#ee7b22;--home-ink:#121a24;--home-muted:#687583}
      html[data-theme="dark"].prompt-home-surface{--home-bg:#080d13;--home-card:#101720;--home-panel:#121b25;--home-line:#263442;--home-soft:#151f29;--home-blue:#61b5ed;--home-blue-deep:#52a9e1;--home-orange:#ff923d;--home-ink:#eef5fb;--home-muted:#93a3b2}
      html.prompt-home-surface body{min-height:100dvh;background:var(--home-bg)!important;color:var(--home-ink)!important}
      html.prompt-home-surface body:before{content:"";position:fixed;inset:0;pointer-events:none;opacity:.28;background-image:linear-gradient(90deg,transparent 49.8%,color-mix(in srgb,var(--home-line) 35%,transparent) 50%,transparent 50.2%);background-size:120px 100%}
      html[data-theme="dark"].prompt-home-surface body:before{opacity:.1}
      html.prompt-home-surface body.prompt-unified-ui>.topbar,html.prompt-home-surface body>.topbar{display:grid!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;position:sticky!important;top:10px!important;z-index:2147482500!important;width:min(1180px,calc(100% - 28px))!important;height:64px!important;margin:10px auto 0!important;padding:0 12px!important;grid-template-columns:minmax(0,1fr) auto!important;border:1px solid var(--home-line)!important;border-radius:17px!important;background:color-mix(in srgb,var(--home-card) 94%,transparent)!important;box-shadow:0 14px 45px rgba(21,37,53,.08)!important;backdrop-filter:blur(18px)!important}
      html[data-theme="dark"].prompt-home-surface body>.topbar{box-shadow:0 18px 55px rgba(0,0,0,.35)!important}
      html.prompt-home-surface .topbar .brand{display:flex!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;min-width:0!important;padding:0 4px!important}
      html.prompt-home-surface .topbar .brand-mark{width:39px!important;height:39px!important;border:0!important;border-radius:10px!important;background:transparent!important;box-shadow:none!important}
      html.prompt-home-surface .topbar .brand-mark img{width:100%!important;height:100%!important}
      html.prompt-home-surface .topbar .brand-copy strong{font-size:18px!important;letter-spacing:-.035em!important;color:var(--home-ink)!important}
      html.prompt-home-surface .topbar .brand-copy small,html.prompt-home-surface .topbar .engine-state,html.prompt-home-surface .topbar .sync-state{display:none!important}
      html.prompt-home-surface .topbar .top-actions{display:flex!important;visibility:visible!important;opacity:1!important;align-items:center!important;gap:7px!important;padding:0!important}
      html.prompt-home-surface .topbar #upgradeBtn{display:inline-flex!important;min-height:38px!important;padding:0 13px!important;border-radius:10px!important;background:var(--home-orange)!important;border-color:var(--home-orange)!important;box-shadow:none!important}
      html.prompt-home-surface .topbar #topbarMenuToggle,html.prompt-home-surface .home-theme-toggle{display:grid!important;visibility:visible!important;opacity:1!important;width:40px!important;height:40px!important;min-height:40px!important;margin:0!important;padding:0!important;place-items:center;border:1px solid var(--home-line)!important;border-radius:11px!important;background:var(--home-card)!important;color:var(--home-ink)!important;box-shadow:none!important}
      .home-theme-toggle{font-size:17px;line-height:1;cursor:pointer}
      html.prompt-home-surface .welcome-page{position:relative;width:min(1040px,calc(100% - 30px))!important;max-width:1040px!important;margin:0 auto!important;padding:clamp(56px,8vw,92px) 0 44px!important}
      html.prompt-home-surface .welcome-page>.welcome-hero,html.prompt-home-surface .welcome-page>.welcome-workspace{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;clip-path:inset(50%)!important;white-space:nowrap!important}
      .prompt-command-home{position:relative;z-index:1}
      .prompt-home-intro{position:relative;min-height:170px;padding:0 8px 28px}
      .prompt-home-intro:after{content:"";position:absolute;z-index:-1;right:-75px;top:-72px;width:330px;height:330px;border:1px solid color-mix(in srgb,var(--home-blue) 32%,transparent);border-radius:50%}
      .prompt-home-intro:before{content:"";position:absolute;z-index:-1;right:30px;top:52px;width:190px;height:190px;border:1px dashed color-mix(in srgb,var(--home-blue) 35%,transparent);border-radius:50%}
      .prompt-system-line{display:flex;align-items:center;gap:9px;margin-bottom:15px;color:var(--home-blue-deep);font-size:10px;font-weight:850;letter-spacing:.15em;text-transform:uppercase}
      .prompt-system-line:before{content:"";width:7px;height:7px;border:2px solid var(--home-blue);border-radius:50%}
      .prompt-home-intro h1{margin:0!important;color:var(--home-ink)!important;font:800 clamp(45px,7vw,76px)/.98 Arial,Helvetica,sans-serif!important;letter-spacing:-.06em!important}
      .prompt-home-intro p{max-width:550px;margin:14px 0 0;color:var(--home-muted);font-size:clamp(15px,2vw,18px);line-height:1.5}
      .prompt-command-panel{position:relative;overflow:visible;border:1px solid color-mix(in srgb,var(--home-blue) 18%,#000);border-radius:23px;background:var(--home-panel);color:#edf6fd;box-shadow:0 26px 70px rgba(16,29,42,.19)}
      .prompt-command-panel:before{content:"COMMAND / 01";position:absolute;right:22px;top:19px;color:#61778a;font-size:8px;font-weight:800;letter-spacing:.16em}
      .prompt-command-top{position:relative;display:flex;padding:18px 18px 0}
      .prompt-mode-button{display:inline-flex;align-items:center;gap:10px;min-height:45px;padding:0 13px;border:1px solid #425262;border-radius:12px;background:#151f29;color:#edf6fd;font:750 13px/1 Arial,Helvetica,sans-serif;cursor:pointer}
      .prompt-mode-button svg,.prompt-mode-menu svg,.prompt-latest-icon svg,.prompt-command-submit svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
      .prompt-mode-button .mode-chevron{width:8px;height:8px;margin-left:3px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg) translateY(-2px);transition:transform .16s ease}
      .prompt-mode-button[aria-expanded="true"] .mode-chevron{transform:rotate(225deg) translate(-2px,-1px)}
      .prompt-mode-menu{position:absolute;z-index:8;left:18px;top:69px;width:min(285px,calc(100vw - 70px));padding:7px;border:1px solid #dce7ef;border-radius:14px;background:#f9fcff;color:#14202a;box-shadow:0 22px 60px rgba(0,0,0,.28)}
      .prompt-mode-menu[hidden]{display:none!important}
      .prompt-mode-option{display:grid;width:100%;grid-template-columns:32px 1fr;align-items:center;gap:8px;min-height:52px;padding:8px 11px;border:0;border-radius:10px;background:transparent;color:inherit;text-align:left;font:700 13px/1.2 Arial,Helvetica,sans-serif;cursor:pointer}
      .prompt-mode-option:hover,.prompt-mode-option[aria-checked="true"]{background:#e8f3fa;color:#174f76}
      .prompt-mode-option small{display:block;margin-top:4px;color:#71808d;font-size:9px;font-weight:550}
      .prompt-command-input{display:block;width:100%;min-height:185px;padding:30px 76px 24px 24px;border:0;outline:0;resize:vertical;background:transparent;color:#f2f7fb;font:500 clamp(17px,2.3vw,21px)/1.55 Arial,Helvetica,sans-serif;caret-color:var(--home-orange)}
      .prompt-command-input::placeholder{color:#71808e}
      .prompt-command-submit{position:absolute;right:21px;bottom:69px;display:grid;width:52px;height:52px;min-height:52px;padding:0;place-items:center;border:0;border-radius:13px;background:var(--home-blue);color:#07131c;cursor:pointer;transition:transform .16s ease,background .16s ease}
      .prompt-command-submit:hover{transform:translateY(-2px);background:#79c5f4}.prompt-command-submit:disabled{opacity:.35;transform:none;cursor:not-allowed}
      .prompt-command-meta{display:flex;align-items:center;gap:16px;min-height:56px;padding:0 22px;border-top:1px solid #31404e;color:#91a1ae;font-size:10px}
      .prompt-command-meta span+span{padding-left:16px;border-left:1px solid #394a59}.prompt-command-meta b{color:#68b9ed;font-weight:750}.prompt-command-error{margin-left:auto;color:#ff9d78}.prompt-command-error:empty{display:none}
      .prompt-latest{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:14px;align-items:center;margin-top:18px;padding:14px 16px;border:1px solid var(--home-line);border-radius:17px;background:var(--home-card);color:var(--home-ink)}
      .prompt-latest-icon{display:grid;width:45px;height:45px;place-items:center;border-radius:13px;background:var(--home-soft);color:var(--home-blue-deep)}
      .prompt-latest-copy strong,.prompt-latest-copy small{display:block}.prompt-latest-copy strong{font-size:13px}.prompt-latest-copy small{margin-top:4px;color:var(--home-muted);font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .prompt-latest-action{min-height:38px;padding:0 12px;border:0;background:transparent;color:var(--home-blue-deep);font-size:11px;font-weight:800;cursor:pointer}.prompt-latest-action:disabled{opacity:.4;cursor:not-allowed}
      html.prompt-home-surface #promptFooter{width:min(1040px,calc(100% - 30px));margin:0 auto;background:transparent!important;border-top:1px solid var(--home-line)!important}html.prompt-home-surface #promptFooter .prompt-footer-content{min-height:56px!important;padding:12px 2px!important}
      @media(max-width:700px){html.prompt-home-surface body:before{display:none}html.prompt-home-surface body.prompt-unified-ui>.topbar,html.prompt-home-surface body>.topbar{top:6px!important;width:calc(100% - 20px)!important;height:60px!important;margin-top:7px!important;padding:0 8px!important;border-radius:15px!important}html.prompt-home-surface .topbar .brand-mark{width:36px!important;height:36px!important}html.prompt-home-surface .topbar .brand-copy strong{font-size:17px!important}html.prompt-home-surface .topbar #upgradeBtn{min-height:36px!important;padding:0 10px!important;font-size:10px!important}html.prompt-home-surface .topbar #topbarMenuToggle,html.prompt-home-surface .home-theme-toggle{width:36px!important;height:36px!important;min-height:36px!important;border-radius:10px!important}html.prompt-home-surface .welcome-page{width:100%!important;max-width:none!important;padding:44px 14px 30px!important}.prompt-home-intro{min-height:160px;padding:0 4px 24px}.prompt-home-intro:after{right:-165px;top:-105px}.prompt-home-intro:before{right:-32px;top:18px}.prompt-home-intro h1{font-size:clamp(45px,14vw,64px)!important}.prompt-home-intro p{max-width:310px;font-size:14px}.prompt-command-panel{border-radius:19px}.prompt-command-panel:before{right:16px;top:16px;font-size:7px}.prompt-command-top{padding:14px 14px 0}.prompt-mode-menu{left:14px;top:64px}.prompt-mode-button{max-width:238px;min-height:42px;font-size:12px}.prompt-command-input{min-height:190px;padding:25px 65px 20px 18px;font-size:17px}.prompt-command-submit{right:16px;bottom:66px;width:48px;height:48px;min-height:48px}.prompt-command-meta{min-height:54px;padding:0 16px;gap:11px;font-size:9px}.prompt-command-meta span+span{padding-left:11px}.prompt-command-error{display:none!important}.prompt-latest{grid-template-columns:auto minmax(0,1fr);padding:12px}.prompt-latest-action{grid-column:1/-1;width:100%;border-top:1px solid var(--home-line);padding-top:11px}html.prompt-home-surface #promptFooter{display:none!important}}
      @media(max-width:390px){html.prompt-home-surface .topbar #upgradeBtn{font-size:0!important}html.prompt-home-surface .topbar #upgradeBtn:after{content:"Pro";font-size:10px}.prompt-command-meta span:nth-child(2){display:none}.prompt-command-meta span+span{padding-left:0;border-left:0}}
    `;document.head.appendChild(style)
  }

  // Welches Kontingent die gewählte Arbeitsart verbraucht. Freier Prompt zählt als Prompt,
  // alles rund um Websites als Website-Lauf.
  const METRIC={website:['website_generations','Website-Läufe'],revision:['website_generations','Website-Läufe'],free:['free_prompts','Prompts']};
  // Grobe Umrechnung: im Deutschen kommt ein Token auf gut dreieinhalb Zeichen. Deshalb das
  // Ungefähr-Zeichen davor - eine genaue Zahl kennt erst das Modell.
  const tokenGuess=text=>Math.max(1,Math.round(text.trim().length/3.6));
  function quotaLine(mode){
    const summary=window.PromptAiQuota?.summary?.();
    if(window.PromptAiAccess?.isAdmin)return 'Kontingent unbegrenzt';
    if(!summary?.metrics)return '';
    const [key,label]=METRIC[mode]||METRIC.website,item=summary.metrics[key];
    if(!item)return '';
    const limit=Number(item.limit||0);
    if(!limit)return `${label}: nicht im Tarif`;
    const left=Math.max(0,Number(item.remaining??limit-Number(item.used||0)));
    return `${left}/${limit} ${label}`;
  }
  function syncMeta(){
    const home=$('.prompt-command-home');if(!home)return;
    const field=$('#promptCommandInput',home),slot=$('#promptHomeMeta',home);
    if(!field||!slot)return;
    const text=field.value.trim();
    // Beim Schreiben zählt, wie lang der Auftrag wird; solange nichts dasteht, was noch übrig ist.
    const next=text?`${text.length} Zeichen · ≈${tokenGuess(text)} Token`:quotaLine(home.dataset.commandMode||'website');
    if(slot.textContent!==next)slot.textContent=next;
  }

  function titleCase(value){return String(value||'').trim().replace(/[._-]+/g,' ').replace(/\b\p{L}/gu,char=>char.toUpperCase())}
  function firstName(value){return titleCase(value).split(/\s+/)[0]||''}
  function resolvedName(){const cloud=window.SiteBriefCloud||{},user=cloud.user||{},meta=user.user_metadata||{};const values=[$('#userDisplayName')?.value,window.PromptAiUserProfile?.displayName,cloud.userProfile?.displayName,cloud.profile?.displayName,meta.display_name,meta.full_name,meta.name];for(const value of values){const name=firstName(value);if(name)return name}const email=String(user.email||'').trim();return email?firstName(email.split('@')[0]):''}
  function homeVisible(){const page=$('#welcomePage'),workflow=$('#workflowApp');return Boolean(page&&!page.hidden&&getComputedStyle(page).display!=='none'&&(!workflow||workflow.hidden||getComputedStyle(workflow).display==='none'))}
  function projectTitle(){try{const state=JSON.parse(localStorage.getItem('sitebrief-v6-state')||'{}');return String(state.projectName||state.project?.name||state.project?.client?.name||'').trim()}catch{return ''}}

  function ensureThemeToggle(){const actions=$('.topbar .top-actions');if(!actions)return;let button=$('#homeThemeToggle');if(!button){button=document.createElement('button');button.id='homeThemeToggle';button.type='button';button.className='home-theme-toggle';button.addEventListener('click',()=>$('#themeToggleBtn')?.click());actions.insertBefore(button,$('#topbarMenuToggle'))}const dark=document.documentElement.dataset.theme==='dark';button.textContent=dark?'☀':'◐';button.title=dark?'Helles Design':'Dunkles Design';button.setAttribute('aria-label',button.title)}

  function markup(){return `<section class="prompt-command-home" aria-label="Prompt.ai Start"><header class="prompt-home-intro"><span class="prompt-system-line">Workspace bereit</span><h1>Hallo <span id="promptHomeName">Lars</span>.</h1><p>Was möchtest du heute umsetzen?</p></header><form class="prompt-command-panel" id="promptCommandForm"><div class="prompt-command-top"><button class="prompt-mode-button" id="promptModeButton" type="button" aria-haspopup="listbox" aria-expanded="false">${icons.website}<span id="promptModeLabel">Internetseite erstellen</span><i class="mode-chevron" aria-hidden="true"></i></button><div class="prompt-mode-menu" id="promptModeMenu" role="listbox" aria-label="Arbeitsart wählen" hidden><button type="button" class="prompt-mode-option" role="option" data-command-mode="website" aria-checked="true">${icons.website}<span>Internetseite erstellen<small>Neues Website-Projekt</small></span></button><button type="button" class="prompt-mode-option" role="option" data-command-mode="free" aria-checked="false">${icons.prompt}<span>Freier Prompt<small>Text, Bild, Video, Code & mehr</small></span></button><button type="button" class="prompt-mode-option" role="option" data-command-mode="revision" aria-checked="false">${icons.revision}<span>Website überarbeiten<small>Bestehende Seite gezielt ändern</small></span></button><button type="button" class="prompt-mode-option" role="option" data-command-mode="check" aria-checked="false">${icons.shield}<span>Projekt prüfen<small>Aktuellen Stand prüfen lassen</small></span></button></div></div><textarea class="prompt-command-input" id="promptCommandInput" rows="5" minlength="8" placeholder="Beschreibe kurz, was entstehen soll …" aria-label="Projekt oder Aufgabe beschreiben"></textarea><button class="prompt-command-submit" id="promptCommandSubmit" type="submit" aria-label="Absenden"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6v5.5a2.5 2.5 0 0 1-2.5 2.5H5"/><path d="m9 10-4 4 4 4"/></svg></button><footer class="prompt-command-meta"><span id="promptHomeMeta">Kontingent wird geladen</span><span><b id="promptHomePlan">Free</b></span><span class="prompt-command-error" id="promptCommandError" role="status"></span></footer></form><section class="prompt-latest" aria-label="Letztes Projekt"><span class="prompt-latest-icon">${icons.folder}</span><div class="prompt-latest-copy"><strong>Letztes Projekt</strong><small id="promptLatestTitle">Gespeicherten Arbeitsstand fortsetzen</small></div><button type="button" class="prompt-latest-action" id="promptLatestAction">Weiterarbeiten →</button></section></section>`}
  function ensureHome(){const page=$('#welcomePage');if(!page)return null;let home=$('.prompt-command-home',page);if(!home){page.insertAdjacentHTML('beforeend',markup());home=$('.prompt-command-home',page);bindHome(home)}return home}
  function modeCopy(mode){return mode==='free'?{label:'Freier Prompt',placeholder:'Beschreibe, welchen Prompt du brauchst …',icon:icons.prompt}:mode==='revision'?{label:'Website überarbeiten',placeholder:'Was soll an der bestehenden Website geändert werden?',icon:icons.revision}:{label:'Internetseite erstellen',placeholder:'Beschreibe kurz, was entstehen soll …',icon:icons.website}}
  function closeModeMenu(home){const menu=$('#promptModeMenu',home);if(menu)menu.hidden=true;$('#promptModeButton',home)?.setAttribute('aria-expanded','false')}
  function selectMode(mode){const home=ensureHome();if(!home)return;
    // Prüfen ist kein Schreibmodus - es gibt nichts zu beschreiben. Der Eintrag startet
    // die Prüfung direkt und lässt die eingestellte Arbeitsart stehen.
    if(mode==='check'){closeModeMenu(home);proxy('workspacePreviewBtn');return}
    home.dataset.commandMode=mode;const copy=modeCopy(mode),button=$('#promptModeButton',home);button.innerHTML=`${copy.icon}<span id="promptModeLabel">${copy.label}</span><i class="mode-chevron" aria-hidden="true"></i>`;button.setAttribute('aria-expanded','false');$('#promptModeMenu',home).hidden=true;$('#promptCommandInput',home).placeholder=copy.placeholder;syncMeta();home.querySelectorAll('[data-command-mode]').forEach(option=>option.setAttribute('aria-checked',String(option.dataset.commandMode===mode)));$('#promptCommandInput',home).focus()}
  async function submitCommand(event){event.preventDefault();const home=ensureHome(),input=$('#promptCommandInput',home),error=$('#promptCommandError',home),mode=home.dataset.commandMode||'website',brief=input.value.trim();if(brief.length<8){error.textContent='Bitte kurz beschreiben.';input.focus();return}error.textContent='';const button=$('#promptCommandSubmit',home);button.disabled=true;try{if(window.PromptAiHomeEntry?.submitBrief)await window.PromptAiHomeEntry.submitBrief(mode,brief);else if(mode==='website')await window.PromptAiProjectStart?.startFromBrief?.(brief);else{window.PromptAiHomeEntry?.[mode==='free'?'openFreePrompt':'openRevision']?.();setTimeout(()=>{const field=$('#simpleIntakeText');if(field){field.value=brief;$('#simpleIntakeContinue')?.click()}},40)}}finally{setTimeout(()=>{button.disabled=false},350)}}
  function proxy(id){const target=$(`#${id}`);if(!target)return;if(target.disabled||target.getAttribute('aria-disabled')==='true'){const message=target.title||'Diese Funktion ist in deinem Tarif noch nicht verfügbar.';const error=$('#promptCommandError');if(error)error.textContent=message;return}target.click()}
  function bindHome(home){home.dataset.commandMode='website';$('#promptModeButton',home).addEventListener('click',()=>{const menu=$('#promptModeMenu',home),open=menu.hidden;menu.hidden=!open;$('#promptModeButton',home).setAttribute('aria-expanded',String(open))});home.querySelectorAll('[data-command-mode]').forEach(option=>option.addEventListener('click',()=>selectMode(option.dataset.commandMode)));$('#promptCommandForm',home).addEventListener('submit',submitCommand);$('#promptLatestAction',home).addEventListener('click',()=>proxy('workspaceLastProjectBtn'));document.addEventListener('click',event=>{if(!event.target.closest?.('.prompt-command-top')){$('#promptModeMenu',home).hidden=true;$('#promptModeButton',home).setAttribute('aria-expanded','false')}});$('#promptCommandInput',home).addEventListener('input',()=>{$('#promptCommandError',home).textContent='';syncMeta()});
    // Enter schickt ab - aber nur dort, wo Enter auch wirklich Enter heisst. Auf dem Telefon
    // ist die Taste der Zeilenumbruch, und wer mitten im Schreiben absendet, verliert den Rest
    // des Satzes. Mit Umschalt bleibt es ueberall ein Umbruch, mit Strg/Cmd geht es immer los.
    $('#promptCommandInput',home).addEventListener('keydown',event=>{
      if(event.key!=='Enter'||event.isComposing)return;
      const withModifier=event.metaKey||event.ctrlKey;
      let fine=false;try{fine=matchMedia('(pointer:fine)').matches}catch{}
      if(!withModifier&&(!fine||event.shiftKey))return;
      event.preventDefault();
      const form=$('#promptCommandForm',home);
      if(form?.requestSubmit)form.requestSubmit();else submitCommand(new Event('submit'));
    })}
  function syncHome(){const visible=homeVisible();document.documentElement.classList.toggle('prompt-home-surface',visible);if(!visible)return;const home=ensureHome();if(!home)return;$('#promptHomeName',home).textContent=resolvedName()||'Lars';const access=window.PromptAiAccess||{},plan=access.isAdmin?'Ultimate':String(access.plan||'free');$('#promptHomePlan',home).textContent=plan.charAt(0).toUpperCase()+plan.slice(1);const title=projectTitle(),original=$('#workspaceLastProjectBtn'),latest=$('.prompt-latest',home);
    // Ohne gespeichertes Projekt bot die Zeile etwas an, das es nicht gibt.
    if(latest)latest.hidden=!title;
    $('#promptLatestTitle',home).textContent=title||'Gespeicherten Arbeitsstand fortsetzen';$('#promptLatestAction',home).disabled=Boolean(original?.disabled);syncMeta();ensureThemeToggle();const topbar=$('body>.topbar')||$('.topbar');if(topbar){topbar.hidden=false;topbar.removeAttribute('aria-hidden')}}
  function schedule(){clearTimeout(settleTimer);settleTimer=setTimeout(syncHome,25)}
  function init(){installStyles();syncHome();const observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class','style']});new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});document.addEventListener('click',event=>{if(event.target.closest?.('#brandHome,.guided-clean-exit,#promptWorkflowLoaderClose'))setTimeout(syncHome,80)},true);window.addEventListener('promptai:access',schedule);window.addEventListener('promptai:quota',syncMeta);window.addEventListener('pageshow',schedule);window.addEventListener('promptai:home',syncHome);window.SiteBriefCloud?.subscribe?.(schedule);let count=0;const warm=setInterval(()=>{syncHome();if(++count>24)clearInterval(warm)},180)}
  window.PromptAiHomeSurface={sync:syncHome};
  installStyles();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
