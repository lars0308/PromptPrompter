const {getEntitlements}=require('./entitlements');
const {authenticatedUser}=require('./supabase-user');
const {serviceFetch}=require('./admin');

// monthly_tokens ist das eigentliche Mass: es zaehlt, was uns eine Nutzung wirklich kostet, und
// nicht, wie oft ein Knopf gedrueckt wurde. Es ist keine Nutzungsgrenze, sondern eine
// Kostenbremse - ist es aufgebraucht, laeuft alles weiter, nur auf der guenstigeren KI
// (siehe api/generate.js, saver). Die Werte sind so gewaehlt, dass sie die Zahlen der
// Tarifseite mit voller Qualitaet abdecken: ein Projektlauf kostet grob 45.000 Einheiten,
// ein freier Prompt 4.000, ein Bild-Durchlauf 20.000, ein Probelauf 50.000.
const PLAN_LIMITS=Object.freeze({
  free:{free_prompts:10,website_generations:3,ai_previews:0,monthly_tokens:150000},
  pro:{free_prompts:100,website_generations:25,ai_previews:50,monthly_tokens:2500000},
  ultimate:{free_prompts:500,website_generations:100,ai_previews:250,monthly_tokens:6000000}
});
// Bilder und Rechenzeit haben keine Tokens. Damit sie trotzdem im selben Budget stehen, bekommen
// sie einen festen Gegenwert - sonst waere ausgerechnet das Teuerste unsichtbar.
const UNIT_EQUIVALENT=Object.freeze({'preview-image':5000,'sandbox-build':10000});
let limitsCache=null,limitsCacheAt=0;
const LIMITS_CACHE_MS=30000;
async function loadPlanLimits(){
  if(limitsCache&&Date.now()-limitsCacheAt<LIMITS_CACHE_MS)return limitsCache;
  try{
    const rows=(await serviceFetch('/rest/v1/sitebrief_quota_limits?select=plan,free_prompts,website_generations,ai_previews,monthly_tokens')).data||[];
    const merged={free:{...PLAN_LIMITS.free},pro:{...PLAN_LIMITS.pro},ultimate:{...PLAN_LIMITS.ultimate}};
    for(const row of rows){if(merged[row.plan])merged[row.plan]={free_prompts:Number(row.free_prompts)||0,website_generations:Number(row.website_generations)||0,ai_previews:Number(row.ai_previews)||0,monthly_tokens:Math.max(0,Number(row.monthly_tokens)||0)}}
    limitsCache=merged;limitsCacheAt=Date.now();return merged;
  }catch{return limitsCache||PLAN_LIMITS}
}
const METRIC_ACTIONS=Object.freeze({
  free_prompts:'free-prompt',
  website_generations:'website-generation',
  ai_previews:'preview-image'
});
const METRIC_LABELS=Object.freeze({
  free_prompts:'freie Prompts',
  website_generations:'Website-Generierungen',
  ai_previews:'KI-Vorschauen'
});

function monthWindow(now=new Date()){
  const start=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),1));
  const end=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()+1,1));
  return {start,end};
}
async function limitsFor(plan){const limits=await loadPlanLimits();return {...(limits[plan]||limits.free)}}
function metricResult(limit,used){return {limit,used,remaining:Math.max(0,limit-used)}}
function nextResetText(value){return new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'Europe/Berlin'}).format(new Date(value))}

async function usageRows(userId,start,end){
  const actions=Object.values(METRIC_ACTIONS).join(',');
  const path=`/rest/v1/sitebrief_usage_events?select=action,key_source&user_id=eq.${encodeURIComponent(userId)}&success=eq.true&action=in.(${encodeURIComponent(actions).replace(/%2C/g,',')})&created_at=gte.${encodeURIComponent(start.toISOString())}&created_at=lt.${encodeURIComponent(end.toISOString())}&limit=2000`;
  return (await serviceFetch(path)).data||[];
}
// A run on the visitor's own key costs us nothing but the orchestration, so it counts half: two of
// them use up one unit of the monthly allowance. Whole numbers stay whole - only own runs bring
// halves into the sum, and the display rounds them down.
const OWN_KEY_WEIGHT=0.5;
const rowWeight=row=>row?.key_source==='account'?OWN_KEY_WEIGHT:1;

