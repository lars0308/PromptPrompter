const buckets=new Map();
function clientId(req){return String(req.headers?.['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim().slice(0,80)}
function rateLimit(req,res,{limit=20,windowMs=60000,key='default'}={}){
  const now=Date.now(),id=`${key}:${clientId(req)}`,current=buckets.get(id);
  if(!current||current.reset<=now){buckets.set(id,{count:1,reset:now+windowMs});return true}
  current.count+=1;if(current.count<=limit)return true;
  res.setHeader('Retry-After',String(Math.max(1,Math.ceil((current.reset-now)/1000))));res.status(429).json({error:'Zu viele Anfragen. Bitte kurz warten.'});return false;
}
module.exports={rateLimit};
