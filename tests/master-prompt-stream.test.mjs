import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

// Der Streamweg lässt sich nicht am Quelltext ablesen: was zählt, ist, was beim Browser ankommt und
// in welcher Reihenfolge. Also wird er hier wirklich ausgeführt - mit gestellten Nachbarmodulen und
// einem Anbieter, der echtes SSE spricht.
const require=createRequire(import.meta.url);
function stelle(name,exports){
  const datei=require.resolve(name);
  require.cache[datei]={id:datei,filename:datei,path:datei,loaded:true,exports,children:[],paths:[]};
}

let profile=[],budget={exhausted:false},plan='pro',schluessel={key:'geheim',defaultModel:''},protokoll=[];
stelle('../server/provider-key.js',{resolveProviderKey:async()=>schluessel});
stelle('../server/entitlements.js',{getEntitlements:async()=>({plan,isAdmin:false})});
stelle('../server/quota.js',{getTokenBudget:async()=>budget});
stelle('../server/system-ai-profiles.js',{listProfiles:async(task,opt)=>{protokoll.push({task,plan:opt?.plan,providers:opt?.providers});return profile}});
stelle('../server/prompt-templates.js',{primePromptTemplates:async()=>{}});
stelle('../server/usage.js',{logUsage:async()=>{}});
stelle('../server/generate-core.js',Object.assign(async()=>{},{
  makeMasterPromptPrompt:({assembled})=>`VORLAGE\n${assembled}\n\nGib ausschließlich das verlangte JSON zurück: {"prompt":"<der fertige Master-Prompt>"}.`
}));
const {default:masterPromptStream}=await import('../server/master-prompt-stream.js');

function sse(...stuecke){
  const zeilen=[...stuecke.map(s=>`data: ${JSON.stringify({choices:[{delta:{content:s}}]})}\n\n`),'data: [DONE]\n\n'];
  return new ReadableStream({start(c){for(const z of zeilen)c.enqueue(new TextEncoder().encode(z));c.close()}});
}
function antwortEnde(){
  const teile=[];let kopf={},status=0,beendet=false;
  return {res:{
    headersSent:false,statusCode:0,
    setHeader(k,v){kopf[k]=v},flushHeaders(){this.headersSent=true},
    write(t){this.headersSent=true;teile.push(t);return true},
    end(){beendet=true;return this},
    status(code){status=code;this.statusCode=code;return this},
    json(daten){status=status||200;kopf.json=daten;beendet=true;return this}
  },get text(){return teile.join('')},get stuecke(){return teile.length},get kopf(){return kopf},get status(){return status},get beendet(){return beendet}};
}
const auftrag='x'.repeat(600);

test('the stream hands the text through in pieces instead of one block',async()=>{
  profile=[{id:'a',provider:'gateway',model:'openai/gpt-5.4',label:'Pro',enabled:true}];
  const rufe=[];
  global.fetch=async(url,opt)=>{rufe.push({url,body:JSON.parse(opt.body)});return {ok:true,body:sse('# Auftrag\n','Website für ','ein Kosmetikstudio.')}};
  const ende=antwortEnde();
  await masterPromptStream({body:{assembled:auftrag,project:{name:'Test'}}},ende.res);
  assert.equal(ende.text,'# Auftrag\nWebsite für ein Kosmetikstudio.');
  assert.equal(ende.stuecke,3,'three deltas must arrive as three writes, not as one');
  assert.equal(rufe[0].body.stream,true,'the provider must be asked for a stream');
  assert.equal(rufe[0].body.model,'openai/gpt-5.4','the profile decides the model');
  assert.match(String(ende.kopf['Content-Type']),/text\/plain/);
  assert.equal(ende.kopf['X-Accel-Buffering'],'no','buffering would collect the answer and defeat the point');
  assert.ok(ende.beendet);
});

