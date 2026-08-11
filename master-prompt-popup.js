(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  let lastStep=0;

  function styles(){
    if($('#masterPromptPopupStyles'))return;
    const s=document.createElement('style');s.id='masterPromptPopupStyles';s.textContent=`
      .master-prompt-result-dialog{width:100vw;max-width:100vw;height:100dvh;max-height:100dvh;margin:0;border:0;border-radius:0;padding:0;background:var(--paper);color:var(--ink)}
      .master-prompt-result-dialog::backdrop{background:rgba(8,12,10,.6);backdrop-filter:blur(10px)}
      .master-prompt-result-frame{width:min(920px,100%);margin:0 auto;padding:28px 22px;display:flex;flex-direction:column;height:100%}
      .master-prompt-result-head{display:flex;justify-content:space-between;gap:14px;align-items:start;margin-bottom:16px}
      .master-prompt-result-head span{display:block;color:var(--accent);font-size:9px;font-weight:850;letter-spacing:.13em}
      .master-prompt-result-head h2{margin:6px 0 0;font-size:clamp(23px,4vw,30px);letter-spacing:-.03em;color:var(--accent)}
      .master-prompt-result-close{width:42px;height:42px;min-width:42px;display:grid;place-items:center;border:1px solid var(--line);border-radius:50%;background:var(--surface);color:var(--ink);font:700 21px/1 Arial,sans-serif}
      .master-prompt-result-output{width:100%;flex:1 1 auto;min-height:200px;border:1px solid var(--line);border-radius:14px;background:var(--surface);color:var(--ink);padding:16px;font:500 12px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace}
      .master-prompt-result-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:16px}
      @media(max-width:700px){.master-prompt-result-frame{padding:18px 16px}.master-prompt-result-output{min-height:0;max-height:none;flex:1 1 auto}}
    `;document.head.appendChild(s);
  }

  function ensureDialog(){
    let d=$('#masterPromptResultDialog');if(d)return d;
    d=document.createElement('dialog');d.id='masterPromptResultDialog';d.className='master-prompt-result-dialog';
    d.innerHTML='<form method="dialog" class="master-prompt-result-frame"><div class="master-prompt-result-head"><div><span>PROMPT.AI</span><h2>Prompt ist fertig</h2></div><button type="submit" class="master-prompt-result-close" aria-label="Schließen">×</button></div><textarea id="masterPromptResultOutput" class="master-prompt-result-output" spellcheck="false"></textarea><div class="master-prompt-result-actions"><button type="button" class="solid-btn" id="masterPromptResultCopy">Kopieren</button><button type="button" class="outline-btn" id="masterPromptResultSave">Master-Prompt speichern</button></div></form>';
    document.body.appendChild(d);
    $('#masterPromptResultCopy',d).onclick=copy;
    $('#masterPromptResultSave',d).onclick=save;
    return d;
  }

  async function copy(){
    const btn=$('#masterPromptResultCopy'),value=$('#masterPromptResultOutput')?.value;if(!value)return;
    try{await navigator.clipboard.writeText(value)}catch{$('#masterPromptResultOutput')?.select();document.execCommand('copy')}
    if(btn){const old=btn.textContent;btn.textContent='Kopiert ✓';setTimeout(()=>{btn.textContent=old},1300)}
  }
  function save(){
    const source=$('#downloadPromptBtn');
    if(source){source.click();return}
    const value=$('#masterPromptResultOutput')?.value;if(!value)return;
    const blob=new Blob([value],{type:'text/markdown;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='prompt-ai-master-prompt.md';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);
  }

  function currentStep(){return Number($('.step-panel.active')?.dataset.stepPanel||0)}
  function checkStep(){
    const step=currentStep();
    if(step===8&&lastStep!==8){
      const value=$('#masterPrompt')?.value.trim()||'';
      if(value){
        styles();const d=ensureDialog();$('#masterPromptResultOutput',d).value=value;
        try{d.showModal()}catch{}
      }
    }
    lastStep=step;
  }
  function init(){styles();new MutationObserver(checkStep).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});checkStep()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
