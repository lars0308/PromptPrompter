import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {GRUND,FAELLE} from './fixtures/projekttypen.mjs';

// Zehn deutlich verschiedene Projekte, gegen dieselben Regeln.
//
// Der Zweck ist nicht, jeden einzelnen Prompt schön zu machen, sondern zu sehen, ob die
// Zustandsauflösung über Branchen und Projektarten hinweg gleich sauber arbeitet. Zwei Fehler in
// der Funktionserkennung sind erst hier aufgefallen: „ich möchte kein Kontaktformular" schaltete
// das Formular ein, und „Kundenkonto" wurde nicht erkannt, weil \bkonto\b an einer deutschen
// Zusammensetzung scheitert. Am Döner-Beispiel allein wäre beides nie aufgefallen.
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
  return new Function(kopf+teil+'\nreturn {set:(s,p)=>{state=s;PROJEKT=p},buildMasterPrompt,structureDocument,attachmentPromptBlock};')();
}
// Dieselbe Verneinungsprüfung wie im Produkt - sonst prüft der Test eine andere Regel als die gilt.
const VERNEINUNG=/\b(kein|keine|keinen|keiner|keines|nicht|ohne|nie|niemals|möchte[nt]?\s+kein\w*)\b[^.!?;]{0,45}$/i;
const gewuenscht=(text,muster)=>{muster.lastIndex=0;let tr;while((tr=muster.exec(text))){if(!VERNEINUNG.test(text.slice(Math.max(0,tr.index-70),tr.index)))return true}return false};

