const {getEntitlements}=require('./entitlements');
const {getTokenBudget}=require('./quota');
const {resolveProviderKey}=require('./provider-key');
const {listProfiles}=require('./system-ai-profiles');
const {rateLimit}=require('./rate-limit');
const {logUsage,tokenSink,addTokens}=require('./usage');
const {primePromptTemplates,promptText,promptLines}=require('./prompt-templates');

const MAX_BODY=120000;
const PROVIDER_TIMEOUT_MS=35000;
async function fetchWithTimeout(url,options={},timeoutMs=PROVIDER_TIMEOUT_MS){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{return await fetch(url,{...options,signal:controller.signal})}
  catch(error){if(error?.name==='AbortError')throw Object.assign(new Error('Die KI-Anfrage hat zu lange gedauert und wurde abgebrochen.'),{status:504});throw error}
  finally{clearTimeout(timer)}
}
const CATEGORIES={
  music:'Musik / Song',
  video:'Video / Film',
  text:'Text / Schreiben',
  website:'Website / Webdesign',
  presentation:'Präsentation / PowerPoint',
  image:'Bild / Grafik',
  logo:'Logo / Marke',
  code:'Code / App',
  marketing:'Marketing / Werbung',
  social:'Social Media',
  research:'Recherche / Analyse',
  learning:'Lernen / Erklären',
  audio:'Stimme / Audio',
  automation:'Automation / Workflow',
  business:'Business / Strategie',
  design3d:'3D / Design',
  email:'E-Mail / Kommunikation',
  custom:'Eigener Typ'
};

const CATEGORY_ROLES={
  music:'erfahrener Musikproduzent, Songwriter und Sound-Designer',
  video:'erfahrener Regisseur, Kamerakonzeptioner und Video-Creative-Director',
  text:'erfahrener Redakteur und professioneller Texter',
  logo:'erfahrener Markendesigner und Corporate-Identity-Gestalter',
  website:'Senior-Webdesigner, UX-Designer und Frontend-Konzeptioner',
  presentation:'erfahrener Präsentationsdesigner und Storytelling-Stratege',
  image:'erfahrener Art Director, Fotograf und Visual Designer',
  code:'Senior-Softwareentwickler und Software-Architekt',
  marketing:'erfahrener Marketingstratege und Conversion-Texter',
  social:'erfahrener Social-Media-Stratege und Content-Redakteur',
  research:'erfahrener Rechercheur und analytischer Research-Spezialist',
  learning:'erfahrener Didaktiker und fachlich präziser Lernbegleiter',
  audio:'erfahrener Audio-Produzent und Voice-Director',
  automation:'erfahrener Automation-Engineer und Workflow-Architekt',
  business:'erfahrener Business-Stratege und analytischer Berater',
  design3d:'erfahrener 3D-Designer, Technical Artist und Visualisierer',
  email:'erfahrener Kommunikationsredakteur für professionelle E-Mails',
  custom:'passender erfahrener Fachexperte für genau den beschriebenen Anwendungsfall'
};

