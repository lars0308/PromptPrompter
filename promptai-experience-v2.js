(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  let settleTimer=0;


  function titleCase(value){return String(value||'').trim().replace(/[._-]+/g,' ').replace(/\b\p{L}/gu,m=>m.toUpperCase())}
  function displayName(){
    const cloud=window.SiteBriefCloud||{},u=cloud.user||{},meta=u.user_metadata||{};
    const candidates=[cloud.profile?.display_name,cloud.userProfile?.display_name,window.PromptAiUserProfile?.display_name,$('#userDisplayName')?.value,meta.display_name,meta.full_name,meta.name];
    for(const c of candidates){const v=String(c||'').trim();if(v)return v.split(/\s+/)[0]}
    const email=String(u.email||'').trim();if(email){const clean=titleCase(email.split('@')[0]);if(clean)return clean.split(/\s+/)[0]}
    return ''
  }

  function normalizeHome(){
    const hero=$('.welcome-hero');if(!hero)return;const h1=$('h1',hero),kicker=$('.section-kicker',hero),name=displayName();
    if(kicker)kicker.textContent='PROMPT.AI';if(h1)h1.textContent=name||'Prompt.ai';
    let intro=$('.home-intro-copy',hero);if(!intro){intro=document.createElement('p');intro.className='home-intro-copy';hero.firstElementChild?.appendChild(intro)}if(intro)intro.textContent='Wähle deinen Arbeitsbereich.';
    $$('.home-welcome',hero).forEach(x=>x.remove());
    $$('*',hero).forEach(el=>{const t=(el.textContent||'').trim();if(el!==h1&&el!==kicker&&el!==intro&&(/^Was möchtest du erstellen\??$/i.test(t)||/^Willkommen( zurück)?[,.]?/i.test(t)))el.hidden=true})
  }

  function cleanFreeStatus(){const status=$('#freePromptStatus');if(!status)return;const t=status.textContent||'';if(/Free-Basis-Prompt erstellt/i.test(t)){status.className='free-prompt-status good';status.textContent='Professionell aufbereiteter Free-Prompt erstellt.'}}
  function settle(){normalizeHome();cleanFreeStatus()}
  function schedule(){clearTimeout(settleTimer);settleTimer=setTimeout(settle,20)}
  function bind(){
    document.addEventListener('pointerdown',()=>document.documentElement.classList.remove('prompt-keyboard-focus'),true);
    document.addEventListener('keydown',e=>{if(e.key==='Tab'||e.key.startsWith('Arrow'))document.documentElement.classList.add('prompt-keyboard-focus')},true);
    new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','open','class']});
    window.addEventListener('promptai:access',schedule);window.addEventListener('pageshow',schedule)
  }
  function init(){bind();settle();let n=0;const timer=setInterval(()=>{settle();if(++n>28)clearInterval(timer)},180)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init()
})();
