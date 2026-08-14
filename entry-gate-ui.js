(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  let settleTimer=0;

  function styles(){
    if($('#entryGateStyles'))return;
    const s=document.createElement('style');s.id='entryGateStyles';s.textContent=`
      .account-dialog.guest-gate .dialog-head{display:none!important}
      #gateActions{display:none}
      .account-dialog.guest-gate:not(.gate-expanded) .auth-layout{display:none!important}
      /* The gate is a standalone page, so it uses the full height instead of clustering at the
         top with dead space underneath: hero and actions share the space, the legal row sits on
         the bottom edge. */
      /* min-height statt height: reicht der Inhalt über den Bildschirm, wächst die Fläche mit,
         statt die Fußzeile in den letzten Absatz zu schieben. */
      .account-dialog.guest-gate:not(.gate-expanded) .account-body{display:flex;flex-direction:column;min-height:100dvh;padding-bottom:max(20px,env(safe-area-inset-bottom))!important}
      .account-dialog.guest-gate:not(.gate-expanded) #gateLegalRow{flex:0 0 auto;margin-top:auto;padding-top:22px}
      /* flex:1 mit min-height:0 ließ den Kasten unter seine Inhaltshöhe schrumpfen, sobald die
         Belegreihe dazukam - die Fußzeile lag dann im letzten Absatz. Nach unten gedrückt wird
         die Fußzeile ohnehin von ihrem eigenen margin-top:auto in .account-body. */
      .account-dialog.guest-gate:not(.gate-expanded) #accountLoggedOut{display:flex;flex-direction:column;flex:0 0 auto;min-height:auto}
      .account-dialog.guest-gate:not(.gate-expanded) .auth-hero{padding-bottom:0}
      .account-dialog.guest-gate:not(.gate-expanded) #accountLoggedOut{position:relative}
      /* Ein Bild der Sache selbst statt einer Behauptung darüber: die Konsole, wie sie nach dem
         Einstieg aussieht, mit dem Satz darin, den man dort tatsächlich schreibt. Kein Screenshot -
         dieselben Bausteine wie die echte Oberfläche, damit sie nicht veraltet. */
      .gate-shot{
        position:relative;width:100%;max-width:520px;border-radius:20px;overflow:hidden;
        border:1px solid color-mix(in srgb,var(--accent) 22%,var(--line));
        background:#111b26;box-shadow:0 30px 80px rgba(10,20,30,.28);
      }
      .gate-shot-bar{display:flex;align-items:center;gap:6px;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.08)}
      .gate-shot-bar i{width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.16)}
      .gate-shot-bar span{margin-left:auto;color:#61778a;font:800 7px/1 ui-monospace,monospace;letter-spacing:.16em}
      .gate-shot-body{padding:18px 16px 16px}
      .gate-shot-mode{
        display:inline-flex;align-items:center;gap:7px;min-height:32px;padding:0 11px;margin-bottom:14px;
        border:1px solid #425262;border-radius:10px;color:#edf6fd;font:750 11px/1 Arial,Helvetica,sans-serif;
      }
      .gate-shot-mode:before{content:"";width:13px;height:13px;border:1.6px solid var(--accent);border-radius:50%}
      .gate-shot-text{color:#9fb4c6;font-size:12.5px;line-height:1.6;min-height:66px}
      .gate-shot-text b{color:#edf6fd;font-weight:600}
      .gate-shot-caret{display:inline-block;width:1.5px;height:13px;margin-left:2px;background:var(--accent);vertical-align:-2px;animation:gateCaret 1.05s steps(1) infinite}
      @keyframes gateCaret{0%,49%{opacity:1}50%,100%{opacity:0}}
      .gate-shot-foot{display:flex;align-items:center;gap:10px;margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.08);color:#7d8fa3;font-size:9px}
      .gate-shot-foot b{margin-left:auto;color:var(--accent);font-weight:800}
      /* Die Reihe unter dem Einstieg: drei Belege, keine Werbezeilen. */
      .gate-proof{display:grid;gap:16px;width:100%;padding:0;margin:0;list-style:none}
      .gate-proof li{display:grid;gap:3px;padding:14px 0 0;border-top:2px solid color-mix(in srgb,var(--accent) 30%,var(--line));text-align:left}
      .gate-proof strong{font-size:13px;letter-spacing:-.01em}
      .gate-proof small{color:var(--muted);font-size:11.5px;line-height:1.5}
      /* auto on both sides so the leftover height is shared above and below the actions instead
         of piling up in one gap. */
      .account-dialog.guest-gate:not(.gate-expanded) #gateActions{display:grid;justify-items:center;gap:34px;max-width:460px;margin-top:auto;margin-bottom:auto;padding-top:26px}
      .account-dialog.guest-gate:not(.gate-expanded) #gateLegalRow{margin-top:auto;padding-top:22px}
      /* A single small entry point for returning AND new visitors - it opens the same form that
         already offers "Anmelden" and "Neues Konto" side by side, so one button covers both. */
      .gate-login-pick{position:absolute;top:2px;right:0;min-height:38px;padding:0 16px;border:1px solid var(--line);border-radius:11px;background:var(--surface);color:var(--ink);font-size:12px;font-weight:750}
      .gate-cta{display:grid;justify-items:center;gap:10px;width:100%}
      .gate-guest-btn{min-height:64px;padding:0 18px;border:1px solid var(--accent);border-radius:16px;background:var(--accent);color:#fff;font-size:17px;font-weight:800;box-shadow:0 16px 34px rgba(45,147,201,.24)}
      .gate-guest-note{margin:0;color:var(--muted);font-size:9px;text-align:center}
      /* A short, honest "how it works" - not invented changelog copy, the same three steps the
         first-run intro dialog already uses once you're past the gate. */
      .gate-highlights{display:grid;gap:14px;width:100%;padding:0;margin:0;list-style:none}
      .gate-highlights li{display:grid;grid-template-columns:26px minmax(0,1fr);gap:11px;align-items:start;text-align:left}
      .gate-highlights b{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:color-mix(in srgb,var(--accent) 12%,transparent);color:var(--accent);font-size:11px;font-weight:850}
      .gate-highlights strong{display:block;font-size:13px}
      .gate-highlights small{display:block;margin-top:2px;color:var(--muted);font-size:11px;line-height:1.5}
      .gate-plans-pick{display:block;width:100%;padding:16px 18px;border:1px solid var(--line);border-radius:16px;background:var(--surface);text-align:left;transition:border-color .16s ease,background .16s ease,transform .16s ease}
      .gate-plans-pick:hover{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 6%,var(--surface));transform:translateY(-1px)}
      .gate-plans-copy{display:block;min-width:0}
      .gate-plans-pick span,.gate-plans-pick strong,.gate-plans-pick small{display:block}
      .gate-plans-pick .gate-plans-kicker{font-size:8px;font-weight:800;letter-spacing:.12em;color:var(--accent)}
      .gate-plans-pick strong{margin:4px 0 3px;font-size:14px}
      .gate-plans-pick small{color:var(--muted);font-size:9px;line-height:1.45}
      .gate-plans-tiers{display:flex;flex-wrap:wrap;gap:6px;margin-top:11px}
      .gate-plans-tiers i{padding:5px 10px;border:1px solid color-mix(in srgb,var(--accent) 30%,var(--line));border-radius:99px;background:var(--surface);color:var(--ink);font-size:9px;font-style:normal;font-weight:750;white-space:nowrap}
      .gate-theme-pick{margin-top:2px;display:inline-flex;align-items:center;gap:6px;border:0;background:none;color:var(--muted);font-size:9px}
      .gate-theme-pick:hover{color:var(--ink)}
      /* The collapsed gate stretches .account-body to the full dialog height and pins the legal
         row to the bottom with margin-top:auto. Picking "Anmelden"/"Registrieren" swaps in the
         two-column auth-layout, but that layout never got the same treatment - on a dialog taller
         than its content, Impressum/Datenschutz just sat wherever the content ended instead of at
         the bottom edge, and the two-column layout started right under the headline with barely
         any air between them. Same technique, applied to the expanded state instead. */
      .account-dialog.guest-gate.gate-expanded .account-body{display:flex;flex-direction:column;flex:1;min-height:0}
      .account-dialog.guest-gate.gate-expanded .auth-layout{margin-top:clamp(28px,5vh,56px)}
      .account-dialog.guest-gate.gate-expanded #gateLegalRow{margin-top:auto;padding-top:28px}
      @media(min-width:600px){
        .gate-highlights{grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}
        .gate-highlights li{grid-template-columns:1fr;justify-items:center;text-align:center}
        .gate-highlights small{margin-top:4px}
      }
      @media(min-width:960px){
        /* Zwei Spalten wie bei jedem Produkt, das sich selbst zeigt: links das Versprechen und
           der Einstieg, rechts das Ding. Zentrierter Text auf leerer Fläche war das Problem. */
        .account-dialog.guest-gate:not(.gate-expanded) #accountLoggedOut{
          display:grid;grid-template-columns:minmax(0,1fr) minmax(0,.92fr);
          grid-template-areas:'hero shot' 'actions shot' 'proof proof';
          align-items:start;column-gap:clamp(40px,6vw,84px);row-gap:0;
          max-width:1180px;margin:0 auto;padding-top:clamp(28px,7vh,86px);
          /* Die einspaltige Regel oben setzt flex:1 und min-height:0 - beides bleibt sonst stehen
             und lässt den Kasten unter seine Inhaltshöhe schrumpfen, worauf die Belegreihe unter
             der Fußzeile herauslief. */
          flex:0 0 auto;min-height:auto;
        }
        .account-dialog.guest-gate:not(.gate-expanded) .auth-hero{grid-area:hero;max-width:100%;width:100%;text-align:left}
        .account-dialog.guest-gate:not(.gate-expanded) .auth-brand{justify-content:flex-start}
        .account-dialog.guest-gate:not(.gate-expanded) .auth-hero h1{max-width:15ch}
        .account-dialog.guest-gate:not(.gate-expanded) #gateActions{
          grid-area:actions;justify-items:start;max-width:520px;width:100%;
          gap:26px;margin:22px 0 0;padding-top:0;
        }
        .account-dialog.guest-gate:not(.gate-expanded) .gate-shot{grid-area:shot;justify-self:end;margin-top:14px}
        .account-dialog.guest-gate:not(.gate-expanded) .gate-proof{
          grid-area:proof;grid-template-columns:repeat(3,minmax(0,1fr));
          gap:26px;margin:clamp(48px,7vh,86px) 0 clamp(30px,5vh,58px);
        }
        .gate-cta{justify-items:start}
        .gate-guest-note{text-align:left}
        .gate-login-pick{top:6px;font-size:13px}
        .gate-guest-btn{min-height:60px;font-size:17px;border-radius:15px;padding:0 30px}
        .gate-guest-note{font-size:11px}
        .gate-plans-pick{padding:18px 22px;border-radius:16px}
        .gate-plans-pick .gate-plans-kicker{font-size:9px}
        .gate-plans-pick strong{font-size:16px;margin:6px 0 4px}
        .gate-plans-pick small{font-size:11px}
        .gate-plans-tiers i{font-size:11px;padding:6px 13px}
        .gate-theme-pick{font-size:11px}
      }
      /* Zwischen 821 und 960 bleibt eine Spalte, aber das Bild darf mit. */
      @media(max-width:959px){
        .gate-shot{max-width:100%;margin:0 auto}
        .account-dialog.guest-gate:not(.gate-expanded) #accountLoggedOut{max-width:620px;margin:0 auto}
      }
    `;document.head.appendChild(s);
  }

  function ensureGateActions(){
    const hero=$('#accountLoggedOut .auth-hero');if(!hero||$('#gateActions'))return;
    const box=document.createElement('div');box.id='gateActions';
    box.innerHTML='<button type="button" class="gate-login-pick" id="gateSignInPick">Anmelden</button>'
      +'<div class="gate-cta"><button type="button" class="gate-guest-btn" id="gateGuestBtn">Kostenlos testen</button><p class="gate-guest-note">Ohne Konto, jederzeit später upgradebar.</p></div>'
      +'<button type="button" class="gate-plans-pick" id="gatePlansPick"><span class="gate-plans-copy"><span class="gate-plans-kicker">ABO ABSCHLIESSEN</span><strong>Alle drei Tarife im Vergleich</strong><small>Kostenlos, Pro und Ultimate nebeneinander – mit allen Leistungen und Preisen.</small><span class="gate-plans-tiers"><i>Kostenlos 0 €</i><i id="gateProTier">Pro 15,99 €</i><i id="gateUltimateTier">Ultimate 25,99 €</i></span></span></button>'
      +'<button type="button" class="gate-theme-pick" id="gateThemePick">Anderes Farbschema verwenden</button>';
    hero.insertAdjacentElement('afterend',box);

    // Das Produkt zeigen statt es zu beschreiben - dieselbe Konsole, die nach dem Einstieg kommt.
    const shot=document.createElement('div');shot.className='gate-shot';
    shot.innerHTML='<div class="gate-shot-bar"><i></i><i></i><i></i><span>COMMAND / 01</span></div>'
      +'<div class="gate-shot-body">'
      +'<span class="gate-shot-mode">Internetseite erstellen</span>'
      +'<p class="gate-shot-text"><b>Kosmetikstudio in Lindhorst.</b> Die Seite soll Struktur haben und direkt zeigen, was gemacht wird.<span class="gate-shot-caret"></span></p>'
      +'<div class="gate-shot-foot"><span>Mit Rückfragen</span><span>·</span><span>3 Richtungen</span><b>Master-Prompt</b></div>'
      +'</div>';
    box.insertAdjacentElement('afterend',shot);

    // Drei Belege statt drei Werbezeilen - dieselben Schritte, die die App danach wirklich geht.
    const proof=document.createElement('ul');proof.className='gate-proof';
    proof.innerHTML='<li><strong>Beschreiben</strong><small>Ein paar Sätze reichen. Hast du schon eine Website, lesen wir sie aus und übernehmen Kontakt, Leistungen und Öffnungszeiten.</small></li>'
      +'<li><strong>Richtung wählen</strong><small>Du siehst drei fertig gestaltete Vorschläge und entscheidest, welcher passt.</small></li>'
      +'<li><strong>Auftrag mitnehmen</strong><small>Fertig ist ein Master-Prompt mit allen Fakten – für ChatGPT, Claude, Codex oder was du sonst nutzt.</small></li>';
    shot.insertAdjacentElement('afterend',proof);
    const reveal=()=>{$('#accountDialog')?.classList.add('gate-expanded');setTimeout(()=>{$('.auth-form-card')?.scrollIntoView({behavior:'smooth',block:'start'})},60)};
    $('#gateSignInPick',box).addEventListener('click',reveal);
    $('#gateGuestBtn',box).addEventListener('click',()=>$('#guestContinueBtn')?.click());
    $('#gatePlansPick',box).addEventListener('click',()=>openPlansFromGate());
    $('#gateThemePick',box).addEventListener('click',()=>$('#themeToggleBtn')?.click());
  }

  // The price labels in the plans dialog are the single place live Stripe pricing is written to
  // (ui-regression-fixes.applyPricing). Mirroring them keeps the chips correct without a second
  // source; watchPricing below reacts to the text changing, which settle() alone would miss
  // because a characterData change is not a childList or attribute mutation.
  function syncTierChips(){
    const pro=$('#proPriceLabel')?.textContent?.trim(),ultimate=$('#ultimatePriceLabel')?.textContent?.trim();
    const chip=(id,label,price)=>{const node=$(id);if(!node||!price)return;const text=`${label} ${price.replace(/\s*\/\s*Monat$/,'').trim()}`;if(node.textContent!==text)node.textContent=text};
    chip('#gateProTier','Pro',pro);chip('#gateUltimateTier','Ultimate',ultimate);
  }
  function watchPricing(){
    for(const id of ['#proPriceLabel','#ultimatePriceLabel']){
      const label=$(id);if(!label||label.__gatePriceWatched)continue;
      label.__gatePriceWatched=true;
      new MutationObserver(syncTierChips).observe(label,{childList:true,characterData:true,subtree:true});
    }
  }

  // Opened from the login page, so closing the plans dialog has to land back on the login page
  // rather than on whatever sits behind it.
  function openPlansFromGate(){
    const plans=$('#plansDialog');if(!plans)return;
    const account=$('#accountDialog'),wasOpen=Boolean(account?.open);
    if(!plans.open)plans.showModal();
    if(!wasOpen)return;
    plans.addEventListener('close',()=>{const dialog=$('#accountDialog');if(dialog&&!dialog.open){try{dialog.showModal()}catch{}}},{once:true});
  }

  function resetExpansion(){
    const dialog=$('#accountDialog');if(!dialog)return;
    if(!dialog.classList.contains('guest-gate'))dialog.classList.remove('gate-expanded');
  }

  function settle(){styles();ensureGateActions();watchPricing();syncTierChips();resetExpansion()}
  function schedule(){clearTimeout(settleTimer);settleTimer=setTimeout(settle,24)}
  function init(){settle();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','open']});window.addEventListener('promptai:access',schedule);window.addEventListener('pageshow',schedule)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