const CATEGORY_MASTER_RULES={
  music:[
    'Definiere Genre, Stimmung, Tempo/BPM nur wenn sinnvoll, Instrumentierung, Songstruktur, Gesang/Stimme, Sprache und Produktionsästhetik.',
    'Formuliere für Musik-KIs kompakt und musikalisch verwertbar; trenne Stil, Struktur und Negativvorgaben sauber.',
    'Keine täuschende Imitation lebender Künstler verlangen. Gewünschte Referenzwirkung über musikalische Merkmale statt über Kopieren beschreiben.'
  ],
  video:[
    'Definiere Motiv, Handlung, Shot-Abfolge, Kamera, Bewegung, Licht, Look, Dauer, Seitenverhältnis, Kontinuität und Audio/Atmosphäre.',
    'Bei vorhandenem Material klar zwischen unverändert zu erhaltenden Elementen und gewünschten Änderungen unterscheiden.',
    'Vermeide ungewollte Morphing-, Anatomie-, Text- und Kontinuitätsfehler durch konkrete Negativvorgaben.'
  ],
  text:[
    'Definiere Zweck, Zielgruppe, Ton, Perspektive, Umfang, Aufbau, Faktenregeln, Beispiele und Ausgabeformat.',
    'Der Text soll natürlich und fachlich klingen, nicht nach generischer KI: keine leeren Einleitungen, übertriebenen Superlative, künstlichen Dreierlisten oder Standardfloskeln.',
    'Stilwünsche des Nutzers haben Vorrang vor allgemeinen Schreibkonventionen, solange Fakten, Sicherheit und Recht gewahrt bleiben.'
  ],
  website:[
    'Definiere Ziel, Nutzer, Seiten/Funktionen, Inhalte, Informationshierarchie, visuelle Richtung, Responsive-Verhalten, Barrierefreiheit, Performance und technische Grenzen.',
    'Vermeide typische generische KI-/SaaS-Muster wie grundlose Gradient-Heroes, Glassmorphism, Pill-Overload, identische Kartenraster, riesige Leerflächen und austauschbare Marketingtexte, sofern nicht ausdrücklich gewünscht.',
    'Datenschutz, Impressum/Anbieterangaben, Cookie-/Tracking-Themen, externe Dienste, Sicherheit, SEO-Grundlagen und Barrierefreiheit passend zum Rechtsraum mitdenken. Fehlende rechtliche Daten niemals erfinden.',
    'Bei bestehender Website Erhaltenswertes und konkrete Änderungen getrennt festhalten; keine Inhalte oder Funktionen stillschweigend löschen.'
  ],
  presentation:[
    'Definiere Publikum, Ziel, Kernaussage, Folienanzahl, Dramaturgie, Folienstruktur, Visualisierungsregeln, Quellen/Belege, Sprecherhinweise und Dateilogik.',
    'Keine Textwände oder austauschbare Business-Folien. Jede Folie braucht einen klaren Zweck und eine erkennbare Informationshierarchie.',
    'Zahlen, Studien, Zitate und Quellen nie erfinden; fehlende Belege als offen markieren.'
  ],
  image:[
    'Definiere Motiv, Umgebung, Komposition, Perspektive/Kamera, Licht, Materialität, Farbwelt, Stilgrad, Seitenverhältnis, Detailgrad und Negativvorgaben.',
    'Bei Bildbearbeitung exakt trennen: Was bleibt 1:1 erhalten? Was darf verändert, entfernt oder ergänzt werden?',
    'Keine unnötige Beauty-Retusche, Identitätsänderung, Logos, Texte oder Objekte hinzufügen, wenn der Nutzer sie nicht verlangt.'
  ],
  code:[
    'Definiere Problem, Benutzerfluss, Plattform, Stack/Constraints, Datenmodell, Schnittstellen, Zustände, Fehlerfälle, Tests und eindeutige Fertig-/Abnahmekriterien.',
    'Security by default: Secrets nie in Clientcode, Eingaben validieren, Auth/Autorisierung sauber trennen, Least Privilege, sichere Fehlerausgaben und sinnvolle Rate-Limits berücksichtigen.',
    'Bestehenden Code respektieren: zuerst Architektur und Abhängigkeiten verstehen, dann minimal-invasive Änderungen; keine funktionierenden Bereiche ohne Grund neu schreiben.',
    'Relevante Accessibility-, Datenschutz-, Performance- und Rechtsanforderungen in Web-/App-Projekten berücksichtigen.'
  ],
  marketing:[
    'Definiere Angebot, Zielgruppe, Kanal, Zielhandlung/CTA, Nutzenargumentation, Belegbarkeit, Ton, Varianten und messbares Ausgabeziel.',
    'Keine erfundenen Bewertungen, Referenzen, Rabatte, Knappheit, Leistungsversprechen oder unbelegten Superlative.',
    'Werbe-, Datenschutz- und Plattformregeln passend zum Kanal berücksichtigen.'
  ],
  social:[
    'Definiere Plattform, Zielgruppe, Ziel, Format, Länge, Hook, Ton, CTA sowie Hashtag-/Emoji-Regeln.',
    'Keine erfundenen Trends, Zahlen, Kundenstimmen oder Fakten. Plattformtypische Sprache nutzen, ohne Clickbait zu erzwingen.',
    'Bei Serien/Varianten Wiederholungen vermeiden und jeden Beitrag inhaltlich eigenständig machen.'
  ],
  research:[
    'Definiere Forschungsfrage, Umfang, Zeitraum, Quellenanforderungen, Gegenpositionen, Unsicherheiten, Zitationsformat und gewünschte Entscheidungshilfe.',
    'Primärquellen und aktuelle Quellen bevorzugen, wenn Aktualität relevant ist. Fakt, Quelle, Schlussfolgerung und Annahme klar trennen.',
    'Keine Quellen, Studien, Daten oder Zitate erfinden. Widersprüche zwischen guten Quellen sichtbar machen.'
  ],
  learning:[
    'Definiere Wissensstand, Lernziel, Tiefe, Beispiele, Übungsform, Verständnisprüfung und Erklärsprache.',
    'Schrittweise erklären, ohne unnötig zu vereinfachen oder Fachbegriffe ungeklärt einzusetzen.',
    'Fehlerquellen und typische Missverständnisse dort aufnehmen, wo sie dem Lernziel helfen.'
  ],
  audio:[
    'Definiere Sprecherrolle, Sprache, Stimmung, Tempo, Aussprache, Pausen, Aufnahmecharakter, Länge und technische Ausgabeanforderungen.',
    'Bei Voice- oder TTS-Aufgaben Namen, Zahlen, Abkürzungen und schwierige Aussprache ausdrücklich absichern.',
    'Keine nicht autorisierte täuschende Imitation realer Personen verlangen.'
  ],
  automation:[
    'Definiere Trigger, Eingaben, Systeme, einzelne Schritte, Bedingungen, Fehlerpfade, Freigaben und erwartetes Endergebnis.',
    'Datenschutz, Zugriffsrechte, Secret-Handling, Least Privilege, Idempotenz, Retry-Verhalten, Logging und manuelle Fallbacks berücksichtigen.',
    'Gefährliche oder irreversible Aktionen mit Bestätigung, Dry-Run oder sicherer Rückfallebene absichern.'
  ],
  business:[
    'Definiere Ausgangslage, Ziel, Rahmenbedingungen, bekannte Zahlen, ausdrücklich erlaubte Annahmen, Optionen, Risiken und gewünschte Entscheidungsausgabe.',
    'Fakten und Annahmen klar trennen; keine Markt-, Steuer-, Rechts- oder Finanzzahlen erfinden.',
    'Bei finanziellen, rechtlichen oder strategischen Entscheidungen Unsicherheiten und relevante Alternativen sichtbar machen.'
  ],
  design3d:[
    'Definiere Objekt/Szene, Proportionen, Maßstab, Material, Licht, Kamera, Stilgrad, technische Nutzung, Geometrie-/Rendergrenzen und Exportziel.',
    'Bei Fertigung/3D-Druck Maße, Toleranzen, Material- und Produktionsgrenzen explizit behandeln; fehlende technische Werte nicht erfinden.',
    'Visuelle Details und technische Geometrieanforderungen getrennt und eindeutig formulieren.'
  ],
  email:[
    'Definiere Absenderrolle, Empfänger, Anlass, Ziel, Ton, Länge, Pflichtinformationen, CTA und Formulierungen, die vermieden werden sollen.',
    'Natürlich, konkret und adressatengerecht schreiben; keine generischen KI-Begrüßungen oder aufgeblähten Höflichkeitsfloskeln.',
    'Vertrauliche Informationen minimieren und keine rechtlichen Behauptungen oder Zusagen erfinden.'
  ],
  custom:[
    'Leite nur die für den beschriebenen Ausgabetyp wirklich relevanten professionellen Prompt-Bausteine ab.',
    'Erfinde keine Domänenanforderungen, Daten oder Einschränkungen, die der Nutzer nicht genannt hat und die sich nicht zwingend aus dem Ziel ergeben.',
    'Übernimm aus dem universellen Grundgerüst nur Regeln, die für den konkreten Fall tatsächlich helfen.'
  ]
};

