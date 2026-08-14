(()=>{
  'use strict';
  const STORAGE_KEY='sitebrief-v6-state';
  const CONTINUE_KEY='sitebrief-v6-continue-workflow';
  const PENDING_MODE_KEY='prompt-ai-new-project-mode-v2';
  const PENDING_BRIEF_KEY='prompt-ai-new-project-brief-v1';
  const FRESH_PROJECT_KEY='prompt-ai-fresh-project-v1';
  const SIMPLE_START_KEY='prompt-ai-v1-simple-start';
  const CHECKPOINT_KEY='prompt-ai-ui-checkpoint-v2';
  const ADMIN_EMAIL='service.battermann@gmx.de';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];

  function access(){
    const email=String(window.SiteBriefCloud?.user?.email||'').trim().toLowerCase();
    if(email===ADMIN_EMAIL)return {plan:'ultimate',isAdmin:true};
    return window.PromptAiAccess||{plan:'free',isAdmin:false};
  }
  function allowed(mode){
    const plan=access().plan||'free';
    if(mode==='guided')return true;
    if(mode==='auto')return plan==='pro'||plan==='ultimate';
    return plan==='ultimate';
  }
  function installStyles(){
    if($('#projectStartStyles'))return;
    const style=document.createElement('style');style.id='projectStartStyles';style.textContent=`
      #modeSwitch{display:none!important}
      .project-mode-dialog{width:min(760px,calc(100vw - 20px));border:0;padding:0;background:transparent;color:var(--ink)}
      .project-mode-dialog::backdrop{background:rgba(8,12,10,.70);backdrop-filter:blur(12px)}
      .project-mode-frame{position:relative;max-height:calc(100dvh - 20px);overflow:auto;padding:30px;border:1px solid var(--line);border-radius:22px;background:var(--paper);box-shadow:0 28px 90px rgba(0,0,0,.28)}
      .project-mode-close{position:absolute;right:18px;top:18px;width:42px;height:42px;border:1px solid var(--line);border-radius:50%;background:var(--surface);color:var(--ink);font-size:22px}
      .project-mode-head span{display:block;color:var(--accent);font-size:9px;font-weight:850;letter-spacing:.13em}.project-mode-head h2{margin:8px 54px 0 0;font-size:clamp(30px,6vw,48px);line-height:1;letter-spacing:-.045em}.project-mode-head p{display:none}
      .project-mode-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:24px}.project-mode-card{display:flex;min-height:210px;padding:18px;align-items:flex-start;flex-direction:column;text-align:left;border:1px solid var(--line);border-radius:16px;background:var(--surface);color:var(--ink)}.project-mode-card:hover:not(:disabled){border-color:var(--accent);transform:translateY(-1px)}.project-mode-card b{display:block;font-size:19px}.project-mode-card small{display:block;margin-top:8px;color:var(--muted);line-height:1.5}.project-mode-card i{display:block;margin-top:auto;padding-top:18px;color:var(--accent);font-style:normal;font-size:10px;font-weight:800;letter-spacing:.06em}.project-mode-card:disabled{opacity:.55;cursor:not-allowed}.project-mode-card:disabled i{color:var(--muted)}
      .project-mode-foot{display:none}
      @media(max-width:720px){.project-mode-dialog{width:100vw;height:100dvh;max-width:none;max-height:none;margin:0}.project-mode-frame{min-height:100dvh;max-height:none;border:0;border-radius:0;padding:26px 16px 40px}.project-mode-grid{grid-template-columns:1fr}.project-mode-card{min-height:0}.project-mode-card i{margin-top:14px;padding-top:0}}
    `;document.head.appendChild(style);
  }

  function ensureDialog(){
    let dialog=$('#projectModeDialog');if(dialog)return dialog;
    dialog=document.createElement('dialog');dialog.id='projectModeDialog';dialog.className='project-mode-dialog';dialog.innerHTML=`<div class="project-mode-frame"><button type="button" class="project-mode-close" aria-label="Schließen">×</button><div class="project-mode-head"><span>WEBSITE-PROJEKT</span><h2>Wie möchtest du die Internetseite vorbereiten?</h2><p>Diese Auswahl gilt für das ganze Projekt. Während des Ablaufs bleibt der Arbeitsweg fest.</p></div><div class="project-mode-grid"><button type="button" class="project-mode-card" data-project-mode="guided"><b>Mit Rückfragen</b><small>Prompt.ai fragt nur nach Angaben, die den Website-Auftrag wirklich verändern.</small><i>Auswählen →</i></button><button type="button" class="project-mode-card" data-project-mode="auto"><b>Ohne Rückfragen</b><small>Beschreibung und Referenzen rein. Technik, Regeln und Richtungen werden ohne Nachfragen vorbereitet.</small><i>Auswählen →</i></button><button type="button" class="project-mode-card" data-project-mode="expert"><b>Selbst einstellen</b><small>Volle Kontrolle über Agent, KI, Modell, Ausgabeziel, Bausteine, Skills, Vorschauen und Feinschliff.</small><i>Auswählen →</i></button></div><p class="project-mode-foot">„Mit Rückfragen“ ist in Free enthalten. „Ohne Rückfragen“ ab Pro, „Selbst einstellen“ in Ultimate.</p></div>`;
    document.body.appendChild(dialog);
    dialog.querySelector('.project-mode-close').onclick=()=>dialog.close();dialog.addEventListener('cancel',e=>{e.preventDefault();dialog.close()});
    return dialog;
  }
  function refreshCards(){
    const dialog=ensureDialog();$$('[data-project-mode]',dialog).forEach(btn=>{const mode=btn.dataset.projectMode,ok=allowed(mode);btn.disabled=!ok;btn.querySelector('i').textContent=ok?'Auswählen →':mode==='auto'?'Pro erforderlich':'Ultimate erforderlich'});
  }
  function chooseMode(){
    // This used to open a full-page "Mit Rückfragen / Ohne Rückfragen / Selbst einstellen"
    // dialog for every plan above Free. The same three choices already live in the console's
    // inline "Ablauf" picker (promptai-home-final.js, .prompt-setup-sheet) before a project
    // is even started, so asking again here was a duplicate stop for the same decision.
    // Free already skipped this dialog outright; every plan does now, keeping whatever the
    // console (or a previous visit) last set as the active mode.
    return Promise.resolve($('.mode-switch button.active')?.dataset.mode||'guided');
  }
  function hasCurrentProject(){return Boolean($('#projectName')?.value?.trim()||$('#projectDescription')?.value?.trim())}
  async function confirmReplace(reset=false){
    if(!reset&&!hasCurrentProject())return true;
    const text=reset?'Das aktuelle Projekt wird zurückgesetzt. Deine Bibliotheken bleiben erhalten.':'Das aktuelle Projekt wird durch ein leeres neues Website-Projekt ersetzt. Bereits gespeicherte Bibliotheken bleiben erhalten.';
    if(window.PromptAiDialog?.confirm)return Boolean(await window.PromptAiDialog.confirm(text,{title:reset?'Projekt zurücksetzen':'Neue Internetseite',confirmLabel:reset?'Zurücksetzen':'Neu beginnen',danger:true}));
    return window.confirm(text);
  }
  function persistNewProject(mode,brief=''){
    try{
      localStorage.removeItem(STORAGE_KEY);
      // Clearing the store is not enough: browsers restore typed form values across a reload, so
      // the old project name, customer and website came back into a brand new project. The flag
      // tells the app to wipe the fields itself once it is up.
      sessionStorage.setItem(FRESH_PROJECT_KEY,'1');
      localStorage.setItem(CHECKPOINT_KEY,JSON.stringify({mode,step:1,surface:'workflow',at:Date.now()}));
      sessionStorage.setItem(PENDING_MODE_KEY,mode);
      if(brief.trim()){
        sessionStorage.setItem(PENDING_BRIEF_KEY,brief.trim());
        sessionStorage.setItem(SIMPLE_START_KEY,'1');
      }
      sessionStorage.setItem(CONTINUE_KEY,'1');
    }catch{}
  }
  async function startNew(trigger,brief=''){
    // Starting a new project is the plain path through the app, not a destructive action: the
    // previous state is kept in the project history and the libraries are untouched. Only the
    // explicit "Projekt zurücksetzen" still asks.
    const reset=trigger?.id==='resetBtn';if(reset&&!await confirmReplace(true))return;
    const mode=await chooseMode();if(!mode)return;
    persistNewProject(mode,brief);location.reload();
  }
  function interceptNewProject(){
    document.addEventListener('click',event=>{
      const trigger=event.target.closest?.('#workspaceNewProjectBtn,#startNewBtn,#resetBtn');if(!trigger)return;
      if(trigger.id==='workspaceNewProjectBtn'&&window.PromptAiHomeEntry&&!window.PromptAiHomeEntry.isBypass?.(trigger.id)){
        event.preventDefault();event.stopImmediatePropagation();window.PromptAiHomeEntry.openWebsite();return;
      }
      event.preventDefault();event.stopImmediatePropagation();startNew(trigger);
    },true);
  }
  function applyPendingBrief(){
    let brief='';try{brief=sessionStorage.getItem(PENDING_BRIEF_KEY)||''}catch{}if(!brief)return false;
    const field=$('#projectDescription');if(!field)return false;field.value=brief;field.dispatchEvent(new Event('input',{bubbles:true}));field.dispatchEvent(new Event('change',{bubbles:true}));try{sessionStorage.removeItem(PENDING_BRIEF_KEY)}catch{}return true;
  }
  function applyPendingMode(){
    let mode='';try{mode=sessionStorage.getItem(PENDING_MODE_KEY)||''}catch{}if(!mode){applyPendingBrief();return;}
    let attempts=0;const timer=setInterval(()=>{
      attempts++;applyPendingBrief();
      const button=$(`.mode-switch button[data-mode="${mode}"]`);
      const pending=document.documentElement.classList.contains('prompt-access-pending');
      if(button&&!pending&&!button.disabled&&!button.classList.contains('locked')){
        if(!button.classList.contains('active'))button.click();
        try{sessionStorage.removeItem(PENDING_MODE_KEY);localStorage.setItem(CHECKPOINT_KEY,JSON.stringify({mode,step:1,surface:'workflow',at:Date.now()}))}catch{}
        clearInterval(timer);return;
      }
      if(attempts>45)clearInterval(timer);
    },120);
  }
  function keepSwitcherHidden(){
    const switcher=$('#modeSwitch');if(switcher)switcher.hidden=true;
    const observer=new MutationObserver(()=>{if(switcher&&!switcher.hidden)switcher.hidden=true});if(switcher)observer.observe(switcher,{attributes:true,attributeFilter:['hidden']});
  }
  function init(){installStyles();ensureDialog();refreshCards();interceptNewProject();keepSwitcherHidden();applyPendingMode();window.addEventListener('promptai:access',()=>{refreshCards();applyPendingMode()})}
  window.PromptAiProjectStart={startFromBrief:brief=>startNew($('#workspaceNewProjectBtn'),String(brief||'')),startNew};
  installStyles();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