test('the stream asks for plain text, never for the JSON envelope',async()=>{
  profile=[{id:'a',provider:'gateway',model:'m',label:'Pro',enabled:true}];
  let gesendet=null;
  global.fetch=async(url,opt)=>{gesendet=JSON.parse(opt.body);return {ok:true,body:sse('fertig')}};
  await masterPromptStream({body:{assembled:auftrag}},antwortEnde().res);
  const inhalt=gesendet.messages.at(-1).content;
  assert.doesNotMatch(inhalt,/verlangte JSON/,'a growing JSON object cannot be shown while it grows');
  assert.match(inhalt,/kein JSON, keine Vorrede/);
  assert.match(inhalt,/VORLAGE/,'…but it is still the same template as the ordinary route');
});

test('a route that fails before the first byte lets the next one take over',async()=>{
  profile=[{id:'a',provider:'gateway',model:'kaputt',label:'Erste',enabled:true},{id:'b',provider:'openai',model:'gut',label:'Zweite',enabled:true}];
  const modelle=[];
  global.fetch=async(url,opt)=>{
    const body=JSON.parse(opt.body);modelle.push(body.model);
    if(body.model==='kaputt')return {ok:false,status:502,text:async()=>'kaputt'};
    return {ok:true,body:sse('zweiter Versuch')};
  };
  const ende=antwortEnde();
  await masterPromptStream({body:{assembled:auftrag}},ende.res);
  assert.deepEqual(modelle,['kaputt','gut']);
  assert.equal(ende.text,'zweiter Versuch');
});

