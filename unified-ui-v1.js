(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];

  function installStyles(){
    if($('#promptUnifiedUiStyles'))return;
    const s=document.createElement('style');
    s.id='promptUnifiedUiStyles';
    s.textContent=`
      :root{--ui-blue:#1689c7;--ui-blue-dark:#106fa4;--ui-bg:#f3f5f6;--ui-card:var(--surface,#fff);--ui-line:color-mix(in srgb,var(--ink) 14%,transparent);--ui-soft:color-mix(in srgb,var(--ink) 4%,var(--surface,#fff));--ui-radius:18px;--ui-shadow:0 22px 65px rgba(29,38,48,.10)}
      html[data-theme="dark"]{--ui-bg:var(--paper);--ui-card:var(--surface);--ui-line:var(--line);--ui-soft:var(--surface-soft);--ui-shadow:0 24px 70px rgba(0,0,0,.32)}
      body.prompt-unified-ui{background:var(--ui-bg)!important}
      body.prompt-unified-ui *{scrollbar-width:thin;scrollbar-color:color-mix(in srgb,var(--muted) 45%,transparent) transparent}
      body.prompt-unified-ui .section-kicker,body.prompt-unified-ui .dialog-head>div>span,body.prompt-unified-ui .settings-heading>span,body.prompt-unified-ui .admin-section-head span,body.prompt-unified-ui .selection-head span,body.prompt-unified-ui .block-title>span{color:var(--ui-blue)!important;font-weight:850!important;letter-spacing:.1em!important}

      /* Global top navigation */
      body.prompt-unified-ui .topbar{height:72px!important;margin:10px 12px 0!important;padding:0 8px!important;grid-template-columns:minmax(0,1fr) auto!important;border:1px solid var(--ui-line)!important;border-radius:18px!important;background:color-mix(in srgb,var(--ui-card) 94%,transparent)!important;box-shadow:0 12px 34px rgba(29,38,48,.08)!important;backdrop-filter:blur(18px)!important}
      body.prompt-unified-ui .brand{min-width:0;height:100%!important;padding:0 12px!important;border:0!important;gap:10px!important}
      body.prompt-unified-ui .brand-mark{width:42px!important;height:42px!important;border:0!important;border-radius:12px!important;background:#f7fafc!important;box-shadow:0 6px 18px rgba(29,38,48,.08)!important}
      body.prompt-unified-ui .brand-mark img{width:34px!important;height:34px!important}
      body.prompt-unified-ui .brand-copy strong{font-size:18px!important}.brand-copy small{display:none!important}
      body.prompt-unified-ui .top-actions{padding:0!important;gap:7px!important}
      body.prompt-unified-ui .engine-state,body.prompt-unified-ui .sync-state{display:none!important}
      body.prompt-unified-ui .topbar-menu-toggle{display:grid!important;width:48px!important;height:48px!important;place-items:center;border:1px solid var(--ui-line)!important;border-radius:13px!important;background:var(--ui-card)!important}
      body.prompt-unified-ui .topbar-menu-toggle i{display:grid!important;gap:5px!important}.topbar-menu-toggle i b{display:block!important;width:23px!important;height:2px!important;border-radius:5px!important;background:var(--ink)!important}
      body.prompt-unified-ui .upgrade-btn{min-height:42px!important;border-radius:11px!important;background:var(--ui-blue)!important;border-color:var(--ui-blue)!important;box-shadow:none!important}
      body.prompt-unified-ui .topbar-menu{position:fixed!important;z-index:220!important;right:16px!important;top:90px!important;display:none!important;width:min(360px,calc(100vw - 32px))!important;padding:12px!important;border:1px solid var(--ui-line)!important;border-radius:18px!important;background:var(--ui-card)!important;box-shadow:var(--ui-shadow)!important;overflow:auto!important}
      body.prompt-unified-ui .topbar-menu.open,body.prompt-unified-ui .topbar-menu[data-open="true"]{display:grid!important;gap:5px!important}
      body.prompt-unified-ui .topbar-menu:before{content:'MENÜ';display:block;padding:7px 9px 9px;color:var(--ui-blue);font-size:9px;font-weight:850;letter-spacing:.11em}
      /* :not([hidden]) is required. The hidden attribute only carries the user-agent's
         display:none, so an unconditional display:flex!important here republished every gated
         entry - Verwaltung, Projekte, Abonnement, App installieren and Abmelden were all visible
         to guests even though the app had explicitly hidden them. */
      body.prompt-unified-ui .topbar-menu>[hidden]{display:none!important}
      body.prompt-unified-ui .topbar-menu>button:not([hidden]){display:flex!important;min-height:48px!important;width:100%!important;align-items:center!important;justify-content:flex-start!important;padding:0 13px!important;border:0!important;border-radius:10px!important;background:transparent!important;color:var(--ink)!important;text-decoration:none!important;font-size:13px!important;font-weight:700!important;text-align:left!important}
      body.prompt-unified-ui .topbar-menu>button:not([hidden]):hover{background:var(--ui-soft)!important;transform:none!important;box-shadow:none!important}
      body.prompt-unified-ui .topbar-menu .theme-toggle{border:0!important;box-shadow:none!important}.topbar-menu .theme-toggle span{margin-right:4px}
      body.prompt-unified-ui .topbar-menu-backdrop:not([hidden]){position:fixed!important;display:block!important;z-index:210!important;inset:0!important;background:rgba(15,20,25,.24)!important;backdrop-filter:blur(3px)!important}

      /* Home */
      body.prompt-unified-ui .welcome-page{width:min(920px,calc(100vw - 28px))!important;max-width:920px!important;margin:0 auto!important;padding:clamp(34px,6vw,72px) 0 70px!important}
      body.prompt-unified-ui .welcome-hero{display:block!important;padding:0 4px 30px!important;border:0!important}
      body.prompt-unified-ui .welcome-hero h1{font-family:Arial,Helvetica,sans-serif!important;font-weight:800!important;letter-spacing:-.055em!important;color:var(--ink)!important}
      body.prompt-unified-ui .welcome-workspace{padding:0!important}
      body.prompt-unified-ui .welcome-quick-actions>button{border-radius:16px!important;box-shadow:none!important;transition:border-color .18s ease,transform .18s ease!important}
      body.prompt-unified-ui .welcome-quick-actions>button:hover:not(:disabled):not(.home-plan-locked){transform:translateY(-1px)!important;border-color:color-mix(in srgb,var(--ui-blue) 55%,var(--ui-line))!important}

      /* Shared dialogs and sub pages */
      body.prompt-unified-ui dialog:not(#previewLightbox):not(#welcomeIntroDialog):not(#cookieBanner){border:0!important;background:transparent!important;color:var(--ink)!important;padding:0!important}
      body.prompt-unified-ui dialog:not(#previewLightbox):not(#welcomeIntroDialog)::backdrop{background:rgba(18,24,29,.40)!important;backdrop-filter:blur(8px)!important}
      body.prompt-unified-ui dialog:not(#previewLightbox):not(#welcomeIntroDialog):not(#adminDialog):not(#libraryDialog):not(#settingsDialog):not(#profileDialog):not(#clarificationDialog):not(#subscriptionOverviewDialog):not(#accountDialog):not(#plansDialog):not(#legalDialog) .dialog-frame{width:min(900px,calc(100vw - 28px))!important;max-width:900px!important;max-height:calc(100dvh - 28px)!important;margin:auto!important;border:1px solid var(--ui-line)!important;border-radius:22px!important;background:var(--ui-card)!important;box-shadow:var(--ui-shadow)!important;overflow-y:auto!important;overflow-x:hidden!important}
      body.prompt-unified-ui .dialog-head{position:sticky!important;z-index:7!important;top:0!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:15px!important;padding:18px 22px!important;border-bottom:1px solid var(--ui-line)!important;background:color-mix(in srgb,var(--ui-card) 96%,transparent)!important;backdrop-filter:blur(16px)!important}
      body.prompt-unified-ui .dialog-head>div>span{display:block!important;font-size:9px!important}.dialog-head h2{margin:5px 0 0!important;font-family:Arial,Helvetica,sans-serif!important;font-size:clamp(23px,4vw,34px)!important;font-weight:800!important;line-height:1.05!important;letter-spacing:-.04em!important}
      body.prompt-unified-ui .close-dialog,body.prompt-unified-ui .dialog-back{flex:0 0 auto!important;min-width:42px!important;height:42px!important;border:1px solid var(--ui-line)!important;border-radius:50%!important;background:var(--ui-card)!important;color:var(--ink)!important;display:grid!important;place-items:center!important;text-decoration:none!important}
      body.prompt-unified-ui .dialog-back{width:auto!important;padding:0 13px!important;border-radius:999px!important;font-size:10px!important}
      body.prompt-unified-ui .settings-body,body.prompt-unified-ui .account-body,body.prompt-unified-ui .library-pane,body.prompt-unified-ui .library-tools,body.prompt-unified-ui .quick-revision-body,body.prompt-unified-ui .admin-body,body.prompt-unified-ui .clarification-body{padding-left:22px!important;padding-right:22px!important}
      body.prompt-unified-ui .settings-body,body.prompt-unified-ui .account-body,body.prompt-unified-ui .quick-revision-body,body.prompt-unified-ui .admin-body{padding-bottom:30px!important}

      /* Inputs and action hierarchy */
      body.prompt-unified-ui .field{gap:8px!important;margin-bottom:16px!important}.field>span,.compact-field>span{font-size:9px!important;color:color-mix(in srgb,var(--ink) 72%,var(--muted))!important;letter-spacing:.07em!important}
      body.prompt-unified-ui .field input,body.prompt-unified-ui .field select,body.prompt-unified-ui .field textarea,body.prompt-unified-ui .compact-field select,body.prompt-unified-ui input[type="text"],body.prompt-unified-ui input[type="url"],body.prompt-unified-ui input[type="email"],body.prompt-unified-ui input[type="password"]{border:1px solid var(--ui-line)!important;border-radius:9px!important;background:var(--input,var(--ui-card))!important;box-shadow:none!important}
      body.prompt-unified-ui .field input,body.prompt-unified-ui .field select{min-height:48px!important}
      body.prompt-unified-ui .field textarea{padding:14px!important;line-height:1.5!important}
      body.prompt-unified-ui .field input:focus,body.prompt-unified-ui .field select:focus,body.prompt-unified-ui .field textarea:focus{border-color:var(--ui-blue)!important;box-shadow:0 0 0 3px color-mix(in srgb,var(--ui-blue) 12%,transparent)!important}
      body.prompt-unified-ui .solid-btn{min-height:46px!important;padding:0 17px!important;border:1px solid var(--ui-blue)!important;border-radius:9px!important;background:var(--ui-blue)!important;color:#fff!important;box-shadow:none!important}
      body.prompt-unified-ui .solid-btn:hover{background:var(--ui-blue-dark)!important;transform:none!important;box-shadow:none!important}
      body.prompt-unified-ui .outline-btn{min-height:46px!important;padding:0 17px!important;border:1px solid var(--ui-line)!important;border-radius:9px!important;background:var(--ui-card)!important;color:var(--ink)!important;box-shadow:none!important}
      body.prompt-unified-ui .outline-btn:hover{border-color:color-mix(in srgb,var(--ui-blue) 55%,var(--ui-line))!important;background:var(--ui-soft)!important;color:var(--ink)!important;transform:none!important;box-shadow:none!important}
      body.prompt-unified-ui .text-btn{min-height:38px!important;padding:0 5px!important;color:var(--muted)!important;text-decoration:none!important;font-weight:700!important}

      /* Cards, accordions, lists */
      body.prompt-unified-ui .client-context-card,body.prompt-unified-ui .project-profile-card,body.prompt-unified-ui .ai-review-card,body.prompt-unified-ui .account-tool-card,body.prompt-unified-ui .account-support-card,body.prompt-unified-ui .auth-form-card,body.prompt-unified-ui .auth-access-card,body.prompt-unified-ui .plan-card,body.prompt-unified-ui .ai-connection-card,body.prompt-unified-ui .admin-editor,body.prompt-unified-ui .admin-offer-editor,body.prompt-unified-ui .admin-user,body.prompt-unified-ui .quick-tier-block,body.prompt-unified-ui .revision-studio,body.prompt-unified-ui .website-build-delivery{border:1px solid var(--ui-line)!important;border-radius:14px!important;background:var(--ui-card)!important;box-shadow:none!important}
      body.prompt-unified-ui .selection-head,body.prompt-unified-ui .block-title,body.prompt-unified-ui .blueprint,body.prompt-unified-ui .controls-strip{border-color:var(--ui-line)!important}
      body.prompt-unified-ui .selection-row,body.prompt-unified-ui .library-item,body.prompt-unified-ui .reference-item,body.prompt-unified-ui .toggle-row,body.prompt-unified-ui .check-row{border-color:var(--ui-line)!important}
      body.prompt-unified-ui .dropzone{border:1px dashed color-mix(in srgb,var(--ui-blue) 42%,var(--ui-line))!important;border-radius:11px!important;background:var(--ui-soft)!important}
      body.prompt-unified-ui details>summary{cursor:pointer!important}

      /* Tabs and menus inside sub pages */
      body.prompt-unified-ui .library-tabs,body.prompt-unified-ui .admin-tabs{position:sticky!important;z-index:6!important;top:0!important;display:flex!important;gap:6px!important;padding:11px 18px!important;border-bottom:1px solid var(--ui-line)!important;background:var(--ui-card)!important;overflow-x:auto!important}
      body.prompt-unified-ui .library-tabs button,body.prompt-unified-ui .admin-tabs button{flex:0 0 auto!important;min-height:38px!important;padding:0 13px!important;border:1px solid transparent!important;border-radius:999px!important;background:transparent!important;color:var(--muted)!important;font-size:10px!important;font-weight:750!important;white-space:nowrap!important}
      body.prompt-unified-ui .library-tabs button.active,body.prompt-unified-ui .admin-tabs button.active{border-color:color-mix(in srgb,var(--ui-blue) 25%,var(--ui-line))!important;background:color-mix(in srgb,var(--ui-blue) 8%,var(--ui-card))!important;color:var(--ui-blue)!important}
      body.prompt-unified-ui .library-tools{display:flex!important;gap:8px!important;flex-wrap:wrap!important;padding-top:14px!important;padding-bottom:14px!important;border-bottom:1px solid var(--ui-line)!important}

      /* Settings */
      body.prompt-unified-ui .settings-section{padding:24px 0!important;border-color:var(--ui-line)!important}.settings-heading{grid-template-columns:1fr!important;gap:5px!important;margin-bottom:16px!important}.settings-heading strong{font-family:Arial,Helvetica,sans-serif!important;font-size:22px!important;font-weight:800!important;letter-spacing:-.03em!important}.settings-heading p{max-width:70ch!important;font-size:11px!important;line-height:1.55!important}
      body.prompt-unified-ui .ai-connection-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}.ai-connection-card{padding:16px!important}

      /* Account and plans */
      body.prompt-unified-ui .auth-layout{gap:12px!important}.auth-hero h1{font-family:Arial,Helvetica,sans-serif!important;font-weight:800!important;letter-spacing:-.05em!important}.auth-form-card,.auth-access-card{padding:18px!important}
      body.prompt-unified-ui .plans-grid{gap:10px!important}.plan-card-summary{min-height:76px!important;padding:15px 17px!important}.plan-card-detail{padding:17px!important}.plan-card.recommended{border-color:color-mix(in srgb,var(--ui-blue) 48%,var(--ui-line))!important;box-shadow:inset 3px 0 0 var(--ui-blue)!important}

      /* Admin */
      body.prompt-unified-ui .admin-stats{gap:9px!important}.admin-stats article{border:1px solid var(--ui-line)!important;border-radius:12px!important;background:var(--ui-soft)!important;box-shadow:none!important}.admin-section-head h3{font-family:Arial,Helvetica,sans-serif!important;font-size:23px!important;font-weight:800!important;letter-spacing:-.03em!important}.admin-user{padding:15px!important}

      /* Free Prompt + quick tools */
      body.prompt-unified-ui #freePromptDialog .dialog-frame,body.prompt-unified-ui .free-prompt-dialog .dialog-frame{width:min(820px,calc(100vw - 28px))!important}
      body.prompt-unified-ui .quick-revision-dialog .dialog-frame{width:min(840px,calc(100vw - 28px))!important}
      body.prompt-unified-ui .quick-upgrade-note,body.prompt-unified-ui .free-workflow-upgrade{border-color:color-mix(in srgb,var(--upgrade,#e9781f) 32%,var(--ui-line))!important;border-radius:11px!important;background:color-mix(in srgb,var(--upgrade,#e9781f) 4%,var(--ui-card))!important;box-shadow:none!important}

      /* Expert mode keeps every control, but receives same visual language */
      html[data-prompt-mode="expert"] body.prompt-unified-ui #workflowApp{gap:12px!important;padding:12px!important}
      html[data-prompt-mode="expert"] body.prompt-unified-ui .progress-rail,html[data-prompt-mode="expert"] body.prompt-unified-ui .guide-panel{border:1px solid var(--ui-line)!important;border-radius:16px!important;background:var(--ui-card)!important;box-shadow:none!important}
      html[data-prompt-mode="expert"] body.prompt-unified-ui .workspace{padding:38px clamp(18px,4vw,52px) 80px!important;border:1px solid var(--ui-line)!important;border-radius:18px!important;background:var(--ui-card)!important}
      html[data-prompt-mode="expert"] body.prompt-unified-ui .step-panel h1{font-family:Arial,Helvetica,sans-serif!important;font-weight:800!important;letter-spacing:-.05em!important}
      html[data-prompt-mode="expert"] body.prompt-unified-ui .step-nav{border-radius:9px!important}.step-nav.active{box-shadow:inset 3px 0 0 var(--ui-blue)!important}

      /* Simple intake and mode choice should look like the same product */
      body.prompt-unified-ui .simple-intake-dialog{background:var(--ui-bg)!important}.simple-intake-shell{background:var(--ui-bg)!important}.simple-intake-head{background:var(--ui-card)!important;border-color:var(--ui-line)!important}.simple-intake-body{width:min(780px,100%)!important}.simple-intake-body h2{font-family:Arial,Helvetica,sans-serif!important;font-weight:800!important}.simple-intake-field textarea{border:1px solid var(--ui-line)!important;border-radius:12px!important;background:var(--ui-card)!important;box-shadow:none!important}.simple-intake-field textarea:focus{border-color:var(--ui-blue)!important;box-shadow:0 0 0 3px color-mix(in srgb,var(--ui-blue) 12%,transparent)!important}
      body.prompt-unified-ui .project-mode-dialog{background:transparent!important}.project-mode-frame{border:1px solid var(--ui-line)!important;border-radius:22px!important;background:var(--ui-card)!important;box-shadow:var(--ui-shadow)!important}.project-mode-card{border:1px solid var(--ui-line)!important;border-radius:13px!important;background:var(--ui-card)!important;box-shadow:none!important}.project-mode-card:hover:not(:disabled){border-color:var(--ui-blue)!important;transform:none!important}.project-mode-head h2{font-family:Arial,Helvetica,sans-serif!important;font-weight:800!important}.project-mode-head span,.project-mode-card i{color:var(--ui-blue)!important}

      @media(max-width:820px){
        /* .upgrade-btn was unscoped here, so it hid every upgrade button on small screens - not
           just the topbar one that moves into the menu, but also the "Tarife ansehen" button in
           the login card. Scoped to the topbar. */
        body.prompt-unified-ui .topbar{height:70px!important;margin:8px 10px 0!important}.brand-copy strong{font-size:17px!important}body.prompt-unified-ui .topbar .upgrade-btn{display:none!important}
        body.prompt-unified-ui .topbar-menu{right:10px!important;left:10px!important;top:auto!important;bottom:10px!important;width:auto!important;max-height:min(72dvh,620px)!important;border-radius:20px!important;padding:12px 12px calc(12px + env(safe-area-inset-bottom))!important}
        body.prompt-unified-ui .topbar-menu>button{min-height:52px!important;font-size:14px!important}
        body.prompt-unified-ui .welcome-page{width:100%!important;padding:32px 15px 45px!important}.welcome-hero{padding-left:4px!important;padding-right:4px!important}.welcome-hero h1{font-size:43px!important}
        body.prompt-unified-ui dialog:not(#previewLightbox):not(#welcomeIntroDialog){width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;margin:0!important}
        body.prompt-unified-ui dialog:not(#previewLightbox):not(#welcomeIntroDialog) .dialog-frame{width:100%!important;max-width:none!important;height:100%!important;max-height:none!important;border:0!important;border-radius:0!important;box-shadow:none!important}
        body.prompt-unified-ui .dialog-head{padding:14px 15px!important}.dialog-head h2{font-size:25px!important}
        body.prompt-unified-ui .settings-body,body.prompt-unified-ui .account-body,body.prompt-unified-ui .library-pane,body.prompt-unified-ui .library-tools,body.prompt-unified-ui .quick-revision-body,body.prompt-unified-ui .admin-body,body.prompt-unified-ui .clarification-body{padding-left:15px!important;padding-right:15px!important}
        body.prompt-unified-ui .library-tabs,body.prompt-unified-ui .admin-tabs{padding-left:12px!important;padding-right:12px!important}
        body.prompt-unified-ui .ai-connection-grid{grid-template-columns:1fr!important}
        /* Four full-width stat cards filled the phone screen before the first real content. Two per
           row says the same in half the height. */
        body.prompt-unified-ui .admin-stats{grid-template-columns:repeat(2,minmax(0,1fr))!important}
        body.prompt-unified-ui .admin-stats article{padding:14px!important}
        body.prompt-unified-ui .admin-stats strong{font-size:23px!important}
        body.prompt-unified-ui .field-grid.two,body.prompt-unified-ui .field-grid.three{grid-template-columns:1fr!important}
        body.prompt-unified-ui .project-mode-dialog{width:100vw!important;height:100dvh!important}.project-mode-frame{min-height:100dvh!important;border:0!important;border-radius:0!important;padding:24px 15px 36px!important}
        body.prompt-unified-ui .project-mode-grid{grid-template-columns:1fr!important}
        html[data-prompt-mode="expert"] body.prompt-unified-ui #workflowApp{padding:0!important;display:block!important}.progress-rail,.guide-panel{display:none!important}html[data-prompt-mode="expert"] body.prompt-unified-ui .workspace{width:100%!important;max-width:none!important;border:0!important;border-radius:0!important;padding:28px 15px 60px!important}
      }
      @media(max-width:430px){
        body.prompt-unified-ui .brand{padding-left:8px!important}.brand-mark{width:40px!important;height:40px!important}.topbar-menu-toggle{width:46px!important;height:46px!important}
        body.prompt-unified-ui .welcome-hero h1{font-size:39px!important}.home-intro-copy{font-size:14px!important}
        body.prompt-unified-ui .dialog-head{gap:8px!important}.dialog-head h2{font-size:22px!important}.close-dialog{width:40px!important;height:40px!important;min-width:40px!important}
      }
    `;
    document.head.appendChild(s);
  }

  function decorateDialogs(root=document){
    $$('dialog',root).forEach(d=>{
      if(d.id==='previewLightbox'||d.id==='welcomeIntroDialog')return;
      d.classList.add('prompt-unified-dialog');
      d.querySelector('.dialog-frame')?.classList.add('prompt-unified-frame');
    });
  }

  function improveMenu(){
    const menu=$('#topbarMenu');if(!menu)return;
    menu.setAttribute('aria-label','Prompt.ai Menü');
    menu.setAttribute('role','menu');
    $$(':scope > button',menu).forEach(b=>b.setAttribute('role','menuitem'));
  }

  function init(){
    installStyles();
    document.body.classList.add('prompt-unified-ui');
    decorateDialogs();
    improveMenu();
    new MutationObserver(records=>{
      for(const record of records)for(const node of record.addedNodes)if(node?.nodeType===1){if(node.matches?.('dialog'))decorateDialogs(node.parentElement||document);else if(node.querySelector?.('dialog'))decorateDialogs(node)}
    }).observe(document.body,{childList:true,subtree:true});
  }

  installStyles();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
