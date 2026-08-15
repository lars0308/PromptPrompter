(()=>{
  'use strict';
  // Somebody who just pressed "Kostenlos testen" or "Registrieren" has read a headline and nothing
  // else. Three sentences before the first empty field are the difference between "ich probiere
  // das mal" and "was soll ich hier eintragen". Shown once per device, never again.
  const $=(s,r=document)=>r.querySelector(s);
  const SEEN_KEY='prompt-ai-intro-seen-v1';
  const seen=()=>{try{return localStorage.getItem(SEEN_KEY)==='1'}catch{return false}};
  const remember=()=>{try{localStorage.setItem(SEEN_KEY,'1')}catch{}};

  function dialog(){
    let node=$('#welcomeIntroDialog');if(node)return node;
    node=document.createElement('dialog');node.id='welcomeIntroDialog';node.className='intro-dialog';
    node.innerHTML=`<form method="dialog" class="intro-frame">
      <span class="intro-kicker">SO FUNKTIONIERT PROMPT.AI</span>
      <h2>Du beschreibst deine Idee. Wir machen daraus einen Auftrag, mit dem die KI direkt loslegen kann.</h2>
      <div class="intro-console">
        <div class="intro-console-shot">
          <span class="intro-console-mode">Internetseite erstellen <i>▾</i></span>
          <div class="intro-console-field">Kosmetikstudio in Bremen. Behandlungen mit Preisen, Termine online und ein ruhiger, hochwertiger Auftritt.</div>
          <div class="intro-console-foot"><b>+</b><span>Mit Rückfragen · 138 Zeichen</span></div>
        </div>
        <dl class="intro-console-legend">
          <div><dt>1</dt><dd><b>Das Menü oben</b> legt die Arbeitsart fest: Internetseite erstellen, Freier Prompt, Website überarbeiten oder Projekt prüfen.</dd></div>
          <div><dt>2</dt><dd><b>Das große Feld</b> ist alles, was du ausfüllen musst – in eigenen Worten, so wie du es einem Menschen erklären würdest.</dd></div>
          <div><dt>3</dt><dd><b>Das Plus darunter</b> hängt Bilder, PDFs oder den Link zu einer bestehenden Seite an. Daneben stellst du ein, wie viel nachgefragt wird.</dd></div>
        </dl>
      </div>
      <ol class="intro-steps">
        <li><b>1</b><div><strong>Beschreiben</strong><small>Ein paar Sätze reichen. Hast du schon eine Website? Die lesen wir aus und übernehmen Kontakt, Leistungen und Öffnungszeiten.</small></div></li>
        <li><b>2</b><div><strong>Richtung wählen</strong><small>Du siehst drei fertige Vorschläge und entscheidest, welcher passt.</small></div></li>
        <li><b>3</b><div><strong>Auftrag mitnehmen</strong><small>Fertig ist ein Master-Prompt mit allen Fakten – für ChatGPT, Claude, Codex oder was du sonst nutzt.</small></div></li>
      </ol>
      <div class="intro-foot">
        <button type="submit" class="solid-btn" id="welcomeIntroStart">Los geht’s</button>
        <small>Für alles andere – Bild, Video, Text, Logo – brauchst du diese Schritte nicht. Das geht direkt auf der Startseite.</small>
      </div>
    </form>`;
    document.body.appendChild(node);
    node.addEventListener('close',remember);
    node.addEventListener('cancel',event=>{event.preventDefault();node.close()});
    return node;
  }
  function show(){
    if(seen())return;
    // Never on top of something the visitor has to answer first.
    if(document.querySelector('#cookieBanner[open],#maintenanceDialog[open],dialog.intro-dialog[open]'))return;
    try{dialog().showModal()}catch{}
  }
  function bind(){
    document.addEventListener('click',event=>{
      if(!event.target.closest?.('#gateGuestBtn,#gateSignUpPick,#signUpBtn,#startFreeBtn,#offerCta'))return;
      // After the account step, not instead of it: the gate keeps the focus it needs.
      setTimeout(show,700);
    },true);
  }
  window.PromptAiIntro={show,reset:()=>{try{localStorage.removeItem(SEEN_KEY)}catch{}}};
  
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
