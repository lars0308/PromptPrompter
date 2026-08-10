const {serviceFetch}=require('./admin');

const TASKS=['analysis','questions','prompt','freeprompt','website','image','learning'];
const PROVIDERS=['gateway','openai','gemini','cloudflare'];

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
async function listProfiles(task,{enabledOnly=true,providers=[]}={}){
  const cleanTask=validTask(task);if(!cleanTask)return [];
  try{
    let path='/rest/v1/sitebrief_system_ai_profiles?select=id,label,provider,model,tasks,priority,enabled,updated_at,last_test_at,last_test_ok,last_test_ms,last_error';
    if(enabledOnly)path+='&enabled=eq.true';
    path+=`&tasks=cs.{${encodeURIComponent(cleanTask)}}&order=priority.asc,created_at.asc`;
    const response=await serviceFetch(path),allowed=new Set((providers||[]).filter(x=>PROVIDERS.includes(x)));
    return (response.data||[]).filter(row=>PROVIDERS.includes(row.provider)&&(!allowed.size||allowed.has(row.provider)));
  }catch{return []}
}

module.exports={TASKS,PROVIDERS,validTask,taskForAction,listProfiles};
