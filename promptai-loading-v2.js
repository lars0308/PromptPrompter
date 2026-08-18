(()=>{
  'use strict';
  const $=(s,r=document)=>r?.querySelector?.(s)||null,$$=(s,r=document)=>r?.querySelectorAll?[...r.querySelectorAll(s)]:[];
  const SIMPLE_START_KEY='prompt-ai-v1-simple-start';
  const DISMISS_KEY='prompt-ai-clarification-dismissed-v2';
  let settleTimer=0,lastClarificationOpen=false;

  try{if(sessionStorage.getItem(SIMPLE_START_KEY)==='1')document.documentElement.classList.add('prompt-skip-intake-brief')}catch{}
  // Die Papierfläche über der Arbeitsfläche deckt nur die Lücke bis zum Briefing-Schirm. Kommt der
  // aus irgendeinem Grund nicht, darf sie nicht stehen bleiben - vier Sekunden sind großzügig
  // gerechnet und deutlich kürzer als der Notausstieg in theme-init.js.
  setTimeout(()=>document.documentElement.classList.remove('prompt-handoff-pending'),4000);


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
    // Der freie Prompt hatte diese vier Zeilen frueher in seiner eigenen Anzeige stehen; sie
    // ziehen mit um, damit der Ladeschirm dort weiter sagt, was gerade passiert.
    if(kind==='freeprompt')return [
      'Deine Beschreibung wird eingeordnet.',
      'Ausgabetyp und Ziel-KI werden berücksichtigt.',
      'Aufbau, Regeln und Beispiele werden gesetzt.',
      'Der fertige Prompt wird zusammengestellt.'
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

  function beginTask(key,{title='Prompt.ai arbeitet',kind='generic',inputLength=0}={}){
    let host=$('#promptAiTaskLoader');
    if(!host){
      host=document.createElement('section');host.id='promptAiTaskLoader';host.className='prompt-handoff-loader prompt-task-loader';host.setAttribute('aria-live','polite');host.setAttribute('aria-busy','true');host.innerHTML='<div><span class="prompt-process-kicker">PROMPT.AI</span><strong class="prompt-process-title"></strong></div>';document.body.appendChild(host)
    }
    host.dataset.taskKey=String(key||'generic');host.querySelector('.prompt-process-title').textContent=title;host.hidden=false;
    renderLines(host,lineSet(kind),durationFor(inputLength));return host
  }
  function endTask(key,{title='Verarbeitung abgeschlossen',kind='generic'}={}){
    const host=$('#promptAiTaskLoader');if(!host||host.dataset.taskKey!==String(key||'generic'))return;
    finishLines(host);host.setAttribute('aria-busy','false');setTimeout(()=>{if(host.dataset.taskKey!==String(key||'generic'))return;host.remove();flashCompletion(title,lineSet(kind))},420)
  }

  // "Jede Seite, auf der die KI etwas verarbeitet, bekommt den Ladeschirm - und zwar sofort nach
  // dem Weiter-Klicken, egal ob geführt oder Auto-Modus."
  //
  // Der Schirm hängt deshalb nicht mehr an einzelnen Aufrufstellen - es sind neun in vier
  // Dateien, und genau darum fehlte er mal hier, mal dort -, sondern an der Anfrage selbst:
  // läuft ein KI-Aufruf, steht der Schirm; ist der letzte durch, geht er weg. Früher als der
  // Aufruf kann er nicht kommen, denn der geht mit dem Klick raus. Das ist zugleich die Antwort
  // auf die 30 bis 40 Sekunden vor den Rückfragen, die vorher wie ein Hänger aussahen.
  //
  // Bewusst nicht in der Liste: 'intake' und 'revision-brief' (mode-flow-ui.js bzw. app.js
  // setzen dort schon selbst einen Schirm - zwei übereinander wären schlimmer als keiner),
  // 'sandbox-build' (eigener Schirm) und
  // die Kontingent-Abfragen, die niemanden warten lassen.
  const AI_TASKS={
    review:{title:'Deine Angaben werden geprüft',kind:'review',done:'Rückfragen sind bereit'},
    concepts:{title:'Die Richtungen werden entworfen',kind:'preview',done:'Vorschau ist bereit'},
    'master-prompt':{title:'Dein Master-Prompt entsteht',kind:'build',done:'Master-Prompt ist bereit'},
    website:{title:'Dein Projekt wird gebaut',kind:'build',done:'Projekt ist bereit'},
    // Frueher hatte der freie Prompt zwei eigene Arbeitsanzeigen - eine im Fragebogen, eine im
    // Ergebnisfenster. Jetzt ist es derselbe Schirm wie bei jeder anderen KI-Wartezeit.
    'free-prompt':{title:'Dein Prompt entsteht',kind:'freeprompt',done:'Prompt ist bereit'}
  };
  const WAIT_KEY='promptai-ai-wait';
  let aiWaits=0,aiWatchdog=0,aiTask=null;
  function aiTaskFor(input,init){
    try{
      const url=String(typeof input==='string'?input:input?.url||'');
      if(!/\/api\/(generate|models)(\?|$)/.test(url))return null;
      if(typeof init?.body!=='string')return null;
      return AI_TASKS[String(JSON.parse(init.body)?.action||'')]||null;
    }catch{return null}
  }
  function beginWait(task){
    aiTask=task;
    if(aiWaits++)return;
    beginTask(WAIT_KEY,{title:task.title,kind:task.kind,inputLength:inputLength()});
    // Bleibt eine Anfrage haengen, ohne je aufzuloesen, darf der Schirm nicht ewig stehen.
    // Die Aufrufe in app.js brechen selbst nach 60 bis 120 Sekunden ab; das hier ist das Netz
    // darunter.
    clearTimeout(aiWatchdog);
    aiWatchdog=setTimeout(()=>{aiWaits=0;$('#promptAiTaskLoader')?.remove()},180000);
  }
  function endWait(){
    if(aiWaits>0&&--aiWaits)return;
    aiWaits=0;clearTimeout(aiWatchdog);
    endTask(WAIT_KEY,{title:aiTask?.done||'Verarbeitung abgeschlossen',kind:aiTask?.kind||'generic'});
  }
  function wrapFetch(){
    const native=window.fetch;
    if(typeof native!=='function'||native.__promptAiWaitWrapped)return;
    const wrapped=async(input,init)=>{
      const task=aiTaskFor(input,init);
      if(!task)return native(input,init);
      beginWait(task);
      try{return await native(input,init)}finally{endWait()}
    };
    wrapped.__promptAiWaitWrapped=true;
    // Andere Ebenen haengen sich ebenfalls in fetch (usage-quota-ui.js zaehlt Kontingente mit);
    // deren Kennzeichen wird mitgenommen, damit sie sich nicht ein zweites Mal davorsetzen.
    if(native.__quotaWrapped)wrapped.__quotaWrapped=true;
    window.fetch=wrapped;
  }

  function inputLength(){return String($('#projectDescription')?.value||'').trim().length}
  function currentStep(){return Number($('.step-panel.active')?.dataset.stepPanel||0)}
  const flowMode=()=>$('.mode-switch button.active')?.dataset.mode||document.documentElement.dataset.promptMode||'guided';
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
      // Der Schirm steht - ab hier darf die Fläche darunter wieder sichtbar werden, sie liegt
      // ohnehin dahinter. Ohne diese Zeile bliebe sie bis zum Notausstieg nach neun Sekunden weg.
      document.documentElement.classList.remove('prompt-handoff-pending');
      renderLines(overlay,lineSet('briefing'),runFor);
    }
    const text=String($('#projectDescription')?.value||'').trim();
    // "Selbst einstellen" laesst jeden Schritt stehen - auch den ersten. Dort haengen
    // Projektname, Projektart, Hauptziel, Zielgruppe und der besondere Wunsch, die die
    // Startseite gar nicht abfragt; wer darueber hinwegspringt, nimmt sie ersatzlos weg.
    if(currentStep()===1&&text.length>=20&&flowMode()!=='expert'){const panel=$('#stepProject');if(panel?.dataset.promptV2Advance!=='1'){panel.dataset.promptV2Advance='1';setTimeout(()=>{if(currentStep()===1)$('#stepProject .next-btn')?.click()},50)}}
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

  // Das × führte auf Schritt 2 zurück - die Referenzen-Seite, die es im geführten Ablauf gar
  // nicht mehr gibt. Der Klick löste damit die automatische Weiterleitung aus, was aussah, als
  // lade die Seite neu. Wer die Rückfragen wegklickt, will heraus: zurück auf die Startseite.
  function goHomeFromClarification(){
    const exit=document.querySelector('.guided-clean-exit')||document.querySelector('#brandHome');
    if(exit){exit.click();return}
    const nav=$('.step-nav[data-step="2"]');if(nav)nav.click();else $('#stepAgent .back-btn')?.click();
  }
  function clarificationExit(event){
    const close=event.target.closest?.('#clarificationDialog .close-dialog');if(!close)return;
    event.preventDefault();event.stopImmediatePropagation();const dialog=$('#clarificationDialog');document.documentElement.classList.add('prompt-clarification-exit');try{sessionStorage.setItem(DISMISS_KEY,'1')}catch{}try{dialog?.close('cancel')}catch{dialog?.removeAttribute('open')}
    setTimeout(()=>{goHomeFromClarification();document.documentElement.classList.remove('prompt-review-transition');setTimeout(()=>{document.documentElement.classList.remove('prompt-clarification-exit');try{sessionStorage.removeItem(DISMISS_KEY)}catch{}},500)},20)
  }
  function clarificationCancel(event){if(event.target?.id!=='clarificationDialog')return;event.preventDefault();const close=$('#clarificationDialog .close-dialog');if(close)clarificationExit({target:close,preventDefault(){},stopImmediatePropagation(){}})}

  function clarificationState(){
    const dialog=$('#clarificationDialog'),open=Boolean(dialog?.open);if(open&&!lastClarificationOpen){const flow=$('#flowTransitionCompact');if(flow){finishLines(flow);flashCompletion('Rückfragen sind bereit',lineSet('review'))}}lastClarificationOpen=open
  }

  function settle(){
    ensureHandoff();decorateFlowTransition();enhanceProgress('#reviewProgress','review');enhanceProgress('#previewProgress','preview');enhanceProgress('#websiteBuildProgress','build');freePromptCompletion();clarificationState()
  }
  function schedule(){clearTimeout(settleTimer);settleTimer=setTimeout(settle,24)}
  function bind(){
    document.addEventListener('click',clarificationExit,true);document.addEventListener('cancel',clarificationCancel,true);
    new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','open','style']});
    window.addEventListener('pageshow',schedule);window.addEventListener('promptai:access',schedule)
  }
  window.PromptAiLoading={render(host,options={}){return renderLines(host,options.lines||lineSet(options.kind||'generic'),options.duration||durationFor(options.inputLength||0))},complete:finishLines,flash:flashCompletion,beginTask,endTask,durationFor,lineSet};
  function init(){wrapFetch();bind();settle();let n=0;const timer=setInterval(()=>{settle();if(++n>30)clearInterval(timer)},160)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init()
})();
