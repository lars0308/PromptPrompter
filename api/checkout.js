const {authenticatedUser,ownSubscription,ownApiAddon}=require('../server/supabase-user');
const {stripeRequest,stripeGet,resolveRecurringPrice,resolveOneTimePrice}=require('../server/stripe-rest');
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
const iso=seconds=>seconds?new Date(Number(seconds)*1000).toISOString():null;
function itemPeriod(subscription,item){
  const start=subscription?.current_period_start||item?.current_period_start||null;
  const end=subscription?.current_period_end||item?.current_period_end||null;
  return {start:iso(start),end:iso(end)};
}
function priceSummary(price,quantity=1){
  if(!price)return null;
  const amount=Number(price.unit_amount_decimal??price.unit_amount);
  return {
    id:String(price.id||''),
    amount:Number.isFinite(amount)?Math.round(amount*Number(quantity||1)):null,
    currency:String(price.currency||'eur').toLowerCase(),
    interval:String(price.recurring?.interval||''),
    intervalCount:Math.max(1,Number(price.recurring?.interval_count)||1),
    quantity:Math.max(1,Number(quantity)||1)
  };
}
function paymentSummary(pm){
  if(!pm)return null;
  if(pm.card)return {type:'card',brand:String(pm.card.brand||'Karte'),last4:String(pm.card.last4||''),expMonth:Number(pm.card.exp_month)||null,expYear:Number(pm.card.exp_year)||null};
  if(pm.sepa_debit)return {type:'sepa_debit',brand:'SEPA-Lastschrift',last4:String(pm.sepa_debit.last4||'')};
  if(pm.us_bank_account)return {type:'bank',brand:String(pm.us_bank_account.bank_name||'Bankkonto'),last4:String(pm.us_bank_account.last4||'')};
  if(pm.paypal)return {type:'paypal',brand:'PayPal',last4:''};
  return {type:String(pm.type||'payment'),brand:String(pm.type||'Zahlungsmethode'),last4:''};
}
async function defaultPaymentMethod(subscription,customerId){
  try{
    let pm=subscription?.default_payment_method||null;
    if(pm&&typeof pm==='object')return paymentSummary(pm);
    let customer=null;
    if(!pm&&customerId){customer=await stripeGet(`customers/${encodeURIComponent(customerId)}`);pm=customer?.invoice_settings?.default_payment_method||null;}
    if(pm&&typeof pm==='object')return paymentSummary(pm);
    if(typeof pm==='string'&&pm.startsWith('pm_'))return paymentSummary(await stripeGet(`payment_methods/${encodeURIComponent(pm)}`));
  }catch{}
  return null;
}
function invoiceSummary(invoice){
  return {
    id:String(invoice?.id||''),
    number:String(invoice?.number||''),
    created:iso(invoice?.created),
    status:String(invoice?.status||''),
    paid:Boolean(invoice?.paid),
    amountDue:Number(invoice?.amount_due)||0,
    amountPaid:Number(invoice?.amount_paid)||0,
    amountRemaining:Number(invoice?.amount_remaining)||0,
    currency:String(invoice?.currency||'eur').toLowerCase(),
    hostedUrl:String(invoice?.hosted_invoice_url||''),
    pdfUrl:String(invoice?.invoice_pdf||'')
  };
}
async function stripeSubscriptionInfo(row,label){
  const id=String(row?.provider_subscription_id||'');
  if(!id)return null;
  try{
    const subscription=await stripeGet(`subscriptions/${encodeURIComponent(id)}`),item=subscription?.items?.data?.[0]||null,period=itemPeriod(subscription,item),customerId=typeof subscription.customer==='string'?subscription.customer:subscription.customer?.id||row?.provider_customer_id||'';
    const [preview,invoices,payment]=await Promise.all([
      stripeRequest('invoices/create_preview',{subscription:id}).catch(()=>null),
      stripeGet('invoices',{subscription:id,limit:12}).catch(()=>({data:[]})),
      defaultPaymentMethod(subscription,customerId)
    ]);
    const trialEnd=iso(subscription.trial_end),cancelAt=iso(subscription.cancel_at),cancelledAt=iso(subscription.canceled_at),endsAt=cancelAt||(subscription.cancel_at_period_end?period.end:null),price=priceSummary(item?.price,item?.quantity);
    let nextChargeAt=null;
    if(!subscription.cancel_at_period_end&&!cancelAt&&!['canceled','unpaid','incomplete_expired'].includes(subscription.status))nextChargeAt=subscription.status==='trialing'&&trialEnd?trialEnd:period.end;
    return {
      label,
      status:String(subscription.status||row?.status||''),
      created:iso(subscription.created),
      trialStart:iso(subscription.trial_start),
      trialEnd,
      periodStart:period.start,
      periodEnd:period.end,
      billingCycleAnchor:iso(subscription.billing_cycle_anchor),
      cancelAtPeriodEnd:Boolean(subscription.cancel_at_period_end),
      cancelAt:endsAt,
      canceledAt:cancelledAt,
      collectionMethod:String(subscription.collection_method||''),
      price,
      nextChargeAt,
      nextChargeAmount:preview?Number(preview.amount_due)||0:null,
      nextChargeCurrency:String(preview?.currency||price?.currency||'eur').toLowerCase(),
      paymentMethod:payment,
      invoices:(invoices?.data||[]).map(invoiceSummary)
    };
  }catch{return null;}
}
async function subscriptionOverview(req){
  const [subscription,addon]=await Promise.all([ownSubscription(req),ownApiAddon(req)]);
  const [mainStripe,addonStripe]=await Promise.all([
    stripeSubscriptionInfo(subscription,subscription?.plan==='ultimate'?'Ultimate':'Pro'),
    stripeSubscriptionInfo(addon,'Eigene KI-Verbindungen')
  ]);
  const plan=['pro','ultimate'].includes(subscription?.plan)?subscription.plan:'free';
  return {
    plan,
    status:String(subscription?.status||'active'),
    periodEnd:subscription?.current_period_end||null,
    main:mainStripe,
    addon:addon?.addon==='own_api_keys'?{status:String(addon.status||''),periodEnd:addon.current_period_end||null,subscription:addonStripe}:null,
    canManage:Boolean(subscription?.provider_customer_id||addon?.provider_customer_id),
    canChangePlan:Boolean(mainStripe&&['active','trialing'].includes(mainStripe.status)),
    canCancel:Boolean(mainStripe&&['active','trialing','past_due'].includes(mainStripe.status)&&!mainStripe.cancelAtPeriodEnd&&!mainStripe.cancelAt)
  };
}
async function portalSession(req,origin){
  const [subscription,addon]=await Promise.all([ownSubscription(req),ownApiAddon(req)]),target=req.body?.target==='addon'?addon:subscription,customer=target?.provider_customer_id||subscription?.provider_customer_id||addon?.provider_customer_id,subscriptionId=target?.provider_subscription_id;
  if(!customer)throw Object.assign(new Error('Für dieses Konto besteht noch kein Stripe-Abo.'),{status:404});
  const flow=String(req.body?.flow||'');
  const params={customer,return_url:`${origin}/?billing=return`};
  if(flow==='payment'){
    params['flow_data[type]']='payment_method_update';
    params['flow_data[after_completion][type]']='redirect';
    params['flow_data[after_completion][redirect][return_url]']=`${origin}/?billing=updated`;
  }
  if(flow==='cancel'&&subscriptionId){
    params['flow_data[type]']='subscription_cancel';
    params['flow_data[subscription_cancel][subscription]']=subscriptionId;
    params['flow_data[after_completion][type]']='redirect';
    params['flow_data[after_completion][redirect][return_url]']=`${origin}/?billing=updated`;
  }
  if(flow==='update'&&subscriptionId){
    params['flow_data[type]']='subscription_update';
    params['flow_data[subscription_update][subscription]']=subscriptionId;
    params['flow_data[after_completion][type]']='redirect';
    params['flow_data[after_completion][redirect][return_url]']=`${origin}/?billing=updated`;
  }
  try{return await stripeRequest('billing_portal/sessions',params)}catch(error){
    if(!flow)throw error;
    return stripeRequest('billing_portal/sessions',{customer,return_url:`${origin}/?billing=return`});
  }
}

