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
  function internalReload(){try{return sessionStorage.getItem(CONTINUE_WORKFLOW_KEY)==='1'||Boolean(sessionStorage.getItem(MODE_HANDOFF_KEY))}catch{return false}}
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
    if(internalReload()||document.getElementById('promptAppBoot'))return;
    bootVisible=true;document.documentElement.classList.add('prompt-app-booting');
    const style=document.createElement('style');style.id='promptAppBootStyle';style.textContent=`
      html.prompt-app-booting,html.prompt-app-booting body{overflow:hidden!important}
      #promptAppBoot{position:fixed;z-index:2147483647;inset:0;display:grid;place-items:center;padding:28px 22px;background:var(--paper,#f5f6f7);color:var(--ink,#171814);opacity:1;transition:opacity .28s ease;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
      #promptAppBoot.is-leaving{opacity:0;pointer-events:none}
      #promptAppBoot>div{width:min(520px,100%);text-align:center}
      #promptAppBoot img{display:block;width:min(126px,31vw);height:min(126px,31vw);margin:0 auto;object-fit:contain;filter:drop-shadow(0 16px 32px rgba(20,88,129,.10))}
      #promptAppBoot strong{display:block;margin-top:17px;font-size:clamp(28px,7vw,42px);line-height:1;letter-spacing:-.045em}
      #promptAppBoot p{margin:10px auto 0;color:var(--muted,#6e6c64);font-size:13px;line-height:1.5}
      #promptAppBoot .boot-track{position:relative;width:min(260px,70vw);height:3px;margin:25px auto 0;overflow:hidden;border-radius:99px;background:color-mix(in srgb,#1689c7 13%,var(--line,#d8dcdf))}
      #promptAppBoot .boot-track i{position:absolute;inset:0 auto 0 0;width:42%;border-radius:99px;background:#1689c7;animation:promptAppBootTrack 1.05s cubic-bezier(.4,0,.2,1) infinite}
      #promptAppBoot small{display:block;margin-top:11px;color:var(--muted,#6e6c64);font-size:9px;letter-spacing:.04em}
      @keyframes promptAppBootTrack{0%{transform:translateX(-115%)}60%{transform:translateX(175%)}100%{transform:translateX(300%)}}
      @media(prefers-reduced-motion:reduce){#promptAppBoot .boot-track i{animation-duration:1.8s}}
    `;document.head.appendChild(style);
    const boot=document.createElement('section');boot.id='promptAppBoot';boot.setAttribute('aria-live','polite');boot.innerHTML='<div><img src="./sitebrief-logo.svg?v=4" alt="Prompt.ai"><strong>Prompt.ai</strong><p>Dein Arbeitsbereich wird vorbereitet.</p><div class="boot-track" aria-hidden="true"><i></i></div><small>Projekte, Konto und Werkzeuge laden im Hintergrund.</small></div>';document.body.appendChild(boot)
    setTimeout(releaseBootIntro,7000)
  }
  function releaseBootIntro(){
    if(!bootVisible)return;clearTimeout(bootReleaseTimer);const tick=()=>{const elapsed=Date.now()-bootStartedAt,ready=document.documentElement.classList.contains('prompt-home-ready')&&!document.documentElement.classList.contains('prompt-access-pending');if((ready&&elapsed>=1050)||elapsed>=5200){const boot=document.getElementById('promptAppBoot');boot?.classList.add('is-leaving');setTimeout(()=>{boot?.remove();document.getElementById('promptAppBootStyle')?.remove();document.documentElement.classList.remove('prompt-app-booting');bootVisible=false},300);return}bootReleaseTimer=setTimeout(tick,80)};tick()
  }

  seedModeHandoff();
  preparePendingRoute();
  preserveInternalRouteReloads();
  mountBootIntro();
  document.documentElement.classList.add('prompt-access-pending');
  if(!document.getElementById('promptAccessBootStyle')){const s=document.createElement('style');s.id='promptAccessBootStyle';s.textContent='html.prompt-access-pending #upgradeBtn,html.prompt-access-pending #upgradeMenuBtn,html.prompt-access-pending #modeSwitch,html.prompt-access-pending .workflow-upgrade,html.prompt-access-pending .quick-upgrade-note,html.prompt-access-pending .quick-tier-block,html.prompt-access-pending #settingsUpgradeNote,html.prompt-access-pending #apiAddonCard,html.prompt-access-pending #currentPlanBadge,html.prompt-access-pending .plan-current{visibility:hidden!important;opacity:0!important;pointer-events:none!important}html.prompt-access-pending #workflowApp:not([hidden]){opacity:0!important}html:not(.prompt-home-ready) .welcome-workspace{visibility:hidden!important;opacity:0!important}';document.head.appendChild(s)}
  const loaded=new Set();
  function load(src){if(loaded.has(src))return Promise.resolve();loaded.add(src);return new Promise(resolve=>{let done=false;const finish=()=>{if(done)return;done=true;resolve()};const s=document.createElement('script');s.src=src;s.async=false;s.onload=finish;s.onerror=finish;document.head.appendChild(s);setTimeout(finish,8000)})}
  async function loadCore(){const original=document.addEventListener;document.addEventListener=function(type,listener,options){if(type==='DOMContentLoaded'&&document.readyState!=='loading'){queueMicrotask(()=>listener.call(document,new Event('DOMContentLoaded')));return}return original.call(document,type,listener,options)};await load('./admin-console-core.js?v=20260810-9');document.addEventListener=original}
  async function critical(){await load('./cloud-fast-bundle.js?v=20260810-1');await load('./mode-handoff-fix.js?v=20260810-8');await load('./transition-polish.js?v=20260810-5');await loadCore();await load('./ui-regression-fixes.js?v=20260810-10');await load('./project-start-ui.js?v=20260810-5');await load('./stability-ui.js?v=20260810-12');await load('./mode-flow-ui.js?v=20260810-7');await load('./system-ai-routing.js?v=20260810-2');await load('./system-ai-studio.js?v=20260810-2');await load('./product-polish.js?v=20260810-3');await load('./workflow-cleanup.js?v=20260810-4');await load('./preview-mode-fix.js?v=20260810-1');await load('./free-prompt-ui.js?v=20260810-2');await load('./free-prompt-presets.js?v=20260810-1');await load('./home-entry-ui.js?v=20260810-2');await load('./streamlined-project-flow.js?v=20260810-4');await load('./guided-clean-ui.js?v=20260810-3');await load('./unified-ui-v1.js?v=20260810-1');await load('./trial-fix-ui.js?v=20260810-1');await load('./subscription-ui.js?v=20260810-1');await load('./usage-quota-ui.js?v=20260810-3');await load('./ux-stability-fix.js?v=20260810-3');await load('./ui-polish-final.js?v=20260810-4');await load('./ui-final-touch.js?v=20260810-3');await load('./legal-pages.js?v=20260810-1');await load('./promptai-experience-v1.js?v=20260810-2');await load('./promptai-loading-v2.js?v=20260810-3');await load('./promptai-experience-v2.js?v=20260810-2');await load('./promptai-home-final.js?v=20260810-2');document.querySelector('#freePromptCategory option[value="website"]')?.remove();const intro=document.querySelector('#freePromptDialog .free-prompt-intro');if(intro)intro.textContent='Wähle jetzt Typ und Ziel-Tool. Weitere Angaben sind optional.';document.documentElement.classList.add('prompt-home-ready')}
  async function adminExtras(){await load('./admin-ai-ui.js?v=20260810-3');await load('./system-ai-studio.js?v=20260810-2')}
  async function previewExtras(){await load('./sandbox-preview.js?v=20260810-1');await load('./github-sandbox.js?v=20260810-1')}
  async function accountExtras(){await load('./learning-controls.js?v=20260810-1')}
  function lazy(){document.addEventListener('click',e=>{if(e.target.closest?.('#adminBtn'))adminExtras();if(e.target.closest?.('#workspacePreviewBtn'))previewExtras();if(e.target.closest?.('#accountBtn,#welcomeAccountBtn'))accountExtras()},{capture:true});const idle=window.requestIdleCallback||((fn)=>setTimeout(fn,900));idle(async()=>{await load('./project-history.js?v=20260810-1');await load('./generator-selection.js?v=20260810-2')},{timeout:2500})}
  critical().then(()=>{lazy();releaseBootIntro()}).catch(()=>releaseBootIntro());
})();