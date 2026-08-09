const {serviceFetch}=require('./admin');
const {stripeGet,resolveRecurringPrice}=require('./stripe-rest');

const valid=offer=>offer&&(!offer.ends_at||new Date(offer.ends_at)>new Date());
async function databaseOffer(){try{const result=await serviceFetch('/rest/v1/sitebrief_public_offers?select=*&id=eq.main&enabled=eq.true&limit=1');return valid(result.data?.[0])?result.data[0]:null}catch{return null}}
async function stripeOffer(){
  if(!process.env.STRIPE_SECRET_KEY)return null;let priceId;try{priceId=await resolveRecurringPrice('pro')}catch{return null}
  try{const price=await stripeGet(`prices/${encodeURIComponent(priceId)}`),m=price.metadata||{},trialDays=Math.max(0,Math.min(365,Number(m.trial_days)||0)),discount=Math.max(0,Math.min(100,Number(m.discount_percent)||0)),enabled=m.offer_enabled==='true'||trialDays>0||discount>0;if(!enabled)return null;return {id:'stripe',enabled:true,eyebrow:m.offer_eyebrow||(trialDays?'KOSTENLOS TESTEN':'AKTION'),title:m.offer_title||(trialDays?`Pro ${trialDays} Tage kostenlos testen`:`Aktuell ${discount} % Rabatt`),description:m.offer_description||(trialDays?'Danach monatlich kündbar.':'Der Rabatt wird im Checkout automatisch abgezogen.'),cta_label:m.offer_cta||(trialDays?'Kostenlos testen':'Rabatt sichern'),trial_days:trialDays,discount_percent:discount,stripe_coupon_id:m.coupon_id||null,ends_at:m.offer_ends_at||null,source:'stripe'};}catch{return null}
}
async function currentPublicOffer(){return await databaseOffer()||await stripeOffer()}
module.exports={currentPublicOffer};
