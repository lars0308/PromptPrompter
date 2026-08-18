(()=>{
  try{
    const saved=localStorage.getItem('sitebrief-theme');
    const dark=saved?saved==='dark':matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme=dark?'dark':'light';
  }catch{}
  try{
    const internalReload=sessionStorage.getItem('sitebrief-v6-continue-workflow')==='1'||Boolean(sessionStorage.getItem('prompt-ai-mode-handoff-v1'));
    document.documentElement.classList.add('prompt-full-redesign');
    if(!internalReload)document.documentElement.classList.add('prompt-app-booting','prompt-home-surface');
    // "Arbeitsbereich wird vorbereitet" stimmt nur fuer jemanden, der einen hat. Wer zum ersten
    // Mal auf die Adresse kommt, landet auf der Startseite mit den Tarifen - und liest dort als
    // Erstes, dass etwas vorbereitet wird, das er nicht kennt. Ob eine Sitzung gespeichert ist,
    // steht schon vor dem ersten Bild fest; die Marke traegt dann den Satz, um den es geht.
    let angemeldet=false;
    try{angemeldet=Boolean(JSON.parse(localStorage.getItem('sitebrief-auth-session')||'null')?.access_token)}catch{}
    if(!angemeldet)document.documentElement.classList.add('prompt-boot-gast');
    // Starting a project reloads the page, and the welcome page painted for a moment before the
    // handoff overlay existed - a flash of the screen the visitor just left. Hiding it from the
    // very first paint costs nothing: this reload is always on its way into the workflow.
    if(sessionStorage.getItem('prompt-ai-v1-simple-start')==='1'){
      document.documentElement.classList.add('prompt-handoff-pending');
      // Never leave the page hidden if the handoff never completes.
      setTimeout(()=>document.documentElement.classList.remove('prompt-handoff-pending'),9000);
    }
  }catch{}
  // The footer year lived in an inline script at the very end of index.html. On a device with a
  // cached shell that script is the cached one too, so the year froze. Setting it here - in the
  // first script of the page - keeps it correct as soon as any newer file is loaded.
  const setYear=()=>{const node=document.getElementById('currentYear');if(node)node.textContent=String(new Date().getFullYear())};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setYear,{once:true});else setYear();
  addEventListener('pageshow',setYear);

  // Shared driver for the "headline fills blue" loading language. Loading screens report the
  // progress they actually have instead of running a fixed-length animation, and finish() closes
  // the screen the same way everywhere: snap to full, blink blue once, then hand back.
  // Lives in the first blocking script so the boot screen can report progress before anything
  // else is parsed.
  const FLASH_MS=(()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches?0:420}catch{return 420}})();
  // Ein Schirm, der in ein paar hundert Millisekunden kommt und geht, liest sich als Fehler, nicht
  // als Fortschritt. Jeder Ladeschirm steht deshalb mindestens so lange. War die Arbeit ohnehin
  // laenger, wird nichts gestreckt - dann kommt nur das Abschlussblinken dazu.
  const MIN_VISIBLE_MS=FLASH_MS?2400:0;
  window.PromptAiFill={
    flashMs:FLASH_MS,
    minVisibleMs:MIN_VISIBLE_MS,
    // Marks the moment a screen went up, so finish() knows how much of the minimum is left.
    begin(node){if(node&&!node.dataset.fillStart)node.dataset.fillStart=String(Date.now())},
    // Milliseconds a screen still has to stay: the rest of the minimum, at least one blink.
    tail(startedAt){
      if(!FLASH_MS)return 0;
      const started=Number(startedAt)||0;
      const elapsed=started?Date.now()-started:0;
      return Math.max(FLASH_MS,MIN_VISIBLE_MS-elapsed);
    },
    set(node,value){
      if(!node)return;
      const pct=Math.max(0,Math.min(100,Number(value)||0));
      if(node.dataset.fillDone==='1')return;
      if(!node.dataset.fillStart)node.dataset.fillStart=String(Date.now());
      if(node.classList.contains('prompt-fill-sweep'))node.dataset.fillOrigin='sweep';
      node.classList.remove('prompt-fill-sweep');
      node.classList.add('prompt-fill-progress');
      // Never walk backwards: several sources may report on the same headline.
      const previous=Number(node.dataset.fillValue||0);
      if(pct<previous)return;
      node.dataset.fillValue=String(pct);
      node.style.setProperty('--prompt-fill',pct.toFixed(1)+'%');
    },
    finish(node,done){
      const end=typeof done==='function'?done:()=>{};
      if(!node||node.dataset.fillDone==='1'||!FLASH_MS){if(node)node.dataset.fillDone='1';end();return}
      node.dataset.fillDone='1';
      if(node.classList.contains('prompt-fill-sweep'))node.dataset.fillOrigin='sweep';
      node.classList.remove('prompt-fill-sweep');
      node.classList.add('prompt-fill-progress','prompt-fill-complete');
      node.style.setProperty('--prompt-fill','100%');
      const wait=this.tail(node.dataset.fillStart);
      // The blink repeats for as long as the screen is held, instead of one flash and then silence.
      node.style.setProperty('--prompt-flash-count',String(Math.max(1,Math.round(wait/FLASH_MS))));
      setTimeout(end,wait);
    },
    // Zeilenweise fuellen statt spaltenweise.
    //
    // Die Fuellung ist ein waagerechter Verlauf ueber die ganze Ueberschrift. Bricht die auf zwei
    // Zeilen um, liegt derselbe Verlauf ueber beiden - bei 50 % ist die linke Haelfte von Zeile
    // eins UND von Zeile zwei blau. Gelesen wird aber nacheinander.
    //
    // Ein Verlauf kann das nicht: er kennt nur eine Richtung. Also bekommt jedes Wort seinen
    // eigenen. Die Woerter behalten ihren Umbruch (sie sind inline), und jedes bekommt den
    // Abschnitt des Fortschritts, der ihm nach Zeichenzahl zusteht - Wort fuer Wort in
    // Lesereihenfolge, und damit erst Zeile eins, dann Zeile zwei.
    //
    // Bewusst ueber Woerter und nicht ueber gemessene Zeilenkaesten: Zeilen ausmessen und
    // nachzeichnen hat frueher versetzten und abgeschnittenen Text erzeugt.
    words(node,progress){
      if(!node)return;
      const text=String(node.dataset.fillText||node.textContent||'').trim();
      if(!text)return;
      if(node.dataset.fillText!==text){
        node.dataset.fillText=text;
        const teile=text.split(/(\s+)/);
        const laenge=teile.reduce((n,t)=>n+(/^\s+$/.test(t)?0:t.length),0)||1;
        let gelaufen=0;
        node.innerHTML=teile.map(teil=>{
          if(/^\s+$/.test(teil))return teil;
          const von=gelaufen/laenge;gelaufen+=teil.length;
          const bis=gelaufen/laenge;
          return `<i class="prompt-fill-word" style="--von:${von};--bis:${bis}">${teil.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</i>`;
        }).join('');
      }
      const p=Math.max(0,Math.min(1,Number(progress)||0));
      for(const wort of node.querySelectorAll('.prompt-fill-word')){
        const von=Number(wort.style.getPropertyValue('--von'))||0;
        const bis=Number(wort.style.getPropertyValue('--bis'))||1;
        const anteil=bis>von?Math.max(0,Math.min(1,(p-von)/(bis-von))):(p>=bis?1:0);
        const wert=(anteil*100).toFixed(1)+'%';
        if(wort.style.getPropertyValue('--prompt-fill')!==wert)wort.style.setProperty('--prompt-fill',wert);
      }
    },
    // Screens that can run more than once (the master-prompt overlay) hand the headline back to
    // the state it started in, so the next wait animates again instead of sitting at 100%.
    reset(node){if(!node)return;delete node.dataset.fillDone;delete node.dataset.fillValue;delete node.dataset.fillStart;node.style.removeProperty('--prompt-flash-count');node.classList.remove('prompt-fill-complete');node.style.removeProperty('--prompt-fill');if(node.dataset.fillOrigin==='sweep'){node.classList.remove('prompt-fill-progress');node.classList.add('prompt-fill-sweep')}}
  };
})();
