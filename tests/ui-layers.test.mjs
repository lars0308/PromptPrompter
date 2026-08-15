// Die Oberflaechen-Ebenen lagen als vierunddreissig Textbloecke in ihren JavaScript-Dateien und
// wurden beim Start einzeln in den Kopf gehaengt. Jetzt stehen sie in promptai-ui-layers.css.
// Was dabei nicht verrutschen darf, prueft diese Datei: die Reihenfolge (sie entscheidet, welche
// Regel gewinnt), die Vollstaendigkeit (jeder Abschnitt ist noch da) und dass keine Datei ihren
// Block heimlich wieder selbst einhaengt - sonst hat eine Regel ploetzlich zwei Herkuenfte.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as csstree from 'css-tree';

const read=name=>readFile(new URL(`../${name}`,import.meta.url),'utf8');

// Reihenfolge wie frueher im Browser: erst die drei Dateien aus index.html, dann die Liste aus
// admin-console.js. Ein Eintrag darf umbenannt, aber nicht verschoben werden.
const SECTIONS=[
  'entry-gate-ui.js','legal-pages.js','admin-console.js','admin-console.js',
  'mode-handoff-fix.js','transition-polish.js','ui-regression-fixes.js','project-start-ui.js',
  'stability-ui.js','mode-flow-ui.js','product-polish.js','workflow-cleanup.js',
  'free-prompt-ui.js','free-prompt-presets.js','home-entry-ui.js','website-build-ui.js',
  'project-extras-ui.js','welcome-intro-ui.js','project-context-ui.js','flow-guards-ui.js',
  'settings-connections-ui.js','streamlined-project-flow.js','guided-clean-ui.js',
  'unified-ui-v1.js','subscription-ui.js','usage-quota-ui.js','ux-stability-fix.js',
  'ui-polish-final.js','ui-final-touch.js','promptai-experience-v1.js','promptai-loading-v2.js',
  'promptai-experience-v2.js','promptai-home-final.js','promptai-nav-drawer.js'
];

