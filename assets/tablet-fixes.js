// SPDX-License-Identifier: MIT OR Apache-2.0
// Rig Tablet: touch fixes for the Tree panel on iPad (Safari).
//  1. The Tree keeps its scroll position when you tap in it.
//  2. In the Tree, layers (Draw order) and bones are dragged only with the Apple Pencil;
//     fingers only scroll the list (a tap still selects).
(() => {
  const tablet = () => document.documentElement.classList.contains('tablet');

  // 1a. Focusing the Tree (done on every tap, for keyboard use) must not move its scroll.
  const focus = HTMLElement.prototype.focus;
  HTMLElement.prototype.focus = function (opts) {
    if (this.classList && this.classList.contains('tree-scroll')) {
      const y = this.scrollTop;
      focus.call(this, opts);
      if (this.scrollTop !== y) this.scrollTop = y;
      return;
    }
    return focus.call(this, opts);
  };

  // 1b. Remember where each Tree list was scrolled; when the panel is rebuilt and Safari drops the
  //     list back to the top, put it back.
  const last = new WeakMap(); // panel element -> scrollTop
  document.addEventListener(
    'scroll',
    (e) => {
      const el = e.target;
      if (el && el.classList && el.classList.contains('tree-scroll') && el.parentElement) last.set(el.parentElement, el.scrollTop);
    },
    true,
  );
  const restore = (panel) => {
    const list = panel.querySelector(':scope > .tree-scroll');
    const y = last.get(panel);
    if (!list || !y) return;
    const fix = () => {
      if (list.isConnected && list.scrollTop === 0 && list.scrollHeight > list.clientHeight) list.scrollTop = y;
    };
    fix();
    requestAnimationFrame(() => {
      fix();
      requestAnimationFrame(fix);
    });
  };
  const watch = () => {
    for (const panel of document.querySelectorAll('#tree, #rig, #panel-body')) {
      if (panel.__tbWatched) continue;
      panel.__tbWatched = true;
      new MutationObserver(() => tablet() && restore(panel)).observe(panel, { childList: true });
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch);
  else watch();
  setTimeout(watch, 2000);

  // 2. Dragging rows in the Tree. Safari turns a moving touch into scrolling and cancels the drag;
  //    once a drag is "armed" we stop the scrolling so the drag goes through.
  const ROWS = '.tree-scroll .order-row .row, .tree-scroll .row[data-bone]';
  let st = null;
  const clear = () => {
    if (!st) return;
    st.row.classList.remove('tb-drag-armed');
    st = null;
  };
  // A finger on a row never starts the editor's drag (the row's own pointerdown never sees it).
  document.addEventListener(
    'pointerdown',
    (e) => {
      if (tablet() && e.pointerType === 'touch' && e.target.closest && e.target.closest(ROWS)) e.stopPropagation();
    },
    true,
  );
  // The Pencil: stop Safari from scrolling with it, so the drag goes through.
  document.addEventListener(
    'touchstart',
    (e) => {
      clear();
      if (!tablet() || e.touches.length !== 1) return;
      const t = e.changedTouches[0];
      if (t.touchType !== 'stylus') return;
      const row = e.target.closest && e.target.closest(ROWS);
      if (!row || e.target.closest('button, .twisty, input, select, textarea')) return;
      st = { id: t.identifier, row };
      row.classList.add('tb-drag-armed');
    },
    { capture: true, passive: true },
  );
  document.addEventListener(
    'touchmove',
    (e) => {
      if (!st) return;
      if ([...e.changedTouches].some((x) => x.identifier === st.id) && e.cancelable) e.preventDefault();
    },
    { capture: true, passive: false },
  );
  document.addEventListener('touchend', clear, true);
  document.addEventListener('touchcancel', clear, true);

  const css = document.createElement('style');
  css.textContent =
    'html.tablet .tb-drag-armed{outline:2px solid var(--ui-accent,#5a8fd6);outline-offset:-2px;border-radius:6px;background:color-mix(in srgb,var(--ui-accent,#5a8fd6) 18%,transparent)}';
  document.head.append(css);
})();
