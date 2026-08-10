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
  assert.match(src,/START_KEY='prompt-ai-v1-simple-start'/);
  assert.match(src,/intended===\'expert\'/);
  assert.match(src,/sessionStorage\.removeItem\(START_KEY\)/);
  assert.match(src,/next\.click\(\)/);
});

test('new flow is cached and loaded after the home entry',async()=>{
  const loader=await text('admin-console.js'),sw=await text('sw.js');
  assert.ok(loader.indexOf('home-entry-ui.js')<loader.indexOf('streamlined-project-flow.js'));
  assert.match(sw,/prompt-ai-shell-v27/);
  assert.match(sw,/streamlined-project-flow\.js/);
});
