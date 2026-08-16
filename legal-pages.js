(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const CONSENT_KEY='prompt-ai-cookie-consent-v1';
  // Die Zusage traegt jetzt ihren Wert: 'all' heisst ausdrueckliche Zustimmung, 'essential' nur
  // das technisch Noetige. Ohne den Wert konnte niemand unterscheiden, wofuer zugestimmt wurde.
  let resolveConsent;
  window.PromptAiCookieConsent=new Promise(resolve=>{resolveConsent=resolve});

  // Vercel Web Analytics laeuft nur nach ausdruecklicher Zustimmung. Vorher wurde das Skript in
  // index.html bedingungslos geladen - vor jeder Einwilligung und ohne Erwaehnung im
  // Datenschutztext. Bei "Nur notwendige" wird es gar nicht erst angefordert.
  function loadAnalytics(consent){
    if(consent!=='all'||document.getElementById('vercelInsights'))return;
    const script=document.createElement('script');
    script.id='vercelInsights';script.defer=true;script.src='/_vercel/insights/script.js';
    document.body.appendChild(script);
  }
  function settleConsent(value){resolveConsent(value);loadAnalytics(value)}

  const IMPRINT_HTML=`
    <h3>Angaben gemäß § 5 DDG / § 18 Abs. 2 MStV</h3>
    <p>Objekt- und Reparaturservice Battermann<br>Inhaber: Lars Battermann<br>Südstraße 25<br>31698 Lindhorst<br>Deutschland</p>
    <h3>Kontakt</h3>
    <p>Telefon: +49 155 674 677 63<br>E-Mail: <a href="mailto:service.battermann@gmx.de">service.battermann@gmx.de</a></p>
    <h3>Vertretungsberechtigt</h3>
    <p>Lars Battermann (Einzelunternehmer)</p>
    <h3>Umsatzsteuer</h3>
    <p>Gemäß § 19 UStG (Kleinunternehmerregelung) wird keine Umsatzsteuer berechnet und daher auch keine Umsatzsteuer ausgewiesen.</p>
    <h3>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h3>
    <p>Lars Battermann, Südstraße 25, 31698 Lindhorst</p>
    <h3>Streitschlichtung</h3>
    <p>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a>. Wir sind nicht verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
  `;

  const PRIVACY_HTML=`
    <h3>1. Verantwortlicher</h3>
    <p>Objekt- und Reparaturservice Battermann<br>Inhaber: Lars Battermann<br>Südstraße 25, 31698 Lindhorst, Deutschland<br>E-Mail: <a href="mailto:service.battermann@gmx.de">service.battermann@gmx.de</a></p>
    <h3>2. Übersicht der Verarbeitungen</h3>
    <p>Prompt.ai verarbeitet Daten, die du beim Anlegen eines Kontos, beim Erstellen von Projekten und Prompts sowie bei einem Abo-Abschluss angibst. Dazu zählen insbesondere E-Mail-Adresse, Konto- und Nutzungsdaten sowie die von dir eingegebenen Projektinhalte.</p>
    <h3>3. Hosting</h3>
    <p>Diese Anwendung wird über Vercel (Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA) gehostet. Beim Aufruf werden technisch notwendige Zugriffsdaten verarbeitet (IP-Adresse, Zeitpunkt, aufgerufene Adresse, Browser- und Geräteangaben). Rechtsgrundlage ist unser berechtigtes Interesse an einem sicheren und stabilen Betrieb (Art. 6 Abs. 1 lit. f DSGVO). Mit Vercel besteht ein Auftragsverarbeitungsvertrag; die Übermittlung in die USA ist auf die EU-Standardvertragsklauseln gestützt.</p>
    <h3>4. Konten, Authentifizierung &amp; Datenbank</h3>
    <p>Für Registrierung, Anmeldung und die Speicherung deiner Projekte, Referenzbilder und Unterlagen nutzen wir Supabase (Supabase Inc., 970 Toa Payoh North, Singapur) als Auftragsverarbeiter. Verarbeitet werden E-Mail-Adresse, Anmeldedaten sowie die von dir angelegten Projektinhalte. Rechtsgrundlage ist die Erfüllung des Nutzungsvertrags (Art. 6 Abs. 1 lit. b DSGVO). Es besteht ein Auftragsverarbeitungsvertrag; Drittlandübermittlungen sind auf die EU-Standardvertragsklauseln gestützt.</p>
    <h3>5. Zahlungsabwicklung</h3>
    <p>Zahlungen für Pro- und Ultimate-Tarife werden über Stripe (Stripe Payments Europe Ltd., The One Building, 1 Grand Canal Street Lower, Dublin 2, Irland) abgewickelt. Zahlungsdaten wie Kartendaten gibst du direkt bei Stripe ein; wir erhalten sie nicht, sondern nur den Zahlungsstatus und eine Kundenkennung. Rechtsgrundlage ist die Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO). Einzelheiten stehen in der <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer">Datenschutzerklärung von Stripe</a>.</p>
    <h3>6. Cookies &amp; lokale Speicherung</h3>
    <p>Für Anmeldung, Sitzung und Einstellungen (z.&nbsp;B. Dunkelmodus) nutzen wir technisch notwendige Cookies bzw. lokale Speicherung (localStorage/sessionStorage). Rechtsgrundlage ist § 25 Abs. 2 Nr. 2 TDDDG in Verbindung mit Art. 6 Abs. 1 lit. f DSGVO. Sie werden ohne Einwilligung gesetzt, weil die Anwendung ohne sie nicht funktioniert.</p>
    <h3>7. Reichweitenmessung</h3>
    <p>Wenn du im Cookie-Hinweis ausdrücklich zustimmst, laden wir Vercel Web Analytics (Vercel Inc.). Der Dienst misst Seitenaufrufe und grobe Herkunftsangaben, setzt dafür keine Cookies und legt keine geräteübergreifende Kennung an; die IP-Adresse wird nur gekürzt und nicht dauerhaft gespeichert. Rechtsgrundlage ist deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TDDDG), die du jederzeit widerrufen kannst, indem du im Browser die gespeicherte Auswahl löschst. Wählst du „Nur notwendige“, wird das Skript gar nicht erst geladen. Weitere Analyse- oder Marketingdienste — etwa Google Analytics, Meta Pixel, Hotjar oder PostHog — setzen wir nicht ein.</p>
    <h3>8. KI-Verarbeitung deiner Eingaben</h3>
    <p>Deine Projektangaben, Referenztexte, hochgeladenen Bilder/PDFs und ausgewählten Antworten werden zur Erstellung von Prompts, Vorschauen und Bildvorschauen an angebundene KI-Anbieter übermittelt. Je nach Funktion und Tarif können das sein: Vercel AI Gateway, OpenAI, Google (Gemini), Cloudflare Workers AI, Anthropic (Claude), Alibaba (Qwen) und Black Forest Labs (FLUX). Die Verbindungen stellen wir zentral bereit; welcher Anbieter eine Anfrage bearbeitet, entscheidet Prompt.ai anhand deines Tarifs. Rechtsgrundlage ist die Erfüllung des Nutzungsvertrags (Art. 6 Abs. 1 lit. b DSGVO), denn ohne diese Übermittlung lässt sich der gebuchte Dienst nicht erbringen. Mit den Anbietern bestehen Auftragsverarbeitungsverträge; Übermittlungen in Drittländer sind auf die EU-Standardvertragsklauseln gestützt. Die Anbieter speichern Anfragen nach eigenen Angaben nur kurzzeitig zur Missbrauchskontrolle und verwenden sie nicht zum Training ihrer Modelle. Gib deshalb bitte keine besonderen Kategorien personenbezogener Daten (Art. 9 DSGVO) und keine fremden Zugangsdaten in deine Projektbeschreibung ein.</p>
    <h3>9. GitHub-Verbindung</h3>
    <p>In Ultimate kannst du unter Einstellungen ein GitHub-Token hinterlegen. Es wird verschlüsselt in Supabase Vault gespeichert und ausschließlich für die von dir ausgelösten Veröffentlichungen verwendet.</p>
    <h3>10. Kundeninformationen &amp; fremde Webseiten</h3>
    <p>Wenn du unter „Kundeninformationen" die Website oder einen Google-Eintrag deines Auftraggebers hinterlegst, ruft Prompt.ai diese öffentlich erreichbare Seite ab und liest Inhalte, Links und Bilder aus, um sie in dein Projekt zu übernehmen. Dabei können auch personenbezogene Daten Dritter enthalten sein (z.&nbsp;B. Namen oder Kontaktdaten auf einer „Über uns"-Seite). Du bist dafür verantwortlich, dass du zur Angabe dieser Quelle berechtigt bist; Prompt.ai übernimmt keine Haftung für Inhalte, die auf diesem Weg verarbeitet werden. Gleiches gilt für Referenz-Links und -Bilder, die du unter „Referenzen" hinterlegst.</p>
    <p><strong>Hinweis zu Referenzen und Unterlagen:</strong> Verlinke oder lade nur Inhalte hoch, an denen du die nötigen Rechte hast. Prompt.ai übernimmt keine Haftung für Inhalte Dritter, die du hier hinterlegst — die Verantwortung dafür liegt bei dir.</p>
    <h3>11. Deine Rechte</h3>
    <p>Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch gemäß Art. 15–21 DSGVO. Eine erteilte Einwilligung kannst du jederzeit mit Wirkung für die Zukunft widerrufen. Für alle Anfragen genügt eine formlose Nachricht an <a href="mailto:service.battermann@gmx.de">service.battermann@gmx.de</a>. Außerdem steht dir ein Beschwerderecht bei einer Aufsichtsbehörde zu; für uns zuständig ist die Landesbeauftragte für den Datenschutz Niedersachsen, Prinzenstraße 5, 30159 Hannover.</p>
    <h3>12. Speicherdauer</h3>
    <p>Konto- und Projektdaten speichern wir, solange dein Konto besteht. Löschst du dein Konto, werden Konto- und Projektdaten innerhalb von 30 Tagen entfernt; hinterlegte API-Schlüssel und ein GitHub-Token werden sofort gelöscht. Rechnungs- und Zahlungsbelege bewahren wir wegen der handels- und steuerrechtlichen Pflichten aus § 257 HGB und § 147 AO zehn Jahre auf. Technische Zugriffsdaten des Hostings werden nach spätestens 30 Tagen gelöscht.</p>
  `;

  const TERMS_HTML=`
    <h3>1. Geltungsbereich</h3>
    <p>Diese Nutzungsbedingungen gelten für die Nutzung von Prompt.ai über www.prompt-ai.app, einschließlich kostenloser und kostenpflichtiger Tarife. Anbieter ist der Objekt- und Reparaturservice Battermann, Inhaber Lars Battermann, Südstraße 25, 31698 Lindhorst.</p>
    <h3>2. Vertragsschluss &amp; Konto</h3>
    <p>Mit dem Anlegen eines Kontos kommt ein Nutzungsvertrag über den kostenlosen Tarif zustande. Du bist verpflichtet, wahrheitsgemäße Angaben zu machen und deine Zugangsdaten geheim zu halten. Ein Konto ist nicht übertragbar. Die Nutzung setzt Volljährigkeit voraus; Minderjährige dürfen Prompt.ai nur mit Zustimmung der Erziehungsberechtigten nutzen. Die Bedingungen gelten für Verbraucher und Unternehmer gleichermaßen, soweit nachfolgend nichts anderes bestimmt ist.</p>
    <h3>3. Leistungsbeschreibung</h3>
    <p>Prompt.ai erstellt aus deinen Angaben strukturierte Prompts, Blueprints, Vorschauen und Projektunterlagen. Die Ergebnisse werden mit Hilfe von KI-Systemen erzeugt und können fehlerhaft, unvollständig oder unpassend sein. Sie ersetzen keine fachliche, rechtliche oder steuerliche Beratung und sind vor einer Verwendung von dir zu prüfen.</p>
    <h3>4. Deine Inhalte &amp; Rechte Dritter</h3>
    <p>Für alle Inhalte, die du eingibst, verlinkst oder hochlädst, bist du verantwortlich. Verlinke oder lade nur Inhalte hoch, an denen du die nötigen Rechte hast. Prompt.ai übernimmt keine Haftung für Inhalte Dritter, die du hier hinterlegst. Du stellst den Anbieter von Ansprüchen Dritter frei, die aus einer von dir zu vertretenden rechtswidrigen Nutzung entstehen, einschließlich angemessener Kosten der Rechtsverteidigung. Die Freistellung entfällt, soweit du die Rechtsverletzung nicht zu vertreten hast.</p>
    <h3>5. Rechte an den Ergebnissen</h3>
    <p>An den erzeugten Prompts und Projektunterlagen räumen wir dir alle übertragbaren Nutzungsrechte ein: Du darfst sie zeitlich, räumlich und inhaltlich unbeschränkt verwenden, bearbeiten, an deine Auftraggeber weitergeben und gewerblich einsetzen. Nicht gestattet ist es, Prompt.ai selbst nachzubauen oder als konkurrierenden Dienst weiterzuverkaufen. Beachte, dass an rein maschinell erzeugten Inhalten nach deutschem Recht kein Urheberrecht entsteht und wir für die Einzigartigkeit eines Ergebnisses nicht einstehen können.</p>
    <h3>6. Tarife, Kontingente &amp; Zahlung</h3>
    <p>Kostenpflichtige Tarife werden über Stripe abgerechnet und laufen monatlich. Die jeweils geltenden Preise stehen im Tarif-Fenster der Anwendung und werden dir vor dem Kauf angezeigt; da wir Kleinunternehmer nach § 19 UStG sind, wird keine Umsatzsteuer ausgewiesen. Jeder Tarif enthält ein monatliches Kontingent, das zu Beginn eines neuen Abrechnungsmonats neu startet; nicht genutzte Kontingente verfallen. Das Abo verlängert sich automatisch um jeweils einen Monat und kann jederzeit zum Ende des laufenden Abrechnungszeitraums gekündigt werden. Verbrauchern steht zusätzlich das in der Widerrufsbelehrung beschriebene Widerrufsrecht zu.</p>
    <h3>7. Zulässige Nutzung</h3>
    <p>Untersagt sind insbesondere: die Erzeugung rechtswidriger Inhalte, das Umgehen von Kontingenten oder technischen Beschränkungen, automatisierte Massenabfragen sowie Handlungen, die den Betrieb beeinträchtigen.</p>
    <h3>8. Verfügbarkeit &amp; Änderungen</h3>
    <p>Ein bestimmter Verfügbarkeitsgrad wird nicht zugesichert. Wartungsarbeiten, Weiterentwicklungen und Änderungen am Funktionsumfang sind möglich. Wesentliche Änderungen, die den vereinbarten Leistungsumfang eines kostenpflichtigen Tarifs einschränken, kündigen wir mindestens 30 Tage vorher per E-Mail an; in diesem Fall kannst du den Vertrag zum Wirksamwerden der Änderung außerordentlich kündigen.</p>
    <h3>9. Haftung</h3>
    <p>Wir haften unbeschränkt für Vorsatz und grobe Fahrlässigkeit, bei Verletzung von Leben, Körper oder Gesundheit sowie nach dem Produkthaftungsgesetz. Bei einfacher Fahrlässigkeit haften wir nur für die Verletzung wesentlicher Vertragspflichten, also solcher Pflichten, deren Erfüllung die ordnungsgemäße Durchführung des Vertrags überhaupt erst ermöglicht und auf deren Einhaltung du regelmäßig vertrauen darfst; in diesem Fall ist die Haftung auf den bei Vertragsschluss vorhersehbaren, vertragstypischen Schaden begrenzt. Eine weitergehende Haftung ist ausgeschlossen. Da die Ergebnisse von KI-Systemen erzeugt werden, übernehmen wir keine Gewähr für ihre Richtigkeit, Vollständigkeit oder Eignung für einen bestimmten Zweck; du prüfst sie vor der Verwendung selbst.</p>
    <h3>10. Kündigung</h3>
    <p>Du kannst dein Konto jederzeit im Profilbereich löschen oder formlos per E-Mail an <a href="mailto:service.battermann@gmx.de">service.battermann@gmx.de</a> kündigen. Kostenpflichtige Tarife enden zum Ende des laufenden Abrechnungszeitraums; bereits gezahlte Beträge für den laufenden Monat werden nicht anteilig erstattet. Mit der Kontolöschung werden deine Projekt- und Kontodaten nach den in der Datenschutzerklärung genannten Fristen entfernt. Sichere dir vorher alles, was du behalten möchtest — nach der Löschung können wir Inhalte nicht wiederherstellen.</p>
    <h3>11. Schlussbestimmungen</h3>
    <p>Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Bist du Verbraucher mit gewöhnlichem Aufenthalt in der EU, bleiben zwingende Verbraucherschutzvorschriften deines Aufenthaltsstaates unberührt. Ist der Nutzer Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen, ist Gerichtsstand der Sitz des Anbieters. Änderungen dieser Bedingungen teilen wir mindestens 30 Tage vor Inkrafttreten per E-Mail mit; widersprichst du nicht bis zum Wirksamwerden, gelten sie als angenommen, worauf wir in der Mitteilung gesondert hinweisen. Sollte eine Bestimmung unwirksam sein, bleibt der übrige Vertrag wirksam.</p>
  `;

  // Bei Verbrauchern laeuft ohne Belehrung keine 14-Tage-Frist, sondern eine von einem Jahr.
  // Und wer sofort loslegen will, muss dem ausdruecklich zustimmen - genau das passiert im
  // Kauf-Fenster, hier steht der Text dazu.
  const WITHDRAWAL_HTML=`
    <h3>Widerrufsrecht für Verbraucher</h3>
    <p>Du hast das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.</p>
    <p>Um dein Widerrufsrecht auszuüben, musst du uns (Objekt- und Reparaturservice Battermann, Inhaber Lars Battermann, Südstraße 25, 31698 Lindhorst, service.battermann@gmx.de) mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder eine E-Mail) über deinen Entschluss, diesen Vertrag zu widerrufen, informieren. Du kannst dafür das unten stehende Muster-Formular verwenden, das aber nicht vorgeschrieben ist.</p>
    <p>Zur Wahrung der Widerrufsfrist reicht es aus, dass du die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absendest.</p>
    <h3>Folgen des Widerrufs</h3>
    <p>Wenn du diesen Vertrag widerrufst, haben wir dir alle Zahlungen, die wir von dir erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über deinen Widerruf bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das du bei der ursprünglichen Transaktion eingesetzt hast; in keinem Fall werden dir wegen dieser Rückzahlung Entgelte berechnet.</p>
    <h3>Vorzeitiges Erlöschen des Widerrufsrechts</h3>
    <p>Prompt.ai ist ein digitaler Dienst, der sofort nach dem Kauf zur Verfügung steht. Dein Widerrufsrecht erlischt vorzeitig, wenn du vor dem Kauf ausdrücklich zustimmst, dass wir mit der Leistung sofort beginnen, und du gleichzeitig bestätigst, dass du damit dein Widerrufsrecht verlierst. Diese Zustimmung holen wir im Kauf-Fenster ein; ohne sie startet der Tarif erst nach Ablauf der Widerrufsfrist.</p>
    <h3>Muster-Widerrufsformular</h3>
    <p>An Objekt- und Reparaturservice Battermann, Inhaber Lars Battermann, Südstraße 25, 31698 Lindhorst, service.battermann@gmx.de:</p>
    <p>Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*)/die Erbringung der folgenden Dienstleistung (*)<br>
    — Bestellt am (*)/erhalten am (*)<br>
    — Name des/der Verbraucher(s)<br>
    — Anschrift des/der Verbraucher(s)<br>
    — Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)<br>
    — Datum<br>
    (*) Unzutreffendes streichen.</p>
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
    let consent=null;
    try{consent=localStorage.getItem(CONSENT_KEY)}catch{}
    const banner=$('#cookieBanner');if(!banner){settleConsent(consent||'essential');return}
    bindCookieBannerLink();
    if(consent){settleConsent(consent);return}
    const essential=$('#cookieBannerEssentialBtn'),accept=$('#cookieBannerAcceptBtn'),settingsBtn=$('#cookieBannerSettingsBtn'),settings=$('#cookieBannerSettings');
    const dismiss=value=>{try{localStorage.setItem(CONSENT_KEY,value)}catch{}if(banner.open)banner.close();settleConsent(value)};
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
