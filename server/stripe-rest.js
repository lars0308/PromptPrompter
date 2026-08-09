function stripeKey(){const key=process.env.STRIPE_SECRET_KEY||'';if(!key)throw Object.assign(new Error('Stripe ist noch nicht eingerichtet. Hinterlege STRIPE_SECRET_KEY und die beiden Preis-IDs in Vercel.'),{status:503});return key}
async function stripeRequest(path,params){
  const body=new URLSearchParams();for(const [key,value] of Object.entries(params||{}))if(value!==undefined&&value!==null)body.append(key,String(value));
  const response=await fetch(`https://api.stripe.com/v1/${path}`,{method:'POST',headers:{Authorization:`Bearer ${stripeKey()}`,'Content-Type':'application/x-www-form-urlencoded'},body});const data=await response.json();if(!response.ok)throw Object.assign(new Error(data.error?.message||'Stripe-Anfrage fehlgeschlagen'),{status:response.status});return data;
}
async function stripeGet(path,params={}){
  const query=new URLSearchParams();for(const [key,value] of Object.entries(params))if(value!==undefined&&value!==null)query.append(key,String(value));
  const response=await fetch(`https://api.stripe.com/v1/${path}${query.size?`?${query}`:''}`,{headers:{Authorization:`Bearer ${stripeKey()}`}});const data=await response.json();if(!response.ok)throw Object.assign(new Error(data.error?.message||'Stripe-Anfrage fehlgeschlagen'),{status:response.status});return data;
}
async function resolveRecurringPrice(product){
  const plan=String(product||'').toLowerCase();
  const envName={pro:'STRIPE_PRO_PRICE_ID',ultimate:'STRIPE_ULTIMATE_PRICE_ID',own_api_keys:'STRIPE_API_KEYS_PRICE_ID'}[plan];
  const configured=String(process.env[envName]||'').trim();
  if(configured.startsWith('price_'))return configured;
  if(configured.startsWith('prod_')){
    const stripeProduct=await stripeGet(`products/${encodeURIComponent(configured)}`,{'expand[]':'default_price'});
    if(stripeProduct.default_price?.active&&stripeProduct.default_price?.recurring)return stripeProduct.default_price.id;
  }
  const lookupKeys={pro:['sitebrief_pro','prompt_ai_pro','pro'],ultimate:['sitebrief_ultimate','prompt_ai_ultimate','ultimate'],own_api_keys:['sitebrief_own_api_keys','prompt_ai_own_api_keys','own_api_keys']}[plan]||[];
  for(const lookupKey of lookupKeys){
    const result=await stripeGet('prices',{active:'true',type:'recurring','lookup_keys[0]':lookupKey,limit:10});
    const match=(result.data||[]).find(price=>price.active&&price.recurring);
    if(match)return match.id;
  }
  const result=await stripeGet('prices',{active:'true',type:'recurring',limit:100,'expand[]':'data.product'});
  const exact=(result.data||[]).filter(price=>{
    const pricePlan=String(price.metadata?.plan||price.metadata?.sitebrief_plan||'').toLowerCase();
    const productPlan=String(price.product?.metadata?.plan||price.product?.metadata?.sitebrief_plan||'').toLowerCase();
    return price.active&&price.recurring&&(pricePlan===plan||productPlan===plan);
  });
  if(exact.length===1)return exact[0].id;
  const names={pro:/\bpro\b/i,ultimate:/\bultimate\b/i,own_api_keys:/(api.?key|eigene.?keys)/i};
  const byName=(result.data||[]).filter(price=>price.active&&price.recurring&&names[plan]?.test(String(price.product?.name||price.nickname||'')));
  if(byName.length===1)return byName[0].id;
  const detail=exact.length>1||byName.length>1?'Mehrere passende aktive Preise wurden gefunden. Vergib in Stripe einen eindeutigen Lookup-Key.':`Kein aktiver wiederkehrender Stripe-Preis für „${plan}“ gefunden.`;
  throw Object.assign(new Error(`${detail} Erwartet: ${lookupKeys[0]||envName} oder ${envName} in dieser Vercel-Umgebung.`),{status:503});
}
module.exports={stripeRequest,stripeGet,resolveRecurringPrice};
