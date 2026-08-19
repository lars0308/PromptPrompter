import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

// Was am Ende im Master-Prompt steht, lässt sich am Quelltext nicht beurteilen. Hier wird er
// deshalb wirklich zusammengesetzt: der Bauteil aus app.js läuft mit einem echten Projektstand,
// und geprüft wird der fertige Text.
async function bauer(){
  const src=await readFile(fileURLToPath(new URL('../app.js',import.meta.url)),'utf8');
  const schnitt=(von,bis)=>{const a=src.indexOf(von),b=src.indexOf(bis,a);assert.ok(a>=0&&b>a,`Marke fehlt: ${von}`);return src.slice(a,b)};
  const teil=schnitt('  const UNUSABLE_SOURCE=','  const usableSources=')
    +'\n  const usableSources=()=>state.sourceUrls.filter(sourceUsable);\n'
    +schnitt('  const AGENT_INSTRUCTIONS = {','  function updateMasterPrompt(');
  const kopf=`
let state={},PROJEKT={};const window={},document={};
const project=()=>PROJEKT;
const cloudReady=()=>true;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const endSentence=t=>{const s=String(t||'').trim();return !s?'':/[.!?]$/.test(s)?s:s+'.'};
const escapeHtml=v=>String(v??'');
const localAnalyzeProject=()=>({summary:'',priorities:[]});
const selectedConcept=()=>state.__concept||null;
const selectedTemplate=()=>state.__template||null;
const selectedModules=()=>state.__modules||[];
const selectedSkills=()=>state.__skills||[];
const activeCheckNames=()=>Object.keys(state.settings?.checks||{}).filter(k=>state.settings.checks[k]);
const controls=()=>({originality:78,antiSlop:95,motion:18,density:55});
const deployReachable=()=>state.__deploy===true;
const AGENT_NAMES={codex:'Codex',claude:'Claude Code',cursor:'Cursor',gemini:'Gemini',v0:'v0',chatgpt:'ChatGPT',universal:'Universell'};
const OUTPUT_TARGETS={'next-vercel':'Next.js auf Vercel','next-only':'Next.js lokal'};
const uid=(p='id')=>p+'-x';
`;
  return new Function(kopf+teil+'\nreturn {set:(s,p)=>{state=s;PROJEKT=p},buildMasterPrompt,structureDocument};')();
}
const GRUND={settings:{checks:{privacy:true,imprint:true},noInventLegal:true,legalRegion:'Deutschland',finalChecklist:true,aiClarifications:true},
  targetAgent:'codex',outputTarget:'next-only',urls:[],images:[],documents:[],sourceUrls:[],refinements:[],clarifications:[],projectReview:null,
  understanding:{summary:'Zusammenfassung',priorities:['A']},__concept:null,__modules:[],__skills:[],__template:null,__deploy:false};
const KUNDE={name:'Döner Stadthagen',type:'Website',goal:'Speisekarte zeigen',audience:'Leute aus Stadthagen',
  description:'Website in Stadthagen für Dönerladen schön und sauber strukturiert in weiß',special:'und telefon udn email',
  client:{name:'Döner Stadthagen',type:'Kunde',website:'https://doener-stadthagen.de',contact:''}};
const bau=async(zustand={},kunde={})=>{const api=await bauer();api.set({...GRUND,...zustand},{...KUNDE,...kunde});return api.buildMasterPrompt()};

test('der Auftrag trägt nichts über das Konto des Nutzers',async()=>{
  const text=await bau();
  // Tarif, Arbeitsmodus, Generator und Modell standen einmal als eigener Block darin. Für die
  // bauende KI ändert das nichts am Ergebnis - und die Datei geht an Kunden weiter.
  for(const wort of [/\bultimate\b/i,/\btarif\b/i,/\bfree-tarif\b/i,/\babo\b/i,/\badmin\b/i,/\bgateway\b/i,/gpt-5/i,/claude-sonnet/i])
    assert.doesNotMatch(text,wort,`Kontodaten im Auftrag: ${wort}`);
});

test('im fertigen Auftrag steht nirgends undefined',async()=>{
  // „Typografie: undefined" ist für die bauende KI weder Angabe noch erkennbare Lücke.
  const mager=await bau({__concept:{name:'Klar',mood:'ruhig',palette:[]}});
  assert.doesNotMatch(mager,/undefined|\bnull\b|\[object Object\]/,'ein fehlendes Feld ist ein offener Punkt, kein Wert');
  assert.match(mager,/Typografie: nicht festgelegt/);
});

