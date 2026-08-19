const {resolveProviderKey}=require('./provider-key');
const {getEntitlements}=require('./entitlements');
const {getTokenBudget}=require('./quota');
const {listProfiles}=require('./system-ai-profiles');
const {primePromptTemplates}=require('./prompt-templates');
const {logUsage}=require('./usage');
const core=require('./generate-core');

// Der Master-Prompt braucht rund eine Minute. Eine Minute vor einem Ladebalken ist eine Minute,
// in der nichts passiert - dieselbe Minute, in der der Text entsteht, ist eine, der man zusieht.
// Die Antwort wird deshalb Stück für Stück durchgereicht, statt am Ende in einem Block zu kommen.
//
// Geschrieben wird reiner Text, kein JSON. Ein wachsendes JSON-Objekt lässt sich unterwegs nicht
// anzeigen: bis die schließende Klammer da ist, ist der String kein String, und die Anführungs-
// zeichen und \n im Inneren müsste der Browser selbst zusammensetzen. Reiner Text ist unterwegs
// schon lesbar - genau das ist der Zweck.
const ZEITGRENZE_MS=180000;
const SYSTEM='Du bist der Prompt.ai Master-Prompt-Architekt. Formuliere alle Rohangaben professionell aus, erfinde nichts dazu und antworte ausschließlich mit dem fertigen Master-Prompt.';
const SCHLUSS='Gib ausschließlich den fertigen Master-Prompt aus - kein JSON, keine Vorrede, keine Rückfrage, keine Erklärung danach.';
const ZIELE={gateway:'https://ai-gateway.vercel.sh/v1/chat/completions',openai:'https://api.openai.com/v1/chat/completions'};
const STANDARD={gateway:'openai/gpt-5.4',openai:'gpt-5'};

// Dieselbe Vorlage wie im gewöhnlichen Weg, nur mit umgestellter Schlusszeile. Zwei getrennte
// Vorlagen wären zwei Stände derselben Anweisung, und einer davon wäre bald veraltet.
function textAuftrag(body){
  const json=core.makeMasterPromptPrompt({assembled:body.assembled,project:body.project||{},concept:body.concept||null});
  return json.replace(/Gib ausschließlich das verlangte JSON zurück[\s\S]*$/,SCHLUSS);
}

// Die Kette kommt aus derselben Quelle wie sonst: Tarif entscheidet, Priorität ordnet, und bei
// aufgebrauchtem Budget antwortet die Sparwahl. Gestreamt wird nur über OpenAI-kompatible
// Schnittstellen; Gemini spricht ein eigenes Streamformat, dafür bleibt der gewöhnliche Weg.
async function kette(req,plan){
  const rohe=(await listProfiles('prompt',{providers:['gateway','openai'],plan})).filter(x=>x.enabled!==false);
  if(!rohe.length)return [{provider:'gateway',model:'',label:'Gateway Standard'}];
  const budget=await getTokenBudget(req).catch(()=>({exhausted:false}));
  if(!budget.exhausted||rohe.length<2)return rohe;
  const sparsam=rohe.filter(x=>x.saver===true);
  return sparsam.length?[...sparsam,...rohe.filter(x=>x.saver!==true)]:[...rohe].reverse();
}

async function leite(res,route,schluessel,auftrag){
  const steuerung=new AbortController(),uhr=setTimeout(()=>steuerung.abort(),ZEITGRENZE_MS);
  let gesendet=0;
  try{
    const modell=String(route.model||schluessel.defaultModel||STANDARD[route.provider]||'');
    const antwort=await fetch(ZIELE[route.provider],{
      method:'POST',signal:steuerung.signal,
      headers:{Authorization:`Bearer ${schluessel.key}`,'Content-Type':'application/json'},
      body:JSON.stringify({model:modell,messages:[{role:'system',content:SYSTEM},{role:'user',content:auftrag}],stream:true})
    });
    if(!antwort.ok||!antwort.body){
      const fehler=await antwort.text().catch(()=>'');
      throw Object.assign(new Error(fehler.slice(0,300)||`${route.provider} antwortet mit ${antwort.status}`),{status:antwort.status});
    }
    // Erst jetzt der Kopf: solange keine Verbindung steht, kann noch die nächste Route
    // übernehmen - und die braucht die Möglichkeit, stattdessen einen Fehler zu melden.
    if(!res.headersSent){
      res.statusCode=200;
      res.setHeader('Content-Type','text/plain; charset=utf-8');
      res.setHeader('Cache-Control','no-store, private');
      res.setHeader('X-Prompt-AI-System-Profile',String(route.label||route.provider));
      // Ohne das puffert der Zwischenspeicher die Antwort und liefert sie am Ende am Stück -
      // dann war die ganze Übung umsonst.
      res.setHeader('X-Accel-Buffering','no');
      res.flushHeaders?.();
    }
    const leser=antwort.body.getReader(),entpacker=new TextDecoder();
    let rest='';
    for(;;){
      const {done,value}=await leser.read();
      if(done)break;
      rest+=entpacker.decode(value,{stream:true});
      const zeilen=rest.split('\n');rest=zeilen.pop()||'';
      for(const zeile of zeilen){
        const roh=zeile.trim();
        if(!roh.startsWith('data:'))continue;
        const nutzlast=roh.slice(5).trim();
        if(!nutzlast||nutzlast==='[DONE]')continue;
        let stueck='';
        try{stueck=JSON.parse(nutzlast)?.choices?.[0]?.delta?.content||''}catch{continue}
        if(!stueck)continue;
        gesendet+=stueck.length;
        res.write(stueck);
      }
    }
    return gesendet;
  }finally{clearTimeout(uhr)}
}

module.exports=async function masterPromptStream(req,res){
  const body=req.body||{};
  if(String(body.assembled||'').length<400)return res.status(400).json({error:'Der zusammengestellte Auftrag fehlt.'});
  const begonnen=Date.now();
  await primePromptTemplates();
  const berechtigung=await getEntitlements(req);
  const plan=berechtigung.isAdmin?'ultimate':String(berechtigung.plan||'free');
  const auftrag=textAuftrag(body);
  const fehler=[];
  for(const route of await kette(req,plan)){
    const schluessel=await resolveProviderKey(req,route.provider,{systemOnly:true}).catch(()=>({key:''}));
    if(!schluessel.key){fehler.push(`${route.label||route.provider}: kein Zugang`);continue}
    try{
      const gesendet=await leite(res,route,schluessel,auftrag);
      if(gesendet>0){
        await logUsage(req,{action:'master-prompt-stream',provider:route.provider,model:route.model||'',project:body.project||null,durationMs:Date.now()-begonnen}).catch(()=>{});
        return res.end();
      }
      fehler.push(`${route.label||route.provider}: leere Antwort`);
    }catch(error){
      // Ist schon Text unterwegs, ist die nächste Route keine Hilfe mehr: sie würde mitten im
      // Satz weiterschreiben. Dann endet die Antwort hier, und der Browser behält, was er hat.
      if(res.headersSent)return res.end();
      fehler.push(`${route.label||route.provider}: ${error.message}`);
    }
  }
  if(res.headersSent)return res.end();
  return res.status(503).json({error:`Keine System-KI konnte den Master-Prompt schreiben.${fehler.length?` ${fehler.join(' | ')}`:''}`});
};
