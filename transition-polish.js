(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  let settleTimer=0,cycleTimer=0,activeKind='',pendingFromReferences=false,userExited=false;
  const STEP_STABLE_MS=90;
  const SENTENCE_MS=1400;

  const mode=()=>$('.mode-switch button.active')?.dataset.mode||document.documentElement.dataset.promptMode||'guided';
  const currentStep=()=>Number($('.step-panel.active')?.dataset.stepPanel||0);
  function workflowVisible(){const workflow=$('#workflowApp');if(!workflow||workflow.hidden)return false;try{return getComputedStyle(workflow).display!=='none'&&getComputedStyle(workflow).visibility!=='hidden'}catch{return true}}
  const cleanMode=()=>['guided','auto'].includes(mode());
  const clarificationOpen=()=>Boolean($('#clarificationDialog')?.open);

  function installStyles(){
    if($('#promptWorkflowStabilityStyles'))return;
    const s=document.createElement('style');s.id='promptWorkflowStabilityStyles';s.textContent=`
      html[data-clean-project-flow="1"] #promptBriefHandoff,
      html[data-clean-project-flow="1"] #flowTransitionCompact,
      html[data-clean-project-flow="1"] .streamline-working,
      html[data-clean-project-flow="1"] #modeFlowPanel,
      html[data-clean-project-flow="1"] #promptCompletionFlash,
      html[data-prompt-mode="guided"] #promptBriefHandoff,
      html[data-prompt-mode="auto"] #promptBriefHandoff,
      html[data-prompt-mode="guided"] #flowTransitionCompact,
      html[data-prompt-mode="auto"] #flowTransitionCompact,
      html[data-prompt-mode="guided"] .streamline-working,
      html[data-prompt-mode="auto"] .streamline-working,
      html[data-prompt-mode="guided"] #modeFlowPanel,
      html[data-prompt-mode="auto"] #modeFlowPanel,
      html[data-prompt-mode="guided"] #promptCompletionFlash,
      html[data-prompt-mode="auto"] #promptCompletionFlash{display:none!important}
      html[data-clean-project-flow="1"].prompt-review-transition #workflowApp .step-panel.active,
      html[data-prompt-mode="guided"].prompt-review-transition #workflowApp .step-panel.active,
      html[data-prompt-mode="auto"].prompt-review-transition #workflowApp .step-panel.active{display:flex!important;visibility:visible!important;pointer-events:auto!important}
      html[data-clean-project-flow="1"].prompt-review-transition #flowTransitionCompact,
      html[data-prompt-mode="guided"].prompt-review-transition #flowTransitionCompact,
      html[data-prompt-mode="auto"].prompt-review-transition #flowTransitionCompact{display:none!important}
      html[data-clean-project-flow="1"] #stepReferences .next-btn,
      html[data-prompt-mode="guided"] #stepReferences .next-btn,
      html[data-prompt-mode="auto"] #stepReferences .next-btn{font-size:0!important;white-space:nowrap!important}
      html[data-clean-project-flow="1"] #stepReferences .next-btn>i,
      html[data-prompt-mode="guided"] #stepReferences .next-btn>i,
      html[data-prompt-mode="auto"] #stepReferences .next-btn>i{display:none!important}
      html[data-clean-project-flow="1"] #stepReferences .next-btn:before,
      html[data-prompt-mode="guided"] #stepReferences .next-btn:before,
      html[data-prompt-mode="auto"] #stepReferences .next-btn:before{content:'Rückmeldung prüfen';font-size:12px;font-weight:760;letter-spacing:-.012em}
      html[data-clean-project-flow="1"] #stepReferences .next-btn:after,
      html[data-prompt-mode="guided"] #stepReferences .next-btn:after,
      html[data-prompt-mode="auto"] #stepReferences .next-btn:after{content:'→';margin-left:18px;font-size:18px;font-weight:600;line-height:1}
      html.prompt-workflow-loading,html.prompt-workflow-loading body{overflow:hidden!important}
      html.prompt-workflow-loading #guidedCleanHead{visibility:hidden!important}
      #promptWorkflowLoader{position:fixed;z-index:2147483647;inset:0;display:grid;place-items:center;padding:28px 22px;background:var(--paper,#f4f5f6);color:var(--ink,#171814);opacity:1;transition:opacity .24s ease;contain:layout paint style;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
      #promptWorkflowLoader.is-leaving{opacity:0;pointer-events:none}
      #promptWorkflowLoader>div{width:min(560px,100%);text-align:center}
      #promptWorkflowLoader .kicker{display:block;color:var(--ui-blue,var(--accent,#1689c7));font-size:9px;font-weight:850;letter-spacing:.13em}
      #promptWorkflowLoader strong{position:relative;display:block;margin-top:9px;font-size:clamp(31px,8vw,47px);line-height:1.02;letter-spacing:-.05em}
      #promptWorkflowLoader strong .blue{position:absolute;inset:0;color:var(--ui-blue,var(--accent,#1689c7));clip-path:inset(0 100% 0 0);pointer-events:none}
      .prompt-loader-sentence{position:relative;display:block;max-width:440px;min-height:29px;margin:22px auto 0;color:var(--ink,#171814);font-size:clamp(15px,3.8vw,18px);font-weight:650;line-height:1.45;overflow:hidden;transition:opacity .16s ease,transform .16s ease}
      .prompt-loader-sentence.is-changing{opacity:0;transform:translateY(4px)}
      .prompt-loader-sentence .blue{position:absolute;inset:0;color:var(--ui-blue,var(--accent,#1689c7));clip-path:inset(0 100% 0 0);pointer-events:none}
      .prompt-loader-pulse{display:flex;justify-content:center;gap:7px;margin-top:23px}.prompt-loader-pulse i{width:6px;height:6px;border-radius:50%;background:var(--ui-blue,var(--accent,#1689c7));opacity:.22;animation:promptLoaderPulse 1.05s ease-in-out infinite}.prompt-loader-pulse i:nth-child(2){animation-delay:.13s}.prompt-loader-pulse i:nth-child(3){animation-delay:.26s}
      @keyframes promptLoaderPulse{0%,70%,100%{opacity:.22;transform:translateY(0)}35%{opacity:.9;transform:translateY(-3px)}}
      @media(prefers-reduced-motion:reduce){#promptWorkflowLoader,.prompt-loader-sentence{transition:none!important}.prompt-loader-pulse i{animation:none!important;opacity:.7!important}}
    `;document.head.appendChild(s)
  }

  const copy={
    review:{kicker:'RÜCKMELDUNG',title:'Briefing wird geprüft',sentences:['Angaben werden geprüft.','Offene Punkte werden erkannt.','Rückfragen werden vorbereitet.']},
    preview:{kicker:'VORSCHAU',title:'Vorschau wird vorbereitet',sentences:['Antworten werden verbunden.','Die Richtung wird vorbereitet.','Vorschau wird erstellt.']}
  };

  let fillRaf=0,fillStartedAt=0;
  const reduceMotion=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch{return false}};
  function fillProgress(elapsed){const tau=2600;return Math.min(.94,.94*(1-Math.exp(-elapsed/tau)))}
  function pct(v,total){return `${Math.max(0,Math.min(100,total?(v/total)*100:0)).toFixed(2)}%`}
  function readingOrderClip(base,progress){
    const simple=`inset(0 ${(1-progress)*100}% 0 0)`;
    if(!base||!base.firstChild)return simple;
    let rects;try{const range=document.createRange();range.selectNodeContents(base);rects=[...range.getClientRects()]}catch{rects=[]}
    if(rects.length<=1)return simple;
    const box=base.getBoundingClientRect();if(!box.width||!box.height)return simple;
    const lines=rects.map(r=>({left:r.left-box.left,top:r.top-box.top,right:r.right-box.left,bottom:r.bottom-box.top,width:r.width})).filter(l=>l.width>0);
    if(!lines.length)return simple;
    const totalWidth=lines.reduce((s,l)=>s+l.width,0);
    let target=progress*totalWidth;
    const points=[`0% ${pct(lines[0].top,box.height)}`];
    for(const line of lines){
      const w=Math.max(0,Math.min(line.width,target));target-=w;
      const rightX=line.left+w;
      points.push(`${pct(rightX,box.width)} ${pct(line.top,box.height)}`);
      points.push(`${pct(rightX,box.width)} ${pct(line.bottom,box.height)}`);
      if(w<line.width-.5)break;
    }
    const last=points[points.length-1].split(' ');
    points.push(`0% ${last[1]}`);
    return `polygon(${points.join(',')})`;
  }
  function applyFill(progress){const box=$('#promptWorkflowLoader');if(!box)return;const titleBase=$('strong .base',box),titleBlue=$('strong .blue',box);if(titleBase&&titleBlue)titleBlue.style.clipPath=readingOrderClip(titleBase,progress);const sentenceBase=$('.prompt-loader-sentence .base',box),sentenceBlue=$('.prompt-loader-sentence .blue',box);if(sentenceBase&&sentenceBlue)sentenceBlue.style.clipPath=readingOrderClip(sentenceBase,progress)}
  function startFillLoop(){
    cancelAnimationFrame(fillRaf);fillStartedAt=performance.now();
    if(reduceMotion()){applyFill(.94);return}
    const tick=()=>{if(!$('#promptWorkflowLoader')){fillRaf=0;return}applyFill(fillProgress(performance.now()-fillStartedAt));fillRaf=requestAnimationFrame(tick)};
    fillRaf=requestAnimationFrame(tick);
  }
  function stopFillLoop(complete=false){cancelAnimationFrame(fillRaf);fillRaf=0;if(complete)applyFill(1)}

  function loader(){let box=$('#promptWorkflowLoader');if(box)return box;box=document.createElement('section');box.id='promptWorkflowLoader';box.setAttribute('aria-live','polite');box.innerHTML='<div><span class="kicker"></span><strong><span class="base"></span><span class="blue" aria-hidden="true"></span></strong><div class="prompt-loader-sentence"><span class="base"></span><span class="blue" aria-hidden="true"></span></div><div class="prompt-loader-pulse" aria-hidden="true"><i></i><i></i><i></i></div></div>';document.body.appendChild(box);return box}
  function setTitle(box,text){const host=$('strong',box),base=$('.base',host||document),blue=$('.blue',host||document);if(!base||!blue)return;if(base.textContent===text)return;base.textContent=text;blue.textContent=text}
  function setSentence(text,immediate=false){const box=$('#promptWorkflowLoader'),host=$('.prompt-loader-sentence',box||document),base=$('.base',host||document),blue=$('.blue',host||document);if(!host||!base||!blue)return;const apply=()=>{base.textContent=text;blue.textContent=text;host.classList.remove('is-changing')};if(immediate){apply();return}host.classList.add('is-changing');setTimeout(()=>{if(host.isConnected)apply()},160)}
  function startCycle(kind){const data=copy[kind];if(!data)return;clearInterval(cycleTimer);let index=0;setSentence(data.sentences[index],true);cycleTimer=setInterval(()=>{const box=$('#promptWorkflowLoader');if(!box||activeKind!==kind){clearInterval(cycleTimer);return}index=(index+1)%data.sentences.length;setSentence(data.sentences[index])},SENTENCE_MS+240)}
  function show(kind){if(userExited||!workflowVisible()||!cleanMode())return;const data=copy[kind];if(!data)return;const box=loader();box.classList.remove('is-leaving');document.documentElement.classList.add('prompt-workflow-loading');const kicker=$('.kicker',box);if(kicker.textContent!==data.kicker)kicker.textContent=data.kicker;setTitle(box,data.title);if(activeKind!==kind){activeKind=kind;startCycle(kind);startFillLoop()}}
  function hide(immediate=false){clearInterval(cycleTimer);cycleTimer=0;activeKind='';const box=$('#promptWorkflowLoader');document.documentElement.classList.remove('prompt-workflow-loading');if(!box){stopFillLoop();return}stopFillLoop(true);if(immediate){box.remove();return}box.classList.add('is-leaving');setTimeout(()=>box.remove(),250)}

  function closeLateWorkflowUi(){const dialog=$('#clarificationDialog');if(dialog?.open){try{dialog.close('cancel')}catch{dialog.removeAttribute('open')}}$('#promptCompletionFlash')?.remove();document.documentElement.classList.remove('prompt-review-transition','prompt-clarification-exit')}

  function sync(){installStyles();const visible=workflowVisible(),step=currentStep();if(!visible){pendingFromReferences=false;hide(true);closeLateWorkflowUi();return}if(userExited)return;if(clarificationOpen()){pendingFromReferences=false;hide();return}if(step===2){if(!pendingFromReferences)hide();return}if(step===3||step===4){pendingFromReferences=false;show('review');return}if(step===5){pendingFromReferences=false;show('preview');return}if(step>=6||step===1){pendingFromReferences=false;hide();return}}
  function schedule(delay=STEP_STABLE_MS){clearTimeout(settleTimer);settleTimer=setTimeout(sync,delay)}

  function onClick(event){
    const refNext=event.target.closest?.('#stepReferences .next-btn');if(refNext&&workflowVisible()&&cleanMode()){userExited=false;pendingFromReferences=true;show('review');schedule(180);return}
    if(event.target.closest?.('#brandHome,.guided-clean-exit')){userExited=true;pendingFromReferences=false;hide(true);closeLateWorkflowUi();return}
    if(event.target.closest?.('#clarificationDialog .close-dialog')){pendingFromReferences=false;hide();return}
  }
  function blockLateHiddenClicks(event){if(workflowVisible())return;const button=event.target.closest?.('#workflowApp .next-btn,#workflowApp .back-btn');if(button&&!event.isTrusted){event.preventDefault();event.stopImmediatePropagation()}}
  function observe(){new MutationObserver(()=>schedule()).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','open','style']});window.addEventListener('pageshow',()=>schedule(0));window.addEventListener('promptai:access',()=>schedule(0))}
  function bind(){document.addEventListener('click',onClick,true);document.addEventListener('click',blockLateHiddenClicks,true)}
  function init(){installStyles();bind();observe();sync()}
  installStyles();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();