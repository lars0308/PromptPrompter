(()=>{
  'use strict';
  // Wer gerade „Kostenlos testen" bestätigt oder ein Konto angelegt hat, steht vor einem leeren
  // Feld. Diese Begrüßung füllt die Lücke - einmal pro Gerät, danach nie wieder.
  //
  // Sie zeigt bewusst nicht noch einmal, was die Einstiegsseite schon erklärt hat. Dort stehen die
  // Beschriftungen an der Konsole und die drei Schritte; wer sie zweimal liest, liest sie beim
  // zweiten Mal nicht. Was dort fehlt und hier zählt: wie das Ergebnis aussieht. Links die drei
  // hingeschriebenen Sätze, rechts der Auftrag, der daraus wird - das ist in einem Blick
  // beantwortet, wofür sonst ein Absatz nötig wäre.
  const $=(s,r=document)=>r.querySelector(s);
  const SEEN_KEY='prompt-ai-intro-seen-v1';
  const seen=()=>{try{return localStorage.getItem(SEEN_KEY)==='1'}catch{return false}};
  const remember=()=>{try{localStorage.setItem(SEEN_KEY,'1')}catch{}};

  function dialog(){
    let node=$('#welcomeIntroDialog');if(node)return node;
    node=document.createElement('dialog');node.id='welcomeIntroDialog';node.className='intro-dialog';
    node.innerHTML=`<form method="dialog" class="intro-frame">
      <span class="intro-kicker">WILLKOMMEN BEI PROMPT.AI</span>
      <h2>Du schreibst drei Sätze. Wir machen den Auftrag daraus.</h2>
      <p class="intro-lead">So sieht das aus – links, was du eintippst, rechts, was du mitnimmst.</p>
      <div class="intro-compare">
        <article class="intro-side">
          <span class="intro-side-tag">Deine Eingabe</span>
          <p>Kosmetikstudio in Bremen. Behandlungen mit Preisen, Termine online und ein ruhiger, hochwertiger Auftritt.</p>
        </article>
        <span class="intro-arrow" aria-hidden="true"></span>
        <article class="intro-side is-result">
          <span class="intro-side-tag">Dein Master-Prompt</span>
          <pre><b># Auftrag</b>
Website für ein Kosmetikstudio in Bremen.

<b>## Fakten</b>
Leistungen und Preise, Online-Termine,
Kontakt und Öffnungszeiten.

<b>## Gestaltung</b>
Ruhig, hochwertig, viel Weißraum.
Keine Standardvorlage.

<b>## Fertig, wenn</b>
Termine buchbar, Preise sichtbar,
Handy und Rechner geprüft.</pre>
        </article>
      </div>
      <ul class="intro-gains">
        <li><strong>Wir lesen mit</strong><span>Hast du schon eine Website? Wir holen Kontakt, Leistungen und Öffnungszeiten selbst heraus.</span></li>
        <li><strong>Wir fragen nach</strong><span>Was fehlt, fragen wir kurz ab – statt es zu erfinden.</span></li>
        <li><strong>Du wählst</strong><span>Drei fertige Richtungen, du entscheidest, welche es wird.</span></li>
      </ul>
      <div class="intro-foot">
        <button type="submit" class="solid-btn" id="welcomeIntroStart">Erstes Projekt starten</button>
        <small>Läuft in ChatGPT, Claude, Codex, Cursor oder v0. Für Bild, Video, Text und Logo gibt es den freien Prompt – direkt auf der Startseite.</small>
      </div>
    </form>`;
    document.body.appendChild(node);
    node.addEventListener('close',remember);
    node.addEventListener('cancel',event=>{event.preventDefault();node.close()});
    return node;
  }
  function show(){
    if(seen())return;
    // Nie über etwas, das zuerst beantwortet werden muss.
    if(document.querySelector('#cookieBanner[open],#appActionDialog[open],#maintenanceDialog[open],dialog.intro-dialog[open]'))return;
    try{dialog().showModal()}catch{}
  }
  function bind(){
    // Angesagt wird der Eintritt, nicht der Klick: app.js meldet sich, wenn der Gastlauf bestätigt
    // oder das Konto angelegt ist. Am Klick zu hängen hieß, die Begrüßung über die noch offene
    // Zustimmungsfrage zu legen - und weil jedes Fenster beim Öffnen die anderen schließt, nahm
    // sie dabei die Einstiegsseite mit.
    window.addEventListener('promptai:onboarding-start',()=>setTimeout(show,450));
  }
  window.PromptAiIntro={show,reset:()=>{try{localStorage.removeItem(SEEN_KEY)}catch{}}};

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
