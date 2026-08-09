const {authenticatedUser,ownSubscription,ownApiAddon}=require('../server/supabase-user');
const {stripeRequest,resolveRecurringPrice,resolveOneTimePrice}=require('../server/stripe-rest');
const {currentPublicOffer:currentOffer}=require('../server/public-offer');

function appOrigin(req){
  const host=String(req.headers['x-forwarded-host']||req.headers.host||'').trim();
  const fallback=host?`https://${host}`:'https://prompt-prompter.vercel.app';
  const raw=String(process.env.APP_URL||fallback).trim();
  try{
    const normalized=/^https?:\/\//i.test(raw)?raw:`https://${raw}`;
    return new URL(normalized).origin;
  }catch{return fallback;}
}

module.exports=async function(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  try{
    const user=await authenticatedUser(req),action=String(req.body?.action||req.query?.action||'checkout'),origin=appOrigin(req);
    if(action==='portal'){
      const [subscription,addon]=await Promise.all([ownSubscription(req),ownApiAddon(req)]),customer=subscription?.provider_customer_id||addon?.provider_customer_id;
      if(!customer)throw Object.assign(new Error('Für dieses Konto besteht noch kein Stripe-Abo.'),{status:404});
      const session=await stripeRequest('billing_portal/sessions',{customer,return_url:`${origin}/`});
      return res.status(200).json({url:session.url});
    }
    const product=String(req.body?.plan||''),isAddon=product==='own_api_keys',isSingleReview=product==='single_review';
    if(!['pro','ultimate','own_api_keys','single_review'].includes(product))return res.status(400).json({error:'Unbekannter Tarif.'});
    if(isSingleReview){
      const price=await resolveOneTimePrice('single_review');
      const session=await stripeRequest('checkout/sessions',{mode:'payment','line_items[0][price]':price,'line_items[0][quantity]':1,customer_email:user.email,client_reference_id:user.id,'metadata[user_id]':user.id,'metadata[product]':'single_review',success_url:`${origin}/?checkout=success&product=single_review`,cancel_url:`${origin}/?checkout=cancel`});
      return res.status(200).json({url:session.url});
    }
    const price=await resolveRecurringPrice(product),offer=isAddon?null:await currentOffer(),trialDays=Math.max(0,Math.min(365,Number(offer?.trial_days)||0)),coupon=String(offer?.stripe_coupon_id||''),metadata=isAddon?{'metadata[addon]':'own_api_keys','subscription_data[metadata][addon]':'own_api_keys'}:{'metadata[plan]':product,'subscription_data[metadata][plan]':product,'metadata[trial_days]':String(trialDays),'subscription_data[metadata][trial_days]':String(trialDays)},promotion=coupon?{'discounts[0][coupon]':coupon}:{allow_promotion_codes:'true'},trial=trialDays?{'subscription_data[trial_period_days]':String(trialDays)}:{},session=await stripeRequest('checkout/sessions',{mode:'subscription','line_items[0][price]':price,'line_items[0][quantity]':1,customer_email:user.email,client_reference_id:user.id,'metadata[user_id]':user.id,'subscription_data[metadata][user_id]':user.id,...metadata,...promotion,...trial,success_url:`${origin}/?checkout=success&product=${encodeURIComponent(product)}`,cancel_url:`${origin}/?checkout=cancel`});
    return res.status(200).json({url:session.url});
  }catch(error){return res.status(error.status||500).json({error:error.message||(String(req.body?.action||req.query?.action||'')==='portal'?'Aboverwaltung fehlgeschlagen':'Checkout fehlgeschlagen')})}
};
