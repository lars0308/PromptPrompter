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