const UNIVERSAL_MASTER_RULES=[
  'PROFESSIONALISIERUNG: Formuliere sämtliche Nutzereingaben im fertigen Prompt professionell neu. Korrigiere Rechtschreibung, Grammatik und Satzbau, ordne Stichpunkte und Umgangssprache sinnvoll und entferne Dopplungen. Bedeutung, Zahlen, Namen, Wünsche, Einschränkungen und Prioritäten müssen unverändert erhalten bleiben.',
  'KEINE ERFINDUNGEN: Erfinde niemals Fakten, Namen, Zahlen, Quellen, Bewertungen, Rechte, Preise, Funktionen, technische Voraussetzungen, rechtliche Angaben oder Nutzerwünsche. Wenn etwas Entscheidendes fehlt, stelle höchstens eine kurze gezielte Rückfrage; sonst nutze nur klar gekennzeichnete reversible Annahmen.',
  'ANTI-KI-MUSTER: Vermeide generische KI-Floskeln, unnötige Meta-Sprache, Buzzword-Ketten, künstliche Übertreibungen, mechanische Dreierlisten und austauschbare Template-Formulierungen. Der Prompt soll wie von einem erfahrenen Fachexperten für genau diesen Auftrag formuliert wirken.',
  'SICHERHEIT & DATENSCHUTZ: Berücksichtige Sicherheit, Privatsphäre, Rechte Dritter, Plattformregeln und sensible Daten dort, wo sie für die Aufgabe relevant sind. Nutze datensparsame, sichere Defaults.',
  'RECHTLICHES: Rechtliche Pflichtinhalte, Einwilligungen, Lizenzen, Claims oder Beratung niemals erfinden. Wo rechtliche Anforderungen relevant sein können, soll das Zielsystem sie prüfen bzw. fehlende Angaben als offene Punkte markieren; der Prompt ersetzt keine Rechtsberatung.',
  'TOOL-ANPASSUNG: Passe Struktur, Fachsprache, Detailtiefe, Parameter und Ausgabeform ausdrücklich an die gewählte Ziel-KI bzw. das Tool an. Ein Bild-, Musik-, Coding- oder Recherche-Prompt darf nicht wie derselbe Universaltext aussehen.',
  'PRIORITÄTEN: Explizite Nutzervorgaben stehen über allgemeinen Stilregeln. Widersprüchliche Angaben müssen sichtbar aufgelöst werden, statt stillschweigend eine Seite zu wählen.',
  'QUALITÄTSCHECK: Baue eine kurze interne Endprüfung ein: Ziel erfüllt, alle verbindlichen Angaben enthalten, Verbote beachtet, keine Fakten erfunden, Format korrekt, Ergebnis direkt nutzbar.',
  'AUSGABE: Der Ziel-Agent soll nur das angeforderte Arbeitsergebnis liefern, ohne zu erklären, dass er einem Prompt folgt oder wie der Prompt aufgebaut wurde.'
];

