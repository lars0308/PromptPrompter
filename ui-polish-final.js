(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  let settleTimer=0,freeStartedAt=0,freeReleaseTimer=0;
  const paid=()=>{const a=window.PromptAiAccess||{};return Boolean(a.isAdmin||a.plan==='pro'||a.plan==='ultimate')};
  const setText=(node,value)=>{if(node&&node.textContent!==value)node.textContent=value};

  function styles(){
    if($('#promptFinalPolishStyles'))return;
    const s=document.createElement('style');s.id='promptFinalPolishStyles';s.textContent=`
      :root{--prompt-motion:240ms;--prompt-ease:cubic-bezier(.22,.72,.24,1);--prompt-content:1240px}
      *,*:before,*:after{box-sizing:border-box}
      body.prompt-unified-ui{overflow-x:hidden!important}
      body.prompt-unified-ui .welcome-page{width:min(var(--prompt-content),calc(100vw - 32px))!important;max-width:var(--prompt-content)!important}
      html[data-clean-project-flow="1"] body.prompt-unified-ui #workflowApp{width:100%!important;max-width:none!important}
      html[data-clean-project-flow="1"] body.prompt-unified-ui .workspace{width:min(var(--prompt-content),calc(100vw - 32px))!important;max-width:var(--prompt-content)!important}
      body.prompt-unified-ui dialog:not(#previewLightbox):not(#welcomeIntroDialog) .dialog-frame{width:min(var(--prompt-content),calc(100vw - 32px))!important;max-width:var(--prompt-content)!important;margin:16px auto!important}
      body.prompt-unified-ui #adminDialog .dialog-frame{width:min(1380px,calc(100vw - 32px))!important;max-width:1380px!important}
      body.prompt-unified-ui #libraryDialog .dialog-frame,body.prompt-unified-ui #settingsDialog .dialog-frame,body.prompt-unified-ui #accountDialog .dialog-frame{width:min(1280px,calc(100vw - 32px))!important;max-width:1280px!important}
      .free-prompt-body{width:min(var(--prompt-content),100%)!important}.project-preview-body{width:min(1320px,100%)!important}#quickRevisionDialog .quick-revision-body{width:min(var(--prompt-content),100%)!important}

      body.prompt-unified-ui .solid-btn:not(.upgrade-btn):not(.danger-btn),body.prompt-unified-ui button.solid-btn:not(.upgrade-btn):not(.danger-btn){background:var(--ui-blue,#1689c7)!important;border-color:var(--ui-blue,#1689c7)!important;color:#fff!important;border-radius:9px!important;box-shadow:none!important}
      body.prompt-unified-ui .outline-btn{background:var(--ui-card,var(--surface))!important;border-color:var(--ui-line,var(--line))!important;color:var(--ink)!important;border-radius:9px!important;box-shadow:none!important}
      body.prompt-unified-ui .upgrade-btn,body.prompt-unified-ui #upgradeBtn,body.prompt-unified-ui #upgradeMenuBtn{background:var(--upgrade,#e9781f)!important;border-color:var(--upgrade,#e9781f)!important;color:var(--upgrade-ink,#fff)!important}
      body.prompt-unified-ui .field input,body.prompt-unified-ui .field select,body.prompt-unified-ui .field textarea,body.prompt-unified-ui .compact-field select{border-radius:9px!important;box-shadow:none!important}
      body.prompt-unified-ui .library-item,body.prompt-unified-ui .admin-user,body.prompt-unified-ui .admin-editor,body.prompt-unified-ui .admin-offer-editor,body.prompt-unified-ui .settings-section,body.prompt-unified-ui .account-tool-card,body.prompt-unified-ui .account-support-card,body.prompt-unified-ui .account-profile-settings{box-shadow:none!important}
      body.prompt-unified-ui .library-pane,body.prompt-unified-ui .settings-body,body.prompt-unified-ui .account-body,body.prompt-unified-ui .admin-body{width:100%!important;max-width:none!important}

      body.prompt-unified-ui .topbar-menu{top:88px!important;bottom:auto!important;background:var(--ui-card,var(--surface))!important;backdrop-filter:none!important;overflow:auto!important;overscroll-behavior:contain!important}
      body.prompt-unified-ui .topbar-menu.open,body.prompt-unified-ui .topbar-menu[data-open="true"]{animation:promptMenuIn var(--prompt-motion) var(--prompt-ease) both!important}
      body.prompt-unified-ui .topbar-menu-backdrop:not([hidden]){background:rgba(14,19,24,.34)!important;backdrop-filter:blur(8px)!important;animation:promptBackdropIn 180ms ease both!important}
      body.prompt-unified-ui dialog[open]:not(#previewLightbox):not(#welcomeIntroDialog) .dialog-frame,.free-prompt-dialog[open] .free-prompt-shell,.project-mode-dialog[open] .project-mode-frame,.simple-intake-dialog[open] .simple-intake-shell{animation:promptSurfaceIn var(--prompt-motion) var(--prompt-ease) both!important}
      body.prompt-unified-ui .step-panel.active,body.prompt-unified-ui .library-pane.active,body.prompt-unified-ui .admin-pane.active,.free-prompt-result:not([hidden]){animation:promptContentIn var(--prompt-motion) var(--prompt-ease) both!important}
      @keyframes promptMenuIn{from{opacity:0;transform:translateY(-8px) scale(.992)}to{opacity:1;transform:none}}
      @keyframes promptBackdropIn{from{opacity:0}to{opacity:1}}
      @keyframes promptSurfaceIn{from{opacity:0;transform:translateY(8px) scale(.994)}to{opacity:1;transform:none}}
      @keyframes promptContentIn{from{opacity:.18;transform:translateY(7px)}to{opacity:1;transform:none}}

      .free-prompt-brief-card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:start;margin:0 0 18px;padding:14px 15px;border:1px solid var(--ui-line,var(--line));border-radius:12px;background:var(--ui-soft,var(--surface-soft))}.free-prompt-brief-card span{display:block;color:var(--ui-blue,var(--accent));font-size:8px;font-weight:850;letter-spacing:.1em}.free-prompt-brief-card p{margin:5px 0 0;color:var(--ink);font-size:12px;line-height:1.45;white-space:pre-wrap;overflow-wrap:anywhere}.free-prompt-brief-card button{align-self:center;white-space:nowrap}.free-description-collapsed{display:none!important}.free-prompt-advanced.tier-locked{display:block!important;opacity:.62}.free-prompt-advanced.tier-locked input,.free-prompt-advanced.tier-locked textarea,.free-prompt-advanced.tier-locked select{cursor:not-allowed!important}.free-tier-lock-copy{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 12px;padding:10px 12px;border:1px solid color-mix(in srgb,var(--upgrade,#e9781f) 28%,var(--ui-line,var(--line)));border-radius:10px;background:color-mix(in srgb,var(--upgrade,#e9781f) 4%,var(--ui-card,var(--surface)));font-size:9px;color:var(--muted)}.free-tier-lock-copy b{color:var(--upgrade,#e9781f);font-size:8px;letter-spacing:.08em}.free-prompt-upgrade small{font-size:9px!important}.free-prompt-intro{font-size:11px!important;line-height:1.45!important;margin-bottom:17px!important}
      .free-prompt-generation-stage{position:absolute;z-index:30;inset:0;display:none;place-items:center;padding:24px;background:var(--paper);text-align:center}.free-prompt-generation-stage.show{display:grid;animation:promptContentIn 180ms ease both}.free-prompt-generation-stage>div{width:min(460px,100%)}.free-prompt-generation-stage span{display:block;color:var(--ui-blue,var(--accent));font-size:9px;font-weight:850;letter-spacing:.11em}.free-prompt-generation-stage strong{display:block;margin-top:8px;font-size:clamp(28px,6vw,42px);letter-spacing:-.045em}.free-prompt-generation-stage small{display:block;max-width:420px;margin:9px auto 0;color:var(--muted);font-size:11px;line-height:1.45}.free-prompt-generation-stage i{display:block;width:130px;height:3px;margin:22px auto 0;overflow:hidden;border-radius:99px;background:var(--ui-line,var(--line))}.free-prompt-generation-stage i:after{content:'';display:block;width:40%;height:100%;background:var(--ui-blue,var(--accent));animation:promptFreeTrack 1s ease-in-out infinite}@keyframes promptFreeTrack{from{transform:translateX(-120%)}to{transform:translateX(330%)}}.free-prompt-result.result-held{visibility:hidden!important;opacity:0!important}

      .reference-note-block:empty,.reference-note-block:not(:has(p)):not(:has(small)){display:none!important}.empty-state:empty{display:none!important}
      body.prompt-unified-ui .dialog-head,body.prompt-unified-ui .free-prompt-head,body.prompt-unified-ui .project-preview-head{background:var(--ui-card,var(--surface))!important;backdrop-filter:none!important}
      body.prompt-unified-ui .dialog-frame,body.prompt-unified-ui .free-prompt-shell,body.prompt-unified-ui .project-preview-shell{background:var(--ui-card,var(--surface))!important}
      body.prompt-unified-ui .dialog-head h2,body.prompt-unified-ui .free-prompt-head h2,body.prompt-unified-ui .project-preview-head h2{overflow-wrap:anywhere}

      @media(max-width:820px){
        :root{--prompt-content:100vw}
        body.prompt-unified-ui .welcome-page{width:100%!important;max-width:none!important;padding-left:15px!important;padding-right:15px!important}
        html[data-clean-project-flow="1"] body.prompt-unified-ui .workspace{width:100%!important;max-width:none!important}
        body.prompt-unified-ui .topbar-menu{left:10px!important;right:10px!important;top:86px!important;bottom:auto!important;width:auto!important;max-height:calc(100dvh - 98px)!important;border-radius:16px!important}
        body.prompt-unified-ui dialog:not(#previewLightbox):not(#welcomeIntroDialog) .dialog-frame{width:100%!important;max-width:none!important;height:100%!important;max-height:none!important;margin:0!important;border:0!important;border-radius:0!important}
        .free-prompt-brief-card{grid-template-columns:1fr}.free-prompt-brief-card button{width:100%}
        .free-tier-lock-copy{align-items:flex-start;flex-direction:column}
      }
      @media(prefers-reduced-motion:reduce){body.prompt-unified-ui .topbar-menu.open,body.prompt-unified-ui .topbar-menu[data-open="true"],body.prompt-unified-ui dialog[open] .dialog-frame,body.prompt-unified-ui .step-panel.active,body.prompt-unified-ui .library-pane.active,body.prompt-unified-ui .admin-pane.active,.free-prompt-result:not([hidden]),.free-prompt-generation-stage.show{animation:none!important;transition:none!important}}
    `;document.head.appendChild(s);
  }

  function cleanHints(){
    setText($('.home-intro-copy'),'Wähle, was du erstellen möchtest.');
    setText($('#stepReferences .guided-clean-lead'),'Optional: Link, Screenshot, PDF oder andere Unterlage hinzufügen.');
    setText($('#freePromptDialog .free-prompt-intro'),'Wähle jetzt Typ und Ziel-Tool. Weitere Angaben sind optional.');
    setText($('#freePromptUpgrade small'),'Pro ergänzt Zielgruppe, Referenzen, Stil, Pflichtpunkte, Verbote und Ausgabeformat.');
    setText($('#accountIntro'),'Anmelden, um Projekte und Einstellungen zu synchronisieren.');
    $$('.reference-note-block').forEach(note=>{if(!(note.textContent||'').trim()&&!note.hidden)note.hidden=true});
  }

  function freeFlow(){
    const d=$('#freePromptDialog');if(!d)return;
    const headKicker=$('.free-prompt-head span',d),headTitle=$('.free-prompt-head h2',d);setText(headKicker,'SCHRITT 2 · EINSTELLUNGEN');setText(headTitle,'Prompt genauer einstellen');
    const desc=$('#freePromptDescription'),label=desc?.closest('label');if(!desc||!label)return;
    let card=$('#freePromptBriefCard');if(!card){card=document.createElement('section');card.id='freePromptBriefCard';card.className='free-prompt-brief-card';card.innerHTML='<div><span>DEINE BESCHREIBUNG</span><p id="freePromptBriefText"></p></div><button type="button" class="outline-btn mini" id="freePromptEditBrief">Text ändern</button>';const grid=$('.free-prompt-grid.free-prompt-main',d);grid?.insertAdjacentElement('beforebegin',card);$('#freePromptEditBrief',card).onclick=()=>{label.dataset.editing='1';label.classList.remove('free-description-collapsed');desc.focus();desc.scrollIntoView({behavior:'smooth',block:'center'})};desc.addEventListener('blur',()=>{delete label.dataset.editing;syncBriefCard()});desc.addEventListener('input',syncBriefCard,{passive:true})}
    syncBriefCard();
    const advanced=$('#freePromptAdvanced');if(advanced){if(advanced.hidden)advanced.hidden=false;advanced.classList.toggle('tier-locked',!paid());$$('input,textarea,select',advanced).forEach(x=>{const next=!paid();if(x.disabled!==next)x.disabled=next});let lock=$('#freeTierLockCopy');if(!paid()){if(!lock){lock=document.createElement('div');lock.id='freeTierLockCopy';lock.className='free-tier-lock-copy';lock.innerHTML='<b>PRO</b><span>Diese Felder sind sichtbar, aber in Free gesperrt.</span>';advanced.insertBefore(lock,advanced.firstChild)}}else lock?.remove()}
  }
  function syncBriefCard(){const desc=$('#freePromptDescription'),label=desc?.closest('label'),text=$('#freePromptBriefText');if(!desc||!label||!text)return;const value=desc.value.trim(),copy=value||'Noch keine Beschreibung übernommen.';setText(text,copy);if(label.dataset.editing==='1')return;label.classList.toggle('free-description-collapsed',value.length>=1)}

  function ensureFreeStage(){const shell=$('#freePromptDialog .free-prompt-shell');if(!shell)return null;let stage=$('#freePromptGenerationStage');if(stage)return stage;stage=document.createElement('div');stage.id='freePromptGenerationStage';stage.className='free-prompt-generation-stage';stage.innerHTML='<div><span>PROMPT.AI</span><strong>Dein Prompt entsteht</strong><small>Rolle, Ziel, Tool und deine Angaben werden zu einem individuellen Arbeitsauftrag zusammengeführt.</small><i></i></div>';shell.style.position='relative';shell.appendChild(stage);return stage}
  function startFreeGeneration(){const desc=$('#freePromptDescription')?.value.trim()||'';if(desc.length<12)return;const stage=ensureFreeStage();if(!stage)return;clearTimeout(freeReleaseTimer);freeStartedAt=Date.now();stage.classList.add('show');$('#freePromptResult')?.classList.add('result-held')}
  function finishFreeGeneration(error=false){const stage=$('#freePromptGenerationStage');if(!stage?.classList.contains('show'))return;const elapsed=Date.now()-freeStartedAt,min=error?450:3000,wait=Math.max(0,min-elapsed);clearTimeout(freeReleaseTimer);freeReleaseTimer=setTimeout(()=>{stage.classList.remove('show');const result=$('#freePromptResult');result?.classList.remove('result-held');if(!error&&!result?.hidden)setTimeout(()=>result.scrollIntoView({behavior:'smooth',block:'start'}),70)},wait)}
  function watchFreeState(){const status=$('#freePromptStatus'),result=$('#freePromptResult');if(status&&!status.__finalObserved){status.__finalObserved=true;new MutationObserver(()=>{if(status.classList.contains('error'))finishFreeGeneration(true);else if(status.classList.contains('good'))finishFreeGeneration(false)}).observe(status,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})}if(result&&!result.__finalObserved){result.__finalObserved=true;new MutationObserver(()=>{if(!result.hidden)finishFreeGeneration(false)}).observe(result,{attributes:true,attributeFilter:['hidden']})}}

  function topDialogs(){
    $$('dialog[open]').forEach(d=>{const frame=d.querySelector('.dialog-frame,.free-prompt-shell,.project-mode-frame,.simple-intake-shell');if(frame&&matchMedia('(max-width:820px)').matches&&frame.scrollTop!==0)frame.scrollTop=0});
    const menu=$('#topbarMenu');if(menu&&(menu.classList.contains('open')||menu.dataset.open==='true')&&menu.scrollTop!==0)menu.scrollTop=0;
  }

  function settle(){styles();cleanHints();freeFlow();watchFreeState();topDialogs()}
  function schedule(){clearTimeout(settleTimer);settleTimer=setTimeout(settle,24)}
  function bind(){document.addEventListener('click',e=>{if(e.target.closest?.('#freePromptGenerate'))startFreeGeneration();schedule()},true);window.addEventListener('promptai:access',schedule);window.addEventListener('sitebrief:admin',schedule);window.addEventListener('pageshow',schedule);new MutationObserver(schedule).observe(document.body,{childList:true})}
  function init(){styles();bind();settle();let n=0;const timer=setInterval(()=>{settle();if(++n>20)clearInterval(timer)},180)}
  styles();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
