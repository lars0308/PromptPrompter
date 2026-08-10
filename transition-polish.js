(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const HANDOFF_KEY='prompt-ai-mode-handoff-v1';
  let settleTimer=0,sentenceTimer=0,lastKind='';

  function workflowVisible(){
    const workflow=$('#workflowApp');
    if(!workflow||workflow.hidden)return false;
    try{return getComputedStyle(workflow).display!=='none'}catch{return true}
  }
  function currentStep(){return Number($('.step-panel.active')?.dataset.stepPanel||0)}
  function clarificationOpen(){return Boolean($('#clarificationDialog')?.open)}

  function installStyles(){
    if($('#promptTransitionPolishStyles'))return;
    const style=document.createElement('style');
    style.id='promptTransitionPolishStyles';
    style.textContent=`
      html.prompt-review-transition,html.prompt-review-transition body{overflow:hidden!important}
      html.prompt-review-transition #flowTransitionCompact{position:fixed!important;z-index:2147483500!important;inset:0!important;display:grid!important;place-items:center!important;width:100vw!important;max-width:none!important;min-height:100dvh!important;margin:0!important;padding:26px 24px!important;background:var(--paper,#f4f5f6)!important;color:var(--ink,#171814)!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;transform:none!important}
      html.prompt-review-transition #flowTransitionCompact>div{width:min(560px,100%)!important;text-align:center!important}
      html.prompt-review-transition #flowTransitionCompact span{font-size:9px!important;font-weight:850!important;letter-spacing:.13em!important;color:var(--ui-blue,var(--accent,#1689c7))!important}
      html.prompt-review-transition #flowTransitionCompact strong{margin-top:9px!important;font-size:clamp(31px,8vw,47px)!important;line-height:1.02!important;letter-spacing:-.05em!important}
      html.prompt-review-transition #flowTransitionCompact small{display:block!important;min-height:25px!important;max-width:430px!important;margin:18px auto 0!important;color:var(--muted,#6e6c64)!important;font-size:clamp(14px,3.7vw,17px)!important;line-height:1.45!important;transition:opacity .16s ease,transform .16s ease!important}
      html.prompt-review-transition #flowTransitionCompact small.is-changing{opacity:0!important;transform:translateY(4px)!important}
      html.prompt-review-transition #flowTransitionCompact .prompt-process-lines,html.prompt-review-transition #flowTransitionCompact>div>i{display:none!important}
      html.prompt-review-transition #guidedCleanHead{display:none!important}
      html[data-clean-project-flow="1"] #promptCompletionFlash{display:none!important}
      .prompt-transition-dots{display:flex;justify-content:center;gap:7px;margin-top:22px}.prompt-transition-dots i{display:block!important;width:7px!important;height:7px!important;margin:0!important;border:0!important;border-radius:50%!important;background:var(--ui-blue,var(--accent,#1689c7))!important;opacity:.28;animation:promptTransitionDot 1.05s ease-in-out infinite!important}.prompt-transition-dots i:nth-child(2){animation-delay:.13s!important}.prompt-transition-dots i:nth-child(3){animation-delay:.26s!important}
      @keyframes promptTransitionDot{0%,70%,100%{opacity:.25;transform:translateY(0)}35%{opacity:1;transform:translateY(-4px)}}
      @media(prefers-reduced-motion:reduce){.prompt-transition-dots i{animation:none!important;opacity:.75!important}html.prompt-review-transition #flowTransitionCompact small{transition:none!important}}
    `;
    document.head.appendChild(style);
  }

  const lines={
    review:['Angaben werden geprüft.','Nur wichtige Rückfragen bleiben übrig.','Der nächste Schritt wird vorbereitet.'],
    preview:['Antworten werden zusammengeführt.','Die Vorschau wird vorbereitet.','Fast fertig.']
  };

  function ensureDots(box){
    const host=box?.firstElementChild;if(!host||$('.prompt-transition-dots',host))return;
    const dots=document.createElement('div');dots.className='prompt-transition-dots';dots.setAttribute('aria-hidden','true');dots.innerHTML='<i></i><i></i><i></i>';host.appendChild(dots);
  }
  function setSentence(node,text){
    if(!node||node.textContent===text)return;
    node.classList.add('is-changing');
    setTimeout(()=>{if(!node.isConnected)return;node.textContent=text;node.classList.remove('is-changing')},165);
  }
  function stopCycle(){clearInterval(sentenceTimer);sentenceTimer=0;lastKind=''}
  function startCycle(box,kind){
    const sentence=$('small',box);if(!sentence)return;
    if(lastKind===kind&&sentenceTimer)return;
    stopCycle();lastKind=kind;let index=0;setSentence(sentence,lines[kind][0]);
    sentenceTimer=setInterval(()=>{
      if(!document.documentElement.classList.contains('prompt-review-transition')||!box.isConnected){stopCycle();return}
      index=(index+1)%lines[kind].length;setSentence(sentence,lines[kind][index]);
    },920);
  }

  function removeDuplicateHandoff(){
    const duplicate=$('#promptBriefHandoff');if(!duplicate)return;
    let hasModeHandoff=Boolean($('#promptModeHandoff'));try{hasModeHandoff=hasModeHandoff||Boolean(sessionStorage.getItem(HANDOFF_KEY))}catch{}
    if(hasModeHandoff)duplicate.remove();
  }

  function syncTransition(){
    installStyles();removeDuplicateHandoff();
    const visible=workflowVisible(),step=currentStep(),show=visible&&[3,4,5].includes(step)&&!clarificationOpen();
    document.documentElement.classList.toggle('prompt-review-transition',show);
    const box=$('#flowTransitionCompact');
    if(!show){box?.classList.remove('show');stopCycle();if(!visible){document.documentElement.classList.remove('prompt-clarification-exit');$('#promptCompletionFlash')?.remove()}return}
    if(!box)return;
    box.classList.add('show');ensureDots(box);
    const kicker=$('span',box),title=$('strong',box),kind=step===5?'preview':'review';
    if(kicker)kicker.textContent=kind==='preview'?'VORSCHAU':'RÜCKMELDUNG';
    if(title)title.textContent=kind==='preview'?'Vorschau wird vorbereitet':'Briefing wird geprüft';
    startCycle(box,kind);
  }

  function schedule(){clearTimeout(settleTimer);settleTimer=setTimeout(syncTransition,24)}
  function blockHiddenWorkflowClicks(event){
    const next=event.target.closest?.('#workflowApp .next-btn');
    if(next&&!workflowVisible()){event.preventDefault();event.stopImmediatePropagation()}
  }
  function bind(){
    document.addEventListener('click',blockHiddenWorkflowClicks,true);
    document.addEventListener('click',event=>{if(event.target.closest?.('#brandHome,.guided-clean-exit'))setTimeout(schedule,0)},true);
    new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','open','style']});
    window.addEventListener('pageshow',schedule);window.addEventListener('promptai:access',schedule);
  }

  function init(){installStyles();bind();syncTransition()}
  installStyles();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
