(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  let timer=0,lastName='';

  function styles(){
    if($('#promptAiHomeFinalStyles'))return;
    const s=document.createElement('style');s.id='promptAiHomeFinalStyles';s.textContent=`
      /* Startseite: die globale Prompt.ai-Leiste muss immer sichtbar bleiben. */
      body.prompt-unified-ui>.topbar,body>.topbar{
        display:grid!important;
        visibility:visible!important;
        opacity:1!important;
        pointer-events:auto!important;
        position:sticky!important;
        top:8px!important;
        z-index:2147482500!important;
      }
      body.prompt-unified-ui>.topbar .brand,body>.topbar .brand{display:flex!important;visibility:visible!important;opacity:1!important}
      body.prompt-unified-ui>.topbar #topbarMenuToggle,body>.topbar #topbarMenuToggle{display:grid!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important}
      body.prompt-unified-ui>.topbar .top-actions,body>.topbar .top-actions{display:flex!important;visibility:visible!important;opacity:1!important}

      /* Die Startseite braucht unter der Begrüßung keinen zweiten Erklärungssatz. */
      body.prompt-unified-ui .welcome-hero .home-intro-copy{display:none!important}
      body.prompt-unified-ui #homeTierNote{display:none!important}
      body.prompt-unified-ui .welcome-hero [data-home-redundant="1"]{display:none!important}
      body.prompt-unified-ui .welcome-hero{padding-top:4px!important}
      body.prompt-unified-ui .welcome-hero h1{margin-top:4px!important}

      @media(max-width:820px){
        body.prompt-unified-ui>.topbar,body>.topbar{
          height:64px!important;
          margin:8px 10px 0!important;
          padding:0 7px!important;
          grid-template-columns:minmax(0,1fr) auto!important;
          border-radius:15px!important;
          top:6px!important;
        }
        body.prompt-unified-ui>.topbar .brand,body>.topbar .brand{min-width:0!important;padding:0 7px!important}
        body.prompt-unified-ui>.topbar .brand-mark,body>.topbar .brand-mark{width:38px!important;height:38px!important}
        body.prompt-unified-ui>.topbar .brand-copy strong,body>.topbar .brand-copy strong{font-size:17px!important}
        body.prompt-unified-ui>.topbar #upgradeBtn,body>.topbar #upgradeBtn{display:none!important}
        body.prompt-unified-ui>.topbar #topbarMenuToggle,body>.topbar #topbarMenuToggle{width:44px!important;height:44px!important;margin:0!important}
        body.prompt-unified-ui .welcome-page{padding-top:24px!important}
      }
    `;document.head.appendChild(s)
  }

  function titleCase(value){
    return String(value||'').trim().replace(/[._-]+/g,' ').replace(/\b\p{L}/gu,m=>m.toUpperCase());
  }

  function firstName(value){
    const v=String(value||'').trim();if(!v)return '';
    return titleCase(v).split(/\s+/)[0]||'';
  }

  function resolvedName(){
    const cloud=window.SiteBriefCloud||{},user=cloud.user||{},meta=user.user_metadata||{};
    const field=String($('#userDisplayName')?.value||'').trim();
    const candidates=[
      field,
      window.PromptAiUserProfile?.displayName,
      window.PromptAiUserProfile?.display_name,
      cloud.userProfile?.displayName,
      cloud.userProfile?.display_name,
      cloud.profile?.displayName,
      cloud.profile?.display_name,
      meta.display_name,
      meta.full_name,
      meta.name
    ];
    for(const value of candidates){const name=firstName(value);if(name)return name}
    const email=String(user.email||'').trim();
    if(email){const local=email.split('@')[0];const name=firstName(local);if(name)return name}
    return '';
  }

  function homeVisible(){const page=$('#welcomePage');return Boolean(page&&!page.hidden&&getComputedStyle(page).display!=='none')}

  function normalizeHome(){
    const hero=$('.welcome-hero');if(!hero)return;
    const h1=$('h1',hero),kicker=$('.section-kicker',hero),name=resolvedName();
    if(kicker)kicker.textContent='PROMPT.AI';
    const desired=name?`Willkommen, ${name}.`:'Willkommen.';
    if(h1&&h1.textContent!==desired)h1.textContent=desired;
    lastName=name;

    const intro=$('.home-intro-copy',hero);if(intro){intro.textContent='';intro.setAttribute('aria-hidden','true')}
    const note=$('#homeTierNote');if(note){note.textContent='';note.setAttribute('aria-hidden','true')}

    $$('*',hero).forEach(el=>{
      if(el===h1||el===kicker||el===intro)return;
      const text=(el.textContent||'').trim();
      if(/^Willkommen bei Prompt\.ai\.?$/i.test(text)||/^Wähle,? (?:unten )?(?:was du erstellen möchtest|deinen Arbeitsbereich)\.?$/i.test(text)){
        el.dataset.homeRedundant='1';el.setAttribute('aria-hidden','true');
      }
    });
  }

  function ensureTopbar(){
    const bar=$('.topbar');if(!bar)return;
    bar.hidden=false;bar.removeAttribute('aria-hidden');bar.style.removeProperty('display');
    const brand=$('#brandHome'),toggle=$('#topbarMenuToggle');
    if(brand){brand.hidden=false;brand.removeAttribute('aria-hidden')}
    if(toggle){toggle.hidden=false;toggle.removeAttribute('aria-hidden');toggle.setAttribute('aria-label','Menü öffnen')}
  }

  function settle(){styles();ensureTopbar();if(homeVisible())normalizeHome()}
  function schedule(){clearTimeout(timer);timer=setTimeout(settle,18)}

  function bind(){
    new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class','style','value']});
    window.addEventListener('promptai:access',schedule);
    window.addEventListener('pageshow',schedule);
    window.SiteBriefCloud?.subscribe?.(()=>schedule());
    $('#saveUserProfileBtn')?.addEventListener('click',()=>setTimeout(schedule,120));
    $('#userDisplayName')?.addEventListener('input',schedule,{passive:true});
  }

  function init(){styles();bind();settle();let count=0;const t=setInterval(()=>{settle();if(++count>45)clearInterval(t)},180)}
  styles();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
