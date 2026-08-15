// Die Blöcke in docs/TESTAUFTRAG.md beschreiben, was zu prüfen ist. Ein Teil davon lässt sich
// nicht durch Hinsehen prüfen, sondern nur durch Zusenden: Was passiert, wenn jemand die Oberfläche
// umgeht und direkt mit der Schnittstelle spricht? Genau das macht dieses Skript.
//
//   node tests/pruefung/missbrauch.mjs https://www.prompt-ai.app
//
// Es schreibt nichts, kauft nichts und legt nichts an. Es schickt Anfragen, die abgelehnt werden
// sollen, und meldet, wenn eine davon durchkommt. Ohne Adresse läuft es nicht - ein Sicherheitstest
// gegen ein System, das man nicht bewusst benannt hat, ist keiner.
//
// Die Ratenbremse wird nur mit --raten geprüft: sie erzeugt bewusst Last und gehört nicht in einen
// beiläufigen Durchlauf.

const base=String(process.argv[2]||'').replace(/\/+$/,'');
const withRate=process.argv.includes('--raten');

if(!/^https?:\/\/.+/.test(base)){
  console.error('Aufruf: node tests/pruefung/missbrauch.mjs <adresse> [--raten]');
  console.error('Beispiel: node tests/pruefung/missbrauch.mjs https://www.prompt-ai.app');
  process.exit(2);
}

