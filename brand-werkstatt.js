(()=>{
  'use strict';
  // Werkstatt - die Designebene, die zuletzt läuft.
  //
  // Der Grund für eine eigene Datei: die Blautöne lagen bisher als feste Hexwerte in fünf
  // Stylesheets (--ui-blue, --prompt-blue, --prompt-v11-blue, --prompt-v2-blue, --upgrade). Eine
  // Farbe zu wechseln hieß, fünf Dateien anzufassen und eine zu vergessen. Hier steht die Palette
  // einmal, alle fünf Familien zeigen darauf - der nächste Farbwechsel ist eine Zeile.
  //
  // Der zweite Teil nimmt zurück, was die Oberfläche nach Standard-KI aussehen ließ: Milchglas mit
  // Weichzeichner, 14-22px Radien, weiche Schlagschatten unter jeder Karte, ein Anheben beim
  // Überfahren. Stattdessen: liniertes Papier, harte Kanten, Haarlinien statt Schatten, und der
  // Akzent als Bauteil (Randlinie, Unterstrich, Nummer) statt als Farbfläche.
  const $=(s,r=document)=>r.querySelector(s);
  const ID='promptBrandWerkstattStyles';

  // Jede Regel der Vorgängerebenen trägt !important, mit bis zu vier Klassen im Selektor
  // (z.B. `body.prompt-unified-ui .solid-btn:not(.upgrade-btn):not(.danger-btn)`). Bei !important
  // entscheidet zuerst die Spezifität und erst danach die Reihenfolge - zuletzt geladen zu sein
  // reicht also nicht. `&&` steht im CSS unten für einen Präfix mit sechs Klassenstufen; er wird
  // beim Einbau eingesetzt, damit die Regeln lesbar bleiben.
  const W='html:root body.prompt-unified-ui.prompt-unified-ui.prompt-unified-ui.prompt-unified-ui.prompt-unified-ui';

  const CSS=`
    /* ---- Palette: eine Quelle, fünf Abnehmer ---------------------------------------- */
    :root{
      --wk-blue:#2c4a5e;          /* Werkstatt - gewählt */
      --wk-blue-deep:#1d3140;     /* gedrückt / Hover */
      --wk-rust:#a9541b;          /* Tarifhinweise, Sperrschilder */
      --wk-paper:#edeae3;         /* Grund: warmes Zeichenpapier */
      --wk-sheet:#fbfaf6;         /* Karten: das Blatt darauf */
      --wk-ink:#20242a;           /* Graphit, leicht kühl */
      --wk-muted:#5e656b;
      --wk-line:#d2ccc0;
      --wk-grid:rgba(44,74,94,.045);

      --ui-blue:var(--wk-blue);--ui-blue-dark:var(--wk-blue-deep);
      --prompt-blue:var(--wk-blue);--prompt-blue-deep:var(--wk-blue-deep);
      --prompt-v11-blue:var(--wk-blue);--prompt-v11-blue-deep:var(--wk-blue-deep);
      --prompt-v2-blue:var(--wk-blue);--prompt-v2-blue-dark:var(--wk-blue-deep);
      --upgrade:var(--wk-rust);

      --accent:var(--wk-blue);
      --paper:var(--wk-paper);--paper-2:var(--wk-sheet);
      --ink:var(--wk-ink);--muted:var(--wk-muted);
      --line:var(--wk-line);--line-dark:#a79f90;
      --surface:var(--wk-sheet);--surface-soft:#e5e1d8;--surface-raised:#fffefb;--input:#fffefb;
      --ui-bg:var(--wk-paper);--ui-card:var(--wk-sheet);
      --ui-line:var(--wk-line);--ui-soft:#f2efe8;
      --ui-radius:6px;
      --ui-shadow:0 20px 44px rgba(28,36,44,.17);
      --glass:var(--wk-sheet);--glass-strong:#fdfcf9;--glass-line:var(--wk-line);--frost-shadow:none;
      --good:#3d6b4c;--warn:#8a6417;--danger:#963528;
      --scrim:rgba(26,30,34,.5);
    }
    html[data-theme="dark"]{
      --wk-blue:#89aec4;--wk-blue-deep:#a3c3d6;
      --wk-rust:#d38a4f;
      --wk-paper:#13171a;--wk-sheet:#1a2024;--wk-ink:#e7e5de;--wk-muted:#98a1a7;
      --wk-line:#2d353b;--wk-grid:rgba(137,174,196,.05);
      --surface-soft:#0f1316;--surface-raised:#212a2f;--input:#11171a;
      --ui-soft:#1f272b;--line-dark:#4a565d;
      --ui-shadow:0 22px 60px rgba(0,0,0,.5);--glass-strong:#1e2529;
      --good:#78a887;--warn:#cfa252;--danger:#d67f6d;--scrim:rgba(0,0,0,.7);
    }

    /* ---- Der Grund: liniertes Papier statt Farbverlauf ------------------------------- */
    html body,&&{
      background-color:var(--wk-paper)!important;
      background-image:
        linear-gradient(to right,var(--wk-grid) 1px,transparent 1px),
        linear-gradient(to bottom,var(--wk-grid) 1px,transparent 1px)!important;
      background-size:38px 38px!important;
      background-attachment:fixed!important;
    }
    ::selection{background:color-mix(in srgb,var(--wk-blue) 22%,transparent);color:var(--wk-ink)}

    /* ---- Kein Milchglas ------------------------------------------------------------- */
    && .topbar,&& .topbar-menu,&& .dialog-head,&& .progress-rail,&& .guide-panel,
    && .topbar-menu-backdrop:not([hidden]),&& .dialog-frame,&& .field input,&& .field textarea{
      backdrop-filter:none!important;-webkit-backdrop-filter:none!important;
    }
    && .topbar,html.prompt-home-surface.prompt-home-surface.prompt-home-surface body>.topbar{
      border-radius:7px!important;background:var(--wk-sheet)!important;
      box-shadow:none!important;border:1px solid var(--wk-line)!important;
    }
    && .topbar-menu{border-radius:7px!important;box-shadow:var(--ui-shadow)!important}
    && .topbar-menu>button:not([hidden]){border-radius:4px!important}
    && .topbar-menu:before{color:var(--wk-blue)!important;letter-spacing:.16em!important}
    && .brand-mark{border-radius:5px!important;background:var(--wk-paper)!important;box-shadow:none!important;border:1px solid var(--wk-line)!important}
    && .topbar-menu-toggle{border-radius:5px!important;background:var(--wk-sheet)!important}

    /* ---- Kanten statt Wölbung ------------------------------------------------------- */
    && .solid-btn,&& button.solid-btn,&& .outline-btn,&& .upgrade-btn,&& .theme-toggle,
    && .simple-intake-actions .solid-btn,&& .free-prompt-actions .solid-btn,
    && .free-prompt-actions .outline-btn,&& .sub-actions .danger-btn,&& .gate-primary-actions button{
      border-radius:4px!important;box-shadow:none!important;letter-spacing:0!important;
    }
    && .solid-btn:hover:not(:disabled),&& .outline-btn:hover:not(:disabled),
    && .upgrade-btn:hover:not(:disabled){transform:none!important;box-shadow:none!important}
    && .outline-btn:hover:not(:disabled){border-color:var(--wk-blue)!important;background:var(--ui-soft)!important}
    && .field input,&& .field select,&& .field textarea,&& .compact-field select,
    && input[type="text"],&& input[type="url"],&& input[type="email"],&& input[type="password"],
    && .simple-intake-field textarea,&& .free-prompt-output,&& .master-prompt{
      border-radius:4px!important;box-shadow:none!important;
    }
    && .field input:focus,&& .field select:focus,&& .field textarea:focus,
    && .simple-intake-field textarea:focus{
      border-color:var(--wk-blue)!important;box-shadow:inset 0 0 0 1px var(--wk-blue)!important;
    }

    /* ---- Karten: ein Blatt mit Haarlinie, kein schwebendes Element ------------------- */
    && .client-context-card,&& .project-profile-card,&& .ai-review-card,&& .account-tool-card,
    && .account-support-card,&& .auth-form-card,&& .auth-access-card,&& .plan-card,
    && .ai-connection-card,&& .admin-editor,&& .admin-offer-editor,&& .admin-user,
    && .admin-fold,&& .admin-quota-col,&& .quick-tier-block,&& .quick-accordion,
    && .revision-studio,&& .website-build-delivery,&& .client-result-card,&& .export-result-card,
    && .concept-option,&& .project-mode-card,&& .project-extras-row,&& .github-sandbox,
    && .admin-stats article,&& .guest-limit-box,&& .connection-login-row{
      border-radius:6px!important;box-shadow:none!important;
      background:var(--wk-sheet)!important;border:1px solid var(--wk-line)!important;
    }
    && .dialog-frame,&& .project-mode-frame,&& #welcomeIntroDialog,&& #welcomeIntroDialog>*,
    && #cookieBanner,&& #cookieBanner>*{border-radius:8px!important}
    && #welcomeIntroDialog,&& #cookieBanner{box-shadow:var(--ui-shadow)!important;border:1px solid var(--wk-line)!important;background:var(--wk-sheet)!important}
    && #welcomeIntroDialog::backdrop,&& #cookieBanner::backdrop{backdrop-filter:none!important}
    && .close-dialog,&& .dialog-back{border-radius:4px!important}
    && .dropzone{border-radius:5px!important}
    && .plan-card.recommended{box-shadow:inset 4px 0 0 var(--wk-blue)!important}

    /* Reiter bekommen einen Unterstrich statt einer Pillenfüllung - ein Register, keine App-Leiste. */
    && .library-tabs button,&& .admin-tabs button{
      border-radius:0!important;border:0!important;border-bottom:2px solid transparent!important;
      background:transparent!important;padding:0 11px!important;letter-spacing:.04em!important;
    }
    && .library-tabs button.active,&& .admin-tabs button.active{
      border-bottom-color:var(--wk-blue)!important;background:transparent!important;color:var(--wk-blue)!important;
    }

    /* ---- Der Akzent als Bauteil ------------------------------------------------------ */
    /* Jede Rubrik bekommt einen kurzen Strich davor - das Zeichen, das die Oberfläche zusammenhält. */
    && .section-kicker:not(:empty):before,&& .dialog-head>div>span:not(:empty):before,
    && .admin-section-head span:not(:empty):before,&& .gate-plans-kicker:not(:empty):before,
    && .auth-kicker:not(:empty):before,&& .auth-form-heading>span:not(:empty):before{
      content:'';display:inline-block;width:16px;height:2px;margin-right:8px;
      background:var(--wk-blue);vertical-align:.28em;
    }

    /* Überschriften: die extrem enge Sperrung war das Startup-Zeichen. Etwas Luft zurück. */
    && .welcome-hero h1,&& .dialog-head h2,&& .step-panel h1,&& .auth-hero h1,
    html.prompt-home-surface.prompt-home-surface.prompt-home-surface .welcome-hero h1:after{letter-spacing:-.028em!important}

    /* ---- Startkacheln: nummeriert wie Positionen auf einem Plan ---------------------- */
    && .welcome-quick-actions{counter-reset:wktile}
    && .welcome-quick-actions>button{
      counter-increment:wktile;border-radius:6px!important;box-shadow:none!important;
      border:1px solid var(--wk-line)!important;transition:border-color .14s ease,background .14s ease!important;
    }
    && .welcome-quick-actions>button:before{
      content:counter(wktile,decimal-leading-zero);position:absolute;right:12px;bottom:9px;
      color:var(--wk-blue);font-size:9px;font-weight:800;letter-spacing:.1em;opacity:.5;
      font-variant-numeric:tabular-nums;pointer-events:none;
    }
    && .welcome-quick-actions>button:hover:not(:disabled):not(.home-plan-locked){
      transform:none!important;box-shadow:none!important;
      border-color:var(--wk-blue)!important;background:var(--ui-soft)!important;
    }
    && #workspaceNewProjectBtn.home-primary,&& #workspaceFreePromptBtn.home-primary{
      border-left:4px solid var(--wk-blue)!important;box-shadow:none!important;background:var(--wk-sheet)!important;
    }
    && .home-plan-locked:after{
      border-radius:3px!important;border:1px solid color-mix(in srgb,var(--wk-rust) 45%,transparent)!important;
      background:transparent!important;color:var(--wk-rust)!important;
    }
    /* Gesperrte Kacheln waren mit opacity .46 und entsättigt auf dem hellen Papier kaum noch zu
       lesen. Wer nicht lesen kann, was er bekäme, kauft es auch nicht: der Text bleibt lesbar,
       das Schild sagt, was fehlt. */
    && .home-plan-locked{opacity:1!important;filter:none!important;background:transparent!important;border-style:dashed!important;color:var(--wk-muted)!important}
    && .home-plan-locked strong{color:var(--wk-muted)!important}
    @media(max-width:720px){&& .welcome-quick-actions>button:before{display:none}}

    /* ---- Eingangsseite: das Erste, was ein Besucher sieht ---------------------------- */
    /* Die Bildmarke selbst bleibt unverändert - nur ihr Rahmen hört auf zu schweben. */
    && .auth-brand img{border-radius:5px!important;box-shadow:none!important;border:1px solid var(--wk-line)!important;background:var(--wk-paper)!important;padding:3px!important}
    && .account-dialog.guest-gate::backdrop,&& dialog.guest-gate::backdrop{backdrop-filter:none!important;background:var(--wk-paper)!important}
    && .gate-guest-btn{
      border-radius:4px!important;box-shadow:none!important;
      background:var(--wk-blue)!important;border-color:var(--wk-blue)!important;
    }
    && .gate-plans-pick{
      border-radius:6px!important;background:var(--wk-sheet)!important;
      border:1px solid var(--wk-line)!important;border-left:4px solid var(--wk-blue)!important;
    }
    && .gate-plans-pick:hover{transform:none!important;background:var(--ui-soft)!important;border-color:var(--wk-line)!important;border-left-color:var(--wk-blue)!important}
    && .gate-plans-tiers i{border-radius:3px!important;border-color:var(--wk-line)!important}

    /* ---- Fortschritt und Zustände ---------------------------------------------------- */
    && .task-progress-track,&& .build-progress-track{border-radius:0!important;height:6px!important}
    && .task-progress-track i,&& .build-progress-track i{border-radius:0!important}
    && .connection-status,&& .sync-state,&& .admin-pill,&& .aspect-chip{border-radius:3px!important}
    && .generating-spinner{border-radius:0!important;border-top-color:var(--wk-blue)!important}

    /* Der Fokusring bleibt sichtbar, wird aber eckig - er soll zum Rest passen. */
    html.prompt-keyboard-focus body button:focus-visible,
    html.prompt-keyboard-focus body a:focus-visible,
    html.prompt-keyboard-focus body [role="button"]:focus-visible,
    html.prompt-keyboard-focus body input:focus-visible,
    html.prompt-keyboard-focus body select:focus-visible,
    html.prompt-keyboard-focus body textarea:focus-visible{
      outline:2px solid var(--wk-blue)!important;outline-offset:2px!important;
    }

    && .prompt-footer{background:var(--wk-paper)!important;border-top-color:var(--wk-line)!important}

    @media(prefers-reduced-motion:reduce){
      && .welcome-quick-actions>button{transition:none!important}
    }
  `;

  // Die Ebene muss die letzte im Kopf bleiben. Andere Skripte hängen ihre <style>-Blöcke teils
  // verzögert an (Admin, Vorschau, Bibliothek werden erst beim Öffnen geladen); ohne Nachrücken
  // stünden deren Regeln später und würden bei gleicher Spezifität gewinnen.
  function install(){
    let node=$('#'+ID);
    if(!node){node=document.createElement('style');node.id=ID;node.textContent=CSS.split('&&').join(W)}
    if(document.head.lastElementChild!==node)document.head.appendChild(node);
  }
  install();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  new MutationObserver(install).observe(document.head,{childList:true});
  window.PromptAiBrand={blue:'#2c4a5e',name:'Werkstatt',reapply:install};
})();
