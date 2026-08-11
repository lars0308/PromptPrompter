(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const cleanAuth=()=>{const m=$('#authMessage');if(!m)return;const t=(m.textContent||'').trim();if(/invalid login credentials|invalid credentials|email or password|wrong password|user not found/i.test(t)&&t!=='E-Mail oder Passwort stimmt nicht.')m.textContent='E-Mail oder Passwort stimmt nicht.'};
  const brandAi=()=>{$$('.brand-copy strong,.auth-brand strong,.guided-clean-brand strong,.simple-intake-brand strong').forEach(el=>{if(el.dataset.brandAi==='1')return;if(el.textContent.trim()==='Prompt.ai'){el.innerHTML='Prompt<span class="brand-ai-suffix">.ai</span>';el.dataset.brandAi='1'}})};
  const cleanFreeStatus=()=>{const m=$('#freePromptStatus');if(!m||!m.classList.contains('good'))return;const t=(m.textContent||'').trim();if(/Free-Basis-Prompt erstellt|Professioneller Prompt erstellt/i.test(t)&&t!=='Prompt erstellt.')m.textContent='Prompt erstellt.'};
  function style(){if($('#promptFinalTouchStyles'))return;const s=document.createElement('style');s.id='promptFinalTouchStyles';s.textContent=`
    .prompt-menu-shield{position:fixed;top:68px;right:0;bottom:0;left:0;z-index:2147483000;background:rgba(12,17,22,.66);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);opacity:0;pointer-events:none;transition:opacity .2s ease}
    .prompt-menu-shield.show{opacity:1;pointer-events:auto}
    body.prompt-unified-ui .topbar-menu{z-index:2147483001!important;background:var(--ui-card,var(--surface))!important;isolation:isolate!important}
    #freePromptStatus.good{font-size:9px!important;color:var(--good)!important}
    .brand-ai-suffix{display:inline!important;color:var(--accent)}
    .brand-copy strong,.auth-brand strong,.guided-clean-brand strong,.simple-intake-brand strong{white-space:nowrap}
    @media(max-width:820px){.prompt-menu-shield{background:rgba(12,17,22,.72)}}
  `;document.head.appendChild(s)}
  function syncMenuShield(){const menu=$('#topbarMenu'),shield=$('#promptFinalMenuBackdrop');if(!shield)return;const open=Boolean(menu?.classList.contains('open'));shield.classList.toggle('show',open);shield.setAttribute('aria-hidden',String(!open));const bar=$('.topbar');if(bar)shield.style.top=`${Math.round(bar.getBoundingClientRect().bottom)}px`}
  function ensureMenuShield(){let shield=$('#promptFinalMenuBackdrop');if(!shield){shield=document.createElement('div');shield.id='promptFinalMenuBackdrop';shield.className='prompt-menu-shield';shield.setAttribute('aria-hidden','true');shield.addEventListener('click',()=>{const menu=$('#topbarMenu'),toggle=$('#topbarMenuToggle');menu?.classList.remove('open');toggle?.setAttribute('aria-expanded','false');syncMenuShield()});document.body.appendChild(shield)}const menu=$('#topbarMenu');if(menu&&!menu.__finalShieldObserver){menu.__finalShieldObserver=true;new MutationObserver(syncMenuShield).observe(menu,{attributes:true,attributeFilter:['class']})}syncMenuShield()}
  function bind(){const auth=$('#authMessage');if(auth&&!auth.__finalTouch){auth.__finalTouch=true;new MutationObserver(cleanAuth).observe(auth,{childList:true,subtree:true})}const free=$('#freePromptStatus');if(free&&!free.__finalTouch){free.__finalTouch=true;new MutationObserver(cleanFreeStatus).observe(free,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})}}
  function settle(){style();ensureMenuShield();bind();cleanAuth();cleanFreeStatus();brandAi()}
  function init(){settle();let n=0;const t=setInterval(()=>{settle();if(++n>20)clearInterval(t)},180);window.addEventListener('promptai:access',settle);window.addEventListener('pageshow',settle)}
  style();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