// Tokens paid by the visitor never touch the budget: the budget exists to cap our cost.
async function tokensUsed(userId,start,end){
  const path=`/rest/v1/sitebrief_usage_events?select=total_tokens&user_id=eq.${encodeURIComponent(userId)}&total_tokens=gt.0&key_source=neq.account&created_at=gte.${encodeURIComponent(start.toISOString())}&created_at=lt.${encodeURIComponent(end.toISOString())}&limit=5000`;
  const rows=(await serviceFetch(path)).data||[];
  const tokens=rows.reduce((sum,row)=>sum+(Number(row.total_tokens)||0),0);
  return tokens+await equivalentUsed(userId,start,end);
}
// Bild- und Sandbox-Laeufe tragen keine Tokens; sie zaehlen mit ihrem Gegenwert.
async function equivalentUsed(userId,start,end){
  const actions=Object.keys(UNIT_EQUIVALENT);
  try{
    const path=`/rest/v1/sitebrief_usage_events?select=action&user_id=eq.${encodeURIComponent(userId)}&success=eq.true&key_source=neq.account&action=in.(${actions.join(',')})&created_at=gte.${encodeURIComponent(start.toISOString())}&created_at=lt.${encodeURIComponent(end.toISOString())}&limit=2000`;
    const rows=(await serviceFetch(path)).data||[];
    return rows.reduce((sum,row)=>sum+(UNIT_EQUIVALENT[row?.action]||0),0);
  }catch{return 0}
}
// Reaching the budget never blocks a request - it switches the routing to the cheapest AI of the
// plan (see api/generate.js). Administrators are never downgraded, so the console keeps testing
// against the real chain.
// An administrator can grant a single account extra tokens for the month from the token area. The
// bonus is added on top of the plan budget, so it postpones the saver downgrade without changing
// what the plan includes.
async function tokenBonus(userId){
  try{
    const path=`/rest/v1/sitebrief_user_admin_state?select=monthly_token_bonus&user_id=eq.${encodeURIComponent(userId)}&limit=1`;
    const rows=(await serviceFetch(path)).data||[];
    return Math.max(0,Number(rows[0]?.monthly_token_bonus)||0);
  }catch{return 0}
}
async function getTokenBudget(req){
  const off={limit:0,used:0,remaining:0,bonus:0,exhausted:false,resetAt:monthWindow().end.toISOString()};
  try{
    const entitlement=await getEntitlements(req);
    if(entitlement.isAdmin)return off;
    const limits=await limitsFor(entitlement.plan||'free'),planLimit=Math.max(0,Number(limits.monthly_tokens)||0);
    if(!planLimit)return off;
    const user=await authenticatedUser(req);
    if(!user?.id)return off;
    const bonus=await tokenBonus(user.id),limit=planLimit+bonus;
    const {start,end}=monthWindow(),used=await tokensUsed(user.id,start,end);
    return {limit,used,bonus,remaining:Math.max(0,limit-used),exhausted:used>=limit,resetAt:end.toISOString()};
  }catch{return off}
}

