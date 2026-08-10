import {JSDOM} from 'jsdom';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const fixture = await readFile(path.join(root, 'tests/fixtures/workflow-shell.html'), 'utf8');
const sourceCache = new Map();

async function source(file) {
  if (!sourceCache.has(file)) sourceCache.set(file, await readFile(path.join(root, file), 'utf8'));
  return sourceCache.get(file);
}

export async function createWorkflowDom() {
  const dom = new JSDOM(fixture, {runScripts: 'dangerously', url: 'http://localhost/', pretendToBeVisual: true});
  await new Promise(resolve => {
    if (dom.window.document.readyState === 'complete') resolve();
    else dom.window.addEventListener('load', resolve, {once: true});
  });
  return dom;
}

export async function loadScripts(dom, files) {
  for (const file of files) {
    const code = await source(file);
    dom.window.eval(code);
  }
}

export function setMode(dom, mode) {
  const doc = dom.window.document;
  doc.querySelectorAll('.mode-switch button').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
}

export function setStep(dom, step) {
  const doc = dom.window.document;
  doc.querySelectorAll('.step-panel').forEach(p => p.classList.toggle('active', Number(p.dataset.stepPanel) === step));
}

export const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
