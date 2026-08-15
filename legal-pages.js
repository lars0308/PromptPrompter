(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const CONSENT_KEY='prompt-ai-cookie-consent-v1';
  let resolveConsent;
  window.PromptAiCookieConsent=new Promise(resolve=>{resolveConsent=resolve});

  const IMPRINT_HTML=`
    <h3>Angaben gemäß § 5 DDG / § 18 Abs. 2 MStV</h3>
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
    <p>Deine Projektangaben, Referenztexte, hochgeladenen Bilder/PDFs und ausgewählten Antworten werden zur Erstellung von Prompts, Vorschauen und Bildvorschauen an angebundene KI-Anbieter übermittelt. Je nach Funktion und Tarif können das sein: Vercel AI Gateway, OpenAI, Google (Gemini), Cloudflare Workers AI, Anthropic (Claude), Alibaba (Qwen) und Black Forest Labs (FLUX). Die Verbindungen stellen wir zentral bereit; welcher Anbieter eine Anfrage bearbeitet, entscheidet Prompt.ai anhand deines Tarifs. [Rechtsgrundlage, Auftragsverarbeitungsverträge und Speicherdauer bei den jeweiligen Anbietern ergänzen.]</p>
    <h3>8. GitHub-Verbindung</h3>
    <p>In Ultimate kannst du unter Einstellungen ein GitHub-Token hinterlegen. Es wird verschlüsselt in Supabase Vault gespeichert und ausschließlich für die von dir ausgelösten Veröffentlichungen verwendet.</p>
    <h3>9. Kundeninformationen &amp; fremde Webseiten</h3>
    <p>Wenn du unter „Kundeninformationen" die Website oder einen Google-Eintrag deines Auftraggebers hinterlegst, ruft Prompt.ai diese öffentlich erreichbare Seite ab und liest Inhalte, Links und Bilder aus, um sie in dein Projekt zu übernehmen. Dabei können auch personenbezogene Daten Dritter enthalten sein (z.&nbsp;B. Namen oder Kontaktdaten auf einer „Über uns"-Seite). Du bist dafür verantwortlich, dass du zur Angabe dieser Quelle berechtigt bist; Prompt.ai übernimmt keine Haftung für Inhalte, die auf diesem Weg verarbeitet werden. Gleiches gilt für Referenz-Links und -Bilder, die du unter „Referenzen" hinterlegst.</p>
    <p><strong>Hinweis zu Referenzen und Unterlagen:</strong> Verlinke oder lade nur Inhalte hoch, an denen du die nötigen Rechte hast. Prompt.ai übernimmt keine Haftung für Inhalte Dritter, die du hier hinterlegst — die Verantwortung dafür liegt bei dir.</p>
    <h3>10. Deine Rechte</h3>
    <p>Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch gemäß Art. 15–21 DSGVO sowie ein Beschwerderecht bei einer Aufsichtsbehörde. [Kontaktweg für Anfragen ergänzen.]</p>
    <h3>11. Speicherdauer</h3>
    <p>[Konkrete Speicher- und Löschfristen für Konto- und Projektdaten ergänzen.]</p>
  `;

  const TERMS_HTML=`
    <h3>1. Geltungsbereich</h3>
    <p>Diese Nutzungsbedingungen gelten für die Nutzung von Prompt.ai über [Domain eintragen], einschließlich kostenloser und kostenpflichtiger Tarife. Anbieter ist [Firmenname / Name, Anschrift wie im Impressum].</p>
    <h3>2. Vertragsschluss &amp; Konto</h3>
    <p>Mit dem Anlegen eines Kontos kommt ein Nutzungsvertrag über den kostenlosen Tarif zustande. Du bist verpflichtet, wahrheitsgemäße Angaben zu machen und deine Zugangsdaten geheim zu halten. Ein Konto ist nicht übertragbar. [Mindestalter und ggf. Regelung für Unternehmer/Verbraucher ergänzen.]</p>
    <h3>3. Leistungsbeschreibung</h3>
    <p>Prompt.ai erstellt aus deinen Angaben strukturierte Prompts, Blueprints, Vorschauen und Projektunterlagen. Die Ergebnisse werden mit Hilfe von KI-Systemen erzeugt und können fehlerhaft, unvollständig oder unpassend sein. Sie ersetzen keine fachliche, rechtliche oder steuerliche Beratung und sind vor einer Verwendung von dir zu prüfen.</p>
    <h3>4. Deine Inhalte &amp; Rechte Dritter</h3>
    <p>Für alle Inhalte, die du eingibst, verlinkst oder hochlädst, bist du verantwortlich. Verlinke oder lade nur Inhalte hoch, an denen du die nötigen Rechte hast. Prompt.ai übernimmt keine Haftung für Inhalte Dritter, die du hier hinterlegst. Du stellst den Anbieter von Ansprüchen Dritter frei, die aus einer rechtswidrigen Nutzung durch dich entstehen. [Umfang der Freistellung juristisch prüfen.]</p>
    <h3>5. Rechte an den Ergebnissen</h3>
    <p>Die von dir erzeugten Prompts und Projektunterlagen darfst du frei verwenden. [Regelung zu Nutzungsrechten, Weitergabe und Wiederverkauf ergänzen.]</p>
    <h3>6. Tarife, Kontingente &amp; Zahlung</h3>
    <p>Kostenpflichtige Tarife werden über Stripe abgerechnet und laufen monatlich, sofern nicht anders angegeben. Jeder Tarif enthält ein monatliches Kontingent, das zum Beginn eines neuen Abrechnungsmonats neu startet. [Preise, Laufzeit, Verlängerung, Kündigungsfrist und Widerrufsrecht für Verbraucher ergänzen.]</p>
    <h3>7. Zulässige Nutzung</h3>
    <p>Untersagt sind insbesondere: die Erzeugung rechtswidriger Inhalte, das Umgehen von Kontingenten oder technischen Beschränkungen, automatisierte Massenabfragen sowie Handlungen, die den Betrieb beeinträchtigen.</p>
    <h3>8. Verfügbarkeit &amp; Änderungen</h3>
    <p>Ein bestimmter Verfügbarkeitsgrad wird nicht zugesichert. Wartungsarbeiten, Weiterentwicklungen und Änderungen am Funktionsumfang sind möglich. [Ankündigungsfristen für wesentliche Änderungen ergänzen.]</p>
    <h3>9. Haftung</h3>
    <p>[Haftungsregelung anwaltlich formulieren lassen — insbesondere Haftung für Vorsatz und grobe Fahrlässigkeit, Kardinalpflichten, Personenschäden und Produkthaftung.]</p>
    <h3>10. Kündigung</h3>
    <p>Du kannst dein Konto jederzeit löschen; kostenpflichtige Tarife enden zum Ende des laufenden Abrechnungszeitraums. [Kündigungswege und Folgen für gespeicherte Daten ergänzen.]</p>
    <h3>11. Schlussbestimmungen</h3>
    <p>[Anwendbares Recht, Gerichtsstand und Regelung zu Änderungen dieser Bedingungen ergänzen.]</p>
  `;

  // Bei Verbrauchern laeuft ohne Belehrung keine 14-Tage-Frist, sondern eine von einem Jahr.
  // Und wer sofort loslegen will, muss dem ausdruecklich zustimmen - genau das passiert im
  // Kauf-Fenster, hier steht der Text dazu.
  const WITHDRAWAL_HTML=`
    <h3>Widerrufsrecht für Verbraucher</h3>
    <p>Du hast das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.</p>
    <p>Um dein Widerrufsrecht auszuüben, musst du uns ([Firmenname / Inhaber], [Anschrift], [E-Mail]) mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder eine E-Mail) über deinen Entschluss, diesen Vertrag zu widerrufen, informieren. Du kannst dafür das unten stehende Muster-Formular verwenden, das aber nicht vorgeschrieben ist.</p>
    <p>Zur Wahrung der Widerrufsfrist reicht es aus, dass du die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absendest.</p>
    <h3>Folgen des Widerrufs</h3>
    <p>Wenn du diesen Vertrag widerrufst, haben wir dir alle Zahlungen, die wir von dir erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über deinen Widerruf bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das du bei der ursprünglichen Transaktion eingesetzt hast; in keinem Fall werden dir wegen dieser Rückzahlung Entgelte berechnet.</p>
    <h3>Vorzeitiges Erlöschen des Widerrufsrechts</h3>
    <p>Prompt.ai ist ein digitaler Dienst, der sofort nach dem Kauf zur Verfügung steht. Dein Widerrufsrecht erlischt vorzeitig, wenn du vor dem Kauf ausdrücklich zustimmst, dass wir mit der Leistung sofort beginnen, und du gleichzeitig bestätigst, dass du damit dein Widerrufsrecht verlierst. Diese Zustimmung holen wir im Kauf-Fenster ein; ohne sie startet der Tarif erst nach Ablauf der Widerrufsfrist.</p>
    <h3>Muster-Widerrufsformular</h3>
    <p>An [Firmenname / Inhaber], [Anschrift], [E-Mail]:</p>
    <p>Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*)/die Erbringung der folgenden Dienstleistung (*)<br>
    — Bestellt am (*)/erhalten am (*)<br>
    — Name des/der Verbraucher(s)<br>
    — Anschrift des/der Verbraucher(s)<br>
    — Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)<br>
    — Datum<br>
    (*) Unzutreffendes streichen.</p>
    <p>[Vor dem Live-Betrieb anwaltlich prüfen lassen und alle eckig geklammerten Angaben ersetzen.]</p>
  `;


  function openLegal(kind){
    const dialog=$('#legalDialog');if(!dialog)return;
    const title=$('#legalTitle'),content=$('#legalContent');
    if(kind==='privacy'){title.textContent='Datenschutzerklärung';content.innerHTML=PRIVACY_HTML}
    else if(kind==='terms'){title.textContent='Nutzungsbedingungen';content.innerHTML=TERMS_HTML}
    else if(kind==='withdrawal'){title.textContent='Widerrufsbelehrung';content.innerHTML=WITHDRAWAL_HTML}
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
    const terms=document.createElement('button');
    terms.type='button';terms.className='text-btn';terms.id='menuTermsBtn';terms.textContent='Nutzungsbedingungen';
    terms.addEventListener('click',()=>openLegal('terms'));
    const withdrawal=document.createElement('button');
    withdrawal.type='button';withdrawal.className='text-btn';withdrawal.id='menuWithdrawalBtn';withdrawal.textContent='Widerruf';
    withdrawal.addEventListener('click',()=>openLegal('withdrawal'));
    row.appendChild(imprint);row.appendChild(privacy);row.appendChild(terms);row.appendChild(withdrawal);
    menu.appendChild(row);
  }

  // Consent line under the registration action. The buttons open the same dialog as the footer
  // links, so the texts a new account agrees to are readable before the account exists.
  function ensureAuthConsent(){
    const actions=$('#accountLoggedOut .auth-primary-actions');if(!actions||$('#authConsentNote'))return;
    const note=document.createElement('p');
    note.id='authConsentNote';note.className='auth-consent-note';
    note.innerHTML='Mit „Neues Konto“ stimmst du den <button type="button" class="link-btn" id="authTermsLink">Nutzungsbedingungen</button> zu und bestätigst, die <button type="button" class="link-btn" id="authPrivacyConsentLink">Datenschutzerklärung</button> gelesen zu haben.';
    actions.insertAdjacentElement('afterend',note);
    $('#authTermsLink',note).addEventListener('click',()=>openLegal('terms'));
    $('#authPrivacyConsentLink',note).addEventListener('click',()=>openLegal('privacy'));
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
    
    ensureMenuLinks();
    ensureAuthConsent();
    ensureGateFooter();
    initCookieBanner();
  }

  window.PromptAiLegalPages={openLegal};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