async function getQuotaSummary(req){
  const entitlement=await getEntitlements(req),plan=entitlement.plan||'free',limits=await limitsFor(plan),{start,end}=monthWindow();
  let user=null;try{user=await authenticatedUser(req)}catch{}
  let available=true,rows=[];
  if(user){try{rows=await usageRows(user.id,start,end)}catch{available=false}}
  const counts={free_prompts:0,website_generations:0,ai_previews:0},ownRuns={free_prompts:0,website_generations:0,ai_previews:0};
  for(const row of rows)for(const [metric,action] of Object.entries(METRIC_ACTIONS))if(row?.action===action){counts[metric]+=rowWeight(row);if(rowWeight(row)!==1)ownRuns[metric]++}
  const metrics={};for(const key of Object.keys(counts))metrics[key]={...metricResult(limits[key],Math.floor(counts[key])),exact:counts[key],ownRuns:ownRuns[key]};
  const tokens=await getTokenBudget(req);
  return {plan,isAdmin:Boolean(entitlement.isAdmin),authenticated:Boolean(user),available,enforced:Boolean(user)&&available&&!entitlement.isAdmin,periodStart:start.toISOString(),periodEnd:end.toISOString(),metrics,tokens};
}

async function assertQuota(req,metric){
  if(!METRIC_ACTIONS[metric])throw Object.assign(new Error('Unbekanntes Monatskontingent.'),{status:400});
  const summary=await getQuotaSummary(req),item=summary.metrics[metric];
  if(!summary.authenticated||!summary.available||summary.isAdmin)return {allowed:true,summary,item};
  if(item.limit<=0){
    const message=metric==='ai_previews'?'KI-Vorschauen sind in Free nicht enthalten. Sie sind ab Pro verfügbar.':`${METRIC_LABELS[metric]||'Diese Funktion'} sind in deinem Tarif nicht enthalten.`;
    throw Object.assign(new Error(message),{status:403,code:'PLAN_FEATURE_NOT_INCLUDED',metric,quota:summary});
  }
  if(item.used>=item.limit){
    const label=METRIC_LABELS[metric]||'Generierungen',reset=nextResetText(summary.periodEnd);
    throw Object.assign(new Error(`Dein Monatskontingent für ${label} ist aufgebraucht. Am ${reset} wird es automatisch zurückgesetzt.`),{status:429,code:'MONTHLY_QUOTA_EXHAUSTED',metric,quota:summary});
  }
  return {allowed:true,summary,item};
}

// One preview run = three images. Counting every image would have made a project with two
// regenerations eat nine of them, so the run is what is booked - written server-side, once.
async function consumePreviewRun(req,keySource='system'){
  const checked=await assertQuota(req,'ai_previews');
  if(!checked.summary.authenticated||!checked.summary.available)return checked.summary;
  const user=await authenticatedUser(req);
  await serviceFetch('/rest/v1/sitebrief_usage_events',{method:'POST',headers:{Prefer:'return=minimal'},body:{user_id:user.id,action:METRIC_ACTIONS.ai_previews,provider:'prompt-ai',model:'',success:true,error_message:'',project_name:'Vorschau-Durchlauf',project_type:'Website',project_goal:'',key_source:keySource==='account'?'account':'system'}});
  return getQuotaSummary(req);
}

async function consumeWebsiteGeneration(req,keySource='system'){
  const checked=await assertQuota(req,'website_generations');
  if(!checked.summary.authenticated||!checked.summary.available)return getQuotaSummary(req);
  const user=await authenticatedUser(req);
  await serviceFetch('/rest/v1/sitebrief_usage_events',{method:'POST',headers:{Prefer:'return=minimal'},body:{user_id:user.id,action:METRIC_ACTIONS.website_generations,provider:'prompt-ai',model:'',success:true,error_message:'',project_name:'Website-Projekt',project_type:'Website',project_goal:'',key_source:keySource==='account'?'account':'system'}});
  return getQuotaSummary(req);
}

