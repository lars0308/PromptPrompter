(()=>{
  'use strict';
  const INTAKE_KEY='prompt-ai-mode-intake-v1';
  const MANIFEST_MARK='## VERBINDLICHE NUTZEREINGABEN AUS PROMPT.AI';
  let intakeBusy=false,lastStep=0,autoTimer=0;
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];

  function currentMode(){return $('.mode-switch button.active')?.dataset.mode||'guided'}
  function currentStep(){return Number($('.step-panel.active')?.dataset.stepPanel||0)}
  function setStatus(title,text='',busy=false){const box=$('#modeFlowPanel');if(!box)return;box.hidden=currentMode()==='expert'||currentStep()===8;box.classList.toggle('busy',busy);box.querySelector('strong').textContent=title;box.querySelector('small').textContent=text}


  // Der Arbeitsweg-Hinweis und die Statuskarte gehoeren beide dieser Ebene; das Stylesheet dazu
  // steht seit dem Zusammenzug in promptai-ui-layers.css.
  function mount(){
    const desc=$('#modeDescription');if(desc&&!$('#modeRouteCard')){const card=document.createElement('div');card.id='modeRouteCard';card.className='mode-route-card';card.innerHTML='<b>ARBEITSWEG</b><div><strong></strong><small></small></div>';desc.insertAdjacentElement('afterend',card)}
    const workspace=$('#workflowApp .workspace');if(workspace&&!$('#modeFlowPanel')){const panel=document.createElement('div');panel.id='modeFlowPanel';panel.className='mode-flow-panel';panel.hidden=true;panel.innerHTML='<span>PROMPT.AI</span><strong>Projekt wird vorbereitet</strong><small></small>';workspace.prepend(panel)}
  }

  function syncMode(){
    const mode=currentMode();document.documentElement.dataset.promptMode=mode;
    const card=$('#modeRouteCard'),copy={
      guided:['Mit Rückfragen · KI-Interview','Du beschreibst das Projekt. Prompt.ai richtet die technischen Startwerte ein, stellt nur relevante Rückfragen und zeigt dir danach Blueprint, Richtungen und Feinschliff.'],
      auto:['Ohne Rückfragen · Briefing rein, Prompt raus','Du beschreibst das Projekt. Die KI wählt Startwerte, Regeln und Richtungsumfang; nur echte Blocker werden noch gefragt. Danach entsteht der Master-Prompt automatisch.'],
      expert:['Selbst einstellen · volle Kontrolle','Alle acht Schritte bleiben offen. Agent, Modell, Ausgabeziel, Module, Skills, Regler, Vorschauen und Feinschliff werden von dir bewusst bestimmt und wirken direkt auf den Master-Prompt.']
    }[mode];if(card){card.querySelector('strong').textContent=copy[0];card.querySelector('small').textContent=copy[1]}
    if(mode==='expert')$('#modeFlowPanel')?.setAttribute('hidden','');else $('#modeFlowPanel')?.removeAttribute('hidden');
    scheduleRoute();
  }

  function projectPayload(){return {name:$('#projectName')?.value.trim()||'',description:$('#projectDescription')?.value.trim()||'',type:$('#projectType')?.value||'',goal:$('#projectGoal')?.value||'',audience:$('#projectAudience')?.value.trim()||'',special:$('#projectSpecial')?.value.trim()||'',client:{name:$('#clientName')?.value.trim()||'',type:$('#clientType')?.value||'',website:$('#clientWebsite')?.value.trim()||'',contact:$('#clientContact')?.value.trim()||''}}}
  const options=select=>select?[...select.options].map(o=>o.value).filter(Boolean):[];
  async function authHeaders(){try{return await window.SiteBriefCloud?.authHeaders?.()||{}}catch{return {}}}
  function intakeSignature(){const p=projectPayload();return JSON.stringify([currentMode(),p.name,p.description,p.type,p.goal,p.audience,p.special,p.client])}
  function savedIntake(){try{return JSON.parse(sessionStorage.getItem(INTAKE_KEY)||'null')}catch{return null}}
  function storeIntake(data,signature){sessionStorage.setItem(INTAKE_KEY,JSON.stringify({signature,data,at:Date.now()}))}

  function setSelect(id,value){const el=$(id);if(!el||![...el.options].some(o=>o.value===value))return;el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))}
  function setRange(id,value){const el=$(id);if(!el)return;el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}))}
  function applyIntake(data){
    setSelect('#projectType',data.projectType);setSelect('#projectGoal',data.goal);
    if(data.audience&&!$('#projectAudience').value.trim()){$('#projectAudience').value=data.audience;$('#projectAudience').dispatchEvent(new Event('input',{bubbles:true}))}
    const agent=$(`#agentSelector [data-agent="${CSS.escape(data.targetAgent||'')}"]`);if(agent&&!agent.hidden)agent.click();
    const output=$(`#outputTargetSelector [data-output="${CSS.escape(data.outputTarget||'')}"]`);if(output&&!output.classList.contains('plan-locked'))output.click();
    setRange('#originality',data.originality);setRange('#antiSlop',data.antiSlop);setRange('#motion',data.motion);setRange('#density',data.density);setSelect('#conceptCount',String(data.conceptCount));
    if(['gateway','gemini'].includes(data.provider))setSelect('#generatorEngine',data.provider);
    const panel=$('#modeFlowPanel');if(panel&&data.decisions?.length)panel.querySelector('small').textContent=data.decisions.slice(0,4).join(' · ');
  }

  async function prepareIntake(){
    if(currentMode()==='expert'||intakeBusy||beimVerlassen())return null;const project=projectPayload();if(project.description.length<20)return null;
    const signature=intakeSignature(),cached=savedIntake();if(cached?.signature===signature){applyIntake(cached.data);return cached.data}
    intakeBusy=true;setStatus('KI analysiert dein Briefing','Projektart, Ziel, Agent, Ausgabe, Regler und Richtungsumfang werden aus deinen Angaben abgeleitet.',true);
    // Kein eigener Schirm mehr: die Anfrage geht als 'intake' raus und traegt damit denselben
    // Titel wie Uebernahme und Pruefung. "Briefing wird verstanden" war ein dritter Text fuer
    // dieselbe Wartezeit.
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
    try{
      const headers=await authHeaders(),agentOptions=$$('#agentSelector [data-agent]').filter(x=>!x.hidden).map(x=>x.dataset.agent),outputOptions=$$('#outputTargetSelector [data-output]').filter(x=>!x.classList.contains('plan-locked')).map(x=>x.dataset.output);
      const response=await fetch('/api/models',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify({action:'intake',project,typeOptions:options($('#projectType')),goalOptions:options($('#projectGoal')),agentOptions,outputOptions}),signal:controller.signal}),data=await response.json();if(!response.ok)throw new Error(data.error||'KI-Intake nicht verfügbar');
      applyIntake(data);storeIntake(data,signature);setStatus('Briefing verstanden',data.summary||'Die technischen Startwerte wurden automatisch gesetzt.',false);return data;
    }catch(error){const message=error?.name==='AbortError'?'KI-Intake hat zu lange gedauert und wurde abgebrochen.':(error.message||'KI-Intake war nicht erreichbar. Deine Eingaben bleiben vollständig erhalten.');setStatus('Automatik nutzt sichere Standardwerte',message,false);return null}
    finally{clearTimeout(timer);intakeBusy=false}
  }

  function activeNext(step){return $(`[data-step-panel="${step}"] .next-btn`)}
  // click() is a silent no-op here while the mode-handoff cover is up: it marks every other body
  // child visibility:hidden (#promptModeHandoff itself stays visible and does the actual
  // covering, via an opaque full-viewport background), and a button that isn't being rendered
  // never runs its click activation - even forcing the button's own visibility back to visible
  // doesn't help, the hidden ancestor still wins. Lifting the cover class only changes rendering
  // that's already fully hidden behind the still-opaque, still-on-top loading screen, so nothing
  // becomes visibly different - it just lets the auto-piloted steps actually advance underneath it.
  function fireClick(el){if(!el)return;document.documentElement.classList.remove('prompt-route-pending');el.click()}
  // Throttled, not debounced: other start-up scripts relabel every open <dialog> each time one is
  // built (promptai-full-app-design.js's labelDynamicDialogs), which fires this observer dozens of
  // times within a couple hundred milliseconds. A reset-on-every-call debounce never got a quiet
  // gap to actually run route() during that churn, so the auto-piloted steps (2-4, 6-7) could sit
  // there indefinitely instead of advancing. Scheduling once and ignoring calls until it fires
  // guarantees route() still runs within ~120ms of the first change in a burst.
  function scheduleRoute(){if(autoTimer)return;autoTimer=setTimeout(()=>{autoTimer=0;route()},120)}
  // Wer die Rueckfragen wegklickt, will heraus - nicht noch einmal von vorn. Der Ausstieg setzt
  // diese Klasse, und solange sie steht, faehrt die Automatik nichts Neues an. Ohne das lief
  // beim Abbrechen "Briefing wird verstanden" los, weil der Ablauf dabei ueber Schritt 3 kommt.
  const beimVerlassen=()=>document.documentElement.classList.contains('prompt-clarification-exit');

  async function route(){
    if(beimVerlassen())return;
    const mode=currentMode(),step=currentStep(),workflow=$('#workflowApp');if(!step||mode==='expert'||!workflow||workflow.hidden)return;
    if(step!==lastStep){lastStep=step;if(step===1)setStatus(mode==='auto'?'Beschreibe dein Projekt':'Erster Schritt: Projekt beschreiben',mode==='auto'?'Referenzen hängst du oben über das Plus an. Alles Weitere übernimmt Prompt.ai.':'Referenzen hängst du oben über das Plus an; technische Entscheidungen werden für dich vorbereitet.',false)}
    // Schritt 2 kommt hier nicht mehr an: goStep() in app.js faehrt die Referenzen-Seite ausserhalb
    // von "Selbst einstellen" gar nicht erst an, statt sie hier weiterzuklicken.
    if(step===3){
      await prepareIntake();setStatus(mode==='auto'?'Projekt wird automatisch geprüft':'KI prüft, ob noch etwas Wichtiges fehlt',mode==='auto'?'Nur bei einem echten Blocker unterbricht Prompt.ai den Ablauf.':'Falls eine Antwort das Ergebnis wirklich verändert, bekommst du eine konkrete Frage.',true);
      const next=activeNext(3);if(next&&!next.disabled)setTimeout(()=>fireClick(next),120);return;
    }
    if(step===4){
      setStatus('Passende Regeln werden ausgewählt','Module und Skills werden aus deinem Projektkontext vorbereitet.',true);fireClick($('#recommendModulesBtn'));const next=activeNext(4);if(next)setTimeout(()=>fireClick(next),180);return;
    }
    if(mode==='auto'&&step===6){setStatus('KI entwickelt die Richtungen','Sobald die Richtungen fertig sind, entscheidest du mit einem Klick, ob die Vorschau übernommen wird.',true);waitForConcepts();return}
    if(mode==='auto'&&step===7){setStatus('Master-Prompt wird zusammengesetzt','Die automatisch gewählte Richtung wird mit allen Eingaben und Regeln verbunden.',true);const next=activeNext(7);if(next)setTimeout(()=>fireClick(next),160);return}
    if(mode==='guided'&&step===6)setStatus('Wähle eine Richtung','Prompt.ai erzeugt die Richtungen. Du entscheidest nur noch, welche davon weitergeführt wird.',false);
    if(mode==='guided'&&step===7)setStatus('Gezielt nachschärfen','Nur wenn du möchtest: eine konkrete Änderung ergänzen. Danach entsteht der Master-Prompt.',false);
    if(step===8){appendInputManifest();const panel=$('#modeFlowPanel');if(panel&&!panel.hidden)panel.setAttribute('hidden','')}
  }

  function waitForConcepts(){
    const start=Date.now();const check=()=>{if(currentMode()!=='auto'||currentStep()!==6)return;const cards=$$('#conceptGallery .concept-option'),button=$('#generateConceptsBtn'),progress=$('#previewProgress');if(cards.length&&button&&!button.disabled&&(!progress||progress.hidden)){setStatus('Vorschau ist bereit','Prüfe die Richtung und übernimm sie mit einem Klick.',false);return}if(Date.now()-start<120000)setTimeout(check,450)};check();
  }

  function clarificationWatch(){
    const dialog=$('#clarificationDialog');if(!dialog)return;new MutationObserver(()=>{
      if(dialog.open&&currentMode()==='auto'){
        const required=dialog.querySelector('textarea[required]'),critical=dialog.querySelector('.clarification-warning.critical');
        if(!required&&!critical)setTimeout(()=>$('#deferClarificationsBtn')?.click(),100);
      }
      if(!dialog.open&&[3,4].includes(currentStep()))setTimeout(scheduleRoute,120);
    }).observe(dialog,{attributes:true,attributeFilter:['open']});
  }

  function appendInputManifest(){
    const textarea=$('#masterPrompt');if(!textarea||textarea.value.includes(MANIFEST_MARK))return;const activeAgent=$('#agentSelector [data-agent].active')?.dataset.agent||'',activeOutput=$('#outputTargetSelector [data-output].active')?.dataset.output||'',refs=$$('.reference-item').map(row=>({url:row.querySelector('small')?.textContent||'',gefällt:row.querySelector('.like-note')?.value||'',nichtÜbernehmen:row.querySelector('.dislike-note')?.value||''})),images=$$('.image-reference').map(row=>({datei:row.querySelector('.image-reference-head span')?.textContent||'',gefällt:row.querySelector('.like-note')?.value||'',nichtÜbernehmen:row.querySelector('.dislike-note')?.value||''}));const intake=savedIntake()?.data||null;
    const manifest={arbeitsweg:currentMode(),projekt:projectPayload(),zielAgent:activeAgent,generator:{engine:$('#generatorEngine')?.value||'',model:$('#generatorModel')?.value||''},ausgabeziel:activeOutput,vorschau:{format:$('#previewFormat')?.value||'',anzahl:$('#conceptCount')?.value||''},designregler:{originalitaet:$('#originality')?.value||'',kiLookVermeiden:$('#antiSlop')?.value||'',bewegung:$('#motion')?.value||'',informationsdichte:$('#density')?.value||''},referenzLinks:refs,referenzBilder:images,automatischAbgeleiteteStartwerte:intake?{zusammenfassung:intake.summary||'',entscheidungen:intake.decisions||[]}:null};
    textarea.value+=`\n\n${MANIFEST_MARK}\nDiese Werte stammen direkt aus Eingaben, Auswahlen und bestätigten Automatik-Entscheidungen des Nutzers. Sie sind bei widerspruchsfreier Auslegung verbindlich und dürfen nicht stillschweigend ignoriert werden.\n\n${JSON.stringify(manifest,null,2)}\n`;
    textarea.dispatchEvent(new Event('input',{bubbles:true}));
  }

  function observeSteps(){
    const root=$('#workflowApp');if(!root)return;new MutationObserver(()=>{const step=currentStep();if(step!==lastStep||step===8)scheduleRoute()}).observe(root,{subtree:true,attributes:true,attributeFilter:['class','hidden']});
  }
  function bindModes(){$$('.mode-switch button').forEach(button=>button.addEventListener('click',()=>setTimeout(syncMode,0)));const modeSwitch=$('.mode-switch');if(modeSwitch)new MutationObserver(syncMode).observe(modeSwitch,{subtree:true,attributes:true,attributeFilter:['class']})}
  function init(){mount();bindModes();clarificationWatch();observeSteps();syncMode();setTimeout(scheduleRoute,250)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
