(()=>{
  'use strict';
  const START_KEY='prompt-ai-v1-simple-start';
  const PENDING_MODE_KEY='prompt-ai-new-project-mode-v2';
  const START_FLOW_VERSION='PROMPT_START_FLOW_V2';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  let lastStep=-1,autoPreviewStarted=false,initialAdvanceInFlight=false,blueprintSkipTimer=0;
  const setText=(node,value)=>{if(node&&node.textContent!==value)node.textContent=value};
  const setHtml=(node,value)=>{if(node&&node.innerHTML!==value)node.innerHTML=value};

  const mode=()=>$('.mode-switch button.active')?.dataset.mode||'guided';
  const step=()=>Number($('.step-panel.active')?.dataset.stepPanel||0);
  const clearSimpleStart=()=>{try{sessionStorage.removeItem(START_KEY)}catch{}};


  function wrapSimpleStart(){
    const api=window.PromptAiProjectStart;if(!api||api.__streamlined)return;
    const original=api.startFromBrief?.bind(api);if(typeof original==='function')api.startFromBrief=brief=>{try{sessionStorage.setItem(START_KEY,'1')}catch{}return original(brief)};
    api.__streamlined=true;
  }

  // Die Schritte 3 bis 5 bekamen hier eigene Arbeitskaesten in die Seite gesetzt - mit denselben
  // Texten, die auch der Ladeschirm zeigt. Der Ablauf laeuft ueber diese Schritte automatisch
  // hinweg, also blitzten die Kaesten hinter dem Schirm auf: derselbe Satz zweimal, an zwei
  // Orten. Der Schirm sagt es, die Seite dahinter muss es nicht wiederholen.
  function workingPanels(){
    const preview=$('#stepPreviews');if(preview&&!$('#streamlinePreviewNote')){const note=document.createElement('div');note.id='streamlinePreviewNote';note.className='streamline-preview-note';note.innerHTML='<strong>Auto bereitet die Vorschau selbst vor.</strong> Du bekommst trotzdem immer eine echte Vorschau zu sehen und entscheidest erst danach, ob sie übernommen wird.';const head=preview.querySelector('.preview-step-head');head?.insertAdjacentElement('afterend',note)}
  }

  function remember(el,key){if(el&&!el.dataset[key])el.dataset[key]=el.textContent}
  function restore(el,key){if(el?.dataset[key])setText(el,el.dataset[key])}

  function syncNav(){
    const m=mode(),items=$$('#stepNav .step-nav');for(const item of items){remember(item.querySelector('b'),'originalNumber');remember(item.querySelector('span'),'originalLabel')}
    if(m==='expert'){for(const item of items){restore(item.querySelector('b'),'originalNumber');restore(item.querySelector('span'),'originalLabel')}return}
    const mapping=m==='auto'?{1:['01','Beschreibung'],2:['02','Referenzen'],6:['03','Vorschau'],8:['04','Prompt']}:{1:['01','Beschreibung'],2:['02','Referenzen'],6:['03','Vorschau'],7:['04','Feinschliff'],8:['05','Prompt']};
    for(const item of items){const v=mapping[Number(item.dataset.step)];if(v){setText(item.querySelector('b'),v[0]);setText(item.querySelector('span'),v[1])}}
  }

  function syncCopy(){
    const m=mode(),expert=m==='expert',h2=$('#stepReferences h1'),h6=$('#stepPreviews h1'),h7=$('#stepRefine h1'),h8=$('#stepPrompt h1'),k6=$('#stepPreviews .section-kicker'),k7=$('#stepRefine .section-kicker'),k8=$('#stepPrompt .section-kicker'),next2=$('#stepReferences .next-btn'),back3=$('#stepAgent .back-btn'),back6=$('#stepPreviews .back-btn'),next6=$('#stepPreviews .next-btn'),generate=$('#generateConceptsBtn');
    for(const [el,key] of [[h2,'streamOriginal'],[h6,'streamOriginal'],[h7,'streamOriginal'],[h8,'streamOriginal'],[k6,'streamOriginal'],[k7,'streamOriginal'],[k8,'streamOriginal'],[next2,'streamOriginalHtml'],[back6,'streamOriginalHtml'],[next6,'streamOriginalHtml'],[generate,'streamOriginalHtml']])if(el&&!el.dataset[key])el.dataset[key]=key.endsWith('Html')?el.innerHTML:el.textContent;
    if(back3&&!back3.dataset.streamOriginalBack)back3.dataset.streamOriginalBack=back3.dataset.back;
    if(expert){for(const el of [h2,h6,h7,h8,k6,k7,k8])if(el?.dataset.streamOriginal)setText(el,el.dataset.streamOriginal);for(const el of [next2,back6,next6,generate])if(el?.dataset.streamOriginalHtml)setHtml(el,el.dataset.streamOriginalHtml);if(back3?.dataset.streamOriginalBack)back3.dataset.back=back3.dataset.streamOriginalBack;return}
    setText(h2,'Hast du Referenzen?');setText(h6,'So könnte deine Internetseite aussehen.');setText(k6,'03 — VORSCHAU');
    if(m==='guided'){setText(h7,'Noch etwas ändern?');setText(k7,'04 — FEINSCHLIFF');setText(h8,'Dein Master-Prompt.');setText(k8,'05 — MASTER-PROMPT')}else{setText(h8,'Dein Master-Prompt.');setText(k8,'04 — MASTER-PROMPT')}
    // Steps 2-5 are all auto-piloted in guided/auto mode now (references come in via the
    // console's plus button before the flow even starts), so the two real "back" targets
    // that remain both skip straight to step 1 instead of the now-unused step 2.
    setHtml(next2,'Weiter zur Vorschau <i>→</i>');
    if(back3&&back3.dataset.back!=='1')back3.dataset.back='1';
    setHtml(back6,'← Beschreibung');if(back6&&back6.dataset.back!=='1')back6.dataset.back='1';
    setHtml(next6,m==='auto'?'Diese Vorschau übernehmen <i>→</i>':'Auswahl verfeinern <i>→</i>');setText(generate,'Vorschau erstellen');
  }

  function maybeSkipInitial(){
    let started=false,intended='';try{started=sessionStorage.getItem(START_KEY)==='1';intended=sessionStorage.getItem(PENDING_MODE_KEY)||mode()}catch{}if(!started)return;
    if(intended==='expert'){clearSimpleStart();return}
    if(step()>=2){clearSimpleStart();initialAdvanceInFlight=false;return}
    const workflow=$('#workflowApp'),desc=$('#projectDescription'),next=$('#stepProject .next-btn');
    if(step()!==1||workflow?.hidden||!desc||desc.value.trim().length<12||!next||next.disabled||initialAdvanceInFlight)return;
    initialAdvanceInFlight=true;
    let tries=0;
    const advance=()=>{
      if(step()>=2){clearSimpleStart();initialAdvanceInFlight=false;return}
      const currentDesc=$('#projectDescription'),currentNext=$('#stepProject .next-btn');
      if(!currentDesc||currentDesc.value.trim().length<12||!currentNext||currentNext.disabled){tries++;if(tries<8)setTimeout(advance,220);else initialAdvanceInFlight=false;return}
      currentNext.click();tries++;
      if(tries<8)setTimeout(advance,260);else setTimeout(()=>{if(step()>=2)clearSimpleStart();initialAdvanceInFlight=false},320);
    };
    setTimeout(advance,120);
  }

  function skipHiddenWork(){
    const m=mode(),n=step();if(m==='expert')return;
    if(n!==5&&blueprintSkipTimer){clearTimeout(blueprintSkipTimer);blueprintSkipTimer=0}
    if(n===5){const next=$('#stepBlueprint .next-btn');if(next&&!next.disabled&&!blueprintSkipTimer)blueprintSkipTimer=setTimeout(()=>{blueprintSkipTimer=0;next.click()},170);return}
    if(m==='auto'&&n===6)ensureAutoPreview();
  }

  function ensureAutoPreview(){
    if(mode()!=='auto'||step()!==6)return;const cards=$$('#conceptGallery .concept-option'),button=$('#generateConceptsBtn'),progress=$('#previewProgress');
    if(cards.length){autoPreviewStarted=false;return}
    if(autoPreviewStarted)return;
    if(button&&!button.disabled&&(!progress||progress.hidden)){autoPreviewStarted=true;button.click();const started=Date.now(),reset=()=>{if(mode()!=='auto'||step()!==6){autoPreviewStarted=false;return}if($$('#conceptGallery .concept-option').length){autoPreviewStarted=false;return}if(Date.now()-started>120000){autoPreviewStarted=false;return}setTimeout(reset,400)};setTimeout(reset,400)}
  }

  function guardPreview(){
    document.addEventListener('click',e=>{
      const next=e.target.closest?.('#stepPreviews .next-btn');if(!next||mode()==='expert')return;
      if(mode()==='auto'&&!e.isTrusted){e.preventDefault();e.stopImmediatePropagation();return}
      if(!$$('#conceptGallery .concept-option').length){e.preventDefault();e.stopImmediatePropagation();setText($('#generationStatus'),'Erstelle zuerst eine Vorschau. Ohne Vorschau geht Prompt.ai nicht zum finalen Prompt weiter.');return}
    },true);
  }

  function onStep(){
    const n=step();syncNav();syncCopy();maybeSkipInitial();if(n===lastStep){if(n===5&&mode()!=='expert')skipHiddenWork();if(mode()==='auto'&&n===6)ensureAutoPreview();return}lastStep=n;skipHiddenWork();
  }

  function observe(){
    new MutationObserver(()=>{clearTimeout(observe._t);observe._t=setTimeout(onStep,40)}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','hidden','disabled']});
    const timer=setInterval(()=>{wrapSimpleStart();onStep()},120);setTimeout(()=>clearInterval(timer),9000);
    window.addEventListener('promptai:access',()=>setTimeout(onStep,0));window.addEventListener('pageshow',()=>setTimeout(onStep,0));
  }

  function init(){document.documentElement.dataset.promptStartFlow='2';window.PromptAiStartFlowVersion=START_FLOW_VERSION;wrapSimpleStart();workingPanels();guardPreview();onStep();observe()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
