(()=>{
  'use strict';
  const HANDOFF_KEY='prompt-ai-mode-handoff-v1';
  const SIMPLE_START_KEY='prompt-ai-v1-simple-start';
  const PENDING_MODE_KEY='prompt-ai-new-project-mode-v2';
  const PENDING_BRIEF_KEY='prompt-ai-new-project-brief-v1';
  const $=(s,r=document)=>r.querySelector(s);
  let active=false,allowAdvance=false,advanceStarted=false,retryCount=0,timer=0,startedAt=0,minMs=3200;

  function read(){try{return JSON.parse(sessionStorage.getItem(HANDOFF_KEY)||'null')}catch{return null}}
  function write(value){try{sessionStorage.setItem(HANDOFF_KEY,JSON.stringify(value))}catch{}}
  function clear(){try{[HANDOFF_KEY,SIMPLE_START_KEY,PENDING_MODE_KEY,PENDING_BRIEF_KEY].forEach(k=>sessionStorage.removeItem(k))}catch{}}
  function modeLabel(mode){return mode==='auto'?'Auto':mode==='expert'?'Experte':'Geführt'}
  function durationFor(text){const n=String(text||'').trim().length;return n<140?3200:n<500?Math.min(5200,3600+n*3):Math.min(7200,5000+n*1.8)}
  function step(){return Number($('.step-panel.active')?.dataset.stepPanel||0)}

  function styles(){
    if($('#promptModeHandoffStyles'))return;
    const s=document.createElement('style');s.id='promptModeHandoffStyles';s.textContent=`
      html.prompt-mode-handoff-active body{overflow:hidden!important}
      .prompt-mode-handoff{position:fixed;z-index:2147483647;inset:0;display:grid;place-items:center;padding:28px 20px;background:var(--paper,#f4f5f6);color:var(--ink,#171814)}
      .prompt-mode-handoff>div{width:min(570px,100%);text-align:center}.prompt-mode-handoff .kicker{display:block;color:var(--ui-blue,var(--accent,#1689c7));font-size:9px;font-weight:850;letter-spacing:.12em}.prompt-mode-handoff strong{display:block;margin-top:8px;font-size:clamp(31px,7vw,48px);line-height:1;letter-spacing:-.05em}
      .prompt-mode-handoff-copy{display:grid;gap:13px;max-width:520px;margin:24px auto 0;text-align:left}.prompt-mode-handoff-line{position:relative;color:var(--ink,#171814);font-size:clamp(15px,2.8vw,18px);font-weight:650;line-height:1.45}.prompt-mode-handoff-line .fill{position:absolute;inset:0;color:var(--ui-blue,var(--accent,#1689c7));clip-path:inset(0 100% 0 0);pointer-events:none;animation:promptModeHandoffFill var(--d) linear var(--delay) forwards}
      .prompt-mode-handoff.done .prompt-mode-handoff-line .fill{clip-path:inset(0)!important;animation:promptModeHandoffDone .48s ease both!important}.prompt-mode-handoff small{display:block;min-height:17px;margin-top:22px;color:var(--muted,#6e6c64);font-size:10px}
      @keyframes promptModeHandoffFill{to{clip-path:inset(0)}}@keyframes promptModeHandoffDone{0%,100%{filter:none;text-shadow:none}45%{filter:brightness(1.18);text-shadow:0 0 18px color-mix(in srgb,var(--ui-blue,var(--accent,#1689c7)) 38%,transparent)}}
      @media(prefers-reduced-motion:reduce){.prompt-mode-handoff-line .fill{animation:none!important;clip-path:inset(0)!important}}
    `;document.head.appendChild(s)
  }

  function rememberSelection(event){
    const card=event.target.closest?.('[data-project-mode]');if(!card||card.disabled)return;
    const brief=String($('#simpleIntakeText')?.value||'').trim();if(brief.length<8)return;
    write({mode:card.dataset.projectMode||'guided',brief,createdAt:Date.now()});
  }

  function overlay(data){
    let box=$('#promptModeHandoff');if(box)return box;
    box=document.createElement('section');box.id='promptModeHandoff';box.className='prompt-mode-handoff';box.setAttribute('aria-live','polite');
    const lines=[
      'Deine Beschreibung wird übernommen und sauber eingeordnet.',
      'Arbeitsmodus und Projektweg werden eindeutig gesetzt.',
      'Die doppelte Eingabe wird übersprungen.',
      'Als Nächstes kannst du direkt Referenzen ergänzen.'
    ];
    box.innerHTML=`<div><span class="kicker">PROMPT.AI</span><strong>${modeLabel(data.mode)} wird vorbereitet</strong><div class="prompt-mode-handoff-copy"></div><small>Dein Projekt wird stabil geladen …</small></div>`;
    const copy=$('.prompt-mode-handoff-copy',box),total=minMs,weights=[.24,.25,.24,.27];let elapsed=0;
    lines.forEach((text,i)=>{const row=document.createElement('div');row.className='prompt-mode-handoff-line';const d=Math.max(650,Math.round(total*weights[i]));row.style.setProperty('--d',`${d}ms`);row.style.setProperty('--delay',`${Math.round(elapsed)}ms`);row.innerHTML=`<span>${text}</span><span class="fill" aria-hidden="true">${text}</span>`;copy.appendChild(row);elapsed+=d});
    document.body.appendChild(box);return box
  }

  function guardClicks(event){
    if(!active||allowAdvance)return;
    if(event.target.closest?.('#stepProject .next-btn')){event.preventDefault();event.stopImmediatePropagation()}
  }

  function applyBrief(data){
    const field=$('#projectDescription');if(!field)return false;
    if(field.value.trim()!==data.brief.trim()){field.value=data.brief.trim();field.dispatchEvent(new Event('input',{bubbles:true}));field.dispatchEvent(new Event('change',{bubbles:true}))}
    return field.value.trim().length>=8
  }

  function applyMode(data){
    const button=$(`.mode-switch button[data-mode="${data.mode}"]`);if(!button)return false;
    if(document.documentElement.classList.contains('prompt-access-pending'))return false;
    if(button.disabled||button.classList.contains('locked'))return false;
    if(!button.classList.contains('active'))button.click();
    document.documentElement.dataset.promptMode=data.mode;
    return button.classList.contains('active')
  }

  function finish(data){
    const elapsed=Date.now()-startedAt,wait=Math.max(0,minMs-elapsed),box=$('#promptModeHandoff');
    if(box){box.classList.add('done');const status=$('small',box);if(status)status.textContent='Referenzen sind bereit.'}
    setTimeout(()=>{clear();active=false;document.documentElement.classList.remove('prompt-mode-handoff-active');box?.remove();window.dispatchEvent(new CustomEvent('promptai:mode-handoff-complete',{detail:{mode:data.mode}}))},Math.max(wait,480))
  }

  function failOpen(message){
    const box=$('#promptModeHandoff');if(box){const status=$('small',box);if(status)status.textContent=message||'Projekt konnte nicht automatisch weitergeschaltet werden.'}
    setTimeout(()=>{clear();active=false;document.documentElement.classList.remove('prompt-mode-handoff-active');box?.remove()},900)
  }

  function tick(data){
    if(!active)return;
    const workflow=$('#workflowApp');applyBrief(data);applyMode(data);
    const n=step();
    if(n>=2){finish(data);return}
    if(workflow&&!workflow.hidden&&n===1&&!advanceStarted&&applyBrief(data)&&applyMode(data)){
      const next=$('#stepProject .next-btn');if(next&&!next.disabled){advanceStarted=true;allowAdvance=true;next.click();allowAdvance=false}
    }
    if(advanceStarted&&n===1&&Date.now()-startedAt>6500&&retryCount<1){const next=$('#stepProject .next-btn');if(next&&!next.disabled){retryCount++;allowAdvance=true;next.click();allowAdvance=false}}
    if(Date.now()-startedAt>18000){failOpen('Der Projektstart dauert ungewöhnlich lange. Die Beschreibung bleibt erhalten.');return}
    timer=setTimeout(()=>tick(data),90)
  }

  function boot(){
    styles();const data=read();if(!data?.brief||!data?.mode)return;
    active=true;startedAt=Date.now();minMs=durationFor(data.brief);document.documentElement.classList.add('prompt-mode-handoff-active');overlay(data);tick(data)
  }

  document.addEventListener('click',rememberSelection,true);
  document.addEventListener('click',guardClicks,true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
