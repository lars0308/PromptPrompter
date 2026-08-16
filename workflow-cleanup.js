(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];let masterTimer=0,lastMasterSignature='',observer=null,masterStepActive=false;
  const MASTER_MAX_WAIT=8000;
  const setText=(node,value)=>{if(node&&node.textContent!==value)node.textContent=value};
  
  function clean(){['#modeDescription','#modeRouteCard','#modeFlowPanel'].forEach(q=>{const n=$(q);if(n?.getAttribute('aria-hidden')!=='true')n?.setAttribute('aria-hidden','true')});const studio=$('#revisionStudio');if(studio&&!studio.hidden)studio.hidden=true;setText($('#quickRevisionDialog .dialog-head h2'),'Website gezielt überarbeiten')}
  function previews(){$$('#stepPreviews .preview-generation-controls label').forEach(l=>{l.style.removeProperty('display');if(l.style.visibility!=='visible')l.style.visibility='visible';if(l.style.pointerEvents!=='auto')l.style.pointerEvents='auto'})}
  function previewPage(){const lab=$('#outcomeLab');if(!lab)return false;let d=$('#projectPreviewDialog');if(!d){d=document.createElement('dialog');d.id='projectPreviewDialog';d.setAttribute('aria-label','Projektvorschau');d.className='project-preview-dialog';d.innerHTML='<div class="project-preview-shell"><header class="project-preview-head"><div><span>PROJEKT-VORSCHAU</span><h2>Gebautes Projekt prüfen</h2></div><button type="button" class="project-preview-close" aria-label="Schließen">×</button></header><div class="project-preview-body"></div></div>';document.body.appendChild(d);d.querySelector('.project-preview-close').onclick=()=>d.close();d.addEventListener('cancel',e=>{e.preventDefault();d.close()})}const body=d.querySelector('.project-preview-body');if(lab.parentElement!==body)body.appendChild(lab);let b=$('#workspacePreviewBtn');if(!b){b=document.createElement('button');b.type='button';b.className='outline-btn';b.id='workspacePreviewBtn';b.innerHTML='<strong>Gebautes Projekt prüfen</strong><small style="display:block;margin-top:4px;opacity:.7">ZIP, Ordner oder GitHub-Repo als Live-Vorschau</small>';$('.welcome-quick-actions')?.appendChild(b);b.onclick=()=>{try{d.showModal()}catch{}}}return true}
  function signature(){const text=[$('#projectName')?.value||'',$('#projectDescription')?.value||'',$('#selectedPreviewLarge')?.textContent||''].join('|');let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return `m${(h>>>0).toString(36)}`}
  function masterLoader(){
    const step=$('#stepPrompt');if(!step)return;
    if(!$('#masterGeneration')){const l=document.createElement('div');l.id='masterGeneration';l.className='master-generation';l.innerHTML='<div class="master-generation-inner"><div class="master-generation-spinner"></div><span>PROMPT.AI</span><strong class="prompt-fill-sweep">Dein Master-Prompt entsteht</strong><small>Alle Angaben, Referenzen, Änderungen und die gewählte Richtung werden zu deinem individuellen Auftrag zusammengeführt.</small><div class="master-generation-track"><i></i></div></div>';step.insertBefore(l,$('#completionSummary')||step.children[2]||null)}
    // Only react to an actual enter/leave of step 8. revealMaster() toggles `master-generating`
    // on this same element, so reacting to every class mutation made the observer re-enter
    // itself in an endless add/remove cycle and locked up the whole tab.
    masterStepActive=step.classList.contains('active');
    new MutationObserver(()=>{
      const active=step.classList.contains('active');
      if(active===masterStepActive)return;
      masterStepActive=active;
      if(active)revealMaster();
      else{clearTimeout(masterTimer);step.classList.remove('master-generating')}
    }).observe(step,{attributes:true,attributeFilter:['class']});
    if(masterStepActive)revealMaster();
  }
  function revealMaster(){
    const step=$('#stepPrompt');if(!step?.classList.contains('active'))return;
    const sig=signature();
    clearTimeout(masterTimer);
    const done=prompt=>{
      lastMasterSignature=sig;
      // When the overlay was actually up, close it the same way every other loading screen does:
      // the headline fills to full, blinks blue once, then the step appears.
      if(step.classList.contains('master-generating'))window.PromptAiFill?.finish($('#masterGeneration strong'),()=>step.classList.remove('master-generating'));
      else step.classList.remove('master-generating');
      try{sessionStorage.setItem(`prompt-ai-master-ready:${sig}`,'1')}catch{}
      if(prompt)window.dispatchEvent(new CustomEvent('promptai:prompt-version',{detail:{source:'master',title:$('#projectName')?.value||'Master-Prompt',prompt}}));
    };
    const ready=()=>($('#masterPrompt')?.value?.trim()||'');
    // The prompt is assembled synchronously, so in practice it is already there. Never hold the
    // finished result behind an artificial delay, and always release the overlay after the cap.
    if(ready().length>=80||($('#projectValidation')?.textContent||'').trim()){done(ready());return}
    window.PromptAiFill?.reset($('#masterGeneration strong'));
    step.classList.add('master-generating');
    const start=Date.now(),check=()=>{
      const prompt=ready();
      if(prompt.length>=80||($('#projectValidation')?.textContent||'').trim()||Date.now()-start>=MASTER_MAX_WAIT){done(prompt);return}
      masterTimer=setTimeout(check,200);
    };
    masterTimer=setTimeout(check,120);
  }
  // The AI writes the final master prompt from the assembled material; the overlay stays up for
  // that pass instead of showing a briefing that is about to be replaced.
  function masterAiOverlay(state){
    const step=$('#stepPrompt');if(!step||!step.classList.contains('active'))return;
    if(state==='start'){window.PromptAiFill?.reset($('#masterGeneration strong'));step.classList.add('master-generating');return}
    window.PromptAiFill?.finish($('#masterGeneration strong'),()=>step.classList.remove('master-generating'));
  }
  function settle(){clean();previews();previewPage()}
  function init(){settle();masterLoader();observer=new MutationObserver(()=>{clearTimeout(observer._t);observer._t=setTimeout(settle,60)});observer.observe(document.body,{childList:true});setTimeout(()=>observer?.disconnect(),5000);window.addEventListener('promptai:access',()=>setTimeout(settle,0));window.addEventListener('promptai:system-ai-ready',previews);window.addEventListener('promptai:master-ai',event=>masterAiOverlay(event.detail?.state))}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
