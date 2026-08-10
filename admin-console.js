(()=>{
  'use strict';
  document.documentElement.classList.add('prompt-access-pending');
  if(!document.getElementById('promptAccessBootStyle')){
    const style=document.createElement('style');style.id='promptAccessBootStyle';style.textContent='html.prompt-access-pending #upgradeBtn,html.prompt-access-pending #upgradeMenuBtn{visibility:hidden!important;opacity:0!important;pointer-events:none!important}html.prompt-access-pending #workflowApp:not([hidden]){opacity:0!important}';document.head.appendChild(style);
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
  loadCore(()=>load('./ui-regression-fixes.js?v=20260810-8',()=>load('./stability-ui.js?v=20260810-2',()=>load('./mode-flow-ui.js?v=20260810-6',()=>load('./preview-ai-admin.js?v=20260810-6',()=>load('./product-polish.js?v=20260810-3',()=>load('./sandbox-preview.js?v=20260810-1')))))));
})();
