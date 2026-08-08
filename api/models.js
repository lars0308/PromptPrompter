const { resolveProviderKey } = require('../server/provider-key');

module.exports = async function handler(req,res){
  if(req.method!=="GET") return res.status(405).json({error:"Method not allowed"});
  try{
    const provider=String(req.query?.provider||'gateway').toLowerCase();if(!['gateway','gemini'].includes(provider))return res.status(400).json({error:'Unbekannter Anbieter',models:[]});
    const resolved = await resolveProviderKey(req,provider);
    if(!resolved.key) return res.status(503).json({error:'Kein API-Key verbunden.',models:[]});
    const url=provider==='gemini'?'https://generativelanguage.googleapis.com/v1beta/models':'https://ai-gateway.vercel.sh/v1/models';
    const headers=provider==='gemini'?{'x-goog-api-key':resolved.key,"Content-Type":"application/json"}:{Authorization:`Bearer ${resolved.key}`,"Content-Type":"application/json"};
    const response=await fetch(url,{headers});
    const data=await response.json();
    if(!response.ok) return res.status(response.status).json({error:data.error?.message||data.message||"Could not load models",models:[]});
    const raw=provider==='gemini'?(data.models||[]).filter(x=>(x.supportedGenerationMethods||[]).includes('generateContent')).map(x=>String(x.name||'').replace(/^models\//,'')):(data.data||[]).map(x=>x.id);
    const models=raw.filter(Boolean).sort((a,b)=>a.localeCompare(b));
    return res.status(200).json({models,source:resolved.source});
  }catch(error){return res.status(500).json({error:error?.message||"Could not load models",models:[]});}
};
