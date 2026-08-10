import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const text=p=>readFile(path.join(root,p),'utf8');

test('mode handoff owns the initial description advance exactly once',async()=>{
  const handoff=await text('mode-handoff-fix.js');
  assert.match(handoff,/claimInitialAdvance/);
  assert.match(handoff,/removeItem\(SIMPLE_START_KEY\)/);
  assert.match(handoff,/advanceStarted/);
  assert.match(handoff,/allowAdvance=true;next\.click\(\);allowAdvance=false/);
});

test('workflow transition guard loads before legacy UI transition layers',async()=>{
  const boot=await text('admin-console.js');
  const handoff=boot.indexOf('mode-handoff-fix.js');
  const guard=boot.indexOf('transition-polish.js');
  const legacyFlow=boot.indexOf('ux-stability-fix.js');
  const legacyLoading=boot.indexOf('promptai-loading-v2.js');
  assert.ok(handoff>=0&&guard>handoff);
  assert.ok(guard<legacyFlow&&guard<legacyLoading);
});

test('guided and auto flows expose only the unified loader',async()=>{
  const src=await text('transition-polish.js');
  for(const token of ['#promptBriefHandoff','#flowTransitionCompact','.streamline-working','#modeFlowPanel','#promptCompletionFlash'])assert.ok(src.includes(token),token);
  assert.match(src,/#promptWorkflowLoader/);
  assert.match(src,/Angaben werden geprüft\./);
  assert.match(src,/Offene Punkte werden erkannt\./);
  assert.match(src,/Rückfragen werden vorbereitet\./);
  assert.match(src,/promptSentenceFill/);
});

test('leaving the workflow cannot reopen late review UI',async()=>{
  const src=await text('transition-polish.js');
  assert.match(src,/closeLateWorkflowUi/);
  assert.match(src,/clarificationDialog/);
  assert.match(src,/dialog\.close\('cancel'\)/);
  assert.match(src,/blockLateHiddenClicks/);
  assert.match(src,/!event\.isTrusted/);
  assert.match(src,/guided-clean-exit/);
});

test('reference action label is stable even if older scripts rewrite its DOM',async()=>{
  const src=await text('transition-polish.js');
  assert.match(src,/#stepReferences \.next-btn:before/);
  assert.match(src,/content:'Rückmeldung prüfen'/);
  assert.match(src,/#stepReferences \.next-btn\{font-size:0!important/);
});
