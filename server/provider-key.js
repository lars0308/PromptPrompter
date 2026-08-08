const DEFAULT_SUPABASE_URL = 'https://wihdoacgqbyxxeejoxsg.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_h5mVvlW32Hd-9OVLpIODdA_ymCaNzPz';

function envKey(provider){
  if(provider === 'gateway') return process.env.AI_GATEWAY_API_KEY || '';
  if(provider === 'openai') return process.env.OPENAI_API_KEY || '';
  return '';
}

async function accountKey(req, provider){
  const authorization = req?.headers?.authorization || req?.headers?.Authorization || '';
  if(!authorization || !/^Bearer\s+\S+/i.test(authorization)) return '';
  const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY;
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sitebrief_get_ai_connection_secret`, {
    method: 'POST',
    headers: {
      apikey: publishableKey,
      Authorization: authorization,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_provider: provider })
  });
  if(!response.ok) return '';
  const data = await response.json();
  return typeof data === 'string' ? data.trim() : '';
}

async function resolveProviderKey(req, provider){
  try{
    const stored = await accountKey(req, provider);
    if(stored) return { key: stored, source: 'account' };
  }catch{}
  const fallback = envKey(provider);
  if(fallback) return { key: fallback, source: 'server' };
  return { key: '', source: 'none' };
}

module.exports = { resolveProviderKey };
