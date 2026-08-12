(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const CONSENT_KEY='prompt-ai-cookie-consent-v1';
  let resolveConsent;
  window.PromptAiCookieConsent=new Promise(resolve=>{resolveConsent=resolve});

  const IMPRINT_HTML=`
    <h3>Angaben gemäß § 5 TMG / § 18 Abs. 2 MStV</h3>
    <p>[Vor- und Nachname bzw. Firmenname eintragen]<br>[Straße und Hausnummer]<br>[Postleitzahl und Ort]<br>[Land]</p>
    <h3>Kontakt</h3>
    <p>Telefon: [Telefonnummer eintragen]<br>E-Mail: [Kontakt-E-Mail eintragen]</p>
    <h3>Vertretungsberechtigt</h3>
    <p>[Name der vertretungsberechtigten Person(en)]</p>
    <h3>Registereintrag</h3>
    <p>[Falls vorhanden: Handelsregister, Registergericht, Registernummer – sonst entfernen]</p>
    <h3>Umsatzsteuer-ID</h3>
    <p>[Falls vorhanden: USt-IdNr. gemäß § 27a UStG – sonst entfernen]</p>
    <h3>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h3>
    <p>[Name, Anschrift wie oben]</p>
    <h3>Streitschlichtung</h3>
    <p>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: [Link zur OS-Plattform, falls zutreffend]. Wir sind nicht verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen. [Aussage prüfen/anpassen.]</p>
  `;

  const PRIVACY_HTML=`
    <h3>1. Verantwortlicher</h3>
    <p>[Firmenname / Name]<br>[Anschrift]<br>E-Mail: [Datenschutz-Kontakt eintragen]</p>
    <h3>2. Übersicht der Verarbeitungen</h3>
    <p>Prompt.ai verarbeitet Daten, die du beim Anlegen eines Kontos, beim Erstellen von Projekten und Prompts sowie bei einem Abo-Abschluss angibst. Dazu zählen insbesondere E-Mail-Adresse, Konto- und Nutzungsdaten sowie die von dir eingegebenen Projektinhalte.</p>
    <h3>3. Hosting</h3>
    <p>Diese Anwendung wird über Vercel (Vercel Inc.) gehostet. [Details zum Auftragsverarbeitungsvertrag, Serverstandort und Rechtsgrundlage ergänzen.]</p>
    <h3>4. Konten, Authentifizierung &amp; Datenbank</h3>
    <p>Für Registrierung, Anmeldung und die Speicherung deiner Projekte, Referenzbilder und Unterlagen nutzen wir Supabase (Supabase Inc.) als Auftragsverarbeiter. [Details zum Auftragsverarbeitungsvertrag, Serverstandort und Speicherdauer ergänzen.]</p>
    <h3>5. Zahlungsabwicklung</h3>
    <p>Zahlungen für Pro- und Ultimate-Tarife werden über Stripe (Stripe, Inc.) abgewickelt. Dabei werden Zahlungsdaten direkt an Stripe übermittelt. [Details zur Rechtsgrundlage, Datenweitergabe und Stripe-Datenschutzerklärung verlinken.]</p>
    <h3>6. Cookies &amp; lokale Speicherung</h3>
    <p>Wir setzen technisch notwendige Cookies bzw. lokale Speicherung (localStorage/sessionStorage) ein, um Anmeldung, Sitzung und Einstellungen (z.&nbsp;B. Dunkelmodus) zu ermöglichen. [Falls Analyse-/Marketing-Cookies eingesetzt werden, hier ergänzen und Einwilligungslogik entsprechend erweitern.]</p>
    <h3>7. KI-Verarbeitung deiner Eingaben</h3>
    <p>Deine Projektangaben, Referenztexte, hochgeladenen Bilder/PDFs und ausgewählten Antworten werden zur Erstellung von Prompts, Vorschauen und Bildvorschauen an angebundene KI-Anbieter übermittelt. Je nach gewählter Verbindung und Funktion sind das: Vercel AI Gateway, OpenAI, Google (Gemini) und Cloudflare Workers AI. Wenn du eigene API-Keys hinterlegst, verarbeitet ausschließlich der jeweils gewählte Anbieter deine Anfrage; ohne eigene Keys nutzen wir eine von uns zentral bereitgestellte Verbindung zu einem dieser Anbieter. [Rechtsgrundlage, Auftragsverarbeitungsverträge und Speicherdauer bei den jeweiligen Anbietern ergänzen.]</p>
    <h3>8. Eigene Verbindungen (API-Keys, GitHub)</h3>
    <p>Ab Pro kannst du eigene API-Keys (u.&nbsp;a. für GitHub) unter Einstellungen hinterlegen. Diese werden verschlüsselt in Supabase Vault gespeichert und ausschließlich für die von dir ausgelösten Aktionen verwendet (z.&nbsp;B. GitHub-Veröffentlichung oder eigene KI-Anfragen).</p>
    <h3>9. Kundeninformationen &amp; fremde Webseiten</h3>
    <p>Wenn du unter „Kundeninformationen" die Website oder einen Google-Eintrag deines Auftraggebers hinterlegst, ruft Prompt.ai diese öffentlich erreichbare Seite ab und liest Inhalte, Links und Bilder aus, um sie in dein Projekt zu übernehmen. Dabei können auch personenbezogene Daten Dritter enthalten sein (z.&nbsp;B. Namen oder Kontaktdaten auf einer „Über uns"-Seite). Du bist dafür verantwortlich, dass du zur Angabe dieser Quelle berechtigt bist; Prompt.ai übernimmt keine Haftung für Inhalte, die auf diesem Weg verarbeitet werden. Gleiches gilt für Referenz-Links und -Bilder, die du unter „Referenzen" hinterlegst.</p>
    <h3>10. Deine Rechte</h3>
    <p>Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch gemäß Art. 15–21 DSGVO sowie ein Beschwerderecht bei einer Aufsichtsbehörde. [Kontaktweg für Anfragen ergänzen.]</p>
    <h3>11. Speicherdauer</h3>
    <p>[Konkrete Speicher- und Löschfristen für Konto- und Projektdaten ergänzen.]</p>
  `;

  function ensureStyle(){
    if($('#legalPagesStyles'))return;
    const s=document.createElement('style');
    s.id='legalPagesStyles';
    s.textContent=`
      .legal-body{padding:0 26px 26px;max-height:64vh;overflow-y:auto;font-size:12px;line-height:1.65;color:var(--ink)}
      .legal-body h3{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:20px 0 6px}
      .legal-body h3:first-child{margin-top:0}
      .legal-body p{margin:0 0 4px}
      .legal-placeholder-note{margin:0 0 18px;padding:11px 14px;border-radius:10px;border:1px solid var(--warn);background:rgba(154,109,31,.12);color:var(--warn);font-size:11px;line-height:1.5;font-weight:600}
      .menu-legal-row{display:flex;gap:14px;padding-top:10px;margin-top:4px;border-top:1px solid var(--line)}
      .menu-legal-row .text-btn{font-size:9px}
      .gate-legal-row{display:flex;justify-content:center;gap:16px;padding:14px 26px 20px;margin-top:2px;border-top:1px solid var(--line)}
      .gate-legal-row .text-btn{font-size:9px;color:var(--muted)}
      .link-btn{border:0;background:none;padding:0;margin:0;color:var(--accent);text-decoration:underline;text-underline-offset:2px;font:inherit;cursor:pointer}
      .cookie-banner{position:fixed;inset:0;z-index:2147483200;margin:0;padding:20px;border:0;background:var(--paper);display:grid;place-items:center;pointer-events:none;width:100%;height:100%;max-width:none;max-height:none;color:inherit}
      .cookie-banner:not([open]){display:none}
      .cookie-banner::backdrop{display:none}
      .cookie-banner-box{pointer-events:auto;width:100%;max-width:520px;padding:0;border-radius:0;border:0;background:transparent;box-shadow:none;display:flex;flex-direction:column;gap:18px}
      .cookie-banner-box .section-kicker{display:block;color:var(--accent);font-size:10px;font-weight:850;letter-spacing:.12em}
      .cookie-banner-box h2{margin:8px 0 0;font-size:clamp(24px,6vw,32px);letter-spacing:-.03em}
      .cookie-banner p{margin:0;font-size:14px;line-height:1.6;color:var(--muted)}
      .cookie-banner-actions{display:flex;flex-direction:column;gap:8px}
      .cookie-banner-actions button{width:100%;min-height:48px}
      .cookie-banner-actions #cookieBannerSettingsBtn{min-height:auto;width:auto;align-self:center}
      .cookie-banner-settings{display:grid;gap:12px;margin-top:2px;padding-top:16px;border-top:1px solid var(--line)}
      .cookie-banner-settings[hidden]{display:none}
      .cookie-category{display:grid;grid-template-columns:16px 1fr;gap:9px;align-items:start}
      .cookie-category input{margin-top:2px;accent-color:var(--accent)}
      .cookie-category span{display:block}
      .cookie-category strong{display:block;font-size:12px}
      .cookie-category small{display:block;margin-top:2px;font-size:10px;line-height:1.45;color:var(--muted)}
      .cookie-category.disabled{opacity:.6}
    `;
    document.head.appendChild(s);
  }

  function openLegal(kind){
    const dialog=$('#legalDialog');if(!dialog)return;
    const title=$('#legalTitle'),content=$('#legalContent');
    if(kind==='privacy'){title.textContent='Datenschutzerklärung';content.innerHTML=PRIVACY_HTML}
    else{title.textContent='Impressum';content.innerHTML=IMPRINT_HTML}
    if(!dialog.open)dialog.showModal();
  }

  function ensureMenuLinks(){
    const menu=$('#topbarMenu');if(!menu||$('#menuLegalRow'))return;
    const row=document.createElement('div');
    row.className='menu-legal-row';
    row.id='menuLegalRow';
    const imprint=document.createElement('button');
    imprint.type='button';imprint.className='text-btn';imprint.id='menuImprintBtn';imprint.textContent='Impressum';
    imprint.addEventListener('click',()=>openLegal('imprint'));
    const privacy=document.createElement('button');
    privacy.type='button';privacy.className='text-btn';privacy.id='menuPrivacyBtn';privacy.textContent='Datenschutz';
    privacy.addEventListener('click',()=>openLegal('privacy'));
    row.appendChild(imprint);row.appendChild(privacy);
    menu.appendChild(row);
  }

  function ensureGateFooter(){
    const body=$('#accountDialog .account-body');if(!body||$('#gateLegalRow'))return;
    const row=document.createElement('div');
    row.className='gate-legal-row';
    row.id='gateLegalRow';
    const imprint=document.createElement('button');
    imprint.type='button';imprint.className='text-btn';imprint.textContent='Impressum';
    imprint.addEventListener('click',()=>openLegal('imprint'));
    const privacy=document.createElement('button');
    privacy.type='button';privacy.className='text-btn';privacy.textContent='Datenschutz';
    privacy.addEventListener('click',()=>openLegal('privacy'));
    row.appendChild(imprint);row.appendChild(privacy);
    body.appendChild(row);
  }

  function bindCookieBannerLink(){
    const link=$('#cookieBannerPrivacyLink');
    if(link&&!link.__legalBound){link.__legalBound=true;link.addEventListener('click',()=>openLegal('privacy'))}
  }

  function initCookieBanner(){
    const banner=$('#cookieBanner');if(!banner){resolveConsent();return}
    bindCookieBannerLink();
    let consent=null;
    try{consent=localStorage.getItem(CONSENT_KEY)}catch{}
    if(consent){resolveConsent();return}
    const essential=$('#cookieBannerEssentialBtn'),accept=$('#cookieBannerAcceptBtn'),settingsBtn=$('#cookieBannerSettingsBtn'),settings=$('#cookieBannerSettings');
    const dismiss=value=>{try{localStorage.setItem(CONSENT_KEY,value)}catch{}if(banner.open)banner.close();resolveConsent()};
    if(essential&&!essential.__legalBound){essential.__legalBound=true;essential.addEventListener('click',()=>dismiss('essential'))}
    if(accept&&!accept.__legalBound){accept.__legalBound=true;accept.addEventListener('click',()=>dismiss('all'))}
    if(settingsBtn&&!settingsBtn.__legalBound){settingsBtn.__legalBound=true;settingsBtn.addEventListener('click',()=>{const open=settings.hidden;settings.hidden=!open;settingsBtn.textContent=open?'Einstellungen ausblenden':'Einstellungen';essential.textContent=open?'Auswahl speichern':'Nur notwendige'})}
    if(!banner.open)banner.showModal();
  }

  function init(){
    ensureStyle();
    ensureMenuLinks();
    ensureGateFooter();
    initCookieBanner();
  }

  window.PromptAiLegalPages={openLegal};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
