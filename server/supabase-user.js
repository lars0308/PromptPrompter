const SUPABASE_URL=process.env.SUPABASE_URL||'https://wihdoacgqbyxxeejoxsg.supabase.co';
const PUBLISHABLE_KEY=process.env.SUPABASE_PUBLISHABLE_KEY||'sb_publishable_h5mVvlW32Hd-9OVLpIODdA_ymCaNzPz';

function authorization(req){return req?.headers?.authorization||req?.headers?.Authorization||''}
async function authenticatedUser(req){
  const bearer=authorization(req);if(!/^Bearer\s+\S+/i.test(bearer))throw Object.assign(new Error('Bitte zuerst anmelden.'),{status:401});
  const response=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:PUBLISHABLE_KEY,Authorization:bearer}});if(!response.ok)throw Object.assign(new Error('Sitzung ist nicht mehr gültig.'),{status:401});return response.json();
}
async function ownSubscription(req){
  const response=await fetch(`${SUPABASE_URL}/rest/v1/sitebrief_subscriptions?select=*&limit=1`,{headers:{apikey:PUBLISHABLE_KEY,Authorization:authorization(req)}});if(!response.ok)return null;return (await response.json())?.[0]||null;
}
async function ownApiAddon(req){
  const response=await fetch(`${SUPABASE_URL}/rest/v1/sitebrief_addons?select=*&addon=eq.own_api_keys&limit=1`,{headers:{apikey:PUBLISHABLE_KEY,Authorization:authorization(req)}});if(!response.ok)return null;return (await response.json())?.[0]||null;
}
module.exports={SUPABASE_URL,PUBLISHABLE_KEY,authorization,authenticatedUser,ownSubscription,ownApiAddon};
