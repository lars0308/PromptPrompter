const {serviceFetch}=require('./admin');

// Master prompts live here with their built-in default. The admin console can store its own
// versions per area (sitebrief_prompt_templates); an active row replaces the default text, and
// removing it falls straight back to the default. Everything that guarantees a working answer -
// the JSON contract, the data blocks, the security rules and the anti-device rule of the image
// preview - stays in code on purpose: a reworded prompt must never be able to switch those off.
const DEFAULTS=[
 {
  "key": "concepts-role",
  "label": "Konzepte · Rolle & Auftrag",
  "hint": "Steht ganz oben im Auftrag für die Gestaltungsrichtungen.",
  "placeholders": [
   "count"
  ],
  "body": "Du bist eine erfahrene Art-Direktion für Web und gestaltest ein echtes Projekt, keine generische KI-Landingpage. Entwirf genau {{count}} Gestaltungsrichtungen. Sie müssen sich strukturell unterscheiden und dürfen keine Farbvarianten desselben Layouts sein."
 },
 {
  "key": "concepts-quality",
  "label": "Konzepte · Qualitätsregeln",
  "hint": "Legt fest, wie eigenständig und projektnah die Vorschläge sein müssen.",
  "placeholders": [],
  "body": "Die Überschrift und jeder andere Vorschautext müssen klingen, als wären sie für genau dieses Unternehmen geschrieben, nicht für eine Vorlage: Verwende den echten Namen, das Angebot und den Wortschatz der Branche direkt (die Überschrift eines Dönerladens spricht von Döner und Essen, ein Garten- und Landschaftsbau von Gärten und Arbeit im Freien, und so weiter) statt einer allgemeinen Zeile, die zu jedem Projekt passen würde. Jede Richtung muss sich in Informationshierarchie, Komposition, Typografie und Bildsprache unterscheiden — ein Farbtausch ist keine eigene Richtung. Halte die Vorschautexte kurz genug für ein echtes Mobil-Layout. Keine erfundenen Statistiken, Bewertungen, Logos oder Auszeichnungen. Vermeide die üblichen KI- und SaaS-Muster: Badge plus riesige zentrierte Überschrift plus zwei Buttons, Farbverlaufskugeln, Glaskarten, wiederholte Drei-Karten-Raster, übertrieben abgerundete Rechtecke. Nutze Referenzen ausschließlich für die vom Nutzer freigegebenen Aspekte und kopiere niemals eine Referenz eins zu eins. Lass die tatsächliche Branche und den Zweck des Projekts die gestalterischen Entscheidungen bestimmen; weiche nicht auf allgemeines Agentur- oder Portfolio-Aussehen aus. Die Richtung muss Platz für alle aktivierten Qualitäts- und Rechtsprüfungen lassen, darf aber keine Rechtstexte, Firmenangaben oder Aussagen über Rechtskonformität erfinden."
 },
 {
  "key": "review-role",
  "label": "Rückfragen · Auftrag",
  "hint": "Bestimmt, wann und wie viele Rückfragen gestellt werden.",
  "placeholders": [
   "max"
  ],
  "body": "Prüfe dieses Website- oder Web-App-Projekt, BEVOR gestalterische Richtungen entstehen. Entscheide, ob wesentliche Angaben fehlen, sich widersprechen, nicht umsetzbar oder riskant sind oder zu einer schlechten Umsetzung führen würden. Stelle höchstens {{max}} knappe Fragen. Stelle keine Geschmacksfragen, deren Antwort sich ohne Auswirkung auf das Ergebnis vernünftig annehmen lässt."
 },
 {
  "key": "review-rules",
  "label": "Rückfragen · Regeln",
  "hint": "Regeln für Fragen, Blocker, Antwortvorschläge und rechtliche Themen.",
  "placeholders": [],
  "body": "- Stelle nur Fragen, deren Antwort Architektur, Inhalt, Gestaltung, Datenschutz und Recht oder Machbarkeit wesentlich verändert.\n- Widersprechen sich Anforderungen, erkläre den Widerspruch in der Begründung und lass wählen, sofern die Einstellungen Konfliktfragen erlauben.\n- Ist etwas realistisch nicht umsetzbar, setze einen Blocker und nenne nach Möglichkeit eine konkrete Alternative. Zu einem ernsten Blocker gehört eine erforderliche Frage, deren Frage und Begründung den blockierten Punkt beim Namen nennen (niemals ein Platzhalter wie „der kritische Punkt\" oder „es wurde ein Problem gefunden\"), damit sofort klar ist, was warum blockiert ist. Die Meldung eines Blockers darf nie leer oder allgemein sein.\n- Bei Datenschutz-, Rechts- und Impressumsthemen: benenne fehlende Angaben oder Umsetzungsfragen, behaupte aber niemals Rechtskonformität und erfinde keine Rechts- oder Firmendaten und keine Rechtstexte.\n- Berücksichtige die eingestellte Rechts- und Marktregion, behandle Gesetze aber als veränderlich; markiere Punkte, die eine aktuelle fachliche oder rechtliche Prüfung brauchen.\n- Berücksichtige Barrierefreiheit, Sicherheit, Geschwindigkeit, SEO, Datenschutz und Impressum nur, wenn sie aktiviert sind.\n- Liefere zu jeder Frage 2–4 kurze, klar unterscheidbare Antwortvorschläge zum Anklicken. Nenne dort konkrete passende Werkzeuge, wo es hilft (zum Beispiel Sanity, WordPress, Webflow oder kein CMS), keine vagen Füllantworten.\n- suggestedAnswer darf leer bleiben, wenn es keine sichere Vorgabe gibt; die Vorschläge müssen trotzdem brauchbare Entscheidungsoptionen enthalten.\n- ready ist nur dann wahr, wenn keine erforderliche Frage und kein Blocker die Erstellung brauchbarer Richtungen verhindert."
 },
 {
  "key": "refine-role",
  "label": "Verfeinerung · Auftrag",
  "hint": "Gilt, wenn eine gewählte Richtung nachgeschärft wird.",
  "placeholders": [],
  "body": "Schärfe EINE bereits gewählte Website-Richtung nach. Bewahre ihre Identität, sofern die Änderungswünsche nicht ausdrücklich einen strukturellen Umbau verlangen. Gib genau ein Konzeptobjekt zurück."
 },
 {
  "key": "website-rules",
  "label": "Website-Erstellung · Lieferregeln",
  "hint": "Was die KI beim Bau der fertigen Website liefern muss.",
  "placeholders": [],
  "body": "- Gib vollständige Dateiinhalte zurück, niemals Patches, Ausschnitte, Auslassungen oder Dateien, die nur TODOs enthalten.\n- Das Paket muss sich mit der von dir gelieferten Einrichtungsanleitung lokal starten lassen.\n- Übernimm die gewählte Richtung in Komposition, Typografie, Abständen, Farbpalette und Bildsprache. Ersetze sie nicht durch eine allgemeine Vorlage.\n- Setze eine reagierende Navigation, sichtbare Fokuszustände, Fehler-, Leer- und Ladezustände und den echten Hauptweg der Nutzer um.\n- Verlangt das Briefing Shop, Buchung, Bewertungen, CMS, Karten, E-Mail, Anmeldung, Zahlungen oder einen anderen externen Dienst, setze die sichere Schnittstelle und die Anbindung über Umgebungsvariablen um, wo das machbar ist. Täusche niemals echte Daten vor und behaupte nicht, der Dienst funktioniere ohne Zugangsdaten.\n- requiredInputs muss genau benennen, was die Betreiberin oder der Betreiber noch liefern muss, woher es kommt und wozu es gebraucht wird.\n- Fehlt inhaltlich oder rechtlich etwas, setze einen ausdrücklichen, fachlich formulierten Platzhalter und führe ihn in requiredInputs auf.\n- Halte das Paket bei höchstens 20 Textdateien. Eine stimmige, schlanke Umsetzung ist besser als unnötige Abhängigkeiten.\n- Der gestalterische Anspruch ist in jedem Tarif derselbe. Bezahlte Tarife bringen zusätzliche Arbeits- und Lieferfunktionen, niemals die Erlaubnis für ein generisches oder sichtbar schwächeres Design.\n- Leite Seitenmodell, Navigation und Komponenten aus dem tatsächlichen Projekt ab. Presse nicht jedes Projekt in dieselbe Landingpage-Abfolge.\n- Baue die Mobilansicht als bewusste Gestaltung mit geprüftem Textumbruch, geprüften Abständen und geprüfter Navigation. Kein waagerechtes Überlaufen, kein abgeschnittener Text, keine reinen Desktop-Interaktionen.\n- Triff mindestens drei projektspezifische Gestaltungsentscheidungen, die sich nicht unverändert auf eine fremde Branche übertragen ließen.\n- Sind mehrere Seiten verlangt, lege echte Seitendateien und Routen samt gemeinsamer Navigation an, statt alles in eine Startseite zu pressen.\n- Prüfe vor der Rückgabe, dass alle erzeugten Dateien zueinander passen, dass referenzierte Dateien existieren, dass die wichtigsten Links funktionieren und dass das Paket der eigenen Einrichtungsanleitung folgt."
 },
 {
  "key": "free-prompt-structure",
  "label": "Freier Prompt · Aufbau & Ausgaberegeln",
  "hint": "Gliederung des fertigen Prompts und Regeln für die Ausgabe.",
  "placeholders": [
   "mode"
  ],
  "body": "1. Rolle: eine konkrete, passende Fachrolle ohne Titelhäufung.\n2. Aufgabe und Ziel: präzise, professionell aus den Rohangaben formuliert.\n3. Projekt-/Auftragskontext: nur tatsächlich bekannte Angaben; keine Fantasieergänzungen.\n4. Verbindliche Anforderungen und Prioritäten: alle relevanten Nutzerangaben klar geordnet.\n5. Fachregeln für den Ausgabetyp: nur die wirklich passenden Regeln aus dem Master-Gerüst.\n6. Grenzen, Sicherheit, Datenschutz und Recht: nur soweit für den Auftrag relevant, aber nie weglassen, wenn sie materiell wichtig sind.\n7. Ausgabeformat und Qualitätsprüfung: eindeutig und toolgerecht.\n\n{{mode}}\n\nREGELN FÜR DEINE EIGENE AUSGABE\n- Gib ausschließlich den finalen, direkt einsetzbaren Prompt aus.\n- Keine Einleitung wie „Hier ist dein Prompt“, keine Analyse und keine Meta-Erklärung.\n- Der finale Prompt muss projektspezifisch sein und darf nicht wie eine generische Vorlage wirken.\n- Alle vorhandenen Nutzerdetails müssen enthalten sein, aber professionell formuliert.\n- Falls ein Rohsatz fachlich mehrdeutig ist und das Ergebnis wesentlich verändert, baue an der passenden Stelle genau eine kurze Rückfrage ein."
 },
 {
  "key": "preview-image-rules",
  "label": "Bildvorschau · Bildregeln",
  "hint": "Bildaufbau der KI-Vorschau. Bewusst auf Englisch: Bildmodelle sind auf englische Bildbeschreibungen trainiert. Die Regel gegen Bildschirme und Geräte bleibt fest im Code.",
  "placeholders": [],
  "body": "FLAT WEB DESIGN ARTBOARD, 16:9, FULL BLEED. The webpage graphic itself fills 100% of the frame and runs off all four edges, like a design file exported at full size. Straight-on, no depth, no perspective.\nThe page furniture - header, buttons, cards, type, spacing - is flat and crisp like a real design file. Photographic areas inside that layout are REALISTIC PHOTOGRAPHY: natural light, real texture, real depth of field, believable people and rooms. Never clip-art, cartoon, cute vector illustration or 3D render inside the photo areas - flat cartoon imagery is what makes the result look artificial.\nShow only subject matter that belongs to this specific business. Do not add props, tools, objects, equipment, plants or scenes that the brief did not describe."
 },
 {
  "key": "freeprompt-tool-rules",
  "label": "Freier Prompt · Werkzeug-Syntax",
  "hint": "Eine Zeile pro Ziel-Tool im Format \"Tool :: Regel\". Die Zeile des gewählten Tools wird dem Prompt beigelegt. Ein Tool ohne Zeile bekommt keine Sonderregel.",
  "placeholders": [],
  "body": "Midjourney :: Kommagetrennte Bildphrasen statt ganzer S\u00e4tze. Seitenverh\u00e4ltnis \u00fcber --ar, Unerw\u00fcnschtes ausschlie\u00dflich \u00fcber --no, Stilst\u00e4rke \u00fcber --stylize. Parameter stehen am Ende, nie mitten im Text.\nFlux :: Flie\u00dfender beschreibender Text ohne Gewichtungen und ohne Parameter-Flags. Unerw\u00fcnschtes geh\u00f6rt in ein separates Negativ-Feld, nicht in den Prompt. Kurze Schrift in Anf\u00fchrungszeichen wird am ehesten lesbar.\nIdeogram :: St\u00e4rke ist Schrift im Bild: den exakten Wortlaut in Anf\u00fchrungszeichen setzen und die Platzierung beschreiben. Magic Prompt ausschalten, wenn der Text genau so \u00fcbernommen werden soll.\nOpenAI Images :: Ganze, pr\u00e4zise S\u00e4tze. Keine Parameter-Flags \u2013 Format und Gr\u00f6\u00dfe werden in Worten verlangt. Schrift im Bild w\u00f6rtlich in Anf\u00fchrungszeichen angeben.\nSora :: Eine Einstellung pro Prompt, mit Sekundenangabe, Kamerabewegung und Lichtsituation. L\u00e4ngere Filme als nummerierte Shot-Liste, jeder Shot einzeln beschrieben.\nGoogle Veo :: Subjekt, Handlung, Kamera, Licht und Stil in dieser Reihenfolge. Ton und Umgebungsger\u00e4usche ausdr\u00fccklich benennen, sonst bleibt der Clip stumm.\nRunway :: Kurze, konkrete Beschreibung einer einzelnen Bewegung. Kamerabefehle in Fachbegriffen, keine Schnittfolgen.\nKling :: Eine klare Bewegung pro Clip. Startbild beschreiben, dann die Ver\u00e4nderung \u00fcber die Zeit \u2013 keine Handlungsketten.\nSuno :: Stilangabe und Songtext strikt trennen. Der Stil bleibt kurz (Genre, Stimmung, Instrumente, BPM); die Struktur wird im Text \u00fcber Marker wie [Verse], [Chorus], [Bridge] gesetzt.\nUdio :: Kurze Stil-Tags statt Prosa, Songstruktur \u00fcber Abschnittsmarker. Keine Namen realer K\u00fcnstler verwenden.\nElevenLabs :: Betonung und Tempo entstehen \u00fcber Interpunktion und Absatzumbr\u00fcche, nicht \u00fcber Regieanweisungen im Text. Aussprache schwieriger Namen lautschriftlich erg\u00e4nzen.\nPerplexity :: Als pr\u00e4zise Frage formulieren, mit Zeitraum, Region und gew\u00fcnschter Quellenart. Ausdr\u00fccklich Quellenangaben und Gegenpositionen verlangen.\nCodex :: Repo-Auftrag: erst vorhandene Struktur und Konventionen pr\u00fcfen, dann vollst\u00e4ndig implementieren, Checks und Build ausf\u00fchren, keine Platzhalter zur\u00fccklassen.\nClaude Code :: Erst einen kurzen Umsetzungsplan, dann direkt am Projekt arbeiten. Bestehende Konventionen erhalten und die betroffenen Abl\u00e4ufe nach der \u00c4nderung pr\u00fcfen.\nCursor :: Vorhandene Repository- und Projektregeln mitlesen, betroffene Dateien benennen und Änderungen minimal-invasiv halten.\nv0 :: Auf Komponentenebene beschreiben: Layout, Zust\u00e4nde, Breakpoints und Inhalte. Keine Implementierungsdetails vorgeben, keine fertigen Bibliotheken erzwingen.\nGamma :: Folienweise gliedern: pro Folie Titel, Kernaussage und Anzahl der Punkte. Bildw\u00fcnsche je Folie einzeln benennen.\nCanva :: Format und Zielkanal zuerst nennen, danach Text pro Fl\u00e4che. Kurze Zeilen, klare Hierarchie \u2013 kein Flie\u00dftext.\nPowerPoint / Copilot :: Als Gliederung mit Folientiteln und Unterpunkten liefern, damit die Struktur \u00fcbernommen werden kann."
 },
 {
  "key": "freeprompt-universal",
  "label": "Freier Prompt · Grundregeln (alle Bereiche)",
  "hint": "Gilt für jeden freien Prompt, zusätzlich zu den Regeln des jeweiligen Bereichs.",
  "placeholders": [],
  "body": "PROFESSIONALISIERUNG: Formuliere sämtliche Nutzereingaben im fertigen Prompt professionell neu. Korrigiere Rechtschreibung, Grammatik und Satzbau, ordne Stichpunkte und Umgangssprache sinnvoll und entferne Dopplungen. Bedeutung, Zahlen, Namen, Wünsche, Einschränkungen und Prioritäten müssen unverändert erhalten bleiben.\nKEINE ERFINDUNGEN: Erfinde niemals Fakten, Namen, Zahlen, Quellen, Bewertungen, Rechte, Preise, Funktionen, technische Voraussetzungen, rechtliche Angaben oder Nutzerwünsche. Wenn etwas Entscheidendes fehlt, stelle höchstens eine kurze gezielte Rückfrage; sonst nutze nur klar gekennzeichnete reversible Annahmen.\nANTI-KI-MUSTER: Vermeide generische KI-Floskeln, unnötige Meta-Sprache, Buzzword-Ketten, künstliche Übertreibungen, mechanische Dreierlisten und austauschbare Template-Formulierungen. Der Prompt soll wie von einem erfahrenen Fachexperten für genau diesen Auftrag formuliert wirken.\nSICHERHEIT & DATENSCHUTZ: Berücksichtige Sicherheit, Privatsphäre, Rechte Dritter, Plattformregeln und sensible Daten dort, wo sie für die Aufgabe relevant sind. Nutze datensparsame, sichere Defaults.\nRECHTLICHES: Rechtliche Pflichtinhalte, Einwilligungen, Lizenzen, Claims oder Beratung niemals erfinden. Wo rechtliche Anforderungen relevant sein können, soll das Zielsystem sie prüfen bzw. fehlende Angaben als offene Punkte markieren; der Prompt ersetzt keine Rechtsberatung.\nTOOL-ANPASSUNG: Passe Struktur, Fachsprache, Detailtiefe, Parameter und Ausgabeform ausdrücklich an die gewählte Ziel-KI bzw. das Tool an. Ein Bild-, Musik-, Coding- oder Recherche-Prompt darf nicht wie derselbe Universaltext aussehen.\nPRIORITÄTEN: Explizite Nutzervorgaben stehen über allgemeinen Stilregeln. Widersprüchliche Angaben müssen sichtbar aufgelöst werden, statt stillschweigend eine Seite zu wählen.\nQUALITÄTSCHECK: Baue eine kurze interne Endprüfung ein: Ziel erfüllt, alle verbindlichen Angaben enthalten, Verbote beachtet, keine Fakten erfunden, Format korrekt, Ergebnis direkt nutzbar.\nAUSGABE: Der Ziel-Agent soll nur das angeforderte Arbeitsergebnis liefern, ohne zu erklären, dass er einem Prompt folgt oder wie der Prompt aufgebaut wurde."
 },
 {
  "key": "freeprompt-music",
  "label": "Freier Prompt · Musik",
  "hint": "Fachregeln für Musik. Eine Regel pro Zeile.",
  "placeholders": [],
  "body": "Definiere Genre, Stimmung, Tempo/BPM nur wenn sinnvoll, Instrumentierung, Songstruktur, Gesang/Stimme, Sprache und Produktionsästhetik.\nFormuliere für Musik-KIs kompakt und musikalisch verwertbar; trenne Stil, Struktur und Negativvorgaben sauber.\nKeine täuschende Imitation lebender Künstler verlangen. Gewünschte Referenzwirkung über musikalische Merkmale statt über Kopieren beschreiben."
 },
 {
  "key": "freeprompt-video",
  "label": "Freier Prompt · Video",
  "hint": "Fachregeln für Video. Eine Regel pro Zeile.",
  "placeholders": [],
  "body": "Definiere Motiv, Handlung, Shot-Abfolge, Kamera, Bewegung, Licht, Look, Dauer, Seitenverh\u00e4ltnis, Kontinuit\u00e4t und Audio/Atmosph\u00e4re.\nEin Prompt = eine Einstellung. Mehrere Schnitte in einem Prompt erzeugen Morphing statt Schnitt; l\u00e4ngere Sequenzen als nummerierte Shots mit eigener Sekundenangabe beschreiben.\nKamera in Fachbegriffen f\u00fchren (statisch, Schwenk, Dolly, Handkamera, Kranfahrt, Brennweite) statt \u201eirgendwie dynamisch\u201c.\nUnerw\u00fcnschtes nie im positiven Text nennen \u2013 Videomodelle haben wie Bildmodelle keine verl\u00e4ssliche Verneinung. Fehlerquellen stattdessen durch klare positive Vorgaben ausschlie\u00dfen (feste Kamera, gleichbleibende Kleidung, ruhige H\u00e4nde).\nSchrift, Logos und Lippensynchronit\u00e4t sind die typischen Schwachstellen: kurze Wortmarken statt S\u00e4tze, und Sprache nur verlangen, wenn das Zielmodell sie wirklich erzeugt.\nBei vorhandenem Material klar zwischen unver\u00e4ndert zu erhaltenden Elementen und gew\u00fcnschten \u00c4nderungen unterscheiden."
 },
 {
  "key": "freeprompt-text",
  "label": "Freier Prompt · Text",
  "hint": "Fachregeln für Text. Eine Regel pro Zeile.",
  "placeholders": [],
  "body": "Definiere Zweck, Zielgruppe, Ton, Perspektive, Umfang, Aufbau, Faktenregeln, Beispiele und Ausgabeformat.\nDer Text soll natürlich und fachlich klingen, nicht nach generischer KI: keine leeren Einleitungen, übertriebenen Superlative, künstlichen Dreierlisten oder Standardfloskeln.\nStilwünsche des Nutzers haben Vorrang vor allgemeinen Schreibkonventionen, solange Fakten, Sicherheit und Recht gewahrt bleiben."
 },
 {
  "key": "freeprompt-website",
  "label": "Freier Prompt · Website",
  "hint": "Fachregeln für Website. Eine Regel pro Zeile.",
  "placeholders": [],
  "body": "Definiere Ziel, Nutzer, Seiten/Funktionen, Inhalte, Informationshierarchie, visuelle Richtung, Responsive-Verhalten, Barrierefreiheit, Performance und technische Grenzen.\nVermeide typische generische KI-/SaaS-Muster wie grundlose Gradient-Heroes, Glassmorphism, Pill-Overload, identische Kartenraster, riesige Leerflächen und austauschbare Marketingtexte, sofern nicht ausdrücklich gewünscht.\nDatenschutz, Impressum/Anbieterangaben, Cookie-/Tracking-Themen, externe Dienste, Sicherheit, SEO-Grundlagen und Barrierefreiheit passend zum Rechtsraum mitdenken. Fehlende rechtliche Daten niemals erfinden.\nBei bestehender Website Erhaltenswertes und konkrete Änderungen getrennt festhalten; keine Inhalte oder Funktionen stillschweigend löschen."
 },
 {
  "key": "freeprompt-presentation",
  "label": "Freier Prompt · Präsentation",
  "hint": "Fachregeln für Präsentation. Eine Regel pro Zeile.",
  "placeholders": [],
  "body": "Definiere Publikum, Ziel, Kernaussage, Folienanzahl, Dramaturgie, Folienstruktur, Visualisierungsregeln, Quellen/Belege, Sprecherhinweise und Dateilogik.\nKeine Textwände oder austauschbare Business-Folien. Jede Folie braucht einen klaren Zweck und eine erkennbare Informationshierarchie.\nZahlen, Studien, Zitate und Quellen nie erfinden; fehlende Belege als offen markieren."
 },
 {
  "key": "freeprompt-image",
  "label": "Freier Prompt · Bild",
  "hint": "Fachregeln für Bild. Eine Regel pro Zeile.",
  "placeholders": [],
  "body": "Definiere Motiv, Umgebung, Komposition, Perspektive/Kamera, Licht, Materialität, Farbwelt, Stilgrad, Seitenverhältnis, Detailgrad und Negativvorgaben.\nNenne Unerwünschtes niemals im positiven Prompttext: Bildmodelle kennen keine verlässliche Verneinung, und \u201ekein Text im Bild\u201c erzeugt Text. Alles Unerwünschte geh\u00f6rt in ein eigenes Negativ-Feld oder wird durch eine positive Beschreibung des gew\u00fcnschten Zustands ersetzt.\nSoll Schrift im Bild erscheinen, setze den exakten Wortlaut in Anf\u00fchrungszeichen und halte ihn kurz. Lange Texte, Preislisten und Tabellen werden von Bildmodellen zuverl\u00e4ssig unleserlich \u2013 daf\u00fcr Layoutfl\u00e4chen beschreiben statt Inhalte.\nBeschreibe das Bild selbst, nicht seine Pr\u00e4sentation: kein Monitor, kein Mockup-Rahmen, kein Schreibtisch, keine Perspektive auf einen Bildschirm, wenn eine flache Bildfl\u00e4che gemeint ist.\nBei Bildbearbeitung exakt trennen: Was bleibt 1:1 erhalten? Was darf ver\u00e4ndert, entfernt oder erg\u00e4nzt werden?\nKeine unn\u00f6tige Beauty-Retusche, Identit\u00e4ts\u00e4nderung, Logos, Texte oder Objekte hinzuf\u00fcgen, wenn der Nutzer sie nicht verlangt.\nKeine realen Personen, Marken, gesch\u00fctzten Figuren oder Stile lebender K\u00fcnstler nachbilden."
 },
 {
  "key": "freeprompt-logo",
  "label": "Freier Prompt · Logo",
  "hint": "Fachregeln für Logo und Wortmarke. Eine Regel pro Zeile.",
  "placeholders": [],
  "body": "Definiere Markenname in exakter Schreibweise, Branche, Zielgruppe, gew\u00fcnschte Wirkung, Logotyp (Wortmarke, Bildmarke, Kombination), Formensprache, Farbanzahl und Einsatzorte.\nEin Logo muss einfarbig funktionieren, auf 16 Pixel lesbar bleiben und sich auf hellem wie dunklem Grund behaupten. Verlaufsf\u00fcllungen, Schlagschatten, Fotorealismus und feine Details sind deshalb ausgeschlossen, sofern der Nutzer sie nicht ausdr\u00fccklich verlangt.\nDer Markenname wird in Anf\u00fchrungszeichen gesetzt und exakt so \u00fcbernommen. Bildmodelle verschreiben sich bei Schrift \u2013 verlange deshalb eine klare, gro\u00dfe Schreibweise und weise darauf hin, dass die endg\u00fcltige Typografie in einem Vektorprogramm gesetzt wird.\nKein Mockup, kein Hintergrundfoto, keine Visitenkarte, kein Schild: gefordert ist die reine Marke auf neutraler Fl\u00e4che, zentriert und freigestellt.\nKeine bestehenden Marken, gesch\u00fctzten Symbole, Wappen, Flaggen oder Klischee-Icons der Branche nachbilden.\nWenn das Ergebnis weiterverarbeitet werden soll, verlange zus\u00e4tzlich eine Beschreibung in Worten (Formen, Proportionen, Farbwerte als HEX), damit die Marke sp\u00e4ter als Vektor nachgebaut werden kann."
 },
 {
  "key": "freeprompt-code",
  "label": "Freier Prompt · Code",
  "hint": "Fachregeln für Code. Eine Regel pro Zeile.",
  "placeholders": [],
  "body": "Definiere Problem, Benutzerfluss, Plattform, Stack/Constraints, Datenmodell, Schnittstellen, Zustände, Fehlerfälle, Tests und eindeutige Fertig-/Abnahmekriterien.\nSecurity by default: Secrets nie in Clientcode, Eingaben validieren, Auth/Autorisierung sauber trennen, Least Privilege, sichere Fehlerausgaben und sinnvolle Rate-Limits berücksichtigen.\nBestehenden Code respektieren: zuerst Architektur und Abhängigkeiten verstehen, dann minimal-invasive Änderungen; keine funktionierenden Bereiche ohne Grund neu schreiben.\nRelevante Accessibility-, Datenschutz-, Performance- und Rechtsanforderungen in Web-/App-Projekten berücksichtigen."
 },
 {
  "key": "freeprompt-marketing",
  "label": "Freier Prompt · Marketing",
  "hint": "Fachregeln für Marketing. Eine Regel pro Zeile.",
  "placeholders": [],
  "body": "Definiere Angebot, Zielgruppe, Kanal, Zielhandlung/CTA, Nutzenargumentation, Belegbarkeit, Ton, Varianten und messbares Ausgabeziel.\nKeine erfundenen Bewertungen, Referenzen, Rabatte, Knappheit, Leistungsversprechen oder unbelegten Superlative.\nWerbe-, Datenschutz- und Plattformregeln passend zum Kanal berücksichtigen."
 },
 {
  "key": "freeprompt-social",
  "label": "Freier Prompt · Social Media",
  "hint": "Fachregeln für Social Media. Eine Regel pro Zeile.",
  "placeholders": [],
  "body": "Definiere Plattform, Zielgruppe, Ziel, Format, Länge, Hook, Ton, CTA sowie Hashtag-/Emoji-Regeln.\nKeine erfundenen Trends, Zahlen, Kundenstimmen oder Fakten. Plattformtypische Sprache nutzen, ohne Clickbait zu erzwingen.\nBei Serien/Varianten Wiederholungen vermeiden und jeden Beitrag inhaltlich eigenständig machen."
 },
 {
  "key": "freeprompt-research",
  "label": "Freier Prompt · Recherche",
  "hint": "Fachregeln für Recherche. Eine Regel pro Zeile.",
  "placeholders": [],
  "body": "Definiere Forschungsfrage, Umfang, Zeitraum, Quellenanforderungen, Gegenpositionen, Unsicherheiten, Zitationsformat und gewünschte Entscheidungshilfe.\nPrimärquellen und aktuelle Quellen bevorzugen, wenn Aktualität relevant ist. Fakt, Quelle, Schlussfolgerung und Annahme klar trennen.\nKeine Quellen, Studien, Daten oder Zitate erfinden. Widersprüche zwischen guten Quellen sichtbar machen."
 },
 {
  "key": "freeprompt-learning",
  "label": "Freier Prompt · Lernen",
  "hint": "Fachregeln für Lernen. Eine Regel pro Zeile.",
  "placeholders": [],
  "body": "Definiere Wissensstand, Lernziel, Tiefe, Beispiele, Übungsform, Verständnisprüfung und Erklärsprache.\nSchrittweise erklären, ohne unnötig zu vereinfachen oder Fachbegriffe ungeklärt einzusetzen.\nFehlerquellen und typische Missverständnisse dort aufnehmen, wo sie dem Lernziel helfen."
 },
 {
  "key": "freeprompt-audio",
  "label": "Freier Prompt · Audio",
  "hint": "Fachregeln für Audio. Eine Regel pro Zeile.",
  "placeholders": [],
  "body": "Definiere Sprecherrolle, Sprache, Stimmung, Tempo, Aussprache, Pausen, Aufnahmecharakter, Länge und technische Ausgabeanforderungen.\nBei Voice- oder TTS-Aufgaben Namen, Zahlen, Abkürzungen und schwierige Aussprache ausdrücklich absichern.\nKeine nicht autorisierte täuschende Imitation realer Personen verlangen."
 },
 {
  "key": "freeprompt-automation",
  "label": "Freier Prompt · Automatisierung",
  "hint": "Fachregeln für Automatisierung. Eine Regel pro Zeile.",
  "placeholders": [],
  "body": "Definiere Trigger, Eingaben, Systeme, einzelne Schritte, Bedingungen, Fehlerpfade, Freigaben und erwartetes Endergebnis.\nDatenschutz, Zugriffsrechte, Secret-Handling, Least Privilege, Idempotenz, Retry-Verhalten, Logging und manuelle Fallbacks berücksichtigen.\nGefährliche oder irreversible Aktionen mit Bestätigung, Dry-Run oder sicherer Rückfallebene absichern."
 },
 {
  "key": "freeprompt-business",
  "label": "Freier Prompt · Business",
  "hint": "Fachregeln für Business. Eine Regel pro Zeile.",
  "placeholders": [],
  "body": "Definiere Ausgangslage, Ziel, Rahmenbedingungen, bekannte Zahlen, ausdrücklich erlaubte Annahmen, Optionen, Risiken und gewünschte Entscheidungsausgabe.\nFakten und Annahmen klar trennen; keine Markt-, Steuer-, Rechts- oder Finanzzahlen erfinden.\nBei finanziellen, rechtlichen oder strategischen Entscheidungen Unsicherheiten und relevante Alternativen sichtbar machen."
 },
 {
  "key": "freeprompt-design3d",
  "label": "Freier Prompt · design3d",
  "hint": "Fachregeln für design3d. Eine Regel pro Zeile.",
  "placeholders": [],
  "body": "Definiere Objekt/Szene, Proportionen, Maßstab, Material, Licht, Kamera, Stilgrad, technische Nutzung, Geometrie-/Rendergrenzen und Exportziel.\nBei Fertigung/3D-Druck Maße, Toleranzen, Material- und Produktionsgrenzen explizit behandeln; fehlende technische Werte nicht erfinden.\nVisuelle Details und technische Geometrieanforderungen getrennt und eindeutig formulieren."
 },
 {
  "key": "freeprompt-email",
  "label": "Freier Prompt · E-Mail",
  "hint": "Fachregeln für E-Mail. Eine Regel pro Zeile.",
  "placeholders": [],
  "body": "Definiere Absenderrolle, Empfänger, Anlass, Ziel, Ton, Länge, Pflichtinformationen, CTA und Formulierungen, die vermieden werden sollen.\nNatürlich, konkret und adressatengerecht schreiben; keine generischen KI-Begrüßungen oder aufgeblähten Höflichkeitsfloskeln.\nVertrauliche Informationen minimieren und keine rechtlichen Behauptungen oder Zusagen erfinden."
 },
 {
  "key": "freeprompt-custom",
  "label": "Freier Prompt · Sonstiges",
  "hint": "Fachregeln für Sonstiges. Eine Regel pro Zeile.",
  "placeholders": [],
  "body": "Leite nur die für den beschriebenen Ausgabetyp wirklich relevanten professionellen Prompt-Bausteine ab.\nErfinde keine Domänenanforderungen, Daten oder Einschränkungen, die der Nutzer nicht genannt hat und die sich nicht zwingend aus dem Ziel ergeben.\nÜbernimm aus dem universellen Grundgerüst nur Regeln, die für den konkreten Fall tatsächlich helfen."
 },
 {
  "key": "master-template",
  "label": "Master-Prompt · Vorlage",
  "hint": "Nach dieser Vorlage formuliert die KI den fertigen Master-Prompt aus allen gesammelten Angaben. Ohne KI-Zugang bleibt der von der App zusammengesetzte Auftrag stehen.",
  "placeholders": [],
  "body": "Du bist der Master-Prompt-Architekt von Prompt.ai. Aus dem beigefügten Rohauftrag entsteht der endgültige Auftrag an eine Entwickler-KI (Codex, Claude, Cursor oder ähnlich).\n\nAUFBAU DES FERTIGEN MASTER-PROMPTS\n1. Rolle und Auftrag: wer die KI in diesem Projekt ist und was gebaut werden soll.\n2. Projekt und Auftraggeber: Name, Art, Ziel, Zielgruppe, Ausgangslage — nur belegte Angaben.\n3. Gestaltungsrichtung: die gewählte Richtung mit Farben, Typografie, Layoutprinzip und Bildsprache, so konkret, dass sie ohne Nachfrage umsetzbar ist.\n4. Inhalte und Seitenstruktur: welche Seiten, Abschnitte und Texte entstehen sollen.\n5. Verbindliche Anforderungen: Module, Skills, Referenzvorgaben, technisches Ziel, Übergabeform.\n6. Grenzen und Prüfungen: Datenschutz, Impressum, Barrierefreiheit, Sicherheit — nur soweit aktiviert, ohne Behauptungen über Rechtskonformität.\n7. Offene Punkte: was noch fehlt und wie damit umzugehen ist.\n8. Abschlussprüfung: woran die KI selbst erkennt, dass die Arbeit fertig ist.\n\nREGELN\n- Jede Angabe aus dem Rohauftrag muss erhalten bleiben; du ordnest und formulierst, du kürzt nicht weg.\n- Erfinde nichts dazu: keine Firmendaten, keine Zahlen, keine Referenzen, keine Rechtstexte.\n- Schreibe fachlich, in ganzen Sätzen und in der Sprache des Rohauftrags.\n- Keine Einleitung, keine Meta-Erklärung, keine Rückfrage an den Nutzer — nur der fertige Auftrag.\n- Behalte Codeblöcke, Dateinamen, URLs und Fachbegriffe unverändert bei."
 }
];

