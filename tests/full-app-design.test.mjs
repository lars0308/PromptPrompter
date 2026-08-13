import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=name=>readFile(new URL(`../${name}`,import.meta.url),'utf8');

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
  // The only append is the drawer's own new button; nothing that was already there is touched.
  assert.deepEqual([...nav.matchAll(/menu\.appendChild\((\w+)\)/g)].map(m=>m[1]),['button']);
  // Moving nodes threw: other layers insertBefore relative to them. Ordering is CSS now.
  assert.match(nav,/const rank=sortEntry\(node\);/);
  assert.match(nav,/node\.style\.order=String\(rank\);/);
  assert.match(nav,/\$\$\(':scope > \*',menu\)/,'containers other layers add must be ranked too');
  // Late arrivals default to order 0 and would jump to the top without a re-sort.
  assert.match(nav,/new MutationObserver\(\(\)=>\{clearTimeout\(pending\);pending=setTimeout\(shell,60\)\}\)\.observe\(menu,\{childList:true\}\)/);
  // The four work paths click the real home buttons, so the plan gate stays in one place.
  assert.match(nav,/\['Probelauf','workspaceBuildSiteBtn'/);
  assert.match(nav,/setTimeout\(\(\)=>\$\('#'\+targetId\)\?\.click\(\),60\)/);
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

test('the menu button moves left by position, not by re-parenting',async()=>{
  const css=await read('promptai-full-app-design.css'),home=await read('promptai-home-final.js');
  // promptai-home-final inserts its own toggle directly before #topbarMenuToggle, so lifting the
  // button out of .top-actions would leave that insertBefore without a reference node.
  assert.match(home,/actions\.insertBefore\(button,\$\('#topbarMenuToggle'\)\)/);
  assert.match(css,/#topbarMenuToggle\{[\s\S]{0,120}left:12px!important/);
  // .top-actions carries position:relative, so left was measured from the action group.
  assert.match(css,/\.topbar \.top-actions\{position:static!important\}/);
  // .brand.brand, because the start page layer sets ".topbar .brand{padding:0 4px}" and an
  // equally weighted rule left the logo lying underneath the button.
  assert.match(css,/\.topbar \.brand\.brand\{padding-left:60px!important\}/,'the wordmark has to clear the button');
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
  // The step advances after ~50ms, so the loader was gone before its first line had run.
  const loader=await read('promptai-loading-v2.js');
  assert.match(loader,/overlay\.dataset\.runFor=String\(runFor\)/);
  assert.match(loader,/overlay\.dataset\.closing!=='1'/,'and it must not schedule its exit twice');
  assert.match(loader,/const rest=Math\.max\(0,Number\(overlay\.dataset\.startedAt/);
  // Last project only appears once there is one; the meta line carries live numbers.
  assert.match(home,/if\(latest\)latest\.hidden=!title/);
  assert.match(home,/text\?`\$\{text\.length\} Zeichen · ≈\$\{tokenGuess\(text\)\} Token`:quotaLine/);
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
  assert.match(css,/\.prompt-completion-flash>div,\.master-generation-inner\)::before\{[\s\S]{0,200}sitebrief-logo-trace-light\.svg/);
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

test('one edge for the whole app: header, console, greeting and every card start at the same line',async()=>{
  const css=await read('promptai-full-app-design.css');
  // Measured on one phone screen before this: header 10px, console 14px, greeting 18px,
  // dialog cards 17px. Each looked right alone; together nothing lined up.
  assert.match(css,/\.welcome-page\{padding-left:var\(--dlg-x\)!important/);
  assert.match(css,/\.prompt-home-intro\{padding-left:0!important/,'its extra 4px was the third line');
  assert.match(css,/body>\.topbar,[\s\S]{0,120}width:calc\(100% - var\(--dlg-x\)\*2\)!important/);
  // On the desktop the header was 1180px wide over 1040px of content.
  assert.match(css,/width:min\(1040px,calc\(100% - var\(--dlg-x\)\*2\)\)!important/);
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
  assert.match(css,/::before\{[\s\S]{0,160}sitebrief-logo-trace-light\.svg/);
  assert.match(light,/fill="#eef5fb"/);
  for(const f of ['sitebrief-logo-trace.svg','sitebrief-logo-trace-light.svg'])assert.ok(sw.includes(f),f);
  // And the mark is back in the start page header, without a plate.
  assert.match(css,/\.prompt-home-surface \.topbar \.brand-mark\{[\s\S]{0,140}background:transparent!important/);
});

test('light mode is a calm grey, and the watermark stays off it',async()=>{
  const css=await read('promptai-full-app-design.css');
  assert.match(css,/--paper:#e7eaee;/,'the ground is grey, not near-white');
  assert.match(css,/--surface:#f5f7f9;/,'and the cards sit one step above it, still not white');
  assert.doesNotMatch(css,/--surface:#ffffff;/);
  // The start page carries its own colour names and sets them with !important.
  assert.match(css,/\.prompt-home-surface:not\(\[data-theme="dark"\]\)\{[\s\S]{0,200}--home-bg:var\(--paper\)/);
  // A large flat shape at 2% reads as a stain on grey; on near-white it did not.
  assert.match(css,/:not\(\[data-theme="dark"\]\) body::after,[\s\S]{0,400}display:none!important/);
});

test('the handoff screen is a transition, not a progress bar for the whole brief',async()=>{
  const loader=await read('promptai-loading-v2.js');
  // durationFor() scales with the text and goes up to 11 seconds - tying the screen's
  // lifetime to it turned a transition into a hang.
  assert.match(loader,/const runFor=2800;/);
  assert.match(loader,/durationFor\(length=0\)/,'the line timing itself stays as it was');
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
  assert.match(css,/:is\(#promptWorkflowLoader,\.prompt-handoff-loader,\.prompt-completion-flash,#promptAiThinkingStage\)\{\s*background:#0f151d!important/);
  assert.match(css,/\.master-generation-inner\)\{[\s\S]{0,200}border:0!important;\s*background:transparent!important/);
  // content:url() instead of a background image - a background graphic can be frozen,
  // a replaced image animates, so the blue bar moves here too.
  assert.match(css,/::before\{\s*content:url\("\.\/sitebrief-logo-trace-light\.svg/);
  // .workspace inset 20, the step card another 16 - content sat at 36 while the rest of
  // the app starts at 16, and the card floated with a visible edge.
  assert.match(css,/\.workspace\{padding-left:0!important;padding-right:0!important\}/);
  assert.match(css,/\.step-panel,[\s\S]{0,80}#guidedCleanHead\{[\s\S]{0,160}padding-left:var\(--dlg-x\)!important/);
});
