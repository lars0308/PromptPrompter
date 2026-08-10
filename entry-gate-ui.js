(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);

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
      @media(max-width:360px){.gate-primary-actions{grid-template-columns:1fr}}
    `;document.head.appendChild(s);
  }

  function ensureGateActions(){
    const hero=$('#accountLoggedOut .auth-hero');if(!hero||$('#gateActions'))return;
    const box=document.createElement('div');box.id='gateActions';
    box.innerHTML='<div class="gate-primary-actions"><button type="button" class="outline-btn" id="gateSignInPick">Anmelden</button><button type="button" class="outline-btn" id="gateSignUpPick">Registrieren</button></div><button type="button" class="gate-guest-btn" id="gateGuestBtn">Kostenlos testen</button><p class="gate-guest-note">Ohne Konto, jederzeit später upgradebar.</p>';
    hero.insertAdjacentElement('afterend',box);
    const reveal=()=>{$('#accountDialog')?.classList.add('gate-expanded');setTimeout(()=>{$('#authEmail')?.focus();$('.auth-form-card')?.scrollIntoView({behavior:'smooth',block:'start'})},60)};
    $('#gateSignInPick',box).addEventListener('click',reveal);
    $('#gateSignUpPick',box).addEventListener('click',reveal);
    $('#gateGuestBtn',box).addEventListener('click',()=>$('#guestContinueBtn')?.click());
  }

  function resetExpansion(){
    const dialog=$('#accountDialog');if(!dialog)return;
    if(!dialog.classList.contains('guest-gate'))dialog.classList.remove('gate-expanded');
  }

  function settle(){styles();ensureGateActions();resetExpansion()}
  function init(){settle();new MutationObserver(settle).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','open']});window.addEventListener('promptai:access',settle);window.addEventListener('pageshow',settle)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
