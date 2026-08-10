const core=require('../server/generate-core');
const previewImage=require('../server/preview-image');
const sandboxBuild=require('../server/sandbox-build');
const freePrompt=require('../server/free-prompt-v2');
const {taskForAction,listProfiles}=require('../server/system-ai-profiles');
const {getQuotaSummary,assertQuota,consumeWebsiteGeneration,quotaErrorPayload}=require('../server/quota');

function captureResponse(){const state={status:200,body:null,headers:{}};return{state,setHeader(name,value){state.headers[String(name).toLowerCase()]=value;return this},getHeader(name){return state.headers[String(name).toLowerCase()]},status(code){state.status=Number(code)||500;return this},json(value){state.body=value;return this},end(value){state.body=value;return this}}}
function flush(res,captured){for(const [name,value] of Object.entries(captured.headers||{}))try{res.setHeader(name,value)}catch{}return res.status(captured.status||200).json(captured.body??{})}
function retryable(captured){
  const status=Number(captured.status)||500,error=String(captured.body?.error||'');
  if(/Zu viele Anfragen/i.test(error))return false;
  if([401,402,403].includes(status))return true;
  if(/valid credit card|add-credit-card|payment required|billing|authentication|unauthorized|forbidden|invalid api key|provider (?:is )?unavailable|insufficient quota/i.test(error))return true;
  return [408,429,500,502,503,504].includes(status);
}
async function runSystemProfiles(req,res){const task=taskForAction(req.body?.action),profiles=(await listProfiles(task,{providers:['gateway','openai','gemini']})).filter(x=>x.enabled!==false);if(!profiles.length)return core(req,res);const requested=String(req.body?.systemAiProfileId||''),ordered=requested?[...profiles.filter(x=>x.id===requested),...profiles.filter(x=>x.id!==requested)]:profiles,original=req.body;let last=null;for(const profile of ordered){req.body={...original,engine:profile.provider,model:profile.model,systemAiProfileId:profile.id,systemAiProfileLabel:profile.label};const captured=captureResponse();await core(req,captured);last=captured.state;if(last.status<400){res.setHeader('X-Prompt-AI-System-Profile',profile.label||profile.id);req.body=original;return flush(res,last)}if(!retryable(last)){req.body=original;return flush(res,last)}}req.body=original;return flush(res,last||{status:503,body:{error:`Keine System-KI für ${task} war verfügbar.`},headers:{}})}
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
  try{await assertQuota(req,'website_generations')}catch(error){return res.status(error?.status||429).json(quotaErrorPayload(error))}
  const captured=captureResponse();
  if(req.body?.systemAiProfileId&&req.body?.useOwnApi!==true)await runSystemProfiles(req,captured);else await core(req,captured);
  if(captured.state.status<400){try{await consumeWebsiteGeneration(req)}catch{}}
  return flush(res,captured.state);
}
module.exports=async function generateRouter(req,res){if(req.method==='POST'){const action=String(req.body?.action||'');if(['quota-summary','quota-check','quota-consume'].includes(action))return quotaRoute(req,res,action);if(action==='free-prompt'){if(!await enforce(req,res,'free_prompts'))return;return freePrompt(req,res)}if(action==='preview-image'){if(!await enforce(req,res,'ai_previews'))return;return previewImage(req,res)}if(action==='concepts')return websiteConceptRoute(req,res);if(action==='sandbox-build')return sandboxBuild(req,res);if(req.body?.systemAiProfileId&&req.body?.useOwnApi!==true)return runSystemProfiles(req,res)}return core(req,res)};
