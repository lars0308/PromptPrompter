(()=>{
  'use strict';
  const $=(selector,root=document)=>root?.querySelector?.(selector)||null;
  let settleTimer=0;
  window.PromptAiHomeFinalLock=true;

  const icons={
    website:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M3.8 12h16.4M12 3.5c2.2 2.4 3.4 5.2 3.4 8.5S14.2 18.1 12 20.5C9.8 18.1 8.6 15.3 8.6 12S9.8 5.9 12 3.5Z"/></svg>',
    prompt:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 17.5-.5 3 3-.5L18.8 8.7a2.1 2.1 0 0 0-3-3L5 17.5Z"/><path d="m13.9 7.7 2.4 2.4"/></svg>',
    revision:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6.1 8.4A7.5 7.5 0 0 1 18.7 7L20 9M4 15l1.3 2A7.5 7.5 0 0 0 18 15.6"/></svg>',
    folder:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 7.5h6l2-2h9v13h-17z"/></svg>',
    shield:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 19 6v5.2c0 4.3-2.6 7.5-7 9.3-4.4-1.8-7-5-7-9.3V6l7-2.5Z"/><path d="m9 12 2 2 4-4"/></svg>',
    history:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5v5h5"/><path d="M5.6 16.5A8 8 0 1 0 4 10l2.7-2.2"/><path d="M12 8v4l3 2"/></svg>'
  };

  function installStyles(){
    if($('#promptAiHomeFinalStyles'))return;
    const style=document.createElement('style');style.id='promptAiHomeFinalStyles';style.textContent=`
      html.prompt-home-surface{--home-bg:#f4f7fa;--home-card:#fff;--home-panel:#111923;--home-line:#d9e1e8;--home-soft:#edf3f7;--home-blue:#4b9bd2;--home-blue-deep:#246b9d;--home-orange:#ee7b22;--home-ink:#121a24;--home-muted:#687583}
      html[data-theme="dark"].prompt-home-surface{--home-bg:#080d13;--home-card:#101720;--home-panel:#121b25;--home-line:#263442;--home-soft:#151f29;--home-blue:#61b5ed;--home-blue-deep:#52a9e1;--home-orange:#ff923d;--home-ink:#eef5fb;--home-muted:#93a3b2}
      html.prompt-home-surface body{min-height:100dvh;background:var(--home-bg)!important;color:var(--home-ink)!important}
      html.prompt-home-surface body:before{content:"";position:fixed;inset:0;pointer-events:none;opacity:.28;background-image:linear-gradient(90deg,transparent 49.8%,color-mix(in srgb,var(--home-line) 35%,transparent) 50%,transparent 50.2%);background-size:120px 100%}
      html[data-theme="dark"].prompt-home-surface body:before{opacity:.1}
      html.prompt-home-surface body.prompt-unified-ui>.topbar,html.prompt-home-surface body>.topbar{display:grid!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;position:sticky!important;top:10px!important;z-index:2147482500!important;width:min(1180px,calc(100% - 28px))!important;height:64px!important;margin:10px auto 0!important;padding:0 12px!important;grid-template-columns:minmax(0,1fr) auto!important;border:1px solid var(--home-line)!important;border-radius:17px!important;background:color-mix(in srgb,var(--home-card) 94%,transparent)!important;box-shadow:0 14px 45px rgba(21,37,53,.08)!important;backdrop-filter:blur(18px)!important}
      html[data-theme="dark"].prompt-home-surface body>.topbar{box-shadow:0 18px 55px rgba(0,0,0,.35)!important}
      html.prompt-home-surface .topbar .brand{display:flex!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;min-width:0!important;padding:0 4px!important}
      html.prompt-home-surface .topbar .brand-mark{width:39px!important;height:39px!important;border:0!important;border-radius:10px!important;background:transparent!important;box-shadow:none!important}
      html.prompt-home-surface .topbar .brand-mark img{width:100%!important;height:100%!important}
      html.prompt-home-surface .topbar .brand-copy strong{font-size:18px!important;letter-spacing:-.035em!important;color:var(--home-ink)!important}
      html.prompt-home-surface .topbar .brand-copy small,html.prompt-home-surface .topbar .engine-state,html.prompt-home-surface .topbar .sync-state{display:none!important}
      html.prompt-home-surface .topbar .top-actions{display:flex!important;visibility:visible!important;opacity:1!important;align-items:center!important;gap:7px!important;padding:0!important}
      html.prompt-home-surface .topbar #upgradeBtn{display:inline-flex!important;min-height:38px!important;padding:0 13px!important;border-radius:10px!important;background:var(--home-orange)!important;border-color:var(--home-orange)!important;box-shadow:none!important}
      html.prompt-home-surface .topbar #topbarMenuToggle,html.prompt-home-surface .home-theme-toggle{display:grid!important;visibility:visible!important;opacity:1!important;width:40px!important;height:40px!important;min-height:40px!important;margin:0!important;padding:0!important;place-items:center;border:1px solid var(--home-line)!important;border-radius:11px!important;background:var(--home-card)!important;color:var(--home-ink)!important;box-shadow:none!important}
      .home-theme-toggle{font-size:17px;line-height:1;cursor:pointer}
      html.prompt-home-surface .welcome-page{position:relative;width:min(clamp(1040px,78vw,1520px),calc(100% - 30px))!important;max-width:1520px!important;margin:0 auto!important;padding:clamp(56px,8vw,92px) 0 44px!important}
      html.prompt-home-surface .welcome-page>.welcome-hero,html.prompt-home-surface .welcome-page>.welcome-workspace{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;clip-path:inset(50%)!important;white-space:nowrap!important}
      .prompt-command-home{position:relative;z-index:1}
      .prompt-home-intro{position:relative;min-height:170px;padding:0 8px 28px}
      .prompt-home-intro:after{content:"";position:absolute;z-index:-1;right:-75px;top:-72px;width:330px;height:330px;border:1px solid color-mix(in srgb,var(--home-blue) 32%,transparent);border-radius:50%}
      .prompt-home-intro:before{content:"";position:absolute;z-index:-1;right:30px;top:52px;width:190px;height:190px;border:1px dashed color-mix(in srgb,var(--home-blue) 35%,transparent);border-radius:50%}
      .prompt-system-line{display:flex;align-items:center;gap:9px;margin-bottom:15px;color:var(--home-blue-deep);font-size:10px;font-weight:850;letter-spacing:.15em;text-transform:uppercase}
      .prompt-system-line:before{content:"";width:7px;height:7px;border:2px solid var(--home-blue);border-radius:50%}
      .prompt-home-intro h1{margin:0!important;color:var(--home-ink)!important;font:800 clamp(45px,7vw,76px)/.98 Arial,Helvetica,sans-serif!important;letter-spacing:-.06em!important}
      .prompt-home-intro p{max-width:550px;margin:14px 0 0;color:var(--home-muted);font-size:clamp(15px,2vw,18px);line-height:1.5}
      .prompt-command-panel{position:relative;overflow:visible;border:1px solid color-mix(in srgb,var(--home-blue) 18%,#000);border-radius:23px;background:var(--home-panel);color:#edf6fd;box-shadow:0 26px 70px rgba(16,29,42,.19)}
      .prompt-command-panel:before{content:"COMMAND / 01";position:absolute;right:22px;top:19px;color:#61778a;font-size:8px;font-weight:800;letter-spacing:.16em}
      .prompt-command-top{position:relative;display:flex;padding:18px 18px 0}
      .prompt-mode-button{display:inline-flex;align-items:center;gap:10px;min-height:45px;padding:0 13px;border:1px solid #425262;border-radius:12px;background:#151f29;color:#edf6fd;font:750 13px/1 Arial,Helvetica,sans-serif;cursor:pointer}
      .prompt-mode-button svg,.prompt-mode-menu svg,.prompt-latest-icon svg,.prompt-command-submit svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
      .prompt-mode-button .mode-chevron{width:8px;height:8px;margin-left:3px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg) translateY(-2px);transition:transform .16s ease}
      .prompt-mode-button[aria-expanded="true"] .mode-chevron{transform:rotate(225deg) translate(-2px,-1px)}
      .prompt-mode-menu{position:absolute;z-index:8;left:18px;top:69px;width:min(285px,calc(100vw - 70px));padding:7px;border:1px solid #dce7ef;border-radius:14px;background:#f9fcff;color:#14202a;box-shadow:0 22px 60px rgba(0,0,0,.28)}
      .prompt-mode-menu[hidden]{display:none!important}
      .prompt-mode-option{position:relative;display:grid;width:100%;grid-template-columns:32px 1fr;align-items:center;gap:8px;min-height:52px;padding:8px 11px;border:0;border-radius:10px;background:transparent;color:inherit;text-align:left;font:700 13px/1.2 Arial,Helvetica,sans-serif;cursor:pointer}
      .prompt-mode-option:hover,.prompt-mode-option[aria-checked="true"]{background:#e8f3fa;color:#174f76}
      .prompt-mode-option[data-locked="1"]:after{content:"PRO";position:absolute;right:11px;top:9px;padding:3px 7px;border-radius:999px;background:color-mix(in srgb,var(--home-orange,#e9781f) 16%,transparent);color:var(--home-orange,#e9781f);font-size:8px;font-weight:900;letter-spacing:.09em}
      .prompt-mode-option small{display:block;margin-top:4px;color:#71808d;font-size:9px;font-weight:550}
      .prompt-command-input{display:block;width:100%;min-height:185px;padding:30px 76px 24px 24px;border:0;outline:0;resize:vertical;background:transparent;color:#f2f7fb;font:500 clamp(17px,2.3vw,21px)/1.55 Arial,Helvetica,sans-serif;caret-color:var(--home-orange)}
      .prompt-command-input::placeholder{color:#71808e}
      .prompt-command-submit{position:absolute;right:21px;bottom:69px;display:grid;width:52px;height:52px;min-height:52px;padding:0;place-items:center;border:0;border-radius:13px;background:var(--home-blue);color:#07131c;cursor:pointer;transition:transform .16s ease,background .16s ease}
      .prompt-command-submit:hover{transform:translateY(-2px);background:#79c5f4}.prompt-command-submit:disabled{opacity:.35;transform:none;cursor:not-allowed}
      .prompt-picker-menu{max-height:min(60vh,340px);overflow-y:auto;overscroll-behavior:contain}
      .prompt-picker-menu .prompt-picker-group{display:block;padding:9px 11px 4px;color:#8b9dc3;font:850 9px/1 ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase}
      .prompt-picker-menu button[role="menuitemcheckbox"]:before{content:"";display:inline-block;width:14px;height:14px;margin-right:9px;border:1px solid #4d637a;border-radius:4px;vertical-align:-2px}
      .prompt-picker-menu button[aria-checked="true"]:before{border-color:var(--home-blue);background:var(--home-blue)}
      .prompt-picker-menu button[data-always="1"]{opacity:.7}
      .prompt-picker-empty{margin:0;padding:10px 11px;color:#8b9dc3;font:550 11px/1.5 Arial,Helvetica,sans-serif}
      .prompt-attach-list{display:flex;flex-wrap:wrap;gap:8px;padding:0 16px 12px}
      .prompt-attach-list[hidden]{display:none}
      .prompt-attach-chip{display:inline-flex;align-items:center;gap:8px;max-width:100%;padding:0 4px 0 11px;border:1px solid #33465a;border-radius:999px;background:#141e28;color:#dfe9f2;font:650 11px/26px Arial,Helvetica,sans-serif}
      .prompt-attach-chip b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:650}
      .prompt-attach-chip button{width:22px;height:22px;padding:0;border:0;border-radius:50%;background:transparent;color:#8b9dc3;font-size:15px;line-height:1;cursor:pointer}
      .prompt-attach-chip button:hover{background:rgba(255,255,255,.08);color:#f2f8fd}
      /* Der Absende-Knopf schwebt (position:absolute) über dieser Zeile - ohne die freie Spur
         rechts lag er genau auf "Übernehmen" und fing dessen Klicks ab. */
      .prompt-attach-input{display:flex;gap:8px;width:100%;padding-right:62px}
      /* Der Platzhalter blendet weich, statt hart umzuspringen. */
      .prompt-command-input::placeholder{transition:opacity .5s ease}
      .prompt-command-input.is-hint-fading::placeholder{opacity:0}
      /* Wie viele Anhänge der Tarif noch hergibt - am Eintrag selbst, nicht erst nach dem Klick. */
      .prompt-attach-menu button{display:flex;align-items:center;gap:10px}
      .prompt-attach-note{flex:0 0 100%;margin-top:6px;font:650 10px/1.4 Arial,Helvetica,sans-serif;color:#91a1ae}.prompt-attach-note[data-state="error"]{color:var(--home-orange,#ff9d78)}.prompt-attach-note[data-state="busy"]{color:var(--home-blue-deep,#68b9ed)}.prompt-attach-input{flex-wrap:wrap}.prompt-attach-count{margin-left:auto;color:var(--home-blue-deep);font:800 10px/1 ui-monospace,monospace;letter-spacing:.04em}
      .prompt-attach-menu button[data-full="1"] .prompt-attach-count{color:var(--home-orange)}
      .prompt-attach-input input{flex:1 1 auto;min-height:34px;padding:0 11px;border:1px solid #33465a;border-radius:9px;background:#0f1721;color:#eef6fb;font-size:13px}
      .prompt-attach-input button{min-height:34px;padding:0 12px;border:1px solid #33465a;border-radius:9px;background:transparent;color:#c8d6e2;font:700 11px/1 Arial,Helvetica,sans-serif;cursor:pointer}
      .prompt-attach-button{display:grid;place-items:center;width:30px;height:30px;padding:0;border:1px solid #33465a;border-radius:9px;background:transparent;color:#c8d6e2;font:400 19px/1 Arial,Helvetica,sans-serif;cursor:pointer}
      .prompt-attach-button:hover{border-color:#4d637a;color:#e7f1f9}
      .prompt-attach-menu{position:absolute;z-index:9;left:14px;bottom:52px;width:min(240px,calc(100vw - 60px));padding:7px;border:1px solid rgba(255,255,255,.14);border-radius:14px;background:#141e28;box-shadow:0 24px 60px rgba(0,0,0,.5)}
      .prompt-attach-menu[hidden]{display:none!important}
      /* display:block hier hat das flex von weiter oben ueberschrieben - damit lief das
         margin-left:auto des Zaehlers ins Leere und die Zahl klebte am Text. */
      .prompt-attach-menu button{display:flex;align-items:center;gap:10px;justify-content:space-between;width:100%;padding:9px 11px;border:0;border-radius:9px;background:transparent;color:#dfe9f2;text-align:left;font:700 12px/1.3 Arial,Helvetica,sans-serif;cursor:pointer}
      .prompt-attach-menu button:hover{background:rgba(45,147,201,.18);color:#f4f9fd}
      .prompt-setup-line{display:inline-flex;align-items:center;gap:7px;max-width:calc(100% - 46px);min-height:30px;padding:0 10px;border:1px solid transparent;border-radius:9px;background:transparent;color:var(--home-muted);font:650 11px/1 Arial,Helvetica,sans-serif;text-align:left;cursor:pointer}
      .prompt-setup-line:hover,.prompt-setup-line[aria-expanded="true"]{border-color:#33465a;color:#e7f1f9}
      .prompt-setup-line>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .prompt-budget-bar{flex:0 0 auto;position:relative;width:34px;height:5px;border-radius:3px;background:rgba(255,255,255,.14);overflow:hidden}
      .prompt-budget-bar i{display:block;height:100%;border-radius:3px;background:var(--home-blue-deep,#68b9ed);transition:width .3s ease}
      .prompt-budget-bar[data-low="1"] i{background:var(--home-orange,#ff9d78)}
      .prompt-setup-icon{flex:0 0 auto;width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round}
      .prompt-setup-tag{flex:0 0 auto;color:#8fd0f5;font:850 8.5px/1.4 ui-monospace,monospace;font-style:normal;letter-spacing:.1em;text-transform:uppercase}
      @media(max-width:700px){.prompt-setup-tag{display:none}}
      .prompt-setup-line .mode-chevron{flex:0 0 auto;width:6px;height:6px;margin:0;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg) translateY(-2px)}
      /* Unter der Konsole statt darüber: nach oben lief das Blatt über Überschrift und Textfeld,
         also genau über das, was man beim Einstellen noch sehen will. */
      /* Vier Abschnitte nebeneinander, solange die Breite es hergibt - untereinander wären sie
         eine Rolltreppe, und genau die sollte hier nicht entstehen. */
      .prompt-setup-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(232px,1fr));gap:0 26px;align-content:start}
      .prompt-setup-grid .prompt-setup-section{border-bottom:1px solid rgba(255,255,255,.07)}
      .prompt-setup-section{padding:8px 6px 10px;border-bottom:1px solid rgba(255,255,255,.07)}
      .prompt-setup-section:last-of-type{border-bottom:0}
      .prompt-setup-section>b{display:block;padding:0 5px 7px;color:#8b9dc3;font:850 9px/1 ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase}
      .prompt-setup-section>b .tier-flag{float:right;color:var(--home-orange);font-size:9px;font-weight:850;letter-spacing:.08em;text-transform:none}
      .prompt-setup-section button{position:relative;display:block;width:100%;padding:9px 68px 9px 11px;border:0;border-radius:9px;background:transparent;color:#dfe9f2;text-align:left;font:700 12.5px/1.3 Arial,Helvetica,sans-serif;cursor:pointer}
      .prompt-setup-section button>span{font:inherit;color:inherit}
      .prompt-setup-section button small{display:block;margin-top:3px;color:#8395ab!important;font:400 10.5px/1.45 Arial,Helvetica,sans-serif!important;letter-spacing:0!important;text-transform:none!important}
      .prompt-setup-section button[aria-checked="true"],.prompt-setup-section button:hover{background:rgba(45,147,201,.18);color:#f4f9fd}
      .prompt-setup-section button[data-locked="1"]{color:#8b9dc3}
      /* Der Tarifhinweis gehört zur Zeile, nicht unter sie: schwebend am rechten Rand, auf Höhe
         des Namens - sonst rutscht er unter die Beschreibung und sieht aus wie ein eigener Eintrag. */
      .prompt-setup-section button[data-locked="1"]:after{content:attr(data-tier);position:absolute;top:10px;right:11px;color:var(--home-orange);font:850 9px/1 ui-monospace,monospace;letter-spacing:.08em}
      .prompt-setup-note{margin:0;padding:9px 11px 4px;color:#7d8fa3;font:550 10px/1.5 Arial,Helvetica,sans-serif}
      /* "Mehr …" ist kein Eintrag der Liste, sondern der Weg zur vollstaendigen Liste - deshalb
         sitzt er abgesetzt am Fuss des Abschnitts und traegt nie einen Haken. */
      .prompt-setup-more{margin-top:4px;border-top:1px solid rgba(255,255,255,.07);color:#8fd0f5!important;font-size:11.5px!important}
      .prompt-setup-more:hover{background:rgba(45,147,201,.14)}
      /* .prompt-own-style nimmt dieses Fenster aus der Dialog-Pauschale in unified-ui-v1.js heraus -
         vorher stand hier eine Kette aus vier IDs, nur um einen Hintergrund setzen zu koennen. */
      .prompt-picker-dialog{width:100vw!important;max-width:none!important;height:100dvh!important;max-height:none!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;background:#0d151d!important;color:#dfe9f2!important;box-shadow:none!important}
      .prompt-picker-dialog::backdrop{background:rgba(6,10,15,.72)}
      .prompt-picker-frame{display:flex;flex-direction:column;width:min(760px,calc(100vw - 48px));height:100%;margin:0 auto;padding:26px 0 30px}
      .prompt-picker-dialog header{display:flex;align-items:flex-start;gap:16px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,.1)}
      .prompt-picker-dialog header div{flex:1 1 auto;min-width:0}
      .prompt-picker-dialog header b{display:block;font:850 19px/1.2 Arial,Helvetica,sans-serif}
      .prompt-picker-dialog header small{display:block;margin-top:5px;color:#8b9dc3;font:550 12px/1.5 Arial,Helvetica,sans-serif}
      .prompt-picker-dialog header button{flex:0 0 auto;width:34px;height:34px;padding:0;border:1px solid rgba(255,255,255,.16);border-radius:11px;background:transparent;color:#dfe9f2;font:700 17px/1 Arial,Helvetica,sans-serif;cursor:pointer}
      .prompt-picker-dialog .prompt-picker-dialog-body{flex:1 1 auto;overflow-y:auto;padding:12px 0 0}
      .prompt-picker-dialog .prompt-setup-section{border-bottom:0}
      .prompt-setup-sheet .prompt-picker-frame{width:min(1080px,calc(100vw - 48px))}
      .prompt-flow-button{display:inline-flex;align-items:center;gap:7px;min-height:30px;padding:0 10px;border:1px solid #33465a;border-radius:9px;background:transparent;color:#c8d6e2;font:700 11px/1 Arial,Helvetica,sans-serif;white-space:nowrap;cursor:pointer}
      .prompt-flow-button:hover{border-color:#4d637a;color:#e7f1f9}
      .prompt-flow-button .mode-chevron{width:6px;height:6px;margin:0;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg) translateY(-2px)}
      .prompt-flow-menu{position:absolute;z-index:9;left:14px;bottom:52px;width:min(300px,calc(100vw - 60px));padding:7px;border:1px solid rgba(255,255,255,.14);border-radius:14px;background:#141e28;box-shadow:0 24px 60px rgba(0,0,0,.5)}
      .prompt-flow-menu[hidden]{display:none!important}
      .prompt-flow-menu button{display:block;width:100%;padding:9px 11px;border:0;border-radius:9px;background:transparent;color:#dfe9f2;text-align:left;font:700 12px/1.3 Arial,Helvetica,sans-serif;cursor:pointer}
      .prompt-flow-menu button small{display:block;margin-top:3px;color:#8b9dc3;font-size:10px;font-weight:550;line-height:1.4}
      .prompt-flow-menu button[aria-checked="true"],.prompt-flow-menu button:hover{background:rgba(45,147,201,.18);color:#f4f9fd}
      .prompt-flow-menu button[data-locked="1"]{color:#8b9dc3}
      .prompt-flow-menu button[data-locked="1"]:after{content:attr(data-tier);float:right;margin-top:-14px;color:var(--home-orange);font-size:9px;font-weight:850;letter-spacing:.08em}
      .prompt-command-meta{display:flex;align-items:center;gap:16px;min-height:56px;padding:0 22px;border-top:1px solid #31404e;color:#91a1ae;font-size:10px}
      .prompt-command-meta span+span{padding-left:16px;border-left:1px solid #394a59}.prompt-command-meta b{color:#68b9ed;font-weight:750}.prompt-command-error{margin-left:auto;color:#ff9d78}.prompt-command-error:empty{display:none}
      .prompt-latest{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:14px;align-items:center;margin-top:18px;padding:14px 16px;border:1px solid var(--home-line);border-radius:17px;background:var(--home-card);color:var(--home-ink);cursor:pointer;transition:border-color .16s ease,transform .16s ease}
      .prompt-latest:hover{border-color:var(--home-blue);transform:translateY(-1px)}
      .prompt-latest-icon{display:grid;width:45px;height:45px;place-items:center;border-radius:13px;background:var(--home-soft);color:var(--home-blue-deep)}
      .prompt-latest-copy strong,.prompt-latest-copy small{display:block}.prompt-latest-copy strong{font-size:13px}.prompt-latest-copy small{margin-top:4px;color:var(--home-muted);font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .prompt-latest-action{min-height:38px;padding:0 12px;border:0;background:transparent;color:var(--home-blue-deep);font-size:11px;font-weight:800;cursor:pointer}.prompt-latest-action:disabled{opacity:.4;cursor:not-allowed}
      html.prompt-home-surface #promptFooter{width:100%;margin:0;background:transparent!important;border-top:1px solid var(--home-line)!important}html.prompt-home-surface #promptFooter .prompt-footer-content{min-height:56px!important;padding:12px clamp(14px,4vw,32px)!important}
      @media(max-width:700px){/* Die beiden blauen Linien waren auf dem Telefon abgeschaltet. Sie gehoeren zum Haus,
         also laufen sie auch dort durch - nur flacher, weil die Flaeche schmaler ist. */
      html.prompt-home-surface body:before{display:block;background-size:100% 100%!important;background-repeat:no-repeat!important;opacity:.75}html.prompt-home-surface body.prompt-unified-ui>.topbar,html.prompt-home-surface body>.topbar{top:6px!important;width:calc(100% - 20px)!important;height:60px!important;margin-top:7px!important;padding:0 8px!important;border-radius:15px!important}html.prompt-home-surface .topbar .brand-mark{width:36px!important;height:36px!important}html.prompt-home-surface .topbar .brand-copy strong{font-size:17px!important}html.prompt-home-surface .topbar #upgradeBtn{min-height:36px!important;padding:0 10px!important;font-size:10px!important}html.prompt-home-surface .topbar #topbarMenuToggle,html.prompt-home-surface .home-theme-toggle{width:36px!important;height:36px!important;min-height:36px!important;border-radius:10px!important}html.prompt-home-surface .welcome-page{width:100%!important;max-width:none!important;padding:58px 20px 40px!important}.prompt-home-intro{min-height:160px;padding:0 6px 34px}.prompt-home-intro:after{right:-165px;top:-105px}.prompt-home-intro:before{right:-32px;top:18px}.prompt-home-intro h1{font-size:clamp(45px,14vw,64px)!important}.prompt-home-intro p{max-width:310px;font-size:14px}.prompt-command-panel{border-radius:19px}.prompt-command-panel:before{right:16px;top:16px;font-size:7px}.prompt-command-top{padding:14px 14px 0}.prompt-mode-menu{left:14px;top:64px}.prompt-mode-button{max-width:238px;min-height:42px;font-size:12px}.prompt-command-input{min-height:190px;padding:25px 65px 20px 18px;font-size:17px}.prompt-command-submit{right:16px;bottom:66px;width:48px;height:48px;min-height:48px}.prompt-command-meta{min-height:54px;padding:0 16px;gap:11px;font-size:9px}.prompt-command-meta span+span{padding-left:11px}.prompt-command-error{display:none!important}.prompt-latest{grid-template-columns:auto minmax(0,1fr);padding:12px}.prompt-latest-action{grid-column:1/-1;width:100%;border-top:1px solid var(--home-line);padding-top:11px}
      /* Vier Knöpfe und zwei Angaben passen nicht in eine Zeile: die Knöpfe bleiben oben,
         Kontingent und Tarif rutschen darunter. Sonst bricht "Mit Rückfragen" mitten im Wort. */
      .prompt-command-meta{flex-wrap:wrap!important;row-gap:9px!important;min-height:0!important;padding:11px 16px!important}
      .prompt-command-meta>#promptTemplateButton{margin-right:auto}
      .prompt-command-meta>#promptHomeMeta{order:9;flex:0 1 auto;padding-left:0!important;border-left:0!important}/* Wird die Zeile umgebrochen - "Ohne Rueckfragen" ist laenger als "Mit Rueckfragen" -, fiel
         der Tarif in die naechste Zeile und stand dort ganz links wie ein Versehen. Er haengt
         sich jetzt rechts an, egal in welcher Zeile er landet. */
      .prompt-command-meta>.prompt-plan-chip{order:10;margin-left:auto;padding-left:0!important;border-left:0!important}
      /* Die Leiste sprang um, sobald das Ablauf-Wort laenger wurde ("Ohne Rueckfragen" statt
         "Mit Rueckfragen"): mal eine Zeile, mal zwei, und der Tarif wanderte mit. Auf dem
         Telefon stehen die vier Teile deshalb in einem festen Raster - zwei Zeilen, immer
         dieselben Plaetze, egal wie lang die Beschriftung ist. */
      @media(max-width:700px){
        .prompt-command-meta{
          display:grid!important;grid-template-columns:auto minmax(0,1fr) auto!important;
          grid-template-areas:'plus flow flow' 'bar info plan'!important;
          row-gap:9px!important;column-gap:12px!important;align-items:center!important;
        }
        .prompt-command-meta>.prompt-attach-button{grid-area:plus}
        .prompt-command-meta>#promptSetupButton{grid-area:flow;justify-self:start}
        .prompt-command-meta>#promptHomeMeta{grid-area:info;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .prompt-command-meta>.prompt-budget-bar{grid-area:bar;align-self:center}
        .prompt-command-meta>.prompt-plan-chip{grid-area:plan;justify-self:end;margin-left:0!important}
        .prompt-command-meta>.prompt-command-error{grid-column:1/-1}
        .prompt-command-meta span+span{padding-left:0!important;border-left:0!important}
      }
      .prompt-command-meta>#promptHomeMeta:after{content:'';display:block}
      .prompt-command-meta>span:not(#promptHomeMeta){order:10;padding-left:0!important;border-left:0!important}
      .prompt-command-submit{bottom:auto!important;top:auto!important}}
      @media(max-width:390px){html.prompt-home-surface .topbar #upgradeBtn{font-size:0!important}html.prompt-home-surface .topbar #upgradeBtn:after{content:"Pro";font-size:10px}.prompt-command-meta span:nth-child(2){display:none}.prompt-command-meta span+span{padding-left:0;border-left:0}}
    `;document.head.appendChild(style)
  }

  // Welches Kontingent die gewählte Arbeitsart verbraucht. Freier Prompt zählt als Prompt,
  // alles rund um Websites als Website-Lauf.
  const METRIC={website:['website_generations','Website-Läufe'],revision:['website_generations','Website-Läufe'],free:['free_prompts','Prompts']};
  // Grobe Umrechnung: im Deutschen kommt ein Token auf gut dreieinhalb Zeichen. Deshalb das
  // Ungefähr-Zeichen davor - eine genaue Zahl kennt erst das Modell.
  const tokenGuess=text=>Math.max(1,Math.round(text.trim().length/3.6));
  // Eine gekaufte Einzelprüfung war nach dem Kauf nirgends zu sehen. Sie gehört dorthin, wo der
  // Kunde nach dem Kauf steht: in die Zeile unter dem Textfeld.
  function creditNote(){
    const credits=Math.max(0,Number(window.PromptAiAccess?.reviewCredits)||0);
    if(!credits)return '';
    // "Bereit" allein liest sich wie ein Knopf, den man suchen muesste - eingeloest wird sie aber
    // von selbst, sobald das naechste Projekt geprueft wird.
    return credits===1?'1 gekaufte Prüfung – wird beim nächsten Projekt eingelöst':`${credits} gekaufte Prüfungen – die nächste wird beim nächsten Projekt eingelöst`;
  }
  function withCredit(line){const note=creditNote();return note?(line?`${line} · ${note}`:note):line}
  // Was eine Nutzung kostet, misst der Monatsvorrat - Tokens im Hintergrund, Prozent im Bild.
  // Zahlen wie "2,4 Millionen Token" sagen niemandem etwas; ein Anteil und eine Uebersetzung in
  // Projekte schon. Ein Projektlauf kostet grob 45.000 Einheiten, ein freier Prompt 4.000.
  const RUN_COST={website:45000,revision:45000,check:20000,free:4000};
  const RUN_LABEL={website:'Projekte',revision:'Projekte',check:'Prüfungen',free:'Prompts'};
  function budget(){
    const tokens=window.PromptAiQuota?.summary?.()?.tokens;
    const limit=Number(tokens?.limit||0);
    if(!limit)return null;
    const used=Math.max(0,Number(tokens.used)||0),remaining=Math.max(0,limit-used);
    return {limit,used,remaining,share:Math.max(0,Math.min(1,remaining/limit)),percent:Math.max(0,Math.min(100,Math.round(remaining/limit*100)))};
  }
  function quotaLine(mode){
    if(window.PromptAiAccess?.isAdmin)return 'unbegrenzt';
    const info=budget();
    if(info){
      const cost=RUN_COST[mode]||RUN_COST.website,runs=Math.floor(info.remaining/cost);
      const rest=runs>0?`reicht für etwa ${runs} ${RUN_LABEL[mode]||'Projekte'}`:'kleineres Modell übernimmt';
      return withCredit(`Noch ${info.percent} % · ${rest}`);
    }
    const summary=window.PromptAiQuota?.summary?.();
    if(!summary?.metrics)return withCredit('');
    const [key,label]=METRIC[mode]||METRIC.website,item=summary.metrics[key];
    if(!item)return withCredit('');
    const limit=Number(item.limit||0);
    if(!limit)return withCredit(`${label} nicht im Tarif`);
    const left=Math.max(0,Number(item.remaining??limit-Number(item.used||0)));
    return withCredit(`${left}/${limit} ${label}`);
  }
  // Der Balken sitzt vor der Zeile: eine Laenge sieht man schneller als eine Zahl.
  function syncBudgetBar(home){
    const meta=$('.prompt-command-meta',home);if(!meta)return;
    const info=window.PromptAiAccess?.isAdmin?null:budget();
    let bar=$('.prompt-budget-bar',meta);
    if(!info){bar?.remove();return}
    if(!bar){
      bar=document.createElement('span');bar.className='prompt-budget-bar';bar.innerHTML='<i></i>';
      meta.insertBefore(bar,$('#promptHomeMeta',meta));
    }
    bar.title=`Noch ${info.percent} % deines Monatsvorrats`;
    bar.dataset.low=info.percent<=15?'1':'0';
    const fill=bar.firstElementChild;
    if(fill.style.width!==`${info.percent}%`)fill.style.width=`${info.percent}%`;
    warnLowBudget(info);
  }
  // Einmal je Sitzung, wenn es eng wird - und nur dann, denn eine Meldung, die jedes Mal kommt,
  // liest nach dem zweiten Mal niemand mehr.
  const LOW_KEY='prompt-ai-budget-warned-v1';
  function warnLowBudget(info){
    if(!info||info.percent>15)return;
    try{if(sessionStorage.getItem(LOW_KEY))return;sessionStorage.setItem(LOW_KEY,'1')}catch{}
    const text=info.percent<=0
      ?'Monatsvorrat leer – es läuft weiter, jetzt auf einem kleineren Modell.'
      :`Noch ${info.percent} % Monatsvorrat – danach übernimmt ein kleineres Modell.`;
    window.PromptAiToast?.show?.(text,'error');
  }
  // Grobe, ehrliche Schätzung: der ausgelesene Text der Quellen und Unterlagen, so wie er auch
  // im Auftrag landet. Bilder werden pauschal veranschlagt, weil ihre Kosten nicht an Zeichen hängen.
  function attachmentTokens(){
    let chars=0,images=0;
    try{
      const state=JSON.parse(localStorage.getItem('sitebrief-v6-state')||'{}');
      for(const item of state.urls||[])chars+=String(item.summary||'').length+String(item.url||'').length;
      for(const source of state.sourceUrls||[])chars+=String(source.summary||'').length;
      for(const doc of state.documents||[])chars+=String(doc.text||'').length;
      images=(state.images||[]).length;
    }catch{}
    return Math.round(chars/3.6)+images*260;
  }
  function syncMeta(){
    const home=$('.prompt-command-home');if(!home)return;
    const field=$('#promptCommandInput',home),slot=$('#promptHomeMeta',home);
    if(!field||!slot)return;
    const text=field.value.trim();
    // Anhänge gehen mit in den Auftrag - ein ausgelesener Link oder ein PDF wiegt oft mehr als
    // der getippte Satz. Die Schätzung zählt sie deshalb mit, sonst steht dort eine Zahl, die
    // mit dem, was tatsächlich an die KI geht, nichts zu tun hat.
    const attached=attachmentTokens();
    const total=tokenGuess(text)+attached;
    const mode=home.dataset.commandMode||'website';
    // Waehrend man schreibt zaehlt nicht die Tokenzahl, sondern was der Auftrag vom Monat
    // wegnimmt - das ist die Groesse, die man vor dem Absenden wirklich abwaegt.
    const info=window.PromptAiAccess?.isAdmin?null:budget();
    const cost=(RUN_COST[mode]||RUN_COST.website)+total;
    const share=info&&info.limit?Math.max(1,Math.round(cost/info.limit*100)):0;
    const next=text||attached
      ?(share?`Dieser Auftrag verbraucht etwa ${share} % deines Monats`:`${text.length} Zeichen · ≈${total} Token${attached?` (davon ≈${attached} aus Anhängen)`:''}`)
      :quotaLine(mode);
    if(slot.textContent!==next)slot.textContent=next;
    syncBudgetBar(home);
  }

  // Anhänge laufen über die vorhandenen Eingaben der Referenzen: der Dateiknopf öffnet
  // #imageInput, der Link geht durch #referenceUrl und #addUrlBtn. Damit gelten dieselben
  // Formate, Grenzen und Tarifregeln wie bisher - hier ist nur der Ort des Klicks neu. Die
  // Kacheln spiegeln die echte Liste, es gibt also keine zweite Wahrheit.
  // Was hochgeladen wird, wird vor der Übernahme geprüft: erlaubte Endung, Größe, und der Inhalt
  // muss zur Endung passen. Sonst genügt es, eine beliebige Datei .txt zu nennen, damit der
  // Leser in app.js sie als Text in den Prompt zieht - und ein 300-MB-"Bild" bliebe beim
  // Verkleinern hängen. Das Ergebnis steht sichtbar an der Konsole statt in einer Konsole.
  const FILE_MAX=12*1024*1024;
  const FILE_NAME=/\.(png|jpe?g|webp|pdf|txt|md|csv|json)$/i;
  async function fileLooksReal(file){
    const head=new Uint8Array(await file.slice(0,16).arrayBuffer());
    const hex=[...head].map(byte=>byte.toString(16).padStart(2,'0')).join('');
    if(/\.png$/i.test(file.name))return hex.startsWith('89504e470d0a1a0a');
    if(/\.jpe?g$/i.test(file.name))return hex.startsWith('ffd8ff');
    if(/\.webp$/i.test(file.name))return hex.startsWith('52494646')&&hex.slice(16,24)==='57454250';
    if(/\.pdf$/i.test(file.name))return hex.startsWith('255044462d');
    // Textformate haben keine Signatur, dafür keine Steuerzeichen. Eine umbenannte
    // Programmdatei fällt hier durch, weil sie voller Nullbytes steckt.
    const sample=new Uint8Array(await file.slice(0,4096).arrayBuffer());
    return !sample.some(byte=>byte===0||byte<9||(byte>13&&byte<32));
  }
  function attachNote(text,state){
    const list=$('#promptAttachList');if(!list)return;
    let note=$('#promptAttachFileNote',list);
    if(!text){note?.remove();return}
    if(!note){note=document.createElement('small');note.id='promptAttachFileNote';note.className='prompt-attach-note';list.prepend(note)}
    note.textContent=text;
    if(state)note.dataset.state=state;else delete note.dataset.state;
    list.hidden=false;
  }
  function attachFile(){
    const target=$('#imageInput');
    if(!target){message('Anhänge stehen im Projekt bereit.');return}
    let input=$('#promptAttachFile');
    if(!input){
      input=document.createElement('input');
      input.type='file';input.id='promptAttachFile';input.multiple=true;input.hidden=true;
      input.accept=target.getAttribute('accept')||'';
      input.addEventListener('change',()=>checkFiles(input,target));
      document.body.appendChild(input);
    }
    input.value='';input.click();
  }
  async function checkFiles(input,target){
    const files=[...(input.files||[])];
    input.value='';
    if(!files.length)return;
    attachNote(files.length===1?'Datei wird geprüft …':`${files.length} Dateien werden geprüft …`,'busy');
    const good=[],bad=[];
    for(const file of files){
      if(!FILE_NAME.test(file.name)){bad.push(`${file.name}: dieses Format nehmen wir nicht an`);continue}
      if(!file.size){bad.push(`${file.name}: die Datei ist leer`);continue}
      if(file.size>FILE_MAX){bad.push(`${file.name}: größer als 12 MB`);continue}
      let real=false;
      try{real=await fileLooksReal(file)}catch{real=false}
      if(!real){bad.push(`${file.name}: Inhalt passt nicht zur Endung`);continue}
      good.push(file);
    }
    if(good.length){
      if(typeof DataTransfer==='function'){
        const box=new DataTransfer();
        for(const file of good)box.items.add(file);
        target.files=box.files;target.dispatchEvent(new Event('change',{bubbles:true}));
      }else bad.push('Dieser Browser kann geprüfte Dateien nicht übergeben.');
    }
    if(bad.length)attachNote(bad.slice(0,3).join(' · '),'error');
    else{attachNote('');setTimeout(syncAttachments,200)}
  }
  function attachUrl(){
    const list=$('#promptAttachList');if(!list)return;
    let row=$('.prompt-attach-input',list);
    if(!row){
      row=document.createElement('div');row.className='prompt-attach-input';
      row.innerHTML='<input type="url" placeholder="https://beispiel.de" aria-label="Link einfügen"><button type="button">Übernehmen</button>';
      list.prepend(row);list.hidden=false;
      // Bisher ging jede Eingabe ungeprueft weiter. Die eigentliche Pruefung sitzt in app.js an
      // einem Feld, das auf der Startseite gar nicht sichtbar ist - eine Fehlermeldung dort sieht
      // niemand. Also wird hier geprueft, wo getippt wurde, und der Zustand steht daneben.
      const note=document.createElement('small');note.className='prompt-attach-note';row.appendChild(note);
      const fail=text=>{note.textContent=text;note.dataset.state='error';$('input',row).focus();return false};
      const apply=()=>{
        const input=$('input',row),raw=input.value.trim();
        if(!raw){row.remove();return}
        if(/\s/.test(raw))return fail('Bitte nur eine Adresse ohne Leerzeichen.');
        let url;
        try{url=new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)?raw:`https://${raw}`)}catch{return fail('Das ist keine Adresse. Beispiel: https://beispiel.de')}
        if(!/^https?:$/i.test(url.protocol))return fail('Nur Adressen mit http oder https sind moeglich.');
        if(!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(url.hostname))return fail('Die Adresse hat keinen gueltigen Namen, z. B. beispiel.de');
        note.dataset.state='busy';note.textContent='Link wird geprueft \u2026';
        const field=$('#referenceUrl');if(field){field.value=url.href;$('#addUrlBtn')?.click()}
        setTimeout(()=>{row.remove();syncAttachments()},400);
      };
      $('button',row).addEventListener('click',apply);
      $('input',row).addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();apply()}if(e.key==='Escape')row.remove()});
    }
    list.hidden=false;$('input',row).focus();
  }
  function message(text){const error=$('#promptCommandError');if(error)error.textContent=text}
  // Was in den echten Listen steht, steht auch hier - Reihenfolge und Anzahl inklusive.
  // Wie viele Anhänge der Tarif noch hergibt. Die Zahlen kommen aus app.js (window.PromptAiRefLimits),
  // damit hier keine zweite Ableitung des Tarifs entsteht, die irgendwann abweicht. Sie zählen mit,
  // sobald etwas dazukommt oder wegfällt.
  function syncAttachCounts(){
    const limits=window.PromptAiRefLimits;
    const fill=(id,used,limit)=>{
      const slot=$(`#${id}`);if(!slot)return;
      const button=slot.closest('button');
      if(!limits){slot.textContent='';if(button)delete button.dataset.full;return}
      const unlimited=!Number.isFinite(limit);
      slot.textContent=unlimited?`${used}/∞`:`${used}/${limit}`;
      if(button){if(!unlimited&&used>=limit)button.dataset.full='1';else delete button.dataset.full}
    };
    // Bilder und Dokumente teilen sich den Weg "Bild oder Datei"; die Grenze zählt die Bilder.
    fill('promptAttachCountFile',Number(limits?.images||0),limits?.imageLimit);
    fill('promptAttachCountUrl',Number(limits?.urls||0),limits?.urlLimit);
  }

  function syncAttachments(){
    syncAttachCounts();
    const list=$('#promptAttachList');if(!list)return;
    const items=[];
    for(const [selector,kind] of [['#urlReferences','link'],['#imageReferences','bild'],['#documentReferences','datei']]){
      const host=document.querySelector(selector);if(!host)continue;
      for(const node of host.children){
        // Der Name steht im <strong> des Eintrags; das <span> davor ist nur die Marke
        // ("URL"), und die als Kachelbeschriftung zu nehmen wäre für jeden Anhang dasselbe.
        const label=(node.querySelector('strong')?.textContent||node.querySelector('figcaption')?.textContent||node.getAttribute('data-reference-label')||'').trim();
        if(label)items.push({kind,label:label.slice(0,42),node});
      }
    }
    for(const chip of [...list.querySelectorAll('.prompt-attach-chip')])chip.remove();
    for(const item of items){
      const chip=document.createElement('span');chip.className='prompt-attach-chip';chip.dataset.kind=item.kind;
      chip.innerHTML=`<b></b><button type="button" aria-label="Entfernen">×</button>`;
      chip.querySelector('b').textContent=item.label;
      chip.querySelector('button').addEventListener('click',()=>{
        const remove=item.node.querySelector('.remove-btn,[data-remove-url],[data-remove-image],[data-remove-document]');
        if(remove)remove.click();else item.node.remove();
        setTimeout(syncAttachments,120);
      });
      list.appendChild(chip);
    }
    list.hidden=!items.length&&!$('.prompt-attach-input',list)&&!$('#promptAttachFileNote',list);
  }

  // Vorlagen und Skills gibt es bereits: die Vorlage als <select id="templateSelect">, die
  // Skills als Reihen mit Kontrollkästchen in #skillSelection. Beide Menüs hier lesen genau
  // diese Elemente und bedienen sie - keine zweite Liste, keine zweite Sperre.
  // Eigene Vorlagen und Skills gehören beide zu planRules().modules bzw. libraryItems - im
  // kostenlosen Tarif also gesperrt. Der Hinweis stand bisher nur beim Ablauf; hier bekommt er
  // denselben Platz, damit man vor dem Tippen sieht, was zum Tarif gehört.
  const planIsFree=()=>{const a=window.PromptAiAccess||{};return !a.isAdmin&&String(a.plan||'free')==='free'};
  function markSectionTier(menuId,tier){
    const section=$(`#${menuId}`)?.closest('.prompt-setup-section'),head=section?.querySelector('b');
    if(!head)return;
    let flag=head.querySelector('.tier-flag');
    if(!tier){flag?.remove();return}
    if(!flag){flag=document.createElement('i');flag.className='tier-flag';head.appendChild(flag)}
    if(flag.textContent!==tier)flag.textContent=tier;
  }
  // Wie oft ein Eintrag schon aktiviert wurde. Bei dreissig Skills und ebenso vielen Vorlagen
  // waere die Liste sonst eine Rolltreppe. Sichtbar sind darum hoechstens zehn - die
  // meistgenutzten und alles, was gerade aktiv ist -, der Rest steht hinter "Mehr …".
  const USE_KEY='prompt-ai-picker-use-v1',PICKER_LIMIT=10;
  function useCounts(){try{const raw=JSON.parse(localStorage.getItem(USE_KEY)||'{}');return raw&&typeof raw==='object'?raw:{}}catch{return{}}}
  function countUse(kind,id){
    if(!id)return;
    const all=useCounts(),key=`${kind}:${id}`;
    all[key]=(Number(all[key])||0)+1;
    try{localStorage.setItem(USE_KEY,JSON.stringify(all))}catch{}
  }
  // Aktive Eintraege muessen sichtbar bleiben, auch wenn sie selten benutzt werden - sonst
  // stuende in den Settings ein Haken, den man nirgends wiederfindet.
  function topEntries(kind,entries){
    const counts=useCounts();
    const ranked=entries
      .map((entry,index)=>({entry,index,used:Number(counts[`${kind}:${entry.id}`]||0)}))
      .sort((a,b)=>(b.used-a.used)||(a.index-b.index))
      .map(item=>item.entry);
    if(ranked.length<=PICKER_LIMIT)return {shown:ranked,rest:0};
    const head=ranked.slice(0,PICKER_LIMIT),missing=ranked.slice(PICKER_LIMIT).filter(entry=>entry.checked);
    const shown=missing.length?head.slice(0,Math.max(1,PICKER_LIMIT-missing.length)).concat(missing):head;
    return {shown,rest:ranked.length-shown.length};
  }
  function pickerButton(entry){
    const button=document.createElement('button');
    button.type='button';button.setAttribute('role',entry.role||'menuitemradio');
    button.setAttribute('aria-checked',String(Boolean(entry.checked)));
    if(entry.always)button.dataset.always='1';
    if(entry.locked){button.dataset.locked='1';button.dataset.tier=entry.tier||'ab Pro'}
    const label=document.createElement('span');label.textContent=entry.label;button.appendChild(label);
    if(entry.note){const note=document.createElement('small');note.textContent=entry.note;button.appendChild(note)}
    button.addEventListener('click',()=>entry.select());
    return button;
  }
  function paintPicker(menu,kind,entries){
    menu.innerHTML='';
    const {shown,rest}=topEntries(kind,entries);
    for(const entry of shown)menu.appendChild(pickerButton(entry));
    if(!rest)return;
    const more=document.createElement('button');
    more.type='button';more.className='prompt-setup-more';
    more.textContent=`Mehr … (${rest} weitere)`;
    more.addEventListener('click',()=>openPicker(kind));
    menu.appendChild(more);
  }
  // Das vollstaendige Fenster zeigt dieselben Eintraege ohne Deckelung - eine Liste, zwei Orte.
  function openPicker(kind){
    const spec=PICKERS[kind];if(!spec)return;
    let dialog=$('#promptPickerDialog');
    if(!dialog){
      dialog=document.createElement('dialog');
      dialog.id='promptPickerDialog';dialog.className='prompt-picker-dialog prompt-own-style';
      dialog.innerHTML='<div class="prompt-picker-frame"><header><div><b></b><small></small></div><button type="button" data-close aria-label="Schließen">×</button></header><div class="prompt-picker-dialog-body"><div class="prompt-setup-section" id="promptPickerList"></div></div></div>';
      dialog.addEventListener('click',event=>{if(event.target===dialog||event.target.closest('[data-close]'))dialog.close()});
      document.body.appendChild(dialog);
    }
    dialog.dataset.pickerKind=kind;
    dialog.querySelector('b').textContent=spec.title;
    dialog.querySelector('small').textContent=spec.hint;
    paintPickerDialog();
    if(!dialog.open)dialog.showModal();
  }
  function paintPickerDialog(){
    const dialog=$('#promptPickerDialog');if(!dialog)return;
    const spec=PICKERS[dialog.dataset.pickerKind||''],list=dialog.querySelector('#promptPickerList');
    if(!spec||!list)return;
    const entries=spec.entries();
    list.innerHTML='';
    if(!entries.length){list.innerHTML=`<p class="prompt-picker-empty">${spec.empty}</p>`;return}
    for(const entry of entries)list.appendChild(pickerButton(entry));
  }
  const pickerOpen=()=>Boolean($('#promptPickerDialog')?.open);

  function templateEntries(){
    const select=document.querySelector('#templateSelect');
    if(!select)return [];
    const current=select.value;
    return [...select.options].map(option=>{
      const text=(option.textContent||'').trim(),parts=text.split(' · ');
      const id=option.value||text;
      return {
        id,label:parts[0]||'Vorlage',note:parts.slice(1).join(' · '),
        checked:option.value===current,role:'menuitemradio',
        select(){
          select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));
          if(option.value)countUse('template',id);
          setTimeout(()=>{syncTemplateMenu();syncSetupSummary()},80);
        }
      };
    });
  }
  function skillEntries(){
    const host=document.querySelector('#skillSelection');
    return [...(host?.querySelectorAll('.selection-row')||[])].map(row=>{
      const box=row.querySelector('input[type="checkbox"]');
      const name=(row.querySelector('strong')?.textContent||'Skill').trim();
      const scope=(row.querySelector('code')?.textContent||'').trim();
      const trigger=(row.querySelector('p')?.textContent||'').split(' · Quelle:')[0].trim();
      const note=[scope==='ALLE'?'Alle Agents':scope,trigger].filter(Boolean).join(' · ');
      return {
        id:name,label:name.slice(0,44),note:note.slice(0,84),
        checked:Boolean(box?.checked),always:Boolean(box?.disabled),role:'menuitemcheckbox',
        select(){
          if(box&&!box.disabled){box.click();if(box.checked)countUse('skill',name)}
          setTimeout(()=>{syncSkillsMenu();syncSetupSummary()},80);
        }
      };
    });
  }
  function syncTemplateMenu(){
    const menu=$('#promptTemplateMenu');
    if(!menu)return;
    markSectionTier('promptTemplateMenu',planIsFree()?'ab Pro':'');
    const entries=templateEntries();
    if(!entries.length)menu.innerHTML='<p class="prompt-picker-empty">Vorlagen stehen im Projekt bereit.</p>';
    else paintPicker(menu,'template',entries);
    if(pickerOpen())paintPickerDialog();
    syncSetupSummary();
  }
  function syncSkillsMenu(){
    const menu=$('#promptSkillsMenu'),host=document.querySelector('#skillSelection');
    if(!menu)return;
    markSectionTier('promptSkillsMenu',planIsFree()?'ab Pro':'');
    const locked=host?.querySelector('.feature-lock-note');
    if(locked){menu.innerHTML='<p class="prompt-picker-empty">'+(locked.querySelector('strong')?.textContent||'Skills sind in diesem Tarif nicht aktiv.')+'</p>';return}
    const entries=skillEntries();
    if(!entries.length)menu.innerHTML=`<p class="prompt-picker-empty">Noch keine Skills für ${agentLabel(activeAgent())}. Bibliothek → Agent-Skills.</p>`;
    else paintPicker(menu,'skill',entries);
    if(pickerOpen())paintPickerDialog();
  }

  // Ziel-KI. Es ist immer genau eine aktiv - der Master-Prompt wird für sie gebaut, und zur
  // Auswahl stehen ihre Skills plus die globalen. Die echte Wahl sitzt in #agentSelector; hier
  // wird sie bedient und nicht nachgebaut, sonst gäbe es zwei Wahrheiten und zwei Tarifsperren.
  const AGENT_LABEL={codex:'Codex',claude:'Claude Code',gemini:'Gemini',chatgpt:'ChatGPT',cursor:'Cursor',v0:'v0',universal:'Universal'};
  const AGENT_NOTE={codex:'Kompaktes Markdown, Skills für Codex',claude:'Prompt in XML-Abschnitten, Skills für Claude',gemini:'Kompaktes Markdown, Skills für Gemini',chatgpt:'Kompaktes Markdown, Skills für ChatGPT',cursor:'Kompaktes Markdown, Skills für Cursor',v0:'Kompaktes Markdown, Skills für v0',universal:'Neutrale Fassung für jedes Werkzeug'};
  // Die Ziel-KI ist in jedem Tarif frei wählbar (PLAN_RULES.agents in app.js). Die Tabelle bleibt
  // leer, aber stehen: kommt je ein Ziel dazu, das an einen Tarif gebunden ist, gehört es hierher.
  const AGENT_TIER={};
  const agentButton=key=>document.querySelector(`#agentSelector button[data-agent="${key}"]`);
  const agentAllowed=key=>{const button=agentButton(key);return button?!button.hidden:key==='codex'};
  function activeAgent(){return document.querySelector('#agentSelector button[data-agent].active')?.dataset.agent||'codex'}
  function agentLabel(key){return AGENT_LABEL[key]||'Codex'}
  function agentEntries(){
    const current=activeAgent();
    return Object.keys(AGENT_LABEL).map(key=>({
      id:key,label:AGENT_LABEL[key],note:AGENT_NOTE[key],checked:key===current,
      locked:!agentAllowed(key),tier:AGENT_TIER[key]||'ab Pro',role:'menuitemradio',
      select(){selectAgent(key)}
    }));
  }
  function selectAgent(key){
    const button=agentButton(key);
    if(!button||button.hidden){document.querySelector('#plansDialog')?.showModal();return}
    if(!button.classList.contains('active'))button.click();
    // app.js schreibt bei diesem Klick die Skill-Liste neu - nur noch die Skills dieser KI plus
    // die globalen - und legt die Wahl in den Projektstand. Beides braucht einen Tick.
    setTimeout(()=>{syncAgentMenu();syncSkillsMenu();syncSetupSummary()},90);
  }
  function syncAgentMenu(){
    const menu=$('#promptAgentMenu');if(!menu)return;
    menu.innerHTML='';
    for(const entry of agentEntries())menu.appendChild(pickerButton(entry));
  }

  const PICKERS={
    template:{title:'Alle Vorlagen',hint:'Es gilt genau eine Vorlage pro Auftrag. In den Settings stehen die zehn, die du am häufigsten nimmst.',empty:'Vorlagen stehen im Projekt bereit.',entries:templateEntries},
    skill:{title:'Alle Skills',hint:'Skills gelten zusätzlich zum Master-Prompt, sobald ihr Auslöser zur Aufgabe passt. Angezeigt werden die Skills der gewählten Ziel-KI und die globalen.',empty:'Noch keine Skills angelegt. Bibliothek → Agent-Skills.',entries:skillEntries}
  };

  const FLOW_KEY='prompt-ai-flow-mode-v1';
  const FLOW_LABEL={guided:'Mit Rückfragen',auto:'Ohne Rückfragen',expert:'Selbst einstellen'};
  function flowMode(){try{const v=localStorage.getItem(FLOW_KEY);if(FLOW_LABEL[v])return v}catch{}return 'guided'}
  // Die drei Abläufe gibt es bereits als .mode-switch in der Kopfzeile. Das Menü hier bedient
  // genau diese Knöpfe; ein nachgebauter Schalter hieße, jede Sperre und jede Folgeregel ein
  // zweites Mal zu pflegen.
  function applyFlow(mode){
    const button=$(`.mode-switch button[data-mode="${mode}"]`);
    if(button&&!button.classList.contains('active')&&!button.disabled&&!button.classList.contains('locked'))button.click();
  }
  const flowLocked=mode=>{const b=$(`.mode-switch button[data-mode="${mode}"]`);return Boolean(b&&(b.disabled||b.classList.contains('locked')))};
  function selectFlow(mode){
    if(!FLOW_LABEL[mode])return;
    // Gesperrte Abläufe werden nicht heimlich übersprungen: der echte Knopf wird gedrückt,
    // damit die App selbst zeigt, was dafür fehlt - und die Wahl wird nicht gemerkt, sonst
    // stünde unten ein Ablauf, der gar nicht gilt.
    if(flowLocked(mode)){
      const button=$(`.mode-switch button[data-mode="${mode}"]`);button?.click();
      const error=$('#promptCommandError');
      if(error)error.textContent=button?.title||'Dieser Ablauf gehört zu einem größeren Tarif.';
      return;
    }
    // Eine Einstellung ist kein Start: wer hier den Ablauf umstellt, will die Startseite behalten.
    // Der echte Schalter oeffnet je nach Ablauf den Arbeitsbereich - das wird danach zurueckgeholt.
    const wasHome=homeVisible();
    applyFlow(mode);
    if(wasHome){
      const flow=$('#workflowApp'),page=$('#welcomePage');
      if(flow&&!flow.hidden){flow.hidden=true;if(page)page.hidden=false}
    }
    // Erst merken, wenn der echte Schalter wirklich umgesprungen ist. app.js lehnt einen
    // Ablauf ab, der nicht zum Tarif gehört (setMode öffnet dann die Tarifseite) - ohne
    // diese Prüfung stünde unten ein Ablauf, der gar nicht gilt.
    const active=$('.mode-switch button.active')?.dataset.mode;
    if(active&&active!==mode){syncFlowUi();return}
    try{localStorage.setItem(FLOW_KEY,mode)}catch{}
    syncFlowUi();
  }
  const FLOW_NOTE={guided:'Fragt nur nach, wo es das Ergebnis ändert',auto:'Briefing rein, Prompt raus',expert:'Alle Schritte bleiben offen'};
  // Welcher Tarif den Ablauf tatsächlich freischaltet - dieselbe Reihenfolge wie PLAN_RULES.modes
  // in app.js (free: guided, pro: +auto, ultimate: +expert). Vorher stand pauschal "ab Pro" an
  // jedem gesperrten Eintrag, also auch an "Selbst einstellen", das es erst ab Ultimate gibt.
  const FLOW_TIER={guided:'ab Pro',auto:'ab Pro',expert:'ab Ultimate'};
  function syncFlowUi(){
    const menu=$('#promptFlowMenu');if(!menu)return;
    let mode=flowMode();
    if(flowLocked(mode)){mode='guided';try{localStorage.setItem(FLOW_KEY,mode)}catch{}}
    menu.innerHTML='';
    for(const key of ['guided','auto','expert']){
      const button=document.createElement('button');
      button.type='button';button.setAttribute('role','menuitemradio');
      button.dataset.flowMode=key;button.setAttribute('aria-checked',String(key===mode));
      button.dataset.locked=flowLocked(key)?'1':'0';
      button.dataset.tier=FLOW_TIER[key]||'ab Pro';
      button.innerHTML='<span></span><small></small>';
      button.querySelector('span').textContent=FLOW_LABEL[key];
      button.querySelector('small').textContent=FLOW_NOTE[key];
      button.addEventListener('click',()=>selectFlow(key));
      menu.appendChild(button);
    }
    syncSetupSummary();
  }
  // Der Stand steht als Satz in der Zeile - man sieht ihn, ohne etwas zu öffnen.
  function syncSetupSummary(){
    const out=$('#promptSetupSummary');if(!out)return;
    const parts=[agentLabel(activeAgent()),FLOW_LABEL[flowMode()]];
    const select=document.querySelector('#templateSelect');
    if(select?.value){const name=(select.options[select.selectedIndex]?.textContent||'').split(' · ')[0].trim();if(name)parts.push(name)}
    const skills=[...document.querySelectorAll('#skillSelection .selection-row input[type="checkbox"]')].filter(b=>b.checked).length;
    if(skills)parts.push(skills===1?'1 Skill':skills+' Skills');
    const text=parts.join(' · ');
    if(out.textContent!==text)out.textContent=text;
  }

  function titleCase(value){return String(value||'').trim().replace(/[._-]+/g,' ').replace(/\b\p{L}/gu,char=>char.toUpperCase())}
  function firstName(value){return titleCase(value).split(/\s+/)[0]||''}
  function resolvedName(){const cloud=window.SiteBriefCloud||{},user=cloud.user||{},meta=user.user_metadata||{};const values=[$('#userDisplayName')?.value,window.PromptAiUserProfile?.displayName,cloud.userProfile?.displayName,cloud.profile?.displayName,meta.display_name,meta.full_name,meta.name];for(const value of values){const name=firstName(value);if(name)return name}const email=String(user.email||'').trim();return email?firstName(email.split('@')[0]):''}
  // Frueher hing das zusaetzlich davon ab, dass der Ablauf versteckt ist - ein Zirkel: der
  // CSS-Riegel, der den Ablauf unter der Startseite wegnimmt, haengt an dieser Klasse, und die
  // fiel genau dann weg, wenn der Ablauf sichtbar wurde. Beides zugleich war damit moeglich.
  // Die Startseite ist der Zustand, sobald ihre Seite steht; alles andere folgt daraus.
  function homeVisible(){const page=$('#welcomePage');return Boolean(page&&!page.hidden&&getComputedStyle(page).display!=='none')}
  // Same fallback order the project list already uses (app.js): a project name, then a client
  // name, then the description itself. Most projects start from the console's free-text
  // description alone, with neither name field ever filled in - without this fallback the
  // "Letztes Projekt" row stayed hidden for exactly that, the most common, case.
  // Frueher las diese Zeile den Speicher selbst und kannte nur zwei der drei Stellen, an denen
  // ein Projektname stehen kann - deshalb blieb "Letztes Projekt" oft leer, obwohl etwas da war.
  function projectTitle(){return window.PromptAiProjectState?.title?.()||''}

  function ensureThemeToggle(){const actions=$('.topbar .top-actions');if(!actions)return;let button=$('#homeThemeToggle');if(!button){button=document.createElement('button');button.id='homeThemeToggle';button.type='button';button.className='home-theme-toggle';button.addEventListener('click',()=>$('#themeToggleBtn')?.click());actions.insertBefore(button,$('#topbarMenuToggle'))}const dark=document.documentElement.dataset.theme==='dark';button.textContent=dark?'☀':'◐';button.title=dark?'Helles Design':'Dunkles Design';button.setAttribute('aria-label',button.title)}

  function markup(){return `<section class="prompt-command-home" aria-label="Prompt.ai Start"><header class="prompt-home-intro"><span class="prompt-system-line">Workspace bereit</span><h1>Hallo <span id="promptHomeName">Lars</span>.</h1><p>Was möchtest du heute umsetzen?</p></header><form class="prompt-command-panel" id="promptCommandForm"><div class="prompt-command-top"><button class="prompt-mode-button" id="promptModeButton" type="button" aria-haspopup="listbox" aria-expanded="false">${icons.website}<span id="promptModeLabel">Internetseite erstellen</span><i class="mode-chevron" aria-hidden="true"></i></button><div class="prompt-mode-menu" id="promptModeMenu" role="listbox" aria-label="Arbeitsart wählen" hidden><button type="button" class="prompt-mode-option" role="option" data-command-mode="website" aria-checked="true">${icons.website}<span>Internetseite erstellen<small>Neues Website-Projekt</small></span></button><button type="button" class="prompt-mode-option" role="option" data-command-mode="free" aria-checked="false">${icons.prompt}<span>Freier Prompt<small>Text, Bild, Video, Code & mehr</small></span></button><button type="button" class="prompt-mode-option" role="option" data-command-mode="revision" data-locked="0" aria-checked="false">${icons.revision}<span>Website überarbeiten<small>Bestehende Seite gezielt ändern</small></span></button><button type="button" class="prompt-mode-option" role="option" data-command-mode="check" data-locked="0" aria-checked="false">${icons.shield}<span>Projekt prüfen<small>Aktuellen Stand prüfen lassen</small></span></button></div></div><textarea class="prompt-command-input" id="promptCommandInput" rows="5" minlength="8" placeholder="Beschreibe kurz, was entstehen soll …" aria-label="Projekt oder Aufgabe beschreiben"></textarea><button class="prompt-command-submit" id="promptCommandSubmit" type="submit" aria-label="Absenden"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6v5.5a2.5 2.5 0 0 1-2.5 2.5H5"/><path d="m9 10-4 4 4 4"/></svg></button><div class="prompt-attach-list" id="promptAttachList" aria-live="polite"></div><footer class="prompt-command-meta"><button type="button" class="prompt-attach-button" id="promptAttachButton" aria-haspopup="menu" aria-expanded="false" title="Anhang hinzufügen">+</button><div class="prompt-attach-menu" id="promptAttachMenu" role="menu" hidden><button type="button" role="menuitem" data-attach="file"><span>Bild oder Datei</span><i class="prompt-attach-count" id="promptAttachCountFile"></i></button><button type="button" role="menuitem" data-attach="url"><span>Link einfügen</span><i class="prompt-attach-count" id="promptAttachCountUrl"></i></button></div><button type="button" class="prompt-setup-line" id="promptSetupButton" aria-haspopup="dialog" aria-expanded="false" title="Settings" aria-label="Settings für diesen Auftrag"><svg class="prompt-setup-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M12 4.2v2M12 17.8v2M4.2 12h2M17.8 12h2M6.5 6.5l1.4 1.4M16.1 16.1l1.4 1.4M17.5 6.5l-1.4 1.4M7.9 16.1l-1.4 1.4"/></svg><i class="prompt-setup-tag" aria-hidden="true">Settings</i><span id="promptSetupSummary">Codex · Mit Rückfragen</span><i class="mode-chevron" aria-hidden="true"></i></button><dialog class="prompt-setup-sheet prompt-picker-dialog prompt-own-style" id="promptSetupSheet" aria-label="Settings für diesen Auftrag"><div class="prompt-picker-frame"><header><div><b>Settings für diesen Auftrag</b><small>Es ist immer genau eine Ziel-KI aktiv; welche Skills zur Wahl stehen und wie der Master-Prompt aufgebaut wird, richtet sich nach ihr. Was hier steht, gilt auch beim nächsten Auftrag.</small></div><button type="button" data-close aria-label="Schließen">×</button></header><div class="prompt-picker-dialog-body prompt-setup-grid"><div class="prompt-setup-section"><b>Ziel-KI</b><div id="promptAgentMenu"></div></div><div class="prompt-setup-section"><b>Ablauf</b><div id="promptFlowMenu"></div></div><div class="prompt-setup-section"><b>Vorlage</b><div id="promptTemplateMenu"></div></div><div class="prompt-setup-section"><b>Skills</b><div id="promptSkillsMenu"></div></div></div></div></dialog><span id="promptHomeMeta">Kontingent wird geladen</span><span class="prompt-plan-chip"><b id="promptHomePlan">Free</b></span><span class="prompt-command-error" id="promptCommandError" role="status"></span></footer></form><section class="prompt-latest" aria-label="Letztes Projekt"><span class="prompt-latest-icon">${icons.folder}</span><div class="prompt-latest-copy"><strong>Letztes Projekt</strong><small id="promptLatestTitle">Gespeicherten Arbeitsstand fortsetzen</small></div><button type="button" class="prompt-latest-action" id="promptLatestAction">Weiterarbeiten →</button></section></section>`}
  function ensureHome(){const page=$('#welcomePage');if(!page)return null;let home=$('.prompt-command-home',page);if(!home){page.insertAdjacentHTML('beforeend',markup());home=$('.prompt-command-home',page);bindHome(home)}return home}
  function modeCopy(mode){return mode==='free'?{label:'Freier Prompt',placeholder:'Beschreibe, welchen Prompt du brauchst …',icon:icons.prompt}:mode==='revision'?{label:'Website überarbeiten',placeholder:'Was soll an der bestehenden Website geändert werden?',icon:icons.revision}:{label:'Internetseite erstellen',placeholder:'Beschreibe kurz, was entstehen soll …',icon:icons.website}}
  function closeModeMenu(home){const menu=$('#promptModeMenu',home);if(menu)menu.hidden=true;$('#promptModeButton',home)?.setAttribute('aria-expanded','false')}
  // Revision und Prüfen sind ab Pro - dieselbe Regel wie bei den Werkzeug-Kacheln auf der
  // Startseite, nur direkt aus dem Konsolen-Menü gelesen statt aus deren DOM-Sperre.
  function commandModeLocked(mode){
    if(mode!=='revision'&&mode!=='check')return false;
    const access=window.PromptAiAccess||{};
    return !access.isAdmin&&(access.plan||'free')==='free';
  }
  function syncModeMenuLocks(home){
    home.querySelectorAll('[data-command-mode]').forEach(option=>{
      option.dataset.locked=commandModeLocked(option.dataset.commandMode)?'1':'0';
    });
  }
  function selectMode(mode){const home=ensureHome();if(!home)return;
    // Eine Fehlerzeile aus einem vorherigen Versuch (z.B. "Bitte kurz beschreiben") galt nur für
    // den Modus, in dem sie entstand - beim Wechsel muss sie mit weg, sonst klebt sie dauerhaft.
    const errorSlot=$('#promptCommandError',home);if(errorSlot)errorSlot.textContent='';
    // Gesperrt heisst hier: sofort der Tarifhinweis, kein stiller Wechsel und keine Vorschau
    // einer Funktion, die ohnehin nicht nutzbar ist.
    if(commandModeLocked(mode)){closeModeMenu(home);document.querySelector('#plansDialog')?.showModal();return}
    // Prüfen ist kein Schreibmodus - es gibt nichts zu beschreiben. Der Eintrag startet
    // die Prüfung direkt und lässt die eingestellte Arbeitsart stehen.
    if(mode==='check'){closeModeMenu(home);proxy('workspacePreviewBtn');return}
    home.dataset.commandMode=mode;home.dataset.modeTouched='1';const copy=modeCopy(mode),button=$('#promptModeButton',home);button.innerHTML=`${copy.icon}<span id="promptModeLabel">${copy.label}</span><i class="mode-chevron" aria-hidden="true"></i>`;button.setAttribute('aria-expanded','false');$('#promptModeMenu',home).hidden=true;$('#promptCommandInput',home).placeholder=copy.placeholder;syncMeta();home.querySelectorAll('[data-command-mode]').forEach(option=>option.setAttribute('aria-checked',String(option.dataset.commandMode===mode)));$('#promptCommandInput',home).focus()}
  async function submitCommand(event){event.preventDefault();applyFlow(flowMode());const home=ensureHome(),input=$('#promptCommandInput',home),error=$('#promptCommandError',home),mode=home.dataset.commandMode||'website',brief=input.value.trim();if(brief.length<8){error.textContent='Bitte kurz beschreiben.';input.focus();return}error.textContent='';const button=$('#promptCommandSubmit',home);button.disabled=true;try{if(window.PromptAiHomeEntry?.submitBrief)await window.PromptAiHomeEntry.submitBrief(mode,brief);else if(mode==='website')await window.PromptAiProjectStart?.startFromBrief?.(brief);else{window.PromptAiHomeEntry?.[mode==='free'?'openFreePrompt':'openRevision']?.();setTimeout(()=>{const field=$('#simpleIntakeText');if(field){field.value=brief;$('#simpleIntakeContinue')?.click()}},40)}}finally{setTimeout(()=>{button.disabled=false},350)}}
  // Ein leeres Feld mit einem festen Beispieltext sagt einmal, was hier hineingehört. Wechselnde
  // Beispiele zeigen die Spannbreite und dienen als Anregung. Beim Hineinklicken verschwindet der
  // Vorschlag, damit er nicht mit eigenem Text verwechselt wird; bleibt das Feld leer, kommt er
  // nach ein paar Sekunden zurück. Die Liste teilt sich mit der Einstiegsseite.
  function rotatePlaceholder(field){
    if(!field||field.__rotating)return;
    const examples=window.PromptAiExamples;
    if(!Array.isArray(examples)||!examples.length)return;
    field.__rotating=true;
    let index=Math.floor(Math.random()*examples.length),timer=0,idle=0,paused=false;
    const base='Beschreibe kurz, was entstehen soll …';
    const show=()=>{
      // Nur im Website-Modus: die anderen Arbeitsarten haben ihren eigenen Platzhalter.
      const home=field.closest('.prompt-command-home');
      if(paused||field.value||(home&&home.dataset.commandMode&&home.dataset.commandMode!=='website'))return;
      const item=examples[index%examples.length];
      field.placeholder=`z. B. ${item.head}${item.rest}`;
    };
    // Ein harter Textwechsel alle 3,8 Sekunden wirkt gehackt - der Satz springt einfach um.
    // Jetzt blendet der Platzhalter aus, wechselt im unsichtbaren Moment und blendet wieder ein,
    // und er steht dabei deutlich länger. Das Ausblenden macht CSS über die Platzhalterfarbe.
    const swap=()=>{
      const home=field.closest('.prompt-command-home');
      if(paused||field.value||(home&&home.dataset.commandMode&&home.dataset.commandMode!=='website'))return;
      field.classList.add('is-hint-fading');
      setTimeout(()=>{index++;show();field.classList.remove('is-hint-fading')},520);
    };
    const start=()=>{clearInterval(timer);show();timer=setInterval(swap,7200)};
    const stop=()=>{clearInterval(timer);timer=0};
    field.addEventListener('focus',()=>{paused=true;stop();field.placeholder=base});
    field.addEventListener('blur',()=>{clearTimeout(idle);idle=setTimeout(()=>{if(!field.value){paused=false;start()}},3000)});
    field.addEventListener('input',()=>{
      clearTimeout(idle);
      if(field.value){stop();return}
      // Wieder leer: nach drei Sekunden Ruhe kommen die Vorschläge zurück.
      idle=setTimeout(()=>{if(!field.value&&document.activeElement!==field){paused=false;start()}},3000);
    });
    start();
  }
  function proxy(id){const target=$(`#${id}`);if(!target)return;if(target.disabled||target.getAttribute('aria-disabled')==='true'){const message=target.title||'Diese Funktion ist in deinem Tarif noch nicht verfügbar.';const error=$('#promptCommandError');if(error)error.textContent=message;return}target.click()}
  // Die Startseite kam immer mit "Internetseite erstellen" hoch. Wer meistens freie Prompts
  // schreibt, musste das jedes Mal umstellen - deshalb ist die Arbeitsart jetzt eine
  // Voreinstellung. Ist sie im Tarif nicht enthalten, bleibt es beim Website-Modus, statt
  // dass die Startseite mit einem gesperrten Eintrag aufmacht.
  function preferredMode(){
    const wish=window.PromptAiPreferences?.defaultCommandMode||'website';
    if(wish==='check')return 'website';
    if(!['website','free','revision'].includes(wish))return 'website';
    return commandModeLocked(wish)?'website':wish;
  }
  // Wie selectMode, aber ohne Fokus in das Textfeld zu ziehen - beim Öffnen der Startseite
  // soll nichts springen.
  function applyPreferredMode(home){
    if(!home||home.dataset.modeTouched==='1')return;
    const mode=preferredMode();
    if(home.dataset.commandMode===mode)return;
    const copy=modeCopy(mode),button=$('#promptModeButton',home);if(!button)return;
    home.dataset.commandMode=mode;
    button.innerHTML=`${copy.icon}<span id="promptModeLabel">${copy.label}</span><i class="mode-chevron" aria-hidden="true"></i>`;
    const input=$('#promptCommandInput',home);if(input)input.placeholder=copy.placeholder;
    home.querySelectorAll('[data-command-mode]').forEach(option=>option.setAttribute('aria-checked',String(option.dataset.commandMode===mode)));
  }
  function bindHome(home){home.dataset.commandMode='website';$('#promptModeButton',home).addEventListener('click',()=>{const menu=$('#promptModeMenu',home),open=menu.hidden;menu.hidden=!open;$('#promptModeButton',home).setAttribute('aria-expanded',String(open))});home.querySelectorAll('[data-command-mode]').forEach(option=>option.addEventListener('click',()=>selectMode(option.dataset.commandMode)));$('#promptCommandForm',home).addEventListener('submit',submitCommand);
    // Unlike the attach- and setup-menus, this one never got a click-outside handler - it stayed
    // open no matter what else got clicked, including tapping straight into the textarea below it.
    document.addEventListener('click',event=>{
      if(event.target.closest?.('#promptModeButton,#promptModeMenu'))return;
      closeModeMenu(home);
    });
    // Die Zeile zeigte das letzte Projekt zwar an, war aber nie mit dem echten Knopf verbunden:
    // ein Klick - auf die Zeile wie auf "Weiterarbeiten" - tat schlicht gar nichts. Die ganze
    // Zeile ist jetzt die Schaltfläche, das ist die Trefferfläche, die man ohnehin anzielt.
    $('.prompt-latest',home)?.addEventListener('click',()=>{
      const target=$('#workspaceLastProjectBtn');
      if(!target)return;
      if(target.disabled||target.getAttribute('aria-disabled')==='true'){document.querySelector('#plansDialog')?.showModal();return}
      target.click();
    });
    $('#promptAttachButton',home).addEventListener('click',()=>{
      const menu=$('#promptAttachMenu',home),open=menu.hidden;
      menu.hidden=!open;$('#promptAttachButton',home).setAttribute('aria-expanded',String(open));
    });
    home.querySelectorAll('[data-attach]').forEach(button=>button.addEventListener('click',()=>{
      $('#promptAttachMenu',home).hidden=true;$('#promptAttachButton',home).setAttribute('aria-expanded','false');
      if(button.dataset.attach==='file')attachFile();else attachUrl();
    }));
    document.addEventListener('click',event=>{
      if(event.target.closest?.('#promptAttachButton,#promptAttachMenu'))return;
      const m=$('#promptAttachMenu',home);if(m)m.hidden=true;
      $('#promptAttachButton',home)?.setAttribute('aria-expanded','false');
    });
    for(const selector of ['#urlReferences','#imageReferences','#documentReferences']){
      const host=document.querySelector(selector);
      if(host)new MutationObserver(()=>setTimeout(syncAttachments,60)).observe(host,{childList:true,subtree:true});
    }
    const setupButton=$('#promptSetupButton',home),setupSheet=$('#promptSetupSheet',home);
    // Vier Abschnitte passen nicht unter die Konsole, ohne dass man scrollt oder etwas unter der
    // Fensterkante verschwindet - und scrollen war hier ausdrücklich nicht gewollt. Die Settings
    // nehmen darum die ganze Seite ein, wie jedes andere Fenster der App auch.
    // Das Fenster gehört nicht in die Konsolen-Form: ein Klick darin wäre sonst ein Absenden,
    // und ein Formular im Formular verwirft der Parser ohnehin.
    if(setupSheet.parentElement!==document.body)document.body.appendChild(setupSheet);
    setupSheet.querySelector('[data-close]')?.addEventListener('click',()=>setupSheet.close());
    setupButton.addEventListener('click',()=>{
      syncAgentMenu();syncFlowUi();syncTemplateMenu();syncSkillsMenu();
      if(!setupSheet.open)setupSheet.showModal();
      setupButton.setAttribute('aria-expanded','true');
    });
    setupSheet.addEventListener('close',()=>{setupButton.setAttribute('aria-expanded','false');syncSetupSummary()});
    // Klick auf die Fläche daneben schließt - dieselbe Geste wie beim Blatt vorher.
    setupSheet.addEventListener('click',event=>{if(event.target===setupSheet)setupSheet.close()});
    // Zeichen und Token laufen mit, waehrend man schreibt - syncMeta() kannte den Text schon,
    // es fehlte nur der Aufruf bei jedem Tastendruck. 'input' allein reicht auf dem Telefon nicht
    // zuverlaessig: Android-Tastaturen fassen Woerter beim Tippen oft in eine Komposition
    // zusammen und uebernehmen Vorschlaege teils ohne ein einfaches 'input' danach.
    ['input','compositionend','change'].forEach(type=>$('#promptCommandInput',home).addEventListener(type,syncMeta));
    // paste/cut melden sich, bevor der Browser den Text tatsaechlich einfuegt oder entfernt - ein
    // sofortiger Aufruf haette noch den alten Stand gelesen. Einen Tick warten, dann stimmt er.
    ['paste','cut'].forEach(type=>$('#promptCommandInput',home).addEventListener(type,()=>setTimeout(syncMeta,0)));
    rotatePlaceholder($('#promptCommandInput',home));
    // Enter schickt ab - aber nur dort, wo Enter auch wirklich Enter heisst. Auf dem Telefon
    // ist die Taste der Zeilenumbruch, und wer mitten im Schreiben absendet, verliert den Rest
    // des Satzes. Mit Umschalt bleibt es ueberall ein Umbruch, mit Strg/Cmd geht es immer los.
    $('#promptCommandInput',home).addEventListener('keydown',event=>{
      if(event.key!=='Enter'||event.isComposing)return;
      const withModifier=event.metaKey||event.ctrlKey;
      let fine=false;try{fine=matchMedia('(pointer:fine)').matches}catch{}
      if(!withModifier&&(!fine||event.shiftKey))return;
      event.preventDefault();
      const form=$('#promptCommandForm',home);
      if(form?.requestSubmit)form.requestSubmit();else submitCommand(new Event('submit'));
    })}
  function syncHome(){enforceSurface();const visible=homeVisible();document.documentElement.classList.toggle('prompt-home-surface',visible);if(!visible)return;const home=ensureHome();if(!home)return;$('#promptHomeName',home).textContent=resolvedName()||'Lars';const access=window.PromptAiAccess||{},plan=access.isAdmin?'Ultimate':String(access.plan||'free');$('#promptHomePlan',home).textContent=plan.charAt(0).toUpperCase()+plan.slice(1);const title=projectTitle(),original=$('#workspaceLastProjectBtn'),latest=$('.prompt-latest',home);
    // Ohne gespeichertes Projekt bot die Zeile etwas an, das es nicht gibt.
    if(latest)latest.hidden=!title;
    $('#promptLatestTitle',home).textContent=title||'Gespeicherten Arbeitsstand fortsetzen';$('#promptLatestAction',home).disabled=Boolean(original?.disabled);syncMeta();syncFlowUi();applyFlow(flowMode());syncAttachments();syncSetupSummary();syncModeMenuLocks(home);applyPreferredMode(home);ensureThemeToggle();const topbar=$('body>.topbar')||$('.topbar');if(topbar){topbar.hidden=false;topbar.removeAttribute('aria-hidden')}}
  // Entprellt, aber mit Deckel: die Seite schreibt waehrend Ladeanimationen jeden Frame an
  // style-Attributen, und jede dieser Aenderungen hat den Timer neu gestartet. syncHome lief
  // dann minutenlang nicht - und genau daran haengt die Klasse, die Startseite und Ablauf
  // auseinanderhaelt. Nach spaetestens 400ms laeuft er, egal wie unruhig es zugeht.
  let settleDeadline=0;
  function schedule(){
    const now=Date.now();
    if(!settleTimer)settleDeadline=now+400;
    clearTimeout(settleTimer);
    settleTimer=setTimeout(()=>{settleTimer=0;syncHome()},Math.max(0,Math.min(25,settleDeadline-now)));
  }
  // Startseite und Arbeitsbereich sind zwei Zustaende, nie beide zugleich. Der Riegel dafuer lag
  // bisher nur im Stylesheet und haengt daran, dass der Ablauf ueber [hidden] gefuehrt wird -
  // jeder andere Weg dorthin zeigte wieder beides untereinander. Hier wird der Zustand selbst
  // hergestellt, nicht nur die Anzeige.
  function enforceSurface(){
    const page=$('#welcomePage'),flow=$('#workflowApp');
    if(!page||!flow)return;
    if(!flow.hidden&&getComputedStyle(flow).display!=='none'&&!page.hidden)page.hidden=true;
  }
  function init(){installStyles();syncHome();enforceSurface();const observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class','style']});new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});document.addEventListener('click',event=>{if(event.target.closest?.('#brandHome,.guided-clean-exit,#promptWorkflowLoaderClose'))setTimeout(syncHome,80)},true);window.addEventListener('promptai:access',schedule);window.addEventListener('promptai:quota',syncMeta);window.addEventListener('promptai:credits',syncMeta);window.addEventListener('promptai:references',()=>{syncAttachCounts();syncMeta()});window.addEventListener('promptai:preferences',()=>{const home=$('.prompt-command-home');if(home){delete home.dataset.modeTouched;applyPreferredMode(home)}});window.addEventListener('pageshow',schedule);window.addEventListener('promptai:home',syncHome);window.SiteBriefCloud?.subscribe?.(schedule);let count=0;const warm=setInterval(()=>{syncHome();if(++count>24)clearInterval(warm)},180)}
  window.PromptAiHomeSurface={sync:syncHome};
  installStyles();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
