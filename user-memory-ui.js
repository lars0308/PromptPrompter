// Der Zettel, den die KI bei jedem Lauf mitbekommt. Er steht im Profil und nicht in den
// Einstellungen, weil er zum Kunden gehoert und nicht zum Projekt: was er hier hineinschreibt,
// gilt fuer alles, was er kuenftig baut.
//
// Warum es diesen Zettel ueberhaupt gibt: eine KI merkt sich nichts. Alles, was sie ueber jemanden
// wissen soll, muss bei jeder Anfrage erneut mitgeschickt und bezahlt werden. Den ganzen
// Gespraechsverlauf mitzuschleppen waere die teuerste Antwort darauf - und mit der Zeit auch die
// schlechteste, weil verworfene Zwischenstaende mitwandern. Ein paar Zeilen Vorlieben sind billig,
// bleiben richtig und ersparen dieselbe Erklaerung beim naechsten Projekt.
//
// Er wird nur angezeigt, nie im Hintergrund befuellt: der Kunde soll jederzeit sehen koennen, was
// ueber ihn notiert ist. Serverseitig ist er ausdruecklich als Geschmacksangabe eingeordnet und
// nicht als Anweisung, die Auftragsvorgaben oder Pflichtpruefungen aushebeln koennte.
(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const MAX=2000;
  const BEISPIEL=`Beispiele:
Baue Next.js, nie Vite
Keine Verläufe, keine Schlagschatten
Meine Kunden sind meist lokale Betriebe
Kurze Sätze, keine Marketing-Sprache`;
  let card=null,saved='',busy=false;

  // Diese Datei wird erst beim Oeffnen des Kontos geladen, haengt sich also hinter das volle
  // Design. Ihr Stylesheet bleibt deshalb hier statt in promptai-ui-layers.css - dort vorne
  // wuerde es von der spaeteren Ebene ueberschrieben.
  function styles(){
    if($('#userMemoryStyles'))return;
    const s=document.createElement('style');s.id='userMemoryStyles';s.textContent=`.user-memory-card{margin-top:16px;padding:18px;border:1px solid var(--line);border-radius:16px;background:var(--surface)}.user-memory-head strong,.user-memory-head small{display:block}.user-memory-head small{margin-top:4px;color:var(--muted);font-size:9px;line-height:1.5}.user-memory-card textarea{width:100%;margin-top:13px;padding:12px;border:1px solid var(--line);border-radius:12px;background:var(--input,var(--paper));color:var(--ink);font:inherit;font-size:11px;line-height:1.6;resize:vertical}.user-memory-card textarea:focus{outline:2px solid color-mix(in srgb,var(--accent) 45%,transparent);outline-offset:1px}.user-memory-foot{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:11px}.user-memory-foot>div{display:flex;gap:8px;align-items:center}.user-memory-foot small{color:var(--muted);font-size:8px}.user-memory-note{margin:9px 0 0;color:var(--muted);font-size:9px;line-height:1.45}.user-memory-note.good{color:var(--good)}.user-memory-note.error{color:var(--danger)}@media(max-width:650px){.user-memory-foot{flex-direction:column;align-items:stretch}.user-memory-foot>div{width:100%}.user-memory-foot button{flex:1}}`;
    document.head.appendChild(s);
  }

  function ensure(){
    const parent=$('#accountLoggedIn');if(!parent)return false;
    if(card)return true;
    card=document.createElement('section');
    card.id='userMemoryCard';card.className='user-memory-card';
    card.innerHTML=`<div class="user-memory-head"><div><strong>Was Prompt.ai über dich weiß</strong><small>Diese Zeilen gehen bei jedem Projekt mit, damit du nicht jedes Mal dasselbe erklären musst. Nur Vorlieben und Arbeitsweise — keine Projektinhalte. Du kannst alles ändern und löschen.</small></div></div><textarea id="userMemoryText" rows="7" maxlength="${MAX}" placeholder="${BEISPIEL.replace(/"/g,'&quot;')}"></textarea><div class="user-memory-foot"><small id="userMemoryCount"></small><div><button type="button" class="text-btn danger" id="userMemoryClear">Leeren</button><button type="button" class="solid-btn mini" id="userMemorySave">Speichern</button></div></div><p id="userMemoryMessage" class="user-memory-note"></p>`;
    const learning=$('#learningControlCard',parent);
    parent.insertBefore(card,learning||$('.account-support-card',parent)||parent.lastElementChild);
    $('#userMemoryText').addEventListener('input',count);
    $('#userMemorySave').onclick=save;
    $('#userMemoryClear').onclick=clear;
    return true;
  }

  function count(){
    const field=$('#userMemoryText');if(!field)return;
    const used=field.value.length;
    $('#userMemoryCount').textContent=`${used} von ${MAX} Zeichen`;
    $('#userMemorySave').disabled=busy||field.value.trim()===saved.trim();
  }
  function note(text,kind=''){const box=$('#userMemoryMessage');if(box){box.textContent=text;box.className=`user-memory-note ${kind}`.trim()}}

  async function load(){
    if(!ensure())return;
    const cloud=window.SiteBriefCloud,field=$('#userMemoryText');
    if(!cloud?.user||!cloud?.client){field.value='';field.disabled=true;saved='';note('Nach der Anmeldung steht hier, was Prompt.ai sich zu dir merkt.');count();return}
    field.disabled=false;note('Wird geladen…');
    try{
      const {data,error}=await cloud.client.from('sitebrief_user_settings').select('memory').eq('user_id',cloud.user.id).maybeSingle();
      if(error)throw error;
      saved=String(data?.memory||'');
      field.value=saved;
      if(window.PromptAiUserMemory)window.PromptAiUserMemory.value=saved;
      note('');
    }catch(error){note(error?.message||'Konnte nicht geladen werden.','error')}
    count();
  }

  async function write(value){
    const cloud=window.SiteBriefCloud;
    if(!cloud?.user)throw new Error('Bitte zuerst anmelden.');
    if(typeof cloud.saveUserMemory!=='function')throw new Error('Diese Version kann den Zettel noch nicht speichern.');
    await cloud.saveUserMemory(value);
    saved=value;
    if(window.PromptAiUserMemory)window.PromptAiUserMemory.value=value;
  }

  async function save(){
    const field=$('#userMemoryText');if(!field||busy)return;
    busy=true;count();note('Wird gespeichert…');
    try{await write(field.value.trim());note('Gespeichert. Ab dem nächsten Projekt geht es mit.','good')}
    catch(error){note(error?.message||'Konnte nicht gespeichert werden.','error')}
    finally{busy=false;count()}
  }

  async function clear(){
    const field=$('#userMemoryText');if(!field||busy)return;
    if(!field.value.trim())return;
    const ok=await window.PromptAiDialog?.confirm?.('Alles löschen, was Prompt.ai sich zu dir merkt? Beim nächsten Projekt wird wieder von vorn gefragt.',{title:'Gedächtnis leeren',confirmLabel:'Löschen',danger:true});
    if(!ok)return;
    busy=true;note('Wird gelöscht…');
    try{await write('');field.value='';note('Gelöscht.','good')}
    catch(error){note(error?.message||'Konnte nicht gelöscht werden.','error')}
    finally{busy=false;count()}
  }

  function init(){
    window.PromptAiUserMemory={value:'',refresh:load};
    styles();ensure();
    const dialog=$('#accountDialog');
    if(dialog)new MutationObserver(()=>{if(dialog.open)load()}).observe(dialog,{attributes:true,attributeFilter:['open']});
    window.SiteBriefCloud?.subscribe?.(event=>{if(event==='auth'||event==='bundle')load()});
    load();
  }
  styles();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
