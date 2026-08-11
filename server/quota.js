const {getEntitlements}=require('./entitlements');
const {authenticatedUser}=require('./supabase-user');
const {serviceFetch}=require('./admin');

const PLAN_LIMITS=Object.freeze({
  free:{free_prompts:10,website_generations:3,ai_previews:0},
  pro:{free_prompts:100,website_generations:25,ai_previews:50},
  ultimate:{free_prompts:500,website_generations:100,ai_previews:250}
});
let limitsCache=null,limitsCacheAt=0;
const LIMITS_CACHE_MS=30000;
async function loadPlanLimits(){
  if(limitsCache&&Date.now()-limitsCacheAt<LIMITS_CACHE_MS)return limitsCache;
  try{
    const rows=(await serviceFetch('/rest/v1/sitebrief_quota_limits?select=plan,free_prompts,website_generations,ai_previews')).data||[];
    const merged={free:{...PLAN_LIMITS.free},pro:{...PLAN_LIMITS.pro},ultimate:{...PLAN_LIMITS.ultimate}};
    for(const row of rows){if(merged[row.plan])merged[row.plan]={free_prompts:Number(row.free_prompts)||0,website_generations:Number(row.website_generations)||0,ai_previews:Number(row.ai_previews)||0}}
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
  const path=`/rest/v1/sitebrief_usage_events?select=action&user_id=eq.${encodeURIComponent(userId)}&success=eq.true&action=in.(${encodeURIComponent(actions).replace(/%2C/g,',')})&created_at=gte.${encodeURIComponent(start.toISOString())}&created_at=lt.${encodeURIComponent(end.toISOString())}&limit=2000`;
  return (await serviceFetch(path)).data||[];
}

async function getQuotaSummary(req){
  const entitlement=await getEntitlements(req),plan=entitlement.plan||'free',limits=await limitsFor(plan),{start,end}=monthWindow();
  let user=null;try{user=await authenticatedUser(req)}catch{}
  let available=true,rows=[];
  if(user){try{rows=await usageRows(user.id,start,end)}catch{available=false}}
  const counts={free_prompts:0,website_generations:0,ai_previews:0};
  for(const row of rows){for(const [metric,action] of Object.entries(METRIC_ACTIONS))if(row?.action===action)counts[metric]++}
  const metrics={};for(const key of Object.keys(counts))metrics[key]=metricResult(limits[key],counts[key]);
  return {plan,isAdmin:Boolean(entitlement.isAdmin),authenticated:Boolean(user),available,enforced:Boolean(user)&&available&&!entitlement.isAdmin,periodStart:start.toISOString(),periodEnd:end.toISOString(),metrics};
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

async function consumeWebsiteGeneration(req){
  const checked=await assertQuota(req,'website_generations');
  if(!checked.summary.authenticated||!checked.summary.available)return getQuotaSummary(req);
  const user=await authenticatedUser(req);
  await serviceFetch('/rest/v1/sitebrief_usage_events',{method:'POST',headers:{Prefer:'return=minimal'},body:{user_id:user.id,action:METRIC_ACTIONS.website_generations,provider:'prompt-ai',model:'',success:true,error_message:'',project_name:'Website-Projekt',project_type:'Website',project_goal:''}});
  return getQuotaSummary(req);
}

function quotaErrorPayload(error){return {error:error?.message||'Monatskontingent nicht verfügbar.',code:error?.code||'QUOTA_ERROR',metric:error?.metric||null,quota:error?.quota||null}}

module.exports={PLAN_LIMITS,METRIC_ACTIONS,getQuotaSummary,assertQuota,consumeWebsiteGeneration,quotaErrorPayload};
