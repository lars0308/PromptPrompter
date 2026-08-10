import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const text=p=>readFile(path.join(root,p),'utf8');

test('guided website flow keeps preview and hides technical middle steps',async()=>{
  const src=await text('streamlined-project-flow.js');
  assert.ok(src.includes('data-prompt-mode="guided"'));
  assert.ok(src.includes('step-nav[data-step="5"]'));
  assert.match(src,/So könnte deine Internetseite aussehen/);
  assert.match(src,/Weiter zur Vorschau/);
  assert.match(src,/Vorschau erstellen/);
});

test('auto still stops on a real preview before the prompt',async()=>{
  const src=await text('streamlined-project-flow.js');
  assert.ok(src.includes('data-prompt-mode="auto"'));
  assert.ok(src.includes('step-nav[data-step="6"]'));
  assert.match(src,/mode\(\)===\'auto\'&&!e\.isTrusted/);
  assert.match(src,/ensureAutoPreview/);
  assert.match(src,/Diese Vorschau übernehmen/);
});

test('simple intake goes straight to references for guided and auto but not expert',async()=>{
  const src=await text('streamlined-project-flow.js');
  const start=await text('project-start-ui.js');
  assert.match(src,/START_KEY='prompt-ai-v1-simple-start'/);
  assert.match(src,/PROMPT_START_FLOW_V2/);
  assert.match(src,/intended===\'expert\'/);
  assert.match(src,/clearSimpleStart/);
  assert.match(src,/initialAdvanceInFlight/);
  assert.match(src,/currentNext\.click\(\)/);
  assert.match(start,/sessionStorage\.setItem\(SIMPLE_START_KEY,'1'\)/);
});

test('new flow is cached and final polish loads last',async()=>{
  const loader=await text('admin-console.js'),sw=await text('sw.js'),clean=await text('guided-clean-ui.js'),unified=await text('unified-ui-v1.js'),fix=await text('ux-stability-fix.js'),polish=await text('ui-polish-final.js'),touch=await text('ui-final-touch.js');
  const home=loader.indexOf('home-entry-ui.js'),stream=loader.indexOf('streamlined-project-flow.js'),guided=loader.indexOf('guided-clean-ui.js'),allUi=loader.indexOf('unified-ui-v1.js'),ux=loader.indexOf('ux-stability-fix.js'),final=loader.indexOf('ui-polish-final.js'),last=loader.indexOf('ui-final-touch.js');
  assert.ok(home>=0&&home<stream&&stream<guided&&guided<allUi&&allUi<ux&&ux<final&&final<last);
  assert.match(sw,/prompt-ai-shell-v34/);
  for(const file of ['streamlined-project-flow.js','guided-clean-ui.js','unified-ui-v1.js','subscription-ui.js','ux-stability-fix.js','ui-polish-final.js','ui-final-touch.js'])assert.ok(sw.includes(file));
  assert.match(clean,/data-clean-project-flow/);
  assert.match(clean,/Hast du Referenzen/);
  assert.match(clean,/Dein Master-Prompt ist fertig/);
  assert.match(unified,/prompt-unified-ui/);
  assert.match(fix,/FLOW_ORDER/);
  assert.match(fix,/prompt-review-transition/);
  assert.match(polish,/promptMenuIn/);
  assert.match(polish,/free-prompt-generation-stage/);
  assert.match(touch,/promptFinalMenuBackdrop/);
});