test('beantwortete Rückfragen stehen als Aussage im Auftrag, nicht als Frage',async()=>{
  const frage='Soll es eine Online-Bestellung geben oder nur die Speisekarte?';
  const text=await bau({projectReview:{questions:[{question:frage}]},
    clarifications:[{question:frage,answer:'nur die Speisekarte, bestellt wird telefonisch'}]});
  assert.match(text,/Festgelegt in der Abstimmung:[\s\S]{0,200}nur die Speisekarte, bestellt wird telefonisch/);
  assert.doesNotMatch(text,new RegExp(frage.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')),'die Frage selbst hat im Auftrag nichts verloren, sobald sie beantwortet ist');
  // „karte" traf ohne Wortgrenze mitten in „Speisekarte" und machte daraus eine Anfahrt.
  assert.doesNotMatch(text,/Telefon und Anfahrt/,'nichts hinzuerfinden');
});

test('Antworten überleben, auch wenn die Projektprüfung neu gerechnet wird',async()=>{
  // Die Prüfung wird verworfen, sobald sich eine Eingabe ändert. Stünde die Fragenliste allein
  // dort, verschwände mit ihr lautlos jede bereits gegebene Antwort.
  const text=await bau({projectReview:null,clarifications:[{question:'Gibt es schon eine Website?',answer:'https://doener-stadthagen.de'}]});
  assert.match(text,/Festgelegt in der Abstimmung:[\s\S]{0,200}doener-stadthagen\.de/);
  assert.doesNotMatch(text,/Keine zusätzlichen Festlegungen aus der Prüfung/);
});

test('eine Stichwortantwort wird zur Aussage, eine Verneinung bleibt stehen',async()=>{
  const frage='Wie sollen Kunden Kontakt aufnehmen?';
  const kurz=await bau({projectReview:{questions:[{question:frage}]},clarifications:[{question:frage,answer:'und telefon udn email'}]});
  assert.match(kurz,/Als Kontaktwege sind Telefon und E-Mail vorgesehen/,'Rohfragmente werden zur lesbaren Festlegung');
  const nein=await bau({projectReview:{questions:[{question:frage}]},clarifications:[{question:frage,answer:'keine E-Mail bitte, nur Telefon'}]});
  assert.match(nein,/keine E-Mail bitte, nur Telefon/,'eine Verneinung darf nie zur Aufzählung werden');
  assert.doesNotMatch(nein,/Als Kontaktwege sind Telefon und E-Mail/);
});

test('unbeantwortete Rückfragen stehen offen und in der Nachreichliste',async()=>{
  const frage='Welche Farben sollen verwendet werden?';
  // Ohne Farbwort in der Beschreibung bleibt die Frage offen - mit einem waere sie beantwortet.
  const text=await bau({projectReview:{questions:[{question:frage}]},clarifications:[{question:frage,answer:''}]},
    {description:'Website für einen Dönerladen in Stadthagen, sauber strukturiert'});
  assert.match(text,/Noch offen \(nicht erfinden, sichtbar als offen führen\):[\s\S]{0,120}Farben/);
  assert.match(text,/## NOCH ZU LIEFERN[\s\S]{0,600}Antwort auf: Farben/,'sonst fällt sie genau dort heraus, wo sie nachgereicht würde');
});

test('der Auftrag nennt den Bestand, die Inhalte bleiben in der Quellendatei',async()=>{
  // Beides war schon falsch: der blosse Verweis sagte nicht, ob ueberhaupt etwas beiliegt; die
  // volle Liste stand doppelt da und machte den Auftrag lang, ohne ihm etwas hinzuzufuegen.
  const text=await bau({urls:[{url:'https://beispiel-referenz.de',aspects:['Typografie'],dislike:'die Animationen'}],
    images:[{name:'laden-aussen.jpg'},{name:'theke.jpg'}],documents:[{name:'speisekarte.pdf'}]});
  assert.match(text,/Beigelegt sind 1 Referenzlink, 2 Bilder und 1 Unterlage/,'der Bestand steht da, damit ein Fehlen auffaellt');
  assert.match(text,/PROJEKT-QUELLEN\.md/);
  assert.match(text,/fordere sie an; rate ihren Inhalt nicht/);
  // Kein Dateiname, kein Aspekt, keine Seitenzahl - das steht alles in der Quellendatei.
  for(const doppelt of [/laden-aussen\.jpg/,/speisekarte\.pdf/,/beispiel-referenz\.de/,/die Animationen/])
    assert.doesNotMatch(text,doppelt,`steht doppelt im Auftrag: ${doppelt}`);
  const leer=await bau();
  assert.match(leer,/Es liegen keine Referenzen, Bilder oder Unterlagen bei\./);
});

test('Öffnungszeiten mit vollen Stunden gelten als gefunden',async()=>{
  const seite={url:'https://doener-stadthagen.de/kontakt',kind:'Kontakt',title:'Kontakt',
    summary:'Unser Laden in 31655 Stadthagen, Bahnhofstr. 4. Telefon 05721 123456. Geöffnet Mo-Sa 11-22 Uhr und wir bereiten alles frisch zu, täglich neu, mit Fleisch aus der Region und Gemüse vom Markt nebenan, seit vielen Jahren am selben Ort.'};
  // Kürzer zählt die Seite zu Recht nicht als Quelle (PAGE_MIN_CHARS) - ein Seitenstummel ist
  // kein Beleg.
  const text=await bau({sourceUrls:[{url:'https://doener-stadthagen.de',title:'D',pages:[seite],links:[]}]});
  assert.match(text,/- Öffnungszeiten: Mo-Sa 11-22 Uhr/,'„Mo-Sa 11-22 Uhr" ist die häufigste Schreibweise an einer Ladentür');
  assert.doesNotMatch(text,/Öffnungszeiten: nicht in den Quellen gefunden/);
});

test('die Seitenliste im Auftrag und die Strukturdatei nennen dieselbe Zahl',async()=>{
  const api=await bauer();
  api.set({...GRUND,sourceUrls:[{url:'https://doener-stadthagen.de',title:'D',links:[],
    pages:[{url:'https://doener-stadthagen.de/kontakt',kind:'Kontakt',title:'Kontakt',summary:'Telefon 05721 123456 in 31655 Stadthagen.'}]}]},KUNDE);
  const text=api.buildMasterPrompt(),struktur=api.structureDocument();
  const genannt=Number((text.match(/Seiten: genau (\d+)/)||[])[1]);
  const gelistet=(struktur.match(/^## \d+\. /gm)||[]).length;
  assert.ok(genannt>0,'der Auftrag nennt eine Seitenzahl');
  assert.equal(genannt,gelistet,'Auftrag und SEITENSTRUKTUR.md dürfen nie verschiedene Seitenzahlen nennen');
  assert.match(text,/SEITENSTRUKTUR\.md/);
});

test('kein Projekt schleppt die Vorlage des vorigen mit',async()=>{
  const src=await readFile(fileURLToPath(new URL('../app.js',import.meta.url)),'utf8');
  const von=src.indexOf('  function resetProjectScopedState('),bis=src.indexOf('\n  }',von);
  const reset=src.slice(von,bis);
  // Alles, was der Master-Prompt aus dem Projektstand liest, muss beim Projektwechsel fallen.
  for(const feld of ['clarifications','projectReview','urls','images','documents','sourceUrls','understanding','refinements','selectedConceptId','selectedModuleIds','selectedSkillIds','templateId'])
    assert.match(reset,new RegExp(`state\\.${feld}\\s*=`),`beim Projektwechsel bleibt state.${feld} stehen`);
});

test('bei Widerspruch steht die Rangfolge fest im Auftrag',async()=>{
  // Trifft ein Farbwunsch auf eine Kontrastanforderung, entschied die bauende KI bisher selbst -
  // mal so, mal anders. Die Rangfolge steht unabhaengig davon da, ob ein Widerspruch gefunden wurde.
  const text=await bau();
  assert.match(text,/## RANGFOLGE BEI WIDERSPRUCH/);
  const rang=text.slice(text.indexOf('## RANGFOLGE BEI WIDERSPRUCH'));
  for(const [platz,wort] of [[1,/Belegte Fakten, Sicherheit/],[2,/Barrierefreiheit/],[3,/Funktion/],[4,/Das Hauptziel/],[5,/Gestaltungspräferenzen/]])
    assert.match(rang,new RegExp(`${platz}\\. ${wort.source}`),`Platz ${platz} fehlt oder steht falsch`);
  assert.ok(rang.indexOf('Barrierefreiheit')<rang.indexOf('Gestaltungspräferenzen'),'Barrierefreiheit steht über dem Gestaltungswunsch');
});

test('Rechtstexte werden nicht sprachlich überarbeitet, Inhaltstexte schon',async()=>{
  // Zwei Regeln standen nebeneinander und widersprachen sich: Quelltexte duerfen ueberarbeitet
  // werden - und Rechtstexte stammen ausschliesslich aus den Quellen.
  const text=await bau();
  assert.match(text,/Trennung der Textarten:[\s\S]{0,260}unverändert übernommen/);
  assert.match(text,/Impressum, Datenschutz, AGB, Widerruf/);
});

test('eine in der Beschreibung genannte Farbe beantwortet die Farbfrage',async()=>{
  // „Website … in weiß" stand in der Beschreibung - und trotzdem fragte der Auftrag weiter
  // „Welche Farben sollen verwendet werden?". Ein aufgeloester Punkt darf nicht offen erscheinen.
  const frage='Welche Farben sollen verwendet werden?';
  const text=await bau({projectReview:{questions:[{question:frage}]},clarifications:[{question:frage,answer:''}]});
  assert.doesNotMatch(text,/Noch offen[\s\S]{0,200}Farben/);
  assert.match(text,/Farben: Farbe festgelegt: weiß/);
  assert.match(text,/offen ist höchstens eine ergänzende Akzentfarbe/,'offen bleibt das Genaue, nicht die ganze Frage');
  assert.doesNotMatch(text,/Antwort auf: Farben/);
});

test('ohne Bildvorschau spricht der Auftrag nicht von einer',async()=>{
  // Vier Vorgaben zu etwas, das nicht existiert: „deckungsgleich mit der Bildvorschau", ein
  // Abschnitt „Feinschliff nach der Vorschau", eine Regel gegen Artefakte des Bildmodells und
  // eine Abnahme, die verlangte, die Vorschau-Richtung wiederzuerkennen.
  const ohne=await bau({__concept:{name:'Klar',mood:'ruhig',palette:['#fff'],headline:'H'}});
  for(const behauptung of [/deckungsgleich mit der Bildvorschau/,/FEINSCHLIFF NACH DER VORSCHAU/,/Vorschaubild/,/Vorschau-Richtung/,/Preview-Headline/])
    assert.doesNotMatch(ohne,behauptung,`spricht ohne Vorschau von einer: ${behauptung}`);
  assert.match(ohne,/## 7\. NACHGETRAGENE ÄNDERUNGEN/,'die Nummer bleibt - andere Stellen verweisen auf „Abschnitt 6" und „Abschnitt 9"');
  assert.match(ohne,/die gewählte Designrichtung im realen Layout klar wiederzuerkennen ist/);
  // Mit Vorschau kommen sie alle zurueck.
  const mit=await bau({__concept:{name:'Klar',mood:'ruhig',palette:['#fff'],headline:'H',previewImage:'data:image/png;base64,AA'}});
  for(const behauptung of [/deckungsgleich mit der Bildvorschau/,/FEINSCHLIFF NACH DER VORSCHAU/,/Vorschaubild/,/Vorschau-Richtung/,/Preview-Headline/])
    assert.match(mit,behauptung,`fehlt trotz Vorschau: ${behauptung}`);
});

test('die Abnahme verlangt nur Funktionen, die das Projekt hat',async()=>{
  const ohne=await bau({},{description:'Website für einen Dönerladen, Speisekarte und Öffnungszeiten zeigen',special:''});
  assert.match(ohne,/alle Buttons, Links und Navigationen im echten Ablauf funktionieren/);
  assert.doesNotMatch(ohne,/Formulare(?:, | und )CMS/,'ein Projekt ohne Formular und CMS wird nicht danach abgenommen');
  // „Speisekarte" darf keine Kartendarstellung ausloesen - dieselbe Wortgrenzen-Falle wie zuvor.
  assert.doesNotMatch(ohne,/die Kartendarstellung/);
  const mit=await bau({},{description:'Website mit Kontaktformular und Anfahrt über eine Karte',special:'das Team pflegt die Inhalte selbst per WordPress'});
  assert.match(mit,/Formulare/);
  assert.match(mit,/CMS-Inhalte/);
  assert.match(mit,/die Kartendarstellung/);
});

test('die Seitenliste ist verbindlich, der Seitenaufbau ist frei',async()=>{
  // Der Auftrag gab „Seitenstruktur" als Spielraum frei, waehrend SEITENSTRUKTUR.md sie
  // gleichzeitig verbindlich machte - ein Widerspruch mitten im selben Dokument.
  const api=await bauer();
  api.set(GRUND,KUNDE);
  const text=api.buildMasterPrompt(),struktur=api.structureDocument();
  assert.match(text,/Spielraum: der Aufbau innerhalb einer Seite/);
  assert.doesNotMatch(text,/Spielraum: Seitenstruktur/);
  assert.match(text,/Welche Seiten es gibt, ist dagegen entschieden/);
  assert.match(struktur,/Verbindlich ist die Liste der Seiten und ihre Pfade/);
  assert.doesNotMatch(struktur,/Die Pfade sind Vorschläge/,'einmal entschieden ist kein Vorschlag mehr');
});
