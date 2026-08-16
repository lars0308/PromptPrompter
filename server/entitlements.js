const MAX_API_KEY_SLOTS=4;
const {authenticatedUser,ownSubscription,ownApiAddon}=require('./supabase-user');

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
    ownRow(req,'sitebrief_addons','addon,status,quantity')
  ]);
  // The row is read with the caller's own token under an own-row RLS policy; comparing the ids
  // keeps that guarantee even if the policy is ever changed. Membership in sitebrief_admins is
  // what grants admin now - the owner address is one entry in that table, not the only way in.
  let isAdmin=false;
  if(admin?.user_id){
    try{const user=await authenticatedUser(req);const id=String(user?.id||'');isAdmin=Boolean(id)&&id===String(admin.user_id)}catch{isAdmin=false}
  }
  const active=['active','trialing'].includes(subscription?.status);
  const paidPlan=active&&['pro','ultimate'].includes(subscription?.plan)?subscription.plan:'free';
  const addonActive=apiAddon?.addon==='own_api_keys'&&['active','trialing'].includes(apiAddon?.status);
  const plan=isAdmin?'ultimate':paidPlan;
  // Ultimate enthaelt zwei eigene KI-Verbindungen. Genau das sagt die Tarifkarte zu ("2 eigene
  // KI-Verbindungen inklusive"), waehrend hier bis eben gar nichts im Tarif enthalten war: ein
  // Ultimate-Konto stand ohne zusaetzlich gekauftes Add-on mit null Slots da und konnte keinen
  // eigenen Schluessel hinterlegen. Ein trotzdem gebuchtes Add-on kommt oben drauf, gedeckelt
  // bei MAX_API_KEY_SLOTS - wer nachkauft, verliert das Enthaltene nicht.
  const includedSlots=plan==='ultimate'?2:0;
  const addonSlots=addonActive?Math.max(1,Math.min(MAX_API_KEY_SLOTS,Number(apiAddon?.quantity)||1)):0;
  const apiKeySlots=isAdmin?MAX_API_KEY_SLOTS:Math.min(MAX_API_KEY_SLOTS,includedSlots+addonSlots);
  const ownApiKeys=apiKeySlots>0;
  return {plan,isAdmin,ownApiKeys,apiKeySlots,maxConcepts:plan==='ultimate'?5:plan==='pro'?4:3};
}

module.exports={getEntitlements};
