const core=require('../server/generate-core');
const previewImage=require('../server/preview-image');
const sandboxBuild=require('../server/sandbox-build');
const {taskForAction,listProfiles}=require('../server/system-ai-profiles');

function captureResponse(){
  const state={status:200,body:null,headers:{}};
  return {
    state,
    setHeader(name,value){state.headers[String(name).toLowerCase()]=value;return this},
    getHeader(name){return state.headers[String(name).toLowerCase()]},
    status(code){state.status=Number(code)||500;return this},
    json(value){state.body=value;return this},
    end(value){state.body=value;return this}
  };
}
function flush(res,captured){for(const [name,value] of Object.entries(captured.headers||{}))try{res.setHeader(name,value)}catch{}return res.status(captured.status||200).json(captured.body??{})}
function retryable(captured){const status=Number(captured.status)||500,error=String(captured.body?.error||'');if(/Zu viele Anfragen/i.test(error))return false;return [408,429,500,502,503,504].includes(status)}
async function runSystemProfiles(req,res){
  const task=taskForAction(req.body?.action),profiles=(await listProfiles(task,{providers:['gateway','openai','gemini']})).filter(x=>x.enabled!==false);if(!profiles.length)return core(req,res);
  const requested=String(req.body?.systemAiProfileId||''),ordered=requested?[...profiles.filter(x=>x.id===requested),...profiles.filter(x=>x.id!==requested)]:profiles;
  const original=req.body;let last=null;
  for(const profile of ordered){
    req.body={...original,engine:profile.provider,model:profile.model,systemAiProfileId:profile.id,systemAiProfileLabel:profile.label};
    const captured=captureResponse();await core(req,captured);last=captured.state;
    if(last.status<400){res.setHeader('X-Prompt-AI-System-Profile',profile.label||profile.id);req.body=original;return flush(res,last)}
    if(!retryable(last)){req.body=original;return flush(res,last)}
  }
  req.body=original;return flush(res,last||{status:503,body:{error:`Keine System-KI für ${task} war verfügbar.`},headers:{}})
}

module.exports=async function generateRouter(req,res){
  if(req.method==='POST'){
    const action=String(req.body?.action||'');
    if(action==='preview-image')return previewImage(req,res);
    if(action==='sandbox-build')return sandboxBuild(req,res);
    if(req.body?.systemAiProfileId&&req.body?.useOwnApi!==true)return runSystemProfiles(req,res);
  }
  return core(req,res);
};
