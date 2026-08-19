import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorkflowDom, loadScripts, setMode, setStep, wait} from './helpers/workflow-dom.mjs';

// These tests actually execute the shipped patch scripts against a live DOM (jsdom) and observe
// real click/timer behavior, instead of regex-matching source text. They exist because the old
// string-matching tests all stayed green while the step auto-advance, loader and clarification
// races described by the user kept happening in the real app.
// Every dom.window.close() call is required: jsdom keeps the patch scripts' setInterval/setTimeout
// chains alive otherwise, which hangs `node --test` after the assertions already passed.

test('streamlined-project-flow.js schedules the step-5 (Blueprint) skip click exactly once, even under repeated polling', async () => {
  const dom = await createWorkflowDom();
  try {
    const doc = dom.window.document;
    doc.getElementById('workflowApp').hidden = false;
    doc.getElementById('welcomePage').hidden = true;
    setMode(dom, 'auto');
    setStep(dom, 5);
    let clicks = 0;
    doc.querySelector('#stepBlueprint .next-btn').addEventListener('click', () => clicks++);
    await loadScripts(dom, ['tests/fixtures/mini-engine.js', 'streamlined-project-flow.js']);
    await wait(700);
    assert.equal(clicks, 1, 'step-5 next-btn should be auto-clicked exactly once, not double-scheduled by re-entrant polling');
    assert.equal(doc.querySelector('.step-panel.active').dataset.stepPanel, '6', 'workflow should have advanced past the hidden Blueprint step');
  } finally {
    dom.window.close();
  }
});

test('mode-flow-ui.js and streamlined-project-flow.js do not both auto-click the step-5 next button', async () => {
  const dom = await createWorkflowDom();
  try {
    const doc = dom.window.document;
    doc.getElementById('workflowApp').hidden = false;
    doc.getElementById('welcomePage').hidden = true;
    setMode(dom, 'auto');
    setStep(dom, 5);
    let clicks = 0;
    doc.querySelector('#stepBlueprint .next-btn').addEventListener('click', () => clicks++);
    await loadScripts(dom, ['tests/fixtures/mini-engine.js', 'mode-flow-ui.js', 'streamlined-project-flow.js']);
    await wait(700);
    assert.equal(clicks, 1, 'only one of the two flow controllers may own the step-5 skip; both firing means a double-advance race');
  } finally {
    dom.window.close();
  }
});

test('auto mode never receives a synthetic click on the preview next-button; a genuine user click is required', async () => {
  const dom = await createWorkflowDom();
  try {
    const doc = dom.window.document;
    doc.getElementById('workflowApp').hidden = false;
    doc.getElementById('welcomePage').hidden = true;
    setMode(dom, 'auto');
    setStep(dom, 6);
    doc.getElementById('conceptGallery').innerHTML = '<div class="concept-option"></div>';
    let clicks = 0;
    doc.querySelector('#stepPreviews .next-btn').addEventListener('click', () => clicks++);
    await loadScripts(dom, ['tests/fixtures/mini-engine.js', 'mode-flow-ui.js']);
    await wait(700);
    assert.equal(clicks, 0, 'mode-flow-ui.js must not script-click past the real preview step in auto mode (streamlined-project-flow.js blocks non-trusted clicks here by design)');
  } finally {
    dom.window.close();
  }
});

test('only one full-screen workflow loader can ever exist; the legacy #flowTransitionCompact overlay is retired', async () => {
  const dom = await createWorkflowDom();
  try {
    const doc = dom.window.document;
    doc.getElementById('workflowApp').hidden = false;
    doc.getElementById('welcomePage').hidden = true;
    setMode(dom, 'guided');
    setStep(dom, 3);
    doc.documentElement.dataset.promptMode = 'guided';
    await loadScripts(dom, ['transition-polish.js', 'ux-stability-fix.js']);
    await wait(150);
    doc.documentElement.classList.add('probe-mutation');
    await wait(150);
    assert.equal(doc.getElementById('flowTransitionCompact'), null, 'ux-stability-fix.js must not create its own competing loader overlay anymore');
    // Der Schirm haengt seit dem Zusammenlegen an der Anfrage, nicht am Schritt: ohne laufenden
    // Aufruf gibt es keinen - und transition-polish.js baut auch keinen eigenen mehr.
    assert.equal(doc.getElementById('promptWorkflowLoader'), null, 'transition-polish.js must not own a screen any more');
    assert.equal(doc.getElementById('promptAiTaskLoader'), null, 'and a step alone must not conjure one without a running request');
  } finally {
    dom.window.close();
  }
});

