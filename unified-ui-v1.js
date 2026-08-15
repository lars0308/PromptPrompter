(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];


  function decorateDialogs(root=document){
    $$('dialog',root).forEach(d=>{
      if(d.id==='previewLightbox'||d.id==='welcomeIntroDialog')return;
      d.classList.add('prompt-unified-dialog');
      d.querySelector('.dialog-frame')?.classList.add('prompt-unified-frame');
    });
  }

  function improveMenu(){
    const menu=$('#topbarMenu');if(!menu)return;
    menu.setAttribute('aria-label','Prompt.ai Menü');
    menu.setAttribute('role','menu');
    $$(':scope > button',menu).forEach(b=>b.setAttribute('role','menuitem'));
  }

  function init(){
    
    document.body.classList.add('prompt-unified-ui');
    decorateDialogs();
    improveMenu();
    new MutationObserver(records=>{
      for(const record of records)for(const node of record.addedNodes)if(node?.nodeType===1){if(node.matches?.('dialog'))decorateDialogs(node.parentElement||document);else if(node.querySelector?.('dialog'))decorateDialogs(node)}
    }).observe(document.body,{childList:true,subtree:true});
  }

  
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