test('a route that fails mid-stream ends the answer instead of restarting it',async()=>{
  profile=[{id:'a',provider:'gateway',model:'abbruch',label:'Erste',enabled:true},{id:'b',provider:'openai',model:'gut',label:'Zweite',enabled:true}];
  const modelle=[];
  global.fetch=async(url,opt)=>{
    const body=JSON.parse(opt.body);modelle.push(body.model);
    if(body.model!=='abbruch')return {ok:true,body:sse('zweiter Versuch')};
    // Erst liefern, dann abbrechen - so wie eine Leitung, die mitten im Satz wegfällt. Ein
    // ReadableStream, der im selben Zug enqueue und error aufruft, verwirft das Stück wieder.
    let schritt=0;
    return {ok:true,body:new ReadableStream({pull(c){
      if(schritt++===0)c.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({choices:[{delta:{content:'halber Satz'}}]})}\n\n`));
      else c.error(new Error('Verbindung weg'));
    }})};
  };
  const ende=antwortEnde();
  await masterPromptStream({body:{assembled:auftrag}},ende.res);
  assert.deepEqual(modelle,['abbruch'],'a second route would write on top of half a sentence');
  assert.equal(ende.text,'halber Satz','what already arrived stays');
  assert.ok(ende.beendet);
});

test('the plan picks the chain and an exhausted budget puts the saver first',async()=>{
  plan='ultimate';protokoll=[];
  profile=[{id:'a',provider:'gateway',model:'teuer',label:'Erste',enabled:true},{id:'b',provider:'gateway',model:'sparsam',label:'Sparwahl',enabled:true,saver:true}];
  budget={exhausted:true};
  const modelle=[];
  global.fetch=async(url,opt)=>{modelle.push(JSON.parse(opt.body).model);return {ok:true,body:sse('ok')}};
  await masterPromptStream({body:{assembled:auftrag}},antwortEnde().res);
  assert.equal(protokoll[0].plan,'ultimate','the tariff decides which AIs may answer');
  assert.deepEqual(protokoll[0].providers,['gateway','openai'],'Gemini speaks its own stream format');
  assert.equal(modelle[0],'sparsam','with an empty budget the cheap one answers first');
  budget={exhausted:false};plan='pro';
});

test('without any usable route the caller gets an error, not an empty page',async()=>{
  profile=[{id:'a',provider:'gateway',model:'m',label:'Einzige',enabled:true}];
  schluessel={key:''};
  const ende=antwortEnde();
  await masterPromptStream({body:{assembled:auftrag}},ende.res);
  assert.equal(ende.status,503);
  assert.match(ende.kopf.json.error,/Keine System-KI/);
  schluessel={key:'geheim',defaultModel:''};
});

test('a briefing that is too short never reaches a provider',async()=>{
  let gerufen=false;global.fetch=async()=>{gerufen=true};
  const ende=antwortEnde();
  await masterPromptStream({body:{assembled:'zu kurz'}},ende.res);
  assert.equal(ende.status,400);
  assert.equal(gerufen,false);
});

// Die Schreibmaschine im Browser lässt sich am Quelltext nicht beurteilen: es geht um die Frage,
// wann etwas erscheint und ob es dann durchläuft. Der Abschnitt aus app.js wird deshalb wirklich
// ausgeführt, mit einem Feld und einem Fenster aus Pappe.
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

async function schreibmaschineBauen(){
  const src=await readFile(fileURLToPath(new URL('../app.js',import.meta.url)),'utf8');
  const von=src.indexOf('const MASTER_VORLAUF='),bis=src.indexOf('  async function streamMasterPrompt(');
  assert.ok(von>=0&&bis>von,'the typewriter block must stay findable');
  const feld={value:''},meldungen=[];
  const fenster={dispatchEvent:e=>meldungen.push(e.detail?.state)};
  const bauen=new Function('el','window','CustomEvent',`${src.slice(von,bis)}\nreturn masterSchreibmaschine;`);
  return {feld,meldungen,mach:bauen({masterPrompt:feld},fenster,class{constructor(name,init){Object.assign(this,init)}})};
}

test('nothing appears before a quarter of the text has arrived',async()=>{
  const {feld,meldungen,mach}=await schreibmaschineBauen();
  const schreiber=mach(4000);// Schwelle: 1000 Zeichen
  schreiber.nimm('a'.repeat(600));
  assert.equal(feld.value,'','600 of 4000 is not enough to read along');
  assert.equal(schreiber.sichtbar,false);
  assert.deepEqual(meldungen,[],'and nothing is announced yet');
  schreiber.nimm('b'.repeat(500));
  assert.equal(schreiber.sichtbar,true,'past the quarter it opens');
  assert.deepEqual(meldungen,['writing'],'…and says so, so the loading screen can end');
});

test('the field catches up with the stream and ends on the whole text',async()=>{
  const {feld,mach}=await schreibmaschineBauen();
  const schreiber=mach(2000),text='Master-Prompt '.repeat(120);
  schreiber.nimm(text);
  assert.ok(feld.value.length<text.length,'it writes, it does not paste');
  assert.ok(text.startsWith(feld.value),'and it writes the text, not a rearranged one');
  assert.equal(await schreiber.ausschreiben(),text);
  assert.equal(feld.value,text,'nothing may stay behind when it says it is done');
});

test('a stream that never reaches the quarter hands the field to the assembled briefing',async()=>{
  const {feld,meldungen,mach}=await schreibmaschineBauen();
  const schreiber=mach(8000);
  schreiber.nimm('nur ein Anfang');
  assert.equal(feld.value,'');
  assert.equal(schreiber.aufgeben('DER ZUSAMMENGESETZTE AUFTRAG'),true);
  assert.equal(feld.value,'DER ZUSAMMENGESETZTE AUFTRAG','better a finished text than a loading screen that never ends');
  assert.deepEqual(meldungen,['writing'],'the loading screen must end here too');
  // Und danach schreibt der Stream nicht mehr ins Feld - sonst liefen zwei Texte gegeneinander.
  schreiber.nimm('x'.repeat(9000));
  assert.equal(feld.value,'DER ZUSAMMENGESETZTE AUFTRAG');
});

test('once something is on screen the typewriter never gives up under it',async()=>{
  const {feld,mach}=await schreibmaschineBauen();
  const schreiber=mach(1200);
  schreiber.nimm('c'.repeat(1200));
  assert.equal(schreiber.sichtbar,true);
  assert.equal(schreiber.aufgeben('ERSATZ'),false,'replacing a text the reader is following would be worse than waiting');
  assert.notEqual(feld.value,'ERSATZ');
});