function clip(value,max){return String(value||'').trim().slice(0,max)}
function safeCategory(value){return CATEGORIES[value]?value:'custom'}
function cleanFence(value){return String(value||'').trim().replace(/^```(?:text|markdown|md)?\s*/i,'').replace(/\s*```$/,'').trim()}
function normalizedInput(body={}){
  const category=safeCategory(String(body.category||''));
  return {
    category,
    categoryLabel:category==='custom'?clip(body.customCategory,100)||'Eigener Typ':CATEGORIES[category],
    targetTool:clip(body.targetTool,100)||'Universell',
    customTool:clip(body.customTool,100),
    description:clip(body.description,9000),
    goal:clip(body.goal,2500),
    audience:clip(body.audience,1500),
    context:clip(body.context,7000),
    style:clip(body.style,1800),
    mustInclude:clip(body.mustInclude,3500),
    avoid:clip(body.avoid,3000),
    outputFormat:clip(body.outputFormat,1800),
    language:clip(body.language,80)||'Deutsch',
    constraints:clip(body.constraints,3500)
  };
}
function freeInput(input){return {...input,goal:'',audience:'',context:'',style:'',mustInclude:'',avoid:'',outputFormat:'',constraints:''}}
function roleFor(input){
  if(input.category==='image'){
    const t=`${input.description} ${input.goal} ${input.style}`.toLowerCase();
    if(/bearbeit|retusch|freistell|entfern|erset|hintergrund|farbkorrekt|restaur|edit|remove|replace|retouch/.test(t))return 'erfahrener Photo-Retoucher, Bildbearbeiter und Art Director';
  }
  if(input.category==='video'&&/schnitt|edit|vorhanden|footage|material/.test(`${input.description} ${input.goal}`.toLowerCase()))return 'erfahrener Video-Editor, Regisseur und Postproduktions-Spezialist';
  return CATEGORY_ROLES[input.category]||CATEGORY_ROLES.custom;
}
function asBullets(lines){return lines.map(x=>`- ${x}`).join('\n')}
// Both rule sets are editable in the admin console; the arrays above are their default.
function categoryRules(input){const lines=promptLines(`freeprompt-${safeCategory(input.category)}`);return lines.length?lines:(CATEGORY_MASTER_RULES[input.category]||CATEGORY_MASTER_RULES.custom)}
function universalRules(){const lines=promptLines('freeprompt-universal');return lines.length?lines:UNIVERSAL_MASTER_RULES}
function suppliedFields(input){
  return [
    ['Beschreibung',input.description],
    ['Ziel / gewünschtes Ergebnis',input.goal],
    ['Zielgruppe / Empfänger',input.audience],
    ['Kontext / Referenzen / Beispiele',input.context],
    ['Stil / Ton / Wirkung',input.style],
    ['Muss enthalten',input.mustInclude],
    ['Nicht übernehmen / vermeiden',input.avoid],
    ['Ausgabeformat / Länge',input.outputFormat],
    ['Weitere Grenzen',input.constraints]
  ].filter(([,v])=>v).map(([k,v])=>`${k}:\n${v}`).join('\n\n');
}
// Every tool has its own syntax: Midjourney takes --ar and --no, Flux takes a separate negative
// field, Suno separates style from lyrics, Sora wants one shot per prompt. Without this the same
// text went to all of them and the parameters that actually steer the result were missing.
function toolRules(tool){
  const wanted=String(tool||'').trim().toLowerCase();
  if(!wanted||wanted==='universell')return '';
  for(const line of promptLines('freeprompt-tool-rules')){
    const split=line.indexOf('::');if(split<1)continue;
    const name=line.slice(0,split).trim().toLowerCase();
    if(name&&(wanted===name||wanted.startsWith(name)||name.startsWith(wanted)))return line.slice(split+2).trim();
  }
  return '';
}
function architectPrompt(input,{advanced=false}={}){
  const tool=input.customTool||input.targetTool||'Universell',role=roleFor(input),fields=suppliedFields(input),syntax=toolRules(tool);
  return `Du bist der Prompt.ai Master-Prompt-Architekt. Verwandle die untenstehenden Rohangaben in EINEN professionellen, sofort kopierbaren Prompt für das genannte Ziel-Tool.\n\nWICHTIG: Die Rohangaben stammen direkt vom Nutzer und können Tippfehler, Umgangssprache, Satzfragmente oder Wiederholungen enthalten. Im finalen Prompt darfst du sie NICHT roh kopieren. Formuliere jede enthaltene Angabe fachlich sauber neu, ohne ihre Bedeutung zu verändern oder Informationen hinzuzuerfinden.\n\nAUSGABETYP\n${input.categoryLabel}\n\nZIEL-KI / TOOL\n${tool}\n\nSPRACHE DES FERTIGEN PROMPTS\n${input.language}\n\nPASSENDE FACHROLLE FÜR DEN ZIEL-AGENTEN\n${role}\n\nROHANGABEN DES NUTZERS\n${fields||`Beschreibung:\n${input.description}`}\n\nUNIVERSELLES PROMPT.AI MASTER-GERÜST\n${asBullets(universalRules())}\n\nSPEZIFISCHE MASTER-REGELN FÜR ${input.categoryLabel.toUpperCase()}\n${asBullets(categoryRules(input))}${syntax?`\n\nSYNTAX UND PARAMETER VON ${tool.toUpperCase()}\nDer fertige Prompt muss dieser Schreibweise folgen, sonst ignoriert das Zielwerkzeug die entscheidenden Angaben.\n- ${syntax}`:''}\n\nAUFBAU DES FINALEN PROMPTS\n${promptText('free-prompt-structure',{mode:advanced?'PRO-MODUS: Nutze sämtliche gelieferten Zusatzfelder. Verknüpfe sie sinnvoll, löse Dopplungen auf und mache Konflikte sichtbar.':'FREE-MODUS: Nutze ausschließlich Ausgabetyp, Ziel-Tool, Beschreibung und Sprache. Füge keine nicht gelieferten Ziele, Zielgruppen, Referenzen oder Stilwünsche hinzu.'})}\n\nErstelle jetzt den finalen Prompt.`;
}

