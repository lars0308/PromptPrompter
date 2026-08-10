const {resolveRecurringPriceObject,resolveOneTimePriceObject}=require('../server/stripe-rest');
const {requireAdmin,serviceFetch}=require('../server/admin');
const {TASKS,PROVIDERS}=require('../server/system-ai-profiles');

function formatStripePrice(price,fallback){
  if(!price)return fallback;
  const raw=price.unit_amount_decimal??price.unit_amount;
  const amount=Number(raw);
  if(!Number.isFinite(amount))return fallback;
  const currency=String(price.currency||'eur').toUpperCase();
  let value;
  try{value=new Intl.NumberFormat('de-DE',{style:'currency',currency,minimumFractionDigits:2}).format(amount/100)}catch{value=`${(amount/100).toFixed(2).replace('.',',')} €`}
  if(!price.recurring)return value;
  const count=Math.max(1,Number(price.recurring.interval_count)||1),labels={day:['Tag','Tage'],week:['Woche','Wochen'],month:['Monat','Monate'],year:['Jahr','Jahre']},pair=labels[price.recurring.interval]||[price.recurring.interval,price.recurring.interval];
  return count===1?`${value} / ${pair[0]}`:`${value} / ${count} ${pair[1]}`;
}

async function livePrice(loader,fallback){try{return formatStripePrice(await loader(),fallback)}catch{return fallback}}
async function serviceRows(path){
  try{
    const url=process.env.SUPABASE_URL||'https://wihdoacgqbyxxeejoxsg.supabase.co',key=process.env.SUPABASE_SERVICE_ROLE_KEY||'';if(!key)return [];
    const response=await fetch(`${url}${path}`,{headers:{apikey:key,Authorization:`Bearer ${key}`}});if(!response.ok)return [];
    return await response.json();
  }catch{return []}
}
async function previewRoutes(){
  const rows=await serviceRows('/rest/v1/sitebrief_preview_ai_routes?select=id,label,provider,model,priority,enabled&enabled=eq.true&order=priority.asc');
  return rows.map(x=>({id:x.id,label:x.label,provider:x.provider,model:x.model,priority:x.priority}));
}
async function systemAiRoutes(){
  const rows=await serviceRows('/rest/v1/sitebrief_system_ai_connections?select=provider,default_model,route_role,enabled,updated_at&enabled=eq.true');
  const rank={primary:0,fallback1:1,fallback2:2,manual:3};
  return rows.map(x=>({provider:String(x.provider||''),defaultModel:String(x.default_model||''),routeRole:String(x.route_role||'manual'),updatedAt:x.updated_at||null})).filter(x=>x.provider).sort((a,b)=>(rank[a.routeRole]??9)-(rank[b.routeRole]??9));
}
async function systemAiProfiles(){
  const rows=await serviceRows('/rest/v1/sitebrief_system_ai_profiles?select=id,label,provider,model,tasks,priority,enabled,updated_at&order=priority.asc,created_at.asc');
  return rows.map(x=>({id:x.id,label:String(x.label||''),provider:String(x.provider||''),model:String(x.model||''),tasks:Array.isArray(x.tasks)?x.tasks.map(String):[],priority:Number(x.priority)||100,enabled:x.enabled!==false,updatedAt:x.updated_at||null})).filter(x=>x.id&&PROVIDERS.includes(x.provider));
}
async function learningHints(){
  const rows=await serviceRows('/rest/v1/sitebrief_learning_examples?select=project_type,project_goal,lesson_summary,positive_signals,caution_signals,rating&allow_global=eq.true&rating=gte.4&order=created_at.desc&limit=18');
  return rows.map(row=>({projectType:String(row.project_type||'').slice(0,120),projectGoal:String(row.project_goal||'').slice(0,160),summary:String(row.lesson_summary||'').slice(0,700),positive:Array.isArray(row.positive_signals)?row.positive_signals.map(String).slice(0,6):[],cautions:Array.isArray(row.caution_signals)?row.caution_signals.map(String).slice(0,6):[],rating:Number(row.rating)||0})).filter(x=>x.summary);
}
function uuid(value){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value||''))}
function cleanModel(value){const model=String(value||'').trim();return model&&model.length<=190&&/^[a-zA-Z0-9@._:/-]+$/.test(model)?model:''}
async function systemSecret(provider){const result=await serviceFetch('/rest/v1/rpc/sitebrief_get_system_ai_connection_secret',{method:'POST',body:{p_provider:provider}});return typeof result.data==='string'?result.data.trim():''}
async function providerModels(provider,secret){
  let url,headers;
  if(provider==='gateway'){url='https://ai-gateway.vercel.sh/v1/models';headers={Authorization:`Bearer ${secret}`,'Content-Type':'application/json'};}
  else if(provider==='openai'){url='https://api.openai.com/v1/models';headers={Authorization:`Bearer ${secret}`,'Content-Type':'application/json'};}
  else if(provider==='gemini'){url='https://generativelanguage.googleapis.com/v1beta/models';headers={'x-goog-api-key':secret,'Content-Type':'application/json'};}
  else {const split=secret.indexOf(':');if(split<1)throw Object.assign(new Error('Cloudflare-Verbindung ist unvollständig.'),{status:400});const accountId=secret.slice(0,split),token=secret.slice(split+1);url=`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/models/search?per_page=100`;headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json'};}
  const response=await fetch(url,{headers}),data=await response.json().catch(()=>({}));
  if(!response.ok||data?.success===false)throw Object.assign(new Error(data?.error?.message||data?.errors?.[0]?.message||data?.message||'Modelle konnten nicht geladen werden.'),{status:response.status||400});
  const raw=provider==='gemini'?(data.models||[]).map(x=>String(x.name||'').replace(/^models\//,'')):provider==='cloudflare'?(data.result||[]).map(x=>x.name||x.id):(data.data||[]).map(x=>x.id);
  return raw.filter(Boolean).sort((a,b)=>String(a).localeCompare(String(b))).slice(0,800);
}
async function handleAdminPost(req,res){
  await requireAdmin(req);
  const body=req.body||{},action=String(body.action||'');
  if(action==='system-ai-profile-save'){
    const provider=String(body.provider||'').toLowerCase();if(!PROVIDERS.includes(provider))return res.status(400).json({error:'Unbekannte Verbindung.'});
    const model=cleanModel(body.model);if(!model)return res.status(400).json({error:'Bitte eine gültige Modell-ID angeben.'});
    const tasks=[...new Set((Array.isArray(body.tasks)?body.tasks:[]).map(x=>String(x).toLowerCase()).filter(x=>TASKS.includes(x)))];if(!tasks.length)return res.status(400).json({error:'Bitte mindestens eine Aufgabe auswählen.'});
    if(tasks.includes('image')&&!['gateway','openai','gemini','cloudflare'].includes(provider))return res.status(400).json({error:'Diese Verbindung unterstützt noch keine Bildvorschau.'});
    const row={label:String(body.label||'').trim().slice(0,100)||model,provider,model,tasks,priority:Math.max(1,Math.min(1000,Number(body.priority)||100)),enabled:body.enabled!==false,updated_at:new Date().toISOString()};if(uuid(body.id))row.id=body.id;
    await serviceFetch('/rest/v1/sitebrief_system_ai_profiles?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:row});return res.status(200).json({ok:true});
  }
  if(action==='system-ai-profile-delete'){
    if(!uuid(body.id))return res.status(400).json({error:'Ungültige System-KI.'});await serviceFetch(`/rest/v1/sitebrief_system_ai_profiles?id=eq.${encodeURIComponent(body.id)}`,{method:'DELETE'});return res.status(200).json({ok:true});
  }
  if(action==='system-ai-models'||action==='system-ai-profile-test'){
    const provider=String(body.provider||'').toLowerCase();if(!PROVIDERS.includes(provider))return res.status(400).json({error:'Unbekannte Verbindung.',models:[]});const secret=await systemSecret(provider);if(!secret)return res.status(503).json({error:'Für diese Verbindung ist noch kein zentraler API-Zugang gespeichert.',models:[]});const models=await providerModels(provider,secret),model=cleanModel(body.model);return res.status(200).json({ok:true,provider,models,modelFound:model?models.includes(model):undefined});
  }
  return res.status(400).json({error:'Unbekannte System-KI-Aktion.'});
}

module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  if(req.method==='POST'){
    try{return await handleAdminPost(req,res)}catch(error){return res.status(error.status||500).json({error:error.message||'System-KI konnte nicht verwaltet werden.'})}
  }
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const fallback={pro:process.env.PUBLIC_PRO_PRICE||'15,99 € / Monat',ultimate:process.env.PUBLIC_ULTIMATE_PRICE||'25,99 € / Monat',apiKeys:process.env.PUBLIC_API_KEYS_PRICE||'5,99 € / Monat',singleReview:process.env.PUBLIC_SINGLE_REVIEW_PRICE||'3,99 €'};
  const [pro,ultimate,apiKeys,singleReview,routes,systemRoutes,profiles,hints]=await Promise.all([
    livePrice(()=>resolveRecurringPriceObject('pro'),fallback.pro),
    livePrice(()=>resolveRecurringPriceObject('ultimate'),fallback.ultimate),
    livePrice(()=>resolveRecurringPriceObject('own_api_keys'),fallback.apiKeys),
    livePrice(()=>resolveOneTimePriceObject('single_review'),fallback.singleReview),
    previewRoutes(),systemAiRoutes(),systemAiProfiles(),learningHints()
  ]);
  res.status(200).json({
    supabaseUrl:process.env.SUPABASE_URL||'https://wihdoacgqbyxxeejoxsg.supabase.co',
    supabasePublishableKey:process.env.SUPABASE_PUBLISHABLE_KEY||'sb_publishable_h5mVvlW32Hd-9OVLpIODdA_ymCaNzPz',
    enabled:true,
    pricing:{pro,ultimate,apiKeys,singleReview,source:'stripe'},
    previewRoutes:routes,
    previewProviders:[...new Set(routes.map(x=>x.provider))],
    systemAiRoutes:systemRoutes,
    systemAiProviders:[...new Set(systemRoutes.map(x=>x.provider))],
    systemAiProfiles:profiles,
    learningHints:hints
  });
};
