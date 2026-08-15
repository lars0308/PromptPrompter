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
      +'<button type="button" class="gate-plans-pick" id="gatePlansPick"><span class="gate-plans-copy"><span class="gate-plans-kicker">ABO ABSCHLIESSEN</span><strong>Alle drei Tarife im Vergleich</strong><small>Kostenlos, Pro und Ultimate nebeneinander – mit allen Leistungen und Preisen.</small><span class="gate-plans-tiers"><i>Kostenlos 0 €</i><i id="gateProTier">Pro 15,99 €</i><i id="gateUltimateTier">Ultimate 25,99 €</i></span></span></button>'
      +'<button type="button" class="gate-theme-pick" id="gateThemePick">Anderes Farbschema verwenden</button>';
    hero.insertAdjacentElement('afterend',box);

    // Das Produkt zeigen statt es zu beschreiben - dieselbe Konsole, die nach dem Einstieg kommt.
    const shot=document.createElement('div');shot.className='gate-shot';
    shot.innerHTML='<div class="gate-shot-bar"><i></i><i></i><i></i><span>COMMAND / 01</span></div>'
      +'<div class="gate-shot-body">'
      +'<span class="gate-shot-mode">Internetseite erstellen</span>'
      +'<p class="gate-shot-text"><b></b><span class="gate-shot-rest"></span><span class="gate-shot-caret"></span></p>'
      +'<div class="gate-shot-foot"><span>Mit Rückfragen</span><span>·</span><span>3 Richtungen</span><b>Master-Prompt</b></div>'
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
    $('#gatePlansPick',box).addEventListener('click',()=>openPlansFromGate());
    $('#gateThemePick',box).addEventListener('click',()=>$('#themeToggleBtn')?.click());
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
