/* Below 768px the side menu is a drawer. The menu button opens it; choosing a page, tapping outside or Escape closes it.
   At 768px and wider the button keeps its existing behaviour (collapse to the logo rail). */
'use strict';
(function () {
  var mq = window.matchMedia('(max-width: 767px)'), root = document.documentElement, wide = A.sidenav;
  function set(open) {
    root.classList.toggle('side-open', open);
    var b = document.querySelector('.menu-t'); if (b) { b.setAttribute('aria-expanded', String(open)); b.setAttribute('aria-label', open ? 'Close the menu' : 'Open the menu'); }
  }
  A.sidenav = function (el) { if (!mq.matches) return wide(el); set(!root.classList.contains('side-open')); };
  window.addEventListener('hashchange', function () { set(false); });
  (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(function () { set(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  document.addEventListener('click', function (e) {
    if (!root.classList.contains('side-open') || e.target.closest('.menu-t')) return;
    if (!e.target.closest('.side')) { e.preventDefault(); e.stopPropagation(); set(false); }      // a tap outside only closes the menu
    else if (e.target.closest('.side a')) setTimeout(function () { set(false); }, 0);
  }, true);
  // The menu button always describes the drawer on small screens, whatever the saved desktop state is.
  var render0 = window.render;
  window.render = function () {
    render0.apply(this, arguments);
    if (mq.matches) set(root.classList.contains('side-open'));
    // Tab rows that scroll sideways open on the current tab.
    document.querySelectorAll('.vtabs [aria-current], .grail [aria-current], .tabs-d [aria-current]').forEach(function (el) {
      var box = el.closest('.vtabs, .grail, .tabs-d'); if (box && box.scrollWidth > box.clientWidth) box.scrollLeft = Math.max(0, el.getBoundingClientRect().left - box.getBoundingClientRect().left + box.scrollLeft - (box.clientWidth - el.offsetWidth) / 2);
    });
  };
})();