test('mode-handoff-fix.js advances step 1 to 2 even while the account/entitlement check is still pending', async () => {
  const dom = await createWorkflowDom();
  try {
    const doc = dom.window.document;
    doc.getElementById('workflowApp').hidden = false;
    doc.getElementById('welcomePage').hidden = true;
    // Simulate the realistic case: the backend access/plan check (Supabase) is still resolving,
    // which is common on a slow connection and can take several seconds.
    doc.documentElement.classList.add('prompt-access-pending');
    doc.documentElement.classList.add('prompt-home-ready');
    dom.window.sessionStorage.setItem('prompt-ai-mode-handoff-v1', JSON.stringify({
      mode: 'guided',
      brief: 'Moderne Internetseite fuer einen Handwerksbetrieb, Leistungen und Kontakt.',
      createdAt: Date.now(),
    }));
    await loadScripts(dom, ['tests/fixtures/mini-engine.js', 'mode-handoff-fix.js']);
    await wait(1500);
    assert.equal(doc.querySelector('.step-panel.active').dataset.stepPanel, '2', 'the description-to-references advance must not be gated on the account/entitlement check finishing; that check can legitimately take longer than this on a real connection');
  } finally {
    dom.window.close();
  }
});

test('mode-flow-ui.js route() never auto-clicks a step button while the user has already left the workflow', async () => {
  const dom = await createWorkflowDom();
  try {
    const doc = dom.window.document;
    doc.getElementById('workflowApp').hidden = true;
    doc.getElementById('welcomePage').hidden = false;
    setMode(dom, 'auto');
    setStep(dom, 3);
    let clicks = 0;
    doc.querySelector('#stepAgent .next-btn').addEventListener('click', () => clicks++);
    await loadScripts(dom, ['tests/fixtures/mini-engine.js', 'mode-flow-ui.js']);
    const dialog = doc.getElementById('clarificationDialog');
    dialog.setAttribute('open', '');
    await wait(50);
    dialog.removeAttribute('open');
    await wait(500);
    assert.equal(clicks, 0, 'closing the clarification dialog while #workflowApp is hidden must not resume the auto-advance route and silently push state forward');
  } finally {
    dom.window.close();
  }
});

test('stability-ui.js restore() defers to an in-flight new-project mode handoff instead of racing it', async () => {
  const control = await createWorkflowDom();
  const guarded = await createWorkflowDom();
  try {
    control.window.PromptAiAccess = {plan: 'ultimate', isAdmin: false};
    control.window.localStorage.setItem('sitebrief-v6-state', JSON.stringify({mode: 'auto'}));
    await loadScripts(control, ['tests/fixtures/mini-engine.js', 'stability-ui.js']);
    control.window.dispatchEvent(new control.window.Event('promptai:access'));
    await wait(150);
    assert.equal(control.window.document.querySelector('.mode-switch button.active').dataset.mode, 'auto', 'sanity check: restore() applies the saved mode on an ordinary reload');

    guarded.window.PromptAiAccess = {plan: 'ultimate', isAdmin: false};
    guarded.window.sessionStorage.setItem('prompt-ai-new-project-mode-v2', 'auto');
    guarded.window.localStorage.setItem('sitebrief-v6-state', JSON.stringify({mode: 'auto'}));
    await loadScripts(guarded, ['tests/fixtures/mini-engine.js', 'stability-ui.js']);
    guarded.window.dispatchEvent(new guarded.window.Event('promptai:access'));
    await wait(150);
    assert.equal(guarded.window.document.querySelector('.mode-switch button.active').dataset.mode, 'guided', 'while a fresh-project mode handoff is pending, stability-ui.js must not also click a mode button');
    assert.ok(!guarded.window.document.documentElement.classList.contains('prompt-access-pending'), 'the access-pending reveal must still resolve even when the restore step is skipped');
  } finally {
    control.window.close();
    guarded.window.close();
  }
});

test('reaching step 8 does not stack a second full-screen dialog on top of the workflow', async () => {
  const dom = await createWorkflowDom();
  try {
    const doc = dom.window.document;
    doc.getElementById('workflowApp').hidden = false;
    doc.getElementById('welcomePage').hidden = true;
    doc.getElementById('masterPrompt').value = 'Dies ist der fertige Master-Prompt.';
    await loadScripts(dom, ['tests/fixtures/mini-engine.js']);
    setStep(dom, 8);
    await wait(200);
    assert.equal(doc.getElementById('masterPromptResultDialog'), null, 'the master prompt is already shown inline on step 8 (#masterPrompt); a redundant stacked popup dialog was the likely cause of the workflow freezing when reaching this step, so it must not be recreated');
  } finally {
    dom.window.close();
  }
});
