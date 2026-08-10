(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const statusLabel={trialing:'Testphase',active:'Aktiv',past_due:'Zahlung offen',canceled:'Gekündigt',unpaid:'Unbezahlt',incomplete:'Zahlung ausstehend',incomplete_expired:'Beendet',paused:'Pausiert',free:'Kostenlos'};
  const DAY=86400000;

  function styles(){
    if($('#subscriptionOverviewStyles'))return;
    const s=document.createElement('style');s.id='subscriptionOverviewStyles';s.textContent=`
      .subscription-overview-frame{width:min(920px,calc(100vw - 28px))!important}.subscription-overview-body{padding:22px;overflow:auto;max-height:calc(100dvh - 105px)}
      .sub-hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:20px;align-items:start;padding:22px;border:1px solid var(--ui-line,var(--line));border-radius:16px;background:var(--ui-soft,var(--surface-soft))}.sub-hero span{display:block;color:var(--ui-blue,var(--accent));font-size:9px;font-weight:850;letter-spacing:.1em}.sub-hero h3{margin:7px 0 5px;font-size:clamp(30px,6vw,48px);line-height:.95;letter-spacing:-.05em}.sub-hero p{margin:0;color:var(--muted);font-size:12px;line-height:1.5}.sub-state{padding:7px 10px;border:1px solid var(--ui-line,var(--line));border-radius:999px;background:var(--ui-card,var(--surface));font-size:9px;font-weight:850;white-space:nowrap}.sub-state.good{color:var(--good)}.sub-state.warn{color:var(--warn)}.sub-state.bad{color:var(--danger)}
      .sub-trial{margin-top:12px;padding:16px 18px;border:1px solid color-mix(in srgb,var(--ui-blue,var(--accent)) 38%,var(--ui-line,var(--line)));border-radius:14px;background:color-mix(in srgb,var(--ui-blue,var(--accent)) 7%,var(--ui-card,var(--surface)))}.sub-trial strong{display:block;font-size:18px}.sub-trial p{margin:5px 0 0;color:var(--muted);font-size:11px;line-height:1.5}
      .sub-section{margin-top:22px}.sub-section-head{display:flex;align-items:end;justify-content:space-between;gap:16px;margin-bottom:10px}.sub-section-head span{color:var(--ui-blue,var(--accent));font-size:9px;font-weight:850;letter-spacing:.1em}.sub-section-head h4{margin:5px 0 0;font-size:20px;letter-spacing:-.03em}.sub-section-head small{color:var(--muted);font-size:9px}
      .sub-facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));border:1px solid var(--ui-line,var(--line));border-radius:14px;overflow:hidden;background:var(--ui-card,var(--surface))}.sub-fact{min-height:88px;padding:15px 16px;border-bottom:1px solid var(--ui-line,var(--line))}.sub-fact:nth-child(odd){border-right:1px solid var(--ui-line,var(--line))}.sub-fact:nth-last-child(-n+2){border-bottom:0}.sub-fact span{display:block;color:var(--muted);font-size:8px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.sub-fact strong{display:block;margin-top:7px;font-size:14px;line-height:1.3}.sub-fact small{display:block;margin-top:4px;color:var(--muted);font-size:9px;line-height:1.4}
      .sub-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.sub-actions .danger-btn{min-height:46px;padding:0 17px;border:1px solid color-mix(in srgb,var(--danger) 48%,var(--ui-line,var(--line)));border-radius:9px;background:transparent;color:var(--danger);font-size:10px;font-weight:800}.sub-actions .danger-btn:hover{background:color-mix(in srgb,var(--danger) 8%,transparent)}
      .sub-addon{padding:16px;border:1px solid var(--ui-line,var(--line));border-radius:14px;background:var(--ui-card,var(--surface))}.sub-addon-top{display:flex;align-items:start;justify-content:space-between;gap:12px}.sub-addon strong{font-size:14px}.sub-addon p{margin:5px 0 0;color:var(--muted);font-size:10px;line-height:1.5}
      .sub-invoices{border:1px solid var(--ui-line,var(--line));border-radius:14px;overflow:hidden;background:var(--ui-card,var(--surface))}.sub-invoice{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:12px;align-items:center;padding:13px 15px;border-bottom:1px solid var(--ui-line,var(--line))}.sub-invoice:last-child{border-bottom:0}.sub-invoice strong,.sub-invoice small{display:block}.sub-invoice strong{font-size:11px}.sub-invoice small{margin-top:4px;color:var(--muted);font-size:8px}.sub-invoice b{font-size:11px;white-space:nowrap}.sub-invoice-links{display:flex;gap:7px}.sub-invoice a{color:var(--ui-blue,var(--accent));font-size:9px;font-weight:800;text-decoration:none}.sub-empty{padding:18px;color:var(--muted);font-size:10px}.sub-security{margin:16px 2px 0;color:var(--muted);font-size:9px;line-height:1.5}.sub-loading{padding:54px 20px;text-align:center}.sub-loading i{display:block;width:34px;height:34px;margin:0 auto 14px;border:3px solid var(--ui-line,var(--line));border-top-color:var(--ui-blue,var(--accent));border-radius:50%;animation:subSpin .8s linear infinite}.sub-loading strong{display:block}.sub-loading small{display:block;margin-top:6px;color:var(--muted)}@keyframes subSpin{to{transform:rotate(360deg)}}
      .sub-error{padding:26px;border:1px solid color-mix(in srgb,var(--danger) 30%,var(--ui-line,var(--line)));border-radius:14px;color:var(--danger);font-size:11px;line-height:1.5}.sub-free{padding:28px;border:1px solid var(--ui-line,var(--line));border-radius:14px;background:var(--ui-card,var(--surface))}.sub-free h3{margin:0 0 8px;font-size:26px}.sub-free p{margin:0 0 17px;color:var(--muted);font-size:11px;line-height:1.55}
      @media(max-width:680px){.subscription-overview-body{padding:16px}.sub-hero{grid-template-columns:1fr}.sub-state{justify-self:start}.sub-facts{grid-template-columns:1fr}.sub-fact,.sub-fact:nth-child(odd),.sub-fact:nth-last-child(-n+2){border-right:0;border-bottom:1px solid var(--ui-line,var(--line))}.sub-fact:last-child{border-bottom:0}.sub-invoice{grid-template-columns:1fr auto}.sub-invoice-links{grid-column:1/-1}.sub-actions>*{flex:1 1 100%}}
    `;document.head.appendChild(s);
  }

  function ensureDialog(){
    let d=$('#subscriptionOverviewDialog');if(d)return d;
    d=document.createElement('dialog');d.id='subscriptionOverviewDialog';d.className='library-dialog subscription-overview-dialog';d.innerHTML=`<div class="dialog-frame subscription-overview-frame"><header class="dialog-head"><div><span>ABO & ABRECHNUNG</span><h2>Abo verwalten</h2></div><button type="button" class="close-dialog" data-sub-close aria-label="Schließen">×</button></header><div class="subscription-overview-body" id="subscriptionOverviewBody"></div></div>`;
    document.body.appendChild(d);
    d.querySelector('[data-sub-close]').onclick=()=>d.close();
    d.addEventListener('cancel',e=>{e.preventDefault();d.close()});
    d.addEventListener('click',handleClick);
    return d;
  }

  async function api(payload){
    const headers=await window.SiteBriefCloud?.authHeaders?.()||{};
    const r=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(payload)}),data=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(data.error||'Abo-Daten konnten nicht geladen werden.');return data;
  }
  const date=value=>value?new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(value)):'–';
  const money=(cents,currency='eur')=>cents===null||cents===undefined?'–':new Intl.NumberFormat('de-DE',{style:'currency',currency:String(currency||'eur').toUpperCase()}).format(Number(cents)/100);
  function interval(price){if(!price?.interval)return'–';const n=Math.max(1,Number(price.intervalCount)||1),unit={day:['Tag','Tage'],week:['Woche','Wochen'],month:['Monat','Monate'],year:['Jahr','Jahre']}[price.interval]||[price.interval,price.interval];return n===1?`pro ${unit[0]}`:`alle ${n} ${unit[1]}`}
  function stateClass(status){return ['active','trialing'].includes(status)?'good':status==='past_due'?'warn':['canceled','unpaid','incomplete_expired'].includes(status)?'bad':''}
  function daysLeft(end){if(!end)return null;return Math.max(0,Math.ceil((new Date(end).getTime()-Date.now())/DAY))}
  function paymentText(payment){if(!payment)return'Bei Stripe hinterlegt';const suffix=payment.last4?` •••• ${payment.last4}`:'';if(payment.type==='card'){const brand=String(payment.brand||'Karte').replace(/^./,x=>x.toUpperCase()),exp=payment.expMonth&&payment.expYear?` · gültig bis ${String(payment.expMonth).padStart(2,'0')}/${payment.expYear}`:'';return `${brand}${suffix}${exp}`}return `${payment.brand||'Zahlungsmethode'}${suffix}`}
  function planName(plan){return plan==='ultimate'?'Ultimate':plan==='pro'?'Pro':'Free'}

  function facts(data,overview){
    const p=data?.price,status=data?.status||overview.status,trial=status==='trialing',cancelled=Boolean(data?.cancelAtPeriodEnd||data?.cancelAt),nextDate=cancelled?null:data?.nextChargeAt;
    const chargeTitle=trial?'Erste Abbuchung':'Nächste Abbuchung';
    const chargeValue=nextDate?date(nextDate):cancelled?'Keine weitere Abbuchung geplant':'–';
    const chargeSub=nextDate&&data?.nextChargeAmount!==null?money(data.nextChargeAmount,data.nextChargeCurrency):cancelled?`Zugang bis ${date(data.cancelAt||data.periodEnd)}`:'';
    const cancellation=cancelled?`Gekündigt zum ${date(data.cancelAt||data.periodEnd)}`:'Nicht gekündigt';
    return `<div class="sub-facts">
      <div class="sub-fact"><span>Tarif</span><strong>${esc(planName(overview.plan))}</strong><small>${p?`${esc(money(p.amount,p.currency))} ${esc(interval(p))}`:'Kostenlos'}</small></div>
      <div class="sub-fact"><span>Status</span><strong>${esc(statusLabel[status]||status||'–')}</strong><small>${trial&&data.trialEnd?`Testphase bis ${esc(date(data.trialEnd))}`:cancelled?'Läuft bis zum angezeigten Enddatum weiter.':'Zugriff entsprechend deinem Tarif.'}</small></div>
      <div class="sub-fact"><span>Preis</span><strong>${p?esc(money(p.amount,p.currency)):'0,00 €'}</strong><small>${p?esc(interval(p)):'Free-Tarif'}</small></div>
      <div class="sub-fact"><span>Abrechnungszeitraum</span><strong>${data?.periodStart&&data?.periodEnd?`${esc(date(data.periodStart))} – ${esc(date(data.periodEnd))}`:'–'}</strong><small>${data?.billingCycleAnchor?`Abrechnungsstichtag seit ${esc(date(data.billingCycleAnchor))}`:''}</small></div>
      <div class="sub-fact"><span>${esc(chargeTitle)}</span><strong>${esc(chargeValue)}</strong><small>${esc(chargeSub)}</small></div>
      <div class="sub-fact"><span>Zahlungsmethode</span><strong>${esc(paymentText(data?.paymentMethod))}</strong><small>Zahlungsdaten werden ausschließlich bei Stripe verwaltet.</small></div>
      <div class="sub-fact"><span>Kündigung</span><strong>${esc(cancellation)}</strong><small>${cancelled?'Danach wechselst du automatisch zu Free.':'Über diese Seite jederzeit verwaltbar.'}</small></div>
      <div class="sub-fact"><span>Beginn</span><strong>${esc(date(data?.created))}</strong><small>${data?.collectionMethod==='charge_automatically'?'Automatische Abbuchung':'Abrechnung über Stripe'}</small></div>
    </div>`;
  }

  function invoices(data){
    const list=data?.invoices||[];
    if(!list.length)return '<div class="sub-invoices"><div class="sub-empty">Noch keine Rechnungen vorhanden.</div></div>';
    return `<div class="sub-invoices">${list.map(inv=>`<article class="sub-invoice"><div><strong>${esc(inv.number||'Stripe-Rechnung')}</strong><small>${esc(date(inv.created))} · ${esc(inv.paid?'Bezahlt':statusLabel[inv.status]||inv.status||'Offen')}</small></div><b>${esc(money(inv.amountPaid||inv.amountDue,inv.currency))}</b><div class="sub-invoice-links">${inv.hostedUrl?`<a href="${esc(inv.hostedUrl)}" target="_blank" rel="noopener">Ansehen</a>`:''}${inv.pdfUrl?`<a href="${esc(inv.pdfUrl)}" target="_blank" rel="noopener">PDF</a>`:''}</div></article>`).join('')}</div>`;
  }

  function render(overview){
    const body=$('#subscriptionOverviewBody');
    if(overview.plan==='free'&&!overview.main){body.innerHTML=`<section class="sub-free"><h3>Du nutzt Prompt.ai Free.</h3><p>Es gibt keine laufende Abbuchung und keine Kündigungsfrist. Wenn du Pro oder Ultimate buchst, erscheinen hier Testphase, Preis, nächste Abbuchung, Zahlungsmethode und Rechnungen.</p><button type="button" class="solid-btn" data-sub-plans>Tarife ansehen</button></section>`;return;}
    const main=overview.main,status=main?.status||overview.status,trial=status==='trialing',remaining=trial?daysLeft(main?.trialEnd):null,cancelled=Boolean(main?.cancelAtPeriodEnd||main?.cancelAt),p=main?.price;
    body.innerHTML=`
      <section class="sub-hero"><div><span>DEIN ABO</span><h3>${esc(planName(overview.plan))}</h3><p>${p?`${esc(money(p.amount,p.currency))} ${esc(interval(p))}`:'Abrechnungsdaten werden geladen.'}</p></div><b class="sub-state ${stateClass(status)}">${esc(statusLabel[status]||status||'–')}</b></section>
      ${trial?`<section class="sub-trial"><strong>${remaining===0?'Deine Testphase endet heute.':`Noch ${remaining} ${remaining===1?'Tag':'Tage'} kostenlos`}</strong><p>Testphase bis ${esc(date(main.trialEnd))}. Danach ${p?`${esc(money(p.amount,p.currency))} ${esc(interval(p))}`:'der reguläre Pro-Preis'}. Die erste Abbuchung ist für ${esc(date(main.nextChargeAt||main.trialEnd))} vorgesehen.</p></section>`:''}
      <section class="sub-section"><div class="sub-section-head"><div><span>ABO-INFORMATIONEN</span><h4>Alles auf einen Blick</h4></div><small>Live aus Stripe</small></div>${facts(main,overview)}
        <div class="sub-actions">${overview.canChangePlan?`<button type="button" class="solid-btn" data-sub-portal="update">${overview.plan==='pro'?'Auf Ultimate wechseln / Tarif ändern':'Tarif ändern'}</button>`:''}<button type="button" class="outline-btn" data-sub-portal="payment">Zahlungsmethode & Rechnungsdaten</button><button type="button" class="outline-btn" data-sub-portal="general">Stripe-Kundenportal</button>${overview.canCancel?`<button type="button" class="danger-btn" data-sub-portal="cancel">${trial?'Testphase kündigen':'Abo kündigen'}</button>`:''}</div>
      </section>
      ${cancelled?`<section class="sub-trial"><strong>Abo zum ${esc(date(main.cancelAt||main.periodEnd))} gekündigt</strong><p>Dein ${esc(planName(overview.plan))}-Zugang bleibt bis dahin bestehen. Danach wechselst du automatisch zu Free; eine weitere reguläre Abbuchung ist nicht geplant.</p></section>`:''}
      ${overview.addon?`<section class="sub-section"><div class="sub-section-head"><div><span>ZUSATZOPTION</span><h4>Eigene KI-Verbindungen</h4></div></div><div class="sub-addon"><div class="sub-addon-top"><div><strong>${esc(statusLabel[overview.addon.status]||overview.addon.status||'Aktiv')}</strong><p>${overview.addon.subscription?.price?`${esc(money(overview.addon.subscription.price.amount,overview.addon.subscription.price.currency))} ${esc(interval(overview.addon.subscription.price))}`:`Laufzeit bis ${esc(date(overview.addon.periodEnd))}`}</p></div><button type="button" class="outline-btn mini" data-sub-addon>Verwalten</button></div></div></section>`:''}
      <section class="sub-section"><div class="sub-section-head"><div><span>RECHNUNGEN</span><h4>Abrechnungsverlauf</h4></div><small>${main?.invoices?.length||0} Einträge</small></div>${invoices(main)}</section>
      <p class="sub-security">Prompt.ai zeigt nur die für dein Konto notwendigen Abrechnungsinformationen an. Vollständige Karten-, Bank- oder Zahlungsdaten werden nicht in Prompt.ai gespeichert; Änderungen an Zahlungsmethoden, Kündigungen und Tarifwechsel werden über Stripe durchgeführt.</p>`;
  }

  async function load(){
    const body=$('#subscriptionOverviewBody');body.innerHTML='<div class="sub-loading"><i></i><strong>Abo wird geladen</strong><small>Tarif, nächste Abbuchung und Rechnungen werden direkt bei Stripe geprüft.</small></div>';
    try{render(await api({action:'subscription-info'}))}catch(error){body.innerHTML=`<div class="sub-error">${esc(error.message)}</div>`}
  }
  async function open(){
    styles();const d=ensureDialog();try{d.showModal()}catch{d.setAttribute('open','')};await load();
  }
  async function portal(flow='general',target='main'){
    const body=$('#subscriptionOverviewBody');const old=body?.querySelector('.sub-security')?.textContent||'';
    try{const data=await api({action:'portal',flow:flow==='general'?'':flow,target});if(!data.url)throw new Error('Stripe konnte nicht geöffnet werden.');location.href=data.url}catch(error){if(body){const e=document.createElement('div');e.className='sub-error';e.textContent=error.message;body.prepend(e)}else window.PromptAiDialog?.alert?.(error.message)}
  }
  async function handleClick(event){
    const plans=event.target.closest('[data-sub-plans]');if(plans){ensureDialog().close();setTimeout(()=>$('#plansDialog')?.showModal(),60);return}
    const addon=event.target.closest('[data-sub-addon]');if(addon){portal('general','addon');return}
    const p=event.target.closest('[data-sub-portal]');if(!p)return;
    const flow=p.dataset.subPortal;
    if(flow==='cancel'){
      const ok=window.PromptAiDialog?.confirm?await window.PromptAiDialog.confirm('Möchtest du die Kündigung in Stripe öffnen? Dort siehst du vor der Bestätigung noch einmal genau, wann dein Zugang endet.',{title:'Abo kündigen',confirmLabel:'Zu Stripe',danger:true}):true;
      if(!ok)return;
    }
    portal(flow);
  }
  function intercept(){
    document.addEventListener('click',event=>{const button=event.target.closest?.('#manageSubscriptionBtn');if(!button)return;event.preventDefault();event.stopImmediatePropagation();open()},true);
  }
  function returnFromBilling(){const params=new URLSearchParams(location.search);if(!params.has('billing'))return;setTimeout(()=>{if(window.SiteBriefCloud?.user)open()},700);try{params.delete('billing');const q=params.toString();history.replaceState(null,'',location.pathname+(q?`?${q}`:'')+location.hash)}catch{}}
  function init(){styles();ensureDialog();intercept();returnFromBilling();window.addEventListener('promptai:access',()=>{if(new URLSearchParams(location.search).has('billing'))returnFromBilling()})}
  window.PromptAiSubscriptionOverview={open,refresh:load};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