test('die zusammengefuehrten Ebenen stehen in der Reihenfolge, in der sie frueher eingehaengt wurden',async()=>{
  const css=await read('promptai-ui-layers.css');
  const found=[...css.matchAll(/\/\* ===== (\S+) · #(\S+) ===== \*\//g)].map(m=>m[1]);
  assert.deepEqual(found,SECTIONS);
});

test('die zusammengefuehrten Ebenen sind fuer den Browser lesbar',async()=>{
  const css=await read('promptai-ui-layers.css');
  const errors=[];
  const ast=csstree.parse(css,{positions:true,onParseError:e=>errors.push(`${e.message} (Zeile ${e.line})`)});
  assert.deepEqual(errors,[],errors.join('\n'));
  let rules=0;csstree.walk(ast,node=>{if(node.type==='Rule')rules++});
  // Eine nicht geschlossene Regel verschluckt alles danach, ohne dass der Browser meckert - genau
  // so war eine ganze Ebene in mode-handoff-fix.js jahrelang unwirksam. Die Untergrenze faellt auf.
  assert.ok(rules>1200,`nur ${rules} Regeln - da wurde etwas verschluckt`);
});

// Bloecke, die sich zur Laufzeit aus gemessenen Werten aufbauen, gehoeren weiter in ihre Datei -
// eine feste Datei kann keine Bildschirmbreite kennen. Sie duerfen nur nicht denselben Namen tragen.
test('keine Datei haengt ihre zusammengefuehrte Ebene noch einmal selbst ein',async()=>{
  const css=await read('promptai-ui-layers.css');
  const merged=[...css.matchAll(/\/\* ===== \S+ · #(\S+) ===== \*\//g)].map(m=>m[1]);
  for(const file of new Set(SECTIONS)){
    const source=await read(file);
    for(const id of merged)
      assert.ok(!source.includes(`'${id}'`),`${file} haengt #${id} wieder selbst ein`);
  }
});

test('die Ebenen laden zwischen dem Startschutz und dem vollen Design',async()=>{
  const html=await read('index.html');
  const boot=html.indexOf('id="promptBootShieldStyle"');
  const layers=html.indexOf('promptai-ui-layers.css');
  assert.ok(html.indexOf('styles.css')<boot,'styles.css gehoert vor den Startschutz');
  assert.ok(boot<layers,'die Ebenen gehoeren hinter den Startschutz');
  assert.ok(layers<html.indexOf('admin-console.js'),'die Ebenen gehoeren vor die Skripte');
  const design=await read('promptai-full-app-design.js');
  assert.match(design,/promptai-full-app-design\.css/);
});

test('der Offline-Vorrat kennt die neue Datei',async()=>{
  const worker=await read('sw.js');
  assert.match(worker,/'\/promptai-ui-layers\.css'/);
});

// Der Startschutz greift, bevor irgendein Skript laeuft: er versteckt Tarif- und Konto-Elemente,
// solange nicht feststeht, was der Kunde gebucht hat. Frueher kam er aus admin-console.js.
test('der Startschutz fuer noch unbekannte Tarife steht in den Ebenen',async()=>{
  const css=await read('promptai-ui-layers.css');
  for(const rule of ['html.prompt-access-pending #upgradeBtn','html.prompt-route-pending #promptModeHandoff'])
    assert.ok(css.includes(rule),rule);
});

// Wer hier tippt, baut das Projekt - er ist nicht der Betrieb, um den es geht. Die Verkaufstexte
// versprachen lange Handwerksbetriebe, waehrend die Ausgabe ein ZIP mit CLAUDE.md und Cursor-Rules
// ist. Wer das verwerten kann, ist Entwickler oder Agentur; die Texte sagen das jetzt.
test('die Verkaufstexte sprechen die an, die die Ausgabe auch benutzen koennen',async()=>{
  const html=await read('index.html'),gate=await read('entry-gate-ui.js');
  assert.match(html,/FÜR ALLE, DIE MIT KI BAUEN/);
  assert.match(html,/class="auth-lede"/);
  assert.match(html,/Für Entwickler, Web-Agenturen/);
  assert.match(await read('promptai-ui-layers.css'),/\.auth-lede\{/,'sonst steht der Satz ohne Gestaltung da');
  // Die Branchenvielfalt bleibt - sie fuettert die Branchenerkennung. Nur die Sicht wechselt.
  assert.match(gate,/Kundenprojekt: Dachdecker in Lindhorst/);
  assert.match(gate,/Internes Werkzeug für unser Team/);
  assert.match(gate,/In deiner KI weiterbauen/,'der letzte Beleg nennt das Werkzeug, nicht die Website');
  assert.doesNotMatch(gate,/\{head:'Dönerladen/,'kein Beispiel mehr aus der Sicht des Betriebs');
});

// Die Tarif-Ansicht ist ein Pruefwerkzeug des Betreibers. Im Hauptmenue stand sie zwischen
// Bibliothek und Abonnement - dort, wo jeder andere Eintrag zu einer Funktion des Produkts fuehrt.
test('die Tarif-Ansicht steht in der Verwaltung, nicht im Hauptmenue',async()=>{
  const preview=await read('plan-preview-ui.js');
  assert.match(preview,/\$\('\[data-admin-pane="overview"\]'\)/);
  assert.doesNotMatch(preview,/const menu=\$\('#topbarMenu'\);if\(!menu/,'nicht mehr ans Menue gehaengt');
  assert.match(preview,/function dropOldMenuRow\(\)/,'eine zwischengespeicherte Fassung darf keinen zweiten Eintrag stehen lassen');
  assert.match(preview,/if\(!isOwner\(\)\)return;/,'weiterhin nur fuer das Betreiberkonto');
});
