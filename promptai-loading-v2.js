(()=>{
  'use strict';
  const $=(s,r=document)=>r?.querySelector?.(s)||null,$$=(s,r=document)=>r?.querySelectorAll?[...r.querySelectorAll(s)]:[];
  const SIMPLE_START_KEY='prompt-ai-v1-simple-start';
  const DISMISS_KEY='prompt-ai-clarification-dismissed-v2';
  let settleTimer=0;

  try{if(sessionStorage.getItem(SIMPLE_START_KEY)==='1')document.documentElement.classList.add('prompt-skip-intake-brief')}catch{}
  // Die Papierfläche über der Arbeitsfläche deckt nur die Lücke bis zum Briefing-Schirm. Kommt der
  // aus irgendeinem Grund nicht, darf sie nicht stehen bleiben - vier Sekunden sind großzügig
  // gerechnet und deutlich kürzer als der Notausstieg in theme-init.js.
  setTimeout(()=>document.documentElement.classList.remove('prompt-handoff-pending'),4000);


  // Wie lange der Schirm mindestens steht, steht in theme-init.js (PromptAiFill.minVisibleMs).
  // Wie lange er hoechstens steht, entscheidet die Anfrage selbst - hier wird nichts gestreckt.

  // Die Zeilen darunter sagen, was gerade im Hintergrund passiert. Sie wechseln, sie sind kein
  // Fortschrittsbalken: nichts davon behauptet, ein bestimmter Punkt sei schon erledigt.
  function lineSet(kind){
    if(kind==='briefing')return [
      'Beschreibung wird gelesen.',
      'Ziel und Angebot werden eingeordnet.',
      'Wichtige Anforderungen werden zusammengeführt.',
      'Offene Punkte werden von klaren Angaben getrennt.',
      'Datenschutz und rechtliche Grundlagen laufen mit.',
      'Der Arbeitsstand wird gesichert.'
    ];
    if(kind==='preview')return [
      'Angaben und Antworten werden zusammengeführt.',
      'Seitenstruktur wird abgeleitet.',
      'Farben und Typografie werden gesetzt.',
      'Bildsprache wird festgelegt.',
      'Technische Rahmenbedingungen werden mitgeführt.',
      'Die Vorschau wird vorbereitet.'
    ];
    if(kind==='review')return [
      'Angaben werden geprüft.',
      'Angehängte Quellen werden ausgewertet.',
      'Widersprüche werden gesucht.',
      'Nur Punkte mit echtem Einfluss bleiben uebrig.',
      'Pflichtangaben werden abgeglichen.',
      'Rückfragen werden vorbereitet.'
    ];
    if(kind==='freeprompt')return [
      'Beschreibung wird eingeordnet.',
      'Ausgabetyp und Ziel-KI werden berücksichtigt.',
      'Aufbau und Regeln werden gesetzt.',
      'Beispiele werden ergänzt.',
      'Der fertige Prompt wird zusammengestellt.'
    ];
    if(kind==='build')return [
      'Briefing und gewählte Richtung werden zusammengeführt.',
      'Struktur und Inhalte werden umgesetzt.',
      'Technische Vorgaben werden angewendet.',
      'Dateien und Nutzerwege werden geprüft.',
      'Vorschau und Übergabe werden vorbereitet.'
    ];
    return [
      'Angaben werden verarbeitet.',
      'Wichtige Anforderungen werden zusammengeführt.',
      'Qualität und Umsetzbarkeit werden geprüft.',
      'Das Ergebnis wird vorbereitet.'
    ];
  }

  /* ---------------------------------------------------------------------------
     Ein Aufbau fuer jeden Ladeschirm

     Bis hierher gab es drei verschiedene: einen mit blau durchlaufender
     Ueberschrift (#promptWorkflowLoader), einen zweiten in derselben Machart fuer
     die Übergabe (#promptModeHandoff) - und diesen hier, der stattdessen eine
     Liste zeigte, in der erledigte Zeilen blau stehen blieben. Der dritte faellt
     jetzt weg: dieselbe Marke, derselbe Kicker, dieselbe blau durchlaufende
     Ueberschrift, darunter eine wechselnde Zeile in normaler Schrift.

     Getaktet wird nichts geraten. Die Fuellung laeuft asymptotisch mit, solange
     die Anfrage laeuft, und springt auf 100 %, sobald sie zurueck ist. Nur wenn
     das schneller ging, als man lesen kann, bleibt der Schirm den gemeinsamen
     Mindestmoment stehen - danach blinkt er zweimal blau und geht.
     --------------------------------------------------------------------------- */
  const SENTENCE_MS=3240;
  const FLASH_COUNT=2;
  const FILL_TAU=15000;
  const LOADER_MARKUP='<div>'
    +'<span class="kicker">PROMPT.AI</span>'
    +'<strong></strong>'
    +'<div class="prompt-loader-sentence"></div>'
    +'<div class="prompt-loader-bar"><i></i></div>'
    +'<div class="prompt-loader-pulse" aria-hidden="true"><i></i><i></i><i></i></div>'
    +'</div>';

  const reduceMotion=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch{return false}};

  function screenSentence(host,text,immediate=false){
    const line=$('.prompt-loader-sentence',host);if(!line||line.textContent===text)return;
    const apply=()=>{line.textContent=text;line.classList.remove('is-changing')};
    if(immediate){apply();return}
    line.classList.add('is-changing');setTimeout(()=>{if(line.isConnected)apply()},160);
  }
  function startSentences(host,lines){
    clearInterval(Number(host.dataset.cycle||0));
    let index=0;screenSentence(host,lines[0],true);
    const timer=setInterval(()=>{
      if(!host.isConnected||host.classList.contains('is-complete')){clearInterval(timer);return}
      index=(index+1)%lines.length;screenSentence(host,lines[index]);
    },SENTENCE_MS);
    host.dataset.cycle=String(timer);
  }
  function applyFill(host,progress){
    const next=`${(progress*100).toFixed(1)}%`;
    if(host.style.getPropertyValue('--prompt-fill')!==next)host.style.setProperty('--prompt-fill',next);
    // Woerter statt Spalten: bei einer zweizeiligen Ueberschrift laeuft erst die erste Zeile voll.
    window.PromptAiFill?.words?.($('strong',host),progress);
  }
  function startFill(host){
    cancelAnimationFrame(Number(host.dataset.raf||0));
    if(reduceMotion()){applyFill(host,.94);return}
    const startedAt=performance.now();
    const tick=()=>{
      if(!host.isConnected||host.classList.contains('is-complete')){host.dataset.raf='0';return}
      const elapsed=performance.now()-startedAt;
      applyFill(host,Math.min(.94,.94*(1-Math.exp(-elapsed/FILL_TAU))));
      host.dataset.raf=String(requestAnimationFrame(tick));
    };
    host.dataset.raf=String(requestAnimationFrame(tick));
  }
  function stopScreen(host){
    clearInterval(Number(host.dataset.cycle||0));host.dataset.cycle='0';
    cancelAnimationFrame(Number(host.dataset.raf||0));host.dataset.raf='0';
  }
  // Fertig heisst: Ueberschrift voll, zweimal blau blinken, weg. Laenger als noetig steht der
  // Schirm nur, wenn die Arbeit schneller war als der gemeinsame Mindestmoment.
  // Der Rest des Wortes laeuft noch sichtbar voll, statt umzuspringen. Bei einer schnellen
  // Antwort ist das der einzige Moment, in dem man das Blau ueberhaupt laufen sieht.
  function rampToFull(host){
    const from=parseFloat(host.style.getPropertyValue('--prompt-fill'))||0;
    if(reduceMotion()||from>=99){applyFill(host,1);return}
    const startedAt=performance.now(),span=420;
    const tick=()=>{
      if(!host.isConnected)return;
      const t=Math.min(1,(performance.now()-startedAt)/span);
      applyFill(host,(from+(100-from)*t)/100);
      if(t<1)requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  function finishScreen(host,after){
    if(!host||host.dataset.closing==='1'){after?.();return}
    host.dataset.closing='1';stopScreen(host);rampToFull(host);
    const flash=window.PromptAiFill?.flashMs??420;
    const wait=window.PromptAiFill?.tail?.(Number(host.dataset.shownAt||0))??flash;
    host.style.setProperty('--prompt-flash-count',String(FLASH_COUNT));
    setTimeout(()=>host.classList.add('is-complete'),reduceMotion()?0:420);
    setTimeout(()=>{
      host.classList.add('is-leaving');
      setTimeout(()=>{host.remove();laufende.length=0;after?.()},250);
    },Math.max(wait,420+flash*FLASH_COUNT));
  }

  // Mehrere Arbeiten koennen sich ueberlappen: die Uebernahme laeuft noch, waehrend die erste
  // Anfrage schon raus ist, und der Master-Prompt wird erst zusammengesetzt und dann von der KI
  // ausgeschrieben. Frueher zog jede davon ihren eigenen Schirm auf - drei Ladebilder fuer einen
  // Vorgang. Jetzt teilen sie sich einen: die Liste haelt fest, was gerade laeuft, die Ueberschrift
  // gehoert der zuletzt begonnenen Arbeit, und weg ist der Schirm erst, wenn die Liste leer ist.
  const laufende=[];
  function renderTask(host){
    const oben=laufende[laufende.length-1];if(!oben)return;
    host.dataset.taskKey=oben.key;
    const strong=$('strong',host);
    if(strong.dataset.fillText!==oben.title){strong.textContent=oben.title;window.PromptAiFill?.words?.(strong,0);startSentences(host,lineSet(oben.kind))}
  }
  function beginTask(key,{title='Prompt.ai arbeitet',kind='generic'}={}){
    const id=String(key||'generic');
    const vorhanden=laufende.findIndex(x=>x.key===id);
    if(vorhanden>=0)laufende.splice(vorhanden,1);
    laufende.push({key:id,title,kind});
    let host=$('#promptAiTaskLoader');
    if(!host){
      host=document.createElement('section');host.id='promptAiTaskLoader';
      host.className='prompt-handoff-loader prompt-task-loader';
      host.setAttribute('aria-live','polite');host.setAttribute('aria-busy','true');
      host.innerHTML=LOADER_MARKUP;document.body.appendChild(host);
      host.dataset.shownAt=String(Date.now());
      startSentences(host,lineSet(kind));startFill(host);
    }
    host.setAttribute('aria-busy','true');
    host.dataset.closing='0';host.classList.remove('is-complete','is-leaving');
    host.style.removeProperty('--prompt-flash-count');
    renderTask(host);
    // Die Fuellung laeuft weiter, wenn sie schon laeuft - ein Abschnittswechsel setzt sie nicht
    // zurueck. Nur ein abgebrochener Abgang startet sie neu.
    if(host.dataset.raf==='0'||!host.dataset.raf)startFill(host);
    return host;
  }
  function endTask(key){
    const id=String(key||'generic');
    const index=laufende.findIndex(x=>x.key===id);
    if(index>=0)laufende.splice(index,1);
    const host=$('#promptAiTaskLoader');if(!host)return;
    if(laufende.length){renderTask(host);return}
    host.setAttribute('aria-busy','false');finishScreen(host);
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
    beginTask(WAIT_KEY,{title:task.title,kind:task.kind});
    // Bleibt eine Anfrage haengen, ohne je aufzuloesen, darf der Schirm nicht ewig stehen.
    // Die Aufrufe in app.js brechen selbst nach 60 bis 120 Sekunden ab; das hier ist das Netz
    // darunter.
    clearTimeout(aiWatchdog);
    aiWatchdog=setTimeout(()=>{aiWaits=0;laufende.length=0;$('#promptAiTaskLoader')?.remove()},180000);
  }
  function endWait(){
    if(aiWaits>0&&--aiWaits)return;
    aiWaits=0;clearTimeout(aiWatchdog);
    endTask(WAIT_KEY);
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

  function currentStep(){return Number($('.step-panel.active')?.dataset.stepPanel||0)}
  const flowMode=()=>$('.mode-switch button.active')?.dataset.mode||document.documentElement.dataset.promptMode||'guided';
  function workflowVisible(){return Boolean($('#workflowApp')&&!$('#workflowApp').hidden)}

  // Die Übergabe von der Startseite in den Ablauf. Frueher ein eigener Schirm mit Zeilenliste,
  // jetzt derselbe wie jeder andere - damit zwischen Startseite und erster Seite nicht zwei
  // verschiedene Ladebilder hintereinander stehen.
  function ensureHandoff(){
    let simple=false;try{simple=sessionStorage.getItem(SIMPLE_START_KEY)==='1'}catch{}
    if(!simple||!workflowVisible())return;
    document.documentElement.classList.add('prompt-skip-intake-brief');
    let overlay=$('#promptBriefHandoff');
    if(!overlay){
      overlay=document.createElement('section');overlay.id='promptBriefHandoff';
      overlay.className='prompt-handoff-loader';overlay.setAttribute('aria-live','polite');
      overlay.innerHTML=LOADER_MARKUP;document.body.appendChild(overlay);
      overlay.dataset.shownAt=String(Date.now());
      $('strong',overlay).textContent='Beschreibung wird übernommen';
      startSentences(overlay,lineSet('briefing'));startFill(overlay);
      // Der Schirm steht - ab hier darf die Flaeche darunter wieder sichtbar werden, sie liegt
      // ohnehin dahinter. Ohne diese Zeile bliebe sie bis zum Notausstieg weg.
      document.documentElement.classList.remove('prompt-handoff-pending');
    }
    const text=String($('#projectDescription')?.value||'').trim();
    // "Selbst einstellen" laesst jeden Schritt stehen - auch den ersten. Dort haengen
    // Projektname, Projektart, Hauptziel, Zielgruppe und der besondere Wunsch, die die
    // Startseite gar nicht abfragt; wer darueber hinwegspringt, nimmt sie ersatzlos weg.
    if(currentStep()===1&&text.length>=20&&flowMode()!=='expert'){const panel=$('#stepProject');if(panel?.dataset.promptV2Advance!=='1'){panel.dataset.promptV2Advance='1';setTimeout(()=>{if(currentStep()===1)$('#stepProject .next-btn')?.click()},50)}}
    // Sobald der Schritt gewechselt hat, ist die Übergabe durch. Der Schirm bleibt nur noch
    // den gemeinsamen Mindestmoment stehen, blinkt zweimal und geht.
    if(currentStep()!==1&&currentStep()>0&&overlay.dataset.closing!=='1'){
      finishScreen(overlay,()=>{
        document.documentElement.classList.remove('prompt-skip-intake-brief');
        try{sessionStorage.removeItem(SIMPLE_START_KEY)}catch{}
      });
    }
  }

  /* Frueher schrieb diese Datei zusaetzlich Zeilenlisten in vier weitere Fortschrittsflaechen
     (#flowTransitionCompact, #reviewProgress, #previewProgress, #websiteBuildProgress) und liess
     nach jedem Abschluss einen halben Moment lang einen zweiten Schirm ("... ist bereit")
     aufblitzen. Beides ist weg: pro Uebergang gibt es genau einen Ladeschirm, und der blinkt am
     Ende selbst. Die vier Flaechen liegen ohnehin hinter dem Vollbild-Schirm. */

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

  function settle(){
    ensureHandoff()
  }
  function schedule(){clearTimeout(settleTimer);settleTimer=setTimeout(settle,24)}
  function bind(){
    document.addEventListener('click',clarificationExit,true);document.addEventListener('cancel',clarificationCancel,true);
    new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','open','style']});
    window.addEventListener('pageshow',schedule);window.addEventListener('promptai:access',schedule)
  }
  window.PromptAiLoading={beginTask,endTask,lineSet};
  function init(){wrapFetch();bind();settle();let n=0;const timer=setInterval(()=>{settle();if(++n>30)clearInterval(timer)},160)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init()
})();
