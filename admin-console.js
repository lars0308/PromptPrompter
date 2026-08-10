(()=>{
  'use strict';
  document.documentElement.classList.add('prompt-access-pending');
  if(!document.getElementById('promptAccessBootStyle')){
    const style=document.createElement('style');style.id='promptAccessBootStyle';style.textContent='html.prompt-access-pending #upgradeBtn,html.prompt-access-pending #upgradeMenuBtn,html.prompt-access-pending #modeSwitch,html.prompt-access-pending .workflow-upgrade,html.prompt-access-pending .quick-upgrade-note,html.prompt-access-pending .quick-tier-block,html.prompt-access-pending #settingsUpgradeNote,html.prompt-access-pending #apiAddonCard,html.prompt-access-pending #currentPlanBadge,html.prompt-access-pending .plan-current{visibility:hidden!important;opacity:0!important;pointer-events:none!important}html.prompt-access-pending #workflowApp:not([hidden]){opacity:0!important}';document.head.appendChild(style);
  }
  const load=(src,onload)=>{const script=document.createElement('script');script.src=src;script.async=false;if(onload)script.addEventListener('load',onload,{once:true});document.head.appendChild(script);return script};
  const loadCore=(next)=>{
    const original=document.addEventListener;
    document.addEventListener=function(type,listener,options){
      if(type==='DOMContentLoaded'&&document.readyState!=='loading'){queueMicrotask(()=>listener.call(document,new Event('DOMContentLoaded')));return;}
      return original.call(document,type,listener,options);
    };
    load('./admin-console-core.js?v=20260810-8',()=>{document.addEventListener=original;next?.()});
  };
  load('./owner-access.js?v=20260810-1',()=>load('./intro-flow-fix.js?v=20260810-1',()=>loadCore(()=>load('./ui-regression-fixes.js?v=20260810-8',()=>load('./project-start-ui.js?v=20260810-1',()=>load('./stability-ui.js?v=20260810-2',()=>load('./mode-flow-ui.js?v=20260810-6',()=>load('./system-ai-routing.js?v=20260810-1',()=>load('./preview-ai-admin.js?v=20260810-6',()=>load('./system-ai-studio.js?v=20260810-1',()=>load('./product-polish.js?v=20260810-3',()=>load('./sandbox-preview.js?v=20260810-1',()=>load('./workflow-cleanup.js?v=20260810-2',()=>load('./generator-selection.js?v=20260810-1'))))))))))))));
})();
