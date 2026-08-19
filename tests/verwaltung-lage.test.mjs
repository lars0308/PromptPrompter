import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

// Der Statusblock beantwortet drei Fragen, die man beim Öffnen der Verwaltung hat. Ob er das tut,
// zeigt sich nicht am Quelltext, sondern am erzeugten Kasten - also wird er wirklich gebaut.
async function lageBauen(){
  const src=await readFile(fileURLToPath(new URL('../admin-console-core.js',import.meta.url)),'utf8');
  const von=src.indexOf('  const heuteAb=()=>'),bis=src.indexOf('  function render(){lage()');
  assert.ok(von>=0&&bis>von,'der Lageblock muss auffindbar bleiben');
  const knoten=()=>{
    const kind={id:'',className:'',innerHTML:'',children:[],parentElement:null,
      appendChild(n){this.children.push(n);n.parentElement=this;return n},
      insertBefore(n){this.children.unshift(n);n.parentElement=this;return n}};
    return kind;
  };
  const stats=knoten(),wurzel=knoten();wurzel.appendChild(stats);
  let block=null;
  const kopf=`
let state={data:null};
const ui={stats:STATS};
const esc=v=>String(v??'');
const date=v=>v?'Zeitpunkt':'–';
const $=sel=>sel==='#adminLage'?BLOCK():null;
const document={createElement:()=>NEU()};
`;
  const bauen=new Function('STATS','BLOCK','NEU','window',`${kopf}${src.slice(von,bis)}\nreturn {lage,setze:d=>{state.data=d}};`);
  const api=bauen(stats,()=>block,()=>{block=knoten();return block},globalThis);
  return {api,get block(){return block}};
}
const heute=()=>new Date().toISOString();

test('die Verwaltung zeigt oben, ob alles läuft, was der Tag kostet und was kaputt ist',async()=>{
  const h=await lageBauen(),api=h.api;
  globalThis.PromptAiSystemAI={profiles:[
    {enabled:true,lastTestAt:heute(),lastTestOk:true},
    {enabled:true,lastTestAt:heute(),lastTestOk:true},
    {enabled:true}
  ]};
  api.setze({usage:[
    {action:'master-prompt',provider:'gateway',success:true,total_tokens:1200,created_at:heute()},
    {action:'review',provider:'gateway',success:true,total_tokens:300,created_at:heute()},
    {action:'preview-image',provider:'gemini',success:false,created_at:heute()}
  ],support:[{status:'open'},{status:'closed'}]});
  api.lage();
  const html=h.block.innerHTML;
  assert.match(html,/KI-Kette[\s\S]{0,120}2 von 3/,'erreichbar von aktiv');
  assert.match(html,/1 noch nie getestet/,'…und der Hinweis, wie man das füllt');
  assert.match(html,/Heute[\s\S]{0,120}3 Aufrufe/);
  assert.match(html,/1\.500 Tokens/,'die Tokens des Tages, nicht die aller Zeiten');
  assert.match(html,/Fehler heute[\s\S]{0,80}<strong>1<\/strong>/);
  assert.match(html,/Support[\s\S]{0,80}<strong>1<\/strong>/,'geschlossene Anfragen zählen nicht mit');
  assert.match(html,/Letzter Fehler[\s\S]{0,120}preview-image/);
  // Die Farbe traegt die Aussage.
  assert.match(html,/admin-lage-karte is-warn[\s\S]{0,200}KI-Kette/);
  assert.match(html,/admin-lage-karte is-bad[\s\S]{0,200}Fehler heute/);
});

test('ohne Zwischenfälle meldet der Statusblock Ruhe',async()=>{
  const h=await lageBauen(),api=h.api;
  globalThis.PromptAiSystemAI={profiles:[{enabled:true,lastTestAt:heute(),lastTestOk:true}]};
  api.setze({usage:[],support:[]});
  api.lage();
  const html=h.block.innerHTML;
  assert.match(html,/alle geprüft und erreichbar/);
  assert.match(html,/nichts fehlgeschlagen/);
  assert.match(html,/nichts offen/);
  assert.doesNotMatch(html,/Letzter Fehler/,'ohne Fehler keine Fehlerkarte');
});

test('ein Aufruf von gestern zählt nicht zum heutigen Verbrauch',async()=>{
  const h=await lageBauen(),api=h.api;
  globalThis.PromptAiSystemAI={profiles:[]};
  const gestern=new Date(Date.now()-36*3600*1000).toISOString();
  api.setze({usage:[{action:'master-prompt',success:true,total_tokens:9999,created_at:gestern}],support:[]});
  api.lage();
  assert.match(h.block.innerHTML,/Heute[\s\S]{0,120}0 Aufrufe/);
  assert.doesNotMatch(h.block.innerHTML,/9\.999/);
});

test('die KI-Liste ist eingeklappt und lässt sich in einem Zug testen',async()=>{
  const studio=await readFile(fileURLToPath(new URL('../system-ai-studio.js',import.meta.url)),'utf8');
  // Siebzehn aufgeklappte Kacheln sind am Handy eine Wand - dieselbe Erfahrung wie bei den
  // Benutzerkonten, die aus demselben Grund schon eingeklappt sind.
  assert.match(studio,/<details class="system-ai-row"><summary class="system-ai-row-kopf">/);
  assert.match(studio,/system-ai-row-punkt\$\{punkt\}/,'der Statuspunkt steht in der Zeile, nicht erst im Aufklapper');
  assert.doesNotMatch(studio,/<article class="system-ai-row">/);
  // Bei den meisten Eintraegen stand „Noch nicht getestet" - weil Testen nur einzeln ging.
  assert.match(studio,/id="systemAiTestAll">Alle testen</);
  assert.match(studio,/async function testAll\(\)/);
  assert.match(studio,/for\(const \[nummer,p\] of profiles\.entries\(\)\)/,'nacheinander, sonst laufen die Aufrufe in die Ratengrenze');
  assert.match(studio,/erreichbar\.\$\{schlecht\.length\?/,'am Ende steht, was nicht erreichbar war');
});
