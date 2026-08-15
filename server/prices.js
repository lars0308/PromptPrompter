// Die Preise standen an vier Stellen: Umgebungsvariable, Rueckfallwert in api/config.js, noch
// einer in app.js und ein vierter in trial-fix-ui.js. Genau deshalb warb die App eine Zeit lang
// mit 15,99 EUR, waehrend Stripe 20,99 EUR abbuchte. Hier steht der Rueckfall genau einmal;
// gesetzt wird er weiterhin ueber die Umgebung, damit eine Preisaenderung kein Deployment braucht.
const FALLBACK=Object.freeze({
  pro:'20,99 € / Monat',
  ultimate:'54,99 € / Monat',
  apiKeys:'5,99 € / Monat',
  topUp:'7,99 €'
});
function prices(env=process.env){
  return {
    pro:String(env.PUBLIC_PRO_PRICE||FALLBACK.pro),
    ultimate:String(env.PUBLIC_ULTIMATE_PRICE||FALLBACK.ultimate),
    apiKeys:String(env.PUBLIC_API_KEYS_PRICE||FALLBACK.apiKeys),
    topUp:String(env.PUBLIC_TOP_UP_PRICE||env.PUBLIC_SINGLE_REVIEW_PRICE||FALLBACK.topUp)
  };
}
module.exports={FALLBACK,prices};
