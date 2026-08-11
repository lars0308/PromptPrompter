(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  let timer=0;
  window.PromptAiHomeFinalLock=true;

  function styles(){
    if($('#promptAiHomeFinalStyles'))return;
    const s=document.createElement('style');s.id='promptAiHomeFinalStyles';s.textContent=`
      .welcome-hero .section-kicker{display:none!important}
      /* Nur auf der echten Startseite: alte Workflow-Regeln dürfen die Navigation nicht verstecken. */
      html.prompt-home-surface.prompt-home-surface body.prompt-unified-ui>.topbar,
      html.prompt-home-surface.prompt-home-surface body>.topbar{
        display:grid!important;
        visibility:visible!important;
        opacity:1!important;
        pointer-events:auto!important;
        position:sticky!important;
        top:8px!important;
        z-index:2147482500!important;
      }
      html.prompt-home-surface.prompt-home-surface body>.topbar .brand{display:flex!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important}
      html.prompt-home-surface.prompt-home-surface body>.topbar .top-actions{display:flex!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important}
      html.prompt-home-surface.prompt-home-surface body>.topbar #topbarMenuToggle{display:grid!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important}

      /* Alte Skripte schreiben teilweise noch Starttexte. Sie bleiben im DOM, sind aber visuell gesperrt. */
      html.prompt-home-surface .welcome-hero .home-intro-copy,
      html.prompt-home-surface .welcome-hero .home-welcome,
      html.prompt-home-surface #homeTierNote,
      html.prompt-home-surface .welcome-hero [data-home-redundant="1"]{display:none!important}
      html.prompt-home-surface .welcome-hero{padding-top:4px!important;padding-bottom:24px!important}
      html.prompt-home-surface .welcome-hero h1{
        position:relative!important;
        display:block!important;
        min-height:1.02em!important;
        margin-top:4px!important;
        font-size:0!important;
        line-height:1!important;
        color:transparent!important;
        overflow:visible!important;
      }
      html.prompt-home-surface .welcome-hero h1:after{
        content:attr(data-home-title);
        display:block;
        color:var(--ink)!important;
        font-family:Arial,Helvetica,sans-serif!important;
        font-size:clamp(42px,8vw,76px)!important;
        font-weight:800!important;
        line-height:.96!important;
        letter-spacing:-.058em!important;
      }

      @media(max-width:820px){
        html.prompt-home-surface.prompt-home-surface body>.topbar{
          height:64px!important;
          margin:8px 10px 0!important;
          padding:0 7px!important;
          grid-template-columns:minmax(0,1fr) auto!important;
          border:1px solid var(--ui-line,var(--line))!important;
          border-radius:15px!important;
          background:color-mix(in srgb,var(--ui-card,var(--surface,#fff)) 96%,transparent)!important;
          box-shadow:0 10px 30px rgba(29,38,48,.07)!important;
          top:6px!important;
        }
        html.prompt-home-surface.prompt-home-surface body>.topbar .brand{min-width:0!important;padding:0 7px!important}
        html.prompt-home-surface.prompt-home-surface body>.topbar .brand-mark{width:38px!important;height:38px!important}
        html.prompt-home-surface.prompt-home-surface body>.topbar .brand-copy strong{font-size:17px!important}
        html.prompt-home-surface.prompt-home-surface body>.topbar #upgradeBtn{display:none!important}
        html.prompt-home-surface.prompt-home-surface body>.topbar #topbarMenuToggle{width:44px!important;height:44px!important;margin:0!important}
        html.prompt-home-surface .welcome-page{padding-top:24px!important}
        html.prompt-home-surface .welcome-hero h1:after{font-size:clamp(43px,12vw,62px)!important}
      }
    `;document.head.appendChild(s)
  }

  function titleCase(value){return String(value||'').trim().replace(/[._-]+/g,' ').replace(/\b\p{L}/gu,m=>m.toUpperCase())}
  function firstName(value){const v=String(value||'').trim();if(!v)return '';return titleCase(v).split(/\s+/)[0]||''}
  function resolvedName(){
    const cloud=window.SiteBriefCloud||{},user=cloud.user||{},meta=user.user_metadata||{};
    const candidates=[
      $('#userDisplayName')?.value,
      window.PromptAiUserProfile?.displayName,window.PromptAiUserProfile?.display_name,
      cloud.userProfile?.displayName,cloud.userProfile?.display_name,
      cloud.profile?.displayName,cloud.profile?.display_name,
      meta.display_name,meta.full_name,meta.name
    ];
    for(const value of candidates){const name=firstName(value);if(name)return name}
    const email=String(user.email||'').trim();if(email){const name=firstName(email.split('@')[0]);if(name)return name}
    return ''
  }

  function homeVisible(){
    const page=$('#welcomePage'),workflow=$('#workflowApp');
    return Boolean(page&&!page.hidden&&getComputedStyle(page).display!=='none'&&(!workflow||workflow.hidden||getComputedStyle(workflow).display==='none'))
  }

  function normalizeHome(){
    const visible=homeVisible();document.documentElement.classList.toggle('prompt-home-surface',visible);if(!visible)return;
    if($('#workflowApp')?.hidden)document.documentElement.removeAttribute('data-clean-project-flow');
    const hero=$('.welcome-hero'),h1=$('h1',hero),kicker=$('.section-kicker',hero),name=resolvedName();if(!hero||!h1)return;
    if(kicker&&kicker.textContent!=='PROMPT.AI')kicker.textContent='PROMPT.AI';
    const desired=name?`Willkommen, ${name}.`:'Willkommen.';
    if(h1.dataset.homeTitle!==desired)h1.dataset.homeTitle=desired;
    if(h1.textContent!==desired)h1.textContent=desired;
    const intro=$('.home-intro-copy',hero);if(intro)intro.setAttribute('aria-hidden','true');
    const welcome=$('.home-welcome',hero);if(welcome)welcome.setAttribute('aria-hidden','true');
    const note=$('#homeTierNote');if(note)note.setAttribute('aria-hidden','true');
  }

  function ensureTopbar(){
    if(!homeVisible())return;const bar=$('body>.topbar')||$('.topbar');if(!bar)return;
    bar.hidden=false;bar.removeAttribute('hidden');bar.removeAttribute('aria-hidden');
    const brand=$('#brandHome'),toggle=$('#topbarMenuToggle');
    if(brand){brand.hidden=false;brand.removeAttribute('hidden');brand.removeAttribute('aria-hidden')}
    if(toggle){toggle.hidden=false;toggle.removeAttribute('hidden');toggle.removeAttribute('aria-hidden');toggle.setAttribute('aria-label','Menü öffnen');toggle.style.removeProperty('display')}
  }

  function settle(){styles();normalizeHome();ensureTopbar()}
  function schedule(){clearTimeout(timer);timer=setTimeout(settle,24)}
  function bind(){
    const page=$('#welcomePage'),workflow=$('#workflowApp');
    const observer=new MutationObserver(schedule);if(page)observer.observe(page,{attributes:true,attributeFilter:['hidden','class','style']});if(workflow)observer.observe(workflow,{attributes:true,attributeFilter:['hidden','class','style']});
    document.addEventListener('click',schedule,true);
    window.addEventListener('promptai:access',schedule);window.addEventListener('sitebrief:admin',schedule);window.addEventListener('pageshow',schedule);window.addEventListener('promptai:mode-handoff-complete',schedule);
    window.SiteBriefCloud?.subscribe?.(()=>schedule());$('#saveUserProfileBtn')?.addEventListener('click',()=>setTimeout(schedule,120));$('#userDisplayName')?.addEventListener('input',schedule,{passive:true});
  }
  function init(){styles();bind();settle();let count=0;const t=setInterval(()=>{settle();if(++count>24)clearInterval(t)},180)}
  styles();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
