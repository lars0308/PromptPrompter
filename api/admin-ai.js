const {requireAdmin,serviceFetch,listAll}=require('../server/admin');

const PROVIDERS=['gateway','openai','gemini','cloudflare'];
function validProvider(value){const provider=String(value||'').toLowerCase();if(!PROVIDERS.includes(provider))throw Object.assign(new Error('Unbekannter KI-Anbieter.'),{status:400});return provider}
async function systemSecret(provider){const response=await serviceFetch('/rest/v1/rpc/sitebrief_get_system_ai_connection_secret',{method:'POST',body:{p_provider:provider}});return typeof response.data==='string'?response.data.trim():''}
async function testProvider(provider,secret){
  let url,headers;
  if(provider==='gateway'){url='https://ai-gateway.vercel.sh/v1/models';headers={Authorization:`Bearer ${secret}`,'Content-Type':'application/json'};}
  else if(provider==='openai'){url='https://api.openai.com/v1/models';headers={Authorization:`Bearer ${secret}`,'Content-Type':'application/json'};}
  else if(provider==='gemini'){url='https://generativelanguage.googleapis.com/v1beta/models';headers={'x-goog-api-key':secret,'Content-Type':'application/json'};}
  else {const split=secret.indexOf(':');if(split<1)throw Object.assign(new Error('Cloudflare benötigt Account-ID und API-Token.'),{status:400});const accountId=secret.slice(0,split),token=secret.slice(split+1);url=`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/models/search?per_page=5`;headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json'};}
  const response=await fetch(url,{headers});const data=await response.json().catch(()=>({}));
  if(!response.ok||data?.success===false)throw Object.assign(new Error(data?.error?.message||data?.errors?.[0]?.message||data?.message||'API-Zugang wurde vom Anbieter abgelehnt.'),{status:response.status||400});
  const raw=provider==='gemini'?(data.models||[]).map(x=>String(x.name||'').replace(/^models\//,'')):provider==='cloudflare'?(data.result||[]).map(x=>x.name||x.id):(data.data||[]).map(x=>x.id);
  return raw.filter(Boolean).slice(0,100);
}

module.exports=async function(req,res){
  try{
    await requireAdmin(req);
    if(req.method==='GET'){
      const connections=await listAll('sitebrief_system_ai_connections','provider,last4,enabled,default_model,route_role,updated_at','&order=provider.asc');
      return res.status(200).json({connections});
    }
    if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
    const body=req.body||{},action=String(body.action||'');
    const provider=validProvider(body.provider);
    if(action==='save'){
      let secret=String(body.secret||'').trim();
      if(provider==='cloudflare'&&body.accountId&&body.apiToken)secret=`${String(body.accountId).trim()}:${String(body.apiToken).trim()}`;
      const result=await serviceFetch('/rest/v1/rpc/sitebrief_admin_set_system_ai_connection',{method:'POST',body:{p_provider:provider,p_secret:secret||null,p_default_model:String(body.defaultModel||'').trim(),p_enabled:body.enabled!==false,p_route_role:String(body.routeRole||'manual')}});
      return res.status(200).json({ok:true,connection:result.data});
    }
    if(action==='delete'){
      await serviceFetch('/rest/v1/rpc/sitebrief_admin_delete_system_ai_connection',{method:'POST',body:{p_provider:provider}});
      return res.status(200).json({ok:true});
    }
    if(action==='test'||action==='models'){
      const secret=await systemSecret(provider);if(!secret)throw Object.assign(new Error('Für diesen Anbieter ist kein zentraler Key gespeichert.'),{status:503});
      const models=await testProvider(provider,secret);
      return res.status(200).json({ok:true,provider,models});
    }
    return res.status(400).json({error:'Unbekannte Aktion.'});
  }catch(error){return res.status(error.status||500).json({error:error.message||'KI-Verwaltung fehlgeschlagen.'})}
};