function localProfessionalize(value){
  const text=String(value||'').replace(/\s+/g,' ').trim();if(!text)return '';
  const first=text.charAt(0).toUpperCase()+text.slice(1);return /[.!?]$/.test(first)?first:`${first}.`;
}
function localFallback(input,{advanced=false}={}){
  const tool=input.customTool||input.targetTool||'Universell',role=roleFor(input),description=localProfessionalize(input.description),syntax=toolRules(tool);
  const extra=advanced?[
    input.goal&&`Ziel: ${localProfessionalize(input.goal)}`,
    input.audience&&`Zielgruppe / Empfänger: ${localProfessionalize(input.audience)}`,
    input.context&&`Kontext / Referenzen: ${localProfessionalize(input.context)}`,
    input.style&&`Stil / Wirkung: ${localProfessionalize(input.style)}`,
    input.mustInclude&&`Muss enthalten: ${localProfessionalize(input.mustInclude)}`,
    input.avoid&&`Vermeiden: ${localProfessionalize(input.avoid)}`,
    input.outputFormat&&`Ausgabeformat: ${localProfessionalize(input.outputFormat)}`,
    input.constraints&&`Weitere Grenzen: ${localProfessionalize(input.constraints)}`
  ].filter(Boolean).join('\n'):'';
  return `ROLLE\nDu bist ${role}. Arbeite fachlich, eigenständig und auf professionellem Niveau.\n\nAUFGABE\nErstelle ${input.categoryLabel} für ${tool}.\n\nPROFESSIONELL AUFBEREITETE BESCHREIBUNG\n${description}${extra?`\n\nWEITERE VERBINDLICHE ANGABEN\n${extra}`:''}\n\nPROMPT.AI GRUNDREGELN\n${asBullets(universalRules())}\n\nFACHREGELN FÜR DIESEN BEREICH\n${asBullets(categoryRules(input))}${syntax?`\n\nSCHREIBWEISE FÜR ${tool.toUpperCase()}\n- ${syntax}`:''}\n\nABSCHLUSS\nPrüfe intern Ziel, Angaben, Verbote, Sicherheit und Ausgabeformat. Gib danach ausschließlich das direkt nutzbare Ergebnis zurück.`;
}
function safeModel(value,fallback){const model=String(value||fallback||'').trim();return model&&model.length<190&&/^[a-zA-Z0-9@._:/-]+$/.test(model)?model:fallback}
async function gateway(key,model,prompt,tokens){
  const response=await fetchWithTimeout('https://ai-gateway.vercel.sh/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model:safeModel(model,'openai/gpt-5.4'),messages:[{role:'system',content:'Du bist der Prompt.ai Master-Prompt-Architekt. Formuliere alle Rohangaben professionell neu, erfinde nichts und antworte ausschließlich mit dem finalen kopierbaren Prompt.'},{role:'user',content:prompt}],stream:false})});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw Object.assign(new Error(data.error?.message||data.message||'AI Gateway nicht verfügbar.'),{status:response.status});
  addTokens(tokens,data.usage);
  const value=data.choices?.[0]?.message?.content;return cleanFence(typeof value==='string'?value:Array.isArray(value)?value.map(x=>x.text||'').join(''):'');
}
async function openai(key,model,prompt,tokens){
  const response=await fetchWithTimeout('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model:safeModel(model,'gpt-5'),instructions:'Du bist der Prompt.ai Master-Prompt-Architekt. Formuliere alle Rohangaben professionell neu, erfinde nichts und antworte ausschließlich mit dem finalen kopierbaren Prompt.',input:prompt})});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw Object.assign(new Error(data.error?.message||'OpenAI nicht verfügbar.'),{status:response.status});
  addTokens(tokens,data.usage);
  let text=typeof data.output_text==='string'?data.output_text:'';if(!text)for(const item of data.output||[])for(const part of item.content||[])if(part.type==='output_text')text+=part.text||'';return cleanFence(text);
}
async function gemini(key,model,prompt,tokens){
  const selected=safeModel(model,'gemini-3.6-flash').replace(/^models\//,'');
  const response=await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(selected)}:generateContent`,{method:'POST',headers:{'x-goog-api-key':key,'Content-Type':'application/json'},body:JSON.stringify({systemInstruction:{parts:[{text:'Du bist der Prompt.ai Master-Prompt-Architekt. Formuliere alle Rohangaben professionell neu, erfinde nichts und antworte ausschließlich mit dem finalen kopierbaren Prompt.'}]},contents:[{role:'user',parts:[{text:prompt}]}]})});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw Object.assign(new Error(data.error?.message||'Gemini nicht verfügbar.'),{status:response.status});addTokens(tokens,data.usageMetadata);return cleanFence((data.candidates?.[0]?.content?.parts||[]).map(x=>x.text||'').join(''));
}
async function generateWithSystemAi(req,input,{advanced=false,plan='',saver=false}={}){
  // The plan decides which AIs are in the chain - the visitor never picks a model.
  let profiles=await listProfiles('freeprompt',{providers:['gateway','openai','gemini'],plan});if(!profiles.length)profiles=await listProfiles('prompt',{providers:['gateway','openai','gemini'],plan});
  // Token budget spent: start from the back of the chain, so the cheapest AI answers.
  if(saver&&profiles.length>1)profiles=[...profiles].reverse();
  const errors=[],architect=architectPrompt(input,{advanced}),tokens=tokenSink();
  for(const profile of profiles){
    if(profile.enabled===false)continue;
    try{
      const resolved=await resolveProviderKey(req,profile.provider,{systemOnly:true});if(!resolved.key)continue;
      const model=profile.model||resolved.defaultModel||'';
      const result=profile.provider==='gateway'?await gateway(resolved.key,model,architect,tokens):profile.provider==='openai'?await openai(resolved.key,model,architect,tokens):await gemini(resolved.key,model,architect,tokens);
      if(result.length<180)throw new Error('Antwort war zu kurz.');
      return {prompt:result,provider:profile.provider,model:model||resolved.defaultModel||'',profile:profile.label||'',polished:true,tokens};
    }catch(error){errors.push(`${profile.label||profile.provider}: ${error.message}`)}
  }
  return {prompt:localFallback(input,{advanced}),provider:'local',model:'',profile:'Lokaler Master-Prompt-Fallback',fallbackErrors:errors.slice(0,3),polished:false,tokens};
}

module.exports=async function freePromptV2(req,res){
  res.setHeader('Cache-Control','no-store, private');if(!rateLimit(req,res,{key:'free-prompt',limit:8,windowMs:60*60*1000}))return;
  const started=Date.now();let usage={action:'free-prompt',provider:'local',model:'',project:{name:'Freier Prompt',type:'',goal:''}};
  try{
    await primePromptTemplates();
    const raw=JSON.stringify(req.body||{});if(raw.length>MAX_BODY)return res.status(413).json({error:'Die Eingabe ist zu groß. Bitte Referenztexte kürzen.'});
    const normalized=normalizedInput(req.body||{});if(normalized.description.length<12)return res.status(400).json({error:'Beschreibe bitte etwas genauer, was die KI für dich erstellen soll.'});
    const entitlement=await getEntitlements(req),pro=entitlement.isAdmin||['pro','ultimate'].includes(entitlement.plan),input=pro?normalized:freeInput(normalized);
    usage.project={name:'Freier Prompt',type:input.categoryLabel,goal:(input.goal||input.description).slice(0,180)};
    const budget=await getTokenBudget(req);
    const result=await generateWithSystemAi(req,input,{advanced:pro,plan:entitlement.isAdmin?'ultimate':String(entitlement.plan||'free'),saver:budget.exhausted});
    if(budget.exhausted)res.setHeader('X-Prompt-AI-Saver','1');usage.provider=result.provider;usage.model=result.model;usage.tokens=result.tokens;
    await logUsage(req,{...usage,durationMs:Date.now()-started});
    return res.status(200).json({...result,tier:entitlement.isAdmin?'ultimate':entitlement.plan,advanced:pro,masterVersion:'v2'});
  }catch(error){
    await logUsage(req,{...usage,success:false,durationMs:Date.now()-started,error:error.message||'Freier Prompt fehlgeschlagen'});
    return res.status(error.status||500).json({error:error.message||'Der Prompt konnte nicht erstellt werden.'});
  }
};
