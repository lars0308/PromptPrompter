(()=>{
  'use strict';
  // Ein Fehler, den niemand sieht, ist ein Fehler, den niemand behebt. Bisher blieb jeder
  // Laufzeitfehler im Browser des Besuchers - man erfuhr davon, wenn jemand schrieb. Der Melder
  // schickt nur, was zum Beheben noetig ist: Meldung, Datei und Zeile. Keine Eingaben, keine
  // Projektinhalte, keine Kennungen.
  const MAX_PER_SESSION=5,seen=new Set();
  let sent=0,ready=false;

  const trim=value=>String(value??'').trim().slice(0,300);
  // Aus "https://prompt-ai.app/app.js" wird "app.js" - der Rest sagt nichts und koennte in
  // Ausnahmefaellen Kennungen aus der Adresse mitschleppen.
  const fileOf=value=>{try{return new URL(String(value)).pathname.split('/').pop()||''}catch{return String(value||'').split('/').pop()||''}};

  async function send(message,where){
    if(sent>=MAX_PER_SESSION)return;
    const key=`${message}|${where}`;
    if(seen.has(key))return;
    seen.add(key);sent++;
    const payload=JSON.stringify({action:'client-error',message,where});
    try{
      // sendBeacon ueberlebt auch einen Seitenwechsel; fetch ist der Ersatz, wenn es fehlt.
      if(navigator.sendBeacon){
        const blob=new Blob([payload],{type:'application/json'});
        if(navigator.sendBeacon('/api/models',blob))return;
      }
      await fetch('/api/models',{method:'POST',headers:{'Content-Type':'application/json'},body:payload,keepalive:true});
    }catch{}
  }

  function start(){
    if(ready)return;ready=true;
    window.addEventListener('error',event=>{
      // Fehlende Bilder und Skripte werfen dasselbe Ereignis, tragen aber keine Meldung - die
      // gehoeren nicht hierher, sonst besteht der Bericht am Ende aus Ladefehlern.
      if(!event?.message)return;
      send(trim(event.message),`${fileOf(event.filename)}:${event.lineno||0}`);
    });
    window.addEventListener('unhandledrejection',event=>{
      const reason=event?.reason;
      const message=trim(reason?.message||reason);
      if(message)send(message,`promise:${fileOf(reason?.stack?.split('\n')[1]||'')}`);
    });
  }

  start();
  window.PromptAiErrorBeacon={report:(message,where)=>send(trim(message),trim(where||'manuell'))};
})();
