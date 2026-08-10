(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  let thinkingStartedAt=0,thinkingMinMs=0,thinkingDone=false,thinkingTimer=0,waitingTimer=0;

  function styles(){
    if($('#promptExperienceV1Styles'))return;
    const s=document.createElement('style');s.id='promptExperienceV1Styles';s.textContent=`
      :root{--prompt-v11-blue:#1689c7;--prompt-v11-blue-deep:#0f6f9f;--prompt-v11-line:color-mix(in srgb,var(--ink) 14%,transparent)}
      button,a,[role="button"],summary{-webkit-tap-highlight-color:transparent}
      button:focus:not(:focus-visible),a:focus:not(:focus-visible),[role="button"]:focus:not(:focus-visible),summary:focus:not(:focus-visible){outline:none!important;box-shadow:none!important}
      button:focus-visible,a:focus-visible,[role="button"]:focus-visible,summary:focus-visible{outline:2px solid var(--prompt-v11-blue)!important;outline-offset:3px!important}
      body.prompt-unified-ui .topbar{display:grid!important;position:sticky!important;top:8px!important;z-index:190!important}
      body.prompt-unified-ui .solid-btn:not(.danger-btn),body.prompt-unified-ui .outline-btn,body.prompt-unified-ui .upgrade-btn{border-radius:13px!important;font-weight:750!important;letter-spacing:-.01em!important;transition:transform .14s ease,border-color .14s ease,background .14s ease!important}
      body.prompt-unified-ui .solid-btn:active:not(:disabled),body.prompt-unified-ui .outline-btn:active:not(:disabled),body.prompt-unified-ui .upgrade-btn:active:not(:disabled){transform:scale(.985)!important}

      body.prompt-unified-ui .welcome-page{padding-top:30px!important}
      body.prompt-unified-ui .welcome-hero{padding-bottom:24px!important}
      body.prompt-unified-ui .welcome-hero .section-kicker{margin-bottom:10px!important}
      body.prompt-unified-ui .welcome-hero h1{max-width:900px!important;font-size:clamp(42px,8vw,76px)!important;line-height:.96!important;letter-spacing:-.058em!important}
      body.prompt-unified-ui .home-intro-copy{max-width:620px!important;margin:16px 0 0!important;font-size:15px!important;line-height:1.5!important}
      body.prompt-unified-ui .welcome-quick-actions{gap:11px!important}
      body.prompt-unified-ui .welcome-quick-actions>button{min-height:92px!important;padding:18px 20px!important;border:1px solid var(--prompt-v11-line)!important;border-radius:17px!important;background:var(--ui-card,var(--surface))!important;color:var(--ink)!important;box-shadow:0 7px 20px rgba(26,35,44,.045)!important;transform:none!important}
      body.prompt-unified-ui .welcome-quick-actions>button:hover:not(:disabled):not(.home-plan-locked){background:color-mix(in srgb,var(--prompt-v11-blue) 3%,var(--ui-card,var(--surface)))!important;border-color:color-mix(in srgb,var(--prompt-v11-blue) 36%,var(--prompt-v11-line))!important;transform:translateY(-1px)!important}
      body.prompt-unified-ui .welcome-quick-actions>button:focus:not(:focus-visible){border-color:var(--prompt-v11-line)!important}
      body.prompt-unified-ui #workspaceNewProjectBtn.home-primary,body.prompt-unified-ui #workspaceFreePromptBtn.home-primary{min-height:108px!important;background:var(--ui-card,var(--surface))!important;color:var(--ink)!important;border-color:color-mix(in srgb,var(--prompt-v11-blue) 23%,var(--prompt-v11-line))!important;box-shadow:inset 4px 0 0 var(--prompt-v11-blue),0 8px 24px rgba(26,35,44,.05)!important}
      body.prompt-unified-ui #workspaceNewProjectBtn.home-primary small{color:var(--muted)!important}
      body.prompt-unified-ui .welcome-quick-actions .home-primary strong{font-size:clamp(21px,3vw,27px)!important}
      body.prompt-unified-ui .welcome-quick-actions .home-secondary strong{font-size:18px!important}
      body.prompt-unified-ui .welcome-quick-actions>button small{font-size:12px!important;line-height:1.4!important}
      body.prompt-unified-ui #workspaceFreePromptBtn.home-primary:after{top:15px!important;right:16px!important;padding:4px 7px!important;border-radius:999px!important;background:color-mix(in srgb,var(--prompt-v11-blue) 8%,transparent)!important}

      .free-prompt-shell,.simple-intake-shell{position:relative}

      #freePromptGenerationStage{display:none!important}
      .prompt-thinking-stage{position:absolute;z-index:75;inset:0;display:none;place-items:center;padding:30px 22px;background:var(--paper);color:var(--ink);text-align:center}.prompt-thinking-stage.show{display:grid}.prompt-thinking-stage>div{width:min(570px,100%)}.prompt-thinking-stage .kicker{display:block;color:var(--prompt-v11-blue);font-size:9px;font-weight:850;letter-spacing:.12em}.prompt-thinking-stage strong{display:block;margin-top:8px;font-size:clamp(31px,7vw,48px);line-height:1;letter-spacing:-.05em}.prompt-thinking-copy{margin:23px auto 0;text-align:left;display:grid;gap:13px;max-width:520px}.prompt-thinking-line{position:relative;font-size:clamp(15px,2.8vw,18px);font-weight:650;line-height:1.45;color:var(--ink)}.prompt-thinking-line .fill{position:absolute;inset:0;color:var(--prompt-v11-blue);clip-path:inset(0 100% 0 0);pointer-events:none}.prompt-thinking-stage.running .prompt-thinking-line .fill{animation:promptThinkingFill var(--line-duration) linear var(--line-delay) forwards}@keyframes promptThinkingFill{to{clip-path:inset(0 0 0 0)}}.prompt-thinking-wait{min-height:18px;margin-top:22px;color:var(--muted);font-size:10px;opacity:0;transition:opacity .25s ease}.prompt-thinking-wait.show{opacity:1}.prompt-thinking-stage.error .prompt-thinking-wait{color:var(--danger);opacity:1}
      #freePromptDialog.prompt-ai-thinking-active .free-prompt-result{visibility:hidden!important}

      @media(max-width:820px){
        body.prompt-unified-ui .topbar{height:64px!important;margin:8px 10px 0!important;border-radius:15px!important;top:6px!important}
        body.prompt-unified-ui .brand{padding:0 8px!important}.brand-mark{width:38px!important;height:38px!important}.brand-copy strong{font-size:17px!important}
        body.prompt-unified-ui #upgradeBtn{display:none!important}
        body.prompt-unified-ui .topbar-menu-toggle{width:44px!important;height:44px!important;border-radius:11px!important}
        body.prompt-unified-ui .welcome-page{padding:25px 15px 56px!important}
        body.prompt-unified-ui .welcome-hero h1{font-size:clamp(43px,12vw,62px)!important}
        body.prompt-unified-ui .welcome-quick-actions{grid-template-columns:1fr!important}
        body.prompt-unified-ui #workspaceNewProjectBtn.home-primary,body.prompt-unified-ui #workspaceFreePromptBtn.home-primary{min-height:96px!important;padding:17px 18px!important}
        body.prompt-unified-ui .welcome-quick-actions .home-secondary{min-height:78px!important;padding:15px 17px!important}
        .prompt-thinking-stage{padding:26px 18px}.prompt-thinking-copy{gap:12px;margin-top:21px}
      }
      @media(prefers-reduced-motion:reduce){.prompt-thinking-stage.running .prompt-thinking-line .fill{animation:none!important;clip-path:inset(0 0 0 0)!important}}
    `;document.head.appendChild(s);
  }

  function titleCase(value){return String(value||'').trim().replace(/[._-]+/g,' ').replace(/\b\p{L}/gu,m=>m.toUpperCase())}
  function displayName(){
    const cloud=window.SiteBriefCloud||{},u=cloud.user||{},meta=u.user_metadata||{};
    const candidates=[cloud.profile?.display_name,cloud.userProfile?.display_name,window.PromptAiUserProfile?.display_name,$('#userDisplayName')?.value,meta.display_name,meta.full_name,meta.name];
    for(const c of candidates){const v=String(c||'').trim();if(v)return v.split(/\s+/)[0]}
    const email=String(u.email||'').trim();if(email){const local=email.split('@')[0];const clean=titleCase(local);if(clean)return clean.split(/\s+/)[0]}
    return '';
  }

  function home(){
    const hero=$('.welcome-hero');if(!hero)return;
    const kicker=hero.querySelector('.section-kicker'),h1=hero.querySelector('h1');
    if(kicker)kicker.textContent='PROMPT.AI';
    const name=displayName();if(h1)h1.textContent=name?`Willkommen, ${name}`:'Willkommen.';
    let intro=$('.home-intro-copy',hero);if(!intro){intro=document.createElement('p');intro.className='home-intro-copy';hero.firstElementChild?.appendChild(intro)}
    if(intro)intro.textContent='Wähle unten deinen Arbeitsbereich.';
    $$('*',hero).forEach(el=>{if(el!==h1&&el!==kicker&&el!==intro&&/^Willkommen zurück\.?$/i.test((el.textContent||'').trim()))el.hidden=true});
  }

  function thinkingText(){
    return [
      'Ich ordne deine Angaben und erkenne das eigentliche Ziel.',
      'Ich formuliere deine Beschreibung fachlich sauber und eindeutig.',
      'Ich setze passende Regeln für Qualität, Sicherheit und Recht.',
      'Ich baue daraus den Prompt für dein gewähltes Tool.'
    ];
  }
  function totalInputLength(){return ['freePromptDescription','freePromptGoal','freePromptAudience','freePromptContext','freePromptStyle','freePromptMust','freePromptAvoid','freePromptFormat','freePromptConstraints'].map(id=>String($(`#${id}`)?.value||'')).join(' ').trim().length}
  function durationFor(len){if(len<=120)return Math.round(3200+len*9);if(len<=420)return Math.round(4280+(len-120)*11);return Math.min(12000,Math.round(7580+(len-420)*6))}
  function ensureThinking(){
    const shell=$('#freePromptDialog .free-prompt-shell');if(!shell)return null;let stage=$('#promptAiThinkingStage');if(stage)return stage;
    stage=document.createElement('section');stage.id='promptAiThinkingStage';stage.className='prompt-thinking-stage';stage.setAttribute('aria-live','polite');stage.innerHTML='<div><span class="kicker">PROMPT.AI</span><strong>Dein Prompt entsteht</strong><div class="prompt-thinking-copy"></div><div class="prompt-thinking-wait">Letzter Feinschliff …</div></div>';shell.appendChild(stage);return stage;
  }
  function startThinking(){
    const desc=String($('#freePromptDescription')?.value||'').trim();if(desc.length<12)return;
    const stage=ensureThinking();if(!stage)return;
    clearTimeout(thinkingTimer);clearTimeout(waitingTimer);thinkingDone=false;thinkingStartedAt=Date.now();thinkingMinMs=durationFor(totalInputLength());
    const lines=thinkingText(),copy=$('.prompt-thinking-copy',stage);copy.innerHTML='';const weights=[.23,.26,.25,.26];let elapsed=0;
    lines.forEach((text,i)=>{const row=document.createElement('div');row.className='prompt-thinking-line';const d=Math.max(650,Math.round(thinkingMinMs*weights[i])),delay=Math.round(elapsed);row.style.setProperty('--line-duration',`${d}ms`);row.style.setProperty('--line-delay',`${delay}ms`);row.innerHTML=`<span>${text}</span><span class="fill" aria-hidden="true">${text}</span>`;copy.appendChild(row);elapsed+=d});
    $('.prompt-thinking-wait',stage)?.classList.remove('show');stage.classList.remove('error','running');stage.classList.add('show');$('#freePromptDialog')?.classList.add('prompt-ai-thinking-active');void stage.offsetWidth;stage.classList.add('running');
    waitingTimer=setTimeout(()=>{if(!thinkingDone)$('.prompt-thinking-wait',stage)?.classList.add('show')},thinkingMinMs+250);
  }
  function releaseThinking(error=false){
    const stage=$('#promptAiThinkingStage');if(!stage?.classList.contains('show'))return;thinkingDone=true;clearTimeout(waitingTimer);
    if(error){stage.classList.add('error');const wait=$('.prompt-thinking-wait',stage);if(wait){wait.textContent='Der Prompt konnte nicht fertiggestellt werden.';wait.classList.add('show')}}
    const elapsed=Date.now()-thinkingStartedAt,wait=error?Math.max(0,550-elapsed):Math.max(0,thinkingMinMs-elapsed);clearTimeout(thinkingTimer);thinkingTimer=setTimeout(()=>{stage.classList.remove('show','running','error');$('#freePromptDialog')?.classList.remove('prompt-ai-thinking-active');const w=$('.prompt-thinking-wait',stage);if(w){w.textContent='Letzter Feinschliff …';w.classList.remove('show')}if(!error&&!$('#freePromptResult')?.hidden)setTimeout(()=>$('#freePromptResult')?.scrollIntoView({behavior:'smooth',block:'start'}),60)},wait);
  }
  function watchGeneration(){
    const status=$('#freePromptStatus');if(status&&!status.__promptExperienceWatch){status.__promptExperienceWatch=true;new MutationObserver(()=>{if(status.classList.contains('error'))releaseThinking(true);else if(status.classList.contains('good'))releaseThinking(false)}).observe(status,{attributes:true,attributeFilter:['class'],childList:true,subtree:true})}
    const result=$('#freePromptResult');if(result&&!result.__promptExperienceWatch){result.__promptExperienceWatch=true;new MutationObserver(()=>{if(!result.hidden)releaseThinking(false)}).observe(result,{attributes:true,attributeFilter:['hidden']})}
  }

  function bind(){
    if(document.documentElement.dataset.promptExperienceBound==='1')return;document.documentElement.dataset.promptExperienceBound='1';
    document.addEventListener('click',e=>{if(e.target.closest?.('#freePromptGenerate'))startThinking();setTimeout(()=>{home();watchGeneration()},0)},true);
    window.addEventListener('promptai:access',()=>setTimeout(home,0));window.addEventListener('pageshow',()=>setTimeout(home,0));
  }
  function settle(){styles();home();watchGeneration()}
  function init(){settle();bind();let n=0;const t=setInterval(()=>{settle();if(++n>20)clearInterval(t)},180)}
  styles();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
