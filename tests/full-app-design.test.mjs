import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=name=>readFile(new URL(`../${name}`,import.meta.url),'utf8');

test('the final design layer loads after the complete cc6c2b7 interface stack',async()=>{
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
