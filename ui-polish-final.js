(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  let settleTimer=0;
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
      /* The frame is the visible card. The <dialog> box around it is transparent, but it still
         clips: a 1233px card inside a 1000px dialog (#legalDialog, #appActionDialog,
         #agentLaunchDialog) hung out on both sides and cut the text off. The box therefore gets at
         least the same room as the widest card it can hold. The three dialogs that paint their own
         background keep their own size. */
      body.prompt-unified-ui #legalDialog{width:min(var(--prompt-content),calc(100vw - 32px))!important;max-width:none!important}
      body.prompt-unified-ui #appActionDialog,body.prompt-unified-ui #agentLaunchDialog{width:min(900px,calc(100vw - 28px))!important;max-width:none!important}
      body.prompt-unified-ui dialog:not(#previewLightbox):not(#welcomeIntroDialog):not(#appActionDialog):not(.guest-gate) .dialog-frame{width:min(var(--prompt-content),100%,calc(100vw - 32px))!important;max-width:min(var(--prompt-content),100%)!important;margin:16px auto!important}
      body.prompt-unified-ui #adminDialog .dialog-frame{width:min(1380px,calc(100vw - 32px))!important;max-width:1380px!important}
      body.prompt-unified-ui #libraryDialog .dialog-frame,body.prompt-unified-ui #settingsDialog .dialog-frame,body.prompt-unified-ui #accountDialog:not(.guest-gate) .dialog-frame{width:min(1280px,calc(100vw - 32px))!important;max-width:1280px!important}
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

      .free-prompt-brief-card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:start;margin:0 0 18px;padding:14px 15px;border:1px solid var(--ui-line,var(--line));border-radius:12px;background:var(--ui-soft,var(--surface-soft))}.free-prompt-brief-card span{display:block;color:var(--ui-blue,var(--accent));font-size:8px;font-weight:850;letter-spacing:.1em}.free-prompt-brief-card p{margin:5px 0 0;color:var(--ink);font-size:12px;line-height:1.45;white-space:pre-wrap;overflow-wrap:anywhere}.free-prompt-brief-card button{align-self:center;white-space:nowrap}.free-description-collapsed{display:none!important}.free-prompt-upgrade small{font-size:9px!important}.free-prompt-intro{font-size:11px!important;line-height:1.45!important;margin-bottom:17px!important}

      .reference-note-block:empty,.reference-note-block:not(:has(p)):not(:has(small)){display:none!important}.empty-state:empty{display:none!important}
      body.prompt-unified-ui .dialog-head,body.prompt-unified-ui .free-prompt-head,body.prompt-unified-ui .project-preview-head{background:var(--ui-card,var(--surface))!important;backdrop-filter:none!important}
      body.prompt-unified-ui .dialog-frame,body.prompt-unified-ui .free-prompt-shell,body.prompt-unified-ui .project-preview-shell{background:var(--ui-card,var(--surface))!important}
      body.prompt-unified-ui .dialog-head h2,body.prompt-unified-ui .free-prompt-head h2,body.prompt-unified-ui .project-preview-head h2{overflow-wrap:anywhere}

      @media(max-width:820px){
        :root{--prompt-content:100vw}
        body.prompt-unified-ui .welcome-page{width:100%!important;max-width:none!important;padding-left:15px!important;padding-right:15px!important}
        html[data-clean-project-flow="1"] body.prompt-unified-ui .workspace{width:100%!important;max-width:none!important}
        body.prompt-unified-ui .topbar-menu{left:10px!important;right:10px!important;top:86px!important;bottom:auto!important;width:auto!important;max-height:calc(100dvh - 98px)!important;border-radius:16px!important}
        body.prompt-unified-ui dialog:not(#previewLightbox):not(#welcomeIntroDialog):not(#cookieBanner) .dialog-frame{width:100%!important;max-width:none!important;height:100%!important;max-height:none!important;margin:0!important;border:0!important;border-radius:0!important}
        .free-prompt-brief-card{grid-template-columns:1fr}.free-prompt-brief-card button{width:100%}
      }
      @media(prefers-reduced-motion:reduce){body.prompt-unified-ui .topbar-menu.open,body.prompt-unified-ui .topbar-menu[data-open="true"],body.prompt-unified-ui dialog[open] .dialog-frame,body.prompt-unified-ui .step-panel.active,body.prompt-unified-ui .library-pane.active,body.prompt-unified-ui .admin-pane.active,.free-prompt-result:not([hidden]){animation:none!important;transition:none!important}}
    `;document.head.appendChild(s);
  }

  function cleanHints(){
    setText($('.home-intro-copy'),'Wähle, was du erstellen möchtest.');
    setText($('#freePromptDialog .free-prompt-intro'),'Wähle jetzt Typ und Ziel-Tool. Weitere Angaben sind optional.');
    setText($('#freePromptUpgrade small'),'Pro ergänzt Zielgruppe, Referenzen, Stil, Pflichtpunkte, Verbote und Ausgabeformat.');
    $$('.reference-note-block').forEach(note=>{if(!(note.textContent||'').trim()&&!note.hidden)note.hidden=true});
  }

  function freeFlow(){
    const d=$('#freePromptDialog');if(!d)return;
    const headKicker=$('.free-prompt-head span',d),headTitle=$('.free-prompt-head h2',d);setText(headKicker,'EINSTELLUNGEN');setText(headTitle,'Prompt genauer einstellen');
    const desc=$('#freePromptDescription'),label=desc?.closest('label');if(!desc||!label)return;
    let card=$('#freePromptBriefCard');if(!card){card=document.createElement('section');card.id='freePromptBriefCard';card.className='free-prompt-brief-card';card.innerHTML='<div><span>DEINE BESCHREIBUNG</span><p id="freePromptBriefText"></p></div><button type="button" class="outline-btn mini" id="freePromptEditBrief">Text ändern</button>';const grid=$('.free-prompt-grid.free-prompt-main',d);grid?.insertAdjacentElement('beforebegin',card);$('#freePromptEditBrief',card).onclick=()=>{label.dataset.editing='1';label.classList.remove('free-description-collapsed');desc.focus();desc.scrollIntoView({behavior:'smooth',block:'center'})};desc.addEventListener('blur',()=>{delete label.dataset.editing;syncBriefCard()});desc.addEventListener('input',syncBriefCard,{passive:true})}
    syncBriefCard();
  }
  function syncBriefCard(){const desc=$('#freePromptDescription'),label=desc?.closest('label'),text=$('#freePromptBriefText');if(!desc||!label||!text)return;const value=desc.value.trim(),copy=value||'Noch keine Beschreibung übernommen.';setText(text,copy);if(label.dataset.editing==='1')return;label.classList.toggle('free-description-collapsed',value.length>=1)}

  function topDialogs(){
    $$('dialog[open]').forEach(d=>{const frame=d.querySelector('.dialog-frame,.free-prompt-shell,.project-mode-frame,.simple-intake-shell');if(frame&&matchMedia('(max-width:820px)').matches&&frame.scrollTop!==0)frame.scrollTop=0});
    const menu=$('#topbarMenu');if(menu&&(menu.classList.contains('open')||menu.dataset.open==='true')&&menu.scrollTop!==0)menu.scrollTop=0;
  }

  function settle(){styles();cleanHints();freeFlow();topDialogs()}
  function schedule(){clearTimeout(settleTimer);settleTimer=setTimeout(settle,24)}
  function bind(){document.addEventListener('click',()=>schedule(),true);window.addEventListener('promptai:access',schedule);window.addEventListener('sitebrief:admin',schedule);window.addEventListener('pageshow',schedule);new MutationObserver(schedule).observe(document.body,{childList:true})}
  function init(){styles();bind();settle();let n=0;const timer=setInterval(()=>{settle();if(++n>20)clearInterval(timer)},180)}
  styles();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
