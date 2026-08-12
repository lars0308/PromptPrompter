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
  "body": "You are a senior web art director designing a real project, not a generic AI landing page. Create exactly {{count}} visual directions. They must be structurally different, not color variations of one layout."
 },
 {
  "key": "concepts-quality",
  "label": "Konzepte · Qualitätsregeln",
  "hint": "Legt fest, wie eigenständig und projektnah die Vorschläge sein müssen.",
  "placeholders": [],
  "body": "The headline and every other piece of preview copy must read like it was written for this exact business, not a template: use its real name, offering and industry vocabulary directly (a döner shop's headline should reference döner/food, a landscaping business should reference gardens/outdoor work, and so on) instead of a generic tagline that could belong to any project. Every direction must differ in information hierarchy, composition, typography and image treatment — a palette swap is not a distinct direction. Keep preview copy short enough to fit a real mobile layout. No fake statistics, reviews, logos or awards. Avoid default AI/SaaS conventions: badge + centered giant headline + two buttons, gradient orbs, glass cards, repetitive three-card grids, excessive rounded rectangles. Use reference inputs only for user-approved aspects and never copy a reference one-to-one. Use the real industry and project purpose to drive visual decisions; do not fall back to generic agency or portfolio styling. The concept must leave room for all enabled compliance/quality checks, but do not invent legal copy, company facts or claims of compliance."
 },
 {
  "key": "review-role",
  "label": "Rückfragen · Auftrag",
  "hint": "Bestimmt, wann und wie viele Rückfragen gestellt werden.",
  "placeholders": [
   "max"
  ],
  "body": "Review this website/web-app project BEFORE visual concepts are generated. Decide whether materially important information is missing, contradictory, infeasible, risky, or likely to cause a bad implementation. Ask at most {{max}} concise questions. Do not ask preference questions that can be reasonably inferred without changing the outcome."
 },
 {
  "key": "review-rules",
  "label": "Rückfragen · Regeln",
  "hint": "Regeln für Fragen, Blocker, Antwortvorschläge und rechtliche Themen.",
  "placeholders": [],
  "body": "- Ask only questions whose answer materially changes architecture, content, design, legal/privacy handling, or feasibility.\n- If requirements conflict, explain the conflict in the reason and ask for a choice when settings allow conflict questions.\n- If something is not realistically achievable, add a blocker and, when possible, a concrete alternative. Pair a serious blocker with a required question whose \"question\" and \"reason\" both name the specific blocked item in plain language (never a placeholder like \"the critical point\" or \"an issue was found\") so the user immediately understands what is blocked and why. A blocker's \"message\" must never be empty or generic.\n- For privacy/legal/imprint topics: identify missing factual inputs or implementation concerns, but never claim legal compliance and never invent legal/company data or legal text.\n- Consider the configured legal/market region, but treat laws as potentially changing; flag items that need current professional/legal verification.\n- Consider accessibility, security, performance, SEO, privacy and imprint only when enabled.\n- For every question, return 2–4 short, mutually distinct clickable suggestions. Use concrete fitting tools where useful (for example Sanity, WordPress, Webflow or no CMS), not vague filler choices.\n- suggestedAnswer may be empty when no safe default exists; suggestions must still contain useful decision options.\n- ready is true only when there is no required question or blocker preventing useful concept generation."
 },
 {
  "key": "refine-role",
  "label": "Verfeinerung · Auftrag",
  "hint": "Gilt, wenn eine gewählte Richtung nachgeschärft wird.",
  "placeholders": [],
  "body": "Refine ONE already selected website direction. Preserve its identity unless the user's refinement explicitly asks for a structural change. Return exactly one concept object."
 },
 {
  "key": "website-rules",
  "label": "Website-Erstellung · Lieferregeln",
  "hint": "Was die KI beim Bau der fertigen Website liefern muss.",
  "placeholders": [],
  "body": "- Return complete file contents, never patches, excerpts, ellipses or TODO-only files.\n- The package must start locally using the setup instructions you return.\n- Preserve the selected direction in composition, typography, spacing, palette and image treatment. Do not replace it with a generic template.\n- Implement responsive navigation, meaningful focus states, error/empty/loading states and the real primary user flow.\n- If the brief requests a shop, booking, reviews, CMS, maps, email, authentication, payments or another external service, implement the safe integration boundary and environment-variable wiring where feasible. Never fake live data or claim the service works without credentials.\n- requiredInputs must state exactly what the owner still needs to supply, where it comes from and why it is needed.\n- For factual or legal content that is missing, use an explicit, professionally worded placeholder and list it in requiredInputs.\n- Keep the package within 20 text files. Prefer a coherent minimal implementation over unnecessary dependencies.\n- The visual quality standard is identical for every subscription tier. Paid plans add workflow and delivery features, never permission to use a generic or visibly weaker design.\n- Derive the page model, navigation and components from the actual project. Do not force every project into the same landing-page sequence.\n- Build mobile as a deliberate composition with tested type wrapping, spacing and navigation. No horizontal overflow, clipped text or desktop-only interactions.\n- Use at least three project-specific design decisions that could not be transferred unchanged to an unrelated industry.\n- When several pages are requested, create the real page files/routes and shared navigation instead of compressing everything into one homepage.\n- Before returning, verify that every generated file is internally consistent, referenced assets exist, primary links work and the package follows its own setup instructions."
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
  "hint": "Bildaufbau der KI-Vorschau. Die Regel gegen Bildschirme und Geräte bleibt fest im Code.",
  "placeholders": [],
  "body": "FLAT WEB DESIGN ARTBOARD, 16:9, FULL BLEED. The webpage graphic itself fills 100% of the frame and runs off all four edges, like a design file exported at full size. Flat vector-style rendering, straight-on, no depth."
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
  "body": "Definiere Motiv, Handlung, Shot-Abfolge, Kamera, Bewegung, Licht, Look, Dauer, Seitenverhältnis, Kontinuität und Audio/Atmosphäre.\nBei vorhandenem Material klar zwischen unverändert zu erhaltenden Elementen und gewünschten Änderungen unterscheiden.\nVermeide ungewollte Morphing-, Anatomie-, Text- und Kontinuitätsfehler durch konkrete Negativvorgaben."
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
  "body": "Definiere Motiv, Umgebung, Komposition, Perspektive/Kamera, Licht, Materialität, Farbwelt, Stilgrad, Seitenverhältnis, Detailgrad und Negativvorgaben.\nBei Bildbearbeitung exakt trennen: Was bleibt 1:1 erhalten? Was darf verändert, entfernt oder ergänzt werden?\nKeine unnötige Beauty-Retusche, Identitätsänderung, Logos, Texte oder Objekte hinzufügen, wenn der Nutzer sie nicht verlangt."
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
