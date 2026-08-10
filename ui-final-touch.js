(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const cleanAuth=()=>{const m=$('#authMessage');if(!m)return;const t=(m.textContent||'').trim();if(/invalid login credentials|invalid credentials|email or password|wrong password|user not found/i.test(t)&&t!=='E-Mail oder Passwort stimmt nicht.')m.textContent='E-Mail oder Passwort stimmt nicht.'};
  const cleanFreeStatus=()=>{const m=$('#freePromptStatus');if(!m||!m.classList.contains('good'))return;const t=(m.textContent||'').trim();if(/Free-Basis-Prompt erstellt|Professioneller Prompt erstellt/i.test(t)&&t!=='Prompt erstellt.')m.textContent='Prompt erstellt.'};
  function style(){if($('#promptFinalTouchStyles'))return;const s=document.createElement('style');s.id='promptFinalTouchStyles';s.textContent=`
    body.prompt-unified-ui .topbar-menu-backdrop:not([hidden]){background:rgba(12,17,22,.62)!important;backdrop-filter:blur(12px)!important;-webkit-backdrop-filter:blur(12px)!important}
    body.prompt-unified-ui .topbar-menu{background:var(--ui-card,var(--surface))!important;isolation:isolate!important}
    #freePromptStatus.good{font-size:9px!important;color:var(--good)!important}
    @media(max-width:820px){body.prompt-unified-ui .topbar-menu-backdrop:not([hidden]){background:rgba(12,17,22,.68)!important}}
  `;document.head.appendChild(s)}
  function bind(){const auth=$('#authMessage');if(auth&&!auth.__finalTouch){auth.__finalTouch=true;new MutationObserver(cleanAuth).observe(auth,{childList:true,subtree:true})}const free=$('#freePromptStatus');if(free&&!free.__finalTouch){free.__finalTouch=true;new MutationObserver(cleanFreeStatus).observe(free,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})}}
  function settle(){style();bind();cleanAuth();cleanFreeStatus()}
  function init(){settle();let n=0;const t=setInterval(()=>{settle();if(++n>20)clearInterval(t)},180);window.addEventListener('promptai:access',settle)}
  style();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
