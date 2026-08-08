const { resolveProviderKey } = require('../server/provider-key');

module.exports = async function handler(req,res){
  if(req.method!=="GET") return res.status(405).json({error:"Method not allowed"});
  try{
    const resolved = await resolveProviderKey(req,'gateway');
    if(!resolved.key) return res.status(503).json({error:'Kein Vercel AI Gateway Key verbunden.',models:[]});
    const response=await fetch("https://ai-gateway.vercel.sh/v1/models",{headers:{Authorization:`Bearer ${resolved.key}`,"Content-Type":"application/json"}});
    const data=await response.json();
    if(!response.ok) return res.status(response.status).json({error:data.error?.message||data.message||"Could not load models",models:[]});
    const models=(data.data||[]).map(x=>x.id).filter(Boolean).sort((a,b)=>a.localeCompare(b));
    return res.status(200).json({models,source:resolved.source});
  }catch(error){return res.status(500).json({error:error?.message||"Could not load models",models:[]});}
};
