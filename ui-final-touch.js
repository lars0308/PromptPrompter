(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const cleanAuth=()=>{const m=$('#authMessage');if(!m)return;const t=(m.textContent||'').trim();if(/invalid login credentials|invalid credentials|email or password|wrong password|user not found/i.test(t)&&t!=='E-Mail oder Passwort stimmt nicht.')m.textContent='E-Mail oder Passwort stimmt nicht.'};
  // #promptAppBoot strong stand hier mit in der Liste. Die Ueberschrift des Startbildschirms ist
  // aber inzwischen die Flaeche, die beim Laden blau volllaeuft - und dieses Skript hat sie nach
  // jedem Durchlauf neu geschrieben und die Fuellung damit weggeworfen. Das blaue ".ai" waere
  // dort ohnehin doppelt: das ganze Wort faerbt sich, waehrend die App startet.
  const brandAi=()=>{$$('.brand-copy strong,.auth-brand strong,.guided-clean-brand strong,.simple-intake-brand strong').forEach(el=>{if(el.dataset.brandAi==='1')return;if(el.textContent.trim()==='Prompt.ai'){el.innerHTML='Prompt<span class="brand-ai-suffix">.ai</span>';el.dataset.brandAi='1'}})};
  const cleanFreeStatus=()=>{const m=$('#freePromptStatus');if(!m||!m.classList.contains('good'))return;const t=(m.textContent||'').trim();if(/Free-Basis-Prompt erstellt|Professioneller Prompt erstellt/i.test(t)&&t!=='Prompt erstellt.')m.textContent='Prompt erstellt.'};
  
  function syncMenuShield(){const menu=$('#topbarMenu'),shield=$('#promptFinalMenuBackdrop');if(!shield)return;const open=Boolean(menu?.classList.contains('open'));shield.classList.toggle('show',open);shield.setAttribute('aria-hidden',String(!open));const bar=$('.topbar');if(bar)shield.style.top=`${Math.round(bar.getBoundingClientRect().bottom)}px`}
  function ensureMenuShield(){let shield=$('#promptFinalMenuBackdrop');if(!shield){shield=document.createElement('div');shield.id='promptFinalMenuBackdrop';shield.className='prompt-menu-shield';shield.setAttribute('aria-hidden','true');shield.addEventListener('click',()=>{const menu=$('#topbarMenu'),toggle=$('#topbarMenuToggle');menu?.classList.remove('open');toggle?.setAttribute('aria-expanded','false');syncMenuShield()});document.body.appendChild(shield)}const menu=$('#topbarMenu');if(menu&&!menu.__finalShieldObserver){menu.__finalShieldObserver=true;new MutationObserver(syncMenuShield).observe(menu,{attributes:true,attributeFilter:['class']})}syncMenuShield()}
  function bind(){const auth=$('#authMessage');if(auth&&!auth.__finalTouch){auth.__finalTouch=true;new MutationObserver(cleanAuth).observe(auth,{childList:true,subtree:true})}const free=$('#freePromptStatus');if(free&&!free.__finalTouch){free.__finalTouch=true;new MutationObserver(cleanFreeStatus).observe(free,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})}}
  function settle(){ensureMenuShield();bind();cleanAuth();cleanFreeStatus();brandAi()}
  function init(){settle();let n=0;const t=setInterval(()=>{settle();if(++n>20)clearInterval(t)},180);window.addEventListener('promptai:access',settle);window.addEventListener('pageshow',settle)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
