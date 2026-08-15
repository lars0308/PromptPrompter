(()=>{
  'use strict';
  const CONTINUE_WORKFLOW_KEY='sitebrief-v6-continue-workflow';
  const MODE_HANDOFF_KEY='prompt-ai-mode-handoff-v1';
  const SIMPLE_START_KEY='prompt-ai-v1-simple-start';
  const PENDING_MODE_KEY='prompt-ai-new-project-mode-v2';
  const PENDING_BRIEF_KEY='prompt-ai-new-project-brief-v1';
  let bootStartedAt=Date.now(),bootVisible=false,bootReleaseTimer=0;

  function seedModeHandoff(){
    try{
      if(sessionStorage.getItem(MODE_HANDOFF_KEY))return;
      const simple=sessionStorage.getItem(SIMPLE_START_KEY)==='1',mode=sessionStorage.getItem(PENDING_MODE_KEY)||'guided',brief=sessionStorage.getItem(PENDING_BRIEF_KEY)||'';
      if(simple&&brief.trim())sessionStorage.setItem(MODE_HANDOFF_KEY,JSON.stringify({mode,brief:brief.trim(),createdAt:Date.now()}));
    }catch{}
  }
  function preparePendingRoute(){
    let pending=false;try{pending=Boolean(sessionStorage.getItem(MODE_HANDOFF_KEY))}catch{}if(!pending)return;
    document.documentElement.classList.add('prompt-route-pending');
    if(!document.getElementById('promptRoutePendingStyle')){const s=document.createElement('style');s.id='promptRoutePendingStyle';s.textContent='html.prompt-route-pending body>*:not(#promptModeHandoff){visibility:hidden!important}html.prompt-route-pending #promptModeHandoff{visibility:visible!important}';document.head.appendChild(s)}
    setTimeout(()=>{if(document.documentElement.classList.contains('prompt-route-pending')&&!document.getElementById('promptModeHandoff')){document.documentElement.classList.remove('prompt-route-pending');document.getElementById('promptRoutePendingStyle')?.remove()}},6500)
  }
  function preserveInternalRouteReloads(){
    const observer=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes){if(!(node instanceof Element))continue;const shield=node.matches?.('.prompt-route-shield')?node:node.querySelector?.('.prompt-route-shield');if(!shield)continue;try{sessionStorage.setItem(CONTINUE_WORKFLOW_KEY,'1')}catch{}shield.querySelector('img')?.remove()}});
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  function mountBootIntro(){
    bootVisible=document.documentElement.classList.contains('prompt-app-booting');
    if(!bootVisible)return;
    bootProgress(0);
    setTimeout(releaseBootIntro,7000)
  }
  // The boot line reports how much of the app is really on board (loaded scripts, then access and
  // home readiness) instead of animating for a fixed duration. The last stretch is reserved for
  // the tail so the line never sits at 100% while the screen is still waiting.
  function bootProgress(ratio){
    if(!bootVisible)return;
    window.PromptAiFill?.set(document.querySelector('#promptAppBoot p'),6+Math.max(0,Math.min(1,ratio))*88);
  }
  function releaseBootIntro(){
    if(!bootVisible)return;clearTimeout(bootReleaseTimer);const tick=()=>{const elapsed=Date.now()-bootStartedAt,ready=document.documentElement.classList.contains('prompt-home-ready')&&!document.documentElement.classList.contains('prompt-access-pending');
      // No minimum showtime: when the app is ready the screen finishes right away. The only tail
      // left is the completion blink, so a fast load leaves fast.
      if(ready||elapsed>=5200){bootVisible=false;const boot=document.getElementById('promptAppBoot');window.PromptAiFill?.finish(boot?.querySelector('p'),()=>{boot?.classList.add('is-leaving');setTimeout(()=>{document.documentElement.classList.remove('prompt-app-booting');boot?.classList.remove('is-leaving')},300)});return}
      bootReleaseTimer=setTimeout(tick,80)};tick()
  }

  seedModeHandoff();
  preparePendingRoute();
  preserveInternalRouteReloads();
  mountBootIntro();
  document.documentElement.classList.add('prompt-access-pending');
  if(!document.getElementById('promptAccessBootStyle')){const s=document.createElement('style');s.id='promptAccessBootStyle';s.textContent='html.prompt-access-pending #upgradeBtn,html.prompt-access-pending #upgradeMenuBtn,html.prompt-access-pending #modeSwitch,html.prompt-access-pending .workflow-upgrade,html.prompt-access-pending .quick-upgrade-note,html.prompt-access-pending .quick-tier-block,html.prompt-access-pending #settingsUpgradeNote,html.prompt-access-pending #apiAddonCard,html.prompt-access-pending #currentPlanBadge,html.prompt-access-pending .plan-current{visibility:hidden!important;opacity:0!important;pointer-events:none!important}html.prompt-access-pending #workflowApp:not([hidden]){opacity:0!important}html:not(.prompt-home-ready) .welcome-workspace{visibility:hidden!important;opacity:0!important}';document.head.appendChild(s)}
  const loaded=new Set();
  function load(src){if(loaded.has(src))return Promise.resolve();loaded.add(src);return new Promise(resolve=>{let done=false;const finish=()=>{if(done)return;done=true;resolve()};const s=document.createElement('script');s.src=src;s.async=false;s.onload=finish;s.onerror=finish;document.head.appendChild(s);setTimeout(finish,8000)})}
  const CORE_SCRIPT='./admin-console-core.js?v=20260816-3';
  async function loadCore(){const original=document.addEventListener;document.addEventListener=function(type,listener,options){if(type==='DOMContentLoaded'&&document.readyState!=='loading'){queueMicrotask(()=>listener.call(document,new Event('DOMContentLoaded')));return}return original.call(document,type,listener,options)};await load(CORE_SCRIPT);document.addEventListener=original}
  // One list instead of a chain of awaits: the boot screen reports real progress by counting how
  // many of these are on board. 'core' is admin-console-core, which needs the loadCore() wrapper.
  const CRITICAL_SCRIPTS=['./error-beacon.js?v=20260816-2','./cloud-fast-bundle.js?v=20260816-2','./mode-handoff-fix.js?v=20260816-2','./transition-polish.js?v=20260816-5','./announcement-popup.js?v=20260816-1','core','./ui-regression-fixes.js?v=20260816-1','./project-start-ui.js?v=20260816-1','./stability-ui.js?v=20260816-1','./mode-flow-ui.js?v=20260816-3','./system-ai-routing.js?v=20260816-2','./system-ai-studio.js?v=20260816-2','./product-polish.js?v=20260816-2','./workflow-cleanup.js?v=20260816-3','./preview-mode-fix.js?v=20260816-1','./free-prompt-ui.js?v=20260816-2','./free-prompt-presets.js?v=20260816-2','./home-entry-ui.js?v=20260816-5','./website-build-ui.js?v=20260816-3','./project-extras-ui.js?v=20260816-2','./welcome-intro-ui.js?v=20260816-1','./project-context-ui.js?v=20260816-1','./save-toast-ui.js?v=20260816-1','./flow-guards-ui.js?v=20260816-1','./settings-connections-ui.js?v=20260816-4','./user-preferences-ui.js?v=20260816-1','./streamlined-project-flow.js?v=20260816-2','./guided-clean-ui.js?v=20260816-3','./unified-ui-v1.js?v=20260816-1','./trial-fix-ui.js?v=20260816-1','./subscription-ui.js?v=20260816-2','./usage-quota-ui.js?v=20260816-3','./ux-stability-fix.js?v=20260816-4','./ui-polish-final.js?v=20260816-1','./ui-final-touch.js?v=20260816-2','./promptai-experience-v1.js?v=20260816-2','./promptai-loading-v2.js?v=20260816-4','./promptai-experience-v2.js?v=20260816-2','./promptai-home-final.js?v=20260817-5','./brand-werkstatt.js?v=20260816-2','./promptai-nav-drawer.js?v=20260817-1'];
  // The scripts have to *run* in order (later files override earlier CSS layers), but they can be
  // fetched all at once. Without this the first visit pays one round trip per file, one after the
  // other; the preload warms the cache in parallel so load() below mostly hits it.
  function preloadCritical(){
    const frag=document.createDocumentFragment();
    for(const src of [...CRITICAL_SCRIPTS.filter(x=>x!=='core'),CORE_SCRIPT]){
      const link=document.createElement('link');link.rel='preload';link.as='script';link.href=src;frag.appendChild(link);
    }
    document.head.appendChild(frag);
  }
  async function critical(){preloadCritical();let ready=0;for(const src of CRITICAL_SCRIPTS){await (src==='core'?loadCore():load(src));bootProgress(++ready/CRITICAL_SCRIPTS.length)}await load('./promptai-full-app-design.js?v=20260817-12');document.querySelector('#freePromptCategory option[value="website"]')?.remove();const intro=document.querySelector('#freePromptDialog .free-prompt-intro');if(intro)intro.textContent='Wähle jetzt Typ und Ziel-Tool. Weitere Angaben sind optional.';document.documentElement.classList.add('prompt-home-ready')}
  async function adminExtras(){await load('./admin-ai-ui.js?v=20260816-1');await load('./admin-prompts-ui.js?v=20260816-3');await load('./admin-tokens-ui.js?v=20260816-1');await load('./system-ai-studio.js?v=20260816-2')}
  async function previewExtras(){await load('./sandbox-preview.js?v=20260816-2');await load('./github-sandbox.js?v=20260816-2')}
  async function accountExtras(){await load('./learning-controls.js?v=20260816-2')}
  function lazy(){document.addEventListener('click',e=>{if(e.target.closest?.('#adminBtn'))adminExtras();if(e.target.closest?.('#workspacePreviewBtn'))previewExtras();if(e.target.closest?.('#accountBtn,#welcomeAccountBtn'))accountExtras()},{capture:true});const idle=window.requestIdleCallback||((fn)=>setTimeout(fn,900));idle(async()=>{await load('./project-history.js?v=20260816-1');await load('./generator-selection.js?v=20260816-1')},{timeout:2500})}
  critical().then(()=>{lazy();releaseBootIntro()}).catch(()=>releaseBootIntro());
})();
