(()=>{
  'use strict';
  const CONTINUE_WORKFLOW_KEY='sitebrief-v6-continue-workflow';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  let closeTimer=0;

  function styles(){
    if($('#promptIntroFlowStyles'))return;const s=document.createElement('style');s.id='promptIntroFlowStyles';s.textContent=`
      #welcomeIntroDialog.welcome-intro-dialog{position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;background:var(--paper,#f8fafb)!important;overflow:hidden!important}
      #welcomeIntroDialog.welcome-intro-dialog::backdrop{background:var(--paper,#f8fafb)!important;backdrop-filter:none!important}
      #welcomeIntroDialog.welcome-intro-dialog>.dialog-frame{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:var(--paper,#f8fafb)!important;overflow:hidden!important}
      #welcomeIntroDialog .welcome-intro-body,#welcomeIntroDialog .intro-close{display:none!important}
      .prompt-logo-splash{position:absolute;inset:0;display:grid;place-items:center;padding:24px;background:var(--paper,#f8fafb);color:var(--ink,#171814)}.prompt-logo-splash-inner{width:min(240px,58vw);text-align:center}.prompt-logo-splash img{display:block;width:min(150px,38vw);height:min(150px,38vw);margin:0 auto;object-fit:contain;filter:drop-shadow(0 14px 30px rgba(18,79,124,.10))}.prompt-logo-splash strong{display:block;margin-top:14px;font-size:22px;letter-spacing:-.025em}.prompt-logo-load{position:relative;height:4px;margin:24px auto 0;overflow:hidden;border-radius:99px;background:color-mix(in srgb,#278bc2 14%,var(--line,#d8dcdf));width:100%}.prompt-logo-load i{position:absolute;inset:0 auto 0 0;width:38%;border-radius:99px;background:#278bc2;animation:promptLogoLoad 1.05s cubic-bezier(.4,0,.2,1) infinite}@keyframes promptLogoLoad{0%{transform:translateX(-110%)}60%{transform:translateX(175%)}100%{transform:translateX(300%)}}
      .prompt-route-shield img{display:none!important}.prompt-route-shield>div{gap:8px!important;transform:none!important}.prompt-route-shield span{font-size:10px!important;letter-spacing:.08em!important;text-transform:none!important}
      @media(prefers-reduced-motion:reduce){.prompt-logo-load i{animation-duration:1.8s}}
    `;document.head.appendChild(s)
  }

  function stopVideo(dialog){const video=$('.welcome-intro-video',dialog);if(!video)return;try{video.pause();video.removeAttribute('autoplay');video.removeAttribute('loop');video.preload='none';video.removeAttribute('src');$$('source',video).forEach(source=>source.removeAttribute('src'));video.load()}catch{}}
  function prepare(dialog){if(!dialog)return;stopVideo(dialog);const frame=$('.dialog-frame',dialog)||dialog;if(!$('.prompt-logo-splash',frame)){const splash=document.createElement('div');splash.className='prompt-logo-splash';splash.innerHTML='<div class="prompt-logo-splash-inner"><img src="./sitebrief-logo.svg?v=4" alt="Prompt.ai"><strong>Prompt.ai</strong><div class="prompt-logo-load" aria-hidden="true"><i></i></div></div>';frame.appendChild(splash)}}
  function closeWhenReady(dialog){clearTimeout(closeTimer);const started=Date.now();const tick=()=>{if(!dialog?.open)return;const elapsed=Date.now()-started,ready=!document.documentElement.classList.contains('prompt-access-pending');if((ready&&elapsed>=700)||elapsed>=4200){try{dialog.close()}catch{}return}closeTimer=setTimeout(tick,90)};tick()}

  function patchIntroOpen(){
    if(typeof HTMLDialogElement==='undefined')return;const proto=HTMLDialogElement.prototype,previous=proto.showModal;if(previous?.__promptLogoSplash)return;
    function patched(...args){if(this.id==='welcomeIntroDialog'){prepare(this);const result=previous.apply(this,args);closeWhenReady(this);return result}return previous.apply(this,args)}patched.__promptLogoSplash=true;proto.showModal=patched
  }
  function observe(){const intro=$('#welcomeIntroDialog');if(!intro)return;prepare(intro);new MutationObserver(()=>{if(intro.open){prepare(intro);closeWhenReady(intro)}}).observe(intro,{attributes:true,attributeFilter:['open']})}
  function keepIntroOutOfInternalProjectReloads(){const observer=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes){if(!(node instanceof Element))continue;const shield=node.matches?.('.prompt-route-shield')?node:node.querySelector?.('.prompt-route-shield');if(!shield)continue;try{sessionStorage.setItem(CONTINUE_WORKFLOW_KEY,'1')}catch{}shield.querySelector('img')?.remove()}});observer.observe(document.documentElement,{childList:true,subtree:true})}

  styles();patchIntroOpen();keepIntroOutOfInternalProjectReloads();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe,{once:true});else observe();
})();
