(()=>{
  'use strict';
  // Zwei Bildschirme in dieser App sind Entscheidungen, keine Meldungen: die Anmeldeseite und der
  // laufende Durchlauf. Beide ließen sich mit einem × wegklicken - bei der Anmeldeseite landete man
  // danach ohne Konto in der App, beim Durchlauf war der Auftrag ohne Rückfrage weg.
  //
  // Anmeldeseite: kein ×, kein Esc. Weiter geht es über Anmelden, Registrieren oder ausdrücklich
  // „Kostenlos testen" - erst dieser Klick legt fest, dass ohne Konto gearbeitet wird.
  // Durchlauf: das × bleibt, fragt aber nach. Erst „Ja, abbrechen" führt zurück zum Startmenü.
  const $=(s,r=document)=>r.querySelector(s);

  function styles(){
    if($('#flowGuardStyles'))return;
    const s=document.createElement('style');s.id='flowGuardStyles';s.textContent=`
      /* unified-ui-v1 setzt .close-dialog global auf display:grid!important und hat damit die
         Regel aus styles.css überstimmt, die den Knopf auf der Anmeldeseite ausblendet. */
      html:root body .account-dialog.guest-gate .close-dialog,
      html:root body .account-dialog.guest-gate .dialog-back{display:none!important}
      .install-invite{position:fixed;left:12px;right:12px;bottom:max(14px,env(safe-area-inset-bottom));z-index:2147482000;
        display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px 14px;align-items:center;
        padding:14px 15px;border:1px solid var(--wk-line,var(--line));border-radius:6px;
        background:var(--wk-sheet,var(--surface));box-shadow:0 18px 40px rgba(28,36,44,.18)}
      .install-invite[hidden]{display:none}
      .install-invite strong{display:block;font-size:13px}
      .install-invite small{display:block;margin-top:3px;color:var(--muted);font-size:11px;line-height:1.4}
      .install-invite-actions{display:flex;gap:8px}
      .install-invite-actions button{min-height:40px;padding:0 13px;border-radius:4px;font-size:11px;font-weight:800}
      @media(max-width:520px){.install-invite{grid-template-columns:1fr}.install-invite-actions button{flex:1}}
    `;document.head.appendChild(s);
  }

  // --- Durchlauf abbrechen -----------------------------------------------------------------
  // transition-polish.js hört auf denselben Klick in der Capture-Phase. Diese Datei läuft davor,
  // hält den Klick an und lässt ihn nur durch, wenn die Rückfrage bejaht wurde.
  let asking=false;
  function guardLoaderClose(){
    document.addEventListener('click',async event=>{
      const button=event.target.closest?.('#promptWorkflowLoaderClose');
      if(!button||button.dataset.confirmed==='1')return;
      event.preventDefault();event.stopImmediatePropagation();
      if(asking)return;asking=true;
      let yes=false;
      try{
        yes=await (window.PromptAiDialog?.confirm?.('Der laufende Durchlauf wird beendet und das Zwischenergebnis verworfen. Zurück zum Startmenü?',{
          title:'Abbrechen?',kicker:'DURCHLAUF',confirmLabel:'Ja, abbrechen',cancelLabel:'Nein, weiter',danger:true
        })??Promise.resolve(window.confirm('Durchlauf abbrechen?')));
      }catch{yes=false}
      asking=false;
      if(!yes)return;
      button.dataset.confirmed='1';
      button.click();
      // Der Merker gilt nur für diesen einen Klick, sonst fragt das × beim nächsten Mal nicht mehr.
      setTimeout(()=>{delete button.dataset.confirmed},0);
    },true);
  }

  // --- Anmeldeseite ------------------------------------------------------------------------
  // Esc blockiert app.js bereits über das cancel-Ereignis. Was fehlte, war der sichtbare Ausgang:
  // solange die Seite als Tor läuft, darf kein Schließen-Knopf im DOM stehen bleiben, den ein
  // späteres Skript wieder einblendet.
  function guardGate(){
    const sync=()=>{
      const dialog=$('#accountDialog');if(!dialog)return;
      const gated=dialog.classList.contains('guest-gate');
      for(const button of dialog.querySelectorAll('.close-dialog,.dialog-back')){
        // Nur schreiben, wenn sich etwas ändert: der Beobachter unten hört auf hidden, und ein
        // unveränderter Schreibvorgang würde ihn erneut auslösen.
        if(button.hidden!==gated)button.hidden=gated;
        if(button.disabled!==gated)button.disabled=gated;
      }
    };
    sync();
    new MutationObserver(sync).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden']});
  }

  // --- Auf dem Handy installieren ------------------------------------------------------------
  // Der Knopf lag nur im Menü. Auf einem Telefon oder Tablet ist die installierte App der bessere
  // Ort für dieses Werkzeug, also wird einmal gefragt - eine Ablehnung wird gemerkt.
  const SEEN='prompt-ai-install-invite-v1';
  function touchDevice(){
    if(window.matchMedia?.('(display-mode: standalone)')?.matches||window.navigator.standalone)return false;
    const coarse=window.matchMedia?.('(pointer: coarse)')?.matches;
    return Boolean(coarse&&Math.min(screen.width,screen.height)<=1180);
  }
  function inviteInstall(){
    let prompt=null,node=null;
    const dismissed=()=>{try{return localStorage.getItem(SEEN)==='1'}catch{return false}};
    const remember=()=>{try{localStorage.setItem(SEEN,'1')}catch{}};
    function show(){
      if(node||dismissed()||!touchDevice())return;
      node=document.createElement('aside');node.className='install-invite';node.setAttribute('role','dialog');node.setAttribute('aria-label','Prompt.ai installieren');
      node.innerHTML='<div><strong>Prompt.ai auf dem Gerät installieren?</strong><small>Startet ohne Browserleiste und merkt sich deinen Arbeitsstand auch offline.</small></div><div class="install-invite-actions"><button type="button" class="outline-btn mini" data-install-no>Später</button><button type="button" class="solid-btn mini" data-install-yes>Installieren</button></div>';
      document.body.appendChild(node);
      node.addEventListener('click',async event=>{
        if(event.target.closest('[data-install-no]')){remember();node.remove();node=null;return}
        if(!event.target.closest('[data-install-yes]'))return;
        remember();
        try{prompt.prompt();await prompt.userChoice}catch{}
        prompt=null;node.remove();node=null;
      });
    }
    window.addEventListener('beforeinstallprompt',event=>{
      event.preventDefault();prompt=event;
      // Nicht sofort: die Frage über dem noch ladenden Startbildschirm wirkt wie ein Werbebanner.
      setTimeout(show,6000);
    });
    window.addEventListener('appinstalled',()=>{remember();node?.remove();node=null});
  }

  function init(){styles();guardLoaderClose();guardGate();inviteInstall()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
