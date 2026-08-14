(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const SIMPLE_START_KEY='prompt-ai-v1-simple-start';
  const DISMISS_KEY='prompt-ai-clarification-dismissed-v2';
  const BLUE='var(--ui-blue,var(--accent,#1689c7))';
  let settleTimer=0,lastClarificationOpen=false;

  try{if(sessionStorage.getItem(SIMPLE_START_KEY)==='1')document.documentElement.classList.add('prompt-skip-intake-brief')}catch{}

  function installStyles(){
    if($('#promptLoadingV2Styles'))return;
    const s=document.createElement('style');s.id='promptLoadingV2Styles';s.textContent=`
      :root{--prompt-load-blue:${BLUE}}
      html.prompt-skip-intake-brief #workflowApp #stepProject.active{visibility:hidden!important;pointer-events:none!important}
      .prompt-handoff-loader{position:fixed;z-index:2147483600;inset:0;display:grid;place-items:center;padding:28px 20px;background:var(--paper);color:var(--ink);user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
      .prompt-handoff-loader>div{width:min(590px,100%);text-align:center}.prompt-handoff-loader .prompt-process-lines{margin-top:24px;text-align:left}
      .prompt-process-kicker{display:block;color:var(--prompt-load-blue);font-size:9px;font-weight:850;letter-spacing:.12em}.prompt-process-title{display:block;margin-top:8px;font-size:clamp(30px,7vw,48px);line-height:1;letter-spacing:-.05em}
      .prompt-process-lines{display:grid;gap:13px;width:min(540px,100%);margin:18px auto 0}.prompt-process-line{position:relative;color:var(--ink);font-size:clamp(14px,2.7vw,17px);font-weight:650;line-height:1.45}.prompt-process-line>.prompt-process-fill{position:absolute;inset:0;color:var(--prompt-load-blue);clip-path:inset(0 100% 0 0);pointer-events:none}
      .prompt-process-lines.running .prompt-process-fill{animation:promptLoadFill var(--prompt-line-duration,900ms) linear var(--prompt-line-delay,0ms) forwards}.prompt-process-lines.complete .prompt-process-fill{clip-path:inset(0)!important;animation:promptLoadFinish .48s ease both!important}
      @keyframes promptLoadFill{to{clip-path:inset(0)}}@keyframes promptLoadFinish{0%,100%{filter:none;text-shadow:none}45%{filter:brightness(1.18);text-shadow:0 0 18px color-mix(in srgb,var(--prompt-load-blue) 38%,transparent)}}
      .flow-transition-compact i{display:none!important}.flow-transition-compact .prompt-process-lines{margin-top:22px!important;text-align:left!important}.flow-transition-compact .prompt-process-line{font-size:clamp(14px,2.6vw,17px)!important}
      #reviewProgress.prompt-process-enhanced,#previewProgress.prompt-process-enhanced,#websiteBuildProgress.prompt-process-enhanced{height:auto!important;max-height:none!important;overflow:visible!important}
      #reviewProgress .prompt-process-lines,#previewProgress .prompt-process-lines,#websiteBuildProgress .prompt-process-lines{margin-top:14px;text-align:left}
      .prompt-completion-flash{position:fixed;z-index:2147483646;inset:0;display:grid;place-items:center;padding:28px 20px;background:color-mix(in srgb,var(--paper) 97%,transparent);backdrop-filter:blur(10px);animation:promptFlashIn .14s ease both;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}.prompt-completion-flash>div{width:min(580px,100%);text-align:center}.prompt-completion-flash .prompt-process-lines{margin-top:22px;text-align:left}.prompt-completion-flash .prompt-process-fill{clip-path:inset(0)!important;color:var(--prompt-load-blue);animation:promptLoadFinish .48s ease both!important}
      @keyframes promptFlashIn{from{opacity:0}to{opacity:1}}
      html.prompt-clarification-exit.prompt-review-transition #flowTransitionCompact{display:none!important}html.prompt-clarification-exit.prompt-review-transition #workflowApp .step-panel.active{display:block!important}
      #promptAiThinkingStage .prompt-thinking-line .fill{transition:filter .18s ease,text-shadow .18s ease}#promptAiThinkingStage.prompt-v2-complete .prompt-thinking-line .fill{clip-path:inset(0)!important;color:var(--prompt-load-blue)!important;filter:brightness(1.18);text-shadow:0 0 18px color-mix(in srgb,var(--prompt-load-blue) 38%,transparent)}
      @media(max-width:820px){.prompt-process-lines{gap:12px}.prompt-handoff-loader{padding:24px 18px}.prompt-completion-flash{padding:24px 18px}}
      @media(prefers-reduced-motion:reduce){.prompt-process-fill{animation:none!important;clip-path:inset(0)!important}.prompt-completion-flash{animation:none!important}}
    `;document.head.appendChild(s)
  }

  function durationFor(length=0){const n=Math.max(0,Number(length)||0);if(n<=120)return 3200+Math.round(n*8);if(n<=500)return 4160+Math.round((n-120)*9);return Math.min(11000,7580+Math.round((n-500)*4))}
  function lineSet(kind){
    if(kind==='briefing')return [
      'Deine Beschreibung wird übernommen und sauber eingeordnet.',
      'Ziel, Angebot und wichtige Anforderungen werden zusammengeführt.',
      'Offene Punkte werden von bereits klaren Angaben getrennt.',
      'Sicherheit, Datenschutz und rechtliche Grundlagen laufen im Hintergrund mit.'
    ];
    if(kind==='preview')return [
      'Deine Angaben und Antworten werden zusammengeführt.',
      'Struktur, Inhalt und visuelle Richtung werden aufeinander abgestimmt.',
      'Technische und rechtliche Rahmenbedingungen werden mitgeführt.',
      'Die Vorschau wird für deine Auswahl vorbereitet.'
    ];
    if(kind==='review')return [
      'Deine Angaben werden auf Lücken und Widersprüche geprüft.',
      'Nur Punkte mit echtem Einfluss auf das Ergebnis werden herausgefiltert.',
      'Datenschutz, Sicherheit, Barrierefreiheit und Performance werden mitgedacht.',
      'Die nächsten sinnvollen Schritte werden vorbereitet.'
    ];
    if(kind==='build')return [
      'Briefing, Referenzen und gewählte Richtung werden zusammengeführt.',
      'Struktur, Inhalte und technische Vorgaben werden umgesetzt.',
      'Dateien und wichtige Nutzerwege werden geprüft.',
      'Vorschau und Übergabe werden vorbereitet.'
    ];
    return [
      'Deine Angaben werden strukturiert verarbeitet.',
      'Wichtige Anforderungen werden zusammengeführt.',
      'Qualität, Sicherheit und Umsetzbarkeit werden geprüft.',
      'Das Ergebnis wird vorbereitet.'
    ];
  }

  function renderLines(host,lines,duration){
    if(!host)return null;let box=$('.prompt-process-lines',host);if(!box){box=document.createElement('div');box.className='prompt-process-lines';host.appendChild(box)}
    const sig=JSON.stringify(lines);if(box.dataset.signature!==sig){box.dataset.signature=sig;box.innerHTML='';const total=Math.max(2600,duration||4000),weights=lines.length===4?[.23,.26,.25,.26]:lines.map(()=>1/lines.length);let elapsed=0;lines.forEach((text,i)=>{const row=document.createElement('div');row.className='prompt-process-line';const d=Math.max(620,Math.round(total*(weights[i]||1/lines.length)));row.style.setProperty('--prompt-line-duration',`${d}ms`);row.style.setProperty('--prompt-line-delay',`${Math.round(elapsed)}ms`);row.innerHTML=`<span>${text}</span><span class="prompt-process-fill" aria-hidden="true">${text}</span>`;box.appendChild(row);elapsed+=d})}
    box.classList.remove('complete','running');void box.offsetWidth;box.classList.add('running');box.dataset.started='1';return box
  }
  function finishLines(host){const box=$('.prompt-process-lines',host);if(!box||box.dataset.started!=='1')return;box.classList.remove('running');box.classList.add('complete');box.dataset.started='0'}

  function flashCompletion(title,lines){
    if(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)return;
    let flash=$('#promptCompletionFlash');if(flash)flash.remove();flash=document.createElement('section');flash.id='promptCompletionFlash';flash.className='prompt-completion-flash';flash.setAttribute('aria-hidden','true');flash.innerHTML=`<div><span class="prompt-process-kicker">PROMPT.AI</span><strong class="prompt-process-title">${title}</strong><div class="prompt-process-lines complete"></div></div>`;document.body.appendChild(flash);const box=$('.prompt-process-lines',flash);for(const text of lines){const row=document.createElement('div');row.className='prompt-process-line';row.innerHTML=`<span>${text}</span><span class="prompt-process-fill" aria-hidden="true">${text}</span>`;box.appendChild(row)}setTimeout(()=>flash.remove(),520)
  }

  function inputLength(){return String($('#projectDescription')?.value||'').trim().length}
  function currentStep(){return Number($('.step-panel.active')?.dataset.stepPanel||0)}
  function workflowVisible(){return Boolean($('#workflowApp')&&!$('#workflowApp').hidden)}

  function ensureHandoff(){
    let simple=false;try{simple=sessionStorage.getItem(SIMPLE_START_KEY)==='1'}catch{}if(!simple||!workflowVisible())return;
    document.documentElement.classList.add('prompt-skip-intake-brief');
    let overlay=$('#promptBriefHandoff');if(!overlay){overlay=document.createElement('section');overlay.id='promptBriefHandoff';overlay.className='prompt-handoff-loader';overlay.setAttribute('aria-live','polite');overlay.innerHTML='<div><span class="prompt-process-kicker">PROMPT.AI</span><strong class="prompt-process-title">Beschreibung übernommen</strong></div>';document.body.appendChild(overlay);
      // Wie lange die Zeilen laufen, steht hier - und nur hier. renderLines rechnet mit
      // demselben Mindestwert, und das Ende unten wartet darauf, statt vorher abzubrechen.
      // Fest, nicht aus der Textlänge gerechnet: durationFor() geht bis 11 Sekunden, und
      // so lange stehenzubleiben ist kein Übergang mehr, sondern ein Hänger. Der Schritt
      // ist längst gewechselt - der Schirm zeigt nur noch, dass etwas übernommen wurde.
      const runFor=2800;
      overlay.dataset.startedAt=String(Date.now());overlay.dataset.runFor=String(runFor);
      renderLines(overlay,lineSet('briefing'),runFor);
    }
    const text=String($('#projectDescription')?.value||'').trim();
    if(currentStep()===1&&text.length>=20){const panel=$('#stepProject');if(panel?.dataset.promptV2Advance!=='1'){panel.dataset.promptV2Advance='1';setTimeout(()=>{if(currentStep()===1)$('#stepProject .next-btn')?.click()},50)}}
    // Der Schritt wechselt nach etwa 50 Millisekunden - der Ladeschirm verschwand deshalb,
    // bevor die erste Zeile überhaupt zu Ende gelaufen war. Er bleibt jetzt so lange stehen,
    // wie seine Zeilen brauchen, und schließt danach wie gehabt: fertigstellen, einmal
    // aufblinken, weg.
    if(currentStep()!==1&&currentStep()>0&&overlay.dataset.closing!=='1'){
      overlay.dataset.closing='1';
      const rest=Math.max(0,Number(overlay.dataset.startedAt||Date.now())+Number(overlay.dataset.runFor||2600)-Date.now());
      setTimeout(()=>{finishLines(overlay);setTimeout(()=>{flashCompletion('Briefing ist bereit',lineSet('briefing'));overlay?.remove();document.documentElement.classList.remove('prompt-skip-intake-brief');try{sessionStorage.removeItem(SIMPLE_START_KEY)}catch{}},420)},rest);
    }
  }

  function decorateFlowTransition(){
    const host=$('#flowTransitionCompact');if(!host?.classList.contains('show'))return;const strong=$('strong',host),kind=/Vorschau/i.test(strong?.textContent||'')?'preview':'review';const textLength=inputLength();if(host.dataset.promptProcessKind!==kind){host.dataset.promptProcessKind=kind;renderLines(host,lineSet(kind),durationFor(textLength))}
  }

  function enhanceProgress(id,kind){
    const host=$(id);if(!host)return;host.classList.add('prompt-process-enhanced');const visible=!host.hidden&&getComputedStyle(host).display!=='none';
    if(visible&&host.dataset.promptProcessVisible!=='1'){host.dataset.promptProcessVisible='1';renderLines(host,lineSet(kind),durationFor(inputLength()))}
    if(!visible&&host.dataset.promptProcessVisible==='1'){host.dataset.promptProcessVisible='0';finishLines(host);flashCompletion(kind==='build'?'Projekt ist bereit':kind==='preview'?'Vorschau ist bereit':'Prüfung abgeschlossen',lineSet(kind))}
  }

  function freePromptCompletion(){
    const stage=$('#promptAiThinkingStage'),status=$('#freePromptStatus');if(!stage)return;const done=Boolean(status?.classList.contains('good'));
    if(done&&stage.classList.contains('show')&&!stage.classList.contains('prompt-v2-complete')){stage.classList.add('prompt-v2-complete');setTimeout(()=>{flashCompletion('Prompt ist bereit',[
      'Deine Angaben wurden professionell formuliert.',
      'Die Regeln wurden auf den gewählten Bereich zugeschnitten.',
      'Sicherheit und relevante rechtliche Punkte wurden berücksichtigt.',
      'Der fertige Prompt kann direkt verwendet werden.'
    ]);stage.classList.remove('prompt-v2-complete')},180)}
  }

  function clarificationExit(event){
    const close=event.target.closest?.('#clarificationDialog .close-dialog');if(!close)return;
    event.preventDefault();event.stopImmediatePropagation();const dialog=$('#clarificationDialog');document.documentElement.classList.add('prompt-clarification-exit');try{sessionStorage.setItem(DISMISS_KEY,'1')}catch{}try{dialog?.close('cancel')}catch{dialog?.removeAttribute('open')}
    setTimeout(()=>{const nav=$('.step-nav[data-step="2"]');if(nav)nav.click();else $('#stepAgent .back-btn')?.click();document.documentElement.classList.remove('prompt-review-transition');setTimeout(()=>{document.documentElement.classList.remove('prompt-clarification-exit');try{sessionStorage.removeItem(DISMISS_KEY)}catch{}},500)},20)
  }
  function clarificationCancel(event){if(event.target?.id!=='clarificationDialog')return;event.preventDefault();const close=$('#clarificationDialog .close-dialog');if(close)clarificationExit({target:close,preventDefault(){},stopImmediatePropagation(){}})}

  function clarificationState(){
    const dialog=$('#clarificationDialog'),open=Boolean(dialog?.open);if(open&&!lastClarificationOpen){const flow=$('#flowTransitionCompact');if(flow){finishLines(flow);flashCompletion('Rückfragen sind bereit',lineSet('review'))}}lastClarificationOpen=open
  }

  function settle(){
    installStyles();ensureHandoff();decorateFlowTransition();enhanceProgress('#reviewProgress','review');enhanceProgress('#previewProgress','preview');enhanceProgress('#websiteBuildProgress','build');freePromptCompletion();clarificationState()
  }
  function schedule(){clearTimeout(settleTimer);settleTimer=setTimeout(settle,24)}
  function bind(){
    document.addEventListener('click',clarificationExit,true);document.addEventListener('cancel',clarificationCancel,true);
    new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','open','style']});
    window.addEventListener('pageshow',schedule);window.addEventListener('promptai:access',schedule)
  }
  window.PromptAiLoading={render(host,options={}){return renderLines(host,options.lines||lineSet(options.kind||'generic'),options.duration||durationFor(options.inputLength||0))},complete:finishLines,flash:flashCompletion,durationFor,lineSet};
  function init(){installStyles();bind();settle();let n=0;const timer=setInterval(()=>{settle();if(++n>30)clearInterval(timer)},160)}
  installStyles();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init()
})();
