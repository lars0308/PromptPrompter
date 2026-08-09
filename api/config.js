const {resolveRecurringPriceObject,resolveOneTimePriceObject}=require('../server/stripe-rest');

function formatStripePrice(price,fallback){
  if(!price)return fallback;
  const raw=price.unit_amount_decimal??price.unit_amount;
  const amount=Number(raw);
  if(!Number.isFinite(amount))return fallback;
  const currency=String(price.currency||'eur').toUpperCase();
  let value;
  try{value=new Intl.NumberFormat('de-DE',{style:'currency',currency,minimumFractionDigits:2}).format(amount/100)}catch{value=`${(amount/100).toFixed(2).replace('.',',')} €`}
  if(!price.recurring)return value;
  const count=Math.max(1,Number(price.recurring.interval_count)||1),labels={day:['Tag','Tage'],week:['Woche','Wochen'],month:['Monat','Monate'],year:['Jahr','Jahre']},pair=labels[price.recurring.interval]||[price.recurring.interval,price.recurring.interval];
  return count===1?`${value} / ${pair[0]}`:`${value} / ${count} ${pair[1]}`;
}

async function livePrice(loader,fallback){try{return formatStripePrice(await loader(),fallback)}catch{return fallback}}

module.exports=async function handler(_req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  const fallback={pro:process.env.PUBLIC_PRO_PRICE||'15,99 € / Monat',ultimate:process.env.PUBLIC_ULTIMATE_PRICE||'25,99 € / Monat',apiKeys:process.env.PUBLIC_API_KEYS_PRICE||'5,99 € / Monat',singleReview:process.env.PUBLIC_SINGLE_REVIEW_PRICE||'3,99 €'};
  const [pro,ultimate,apiKeys,singleReview]=await Promise.all([
    livePrice(()=>resolveRecurringPriceObject('pro'),fallback.pro),
    livePrice(()=>resolveRecurringPriceObject('ultimate'),fallback.ultimate),
    livePrice(()=>resolveRecurringPriceObject('own_api_keys'),fallback.apiKeys),
    livePrice(()=>resolveOneTimePriceObject('single_review'),fallback.singleReview)
  ]);
  res.status(200).json({
    supabaseUrl:process.env.SUPABASE_URL||'https://wihdoacgqbyxxeejoxsg.supabase.co',
    supabasePublishableKey:process.env.SUPABASE_PUBLISHABLE_KEY||'sb_publishable_h5mVvlW32Hd-9OVLpIODdA_ymCaNzPz',
    enabled:true,
    pricing:{pro,ultimate,apiKeys,singleReview,source:'stripe'}
  });
};