module.exports=async function(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  try{
    const user=await authenticatedUser(req),action=String(req.body?.action||req.query?.action||'checkout'),origin=appOrigin(req);
    if(action==='subscription-info')return res.status(200).json(await subscriptionOverview(req));
    if(action==='portal'){
      const session=await portalSession(req,origin);
      return res.status(200).json({url:session.url});
    }
    const product=String(req.body?.plan||''),isAddon=product==='own_api_keys',isSingleReview=product==='single_review';
    if(!['pro','ultimate','own_api_keys','single_review'].includes(product))return res.status(400).json({error:'Unbekannter Tarif.'});
    if(isSingleReview){
      const price=await resolveOneTimePrice('single_review');
      const session=await stripeRequest('checkout/sessions',{mode:'payment','line_items[0][price]':price,'line_items[0][quantity]':1,customer_email:user.email,client_reference_id:user.id,'metadata[user_id]':user.id,'metadata[product]':'single_review',success_url:`${origin}/?checkout=success&product=single_review`,cancel_url:`${origin}/?checkout=cancel`});
      return res.status(200).json({url:session.url});
    }
    if(isAddon){
      const subscription=await ownSubscription(req),active=['active','trialing'].includes(subscription?.status),plan=active?subscription?.plan:'free';
      if(plan==='ultimate')return res.status(409).json({error:'Eigene KI-Verbindungen sind in Ultimate bereits enthalten.'});
      if(plan!=='pro')return res.status(403).json({error:'Das Add-on für eigene KI-Verbindungen kann nur zu einem aktiven Pro-Tarif gebucht werden.'});
    }
    const price=await resolveRecurringPrice(product),offer=!isAddon&&product==='pro'?await currentOffer():null,trialDays=Math.max(0,Math.min(365,Number(offer?.trial_days)||0)),coupon=String(offer?.stripe_coupon_id||''),metadata=isAddon?{'metadata[addon]':'own_api_keys','subscription_data[metadata][addon]':'own_api_keys'}:{'metadata[plan]':product,'subscription_data[metadata][plan]':product,'metadata[trial_days]':String(trialDays),'subscription_data[metadata][trial_days]':String(trialDays)},promotion=coupon?{'discounts[0][coupon]':coupon}:{allow_promotion_codes:'true'},trial=trialDays?{'subscription_data[trial_period_days]':String(trialDays)}:{},session=await stripeRequest('checkout/sessions',{mode:'subscription','line_items[0][price]':price,'line_items[0][quantity]':1,customer_email:user.email,client_reference_id:user.id,'metadata[user_id]':user.id,'subscription_data[metadata][user_id]':user.id,...metadata,...promotion,...trial,success_url:`${origin}/?checkout=success&product=${encodeURIComponent(product)}`,cancel_url:`${origin}/?checkout=cancel`});
    return res.status(200).json({url:session.url});
  }catch(error){return res.status(error.status||500).json({error:error.message||(String(req.body?.action||req.query?.action||'')==='portal'?'Aboverwaltung fehlgeschlagen':'Checkout fehlgeschlagen')})}
};
