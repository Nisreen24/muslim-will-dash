/* Will lock — one switch (MW_CONFIG.willLocked in config.js) that closes the Will to everyone.
   Loaded last by both builds. It edits no Will screen: it sits in front of them.
   While the switch is on:
   - every Will route (the Will, signing, attestation, the introduction, the Will funnel) shows the locked page;
   - every action that opens the Will shows the locked message;
   - Home, the menus and the entry flow stop offering the Will and lead with My Vault.
   Saved Will answers are kept as they are. Set willLocked to false and everything returns unchanged. */
'use strict';
(function () {
  if (!CFG.willLocked) return;
  var desktop = typeof dSteps === 'function';
  var H = 'The Will is locked for now';
  var P = 'It can’t be opened or changed at the moment. Anything already saved is kept.';
  var lockIco = '<span class="ico navy round">' + ic('lock', 26) + '</span>';

  /* ---------- the locked page ---------- */
  function lockedPage() {
    if (desktop) return shell('will', 'My Will', centerCard(lockIco + '<h1 class="h1">' + H + '</h1><p class="p">' + P + '</p>' +
      '<div class="acts"><a class="btn navy" href="#/vault">Go to My Vault' + ic('next') + '</a><a class="btn quiet" href="#/home">Back to Dashboard</a></div>'));
    return '<main class="scr tabs" style="justify-content:center">' + lockIco + '<h1 class="h1">' + H + '</h1><p class="p">' + P + '</p>' +
      '<div class="stack" style="margin-top:12px"><a class="btn navy" href="#/vault">Go to My Vault' + ic('next') + '</a><a class="btn quiet" href="#/home">Back to Home</a></div></main>' + nav('will');
  }
  ['will', 'sign', 'intro', 'attest'].forEach(function (k) { if (R[k]) R[k] = lockedPage; });

  // Checkout and its confirmation stay open for My Vault only.
  var pay0 = R.pay, paid0 = R.paid;
  R.pay = function (a) { return a[0] === 'vault' ? pay0(a) : lockedPage(); };
  R.paid = function (a) { return a[0] === 'vault' ? paid0(a) : lockedPage(); };

  /* ---------- actions that open the Will ---------- */
  function lockedSheet() {
    sheet('<h2 class="h2">' + H + '</h2><p class="p">' + P + '</p><button type="button" class="btn navy" data-act="close">Got it</button>');
  }
  ['startWill', 'beginWill', 'journey', 'answer', 'answerSend', 'wnext', 'askSubmit', 'submitWill', 'print', 'printWill', 'askSigned', 'signedHome'].forEach(function (k) { A[k] = lockedSheet; });

  /* ---------- signed out: the Will funnel and the tour hand over to the My Vault entry ---------- */
  function toVault() { location.replace(S.signedIn ? '#/home' : '#/vault-entry'); return null; }
  R.start = toVault;
  R.tour = toVault;
  start = function () { return S.signedIn ? '#/home' : '#/vault-entry'; };

  /* ---------- Home: My Vault leads; the Will is not offered ---------- */
  primary = function () {
    if (S.vault.active) {
      var st = vaultState();
      return '<section class="card"><span class="chip ' + (st.healthy ? 'c-green' : 'c-gold') + '">' + st.label + '</span><h2 class="h2">My Vault</h2><p class="p">Everything important, in one secure place.</p><a class="btn navy" href="#/vault">Open My Vault' + ic('next') + '</a></section>';
    }
    return '<section class="card"><p class="eyebrow">My Vault</p><h2 class="h2">Keep the rest of your estate organized.</h2><p class="p">Store important details your family may need later, in one secure place.</p><a class="btn navy" href="#/vault">See how it works' + ic('next') + '</a></section>';
  };
  banner = function () {
    var v = S.vault;
    if (!v.active || v.paused) return null;
    var n = !desktop && typeof nba === 'function' ? nba() : null;          // phone: the Vault's own next step
    if (n) return { eb: 'Next in your Vault', h: n.h, p: n.p, cta: n.cta, go: n.go };
    if (!v.assets.length) return { eb: 'Next step', h: 'Add your assets.', p: 'List what your family should know about.', cta: 'Add assets', go: '#/vault/assets' };
    if (!S.invited.length) return { eb: 'Next step', h: 'Keep your family in the loop.', p: 'Invite the people who may need access later.', cta: 'Invite family', act: 'invite' };
    if (!v.reviewed) return { eb: 'Reminder', h: 'Review your plan.', p: 'Check your details are still right.', cta: 'Review now', act: 'reviewPlan' };
    return null;
  };
  function welcome() { return '<p class="eyebrow">Assalamu Alaykum</p><h1 class="h1">Welcome' + (S.vault.active ? ' back' : '') + ', ' + esc(firstName()) + '</h1>'; }

  if (desktop) {
    var lockedChip = '<span class="chip c-grey">' + ic('lock', 16) + 'Locked</span>';
    willChip = function () { return lockedChip; };
    notes = function () { return []; };                                     // every notification was about the Will
    var tiles0 = tilesFor;
    tilesFor = function () { return S.vault.active ? tiles0() : ''; };
    R.home = function () {
      return shell('home', 'Dashboard', page('<header class="pg-h"><div class="stack">' + welcome() + '</div></header>' +
        '<div class="cols"><div class="col">' + primary().replace('class="card', 'class="card hero') + tilesFor() + '</div><aside class="rail">' + planPanel() + '</aside></div>' + bandFor()));
    };
    R.documents = function () {
      return shell('documents', 'Documents', page('<header class="pg-h"><div class="stack"><h1 class="h1">Documents</h1><p class="p">Your Will and anything attached to it.</p></div></header>' +
        '<table class="tbl"><thead><tr><th>Document</th><th>Status</th><th class="r"></th></tr></thead><tbody><tr><td class="t">Islamic Will</td><td>' + lockedChip + '</td><td class="r">—</td></tr></tbody></table>' +
        (S.vault.active ? '<p class="p">Vault documents live in <a href="#/vault/sealed">Sealed Documents</a>.</p>' : '')));
    };
  } else {
    R.home = function () {
      var b = banner(), tiles = '';
      if (S.vault.active) tiles = '<section class="stack"><h2 class="h3">My Vault</h2><div class="tiles">' + CFG.vaultModules.map(function (m) { var n = S.vault[m.id].length; return '<a class="tile" href="#/vault/' + m.id + '" style="text-decoration:none"><span class="ico">' + ic(MOD_IC[m.id]) + '</span>' + m.short + '<small>' + (n ? n + ' added' : 'Not started') + '</small></a>'; }).join('') + '</div></section>';
      return '<main class="scr tabs home"><header class="stack" style="gap:4px">' + welcome() + '</header>' + primary() + tiles +
        (b ? '<section class="card navy"><p class="eyebrow">' + b.eb + '</p><h2 class="h2">' + b.h + '</h2><p class="p">' + b.p + '</p>' +
          (b.go ? '<a class="btn ondark" href="' + b.go + '">' + b.cta + ic('next') + '</a>' : '<button type="button" class="btn ondark" data-act="' + b.act + '">' + b.cta + ic('next') + '</button>') + '</section>' : '') +
        '</main>' + nav('home');
    };
  }

  /* ---------- after every render: mark the Will as locked in the menus ---------- */
  function mark() {
    var a = document.querySelector('.side .nv[href="#/will"]');             // desktop side menu: no sub-menu, a Locked tag
    if (a && !a.dataset.locked) {
      a.dataset.locked = '1'; a.setAttribute('aria-label', 'My Will, locked');
      var grp = a.parentNode, tog = grp.querySelector('.gtog'), sub = document.getElementById('grp-will');
      if (tog) tog.remove(); if (sub) sub.remove();
      a.insertAdjacentHTML('beforeend', '<span class="chip c-ondark">' + ic('lock', 14) + 'Locked</span>');
    }
    var t = document.querySelector('.nav a[href="#/will"]');                // phone tab bar: a lock in place of the Will icon
    if (t && !t.dataset.locked) {
      t.dataset.locked = '1'; t.setAttribute('aria-label', 'Will, locked');
      var svg = t.querySelector('svg'); if (svg) svg.outerHTML = ic('lock', 24);
      if (!t.hasAttribute('aria-current')) t.style.opacity = '.6';
    }
    // Any remaining "Start my Will" button on a shared page (plan, family) reads as locked instead of inviting a tap.
    document.querySelectorAll('#app [data-act="startWill"]').forEach(function (b) { b.disabled = true; b.innerHTML = ic('lock', 18) + 'Locked'; });
  }
  var render0 = window.render;
  window.render = function () {
    if (S.entry !== 'vault' && !S.signedIn) { S.entry = 'vault'; save(); }  // no Will funnel, no Will-first sign-up
    render0.apply(this, arguments);
    mark();
  };

  /* ---------- prototype controls: hide the presets that exist only to show Will states ---------- */
  var HIDE = { 'Will only': 1, 'Notarized Attestation': 1, 'Reviewer side': 1 };
  document.querySelectorAll('#demo h3').forEach(function (h) {
    if (!HIDE[h.textContent.trim()]) return;
    h.hidden = true; if (h.nextElementSibling) h.nextElementSibling.hidden = true;
  });
  document.querySelectorAll('#demo [data-demo="e-will"], #demo [data-demo="e-direct"]').forEach(function (b) { b.hidden = true; });
  var note = document.querySelector('#demo p');
  if (note) note.insertAdjacentHTML('afterend', '<p><strong>The Will is locked.</strong> Its states are hidden here. Switch: <code>willLocked</code> in revamp/config.js.</p>');
})();
