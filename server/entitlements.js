const {authenticatedUser,ownSubscription,ownApiAddon}=require('./supabase-user');
const ADMIN_EMAIL=String(process.env.PROMPT_AI_ADMIN_EMAIL||'service.battermann@gmx.de').trim().toLowerCase();

async function ownRow(req, table, select){
  const authorization=req?.headers?.authorization||req?.headers?.Authorization||'';
  if(!/^Bearer\s+\S+/i.test(authorization)) return null;
  const url=process.env.SUPABASE_URL||'https://wihdoacgqbyxxeejoxsg.supabase.co';
  const apikey=process.env.SUPABASE_PUBLISHABLE_KEY||'sb_publishable_h5mVvlW32Hd-9OVLpIODdA_ymCaNzPz';
  const response=await fetch(`${url}/rest/v1/${table}?select=${encodeURIComponent(select)}&limit=1`,{headers:{apikey,Authorization:authorization}});
  if(!response.ok)return null;
  return (await response.json())?.[0]||null;
}

async function getEntitlements(req){
  const [subscription,admin,apiAddon]=await Promise.all([
    ownRow(req,'sitebrief_subscriptions','plan,status'),
    ownRow(req,'sitebrief_admins','user_id'),
    ownRow(req,'sitebrief_addons','addon,status')
  ]);
  let isAdmin=false;
  if(admin?.user_id){
    try{const user=await authenticatedUser(req);isAdmin=String(user?.email||'').trim().toLowerCase()===ADMIN_EMAIL&&String(user?.id||'')===String(admin.user_id)}catch{isAdmin=false}
  }
  const active=['active','trialing'].includes(subscription?.status);
  const paidPlan=active&&['pro','ultimate'].includes(subscription?.plan)?subscription.plan:'free';
  const addonActive=apiAddon?.addon==='own_api_keys'&&['active','trialing'].includes(apiAddon?.status);
  const ownApiKeys=paidPlan==='ultimate'||(paidPlan==='pro'&&addonActive);
  const plan=paidPlan;
  return {plan,isAdmin,ownApiKeys,maxConcepts:plan==='ultimate'?5:plan==='pro'?4:3};
}

module.exports={getEntitlements};
