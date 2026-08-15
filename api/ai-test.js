const { resolveProviderKey } = require('../server/provider-key');
const { rateLimit } = require('../server/rate-limit');
const { authenticatedUser } = require('../server/supabase-user');

// Der Test loest den zentralen Schluessel auf und spricht damit den Anbieter an. Ohne
// Anmeldung war das ein offener Weg, fremde Anbieterkonten zu belasten und nebenbei
// abzufragen, welche Verbindungen ueberhaupt stehen. Beides gehoert hinter ein Konto.
module.exports = async function handler(req,res){
  if(req.method !== 'GET') return res.status(405).json({error:'Method not allowed'});
  if(!rateLimit(req,res,{key:'ai-test',limit:10,windowMs:60000})) return;
  let user=null;try{user=await authenticatedUser(req)}catch{}
  if(!user) return res.status(401).json({error:'Bitte zuerst anmelden.',source:'none'});
  const provider = String(req.query?.provider || '').toLowerCase();
  if(!['gateway','openai','gemini','cloudflare','github'].includes(provider)) return res.status(400).json({error:'Unbekannter Anbieter'});
  try{
    const resolved = await resolveProviderKey(req, provider);
    if(!resolved.key) return res.status(503).json({error:'Kein API-Key verbunden. Öffne Einstellungen → KI-Verbindungen.',source:'none'});
    let url,headers;if(provider==='github'){url='https://api.github.com/user';headers={Authorization:`Bearer ${resolved.key}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};}else if(provider==='cloudflare'){const split=resolved.key.indexOf(':');if(split<1)throw new Error('Cloudflare-Verbindung ist unvollständig.');const accountId=resolved.key.slice(0,split),token=resolved.key.slice(split+1);url=`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/models/search?task=text-to-image&per_page=1`;headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json'};}else{url=provider === 'gateway' ? 'https://ai-gateway.vercel.sh/v1/models' : provider === 'gemini' ? 'https://generativelanguage.googleapis.com/v1beta/models' : 'https://api.openai.com/v1/models';headers=provider==='gemini'?{'x-goog-api-key':resolved.key,'Content-Type':'application/json'}:{Authorization:`Bearer ${resolved.key}`,'Content-Type':'application/json'};}
    const response = await fetch(url,{headers});
    const data = await response.json().catch(()=>({}));
    if(!response.ok) return res.status(response.status).json({error:data?.error?.message || data?.message || 'API-Key wurde vom Anbieter abgelehnt.',source:resolved.source});
    if(provider==='cloudflare' && data?.success===false) return res.status(401).json({error:data?.errors?.[0]?.message||'Cloudflare hat Account-ID oder Token abgelehnt.',source:resolved.source});
    const count = Array.isArray(data?.data) ? data.data.length : Array.isArray(data?.models)?data.models.length:Array.isArray(data?.result)?data.result.length:0;
    return res.status(200).json({ok:true,provider,source:resolved.source,models:count});
  }catch(error){
    return res.status(500).json({error:error?.message || 'Verbindungstest fehlgeschlagen'});
  }
};

