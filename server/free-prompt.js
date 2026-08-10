const {getEntitlements}=require('./entitlements');
const {resolveProviderKey}=require('./provider-key');
const {listProfiles}=require('./system-ai-profiles');
const {rateLimit}=require('./rate-limit');
const {logUsage}=require('./usage');

const MAX_BODY=120000;
const CATEGORIES={
  music:'Musik / Song',video:'Video / Film',text:'Text / Schreiben',website:'Website / Webdesign',presentation:'Präsentation / PowerPoint',image:'Bild / Grafik',code:'Code / App',marketing:'Marketing / Werbung',social:'Social Media',research:'Recherche / Analyse',learning:'Lernen / Erklären',audio:'Stimme / Audio',automation:'Automation / Workflow',business:'Business / Strategie',design3d:'3D / Design',email:'E-Mail / Kommunikation',custom:'Eigener Typ'
};
const CATEGORY_ROLES={
  music:'erfahrener Musikproduzent, Songwriter und Sound-Designer',
  video:'erfahrener Regisseur, Kamerakonzeptioner und Video-Creative-Director',
  text:'erfahrener Redakteur und professioneller Texter',
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
const CATEGORY_BLUEPRINT={
  music:'Baue den Prompt um musikalisch verwertbare Parameter auf: Genre, Stimmung, Tempo, Instrumentierung, Songstruktur, Gesang/Stimme, Sprache, Dynamik, Produktionsästhetik und klare Negativvorgaben. Keine austauschbaren Superlative oder nichtssagenden Mood-Wörter ohne musikalische Bedeutung.',
  video:'Baue den Prompt um Motiv, Handlung, Shot-Abfolge, Kamera, Brennweite/Perspektive soweit sinnvoll, Bewegung, Licht, Look, Dauer, Seitenverhältnis, Kontinuität und Negativvorgaben auf. Vermeide widersprüchliche Kamera- oder Bewegungsanweisungen.',
  text:'Baue den Prompt um Zweck, Zielgruppe, Ton, Perspektive, Umfang, Aufbau, Faktenregeln, Beispiele und konkretes Ausgabeformat auf. Vermeide KI-Floskeln, leere Übergänge, künstliche Begeisterung und unnötig formelle Sprache.',
  website:'Baue den Prompt um Geschäftsziel, Nutzer, Informationsarchitektur, Seiten/Funktionen, Inhalte, visuelle Richtung, responsive Verhalten, Barrierefreiheit, Performance, Datenschutz, Impressum/Consent soweit relevant, technische Grenzen und Abnahmekriterien auf. Vermeide generische KI-/SaaS-Muster, unnötige Kartenraster, austauschbare Gradient-Heroes und erfundene Social Proofs.',
  presentation:'Baue den Prompt um Publikum, Ziel, Kernaussage, Folienanzahl, Dramaturgie, Folienstruktur, Visualisierungsregeln, Quellen/Belege, Sprecherhinweise und Dateilogik auf. Keine Folien mit Textwänden oder erfundenen Kennzahlen.',
  image:'Baue den Prompt um Motiv, Umgebung, Komposition, Perspektive, Licht, Materialität, Farbwelt, Stilgrad, Seitenverhältnis, Detailgrad und Negativvorgaben auf. Bei Bildbearbeitung: zu erhaltende Bestandteile strikt von gewünschten Änderungen trennen und Identität/Geometrie nicht unbeabsichtigt verändern.',
  code:'Baue den Prompt um Problem, Nutzerfluss, Plattform, Stack/Constraints, Datenmodell, Schnittstellen, Fehlerzustände, Sicherheit, Datenschutz, Tests, Performance und eindeutige Definition-of-Done auf. Bestehende Architektur respektieren; keine unnötigen Abhängigkeiten oder erfundenen APIs.',
  marketing:'Baue den Prompt um Angebot, Zielgruppe, Kanal, Zielhandlung, Nutzenargumentation, Belegbarkeit, Ton, Varianten, Verbote und messbares Ausgabeziel auf. Keine unbelegten Versprechen, künstliche Verknappung oder erfundene Bewertungen.',
  social:'Baue den Prompt um Plattform, Zielgruppe, Ziel, Format, Länge, Hook, Ton, CTA, Hashtag-/Emoji-Regeln und Faktenregeln auf. Keine Engagement-Bait-Floskeln, erfundenen Trends oder unpassenden Hashtag-Blöcke.',
  research:'Baue den Prompt um Forschungsfrage, Scope, Zeitraum, Quellenanforderungen, Gegenpositionen, Unsicherheiten, Zitationsformat und Entscheidungshilfe auf. Fakten und Schlussfolgerungen klar trennen; keine Quellen erfinden.',
  learning:'Baue den Prompt um Wissensstand, Lernziel, Tiefe, Beispiele, Übungen, Verständnisprüfung und Erklärsprache auf. Keine unnötige Vereinfachung, wenn Präzision nötig ist; Unsicherheiten kennzeichnen.',
  audio:'Baue den Prompt um Sprecherrolle, Sprache, Stimmung, Tempo, Aussprache, Pausen, Aufnahmecharakter, Länge und technische Ausgabeanforderungen auf. Keine widersprüchlichen Stimm- oder Tempoanweisungen.',
  automation:'Baue den Prompt um Trigger, Eingaben, Systeme, Schritte, Bedingungen, Fehlerpfade, Wiederholbarkeit, Freigaben, Datenschutz, Secrets und erwartetes Endergebnis auf. Keine Zugangsdaten im Klartext und keine stillen destruktiven Aktionen.',
  business:'Baue den Prompt um Ausgangslage, Ziel, Rahmenbedingungen, bekannte Zahlen, explizite Annahmen, Optionen, Risiken und Entscheidungsausgabe auf. Zahlen nicht erfinden; rechtliche, steuerliche oder finanzielle Aussagen als prüfbedürftig kennzeichnen, wenn Fachberatung erforderlich ist.',
  design3d:'Baue den Prompt um Objekt/Szene, Proportionen, Material, Licht, Kamera, Stilgrad, technische Nutzung, Geometrie-/Rendergrenzen, Maßstab und Exportziel auf. Funktionale Geometrie nicht zugunsten reiner Optik verfälschen.',
  email:'Baue den Prompt um Absenderrolle, Empfänger, Anlass, Ziel, Ton, Länge, Pflichtinformationen, CTA und zu vermeidende Formulierungen auf. Kein KI-Briefstil, keine übertriebene Höflichkeit und keine erfundenen Zusagen.',
  custom:'Leite aus Ziel und Tool selbst ein fachlich passendes Master-Gerüst ab. Nutze nur Regeln, die für den konkreten Ausgabetyp sinnvoll sind, und erfinde keine Projektdaten.'
};
const MASTER_CORE=`PROMPT.AI MASTER-GRUNDREGELN
- Schreibe sämtliche Nutzereingaben vor der Verwendung fachlich, grammatikalisch sauber, eindeutig und toolgerecht um. Umgangssprache, Tippfehler und unfertige Stichpunkte dürfen nicht roh in den finalen Prompt übernommen werden, solange dadurch keine Bedeutung verändert wird.
- Jede konkrete Nutzerangabe bleibt inhaltlich verbindlich. Nichts hinzuerfinden, insbesondere keine Fakten, Namen, Zahlen, Quellen, Rechte, Bewertungen, Funktionen oder Referenzen.
- Vermeide typische KI-Muster: keine leeren Superlative, keine generischen Floskeln, keine künstlichen Übergänge, keine unnötigen Wiederholungen und keine austauschbare Standardstruktur, wenn der Anwendungsfall etwas Eigenständiges verlangt.
- Sicherheit ist Teil der Aufgabe: erkenne missbräuchliche, gefährliche oder unzulässige Anforderungen und formuliere keine Umgehungsanweisungen. Secrets, Passwörter und personenbezogene Daten nicht unnötig offenlegen.
- Rechtliches mitdenken, wo es tatsächlich relevant ist: Datenschutz, Urheber-/Nutzungsrechte, Kennzeichnungspflichten, Impressum/Consent, Barrierefreiheit oder branchenspezifische Vorgaben. Keine Rechtsberatung vortäuschen und keine Rechtslage erfinden.
- Fehlende Angaben nur dann als Rückfrage vorsehen, wenn sie das Ergebnis wesentlich verändern. Sonst eine konservative, reversible Annahme treffen und im Arbeitsauftrag kenntlich machen.
- Der finale Prompt muss direkt kopierbar sein und eine klare Definition des gewünschten Ergebnisses sowie eine kurze Qualitätskontrolle enthalten.`;

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
function rawSections(input){return [
  ['Hauptbeschreibung',input.description],['Ziel / gewünschtes Ergebnis',input.goal],['Zielgruppe / Empfänger',input.audience],['Kontext / Referenzen / Beispiele',input.context],['Stil / Ton / Wirkung',input.style],['Muss enthalten',input.mustInclude],['Nicht übernehmen / vermeiden',input.avoid],['Ausgabeformat / Länge',input.outputFormat],['Weitere Grenzen',input.constraints]
].filter(([,v])=>v).map(([k,v])=>`${k}:\n${v}`).join('\n\n')}
function basicPrompt(input){
  const tool=input.customTool||input.targetTool||'eine geeignete KI',role=roleFor(input),raw=rawSections(input);
  return `ROLLE\nDu bist ${role}. Arbeite fachlich, eigenständig und auf professionellem Niveau.\n\nAUFGABE\nErstelle ${input.categoryLabel} für ${tool}.\n\nROHANGABEN DES NUTZERS\n${raw}\n\nAUFBEREITUNG DER ANGABEN\nFormuliere die Rohangaben intern zuerst professionell, eindeutig und fachlich passend um. Korrigiere Umgangssprache, Tippfehler und unklare Formulierungen, ohne Inhalte zu erfinden oder die Bedeutung zu verändern. Verwende im Ergebnis die professionell aufbereiteten Angaben und nicht die rohe Formulierung.\n\nBEREICHS-MASTER\n${CATEGORY_BLUEPRINT[input.category]||CATEGORY_BLUEPRINT.custom}\n\n${MASTER_CORE}\n\nSPRACHE\n${input.language}\n\nAUSGABE\nGib ausschließlich das fertige Ergebnis zurück.`;
}
function architectPrompt(input,{advanced=true}={}){
  const tool=input.customTool||input.targetTool||'Universelle KI',role=roleFor(input),raw=rawSections(input);
  return `Du bist Prompt.ai Prompt-Architekt. Erstelle aus den Rohangaben EINEN professionellen, direkt einsetzbaren Master-Prompt für das genannte Ziel-Tool.\n\nWICHTIGSTE AUFGABE: PROFESSIONELLE NEUFORMULIERUNG\nFormuliere ALLE gelieferten Nutzereingaben zuerst fachlich sauber neu. Übernimm keine holprige Umgangssprache, Tippfehler, Füllwörter oder unfertige Satzfragmente in den finalen Prompt. Erhalte dabei Bedeutung, konkrete Wünsche, Verbote und Prioritäten vollständig. Nur wörtlich gewünschte Zitate dürfen wörtlich bleiben.\n\nZIELROLLE\nDer fertige Prompt soll die Ziel-KI als ${role} arbeiten lassen. Nutze eine klare Fachrolle ohne künstliche Titelhäufung.\n\nAUSGABETYP\n${input.categoryLabel}\n\nZIEL-KI / TOOL\n${tool}\n\nROHANGABEN – NUR ALS QUELLE, NICHT WÖRTLICH KOPIEREN\n${raw}\n\nSPRACHE\n${input.language}\n\nBEREICHS-MASTER\n${CATEGORY_BLUEPRINT[input.category]||CATEGORY_BLUEPRINT.custom}\n\n${MASTER_CORE}\n\nTARIF-TIEFE\n${advanced?'Nutze sämtliche gelieferten Zusatzangaben und löse sie zu einem detaillierten, projektspezifischen Arbeitsauftrag auf.':'Erzeuge aus Ausgabetyp, Ziel-Tool und Hauptbeschreibung einen kompakten, aber professionell neu formulierten Prompt. Erfinde keine Zusatzinformationen, die der Nutzer im Free-Flow nicht angegeben hat.'}\n\nSTRUKTUR DES FINALEN PROMPTS\n1. ROLLE – passende Fachrolle für genau diese Aufgabe.\n2. AUFGABE – professionell formulierte Zielbeschreibung in klaren, konkreten Sätzen.\n3. PROJEKTANGABEN – alle gelieferten Inhalte neu formuliert und sinnvoll geordnet.\n4. FACHLICHE REGELN – ausschließlich relevante Regeln aus dem Bereichs-Master.\n5. SICHERHEIT / RECHT – nur die für diesen Auftrag tatsächlich relevanten Punkte.\n6. QUALITÄTSKONTROLLE – kurze, überprüfbare Kriterien statt allgemeiner Floskeln.\n7. AUSGABE – eindeutiges Format und was die Ziel-KI am Ende liefern soll.\n\nQUALITÄTSKONTROLLE FÜR DICH ALS PROMPT-ARCHITEKT\n- Keine rohe Nutzereingabe stehen lassen, wenn sie professionell formuliert werden kann.\n- Keine Information verlieren oder stillschweigend verändern.\n- Keine KI-Floskeln oder Standardtextbausteine ohne fachlichen Zweck.\n- Prompt an Syntax, Stärken und Arbeitsweise des Ziel-Tools anpassen.\n- Widersprüche sichtbar und sinnvoll auflösen; bei wesentlichen offenen Punkten eine kurze Rückfrage im Prompt vorsehen.\n- Gib keine Meta-Erklärung aus.\n\nGib jetzt ausschließlich den finalen, kopierbaren Master-Prompt aus.`;
}
function safeModel(value,fallback){const model=String(value||fallback||'').trim();return model&&model.length<190&&/^[a-zA-Z0-9@._:/-]+$/.test(model)?model:fallback}
async function gateway(key,model,prompt){
  const response=await fetch('https://ai-gateway.vercel.sh/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model:safeModel(model,'openai/gpt-5.4'),messages:[{role:'system',content:'Du bist Prompt.ai Prompt-Architekt. Formuliere Nutzereingaben professionell neu und antworte nur mit dem finalen, direkt kopierbaren Prompt.'},{role:'user',content:prompt}],stream:false})});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw Object.assign(new Error(data.error?.message||data.message||'AI Gateway nicht verfügbar.'),{status:response.status});const value=data.choices?.[0]?.message?.content;return cleanFence(typeof value==='string'?value:Array.isArray(value)?value.map(x=>x.text||'').join(''):'');
}
async function openai(key,model,prompt){
  const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model:safeModel(model,'gpt-5'),instructions:'Du bist Prompt.ai Prompt-Architekt. Formuliere Nutzereingaben professionell neu und antworte nur mit dem finalen, direkt kopierbaren Prompt.',input:prompt})});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw Object.assign(new Error(data.error?.message||'OpenAI nicht verfügbar.'),{status:response.status});let text=typeof data.output_text==='string'?data.output_text:'';if(!text)for(const item of data.output||[])for(const part of item.content||[])if(part.type==='output_text')text+=part.text||'';return cleanFence(text);
}
async function gemini(key,model,prompt){
  const selected=safeModel(model,'gemini-3.6-flash').replace(/^models\//,'');
  const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(selected)}:generateContent`,{method:'POST',headers:{'x-goog-api-key':key,'Content-Type':'application/json'},body:JSON.stringify({systemInstruction:{parts:[{text:'Du bist Prompt.ai Prompt-Architekt. Formuliere Nutzereingaben professionell neu und antworte nur mit dem finalen, direkt kopierbaren Prompt.'}]},contents:[{role:'user',parts:[{text:prompt}]}]})});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw Object.assign(new Error(data.error?.message||'Gemini nicht verfügbar.'),{status:response.status});return cleanFence((data.candidates?.[0]?.content?.parts||[]).map(x=>x.text||'').join(''));
}
async function systemPrompt(req,input,{advanced=true}={}){
  let profiles=await listProfiles('freeprompt',{providers:['gateway','openai','gemini']});if(!profiles.length)profiles=await listProfiles('prompt',{providers:['gateway','openai','gemini']});
  const errors=[];for(const profile of profiles){try{const resolved=await resolveProviderKey(req,profile.provider,{systemOnly:true});if(!resolved.key)continue;const model=profile.model||resolved.defaultModel||'',prompt=architectPrompt(input,{advanced});const result=profile.provider==='gateway'?await gateway(resolved.key,model,prompt):profile.provider==='openai'?await openai(resolved.key,model,prompt):await gemini(resolved.key,model,prompt);if(result.length<120)throw new Error('Antwort war zu kurz.');return {prompt:result,provider:profile.provider,model:model||resolved.defaultModel||'',profile:profile.label||'',professionalized:true}}catch(error){errors.push(`${profile.label||profile.provider}: ${error.message}`)}}
  return {prompt:basicPrompt(input),provider:'local',model:'',profile:'Lokaler Sicherheits-Fallback',fallbackErrors:errors.slice(0,3),professionalized:false};
}

module.exports=async function freePrompt(req,res){
  res.setHeader('Cache-Control','no-store, private');if(!rateLimit(req,res,{key:'free-prompt',limit:8,windowMs:60*60*1000}))return;
  const started=Date.now();let usage={action:'free-prompt',provider:'local',model:'',project:{name:'Freier Prompt',type:'',goal:''}};
  try{
    const raw=JSON.stringify(req.body||{});if(raw.length>MAX_BODY)return res.status(413).json({error:'Die Eingabe ist zu groß. Bitte Referenztexte kürzen.'});
    const input=normalizedInput(req.body||{});if(input.description.length<12)return res.status(400).json({error:'Beschreibe bitte etwas genauer, was die KI für dich erstellen soll.'});
    usage.project={name:'Freier Prompt',type:input.categoryLabel,goal:input.goal||input.description.slice(0,180)};
    const entitlement=await getEntitlements(req),pro=entitlement.isAdmin||['pro','ultimate'].includes(entitlement.plan);
    const result=await systemPrompt(req,pro?input:freeInput(input),{advanced:pro});usage.provider=result.provider;usage.model=result.model;await logUsage(req,{...usage,durationMs:Date.now()-started});
    return res.status(200).json({...result,tier:entitlement.isAdmin?'ultimate':entitlement.plan,advanced:pro});
  }catch(error){await logUsage(req,{...usage,success:false,durationMs:Date.now()-started,error:error.message||'Freier Prompt fehlgeschlagen'});return res.status(error.status||500).json({error:error.message||'Der Prompt konnte nicht erstellt werden.'})}
};
