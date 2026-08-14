const {serviceFetch}=require('./admin');

const TASKS=['analysis','questions','prompt','freeprompt','website','image','learning'];
const PROVIDERS=['gateway','openai','gemini','cloudflare'];
const PLANS=['free','pro','ultimate'];

function validTask(value){const task=String(value||'').toLowerCase();return TASKS.includes(task)?task:''}
function taskForAction(action){
  const value=String(action||'').toLowerCase();
  if(value==='revision-brief'||value==='intake')return 'analysis';
  if(value==='review')return 'questions';
  if(value==='free-prompt')return 'freeprompt';
  if(value==='website')return 'website';
  if(value==='preview-image')return 'image';
  if(value==='learning-feedback')return 'learning';
  return 'prompt';
}
// A profile can serve any combination of plans. Passing a plan returns only the AIs that plan is
// allowed to use, in priority order - that is the whole "first, second, third choice per tier"
// mechanism. Without a plan (admin tooling) the full list comes back, and a profile from before
// the plans column serves everyone.
async function listProfiles(task,{enabledOnly=true,providers=[],plan=''}={}){
  const cleanTask=validTask(task);if(!cleanTask)return [];
  try{
    let path='/rest/v1/sitebrief_system_ai_profiles?select=id,label,provider,model,tasks,plans,priority,enabled,updated_at,last_test_at,last_test_ok,last_test_ms,last_error';
    if(enabledOnly)path+='&enabled=eq.true';
    path+=`&tasks=cs.{${encodeURIComponent(cleanTask)}}&order=priority.asc,created_at.asc`;
    const response=await serviceFetch(path),allowed=new Set((providers||[]).filter(x=>PROVIDERS.includes(x)));
    const wanted=PLANS.includes(String(plan||''))?String(plan):'';
    return (response.data||[]).filter(row=>PROVIDERS.includes(row.provider)&&(!allowed.size||allowed.has(row.provider))&&servesPlan(row,wanted));
  }catch{return []}
}
function servesPlan(row,plan){
  if(!plan)return true;
  const plans=Array.isArray(row?.plans)?row.plans.filter(x=>PLANS.includes(String(x))):[];
  return plans.length?plans.includes(plan):true;
}
function cleanPlans(value){
  const list=[...new Set((Array.isArray(value)?value:[]).map(x=>String(x||'').toLowerCase()).filter(x=>PLANS.includes(x)))];
  return list.length?PLANS.filter(plan=>list.includes(plan)):[...PLANS];
}

module.exports={TASKS,PROVIDERS,PLANS,validTask,taskForAction,listProfiles,cleanPlans,servesPlan};
