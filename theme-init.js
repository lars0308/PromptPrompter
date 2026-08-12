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
})();
