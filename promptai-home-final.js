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
      .prompt-mode-option{display:grid;width:100%;grid-template-columns:32px 1fr;align-items:center;gap:8px;min-height:52px;padding:8px 11px;border:0;border-radius:10px;background:transparent;color:inherit;text-align:left;font:700 13px/1.2 Arial,Helvetica,sans-serif;cursor:pointer}
      .prompt-mode-option:hover,.prompt-mode-option[aria-checked="true"]{background:#e8f3fa;color:#174f76}
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
      .prompt-attach-input{display:flex;gap:8px;width:100%}
      .prompt-attach-input input{flex:1 1 auto;min-height:34px;padding:0 11px;border:1px solid #33465a;border-radius:9px;background:#0f1721;color:#eef6fb;font-size:13px}
      .prompt-attach-input button{min-height:34px;padding:0 12px;border:1px solid #33465a;border-radius:9px;background:transparent;color:#c8d6e2;font:700 11px/1 Arial,Helvetica,sans-serif;cursor:pointer}
      .prompt-attach-button{display:grid;place-items:center;width:30px;height:30px;padding:0;border:1px solid #33465a;border-radius:9px;background:transparent;color:#c8d6e2;font:400 19px/1 Arial,Helvetica,sans-serif;cursor:pointer}
      .prompt-attach-button:hover{border-color:#4d637a;color:#e7f1f9}
      .prompt-attach-menu{position:absolute;z-index:9;left:14px;bottom:52px;width:min(240px,calc(100vw - 60px));padding:7px;border:1px solid rgba(255,255,255,.14);border-radius:14px;background:#141e28;box-shadow:0 24px 60px rgba(0,0,0,.5)}
      .prompt-attach-menu[hidden]{display:none!important}
      .prompt-attach-menu button{display:block;width:100%;padding:9px 11px;border:0;border-radius:9px;background:transparent;color:#dfe9f2;text-align:left;font:700 12px/1.3 Arial,Helvetica,sans-serif;cursor:pointer}
      .prompt-attach-menu button:hover{background:rgba(45,147,201,.18);color:#f4f9fd}
      .prompt-setup-line{display:inline-flex;align-items:center;gap:7px;max-width:calc(100% - 46px);min-height:30px;padding:0 10px;border:1px solid transparent;border-radius:9px;background:transparent;color:var(--home-muted);font:650 11px/1 Arial,Helvetica,sans-serif;text-align:left;cursor:pointer}
      .prompt-setup-line:hover,.prompt-setup-line[aria-expanded="true"]{border-color:#33465a;color:#e7f1f9}
      .prompt-setup-line>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .prompt-setup-line .mode-chevron{flex:0 0 auto;width:6px;height:6px;margin:0;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg) translateY(-2px)}
      .prompt-setup-sheet{position:absolute;z-index:9;left:14px;right:14px;bottom:52px;max-height:min(52vh,360px);overflow-y:auto;overscroll-behavior:contain;padding:6px;border:1px solid rgba(255,255,255,.14);border-radius:16px;background:#141e28;box-shadow:0 26px 64px rgba(0,0,0,.55)}
      .prompt-setup-sheet[hidden]{display:none!important}
      .prompt-setup-section{padding:8px 6px 10px;border-bottom:1px solid rgba(255,255,255,.07)}
      .prompt-setup-section:last-of-type{border-bottom:0}
      .prompt-setup-section>b{display:block;padding:0 5px 7px;color:#8b9dc3;font:850 9px/1 ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase}
      .prompt-setup-section button{display:block;width:100%;padding:9px 11px;border:0;border-radius:9px;background:transparent;color:#dfe9f2;text-align:left;font:700 12.5px/1.3 Arial,Helvetica,sans-serif;cursor:pointer}
      .prompt-setup-section button small{display:block;margin-top:3px;color:#8b9dc3;font-size:10.5px;font-weight:550;line-height:1.4}
      .prompt-setup-section button[aria-checked="true"],.prompt-setup-section button:hover{background:rgba(45,147,201,.18);color:#f4f9fd}
      .prompt-setup-section button[data-locked="1"]{color:#8b9dc3}
      .prompt-setup-section button[data-locked="1"]:after{content:"ab Pro";float:right;color:var(--home-orange);font-size:9px;font-weight:850;letter-spacing:.08em}
      .prompt-setup-note{margin:0;padding:9px 11px 4px;color:#7d8fa3;font:550 10px/1.5 Arial,Helvetica,sans-serif}
      .prompt-flow-button{display:inline-flex;align-items:center;gap:7px;min-height:30px;padding:0 10px;border:1px solid #33465a;border-radius:9px;background:transparent;color:#c8d6e2;font:700 11px/1 Arial,Helvetica,sans-serif;white-space:nowrap;cursor:pointer}
      .prompt-flow-button:hover{border-color:#4d637a;color:#e7f1f9}
      .prompt-flow-button .mode-chevron{width:6px;height:6px;margin:0;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg) translateY(-2px)}
      .prompt-flow-menu{position:absolute;z-index:9;left:14px;bottom:52px;width:min(300px,calc(100vw - 60px));padding:7px;border:1px solid rgba(255,255,255,.14);border-radius:14px;background:#141e28;box-shadow:0 24px 60px rgba(0,0,0,.5)}
      .prompt-flow-menu[hidden]{display:none!important}
      .prompt-flow-menu button{display:block;width:100%;padding:9px 11px;border:0;border-radius:9px;background:transparent;color:#dfe9f2;text-align:left;font:700 12px/1.3 Arial,Helvetica,sans-serif;cursor:pointer}
      .prompt-flow-menu button small{display:block;margin-top:3px;color:#8b9dc3;font-size:10px;font-weight:550;line-height:1.4}
      .prompt-flow-menu button[aria-checked="true"],.prompt-flow-menu button:hover{background:rgba(45,147,201,.18);color:#f4f9fd}
      .prompt-flow-menu button[data-locked="1"]{color:#8b9dc3}
      .prompt-flow-menu button[data-locked="1"]:after{content:"ab Pro";float:right;margin-top:-14px;color:var(--home-orange);font-size:9px;font-weight:850;letter-spacing:.08em}
      .prompt-command-meta{display:flex;align-items:center;gap:16px;min-height:56px;padding:0 22px;border-top:1px solid #31404e;color:#91a1ae;font-size:10px}
      .prompt-command-meta span+span{padding-left:16px;border-left:1px solid #394a59}.prompt-command-meta b{color:#68b9ed;font-weight:750}.prompt-command-error{margin-left:auto;color:#ff9d78}.prompt-command-error:empty{display:none}
      .prompt-latest{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:14px;align-items:center;margin-top:18px;padding:14px 16px;border:1px solid var(--home-line);border-radius:17px;background:var(--home-card);color:var(--home-ink)}
      .prompt-latest-icon{display:grid;width:45px;height:45px;place-items:center;border-radius:13px;background:var(--home-soft);color:var(--home-blue-deep)}
      .prompt-latest-copy strong,.prompt-latest-copy small{display:block}.prompt-latest-copy strong{font-size:13px}.prompt-latest-copy small{margin-top:4px;color:var(--home-muted);font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .prompt-latest-action{min-height:38px;padding:0 12px;border:0;background:transparent;color:var(--home-blue-deep);font-size:11px;font-weight:800;cursor:pointer}.prompt-latest-action:disabled{opacity:.4;cursor:not-allowed}
      html.prompt-home-surface #promptFooter{width:100%;margin:0;background:transparent!important;border-top:1px solid var(--home-line)!important}html.prompt-home-surface #promptFooter .prompt-footer-content{min-height:56px!important;padding:12px clamp(14px,4vw,32px)!important}
      @media(max-width:700px){html.prompt-home-surface body:before{display:none}html.prompt-home-surface body.prompt-unified-ui>.topbar,html.prompt-home-surface body>.topbar{top:6px!important;width:calc(100% - 20px)!important;height:60px!important;margin-top:7px!important;padding:0 8px!important;border-radius:15px!important}html.prompt-home-surface .topbar .brand-mark{width:36px!important;height:36px!important}html.prompt-home-surface .topbar .brand-copy strong{font-size:17px!important}html.prompt-home-surface .topbar #upgradeBtn{min-height:36px!important;padding:0 10px!important;font-size:10px!important}html.prompt-home-surface .topbar #topbarMenuToggle,html.prompt-home-surface .home-theme-toggle{width:36px!important;height:36px!important;min-height:36px!important;border-radius:10px!important}html.prompt-home-surface .welcome-page{width:100%!important;max-width:none!important;padding:58px 20px 40px!important}.prompt-home-intro{min-height:160px;padding:0 6px 34px}.prompt-home-intro:after{right:-165px;top:-105px}.prompt-home-intro:before{right:-32px;top:18px}.prompt-home-intro h1{font-size:clamp(45px,14vw,64px)!important}.prompt-home-intro p{max-width:310px;font-size:14px}.prompt-command-panel{border-radius:19px}.prompt-command-panel:before{right:16px;top:16px;font-size:7px}.prompt-command-top{padding:14px 14px 0}.prompt-mode-menu{left:14px;top:64px}.prompt-mode-button{max-width:238px;min-height:42px;font-size:12px}.prompt-command-input{min-height:190px;padding:25px 65px 20px 18px;font-size:17px}.prompt-command-submit{right:16px;bottom:66px;width:48px;height:48px;min-height:48px}.prompt-command-meta{min-height:54px;padding:0 16px;gap:11px;font-size:9px}.prompt-command-meta span+span{padding-left:11px}.prompt-command-error{display:none!important}.prompt-latest{grid-template-columns:auto minmax(0,1fr);padding:12px}.prompt-latest-action{grid-column:1/-1;width:100%;border-top:1px solid var(--home-line);padding-top:11px}html.prompt-home-surface #promptFooter{display:none!important}
      /* Vier Knöpfe und zwei Angaben passen nicht in eine Zeile: die Knöpfe bleiben oben,
         Kontingent und Tarif rutschen darunter. Sonst bricht "Mit Rückfragen" mitten im Wort. */
      .prompt-command-meta{flex-wrap:wrap!important;row-gap:9px!important;min-height:0!important;padding:11px 16px!important}
      .prompt-command-meta>#promptTemplateButton{margin-right:auto}
      .prompt-command-meta>#promptHomeMeta{order:9;flex:0 1 auto;padding-left:0!important;border-left:0!important}
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
  function quotaLine(mode){
    const summary=window.PromptAiQuota?.summary?.();
    if(window.PromptAiAccess?.isAdmin)return 'Kontingent unbegrenzt';
    if(!summary?.metrics)return '';
    const [key,label]=METRIC[mode]||METRIC.website,item=summary.metrics[key];
    if(!item)return '';
    const limit=Number(item.limit||0);
    if(!limit)return `${label}: nicht im Tarif`;
    const left=Math.max(0,Number(item.remaining??limit-Number(item.used||0)));
    return `${left}/${limit} ${label}`;
  }
  function syncMeta(){
    const home=$('.prompt-command-home');if(!home)return;
    const field=$('#promptCommandInput',home),slot=$('#promptHomeMeta',home);
    if(!field||!slot)return;
    const text=field.value.trim();
    // Beim Schreiben zählt, wie lang der Auftrag wird; solange nichts dasteht, was noch übrig ist.
    const next=text?`${text.length} Zeichen · ≈${tokenGuess(text)} Token`:quotaLine(home.dataset.commandMode||'website');
    if(slot.textContent!==next)slot.textContent=next;
  }

  // Anhänge laufen über die vorhandenen Eingaben der Referenzen: der Dateiknopf öffnet
  // #imageInput, der Link geht durch #referenceUrl und #addUrlBtn. Damit gelten dieselben
  // Formate, Grenzen und Tarifregeln wie bisher - hier ist nur der Ort des Klicks neu. Die
  // Kacheln spiegeln die echte Liste, es gibt also keine zweite Wahrheit.
  function attachFile(){const input=$('#imageInput');if(input)input.click();else message('Anhänge stehen im Projekt bereit.')}
  function attachUrl(){
    const list=$('#promptAttachList');if(!list)return;
    let row=$('.prompt-attach-input',list);
    if(!row){
      row=document.createElement('div');row.className='prompt-attach-input';
      row.innerHTML='<input type="url" placeholder="https://beispiel.de" aria-label="Link einfügen"><button type="button">Übernehmen</button>';
      list.prepend(row);list.hidden=false;
      const apply=()=>{
        const value=$('input',row).value.trim();if(!value){row.remove();return}
        const field=$('#referenceUrl');if(field){field.value=value;$('#addUrlBtn')?.click()}
        row.remove();setTimeout(syncAttachments,120);
      };
      $('button',row).addEventListener('click',apply);
      $('input',row).addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();apply()}if(e.key==='Escape')row.remove()});
    }
    list.hidden=false;$('input',row).focus();
  }
  function message(text){const error=$('#promptCommandError');if(error)error.textContent=text}
  // Was in den echten Listen steht, steht auch hier - Reihenfolge und Anzahl inklusive.
  function syncAttachments(){
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
    list.hidden=!items.length&&!$('.prompt-attach-input',list);
  }

  // Vorlagen und Skills gibt es bereits: die Vorlage als <select id="templateSelect">, die
  // Skills als Reihen mit Kontrollkästchen in #skillSelection. Beide Menüs hier lesen genau
  // diese Elemente und bedienen sie - keine zweite Liste, keine zweite Sperre.
  function syncTemplateMenu(){
    const menu=$('#promptTemplateMenu'),select=document.querySelector('#templateSelect');
    if(!menu)return;
    if(!select){menu.innerHTML='<p class="prompt-picker-empty">Vorlagen stehen im Projekt bereit.</p>';return}
    const current=select.value;
    menu.innerHTML='';
    for(const option of select.options){
      const button=document.createElement('button');
      button.type='button';button.setAttribute('role','menuitemradio');
      button.setAttribute('aria-checked',String(option.value===current));
      button.textContent=option.textContent;
      button.addEventListener('click',()=>{
        select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));
        setTimeout(syncTemplateMenu,80);
      });
      menu.appendChild(button);
    }
    syncSetupSummary();
  }
  function syncSkillsMenu(){
    const menu=$('#promptSkillsMenu'),host=document.querySelector('#skillSelection');
    if(!menu)return;
    const locked=host?.querySelector('.feature-lock-note');
    if(locked){menu.innerHTML='<p class="prompt-picker-empty">'+(locked.querySelector('strong')?.textContent||'Skills sind in diesem Tarif nicht aktiv.')+'</p>';return}
    const rows=[...(host?.querySelectorAll('.selection-row')||[])];
    if(!rows.length){menu.innerHTML='<p class="prompt-picker-empty">Noch keine Skills angelegt. Bibliothek → Agent-Skills.</p>';return}
    // Nach Agent gruppieren - der steht im <code> der Reihe (Claude, Codex, global ...).
    const groups=new Map();
    for(const row of rows){
      const key=(row.querySelector('code')?.textContent||'Alle Agents').trim();
      if(!groups.has(key))groups.set(key,[]);
      groups.get(key).push(row);
    }
    menu.innerHTML='';
    for(const [group,list] of groups){
      const head=document.createElement('b');head.className='prompt-picker-group';head.textContent=group;menu.appendChild(head);
      for(const row of list){
        const box=row.querySelector('input[type="checkbox"]');
        const button=document.createElement('button');
        button.type='button';button.setAttribute('role','menuitemcheckbox');
        button.setAttribute('aria-checked',String(Boolean(box?.checked)));
        if(box?.disabled)button.dataset.always='1';
        button.textContent=(row.querySelector('strong')?.textContent||'Skill').slice(0,40);
        button.addEventListener('click',()=>{
          if(box&&!box.disabled)box.click();
          setTimeout(()=>{syncSkillsMenu();syncSetupSummary()},80);
        });
        menu.appendChild(button);
      }
    }
  }

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
    applyFlow(mode);
    // Erst merken, wenn der echte Schalter wirklich umgesprungen ist. app.js lehnt einen
    // Ablauf ab, der nicht zum Tarif gehört (setMode öffnet dann die Tarifseite) - ohne
    // diese Prüfung stünde unten ein Ablauf, der gar nicht gilt.
    const active=$('.mode-switch button.active')?.dataset.mode;
    if(active&&active!==mode){syncFlowUi();return}
    try{localStorage.setItem(FLOW_KEY,mode)}catch{}
    syncFlowUi();
  }
  const FLOW_NOTE={guided:'Fragt nur nach, wo es das Ergebnis ändert',auto:'Briefing rein, Prompt raus',expert:'Alle Schritte bleiben offen'};
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
    const parts=[FLOW_LABEL[flowMode()]];
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
  function homeVisible(){const page=$('#welcomePage'),workflow=$('#workflowApp');return Boolean(page&&!page.hidden&&getComputedStyle(page).display!=='none'&&(!workflow||workflow.hidden||getComputedStyle(workflow).display==='none'))}
  function projectTitle(){try{const state=JSON.parse(localStorage.getItem('sitebrief-v6-state')||'{}');return String(state.projectName||state.project?.name||state.project?.client?.name||'').trim()}catch{return ''}}

  function ensureThemeToggle(){const actions=$('.topbar .top-actions');if(!actions)return;let button=$('#homeThemeToggle');if(!button){button=document.createElement('button');button.id='homeThemeToggle';button.type='button';button.className='home-theme-toggle';button.addEventListener('click',()=>$('#themeToggleBtn')?.click());actions.insertBefore(button,$('#topbarMenuToggle'))}const dark=document.documentElement.dataset.theme==='dark';button.textContent=dark?'☀':'◐';button.title=dark?'Helles Design':'Dunkles Design';button.setAttribute('aria-label',button.title)}

  function markup(){return `<section class="prompt-command-home" aria-label="Prompt.ai Start"><header class="prompt-home-intro"><span class="prompt-system-line">Workspace bereit</span><h1>Hallo <span id="promptHomeName">Lars</span>.</h1><p>Was möchtest du heute umsetzen?</p></header><form class="prompt-command-panel" id="promptCommandForm"><div class="prompt-command-top"><button class="prompt-mode-button" id="promptModeButton" type="button" aria-haspopup="listbox" aria-expanded="false">${icons.website}<span id="promptModeLabel">Internetseite erstellen</span><i class="mode-chevron" aria-hidden="true"></i></button><div class="prompt-mode-menu" id="promptModeMenu" role="listbox" aria-label="Arbeitsart wählen" hidden><button type="button" class="prompt-mode-option" role="option" data-command-mode="website" aria-checked="true">${icons.website}<span>Internetseite erstellen<small>Neues Website-Projekt</small></span></button><button type="button" class="prompt-mode-option" role="option" data-command-mode="free" aria-checked="false">${icons.prompt}<span>Freier Prompt<small>Text, Bild, Video, Code & mehr</small></span></button><button type="button" class="prompt-mode-option" role="option" data-command-mode="revision" aria-checked="false">${icons.revision}<span>Website überarbeiten<small>Bestehende Seite gezielt ändern</small></span></button><button type="button" class="prompt-mode-option" role="option" data-command-mode="check" aria-checked="false">${icons.shield}<span>Projekt prüfen<small>Aktuellen Stand prüfen lassen</small></span></button></div></div><textarea class="prompt-command-input" id="promptCommandInput" rows="5" minlength="8" placeholder="Beschreibe kurz, was entstehen soll …" aria-label="Projekt oder Aufgabe beschreiben"></textarea><button class="prompt-command-submit" id="promptCommandSubmit" type="submit" aria-label="Absenden"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6v5.5a2.5 2.5 0 0 1-2.5 2.5H5"/><path d="m9 10-4 4 4 4"/></svg></button><div class="prompt-attach-list" id="promptAttachList" aria-live="polite"></div><footer class="prompt-command-meta"><button type="button" class="prompt-attach-button" id="promptAttachButton" aria-haspopup="menu" aria-expanded="false" title="Anhang hinzufügen">+</button><div class="prompt-attach-menu" id="promptAttachMenu" role="menu" hidden><button type="button" role="menuitem" data-attach="file">Bild oder Datei</button><button type="button" role="menuitem" data-attach="url">Link einfügen</button></div><button type="button" class="prompt-setup-line" id="promptSetupButton" aria-haspopup="dialog" aria-expanded="false"><span id="promptSetupSummary">Mit Rückfragen</span><i class="mode-chevron" aria-hidden="true"></i></button><div class="prompt-setup-sheet" id="promptSetupSheet" role="dialog" aria-label="Einstellungen für diesen Auftrag" hidden><div class="prompt-setup-section"><b>Ablauf</b><div id="promptFlowMenu"></div></div><div class="prompt-setup-section"><b>Vorlage</b><div id="promptTemplateMenu"></div></div><div class="prompt-setup-section"><b>Skills</b><div id="promptSkillsMenu"></div></div><p class="prompt-setup-note">Was du hier einstellst, gilt auch beim nächsten Mal.</p></div><span id="promptHomeMeta">Kontingent wird geladen</span><span><b id="promptHomePlan">Free</b></span><span class="prompt-command-error" id="promptCommandError" role="status"></span></footer></form><section class="prompt-latest" aria-label="Letztes Projekt"><span class="prompt-latest-icon">${icons.folder}</span><div class="prompt-latest-copy"><strong>Letztes Projekt</strong><small id="promptLatestTitle">Gespeicherten Arbeitsstand fortsetzen</small></div><button type="button" class="prompt-latest-action" id="promptLatestAction">Weiterarbeiten →</button></section></section>`}
  function ensureHome(){const page=$('#welcomePage');if(!page)return null;let home=$('.prompt-command-home',page);if(!home){page.insertAdjacentHTML('beforeend',markup());home=$('.prompt-command-home',page);bindHome(home)}return home}
  function modeCopy(mode){return mode==='free'?{label:'Freier Prompt',placeholder:'Beschreibe, welchen Prompt du brauchst …',icon:icons.prompt}:mode==='revision'?{label:'Website überarbeiten',placeholder:'Was soll an der bestehenden Website geändert werden?',icon:icons.revision}:{label:'Internetseite erstellen',placeholder:'Beschreibe kurz, was entstehen soll …',icon:icons.website}}
  function closeModeMenu(home){const menu=$('#promptModeMenu',home);if(menu)menu.hidden=true;$('#promptModeButton',home)?.setAttribute('aria-expanded','false')}
  function selectMode(mode){const home=ensureHome();if(!home)return;
    // Prüfen ist kein Schreibmodus - es gibt nichts zu beschreiben. Der Eintrag startet
    // die Prüfung direkt und lässt die eingestellte Arbeitsart stehen.
    if(mode==='check'){closeModeMenu(home);proxy('workspacePreviewBtn');return}
    home.dataset.commandMode=mode;const copy=modeCopy(mode),button=$('#promptModeButton',home);button.innerHTML=`${copy.icon}<span id="promptModeLabel">${copy.label}</span><i class="mode-chevron" aria-hidden="true"></i>`;button.setAttribute('aria-expanded','false');$('#promptModeMenu',home).hidden=true;$('#promptCommandInput',home).placeholder=copy.placeholder;syncMeta();home.querySelectorAll('[data-command-mode]').forEach(option=>option.setAttribute('aria-checked',String(option.dataset.commandMode===mode)));$('#promptCommandInput',home).focus()}
  async function submitCommand(event){event.preventDefault();applyFlow(flowMode());const home=ensureHome(),input=$('#promptCommandInput',home),error=$('#promptCommandError',home),mode=home.dataset.commandMode||'website',brief=input.value.trim();if(brief.length<8){error.textContent='Bitte kurz beschreiben.';input.focus();return}error.textContent='';const button=$('#promptCommandSubmit',home);button.disabled=true;try{if(window.PromptAiHomeEntry?.submitBrief)await window.PromptAiHomeEntry.submitBrief(mode,brief);else if(mode==='website')await window.PromptAiProjectStart?.startFromBrief?.(brief);else{window.PromptAiHomeEntry?.[mode==='free'?'openFreePrompt':'openRevision']?.();setTimeout(()=>{const field=$('#simpleIntakeText');if(field){field.value=brief;$('#simpleIntakeContinue')?.click()}},40)}}finally{setTimeout(()=>{button.disabled=false},350)}}
  function proxy(id){const target=$(`#${id}`);if(!target)return;if(target.disabled||target.getAttribute('aria-disabled')==='true'){const message=target.title||'Diese Funktion ist in deinem Tarif noch nicht verfügbar.';const error=$('#promptCommandError');if(error)error.textContent=message;return}target.click()}
  function bindHome(home){home.dataset.commandMode='website';$('#promptModeButton',home).addEventListener('click',()=>{const menu=$('#promptModeMenu',home),open=menu.hidden;menu.hidden=!open;$('#promptModeButton',home).setAttribute('aria-expanded',String(open))});home.querySelectorAll('[data-command-mode]').forEach(option=>option.addEventListener('click',()=>selectMode(option.dataset.commandMode)));$('#promptCommandForm',home).addEventListener('submit',submitCommand);
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
    setupButton.addEventListener('click',()=>{
      const open=setupSheet.hidden;
      if(open){
        syncFlowUi();syncTemplateMenu();syncSkillsMenu();
        // The sheet's max-height (min(52vh,360px)) assumes the console panel is tall enough to
        // hold it above the setup line. On a fresh, still-short panel (a few lines of text) that
        // isn't true, and an absolutely-positioned box with only `bottom` set grows upward past
        // its container's own top edge once content exceeds the room - which spilled the sheet
        // over the header. Cap it to what's actually free above the button in the viewport.
        const bottomEdge=setupButton.closest('.prompt-command-panel').getBoundingClientRect().bottom-52;
        const room=bottomEdge-100;
        setupSheet.style.maxHeight=`${Math.max(160,Math.min(360,room))}px`;
      }
      setupSheet.hidden=!open;setupButton.setAttribute('aria-expanded',String(open));
    });
    document.addEventListener('click',event=>{
      if(event.target.closest?.('#promptSetupButton,#promptSetupSheet'))return;
      setupSheet.hidden=true;setupButton.setAttribute('aria-expanded','false');
    });
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
  function syncHome(){const visible=homeVisible();document.documentElement.classList.toggle('prompt-home-surface',visible);if(!visible)return;const home=ensureHome();if(!home)return;$('#promptHomeName',home).textContent=resolvedName()||'Lars';const access=window.PromptAiAccess||{},plan=access.isAdmin?'Ultimate':String(access.plan||'free');$('#promptHomePlan',home).textContent=plan.charAt(0).toUpperCase()+plan.slice(1);const title=projectTitle(),original=$('#workspaceLastProjectBtn'),latest=$('.prompt-latest',home);
    // Ohne gespeichertes Projekt bot die Zeile etwas an, das es nicht gibt.
    if(latest)latest.hidden=!title;
    $('#promptLatestTitle',home).textContent=title||'Gespeicherten Arbeitsstand fortsetzen';$('#promptLatestAction',home).disabled=Boolean(original?.disabled);syncMeta();syncFlowUi();applyFlow(flowMode());syncAttachments();syncSetupSummary();ensureThemeToggle();const topbar=$('body>.topbar')||$('.topbar');if(topbar){topbar.hidden=false;topbar.removeAttribute('aria-hidden')}}
  function schedule(){clearTimeout(settleTimer);settleTimer=setTimeout(syncHome,25)}
  function init(){installStyles();syncHome();const observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class','style']});new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});document.addEventListener('click',event=>{if(event.target.closest?.('#brandHome,.guided-clean-exit,#promptWorkflowLoaderClose'))setTimeout(syncHome,80)},true);window.addEventListener('promptai:access',schedule);window.addEventListener('promptai:quota',syncMeta);window.addEventListener('pageshow',schedule);window.addEventListener('promptai:home',syncHome);window.SiteBriefCloud?.subscribe?.(schedule);let count=0;const warm=setInterval(()=>{syncHome();if(++count>24)clearInterval(warm)},180)}
  window.PromptAiHomeSurface={sync:syncHome};
  installStyles();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
