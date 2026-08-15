(()=>{
  'use strict';
  // Coming back after ten minutes or from another browser tab, nothing on the screen said which
  // project this is - the name only lived in a field on step 1. It sits in the top bar now, next to
  // the step, for as long as the workflow is open.
  const $=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function node(){
    let box=$('#topbarProject');if(box)return box;
    const bar=$('.topbar');if(!bar)return null;
    box=document.createElement('div');box.id='topbarProject';box.className='topbar-project';
    box.innerHTML='<div><span>PROJEKT</span><strong id="topbarProjectName"></strong></div><b id="topbarProjectStep"></b>';
    const brand=$('.brand',bar);brand?brand.insertAdjacentElement('afterend',box):bar.appendChild(box);
    return box;
  }
  function workflowOpen(){const app=$('#workflowApp');if(!app||app.hidden)return false;try{return getComputedStyle(app).display!=='none'}catch{return true}}
  function currentName(){
    const field=$('#projectName')?.value?.trim();if(field)return field;
    const client=$('#clientName')?.value?.trim();if(client)return client;
    try{const saved=JSON.parse(localStorage.getItem('sitebrief-v6-state')||'{}');return String(saved?.project?.name||saved?.project?.client?.name||'').trim()}catch{return ''}
  }
  function sync(){
    const box=node();if(!box)return;
    const on=workflowOpen(),name=currentName();
    box.classList.toggle('is-on',on&&Boolean(name));
    if(!on||!name)return;
    const label=$('#topbarProjectName',box),step=$('#topbarProjectStep',box);
    if(label&&label.textContent!==name)label.textContent=name;
    const active=$('.step-panel.active')?.dataset.stepPanel||'';
    const total=document.querySelectorAll('.step-nav:not([style*="display: none"])').length;
    const text=active?`Schritt ${active}${total?` / ${document.querySelectorAll('[data-step-panel]').length}`:''}`:'';
    if(step&&step.textContent!==text)step.textContent=text;
  }
  function observe(){
    let timer=0;
    new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(sync,90)}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','value']});
    for(const id of ['#projectName','#clientName'])$(id)?.addEventListener('input',sync);
    addEventListener('pageshow',sync);addEventListener('promptai:access',sync);
  }
  function init(){sync();observe();
    // Late overlays rebuild the top bar, so the strip is re-attached a few times.
    let n=0;const timer=setInterval(()=>{sync();if(++n>=14)clearInterval(timer)},350);
  }
  window.PromptAiProjectContext={sync};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
