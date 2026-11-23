/* Shared desktop shell: icon sprite, sidebar and top bar for Home and My Vault. */
(function () {
  'use strict';
  var P = {
    home: '<path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    vault: '<rect x="3.5" y="4" width="17" height="15" rx="2.5"/><circle cx="12" cy="11.5" r="3.2"/><path d="M12 8.3v1M6.5 19v1.5M17.5 19v1.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c.9-4 3.8-6 7.5-6s6.6 2 7.5 6"/>',
    people: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c.6-3.4 3-5.3 6-5.3s5.4 1.9 6 5.3"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 14.6c2.4.2 4 1.8 4.5 4.4"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
    scale: '<path d="M12 3v18M7 21h10M4 7h16"/><path d="M6.5 7l-3 6.5a3.2 3.2 0 0 0 6 0zM17.5 7l-3 6.5a3.2 3.2 0 0 0 6 0z"/>',
    lock: '<rect x="4" y="10.5" width="16" height="10.5" rx="2.2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><path d="M12 14.5v2.5"/>',
    message: '<path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4V6a1 1 0 0 1 1-1z"/><path d="M8 10h8M8 13h5"/>',
    shield: '<path d="M12 3l7.5 3v5.5c0 4.8-3.3 8.4-7.5 9.5-4.2-1.1-7.5-4.7-7.5-9.5V6z"/><path d="M9 12l2.2 2.2L15.5 10"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    alert: '<path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5M12 17.5v.2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.2"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.5a2.5 2.5 0 0 1 4.8.8c0 1.7-2.4 2.2-2.4 3.7M12 17v.2"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    chev: '<path d="M9 6l6 6-6 6"/>',
    down: '<path d="M6 9l6 6 6-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    save: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>',
    eyeoff: '<path d="M3 3l18 18M10.6 6.1A9.9 9.9 0 0 1 12 6c5 0 8.5 4.5 9.5 6-.5.8-1.6 2.3-3.2 3.6M6.3 7.6C4.6 8.9 3.4 10.6 2.5 12c1 1.5 4.5 6 9.5 6 1.4 0 2.7-.4 3.9-.9"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    bank: '<path d="M3 9.5L12 4l9 5.5M4.5 10v8M9.5 10v8M14.5 10v8M19.5 10v8M3 20h18"/>',
    house: '<path d="M4 11l8-6.5 8 6.5v9H4z"/><path d="M10 20v-5h4v5"/>',
    pension: '<circle cx="12" cy="12" r="8.5"/><path d="M14.5 9.2c-.6-.8-1.5-1.2-2.5-1.2-1.4 0-2.5.8-2.5 2s1.1 1.6 2.5 2 2.5.9 2.5 2-1.1 2-2.5 2c-1 0-2-.4-2.6-1.2M12 6.5V8M12 16v1.5"/>',
    chart: '<path d="M4 20V4M4 20h16"/><path d="M7.5 15l3.5-4 3 2.5 5-6"/>',
    car: '<path d="M5 16V12l2-5h10l2 5v4"/><path d="M3.5 16h17v3h-17z"/><circle cx="7.5" cy="16" r="1"/><circle cx="16.5" cy="16" r="1"/>',
    briefcase: '<rect x="3.5" y="7.5" width="17" height="12" rx="2"/><path d="M9 7.5V5h6v2.5M3.5 12.5h17"/>',
    handshake: '<path d="M3 12l4-4 4 2 3-2 4 1 3 3"/><path d="M7 14l3 3c.7.7 1.6.7 2.3 0l4.7-4.7M10 12l3 3"/>',
    box: '<path d="M4 8l8-4 8 4v8l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v8"/>',
    card: '<rect x="3" y="6" width="18" height="12.5" rx="2"/><path d="M3 10h18M7 15h4"/>',
    ring: '<circle cx="12" cy="14.5" r="5.5"/><path d="M9.5 5.5L12 3l2.5 2.5L12 9z"/>',
    moon: '<path d="M18.5 15.5A7.5 7.5 0 0 1 9 5a7.5 7.5 0 1 0 9.5 10.5z"/>',
    kaaba: '<path d="M5 8l7-3 7 3v11l-7 2-7-2z"/><path d="M5 11l7 2 7-2"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8.5-8.5M16 7l2.5 2.5M14 9l2 2"/>',
    leaf: '<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15"/><path d="M5 19c3-4 6-7 10-9"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>'
  };

  function sprite() {
    if (document.getElementById('mw-sprite')) return;
    var d = document.createElement('div');
    d.innerHTML = '<svg id="mw-sprite" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
      Object.keys(P).map(function (k) { return '<symbol id="i-' + k + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + P[k] + '</symbol>'; }).join('') +
      '</defs></svg>';
    document.body.insertBefore(d.firstChild, document.body.firstChild);
  }
  function ic(n, s, cls) { s = s || 20; return '<svg class="ic' + (cls ? ' ' + cls : '') + '" width="' + s + '" height="' + s + '" aria-hidden="true" focusable="false"><use href="#i-' + n + '"/></svg>'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var LOGO = '<svg width="36" height="36" viewBox="0 0 40 40" fill="none" aria-hidden="true"><defs><linearGradient id="mwlg" x1="8" y1="8" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#F4E9CE"/><stop offset="1" stop-color="#C9A45C"/></linearGradient></defs><rect width="40" height="40" rx="8" fill="#13233F"/><path d="M9 28.5L13.5 11.5L17.5 23" stroke="#F5EEDD" stroke-width="3.2" stroke-linecap="square"/><path d="M17.5 23L21.5 11.5L26 28.5L30.5 11.5" stroke="url(#mwlg)" stroke-width="3.2" stroke-linecap="square"/></svg>';

  /* opts: { active: 'home'|'will'|'vault'|'profile', vaultActive: route id, willStatus, willPending, vault: { subscribed, sections:[{id,label,href,badge}] } } */
  function sidebar(opts) {
    var v = opts.vault || {};
    var h = '<a class="sb-logo" href="index.html">' + LOGO + '<span><span class="sb-name">Muslim Will</span><span class="sb-sub">a product of Patriva</span></span></a><nav class="sb-nav" aria-label="Main">' +
      '<a class="sb-link' + (opts.active === 'home' ? ' on' : '') + '" href="index.html"' + (opts.active === 'home' ? ' aria-current="page"' : '') + '>' + ic('home') + 'Home</a>' +
      '<a class="sb-link" href="#" data-soon="My Will">' + ic('doc') + 'My Will<span class="sb-st' + (opts.willPending ? ' gold' : '') + '">' + esc(opts.willStatus || '') + '</span></a>' +
      '<a class="sb-link' + (opts.active === 'vault' ? ' on' : '') + '" href="vault.html' + (v.subscribed ? '#/overview' : '#/discover') + '"' + (opts.active === 'vault' && !opts.vaultActive ? ' aria-current="page"' : '') + '>' + ic('vault') + 'My Vault<span class="sb-st">' + (v.subscribed ? '' : 'Not started') + '</span></a>';
    if (v.subscribed && v.sections) {
      h += '<div class="sb-sub-nav">' + v.sections.map(function (s) {
        var on = opts.active === 'vault' && opts.vaultActive === s.id;
        return '<a href="' + s.href + '" class="' + (on ? 'on' : '') + '"' + (on ? ' aria-current="page"' : '') + '>' + esc(s.label) + (s.badge ? '<span class="sb-badge">' + esc(s.badge) + '</span>' : '') + '</a>';
      }).join('') + '</div>';
    }
    h += '<a class="sb-link" href="#" data-soon="Profile">' + ic('user') + 'Profile</a></nav><div class="sb-demo" id="sb-demo"></div>';
    return h;
  }
  function topbar(opts) {
    return '<div class="tb-title">' + (opts.crumbs || []).map(function (c, i, a) { return i < a.length - 1 && c.href ? '<a href="' + c.href + '">' + esc(c.label) + '</a><span class="tb-sep" aria-hidden="true">/</span>' : '<span' + (i === a.length - 1 ? ' aria-current="page"' : '') + '>' + esc(c.label) + '</span>'; }).join('') + '</div>' +
      '<div class="tb-right"><button class="tb-bell" type="button" aria-label="Notifications">' + ic('bell') + (opts.alert ? '<span class="dot"></span>' : '') + '</button><button class="tb-help" type="button">Get help</button><span class="tb-user"><span class="tb-av" aria-hidden="true">NH</span>Nisreen</span></div>';
  }

  var toastTimer = null;
  function toast(msg) {
    var old = document.querySelector('.mw-toast'); if (old) old.remove();
    var t = document.createElement('div'); t.className = 'mw-toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t);
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.remove(); }, 3200);
  }

  window.MW = { ic: ic, esc: esc, sprite: sprite, sidebar: sidebar, topbar: topbar, toast: toast };
})();
