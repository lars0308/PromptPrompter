// Support-Anfragen kamen bisher nur im Verwaltungsfenster an - man sah sie, wenn man hinsah.
// Der Versand laeuft ueber einen Anbieter, der eine einfache HTTP-Schnittstelle hat; welcher,
// entscheiden zwei Umgebungsvariablen. Fehlen sie, passiert nichts: keine Fehlermeldung, kein
// blockierter Ablauf. Eine Anfrage darf nie daran scheitern, dass die Benachrichtigung klemmt.
//
//   SUPPORT_NOTIFY_TO   - deine Adresse (die Weiterleitung reicht)
//   SUPPORT_NOTIFY_FROM - Absender, muss beim Anbieter freigegeben sein
//   RESEND_API_KEY      - Schluessel von resend.com
//
// Alternativ statt RESEND_API_KEY:
//   MAIL_WEBHOOK_URL    - eine eigene Adresse, die {to,subject,text} als JSON entgegennimmt
//                         (zum Beispiel ein Zapier- oder Make-Webhook)

const clip=(value,max)=>String(value??'').trim().slice(0,max);

function config(env=process.env){
  return {
    to:clip(env.SUPPORT_NOTIFY_TO,180),
    from:clip(env.SUPPORT_NOTIFY_FROM,180)||'Prompt.ai <support@prompt-ai.app>',
    resend:clip(env.RESEND_API_KEY,200),
    webhook:clip(env.MAIL_WEBHOOK_URL,400)
  };
}

async function sendMail({subject,text},env=process.env){
  const {to,from,resend,webhook}=config(env);
  if(!to||(!resend&&!webhook))return {sent:false,reason:'nicht eingerichtet'};
  const payload={to,from,subject:clip(subject,180),text:clip(text,6000)};
  try{
    if(resend){
      const response=await fetch('https://api.resend.com/emails',{
        method:'POST',
        headers:{Authorization:`Bearer ${resend}`,'Content-Type':'application/json'},
        body:JSON.stringify({from:payload.from,to:[payload.to],subject:payload.subject,text:payload.text})
      });
      return {sent:response.ok,reason:response.ok?'':`resend ${response.status}`};
    }
    const response=await fetch(webhook,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    return {sent:response.ok,reason:response.ok?'':`webhook ${response.status}`};
  }catch(error){
    return {sent:false,reason:String(error?.message||'Versand fehlgeschlagen').slice(0,120)};
  }
}

module.exports={sendMail,config};
