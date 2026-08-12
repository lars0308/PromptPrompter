(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const DAY=86400000;
  const fmt=value=>value?new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(value)):'';
  const proPrice=()=>String(window.SiteBriefCloud?.config?.pricing?.pro||'15,99 € / Monat');

  function trialCopy(subscription){
    if(!subscription||subscription.plan!=='pro'||subscription.status!=='trialing')return null;
    const end=subscription.current_period_end?new Date(subscription.current_period_end):null;
    const validEnd=end&&!Number.isNaN(end.getTime());
    const remaining=validEnd?Math.max(0,Math.ceil((end.getTime()-Date.now())/DAY)):null;
    const when=validEnd?fmt(end):'';
    let lead='Pro-Testphase aktiv.';
    if(remaining!==null)lead=remaining<=0?'Deine Pro-Testphase endet heute.':`Noch ${remaining} ${remaining===1?'Tag':'Tage'} kostenlos.`;
    const until=when?` Kostenlos bis ${when}.`:'';
    return `${lead}${until} Danach ${proPrice()}. Über „Abo verwalten“ kannst du die Testphase vor Ablauf kündigen.`;
  }

  async function loadSubscription(){
    const cloud=window.SiteBriefCloud,user=cloud?.user,client=cloud?.client;
    if(!user||!client)return null;
    try{const {data,error}=await client.from('sitebrief_subscriptions').select('plan,status,current_period_end').eq('user_id',user.id).maybeSingle();if(error)throw error;return data||null}catch{return null}
  }

  async function syncTrialUi(){
    const subscription=await loadSubscription(),copy=trialCopy(subscription);
    const badge=$('#currentPlanBadge'),title=$('#currentPlanTitle'),description=$('#currentPlanDescription'),manage=$('#manageSubscriptionBtn');
    if(copy){
      if(badge)badge.textContent='TESTPHASE';
      if(title)title.textContent='Pro · Testphase';
      if(description)description.textContent=copy;
      if(manage)manage.textContent='Abo verwalten';
      document.documentElement.dataset.proTrial='1';
    }else{
      delete document.documentElement.dataset.proTrial;
      if(manage&&manage.textContent==='Testphase verwalten')manage.textContent='Abo verwalten';
    }
  }

  async function syncOfferUi(){
    try{
      const response=await fetch('/api/offer',{cache:'no-store'}),data=await response.json(),offer=data?.offer;
      if(!offer)return;
      const pro=$('#startProCheckoutBtn'),ultimate=$('#startUltimateCheckoutBtn');
      if(pro)pro.textContent=offer.cta_label||(Number(offer.trial_days)>0?`${offer.trial_days} Tage kostenlos testen`:'Jetzt kaufen');
      // A Pro trial offer must never relabel Ultimate as a trial - Ultimate keeps its plain buy CTA.
      if(ultimate&&Number(offer.trial_days)>0)ultimate.textContent='Jetzt kaufen';
    }catch{}
  }

  function adminTrialHint(){
    const input=$('#adminOfferTrialDays');if(!input||$('#proTrialOnlyHint'))return;
    const hint=document.createElement('small');hint.id='proTrialOnlyHint';hint.textContent='Der Testzeitraum gilt ausschließlich für Pro. Ultimate bleibt davon unberührt.';hint.style.cssText='display:block;margin-top:7px;color:var(--muted);font-size:10px;line-height:1.45';
    input.insertAdjacentElement('afterend',hint);
  }

  function schedule(){setTimeout(syncTrialUi,80);setTimeout(syncTrialUi,500);setTimeout(syncOfferUi,120)}
  document.addEventListener('click',event=>{if(event.target.closest?.('#accountBtn,#welcomeAccountBtn,#adminBtn,#showPlansBtn,#upgradeBtn,#upgradeMenuBtn'))schedule()},{capture:true});
  window.addEventListener('promptai:access',schedule);
  window.addEventListener('pageshow',schedule);
  const init=()=>{adminTrialHint();schedule();window.SiteBriefCloudReady?.then(()=>schedule()).catch(()=>{});new MutationObserver(()=>adminTrialHint()).observe(document.body,{childList:true,subtree:true})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