// Der Probelauf ist der teuerste Aufruf im Produkt: kompletter Master-Prompt hinein, ganzes
// Dateipaket heraus. Er gehoert zu Ultimate, war aber unbegrenzt - ein einziges Konto konnte
// damit mehr kosten als es zahlt. Die Grenze steht hier und nicht in der Datenbank, weil sie
// keine Tarifzusage ist, sondern ein Schutz gegen Ausreisser.
const BUILD_ACTION='website-build';
const BUILD_LIMIT=Object.freeze({free:0,pro:0,ultimate:15});
async function buildRunsUsed(userId,start,end){
  const path=`/rest/v1/sitebrief_usage_events?select=id&user_id=eq.${encodeURIComponent(userId)}&success=eq.true&action=eq.${BUILD_ACTION}&created_at=gte.${encodeURIComponent(start.toISOString())}&created_at=lt.${encodeURIComponent(end.toISOString())}&limit=200`;
  return ((await serviceFetch(path)).data||[]).length;
}
async function assertBuildBudget(req){
  const entitlement=await getEntitlements(req);
  if(entitlement.isAdmin)return {allowed:true,used:0,limit:0};
  const limit=Number(BUILD_LIMIT[entitlement.plan||'free']||0);
  if(!limit)return {allowed:true,used:0,limit:0};
  let user=null;try{user=await authenticatedUser(req)}catch{}
  if(!user?.id)return {allowed:true,used:0,limit};
  const {start,end}=monthWindow();
  let used=0;try{used=await buildRunsUsed(user.id,start,end)}catch{return {allowed:true,used:0,limit}}
  if(used>=limit)throw Object.assign(new Error(`Der Probelauf ist in diesem Monat ${limit}-mal gelaufen. Am ${nextResetText(end.toISOString())} steht er wieder bereit; der Master-Prompt und die Übergabe bleiben unbegrenzt nutzbar.`),{status:429,code:'BUILD_QUOTA_EXHAUSTED'});
  return {allowed:true,used,limit};
}
// Ein Sandbox-Build startet eine echte Maschine mit Rechenzeit. Bisher galt nur eine Sperre pro
// Adresse und Zehnminutenfenster - ein Konto konnte damit den ganzen Tag bauen lassen. Gezaehlt
// wird ueber dieselben Nutzungsereignisse wie alles andere.
const SANDBOX_ACTION='sandbox-build';
const SANDBOX_LIMIT=Object.freeze({free:0,pro:20,ultimate:60});
async function assertSandboxBudget(req){
  const entitlement=await getEntitlements(req);
  if(entitlement.isAdmin)return {allowed:true};
  const limit=Number(SANDBOX_LIMIT[entitlement.plan||'free']||0);
  if(!limit)return {allowed:true};
  let user=null;try{user=await authenticatedUser(req)}catch{}
  if(!user?.id)return {allowed:true};
  const {start,end}=monthWindow();
  let used=0;
  try{
    const path=`/rest/v1/sitebrief_usage_events?select=id&user_id=eq.${encodeURIComponent(user.id)}&success=eq.true&action=eq.${SANDBOX_ACTION}&created_at=gte.${encodeURIComponent(start.toISOString())}&created_at=lt.${encodeURIComponent(end.toISOString())}&limit=200`;
    used=((await serviceFetch(path)).data||[]).length;
  }catch{return {allowed:true}}
  if(used>=limit)throw Object.assign(new Error(`Die isolierte Quellcode-Vorschau ist in diesem Monat ${limit}-mal gelaufen. Am ${nextResetText(end.toISOString())} steht sie wieder bereit.`),{status:429,code:'SANDBOX_QUOTA_EXHAUSTED'});
  return {allowed:true,used,limit};
}
function quotaErrorPayload(error){return {error:error?.message||'Monatskontingent nicht verfügbar.',code:error?.code||'QUOTA_ERROR',metric:error?.metric||null,quota:error?.quota||null}}

module.exports={PLAN_LIMITS,UNIT_EQUIVALENT,METRIC_ACTIONS,BUILD_LIMIT,SANDBOX_LIMIT,assertBuildBudget,assertSandboxBudget,getQuotaSummary,getTokenBudget,assertQuota,consumeWebsiteGeneration,consumePreviewRun,quotaErrorPayload};
