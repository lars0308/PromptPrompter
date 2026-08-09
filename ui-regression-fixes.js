(()=>{
  'use strict';
  const STATE_KEY='sitebrief-v6-state';
  const ADMIN_EMAIL='service.battermann@gmx.de';
  let shieldShown=false,cloudBundleWrapped=false;

  function injectStyles(){
    if(document.getElementById('promptRegressionStyles'))return;
    const style=document.createElement('style');
    style.id='promptRegressionStyles';
    style.textContent=`
      .auth-plan-heading,.auth-plan-grid{display:none!important}
      .auth-subscribe-compact{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;margin:0 0 14px;padding:15px 16px;border:1px solid color-mix(in srgb,var(--accent) 35%,var(--line));border-radius:16px;background:color-mix(in srgb,var(--accent) 6%,var(--surface))}
      .auth-subscribe-compact span,.auth-subscribe-compact strong,.auth-subscribe-compact small{display:block}.auth-subscribe-compact span{font-size:8px;font-weight:800;letter-spacing:.12em;color:var(--accent)}.auth-subscribe-compact strong{margin:4px 0 3px;font-size:15px}.auth-subscribe-compact small{color:var(--muted);font-size:9px;line-height:1.45}.auth-subscribe-compact button{min-width:118px}
      .account-dialog.auth-transitioning #accountLoggedIn{display:none!important}.account-dialog.auth-transitioning #accountLoggedOut{display:block!important}
      .prompt-reload-shield{position:fixed;z-index:2147483647;inset:0;display:grid;place-items:center;background:var(--paper,#090c0a);color:var(--ink,#fff);pointer-events:none}.prompt-reload-shield img{width:76px;height:76px;object-fit:contain;filter:drop-shadow(0 14px 34px rgba(0,0,0,.28))}
      @media(max-width:820px){
        #plansDialog{width:100vw!important;max-width:none!important;height:100dvh!important;max-height:none!important;margin:0!important;padding:5px!important;overflow:hidden!important;background:transparent!important}
        #plansDialog .dialog-frame{display:flex!important;flex-direction:column!important;width:100%!important;max-width:none!important;height:100%!important;max-height:none!important;min-height:0!important;margin:0!important;border-radius:18px!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important}
        #plansDialog .dialog-head{flex:0 0 auto!important;padding:16px 17px!important}
        #plansDialog .plans-grid{display:block!important;flex:0 0 auto!important;width:100%!important;max-height:none!important;overflow:visible!important;padding:14px 12px 24px!important}
        #plansDialog .plan-card{width:100%!important;max-height:none!important;overflow:visible!important;margin:0 0 12px!important}
        #plansDialog .plan-card-detail{max-height:none!important;overflow:visible!important;padding-bottom:18px!important}
        #plansDialog .plan-card-detail button{position:relative!important;z-index:1!important}
        #plansDialog .dialog-frame>:last-child{margin-bottom:max(28px,env(safe-area-inset-bottom))!important}
      }
      @media(max-width:520px){.auth-subscribe-compact{grid-template-columns:1fr}.auth-subscribe-compact button{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function compactAccountPlans(){
    const card=document.querySelector('.auth-access-card');if(!card)return;
    document.querySelector('.auth-plan-heading')?.remove();document.querySelector('.auth-plan-grid')?.remove();
    if(card.querySelector('.auth-subscribe-compact'))return;
    const box=document.createElement('div');box.className='auth-subscribe-compact';box.innerHTML='<div><span>MEHR FUNKTIONEN</span><strong>Lieber direkt mit einem Abo starten?</strong><small>Pro und Ultimate bleiben auf einer eigenen Tarifseite und stören die Anmeldung nicht mehr.</small></div><button type="button" class="solid-btn" id="accountSubscribeBtn">Abonnieren</button>';
    card.insertBefore(box,card.firstChild);
    box.querySelector('button')?.addEventListener('click',()=>{const account=document.getElementById('accountDialog');if(account?.open)account.close();setTimeout(()=>document.getElementById('plansDialog')?.showModal(),0)});
  }

  function protectLoginTransition(){
    const dialog=document.getElementById('accountDialog'),message=document.getElementById('authMessage');if(!dialog)return;
    ['signInBtn','signUpBtn'].forEach(id=>document.getElementById(id)?.addEventListener('click',()=>dialog.classList.add('auth-transitioning'),true));
    dialog.addEventListener('close',()=>dialog.classList.remove('auth-transitioning'));
    if(message)new MutationObserver(()=>{if(message.classList.contains('error'))dialog.classList.remove('auth-transitioning')}).observe(message,{attributes:true,childList:true,subtree:true});
  }

  function showReloadShield(){
    if(shieldShown||document.querySelector('.prompt-reload-shield'))return;shieldShown=true;
    const shield=document.createElement('div');shield.className='prompt-reload-shield';shield.setAttribute('aria-hidden','true');shield.innerHTML='<img src="./sitebrief-logo.svg?v=4" alt="">';document.body.appendChild(shield);
    try{shield.getBoundingClientRect()}catch{}
  }

  function protectReloads(){
    const nativeRemove=Storage.prototype.removeItem;
    Storage.prototype.removeItem=function(key){if(this===localStorage&&String(key)===STATE_KEY)showReloadShield();return nativeRemove.call(this,key)};
    window.addEventListener('pageshow',()=>{document.querySelector('.prompt-reload-shield')?.remove();shieldShown=false});
  }

  function applyPricing(pricing){
    if(!pricing)return;
    const set=(selector,value)=>document.querySelectorAll(selector).forEach(node=>{if(value)node.textContent=value});
    set('#proPriceLabel,[data-public-price="pro"]',pricing.pro);
    set('#ultimatePriceLabel,[data-public-price="ultimate"]',pricing.ultimate);
    const addon=document.getElementById('apiAddonCard')?.querySelector('b');if(addon&&pricing.apiKeys)addon.textContent=pricing.apiKeys;
    if(pricing.singleReview){const inline=document.getElementById('buyReviewInlineBtn'),buy=document.getElementById('buySingleReviewBtn'),note=document.querySelector('.single-check-note>strong');if(inline)inline.textContent=`Erweitert für ${pricing.singleReview}`;if(buy)buy.textContent=`Einmalig für ${pricing.singleReview} prüfen`;if(note)note.textContent=`Erweiterte Prüfung für ein Projekt – ${pricing.singleReview}`}
  }
  async function refreshPricing(){try{const response=await fetch('/api/config',{cache:'no-store'}),data=await response.json();if(window.SiteBriefCloud?.config)Object.assign(window.SiteBriefCloud.config,{previewRoutes:data.previewRoutes||[],previewProviders:data.previewProviders||[]});applyPricing(data.pricing)}catch{}}
  function watchPricing(){
    refreshPricing();
    ['plansDialog','settingsDialog','accountDialog'].forEach(id=>{const dialog=document.getElementById(id);if(!dialog)return;new MutationObserver(()=>{if(dialog.open)refreshPricing()}).observe(dialog,{attributes:true,attributeFilter:['open']})});
  }

  function isOwnerAccount(){return String(window.SiteBriefCloud?.user?.email||'').trim().toLowerCase()===ADMIN_EMAIL}
  function enforceAdminOwner(){
    const button=document.getElementById('adminBtn'),dialog=document.getElementById('adminDialog');if(!button)return;
    if(!isOwnerAccount()){button.hidden=true;if(dialog?.open)dialog.close()}
  }
  function protectAdminUi(){
    const button=document.getElementById('adminBtn');if(!button)return;
    enforceAdminOwner();
    window.addEventListener('sitebrief:admin',()=>queueMicrotask(enforceAdminOwner));
    const observer=new MutationObserver(enforceAdminOwner);observer.observe(button,{attributes:true,attributeFilter:['hidden','style','class']});
    window.SiteBriefCloud?.subscribe?.(()=>queueMicrotask(enforceAdminOwner));
  }

  async function enableCentralPreviewProviders(){
    if(cloudBundleWrapped||!window.SiteBriefCloud?.loadUserBundle)return;cloudBundleWrapped=true;
    try{const response=await fetch('/api/config',{cache:'no-store'}),data=await response.json();Object.assign(window.SiteBriefCloud.config,{previewRoutes:data.previewRoutes||[],previewProviders:data.previewProviders||[]})}catch{}
    const cloud=window.SiteBriefCloud,native=cloud.loadUserBundle.bind(cloud);
    cloud.loadUserBundle=async(...args)=>{const bundle=await native(...args),providers=Array.isArray(cloud.config?.previewProviders)?cloud.config.previewProviders:[],personal=Array.isArray(bundle.aiConnections)?bundle.aiConnections:[],merged=[...personal];for(const provider of providers)if(!merged.some(x=>x.provider===provider))merged.push({provider,last4:'zentral',updated_at:null,system:true});bundle.aiConnections=merged;return bundle};
    if(cloud.user)queueMicrotask(()=>cloud.emit?.('auth',{user:cloud.user,authEvent:'TOKEN_REFRESHED'}));
  }

  function init(){injectStyles();compactAccountPlans();protectLoginTransition();protectReloads();watchPricing();protectAdminUi();enableCentralPreviewProviders()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
