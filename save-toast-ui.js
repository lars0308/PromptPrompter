(()=>{
  'use strict';
  // Pressing a save button and seeing nothing happen is the most common reason people press it
  // twice. One short confirmation at the top edge, for every save in the app - the button itself
  // never has to grow its own status line for that. Oben, weil dort auch jede andere Meldung
  // erscheint: eine Stelle im Bild, an der man Rueckmeldungen sucht, nicht zwei.
  const $=(s,r=document)=>r.querySelector(s);
  const SAVE_TEXT=/^(speichern|sichern|übernehmen|anwenden|aktivieren|verbinden|hinzufügen|anlegen|buchen|senden|veröffentlichen)\b|speichern|verbinden$/i;
  // Buttons that start something long or destructive get their own feedback, so they are left out.
  const SKIP=/(löschen|entfernen|abbrechen|trennen|kündigen|erstatten|sperren|zurücksetzen|kaufen|checkout|erstellen lassen|jetzt erstellen)/i;
  let node=null,timer=0;

  function styles(){
    if($('#saveToastStyles'))return;
    const el=document.createElement('style');el.id='saveToastStyles';el.textContent=`
      .save-toast{position:fixed;left:50%;top:max(14px,env(safe-area-inset-top));z-index:2147483000;display:flex;align-items:center;gap:9px;
        padding:12px 17px;border-radius:12px;background:var(--ink,#14181d);color:#fff;font:600 13px/1.3 inherit;
        box-shadow:0 12px 34px rgba(10,15,20,.28);transform:translate(-50%,-14px);opacity:0;pointer-events:none;
        transition:opacity .18s ease,transform .18s ease;max-width:min(420px,calc(100vw - 32px))}
      .save-toast.is-on{opacity:1;transform:translate(-50%,0)}
      .save-toast i{flex:0 0 auto;display:grid;place-items:center;width:19px;height:19px;border-radius:50%;background:var(--good,#2e9e6b);color:#fff;font-style:normal;font-size:11px;font-weight:900}
      .save-toast.is-error i{background:var(--danger,#c0392b)}
      @media(prefers-reduced-motion:reduce){.save-toast{transition:none}}
      html.prompt-reduce-motion .save-toast{transition:none}
    `;document.head.appendChild(el);
  }
  function show(text='Gespeichert',kind='good'){
    styles();
    if(!node){node=document.createElement('div');node.className='save-toast';node.setAttribute('role','status');node.innerHTML='<i>✓</i><span></span>';document.body.appendChild(node)}
    node.classList.toggle('is-error',kind==='error');
    $('i',node).textContent=kind==='error'?'!':'✓';
    $('span',node).textContent=text;
    // Re-triggering restarts the timer instead of stacking a second toast.
    requestAnimationFrame(()=>node.classList.add('is-on'));
    clearTimeout(timer);timer=setTimeout(()=>node.classList.remove('is-on'),2400);
  }
  function label(button){return `${button.id||''} ${button.textContent||''} ${button.getAttribute('aria-label')||''}`}
  function bind(){
    document.addEventListener('click',event=>{
      const button=event.target.closest?.('button,[role="button"]');
      if(!button||button.disabled)return;
      const text=label(button);
      if(SKIP.test(text)||!SAVE_TEXT.test(text.trim()))return;
      // After the handler, so a save that throws does not get a success message first.
      setTimeout(()=>{
        const message=document.querySelector('.auth-message.error,.free-prompt-status.error,.admin-token-message.error,.admin-prompt-message.error');
        if(message&&message.textContent.trim())return;
        show('Gespeichert');
      },140);
    },false);
  }
  window.PromptAiToast={show};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
