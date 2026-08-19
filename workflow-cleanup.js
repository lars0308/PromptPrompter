(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];let masterTimer=0,lastMasterSignature='',observer=null,masterStepActive=false,kiSchreibt=false;
  const MASTER_MAX_WAIT=8000;
  const setText=(node,value)=>{if(node&&node.textContent!==value)node.textContent=value};
  
  function clean(){['#modeDescription','#modeRouteCard','#modeFlowPanel'].forEach(q=>{const n=$(q);if(n?.getAttribute('aria-hidden')!=='true')n?.setAttribute('aria-hidden','true')});const studio=$('#revisionStudio');if(studio&&!studio.hidden)studio.hidden=true;setText($('#quickRevisionDialog .dialog-head h2'),'Website gezielt überarbeiten')}
  function previews(){$$('#stepPreviews .preview-generation-controls label').forEach(l=>{l.style.removeProperty('display');if(l.style.visibility!=='visible')l.style.visibility='visible';if(l.style.pointerEvents!=='auto')l.style.pointerEvents='auto'})}
  function previewPage(){const lab=$('#outcomeLab');if(!lab)return false;let d=$('#projectPreviewDialog');if(!d){d=document.createElement('dialog');d.id='projectPreviewDialog';d.setAttribute('aria-label','Projektvorschau');d.className='project-preview-dialog';d.innerHTML='<div class="project-preview-shell"><header class="project-preview-head"><div><span>PROJEKT-VORSCHAU</span><h2>Gebautes Projekt prüfen</h2></div><button type="button" class="project-preview-close" aria-label="Schließen">×</button></header><div class="project-preview-body"></div></div>';document.body.appendChild(d);d.querySelector('.project-preview-close').onclick=()=>d.close();d.addEventListener('cancel',e=>{e.preventDefault();d.close()})}const body=d.querySelector('.project-preview-body');if(lab.parentElement!==body)body.appendChild(lab);let b=$('#workspacePreviewBtn');if(!b){b=document.createElement('button');b.type='button';b.className='outline-btn';b.id='workspacePreviewBtn';b.innerHTML='<strong>Gebautes Projekt prüfen</strong><small style="display:block;margin-top:4px;opacity:.7">ZIP, Ordner oder GitHub-Repo als Live-Vorschau</small>';$('.welcome-quick-actions')?.appendChild(b);b.onclick=()=>{try{d.showModal()}catch{}}}return true}
  function signature(){const text=[$('#projectName')?.value||'',$('#projectDescription')?.value||'',$('#selectedPreviewLarge')?.textContent||''].join('|');let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return `m${(h>>>0).toString(36)}`}
  function masterLoader(){
    const step=$('#stepPrompt');if(!step)return;
    // Hier stand eine eigene Anzeige mitten in der Schrittseite - Spinner, eigene Ueberschrift,
    // eigener Balken. Sie war der Grund, warum der Master-Prompt kurz aufblitzte und dann noch
    // einmal von vorn anfing: erst diese, dann der KI-Lauf mit seiner eigenen. Beide melden sich
    // jetzt beim gemeinsamen Ladeschirm an, die Anzeige hier wird nicht mehr gebraucht.
    $('#masterGeneration')?.remove();
    // Nur auf ein echtes Betreten oder Verlassen von Schritt 8 reagieren.
    masterStepActive=step.classList.contains('active');
    new MutationObserver(()=>{
      const active=step.classList.contains('active');
      if(active===masterStepActive)return;
      masterStepActive=active;
      if(active)revealMaster();
      else{clearTimeout(masterTimer);window.PromptAiLoading?.endTask?.(ZUSAMMENBAU)}
    }).observe(step,{attributes:true,attributeFilter:['class']});
    if(masterStepActive)revealMaster();
  }
  // Der Ablauf muss auch wirklich auf dem Bildschirm sein.
  //
  // #stepPrompt traegt "active" auch dann noch, wenn die App gerade erst startet und den letzten
  // Stand wiederherstellt - der Ablauf liegt dabei versteckt hinter der Startseite. Solange die
  // Anzeige ein Kasten mitten in der Schrittseite war, sah das niemand. Seit sie der gemeinsame
  // Vollbild-Ladeschirm ist, stand direkt nach "Arbeitsbereich wird vorbereitet" grundlos
  // "Dein Master-Prompt entsteht" auf dem Schirm.
  function ablaufSichtbar(){const app=$('#workflowApp');return Boolean(app)&&!app.hidden}
  function revealMaster(){
    const step=$('#stepPrompt');if(!step?.classList.contains('active'))return;
    if(!ablaufSichtbar())return;
    const sig=signature();
    clearTimeout(masterTimer);
    const done=prompt=>{
      lastMasterSignature=sig;
      window.PromptAiLoading?.endTask?.(ZUSAMMENBAU);
      try{sessionStorage.setItem(`prompt-ai-master-ready:${sig}`,'1')}catch{}
      if(prompt)window.dispatchEvent(new CustomEvent('promptai:prompt-version',{detail:{source:'master',title:$('#projectName')?.value||'Master-Prompt',prompt}}));
    };
    const ready=()=>($('#masterPrompt')?.value?.trim()||'');
    // The prompt is assembled synchronously, so in practice it is already there. Never hold the
    // finished result behind an artificial delay, and always release the overlay after the cap.
    if((ready().length>=80&&!kiSchreibt)||($('#projectValidation')?.textContent||'').trim()){done(ready());return}
    window.PromptAiLoading?.beginTask?.(ZUSAMMENBAU,{title:kiSchreibt?MASTER_KI_TITEL:MASTER_TITEL,kind:'build'});
    const start=Date.now(),check=()=>{
      const prompt=ready();
      // Schreibt die KI, wird nicht auf den Text gewartet, sondern auf ihr Zeichen: sie meldet
      // sich, sobald genug da ist, um zusehen zu koennen. Die Obergrenze faengt nur den Fall ab,
      // dass diese Meldung ausbleibt.
      const wartezeit=kiSchreibt?MASTER_KI_MAX_WAIT:MASTER_MAX_WAIT;
      if((prompt.length>=80&&!kiSchreibt)||($('#projectValidation')?.textContent||'').trim()||Date.now()-start>=wartezeit){done(prompt);return}
      masterTimer=setTimeout(check,200);
    };
    masterTimer=setTimeout(check,120);
  }
  // Der Master-Prompt entsteht in zwei Zuegen: erst wird das Material zusammengesetzt (das geht
  // sofort), dann schreibt die KI daraus den fertigen Text.
  //
  // Frueher bekam nur der erste Zug den Ladeschirm. Danach stand der zusammengesetzte Auftrag im
  // Feld, und eine Minute spaeter sprang der ausformulierte Text an seine Stelle - zweimal etwas
  // anderes zu lesen ist schlechter, als einmal zuzusehen, wie es entsteht.
  //
  // Jetzt laeuft der Ladeschirm durch, bis die KI genug geschrieben hat, um mitlesen zu koennen
  // (ein Viertel, siehe app.js). Dann geht er weg und der Text schreibt sich ins Feld. Laeuft
  // keine KI, bleibt alles wie vorher: zusammensetzen, anzeigen, fertig.
  const ZUSAMMENBAU='master-zusammenbau';
  const MASTER_TITEL='Dein Master-Prompt entsteht';
  const MASTER_KI_TITEL='Dein Master-Prompt wird geschrieben';
  const MASTER_KI_MAX_WAIT=30000;
  function masterAiOverlay(state){
    if(state==='start')kiSchreibt=true;
    if(state!=='start')kiSchreibt=false;
    const step=$('#stepPrompt');if(!step||!step.classList.contains('active')||!ablaufSichtbar())return;
    const meta=$('#promptMeta');if(!meta)return;
    let note=$('#masterAiNote');
    if(state==='start'){
      // Der Ladeschirm laeuft schon oder faengt jetzt an - je nachdem, ob der Schritt gerade
      // betreten wurde oder die Eingaben sich nachtraeglich geaendert haben.
      window.PromptAiLoading?.beginTask?.(ZUSAMMENBAU,{title:MASTER_KI_TITEL,kind:'build'});
      note?.remove();
      return;
    }
    if(state==='raw'){
      // Die KI hat nicht geschrieben - im Feld steht die zusammengesetzte Fassung, und darin
      // stehen die Angaben des Kunden wörtlich. Verschweigen wäre das Schlimmste: der Auftrag ist
      // brauchbar, aber er ist nicht der ausformulierte, für den er gehalten wird.
      window.PromptAiLoading?.endTask?.(ZUSAMMENBAU);
      if(!note){
        note=document.createElement('p');note.id='masterAiNote';note.className='master-ai-note is-raw';
        meta.insertAdjacentElement('afterend',note);
      }
      note.textContent='Nicht von der KI ausformuliert – es war gerade keine erreichbar. Deine Angaben stehen im Originalwortlaut im Auftrag. Eine Änderung an den Eingaben startet einen neuen Versuch.';
      return;
    }
    if(state==='writing'){
      clearTimeout(masterTimer);
      window.PromptAiLoading?.endTask?.(ZUSAMMENBAU);
      if(!note){
        note=document.createElement('p');note.id='masterAiNote';note.className='master-ai-note';
        // Neben #promptMeta, nicht darin: updateMasterPrompt() schreibt dessen innerHTML neu und
        // haette die Zeile im selben Moment wieder entfernt, in dem sie entsteht.
        meta.insertAdjacentElement('afterend',note);
      }
      note.textContent='Wird gerade geschrieben – du kannst schon mitlesen.';
      return;
    }
    window.PromptAiLoading?.endTask?.(ZUSAMMENBAU);
    note?.remove();
  }
  function settle(){clean();previews();previewPage()}
  function init(){settle();masterLoader();observer=new MutationObserver(()=>{clearTimeout(observer._t);observer._t=setTimeout(settle,60)});observer.observe(document.body,{childList:true});setTimeout(()=>observer?.disconnect(),5000);window.addEventListener('promptai:access',()=>setTimeout(settle,0));window.addEventListener('promptai:system-ai-ready',previews);window.addEventListener('promptai:master-ai',event=>masterAiOverlay(event.detail?.state))}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
