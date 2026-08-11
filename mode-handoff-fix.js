(()=>{
  'use strict';
  const HANDOFF_KEY='prompt-ai-mode-handoff-v1';
  const SIMPLE_START_KEY='prompt-ai-v1-simple-start';
  const PENDING_MODE_KEY='prompt-ai-new-project-mode-v2';
  const PENDING_BRIEF_KEY='prompt-ai-new-project-brief-v1';
  const $=(s,r=document)=>r.querySelector(s);
  let active=false,allowAdvance=false,advanceStarted=false,retryCount=0,timer=0,startedAt=0,sentenceTimer=0,sentenceIndex=0,sentenceStartedAt=0,finishing=false;
  const MIN_VISIBLE_MS=600;
  const FAIL_OPEN_MS=4000;
  const SENTENCE_MS=3000;
  const sentences=['Beschreibung wird übernommen.','Projektweg wird vorbereitet.','Referenzen werden bereitgestellt.'];

  function read(){try{return JSON.parse(sessionStorage.getItem(HANDOFF_KEY)||'null')}catch{return null}}
  function write(value){try{sessionStorage.setItem(HANDOFF_KEY,JSON.stringify(value))}catch{}}
  function clear(){try{[HANDOFF_KEY,SIMPLE_START_KEY,PENDING_MODE_KEY,PENDING_BRIEF_KEY].forEach(k=>sessionStorage.removeItem(k))}catch{}}
  function claimInitialAdvance(){try{sessionStorage.removeItem(SIMPLE_START_KEY)}catch{}}
  function modeLabel(mode){return mode==='auto'?'AUTO':mode==='expert'?'EXPERTE':'GEFÜHRT'}
  function step(){return Number($('.step-panel.active')?.dataset.stepPanel||0)}
  function uiReady(){return document.documentElement.classList.contains('prompt-home-ready')&&!document.documentElement.classList.contains('prompt-access-pending')}

  function styles(){
    if($('#promptModeHandoffStyles'))return;
    const s=document.createElement('style');s.id='promptModeHandoffStyles';s.textContent=`
      html.prompt-mode-handoff-active,html.prompt-mode-handoff-active body{overflow:hidden!important}
      .prompt-mode-handoff{position:fixed;z-index:2147483647;inset:0;display:grid;place-items:center;padding:28px 22px;background:var(--paper,#f4f5f6);color:var(--ink,#171814);opacity:1;transition:opacity .24s ease;contain:layout paint style;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
      .prompt-mode-handoff.is-leaving{opacity:0;pointer-events:none}
      .prompt-mode-handoff>div{width:min(560px,100%);text-align:center}.prompt-mode-handoff .kicker{display:block;color:var(--ui-blue,var(--accent,#1689c7));font-size:9px;font-weight:850;letter-spacing:.13em}.prompt-mode-handoff strong{display:block;margin-top:9px;font-size:clamp(31px,8vw,48px);line-height:1.02;letter-spacing:-.05em}
      .prompt-mode-handoff-status{display:block;max-width:440px;min-height:29px;margin:22px auto 0;color:var(--ink,#171814);font-size:clamp(15px,3.8vw,18px);font-weight:650;line-height:1.45;transition:opacity .16s ease,transform .16s ease}.prompt-mode-handoff-status.is-changing{opacity:0;transform:translateY(4px)}
      .prompt-mode-handoff-bar{width:min(240px,70%);height:4px;margin:22px auto 0;border-radius:99px;background:var(--ui-line,var(--line));overflow:hidden}.prompt-mode-handoff-bar i{display:block;height:100%;width:0%;border-radius:99px;background:var(--ui-blue,var(--accent,#1689c7));transition:width .3s ease}
      .prompt-mode-handoff-pulse{display:flex;justify-content:center;gap:7px;margin-top:23px}.prompt-mode-handoff-pulse i{width:6px;height:6px;border-radius:50%;background:var(--ui-blue,var(--accent,#1689c7));opacity:.22;animation:promptModeDot 1.05s ease-in-out infinite}.prompt-mode-handoff-pulse i:nth-child(2){animation-delay:.13s}.prompt-mode-handoff-pulse i:nth-child(3){animation-delay:.26s}@keyframes promptModeDot{0%,70%,100%{opacity:.22;transform:translateY(0)}35%{opacity:.9;transform:translateY(-3px)}}
      @media(prefers-reduced-motion:reduce){.prompt-mode-handoff,.prompt-mode-handoff-status{transition:none}.prompt-mode-handoff-bar i{transition:none!important}.prompt-mode-handoff-pulse i{animation:none;opacity:.7}}
    `;document.head.appendChild(s)
  }

  function rememberSelection(event){const card=event.target.closest?.('[data-project-mode]');if(!card||card.disabled)return;const brief=String($('#simpleIntakeText')?.value||'').trim();if(brief.length<8)return;write({mode:card.dataset.projectMode||'guided',brief,createdAt:Date.now()})}
  function setSentence(text,immediate=false){
    const host=$('#promptModeHandoff .prompt-mode-handoff-status');if(!host)return;
    const apply=()=>{host.textContent=text;host.classList.remove('is-changing');sentenceStartedAt=Date.now()};
    if(immediate){apply();return}host.classList.add('is-changing');setTimeout(()=>{if(host.isConnected)apply()},160)
  }
  function startSentences(){clearInterval(sentenceTimer);sentenceIndex=0;setSentence(sentences[0],true);sentenceTimer=setInterval(()=>{if(!active||finishing){clearInterval(sentenceTimer);return}sentenceIndex=(sentenceIndex+1)%sentences.length;setSentence(sentences[sentenceIndex])},SENTENCE_MS+230)}
  function overlay(data){let box=$('#promptModeHandoff');if(box)return box;box=document.createElement('section');box.id='promptModeHandoff';box.className='prompt-mode-handoff';box.setAttribute('aria-live','polite');box.innerHTML=`<div><span class="kicker">PROMPT.AI · ${modeLabel(data.mode)}</span><strong>Projekt wird vorbereitet</strong><div class="prompt-mode-handoff-status"></div><div class="prompt-mode-handoff-bar"><i></i></div><div class="prompt-mode-handoff-pulse" aria-hidden="true"><i></i><i></i><i></i></div></div>`;document.body.appendChild(box);startSentences();startTitleFillLoop();return box}
  let titleFillRaf=0;
  function titleProgress(elapsed){const tau=1500;return Math.min(.94,.94*(1-Math.exp(-elapsed/tau)))}
  function applyTitleFill(progress){const bar=$('#promptModeHandoff .prompt-mode-handoff-bar i');if(bar)bar.style.width=`${(progress*100).toFixed(2)}%`}
  function stopTitleFillLoop(complete=false){cancelAnimationFrame(titleFillRaf);titleFillRaf=0;if(complete)applyTitleFill(1)}
  function startTitleFillLoop(){
    stopTitleFillLoop();
    let reduce=false;try{reduce=matchMedia('(prefers-reduced-motion: reduce)').matches}catch{}
    if(reduce){applyTitleFill(.94);return}
    const tick=()=>{
      if(!$('#promptModeHandoff')){titleFillRaf=0;return}
      applyTitleFill(titleProgress(Date.now()-startedAt));
      titleFillRaf=requestAnimationFrame(tick);
    };
    titleFillRaf=requestAnimationFrame(tick);
  }

  function guardClicks(event){if(!active||allowAdvance)return;if(event.target.closest?.('#stepProject .next-btn')){event.preventDefault();event.stopImmediatePropagation()}}
  function applyBrief(data){const field=$('#projectDescription');if(!field)return false;if(field.value.trim()!==data.brief.trim()){field.value=data.brief.trim();field.dispatchEvent(new Event('input',{bubbles:true}));field.dispatchEvent(new Event('change',{bubbles:true}))}return field.value.trim().length>=8}
  function applyMode(data){const button=$(`.mode-switch button[data-mode="${data.mode}"]`);if(!button)return false;if(document.documentElement.classList.contains('prompt-access-pending'))return false;if(button.disabled||button.classList.contains('locked'))return false;if(!button.classList.contains('active'))button.click();document.documentElement.dataset.promptMode=data.mode;return button.classList.contains('active')}

  function release(box){active=false;clearTimeout(timer);clearInterval(sentenceTimer);stopTitleFillLoop(true);clear();box?.classList.add('is-leaving');setTimeout(()=>{box?.remove();document.documentElement.classList.remove('prompt-mode-handoff-active','prompt-route-pending');document.getElementById('promptRoutePendingStyle')?.remove();window.dispatchEvent(new CustomEvent('promptai:mode-handoff-complete'))},250)}
  function finish(data){
    if(finishing)return;const elapsed=Date.now()-startedAt,box=$('#promptModeHandoff');if(elapsed<MIN_VISIBLE_MS||!uiReady()){timer=setTimeout(()=>tick(data),70);return}
    finishing=true;clearInterval(sentenceTimer);
    setSentence('Referenzen sind bereit.');
    setTimeout(()=>release(box),SENTENCE_MS+320);
  }
  function failOpen(message){if(finishing)return;finishing=true;clearInterval(sentenceTimer);const box=$('#promptModeHandoff');setSentence(message||'Projekt wird geöffnet.',true);setTimeout(()=>release(box),520)}

  function tick(data){
    if(!active||finishing)return;
    if(Date.now()-startedAt>FAIL_OPEN_MS){failOpen('Projekt wird geöffnet.');return}
    const workflow=$('#workflowApp');applyBrief(data);applyMode(data);const n=step();if(n>=2){finish(data);return}
    if(workflow&&!workflow.hidden&&n===1&&!advanceStarted&&applyBrief(data)){const next=$('#stepProject .next-btn');if(next&&!next.disabled){advanceStarted=true;allowAdvance=true;next.click();allowAdvance=false}}
    if(advanceStarted&&n===1&&Date.now()-startedAt>5000&&retryCount<1){const next=$('#stepProject .next-btn');if(next&&!next.disabled){retryCount++;allowAdvance=true;next.click();allowAdvance=false}}
    timer=setTimeout(()=>tick(data),80)
  }
  function boot(){styles();const data=read();if(!data?.brief||!data?.mode){document.documentElement.classList.remove('prompt-route-pending');document.getElementById('promptRoutePendingStyle')?.remove();return}claimInitialAdvance();active=true;startedAt=Date.now();document.documentElement.classList.add('prompt-mode-handoff-active');overlay(data);tick(data)}

  document.addEventListener('click',rememberSelection,true);document.addEventListener('click',guardClicks,true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
