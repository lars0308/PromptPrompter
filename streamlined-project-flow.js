(()=>{
  'use strict';
  const START_KEY='prompt-ai-v1-simple-start';
  const PENDING_MODE_KEY='prompt-ai-new-project-mode-v2';
  const START_FLOW_VERSION='PROMPT_START_FLOW_V2';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  let lastStep=-1,autoPreviewStarted=false,initialAdvanceInFlight=false;
  const setText=(node,value)=>{if(node&&node.textContent!==value)node.textContent=value};
  const setHtml=(node,value)=>{if(node&&node.innerHTML!==value)node.innerHTML=value};

  const mode=()=>$('.mode-switch button.active')?.dataset.mode||'guided';
  const step=()=>Number($('.step-panel.active')?.dataset.stepPanel||0);
  const clearSimpleStart=()=>{try{sessionStorage.removeItem(START_KEY)}catch{}};

  function styles(){
    if($('#streamlinedFlowStyles'))return;
    const s=document.createElement('style');s.id='streamlinedFlowStyles';s.textContent=`
      .project-mode-card[data-project-mode="guided"]{position:relative;border-color:color-mix(in srgb,#278bc2 58%,var(--line))!important;background:color-mix(in srgb,#278bc2 6%,var(--surface))!important}.project-mode-card[data-project-mode="guided"]:before{content:'EMPFOHLEN';position:absolute;right:12px;top:12px;font-size:7px;font-weight:900;letter-spacing:.11em;color:#124f7c}.project-mode-card[data-project-mode="auto"]:before{content:'PRO';position:absolute;right:12px;top:12px;font-size:7px;font-weight:900;letter-spacing:.11em;color:var(--upgrade,#e9781f)}.project-mode-card[data-project-mode="expert"]:before{content:'ULTIMATE';position:absolute;right:12px;top:12px;font-size:7px;font-weight:900;letter-spacing:.11em;color:var(--upgrade,#e9781f)}
      html[data-prompt-mode="guided"] .step-nav[data-step="3"],html[data-prompt-mode="guided"] .step-nav[data-step="4"],html[data-prompt-mode="guided"] .step-nav[data-step="5"],html[data-prompt-mode="auto"] .step-nav[data-step="3"],html[data-prompt-mode="auto"] .step-nav[data-step="4"],html[data-prompt-mode="auto"] .step-nav[data-step="5"],html[data-prompt-mode="auto"] .step-nav[data-step="7"]{display:none!important}
      html[data-prompt-mode="auto"] .step-nav[data-step="6"]{display:flex!important}
      html[data-prompt-mode="guided"] #stepBlueprint>*,html[data-prompt-mode="auto"] #stepBlueprint>*{visibility:hidden!important;pointer-events:none!important}
      html[data-prompt-mode="auto"] #stepPreviews>*{visibility:visible!important;pointer-events:auto!important}
      html[data-prompt-mode="auto"] #stepPreviews .preview-generation-controls{display:none!important}
      html[data-prompt-mode="auto"] #stepPreviews .step-actions .back-btn{display:inline-flex!important}
      .streamline-working{display:none!important;visibility:visible!important;pointer-events:none!important;min-height:300px;place-items:center;text-align:center;padding:42px 18px}.step-panel.active>.streamline-working{display:grid!important}.streamline-working-inner{width:min(430px,100%)}.streamline-working i{display:block;width:38px;height:38px;margin:0 auto 18px;border:2px solid var(--line);border-top-color:#278bc2;border-radius:50%;animation:streamlineSpin .85s linear infinite}.streamline-working span{display:block;color:#278bc2;font-size:9px;font-weight:900;letter-spacing:.13em}.streamline-working strong{display:block;margin-top:7px;font-size:clamp(22px,4vw,31px);letter-spacing:-.035em}.streamline-working small{display:block;margin-top:8px;color:var(--muted);font-size:11px;line-height:1.5}.streamline-working b{display:block;width:150px;height:3px;margin:22px auto 0;overflow:hidden;border-radius:99px;background:var(--line)}.streamline-working b:after{content:'';display:block;width:38%;height:100%;background:#278bc2;animation:streamlineTrack 1.15s ease-in-out infinite}@keyframes streamlineSpin{to{transform:rotate(360deg)}}@keyframes streamlineTrack{0%{transform:translateX(-120%)}100%{transform:translateX(320%)}}
      html[data-prompt-mode="guided"] #stepAgent>.streamline-working,html[data-prompt-mode="guided"] #stepModules>.streamline-working,html[data-prompt-mode="guided"] #stepBlueprint>.streamline-working,html[data-prompt-mode="auto"] #stepAgent>.streamline-working,html[data-prompt-mode="auto"] #stepModules>.streamline-working,html[data-prompt-mode="auto"] #stepBlueprint>.streamline-working{visibility:visible!important;pointer-events:none!important}
      .streamline-preview-note{display:none;margin:0 0 16px;padding:12px 14px;border:1px solid color-mix(in srgb,#278bc2 32%,var(--line));border-radius:13px;background:color-mix(in srgb,#278bc2 5%,var(--surface));color:var(--muted);font-size:11px;line-height:1.5}.streamline-preview-note strong{color:var(--ink)}html[data-prompt-mode="auto"] .streamline-preview-note{display:block}
      html:not([data-prompt-mode="expert"]) #stepPreviews .preview-step-head{gap:16px}html:not([data-prompt-mode="expert"]) #stepPreviews .preview-generation-controls{padding:12px;border:1px solid var(--line);border-radius:14px;background:var(--surface)}html[data-prompt-mode="guided"] #stepPreviews .preview-generation-controls{grid-template-columns:minmax(180px,1fr) 100px auto!important}
      @media(max-width:760px){.streamline-working{min-height:260px;padding:30px 14px}html[data-prompt-mode="guided"] #stepPreviews .preview-generation-controls{grid-template-columns:1fr 94px!important}html[data-prompt-mode="guided"] #stepPreviews #generateConceptsBtn{grid-column:1/-1;width:100%!important}}
    `;document.head.appendChild(s);
  }

  function wrapSimpleStart(){
    const api=window.PromptAiProjectStart;if(!api||api.__streamlined)return;
    const original=api.startFromBrief?.bind(api);if(typeof original==='function')api.startFromBrief=brief=>{try{sessionStorage.setItem(START_KEY,'1')}catch{}return original(brief)};
    api.__streamlined=true;
  }

  function workingPanels(){
    const copy={3:['Briefing wird verstanden','Prompt.ai liest deine Beschreibung und übernimmt Ort, Branche, Stil, Farben, Ziele und weitere konkrete Wünsche.'],4:['Passende Regeln werden gesetzt','Technik, Qualitätsregeln und sinnvolle Module werden im Hintergrund vorbereitet.'],5:['Vorschau wird vorbereitet','Deine Angaben und Referenzen werden zu einer klaren Gestaltungsrichtung zusammengeführt.']};
    for(const [n,[title,text]] of Object.entries(copy)){
      const panel=$(`[data-step-panel="${n}"]`);if(!panel||panel.querySelector('.streamline-working'))continue;
      const box=document.createElement('div');box.className='streamline-working';box.innerHTML=`<div class="streamline-working-inner"><i></i><span>PROMPT.AI</span><strong>${title}</strong><small>${text}</small><b></b></div>`;panel.appendChild(box);
    }
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
    const m=mode(),expert=m==='expert',h2=$('#stepReferences h1'),h6=$('#stepPreviews h1'),h7=$('#stepRefine h1'),h8=$('#stepPrompt h1'),k6=$('#stepPreviews .section-kicker'),k7=$('#stepRefine .section-kicker'),k8=$('#stepPrompt .section-kicker'),next2=$('#stepReferences .next-btn'),back6=$('#stepPreviews .back-btn'),next6=$('#stepPreviews .next-btn'),generate=$('#generateConceptsBtn');
    for(const [el,key] of [[h2,'streamOriginal'],[h6,'streamOriginal'],[h7,'streamOriginal'],[h8,'streamOriginal'],[k6,'streamOriginal'],[k7,'streamOriginal'],[k8,'streamOriginal'],[next2,'streamOriginalHtml'],[back6,'streamOriginalHtml'],[next6,'streamOriginalHtml'],[generate,'streamOriginalHtml']])if(el&&!el.dataset[key])el.dataset[key]=key.endsWith('Html')?el.innerHTML:el.textContent;
    if(expert){for(const el of [h2,h6,h7,h8,k6,k7,k8])if(el?.dataset.streamOriginal)setText(el,el.dataset.streamOriginal);for(const el of [next2,back6,next6,generate])if(el?.dataset.streamOriginalHtml)setHtml(el,el.dataset.streamOriginalHtml);return}
    setText(h2,'Hast du Referenzen?');setText(h6,'So könnte deine Internetseite aussehen.');setText(k6,'03 — VORSCHAU');
    if(m==='guided'){setText(h7,'Noch etwas ändern?');setText(k7,'04 — FEINSCHLIFF');setText(h8,'Dein Master-Prompt.');setText(k8,'05 — MASTER-PROMPT')}else{setText(h8,'Dein Master-Prompt.');setText(k8,'04 — MASTER-PROMPT')}
    setHtml(next2,'Weiter zur Vorschau <i>→</i>');setHtml(back6,'← Referenzen');if(back6&&back6.dataset.back!=='2')back6.dataset.back='2';setHtml(next6,m==='auto'?'Diese Vorschau übernehmen <i>→</i>':'Auswahl verfeinern <i>→</i>');setText(generate,'Vorschau erstellen');
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
    if(n===5){const next=$('#stepBlueprint .next-btn');if(next&&!next.disabled)setTimeout(()=>next.click(),170);return}
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

  function init(){document.documentElement.dataset.promptStartFlow='2';window.PromptAiStartFlowVersion=START_FLOW_VERSION;styles();wrapSimpleStart();workingPanels();guardPreview();onStep();observe()}
  styles();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
