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
  // Kein Aspekt, kein Verbot, keine Seitenzahl - das steht alles in der Quellendatei.
  for(const doppelt of [/laden-aussen\.jpg/,/beispiel-referenz\.de/,/die Animationen/,/Übernehmen: Typografie/])
    assert.doesNotMatch(text,doppelt,`steht doppelt im Auftrag: ${doppelt}`);
  // Unterlagen sind die Ausnahme: ihr Auswertungsstand gehoert in den Auftrag, weil daran haengt,
  // ob ihr Inhalt als vorhanden gelten darf.
  assert.match(text,/## BEIGELEGTE UNTERLAGEN[\s\S]{0,200}speisekarte\.pdf/);
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
  for(const [platz,wort] of [[1,/Sicherheit sowie zwingende/],[2,/Die aktuelle ausdrückliche Entscheidung/],[3,/Die aktuell verifizierte Projektquelle/],[4,/Eine früher bestätigte Entscheidung/],[5,/Eine zulässige Ableitung/],[6,/Eine von Prompt\.ai vorgeschlagene/],[7,/Standard- und Rückfallregeln/]])
    assert.match(rang,new RegExp(`${platz}\\. ${wort.source}`),`Platz ${platz} fehlt oder steht falsch`);
  // Die Nutzerentscheidung steht ueber der Quelle - eine alte Nummer auf der Bestandsseite darf
  // eine aktuelle Angabe nicht ueberschreiben. Und der Konflikt wird benannt, nicht stillgelegt.
  assert.ok(rang.indexOf('ausdrückliche Entscheidung')<rang.indexOf('verifizierte Projektquelle'));
  assert.match(rang,/benenne den Widerspruch im Ergebnis mit beiden Werten und ihrer Herkunft/);
  assert.match(rang,/Sie wird nie zu einer Aussage über das Unternehmen/,'eine Ableitung steuert, sie behauptet nicht');
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

test('eine nur erwähnte Datei traegt kein Projektziel',async()=>{
  // „speisekarte.pdf liegt bei" und „Hauptziel: Speisekarte mit Preisen" standen nebeneinander,
  // ohne dass jemand prüfte, ob je ein Wort daraus gelesen wurde. Die bauende KI liest daraus:
  // die Speisen liegen vor. Tun sie nicht - und dann entstehen Gerichte und Preise aus dem Nichts.
  const ungelesen=await bau({documents:[{name:'speisekarte.pdf'}]},{goal:'Speisekarte mit Preisen zeigen'});
  assert.match(ungelesen,/## BEIGELEGTE UNTERLAGEN/);
  assert.match(ungelesen,/speisekarte\.pdf — Unterlage vorhanden, Inhalt noch nicht ausgewertet/);
  assert.match(ungelesen,/\*\*Ein Ziel dieses Projekts hängt daran\.\*\*/);
  assert.match(ungelesen,/CONTENT-BLOCKER: speisekarte\.pdf/);
  assert.match(ungelesen,/weder Positionen noch Preise noch Bezeichnungen/);
  // Ausgelesen ist dieselbe Datei eine Quelle und kein Blocker.
  const gelesen=await bau({documents:[{name:'speisekarte.pdf',text:'Döner 6,50 · Dürüm 7,00 · Falafel 6,00 · Ayran 1,50 · Pommes 3,00 · Salatteller 8,50 · alle Preise inklusive Mehrwertsteuer und Verpackung'}]},{goal:'Speisekarte mit Preisen zeigen'});
  assert.match(gelesen,/speisekarte\.pdf — ausgewertet/);
  assert.doesNotMatch(gelesen,/CONTENT-BLOCKER/);
  // Und eine Datei, an der kein Ziel haengt, ist ein Hinweis, kein Blocker.
  const nebensache=await bau({documents:[{name:'logo-entwurf.pdf'}]},{goal:'Öffnungszeiten zeigen'});
  assert.match(nebensache,/logo-entwurf\.pdf — Unterlage vorhanden, Inhalt noch nicht ausgewertet/);
  assert.doesNotMatch(nebensache,/CONTENT-BLOCKER/);
});

test('die Startseite gilt nicht als fehlend, wenn sie aus Fakten entstehen darf',async()=>{
  // „Aufbau aus Briefing und gesicherten Fakten ableiten" ist eine Anweisung, keine Luecke.
  // Beides nebeneinander hiess: bau ihn und liefere ihn nach.
  const api=await bauer();
  api.set(GRUND,KUNDE);
  const text=api.buildMasterPrompt(),struktur=api.structureDocument();
  assert.match(struktur,/Aufbau aus Briefing und gesicherten Fakten ableiten/,'die Erlaubnis steht weiter da');
  assert.doesNotMatch(text,/- Inhalt für „Startseite“/,'…und darf dann nicht zugleich als fehlend gelten');
  // Und die pauschale Zaehlung ist weg.
  assert.doesNotMatch(text,/Davon mit belegtem Inhalt/);
  assert.match(text,/Was auf welcher Seite belegt ist und was fehlt, steht dort einzeln/);
});

test('feste Pixelwerte gelten nur mit Vorlage, sonst bleiben die Regeln',async()=>{
  // Jedes Projekt bekam dieselben Zahlen - das ist eine Prompt.ai-Schablone, genau das, was die
  // Anti-Slop-Regeln verhindern sollen.
  const ohne=await bau({__concept:{name:'Klar',mood:'ruhig',palette:['#fff'],layoutVariant:'einspaltig'}});
  assert.match(ohne,/Regeln verbindlich, genannte Zahlen sind Richtwerte/);
  for(const zahl of [/96-120px/,/clamp\(38px/,/Richtwert 44-52px/,/Eckenradius 8-10px/])
    assert.doesNotMatch(ohne,zahl,`Schablonenwert ohne Vorlage: ${zahl}`);
  // Die Regeln und die Mindestwerte aus der Barrierefreiheit bleiben.
  assert.match(ohne,/Höhe mindestens 44px \(Tippfläche, nicht verhandelbar\)/);
  assert.match(ohne,/Fließtext 16-17px mit Zeilenhöhe 1\.55-1\.7 \(Lesbarkeit, nicht verhandelbar\)/);
  assert.match(ohne,/Konsistent heißt dasselbe System, nicht überall derselbe Abstand/);
  assert.doesNotMatch(ohne,/Hero plus zwei bis vier Bänder/,'die Anzahl der Bänder kommt aus dem Inhalt');
  // Mit freigegebener Referenz sind die Werte verbindlich.
  const mit=await bau({urls:[{url:'https://ref.de',aspects:['Typografie','Layout']}],
    __concept:{name:'Klar',mood:'ruhig',palette:['#fff'],layoutVariant:'einspaltig'}});
  assert.match(mit,/abgeleitet aus der freigegebenen Referenz/);
  assert.match(mit,/clamp\(38px/);
});

test('Ortsangaben bleiben an Belege gebunden',async()=>{
  const text=await bau();
  assert.match(text,/Erfinde keinen Kilometer-Radius, keine Nachbarorte, kein Einzugsgebiet/);
  assert.match(text,/wird daraus nicht „30 km rund um Stadthagen"/);
});

test('die Pruefung geht ueber alle drei Dateien, nicht nur ueber den Auftrag',async()=>{
  const app=await readFile(fileURLToPath(new URL('../app.js',import.meta.url)),'utf8');
  assert.match(app,/function crossFileBlock\(text\)/);
  assert.match(app,/const struktur=structureDocument\(\),quellen=attachmentPromptBlock\(\)/);
  assert.match(app,/NICHT DECKUNGSGLEICH ZWISCHEN DEN DATEIEN/);
  // Beide Pruefungen laufen, die alte bleibt erhalten.
  assert.match(app,/for\(const block of \[consistencyBlock\(text\),crossFileBlock\(text\)\]\)/);
  // Und im Normalfall meldet sie nichts - die drei Dateien kommen aus demselben Stand.
  const sauber=await bau();
  assert.doesNotMatch(sauber,/NICHT DECKUNGSGLEICH/);
});

// ── Regressionen, die der Auswertung nach erkannt werden müssen ───────────────────────────────

test('entschieden und empfohlen stehen nie gleichzeitig da',async()=>{
  const api=await bauer();api.set(GRUND,KUNDE);
  const struktur=api.structureDocument();
  assert.match(struktur,/^Pfad: \//m);
  assert.doesNotMatch(struktur,/Empfohlener Pfad/,'ein entschiedener Pfad ist kein Vorschlag');
  assert.doesNotMatch(struktur,/Die Pfade sind Vorschläge/);
});

test('eine nicht bestätigte Funktion kommt weder in die Seitenliste noch in die Abnahme',async()=>{
  // „Anfragen bekommen" ist ein Ziel, kein Formular. „Anmeldung mit E-Mail" ist ein Konto.
  const ohne=await bau({},{goal:'Anfragen für Dachsanierungen bekommen',description:'Dachdecker aus Osnabrück, bodenständig'});
  // Eine Kontaktseite entsteht nur, wenn es eine gibt - also mit ausgelesener Bestandsseite.
  const seite={url:'https://otte.de/kontakt',kind:'Kontakt',title:'Kontakt',
    summary:'Dachdeckerei Otte, Feldstr. 12 in 49074 Osnabrück. Rufen Sie an unter 0541 998877 oder schreiben Sie an buero@otte.de. Wir arbeiten seit 1987 im Familienbetrieb und decken Dächer in Stadt und Landkreis.'};
  const api=await bauer();
  api.set({...GRUND,sourceUrls:[{url:'https://otte.de',title:'Otte',links:[],pages:[seite]}]},
    {...KUNDE,goal:'Anfragen für Dachsanierungen bekommen',description:'Dachdecker aus Osnabrück',special:''});
  const kontakt=(api.structureDocument().match(/Der Weg zur Anfrage: [^\n]+/)||[])[0]||'';
  assert.match(kontakt,/Telefon und E-Mail/);
  // Vor dem Gedankenstrich stehen die Wege, dahinter die Warnung - im Weg selbst darf kein
  // Formular auftauchen, in der Warnung schon.
  assert.doesNotMatch(kontakt.split('—')[0],/Formular/,'kein Formular als Kontaktweg');
  assert.match(kontakt,/keine weiteren Wege ergänzen, insbesondere kein Formular/);
  assert.doesNotMatch(ohne,/und Formulare im echten Ablauf/,'kein Formular in der Abnahme');
  // Bestätigt kommt es sehr wohl vor.
  const mit=await bau({clarifications:[{question:'Kontakt?',answer:'Telefon und ein Kontaktformular'}]});
  assert.match(mit,/Formulare im echten Ablauf/);
  const api2=await bauer();
  api2.set({...GRUND,sourceUrls:[{url:'https://otte.de',title:'Otte',links:[],pages:[seite]}],
    clarifications:[{question:'Kontakt?',answer:'Telefon und ein Kontaktformular'}]},KUNDE);
  assert.match(api2.structureDocument(),/Der Weg zur Anfrage: [^\n]*Formular/);
});

test('ein vorhandener, nicht ausgelesener Anhang heisst nie „fehlt"',async()=>{
  const text=await bau({documents:[{name:'speisekarte.pdf'}]},{goal:'Speisekarte mit Preisen zeigen'});
  assert.match(text,/speisekarte\.pdf — Unterlage vorhanden, Inhalt noch nicht ausgewertet/);
  assert.doesNotMatch(text,/speisekarte\.pdf — Datei fehlt/);
  assert.doesNotMatch(text,/fordere die fehlende Datei im Ergebnis an/,'sie ist nicht fehlend, sondern unausgewertet');
  assert.match(text,/dass die vorhandene Unterlage noch ausgewertet werden muss/);
  // Wirklich fehlend ist etwas anderes, und dann steht auch etwas anderes da.
  const fehlt=await bau({documents:[{name:'speisekarte.pdf',present:false}]},{goal:'Speisekarte mit Preisen zeigen'});
  assert.match(fehlt,/speisekarte\.pdf — Datei fehlt/);
  assert.match(fehlt,/fordere die fehlende Datei im Ergebnis an/);
  // Und ein gescheiterter Leseversuch ist wieder etwas anderes.
  const kaputt=await bau({documents:[{name:'speisekarte.pdf',parseError:'kein Text'}]},{goal:'Speisekarte mit Preisen zeigen'});
  assert.match(kaputt,/speisekarte\.pdf — Auswertung fehlgeschlagen/);
});

test('eine schwach belegte Ableitung erreicht den Auftrag nicht',async()=>{
  // Aus „bestellt wird telefonisch" wurde „Kein Lieferdienst, Abholung vor Ort". Eine Kennzeichnung
  // hilft nur, wenn sie gelesen wird - eine Aussage, die nicht dasteht, kann niemand übernehmen.
  const schwach=await bau({projectReview:{questions:[],differentiation:'Kein Lieferdienst, Abholung vor Ort',situations:[]},
    clarifications:[{question:'Bestellung?',answer:'bestellt wird telefonisch'}]});
  assert.doesNotMatch(schwach,/Kein Lieferdienst/);
  assert.doesNotMatch(schwach,/Abgrenzung zum Üblichen/);
  // Eine Abgrenzung, die im Belegten steht, kommt durch.
  const belegt=await bau({projectReview:{questions:[],differentiation:'Frisch zubereitet, kein Lieferdienst',situations:[]}},
    {description:'Dönerladen in Stadthagen, alles frisch zubereitet, kein Lieferdienst, nur Abholung'});
  assert.match(belegt,/Abgrenzung zum Üblichen/);
  assert.match(belegt,/Frisch zubereitet, kein Lieferdienst/);
  // Eine Nutzungssituation behauptet nichts über den Betrieb und braucht keinen Beleg.
  const nutzung=await bau({projectReview:{questions:[],situations:['Abends schnell nachsehen, ob noch offen ist']}});
  assert.match(nutzung,/Abends schnell nachsehen/);
  // Kippt sie ins Geschäftliche, gilt derselbe Maßstab.
  const kippt=await bau({projectReview:{questions:[],situations:['Kunden bestellen per Lieferdienst nach Hause']}});
  assert.doesNotMatch(kippt,/Lieferdienst nach Hause/);
});

test('universelle Designregeln erzwingen kein Inhaltsraster',async()=>{
  const text=await bau({__concept:{name:'Klar',mood:'ruhig',palette:['#fff'],layoutVariant:'einspaltig'}});
  // Der Seitencharakter beschreibt die Anmutung, nicht das Raster jedes Inhalts.
  assert.match(text,/Seitencharakter: einspaltig/);
  assert.doesNotMatch(text,/^Komposition: /m);
  assert.match(text,/Strukturierte Inhalte \(Preis- und Leistungslisten, Speisekarten[^)]*\) dürfen auf breiten Bildschirmen ein passendes Raster nutzen/);
  // Abstände sind ein System, keine Gleichmacherei.
  assert.doesNotMatch(text,/Der Abstand ist über alle Abschnitte derselbe/);
  assert.match(text,/Konsistent heißt dasselbe System, nicht überall derselbe Abstand/);
  assert.match(text,/richtet sich nach Zusammengehörigkeit und Hierarchie/);
});

test('das Zustandsmodell haelt ueber verschiedene Branchen',async()=>{
  // Nicht weiter auf ein Beispiel hin optimieren: vier deutlich verschiedene Projektarten, und
  // in keiner darf der Auftrag sich selbst widersprechen.
  const FAELLE=[
    ['Kanzlei ohne Quelle',{},{name:'Kanzlei Reimers',type:'Website',goal:'Leistungen zeigen',audience:'Selbstständige',
      description:'Steuerkanzlei in Hannover, seriös und zurückhaltend',special:'',client:{name:'Kanzlei Reimers',type:'Kunde'}}],
    ['Handwerk mit Bestandsseite',{sourceUrls:[{url:'https://otte.de',title:'Otte',links:[],pages:[{url:'https://otte.de/kontakt',kind:'Kontakt',title:'Kontakt',
      summary:'Dachdeckerei Otte, Feldstr. 12 in 49074 Osnabrück. Rufen Sie an unter 0541 998877 oder schreiben Sie an buero@otte.de. Geöffnet Mo-Fr 7-16 Uhr. Wir arbeiten seit 1987 im Familienbetrieb.'}]}]},
      {name:'Dachdeckerei Otte',type:'Website',goal:'Anfragen bekommen',audience:'Hausbesitzer',description:'Dachdecker aus Osnabrück',special:'',client:{name:'Otte',type:'Kunde',website:'https://otte.de'}}],
    ['Web-App ohne Ort',{outputTarget:'next-vercel'},{name:'Schichtplaner',type:'Web-App',goal:'Schichten planen',audience:'Pflegeteams',
      description:'Interne Anwendung zur Schichtplanung, sachlich, viel Tabelle',special:'',client:{name:'Klinikum Nord',type:'Kunde'}}],
    ['Verein, fast nichts angegeben',{},{name:'Turnverein',type:'Website',goal:'',audience:'',description:'Seite für unseren Turnverein',special:'',client:{}}]
  ];
  for(const [name,zustand,kunde] of FAELLE){
    const api=await bauer();
    api.set({...GRUND,...zustand},{...KUNDE,...kunde});
    const text=api.buildMasterPrompt(),struktur=api.structureDocument();
    assert.doesNotMatch(text,/undefined|\[object Object\]/,`${name}: undefined im Auftrag`);
    assert.doesNotMatch(struktur,/undefined/,`${name}: undefined in der Seitenliste`);
    assert.doesNotMatch(struktur,/Empfohlener Pfad/,`${name}: entschieden und empfohlen zugleich`);
    assert.doesNotMatch(text,/Vorschau/,`${name}: spricht ohne Bild von einer Vorschau`);
    assert.doesNotMatch(text,/NICHT DECKUNGSGLEICH/,`${name}: die drei Dateien widersprechen sich`);
    const genannt=Number((text.match(/Seiten: genau (\d+)/)||[])[1]||0);
    const gelistet=(struktur.match(/^## \d+\. /gm)||[]).length;
    assert.equal(genannt,gelistet,`${name}: Auftrag nennt ${genannt} Seiten, die Liste ${gelistet}`);
    assert.match(text,/## RANGFOLGE BEI WIDERSPRUCH/,`${name}: ohne Rangfolge`);
  }
});

test('eine angesagte Telefonnummer gilt als gefunden, eine Jahreszahl nicht',async()=>{
  const seite=(satz)=>({url:'https://otte.de/kontakt',kind:'Kontakt',title:'Kontakt',
    summary:`Dachdeckerei Otte, Feldstr. 12 in 49074 Osnabrück. ${satz} Wir arbeiten seit 1987 im Familienbetrieb und decken Dächer in Stadt und Landkreis, seit vielen Jahren am selben Ort.`});
  for(const satz of ['Rufen Sie an unter 0541 998877.','Sie erreichen uns unter 0541 998877.','Tel.: 0541 998877.']){
    const text=await bau({sourceUrls:[{url:'https://otte.de',title:'Otte',links:[],pages:[seite(satz)]}]});
    assert.match(text,/- Telefon: 0541 998877/,`nicht gefunden in: ${satz}`);
  }
  // Ohne Ansagewort bleibt eine Zahlenfolge eine Zahlenfolge.
  const ohne=await bau({sourceUrls:[{url:'https://otte.de',title:'Otte',links:[],pages:[seite('Preise ab 1200 Euro pro Dach.')]}]});
  assert.match(ohne,/- Telefon: nicht in den Quellen gefunden/);
});

test('beim Wiederherstellen läuft die Master-KI nicht los',async()=>{
  // #stepPrompt trägt „active" auch dann noch, wenn die App gerade erst startet und den letzten
  // Stand wiederherstellt - der Ablauf liegt dabei hinter der Startseite. Seit das Feld leer
  // bleibt, solange die KI schreibt, sah man das: direkt nach „Arbeitsbereich wird vorbereitet"
  // kam „Dein Master-Prompt entsteht", für ein Projekt, das niemand aufgerufen hatte. Und die KI
  // lief dabei wirklich los, auf Rechnung.
  const app=await readFile(fileURLToPath(new URL('../app.js',import.meta.url)),'utf8');
  assert.match(app,/const masterSichtbar=\(\)=>\{/);
  assert.match(app,/return Boolean\(app&&!app\.hidden&&step&&step\.classList\.contains\('active'\)\)/,'sichtbar heißt: Ablauf offen und Schritt 8 aktiv');
  // Beide Wege prüfen es: der, der entscheidet ob das Feld leer bleibt, und der, der die KI startet.
  assert.match(app,/const willMasterAiWrite=\(\)=>masterSichtbar\(\)&&cloudReady\(\)/);
  assert.match(app,/if\(!masterSichtbar\(\)\|\|!cloudReady\(\)\|\|masterAiRunning\)return;/);
  // Ohne sichtbaren Ablauf bleibt es beim alten Verhalten: zusammensetzen, anzeigen, fertig.
  assert.match(app,/if\(!kiAmWerk\)el\.masterPrompt\.value=written\|\|prompt;/);
});
