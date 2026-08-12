(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  let settleTimer=0;

  function styles(){
    if($('#entryGateStyles'))return;
    const s=document.createElement('style');s.id='entryGateStyles';s.textContent=`
      .account-dialog.guest-gate .dialog-head{display:none!important}
      #gateActions{display:none}
      .account-dialog.guest-gate:not(.gate-expanded) .auth-layout{display:none!important}
      .account-dialog.guest-gate:not(.gate-expanded) #gateActions{display:grid;gap:14px;max-width:420px;margin-top:6px}
      .gate-primary-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .gate-primary-actions button{min-height:54px;padding:0 14px;border-radius:14px;font-size:15px;font-weight:750}
      .gate-guest-btn{min-height:64px;padding:0 18px;border:1px solid var(--accent);border-radius:16px;background:var(--accent);color:#fff;font-size:17px;font-weight:800;box-shadow:0 16px 34px rgba(45,147,201,.24)}
      .gate-guest-note{margin:0;color:var(--muted);font-size:9px;text-align:center}
      /* one row, two cells: all copy on the left, the arrow on the right. The previous version let
         span/strong/small auto-place into a 2-column grid, which scattered the three lines across
         two columns and put the arrow in the middle of the card. */
      .gate-plans-pick{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;margin-top:8px;padding:16px 18px;border:1px solid color-mix(in srgb,var(--accent) 38%,var(--line));border-radius:16px;background:color-mix(in srgb,var(--accent) 7%,var(--surface));text-align:left;transition:border-color .16s ease,background .16s ease,transform .16s ease}
      .gate-plans-pick:hover{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 12%,var(--surface));transform:translateY(-1px)}
      .gate-plans-copy{display:block;min-width:0}
      .gate-plans-pick span,.gate-plans-pick strong,.gate-plans-pick small{display:block}
      .gate-plans-pick .gate-plans-kicker{font-size:8px;font-weight:800;letter-spacing:.12em;color:var(--accent)}
      .gate-plans-pick strong{margin:4px 0 3px;font-size:14px}
      .gate-plans-pick small{color:var(--muted);font-size:9px;line-height:1.45}
      .gate-plans-tiers{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
      .gate-plans-tiers i{padding:4px 9px;border:1px solid color-mix(in srgb,var(--accent) 30%,var(--line));border-radius:99px;background:var(--surface);color:var(--ink);font-size:9px;font-style:normal;font-weight:750;white-space:nowrap}
      .gate-plans-arrow{display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:var(--accent);color:#fff;font-size:16px;font-weight:800}
      .gate-theme-pick{justify-self:center;margin-top:2px;display:inline-flex;align-items:center;gap:6px;border:0;background:none;color:var(--muted);font-size:9px}
      .gate-theme-pick:hover{color:var(--ink)}
      @media(max-width:360px){.gate-primary-actions{grid-template-columns:1fr}}
      @media(min-width:821px){
        .account-dialog.guest-gate:not(.gate-expanded) #accountLoggedOut{display:flex;flex-direction:column;align-items:center;max-width:760px;margin:0 auto;padding-top:clamp(24px,6vh,80px)}
        .account-dialog.guest-gate:not(.gate-expanded) .auth-hero{max-width:100%;width:100%;text-align:center}
        .account-dialog.guest-gate:not(.gate-expanded) .auth-brand{justify-content:center}
        .account-dialog.guest-gate:not(.gate-expanded) .auth-hero h1{max-width:100%}
        .account-dialog.guest-gate:not(.gate-expanded) #gateActions{max-width:640px;width:100%;gap:18px;margin-top:10px}
        .gate-primary-actions{gap:14px}
        .gate-primary-actions button{min-height:64px;font-size:17px;border-radius:16px}
        .gate-guest-btn{min-height:74px;font-size:19px;border-radius:18px}
        .gate-guest-note{font-size:11px}
        .gate-plans-pick{padding:22px 24px;border-radius:18px}
        .gate-plans-pick .gate-plans-kicker{font-size:9px}
        .gate-plans-pick strong{font-size:18px;margin:6px 0 4px}
        .gate-plans-pick small{font-size:11px}
        .gate-plans-tiers i{font-size:11px;padding:5px 12px}
        .gate-plans-arrow{width:44px;height:44px;font-size:19px}
        .gate-theme-pick{font-size:11px}
      }
    `;document.head.appendChild(s);
  }

  function ensureGateActions(){
    const hero=$('#accountLoggedOut .auth-hero');if(!hero||$('#gateActions'))return;
    const box=document.createElement('div');box.id='gateActions';
    box.innerHTML='<div class="gate-primary-actions"><button type="button" class="outline-btn" id="gateSignInPick">Anmelden</button><button type="button" class="outline-btn" id="gateSignUpPick">Registrieren</button></div><button type="button" class="gate-guest-btn" id="gateGuestBtn">Kostenlos testen</button><p class="gate-guest-note">Ohne Konto, jederzeit später upgradebar.</p><button type="button" class="gate-plans-pick" id="gatePlansPick"><span class="gate-plans-copy"><span class="gate-plans-kicker">ABO ABSCHLIESSEN</span><strong>Alle drei Tarife im Vergleich</strong><small>Kostenlos, Pro und Ultimate nebeneinander – mit allen Leistungen und Preisen.</small><span class="gate-plans-tiers"><i>Kostenlos 0 €</i><i id="gateProTier">Pro 15,99 €</i><i id="gateUltimateTier">Ultimate 25,99 €</i></span></span><span class="gate-plans-arrow" aria-hidden="true">→</span></button><button type="button" class="gate-theme-pick" id="gateThemePick">Anderes Farbschema verwenden</button>';
    hero.insertAdjacentElement('afterend',box);
    const reveal=()=>{$('#accountDialog')?.classList.add('gate-expanded');setTimeout(()=>{$('.auth-form-card')?.scrollIntoView({behavior:'smooth',block:'start'})},60)};
    $('#gateSignInPick',box).addEventListener('click',reveal);
    $('#gateSignUpPick',box).addEventListener('click',reveal);
    $('#gateGuestBtn',box).addEventListener('click',()=>$('#guestContinueBtn')?.click());
    $('#gatePlansPick',box).addEventListener('click',()=>openPlansFromGate());
    $('#gateThemePick',box).addEventListener('click',()=>$('#themeToggleBtn')?.click());
  }

  // Keep the price chips in sync with whatever pricing the plans dialog is currently showing.
  function syncTierChips(){
    const pro=$('#proPriceLabel')?.textContent?.trim(),ultimate=$('#ultimatePriceLabel')?.textContent?.trim();
    const chip=(id,label,price)=>{const node=$(id);if(node&&price)node.textContent=`${label} ${price.replace(/\s*\/\s*Monat$/,'')}`};
    chip('#gateProTier','Pro',pro);chip('#gateUltimateTier','Ultimate',ultimate);
  }

  // Opened from the login page, so closing the plans dialog has to land back on the login page
  // rather than on whatever sits behind it.
  function openPlansFromGate(){
    const plans=$('#plansDialog');if(!plans)return;
    const account=$('#accountDialog'),wasOpen=Boolean(account?.open);
    if(!plans.open)plans.showModal();
    if(!wasOpen)return;
    plans.addEventListener('close',()=>{const dialog=$('#accountDialog');if(dialog&&!dialog.open){try{dialog.showModal()}catch{}}},{once:true});
  }

  function resetExpansion(){
    const dialog=$('#accountDialog');if(!dialog)return;
    if(!dialog.classList.contains('guest-gate'))dialog.classList.remove('gate-expanded');
  }

  function settle(){styles();ensureGateActions();syncTierChips();resetExpansion()}
  function schedule(){clearTimeout(settleTimer);settleTimer=setTimeout(settle,24)}
  function init(){settle();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','open']});window.addEventListener('promptai:access',schedule);window.addEventListener('pageshow',schedule)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
