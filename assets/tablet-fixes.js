// SPDX-License-Identifier: MIT OR Apache-2.0
// Rig Tablet: touch fixes for the Tree panel on iPad (Safari).
//  1. The Tree keeps its scroll position when you tap in it.
//  2. Layers (Draw order) and bones can be dragged: with the Apple Pencil right away; with a finger,
//     hold still for a moment first (a quick swipe still scrolls the list).
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
  const HOLD_MS = 280;
  const SLOP = 10;
  let st = null;
  const clear = () => {
    if (!st) return;
    clearTimeout(st.timer);
    st.row.classList.remove('tb-drag-armed');
    st = null;
  };
  document.addEventListener(
    'touchstart',
    (e) => {
      clear();
      if (!tablet() || e.touches.length !== 1) return;
      const row = e.target.closest && e.target.closest(ROWS);
      if (!row || e.target.closest('button, .twisty, input, select, textarea')) return;
      const t = e.changedTouches[0];
      st = { id: t.identifier, x: t.clientX, y: t.clientY, row, armed: false, timer: 0 };
      const arm = () => {
        if (!st) return;
        st.armed = true;
        row.classList.add('tb-drag-armed');
      };
      if (t.touchType === 'stylus') arm();
      else st.timer = setTimeout(arm, HOLD_MS);
    },
    { capture: true, passive: true },
  );
  document.addEventListener(
    'touchmove',
    (e) => {
      if (!st) return;
      if (e.touches.length !== 1) return clear();
      const t = [...e.changedTouches].find((x) => x.identifier === st.id);
      if (!t) return;
      if (st.armed) {
        if (e.cancelable) e.preventDefault();
        return;
      }
      if (Math.hypot(t.clientX - st.x, t.clientY - st.y) > SLOP) clear(); // a swipe: let it scroll
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
