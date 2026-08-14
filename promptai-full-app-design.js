(()=>{
  'use strict';
  const ROOT_CLASS='prompt-full-redesign';

  function install(){
    document.documentElement.classList.add(ROOT_CLASS);
    if(!document.querySelector('#promptFullAppDesign')){
      const link=document.createElement('link');
      link.id='promptFullAppDesign';
      link.rel='stylesheet';
      link.href='./promptai-full-app-design.css?v=20260817-11';
      document.head.appendChild(link);
    }
  }

  function labelDynamicDialogs(){
    document.querySelectorAll('dialog').forEach(dialog=>dialog.classList.add('prompt-system-dialog'));
    document.querySelectorAll('.prompt-handoff-loader,.prompt-completion-flash,#promptMaintenanceOverlay').forEach(node=>node.classList.add('prompt-system-overlay'));
  }

  function settle(){install();labelDynamicDialogs()}
  function init(){
    settle();
    new MutationObserver(labelDynamicDialogs).observe(document.body,{childList:true,subtree:true});
    window.addEventListener('pageshow',settle);
  }

  install();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
