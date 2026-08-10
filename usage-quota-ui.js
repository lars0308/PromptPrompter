(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const LIMITS={free:{free_prompts:10,website_generations:3,ai_previews:0},pro:{free_prompts:100,website_generations:25,ai_previews:50},ultimate:{free_prompts:500,website_generations:100,ai_previews:250}};
  const LABELS={free_prompts:'Freie Prompts',website_generations:'Website-Generierungen',ai_previews:'KI-Vorschauen'};
  const DESCRIPTIONS={free_prompts:'Neue freie Prompt-Ergebnisse',website_generations:'Neue Website-Richtungen / Projektgenerierungen',ai_previews:'KI-erzeugte Bildvorschauen'};
  const ORDER=['free_prompts','website_generations','ai_previews'];
  let cache=null,cacheAt=0,inFlight=null,websitePass=false,websitePending=false;

  const plan=()=>window.PromptAiAccess?.plan||cache?.plan||'free';
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const setHtml=(node,value)=>{if(node&&node.innerHTML!==value)node.innerHTML=value};
  const resetDate=value=>value?new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(value)):'zum nächsten Monatsanfang';
  const authHeaders=async()=>await window.SiteBriefCloud?.authHeaders?.()||{};

  function styles(){
    if($('#quotaUiStyles'))return;const s=document.createElement('style');s.id='quotaUiStyles';s.textContent=`
      .plan-quota-summary{display:block!important;margin-top:4px!important;color:var(--ui-blue,var(--accent))!important;font-size:8px!important;font-weight:800!important;letter-spacing:.01em!important;line-height:1.35!important;text-transform:none!important}.plan-quota-box{margin:14px 0;padding:13px 14px;border:1px solid var(--ui-line,var(--line));border-radius:12px;background:var(--ui-soft,var(--surface-soft))}.plan-quota-box>strong{display:block;margin-bottom:8px;font-size:10px;letter-spacing:.03em}.plan-quota-lines{display:grid;gap:6px}.plan-quota-line{display:flex;justify-content:space-between;gap:12px;color:var(--muted);font-size:9px;line-height:1.35}.plan-quota-line b{color:var(--ink);font-size:9px;text-align:right}.plan-quota-box>small{display:block;margin-top:9px;color:var(--muted);font-size:8px;line-height:1.4}
      .quota-account-mini{margin-top:10px;padding:12px 13px;border:1px solid var(--ui-line,var(--line));border-radius:12px;background:var(--ui-soft,var(--surface-soft))}.quota-mini-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:9px}.quota-mini-head strong{font-size:10px}.quota-mini-head small{color:var(--muted);font-size:8px}.quota-mini-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.quota-mini-item{padding:9px;border:1px solid var(--ui-line,var(--line));border-radius:9px;background:var(--ui-card,var(--surface))}.quota-mini-item span{display:block;color:var(--muted);font-size:7px;font-weight:800;letter-spacing:.05em;text-transform:uppercase}.quota-mini-item b{display:block;margin-top:4px;font-size:12px}.quota-mini-item small{display:block;margin-top:2px;color:var(--muted);font-size:7px}
      .sub-quota-section{margin-top:22px}.sub-quota-card{border:1px solid var(--ui-line,var(--line));border-radius:14px;overflow:hidden;background:var(--ui-card,var(--surface))}.sub-quota-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;padding:15px 16px;border-bottom:1px solid var(--ui-line,var(--line));align-items:center}.sub-quota-row:last-child{border-bottom:0}.sub-quota-copy strong{display:block;font-size:12px}.sub-quota-copy small{display:block;margin-top:3px;color:var(--muted);font-size:8px;line-height:1.35}.sub-quota-count{text-align:right}.sub-quota-count b{display:block;font-size:15px}.sub-quota-count small{display:block;margin-top:2px;color:var(--muted);font-size:8px}.sub-quota-track{grid-column:1/-1;height:4px;border-radius:99px;background:var(--ui-soft,var(--surface-soft));overflow:hidden}.sub-quota-track i{display:block;height:100%;background:var(--ui-blue,var(--accent));border-radius:inherit;transition:width .35s ease}.sub-quota-note{margin:9px 2px 0;color:var(--muted);font-size:8px;line-height:1.45}.sub-quota-note.warn{color:var(--warn)}
      @media(max-width:680px){.quota-mini-grid{grid-template-columns:1fr}.quota-mini-item{display:grid;grid-template-columns:1fr auto;align-items:center}.quota-mini-item b{margin:0}.quota-mini-item small{grid-column:1/-1}.sub-quota-row{padding:14px}.plan-quota-line{font-size:9px}}
    `;document.head.appendChild(s)}

  async function quotaApi(action,extra={}){
    const headers=await authHeaders(),r=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify({action,...extra})}),data=await r.json().catch(()=>({}));
    if(!r.ok)throw Object.assign(new Error(data.error||'Monatskontingent konnte nicht geladen werden.'),{status:r.status,data});return data;
  }
  function localSummary(){const p=plan(),limits=LIMITS[p]||LIMITS.free;return {plan:p,authenticated:Boolean(window.SiteBriefCloud?.user),available:false,isAdmin:Boolean(window.PromptAiAccess?.isAdmin),periodEnd:new Date(Date.UTC(new Date().getUTCFullYear(),new Date().getUTCMonth()+1,1)).toISOString(),metrics:Object.fromEntries(ORDER.map(k=>[k,{limit:limits[k],used:0,remaining:limits[k]}]))}}
  async function loadSummary(force=false){
    if(!force&&cache&&Date.now()-cacheAt<30000)return cache;if(inFlight)return inFlight;
    inFlight=quotaApi('quota-summary').then(data=>{cache=data;cacheAt=Date.now();renderAll();return data}).catch(()=>{if(!cache)cache=localSummary();renderAll();return cache}).finally(()=>{inFlight=null});return inFlight;
  }

  function quotaSummaryText(p){const q=LIMITS[p]||LIMITS.free;return `${q.free_prompts} Prompts · ${q.website_generations} Websites · ${q.ai_previews?`${q.ai_previews} KI-Vorschauen`:'KI-Vorschauen nicht enthalten'}`}
  function planQuotaHtml(p){
    const q=LIMITS[p]||LIMITS.free,ai=q.ai_previews?`${q.ai_previews} / Monat`:'Nicht enthalten';
    return `<strong>Monatskontingent</strong><div class="plan-quota-lines"><div class="plan-quota-line"><span>Freie Prompt-Generierungen</span><b>${q.free_prompts} / Monat</b></div><div class="plan-quota-line"><span>Website-Generierungen</span><b>${q.website_generations} / Monat</b></div><div class="plan-quota-line"><span>KI-Vorschauen</span><b>${ai}</b></div></div><small>Gespeicherte Projekte und vorhandene Ergebnisse bleiben erhalten. Das Kontingent startet jeden Monat neu.</small>`;
  }
  function syncPlanCards(){
    for(const p of ['free','pro','ultimate']){
      const card=$(`[data-plan-card="${p}"]`),detail=card?.querySelector('.plan-card-detail'),summaryCopy=card?.querySelector('.plan-card-summary>span');if(!detail)continue;
      if(summaryCopy){let short=summaryCopy.querySelector('.plan-quota-summary');if(!short){short=document.createElement('small');short.className='plan-quota-summary';summaryCopy.appendChild(short)}short.textContent=quotaSummaryText(p)}
      let box=detail.querySelector('.plan-quota-box');if(!box){box=document.createElement('section');box.className='plan-quota-box';const button=detail.querySelector('#startFreeBtn,#startProCheckoutBtn,#startUltimateCheckoutBtn');button?detail.insertBefore(box,button):detail.appendChild(box)}setHtml(box,planQuotaHtml(p));
    }
  }

  function metricHtml(key,item,summary,compact=false){
    const limit=Number(item?.limit??0),used=Number(item?.used??0),remaining=Math.max(0,Number(item?.remaining??limit-used)),pct=limit>0?Math.min(100,Math.round(used/limit*100)):100;
    if(compact)return `<div class="quota-mini-item"><span>${esc(LABELS[key])}</span><b>${limit===0?'—':`${remaining}/${limit}`}</b><small>${limit===0?'Nicht enthalten':`${used} genutzt`}</small></div>`;
    return `<div class="sub-quota-row"><div class="sub-quota-copy"><strong>${esc(LABELS[key])}</strong><small>${esc(DESCRIPTIONS[key])}</small></div><div class="sub-quota-count"><b>${limit===0?'Nicht enthalten':`${remaining} / ${limit} übrig`}</b><small>${limit===0?'In diesem Tarif nicht enthalten':`${used} genutzt`}</small></div>${limit>0?`<div class="sub-quota-track" aria-hidden="true"><i style="width:${pct}%"></i></div>`:''}</div>`;
  }
  function accountSummaryHtml(summary){
    const reset=resetDate(summary.periodEnd);return `<div class="quota-mini-head"><strong>Monatskontingent</strong><small>Reset ${esc(reset)}</small></div><div class="quota-mini-grid">${ORDER.map(k=>metricHtml(k,summary.metrics?.[k],summary,true)).join('')}</div>`;
  }
  function syncAccount(){
    const host=$('.plan-overview');if(!host)return;let box=$('#quotaAccountMini',host);if(!box){box=document.createElement('div');box.id='quotaAccountMini';box.className='quota-account-mini';host.appendChild(box)}const summary=cache||localSummary();setHtml(box,accountSummaryHtml(summary));
  }
  function syncSubscription(){
    const body=$('#subscriptionOverviewBody');if(!body||!body.childElementCount)return;let section=$('#subscriptionQuotaSection',body);if(!section){section=document.createElement('section');section.id='subscriptionQuotaSection';section.className='sub-quota-section';const after=body.querySelector('.sub-trial')||body.querySelector('.sub-hero');if(after)after.insertAdjacentElement('afterend',section);else body.prepend(section)}
    const summary=cache||localSummary(),reset=resetDate(summary.periodEnd),admin=summary.isAdmin?' Dein Administratorkonto wird zum Testen nicht gesperrt.':'';
    const html=`<div class="sub-section-head"><div><span>KI-NUTZUNG DIESEN MONAT</span><h4>Dein verbleibendes Kontingent</h4></div><small>Reset ${esc(reset)}</small></div><div class="sub-quota-card">${ORDER.map(k=>metricHtml(k,summary.metrics?.[k],summary,false)).join('')}</div><p class="sub-quota-note${summary.available===false?' warn':''}">${summary.authenticated===false?'Melde dich an, damit Prompt.ai dein Monatskontingent kontenübergreifend zählen kann.':summary.available===false?'Der Live-Zähler ist gerade nicht erreichbar. Deine Funktionen bleiben verfügbar.':`Am ${esc(reset)} werden die Zähler automatisch auf dein volles Monatskontingent zurückgesetzt.${admin}`}</p>`;
    setHtml(section,html);
  }
  function renderAll(){syncPlanCards();syncAccount();syncSubscription()}

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
  function init(){styles();syncPlanCards();syncAccount();patchFetch();bindWebsiteQuota();observe();setTimeout(()=>loadSummary(false),350)}
  styles();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
