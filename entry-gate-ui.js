(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  let settleTimer=0;
  // Ein festes Beispiel liest sich wie der einzige Fall, für den das Ding gemacht ist. Eine
  // wechselnde Reihe zeigt die Spannbreite - und dient auf der Startseite zugleich als Anregung,
  // was man hier überhaupt hineinschreiben kann. Global, damit Einstiegsseite und Konsole
  // dieselben Sätze verwenden und nicht zwei Listen auseinanderlaufen.
  //
  // Wer hier tippt, baut das Projekt - er ist nicht der Betrieb, um den es geht. Deshalb steht
  // vor jedem Beispiel, für wen gebaut wird: dieselbe Branchenvielfalt, aber aus der Sicht
  // dessen, der den Auftrag danach in Claude Code oder Cursor weiterreicht.
  const EXAMPLES=window.PromptAiExamples=window.PromptAiExamples||[
    {head:'Kundenprojekt: Dachdecker in Lindhorst.',rest:' Leistungen, Einsatzgebiet und eine Nummer, die man direkt anrufen kann. Next.js, statisch ausliefern.'},
    {head:'Internes Werkzeug für unser Team.',rest:' Tabellenansicht, Filter, Rollen. React, bestehendes Design-System weiterverwenden.'},
    {head:'Relaunch für einen Bestandskunden.',rest:' Alte Seite auslesen, Inhalte übernehmen, Struktur und Auftritt neu.'},
    {head:'Landingpage für einen SaaS-Start.',rest:' Preistabelle, Anmeldung, Belege von echten Kunden. Schnell und messbar.'},
    {head:'Kundenprojekt: Kosmetikstudio in Bremen.',rest:' Behandlungen mit Preisen, Termine online, ruhiger hochwertiger Auftritt.'},
    {head:'Portfolio für eine Fotografin.',rest:' Die Bilder tragen die Seite, Preise und Anfrage bleiben schlicht.'},
    {head:'Shop-Frontend für einen Hofladen.',rest:' Was gerade geerntet wird, Öffnungszeiten, Weg zum Hof. Astro.'},
    {head:'Mandantenportal für ein Steuerbüro.',rest:' Anmeldung, Dokumente, Erstberatung. Seriös und ruhig.'},
    {head:'Terminbuchung für eine Physiotherapie.',rest:' Kassenleistungen, Team und Anfrage ohne Umwege.'},
    {head:'Dokumentationsseite für ein eigenes Werkzeug.',rest:' Einstieg, Referenz, Beispiele. Durchsuchbar, dunkles Schema.'}
  ];

  // Dieselben drei Zeichnungen, die die Konsole auf der Startseite trägt (promptai-home-final.js).
  // Sie stehen hier ein zweites Mal, weil die Einstiegsseite geladen wird, bevor die Startseite
  // überhaupt gebaut ist - eine gemeinsame Quelle hätte eine Ladereihenfolge erzwungen.
  const SHOT_ICONS={
    website:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M3.8 12h16.4M12 3.5c2.2 2.4 3.4 5.2 3.4 8.5S14.2 18.1 12 20.5C9.8 18.1 8.6 15.3 8.6 12S9.8 5.9 12 3.5Z"/></svg>',
    send:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6v5.5a2.5 2.5 0 0 1-2.5 2.5H5"/><path d="m9 10-4 4 4 4"/></svg>',
    gear:'<svg class="prompt-setup-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M12 4.2v2M12 17.8v2M4.2 12h2M17.8 12h2M6.5 6.5l1.4 1.4M16.1 16.1l1.4 1.4M17.5 6.5l-1.4 1.4M7.9 16.1l-1.4 1.4"/></svg>'
  };

  function ensureGateActions(){
    const hero=$('#accountLoggedOut .auth-hero');if(!hero||$('#gateActions'))return;
    // Anmelden und Kostenlos testen gehören in die Kopfzeile, nicht mitten in die Seite.
    const top=document.createElement('div');top.className='gate-top';
    top.innerHTML='<button type="button" class="gate-login-pick" id="gateSignInPick">Anmelden</button>'
      +'<button type="button" class="gate-guest-btn" id="gateGuestBtn">Kostenlos testen</button>';
    ($('.auth-brand',hero)||hero).insertAdjacentElement('afterend',top);

    const box=document.createElement('div');box.id='gateActions';
    box.innerHTML=''
      // Hier stand "Kostenlos testen läuft ohne Konto: drei vollständige Durchläufe" - doppelt,
      // die Kostenlos-Kachel darunter sagt dasselbe. Der Platz gehört jetzt der Pflichtangabe
      // unter den Kacheln, die sonst unter die Fensterkante rutscht.
      +'<div class="gate-plan-list" aria-label="Tarif wählen">'
      +'<button type="button" class="gate-plan-pick" data-gate-plan="free">'
      +'<span class="gate-plan-head"><strong>Kostenlos</strong><b>0 €</b></span>'
      +'<small>Ohne Konto starten, drei vollständige Durchläufe.</small>'
      +'<ul class="gate-plan-points"><li>10 Prompts und 3 Website-Projekte im Monat</li><li>Drei Richtungen als HTML-Vorschau</li><li>Ein echter KI-Durchlauf im Monat</li></ul></button>'
      +'<button type="button" class="gate-plan-pick is-featured" data-gate-plan="pro">'
      +'<span class="gate-plan-head"><strong>Pro</strong><b id="gateProTier">Pro</b></span>'
      +'<small>Mehr Projekte, KI-Prüfung und Vorschauen für Kundenarbeit.</small>'
      +'<ul class="gate-plan-points"><li>100 Prompts und 25 Website-Projekte</li><li>KI-Bilder statt HTML, vier Richtungen</li><li>Ohne Rückfragen, KI-Prüfung ohne Monatsgrenze</li></ul></button>'
      +'<button type="button" class="gate-plan-pick" data-gate-plan="ultimate">'
      +'<span class="gate-plan-head"><strong>Ultimate</strong><b id="gateUltimateTier">Ultimate</b></span>'
      +'<small>Website-Probelauf, GitHub, eigene KI und volle Kontrolle.</small>'
      +'<ul class="gate-plan-points"><li>500 Prompts und 100 Website-Projekte</li><li>Fünf Richtungen, Probelauf und GitHub</li><li>Zwei eigene KI-Verbindungen inklusive</li></ul></button>'
      +'</div>'
      // Was vor dem ersten Klick gesagt sein muss, steht in einer Zeile unter den Kacheln: wohin
      // die Eingaben gehen (der Gastlauf startet ohne Konto und damit ohne Anmeldeformular, in
      // dem sonst die Zustimmung steht), was der Preis daneben bedeutet, und welche Texte gelten.
      // Bewusst knapp - drei Tarifkacheln ohne Scrollen lassen keinen Absatz zu.
      +'<p class="gate-plan-note">Preise pro Monat, monatlich kündbar, ohne USt. (§ 19 UStG). Eingaben gehen an KI-Anbieter. Es gelten <button type="button" class="link-btn" data-gate-legal="terms">Nutzungsbedingungen</button>, <button type="button" class="link-btn" data-gate-legal="privacy">Datenschutz</button> und <button type="button" class="link-btn" data-gate-legal="withdrawal">Widerruf</button>.</p>';
    hero.insertAdjacentElement('afterend',box);

    // Das Produkt zeigen statt es zu beschreiben - dieselbe Konsole, die nach dem Einstieg kommt.
    // Nicht mehr nachgebaut, sondern eins zu eins: dieselben Bausteine und Klassen wie die echte
    // Konsole auf der Startseite, nur ohne Funktion (inert, kein Tabstopp, keine ids - sonst
    // fänden die Startseiten-Skripte zwei Konsolen). Ändert sich die Konsole, ändert sich das
    // Bild mit, statt langsam daneben zu liegen.
    const shot=document.createElement('div');shot.className='gate-shot';
    shot.setAttribute('aria-hidden','true');shot.setAttribute('inert','');
    shot.innerHTML='<div class="prompt-command-panel">'
      +'<div class="prompt-command-top">'
      +'<button type="button" class="prompt-mode-button" tabindex="-1">'+SHOT_ICONS.website+'<span>Internetseite erstellen</span><i class="mode-chevron" aria-hidden="true"></i></button>'
      +'<button type="button" class="prompt-setup-line" tabindex="-1">'+SHOT_ICONS.gear+'</button>'
      +'</div>'
      +'<textarea class="prompt-command-input" rows="5" readonly tabindex="-1" aria-label="Beispiel: so sieht die Konsole nach dem Einstieg aus" placeholder=""></textarea>'
      +'<button type="button" class="prompt-command-submit" tabindex="-1">'+SHOT_ICONS.send+'</button>'
      +'<footer class="prompt-command-meta">'
      +'<button type="button" class="prompt-attach-button" tabindex="-1">+</button>'
      +'<span class="gate-shot-quota">Claude Code · Mit Rückfragen · 3 Richtungen</span>'
      +'<span class="prompt-plan-chip"><b>Free</b></span>'
      +'</footer>'
      +'</div>';
    box.insertAdjacentElement('afterend',shot);

    // Drei Belege statt drei Werbezeilen - dieselben Schritte, die die App danach wirklich geht.
    const proof=document.createElement('ul');proof.className='gate-proof';
    proof.innerHTML='<li><strong>Beschreiben</strong><small>Ein paar Sätze reichen. Gibt es schon eine Seite, lesen wir sie aus und übernehmen die belegten Fakten. Prompt.ai fragt nach, wo die Antwort das Ergebnis wirklich ändert.</small></li>'
      +'<li><strong>Richtung wählen</strong><small>Drei fertig gestaltete Vorschläge mit Farbwerten und Aufbau – die Entscheidung, die du sonst im Kundengespräch triffst.</small></li>'
      +'<li><strong>In deiner KI weiterbauen</strong><small>Master-Prompt, Seitenstruktur, gesicherte Fakten und die passende Anweisungsdatei – <code>CLAUDE.md</code>, <code>AGENTS.md</code>, <code>GEMINI.md</code> oder Cursor-Rules. Direkt ins Projekt legen und loslegen.</small></li>';
    shot.insertAdjacentElement('afterend',proof);
    rotateShot(shot);
    const reveal=()=>{$('#accountDialog')?.classList.add('gate-expanded');setTimeout(()=>{$('.auth-form-card')?.scrollIntoView({behavior:'smooth',block:'start'})},60)};
    // Die beiden Kopfzeilen-Knöpfe liegen in .gate-top, die übrigen in #gateActions - deshalb
    // wird hier im Dokument gesucht statt in einem der beiden Kästen.
    $('#gateSignInPick',top).addEventListener('click',reveal);
    $('#gateGuestBtn',top).addEventListener('click',()=>$('#guestContinueBtn')?.click());
    box.querySelectorAll('[data-gate-plan]').forEach(button=>button.addEventListener('click',()=>pickGatePlan(button.dataset.gatePlan)));
    // Die Rechtstexte liegen in legal-pages.js; hier wird nur geöffnet, damit es genau eine
    // Fassung gibt und nicht eine zweite, die irgendwann veraltet.
    box.querySelectorAll('[data-gate-legal]').forEach(button=>button.addEventListener('click',()=>window.PromptAiLegalPages?.openLegal?.(button.dataset.gateLegal)));
  }

  // Der Satz im Bild wechselt, damit die Reihe an Fällen sichtbar wird statt eines einzigen.
  // Genau wie auf der Startseite: der Vorschlag steht im Platzhalter, blendet aus, wechselt im
  // unsichtbaren Moment und blendet wieder ein (CSS-Regel .prompt-command-input.is-hint-fading).
  // Er steht dabei länger als die Startseite - hier liest man ihn zum ersten Mal, ohne zu wissen,
  // was das Feld überhaupt tut, und ein Satz, der beim Lesen umspringt, wirkt hektisch.
  const SHOT_INTERVAL=9600,SHOT_FADE=520;
  function rotateShot(shot){
    const field=shot.querySelector('.prompt-command-input');
    if(!field||shot.__rotating)return;
    shot.__rotating=true;
    let index=Math.floor(Math.random()*EXAMPLES.length);
    const paint=()=>{const item=EXAMPLES[index%EXAMPLES.length];field.placeholder=`z. B. ${item.head}${item.rest}`};
    paint();
    setInterval(()=>{
      if(!shot.isConnected)return;
      field.classList.add('is-hint-fading');
      setTimeout(()=>{index++;paint();field.classList.remove('is-hint-fading')},SHOT_FADE);
    },SHOT_INTERVAL);
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

  function pickGatePlan(plan){
    if(plan==='free'){$('#guestContinueBtn')?.click();return}
    const selector=plan==='ultimate'?'#startUltimateCheckoutBtn':'#startProCheckoutBtn';
    const button=$(selector);
    if(button){button.click();return}
    openPlansFromGate();
  }

  function resetExpansion(){
    const dialog=$('#accountDialog');if(!dialog)return;
    if(!dialog.classList.contains('guest-gate'))dialog.classList.remove('gate-expanded');
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

  function settle(){ensureGateActions();watchPricing();syncTierChips();resetExpansion();guardGateReturn()}
  function schedule(){clearTimeout(settleTimer);settleTimer=setTimeout(settle,24)}
  function init(){settle();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','open']});window.addEventListener('promptai:access',schedule);window.addEventListener('pageshow',schedule)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
