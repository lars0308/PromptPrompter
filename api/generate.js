const core=require('../server/generate-core');
const previewImage=require('../server/preview-image');
const sandboxBuild=require('../server/sandbox-build');
const freePrompt=require('../server/free-prompt-v2');
const masterPromptStream=require('../server/master-prompt-stream');
const {taskForAction,listProfiles}=require('../server/system-ai-profiles');
const {getQuotaSummary,getTokenBudget,assertQuota,consumeWebsiteGeneration,consumePreviewRun,quotaErrorPayload}=require('../server/quota');
const {getEntitlements}=require('../server/entitlements');
const {rateLimit}=require('../server/rate-limit');

// Which AIs a request may use follows the plan, never a choice in the browser.
async function planOf(req){try{const ent=await getEntitlements(req);return ent?.isAdmin?'ultimate':String(ent?.plan||'free')}catch{return 'free'}}

function captureResponse(){const state={status:200,body:null,headers:{}};return{state,setHeader(name,value){state.headers[String(name).toLowerCase()]=value;return this},getHeader(name){return state.headers[String(name).toLowerCase()]},status(code){state.status=Number(code)||500;return this},json(value){state.body=value;return this},end(value){state.body=value;return this}}}
function flush(res,captured){for(const [name,value] of Object.entries(captured.headers||{}))try{res.setHeader(name,value)}catch{}return res.status(captured.status||200).json(captured.body??{})}
// Ein Modell verschwindet irgendwann - der Anbieter stellt es ab, benennt es um, nimmt es aus dem
// Gateway. Der Anbieter meldet das als 404 oder als 400 mit "model not found", und beides galt hier
// bisher als endgueltig: die Kette brach ab, statt auf das naechste Profil auszuweichen. Damit
// haette die Abschaltung eines einzigen Modells den Tarif lahmgelegt, obwohl zwei Ersatzwege
// danebenstehen. Erkannt wird das eng an der Wortwahl zum Modell, damit eine echte Eingabe-
// beanstandung (auch 400) weiterhin sofort beim Kunden landet.
// Der Modellname steht zwischen "model" und der Begruendung und enthaelt selbst Punkte
// (gemini-2.5-flash), deshalb darf die Luecke nicht am Punkt enden - nur an der Zeile.
const MODEL_GONE=/\bmodel\b[^\n]{0,80}?\b(not found|does not exist|no longer|unavailable|unsupported|decommissioned|retired|deprecated)|unknown model|no endpoints found|model_not_found/i;
function retryable(captured){
  const status=Number(captured.status)||500,error=String(captured.body?.error||'');
  if(/Zu viele Anfragen/i.test(error))return false;
  if([401,402,403].includes(status))return true;
  if(/valid credit card|add-credit-card|payment required|billing|authentication|unauthorized|forbidden|invalid api key|provider (?:is )?unavailable|insufficient quota/i.test(error))return true;
  if(status===404||(status===400&&MODEL_GONE.test(error)))return true;
  return [408,429,500,502,503,504].includes(status);
}
// A bought connection slot is the visitor's own AI: their key, their provider, their model name and
// version. When they mark it as the one to use, it goes to the front of the chain - the plan's
// profiles stay behind it as a fallback, so a typo in a model name costs a retry, not the run.
const OWN_PROVIDERS=['gateway','openai','gemini'];
function ownConnection(body={}){
  if(body.useOwnApi!==true)return null;
  const provider=String(body.ownProvider||'').toLowerCase();
  const model=String(body.ownModel||'').trim();
  if(!OWN_PROVIDERS.includes(provider)||!model||model.length>190||!/^[a-zA-Z0-9@._:/-]+$/.test(model))return null;
  return {id:'own-connection',provider,model,label:String(body.ownLabel||'Eigene Verbindung').slice(0,80),enabled:true,own:true};
}
async function runSystemProfiles(req,res){const task=taskForAction(req.body?.action),plan=await planOf(req),profiles=(await listProfiles(task,{providers:['gateway','openai','gemini'],plan})).filter(x=>x.enabled!==false);const own=ownConnection(req.body);if(!profiles.length&&!own)return core(req,res);const budget=await getTokenBudget(req),saver=Boolean(budget.exhausted&&profiles.length>1&&!own);// Budget aufgebraucht: die Anfrage wird nicht abgelehnt, sondern von der Sparwahl beantwortet.
// Welche das ist, steht am Profil (Spalte saver) - frueher wurde die Kette einfach umgedreht und
// der letzte Eintrag genommen. Der letzte Eintrag ist aber der Notausgang, also bewusst das
// robusteste und damit teuerste Modell: die Kostenbremse machte den Lauf teurer statt guenstiger.
// Ist nichts markiert, bleibt es beim alten Verhalten, damit kein Tarif ohne Sparweg dasteht.
const marked=profiles.filter(x=>x.saver===true);
const planChain=!saver?profiles:marked.length?[...marked,...profiles.filter(x=>x.saver!==true)]:[...profiles].reverse();const chain=own?[own,...planChain]:planChain;const requested=String(req.body?.systemAiProfileId||''),ordered=requested?[...chain.filter(x=>x.id===requested),...chain.filter(x=>x.id!==requested)]:chain,original=req.body;let last=null;for(const profile of ordered){req.body={...original,engine:profile.provider,model:profile.model,systemAiProfileId:profile.own?'':profile.id,systemAiProfileLabel:profile.label,useOwnApi:profile.own===true};const captured=captureResponse();await core(req,captured);last=captured.state;if(last.status<400){res.setHeader('X-Prompt-AI-System-Profile',profile.label||profile.id);if(saver)res.setHeader('X-Prompt-AI-Saver','1');req.body=original;return flush(res,last)}if(!retryable(last)){req.body=original;return flush(res,last)}}req.body=original;return flush(res,last||{status:503,body:{error:`Keine System-KI für ${task} war verfügbar.`},headers:{}})}
async function quotaRoute(req,res,action){
  try{
    if(action==='quota-summary')return res.status(200).json(await getQuotaSummary(req));
    if(action==='quota-check'){
      const metric=String(req.body?.metric||'');const checked=await assertQuota(req,metric);return res.status(200).json({allowed:true,...checked.summary});
    }
    if(action==='quota-consume'){
      if(String(req.body?.metric||'')!=='website_generations')return res.status(400).json({error:'Nur Website-Generierungen werden über diesen Ablauf abgefragt.'});
      return res.status(200).json(await getQuotaSummary(req));
    }
  }catch(error){return res.status(error?.status||500).json(quotaErrorPayload(error))}
}
async function enforce(req,res,metric){try{await assertQuota(req,metric);return true}catch(error){res.status(error?.status||429).json(quotaErrorPayload(error));return false}}
async function websiteConceptRoute(req,res){
  // A regeneration is the same project with the same brief, so it does not book another website
  // generation - but it is another preview run, and that is what the preview quota counts.
  const regenerate=req.body?.regenerate===true;
  try{if(!regenerate)await assertQuota(req,'website_generations')}catch(error){return res.status(error?.status||429).json(quotaErrorPayload(error))}
  const captured=captureResponse();
  if(req.body?.systemAiProfileId&&req.body?.useOwnApi!==true)await runSystemProfiles(req,captured);else await core(req,captured);
  if(captured.state.status<400){
    // Whose key answered decides how much of the monthly allowance this run costs.
    const keySource=String(captured.state.headers?.['X-SiteBrief-AI-Key-Source']||captured.state.headers?.['x-sitebrief-ai-key-source']||'system');
    if(!regenerate){try{await consumeWebsiteGeneration(req,keySource)}catch{}}
    try{await consumePreviewRun(req,keySource)}catch{}
  }
  return flush(res,captured.state);
}
// preview-image only checks that the plan may render images at all - the run itself is booked
// once by the concepts route, so three images cost one preview.
// Die drei Gastlaeufe zaehlt bisher nur der Browser (guestRunsRemaining in app.js), und
// assertQuota laesst unangemeldete Aufrufe ausdruecklich durch. Wer die Seite umgeht und
// direkt hierher spricht, hatte damit unbegrenzten Zugriff auf das KI-Budget. Serverseitig
// deckelt deshalb die Adresse, was ohne Konto moeglich ist - grosszuegig genug fuer echte
// Gastlaeufe, eng genug, dass sich damit kein Budget abraeumen laesst.
const MAX_REQUEST_CHARS=600000;
function signedIn(req){return /^Bearer\s+\S+/i.test(String(req?.headers?.authorization||req?.headers?.Authorization||''))}
function tooLarge(req,res){
  let size=0;try{size=JSON.stringify(req.body||{}).length}catch{size=MAX_REQUEST_CHARS+1}
  if(size<=MAX_REQUEST_CHARS)return false;
  res.status(413).json({error:'Die Anfrage ist zu gross. Bitte kuerze die Beschreibung oder haenge weniger Material an.'});
  return true;
}
module.exports=async function generateRouter(req,res){if(req.method==='POST'){
  if(tooLarge(req,res))return;
  const authed=signedIn(req);
  // Vorrang bei der Verarbeitung heisst hier konkret: wie viele Anfragen pro Minute durchgehen,
  // bevor gebremst wird. Ultimate laeuft weiter, wenn es eng wird, Free wird als Erstes gebremst.
  const plan=authed?await planOf(req):'guest';
  const perMinute=plan==='ultimate'?90:plan==='pro'?45:20;
  if(!rateLimit(req,res,authed?{key:`generate-${plan}`,limit:perMinute,windowMs:60000}:{key:'generate-guest',limit:24,windowMs:900000}))return;
  const action=String(req.body?.action||'');if(['quota-summary','quota-check','quota-consume'].includes(action))return quotaRoute(req,res,action);if(action==='free-prompt'){if(!await enforce(req,res,'free_prompts'))return;return freePrompt(req,res)}if(action==='preview-image'){if(!await enforce(req,res,'ai_previews'))return;return previewImage(req,res)}if(action==='concepts')return websiteConceptRoute(req,res);
    // Der Stream geht an runSystemProfiles vorbei: der Weg dort faengt die ganze Antwort in einem
    // Zwischenspeicher auf, um bei einem Fehler die naechste Route zu versuchen - genau das
    // Gegenteil von durchreichen. Der Streamweg waehlt seine Kette deshalb selbst.
    if(action==='master-prompt'&&req.body?.stream===true)return masterPromptStream(req,res);
    if(action==='master-prompt')return runSystemProfiles(req,res);if(action==='sandbox-build')return sandboxBuild(req,res);if(req.body?.systemAiProfileId&&req.body?.useOwnApi!==true)return runSystemProfiles(req,res)}return core(req,res)};
