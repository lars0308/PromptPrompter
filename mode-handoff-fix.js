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

  // rememberSelection unten schreibt nur dann etwas, wenn eine Karte mit data-project-mode
  // geklickt wurde. Dieses Auswahlfenster oeffnet project-start-ui.js aber gar nicht mehr - die
  // drei Ablaeufe stehen jetzt im Settings-Blatt der Konsole. Damit blieb der Schluessel leer,
  // boot() stieg sofort aus und der Start lief ohne Animation: die Seite lag nur kurz unter der
  // Papierflaeche und sprang dann direkt in den Ablauf. persistNewProject() legt Modus und
  // Beschreibung ohnehin schon ab, also lesen wir sie hier als Rueckfall - damit bekommen alle
  // drei Ablaeufe dieselbe Uebergabe, nicht nur der ueber das alte Fenster gestartete.
  function read(){
    try{
      const stored=JSON.parse(sessionStorage.getItem(HANDOFF_KEY)||'null');
      if(stored?.brief&&stored?.mode)return stored;
      const mode=sessionStorage.getItem(PENDING_MODE_KEY)||'',brief=(sessionStorage.getItem(PENDING_BRIEF_KEY)||'').trim();
      if(mode&&brief.length>=8)return {mode,brief,createdAt:Date.now()};
      return stored;
    }catch{return null}
  }
  function write(value){try{sessionStorage.setItem(HANDOFF_KEY,JSON.stringify(value))}catch{}}
  function clear(){try{[HANDOFF_KEY,SIMPLE_START_KEY,PENDING_MODE_KEY,PENDING_BRIEF_KEY].forEach(k=>sessionStorage.removeItem(k))}catch{}}
  function claimInitialAdvance(){try{sessionStorage.removeItem(SIMPLE_START_KEY)}catch{}}
  function modeLabel(mode){return mode==='auto'?'AUTO':mode==='expert'?'EXPERTE':'GEFÜHRT'}
  function step(){return Number($('.step-panel.active')?.dataset.stepPanel||0)}
  function uiReady(){return document.documentElement.classList.contains('prompt-home-ready')&&!document.documentElement.classList.contains('prompt-access-pending')}


  function rememberSelection(event){const card=event.target.closest?.('[data-project-mode]');if(!card||card.disabled)return;const brief=String($('#simpleIntakeText')?.value||'').trim();if(brief.length<8)return;write({mode:card.dataset.projectMode||'guided',brief,createdAt:Date.now()})}
  function setSentence(text,immediate=false){
    const host=$('#promptModeHandoff .prompt-mode-handoff-status');if(!host)return;
    const apply=()=>{host.textContent=text;host.classList.remove('is-changing');sentenceStartedAt=Date.now()};
    if(immediate){apply();return}host.classList.add('is-changing');setTimeout(()=>{if(host.isConnected)apply()},160)
  }
  function startSentences(){clearInterval(sentenceTimer);sentenceIndex=0;setSentence(sentences[0],true);sentenceTimer=setInterval(()=>{if(!active||finishing){clearInterval(sentenceTimer);return}sentenceIndex=(sentenceIndex+1)%sentences.length;setSentence(sentences[sentenceIndex])},SENTENCE_MS+230)}
  function overlay(data){let box=$('#promptModeHandoff');if(box)return box;box=document.createElement('section');box.id='promptModeHandoff';box.className='prompt-mode-handoff';box.setAttribute('aria-live','polite');box.innerHTML=`<div><span class="kicker">PROMPT.AI · ${modeLabel(data.mode)}</span><strong>Rückfragen werden erstellt</strong><div class="prompt-mode-handoff-status"></div><div class="prompt-mode-handoff-bar"><i></i></div><div class="prompt-mode-handoff-pulse" aria-hidden="true"><i></i><i></i><i></i></div></div>`;document.body.appendChild(box);startSentences();startTitleFillLoop();return box}
  let titleFillRaf=0;
  function titleProgress(elapsed){const tau=1500;return Math.min(.94,.94*(1-Math.exp(-elapsed/tau)))}
  function applyTitleFill(progress){const box=$('#promptModeHandoff');if(!box)return;const next=`${(progress*100).toFixed(1)}%`;if(box.style.getPropertyValue('--prompt-fill')!==next)box.style.setProperty('--prompt-fill',next);window.PromptAiFill?.words?.(box.querySelector('strong'),progress)}
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

  function release(box){active=false;clearTimeout(timer);clearInterval(sentenceTimer);stopTitleFillLoop(true);clear();document.documentElement.classList.remove('prompt-handoff-pending');
    // Steht schon der naechste Ladeschirm bereit, gehoert hierhin kein Abschluss: sonst blinkt
    // dieser Schirm, blendet weg - und der naechste blendet sofort wieder auf. Das sind zwei
    // Ladebilder fuer einen Uebergang. Also stillschweigend uebergeben.
    if(document.querySelector('#promptWorkflowLoader,#promptAiTaskLoader')){leave(box);return}
    // Ueberschrift auf voll, zweimal blau blinken, dann die Flaeche ausblenden.
    const flash=window.PromptAiFill?.flashMs??420;
    const wait=window.PromptAiFill?.tail?.(startedAt)??flash;
    if(flash&&box){box.style.setProperty('--prompt-flash-count',String(Math.max(2,Math.round(wait/flash))));box.classList.add('is-complete')}
    setTimeout(()=>leave(box),flash?wait:0)}
  function leave(box){box?.classList.add('is-leaving');setTimeout(()=>{box?.remove();document.documentElement.classList.remove('prompt-mode-handoff-active','prompt-route-pending');window.dispatchEvent(new CustomEvent('promptai:mode-handoff-complete'))},250)}
  function finish(data){
    if(finishing)return;const elapsed=Date.now()-startedAt,box=$('#promptModeHandoff');if(elapsed<MIN_VISIBLE_MS||!uiReady()){timer=setTimeout(()=>tick(data),70);return}
    finishing=true;clearInterval(sentenceTimer);
    // "Selbst einstellen" hat nichts vorbereitet, worauf jemand warten muesste - dort geht der
    // Vorhang gleich wieder auf, statt drei Sekunden lang eine fertige Automatik zu behaupten.
    const expert=data.mode==='expert';
    setSentence(expert?'Alle Schritte sind offen.':'Referenzen sind bereit.');
    // 720ms waren zu knapp: der Satz war noch im Einblenden, als der Vorhang schon aufging.
    // Eine Satzlaenge steht, danach ist Schluss - immer noch klar kuerzer als die Ablaeufe, die
    // wirklich etwas vorbereiten.
    setTimeout(()=>release(box),expert?SENTENCE_MS-800:SENTENCE_MS+320);
  }
  function failOpen(message){if(finishing)return;finishing=true;clearInterval(sentenceTimer);const box=$('#promptModeHandoff');setSentence(message||'Projekt wird geöffnet.',true);setTimeout(()=>release(box),520)}

  function tick(data){
    if(!active||finishing)return;
    if(Date.now()-startedAt>FAIL_OPEN_MS){failOpen('Projekt wird geöffnet.');return}
    const workflow=$('#workflowApp');applyBrief(data);applyMode(data);const n=step();if(n>=2){finish(data);return}
    // Bei "Selbst einstellen" bleiben alle acht Schritte in der Hand des Nutzers. Die Uebergabe
    // deckt hier nur den Neuaufbau der Seite ab; weitergeklickt wird nichts. Aus demselben Grund
    // springt maybeSkipInitial() in streamlined-project-flow.js in diesem Ablauf nicht vor.
    if(data.mode==='expert'&&workflow&&!workflow.hidden&&n===1&&applyBrief(data)){finish(data);return}
    if(workflow&&!workflow.hidden&&n===1&&!advanceStarted&&applyBrief(data)){const next=$('#stepProject .next-btn');if(next&&!next.disabled){advanceStarted=true;allowAdvance=true;next.click();allowAdvance=false}}
    if(advanceStarted&&n===1&&Date.now()-startedAt>5000&&retryCount<1){const next=$('#stepProject .next-btn');if(next&&!next.disabled){retryCount++;allowAdvance=true;next.click();allowAdvance=false}}
    timer=setTimeout(()=>tick(data),80)
  }
  function boot(){const data=read();if(!data?.brief||!data?.mode){document.documentElement.classList.remove('prompt-route-pending');return}claimInitialAdvance();active=true;startedAt=Date.now();document.documentElement.classList.add('prompt-mode-handoff-active');overlay(data);tick(data)}

  document.addEventListener('click',rememberSelection,true);document.addEventListener('click',guardClicks,true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
