// AI Workshop · slide deck controller
// - keyboard nav (← → space)
// - auto-scale 1920×1080 to viewport
// - index overlay (press I)
// - prompt copy
// - print = each .slide is one page

(function () {
  'use strict';

  // ── Scale stage to viewport ─────────────────────────────
  const deck = document.querySelector('.deck');
  function fit() {
    if (!deck) return;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const s = Math.min(W / 1920, H / 1080);
    deck.style.transform = 'scale(' + s + ')';
  }
  window.addEventListener('resize', fit);
  fit();

  // ── Slide nav ───────────────────────────────────────────
  const slides = Array.from(document.querySelectorAll('.slide'));
  const counter = document.getElementById('counter');
  let idx = 0;

  // ── Auto-assign page numbers (HTML 숫자 무시하고 DOM 순서대로) ──
  slides.forEach((s, k) => {
    const pageNum = String(k + 1).padStart(2, '0');
    const bar = s.querySelector('.slide__bar__page');
    if (bar) bar.textContent = pageNum;
    const foot = s.querySelector('.slide__foot');
    if (foot) {
      const spans = foot.querySelectorAll('span');
      if (spans.length >= 2) spans[spans.length - 1].textContent = pageNum;
    }
  });

  function show(i) {
    idx = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach((s, k) => s.classList.toggle('slide--active', k === idx));
    if (counter) counter.textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
    if (history && history.replaceState) {
      try {
        history.replaceState(null, '', '#' + (idx + 1));
      } catch (e) {
        /* sandboxed iframe (e.g. about:srcdoc) blocks history API — silently ignore */
      }
    }
  }
  function next() { show(idx + 1); }
  function prev() { show(idx - 1); }

  document.addEventListener('keydown', (e) => {
    // ignore typing in inputs
    if (e.target && /(INPUT|TEXTAREA|SELECT)/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
    else if (e.key === 'Home') { e.preventDefault(); show(0); }
    else if (e.key === 'End') { e.preventDefault(); show(slides.length - 1); }
    else if (e.key === 'i' || e.key === 'I') { toggleIndex(); }
    else if (e.key === 'Escape') { closeIndex(); }
  });

  // initial slide from hash
  let fromHash = NaN;
  try { fromHash = parseInt((location.hash || '').replace('#', ''), 10); } catch (e) {}
  if (!isNaN(fromHash) && fromHash >= 1) show(fromHash - 1);
  else show(0);

  // bottom-right controls
  const prevBtn = document.getElementById('btn-prev');
  const nextBtn = document.getElementById('btn-next');
  const idxBtn  = document.getElementById('btn-index');
  if (prevBtn) prevBtn.addEventListener('click', prev);
  if (nextBtn) nextBtn.addEventListener('click', next);
  if (idxBtn)  idxBtn.addEventListener('click', toggleIndex);

  // ── Index overlay ───────────────────────────────────────
  const overlay = document.getElementById('index-overlay');
  const closeBtn = document.getElementById('index-close');

  function buildIndex() {
    const list = document.getElementById('index-list');
    if (!list) return;
    list.innerHTML = '';
    slides.forEach((s, k) => {
      const label = s.dataset.title || ('Slide ' + (k + 1));
      const item = document.createElement('button');
      item.className = 'index-overlay__item';
      item.innerHTML =
        '<span class="index-overlay__item__num">' + String(k + 1).padStart(2, '0') + '</span>' +
        '<span class="index-overlay__item__title">' + label + '</span>';
      item.addEventListener('click', () => { show(k); closeIndex(); });
      list.appendChild(item);
    });
  }
  function toggleIndex() {
    if (!overlay) return;
    overlay.classList.toggle('index-overlay--open');
    if (overlay.classList.contains('index-overlay--open')) buildIndex();
  }
  function closeIndex() {
    if (!overlay) return;
    overlay.classList.remove('index-overlay--open');
  }
  if (closeBtn) closeBtn.addEventListener('click', closeIndex);
  if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) closeIndex(); });

  // ── Prompt copy ────────────────────────────────────────
  document.querySelectorAll('.prompt__copy').forEach(btn => {
    btn.addEventListener('click', async () => {
      const targetId = btn.dataset.copyTarget;
      const target = document.getElementById(targetId);
      if (!target) return;
      const text = target.innerText;
      try {
        await navigator.clipboard.writeText(text);
      } catch (_) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta);
      }
      const orig = btn.textContent;
      btn.textContent = '복사됨';
      btn.dataset.copied = '1';
      setTimeout(() => { btn.textContent = orig; delete btn.dataset.copied; }, 1400);
    });
  });
})();

