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
      +'<button type="button" class="gate-plan-pick" data-gate-plan="free" data-gate-cta="Ohne Konto starten →">'
      +'<span class="gate-plan-head"><strong>Kostenlos</strong><b>0 €</b></span>'
      +'<small>Ohne Konto starten, drei vollständige Durchläufe.</small>'
      +'<ul class="gate-plan-points"><li>10 Prompts und 3 Website-Projekte im Monat</li><li>Drei Richtungen als HTML-Vorschau</li><li>Ein echter KI-Durchlauf im Monat</li></ul></button>'
      +'<button type="button" class="gate-plan-pick is-featured" data-gate-plan="pro" data-gate-cta="Pro auswählen →">'
      +'<span class="gate-plan-head"><strong>Pro</strong><b id="gateProTier">Pro</b></span>'
      +'<small>Mehr Projekte, KI-Prüfung und Vorschauen für Kundenarbeit.</small>'
      +'<ul class="gate-plan-points"><li>100 Prompts und 25 Website-Projekte</li><li>KI-Bilder statt HTML, vier Richtungen</li><li>Ohne Rückfragen, KI-Prüfung ohne Monatsgrenze</li></ul></button>'
      +'<button type="button" class="gate-plan-pick" data-gate-plan="ultimate" data-gate-cta="Ultimate auswählen →">'
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
    // Die beiden Kopfzeilen-Knöpfe liegen in .gate-top, die übrigen in #gateActions - deshalb
    // wird hier im Dokument gesucht statt in einem der beiden Kästen.
    $('#gateSignInPick',top).addEventListener('click',openLogin);
    $('#gateGuestBtn',top).addEventListener('click',()=>$('#guestContinueBtn')?.click());
    box.querySelectorAll('[data-gate-plan]').forEach(button=>button.addEventListener('click',()=>pickGatePlan(button.dataset.gatePlan)));
    // Die Rechtstexte liegen in legal-pages.js; hier wird nur geöffnet, damit es genau eine
    // Fassung gibt und nicht eine zweite, die irgendwann veraltet.
    box.querySelectorAll('[data-gate-legal]').forEach(button=>button.addEventListener('click',()=>window.PromptAiLegalPages?.openLegal?.(button.dataset.gateLegal)));
  }

  // "Anmelden" klappte das Formular unter den Tarifkacheln auf - man landete unterhalb der Seite
  // und musste dorthin scrollen. Ein Anmeldefenster ist aber ein Fenster: es liegt ueber der
  // Seite und hat oben rechts ein Kreuz.
  //
  // Kein zweites Formular dafuer. Das vorhandene wandert in das Fenster hinein und beim
  // Schliessen wieder zurueck - eine zweite Anmeldemaske waere die, die irgendwann falsch ist.
  function ensureLoginDialog(){
    let dialog=$('#gateLoginDialog');if(dialog)return dialog;
    dialog=document.createElement('dialog');
    dialog.id='gateLoginDialog';
    // prompt-own-style haelt die Vollbild-Regel fuer Dialoge fern - dies hier ist ein Popup.
    dialog.className='gate-login-dialog prompt-own-style';
    dialog.setAttribute('aria-label','Anmelden');
    dialog.innerHTML='<div class="gate-login-frame">'
      +'<header class="gate-login-head"><div><span>KONTO</span><h2>Anmelden</h2></div>'
      +'<button type="button" class="gate-login-close" aria-label="Schließen">×</button></header>'
      +'<div class="gate-login-body"></div></div>';
    document.body.appendChild(dialog);
    $('.gate-login-close',dialog).addEventListener('click',closeLogin);
    dialog.addEventListener('cancel',event=>{event.preventDefault();closeLogin()});
    // Klick auf die Flaeche daneben schliesst - wie bei jedem Fenster dieser App.
    dialog.addEventListener('click',event=>{if(event.target===dialog)closeLogin()});
    return dialog;
  }
  function openLogin(){
    const layout=$('.auth-layout');if(!layout)return;
    const dialog=ensureLoginDialog(),body=$('.gate-login-body',dialog);
    if(layout.parentElement!==body)body.appendChild(layout);
    try{if(!dialog.open)dialog.showModal()}catch{}
    setTimeout(()=>$('#authEmail')?.focus({preventScroll:true}),90);
  }
  function closeLogin(){
    const dialog=$('#gateLoginDialog');if(!dialog)return;
    const layout=$('.gate-login-body .auth-layout',dialog),host=$('#accountLoggedOut');
    if(layout&&host)host.appendChild(layout);
    if(dialog.open)try{dialog.close()}catch{}
    // Das × am Anmeldefenster hiess bisher: raus aus der App.
    //
    // Beim Öffnen wandert das Anmeldeformular aus der Einstiegsseite in dieses Fenster, und die
    // Einstiegsseite darunter geht dabei zu. Schloss man das Anmeldefenster wieder, kam sie nicht
    // von selbst zurück - dahinter lag die Startseite, und dort stand man plötzlich, ohne
    // angemeldet zu sein und ohne je „kostenlos testen“ gedrückt zu haben.
    //
    // Wer ein Fenster zumacht, will dahin zurück, wo er herkam. Solange niemand angemeldet ist,
    // ist das die Einstiegsseite.
    if(window.SiteBriefCloud?.user)return;
    const gate=$('#accountDialog');
    if(!gate||gate.open)return;
    gate.classList.add('guest-gate');
    // Erst im nächsten Takt: ein dialog, das im selben Moment schliesst und wieder aufgeht,
    // laesst der Browser gelegentlich ganz aus.
    setTimeout(()=>{const d=$('#accountDialog');if(d&&!d.open&&!window.SiteBriefCloud?.user)try{d.showModal()}catch{}},0);
  }

  /* ===========================================================================
     Die Startseite auf dem Handy

     Auf dem Telefon stand bisher alles untereinander: eine vierzeilige Ueberschrift,
     fuenf Zeilen Fliesstext, dann die Tarife. Bevor irgendetwas Konkretes im Bild war,
     war der Bildschirm voll - und man las, was das Produkt behauptet, sah aber nie,
     was es tut.

     Der erste Bildschirm ist deshalb jetzt genau eine Sache: die Konsole, wie sie
     nach dem Einstieg aussieht, und sie spielt vor, was passiert. Darunter die
     beiden Wege hinein, darunter ein Pfeil, der zeigt, dass es weitergeht. Alles
     Weitere - Ueberschrift, die drei Schritte, die Tarife - liegt eine Wischbewegung
     tiefer.

     Nur auf dem Handy. Auf dem Desktop ist Platz genug fuer alles nebeneinander,
     dort bleibt es, wie es ist; die Stuecke wandern beim Wechsel der Bildschirm-
     breite zurueck an ihren Platz.
     =========================================================================== */
  const SCHMAL='(max-width:820px)';
  let buehneAktiv=false;

  function ensureBuehne(){
    const host=$('#accountLoggedOut');if(!host)return null;
    let buehne=$('.gate-stage',host);
    if(!buehne){
      buehne=document.createElement('div');buehne.className='gate-stage';
      buehne.innerHTML='<div class="gate-stage-brand"></div>'
        // Ueberschrift und ein Satz - mehr nicht. Wer hier landet, soll in zwei Sekunden
        // wissen, wofuer das gut ist; alles Weitere zeigt die Konsole darunter von selbst.
        +'<div class="gate-stage-intro">'
        +'<h2>Prompt.ai für deine KI</h2>'
        +'<p>Ein Satz rein — fertiger Auftrag raus.</p>'
        +'</div>'
        +'<div class="gate-stage-slot"></div>'
        // Was am Ende herauskommt, in drei Woertern. Die Seite sagte bisher nirgends, was man
        // eigentlich in der Hand haelt - und genau das ist der Unterschied zu "noch ein KI-Tool".
        +'<ul class="gate-stage-output" aria-label="Das bekommst du">'
        +'<li>Master-Prompt</li><li>Seitenstruktur</li><li>CLAUDE.md &middot; AGENTS.md</li>'
        +'</ul>'
        +'<div class="gate-stage-actions"></div>'
        // Der Pfeil sagt, wohin er fuehrt. Ohne Beschriftung ist er nur eine Geste;
        // mit ihr weiss man vorher, was unten wartet.
        +'<button type="button" class="gate-stage-more">'
        +'<span>Zu den Tarifen</span>'
        +'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>'
        +'</button>';
      host.prepend(buehne);
      $('.gate-stage-more',buehne).addEventListener('click',()=>{
        ($('#gateActions',host)||$('.gate-proof',host))?.scrollIntoView({behavior:'smooth',block:'start'});
      });
    }
    return buehne;
  }

  function syncBuehne(){
    let schmal=false;try{schmal=matchMedia(SCHMAL).matches}catch{}
    const host=$('#accountLoggedOut'),shot=$('.gate-shot',host||document),top=$('.gate-top',host||document);
    if(!host||!shot||!top)return;
    if(schmal===buehneAktiv&&schmal&&$('.gate-stage .gate-shot'))return;
    buehneAktiv=schmal;
    if(schmal){
      const buehne=ensureBuehne();if(!buehne)return;
      const marke=$('.auth-brand',host);
      if(marke)$('.gate-stage-brand',buehne).appendChild(marke);
      $('.gate-stage-slot',buehne).appendChild(shot);
      $('.gate-stage-actions',buehne).appendChild(top);
      startVorfuehrung(shot);
    }else{
      const hero=$('.auth-hero',host),plaene=$('#gateActions',host);
      const marke=$('.gate-stage-brand .auth-brand',host);
      if(hero&&marke)hero.prepend(marke);
      if(hero&&top.parentElement!==hero)($('.auth-brand',hero)||hero).insertAdjacentElement('afterend',top);
      if(plaene&&shot.parentElement!==host)plaene.insertAdjacentElement('afterend',shot);
      stopVorfuehrung(shot);
      $('.gate-stage',host)?.remove();
    }
  }

  /* Die Vorfuehrung in der Konsole.

     Drei Abschnitte im Wechsel, immer derselbe Kasten: es wird etwas eingetippt, der
     Ladeschirm laeuft an, das Ergebnis steht da. Zusammen ist das der ganze Ablauf in
     zwanzig Sekunden - ohne einen Satz darueber, dass es ihn gibt.

     Der Kasten ist inert und aria-hidden: fuer die Bedienung und fuer Vorlesegeraete
     existiert er nicht, er ist ein Bild. Bei "Bewegung reduzieren" steht einfach das
     Ergebnis da. */
  const VORFUEHRUNG=[
    {tippt:'Bauernladen in der Nähe. Erntezeiten, was heute da ist, und wie man hinfindet.',
     prompt:'ROLLE\nDu bist Senior-Webdesigner und Frontend-Konzeptioner.\n\nPROJEKT\nHofladen mit Direktverkauf. Hauptziel: Anfragen.\n\nUMSETZUNGSREIHENFOLGE\n1. Startseite — Einstieg\n2. Öffnungszeiten — trägt das Hauptziel\n3. Anfahrt\n\nGESICHERTE FAKTEN\n- Adresse: aus der Kundenseite gelesen\n- Öffnungszeiten: nicht belegt → offener Punkt'},
    {tippt:'Kosmetikstudio in Bremen. Behandlungen mit Preisen, Termine online, ruhiger Auftritt.',
     prompt:'ROLLE\nDu bist Senior-Webdesigner und Frontend-Konzeptioner.\n\nPROJEKT\nKosmetikstudio. Hauptziel: Termine.\n\nABNAHME JE SEITE\n- Behandlungen: jede Leistung trägt eine echte Bezeichnung\n- Termin: ohne Scrollen erreichbar\n\nNOCH ZU LIEFERN\n- Preisliste\n- Impressumsangaben'}
  ];
  const TIPP_MS=42,STEHEN_MS=1500,LADEN_MS=2600,ZEIGEN_MS=5200;

  function reduziert(){try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch{return false}}
  function stopVorfuehrung(shot){clearTimeout(shot.__demo);shot.__demo=0;shot.__laeuft=false}

  function startVorfuehrung(shot){
    if(shot.__laeuft)return;shot.__laeuft=true;
    const panel=$('.prompt-command-panel',shot),feld=$('.prompt-command-input',shot);
    if(!panel||!feld)return;
    // Der Ladeschirm und das Ergebnis liegen als eigene Schichten ueber dem Feld, damit die
    // Konsole drumherum stehen bleibt - der Rahmen wechselt nicht, nur sein Inhalt.
    if(!$('.gate-shot-stage',panel)){
      const laden=document.createElement('div');laden.className='gate-shot-stage gate-shot-loading';
      laden.innerHTML='<span class="kicker">PROMPT.AI</span><strong>Dein Master-Prompt entsteht</strong><small></small>';
      const fertig=document.createElement('pre');fertig.className='gate-shot-stage gate-shot-result';
      panel.append(laden,fertig);
    }
    const laden=$('.gate-shot-loading',panel),fertig=$('.gate-shot-result',panel);
    // Der Rahmen der Konsole soll waehrend der Vorfuehrung stehen bleiben: die beiden Schichten
    // decken deshalb nur den Bereich des Textfeldes ab. Wo der anfaengt und aufhoert, sagt die
    // Konsole selbst - so verrutscht nichts, wenn sich ihre Maße irgendwann aendern.
    const vermessen=()=>{
      const kasten=panel.getBoundingClientRect(),feldKasten=feld.getBoundingClientRect();
      if(!kasten.height||!feldKasten.height)return;
      panel.style.setProperty('--shot-top',`${Math.max(0,Math.round(feldKasten.top-kasten.top))}px`);
      panel.style.setProperty('--shot-bottom',`${Math.max(0,Math.round(kasten.bottom-feldKasten.bottom))}px`);
    };
    vermessen();
    try{new ResizeObserver(vermessen).observe(panel)}catch{}
    const zeilen=['Beschreibung wird eingeordnet.','Seitenstruktur wird abgeleitet.','Gesicherte Fakten werden geprüft.','Offene Punkte werden benannt.'];

    if(reduziert()){
      feld.value=VORFUEHRUNG[0].tippt;fertig.textContent=VORFUEHRUNG[0].prompt;
      panel.dataset.phase='fertig';return;
    }

    let runde=0;
    const plan=(fn,ms)=>{shot.__demo=setTimeout(()=>{if(shot.isConnected&&shot.__laeuft)fn()},ms)};

    const tippen=()=>{
      const fall=VORFUEHRUNG[runde%VORFUEHRUNG.length];
      panel.dataset.phase='tippen';feld.value='';laden.style.removeProperty('--prompt-fill');
      let i=0;
      const schlag=()=>{
        if(!shot.isConnected||!shot.__laeuft)return;
        feld.value=fall.tippt.slice(0,++i);
        if(i<fall.tippt.length)shot.__demo=setTimeout(schlag,TIPP_MS);
        else plan(laufen,STEHEN_MS);
      };
      schlag();
    };
    const laufen=()=>{
      const fall=VORFUEHRUNG[runde%VORFUEHRUNG.length];
      panel.dataset.phase='laden';
      const strong=$('strong',laden),satz=$('small',laden);
      window.PromptAiFill?.words?.(strong,0);
      const start=performance.now();let z=0;satz.textContent=zeilen[0];
      const tick=()=>{
        if(!shot.isConnected||!shot.__laeuft||panel.dataset.phase!=='laden')return;
        const anteil=Math.min(1,(performance.now()-start)/LADEN_MS);
        window.PromptAiFill?.words?.(strong,anteil);
        const soll=Math.min(zeilen.length-1,Math.floor(anteil*zeilen.length));
        if(soll!==z){z=soll;satz.textContent=zeilen[z]}
        if(anteil<1)requestAnimationFrame(tick);
        else{fertig.textContent=fall.prompt;panel.dataset.phase='fertig';plan(()=>{runde++;tippen()},ZEIGEN_MS)}
      };
      requestAnimationFrame(tick);
    };
    tippen();
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
    // Der Tarifname steht schon als Ueberschrift der Kachel. Frueher wurde er hier noch einmal
    // davorgesetzt - "Pro Pro 20,99 €" waere aufgefallen, "Pro 20,99 €" liest sich wie ein Preis
    // und fiel deshalb monatelang nicht auf. Der Preis traegt jetzt nur den Preis; und falls die
    // Beschriftung aus Stripe den Namen schon mitbringt, faellt er hier weg.
    const chip=(id,label,price)=>{
      const node=$(id);if(!node||!price)return;
      const text=price.replace(/\s*\/\s*Monat$/,'').replace(new RegExp(`^${label}\\s+`,'i'),'').trim();
      if(text&&node.textContent!==text)node.textContent=text;
    };
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

  // Pro und Ultimate taten auf der Einstiegsseite nichts.
  //
  // Sie klickten den Kaufen-Knopf der Tarifseite, und der beginnt einen Checkout. Ohne Konto gibt
  // es keinen Checkout: der Aufruf ruft dann showAccountGate() - also genau die Seite, auf der man
  // schon steht. Sichtbar passierte nichts, und die Kachel wirkte tot.
  //
  // Den richtigen Weg gibt es längst: pickAuthPlan() merkt sich den gewählten Tarif und schreibt
  // ins Anmeldeformular „…dann geht es direkt weiter zu Pro". Genau die Knöpfe, die das auslösen,
  // stehen im Formular - hier wird der passende gedrückt und das Formular dazu geöffnet, damit
  // die Nachricht auch jemand liest. Wer schon angemeldet ist, geht direkt zum Kauf.
  function pickGatePlan(plan){
    if(plan==='free'){$('#guestContinueBtn')?.click();return}
    if(!window.SiteBriefCloud?.user){
      openLogin();
      // Erst nach dem Umzug des Formulars in das Anmeldefenster: sonst landet die Nachricht in
      // einem Feld, das gerade den Platz wechselt.
      setTimeout(()=>window.PromptAiAuthPlan?.pick?.(plan),60);
      return;
    }
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

  // Ist die Anmeldung durch, gehoert das Fenster zu - und das Formular zurueck an seinen Platz,
  // damit app.js es wie gewohnt zwischen angemeldet und abgemeldet umschalten kann.
  function closeLoginWhenSignedIn(){
    const angemeldet=Boolean(window.SiteBriefCloud?.user);
    // Das Formular gehoert zurueck an seinen Platz, sobald jemand angemeldet ist - auch dann,
    // wenn dieses Fenster gar nicht mehr offen ist.
    //
    // Frueher stand die Pruefung auf den eigenen Dialog ganz vorn und sprang bei geschlossenem
    // Fenster sofort heraus. Schliesst aber app.js das Fenster (was es beim Anmelden tut), bleibt
    // das Formular in einem Fenster liegen, das niemand mehr sieht - und app.js schaltet danach
    // ein Element zwischen angemeldet und abgemeldet um, das gar nicht mehr an seinem Platz haengt.
    if(angemeldet&&$('.gate-login-body .auth-layout')){closeLogin();return}
    if(!$('#gateLoginDialog')?.open)return;
    // Sobald die Anmeldung durch ist - erkennbar am Konto oder am laufenden Ladeschirm -
    // gehoert das Fenster zu. Bei einem Fehlversuch bleibt es stehen, sonst waere die
    // Fehlermeldung im selben Moment weg, in dem sie erscheint.
    if(angemeldet||document.documentElement.classList.contains('prompt-workflow-loading'))closeLogin();
  }
  function settle(){ensureGateActions();syncBuehne();watchPricing();syncTierChips();resetExpansion();guardGateReturn();closeLoginWhenSignedIn()}
  function schedule(){clearTimeout(settleTimer);settleTimer=setTimeout(settle,24)}
  function init(){settle();try{matchMedia(SCHMAL).addEventListener('change',()=>{buehneAktiv=!buehneAktiv;syncBuehne()})}catch{}new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','open']});window.addEventListener('promptai:access',schedule);window.addEventListener('pageshow',schedule)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
