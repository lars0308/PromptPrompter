(()=>{
  'use strict';
  const $=(s,r=document)=>r?.querySelector?.(s)||null;
  let settleTimer=0,settleDeadline=0,cycleTimer=0,activeKind='',pendingFromReferences=false,userExited=false;
  // Once the questions are answered the briefing is done. Without this the same 'Briefing wird
  // geprüft' screen came back after the dialog closed - the same screen twice around one dialog.
  let reviewAnswered=false,stageText='';
  const STEP_STABLE_MS=90;
  const MAX_SETTLE_MS=400;
  const SENTENCE_MS=3000;
  const LOADER_TIMEOUT_MS=95000;

  const mode=()=>$('.mode-switch button.active')?.dataset.mode||document.documentElement.dataset.promptMode||'guided';
  const currentStep=()=>Number($('.step-panel.active')?.dataset.stepPanel||0);
  function workflowVisible(){const workflow=$('#workflowApp');if(!workflow||workflow.hidden)return false;try{return getComputedStyle(workflow).display!=='none'&&getComputedStyle(workflow).visibility!=='hidden'}catch{return true}}
  const cleanMode=()=>['guided','auto'].includes(mode());
  const clarificationOpen=()=>Boolean($('#clarificationDialog')?.open);


  // Drei Sätze waren nach zwölf Sekunden durch und fingen sichtbar von vorn an. Die Liste ist
  // länger und bleibt bei dem, was in diesem Schritt wirklich passiert - kein Zufallsspruch,
  // der etwas behauptet, das gerade nicht läuft.
  const copy={
    review:{kicker:'RÜCKMELDUNG',title:'Briefing wird geprüft',sentences:[
      'Angaben werden geprüft.',
      'Beschreibung wird gelesen.',
      'Angehängte Quellen werden ausgewertet.',
      'Offene Punkte werden erkannt.',
      'Widersprüche werden gesucht.',
      'Pflichtangaben werden abgeglichen.',
      'Rückfragen werden vorbereitet.',
      'Antwortvorschläge werden formuliert.'
    ]},
    preview:{kicker:'VORSCHAU',title:'Vorschau wird erstellt',sentences:[
      'Briefing wird verarbeitet.',
      'Zielgruppe und Ziel werden eingeordnet.',
      'Seitenstruktur wird abgeleitet.',
      'Die Richtungen werden gestaltet.',
      'Farben und Typografie werden gesetzt.',
      'Bildsprache wird festgelegt.',
      'Bilder werden erstellt.',
      'Letzte Feinheiten werden gesetzt.'
    ]},
    login:{kicker:'ANMELDUNG',title:'App wird vorbereitet',sentences:[
      'App wird vorbereitet.',
      'KI wird aufgeweckt.',
      'Tarif wird geprüft.',
      'Bibliothek wird geladen.',
      'Projekte werden synchronisiert.',
      'Arbeitsfläche wird aufgebaut.'
    ]}
  };
  let loginActive=false;

  let fillRaf=0,fillStartedAt=0,flashTimer=0,shownAt=0;
  const FLASH_MS=window.PromptAiFill?.flashMs??420;
  const reduceMotion=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch{return false}};
  function fillProgress(elapsed){const tau=15000;return Math.min(.94,.94*(1-Math.exp(-elapsed/tau)))}
  function applyFill(progress){
    const box=$('#promptWorkflowLoader');if(!box)return;
    const next=`${(progress*100).toFixed(1)}%`;
    if(box.style.getPropertyValue('--prompt-fill')!==next)box.style.setProperty('--prompt-fill',next);
  }
  function forceRecover(){
    clearInterval(cycleTimer);cycleTimer=0;
    const box=$('#promptWorkflowLoader');if(!box)return;
    const pulse=$('.prompt-loader-pulse',box);if(pulse)pulse.hidden=true;
    const kicker=$('.kicker',box);if(kicker)kicker.textContent='ZEITÜBERSCHREITUNG';
    setTitle(box,'Das dauert länger als erwartet');
    setSentence('Tippe oben rechts auf ×, um zurückzukehren und es erneut zu versuchen. Dein Projekt bleibt dabei erhalten.',true);
  }
  function startFillLoop(){
    cancelAnimationFrame(fillRaf);fillStartedAt=performance.now();
    if(reduceMotion()){applyFill(.94);return}
    const tick=()=>{
      if(!$('#promptWorkflowLoader')){fillRaf=0;return}
      const elapsed=performance.now()-fillStartedAt;
      if(elapsed>LOADER_TIMEOUT_MS){fillRaf=0;forceRecover();return}
      applyFill(fillProgress(elapsed));fillRaf=requestAnimationFrame(tick);
    };
    fillRaf=requestAnimationFrame(tick);
  }
  function stopFillLoop(complete=false){cancelAnimationFrame(fillRaf);fillRaf=0;if(complete)applyFill(1)}

  function loader(){let box=$('#promptWorkflowLoader');if(box)return box;box=document.createElement('section');box.id='promptWorkflowLoader';box.setAttribute('aria-live','polite');box.innerHTML='<button type="button" id="promptWorkflowLoaderClose" aria-label="Abbrechen">×</button><div><span class="kicker"></span><strong></strong><div class="prompt-loader-sentence"></div><div class="prompt-loader-bar"><i></i></div><div class="prompt-loader-pulse" aria-hidden="true"><i></i><i></i><i></i></div></div>';document.body.appendChild(box);return box}
  function setTitle(box,text){const host=$('strong',box);if(!host||host.textContent===text)return;host.textContent=text}
  function setSentence(text,immediate=false){const box=$('#promptWorkflowLoader'),host=$('.prompt-loader-sentence',box||document);if(!host)return;const apply=()=>{host.textContent=text;host.classList.remove('is-changing')};if(immediate){apply();return}host.classList.add('is-changing');setTimeout(()=>{if(host.isConnected)apply()},160)}
  function startCycle(kind){const data=copy[kind];if(!data)return;clearInterval(cycleTimer);
    // A real stage beats the generic rotation: while the run reports what it is doing the screen
    // says exactly that instead of cycling through three guesses.
    if(kind==='preview'&&stageText){setSentence(stageText,true);return}
    let index=0;setSentence(data.sentences[index],true);cycleTimer=setInterval(()=>{const box=$('#promptWorkflowLoader');if(!box||activeKind!==kind){clearInterval(cycleTimer);return}index=(index+1)%data.sentences.length;setSentence(data.sentences[index])},SENTENCE_MS+240)}
  function show(kind){const data=copy[kind];if(!data)return;if(kind!=='login'&&(userExited||!workflowVisible()||!cleanMode()))return;const box=loader();clearTimeout(flashTimer);if(!shownAt||box.classList.contains('is-complete'))shownAt=Date.now();box.classList.remove('is-leaving','is-complete');box.style.removeProperty('--prompt-flash-count');document.documentElement.classList.add('prompt-workflow-loading');const kicker=$('.kicker',box);if(kicker.textContent!==data.kicker)kicker.textContent=data.kicker;setTitle(box,data.title);if(activeKind!==kind){activeKind=kind;startCycle(kind);startFillLoop()}}
  // force=true is the user asking to get out (× or leaving the workflow) - only that may cut a
  // closing blink short. A passing sync() must not: it used to remove the login screen ~120ms after
  // hide(), so the screen flashed by without the fill ever finishing.
  function hide(immediate=false,force=false){loginActive=false;clearInterval(cycleTimer);cycleTimer=0;activeKind='';stageText='';const box=$('#promptWorkflowLoader');document.documentElement.classList.remove('prompt-workflow-loading');if(!box){stopFillLoop();return}
    if(!force&&flashTimer&&box.classList.contains('is-complete'))return;
    stopFillLoop(true);if(immediate){clearTimeout(flashTimer);flashTimer=0;shownAt=0;box.remove();return}
    // Fill to full, blink once, then leave. sync() may call hide() again while the blink runs, so
    // a running blink is never restarted - that would keep the screen up forever. show() cancels it.
    if(box.classList.contains('is-complete'))return;
    // A screen that flickers past in 200ms reads as a glitch: it stays for the shared minimum and
    // blinks until then.
    const wait=window.PromptAiFill?.tail?.(shownAt)??FLASH_MS;
    box.style.setProperty('--prompt-flash-count',String(Math.max(2,Math.round(wait/(FLASH_MS||420)))));
    box.classList.add('is-complete');flashTimer=setTimeout(()=>{flashTimer=0;box.classList.add('is-leaving');setTimeout(()=>{box.remove();shownAt=0},250)},wait)}

  function closeLateWorkflowUi(){const dialog=$('#clarificationDialog');if(dialog?.open){try{dialog.close('cancel')}catch{dialog.removeAttribute('open')}}$('#promptCompletionFlash')?.remove();document.documentElement.classList.remove('prompt-review-transition','prompt-clarification-exit')}

  function sync(){if(loginActive)return;const visible=workflowVisible(),step=currentStep();if(!visible){pendingFromReferences=false;hide(true);closeLateWorkflowUi();return}if(userExited)return;if(clarificationOpen()){pendingFromReferences=false;hide();return}if(step===2){if(!pendingFromReferences)hide();return}if(step===3){pendingFromReferences=false;show(reviewAnswered?'preview':'review');return}
    // Steps 4 and 5 are skipped automatically in the guided and auto modes, so the screen stays up
    // instead of blinking away between them. In expert mode they are real pages and it leaves.
    if(step===4||step===5||(step===6&&document.body.dataset.previewGenerating==='1')){pendingFromReferences=false;if(cleanMode())show('preview');else hide();return}
    if(step===1||step>=6){pendingFromReferences=false;reviewAnswered=false;hide();return}}

  // Regenerating previews is a new run, so the screen belongs on top again - also for someone who
  // closed it with × during the previous run.
  function showPreviewRun(){
    userExited=false;pendingFromReferences=false;
    show('preview');schedule(60);
  }
  function showLogin(){
    loginActive=true;
    const data=copy.login;const box=loader();clearTimeout(flashTimer);flashTimer=0;
    // Without this the shared minimum showtime was measured from zero, and the screen left on the
    // bare blink instead of staying up long enough to read.
    if(!shownAt||box.classList.contains('is-complete'))shownAt=Date.now();
    box.classList.remove('is-leaving','is-complete');box.style.removeProperty('--prompt-flash-count');document.documentElement.classList.add('prompt-workflow-loading');
    const kicker=$('.kicker',box);if(kicker.textContent!==data.kicker)kicker.textContent=data.kicker;
    setTitle(box,data.title);
    if(activeKind!=='login'){activeKind='login';startCycle('login');startFillLoop()}
  }
  function hideLogin(){loginActive=false;hide()}
  // Debounced, but with a hard ceiling: a steady stream of mutations must never be able to
  // postpone sync() indefinitely, otherwise the loader can outlive the state that justified it.
  function schedule(delay=STEP_STABLE_MS){
    const now=Date.now();
    if(!settleTimer)settleDeadline=now+MAX_SETTLE_MS;
    clearTimeout(settleTimer);
    settleTimer=setTimeout(()=>{settleTimer=0;sync()},Math.max(0,Math.min(delay,settleDeadline-now)));
  }

  function onClick(event){
    const refNext=event.target.closest?.('#stepReferences .next-btn,#skipReferencesBtn');if(refNext&&workflowVisible()&&cleanMode()){userExited=false;reviewAnswered=false;pendingFromReferences=true;show('review');schedule(180);return}
    if(event.target.closest?.('#saveClarificationsBtn,#deferClarificationsBtn')){reviewAnswered=true;schedule(120);return}
    if(event.target.closest?.('#promptWorkflowLoaderClose')){userExited=true;pendingFromReferences=false;hide(true,true);closeLateWorkflowUi();$('#brandHome')?.click();return}
    if(event.target.closest?.('#brandHome,.guided-clean-exit')){userExited=true;pendingFromReferences=false;hide(true,true);closeLateWorkflowUi();return}
    if(event.target.closest?.('#clarificationDialog .close-dialog')){pendingFromReferences=false;hide();return}
  }
  function blockLateHiddenClicks(event){if(workflowVisible())return;const button=event.target.closest?.('#workflowApp .next-btn,#workflowApp .back-btn');if(button&&!event.isTrusted){event.preventDefault();event.stopImmediatePropagation()}}
  // The loader repaints its own progress bar every frame. Those inline-style writes are not
  // workflow state, and letting them reach schedule() kept re-arming the debounce so sync()
  // never ran — the overlay then stayed on screen until the 95s timeout.
  const fromLoader=node=>{const el=node?.nodeType===1?node:node?.parentElement;return Boolean(el?.closest?.('#promptWorkflowLoader'))};
  function observe(){new MutationObserver(records=>{if(records.some(record=>!fromLoader(record.target)))schedule()}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','open','style','data-preview-generating']});
    // app.js reports what the run is really doing - which step, which of the three images.
    window.addEventListener('promptai:preview-stage',event=>{
      stageText=String(event.detail?.text||'');
      const ratio=event.detail?.ratio;
      // While the three images are made, the headline fills by images finished instead of by
      // elapsed time - so "Bild 2 von 3" and the bar say the same thing.
      if(typeof ratio==='number'&&Number.isFinite(ratio)){stopFillLoop();applyFill(Math.max(.08,Math.min(.99,ratio)))}
      if(activeKind==='preview'&&stageText){clearInterval(cycleTimer);cycleTimer=0;setSentence(stageText)}
    });window.addEventListener('pageshow',()=>schedule(0));window.addEventListener('promptai:access',()=>schedule(0))}
  function observeClarification(){
    const watch=dialog=>{if(!dialog||dialog.__promptLoaderWatched)return;dialog.__promptLoaderWatched=true;new MutationObserver(()=>{if(dialog.open){pendingFromReferences=false;hide()}else sync()}).observe(dialog,{attributes:true,attributeFilter:['open']})};
    watch($('#clarificationDialog'));
    new MutationObserver(()=>watch($('#clarificationDialog'))).observe(document.body,{childList:true,subtree:true});
  }
  function bind(){document.addEventListener('click',onClick,true);document.addEventListener('click',blockLateHiddenClicks,true)}
  function init(){bind();observe();observeClarification();sync()}
  window.PromptAiTransitionLoader={show:showLogin,hide:hideLogin,previewRun:showPreviewRun};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
