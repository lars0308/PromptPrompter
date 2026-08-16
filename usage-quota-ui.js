(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const DEFAULT_LIMITS=window.PromptAiPlanDefaults?.all?.()||{free:{free_prompts:10,website_generations:3,ai_previews:0},pro:{free_prompts:100,website_generations:25,ai_previews:50},ultimate:{free_prompts:500,website_generations:100,ai_previews:250}};
  const LIMITS=new Proxy({},{get(_,plan){return window.SiteBriefCloud?.config?.quotaLimits?.[plan]||DEFAULT_LIMITS[plan]||DEFAULT_LIMITS.free}});
  const LABELS={free_prompts:'Freie Prompts',website_generations:'Website-Generierungen',ai_previews:'KI-Vorschauen'};
  const DESCRIPTIONS={free_prompts:'Neue freie Prompt-Ergebnisse',website_generations:'Neue Website-Richtungen / Projektgenerierungen',ai_previews:'KI-erzeugte Bildvorschauen'};
  const ORDER=['free_prompts','website_generations','ai_previews'];
  let cache=null,cacheAt=0,inFlight=null,websitePass=false,websitePending=false;

  const plan=()=>window.PromptAiAccess?.plan||cache?.plan||'free';
  // Der Stand wird woanders gebraucht (Startseite), soll aber nur an einer Stelle geholt
  // werden - deshalb ein Blick auf den Zwischenspeicher statt einer zweiten Abfrage.
  const emit=()=>{try{window.dispatchEvent(new CustomEvent('promptai:quota',{detail:cache}))}catch{}};
  window.PromptAiQuota={summary:()=>cache||null,limits:()=>LIMITS[plan()]||null,refresh:()=>loadSummary(true)};
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const setHtml=(node,value)=>{if(node&&node.innerHTML!==value)node.innerHTML=value};
  const resetDate=value=>value?new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(value)):'zum nächsten Monatsanfang';
  const authHeaders=async()=>await window.SiteBriefCloud?.authHeaders?.()||{};


  async function quotaApi(action,extra={}){
    const headers=await authHeaders(),r=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify({action,...extra})}),data=await r.json().catch(()=>({}));
    if(!r.ok)throw Object.assign(new Error(data.error||'Monatskontingent konnte nicht geladen werden.'),{status:r.status,data});return data;
  }
  function localSummary(){const p=plan(),limits=LIMITS[p]||LIMITS.free;return {plan:p,authenticated:Boolean(window.SiteBriefCloud?.user),available:false,isAdmin:Boolean(window.PromptAiAccess?.isAdmin),periodEnd:new Date(Date.UTC(new Date().getUTCFullYear(),new Date().getUTCMonth()+1,1)).toISOString(),metrics:Object.fromEntries(ORDER.map(k=>[k,{limit:limits[k],used:0,remaining:limits[k]}]))}}
  async function loadSummary(force=false){
    if(!force&&cache&&Date.now()-cacheAt<30000)return cache;if(inFlight)return inFlight;
    inFlight=quotaApi('quota-summary').then(data=>{cache=data;cacheAt=Date.now();renderAll();return data}).catch(()=>{if(!cache)cache=localSummary();renderAll();return cache}).finally(()=>{inFlight=null;emit()});return inFlight;
  }

  function quotaSummaryText(p){const q=LIMITS[p]||LIMITS.free;return `${q.free_prompts} Prompts · ${q.website_generations} Websites · ${q.ai_previews?`${q.ai_previews} KI-Vorschauen`:'KI-Vorschauen nicht enthalten'}`}
  function planQuotaHtml(p){
    const q=LIMITS[p]||LIMITS.free,ai=q.ai_previews?`${q.ai_previews} / Monat`:'Nicht enthalten';
    return `<strong>Monatskontingent</strong><div class="plan-quota-lines"><div class="plan-quota-line"><span>Freie Prompt-Generierungen</span><b>${q.free_prompts} / Monat</b></div><div class="plan-quota-line"><span>Website-Generierungen</span><b>${q.website_generations} / Monat</b></div><div class="plan-quota-line"><span>KI-Vorschauen</span><b>${ai}</b></div></div>`;
  }
  function syncPlanCards(){
    for(const p of ['free','pro','ultimate']){
      const card=$(`[data-plan-card="${p}"]`),detail=card?.querySelector('.plan-card-detail'),summaryCopy=card?.querySelector('.plan-card-summary>span');if(!detail)continue;
      if(summaryCopy){let short=summaryCopy.querySelector('.plan-quota-summary');if(!short){short=document.createElement('small');short.className='plan-quota-summary';summaryCopy.appendChild(short)}short.textContent=quotaSummaryText(p)}
      let box=detail.querySelector('.plan-quota-box');if(!box){box=document.createElement('section');box.className='plan-quota-box';const button=detail.querySelector('#startFreeBtn,#startProCheckoutBtn,#startUltimateCheckoutBtn');button?detail.insertBefore(box,button):detail.appendChild(box)}setHtml(box,planQuotaHtml(p));
    }
  }

  function metricHtml(key,item,summary){
    const limit=Number(item?.limit??0),used=Number(item?.used??0),remaining=Math.max(0,Number(item?.remaining??limit-used)),pct=limit>0?Math.min(100,Math.round(used/limit*100)):100;
    return `<div class="sub-quota-row"><div class="sub-quota-copy"><strong>${esc(LABELS[key])}</strong><small>${esc(DESCRIPTIONS[key])}</small></div><div class="sub-quota-count"><b>${limit===0?'Nicht enthalten':`${remaining} / ${limit} übrig`}</b><small>${limit===0?'In diesem Tarif nicht enthalten':`${used} genutzt`}</small></div>${limit>0?`<div class="sub-quota-track" aria-hidden="true"><i style="width:${pct}%"></i></div>`:''}</div>`;
  }
  function syncSubscription(){
    const body=$('#subscriptionOverviewBody');if(!body||!body.childElementCount)return;let section=$('#subscriptionQuotaSection',body);if(!section){section=document.createElement('section');section.id='subscriptionQuotaSection';section.className='sub-quota-section';const after=body.querySelector('.sub-trial')||body.querySelector('.sub-hero');if(after)after.insertAdjacentElement('afterend',section);else body.prepend(section)}
    const summary=cache||localSummary(),reset=resetDate(summary.periodEnd),admin=summary.isAdmin?' Dein Administratorkonto wird zum Testen nicht gesperrt.':'';
    const html=`<div class="sub-section-head"><div><span>KI-NUTZUNG DIESEN MONAT</span><h4>Dein verbleibendes Kontingent</h4></div><small>Reset ${esc(reset)}</small></div><div class="sub-quota-card">${ORDER.map(k=>metricHtml(k,summary.metrics?.[k],summary)).join('')}</div>${summary.tokens?.limit?`<p class="sub-quota-note${summary.tokens.exhausted?' warn':''}">${summary.tokens.exhausted?`Token-Kontingent aufgebraucht (${Number(summary.tokens.used).toLocaleString('de-DE')} von ${Number(summary.tokens.limit).toLocaleString('de-DE')}). Bis zum Reset arbeitet Prompt.ai mit der sparsameren KI.`:`Tokens diesen Monat: ${Number(summary.tokens.used).toLocaleString('de-DE')} von ${Number(summary.tokens.limit).toLocaleString('de-DE')}.`}</p>`:''}<p class="sub-quota-note${summary.available===false?' warn':''}">${summary.authenticated===false?'Melde dich an, damit Prompt.ai dein Monatskontingent kontenübergreifend zählen kann.':summary.available===false?'Der Live-Zähler ist gerade nicht erreichbar. Deine Funktionen bleiben verfügbar.':`Am ${esc(reset)} werden die Zähler automatisch auf dein volles Monatskontingent zurückgesetzt.${admin}`}</p>`;
    setHtml(section,html);
  }
  // Never silent: when the token budget is spent the app keeps working on the cheaper AI, and the
  // visitor is told so instead of wondering why the results got weaker.
  function syncSaverNotice(){
    const summary=cache,active=Boolean(summary?.tokens?.exhausted&&!summary?.isAdmin);
    const host=$('#workflowApp');
    let note=$('#promptSaverNotice');
    // The note lives inside the workflow, so it hides and shows with it. Removing it while the
    // workflow is temporarily hidden would drop it for good: the next render only runs on a DOM
    // change, and returning to the workflow is not necessarily one.
    if(!active||!host){note?.remove();return}
    if(!note){note=document.createElement('p');note.id='promptSaverNotice';note.className='prompt-saver-notice';host.prepend(note)}
    const text=`Sparmodus: Dein Token-Kontingent für diesen Monat ist aufgebraucht. Prompt.ai arbeitet weiter, aktuell mit der sparsameren KI. Am ${resetDate(summary?.tokens?.resetAt||summary?.periodEnd)} steht wieder das volle Kontingent bereit.`;
    if(note.textContent!==text)note.textContent=text;
  }
  // Ein Kontingent, das ohne Vorwarnung endet, endet immer im falschen Moment - mitten im Projekt
  // eines Kunden. Ab 15% Rest steht es im Arbeitsbereich, mit der Zahl und dem Datum des Resets.
  // Die Meldung geht nicht weg, solange es knapp ist: sie ist kein Hinweis, den man wegklickt,
  // sondern der Zustand des Kontos.
  const LOW_QUOTA_SHARE=0.15;
  function lowMetrics(summary){
    if(!summary||summary.isAdmin||summary.authenticated===false||summary.available===false)return [];
    return ORDER.map(key=>{
      const item=summary.metrics?.[key],limit=Number(item?.limit||0);
      if(limit<=0)return null;
      const remaining=Math.max(0,Number(item?.remaining??limit-Number(item?.used||0)));
      // Aufgebraucht meldet der Server beim Versuch selbst - hier geht es um das, was davor kommt.
      if(remaining<=0||remaining>Math.ceil(limit*LOW_QUOTA_SHARE))return null;
      return {key,remaining,limit};
    }).filter(Boolean);
  }
  function syncLowQuotaNotice(){
    const low=lowMetrics(cache),host=$('#workflowApp')||$('#welcomePage');
    let note=$('#promptLowQuotaNotice');
    if(!low.length||!host){note?.remove();return}
    if(!note){note=document.createElement('p');note.id='promptLowQuotaNotice';note.className='prompt-saver-notice prompt-low-quota';host.prepend(note)}
    const parts=low.map(item=>`${item.remaining} von ${item.limit} ${LABELS[item.key]}`).join(' · ');
    const text=`Dein Kontingent wird knapp: ${parts} übrig. Am ${resetDate(cache?.periodEnd)} startet es neu – vorher lässt es sich über die Tarife aufstocken.`;
    if(note.textContent!==text)note.textContent=text;
  }
  // Die 15-Prozent-Marke gab es schon, sie stand aber nur als Satz in der Seite: "wird knapp,
  // laesst sich ueber die Tarife aufstocken". Handeln konnte darauf niemand, ohne erst das
  // Tarif-Fenster zu suchen. Jetzt kommt das Angebot von selbst - einmal je Abrechnungszeitraum,
  // damit es nicht bei jedem Aufruf nervt, und nie ueber einem anderen offenen Fenster.
  const TOPUP_OFFER_KEY='prompt-ai-topup-offer-v1';
  function topUpPrice(){return window.PromptAiPrices?.topUp||'7,99 €'}
  function ensureTopUpDialog(){
    let dialog=$('#promptTopUpOffer');if(dialog)return dialog;
    dialog=document.createElement('dialog');
    dialog.id='promptTopUpOffer';dialog.className='prompt-topup-offer';
    dialog.setAttribute('aria-label','Monatsvorrat auffüllen');
    dialog.innerHTML='<form method="dialog" class="dialog-frame"><div class="topup-offer-body">'
      +'<span class="topup-offer-kicker">MONATSVORRAT</span>'
      +'<h2 id="promptTopUpTitle">Dein Kontingent wird knapp.</h2>'
      +'<p id="promptTopUpDetail"></p>'
      +'<p class="topup-offer-note">Einmalig, ohne Abo: 750.000 Einheiten zusätzlich für diesen Monat – genug für etwa 16 weitere Projektläufe. Gilt sofort und in jedem Tarif.</p>'
      +'<div class="topup-offer-actions"><button type="button" class="solid-btn" id="promptTopUpBuy"></button>'
      +'<button type="submit" class="outline-btn" id="promptTopUpLater">Später</button></div>'
      +'</div></form>';
    document.body.appendChild(dialog);
    // Der Kauf haengt am vorhandenen Knopf im Tarif-Fenster, damit hier keine zweite
    // Checkout-Logik entsteht, die auseinanderlaufen kann.
    $('#promptTopUpBuy',dialog).addEventListener('click',()=>{dialog.close();$('#buySingleReviewBtn')?.click()});
    return dialog;
  }
  function maybeOfferTopUp(){
    const low=lowMetrics(cache);
    if(!low.length||cache?.isAdmin||!window.SiteBriefCloud?.user)return;
    const period=String(cache?.periodEnd||'');if(!period)return;
    let seen='';try{seen=localStorage.getItem(TOPUP_OFFER_KEY)||''}catch{}
    if(seen===period)return;
    // Nicht ueber ein offenes Fenster legen - dann kommt das Angebot eben beim naechsten Durchlauf.
    if(document.querySelector('dialog[open]'))return;
    const dialog=ensureTopUpDialog();
    const parts=low.map(item=>`${item.remaining} von ${item.limit} ${LABELS[item.key]}`).join(' · ');
    $('#promptTopUpDetail',dialog).textContent=`Übrig sind ${parts}. Am ${resetDate(cache?.periodEnd)} startet dein Kontingent neu.`;
    $('#promptTopUpBuy',dialog).textContent=`Monatsvorrat auffüllen · ${topUpPrice()}`;
    try{localStorage.setItem(TOPUP_OFFER_KEY,period)}catch{}
    try{dialog.showModal()}catch{}
  }
  function renderAll(){syncPlanCards();syncSubscription();syncSaverNotice();syncLowQuotaNotice();maybeOfferTopUp()}

  function quotaMessage(metric,summary){const item=summary?.metrics?.[metric],reset=resetDate(summary?.periodEnd);return `Dein Monatskontingent für ${LABELS[metric]||'diese Funktion'} ist aufgebraucht. Am ${reset} wird es automatisch zurückgesetzt.${item?.limit?` Dein Tarif enthält ${item.limit} pro Monat.`:''}`}
  async function checkWebsite(){
    if(!window.SiteBriefCloud?.user)return {allowed:true,summary:cache||localSummary()};
    const current=cache&&Date.now()-cacheAt<30000?cache:await loadSummary(true),item=current?.metrics?.website_generations;
    if(current?.isAdmin)return {allowed:true,summary:current};
    if(item&&item.remaining<=0)return {allowed:false,summary:current};
    try{const checked=await quotaApi('quota-check',{metric:'website_generations'});cache=checked;cacheAt=Date.now();renderAll();return {allowed:true,summary:checked}}catch(error){if(error.data?.code==='MONTHLY_QUOTA_EXHAUSTED'){cache=error.data.quota||current;cacheAt=Date.now();renderAll();return {allowed:false,summary:cache}}return {allowed:true,summary:current}}
  }
  function showWebsiteLimit(summary){const status=$('#generationStatus');if(status){status.className='generation-status notice';status.textContent=quotaMessage('website_generations',summary)}else window.PromptAiDialog?.alert?.(quotaMessage('website_generations',summary),{title:'Monatskontingent erreicht'})}
  function watchWebsiteResult(beforeStatus,beforeHtml){
    const status=$('#generationStatus'),gallery=$('#conceptGallery'),started=Date.now();let done=false;
    const timer=setInterval(()=>{
      const text=String(status?.textContent||''),html=gallery?.innerHTML||'',changed=text!==beforeStatus||html!==beforeHtml,has=Boolean(gallery?.querySelector('.concept-option'));
      if(changed&&has&&/(erstellt|fertig|lokale Vorschauen|Richtungen)/i.test(text)){clearInterval(timer);if(done)return;done=true;setTimeout(()=>loadSummary(true),180);return}
      if(Date.now()-started>120000)clearInterval(timer);
    },180);
  }
  function bindWebsiteQuota(){
    document.addEventListener('click',async e=>{
      const btn=e.target.closest?.('#generateConceptsBtn');if(!btn)return;if(websitePass){websitePass=false;return}
      if(websitePending){e.preventDefault();e.stopImmediatePropagation();return}
      e.preventDefault();e.stopImmediatePropagation();websitePending=true;
      const beforeStatus=String($('#generationStatus')?.textContent||''),beforeHtml=$('#conceptGallery')?.innerHTML||'';
      try{const checked=await checkWebsite();if(!checked.allowed){showWebsiteLimit(checked.summary);return}watchWebsiteResult(beforeStatus,beforeHtml);websitePass=true;btn.click()}finally{websitePending=false}
    },true);
  }
  function patchFetch(){
    if(window.fetch.__quotaWrapped)return;const native=window.fetch.bind(window);
    const wrapped=async(input,init)=>{let action='';try{const url=typeof input==='string'?input:input?.url||'';if(String(url).includes('/api/generate')&&init?.body){const body=JSON.parse(init.body);action=String(body?.action||'')}}catch{}const response=await native(input,init);if(['free-prompt','preview-image','concepts'].includes(action)){setTimeout(()=>loadSummary(true),250)}return response};wrapped.__quotaWrapped=true;window.fetch=wrapped;
  }
  function observe(){
    new MutationObserver(()=>{clearTimeout(observe.t);observe.t=setTimeout(()=>{renderAll();if($('#subscriptionOverviewDialog[open]'))loadSummary(false)},60)}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open','hidden','class']});
    document.addEventListener('click',e=>{if(e.target.closest?.('#showPlansBtn,#upgradeBtn,#upgradeMenuBtn'))setTimeout(syncPlanCards,40);if(e.target.closest?.('#manageSubscriptionBtn'))setTimeout(()=>loadSummary(true),80)},true);
    window.addEventListener('promptai:access',()=>{cache=null;cacheAt=0;setTimeout(()=>loadSummary(true),100)});window.addEventListener('pageshow',()=>setTimeout(()=>loadSummary(false),120));
  }
  function init(){syncPlanCards();patchFetch();bindWebsiteQuota();observe();setTimeout(()=>loadSummary(false),350)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
