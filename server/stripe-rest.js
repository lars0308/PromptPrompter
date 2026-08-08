function stripeKey(){const key=process.env.STRIPE_SECRET_KEY||'';if(!key)throw Object.assign(new Error('Stripe ist noch nicht eingerichtet. Hinterlege STRIPE_SECRET_KEY und die beiden Preis-IDs in Vercel.'),{status:503});return key}
async function stripeRequest(path,params){
  const body=new URLSearchParams();for(const [key,value] of Object.entries(params||{}))if(value!==undefined&&value!==null)body.append(key,String(value));
  const response=await fetch(`https://api.stripe.com/v1/${path}`,{method:'POST',headers:{Authorization:`Bearer ${stripeKey()}`,'Content-Type':'application/x-www-form-urlencoded'},body});const data=await response.json();if(!response.ok)throw Object.assign(new Error(data.error?.message||'Stripe-Anfrage fehlgeschlagen'),{status:response.status});return data;
}
module.exports={stripeRequest};
