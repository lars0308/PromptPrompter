/**
 * Die Zurück-Taste des Browsers.
 *
 * Prompt.ai ist eine einzige Seite: Startseite, Ablauf und alle Fenster liegen in demselben
 * Dokument. Ohne Zutun heißt "Zurück" deshalb immer "raus aus der App" - egal ob gerade ein
 * Fenster offen ist oder man in Schritt 6 von 8 steckt. Auf dem Handy ist die Wischgeste nach
 * rechts dieselbe Taste; sie wird ständig benutzt.
 *
 * Diese Datei legt einen Merkpunkt in den Verlauf, sobald es etwas zu schließen oder
 * zurückzugehen gibt, und deutet die Taste dann so, wie man es erwartet:
 *
 *   1. Ist ein Fenster oder das Menü offen -> das zuletzt geöffnete schließen.
 *   2. Steht man im Ablauf hinter Schritt 1 -> einen Schritt zurück (derselbe Knopf, den man
 *      auch anklicken würde).
 *   3. Sonst -> nichts festhalten, die Seite darf verlassen werden.
 *
 * Es wird nichts gespeichert und nichts umgeleitet: der Merkpunkt zeigt auf dieselbe Adresse.
 * Fällt der Grund weg, wird er wieder eingesammelt, damit kein toter Tastendruck übrig bleibt.
 */
(function(){
  const $=(selector,root=document)=>root.querySelector(selector);
  const MARKE='promptAiZurueck';
  const TAKT=400;

  let gesetzt=false,leerlauf=0;
  // Fenster in der Reihenfolge, in der sie aufgegangen sind - document.querySelectorAll liefert
  // die Dokumentreihenfolge, die sagt nichts darüber, welches obenauf liegt.
  const stapel=[];

  function sichtbar(node){
    if(!node)return false;
    try{return node.checkVisibility?node.checkVisibility({checkVisibilityCSS:true}):!!node.offsetParent}
    catch{return !!node.offsetParent}
  }

  // Zwei Fenster gehören nicht dazu: die Cookie-Einwilligung und die Wartungsmeldung. Beide
  // sind bewusst nicht wegklickbar - die Zurück-Taste darf sie nicht aushebeln.
  const UNANTASTBAR='#cookieBanner,#maintenanceDialog';

  function offeneFenster(){
    const offen=[...document.querySelectorAll('dialog[open]')].filter(d=>!d.matches(UNANTASTBAR));
    for(const dialog of offen)if(!stapel.includes(dialog))stapel.push(dialog);
    for(let i=stapel.length-1;i>=0;i--)if(!offen.includes(stapel[i]))stapel.splice(i,1);
    return stapel;
  }

  function offenesMenue(){
    const menu=$('#topbarMenu');
    return menu&&menu.classList.contains('open')?menu:null;
  }

  function schrittZurueck(){
    return [...document.querySelectorAll('.back-btn')].find(sichtbar)||null;
  }

  // Schritt 1 hat keinen Zurück-Knopf; von dort führt der Weg auf die Startseite.
  function imAblauf(){
    const app=$('#workflowApp');
    return Boolean(app)&&!app.hidden;
  }

  function etwasZuTun(){
    return offeneFenster().length>0||Boolean(offenesMenue())||imAblauf();
  }

  function setzen(){
    if(gesetzt||!etwasZuTun())return;
    try{history.pushState({[MARKE]:true},'',location.href);gesetzt=true}catch{}
  }

  // Wurde das letzte Fenster von Hand geschlossen, bleibt sonst ein Merkpunkt liegen: der
  // nächste Tastendruck täte dann sichtbar nichts. Also wieder einsammeln - aber erst, wenn
  // zwei Takte lang wirklich nichts offen war, damit ein kurzes Flackern beim Fensterwechsel
  // nicht schon aufräumt.
  function aufraeumen(){
    if(!gesetzt||etwasZuTun()){leerlauf=0;return}
    if(++leerlauf<2)return;
    leerlauf=0;gesetzt=false;
    try{history.back()}catch{}
  }

  function zurueck(){
    gesetzt=false;

    // Läuft gerade eine Anfrage an die KI, bleibt der Ladeschirm stehen: einen Schritt
    // zurückzuspringen, während die Antwort unterwegs ist, führt nur in einen halben Stand.
    if($('#promptAiTaskLoader')){setzen();return}

    const fenster=offeneFenster();
    if(fenster.length){
      const oben=fenster[fenster.length-1];
      try{oben.close()}catch{oben.removeAttribute('open')}
      setzen();return;
    }

    const menu=offenesMenue();
    if(menu){
      if(window.PromptAiNavDrawer?.close)window.PromptAiNavDrawer.close();
      else $('#topbarMenuToggle')?.click();
      setzen();return;
    }

    const knopf=schrittZurueck();
    if(knopf){knopf.click();setTimeout(setzen,80);return}

    if(imAblauf()){$('#brandHome')?.click();setTimeout(setzen,80);return}

    // Nichts mehr offen, nichts mehr zurückzugehen: die Seite darf verlassen werden.
  }

  function start(){
    addEventListener('popstate',event=>{
      // Nur die eigenen Merkpunkte deuten; alles andere gehört dem Browser.
      if(event.state&&!event.state[MARKE]&&!gesetzt)return;
      zurueck();
    });
    setInterval(()=>{setzen();aufraeumen()},TAKT);
    setzen();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
