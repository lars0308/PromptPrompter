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
      /* Mit der Erklärung der Konsole ist der Inhalt länger als der Deckel - ohne eigene
         Scrollfläche schnitt das Fenster den letzten Satz einfach ab. */
      .intro-dialog{width:min(560px,calc(100vw - 28px));max-height:min(92vh,820px);padding:0;border:0;border-radius:22px;background:var(--paper);color:var(--ink);box-shadow:0 30px 90px rgba(10,16,22,.28);overflow-y:auto;overscroll-behavior:contain}
      .intro-dialog::backdrop{background:rgba(8,12,16,.62);backdrop-filter:blur(8px)}
      .intro-frame{display:grid;gap:0;padding:26px 26px 22px}
      .intro-kicker{display:block;color:var(--accent);font-size:9px;font-weight:900;letter-spacing:.14em}
      .intro-frame h2{margin:9px 0 0;font-size:clamp(24px,5vw,31px);line-height:1.08;letter-spacing:-.035em}
      /* Die Startseite ist ein einziges Textfeld mit einem Menü darüber. Wer das zum ersten Mal
         sieht, weiß nicht, dass die Arbeitsart dort oben steht - also zeigen wir die Konsole
         einmal nachgebaut und schreiben an jedes Teil, wofür es da ist. */
      .intro-console{margin:18px 0 0;border:1px solid var(--line);border-radius:16px;background:var(--surface);overflow:hidden}
      .intro-console-shot{padding:13px 13px 11px;border-bottom:1px solid var(--line);background:color-mix(in srgb,var(--accent) 4%,var(--surface))}
      .intro-console-mode{display:inline-flex;align-items:center;gap:7px;min-height:30px;padding:0 11px;border:1px solid var(--line);border-radius:9px;background:var(--paper);font-size:11.5px;font-weight:750}
      .intro-console-mode:before{content:"";width:12px;height:12px;border:1.6px solid var(--accent);border-radius:50%}
      .intro-console-mode i{font-style:normal;color:var(--muted);font-weight:600}
      .intro-console-field{margin-top:9px;padding:11px 12px;border:1px solid var(--line);border-radius:11px;background:var(--paper);color:var(--muted);font-size:12px;line-height:1.5}
      .intro-console-foot{display:flex;align-items:center;gap:8px;margin-top:9px;color:var(--muted);font-size:11px}
      .intro-console-foot b{display:grid;place-items:center;width:22px;height:22px;border:1px solid var(--line);border-radius:7px;background:var(--paper);color:var(--ink);font-size:13px;font-weight:700}
      .intro-console-legend{display:grid;gap:8px;margin:0;padding:12px 13px}
      .intro-console-legend div{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;font-size:12px;line-height:1.5}
      .intro-console-legend dt{margin:0;color:var(--accent);font-weight:800}
      .intro-console-legend dd{margin:0;color:var(--muted)}
      .intro-console-legend dd b{color:var(--ink);font-weight:700}
      .intro-steps{display:grid;gap:11px;margin:18px 0 0;padding:0;list-style:none}
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