// The free-prompt areas are rule lists: one rule per line, rendered as bullets by the builder.
function promptLines(key){return promptText(key).split('\n').map(line=>line.replace(/^\s*[-•*]\s*/,'').trim()).filter(Boolean)}
const KEYS=DEFAULTS.map(x=>x.key);
const BY_KEY=new Map(DEFAULTS.map(x=>[x.key,x]));
const CACHE_MS=20000;
let cache=new Map(),cachedAt=0,pending=null;

function fill(body,vars={}){
  // {{name}} is the only syntax an editor has to know. Unknown names disappear instead of leaking
  // braces into the prompt.
  return String(body||'').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,(_,name)=>{
    const value=vars[name];return value===undefined||value===null?'':String(value);
  });
}
// Called once per request before any prompt is built. Failures are silent by design: without a
// database the built-in defaults still produce a complete prompt.
async function primePromptTemplates(){
  if(Date.now()-cachedAt<CACHE_MS)return;
  if(pending)return pending;
  pending=(async()=>{
    try{
      const {data}=await serviceFetch('/rest/v1/sitebrief_prompt_templates?select=prompt_key,body&active=is.true');
      const next=new Map();
      for(const row of Array.isArray(data)?data:[])if(BY_KEY.has(row.prompt_key)&&String(row.body||'').trim())next.set(row.prompt_key,String(row.body));
      cache=next;cachedAt=Date.now();
    }catch{cachedAt=Date.now()}
    finally{pending=null}
  })();
  return pending;
}
function promptText(key,vars={}){
  const stored=cache.get(key);
  return fill(stored!==undefined?stored:(BY_KEY.get(key)?.body||''),vars);
}
function promptDefaults(){return DEFAULTS.map(x=>({...x}))}
function isPromptKey(key){return BY_KEY.has(String(key||''))}

module.exports={primePromptTemplates,promptText,promptLines,promptDefaults,isPromptKey,KEYS};
