const DEFAULT_SUPABASE_URL = 'https://wihdoacgqbyxxeejoxsg.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_h5mVvlW32Hd-9OVLpIODdA_ymCaNzPz';
const {getEntitlements}=require('./entitlements');

function envKey(provider){
  if(provider === 'gateway') return process.env.AI_GATEWAY_API_KEY || '';
  if(provider === 'openai') return process.env.OPENAI_API_KEY || '';
  if(provider === 'gemini') return process.env.GEMINI_API_KEY || '';
  if(provider === 'cloudflare' && process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN) return `${process.env.CLOUDFLARE_ACCOUNT_ID}:${process.env.CLOUDFLARE_API_TOKEN}`;
  if(provider === 'github') return process.env.GITHUB_EXPORT_TOKEN || '';
  return '';
}

async function accountKey(req, provider){
  const authorization = req?.headers?.authorization || req?.headers?.Authorization || '';
  if(!authorization || !/^Bearer\s+\S+/i.test(authorization)) return '';
  const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY;
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sitebrief_get_ai_connection_secret`, {
    method: 'POST',
    headers: {apikey: publishableKey,Authorization: authorization,'Content-Type': 'application/json'},
    body: JSON.stringify({ p_provider: provider })
  });
  if(!response.ok) return '';
  const data = await response.json();
  return typeof data === 'string' ? data.trim() : '';
}

async function systemConnection(provider){
  if(provider === 'github') return {key:'',defaultModel:'',routeRole:'manual'};
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if(!serviceRoleKey) return {key:'',defaultModel:'',routeRole:'manual'};
  const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const headers={apikey:serviceRoleKey,Authorization:`Bearer ${serviceRoleKey}`,'Content-Type':'application/json'};
  const metaResponse=await fetch(`${supabaseUrl}/rest/v1/sitebrief_system_ai_connections?select=provider,enabled,default_model,route_role&provider=eq.${encodeURIComponent(provider)}&enabled=eq.true&limit=1`,{headers});
  const meta=metaResponse.ok?(await metaResponse.json())?.[0]:null;
  if(!meta)return {key:'',defaultModel:'',routeRole:'manual'};
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sitebrief_get_system_ai_connection_secret`, {
    method: 'POST',headers,body: JSON.stringify({ p_provider: provider })
  });
  if(!response.ok) return {key:'',defaultModel:String(meta.default_model||''),routeRole:String(meta.route_role||'manual')};
  const data = await response.json();
  return {key:typeof data === 'string' ? data.trim() : '',defaultModel:String(meta.default_model||''),routeRole:String(meta.route_role||'manual')};
}

async function resolveProviderKey(req, provider, options={}){
  const systemOnly=Boolean(options.systemOnly);
  if(!systemOnly){
    try{
      const entitlement=await getEntitlements(req);
      if(entitlement.ownApiKeys){
        const stored = await accountKey(req, provider);
        if(stored) return { key: stored, source: 'account', defaultModel:'', routeRole:'personal' };
      }
    }catch{}
  }
  try{
    const central = await systemConnection(provider);
    if(central.key) return { key: central.key, source: 'system', defaultModel:central.defaultModel, routeRole:central.routeRole };
  }catch{}
  const fallback = envKey(provider);
  if(fallback) return { key: fallback, source: 'server', defaultModel:'', routeRole:'fallback' };
  return { key: '', source: 'none', defaultModel:'', routeRole:'none' };
}

module.exports = { resolveProviderKey };
