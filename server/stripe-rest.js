function stripeKey(){const key=process.env.STRIPE_SECRET_KEY||'';if(!key)throw Object.assign(new Error('Stripe ist noch nicht eingerichtet. Hinterlege STRIPE_SECRET_KEY und die Preis-IDs in Vercel.'),{status:503});return key}
async function stripeRequest(path,params){
  const body=new URLSearchParams();for(const [key,value] of Object.entries(params||{}))if(value!==undefined&&value!==null)body.append(key,String(value));
  const response=await fetch(`https://api.stripe.com/v1/${path}`,{method:'POST',headers:{Authorization:`Bearer ${stripeKey()}`,'Content-Type':'application/x-www-form-urlencoded'},body});const data=await response.json();if(!response.ok)throw Object.assign(new Error(data.error?.message||'Stripe-Anfrage fehlgeschlagen'),{status:response.status});return data;
}
async function stripeGet(path,params={}){
  const query=new URLSearchParams();for(const [key,value] of Object.entries(params))if(value!==undefined&&value!==null)query.append(key,String(value));
  const response=await fetch(`https://api.stripe.com/v1/${path}${query.size?`?${query}`:''}`,{headers:{Authorization:`Bearer ${stripeKey()}`}});const data=await response.json();if(!response.ok)throw Object.assign(new Error(data.error?.message||'Stripe-Anfrage fehlgeschlagen'),{status:response.status});return data;
}
async function productDefaultPrice(productId,recurring){
  if(!String(productId||'').startsWith('prod_'))return null;
  const product=await stripeGet(`products/${encodeURIComponent(productId)}`,{'expand[]':'default_price'}),price=product?.default_price;
  if(!price||typeof price==='string'||price.active===false)return null;
  if(recurring&&!price.recurring)return null;
  if(!recurring&&price.recurring)return null;
  return price;
}
async function configuredPriceObject(configured,recurring){
  const value=String(configured||'').trim();
  if(value.startsWith('prod_'))return productDefaultPrice(value,recurring);
  if(!value.startsWith('price_'))return null;
  const price=await stripeGet(`prices/${encodeURIComponent(value)}`);
  const productId=typeof price.product==='string'?price.product:price.product?.id;
  const currentDefault=await productDefaultPrice(productId,recurring).catch(()=>null);
  if(currentDefault)return currentDefault;
  if(price.active!==false&&(recurring?Boolean(price.recurring):!price.recurring))return price;
  return null;
}
async function resolveRecurringPriceObject(product){
  const plan=String(product||'').toLowerCase();
  const envName={pro:'STRIPE_PRO_PRICE_ID',ultimate:'STRIPE_ULTIMATE_PRICE_ID',own_api_keys:'STRIPE_API_KEYS_PRICE_ID'}[plan];
  const configured=envName?String(process.env[envName]||'').trim():'';
  const configuredPrice=await configuredPriceObject(configured,true).catch(()=>null);if(configuredPrice)return configuredPrice;
  const lookupKeys={pro:['sitebrief_pro','prompt_ai_pro','pro'],ultimate:['sitebrief_ultimate','prompt_ai_ultimate','ultimate'],own_api_keys:['sitebrief_own_api_keys','prompt_ai_own_api_keys','own_api_keys']}[plan]||[];
  for(const lookupKey of lookupKeys){const result=await stripeGet('prices',{active:'true',type:'recurring','lookup_keys[0]':lookupKey,limit:10});const match=(result.data||[]).find(price=>price.active&&price.recurring);if(match)return match;}
  const result=await stripeGet('prices',{active:'true',type:'recurring',limit:100,'expand[]':'data.product'});
  const exact=(result.data||[]).filter(price=>{const pricePlan=String(price.metadata?.plan||price.metadata?.sitebrief_plan||'').toLowerCase();const productPlan=String(price.product?.metadata?.plan||price.product?.metadata?.sitebrief_plan||'').toLowerCase();return price.active&&price.recurring&&(pricePlan===plan||productPlan===plan)});
  if(exact.length===1)return exact[0];
  const names={pro:/\bpro\b/i,ultimate:/\bultimate\b/i,own_api_keys:/(api.?key|eigene.?keys)/i};
  const byName=(result.data||[]).filter(price=>price.active&&price.recurring&&names[plan]?.test(String(price.product?.name||price.nickname||'')));
  if(byName.length===1)return byName[0];
  const detail=exact.length>1||byName.length>1?'Mehrere passende aktive Preise wurden gefunden. Vergib in Stripe einen eindeutigen Lookup-Key.':`Kein aktiver wiederkehrender Stripe-Preis für „${plan}“ gefunden.`;
  throw Object.assign(new Error(`${detail} Erwartet: ${lookupKeys[0]||envName} oder ${envName} in dieser Vercel-Umgebung.`),{status:503});
}
async function resolveRecurringPrice(product){return (await resolveRecurringPriceObject(product)).id}
async function resolveOneTimePriceObject(product){
  const item=String(product||'').toLowerCase();
  const envName={single_review:'STRIPE_SINGLE_REVIEW_PRICE_ID'}[item];
  const configured=envName?String(process.env[envName]||'').trim():'';
  const configuredPrice=await configuredPriceObject(configured,false).catch(()=>null);if(configuredPrice)return configuredPrice;
  const lookupKeys={single_review:['prompt_ai_single_review','sitebrief_single_review','single_review']}[item]||[];
  for(const lookupKey of lookupKeys){const result=await stripeGet('prices',{active:'true',type:'one_time','lookup_keys[0]':lookupKey,limit:10});const match=(result.data||[]).find(price=>price.active&&!price.recurring);if(match)return match;}
  const result=await stripeGet('prices',{active:'true',type:'one_time',limit:100,'expand[]':'data.product'});
  const names={single_review:/(single.?review|einmal.*prüf|projekt.*prüf|review)/i};
  const byMeta=(result.data||[]).filter(price=>{const p=String(price.metadata?.product||price.metadata?.sitebrief_product||price.product?.metadata?.product||price.product?.metadata?.sitebrief_product||'').toLowerCase();return p===item});if(byMeta.length===1)return byMeta[0];
  const byName=(result.data||[]).filter(price=>price.active&&!price.recurring&&names[item]?.test(String(price.product?.name||price.nickname||'')));if(byName.length===1)return byName[0];
  throw Object.assign(new Error(`Kein aktiver Stripe-Einmalpreis für „${item}“ gefunden.`),{status:503});
}
async function resolveOneTimePrice(product){return (await resolveOneTimePriceObject(product)).id}
module.exports={stripeRequest,stripeGet,resolveRecurringPrice,resolveRecurringPriceObject,resolveOneTimePrice,resolveOneTimePriceObject};
