import test from 'node:test';
import assert from 'node:assert/strict';
import {layer} from './helpers/ui-layer.mjs';
import {readFile} from 'node:fs/promises';

// Die Oberflaechen-Stile stehen seit dem Zusammenzug in promptai-ui-layers.css; layer()
// liefert eine Datei wieder mit genau ihrem Stil-Abschnitt zurueck.
const read=name=>layer(name);

test('the final design layer loads after the complete d052fcb interface stack',async()=>{
  const boot=await read('admin-console.js');
  const html=await read('index.html');
  const design=boot.indexOf('promptai-full-app-design.js');
  assert.ok(design>boot.indexOf('promptai-home-final.js'));
  assert.match(html,/entry-gate-ui\.js/);
  assert.ok(html.indexOf('entry-gate-ui.js')<html.indexOf('admin-console.js'));
  for(const feature of ['subscription-ui.js','promptai-loading-v2.js','ui-final-touch.js']){
    assert.ok(boot.indexOf(feature)>=0,feature);
    assert.ok(boot.indexOf(feature)<design,`${feature} must load before the final design layer`);
  }
});

test('the design system covers every major page dialog control purchase and loading surface',async()=>{
  const css=await read('promptai-full-app-design.css');
  for(const selector of [
    '.prompt-command-home','.workspace','.simple-intake-shell','.project-mode-frame',
    '.free-prompt-shell','.quick-revision-body','.project-preview-shell','.preview-lightbox-frame',
    '.library-tabs','.settings-body','.account-body','.clarification-body','.plans-grid',
    '.subscription-overview-body','.admin-body','.legal-body','.cookie-banner-box',
    '#promptMaintenanceOverlay','#promptWorkflowLoader','#promptAiThinkingStage',
    '.prompt-handoff-loader','.prompt-completion-flash','.master-generation-inner',
    '.field input','.field textarea','.field select','.solid-btn','.outline-btn','.text-btn'
  ])assert.ok(css.includes(selector),selector);
  assert.match(css,/@keyframes promptSystemFlash/);
  assert.match(css,/\.prompt-completion-flash\{animation:promptSystemFlash/);
});

test('the refinement replaces announced shadows with stacked surfaces and one spacing scale',async()=>{
  const css=await read('promptai-full-app-design.css');
  // A shadow that announces itself is the AI-glow this design leaves behind.
  assert.match(css,/--depth-1:0 1px 2px/);
  assert.match(css,/--shadow:var\(--depth-3\);/,'the old 90px shadow token must be superseded');
  assert.match(css,/--sp-1:4px;\s+--sp-2:8px/,'one spacing scale, decided once');
  assert.match(css,/--ease:cubic-bezier/,'one curve for everything that moves');
  // Dark mode carries depth as a lighter hairline, since a black shadow on black is invisible.
  assert.match(css,/\[data-theme="dark"\]\{\s*--depth-1:0 1px 2px rgba\(0,0,0/);
  // Dialogs and menus animate in; the loading screens keep their own language.
  assert.match(css,/@keyframes promptDialogIn/);
  assert.match(css,/@keyframes promptMenuIn/);
  assert.doesNotMatch(css,/@keyframes prompt(Fill|Boot)/,'loader animations stay where they are');
});
test('the command console stays the console and does not get flattened into a card',async()=>{
  const css=await read('promptai-full-app-design.css');
  const cardRule=css.slice(css.indexOf('/* ---- Flächen'),css.indexOf('/* ---- Bedienelemente'));
  assert.ok(!cardRule.includes('.prompt-command-panel'),'the dark console must be excluded from the blanket card treatment');
  assert.match(css,/\.prompt-command-panel:focus-within/,'writing in it has to be visible');
  assert.match(css,/\.prompt-command-input\{[^}]*background:transparent!important/);
});
test('the Werkstatt layer stands down under the full redesign instead of fighting its palette',async()=>{
  const brand=await read('brand-werkstatt.js');
  assert.match(brand,/const superseded=\(\)=>document\.documentElement\.classList\.contains\('prompt-full-redesign'\)/);
  assert.match(brand,/if\(superseded\(\)\)\{existing\?\.remove\(\);return\}/,'its grid and warm paper must be removed, not just overridden');
  assert.match(brand,/observe\(document\.documentElement,\{attributes:true,attributeFilter:\['class'\]\}\)/);
  // The redesign carries the ground with the logo mark, so no second background may paint over it.
  const css=await read('promptai-full-app-design.css');
  assert.match(css,/html\.prompt-full-redesign body\{background-image:none!important\}/);
});

test('an !important display never outranks the hidden attribute again',async()=>{
  const css=await read('promptai-full-app-design.css');
  // app.js hides the upgrade button by setting [hidden] once the plan is not free.
  // [hidden] only carries the user agent's display:none, which loses to !important -
  // the same trap that kept the close button on the login gate.
  assert.match(css,/:is\(#upgradeBtn,#upgradeMenuBtn\)\[hidden\][\s\S]{0,120}display:none!important/);
});
test('the console keeps its own type colour, because its ground is dark in both themes',async()=>{
  const css=await read('promptai-full-app-design.css');
  assert.match(css,/\.prompt-command-input,[\s\S]{0,80}color:#eef6fb!important/,'--ink would be near-black in light mode, on a dark panel');
  assert.match(css,/--logo-blue:#2d93c9/,'the caret and submit take the blue from the mark itself');
  // Der Schreibbalken ist orange - das einzige Warme im Feld und dadurch sofort zu finden.
  assert.match(css,/caret-color:var\(--caret\)!important/);
  assert.match(css,/--caret:#ff8a34\}/);
});
test('dark mode is graphite, not black, so surfaces still have a step below them',async()=>{
  const css=await read('promptai-full-app-design.css');
  assert.match(css,/\[data-theme="dark"\]\{\s*--paper:#14181d;/);
  assert.doesNotMatch(css,/--paper:#080d13;[\s\S]{0,400}--paper:#14181d/,'the near-black value must be superseded, not duplicated after');
});
test('the phone home page fits one screen: every block gives height, none disappears',async()=>{
  const css=await read('promptai-full-app-design.css'),home=await read('promptai-home-final.js');
  assert.match(home,/\.prompt-command-input\{[^}]*min-height:185px/,'the component still ships the tall default');
  assert.match(css,/\.prompt-command-input\{min-height:96px!important/,'which the phone layer has to bring down');
  // Keine erzwungene Bildschirmhöhe mehr: dvh misst ohne Adressleiste, svh mit ihr, und
  // genau dieser Unterschied hat den letzten Block unter die Kante geschoben.
  assert.doesNotMatch(css,/#welcomePage\{[\s\S]{0,140}min-height:calc\(100[ds]vh/,'nothing may be pinned to a height that moves');
  assert.match(css,/\.prompt-command-input\{min-height:172px!important\}/,'the field carries the height instead');
});

test('the start page drops the bottom tools and puts the writing surface in the middle',async()=>{
  const home=await read('promptai-home-final.js'),css=await read('promptai-full-app-design.css'),nav=await read('promptai-nav-drawer.js');
  // The four paths live in the drawer now; a second copy on the home page only competed
  // with the field for attention.
  assert.doesNotMatch(home,/prompt-home-tools/,'the tool row is gone from the component');
  assert.doesNotMatch(css,/\.prompt-home-tool\b/,'and from the design layer');
  // Every path stays reachable, but each from exactly one place: the app's own menu already
  // carries Projekte (#openLibraryBtn) and Projektstände (#projectHistoryBtn), so the drawer
  // adds only the one that was missing, and Projekt prüfen moved into the mode list.
  assert.match(nav,/\['Probelauf','workspaceBuildSiteBtn'/);
  for(const gone of ['workspaceLibraryBtn','workspacePreviewBtn','projectHistoryBtn'])assert.ok(!nav.includes(gone),`${gone} must not be duplicated in the drawer`);
  const html=await read('index.html');
  for(const id of ['openLibraryBtn'])assert.ok(html.includes(id),id);
  assert.match(home,/data-command-mode="check"[\s\S]{0,120}Projekt prüfen/);
  assert.match(home,/if\(mode==='check'\)\{closeModeMenu\(home\);proxy\('workspacePreviewBtn'\);return\}/,'checking is an action, not a writing mode');
  // The mode picker stays the dropdown it was: three tiles took the whole width of the
  // console for a choice that is made once, and suggestion chips added a second row below.
  assert.match(home,/id="promptModeButton"[\s\S]{0,300}id="promptModeMenu"/);
  assert.match(home,/data-command-mode="website"[\s\S]{0,400}data-command-mode="free"[\s\S]{0,400}data-command-mode="revision"/);
  assert.doesNotMatch(home,/prompt-starter/,'no suggestion row under the console');
  assert.match(css,/\.prompt-mode-menu:not\(\[hidden\]\)\{animation:promptMenuIn/,'it still opens softly');
});

test('one inset for everything inside a dialog, heavy enough to beat the id rules below',async()=>{
  const css=await read('promptai-full-app-design.css');
  assert.match(css,/html\.prompt-full-redesign\{--dlg-x:24px\}/);
  assert.match(css,/@media\(max-width:820px\)\{\s*html\.prompt-full-redesign\{--dlg-x:16px\}/);
  // admin-ai-ui.js sets "#settingsDialog .settings-body{padding:0 14px 24px!important}" -
  // a class rule loses to that no matter how many !important it carries.
  assert.match(css,/:is\(#settingsDialog,body\) :is\(\s*\.dialog-head,/);
  assert.match(css,/:is\(#settingsDialog,body\) \.library-pane\{padding-left:0!important/,'the pane must not inset a second time');
});

test('the drawer reshapes the existing menu instead of building a second one',async()=>{
  const nav=await read('promptai-nav-drawer.js');
  // A rebuilt menu means maintaining every plan gate twice, and the copy is the one that goes wrong.
  assert.match(nav,/const menu=\$\('#topbarMenu'\)/);
  assert.doesNotMatch(nav,/\.insertBefore\(/,'no existing entry may be re-parented');
  // The only appends are the drawer's own new buttons (the work path and the Support entry);
  // nothing that was already in the menu is re-parented.
  assert.deepEqual([...nav.matchAll(/menu\.appendChild\((\w+)\)/g)].map(m=>m[1]),['button','button']);
  assert.match(nav,/button\.id='menuSupportBtn'/,'Support ist ein eigener Menüpunkt');
  // Er baut kein zweites Formular, sondern öffnet den vorhandenen Block im Profil.
  assert.match(nav,/\.account-support-card/);
  // Moving nodes threw: other layers insertBefore relative to them. Ordering is CSS now.
  assert.match(nav,/const rank=sortEntry\(node\);/);
  assert.match(nav,/node\.style\.order=String\(rank\);/);
  assert.match(nav,/\$\$\(':scope > \*',menu\)/,'containers other layers add must be ranked too');
  // Late arrivals default to order 0 and would jump to the top without a re-sort.
  assert.match(nav,/new MutationObserver\(\(\)=>\{clearTimeout\(pending\);pending=setTimeout\(shell,60\)\}\)\.observe\(menu,\{childList:true\}\)/);
  // The four work paths click the real home buttons, so the plan gate stays in one place.
  assert.match(nav,/\['Probelauf','workspaceBuildSiteBtn'/);
  assert.match(nav,/const target=\$\('#'\+targetId\);/);
  assert.match(nav,/setTimeout\(\(\)=>target\?\.click\(\),60\)/);
  // Ein gesperrter Eintrag verschwindet nicht, er nennt den Tarif und öffnet die Tarifseite -
  // der nötige Tarif wird dabei aus data-plan-label der echten Kachel gespiegelt, nicht doppelt
  // gepflegt.
  assert.match(nav,/target\?\.dataset\.planLabel/);
  assert.match(nav,/if\(lockFromTarget\(button,target\)\)\{close\(\);setTimeout\(\(\)=>document\.querySelector\('#plansDialog'\)\?\.showModal\(\)/);
  assert.match(nav,/#accountBtn:not\(\[hidden\]\)\{[\s\S]{0,60}margin-top:auto/,'profile is the one entry pinned to the bottom');
  // Eine Liste aus Wörtern: zwei Zeilen mit Zeichen unter acht ohne sahen aus wie Reste.
  assert.match(nav,/\.topbar-menu button svg\{display:none!important\}/);
  // Hell/Dunkel ist eine Einstellung - Wort links, Schalter rechts, kein Zeichen davor.
  // Die Regeln stehen in der Design-Ebene: sie wird als <link> nach dem <style> dieser
  // Datei eingehängt und gewinnt deshalb jeden Gleichstand.
  const design=await read('promptai-full-app-design.css');
  assert.match(design,/\.theme-toggle>span\{display:none!important\}/);
  assert.match(design,/\.theme-toggle,[\s\S]{0,120}justify-content:space-between!important/);
  assert.match(design,/\[data-theme="dark"\] \.topbar-menu \.theme-toggle::after\{[\s\S]{0,120}calc\(100% - 11px\)/,'the knob moves with the theme');
});
test('the close button in the mode dialog is anchored again',async()=>{
  const css=await read('promptai-full-app-design.css');
  // It is position:absolute, but its frame carried no position, so it fell back into the
  // normal flow - and there it renders first, on top of the heading.
  assert.match(css,/:is\(\.project-mode-frame,\.simple-intake-shell,\.dialog-frame\)\{position:relative!important\}/);
  assert.match(css,/:is\(\.project-mode-close,\.simple-intake-close\)\{[\s\S]{0,120}right:14px!important/);
  assert.match(css,/:is\(\.project-mode-head,\.simple-intake-head\)\{padding-right:66px!important\}/,'the heading must not run under it');
});

test('the menu button moves right by position, not by re-parenting',async()=>{
  const css=await read('promptai-full-app-design.css'),home=await read('promptai-home-final.js');
  // promptai-home-final inserts its own toggle directly before #topbarMenuToggle, so lifting the
  // button out of .top-actions would leave that insertBefore without a reference node.
  assert.match(home,/actions\.insertBefore\(button,\$\('#topbarMenuToggle'\)\)/);
  assert.match(css,/#topbarMenuToggle\{[\s\S]{0,120}right:12px!important/);
  // .top-actions carries position:relative, so right was measured from the action group.
  assert.match(css,/\.topbar \.top-actions\{position:static!important\}/);
  // .top-actions.top-actions, because the upgrade button needs to clear the toggle now sitting
  // in its old spot at the header's right edge.
  assert.match(css,/\.topbar \.top-actions\.top-actions\{padding-right:52px!important\}/,'the upgrade button has to clear the toggle');
});
test('light/dark lives in the drawer, not twice in the header',async()=>{
  const css=await read('promptai-full-app-design.css'),nav=await read('promptai-nav-drawer.js');
  assert.match(css,/\.topbar #homeThemeToggle,/);
  // ux-stability-fix adds a second toggle that appears while the menu is open. With a real
  // entry in the drawer that shortcut is one button too many on the start page.
  assert.match(css,/\.topbar \.menu-theme-quick\{display:none!important\}/);
  assert.match(css,/\.topbar-menu #themeToggleBtn\{[\s\S]{0,200}display:flex!important/,'it stays a full entry in the drawer');
  assert.match(nav,/themeToggleBtn:61/,'and sits next to Einstellungen, not at the top');
});

test('writing in the console does not draw a second box inside it',async()=>{
  const css=await read('promptai-full-app-design.css');
  // Every textarea gets a 3px focus ring from the general field rule, and it followed the
  // field's radius - inside the console that read as a small box around the writing area.
  assert.match(css,/textarea,select\):focus\{[\s\S]{0,120}box-shadow:0 0 0 3px/);
  // It did not lose to !important (both rules carry it) but to specificity, hence the
  // element name in front of the class.
  assert.match(css,/html\.prompt-full-redesign textarea\.prompt-command-input:focus,/);
  assert.match(css,/textarea\.prompt-command-input:focus-visible\{\s*box-shadow:none!important/);
});

test('the old start page never shows through, and the handoff loader gets to finish',async()=>{
  const css=await read('promptai-full-app-design.css'),home=await read('promptai-home-final.js');
  // The old markup stays in the document because its buttons carry the plan gates and the
  // console clicks them - so it is hidden by clipping, not by display:none, and no longer
  // only while .prompt-home-surface is set (that class drops the moment a flow starts).
  assert.match(css,/html\.prompt-full-redesign #welcomePage>\.welcome-workspace\{[\s\S]{0,200}clip-path:inset\(50%\)!important/);
  assert.doesNotMatch(css,/#welcomePage>\.welcome-workspace\{[\s\S]{0,200}display:none/);
  assert.match(css,/body:has\(#workflowApp:not\(\[hidden\]\)\) #welcomePage\{display:none!important\}/);
  // Der Uebergabeschirm ist derselbe wie jeder andere und endet auch so: fuellen, blinken, weg.
  // Nichts an seiner Lebensdauer wird aus der Textlaenge gerechnet.
  const loader=await read('promptai-loading-v2.js');
  assert.match(loader,/overlay\.innerHTML=LOADER_MARKUP/,'derselbe Aufbau wie alle anderen Ladeschirme');
  assert.match(loader,/overlay\.dataset\.closing!=='1'/,'and it must not schedule its exit twice');
  assert.match(loader,/finishScreen\(overlay,\(\)=>\{/);
  assert.doesNotMatch(loader,/durationFor/,'nichts wird mehr aus der Textlaenge gerechnet');
  // Last project only appears once there is one; the meta line carries live numbers.
  assert.match(home,/if\(latest\)latest\.hidden=!title/);
  assert.match(home,/\$\{text\.length\} Zeichen · ≈\$\{total\} Token/);
  // Anhänge wiegen im Auftrag oft mehr als der getippte Satz und zählen deshalb mit.
  assert.match(home,/function attachmentTokens\(\)/);
  assert.match(home,/const total=tokenGuess\(text\)\+attached;/);
  assert.doesNotMatch(home,/Modell automatisch/,'the label said nothing that changes');
});

test('the mark stands free on every ground it appears on',async()=>{
  const css=await read('promptai-full-app-design.css');
  // Sie steht wieder in der Kopfzeile der Startseite, aber ohne Plättchen darunter.
  assert.match(css,/\.prompt-home-surface \.topbar \.brand-mark\{[\s\S]{0,140}display:block!important/);
  // Scoped to the start page: the loading screens are the one place where the mark
  // is the only thing identifying the surface.
  // Auf den Ladeflächen steht sie frei, ohne Plättchen - und in ihrer hellen Fassung,
  // weil diese Flächen in beiden Modi dunkel sind.
  // :not(.prompt-process-lines), weil der Zeilenkasten ebenfalls ein direktes div-Kind ist -
  // sonst stand das Zeichen zweimal untereinander auf demselben Schirm.
  // Die Ladeflaechen folgen dem eingestellten Modus, also folgt die Marke mit: --loader-logo
  // traegt im Hellmodus die dunkle Fassung, im Dunkelmodus die helle.
  assert.match(css,/\.prompt-completion-flash>div,\.master-generation-inner\):not\(\.prompt-process-lines\)::before\{[\s\S]{0,200}content:var\(--loader-logo\)/);
  assert.match(css,/--loader-logo:url\("\.\/sitebrief-logo-trace\.svg\?v=7"\)/);
  assert.match(css,/\[data-theme="dark"\]\{[\s\S]{0,400}--loader-logo:url\("\.\/sitebrief-logo-trace-light\.svg\?v=7"\)/);
});

test('the mode list belongs to the console: dark, and shown whole',async()=>{
  const css=await read('promptai-full-app-design.css');
  // overflow:clip cut the list off at the bottom of the section. clip is the one value
  // that may pair with visible on the other axis, so only the horizontal side is cut.
  assert.match(css,/\.prompt-command-home\{overflow-x:clip;overflow-y:visible\}/);
  assert.doesNotMatch(css,/\.prompt-command-home\{overflow:clip\}/);
  assert.match(css,/\.prompt-mode-menu\{[\s\S]{0,220}background:#141e28!important/);
  assert.match(css,/\.prompt-mode-option\{color:#dfe9f2!important/);
});

test('the inset is handed out once per dialog, not once per nesting level',async()=>{
  const css=await read('promptai-full-app-design.css');
  // Library lists, editors, admin tabs and the legal note each carried their own inset on
  // top of the body's - 32px instead of 16 in the profile and the admin area.
  assert.match(css,/\) :is\(\.library-items,\.library-editor,\.library-list,\.welcome-project-list,\.admin-tabs,\.history-tabs,\.legal-placeholder-note,\.plans-grid,\.plans-footer\)\{[\s\S]{0,140}padding-left:0!important/);
  // And the containers that had none at all now get it from the same token.
  assert.match(css,/\.legal-body,\.quick-revision-body,\.free-prompt-body,\s*\.library-pane>\.welcome-project-list/);
});

test('one edge for the whole app on the phone: header, console, greeting and every card start at the same line',async()=>{
  const css=await read('promptai-full-app-design.css');
  // Measured on one phone screen before this: header 10px, console 14px, greeting 18px,
  // dialog cards 17px. Each looked right alone; together nothing lined up. The phone still
  // floats the header with a small side margin, same as the console beneath it.
  assert.match(css,/\.welcome-page\{padding-left:var\(--dlg-x\)!important/);
  assert.match(css,/\.prompt-home-intro\{padding-left:0!important/,'its extra 4px was the third line');
  assert.match(css,/max-width:820px\)\{[\s\S]{0,400}body>\.topbar,[\s\S]{0,120}width:calc\(100% - var\(--dlg-x\)\*2\)!important/);
});
test('on the desktop the header runs edge to edge, independent of the console column',async()=>{
  const css=await read('promptai-full-app-design.css');
  // The header used to share the console's own (once frozen, then growing) column width. It now
  // fills the full window on the desktop - only the console keeps its own, narrower measure.
  assert.match(css,/min-width:821px\)\{[\s\S]{0,220}body>\.topbar,[\s\S]{0,160}width:100%!important;margin-left:0!important;margin-right:0!important/);
});

test('the mark ships without a plate, and stays readable on the dark loading surfaces',async()=>{
  const mark=await read('sitebrief-logo.svg'),light=await read('sitebrief-logo-light.svg');
  assert.doesNotMatch(mark,/<rect/,'no background plate in the artwork itself');
  assert.match(mark,/fill="#21262e"/);
  // Same geometry, lighter body, same blue - a filter would have recoloured the blue too.
  assert.match(light,/fill="#eef5fb"/);
  assert.equal(mark.replace(/#21262e/g,'X').replace(/Ein geometrisches P/,''),
               light.replace(/#eef5fb/g,'X').replace(/Helle Fassung: ein geometrisches P/,''),
               'both files must stay the same drawing');
  const sw=await read('sw.js');
  assert.match(sw,/sitebrief-logo-light\.svg/,'the light variant belongs in the offline shell');
});

test('the boot mark traces the blue once around the inside of the letter',async()=>{
  const trace=await read('sitebrief-logo-trace.svg'),light=await read('sitebrief-logo-trace-light.svg');
  const html=await read('index.html'),css=await read('promptai-full-app-design.css'),sw=await read('sw.js');
  // The stroke follows the letter's outline and is clipped to the letter, so it runs along
  // the inside edge instead of hanging outside it.
  assert.match(trace,/<clipPath id="pMask">/);
  assert.match(trace,/clip-path="url\(#pMask\)"/);
  // pathLength normalises the dash numbers, so they read as per-mille of the perimeter.
  assert.match(trace,/pathLength="1000"/);
  assert.match(trace,/@keyframes promptTrace\{from\{stroke-dashoffset:1000\}to\{stroke-dashoffset:0\}\}/);
  assert.match(trace,/prefers-reduced-motion:reduce/,'motion has to be calmable');
  // The start screen carries it in the theme that fits its ground; the loading surfaces are
  // dark in both themes and always take the light one.
  assert.match(html,/id="promptAppBoot"[\s\S]{0,120}sitebrief-logo-trace\.svg/);
  assert.match(html,/\[data-theme="dark"\] #promptAppBoot img\{content:url\("\.\/sitebrief-logo-trace-light\.svg/);
  assert.match(css,/--loader-logo:url\("\.\/sitebrief-logo-trace-light\.svg\?v=7"\)/,'im Dunkelmodus die helle Fassung');
  assert.match(light,/fill="#eef5fb"/);
  for(const f of ['sitebrief-logo-trace.svg','sitebrief-logo-trace-light.svg'])assert.ok(sw.includes(f),f);
  // And the mark is back in the start page header, without a plate.
  assert.match(css,/\.prompt-home-surface \.topbar \.brand-mark\{[\s\S]{0,140}background:transparent!important/);
});

test('light mode is a calm grey and carries the mark faintly',async()=>{
  const css=await read('promptai-full-app-design.css');
  assert.match(css,/--paper:#e7eaee;/,'the ground is grey, not near-white');
  assert.match(css,/--surface:#f5f7f9;/,'and the cards sit one step above it, still not white');
  assert.doesNotMatch(css,/--surface:#ffffff;/);
  // The start page carries its own colour names and sets them with !important.
  assert.match(css,/\.prompt-home-surface:not\(\[data-theme="dark"\]\)\{[\s\S]{0,200}--home-bg:var\(--paper\)/);
  // Das Zeichen ist im Hellmodus wieder da - aber schwächer als im Dunkelmodus, sonst
  // trägt die große flache Form auf dem Grau als Fleck auf.
  assert.match(css,/:not\(\[data-theme="dark"\]\) body::after\{opacity:\.019!important;display:block!important\}/);
  assert.match(css,/\[data-theme="dark"\] body::after\{opacity:\.038/,'im Dunkelmodus darf es kräftiger sein');
  // In Dialogen bleibt es aus: kleine Fläche, Text darüber.
  assert.match(css,/:not\(\[data-theme="dark"\]\) \.dialog-frame::after,[\s\S]{0,300}display:none!important/);
  // Zwei flache Diagonalen über den Grund, hinter allem und ohne Klickfläche.
  assert.match(css,/body::before\{[\s\S]{0,160}pointer-events:none/);
  assert.match(css,/linear-gradient\(104deg,transparent calc\(38% - 1px\)/);
});

test('kein Ladeschirm wird kuenstlich gestreckt oder aus der Textlaenge gerechnet',async()=>{
  const loader=await read('promptai-loading-v2.js'),theme=await read('theme-init.js');
  // Frueher rechnete durationFor() aus der Beschreibungslaenge eine Anzeigedauer von bis zu
  // elf Sekunden aus - das war kein Fortschritt, sondern eine Behauptung. Jetzt haengt der
  // Schirm an der Anfrage: er geht, sobald sie zurueck ist.
  assert.doesNotMatch(loader,/durationFor/);
  assert.doesNotMatch(loader,/inputLength/);
  // Nur nach unten gibt es eine Grenze: schneller als lesbar wirkt wie ein Fehler.
  assert.match(theme,/const MIN_VISIBLE_MS=FLASH_MS\?2400:0;/);
});

test('the references step reads as two purposes, not five equal blocks',async()=>{
  const css=await read('promptai-full-app-design.css'),clean=await read('guided-clean-ui.js');
  assert.match(css,/#stepReferences \.reference-url-add\{[\s\S]{0,140}grid-template-columns:minmax\(0,1fr\) auto!important/);
  assert.match(css,/#stepReferences \.reference-url-add \.outline-btn::after\{\s*content:"\+"/,'on a phone the button becomes a sign, not a second row');
  assert.match(css,/#stepReferences \.reference-limit-note\{[\s\S]{0,160}text-align:right!important/,'counters are a side note');
  assert.match(css,/#stepReferences \.dropzone\{[\s\S]{0,140}grid-template-columns:auto minmax\(0,1fr\) auto!important/);
  assert.match(css,/#stepReferences \.client-context-card\{[\s\S]{0,200}border-left:3px solid var\(--accent\)!important/,'the second purpose gets its own edge');
  // Two paragraphs became one line each - the list of possible documents said nothing.
  assert.match(clean,/const short='PDF, PNG, JPG, WebP, TXT, MD, CSV oder JSON · max\. 12 MB'/);
  assert.match(clean,/clientLead\.textContent='Echte Fakten statt Stil/);
});

test('the loading screen is the surface itself, and the step pages take the full width',async()=>{
  const css=await read('promptai-full-app-design.css');
  // No card on the loader: the whole screen is dark in both themes, so the frame could go
  // without the light type losing its ground.
  // Der Grund folgt dem eingestellten Modus: wer hell arbeitet, bekommt keinen schwarzen
  // Bildschirm mitten im Ablauf.
  assert.match(css,/:is\(#promptWorkflowLoader,\.prompt-handoff-loader,\.prompt-completion-flash,#promptAiThinkingStage\)\{\s*background:var\(--loader-bg\)!important/);
  assert.match(css,/--loader-bg:var\(--paper\)/);
  assert.match(css,/\[data-theme="dark"\]\{[\s\S]{0,200}--loader-bg:#0f151d/);
  assert.match(css,/#promptAiThinkingStage>div\)\{[\s\S]{0,200}border:0!important;\s*background:transparent!important/);
  // Die beiden Arbeitsflächen mitten in einer Schrittseite sind kein Vollbild - ohne
  // eigenen dunklen Grund stand ihre helle Schrift im Hellmodus auf hellem Papier.
  assert.match(css,/:is\(\.streamline-working-inner,\.master-generation-inner\)\{[\s\S]{0,240}background:var\(--loader-bg\)!important/);
  // content:url() instead of a background image - a background graphic can be frozen,
  // a replaced image animates, so the blue bar moves here too.
  assert.match(css,/::before\{\s*content:var\(--loader-logo\)/);
  // .workspace inset 20, the step card another 16 - content sat at 36 while the rest of
  // the app starts at 16, and the card floated with a visible edge.
  assert.match(css,/\.workspace\{padding-left:0!important;padding-right:0!important\}/);
  assert.match(css,/\.step-panel,[\s\S]{0,80}#guidedCleanHead\{[\s\S]{0,160}padding-left:var\(--dlg-x\)!important/);
});

test('the sweep: every card breathes, no box in a box, no pair of buttons glued together',async()=>{
  const css=await read('promptai-full-app-design.css');
  // Gemessen über alle Dialoge und Schritte, Telefon und Rechner, hell und dunkel.
  // 1. Karten mit Kante, aber ohne Innenabstand.
  assert.match(css,/:is\(\.library-item,\.admin-fold,\.settings-upgrade-note,\.legal-placeholder-note,[\s\S]{0,120}padding:var\(--sp-5\)!important/);
  // 2. Kante in Kante auf der Anmeldeseite.
  assert.match(css,/\.auth-access-card \.auth-subscribe-compact\{[\s\S]{0,120}border:0!important/);
  // 3. Ein Abstand für jede Knopfreihe - vorher standen sie 7px auseinander.
  assert.match(css,/:is\(\.inline-actions,\.step-actions,[\s\S]{0,260}gap:var\(--sp-3\)!important/);
  // 4. Luft unter jeder Überschrift.
  assert.match(css,/:is\(\.dialog-head,\.free-prompt-head,[\s\S]{0,120}padding-bottom:var\(--sp-5\)!important/);
  // 5. Weiß auf Mittelblau kam im Dunkelmodus auf 2,2:1.
  assert.match(css,/\.plan-card-badge\{[\s\S]{0,120}background:var\(--navy\)!important/);
});

test('Enter sends where Enter means Enter, and stays a line break where it does not',async()=>{
  const home=await read('promptai-home-final.js');
  // Auf dem Telefon ist Enter der Zeilenumbruch - wer dort mitten im Satz absendet,
  // verliert den Rest. Deshalb entscheidet der Zeiger, nicht die Bildschirmbreite.
  assert.match(home,/matchMedia\('\(pointer:fine\)'\)\.matches/);
  assert.match(home,/if\(!withModifier&&\(!fine\|\|event\.shiftKey\)\)return;/);
  // Strg/Cmd+Enter geht überall, auch auf dem Telefon mit Tastatur.
  assert.match(home,/const withModifier=event\.metaKey\|\|event\.ctrlKey;/);
  assert.match(home,/event\.isComposing/,'während einer Eingabemethode darf Enter nichts auslösen');
});

test('the flow selector drives the real mode switch and never claims a mode the plan forbids',async()=>{
  const home=await read('promptai-home-final.js'),app=await read('app.js');
  // app.js kennt die drei Abläufe bereits und sperrt sie nach Tarif; setMode öffnet bei
  // einem gesperrten Ablauf die Tarifseite. Das Menü bedient genau diese Knöpfe.
  assert.match(app,/function setMode\(mode\)\{\s*if\(!planRules\(\)\.modes\.includes\(mode\)\)/);
  assert.match(home,/\.mode-switch button\[data-mode="\$\{mode\}"\]/);
  assert.match(home,/const FLOW_LABEL=\{guided:'Mit Rückfragen',auto:'Ohne Rückfragen',expert:'Selbst einstellen'\}/);
  // Erst merken, wenn der echte Schalter umgesprungen ist.
  assert.match(home,/const active=\$\('\.mode-switch button\.active'\)\?\.dataset\.mode;\s*if\(active&&active!==mode\)\{syncFlowUi\(\);return\}/);
  // Die drei Abläufe werden ins Blatt gebaut - eine Liste, kein zweiter Satz Knöpfe.
  assert.match(home,/const menu=\$\('#promptFlowMenu'\);if\(!menu\)return;/);
  assert.match(home,/for\(const key of \['guided','auto','expert'\]\)\{/);
  // Ein gemerkter, aber gesperrter Ablauf fällt auf "Mit Rückfragen" zurück, statt zu lügen.
  assert.match(home,/if\(flowLocked\(mode\)\)\{mode='guided';/);
  // Gesperrte Einträge sind im Menü als solche zu sehen, nicht erst nach dem Klick.
  assert.match(home,/button\.dataset\.locked=flowLocked\(key\)\?'1':'0'/);
  // Und sie nennen den Tarif, der sie wirklich freischaltet: "Selbst einstellen" gibt es laut
  // PLAN_RULES erst ab Ultimate, stand aber pauschal mit "ab Pro" im Menü.
  assert.match(home,/\[data-locked="1"\]:after\{content:attr\(data-tier\)/);
  // "Mit Rueckfragen" ist in Free enthalten und traegt deshalb gar kein Schild.
  assert.match(home,/const FLOW_TIER=\{guided:'',auto:'ab Pro',expert:'ab Ultimate'\}/);
  assert.match(home,/button\.dataset\.tier=FLOW_TIER\[key\]/);
  assert.match(app,/ultimate:\{label:"Ultimate",modes:\["guided","auto","expert"\]/,'expert gehört zu Ultimate');
  assert.match(app,/pro:\{label:"Pro",modes:\["guided","auto"\]/,'…und eben nicht zu Pro');
});

test('the plus in the console feeds the real reference inputs instead of a second store',async()=>{
  const home=await read('promptai-home-final.js');
  // Datei: eigener Dialog, aber mit den Formaten des echten Feldes - und was durchkommt, geht
  // durch genau dieses Feld weiter. Geprüft wird vorher: Endung, Größe und ob der Inhalt zur
  // Endung passt, damit eine umbenannte Datei nicht als Text im Prompt landet.
  assert.match(home,/input\.accept=nurBilder\?'image\/\*':\(target\.getAttribute\('accept'\)\|\|''\)/,'Galerie und Dateiwahl teilen sich ein Feld');
  assert.match(home,/target\.files=box\.files;target\.dispatchEvent\(new Event\('change',\{bubbles:true\}\)\)/);
  assert.match(home,/attachNote\(files\.length===1\?'Datei wird geprüft …'/);
  assert.match(home,/const FILE_NAME=\/\\\.\(png\|jpe\?g\|webp\|pdf\|txt\|md\|csv\|json\)\$\/i/);
  assert.match(home,/größer als 12 MB/);
  assert.match(home,/Inhalt passt nicht zur Endung/);
  assert.match(home,/hex\.startsWith\('89504e470d0a1a0a'\)/,'PNG-Signatur');
  assert.match(home,/hex\.startsWith\('255044462d'\)/,'PDF-Signatur');
  assert.match(home,/sample\.some\(byte=>byte===0\|\|byte<9\|\|\(byte>13&&byte<32\)\)/,'Textdateien ohne Steuerzeichen');
  // Link: durch das echte Feld und den echten Knopf - kein zweiter Zähler, kein zweiter Speicher.
  // Geprüft wird die Eingabe aber hier, denn die Prüfung in app.js meldet sich an einem Feld,
  // das auf der Startseite gar nicht sichtbar ist.
  assert.match(home,/const field=\$\('#referenceUrl'\);if\(field\)\{field\.value=url\.href;\$\('#addUrlBtn'\)\?\.click\(\)\}/);
  assert.match(home,/Das ist keine Adresse\. Beispiel: https:\/\/beispiel\.de/);
  assert.match(home,/Nur Adressen mit http oder https sind moeglich\./);
  assert.match(home,/note\.textContent='Link wird geprueft/);
  // Die Kacheln spiegeln die echte Liste; ihr × drückt den echten Entfernen-Knopf.
  assert.match(home,/\['#urlReferences','link'\],\['#imageReferences','bild'\],\['#documentReferences','datei'\]/);
  assert.match(home,/item\.node\.querySelector\('\.remove-btn/);
  assert.match(home,/new MutationObserver\(\(\)=>setTimeout\(syncAttachments,60\)\)/,'was dort passiert, muss hier ankommen');
});

test('templates and skills are pickable in the console, mirrored from the real controls',async()=>{
  const home=await read('promptai-home-final.js'),app=await read('app.js');
  // Die Vorlage ist ein <select>, das app.js aus state.templates füllt - das Menü liest
  // genau dessen Optionen und setzt seinen Wert, statt eine zweite Liste zu führen.
  assert.match(app,/el\.templateSelect\.innerHTML='<option value="">Ohne Vorlage<\/option>'/);
  assert.match(home,/const select=document\.querySelector\('#templateSelect'\)/);
  assert.match(home,/select\.value=option\.value;select\.dispatchEvent\(new Event\('change',\{bubbles:true\}\)\)/);
  // Skills sind Reihen mit Kontrollkästchen; das Menü drückt genau diese Kästchen.
  assert.match(home,/host\?\.querySelectorAll\('\.selection-row'\)\|\|\[\]/);
  assert.match(home,/if\(box&&!box\.disabled\)\{box\.click\(\)/);
  // Sperrt der Tarif die Skills, zeigt das Menü den Grund statt einer leeren Liste.
  assert.match(home,/const locked=host\?\.querySelector\('\.feature-lock-note'\)/);
  // Zu welchem Agent ein Skill gehört, steht im <code> der Reihe - das steht als Hinweis am
  // Eintrag, denn welche Skills überhaupt zur Wahl stehen, entscheidet jetzt die Ziel-KI.
  assert.match(home,/const scope=\(row\.querySelector\('code'\)\?\.textContent\|\|''\)\.trim\(\)/);
  // Drei Knöpfe nebeneinander sahen voll und verrutscht aus. Es gibt jetzt eine Zeile mit
  // dem Stand und dahinter ein Blatt mit allen Einstellungen - links tun, rechts einstellen.
  assert.match(home,/id="promptSetupButton"/);
  assert.match(home,/<dialog class="prompt-setup-sheet prompt-picker-dialog prompt-own-style" id="promptSetupSheet"/);
  assert.doesNotMatch(home,/id="promptSkillsButton"/,'kein eigener Knopf mehr je Einstellung');
  assert.doesNotMatch(home,/id="promptTemplateButton"/);
  // Der Stand steht als Satz in der Zeile: Ablauf, Vorlage, Anzahl der Skills.
  assert.match(home,/function syncSetupSummary\(\)\{/);
  assert.match(home,/parts\.push\(skills===1\?'1 Skill':skills\+' Skills'\)/);
});

test('the console settings pick exactly one target AI and the skills follow it',async()=>{
  const home=await read('promptai-home-final.js'),app=await read('app.js');
  // Die Zeile unter dem Textfeld ist jetzt die Settings des Laufs - Ziel-KI zuerst. Das Wort
  // "Settings" ist raus, das Zahnrad traegt die Zeile; der Knopf behaelt seinen Namen fuer
  // Sprachausgaben ueber aria-label.
  assert.doesNotMatch(home,/class="prompt-setup-tag"/);
  assert.match(home,/id="promptSetupButton"[^>]*aria-label="Settings für diesen Auftrag"/);
  assert.match(home,/<svg class="prompt-setup-icon"/);
  assert.match(home,/data-setup-pane="agent"><b>Ziel-KI<\/b><div id="promptAgentMenu">/);
  assert.match(home,/const parts=\[agentLabel\(activeAgent\(\)\),FLOW_LABEL\[flowMode\(\)\]\]/);
  // Genau eine KI: gewählt wird über den echten Schalter, der state.targetAgent setzt - und der
  // schreibt im selben Zug die Skill-Liste auf diese KI plus die globalen um.
  assert.match(home,/if\(!button\.classList\.contains\('active'\)\)button\.click\(\)/);
  assert.match(app,/state\.selectedSkillIds=state\.selectedSkillIds\.filter\(id=>visibleSkills\(\)\.some\(s=>s\.id===id\)\);applyAlwaysActiveItems\(false\);renderSkillSelection\(\)/);
  assert.match(home,/setTimeout\(\(\)=>\{syncAgentMenu\(\);syncSkillsMenu\(\);syncSetupSummary\(\)\},90\)/);
  // Was der Tarif nicht hergibt, führt zur Tarifseite statt zu einer stillen Auswahl.
  assert.match(home,/if\(!button\|\|button\.hidden\)\{document\.querySelector\('#plansDialog'\)\?\.showModal\(\);return\}/);
  // Jede Ziel-KI ist in jedem Tarif waehlbar - der Prompt entsteht hier, gebaut wird beim Nutzer.
  assert.match(home,/const AGENT_TIER=\{\}/);
  assert.match(app,/free:\{label:"Free"[^}]*agents:Object\.keys\(AGENT_NAMES\)/);
  assert.match(app,/pro:\{label:"Pro"[^}]*agents:Object\.keys\(AGENT_NAMES\)/);
});

test('long setting lists stay short: ten entries plus a window with all of them',async()=>{
  const home=await read('promptai-home-final.js');
  assert.match(home,/const USE_KEY='prompt-ai-picker-use-v1',PICKER_LIMIT=10/);
  assert.match(home,/`Mehr … \(\$\{rest\} weitere\)`/);
  // Was aktiv ist, bleibt sichtbar - auch wenn es selten benutzt wird.
  assert.match(home,/const head=ranked\.slice\(0,PICKER_LIMIT\),missing=ranked\.slice\(PICKER_LIMIT\)\.filter\(entry=>entry\.checked\)/);
  // Das Fenster nimmt die ganze Seite ein, wie jeder andere Dialog.
  assert.match(home,/\n      \.prompt-picker-dialog\{width:100vw!important/);
  assert.match(home,/if\(!dialog\.open\)dialog\.showModal\(\)/);
});

test('the master prompt is written in the format the target AI reads best',async()=>{
  const app=await read('app.js');
  assert.match(app,/return agentDocument\(`# PROMPT\.AI MASTER-PROMPT/);
  assert.match(app,/Beginne jetzt mit der Umsetzung auf Basis dieses Briefings\.\\n`,state\.targetAgent\)/);
  // Verhalten statt Wortlaut: derselbe Text, für Claude in Abschnitts-Tags, sonst unverändert.
  const start=app.indexOf('const XML_SECTION='),end=app.indexOf('function buildMasterPrompt()');
  assert.ok(start>0&&end>start);
  const agentDocument=new Function(`${app.slice(start,end)}\nreturn agentDocument;`)();
  const text='# KOPF\n\nEinleitung.\n\n## ROLLE, AUFTRAG & SPIELRAUM\nA\n\n## 1. PROJEKT\nB\n\n## AKTIVE AGENT-SKILLS\nS\n\n## 9. VERBINDLICHE ANTI-SLOP-REGELN\nC\n\n## 12. DEFINITION OF DONE\nD\n\nBeginne jetzt mit der Umsetzung auf Basis dieses Briefings.\n';
  assert.equal(agentDocument(text,'codex'),text,'Markdown bleibt Markdown');
  const claude=agentDocument(text,'claude');
  assert.match(claude,/<role>\n## ROLLE, AUFTRAG & SPIELRAUM\nA\n<\/role>/);
  assert.match(claude,/<context>\n## 1\. PROJEKT\nB\n<\/context>/);
  assert.match(claude,/<rules>\n## AKTIVE AGENT-SKILLS\nS\n\n## 9\. VERBINDLICHE ANTI-SLOP-REGELN\nC\n<\/rules>/);
  assert.match(claude,/<definition_of_done>\n## 12\. DEFINITION OF DONE\nD\n<\/definition_of_done>/);
  assert.ok(claude.trim().endsWith('Beginne jetzt mit der Umsetzung auf Basis dieses Briefings.'));
  for(const part of ['## ROLLE','## 1. PROJEKT','## 9.','## 12.'])assert.ok(claude.includes(part),part);
});

test('the handoff carries the instruction file the chosen tool actually reads',async()=>{
  const app=await read('app.js');
  // Codex und die AGENTS.md-nativen Werkzeuge lesen AGENTS.md, Claude Code CLAUDE.md, Gemini
  // GEMINI.md, Cursor zusätzlich eine Regel-Datei mit Frontmatter.
  assert.match(app,/const AGENT_MEMORY_FILE=\{claude:"CLAUDE\.md",codex:"AGENTS\.md",gemini:"GEMINI\.md"/);
  assert.match(app,/files\[AGENT_MEMORY_FILE\[state\.targetAgent\]\|\|'AGENTS\.md'\]=agentMemoryDocument\(\)/);
  assert.match(app,/if\(state\.targetAgent==='cursor'\)files\['\.cursor\/rules\/prompt-ai\.mdc'\]=cursorRuleDocument\(\)/);
  assert.match(app,/alwaysApply: true/,'Cursor liest die Regel nur mit Frontmatter');
  // Die Datei verweist auf den Auftrag, sie wiederholt ihn nicht.
  assert.match(app,/MASTER-PROMPT\.md\\` vollständig lesen/);
});

test('the clarification round may ask about colour and structure, with usable proposals',async()=>{
  const templates=await read('server/prompt-templates.js'),app=await read('app.js'),css=await read('promptai-full-app-design.css');
  // Geschmack war vorher pauschal verboten - jetzt erlaubt, aber gedeckelt und nur dort, wo der
  // Auftrag eine Richtung andeutet und offen lässt.
  assert.match(templates,/Gestaltung und persönlicher Geschmack gehören ausdrücklich dazu/);
  assert.match(templates,/Höchstens zwei deiner Fragen betreffen Gestaltung/);
  assert.doesNotMatch(templates,/Stelle keine Geschmacksfragen, deren Antwort/,'die alte Pauschalsperre muss weg sein');
  // Farbe: keine Rückfrage ins Leere, sondern fertige Paletten mit Hex-Werten.
  assert.match(templates,/biete 2-4 fertige Paletten an/);
  assert.match(templates,/drei bis vier Hex-Werte in der Reihenfolge Grundton, Fläche, Akzent, Text/);
  assert.match(templates,/Aufbau und Navigation/);
  assert.match(templates,/Bring eigene Vorschläge ein, wo der Auftrag schweigt/);
  // Fällt die KI-Prüfung aus, stehen trotzdem Vorschläge da - abgeleitet aus der genannten Farbe.
  assert.match(app,/const PALETTE_BASES=\{rot:\["#7B2233"/);
  assert.match(app,/for\(const value of palettesFor\(project\(\)\)\)suggestions\.push\(value\)/);
  // Und man sieht die Farbe, statt den Hex-Wert zu lesen.
  assert.match(app,/function swatchMarkup\(text\)\{/);
  assert.match(app,/\$\{swatchMarkup\(s\)\}\$\{escapeHtml\(s\)\}/);
  assert.match(css,/\.suggestion-swatch b\{/);
});

test('what costs us money is either gated or counted',async()=>{
  const core=await read('server/generate-core.js'),models=await read('api/models.js'),site=await read('api/site-context.js');
  // "Website überarbeiten" führt die Oberfläche ab Pro - die Schnittstelle ließ den Modus für
  // jeden durch, auf unsere Kosten und in keinem Kontingent.
  assert.match(core,/if\(action==="website"\|\|action==="revision-brief"\)return res\.status\(403\)/);
  assert.doesNotMatch(core,/action!=="revision-brief"\) return res\.status\(403\)/);
  // Free darf die KI benutzen, solange das Guthaben reicht - aber nur angemeldet.
  assert.match(core,/if\(!freeUser\?\.id\)return res\.status\(403\)/);
  assert.match(core,/if\(!freeBudget\.limit\|\|freeBudget\.exhausted\)return res\.status\(403\)/,'ohne eingestelltes Guthaben kein freier Lauf - sonst hiesse 0 unbegrenzt');
  // Die Lern-Auswertung ist der längste Aufruf im Produkt: kürzerer Ausschnitt, Sperre pro Stunde.
  assert.match(models,/key:'learning-feedback',limit:4,windowMs:60\*60\*1000/);
  assert.match(models,/html:String\(out\.html\|\|''\)\.slice\(0,12000\)/);
  assert.match(models,/finalPrompt=String\(body\.finalPrompt\|\|''\)\.slice\(0,20000\)/);
  // Fremde Seiten über unseren Server abzurufen ist Rechenzeit und Datenverkehr auf unsere Rechnung.
  assert.match(site,/try\{await authenticatedUser\(req\)\}catch\{return res\.status\(401\)/);
});

test('a stored prompt text wins, but the console says when the built-in one moved on',async()=>{
  const ui=await read('admin-prompts-ui.js');
  assert.match(ui,/function markOutdated\(\)\{/);
  assert.match(ui,/const differs=Boolean\(active\)&&stored!==undefined&&String\(stored\)\.trim\(\)!==String\(item\.body\)\.trim\(\)/);
  assert.match(ui,/Der eingebaute Standardtext wurde inzwischen geändert/);
  // Der Weg zurück existiert bereits - der Hinweis verweist genau darauf.
  assert.match(ui,/data-prompt-action="load-default">Standardtext einsetzen/);
});

test('the two runs that start real machines are capped per account and month',async()=>{
  const quota=await read('server/quota.js'),core=await read('server/generate-core.js'),sandbox=await read('server/sandbox-build.js');
  // Probelauf: teuerster Aufruf im Produkt, vorher unbegrenzt.
  assert.match(quota,/const BUILD_LIMIT=Object\.freeze\(\{free:0,pro:0,ultimate:15\}\)/);
  assert.match(core,/await assertBuildBudget\(req\);/);
  assert.match(core,/usageEvent=\{\.\.\.usageEvent,action:'website-build',project\}/,'ohne eigenes Ereignis zählt nichts mit');
  // Sandbox: echte Maschine, vorher nur pro Adresse und Zehnminutenfenster gedeckelt.
  assert.match(quota,/const SANDBOX_LIMIT=Object\.freeze\(\{free:0,pro:20,ultimate:60\}\)/);
  assert.match(sandbox,/await assertSandboxBudget\(req\)/);
  assert.match(sandbox,/logUsage\(req,\{action:'sandbox-build'/);
});

test('messages appear briefly at the top edge instead of standing in the page',async()=>{
  const toast=await read('save-toast-ui.js'),css=await read('promptai-full-app-design.css'),core=await read('admin-console-core.js');
  assert.match(toast,/\.save-toast\{position:fixed;left:50%;top:max\(14px,env\(safe-area-inset-top\)\)/);
  assert.doesNotMatch(toast,/bottom:max\(22px/,'die Rückmeldung darf nicht an zwei Rändern erscheinen');
  // Die Aktion war ein Balken über der Seite, der alles nach unten schob.
  assert.match(css,/\.offer-banner\{\s*position:fixed!important/);
  assert.match(core,/function fadeOffer\(remember\)\{/);
  assert.match(core,/setTimeout\(\(\)=>window\.PromptAiOfferAutoHide\?\.\(false\),9000\)/);
});

test('picking a flow in the settings never opens the workflow behind the start page',async()=>{
  const home=await read('promptai-home-final.js');
  assert.match(home,/const wasHome=homeVisible\(\);\s*\n\s*applyFlow\(mode\);/);
  assert.match(home,/if\(flow&&!flow\.hidden\)\{flow\.hidden=true;if\(page\)page\.hidden=false\}/);
  // Und falls doch je beides sichtbar wird, stellt der Zustand sich selbst richtig.
  assert.match(home,/function enforceSurface\(\)\{/);
  assert.match(home,/function syncHome\(\)\{enforceSurface\(\);/);
});

test('the monthly budget is a cost brake with a visible share, not a wall',async()=>{
  const quota=await read('server/quota.js'),home=await read('promptai-home-final.js'),app=await read('app.js'),html=await read('index.html');
  // Innen Tokens, außen Prozent - Rohverbrauch sagt niemandem etwas.
  assert.match(quota,/free:\{free_prompts:10,website_generations:3,ai_previews:0,monthly_tokens:150000\}/);
  assert.match(home,/const RUN_COST=\{website:45000,revision:45000,check:20000,free:4000\}/);
  assert.match(home,/return withCredit\(`Noch \$\{info\.percent\} % · \$\{rest\}`\)/);
  assert.match(home,/Dieser Auftrag verbraucht etwa \$\{share\} % deines Monats/);
  assert.match(home,/if\(!info\|\|info\.percent>15\)return;/,'die Warnung kommt einmal, nicht dauernd');
  assert.match(home,/\.prompt-budget-bar\{/);
  // Free bekommt einen echten Durchlauf, aber nur angemeldet und nur mit Guthaben.
  assert.match(app,/const freeAiRun=state\.plan==="free" && !state\.isAdmin && cloudReady\(\) && budgetLeft\(\)/);
  // Und die Karten sagen vorher, was nach dem Vorrat passiert.
  assert.match(html,/plan-card-fairuse/);
  assert.match(html,/Ein echter KI-Durchlauf im Monat/);
  assert.match(html,/Mehrere Marken- und Projektprofile/);
  assert.match(html,/Projektstände ohne Grenze/);
  assert.match(html,/Vorrang bei der Verarbeitung/);
  assert.doesNotMatch(html,/Alle Ziel-Agenten und der Modus/,'die Zeile ist wertlos, seit jede Ziel-KI frei ist');
});

test('a paid plan cannot be bought without the consumer withdrawal step',async()=>{
  const legal=await read('legal-pages.js'),app=await read('app.js'),html=await read('index.html'),checkout=await read('api/checkout.js');
  // Ohne Belehrung laeuft keine 14-Tage-Frist, sondern eine von einem Jahr.
  assert.match(legal,/const WITHDRAWAL_HTML=`/);
  assert.match(legal,/Widerrufsrecht für Verbraucher/);
  assert.match(legal,/Muster-Widerrufsformular/);
  assert.match(legal,/kind==='withdrawal'/);
  assert.match(html,/id="footerWithdrawalLink"/);
  assert.match(html,/id="footerTermsLink"/);
  // Und die Zustimmung zum sofortigen Beginn wird vor dem Kauf eingeholt und mitgeschrieben.
  assert.match(app,/if\(!await confirmImmediateStart\(\)\)return;/);
  assert.match(app,/extra=\{\.\.\.extra,consentAt:new Date\(\)\.toISOString\(\)\}/);
  assert.match(checkout,/'metadata\[consent_immediate_start\]':consentStamp\(req\)/);
});

test('runtime errors and the moments that matter finally arrive somewhere',async()=>{
  const beacon=await read('error-beacon.js'),models=await read('api/models.js'),app=await read('app.js'),boot=await read('admin-console.js');
  // Fehler: nur Meldung, Datei und Zeile - keine Eingaben, keine Projektinhalte.
  assert.match(beacon,/const MAX_PER_SESSION=5/);
  assert.match(beacon,/if\(!event\?\.message\)return;/,'fehlende Bilder sind keine Fehlermeldung');
  assert.match(beacon,/navigator\.sendBeacon\('\/api\/models',blob\)/);
  assert.ok(boot.includes('./error-beacon.js'),'der Melder muss auch geladen werden');
  assert.match(models,/action==='client-error'\)return clientError\(req,res\)/);
  assert.match(models,/action==='signal'\)return signal\(req,res\)/);
  // Keine eigene Tabelle: dieselben Nutzungsereignisse wie alles andere.
  assert.match(models,/serviceFetch\('\/rest\/v1\/sitebrief_usage_events'/);
  assert.match(models,/const SIGNALS=new Set\(\['copy-master-prompt','download-zip','open-agent'/);
  // Und die drei Momente, an denen das Produkt seinen Zweck erfüllt.
  assert.match(app,/productSignal\("copy-master-prompt",state\.targetAgent\)/);
  assert.match(app,/productSignal\("download-zip",state\.targetAgent\)/);
  assert.match(app,/productSignal\('open-agent',state\.targetAgent\)/);
});

test('one place owns the saved project state, and the free run has its moment',async()=>{
  const state=await read('project-state.js'),home=await read('promptai-home-final.js'),history=await read('project-history.js'),entry=await read('home-entry-ui.js'),app=await read('app.js'),boot=await read('admin-console.js');
  // Acht Dateien lasen denselben Speicher mit je eigener Vorstellung - daher die Fehler, bei
  // denen ein Projekt namenlos blieb oder auf der falschen Seite landete.
  assert.match(state,/window\.PromptAiProjectState=\{key:KEY,read:raw,title,step,described,exists,masterPrompt\}/);
  assert.ok(boot.includes('./project-state.js'));
  assert.match(home,/function projectTitle\(\)\{return window\.PromptAiProjectState\?\.title\?\.\(\)\|\|''\}/);
  assert.match(history,/window\.PromptAiProjectState\?\.title\?\.\(s\)/);
  assert.match(entry,/const label=\(window\.PromptAiProjectState\?\.title\?\.\(\)\|\|''\)\.trim\(\)/);
  // Und der eine echte Durchlauf im kostenlosen Tarif endet nicht im Nichts.
  assert.match(app,/async function offerAfterFreeRun\(\)\{/);
  assert.match(app,/Dein Monatslauf ist verbraucht/);
  assert.match(app,/localStorage\.setItem\(key,month\)/,'einmal im Monat, kein Dauerbanner');
});

test('a new dialog can style itself without a chain of four IDs',async()=>{
  const unified=await read('unified-ui-v1.js'),home=await read('promptai-home-final.js');
  // Die Pauschale nahm jedem Dialog Rand, Grund und Innenabstand - gedacht war sie für die
  // Fenster mit .dialog-frame. Wer sein Aussehen mitbringt, bleibt jetzt aussen vor.
  assert.match(unified,/dialog:not\(\.prompt-own-style\):not\(#previewLightbox\)/);
  assert.match(home,/class="prompt-setup-sheet prompt-picker-dialog prompt-own-style"/);
  assert.match(home,/dialog\.className='prompt-picker-dialog prompt-own-style'/);
  // Und der Sonderfall ist wieder eine gewoehnliche Klasse.
  assert.match(home,/\n      \.prompt-picker-dialog\{width:100vw!important/);
  assert.doesNotMatch(home,/:not\(#welcomePage\):not\(#workflowApp\):not\(#promptFooter\)/,'die Gewichts-Kette darf weg sein');
});

test('every footer link actually opens something',async()=>{
  const app=await read('app.js'),css=await read('promptai-full-app-design.css');
  // Die drei alten Links hingen an el.* - dort waren sie nie eingetragen, also war jeder Klick
  // ein stiller Fehlschlag. Genau die Sorte Fehler, die ein Quelltext-Test nicht sieht.
  for(const id of ['footerImpressumLink','footerPrivacyLink','footerCookieLink','footerTermsLink','footerWithdrawalLink']){
    assert.ok(app.includes(`document.getElementById('${id}')`),id);
  }
  assert.doesNotMatch(app,/el\.footerImpressumLink/,'der Umweg ueber den Elementspeicher muss weg sein');
  // Und auf dem Telefon passen fünf Links nicht in eine Zeile.
  assert.match(css,/\.prompt-footer-links\{[\s\S]{0,120}flex-wrap:wrap!important/);
});

test('the drawer can be closed again, on every device',async()=>{
  const drawer=await read('promptai-nav-drawer.js');
  // Das eigene Kreuz ist wieder weg: der Knopf oben rechts schliesst (der Handler dafuer sitzt
  // in bind(), obwohl die Schublade ueber ihm liegt), und jeder Klick daneben ebenfalls. Ein
  // drittes Kreuz war ein dritter Weg fuer dieselbe Sache und brauchte Platz in der Liste.
  assert.match(drawer,/function removeCloseButton\(menu\)\{/);
  assert.doesNotMatch(drawer,/function ensureCloseButton\(/);
  assert.match(drawer,/if\(e\.target\.closest\?\.\('#topbarMenuToggle'\)\)\{e\.preventDefault\(\)/,'der eigene Knopf schliesst wieder');
  // Und jeder Klick daneben schließt - egal wie der Vorhang gerade heißt.
  assert.match(drawer,/if\(e\.target\.closest\?\.\('#topbarMenu'\)\)return;/);
  assert.doesNotMatch(drawer,/if\(e\.target\.closest\?\.\('\.topbar-menu-backdrop'\)\)close\(\)/,'der Vorhang heißt nicht überall gleich');
});

test('a support request gets an answer, and the sender sees it',async()=>{
  const admin=await read('api/admin-action.js'),core=await read('admin-console-core.js'),cloud=await read('cloud.js'),app=await read('app.js'),html=await read('index.html'),sql=await read('supabase/migrations/20260816_add_support_reply.sql');
  // Antworten gehört zur Anfrage, nicht ins private Mailprogramm.
  assert.match(sql,/add column if not exists reply text not null default ''/);
  assert.match(sql,/auth\.uid\(\) = user_id/,'lesen darf nur, wer die Anfrage gestellt hat');
  assert.match(admin,/action==='support-reply'/);
  assert.match(admin,/status:'answered'/,'die Antwort setzt den Stand mit');
  assert.match(core,/data-support-send/);
  assert.match(core,/action:'support-reply',id:card\.dataset\.supportId,reply/);
  // Und der Absender sieht Stand und Antwort unter dem Formular.
  assert.match(cloud,/async ownSupportRequests\(\)\{/);
  assert.match(app,/async function renderOwnSupport\(\)\{/);
  assert.match(app,/Angekommen ✓ Wir melden uns per E-Mail und hier in der App/);
  assert.match(html,/id="supportHistory"/);
});

test('a new support request reaches the operator by mail, and never blocks on it',async()=>{
  const mail=await read('server/notify-mail.js'),models=await read('api/models.js'),app=await read('app.js');
  // Ohne eingerichteten Versand passiert nichts - eine Anfrage darf nie daran scheitern.
  assert.match(mail,/if\(!to\|\|\(!resend&&!webhook\)\)return \{sent:false,reason:'nicht eingerichtet'\}/);
  assert.match(mail,/SUPPORT_NOTIFY_TO/);
  assert.match(mail,/api\.resend\.com\/emails/);
  assert.match(mail,/MAIL_WEBHOOK_URL/,'auch ohne Resend nutzbar');
  // Der Endpunkt verlangt eine Anmeldung und verschickt nur Betreff und Kategorie.
  assert.match(models,/action==='support-notify'\)return supportNotify\(req,res\)/);
  assert.match(models,/if\(!user\?\.id\)return res\.status\(401\)/);
  assert.match(models,/Der vollständige Text steht in der Verwaltung/);
  // Und der Absender merkt nichts davon, wenn der Versand klemmt.
  assert.match(app,/action:'support-notify',subject,category:el\.supportCategory\.value\}\)\}\)\.catch\(\(\)=>\{\}\)/);
});
