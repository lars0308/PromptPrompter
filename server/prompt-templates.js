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
 }
];

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

module.exports={primePromptTemplates,promptText,promptDefaults,isPromptKey,KEYS};
