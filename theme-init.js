(()=>{
  try{
    const saved=localStorage.getItem('sitebrief-theme');
    const dark=saved?saved==='dark':matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme=dark?'dark':'light';
  }catch{}
  try{
    const internalReload=sessionStorage.getItem('sitebrief-v6-continue-workflow')==='1'||Boolean(sessionStorage.getItem('prompt-ai-mode-handoff-v1'));
    if(!internalReload)document.documentElement.classList.add('prompt-app-booting');
    // Starting a project reloads the page, and the welcome page painted for a moment before the
    // handoff overlay existed - a flash of the screen the visitor just left. Hiding it from the
    // very first paint costs nothing: this reload is always on its way into the workflow.
    if(sessionStorage.getItem('prompt-ai-v1-simple-start')==='1'){
      document.documentElement.classList.add('prompt-handoff-pending');
      // Never leave the page hidden if the handoff never completes.
      setTimeout(()=>document.documentElement.classList.remove('prompt-handoff-pending'),9000);
    }
  }catch{}
  // Shared driver for the "headline fills blue" loading language. Loading screens report the
  // progress they actually have instead of running a fixed-length animation, and finish() closes
  // the screen the same way everywhere: snap to full, blink blue once, then hand back.
  // Lives in the first blocking script so the boot screen can report progress before anything
  // else is parsed.
  const FLASH_MS=(()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches?0:420}catch{return 420}})();
  window.PromptAiFill={
    flashMs:FLASH_MS,
    set(node,value){
      if(!node)return;
      const pct=Math.max(0,Math.min(100,Number(value)||0));
      if(node.dataset.fillDone==='1')return;
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
      setTimeout(end,FLASH_MS);
    },
    // Screens that can run more than once (the master-prompt overlay) hand the headline back to
    // the state it started in, so the next wait animates again instead of sitting at 100%.
    reset(node){if(!node)return;delete node.dataset.fillDone;delete node.dataset.fillValue;node.classList.remove('prompt-fill-complete');node.style.removeProperty('--prompt-fill');if(node.dataset.fillOrigin==='sweep'){node.classList.remove('prompt-fill-progress');node.classList.add('prompt-fill-sweep')}}
  };
})();
