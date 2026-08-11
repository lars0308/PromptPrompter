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
    <p>Diese Anwendung wird über Vercel gehostet. [Details zum Auftragsverarbeitungsvertrag, Serverstandort und Rechtsgrundlage ergänzen.]</p>
    <h3>4. Konten, Authentifizierung &amp; Datenbank</h3>
    <p>Für Registrierung, Anmeldung und die Speicherung deiner Projekte nutzen wir Supabase als Auftragsverarbeiter. [Details zum Auftragsverarbeitungsvertrag, Serverstandort und Speicherdauer ergänzen.]</p>
    <h3>5. Zahlungsabwicklung</h3>
    <p>Zahlungen für Pro- und Ultimate-Tarife werden über Stripe abgewickelt. Dabei werden Zahlungsdaten direkt an Stripe übermittelt. [Details zur Rechtsgrundlage, Datenweitergabe und Stripe-Datenschutzerklärung verlinken.]</p>
    <h3>6. Cookies &amp; lokale Speicherung</h3>
    <p>Wir setzen technisch notwendige Cookies bzw. lokale Speicherung (localStorage/sessionStorage) ein, um Anmeldung, Sitzung und Einstellungen (z.&nbsp;B. Dunkelmodus) zu ermöglichen. [Falls Analyse-/Marketing-Cookies eingesetzt werden, hier ergänzen und Einwilligungslogik entsprechend erweitern.]</p>
    <h3>7. KI-Verarbeitung deiner Eingaben</h3>
    <p>Deine Projektangaben werden zur Erstellung von Prompts durch angebundene KI-Dienste verarbeitet. [Konkrete(n) KI-Anbieter, Rechtsgrundlage und Speicherdauer ergänzen.]</p>
    <h3>8. Deine Rechte</h3>
    <p>Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch gemäß Art. 15–21 DSGVO sowie ein Beschwerderecht bei einer Aufsichtsbehörde. [Kontaktweg für Anfragen ergänzen.]</p>
    <h3>9. Speicherdauer</h3>
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
      .link-btn{border:0;background:none;padding:0;margin:0;color:var(--accent);text-decoration:underline;text-underline-offset:2px;font:inherit;cursor:pointer}
      .cookie-banner{position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483200;max-width:640px;margin:0 auto;padding:16px 18px;border-radius:14px;border:1px solid var(--line);background:var(--paper-2);box-shadow:0 18px 50px rgba(0,0,0,.28);display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between}
      .cookie-banner[hidden]{display:none}
      .cookie-banner p{margin:0;font-size:11px;line-height:1.5;color:var(--muted);flex:1 1 260px}
      .cookie-banner-actions{display:flex;gap:8px;flex:0 0 auto}
      @media(max-width:520px){.cookie-banner{flex-direction:column;align-items:stretch}.cookie-banner-actions{justify-content:stretch}.cookie-banner-actions button{flex:1}}
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

  function bindCookieBannerLink(){
    const link=$('#cookieBannerPrivacyLink');
    if(link&&!link.__legalBound){link.__legalBound=true;link.addEventListener('click',()=>openLegal('privacy'))}
  }

  function initCookieBanner(){
    const banner=$('#cookieBanner');if(!banner){resolveConsent();return}
    bindCookieBannerLink();
    let consent=null;
    try{consent=localStorage.getItem(CONSENT_KEY)}catch{}
    if(consent){banner.hidden=true;resolveConsent();return}
    const essential=$('#cookieBannerEssentialBtn'),accept=$('#cookieBannerAcceptBtn');
    const dismiss=value=>{try{localStorage.setItem(CONSENT_KEY,value)}catch{}banner.hidden=true;resolveConsent()};
    if(essential&&!essential.__legalBound){essential.__legalBound=true;essential.addEventListener('click',()=>dismiss('essential'))}
    if(accept&&!accept.__legalBound){accept.__legalBound=true;accept.addEventListener('click',()=>dismiss('all'))}
    banner.hidden=false;
  }

  function init(){
    ensureStyle();
    ensureMenuLinks();
    initCookieBanner();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
