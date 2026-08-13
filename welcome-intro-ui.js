(()=>{
  'use strict';
  // Somebody who just pressed "Kostenlos testen" or "Registrieren" has read a headline and nothing
  // else. Three sentences before the first empty field are the difference between "ich probiere
  // das mal" and "was soll ich hier eintragen". Shown once per device, never again.
  const $=(s,r=document)=>r.querySelector(s);
  const SEEN_KEY='prompt-ai-intro-seen-v1';
  const seen=()=>{try{return localStorage.getItem(SEEN_KEY)==='1'}catch{return false}};
  const remember=()=>{try{localStorage.setItem(SEEN_KEY,'1')}catch{}};

  function styles(){
    if($('#welcomeIntroStyles'))return;
    const el=document.createElement('style');el.id='welcomeIntroStyles';el.textContent=`
      .intro-dialog{width:min(560px,calc(100vw - 28px));max-height:min(92vh,760px);padding:0;border:0;border-radius:22px;background:var(--paper);color:var(--ink);box-shadow:0 30px 90px rgba(10,16,22,.28)}
      .intro-dialog::backdrop{background:rgba(8,12,16,.62);backdrop-filter:blur(8px)}
      .intro-frame{display:grid;gap:0;padding:26px 26px 22px}
      .intro-kicker{display:block;color:var(--accent);font-size:9px;font-weight:900;letter-spacing:.14em}
      .intro-frame h2{margin:9px 0 0;font-size:clamp(24px,5vw,31px);line-height:1.08;letter-spacing:-.035em}
      .intro-frame>p{margin:12px 0 0;color:var(--muted);font-size:13px;line-height:1.6}
      .intro-steps{display:grid;gap:11px;margin:20px 0 0;padding:0;list-style:none}
      .intro-steps li{display:grid;grid-template-columns:30px minmax(0,1fr);gap:13px;align-items:start}
      .intro-steps b{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:color-mix(in srgb,var(--accent) 12%,transparent);color:var(--accent);font-size:12px;font-weight:850}
      .intro-steps strong{display:block;font-size:14px}
      .intro-steps small{display:block;margin-top:2px;color:var(--muted);font-size:12px;line-height:1.5}
      .intro-foot{margin:22px 0 0;display:grid;gap:9px}
      .intro-foot .solid-btn{width:100%}
      .intro-foot small{color:var(--muted);font-size:11px;line-height:1.5;text-align:center}
      @media(max-width:560px){.intro-frame{padding:22px 18px 18px}}
    `;document.head.appendChild(el);
  }
  function dialog(){
    let node=$('#welcomeIntroDialog');if(node)return node;
    node=document.createElement('dialog');node.id='welcomeIntroDialog';node.className='intro-dialog';
    node.innerHTML=`<form method="dialog" class="intro-frame">
      <span class="intro-kicker">SO FUNKTIONIERT PROMPT.AI</span>
      <h2>Aus deiner Idee wird ein Auftrag, mit dem eine KI wirklich arbeiten kann.</h2>
      <p>Du beschreibst dein Vorhaben in normalen Worten. Prompt.ai macht daraus ein vollständiges Briefing – und du gibst es der KI deiner Wahl.</p>
      <ol class="intro-steps">
        <li><b>1</b><div><strong>Beschreiben</strong><small>Ein paar Sätze reichen. Hast du schon eine Website oder Google-Einträge, liest Prompt.ai sie aus und übernimmt Öffnungszeiten, Kontakt und Leistungen.</small></div></li>
        <li><b>2</b><div><strong>Richtung wählen</strong><small>Du bekommst drei gestaltete Vorschläge zu sehen und entscheidest, welcher passt.</small></div></li>
        <li><b>3</b><div><strong>Auftrag mitnehmen</strong><small>Fertig ist ein Master-Prompt mit Fakten, Seitenliste und Regeln – für ChatGPT, Claude, Codex oder wen du willst.</small></div></li>
      </ol>
      <div class="intro-foot">
        <button type="submit" class="solid-btn" id="welcomeIntroStart">Los geht’s</button>
        <small>Für einen freien Prompt (Bild, Video, Text, Logo …) brauchst du keinen dieser Schritte – das geht direkt auf der Startseite.</small>
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
    styles();try{dialog().showModal()}catch{}
  }
  function bind(){
    document.addEventListener('click',event=>{
      if(!event.target.closest?.('#gateGuestBtn,#gateSignUpPick,#signUpBtn,#startFreeBtn,#offerCta'))return;
      // After the account step, not instead of it: the gate keeps the focus it needs.
      setTimeout(show,700);
    },true);
  }
  window.PromptAiIntro={show,reset:()=>{try{localStorage.removeItem(SEEN_KEY)}catch{}}};
  styles();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
