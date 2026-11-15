/* Unit 01 — weights runtime (design system rule 8).
 *
 * Every app declares how much each of its parts matters, in
 * window.UNIT01_WEIGHTS ({ selector: 'core' | 'supporting' | 'enhancement' }),
 * written into its <head> by scripts/unit01-apps.ts from
 * src/projects/unit-01/catalogue.ts.
 *
 * The app's own layout still decides what fits inline at each size. This
 * guarantees the rest: whenever a core or supporting part is hidden by the
 * layout, a More key appears, and it opens a sheet holding exactly those
 * parts — core first. The real elements move into the sheet and back again,
 * so their state and behaviour are the app's own; nothing is copied.
 * Enhancements are never offered: they are only there when there is room.
 *
 * Source: scripts/unit01-weights.js. Copied to
 * public/projects/unit-01/apps/unit01-weights.js by the generator.
 */
(function () {
  'use strict';
  var weights = window.UNIT01_WEIGHTS || {};
  var doc = document;
  var RANK = { core: 0, supporting: 1 };

  var CSS = [
    '.u01-more { flex: none; }',
    '.u01-more svg, .u01-sheet__close svg { width: 20px; height: 20px; fill: currentColor; }',
    '.u01-more[hidden] { display: none !important; }',
    /* No title bar at glance size: the key sits in the corner instead. */
    '.u01-more--float { position: fixed; z-index: 90; width: 32px; height: 32px;',
    '  top: calc(env(safe-area-inset-top) + 6px); right: calc(env(safe-area-inset-right) + 6px); }',
    '.u01-sheet { position: fixed; inset: 0; z-index: 100; overflow: auto; overscroll-behavior: contain;',
    '  background: var(--chassis); color: var(--ink); display: flex; flex-direction: column; gap: var(--space-6, 24px);',
    '  padding: calc(env(safe-area-inset-top) + 12px) calc(env(safe-area-inset-right) + 12px)',
    '           calc(env(safe-area-inset-bottom) + 24px) calc(env(safe-area-inset-left) + 12px); }',
    '.u01-sheet[hidden] { display: none; }',
    '.u01-sheet__head, .u01-sheet__body { width: 100%; max-width: 640px; margin: 0 auto; }',
    '.u01-sheet__head { display: flex; align-items: center; gap: var(--space-3, 12px); }',
    '.u01-sheet__title { font: 800 22px/1 var(--font-sans); letter-spacing: -.025em; }',
    '.u01-sheet__close { margin-left: auto; }',
    '.u01-sheet__body { display: flex; flex-direction: column; gap: var(--space-6, 24px); }',
    /* Whatever the layout did to hide a part, in the sheet it shows. */
    '.u01-sheet__body .u01-in-sheet { display: flex !important; flex-direction: column; grid-area: auto;',
    '  height: auto; min-height: 0; max-height: none; width: auto; }',
    '.u01-sheet__keys { display: flex; flex-wrap: wrap; gap: var(--space-2, 8px); }',
    '.u01-sheet__keys > .u01-in-sheet { display: inline-flex !important; flex-direction: column;',
    '  width: auto; min-width: 96px; height: 64px; }'
  ].join('\n');

  var MENU = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v2H4zM4 11h16v2H4zM4 16h10v2H4z"/></svg>';
  var CLOSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.4 5L12 10.6 17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19 5 17.6 10.6 12 5 6.4z"/></svg>';

  function shown(el) {
    if (el.checkVisibility) return el.checkVisibility({ checkVisibilityCSS: true });
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  }

  function init() {
    Object.keys(weights).forEach(function (sel) {
      doc.querySelectorAll(sel).forEach(function (el) {
        if (!el.hasAttribute('data-weight')) el.setAttribute('data-weight', weights[sel]);
      });
    });

    var style = doc.createElement('style');
    style.textContent = CSS;
    doc.head.appendChild(style);

    var shell = doc.querySelector('.shell') || doc.body;
    var theme = doc.getElementById('themeSw');

    var key = doc.createElement('button');
    key.type = 'button';
    key.className = 'u-key u-key--sm u01-more';
    key.setAttribute('aria-haspopup', 'dialog');
    key.setAttribute('aria-expanded', 'false');
    key.setAttribute('aria-label', 'More controls');
    key.innerHTML = MENU;
    key.hidden = true;

    var sheet = doc.createElement('div');
    sheet.className = 'u01-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-labelledby', 'u01-sheet-title');
    sheet.hidden = true;
    sheet.innerHTML =
      '<div class="u01-sheet__head"><h2 class="u01-sheet__title" id="u01-sheet-title">More</h2>' +
      '<span class="u-label u01-sheet__count"></span>' +
      '<button type="button" class="u-key u-key--sm u01-sheet__close" aria-label="Close">' + CLOSE + '</button></div>' +
      '<div class="u01-sheet__body"></div>';
    // Inside the shell, so the app's own container queries still see its size.
    shell.appendChild(sheet);
    var body = sheet.querySelector('.u01-sheet__body');
    var count = sheet.querySelector('.u01-sheet__count');
    var closeKey = sheet.querySelector('.u01-sheet__close');
    var moved = [];

    /* Core and supporting parts the layout is hiding right now, core first.
       A part hidden only because a weighted ancestor is hidden travels with
       that ancestor, unless the ancestor is an enhancement that will not. */
    function hiddenParts() {
      var all = [].slice.call(doc.querySelectorAll('[data-weight="core"], [data-weight="supporting"]'));
      return all.filter(function (el) {
        if (el.hidden || sheet.contains(el) || shown(el)) return false;
        var up = el.parentElement && el.parentElement.closest('[data-weight]');
        return !(up && up.getAttribute('data-weight') !== 'enhancement' && !shown(up));
      }).map(function (el, i) { return { el: el, i: i }; }).sort(function (a, b) {
        return (RANK[a.el.getAttribute('data-weight')] - RANK[b.el.getAttribute('data-weight')]) || a.i - b.i;
      }).map(function (x) { return x.el; });
    }

    /* In the title bar beside the Dark switch when there is one; in the
       corner when the layout has dropped the bar. */
    function place() {
      if (theme && theme.parentElement && shown(theme)) {
        if (key.nextSibling !== theme) theme.parentElement.insertBefore(key, theme);
        key.classList.remove('u01-more--float');
      } else {
        if (key.parentElement !== shell) shell.appendChild(key);
        key.classList.add('u01-more--float');
      }
    }

    function update() {
      if (!sheet.hidden) return;
      key.hidden = hiddenParts().length === 0;
      place();
    }

    function open() {
      var parts = hiddenParts();
      if (!parts.length) return;
      var keys = null;
      parts.forEach(function (el) {
        var mark = doc.createComment('u01-weight');
        el.parentNode.insertBefore(mark, el);
        moved.push([el, mark]);
        el.classList.add('u01-in-sheet');
        if (el.matches('button, .u-key')) {
          if (!keys) { keys = doc.createElement('div'); keys.className = 'u01-sheet__keys'; body.appendChild(keys); }
          keys.appendChild(el);
        } else {
          body.appendChild(el);
        }
      });
      count.textContent = parts.length + (parts.length === 1 ? ' part' : ' parts');
      sheet.hidden = false;
      key.setAttribute('aria-expanded', 'true');
      closeKey.focus();
    }

    function close() {
      moved.forEach(function (pair) {
        pair[1].parentNode.insertBefore(pair[0], pair[1]);
        pair[1].remove();
        pair[0].classList.remove('u01-in-sheet');
      });
      moved = [];
      body.textContent = '';
      sheet.hidden = true;
      key.setAttribute('aria-expanded', 'false');
      update();
      if (!key.hidden) key.focus();
    }

    key.addEventListener('click', open);
    closeKey.addEventListener('click', close);
    // Escape closes. Keys still reach the controls inside the sheet, but are
    // stopped as they bubble out of it, so nothing typed there triggers the
    // app's global shortcuts (Space to start, arrows for tempo...).
    sheet.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      e.stopPropagation();
    });

    var queued = false;
    function schedule() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; update(); });
    }
    if (window.ResizeObserver) new ResizeObserver(schedule).observe(doc.documentElement);
    window.addEventListener('resize', schedule);
    update();
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else init();
})();
