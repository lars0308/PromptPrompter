const { resolveProviderKey } = require('../server/provider-key');

module.exports = async function handler(req,res){
  if(req.method !== 'GET') return res.status(405).json({error:'Method not allowed'});
  const provider = String(req.query?.provider || '').toLowerCase();
  if(!['gateway','openai'].includes(provider)) return res.status(400).json({error:'Unbekannter KI-Anbieter'});
  try{
    const resolved = await resolveProviderKey(req, provider);
    if(!resolved.key) return res.status(503).json({error:'Kein API-Key verbunden. Öffne Einstellungen → KI-Verbindungen.',source:'none'});
    const url = provider === 'gateway' ? 'https://ai-gateway.vercel.sh/v1/models' : 'https://api.openai.com/v1/models';
    const response = await fetch(url,{headers:{Authorization:`Bearer ${resolved.key}`,'Content-Type':'application/json'}});
    const data = await response.json().catch(()=>({}));
    if(!response.ok) return res.status(response.status).json({error:data?.error?.message || data?.message || 'API-Key wurde vom Anbieter abgelehnt.',source:resolved.source});
    const count = Array.isArray(data?.data) ? data.data.length : 0;
    return res.status(200).json({ok:true,provider,source:resolved.source,models:count});
  }catch(error){
    return res.status(500).json({error:error?.message || 'Verbindungstest fehlgeschlagen'});
  }
};
