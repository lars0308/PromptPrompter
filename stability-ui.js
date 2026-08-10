(()=>{
  'use strict';

  const ADMIN_EMAIL='service.battermann@gmx.de';
  const STATE_KEY='sitebrief-v6-state';
  const CONTINUE_WORKFLOW_KEY='sitebrief-v6-continue-workflow';
  const CHECKPOINT_KEY='prompt-ai-ui-checkpoint-v2';
  const BOOT_AT=Date.now();
  let stableBundleWrapper=null;
  let restoreDone=false;
  let logoutRequested=false;
  let userTouchedMode=false;
  let userInteracted=false;
  let snapshotTimer=0;

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];

  function readJson(storage,key,fallback=null){
    try{return JSON.parse(storage.getItem(key)||'null')??fallback}catch{return fallback}
  }
  function ownerEmail(){return String(window.SiteBriefCloud?.user?.email||'').trim().toLowerCase()===ADMIN_EMAIL}
  function effectiveAccess(){
    const current=window.PromptAiAccess||{};
    const owner=ownerEmail();
    return {...current,isAdmin:owner||Boolean(current.isAdmin),plan:owner?'ultimate':(current.plan||'free')};
  }
  function allowedModes(plan){return plan==='ultimate'?['guided','auto','expert']:plan==='pro'?['guided','auto']:['guided']}

  function injectStyles(){
    if($('#promptStabilityStyles'))return;
    const style=document.createElement('style');
    style.id='promptStabilityStyles';
    style.textContent=`
      html.prompt-access-pending #upgradeBtn,
      html.prompt-access-pending #upgradeMenuBtn{visibility:hidden!important;opacity:0!important;pointer-events:none!important}
      html.prompt-access-pending #workflowApp:not([hidden]){opacity:0!important;pointer-events:none!important}
      #workflowApp{transition:opacity .28s ease}
      .topbar-menu #signOutBtn{width:100%;justify-content:flex-start;border:0!important;background:transparent!important;box-shadow:none!important;padding:10px 12px!important;color:var(--danger,#b84435)!important}
      .prompt-route-shield{position:fixed;z-index:2147483647;inset:0;display:grid;place-items:center;background:color-mix(in srgb,var(--paper,#0b0e0c) 94%,transparent);backdrop-filter:blur(16px);opacity:0;animation:promptShieldIn .28s ease forwards;pointer-events:all}
      .prompt-route-shield>div{display:grid;justify-items:center;gap:14px;transform:translateY(8px);animation:promptShieldContent .34s ease forwards}
      .prompt-route-shield img{width:min(34vw,210px);height:min(34vw,210px);object-fit:contain;filter:drop-shadow(0 18px 42px rgba(0,0,0,.18))}
      .prompt-route-shield span{font-size:10px;font-weight:800;letter-spacing:.11em;color:var(--muted);text-transform:uppercase}
      @keyframes promptShieldIn{to{opacity:1}}@keyframes promptShieldContent{to{transform:none}}
      @media(prefers-reduced-motion:no-preference){
        #welcomePage:not([hidden]),#workflowApp:not([hidden]){animation:promptSurfaceIn .32s cubic-bezier(.22,.75,.25,1) both}
        .step-panel.active{animation:promptStepIn .26s cubic-bezier(.22,.75,.25,1) both}
        dialog[open]:not(#welcomeIntroDialog) .dialog-frame{animation:promptDialogIn .28s cubic-bezier(.22,.75,.25,1) both}
        .topbar-menu.open{animation:promptMenuIn .2s ease both}
        @keyframes promptSurfaceIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
        @keyframes promptStepIn{from{opacity:.45;transform:translateY(7px)}to{opacity:1;transform:none}}
        @keyframes promptDialogIn{from{opacity:0;transform:translateY(10px) scale(.992)}to{opacity:1;transform:none}}
        @keyframes promptMenuIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
      }
    `;
    document.head.appendChild(style);
  }

  function setAccessPending(){
    document.documentElement.classList.add('prompt-access-pending');
  }
  function markAccessReady(){
    document.documentElement.classList.remove('prompt-access-pending');
    document.documentElement.classList.add('prompt-access-ready');
  }

  function normalizeBundle(bundle,cloud){
    const value=bundle&&typeof bundle==='object'?bundle:{};
    const sub=value.subscription||{};
    const active=['active','trialing'].includes(sub.status);
    const paidPlan=active&&['pro','ultimate'].includes(sub.plan)?sub.plan:'free';
    const owner=String(cloud?.user?.email||'').trim().toLowerCase()===ADMIN_EMAIL;
    let ownApiKeys=Boolean(sub.ownApiKeys)||paidPlan==='ultimate';
    if(paidPlan==='pro'&&sub.ownApiKeys===false)ownApiKeys=false;
    value.subscription={...sub,plan:paidPlan,isAdmin:owner,ownApiKeys};
    const personal=Array.isArray(value.aiConnections)?value.aiConnections.filter(item=>!item?.system):[];
    window.PromptAiAccess={plan:owner?'ultimate':paidPlan,isAdmin:owner,ownApiKeys,hasPersonalAi:personal.length>0};
    setTimeout(()=>{
      window.dispatchEvent(new CustomEvent('sitebrief:admin',{detail:{isAdmin:owner}}));
      window.dispatchEvent(new CustomEvent('promptai:access',{detail:window.PromptAiAccess}));
    },0);
    return value;
  }

  function wrapCloudBundle(){
    const cloud=window.SiteBriefCloud;
    if(!cloud?.loadUserBundle)return false;
    if(cloud.loadUserBundle===stableBundleWrapper)return true;
    const native=cloud.loadUserBundle.bind(cloud);
    stableBundleWrapper=async(...args)=>normalizeBundle(await native(...args),cloud);
    cloud.loadUserBundle=stableBundleWrapper;
    return true;
  }

  function primeCloudAccess(){
    wrapCloudBundle();
    const ready=window.SiteBriefCloudReady;
    if(ready?.then){
      ready.then(result=>{
        wrapCloudBundle();
        if(!result?.user)markAccessReady();
        else setTimeout(()=>{if(document.documentElement.classList.contains('prompt-access-pending'))markAccessReady()},3500);
      }).catch(()=>markAccessReady());
    }else setTimeout(()=>{wrapCloudBundle();if(!window.SiteBriefCloud?.user)markAccessReady()},1200);
  }

  function checkpoint(){
    const mode=$('.mode-switch button.active')?.dataset.mode||'';
    const step=Number($('.step-panel.active')?.dataset.stepPanel||0)||1;
    const workflow=$('#workflowApp');
    const surface=workflow&&!workflow.hidden?'workflow':'welcome';
    try{localStorage.setItem(CHECKPOINT_KEY,JSON.stringify({mode,step,surface,at:Date.now()}))}catch{}
  }
  function scheduleCheckpoint(){clearTimeout(snapshotTimer);snapshotTimer=setTimeout(checkpoint,120)}
  function forceCoreLocalSave(){
    const model=$('#generatorModel');
    if(model)model.dispatchEvent(new Event('input',{bubbles:true}));
    checkpoint();
  }

  function restoreStableWorkspace(){
    if(restoreDone||Date.now()-BOOT_AT>9000)return;
    const access=effectiveAccess();
    if(ownerEmail()&&!access.isAdmin)return;
    const saved=readJson(localStorage,STATE_KEY,{})||{};
    const cp=readJson(localStorage,CHECKPOINT_KEY,{})||{};
    const wantedMode=String(saved.mode||cp.mode||'guided');
    if(!userTouchedMode&&allowedModes(access.plan).includes(wantedMode)){
      const button=$(`.mode-switch button[data-mode="${CSS.escape(wantedMode)}"]`);
      if(button&&!button.classList.contains('locked')&&!button.disabled&&!button.classList.contains('active'))button.click();
    }
    if(!userInteracted){
      const savedAgent=String(saved.targetAgent||'');
      const agent=savedAgent?$(`#agentSelector [data-agent="${CSS.escape(savedAgent)}"]`):null;
      if(agent&&!agent.hidden&&!agent.disabled&&!agent.classList.contains('active'))agent.click();
      const savedOutput=String(saved.outputTarget||'');
      const output=savedOutput?$(`#outputTargetSelector [data-output="${CSS.escape(savedOutput)}"]`):null;
      if(output&&!output.classList.contains('plan-locked')&&!output.classList.contains('active'))output.click();
      const count=$('#conceptCount'),savedCount=Number(saved.conceptCount||0);
      if(count&&savedCount&&[...count.options].some(option=>Number(option.value)===savedCount)){count.value=String(savedCount);count.dispatchEvent(new Event('change',{bubbles:true}))}
      const preview=$('#previewFormat'),savedPreview=String(saved.previewFormat||'');
      if(preview&&savedPreview&&[...preview.options].some(option=>option.value===savedPreview)){preview.value=savedPreview;preview.dispatchEvent(new Event('change',{bubbles:true}))}
      const savedStep=Number(saved.currentStep||cp.step||0),stepButton=savedStep?$(`.step-nav[data-step="${savedStep}"]`):null;
      if(stepButton&&!stepButton.hidden&&!stepButton.disabled)stepButton.click();
    }
    if(cp.surface==='workflow'&&Date.now()-Number(cp.at||0)<12*60*60*1000){
      const welcome=$('#welcomePage'),workflow=$('#workflowApp'),switcher=$('#modeSwitch');
      if(workflow?.hidden){if(welcome)welcome.hidden=true;workflow.hidden=false;if(switcher)switcher.hidden=false;}
    }
    restoreDone=true;
    markAccessReady();
    checkpoint();
  }

  function enforceOwnerAdmin(){
    const button=$('#adminBtn'),dialog=$('#adminDialog'),owner=ownerEmail();
    if(button)button.hidden=!owner;
    if(!owner&&dialog?.open)dialog.close();
    if(owner)window.dispatchEvent(new CustomEvent('sitebrief:admin',{detail:{isAdmin:true}}));
  }

  function robustAdminOpen(){
    document.addEventListener('click',event=>{
      const button=event.target.closest?.('#adminBtn');
      if(!button||!ownerEmail())return;
      setTimeout(()=>{
        const dialog=$('#adminDialog');
        try{if(dialog&&!dialog.open)dialog.showModal()}catch{}
        setTimeout(()=>$('#adminReloadBtn')?.click(),30);
      },0);
    },true);
  }

  function closeTopbarMenu(){
    const menu=$('#topbarMenu'),toggle=$('#topbarMenuToggle');
    menu?.classList.remove('open');
    toggle?.setAttribute('aria-expanded','false');
  }

  function moveSignOutToMenu(){
    const button=$('#signOutBtn'),menu=$('#topbarMenu');if(!button||!menu)return;
    if(button.parentElement!==menu)menu.appendChild(button);
    button.className='text-btn menu-signout';
    button.textContent='Abmelden';
    refreshSessionChrome();
  }
  function refreshSessionChrome(){
    const button=$('#signOutBtn');if(button)button.hidden=!window.SiteBriefCloud?.user;
    enforceOwnerAdmin();
  }

  function showLoginAfterLogout(){
    setTimeout(()=>{
      $$('dialog[open]').forEach(dialog=>{if(dialog.id!=='accountDialog')try{dialog.close()}catch{}});
      const dialog=$('#accountDialog');if(!dialog)return;
      dialog.classList.remove('guest-gate','auth-transitioning');
      const out=$('#accountLoggedOut'),inside=$('#accountLoggedIn');if(out)out.hidden=false;if(inside)inside.hidden=true;
      const kicker=$('#accountDialogKicker'),title=$('#accountDialogTitle');if(kicker)kicker.textContent='KONTO';if(title)title.textContent='Anmelden';
      try{if(!dialog.open)dialog.showModal()}catch{}
      setTimeout(()=>$('#authEmail')?.focus(),120);
    },120);
  }

  function bindLogoutFlow(){
    const button=$('#signOutBtn');if(button)button.addEventListener('click',()=>{logoutRequested=true;forceCoreLocalSave();closeTopbarMenu();setTimeout(()=>{if(logoutRequested&&!window.SiteBriefCloud?.user){logoutRequested=false;showLoginAfterLogout()}},700)});
    window.SiteBriefCloud?.subscribe?.((event,payload)=>{
      if(event!=='auth')return;
      refreshSessionChrome();
      if(!payload?.user&&logoutRequested){logoutRequested=false;showLoginAfterLogout()}
    });
  }

  function showRouteShield(label='Wird vorbereitet…'){
    let shield=$('.prompt-route-shield');
    if(shield)return shield;
    shield=document.createElement('div');shield.className='prompt-route-shield';shield.innerHTML=`<div><img src="./sitebrief-logo.svg?v=4" alt=""><span>${label}</span></div>`;document.body.appendChild(shield);return shield;
  }
  const nextPaint=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));

  function interceptHardProjectReloads(){
    document.addEventListener('click',async event=>{
      const button=event.target.closest?.('#workspaceNewProjectBtn,#startNewBtn,#resetBtn');if(!button)return;
      event.preventDefault();event.stopImmediatePropagation();
      const reset=button.id==='resetBtn';
      const hasContent=Boolean($('#projectName')?.value.trim()||$('#projectDescription')?.value.trim());
      if(reset||hasContent){
        const ok=await window.PromptAiDialog?.confirm?.(reset?'Das aktuelle Projekt wird zurückgesetzt. Deine Bibliotheken bleiben erhalten.':'Das aktuelle Projekt wird durch ein leeres neues Projekt ersetzt. Bereits gespeicherte Bibliotheken bleiben erhalten.',{title:reset?'Projekt zurücksetzen':'Neues Projekt',confirmLabel:reset?'Zurücksetzen':'Neu beginnen',danger:true});
        if(!ok)return;
      }
      forceCoreLocalSave();
      showRouteShield(reset?'Projekt wird zurückgesetzt':'Neues Projekt wird vorbereitet');
      await nextPaint();
      try{localStorage.removeItem(STATE_KEY)}catch{}
      if(!reset)sessionStorage.setItem(CONTINUE_WORKFLOW_KEY,'1');
      setTimeout(()=>location.reload(),360);
    },true);
  }

  function bindSmoothStateTracking(){
    document.addEventListener('click',event=>{
      if(event.isTrusted)userInteracted=true;
      if(event.target.closest?.('.mode-switch button'))userTouchedMode=true;
      if(event.target.closest?.('#brandHome'))setTimeout(checkpoint,0);else scheduleCheckpoint();
    },true);
    document.addEventListener('input',event=>{if(event.isTrusted)userInteracted=true;scheduleCheckpoint()},true);
    document.addEventListener('change',event=>{if(event.isTrusted)userInteracted=true;scheduleCheckpoint()},true);
    window.addEventListener('pagehide',forceCoreLocalSave);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')forceCoreLocalSave()});
  }

  function bindAccessEvents(){
    window.addEventListener('promptai:access',event=>{
      const userEmail=String(window.SiteBriefCloud?.user?.email||'').trim().toLowerCase();
      if(userEmail===ADMIN_EMAIL&&!event.detail?.isAdmin)return;
      refreshSessionChrome();
      setTimeout(restoreStableWorkspace,60);
    });
    window.addEventListener('sitebrief:admin',event=>{
      if(ownerEmail()&&!event.detail?.isAdmin){setTimeout(enforceOwnerAdmin,0);return}
      refreshSessionChrome();
    });
  }

  function init(){
    injectStyles();
    wrapCloudBundle();
    moveSignOutToMenu();
    bindLogoutFlow();
    robustAdminOpen();
    interceptHardProjectReloads();
    bindSmoothStateTracking();
    bindAccessEvents();
    refreshSessionChrome();
    if(!window.SiteBriefCloud?.user)setTimeout(()=>{if(!window.SiteBriefCloud?.user)markAccessReady()},900);
  }

  setAccessPending();
  injectStyles();
  primeCloudAccess();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
