(()=>{
  try{
    const saved=localStorage.getItem('sitebrief-theme');
    const dark=saved?saved==='dark':matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme=dark?'dark':'light';
  }catch{}
  try{
    const internalReload=sessionStorage.getItem('sitebrief-v6-continue-workflow')==='1'||Boolean(sessionStorage.getItem('prompt-ai-mode-handoff-v1'));
    if(!internalReload)document.documentElement.classList.add('prompt-app-booting');
  }catch{}
})();
