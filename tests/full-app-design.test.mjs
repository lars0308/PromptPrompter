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
  assert.match(css,/caret-color:var\(--logo-blue\)!important/);
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
  assert.match(css,/@media\(max-width:820px\) and \(max-height:720px\)/,'flat devices get one more step');
  assert.match(css,/\.prompt-home-tools\{grid-template-columns:repeat\(4,1fr\)!important/,'four tools in one row, not two by two');
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
  assert.match(nav,/\['Bibliothek','workspaceLibraryBtn'/);
  assert.match(nav,/\['Verlauf','projectHistoryBtn'/);
  assert.match(nav,/setTimeout\(\(\)=>\$\('#'\+targetId\)\?\.click\(\),60\)/);
  assert.match(nav,/#accountBtn:not\(\[hidden\]\)\{[\s\S]{0,60}margin-top:auto/,'profile is the one entry pinned to the bottom');
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
  assert.match(css,/\.brand\{padding-left:56px!important\}/,'the wordmark has to clear the button');
});
test('light/dark lives in the drawer, not twice in the header',async()=>{
  const css=await read('promptai-full-app-design.css');
  assert.match(css,/\.topbar #homeThemeToggle,[\s\S]{0,80}display:none!important/);
  assert.match(css,/\.topbar-menu #themeToggleBtn\{[\s\S]{0,120}display:flex!important/,'it stays a full entry in the drawer');
});
