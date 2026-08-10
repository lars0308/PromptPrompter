(() => {
  'use strict';
  function goStep(step) {
    document.querySelectorAll('[data-step-panel]').forEach(p => p.classList.toggle('active', Number(p.dataset.stepPanel) === step));
    document.querySelectorAll('.step-nav').forEach(b => b.classList.toggle('active', Number(b.dataset.step) === step));
  }
  document.addEventListener('click', e => {
    const next = e.target.closest && e.target.closest('.next-btn');
    if (next) goStep(Number(next.dataset.next));
    const back = e.target.closest && e.target.closest('.back-btn');
    if (back) goStep(Number(back.dataset.back));
    const nav = e.target.closest && e.target.closest('.step-nav');
    if (nav) goStep(Number(nav.dataset.step));
  }, true);
  document.addEventListener('click', e => {
    const mode = e.target.closest && e.target.closest('.mode-switch button');
    if (mode) document.querySelectorAll('.mode-switch button').forEach(b => b.classList.toggle('active', b === mode));
  }, true);
})();
