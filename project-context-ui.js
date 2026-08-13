(()=>{
  'use strict';
  // Coming back after ten minutes or from another browser tab, nothing on the screen said which
  // project this is - the name only lived in a field on step 1. It sits in the top bar now, next to
  // the step, for as long as the workflow is open.
  const $=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function styles(){
    if($('#projectContextStyles'))return;
    const el=document.createElement('style');el.id='projectContextStyles';el.textContent=`
      .topbar-project{display:none;min-width:0;align-items:center;gap:9px;margin-left:14px;padding:7px 12px;border:1px solid var(--line);border-radius:99px;background:var(--surface)}
      .topbar-project.is-on{display:inline-flex}
      .topbar-project span{display:block;color:var(--muted);font-size:8px;font-weight:900;letter-spacing:.12em;line-height:1}
      .topbar-project strong{display:block;margin-top:3px;max-width:min(38vw,300px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:1.15}
      .topbar-project b{flex:0 0 auto;padding:3px 8px;border-radius:99px;background:color-mix(in srgb,var(--accent) 12%,transparent);color:var(--accent);font-size:10px;font-weight:850;white-space:nowrap}
      @media(max-width:820px){
        /* On a phone the top bar is already tight, so the project moves under it as its own strip. */
        .topbar-project.is-on{display:flex;order:9;width:100%;margin:9px 0 0;border-radius:12px;justify-content:space-between}
        .topbar-project strong{max-width:60vw}
      }
    `;document.head.appendChild(el);
  }
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
    styles();const box=node();if(!box)return;
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
  function init(){styles();sync();observe();
    // Late overlays rebuild the top bar, so the strip is re-attached a few times.
    let n=0;const timer=setInterval(()=>{sync();if(++n>=14)clearInterval(timer)},350);
  }
  window.PromptAiProjectContext={sync};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