const results=[];
function check(name,ok,detail=''){
  results.push({name,ok});
  console.log(`${ok?'ok':'NICHT OK'} - ${name}${ok||!detail?'':`\n  # ${detail}`}`);
}

async function post(path,body,headers={}){
  try{
    const response=await fetch(`${base}${path}`,{
      method:'POST',
      headers:{'Content-Type':'application/json',...headers},
      body:JSON.stringify(body),
      signal:AbortSignal.timeout(30000)
    });
    let payload=null;try{payload=await response.json()}catch{}
    return {status:response.status,payload,headers:response.headers};
  }catch(error){return {status:0,payload:null,error:String(error?.message||error)}}
}

// 1. Ohne Anmeldung darf kein KI-Lauf starten. Sonst zahlt der Betreiber fuer jeden Fremden mit.
async function ohneAnmeldung(){
  const r=await post('/api/generate',{action:'concepts',project:{description:'Eine kleine Website fuer einen Betrieb, modern und ruhig.'}});
  check('ohne Anmeldung kommt kein KI-Lauf durch',r.status>=400,`Status ${r.status} · ${JSON.stringify(r.payload)?.slice(0,200)}`);
}

// 2. Der Tarif darf nur aus dem Konto kommen, nie aus der Anfrage. Steht er im Datenkoerper und
//    der Server glaubt ihn, kauft sich niemand mehr Ultimate.
async function tarifGefaelscht(){
  const r=await post('/api/generate',{
    action:'website',
    plan:'ultimate',entitlement:{plan:'ultimate',isAdmin:true},isAdmin:true,
    engine:'gateway',model:'anthropic/claude-sonnet-5',
    masterPrompt:'x'.repeat(600),
    project:{description:'Testlauf'}
  });
  check('ein mitgeschickter Tarif schaltet nichts frei',r.status>=400,`Status ${r.status} · ${JSON.stringify(r.payload)?.slice(0,200)}`);
}

// 3. Eine riesige Anfrage muss abprallen, bevor sie Rechenzeit kostet.
async function zuGross(){
  const r=await post('/api/generate',{action:'concepts',project:{description:'A'.repeat(700000)}});
  check('eine ueberdimensionierte Anfrage wird abgewiesen',[413,400,401,403].includes(r.status),`Status ${r.status}`);
}

// 4. /api/config ist oeffentlich. Alles, was dort steht, steht damit im Netz.
async function konfigOhneGeheimnis(){
  let text='';let status=0;
  try{
    const response=await fetch(`${base}/api/config`,{signal:AbortSignal.timeout(20000)});
    status=response.status;text=await response.text();
  }catch(error){return check('die oeffentliche Konfiguration ist erreichbar',false,String(error?.message||error))}

  check('die oeffentliche Konfiguration antwortet',status===200,`Status ${status}`);

  // Muster echter Geheimnisse. Der veroeffentlichbare Supabase-Schluessel (sb_publishable_) gehoert
  // ausdruecklich dorthin und zaehlt nicht.
  const verdaechtig=[
    [/sk_live_[A-Za-z0-9]{10,}/,'Stripe-Live-Schluessel'],
    [/sk_test_[A-Za-z0-9]{10,}/,'Stripe-Test-Schluessel'],
    [/whsec_[A-Za-z0-9]{10,}/,'Stripe-Webhook-Geheimnis'],
    [/\bsb_secret_[A-Za-z0-9_-]{10,}/,'Supabase-Dienstschluessel'],
    [/service_role/,'Dienstrolle'],
    [/\bsk-[A-Za-z0-9]{20,}/,'OpenAI-Schluessel'],
    [/AIza[A-Za-z0-9_-]{30,}/,'Google-Schluessel'],
    [/\bghp_[A-Za-z0-9]{20,}/,'GitHub-Token'],
    [/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\./,'JSON-Web-Token']
  ];
  const treffer=verdaechtig.filter(([muster])=>muster.test(text)).map(([,name])=>name);
  check('in der oeffentlichen Konfiguration steht kein Geheimnis',treffer.length===0,treffer.join(', '));

  // Die Preise sollen live aus Stripe kommen. Faellt einer auf den hinterlegten Betrag zurueck,
  // wandert er bei einer Preisaenderung nicht mit.
  try{
    const data=JSON.parse(text),live=data?.pricing?.live||{};
    const tot=Object.entries(live).filter(([,ok])=>ok===false).map(([name])=>name);
    check('alle Preise kommen live aus Stripe',tot.length===0,`nicht live: ${tot.join(', ')}`);
  }catch{check('die Konfiguration ist lesbares JSON',false,text.slice(0,160))}
}

// 5. Verwaltungswege duerfen fuer Fremde nicht einmal antworten.
async function verwaltungDicht(){
  for(const [pfad,koerper] of [
    ['/api/admin-overview',{}],
    ['/api/admin-action',{action:'quota-save',plan:'free',monthly_tokens:999999999}],
    ['/api/config',{action:'system-ai-profile-save',provider:'gateway',model:'anthropic/claude-sonnet-5',tasks:['prompt'],label:'Fremdeintrag'}]
  ]){
    const r=await post(pfad,koerper);
    check(`${pfad} weist einen Fremden ab`,r.status>=400,`Status ${r.status} · ${JSON.stringify(r.payload)?.slice(0,160)}`);
  }
}

// 6. Der Stripe-Webhook entscheidet ueber Tarife. Ohne gueltige Signatur darf er nichts glauben.
async function webhookOhneSignatur(){
  const r=await post('/api/stripe-webhook',{type:'checkout.session.completed',data:{object:{metadata:{plan:'ultimate'}}}});
  check('der Zahlungs-Webhook lehnt eine unsignierte Meldung ab',r.status>=400,`Status ${r.status}`);
}

// 7. Ohne Bremse kann eine einzelne Adresse das Monatsbudget leerlaufen lassen.
async function ratenbremse(){
  if(!withRate)return console.log('# Ratenbremse uebersprungen (mit --raten pruefen)');
  const versuche=await Promise.all(Array.from({length:25},()=>post('/api/generate',{action:'concepts',project:{description:'Ratentest'}})));
  const gebremst=versuche.some(r=>r.status===429);
  check('viele Anfragen hintereinander laufen in eine Bremse',gebremst,`Antworten: ${[...new Set(versuche.map(r=>r.status))].join(', ')}`);
}

// Antwortet gar nichts oder eine Zwischenstelle, dann besteht jede Pruefung scheinbar - weil alles
// abgelehnt wird, nur eben nicht von der App. Das waere die gefaehrlichste Art von gruen.
async function erreichbar(){
  try{
    const response=await fetch(base,{signal:AbortSignal.timeout(20000)});
    if(response.status>=500||response.status===403||response.status===407){
      const text=(await response.text().catch(()=>'')).slice(0,200);
      console.error(`# ABBRUCH: ${base} antwortet mit ${response.status}.`);
      console.error('# Vermutlich eine Firewall oder ein Proxy dazwischen. Jede Pruefung waere jetzt');
      console.error('# gruen, ohne dass die App ueberhaupt gefragt wurde.');
      if(text)console.error(`# ${text.replace(/\s+/g,' ')}`);
      return false;
    }
    return true;
  }catch(error){
    console.error(`# ABBRUCH: ${base} ist nicht erreichbar - ${String(error?.message||error)}`);
    return false;
  }
}

console.log(`# Missbrauchspruefung gegen ${base}`);
console.log('# Es wird nichts angelegt, gekauft oder geaendert.\n');

if(!await erreichbar())process.exit(2);

await ohneAnmeldung();
await tarifGefaelscht();
await zuGross();
await konfigOhneGeheimnis();
await verwaltungDicht();
await webhookOhneSignatur();
await ratenbremse();

const schlecht=results.filter(r=>!r.ok);
console.log(`\n1..${results.length}`);
console.log(schlecht.length?`# ${schlecht.length} von ${results.length} nicht bestanden`:`# ${results.length} von ${results.length} bestanden`);
process.exit(schlecht.length?1:0);
