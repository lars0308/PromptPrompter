const DEFAULT_SUPABASE_URL = 'https://wihdoacgqbyxxeejoxsg.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_h5mVvlW32Hd-9OVLpIODdA_ymCaNzPz';

async function ownRow(req, table, select){
  const authorization=req?.headers?.authorization||req?.headers?.Authorization||'';
  if(!/^Bearer\s+\S+/i.test(authorization)) return null;
  const url=process.env.SUPABASE_URL||DEFAULT_SUPABASE_URL;
  const apikey=process.env.SUPABASE_PUBLISHABLE_KEY||DEFAULT_SUPABASE_PUBLISHABLE_KEY;
  const response=await fetch(`${url}/rest/v1/${table}?select=${encodeURIComponent(select)}&limit=1`,{headers:{apikey,Authorization:authorization}});
  if(!response.ok)return null;
  return (await response.json())?.[0]||null;
}

async function getEntitlements(req){
  const [subscription,admin]=await Promise.all([
    ownRow(req,'sitebrief_subscriptions','plan,status'),
    ownRow(req,'sitebrief_admins','user_id')
  ]);
  const isAdmin=Boolean(admin?.user_id);
  const active=['active','trialing'].includes(subscription?.status);
  const plan=isAdmin?'ultimate':(active&&['pro','ultimate'].includes(subscription?.plan)?subscription.plan:'free');
  return {plan,isAdmin,maxConcepts:plan==='ultimate'?5:plan==='pro'?4:3};
}

module.exports={getEntitlements};
