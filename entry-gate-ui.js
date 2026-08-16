(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  let settleTimer=0;
  // Ein festes Beispiel liest sich wie der einzige Fall, für den das Ding gemacht ist. Eine
  // wechselnde Reihe zeigt die Spannbreite - und dient auf der Startseite zugleich als Anregung,
  // was man hier überhaupt hineinschreiben kann. Global, damit Einstiegsseite und Konsole
  // dieselben Sätze verwenden und nicht zwei Listen auseinanderlaufen.
  const EXAMPLES=window.PromptAiExamples=window.PromptAiExamples||[
    {head:'Dönerladen in Hannover.',rest:' Mittagskarte, Öffnungszeiten und der Weg zum Laden sollen sofort zu finden sein.'},
    {head:'Pizzeria in Hamburg.',rest:' Speisekarte, Tischreservierung und Lieferzeiten gehören nach vorn.'},
    {head:'Dachdecker in Lindhorst.',rest:' Leistungen, Einsatzgebiet und eine Nummer, die man direkt anrufen kann.'},
    {head:'Kosmetikstudio in Bremen.',rest:' Behandlungen mit Preisen, Termine online und ein ruhiger, hochwertiger Auftritt.'},
    {head:'Physiotherapie in Köln.',rest:' Kassenleistungen, Team und Terminanfrage ohne Umwege.'},
    {head:'Tischlerei in Osnabrück.',rest:' Referenzen aus echten Projekten statt Katalogbildern, dazu ein Kontaktweg.'},
    {head:'Steuerbüro in Leipzig.',rest:' Seriös, ruhig, mit klarer Erstberatung und Mandantenportal.'},
    {head:'Hofladen bei Rostock.',rest:' Was gerade geerntet wird, Öffnungszeiten und der Weg zum Hof.'},
    {head:'Fotografin in München.',rest:' Die Bilder tragen die Seite, Preise und Anfrage bleiben schlicht.'},
    {head:'Autowerkstatt in Dortmund.',rest:' Termin, Leistungen und Preise ohne Werbefloskeln.'}
  ];

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
      .gate-shot-wrap{position:relative;width:100%;max-width:620px}
      .gate-shot{
        position:relative;width:100%;border-radius:20px;overflow:hidden;
        border:1px solid color-mix(in srgb,var(--accent) 22%,var(--line));
        background:#111b26;box-shadow:0 30px 80px rgba(10,20,30,.28);
      }
      .gate-shot-bar{display:flex;align-items:center;gap:6px;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.08)}
      .gate-shot-bar i{width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.16)}
      .gate-shot-bar span{margin-left:auto;color:#61778a;font:800 7px/1 ui-monospace,monospace;letter-spacing:.16em}
      .gate-shot-body{padding:26px 24px 24px}
      .gate-shot-mode{
        display:inline-flex;align-items:center;gap:7px;min-height:38px;padding:0 14px;margin-bottom:18px;
        border:1px solid #425262;border-radius:10px;color:#edf6fd;font:750 12.5px/1 Arial,Helvetica,sans-serif;
      }
      .gate-shot-mode:before{content:"";width:13px;height:13px;border:1.6px solid var(--accent);border-radius:50%}
      .gate-shot-text{color:#9fb4c6;font-size:14.5px;line-height:1.7;min-height:88px}
      .gate-shot-text b{color:#edf6fd;font-weight:600}
      .gate-shot-caret{display:inline-block;width:1.5px;height:13px;margin-left:2px;background:var(--accent);vertical-align:-2px;animation:gateCaret 1.05s steps(1) infinite}
      @keyframes gateCaret{0%,49%{opacity:1}50%,100%{opacity:0}}
      .gate-shot-foot{display:flex;align-items:center;gap:10px;margin-top:18px;padding-top:16px;border-top:1px solid rgba(255,255,255,.08);color:#7d8fa3;font-size:10px}
      .gate-shot-foot b{margin-left:auto;color:var(--accent);font-weight:800}
      /* Kleine Pfeile statt der Belegzeile darunter: jeder Hinweis liegt außerhalb der Karte auf
         Höhe der Zeile, die er erklärt, und zeigt mit einer kurzen Linie genau darauf. Nur ab
         genug Breite, sonst kollidieren sie mit der Kachelspalte links. */
      .gate-shot-note{display:none}
      @media(min-width:1180px){
        .gate-shot-note{
          position:absolute;left:100%;display:flex;align-items:center;gap:9px;margin-left:18px;
          max-width:180px;color:var(--muted);font-size:11px;line-height:1.35;white-space:normal;
        }
        .gate-shot-note i{flex:0 0 auto;width:26px;height:1px;background:color-mix(in srgb,var(--accent) 60%,var(--line))}
        .gate-shot-note-mode{top:34px}
        .gate-shot-note-text{top:104px}
        .gate-shot-note-foot{bottom:26px}
      }
      /* Die Reihe unter dem Einstieg: drei Belege, keine Werbezeilen. */
      .gate-proof{display:grid;gap:16px;width:100%;padding:0;margin:0;list-style:none}
      .gate-proof li{display:grid;gap:3px;padding:14px 0 0;border-top:2px solid color-mix(in srgb,var(--accent) 30%,var(--line));text-align:left}
      .gate-proof strong{font-size:13px;letter-spacing:-.01em}
      .gate-proof small{color:var(--muted);font-size:11.5px;line-height:1.5}
      /* auto on both sides so the leftover height is shared above and below the actions instead
         of piling up in one gap. */
      .account-dialog.guest-gate:not(.gate-expanded) #gateActions{display:grid;justify-items:stretch;gap:18px;max-width:520px;margin-top:auto;margin-bottom:auto;padding-top:26px}
      .account-dialog.guest-gate:not(.gate-expanded) #gateLegalRow{margin-top:auto;padding-top:22px}
      /* Anmelden und Kostenlos testen stehen dort, wo man sie auf jeder Produktseite sucht:
         oben rechts, nebeneinander. Beide führen weiter - der eine ins Formular mit
         "Anmelden" und "Neues Konto", der andere direkt in den Gastlauf. */
      .gate-top{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:16px 0 0}
      .gate-login-pick{min-height:42px;padding:0 18px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--ink);font-size:13px;font-weight:750}
      .gate-login-pick:hover{border-color:var(--accent);color:var(--accent)}
      .gate-cta{display:grid;justify-items:stretch;gap:10px;width:100%}
      .gate-guest-btn{min-height:42px;padding:0 20px;border:1px solid var(--accent);border-radius:12px;background:var(--accent);color:#fff;font-size:13px;font-weight:800;box-shadow:0 12px 26px rgba(45,147,201,.22)}
      .gate-guest-note{margin:0;color:var(--muted);font-size:11px;text-align:left}
      /* A short, honest "how it works" - not invented changelog copy, the same three steps the
         first-run intro dialog already uses once you're past the gate. */
      .gate-highlights{display:grid;gap:14px;width:100%;padding:0;margin:0;list-style:none}
      .gate-highlights li{display:grid;grid-template-columns:26px minmax(0,1fr);gap:11px;align-items:start;text-align:left}
      .gate-highlights b{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:color-mix(in srgb,var(--accent) 12%,transparent);color:var(--accent);font-size:11px;font-weight:850}
      .gate-highlights strong{display:block;font-size:13px}
      .gate-highlights small{display:block;margin-top:2px;color:var(--muted);font-size:11px;line-height:1.5}
      /* Drei eigenständige Kacheln statt einer Sammelkarte, die erst im Tarifvergleich alles
         zeigt - so steht der Vergleich direkt auf der Einstiegsseite, links neben der Konsole. */
      .gate-plan-list{display:grid;gap:12px;width:100%}
      .gate-plan-pick{display:block;width:100%;padding:16px 18px;border:1px solid var(--line);border-radius:16px;background:var(--surface);text-align:left;transition:border-color .16s ease,background .16s ease,transform .16s ease}
      .gate-plan-pick:hover{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 6%,var(--surface));transform:translateY(-1px)}
      .gate-plan-pick.featured{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent) inset}
      .gate-plan-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px}
      .gate-plan-head strong{font-size:14px}
      .gate-plan-head b{color:var(--accent);font-size:13px;font-weight:800;white-space:nowrap}
      .gate-plan-pick small{display:block;margin-top:5px;color:var(--muted);font-size:11px;line-height:1.45}
      .gate-plans-more{display:block;width:100%;padding:6px 0 2px;border:0;background:none;color:var(--muted);font-size:11px;text-align:center}
      .gate-plans-more:hover{color:var(--accent)}
      .gate-theme-pick{margin-top:2px;display:inline-flex;align-items:center;gap:6px;border:0;background:none;color:var(--muted);font-size:9px}
      .gate-theme-pick:hover{color:var(--ink)}
      /* "Anmelden" setzt das Formular jetzt als eigenständiges Pop-up über die weiterhin
         sichtbare Einstiegsseite - dieselbe Optik wie jeder andere Dialog in der App, statt es
         an derselben Stelle nach unten zu schieben. #accountDialog trägt die ID mit, damit diese
         Regel unabhängig von Quellreihenfolge über die pauschale display:none-Regel gewinnt. */
      #accountDialog.guest-gate.gate-auth-open .auth-layout{
        display:flex!important;position:fixed;inset:0;z-index:70;align-items:center;justify-content:center;
        padding:20px;margin:0;background:rgba(8,12,16,.6);
        backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);
        animation:gateAuthIn .18s ease both;
      }
      @keyframes gateAuthIn{from{opacity:0}to{opacity:1}}
      #accountDialog.guest-gate.gate-auth-open .auth-layout>.auth-form-card{
        position:relative;width:min(440px,100%);max-height:min(88vh,720px);overflow:auto;margin:0;
        box-shadow:0 40px 100px rgba(0,0,0,.45);
      }
      #accountDialog.guest-gate.gate-auth-open .auth-layout>.auth-access-card{display:none!important}
      .gate-auth-close{position:absolute;top:14px;right:14px;display:grid;place-items:center;width:34px;height:34px;padding:0;border:1px solid var(--line);border-radius:50%;background:var(--surface);color:var(--muted);font-size:18px;line-height:1;cursor:pointer}
      .gate-auth-close:hover{color:var(--ink);border-color:var(--accent)}
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
          grid-template-areas:'hero hero' 'actions shot';
          align-items:start;column-gap:clamp(40px,6vw,84px);row-gap:0;
          max-width:1320px;margin:0 auto;padding-top:clamp(24px,5vh,58px);
          /* Die einspaltige Regel oben setzt flex:1 und min-height:0 - beides bleibt sonst stehen
             und lässt den Kasten unter seine Inhaltshöhe schrumpfen, worauf die Belegreihe unter
             der Fußzeile herauslief. */
          flex:0 0 auto;min-height:auto;
        }
        /* Kopfzeile und Spruch laufen über die ganze Breite: Marke links, Anmelden und
           Kostenlos testen rechts, darunter der Satz ohne Zeichenbremse. Vorher stand er
           in einer 15-Zeichen-Spalte neben dem Bild und brach nach drei Wörtern um. */
        .account-dialog.guest-gate:not(.gate-expanded) .auth-hero{
          grid-area:hero;display:grid;grid-template-columns:minmax(0,1fr) auto;
          align-items:center;column-gap:24px;max-width:100%;width:100%;text-align:left;
        }
        .account-dialog.guest-gate:not(.gate-expanded) .auth-brand{grid-column:1;justify-content:flex-start;margin:0}
        .account-dialog.guest-gate:not(.gate-expanded) .gate-top{grid-column:2;grid-row:1;justify-self:end;margin:0}
        .account-dialog.guest-gate:not(.gate-expanded) .auth-kicker{grid-column:1/-1;margin-top:clamp(26px,5vh,58px)}
        .account-dialog.guest-gate:not(.gate-expanded) .auth-hero h1{grid-column:1/-1;max-width:none;text-wrap:balance}
        .account-dialog.guest-gate:not(.gate-expanded) #gateActions{
          grid-area:actions;justify-items:stretch;max-width:560px;width:100%;
          gap:20px;margin:6px 0 0;padding-top:0;align-self:start;
        }
        /* Das Bild beginnt jetzt bewusst tiefer als die Kachelspalte - auf Höhe der zweiten
           Tarifkachel statt ganz oben - und darf dabei größer sein, weil keine Belegzeile mehr
           darunter für Platz konkurriert. */
        .account-dialog.guest-gate:not(.gate-expanded) .gate-shot-wrap{grid-area:shot;justify-self:end;align-self:start;margin-top:clamp(48px,7vh,86px);max-width:100%}
        .gate-cta{justify-items:start}
        .gate-guest-note{text-align:left;font-size:11px}
        .gate-login-pick{font-size:13px}
        .gate-guest-btn{min-height:44px;font-size:13.5px;border-radius:12px;padding:0 22px}
        .gate-plan-pick{padding:18px 22px;border-radius:16px}
        .gate-plan-head strong{font-size:16px}
        .gate-plan-pick small{font-size:11px}
        .gate-plans-more{font-size:12px}
        .gate-theme-pick{font-size:11px}
      }
      /* Zwischen 821 und 960 bleibt eine Spalte, aber das Bild darf mit. */
      @media(max-width:959px){
        .gate-shot-wrap{max-width:100%;margin:0 auto}
        .account-dialog.guest-gate:not(.gate-expanded) #accountLoggedOut{max-width:620px;margin:0 auto}
      }
    `;document.head.appendChild(s);
  }

  function ensureGateActions(){
    const hero=$('#accountLoggedOut .auth-hero');if(!hero||$('#gateActions'))return;
    // Anmelden und Kostenlos testen gehören in die Kopfzeile, nicht mitten in die Seite.
    const top=document.createElement('div');top.className='gate-top';
    top.innerHTML='<button type="button" class="gate-login-pick" id="gateSignInPick">Anmelden</button>'
      +'<button type="button" class="gate-guest-btn" id="gateGuestBtn">Kostenlos testen</button>';
    ($('.auth-brand',hero)||hero).insertAdjacentElement('afterend',top);

    const box=document.createElement('div');box.id='gateActions';
    box.innerHTML=''
      +'<div class="gate-cta"><p class="gate-guest-note">Kostenlos testen läuft ohne Konto: drei vollständige Durchläufe, danach jederzeit upgradebar.</p></div>'
      // Drei eigene Kacheln statt einer Sammelkarte - der Vergleich steht direkt hier, links
      // neben der Konsole. "Alle Tarife ansehen" bleibt daneben für alle Leistungsdetails.
      +'<div class="gate-plan-list" id="gatePlanList">'
      +'<button type="button" class="gate-plan-pick" data-gate-plan="free"><span class="gate-plan-head"><strong>Kostenlos</strong><b>0 €</b></span><small>Drei Richtungen, Master-Prompt und Projektbericht.</small></button>'
      +'<button type="button" class="gate-plan-pick featured" data-gate-plan="pro"><span class="gate-plan-head"><strong>Pro</strong><b id="gateProPrice">15,99 €</b></span><small>Prüfung, Module, Skills, Unterlagen und direkte Vorschau.</small></button>'
      +'<button type="button" class="gate-plan-pick" data-gate-plan="ultimate"><span class="gate-plan-head"><strong>Ultimate</strong><b id="gateUltimatePrice">25,99 €</b></span><small>Alle Agenten, eigene KI-Verbindungen und GitHub.</small></button>'
      +'</div>'
      +'<button type="button" class="gate-plans-more" id="gatePlansMore">Alle Tarife im Vergleich ansehen →</button>'
      +'<button type="button" class="gate-theme-pick" id="gateThemePick">Anderes Farbschema verwenden</button>';
    hero.insertAdjacentElement('afterend',box);

    // Das Produkt zeigen statt es zu beschreiben - dieselbe Konsole, die nach dem Einstieg kommt.
    // Statt einer Erklärliste darunter zeigen kleine Pfeile direkt auf die Stelle im Feld, die sie
    // erklären - deshalb steckt die Karte in einer eigenen Hülle, aus der die Hinweise seitlich
    // herausragen dürfen (die Karte selbst schneidet mit overflow:hidden ihre Ecken rund).
    const wrap=document.createElement('div');wrap.className='gate-shot-wrap';
    const shot=document.createElement('div');shot.className='gate-shot';
    shot.innerHTML='<div class="gate-shot-bar"><i></i><i></i><i></i><span>COMMAND / 01</span></div>'
      +'<div class="gate-shot-body">'
      +'<span class="gate-shot-mode">Internetseite erstellen</span>'
      +'<p class="gate-shot-text"><b></b><span class="gate-shot-rest"></span><span class="gate-shot-caret"></span></p>'
      +'<div class="gate-shot-foot"><span>Mit Rückfragen</span><span>·</span><span>3 Richtungen</span><b>Master-Prompt</b></div>'
      +'</div>';
    wrap.appendChild(shot);
    wrap.insertAdjacentHTML('beforeend',''
      +'<span class="gate-shot-note gate-shot-note-mode"><i></i>Art des Projekts</span>'
      +'<span class="gate-shot-note gate-shot-note-text"><i></i>Kurz beschreiben, was entstehen soll</span>'
      +'<span class="gate-shot-note gate-shot-note-foot"><i></i>Ablauf und Richtungen</span>');
    box.insertAdjacentElement('afterend',wrap);
    rotateShot(shot);
    // Die beiden Kopfzeilen-Knöpfe liegen in .gate-top, die übrigen in #gateActions - deshalb
    // wird hier im Dokument gesucht statt in einem der beiden Kästen.
    $('#gateSignInPick',top).addEventListener('click',openAuthPopup);
    $('#gateGuestBtn',top).addEventListener('click',()=>$('#guestContinueBtn')?.click());
    $('#gatePlanList',box).addEventListener('click',e=>{
      const pick=e.target.closest('[data-gate-plan]');if(!pick)return;
      pickGatePlan(pick.dataset.gatePlan);
    });
    $('#gatePlansMore',box).addEventListener('click',()=>openPlansFromGate());
    $('#gateThemePick',box).addEventListener('click',()=>$('#themeToggleBtn')?.click());
  }

  // "Anmelden" setzt das Formular als Pop-up über die Einstiegsseite statt sie zu ersetzen - die
  // Karte selbst bleibt exakt die im HTML hinterlegte (gleiche Handler, gleiches Verhalten nach
  // dem Absenden), nur ihre Hülle bekommt für diesen Moment eine feste Position und einen Schleier
  // dahinter.
  function ensureAuthClose(){
    const card=$('.auth-form-card');if(!card||$('.gate-auth-close',card))return;
    const close=document.createElement('button');
    close.type='button';close.className='gate-auth-close';close.setAttribute('aria-label','Schließen');close.textContent='×';
    close.addEventListener('click',closeAuthPopup);
    card.insertAdjacentElement('afterbegin',close);
  }
  function openAuthPopup(){
    const dialog=$('#accountDialog');if(!dialog)return;
    ensureAuthClose();
    dialog.classList.add('gate-auth-open');
    setTimeout(()=>$('#authEmail')?.focus(),80);
  }
  function closeAuthPopup(){$('#accountDialog')?.classList.remove('gate-auth-open')}
  // Kostenlos startet sofort als Gast. Pro/Ultimate öffnen dasselbe Pop-up wie "Anmelden" und
  // rufen die echte pickAuthPlan() aus app.js über window.PromptAiAuthPlan auf - so bleibt die
  // Tarif-Vormerkung (pendingAuthPlan) an einer einzigen Stelle statt hier zweites Mal nachgebaut.
  function pickGatePlan(plan){
    if(plan==='free'){$('#gateGuestBtn')?.click();return}
    openAuthPopup();
    // .auth-plan-grid und seine Knöpfe entfernt ui-regression-fixes.js aus dem DOM, sobald das
    // Formular einmal sichtbar war - deshalb über die von app.js freigegebene Funktion selbst,
    // nicht über einen Klick auf einen Knopf, der oft schon weg ist.
    window.PromptAiAuthPlan?.pick(plan);
  }
  function bindAuthPopupDismiss(){
    if(document.__gateAuthDismissBound)return;document.__gateAuthDismissBound=true;
    document.addEventListener('click',e=>{
      const dialog=$('#accountDialog');if(!dialog||!dialog.classList.contains('gate-auth-open'))return;
      if(e.target.closest('.auth-form-card'))return;
      if(e.target.closest('.auth-layout'))closeAuthPopup();
    });
    document.addEventListener('keydown',e=>{
      if(e.key!=='Escape')return;
      const dialog=$('#accountDialog');if(dialog?.classList.contains('gate-auth-open'))closeAuthPopup();
    });
  }

  // Der Satz im Bild wechselt, damit die Reihe an Fällen sichtbar wird statt eines einzigen.
  // Ein Ausblenden dazwischen, sonst springt der Text hart um.
  function rotateShot(shot){
    const head=shot.querySelector('.gate-shot-text b'),rest=shot.querySelector('.gate-shot-rest'),text=shot.querySelector('.gate-shot-text');
    if(!head||!rest||shot.__rotating)return;
    shot.__rotating=true;
    let index=Math.floor(Math.random()*EXAMPLES.length);
    const paint=()=>{const item=EXAMPLES[index%EXAMPLES.length];head.textContent=item.head;rest.textContent=item.rest};
    paint();
    setInterval(()=>{
      if(!shot.isConnected)return;
      text.style.transition='opacity .28s ease';text.style.opacity='0';
      setTimeout(()=>{index++;paint();text.style.opacity='1'},300);
    },3600);
  }

  // The price labels in the plans dialog are the single place live Stripe pricing is written to
  // (ui-regression-fixes.applyPricing). Mirroring them keeps the chips correct without a second
  // source; watchPricing below reacts to the text changing, which settle() alone would miss
  // because a characterData change is not a childList or attribute mutation.
  function syncTierChips(){
    const pro=$('#proPriceLabel')?.textContent?.trim(),ultimate=$('#ultimatePriceLabel')?.textContent?.trim();
    const chip=(id,price)=>{const node=$(id);if(!node||!price)return;const text=price.replace(/\s*\/\s*Monat$/,'').trim();if(node.textContent!==text)node.textContent=text};
    chip('#gateProPrice',pro);chip('#gateUltimatePrice',ultimate);
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
    if(!dialog.classList.contains('guest-gate')){dialog.classList.remove('gate-expanded');dialog.classList.remove('gate-auth-open')}
  }

  // Die Tarifseite lässt sich von mehreren Stellen öffnen (Einstiegsseite, "Tarife ansehen" im
  // Anmeldeformular, Upgrade-Knöpfe). Nur der Weg über die Einstiegsseite brachte einen danach
  // dorthin zurück; über die anderen stand man nach dem × plötzlich in der App, ohne angemeldet
  // zu sein. Solange niemand angemeldet ist, ist die Anmeldeseite der einzige richtige Ort.
  function guardGateReturn(){
    const plans=$('#plansDialog');if(!plans||plans.__gateReturnBound)return;
    plans.__gateReturnBound=true;
    plans.addEventListener('close',()=>{
      const signedIn=Boolean(window.SiteBriefCloud?.user);
      const account=$('#accountDialog');
      if(signedIn||!account||account.open)return;
      // Nur wenn die Anmeldeseite vorher wirklich der Zustand war - nicht mitten im Gastlauf.
      if(!account.classList.contains('guest-gate'))return;
      setTimeout(()=>{const dialog=$('#accountDialog');if(dialog&&!dialog.open){try{dialog.showModal()}catch{}}},40);
    });
  }

  function settle(){styles();ensureGateActions();watchPricing();syncTierChips();resetExpansion();guardGateReturn();bindAuthPopupDismiss()}
  function schedule(){clearTimeout(settleTimer);settleTimer=setTimeout(settle,24)}
  function init(){settle();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','open']});window.addEventListener('promptai:access',schedule);window.addEventListener('pageshow',schedule)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