const UNIVERSELL=[
 ['State','kein undefined im Auftrag',(m)=>!/undefined|\[object Object\]/.test(m)],
 ['State','kein undefined in der Seitenliste',(m,s)=>!/undefined/.test(s)],
 ['State','ein Pfad ist nicht zugleich empfohlen',(m,s)=>!/Empfohlener Pfad/.test(s)],
 ['State','keine Vorschau ohne Bild',(m,s,q,z)=>!/Vorschau/.test(m)||Boolean(z.__concept?.previewImage)],
 ['Quellen','die Rangfolge steht im Auftrag',(m)=>/## RANGFOLGE BEI WIDERSPRUCH/.test(m)],
 ['Quellen','die Ableitungsgrenze steht drin',(m)=>/Ableitungen bleiben Ableitungen/.test(m)],
 ['Quellen','Rechtstexte bleiben unverändert',(m)=>/unverändert übernommen/.test(m)],
 ['Struktur','Auftrag und Seitenliste nennen dieselbe Zahl',(m,s)=>{
    const a=Number((m.match(/Seiten: genau (\d+)/)||[])[1]||0),b=(s.match(/^## \d+\. /gm)||[]).length;return a===b}],
 ['Struktur','die drei Dateien widersprechen sich nicht',(m)=>!/NICHT DECKUNGSGLEICH/.test(m)],
 ['Struktur','Seitenliste verbindlich, Aufbau frei',(m)=>/Spielraum: der Aufbau innerhalb einer Seite/.test(m)],
 ['Design','keine Schablonenwerte ohne Vorlage',(m,s,q,z)=>{
    const vorlage=Boolean(z.__concept?.previewImage)||(z.urls||[]).some(u=>(u.aspects||[]).some(a=>/layout|typografie|schrift|raster|abstand|aufbau/i.test(a)));
    return vorlage||!/clamp\(38px|96-120px|Richtwert 44-52px/.test(m)}],
 ['Design','keine mechanische Abstandsgleichheit',(m)=>!/Der Abstand ist über alle Abschnitte derselbe/.test(m)],
 ['Recht','keine Konformitätsbehauptung',(m)=>!/ist rechtskonform|entspricht der DSGVO|rechtssicher/i.test(m)],
 ['Funktion','die Abnahme prüft nur echte Funktionen',(m,s,q,z)=>{
    const text=[z.__kunde?.description,z.__kunde?.special,z.__kunde?.goal,...(z.clarifications||[]).map(x=>x.answer||'')].join(' ').toLowerCase();
    const zeile=(m.match(/\d+\. .*im echten Ablauf funktionieren,/)||[''])[0];
    if(/Formulare/.test(zeile)&&!gewuenscht(text,/kontaktformular|anfrageformular|\bformular\b|newsletter/gi))return false;
    if(/Anmeldung und Konten/.test(zeile)&&!gewuenscht(text,/\w*konto\b|\w*konten\b|anmeldung|registrierung|\blogin\b/gi))return false;
    if(/CMS-Inhalte/.test(zeile)&&!gewuenscht(text,/sanity|wordpress|webflow|\bcms\b|selbst pflegen/gi))return false;
    return true}]
];

for(const fall of FAELLE)
  test(`Projekttyp ${fall.id}: ${fall.name}`,async()=>{
    const api=await bauer();
    const zustand={...GRUND,...fall.zustand,__kunde:fall.kunde};
    api.set(zustand,fall.kunde);
    const m=api.buildMasterPrompt(),s=api.structureDocument(),q=api.attachmentPromptBlock();
    for(const [klasse,name,regel] of UNIVERSELL)assert.ok(regel(m,s,q,zustand),`[${klasse}] ${name}`);
    for(const [name,regel] of fall.pruefe)assert.ok(regel(m,s,q),`[Fall] ${name}`);
  });

test('Konflikt: aktuelle Nutzerangabe gegen alte Websitequelle',async()=>{
  const api=await bauer();
  api.set({...GRUND,sourceUrls:[{url:'https://praxis.de',title:'P',links:[],pages:[{url:'https://praxis.de/kontakt',kind:'Kontakt',title:'Kontakt',
      summary:'Praxis Dr. Müller, Ringstr. 8 in 38100 Braunschweig. Telefon 0531 776655. Geöffnet Mo-Fr 8-12 Uhr und Do 15-18 Uhr, seit 2004 in Braunschweig am selben Standort.'}]}],
    clarifications:[{question:'Stimmen die Öffnungszeiten noch?',answer:'nein, donnerstags haben wir inzwischen geschlossen'}],
    projectReview:{questions:[{question:'Stimmen die Öffnungszeiten noch?'}]}},
    {name:'Praxis',type:'Website',goal:'Sprechzeiten zeigen',audience:'Patienten',description:'Hausarztpraxis',special:'',client:{website:'https://praxis.de'}});
  const m=api.buildMasterPrompt();
  assert.match(m,/donnerstags haben wir inzwischen geschlossen/,'die Nutzerangabe steht als Festlegung da');
  assert.match(m,/Do 15-18 Uhr/,'die Quellenangabe bleibt sichtbar, statt still verworfen zu werden');
  assert.ok(m.indexOf('ausdrückliche Entscheidung')<m.indexOf('verifizierte Projektquelle'),'Nutzer vor Quelle');
  assert.match(m,/benenne den Widerspruch im Ergebnis mit beiden Werten/,'…und der Konflikt wird benannt, nicht still aufgelöst');
});

test('Konflikt: Nutzerwunsch begrenzt die Referenz',async()=>{
  const api=await bauer();
  api.set({...GRUND,urls:[{url:'https://vorbild.de',aspects:['Typografie'],like:'die Schrift',dislike:'das Layout'}],
    __concept:{name:'Ruhig',mood:'ruhig',palette:['#fff','#111'],layoutVariant:'einspaltig'}},
    {name:'Immo',type:'Website',goal:'Objekte zeigen',audience:'Käufer',description:'Immobilienbüro, sachlich',special:'',client:{}});
  const m=api.buildMasterPrompt();
  assert.match(m,/Übernimm nur die jeweils ausgewählten Aspekte/);
  assert.doesNotMatch(m,/das Layout/,'die Referenzinhalte bleiben in der Quellendatei');
  assert.match(m,/abgeleitet aus der freigegebenen Referenz/,'die Werte gelten, weil Typografie freigegeben ist');
});

test('Konflikt: Barrierefreiheit schlägt den Farbwunsch',async()=>{
  const api=await bauer();
  api.set({...GRUND,__concept:{name:'Hell',mood:'ruhig',palette:['#ffffff','#f2f2f2'],layoutVariant:'einspaltig'}},
    {name:'Laden',type:'Website',goal:'informieren',audience:'alle',description:'Website ganz in weiß, sehr hell',special:'',client:{}});
  const m=api.buildMasterPrompt();
  assert.match(m,/Dazu zählt die Barrierefreiheit/);
  assert.ok(m.indexOf('1. Sicherheit sowie zwingende')<m.indexOf('5. Eine zulässige Ableitung'));
  assert.match(m,/in Sättigung oder Helligkeit angepasst, statt den Kontrast zu unterschreiten/);
  assert.match(m,/ganz in weiß/,'der Wunsch selbst bleibt erhalten');
});

test('Regression: nach der Quellenauswertung steht nirgends mehr „URL fehlt"',async()=>{
  const frage='Gibt es schon eine Website?';
  const api=await bauer();
  api.set({...GRUND,projectReview:{questions:[{question:frage}],notes:[{area:'Quelle',message:'Es ist keine Website hinterlegt.',kind:'warning'}]},
    clarifications:[{question:frage,answer:'https://laden.de'}],
    sourceUrls:[{url:'https://laden.de',title:'L',links:[],pages:[{url:'https://laden.de/kontakt',kind:'Kontakt',title:'Kontakt',
      summary:'Laden Meyer, Hauptstr. 5 in 31655 Stadthagen. Telefon 05721 4433. Geöffnet Mo-Fr 9-18 Uhr, wir führen Haushaltswaren, Geschenke und Küchenbedarf seit vielen Jahren am selben Ort.'}]}]},
    {name:'Laden',type:'Website',goal:'informieren',audience:'alle',description:'Haushaltswarenladen',special:'',client:{website:'https://laden.de'}});
  const m=api.buildMasterPrompt();
  assert.doesNotMatch(m,/keine Website hinterlegt|Quelle noch liefern|Link fehlt/i);
  assert.match(m,/Quelle: https:\/\/laden\.de/,'die gelieferte URL gilt als Festlegung');
  assert.match(m,/- Telefon: 05721 4433/,'die Fakten aus der Quelle sind da');
  assert.doesNotMatch(m,/Noch offen[\s\S]{0,200}Website/,'die beantwortete Frage kommt nicht zurück');
});
