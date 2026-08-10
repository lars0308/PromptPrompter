(()=>{
  'use strict';

  const ONBOARDING_KEY='prompt-ai-welcome-seen-v1';
  const CONTINUE_WORKFLOW_KEY='sitebrief-v6-continue-workflow';
  const $=(selector,root=document)=>root.querySelector(selector);

  function injectStyles(){
    if($('#promptIntroFlowStyles'))return;
    const style=document.createElement('style');
    style.id='promptIntroFlowStyles';
    style.textContent=`
      #welcomeIntroDialog.welcome-intro-dialog{position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;background:#fff!important;overflow:hidden!important}
      #welcomeIntroDialog.welcome-intro-dialog::backdrop{background:#fff!important;backdrop-filter:none!important}
      #welcomeIntroDialog.welcome-intro-dialog>.dialog-frame{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;margin:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:#fff!important;color:#171814!important}
      #welcomeIntroDialog.welcome-intro-dialog.splash-only>.dialog-frame{overflow:hidden!important}
      #welcomeIntroDialog.welcome-intro-dialog.splash-only .welcome-intro-body{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;margin:0!important;padding:0!important;display:block!important;background:#fff!important}
      #welcomeIntroDialog.welcome-intro-dialog.splash-only .welcome-intro-body>:not(.welcome-intro-video){display:none!important}
      #welcomeIntroDialog.welcome-intro-dialog.splash-only .welcome-intro-video{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;aspect-ratio:auto!important;object-fit:cover!important;object-position:center!important;margin:0!important;border:0!important;border-radius:0!important;background:#fff!important;box-shadow:none!important;transform:none!important}
      #welcomeIntroDialog.welcome-intro-dialog .intro-close{display:grid!important;place-items:center!important;position:fixed!important;z-index:8!important;top:max(16px,env(safe-area-inset-top))!important;right:max(16px,env(safe-area-inset-right))!important;width:46px!important;height:46px!important;border:0!important;border-radius:50%!important;background:rgba(20,22,19,.74)!important;color:#fff!important;text-decoration:none!important;backdrop-filter:blur(12px)!important}
      #welcomeIntroDialog.welcome-intro-dialog.first-run>.dialog-frame{overflow:auto!important;overscroll-behavior:contain!important}
      #welcomeIntroDialog.welcome-intro-dialog.first-run .welcome-intro-body{width:min(900px,100%)!important;min-height:100%!important;margin:0 auto!important;padding:clamp(24px,4vw,48px)!important;background:#fff!important}
      #welcomeIntroDialog.welcome-intro-dialog.first-run .welcome-intro-video{display:block!important;width:100%!important;height:min(44dvh,460px)!important;min-height:260px!important;aspect-ratio:auto!important;object-fit:cover!important;object-position:center!important;margin:0 0 28px!important;border:0!important;border-radius:18px!important;background:#fff!important;box-shadow:none!important}
      .prompt-route-shield img{display:none!important}
      .prompt-route-shield>div{gap:8px!important;transform:none!important}
      .prompt-route-shield span{font-size:10px!important;letter-spacing:.08em!important;text-transform:none!important}
      @media(max-width:720px){
        #welcomeIntroDialog.welcome-intro-dialog.first-run .welcome-intro-body{padding:18px 16px 32px!important}
        #welcomeIntroDialog.welcome-intro-dialog.first-run .welcome-intro-video{height:38dvh!important;min-height:230px!important;border-radius:14px!important}
        #welcomeIntroDialog.welcome-intro-dialog.splash-only .welcome-intro-video{object-fit:cover!important;transform:scale(1.01)!important}
      }
    `;
    document.head.appendChild(style);
  }

  function syncIntro(dialog){
    if(!dialog)return false;
    const seen=localStorage.getItem(ONBOARDING_KEY)==='1';
    dialog.classList.toggle('splash-only',seen);
    dialog.classList.toggle('first-run',!seen);
    return seen;
  }

  function patchIntroOpen(){
    if(typeof HTMLDialogElement==='undefined')return;
    const proto=HTMLDialogElement.prototype;
    const previous=proto.showModal;
    if(previous?.__promptIntroFlowFix)return;
    function patchedShowModal(...args){
      if(this.id==='welcomeIntroDialog'){
        const wasSeen=syncIntro(this);
        const result=previous.apply(this,args);
        if(!wasSeen){
          try{localStorage.setItem(ONBOARDING_KEY,'1')}catch{}
        }
        const video=this.querySelector('.welcome-intro-video');
        if(video){try{video.currentTime=0;video.play().catch(()=>{})}catch{}}
        return result;
      }
      return previous.apply(this,args);
    }
    patchedShowModal.__promptIntroFlowFix=true;
    proto.showModal=patchedShowModal;
  }

  function observeIntro(){
    const intro=$('#welcomeIntroDialog');
    if(!intro)return;
    syncIntro(intro);
    new MutationObserver(()=>{if(intro.open)syncIntro(intro)}).observe(intro,{attributes:true,attributeFilter:['open']});
  }

  function keepIntroOutOfInternalProjectReloads(){
    const observer=new MutationObserver(records=>{
      for(const record of records){
        for(const node of record.addedNodes){
          if(!(node instanceof Element))continue;
          const shield=node.matches?.('.prompt-route-shield')?node:node.querySelector?.('.prompt-route-shield');
          if(!shield)continue;
          try{sessionStorage.setItem(CONTINUE_WORKFLOW_KEY,'1')}catch{}
          shield.querySelector('img')?.remove();
        }
      }
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  injectStyles();
  patchIntroOpen();
  keepIntroOutOfInternalProjectReloads();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observeIntro,{once:true});else observeIntro();
})();
