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
  // Das × traegt weiter die id aus transition-polish.js: flow-guards-ui.js haengt seine
  // Sicherheitsfrage daran, und die soll beim Zusammenlegen nicht verloren gehen.
  // Die Marke traegt den blauen Strich, der einmal an der Innenkante des Buchstabens
  // entlanglaeuft - dieselbe Datei wie auf dem Startschirm, die Animation ist in der SVG selbst
  // eingebaut und braucht kein eigenes CSS. Wird auf jedem Ladeschirm gezeigt, klein genug, um
  // nicht wieder das grosse Logo zu sein, das vorher als Startbild-Splash gemeldet wurde - das lag
  // am maskable-Symbol im Manifest, nicht an dieser Marke.
  const LOADER_MARKUP='<button type="button" id="promptWorkflowLoaderClose" aria-label="Abbrechen">×</button>'
    +'<div>'
    +'<img class="prompt-loader-mark" src="./sitebrief-logo-trace.svg?v=7" alt="" aria-hidden="true">'
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
    clearTimeout(Number(host.dataset.recover||0));host.dataset.recover='0';
  }
  // Haengt eine Anfrage, stand der Schirm bisher bis zum Notausstieg und verschwand dann wortlos -
  // der Nutzer sass auf einer leeren Seite und wusste nicht, was passiert war. Nach eineinhalb
  // Minuten sagt der Schirm deshalb an Ort und Stelle, dass es laenger dauert, und zeigt den Weg
  // hinaus. Er navigiert dabei nichts von selbst weg: das × bleibt die Entscheidung des Nutzers.
  const LOADER_TIMEOUT_MS=95000;
  function forceRecover(host){
    if(!host?.isConnected)return;
    clearInterval(Number(host.dataset.cycle||0));host.dataset.cycle='0';
    cancelAnimationFrame(Number(host.dataset.raf||0));host.dataset.raf='0';
    const pulse=$('.prompt-loader-pulse',host);if(pulse)pulse.hidden=true;
    const kicker=$('.kicker',host);if(kicker)kicker.textContent='ZEITÜBERSCHREITUNG';
    const strong=$('strong',host);
    if(strong){strong.dataset.fillText='';strong.textContent='Das dauert länger als erwartet';window.PromptAiFill?.words?.(strong,1)}
    screenSentence(host,'Tippe oben rechts auf ×, um zurückzukehren und es erneut zu versuchen. Dein Projekt bleibt dabei erhalten.',true);
  }
  function armRecover(host){
    clearTimeout(Number(host.dataset.recover||0));
    host.dataset.recover=String(setTimeout(()=>forceRecover(host),LOADER_TIMEOUT_MS));
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
      startSentences(host,lineSet(kind));startFill(host);armRecover(host);
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
  // Der Weg hat drei Wartezeiten, und der Nutzer soll genau drei Schirme sehen:
  //
  //   Beschreibung + Enter  ->  TITEL_BRIEFING   ->  Rueckfragen
  //   Antworten + Enter     ->  TITEL_VORSCHAU   ->  Vorschaubilder
  //   Vorschau gewaehlt     ->  TITEL_PROMPT     ->  Master-Prompt
  //
  // Uebernahme, Einordnung und Pruefung sind drei Anfragen, aber eine Wartezeit - sie tragen
  // deshalb denselben Titel. Loest eine ab, wechselt die Ueberschrift nicht, und der Schirm
  // steht durch, statt zwischendurch abzublenden und neu aufzuziehen.
  const TITEL_BRIEFING='Rückfragen werden erstellt';
  const TITEL_VORSCHAU='Briefing wird verarbeitet';
  // Der Vorschaulauf ist eine Anfrage, aber zwei erkennbare Abschnitte: erst wird das Briefing
  // verarbeitet, dann entstehen die Bilder. app.js meldet den Wechsel selbst, sobald das erste
  // Bild losgeht - dann springt die Ueberschrift um, statt bis zum Schluss dasselbe zu behaupten.
  const TITEL_BILDER='Vorschaubilder werden erstellt';
  const TITEL_PROMPT='Dein Master-Prompt entsteht';
  const AI_TASKS={
    intake:{title:TITEL_BRIEFING,kind:'briefing'},
    review:{title:TITEL_BRIEFING,kind:'review'},
    concepts:{title:TITEL_VORSCHAU,kind:'preview'},
    'master-prompt':{title:TITEL_PROMPT,kind:'build'},
    website:{title:'Dein Projekt wird gebaut',kind:'build'},
    // Frueher hatte der freie Prompt zwei eigene Arbeitsanzeigen - eine im Fragebogen, eine im
    // Ergebnisfenster. Jetzt ist es derselbe Schirm wie bei jeder anderen KI-Wartezeit.
    'free-prompt':{title:'Dein Prompt entsteht',kind:'freeprompt'}
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
    // Der Schirm wird hier nicht mehr weggeraeumt: nach 95 Sekunden sagt er selbst, dass es
    // laenger dauert, und bietet das × an. Ein Schirm, der wortlos verschwindet, laesst den
    // Nutzer auf einer leeren Seite zurueck, ohne zu wissen, was passiert ist.
    aiWatchdog=setTimeout(()=>{aiWaits=0;const host=$('#promptAiTaskLoader');if(host)forceRecover(host)},180000);
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

  // Die Übergabe von der Startseite in den Ablauf. Sie hatte einen eigenen Schirm
  // (#promptBriefHandoff) - eigenes Element, eigener Titel, eigener Abgang. Direkt danach ging
  // die erste Anfrage raus und zog den naechsten auf: zwei Ladebilder fuer den Weg von Enter bis
  // zu den Rueckfragen. Jetzt ist die Uebernahme eine Arbeit wie jede andere auf demselben
  // Schirm, mit demselben Titel wie Einordnung und Pruefung. Es gibt nur noch ein Element.
  const HANDOFF_KEY='promptai-handoff';
  let handoffFertig=false;
  function ensureHandoff(){
    let simple=false;try{simple=sessionStorage.getItem(SIMPLE_START_KEY)==='1'}catch{}
    if(!simple||!workflowVisible())return;
    document.documentElement.classList.add('prompt-skip-intake-brief');
    if(!handoffFertig&&!laufende.some(x=>x.key===HANDOFF_KEY)){
      beginTask(HANDOFF_KEY,{title:TITEL_BRIEFING,kind:'briefing'});
      // Der Schirm steht - ab hier darf die Flaeche darunter wieder sichtbar werden, sie liegt
      // ohnehin dahinter. Ohne diese Zeile bliebe sie bis zum Notausstieg weg.
      document.documentElement.classList.remove('prompt-handoff-pending');
    }
    const text=String($('#projectDescription')?.value||'').trim();
    // "Selbst einstellen" laesst jeden Schritt stehen - auch den ersten. Dort haengen
    // Projektname, Projektart, Hauptziel, Zielgruppe und der besondere Wunsch, die die
    // Startseite gar nicht abfragt; wer darueber hinwegspringt, nimmt sie ersatzlos weg.
    if(currentStep()===1&&text.length>=20&&flowMode()!=='expert'){const panel=$('#stepProject');if(panel?.dataset.promptV2Advance!=='1'){panel.dataset.promptV2Advance='1';setTimeout(()=>{if(currentStep()===1)$('#stepProject .next-btn')?.click()},50)}}
    // Sobald der Schritt gewechselt hat, ist die Uebernahme durch. Laeuft schon eine Anfrage,
    // bleibt der Schirm einfach stehen - endTask() gibt ihn nur frei, wenn nichts mehr laeuft.
    if(currentStep()!==1&&currentStep()>0&&!handoffFertig){
      handoffFertig=true;
      endTask(HANDOFF_KEY);
      document.documentElement.classList.remove('prompt-skip-intake-brief');
      try{sessionStorage.removeItem(SIMPLE_START_KEY)}catch{}
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

  // Der Abbruch lag in transition-polish.js, zusammen mit dem Schirm, den es dort gab. Da der
  // Schirm jetzt hier steht, steht der Abbruch auch hier: alles Laufende vergessen, Schirm weg,
  // zurueck zur Startseite. flow-guards-ui.js hat vorher schon gefragt, ob das gewollt ist.
  function abbrechen(event){
    const button=event.target.closest?.('#promptWorkflowLoaderClose');
    if(!button||button.dataset.confirmed!=='1')return;
    laufende.length=0;aiWaits=0;clearTimeout(aiWatchdog);
    const host=$('#promptAiTaskLoader');
    if(host){stopScreen(host);host.remove()}
    document.documentElement.classList.remove('prompt-workflow-loading','prompt-skip-intake-brief','prompt-handoff-pending');
    (document.querySelector('.guided-clean-exit')||$('#brandHome'))?.click();
  }

  // app.js meldet waehrend der Bilder, was gerade wirklich passiert ("Bild 2 von 3"). Diese Zeile
  // ist genauer als die wechselnden Saetze, also hat sie Vorrang - und der Balken zeigt dieselbe
  // Zahl, statt weiter nach der Uhr zu laufen.
  function bildstand(event){
    const host=$('#promptAiTaskLoader');if(!host)return;
    const text=String(event.detail?.text||''),ratio=event.detail?.ratio;
    // Sobald das erste Bild losgeht, ist der Abschnitt "Briefing verarbeiten" vorbei. Die
    // Ueberschrift springt dann um - und faengt fuer den neuen Abschnitt wieder bei null an,
    // sonst stuende sie beim Umspringen schon halb voll da.
    if(/^Bild\s/i.test(text)){
      const oben=laufende[laufende.length-1];
      if(oben&&oben.title!==TITEL_BILDER){
        oben.title=TITEL_BILDER;
        const strong=$('strong',host);
        if(strong){strong.dataset.fillText='';strong.textContent=TITEL_BILDER;window.PromptAiFill?.words?.(strong,0)}
      }
    }
    if(typeof ratio==='number'&&Number.isFinite(ratio)){
      cancelAnimationFrame(Number(host.dataset.raf||0));host.dataset.raf='0';
      applyFill(host,Math.max(.08,Math.min(.99,ratio)));
    }
    if(!text)return;
    clearInterval(Number(host.dataset.cycle||0));host.dataset.cycle='0';
    screenSentence(host,text);
  }

  function settle(){
    ensureHandoff()
  }
  // Gedrosselt mit hartem Deckel, nicht nur entprellt - und ohne die eigenen Schreibvorgaenge.
  //
  // Der Schirm schreibt jeden Frame einen Inline-Stil auf sich selbst (die Fuellung). Diese
  // Schreibvorgaenge erreichten den Beobachter auf dem Koerper und setzten die Entprellung
  // endlos zurueck: settle() lief nie, ensureHandoff() beendete die Uebernahme nie, und der
  // Schirm blieb stehen. Derselbe Fehler lag frueher in transition-polish.js; er waere beim
  // Zusammenlegen mit umgezogen. Deshalb beides: eigene Mutationen fliegen raus, und laenger
  // als MAX_SETTLE_MS darf sich der Lauf nie verschieben.
  const MAX_SETTLE_MS=400;
  let settleDeadline=0;
  const fromLoader=node=>{const el=node?.nodeType===1?node:node?.parentElement;return Boolean(el?.closest?.('#promptAiTaskLoader'))};
  function schedule(){
    const now=Date.now();
    if(!settleTimer)settleDeadline=now+MAX_SETTLE_MS;
    clearTimeout(settleTimer);
    settleTimer=setTimeout(()=>{settleTimer=0;settle()},Math.max(0,Math.min(24,settleDeadline-now)));
  }
  function bind(){
    document.addEventListener('click',clarificationExit,true);document.addEventListener('cancel',clarificationCancel,true);
    document.addEventListener('click',abbrechen,true);
    window.addEventListener('promptai:preview-stage',bildstand);
    new MutationObserver(records=>{if(records.some(record=>!fromLoader(record.target)))schedule()}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','open','style']});
    window.addEventListener('pageshow',schedule);window.addEventListener('promptai:access',schedule)
  }
  window.PromptAiLoading={beginTask,endTask,lineSet};
  function init(){wrapFetch();bind();settle();let n=0;const timer=setInterval(()=>{settle();if(++n>30)clearInterval(timer)},160)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init()
})();
