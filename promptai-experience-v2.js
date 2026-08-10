(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  let settleTimer=0;

  function installStyles(){
    if($('#promptExperienceV2Styles'))return;
    const s=document.createElement('style');s.id='promptExperienceV2Styles';s.textContent=`
      :root{--prompt-v2-blue:#1689c7;--prompt-v2-blue-dark:#126a98;--prompt-v2-border:color-mix(in srgb,var(--ink) 13%,transparent)}
      *{-webkit-tap-highlight-color:transparent}
      html:not(.prompt-keyboard-focus) button:focus,html:not(.prompt-keyboard-focus) a:focus,html:not(.prompt-keyboard-focus) [role="button"]:focus,html:not(.prompt-keyboard-focus) input:focus,html:not(.prompt-keyboard-focus) textarea:focus,html:not(.prompt-keyboard-focus) select:focus{outline:none!important}
      html:not(.prompt-keyboard-focus) button:focus-visible,html:not(.prompt-keyboard-focus) a:focus-visible,html:not(.prompt-keyboard-focus) [role="button"]:focus-visible{outline:none!important;box-shadow:none!important}
      html.prompt-keyboard-focus button:focus-visible,html.prompt-keyboard-focus a:focus-visible,html.prompt-keyboard-focus [role="button"]:focus-visible{outline:2px solid var(--prompt-v2-blue)!important;outline-offset:3px!important}

      body.prompt-unified-ui .welcome-hero{padding-top:8px!important;padding-bottom:24px!important}
      body.prompt-unified-ui .welcome-hero .home-welcome{display:none!important}
      body.prompt-unified-ui .welcome-hero h1{margin-top:4px!important;max-width:900px!important;font-size:clamp(48px,10vw,88px)!important;line-height:.92!important;letter-spacing:-.065em!important}
      body.prompt-unified-ui .welcome-hero .home-intro-copy{margin-top:15px!important;font-size:14px!important;line-height:1.45!important;color:var(--muted)!important}

      body.prompt-unified-ui .welcome-quick-actions{gap:10px!important}
      body.prompt-unified-ui .welcome-quick-actions>button{min-height:82px!important;padding:17px 18px!important;border:1px solid var(--prompt-v2-border)!important;border-radius:14px!important;background:var(--ui-card,var(--surface))!important;color:var(--ink)!important;box-shadow:0 5px 16px rgba(18,28,38,.045)!important;transition:transform .14s ease,border-color .14s ease,box-shadow .14s ease,background .14s ease!important}
      body.prompt-unified-ui .welcome-quick-actions>button:hover:not(:disabled):not(.home-plan-locked){transform:translateY(-1px)!important;border-color:color-mix(in srgb,var(--prompt-v2-blue) 40%,var(--prompt-v2-border))!important;box-shadow:0 9px 24px rgba(18,28,38,.07)!important;background:color-mix(in srgb,var(--prompt-v2-blue) 2.5%,var(--ui-card,var(--surface)))!important}
      body.prompt-unified-ui #workspaceNewProjectBtn.home-primary,body.prompt-unified-ui #workspaceFreePromptBtn.home-primary{min-height:96px!important;background:var(--ui-card,var(--surface))!important;color:var(--ink)!important;border:1px solid var(--prompt-v2-border)!important;border-left:4px solid var(--prompt-v2-blue)!important;box-shadow:0 7px 20px rgba(18,28,38,.055)!important}
      body.prompt-unified-ui #workspaceNewProjectBtn.home-primary small,body.prompt-unified-ui #workspaceFreePromptBtn.home-primary small{color:var(--muted)!important}
      body.prompt-unified-ui .welcome-quick-actions .home-primary strong{font-size:clamp(21px,3vw,27px)!important;letter-spacing:-.025em!important}
      body.prompt-unified-ui #workspaceFreePromptBtn.home-primary:after{top:14px!important;right:14px!important;padding:4px 7px!important;border:1px solid color-mix(in srgb,var(--prompt-v2-blue) 20%,transparent)!important;border-radius:999px!important;background:color-mix(in srgb,var(--prompt-v2-blue) 7%,transparent)!important;color:var(--prompt-v2-blue-dark)!important}

      body.prompt-unified-ui .solid-btn:not(.danger-btn),body.prompt-unified-ui .outline-btn,body.prompt-unified-ui .upgrade-btn,.simple-intake-actions .solid-btn,.free-prompt-actions .solid-btn,.free-prompt-actions .outline-btn{min-height:46px!important;padding:0 17px!important;border-radius:12px!important;font-weight:760!important;letter-spacing:-.012em!important;box-shadow:none!important;transition:transform .12s ease,box-shadow .14s ease,background .14s ease,border-color .14s ease!important}
      body.prompt-unified-ui .solid-btn:not(.danger-btn),.simple-intake-actions .solid-btn,.free-prompt-actions .solid-btn{background:var(--prompt-v2-blue)!important;border-color:var(--prompt-v2-blue)!important;color:#fff!important;box-shadow:0 6px 16px color-mix(in srgb,var(--prompt-v2-blue) 20%,transparent)!important}
      body.prompt-unified-ui .solid-btn:hover:not(:disabled),.simple-intake-actions .solid-btn:hover:not(:disabled),.free-prompt-actions .solid-btn:hover:not(:disabled){background:var(--prompt-v2-blue-dark)!important;border-color:var(--prompt-v2-blue-dark)!important;box-shadow:0 8px 20px color-mix(in srgb,var(--prompt-v2-blue) 22%,transparent)!important}
      body.prompt-unified-ui .outline-btn,.free-prompt-actions .outline-btn{background:var(--ui-card,var(--surface))!important;border:1px solid var(--prompt-v2-border)!important;color:var(--ink)!important}
      body.prompt-unified-ui .solid-btn:active:not(:disabled),body.prompt-unified-ui .outline-btn:active:not(:disabled),.free-prompt-actions button:active:not(:disabled){transform:scale(.982)!important}

      .free-prompt-head{min-height:72px!important;padding:14px max(18px,calc((100vw - 920px)/2))!important;background:var(--paper)!important;backdrop-filter:none!important}
      .free-prompt-head h2{font-size:clamp(23px,4vw,32px)!important}.free-prompt-close{width:42px!important;height:42px!important;border-color:var(--prompt-v2-border)!important}
      .free-prompt-body{padding-top:22px!important}.free-prompt-intro{max-width:760px!important;margin-bottom:18px!important}
      .free-prompt-result-head{align-items:center!important}.free-prompt-result-head>.free-prompt-actions{margin-top:0!important}.free-prompt-output{border-radius:12px!important;border-color:var(--prompt-v2-border)!important;box-shadow:none!important}

      @media(max-width:820px){
        body.prompt-unified-ui .welcome-page{padding-top:16px!important}
        body.prompt-unified-ui .welcome-hero h1{font-size:clamp(47px,14vw,70px)!important}
        body.prompt-unified-ui #workspaceNewProjectBtn.home-primary,body.prompt-unified-ui #workspaceFreePromptBtn.home-primary{min-height:91px!important;padding:16px 17px!important}
        body.prompt-unified-ui .welcome-quick-actions .home-secondary{min-height:74px!important;padding:14px 16px!important}
        .free-prompt-head{padding:13px 14px!important}.free-prompt-head h2{font-size:24px!important}.free-prompt-result-head>.free-prompt-actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;margin-top:12px!important}.free-prompt-result-head>.free-prompt-actions button{width:100%!important}
      }
    `;document.head.appendChild(s)
  }

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
  function settle(){installStyles();normalizeHome();cleanFreeStatus()}
  function schedule(){clearTimeout(settleTimer);settleTimer=setTimeout(settle,20)}
  function bind(){
    document.addEventListener('pointerdown',()=>document.documentElement.classList.remove('prompt-keyboard-focus'),true);
    document.addEventListener('keydown',e=>{if(e.key==='Tab'||e.key.startsWith('Arrow'))document.documentElement.classList.add('prompt-keyboard-focus')},true);
    new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','open','class']});
    window.addEventListener('promptai:access',schedule);window.addEventListener('pageshow',schedule)
  }
  function init(){installStyles();bind();settle();let n=0;const timer=setInterval(()=>{settle();if(++n>28)clearInterval(timer)},180)}
  installStyles();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init()
})();
