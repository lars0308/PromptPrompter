(()=>{
  'use strict';
  /* ---------------------------------------------------------------------------
     Diese Datei hatte einen eigenen Ladeschirm (#promptWorkflowLoader): eigenes
     Element, eigene Titel, eigene Fuellung, eigener Satzwechsel - und er haengte
     am Schritt, waehrend promptai-loading-v2.js seinen an die Anfrage haengt.
     Beide waren gleichzeitig zustaendig. Zwischen zwei Anfragen ging der eine weg
     und der andere kam, mit anderem Titel; dazu blitzten die Ueberschriften der
     durchlaufenen Schritte auf. Auf dem Bildschirm sah ein Vorgang aus wie vier.

     Jetzt gibt es genau einen Schirm, und der gehoert promptai-loading-v2.js.
     Hier bleibt nur, was sonst niemand tut: die Anmeldung meldet ihre Wartezeit
     an, und beim Verlassen des Ablaufs wird aufgeraeumt.
     --------------------------------------------------------------------------- */
  const $=(s,r=document)=>r?.querySelector?.(s)||null;
  const LOGIN_KEY='promptai-login';
  const PREVIEW_KEY='promptai-preview-run';
  // Reicht die Anfrage nicht nach, darf der Schirm nicht stehen bleiben: der Lauf beginnt
  // Millisekunden spaeter und uebernimmt ihn dann ohnehin.
  const PREVIEW_HALT_MS=8000;
  let previewTimer=0;

  const laden=()=>window.PromptAiLoading;

  function showLogin(){laden()?.beginTask?.(LOGIN_KEY,{title:'App wird vorbereitet',kind:'login'})}
  function hideLogin(){laden()?.endTask?.(LOGIN_KEY)}
  // Ein neuer Vorschaulauf soll den Schirm sofort zeigen, nicht erst wenn die Anfrage draussen
  // ist. Sie uebernimmt ihn Sekundenbruchteile spaeter unter eigenem Schluessel - deshalb darf
  // dieser hier danach still auslaufen, ohne den Schirm mitzunehmen.
  function previewRun(){
    laden()?.beginTask?.(PREVIEW_KEY,{title:'Deine Vorschau wird erstellt',kind:'preview'});
    clearTimeout(previewTimer);
    previewTimer=setTimeout(()=>{previewTimer=0;laden()?.endTask?.(PREVIEW_KEY)},PREVIEW_HALT_MS);
  }

  // Wer den Ablauf verlaesst, laesst sonst offene Rueckfragen und Restklassen zurueck.
  function closeLateWorkflowUi(){
    const dialog=$('#clarificationDialog');
    if(dialog?.open){try{dialog.close('cancel')}catch{dialog.removeAttribute('open')}}
    $('#promptCompletionFlash')?.remove();
    document.documentElement.classList.remove('prompt-review-transition','prompt-clarification-exit');
  }
  function onClick(event){
    if(event.target.closest?.('#brandHome,.guided-clean-exit,#promptWorkflowLoaderClose'))closeLateWorkflowUi();
  }
  // Synthetische Klicks aus den Ablauf-Automaten duerfen nicht weiterlaufen, wenn der Ablauf gar
  // nicht mehr sichtbar ist - sonst wandert ein geschlossenes Projekt im Hintergrund weiter.
  function blockLateHiddenClicks(event){
    const workflow=$('#workflowApp');
    if(workflow&&!workflow.hidden)return;
    const button=event.target.closest?.('#workflowApp .next-btn,#workflowApp .back-btn');
    if(button&&!event.isTrusted){event.preventDefault();event.stopImmediatePropagation()}
  }

  function init(){
    document.addEventListener('click',onClick,true);
    document.addEventListener('click',blockLateHiddenClicks,true);
  }
  window.PromptAiTransitionLoader={show:showLogin,hide:hideLogin,previewRun};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
