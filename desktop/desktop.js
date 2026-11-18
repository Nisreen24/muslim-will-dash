/* Muslim Will — DESKTOP screens.
   State, config, validation and the Will's section definitions are shared with the phone prototype (../revamp/*.js):
   one source of logic, two layouts. Every screen below is a desktop composition; none reuses a phone layout. */
'use strict';

/* ================= chrome: sidebar + top bar ================= */
function willChip() {
  var w = S.will.status;
  if (w === 'none') return '<span class="chip c-grey">Not started</span>';
  if (w === 'progress') return '<span class="chip c-gold">' + ic('clock', 16) + 'In progress</span>';
  if (w === 'complete') return '<span class="chip c-green">' + ic('check', 16) + 'Completed</span>';
  return '<span class="chip c-gold">' + ic(w === 'ready' ? 'pen' : 'clock', 16) + stageLabel() + '</span>';
}
function notes() {
  var l = [], w = S.will.status;
  if (S.will.action && inReview()) l.push({ t: 'A reviewer has a question', s: 'Answer it to keep your review moving.', act: 'answer', n: 1 });
  else if (inReview()) l.push({ t: stageLabel(), s: STAGE[w].now, go: '#/will' });
  if (w === 'ready') l.push({ t: 'Your Will is ready to sign', s: 'Choose how you’d like to sign.', go: '#/sign', n: 1 });
  if (w === 'attest') l.push({ t: 'Attestation', s: CFG.rules.attestNextStep, go: '#/will' });
  if (w === 'progress') l.push({ t: 'Your Will is saved', s: 'Continue whenever you’re ready.', act: 'startWill' });
  if (w === 'complete') l.push({ t: 'Your Will is completed', s: 'View it anytime.', go: '#/will/view' });
  return l;
}
function side(cur, o) {
  var w = S.will.status, sub = '', vsub = '';
  function item(href, label, key, extra) { return '<a href="' + href + '"' + (key && o.sub === key ? ' aria-current="page"' : '') + '>' + label + (extra || '') + '</a>'; }
  // My Will menu: what is useful in the person's current state, never a list of every step.
  if (w === 'none') sub = item('#/will', 'Start my Will');
  else if (w === 'progress') { var nt = nextTask(); sub = item('#/will', 'Overview') + item('#/will/c/' + nt.ci + '/' + nt.si, 'Continue: ' + esc(nt.ch.title)) + '<button type="button" data-act="journey">View journey</button>'; }
  else sub = (typeof attOn === 'function' && attOn() ? attSub(o) : '') + item('#/will', w === 'complete' ? 'Overview' : 'Review status', 'status') + item('#/will/view', 'View my Will', 'view');
  // My Vault menu
  if (S.vault.active) vsub = item('#/vault', 'Overview') + CFG.vaultModules.map(function (m) { return item('#/vault/' + m.id, m.name, m.id); }).join('') + item('#/vault/people', 'Vault settings');
  else vsub = item('#/vault', 'See how it works');
  function nv(id, href, icon, label, extra) { return '<a class="nv" href="' + href + '"' + (cur === id && !o.sub && o.ci == null ? ' aria-current="page"' : '') + '>' + ic(icon) + '<span>' + label + '</span>' + (extra || '') + '</a>'; }
  // A group is a link plus a button that opens its menu. It opens by itself on its own pages; a manual choice is remembered.
  function group(id, href, icon, label, items, extra) {
    var open = NAV_OPEN[id] != null ? NAV_OPEN[id] : cur === id;
    return '<div class="grp">' + nv(id, href, icon, label, extra) + '<button type="button" class="gtog" data-act="navgrp" data-v="' + id + '" aria-expanded="' + open + '" aria-controls="grp-' + id + '" aria-label="' + (open ? 'Hide' : 'Show') + ' the ' + label + ' menu">' + ic(open ? 'up' : 'down', 20) + '</button></div>' +
      '<div class="sub" id="grp-' + id + '"' + (open ? '' : ' hidden') + '>' + items + '</div>';
  }
  return '<aside class="side" aria-label="Main navigation"><div class="side-h">' + brandHtml('#/home') + '</div><div class="side-body" id="side-body">' +
    nv('home', '#/home', 'home', 'Dashboard') +
    group('will', '#/will', 'will', 'My Will', sub) +
    group('vault', '#/vault', 'vault', 'My Vault', vsub, S.vault.active ? '' : '<span class="chip c-ondark">Discover</span>') +
    nv('family', '#/family', 'people', 'Family &amp; access') +
    nv('documents', '#/documents', 'list', 'Documents') +
    '<div class="session"><span><b id="timer">60:00</b><small>Session time left</small></span><button type="button" data-act="extend">Extend</button></div></div></aside>';
}
IC.up = '<path d="M6 15l6-6 6 6"/>';
var NAV_OPEN = {}; try { NAV_OPEN = JSON.parse(localStorage.getItem('mw-nav-open')) || {}; } catch (e) {}
A.navgrp = function (el) { var id = el.dataset.v; NAV_OPEN[id] = el.getAttribute('aria-expanded') !== 'true'; try { localStorage.setItem('mw-nav-open', JSON.stringify(NAV_OPEN)); } catch (e) {} render(); var b = document.querySelector('.gtog[data-v="' + id + '"]'); if (b) b.focus(); };
function topbar(title, o) {
  var l = notes(), n = l.filter(function (x) { return x.n; }).length, nm = S.user.name || firstName(), ini = nm.split(/\s+/).map(function (x) { return x[0]; }).slice(0, 2).join('').toUpperCase();
  var tt = typeof title === 'object' ? '<span class="tt"><small>' + title.eb + '</small>' + esc(title.t) + '</span>' : '<span class="tt">' + title + '</span>';
  var min = document.documentElement.classList.contains('side-min'), lab = min ? 'Open the menu' : 'Close the menu';
  return '<header class="top"><button type="button" class="tbtn menu-t" data-act="sidenav" aria-expanded="' + !min + '" aria-controls="side-body" aria-label="' + lab + '" title="' + lab + '">' + ic('menu', 24) + '</button>' + tt + (o.mid ? '<span class="sp"></span>' + o.mid : '') + '<span class="sp"></span>' + (o.saved ? '<span class="saved">' + ic('check', 18) + 'Saved</span>' : '') +
    '<span class="rel"><button type="button" class="tbtn" data-act="pop" data-v="pop-bell" aria-label="Notifications' + (n ? ', ' + n + ' need action' : '') + '" aria-expanded="false">' + ic('bell') + (n ? '<span class="badge">' + n + '</span>' : '') + '</button>' +
    '<div class="pop" id="pop-bell" hidden>' + (l.length ? l.map(function (x) { return (x.go ? '<a href="' + x.go + '">' : '<button type="button" data-act="' + x.act + '">') + x.t + '<small>' + esc(x.s) + '</small>' + (x.go ? '</a>' : '</button>'); }).join('') : '<p class="small">Nothing new.</p>') + '</div></span>' +
    '<button type="button" class="tbtn line" data-act="help">' + ic('help', 20) + 'Get help</button>' +
    '<span class="rel"><button type="button" class="tbtn" data-act="pop" data-v="pop-user" aria-expanded="false"><span class="avatar">' + esc(ini) + '</span>' + esc(firstName()) + ic('down', 18) + '</button>' +
    '<div class="pop sm" id="pop-user" hidden><a href="#/profile">My Profile</a><button type="button" data-act="signout">Sign out</button></div></span></header>';
}
IC.menu = '<path d="M4 7h16M4 12h16M4 17h16"/>';
function brandHtml(href) { return '<a class="brand" href="' + href + '" aria-label="The Muslim Will, a product of Patriva"><img src="assets/logo-mark.png" alt="" width="44" height="44"><span>The Muslim Will<small>A PRODUCT OF PATRIVA</small></span></a>'; }
// The side menu can be closed to give the page the full width; only the logo stays. The choice is remembered.
try { if (localStorage.getItem('mw-side-min') === '1') document.documentElement.classList.add('side-min'); } catch (e) {}
A.sidenav = function () { var on = document.documentElement.classList.toggle('side-min'); try { localStorage.setItem('mw-side-min', on ? '1' : '0'); } catch (e) {} render(); var b = document.querySelector('.menu-t'); if (b) b.focus(); };
IC.bell = '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10.5 21h3"/>';
function shell(cur, title, body, o) { o = o || {}; document.documentElement.classList.toggle('side-focus', !!o.focus); return '<div class="dsk">' + side(cur, o) + '<div class="main">' + topbar(title, o) + body + '</div></div>'; }
function page(inner) { return '<main class="pg">' + inner + '</main>'; }
A.pop = function (el) {
  var p = document.getElementById(el.dataset.v), open = p.hidden;
  document.querySelectorAll('.pop').forEach(function (x) { x.hidden = true; });
  p.hidden = !open; el.setAttribute('aria-expanded', String(open));
};
document.addEventListener('click', function (e) { if (!e.target.closest('.rel')) document.querySelectorAll('.pop').forEach(function (x) { x.hidden = true; }); });

// Session clock, kept from the current site: 60 minutes, "Extend" restarts it.
var SK = 'mw-session-end';
function sessionEnd(reset) {
  var v = 0; try { v = +sessionStorage.getItem(SK); } catch (e) {}
  if (reset || !(v > Date.now())) { v = Date.now() + 3600000; try { sessionStorage.setItem(SK, String(v)); } catch (e) {} }
  return v;
}
function tick() { var el = document.getElementById('timer'); if (!el) return; var s = Math.max(0, Math.round((sessionEnd() - Date.now()) / 1000)), m = Math.floor(s / 60); s = s % 60; el.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; }
setInterval(tick, 250);
A.extend = function () { sessionEnd(true); tick(); };

/* ================= signed-out: value journey, tour, account ================= */
function pubTop(right) { return '<header class="pub-top">' + brandHtml('#/') + '<div class="acts">' + right + '</div></header>'; }
var STEP_ART = { journey: { 0: 'art-hub', 4: 'art-vault', 5: 'art-start' }, tour: { 0: 'art-hub', 1: 'art-will', 2: 'art-vault', 3: 'art-start' } };
function dSteps(list, n, base, skipTo, doneTo) {
  var s = list[n], img = STEP_ART[list === JOURNEY ? 'journey' : 'tour'][n];
  return '<div class="pub dsk">' + pubTop((list === JOURNEY ? '<span class="chip c-green" style="align-self:center">' + ic('check', 16) + 'Free to create and print</span>' : '') + (s.last ? '' : '<a class="btn quiet" href="' + skipTo + '">Skip</a>') + '<a class="btn out sm" href="#/signin">Sign in</a>') +
    '<main class="duo"><div class="txt"><p class="eyebrow">' + s.eb + '</p><h1 class="h1">' + s.h + '</h1><p class="p">' + s.p + '</p>' +
    '<div class="acts">' + (n ? '<a class="btn out" href="' + base + (n - 1) + '" style="min-width:0">' + ic('back') + 'Back</a>' : '') + ctaOf(s, s.last ? doneTo : base + (n + 1)) + '</div>' +
    '<nav class="dsk-dots" aria-label="Steps">' + list.map(function (_, i) { return '<a href="' + base + i + '" aria-label="Step ' + (i + 1) + ' of ' + list.length + '"' + (i === n ? ' aria-current="step"' : '') + '></a>'; }).join('') + '</nav></div>' +
    (img ? '<div class="art img"><img src="assets/' + img + '.png" alt=""></div>' : artOf(s)) + '</main></div>';
}
R.start = function (a) { if (S.signedIn) { location.replace('#/home'); return null; } var n = Math.min(JOURNEY.length - 1, Math.max(0, +a[0] || 0)); return dSteps(JOURNEY, n, '#/start/', '#/start/' + (JOURNEY.length - 1), '#/account'); };
R.tour = function (a) { var n = Math.min(TOUR.length - 1, Math.max(0, +a[0] || 0)); return dSteps(TOUR, n, '#/tour/', '#/account', '#/account'); };

/* Sign in and Register keep the current site's split layout: navy panel on the left, form on the right. */
var PW_RULES = [['8+ characters', /.{8,}/], ['Uppercase', /[A-Z]/], ['Lowercase', /[a-z]/], ['Number', /\d/], ['Symbol @ $ ! % * ? &', /[@$!%*?&]/]];
var BRAND_L = brandHtml('#/');
function authLeft(kind) {
  if (kind === 'signin') return '<aside class="auth-l">' + BRAND_L + '<div class="pitch"><p class="eyebrow">One sign-in · all your Patriva products</p><h2 class="h1">Welcome back.<em>Pick up where you left off.</em></h2>' +
    '<div class="trust"><span>' + ic('shield', 18) + 'Bank-grade encryption</span><span>' + ic('will', 18) + 'All your documents, one place</span></div></div><img class="auth-art" src="assets/art-start.png" alt=""></aside>';
  return '<aside class="auth-l tall">' + BRAND_L + '<p class="eyebrow" style="margin-top:56px">Your next step</p><h2 class="h1">You’re one step from <em class="in">fixing this</em> for your family.</h2>' +
    '<div class="fixbox"><p class="eyebrow">What you’re fixing</p><div class="row"><span class="num">1</span><span><b>The wrong shares</b><small>Fixed by your Islamic Will.</small></span></div><div class="row"><span class="num">2</span><span><b>An estate no one can find</b><small>Fixed by your Vault.</small></span></div></div>' +
    '<p class="eyebrow">What happens next</p><ol class="tl dark"><li class="on"><span class="dot"></span><span>Create your account<small>About a minute</small></span></li><li><span class="dot"></span><span>Write your Islamic Will<small>Guided, step by step</small></span></li><li><span class="dot"></span><span>Choose what fits your family<small>A free basic Will is always available</small></span></li></ol>' +
    '<div class="trust col"><span>' + ic('shield', 18) + 'Reviewed by lawyers and Islamic scholars</span><span>' + ic('lock', 18) + 'Encrypted Vault, released only when needed</span></div></aside>';
}
R.account = function () {
  if (S.signedIn) { location.replace('#/home'); return null; }
  if (get('sec.tfa') === undefined) set('sec.tfa', true);
  var will = S.entry !== 'vault';
  return '<div class="auth reg dsk">' + authLeft('register') + '<main class="auth-r"><div class="auth-top"><span class="small">Already have an account?</span><a class="btn out sm" href="#/signin">Sign in</a></div>' +
    '<div class="formcol"><p class="eyebrow">Assalamu Alaykum</p><h1 class="h1">Create your account</h1><p class="p">' + (will ? 'About a minute. Free to start.' : 'One account for your Will and your Vault.') + '</p>' +
    '<div class="stack">' + SSO + '</div><p class="or">or with email</p>' +
    '<form class="stack lg" data-act-submit="acctAll" novalidate>' + inp('Full legal name', 'user.name', { ac: 'name', ph: 'As it appears on your ID' }) + inp('Email address', 'user.email', { type: 'email', ac: 'email' }) +
    '<label class="field"><span class="label">Password</span><input class="input' + (E.pw ? ' bad' : '') + '" id="pw" type="password" autocomplete="new-password" aria-describedby="pwchips">' +
    '<span class="pwchips" id="pwchips">' + PW_RULES.map(function (r, i) { return '<span data-i="' + i + '">' + ic('check', 14) + r[0] + '</span>'; }).join('') + '</span>' + err('pw') + '</label>' +
    '<label class="check"><input type="checkbox" data-act="showpw">Show password</label>' +
    '<div class="optbox"><label class="check"><input type="checkbox" data-f="sec.tfa"' + (get('sec.tfa') ? ' checked' : '') + '>Protect my account with two-factor authentication</label><p class="small">Recommended. You can turn it off later in My Profile.</p></div>' +
    '<div class="optbox"><label class="check"><input type="checkbox" id="terms"' + (UI.terms ? ' checked' : '') + '>I accept the terms below</label>' +
    '<p class="small"><button type="button" class="lnk" data-act="legal" data-v="terms">Terms of Service</button> · <button type="button" class="lnk" data-act="legal" data-v="privacy">Privacy Policy</button> · <button type="button" class="lnk" data-act="acks">10 acknowledgements</button></p></div>' +
    '<button class="btn navy" type="submit" id="create"' + (UI.terms ? '' : ' disabled') + '>' + (will ? 'Create account and start my Will' : 'Create account') + ic('next') + '</button>' +
    '<p class="small center">' + (will ? 'Free to start. No payment needed.' : 'You pay only for what you choose.') + '</p></form></div></main></div>';
};
A.acks = function () { sheet('<h2 class="h2">Acknowledgements</h2><p class="p">[The 10 acknowledgements from legal]</p><button type="button" class="btn out" data-act="close">Close</button>'); };
A.acctAll = function () {
  var pw = document.getElementById('pw').value; E = {};
  if (String(S.user.name || '').trim().split(/\s+/).length < 2) E['user.name'] = 'Enter your first and last name.';
  if (!validEmail(S.user.email)) E['user.email'] = 'Enter a valid email, like name@example.com.';
  if (!PW_RULES.every(function (r) { return r[1].test(pw); })) E.pw = 'Your password needs all five items above.';       // never stored
  if (Object.keys(E).length) return render();
  UI.terms = false; afterAuth();
};
document.addEventListener('input', function (e) { if (e.target.id === 'pw') document.querySelectorAll('.pwchips span').forEach(function (c) { c.classList.toggle('ok', PW_RULES[+c.dataset.i][1].test(e.target.value)); }); });
document.addEventListener('change', function (e) { if (e.target.id === 'terms') { UI.terms = e.target.checked; var b = document.getElementById('create'); if (b) b.disabled = !UI.terms; } });
R.signin = function () {
  if (S.signedIn) { location.replace('#/home'); return null; }
  return '<div class="auth dsk">' + authLeft('signin') + '<main class="auth-r"><div class="auth-top"><span class="small">New here?</span><a class="btn out sm" href="' + (S.entry === 'will' ? '#/start/0' : '#/account') + '">Create an account</a></div>' +
    '<div class="formcol"><h1 class="h1">Sign in</h1><div class="stack">' + SSO + '</div><p class="or">or with email</p>' +
    '<form class="stack lg" data-act-submit="signin" novalidate>' + inp('Email address', 'user.email', { type: 'email', ac: 'email' }) +
    '<div class="field"><div class="row between"><label class="label" for="pw">Password</label><button type="button" class="lnk" data-act="forgot">Forgot password?</button></div><input class="input' + (E.pw ? ' bad' : '') + '" id="pw" type="password" autocomplete="current-password">' + err('pw') + '</div>' +
    '<label class="check"><input type="checkbox" data-f="sec.keep"' + (get('sec.keep') ? ' checked' : '') + '>Keep me signed in for 30 days</label>' +
    '<button class="btn navy" type="submit">Sign in' + ic('next') + '</button></form><p class="or">or</p>' +
    '<button type="button" class="btn out" data-act="magic">' + ic('mail') + 'Email me a sign-in link</button>' +
    '<p class="small center">By signing in you agree to our <button type="button" class="lnk" data-act="legal" data-v="terms">Terms</button> and <button type="button" class="lnk" data-act="legal" data-v="privacy">Privacy Policy</button>.</p></div></main></div>';
};
A.magic = function () {
  if (!validEmail(S.user.email)) { E['user.email'] = 'Enter your email first, then ask for a link.'; return render(); }
  sheet('<span class="ico green round">' + ic('check', 24) + '</span><h2 class="h2">Check your email</h2><p class="p">We sent a sign-in link to ' + esc(S.user.email) + '.</p><button type="button" class="btn navy" data-act="close">Done</button>');
};

/* ================= Dashboard ================= */
function planPanel() {
  return '<section class="card pad-s"><h2 class="panel-t">Your plan</h2>' +
    '<div><div class="kv"><span class="strong">Islamic Will</span>' + willChip() + '</div>' +
    (CFG.products.vault ? '<div class="kv"><span class="strong">My Vault</span>' + (S.vault.active ? '<span class="chip c-green">' + ic('check', 16) + 'Active</span>' : '<span class="chip c-grey">Not added</span>') + '</div>' : '') +
    (S.will.signing === 'notary' ? '<div class="kv"><span class="strong">Notarized Attestation</span><span class="chip c-gold">' + (S.will.status === 'complete' ? 'Completed' : 'Being arranged') + '</span></div>' : '') + '</div></section>';
}
function chapterPanel() {
  var chs = chapters();
  return '<section class="card pad-s"><h2 class="panel-t">Chapters</h2><ul class="check-l">' + chs.map(function (c, i) {
    var done = S.will.done.indexOf(c.id) >= 0;
    return '<li' + (done ? '' : ' style="color:' + (i === S.will.ch ? 'var(--navy)' : 'var(--muted)') + '"') + '>' + (done ? ic('check', 20) : '<span style="width:20px;text-align:center">' + (i + 1) + '</span>') + esc(c.title) + (i === S.will.ch && !done ? '<span class="chip c-gold" style="margin-left:auto">Now</span>' : '') + '</li>';
  }).join('') + '</ul></section>';
}
function tilesFor() {
  var w = S.will.status;
  if (S.vault.active) return '<section class="stack"><h2 class="h3">My Vault</h2><div class="tiles">' + CFG.vaultModules.map(function (m) { var n = S.vault[m.id].length; return '<a class="tile" href="#/vault/' + m.id + '"><span class="ico">' + ic(MOD_IC[m.id]) + '</span>' + m.short + '<small>' + (n ? n + ' added' : 'Not started') + '</small></a>'; }).join('') + '</div></section>';
  if (w === 'complete') return '<section class="stack"><h2 class="h3">Your Will</h2><div class="tiles">' +
    [['Beneficiaries', 'people', '#/family', 'Family and roles'], ['Guardians', 'shield', '#/will/view/guardian', 'Who you named'], ['Documents', 'list', '#/documents', 'View and print'], ['Update details', 'pen', '#/will/view/about', 'Edit your answers']].map(function (t) { return '<a class="tile" href="' + t[2] + '"><span class="ico">' + ic(t[1]) + '</span>' + t[0] + '<small>' + t[3] + '</small></a>'; }).join('') + '</div></section>';
  return '';
}
function bandFor() {
  var b = banner(); if (!b) return '';
  // The approved recommendation banner: a light tinted card with the client's illustration, never a dark block.
  var art = b.go === '#/vault' ? 'banner-vault' : 'banner-family';
  return '<section class="rec" style="--art:url(assets/' + art + '.jpg)"><div class="stack"><p class="eyebrow">' + b.eb + '</p><h2 class="h2">' + b.h + '</h2><p class="p">' + b.p + '</p>' +
    (b.go ? '<a class="btn out" href="' + b.go + '">' + b.cta + ic('next') + '</a>' : '<button type="button" class="btn out" data-act="' + b.act + '">' + b.cta + ic('next') + '</button>') + '</div></section>';
}
R.home = function () {
  var w = S.will.status, rail = planPanel();
  if (w === 'progress') rail += '<section class="card pad-s"><h2 class="panel-t">Your journey</h2>' + journeyMap() + '</section>';
  else if (w !== 'none' && w !== 'complete') rail += '<section class="card pad-s"><h2 class="panel-t">Where your Will is</h2>' + timeline() + '</section>';
  return shell('home', 'Dashboard', page(
    '<header class="pg-h"><div class="stack"><p class="eyebrow">Assalamu Alaykum</p><h1 class="h1">Welcome' + (w === 'none' && !S.vault.active ? '' : ' back') + ', ' + esc(firstName()) + '</h1></div></header>' +
    '<div class="cols"><div class="col">' + primary().replace('class="card', 'class="card hero') + tilesFor() + '</div><aside class="rail">' + rail + '</aside></div>' + bandFor()));
};

/* ================= My Will ================= */
var WHY = {
  name: 'Your legal name goes on the Will itself, so it must match your ID.', contact: 'We only use these to update you about your Will.', residency: 'How a Will is signed depends on your province.',
  spouse: 'Your spouse is part of Islamic inheritance. Entering them once lets you reuse them later.', children: 'Children under 18 need a guardian. We ask for one only if it applies.', relatives: 'Parents and siblings can affect how shares are divided.',
  executor: 'Pick someone you trust who can handle paperwork. Their contact details are optional.', guardian: 'Usually a close relative your children already know.',
  wasiyyah: 'A Wasiyyah is limited to one third. The rest follows the Islamic shares.', witness1: 'Witnesses confirm that you signed. They must be adults who don’t inherit.', witness2: 'Your second witness can live at the same address as the first.'
};
function dWill() {
  var w = S.will.status, chs = chapters(), main, rail;
  if (w === 'none') {
    main = '<section class="card hero"><h2 class="h2">Create your Islamic Will for free</h2><p class="p">Guided, one step at a time. No payment required.</p><button type="button" class="btn navy" data-act="startWill">Start my Will' + ic('next') + '</button></section>' +
      '<table class="tbl"><thead><tr><th style="width:64px">#</th><th>Chapter</th><th>What it covers</th></tr></thead><tbody>' + chs.map(function (c, i) { return '<tr><td>' + (i + 1) + '</td><td class="t">' + esc(c.title) + '</td><td>' + c.secs.map(function (s) { return s === 'review' ? 'Check and submit' : SEC[s].t; }).join(' · ') + '</td></tr>'; }).join('') + '</tbody></table>';
    rail = '<section class="card pad-s"><h2 class="panel-t">Good to know</h2><div class="tick">' + ic('check') + 'No card needed</div><div class="tick">' + ic('check') + 'Free to create and print</div><div class="tick">' + ic('check') + 'Stop and return anytime</div></section>';
  } else if (w === 'progress') {
    main = primary().replace('class="card', 'class="card hero');
    rail = '<section class="card pad-s"><h2 class="panel-t">Your journey</h2>' + journeyMap() + '</section>';
  } else if (w === 'complete') {
    main = '<section class="card hero"><span class="chip c-green">' + ic('check', 16) + 'Completed</span><h2 class="h2">Your Islamic Will is ready.</h2><p class="p">View or review your Will anytime.</p>' +
      '<div class="acts"><a class="btn navy" href="#/will/view">View my Will' + ic('next') + '</a><a class="btn out" href="#/documents">' + ic('print') + 'Documents</a><a class="btn quiet" href="#/will/view/about">Update details</a></div></section>';
    rail = '<section class="card pad-s"><h2 class="panel-t">Where your Will is</h2>' + timeline() + '</section>';
  } else {
    var act = S.will.action && inReview();
    main = '<section class="card hero ' + (act ? 'amber' : 'tint') + '">' + (w === 'ready'
      ? '<span class="chip c-gold">' + ic('pen', 16) + 'Ready to Sign</span><h2 class="h2">Your Will is ready to sign.</h2><p class="p">Choose how you’d like to sign.</p><a class="btn navy" href="#/sign">Continue to signing' + ic('next') + '</a>'
      : '<span class="chip ' + (act ? 'c-amber' : 'c-gold') + '">' + ic(act ? 'alert' : 'clock', 16) + (act ? 'Action needed' : stageLabel()) + '</span><h2 class="h2">' + (act ? 'A reviewer has a question' : w === 'attest' ? 'Your attestation is being arranged.' : 'Your Will is under review.') + '</h2>' +
        '<div class="g3"><div><p class="panel-t">Now</p><p class="strong">' + esc(STAGE[w].now) + '</p></div><div><p class="panel-t">From you</p><p class="strong">' + (act ? 'Answer one question' : 'Nothing needed') + '</p></div><div><p class="panel-t">Next</p><p class="strong">' + esc(STAGE[w].next) + '</p></div></div>' +
        (act ? '<button type="button" class="btn navy" data-act="answer">Answer question' + ic('next') + '</button>' : termLink(w === 'scholar' ? 'scholar' : w === 'legal' ? 'legal' : w === 'attest' ? 'attestation' : ''))) + '</section>' + witnessCard() +
      '<div class="acts"><a class="btn out" href="#/will/view">View my Will</a></div>';
    rail = '<section class="card pad-s"><h2 class="panel-t">Where your Will is</h2>' + timeline() + '</section>';
    if (w === 'attest' && typeof attCard === 'function') main = attCard().replace('class="card', 'class="card hero') + witnessCard() + '<div class="acts"><a class="btn out" href="#/will/view">View my Will</a></div>';
  }
  return shell('will', 'My Will', page('<header class="pg-h"><h1 class="h1">My Will</h1></header><div class="cols"><div class="col">' + main + '</div><aside class="rail">' + rail + '</aside></div>'), { sub: w === 'none' || w === 'progress' ? null : 'status' });
}
function parts(open, withEdit) {
  return REVIEW.map(function (r) {
    var done = S.will.done.indexOf(r.ch) >= 0, kv = summary(r.id), skip = r.id === 'guardian' && !hasMinor();
    return '<section class="card" id="part-' + r.id + '"><div class="row between"><h2 class="h3 row">' + (done ? '<span class="ico green round" style="width:34px;height:34px">' + ic('check', 18) + '</span>' : '<span class="chip c-amber">' + ic('alert', 16) + 'To do</span>') + r.label + '</h2>' +
      (withEdit && !skip ? '<a class="btn out sm noprint" href="#/will/c/' + chIndex(r.ch) + '/' + r.sec + '">' + ic('pen', 18) + (done ? 'Edit' : 'Complete') + '</a>' : '') + '</div>' +
      (done ? '<div class="kv2">' + kv.map(function (x) { return '<div class="kv"><span>' + esc(x[0]) + '</span><b>' + esc(x[1] || '—') + '</b></div>'; }).join('') + '</div>' : '<p class="p">Not finished yet.</p>') + '</section>';
  }).join('');
}
function dWizard(ci, si) {
  var chs = chapters(), ch = chs[ci];
  if (!ch) { location.replace('#/will'); return null; }
  si = Math.min(si, ch.secs.length - 1);
  if (guardStep(ci, si)) return null;
  var id = ch.secs[si], def = SEC[id], n = ch.secs.length, inFlow = S.will.status === 'progress';
  if (inFlow) { S.will.ch = ci; S.will.sec = si; save(); }
  var back = si > 0 ? '#/will/c/' + ci + '/' + (si - 1) : inFlow ? (ci > 0 ? '#/will/c/' + (ci - 1) + '/' + (chs[ci - 1].secs.length - 1) : '#/will') : '#/will/view';
  var eb = 'Chapter ' + (ci + 1) + ' of ' + chs.length, title = { eb: eb, t: ch.title };
  if (id === 'review') {
    var todo = REVIEW.filter(function (r) { return S.will.done.indexOf(r.ch) < 0; });
    return shell('will', title, page('<div class="whead" style="border-radius:16px"><p class="eyebrow">' + eb + ' · ' + esc(ch.title) + '</p><h1 class="h1">Review your Will</h1><p class="p">Check each part. Edit anything.</p></div>' +
      '<div class="cols"><div class="col">' + parts(null, true) + '</div><aside class="rail"><section class="card pad-s"><h2 class="panel-t">Ready to submit?</h2><ul class="check-l">' +
      REVIEW.map(function (r) { var d = S.will.done.indexOf(r.ch) >= 0; return '<li' + (d ? '' : ' class="todo"') + '>' + ic(d ? 'check' : 'alert', 20) + r.label + '</li>'; }).join('') + '</ul>' +
      (todo.length ? '<p class="small">Finish the parts marked “To do” to submit.</p>' : '') +
      '<button type="button" class="btn navy block" data-act="askSubmit"' + (todo.length ? ' disabled' : '') + '>Submit my Will' + ic('next') + '</button><a class="btn quiet block" href="#/home">Save and go to Dashboard</a></section>' +
      '<section class="card pad-s"><h2 class="panel-t">After you submit</h2><p class="p">A scholar reviews it, then a legal check. We tell you if anything is needed.</p></section></aside></div>'), { saved: true, ci: ci });
  }
  // The approved Will header: warm tint, gold progress segments for the sections of this chapter, gold-brown chapter label, navy title.
  var head = '<div class="whead"><div class="row between"><div class="wsegs" role="img" aria-label="Section ' + (si + 1) + ' of ' + n + ' in this chapter">' + ch.secs.map(function (_, i) { return '<i' + (i < si ? ' class="done"' : i === si ? ' class="on"' : '') + '></i>'; }).join('') + '<span>Section ' + (si + 1) + ' of ' + n + '</span></div>' +
    '<button type="button" class="termlink jbtn" data-act="journey">View journey</button></div>' +
    '<p class="eyebrow">' + eb + ' · ' + esc(ch.title) + '</p><h1 class="h1">' + TASK[id][0] + '</h1><p class="p">' + def.d + '</p>' + termLink(TERM_OF[id]) + '</div>';
  var form = '<form class="wbody" data-act-submit="wnext" data-ci="' + ci + '" data-si="' + si + '" novalidate><p class="enc">' + ic('shield', 18) + 'Your information is encrypted and never shared.</p>' + def.body() +
    '<div class="acts"><a class="btn out" href="' + back + '" style="min-width:0">' + ic('back') + 'Back</a><span class="sp"></span>' + (inFlow ? '<a class="btn quiet" href="#/home">Save and go to Dashboard</a>' : '') +
    '<button class="btn navy" type="submit">' + (inFlow ? 'Continue' : 'Save changes') + ic('next') + '</button></div></form>';
  var reuse = (id === 'executor' || id === 'guardian') && people().length ? '<section class="card pad-s"><h2 class="panel-t">No retyping</h2><p class="p">People you already added appear as choices.</p></section>' : '';
  var rail = '<section class="card pad-s"><h2 class="panel-t">Why we ask</h2><p class="p">' + WHY[id] + '</p></section>' + reuse +
    '<section class="card pad-s"><div class="tick">' + ic('check') + 'Saved automatically</div><div class="tick">' + ic('check') + 'Stop and return anytime</div><button type="button" class="btn out sm" data-act="help">' + ic('help', 18) + 'Get help</button></section>';
  // Journey on the left for orientation, the one task in the middle, help on the right. The site menu steps aside.
  return shell('will', title, page('<div class="cols wz3"><aside class="jcol"><section class="card pad-s"><h2 class="panel-t">Your journey</h2>' + journeyMap() + '</section></aside><div>' + head + form + '</div><aside class="rail">' + rail + '</aside></div>'), { saved: true, ci: ci, focus: inFlow });
}
function centerCard(inner) { return page('<section class="card hero" style="max-width:720px;margin:48px auto 0;width:100%">' + inner + '</section>'); }
function dDone(ci) {
  var chs = chapters(), ch = chs[ci], nt = nextTask(), n = doneCount();
  if (!ch || S.will.status !== 'progress') { location.replace('#/will'); return null; }
  S.will.ch = nt.ci; S.will.sec = nt.si; save();
  return shell('will', 'My Will', centerCard('<span class="ico green round">' + ic('check', 26) + '</span><h1 class="h1">' + esc(ch.title) + ' saved</h1><p class="p strong">' + n + ' of ' + chs.length + ' chapters complete</p>' +
    '<div class="bar" aria-hidden="true"><i style="width:' + n / chs.length * 100 + '%"></i></div>' +
    '<div class="card tint pad-s"><p class="eyebrow">Next</p><h2 class="h3">' + nt.t + '</h2><p class="small">' + nt.why + (chMins(nt.ch.id) ? ' About ' + chMins(nt.ch.id) + ' minutes.' : '') + '</p></div>' +
    '<div class="acts"><a class="btn navy" href="#/will/c/' + nt.ci + '/' + nt.si + '">Continue to ' + esc(nt.ch.id === 'review' ? 'Review' : nt.ch.title) + ic('next') + '</a><a class="btn quiet" href="#/home">Back to Dashboard</a></div>'), { focus: true });
}
function dView(open) {
  if (S.will.status === 'none') { location.replace('#/will'); return null; }
  var edit = canEdit();
  return shell('will', 'My Will', page('<header class="pg-h"><div class="stack"><h1 class="h1">My Will</h1><p class="p">' + esc([S.will.d.first, S.will.d.middle, S.will.d.last].filter(Boolean).join(' ')) + '</p></div></header>' +
    '<div class="cols"><div class="col">' + parts(open, edit) + '</div><aside class="rail"><section class="card pad-s"><h2 class="panel-t">Status</h2>' + willChip() +
    (edit ? '' : '<p class="small">Editing reopens after review.</p>') +
    (canPrint() ? '<button type="button" class="btn navy block noprint" data-act="print">' + ic('print') + 'Print basic Will</button>' : '') + '<a class="btn out block noprint" href="#/documents">All documents</a></section></aside></div>'), { sub: 'view' });
}
function dSubmitted() {
  return shell('will', 'My Will', centerCard('<span class="ico green round">' + ic('check', 26) + '</span><h1 class="h1">Your Will is submitted</h1><p class="p">A scholar reviews it next. We’ll email you when anything changes.</p>' +
    '<div class="acts"><a class="btn navy" href="#/home">Back to Dashboard' + ic('next') + '</a>' + (canPrint() ? '<a class="btn out" href="#/will/view">' + ic('print') + 'View and print my Will</a>' : '') + '</div>'), { sub: 'status' });
}
R.will = function (a) {
  if (a[0] === 'c') return dWizard(+a[1] || 0, +a[2] || 0);
  if (a[0] === 'done') return dDone(+a[1] || 0);
  if (a[0] === 'submitted') return dSubmitted();
  if (a[0] === 'view') { var h = dView(a[1]); if (a[1]) setTimeout(function () { var el = document.getElementById('part-' + (a[1] === 'trusted' ? 'executor' : a[1])); if (el) el.scrollIntoView({ block: 'center' }); }, 0); return h; }
  return dWill();
};

/* ================= Signing and checkout ================= */
R.sign = function (a) {
  if (S.will.status !== 'ready') { location.replace('#/will'); return null; }
  if (a[0] === 'home') return shell('will', 'Signing', page('<header class="pg-h"><div class="stack"><p class="eyebrow">Sign at home</p><h1 class="h1">Three steps to finish</h1></div></header>' +
    '<div class="g3">' + [['1', 'Print your Will', 'Use the print button below.'], ['2', 'Sign with both witnesses present', 'All three of you sign the same copy.'], ['3', 'Confirm here', 'Then your Will shows as completed.']].map(function (s) { return '<section class="card"><span class="ico navy round"><b>' + s[0] + '</b></span><h2 class="h3">' + s[1] + '</h2><p class="p">' + s[2] + '</p></section>'; }).join('') + '</div>' +
    '<div class="acts"><a class="btn out" href="#/sign" style="min-width:0">' + ic('back') + 'Back</a><span class="sp"></span><a class="btn out" href="#/will/view">' + ic('print') + 'Print my Will</a><button type="button" class="btn navy" data-act="askSigned">I’ve signed my Will' + ic('next') + '</button></div>'), { sub: 'status' });
  var p = price('notary');
  return shell('will', 'Signing', page('<header class="pg-h"><div class="stack"><h1 class="h1">How would you like to sign?</h1><p class="p">Both make your Will complete. One is included, one is a paid service.</p></div></header>' +
    '<div class="g2"><section class="card hero"><div class="row"><span class="ico">' + ic('house', 24) + '</span><span class="chip c-green">Included · no payment</span></div><h2 class="h2">Sign at home</h2><p class="p">Print your Will and sign it with your two witnesses.</p>' +
    '<div class="tick">' + ic('check') + 'Print it yourself</div><div class="tick">' + ic('check') + 'Sign with both witnesses present</div><div class="tick">' + ic('check') + 'Confirm here when done</div><span class="grow"></span><a class="btn out" href="#/sign/home">Sign at home' + ic('next') + '</a></section>' +
    (CFG.products.notary ? '<section class="card hero navy"><div class="row"><span class="ico" style="background:rgba(200,168,104,.16);color:var(--gold)">' + ic('stamp', 24) + '</span><span class="chip c-ondark">Paid service</span></div><h2 class="h2">Notarized Attestation</h2><p class="p">Sign on Zoom with your attorney and both witnesses.</p>' + termLink('attestation') +
      '<div class="tick" style="color:#FBF8F3">' + ic('check') + p.text + '</div><div class="tick" style="color:#FBF8F3">' + ic('check') + 'You pay on the next screen</div><div class="tick" style="color:#FBF8F3">' + ic('check') + esc(CFG.rules.attestNextStep) + '</div><span class="grow"></span><a class="btn gold" href="#/pay/notary">Choose Notarized' + ic('next') + '</a></section>' : '') + '</div>'), { sub: 'status' });
};
R.pay = function (a) {
  var k = a[0], pr = CFG.pricing[k]; if (!pr) { location.replace('#/home'); return null; }
  if (k === 'vault' && S.vault.active) { location.replace('#/vault'); return null; }
  if (k === 'notary' && S.will.status !== 'ready') { location.replace('#/will'); return null; }
  var p = price(k), line = k === 'vault' ? 'One secure place for your estate details.' : 'Sign on Zoom with your attorney and both witnesses.';
  return shell(k === 'vault' ? 'vault' : 'will', 'Checkout', page('<header class="pg-h"><h1 class="h1">Checkout</h1></header><div class="cols"><form class="card" data-act-submit="pay" data-k="' + k + '"><h2 class="h3">Card details</h2><div class="group">' +
    '<label class="field" style="grid-column:1/-1"><span class="label">Name on card</span><input class="input" autocomplete="cc-name"></label>' +
    '<label class="field" style="grid-column:1/-1"><span class="label">Card number</span><input class="input" inputmode="numeric" autocomplete="cc-number" placeholder="1234 5678 9012 3456"></label>' +
    '<label class="field"><span class="label">Expiry</span><input class="input" inputmode="numeric" autocomplete="cc-exp" placeholder="MM / YY"></label><label class="field"><span class="label">CVC</span><input class="input" inputmode="numeric" autocomplete="cc-csc" placeholder="123"></label></div>' +
    '<div class="acts"><a class="btn out" href="' + (k === 'vault' ? '#/vault' : '#/sign') + '" style="min-width:0">' + ic('back') + 'Back</a><span class="sp"></span><button class="btn navy" type="submit">' + (p.known ? 'Pay ' + p.text.split(' / ')[0] : 'Pay') + ic('next') + '</button></div>' +
    '<p class="small">Prototype: no card is charged.</p></form>' +
    '<aside class="rail"><section class="card pad-s tint"><h2 class="panel-t">Your order</h2><div class="kv"><span class="strong">' + esc(pr.name) + '</span><b>' + (p.known ? p.text : '[Price from API]') + '</b></div><p class="p">' + line + '</p>' + (pr.period ? '<p class="small">Billed each ' + pr.period + '.</p>' : '') + '</section>' + LEGAL + '</aside></div>'));
};
R.paid = function (a) {
  var v = a[0] === 'vault';
  return shell(v ? 'vault' : 'will', v ? 'My Vault' : 'Signing', centerCard('<span class="ico green round">' + ic('check', 26) + '</span><h1 class="h1">' + (v ? 'My Vault is active' : 'Payment received') + '</h1><p class="p">' + (v ? 'Start with what you know. Add the rest later.' : esc(CFG.rules.attestNextStep)) + '</p>' +
    '<div class="acts">' + (v ? '<a class="btn navy" href="#/vault">Open My Vault' + ic('next') + '</a><a class="btn quiet" href="#/home">Back to Dashboard</a>' : '<a class="btn navy" href="#/attest">Upload photo IDs' + ic('next') + '</a><a class="btn quiet" href="#/home">Back to Dashboard</a>') + '</div>'));
};

/* ================= My Vault ================= */
function discoveryBody() {
  var p = price('vault');
  return '<section class="vband two"><div class="stack lg"><p class="eyebrow">My Vault</p><h1 class="h1">Keep the rest of your estate organized.</h1><p class="p">Store important details your family may need later — in one secure place.</p>' +
    '<p class="h3" style="color:var(--parch)">' + (p.known ? p.text : '[Price from API]') + '</p><a class="btn gold" href="' + (S.signedIn ? '#/pay/vault' : '#/account') + '">Start My Vault' + ic('next') + '</a></div><div class="art-v" role="img" aria-label="A vault door"></div></section>' +
    '<div class="g4">' + CFG.vaultModules.map(function (m) { return '<section class="card pad-s"><span class="ico navy">' + ic(MOD_IC[m.id]) + '</span><h2 class="h3">' + m.name + '</h2><p class="p">' + m.desc + '</p></section>'; }).join('') + '</div>';
}
R['vault-entry'] = function () {
  if (S.signedIn) { location.replace('#/vault'); return null; }
  return '<div class="pub dsk">' + pubTop('<a class="btn out sm" href="#/signin">Sign in</a>') + '<main class="pg" style="padding-top:8px">' + discoveryBody() + '</main></div>';
};
function dModule(m) {
  var items = S.vault[m.id], types = ['All'].concat(m.types), shown = items.map(function (x, i) { return { x: x, i: i }; }).filter(function (r) { return UI.filter === 'All' || r.x.type === UI.filter; });
  var art = /^[aeiou]/.test(m.one) ? 'an ' : 'a ';
  return shell('vault', 'My Vault', page('<header class="pg-h"><div class="stack"><a class="iconbtn" href="#/vault">' + ic('back') + 'My Vault</a><h1 class="h1">' + m.name + '</h1><p class="p">' + m.desc + '</p></div>' +
    '<button type="button" class="btn navy" data-act="addItem" data-m="' + m.id + '">' + ic('plus') + 'Add ' + art + m.one + '</button></header>' +
    (items.length ? '<div class="filters" role="group" aria-label="Filter">' + types.map(function (t) { return '<button type="button" data-act="filter" data-v="' + t + '" aria-pressed="' + (UI.filter === t) + '">' + t + '</button>'; }).join('') + '</div>' +
      (shown.length ? '<table class="tbl"><thead><tr><th>Name</th><th>Type</th>' + (m.amount ? '<th class="r">Amount</th>' : '') + '<th class="r"></th></tr></thead><tbody>' + shown.map(function (r) {
        return '<tr><td class="t">' + esc(r.x.name) + '</td><td>' + esc(r.x.type) + '</td>' + (m.amount ? '<td class="r amt">' + (r.x.amount ? money(r.x.amount) : '—') + '</td>' : '') + '<td class="r"><button type="button" class="btn out sm" data-act="item" data-m="' + m.id + '" data-i="' + r.i + '">View</button></td></tr>';
      }).join('') + '</tbody></table>' : '<p class="p">Nothing under ' + esc(UI.filter) + ' yet.</p>')
      : '<section class="card hero"><h2 class="h2">Nothing added yet</h2><p class="p">Start with one. You can add more anytime.</p><button type="button" class="btn out" data-act="addItem" data-m="' + m.id + '">' + ic('plus') + 'Add ' + art + m.one + '</button></section>')), { sub: m.id });
}
R.vault = function (a) {
  if (!S.vault.active) return shell('vault', 'My Vault', page(discoveryBody()));       // never an empty dashboard for someone who doesn't own it
  var m = CFG.vaultModules.filter(function (x) { return x.id === a[0]; })[0];
  if (m) return dModule(m);
  // Same order as the current My Vault page: header with the vault artwork, plan strip, four figures, "Manage your vault".
  var st = vaultState(), v = S.vault, preview = CFG.vaultPreviewUntilComplete && S.will.status !== 'complete' && S.will.status !== 'none';
  var stat = function (icon, label, val, cap) { return '<section class="card pad-s statc"><div class="row"><span class="ico">' + ic(icon) + '</span><span class="panel-t">' + label + '</span></div><b>' + val + '</b><span class="small">' + cap + '</span></section>'; };
  return shell('vault', 'My Vault', page(
    '<section class="vband two"><div class="stack lg"><p class="eyebrow">Patriva · Secure Vault</p><h1 class="h1">My Vault<em>Everything your family will need.</em></h1>' +
    '<p class="p">Your obligations, assets, records and messages. Private until they’re needed.</p>' +
    '<div class="trust"><span>' + ic('shield', 18) + 'Encrypted &amp; private</span>' + (preview ? '<span>' + ic('lock', 18) + 'Preview · activates after attestation</span>' : '') + '<span>' + ic('clock', 18) + 'Saved automatically</span></div></div><div class="art-v" role="img" aria-label="A vault door"></div></section>' +
    '<section class="card planstrip"><div class="stack" style="gap:8px"><h2 class="panel-t">Your plan</h2><div class="acts"><span class="chip c-green">' + ic('check', 16) + 'My Vault · Active</span><span class="chip ' + (st.healthy ? 'c-green' : 'c-gold') + '">' + st.label + '</span>' + (v.reviewed ? '<span class="small">Reviewed ' + esc(v.reviewed) + '</span>' : '') + '</div></div>' +
    '<div class="acts"><a class="btn quiet" href="#/family">People with access</a><a class="btn out" href="#/plan">' + ic('plus') + 'Add to your plan</a></div></section>' +
    '<div class="g4">' + stat('house', 'Estate value', CFG.currency + ' ' + money(sum(v.assets)).slice(1), 'across all assets') + stat('scale', 'Obligations', CFG.currency + ' ' + money(sum(v.obl)).slice(1), 'settled before distribution') + stat('lock', 'Sealed documents', v.sealed.length, 'released on your trigger') + stat('pen', 'Final messages', v.words.length, 'letters, video and audio') + '</div>' +
    '<h2 class="h3">Manage your vault</h2><div class="g2">' + CFG.vaultModules.map(function (x) {
      var n = v[x.id].length, tot = x.amount && n ? ' · ' + CFG.currency + ' ' + money(sum(v[x.id])).slice(1) : '';
      return '<section class="card mod"><span class="ico navy" style="width:56px;height:56px">' + ic(MOD_IC[x.id], 26) + '</span><h3 class="h2">' + x.name + '</h3><p class="p">' + x.desc + '</p>' +
        '<div class="modfoot"><span class="strong">' + (n ? n + ' added' + tot : 'Not started') + '</span><span class="acts"><button type="button" class="btn quiet" data-act="addItem" data-m="' + x.id + '">' + ic('plus', 18) + 'Add</button><a class="btn out sm" href="#/vault/' + x.id + '">Open' + ic('next', 18) + '</a></span></div></section>';
    }).join('') + '</div>' + bandFor()));
};

/* ================= Add to your plan (was "Add a package") ================= */
R.plan = function () {
  var w = S.will.status;
  return shell('profile', 'Your plan', page('<header class="pg-h"><div class="stack"><h1 class="h1">Add to your plan</h1><p class="p">Your Will stays free. Add a service only if you want it. Nothing is replaced.</p></div></header>' +
    '<div class="g3">' + CFG.packages.map(function (k) {
      var pr = k.pricing ? CFG.pricing[k.pricing] : null, p = k.pricing ? price(k.pricing) : null, cta, chip = '';
      if (k.id === 'will') { chip = willChip(); cta = w === 'none' ? '<button type="button" class="btn navy" data-act="startWill">Start my Will' + ic('next') + '</button>' : '<a class="btn out" href="#/will">Open my Will</a>'; }
      else if (k.id === 'vault') { chip = S.vault.active ? '<span class="chip c-green">' + ic('check', 16) + 'Active</span>' : ''; cta = S.vault.active ? '<a class="btn out" href="#/vault">Open My Vault</a>' : '<a class="btn navy" href="#/pay/vault">' + ic('plus') + 'Add My Vault</a>'; }
      else { chip = S.will.signing === 'notary' ? '<span class="chip c-gold">' + (w === 'complete' ? 'Completed' : 'Being arranged') + '</span>' : ''; cta = S.will.signing === 'notary' ? '' : w === 'ready' ? '<a class="btn navy" href="#/sign">Choose at signing' + ic('next') + '</a>' : '<p class="small">Offered when your Will is ready to sign.</p>'; }
      return '<section class="card hero pkg"><div class="row between"><h2 class="h2">' + k.name + '</h2>' + chip + '</div><p class="p">' + k.line + '</p><span class="grow"></span>' +
        '<p class="pkg-price">' + (p ? (p.known ? p.text : '[Price from API]') + (pr && pr.was ? ' <s>' + money(pr.was) + '</s>' : '') + (pr && !pr.period ? ' <small>one-time</small>' : '') : 'Free') + '</p>' + cta + '</section>';
    }).join('') + '</div><p class="small">Prices come from the API. The Muslim Will is a limited scope document generation service. It is not a law firm and does not provide legal advice.</p>'));
};

/* ================= Family & access (people entered once, reused everywhere) ================= */
R.family = function () {
  var d = S.will.d, rows = [], seen = {};
  function add(name, rel, role) { var k = norm(name); if (!k) return; if (seen[k]) { if (role) seen[k].roles.push(role); return; } rows.push(seen[k] = { name: name, rel: rel, roles: role ? [role] : [] }); }
  people().forEach(function (p) { add(p.name, p.rel + (p.adult ? '' : ' · under 18')); });
  if (d.exec && d.exec.src) add(who(d.exec), d.exec.rel || '—', 'Executor');
  if (hasMinor() && d.guard && d.guard.src) add(who(d.guard), d.guard.rel || '—', 'Guardian');
  (d.w || []).forEach(function (w, i) { add(((w.first || '') + ' ' + (w.last || '')).trim(), '—', 'Witness ' + (i + 1)); });
  var inv = function (name) { return S.invited.some(function (x) { return norm(x.name) === norm(name); }); };
  return shell('family', 'Family &amp; access', page('<header class="pg-h"><div class="stack"><h1 class="h1">Family &amp; access</h1><p class="p">Everyone in your plan. Entered once, used everywhere.</p></div>' +
    '<button type="button" class="btn navy" data-act="invite">' + ic('plus') + 'Invite family</button></header>' +
    (rows.length ? '<table class="tbl"><thead><tr><th>Name</th><th>Relationship</th><th>Role in your plan</th><th class="r">Access</th></tr></thead><tbody>' + rows.map(function (r) {
      return '<tr><td class="t">' + esc(r.name) + '</td><td>' + esc(r.rel) + '</td><td>' + (r.roles.length ? r.roles.map(function (x) { return '<span class="chip c-navy" style="margin-right:6px">' + x + '</span>'; }).join('') : '—') + '</td>' +
        '<td class="r">' + (inv(r.name) ? '<span class="chip c-green">' + ic('check', 16) + 'Invited</span>' : /under 18/.test(r.rel) ? '—' : '<button type="button" class="btn out sm" data-act="inviteFor" data-v="' + esc(r.name) + '">Invite</button>') + '</td></tr>';
    }).join('') + '</tbody></table>'
      : '<section class="card hero"><h2 class="h2">No one added yet</h2><p class="p">People you add in your Will appear here.</p><button type="button" class="btn navy" data-act="startWill">' + (S.will.status === 'none' ? 'Start my Will' : 'Continue my Will') + ic('next') + '</button></section>') +
    '<section class="stack"><h2 class="h3">People with access</h2>' + (S.invited.length ? '<table class="tbl"><thead><tr><th>Name</th><th>Email</th><th>Status</th><th class="r"></th></tr></thead><tbody>' + S.invited.map(function (p, i) {
      return '<tr><td class="t">' + esc(p.name) + '</td><td>' + esc(p.email) + '</td><td><span class="chip c-gold">Invited</span></td><td class="r">' + removeBtn('rmInvite', i, p.name) + '</td></tr>';
    }).join('') + '</tbody></table>' : '<p class="p">No one invited yet. They see nothing until you choose what to share.</p>') + '</section>'));
};
A.inviteFor = function (el) { S.draft = { name: el.dataset.v }; A.invite({ dataset: { keep: '1' } }); };

/* ================= Documents ================= */
R.documents = function () {
  var w = S.will.status, rows = '<tr><td class="t">Islamic Will</td><td>' + willChip() + '</td><td class="r"><div class="acts" style="justify-content:flex-end">' +
    (w === 'none' ? '<button type="button" class="btn navy sm" data-act="startWill">Start my Will</button>' : '<a class="btn out sm" href="#/will/view">View</a>' + (canPrint() ? '<a class="btn out sm" href="#/will/view">' + ic('print', 18) + 'Print</a>' : '')) + '</div></td></tr>';
  if (w === 'complete') rows += '<tr><td class="t">Signed copy</td><td>' + (S.signedFile ? '<span class="chip c-green">' + ic('check', 16) + 'Uploaded</span> <span class="small">' + esc(S.signedFile) + '</span>' : '<span class="chip c-grey">Not uploaded</span>') + '</td>' +
    '<td class="r"><label class="btn out sm" style="margin-left:auto;cursor:pointer"><input type="file" id="signed-up" accept=".pdf,image/*" hidden>' + (S.signedFile ? 'Replace' : 'Upload') + '</label></td></tr>';
  if (S.will.signing === 'notary') rows += '<tr><td class="t">Notarized Attestation</td><td><span class="chip c-gold">' + (w === 'complete' ? 'Completed' : 'Being arranged') + '</span></td><td class="r">—</td></tr>';
  return shell('documents', 'Documents', page('<header class="pg-h"><div class="stack"><h1 class="h1">Documents</h1><p class="p">Your Will and anything attached to it.</p></div></header>' +
    '<table class="tbl"><thead><tr><th>Document</th><th>Status</th><th class="r"></th></tr></thead><tbody>' + rows + '</tbody></table>' +
    (S.vault.active ? '<p class="p">Vault documents live in <a href="#/vault/sealed">Sealed Documents</a>.</p>' : '')));
};
document.addEventListener('change', function (e) { if (e.target.id === 'signed-up' && e.target.files[0]) { S.signedFile = e.target.files[0].name; save(); render(); } });   // only the file name is kept

/* ================= Profile (the current site's five tabs) ================= */
var PTABS = [['personal', 'Personal'], ['security', 'Security'], ['plan', 'My Plan'], ['billing', 'Billing &amp; Payments'], ['family-plan', 'Family Plan']];
R.profile = function (a) {
  var tab = PTABS.some(function (t) { return t[0] === a[0]; }) ? a[0] : 'personal', d = S.will.d, body, v = S.vault.active;
  var paid = (v ? [['My Vault', price('vault').text]] : []).concat(S.will.signing === 'notary' ? [['Notarized Attestation', price('notary').known ? price('notary').text : '[Price from API]']] : []);
  if (tab === 'personal') body = '<section class="card"><div class="row between"><h2 class="h3">Personal details</h2><button type="button" class="btn out sm" data-act="editMe">' + ic('pen', 18) + 'Edit details</button></div><div class="kv2">' +
    [['Full name', [d.first, d.middle, d.last].filter(Boolean).join(' ') || S.user.name], ['Preferred name', d.preferred], ['Email', S.user.email], ['Phone', fmtPhone(d.phone)], ['Date of birth', fmtDob(d.dob)], ['Province', d.province]].map(function (x) { return '<div class="kv"><span>' + x[0] + '</span><b>' + esc(x[1] || '—') + '</b></div>'; }).join('') + '</div></section>';
  else if (tab === 'security') body = '<div class="list">' +
    '<div class="li"><span class="g"><span class="t">Email</span><br><span class="s">' + esc(S.user.email) + '</span></span><button type="button" class="btn out sm" data-act="chEmail">Change email</button></div>' +
    '<div class="li"><span class="g"><span class="t">Password</span><br><span class="s">Set when you created your account</span></span><button type="button" class="btn out sm" data-act="chPw">Change password</button></div>' +
    [['sec.tfa', 'Two-factor authentication', 'An extra check when you sign in'], ['sec.keep', 'Keep me signed in', 'On this device']].map(function (x) { var on = !!get(x[0]); return '<div class="li"><span class="g"><span class="t" id="l-' + x[0] + '">' + x[1] + '</span><br><span class="s">' + x[2] + ' · ' + (on ? 'On' : 'Off') + '</span></span><button type="button" class="switch" role="switch" aria-checked="' + on + '" aria-labelledby="l-' + x[0] + '" data-act="toggle" data-p="' + x[0] + '"></button></div>'; }).join('') + '</div>';
  else if (tab === 'plan') body = '<table class="tbl"><thead><tr><th>Service</th><th>Status</th><th>Price</th><th class="r"></th></tr></thead><tbody>' +
    '<tr><td class="t">Islamic Will</td><td>' + willChip() + '</td><td>Free</td><td class="r"><a class="btn out sm" href="#/will">Open</a></td></tr>' +
    '<tr><td class="t">My Vault</td><td>' + (v ? '<span class="chip c-green">' + ic('check', 16) + 'Active</span>' : '<span class="chip c-grey">Not added</span>') + '</td><td>' + (price('vault').known ? price('vault').text : '[Price from API]') + '</td><td class="r"><a class="btn out sm" href="#/vault">' + (v ? 'Open' : 'See how it works') + '</a></td></tr>' +
    (S.will.signing === 'notary' ? '<tr><td class="t">Notarized Attestation</td><td><span class="chip c-gold">' + (S.will.status === 'complete' ? 'Completed' : 'Being arranged') + '</span></td><td>' + (price('notary').known ? price('notary').text : '[Price from API]') + '</td><td class="r">—</td></tr>' : '') + '</tbody></table>' + '<div class="acts"><a class="btn out" href="#/plan">' + ic('plus') + 'Add to your plan</a></div>';
  else if (tab === 'billing') body = paid.length ? '<table class="tbl"><thead><tr><th>Payment</th><th>Amount</th><th>Date</th><th class="r"></th></tr></thead><tbody>' + paid.map(function (x) { return '<tr><td class="t">' + x[0] + '</td><td>' + x[1] + '</td><td>Today</td><td class="r"><button type="button" class="btn out sm" data-act="receipt" data-v="' + x[0] + '">Receipt</button></td></tr>'; }).join('') + '</tbody></table>'
    : '<section class="card hero"><h2 class="h2">No payments yet</h2><p class="p">Your Islamic Will is free. Payments appear here only if you add a paid service.</p></section>';
  else body = '<section class="card hero"><span class="chip c-grey">Price and availability come from config</span><h2 class="h2">Family Plan</h2><p class="p">Cover My Vault for family members. You pay; their information stays private from you.</p></section>';
  return shell('profile', 'My Profile', page('<header class="pg-h"><div class="row"><span class="avatar" style="width:64px;height:64px;font-size:22px">' + esc((S.user.name || firstName()).split(/\s+/).map(function (x) { return x[0]; }).slice(0, 2).join('').toUpperCase()) + '</span><div class="stack" style="gap:2px"><h1 class="h1">' + esc(S.user.name || firstName()) + '</h1><p class="p">' + esc(S.user.email) + '</p></div></div></header>' +
    '<nav class="tabs-d" aria-label="Profile sections">' + PTABS.map(function (t) { return '<a href="#/profile/' + t[0] + '"' + (t[0] === tab ? ' aria-current="page"' : '') + '>' + t[1] + '</a>'; }).join('') + '</nav>' + body));
};
A.toggle = function (el) { set(el.dataset.p, !get(el.dataset.p)); save(); render(); };
A.editMe = function (el) {
  sheet('<h2 class="h2">Edit details</h2>' + inp('First name', 'will.d.first') + inp('Last name', 'will.d.last') + inp('Preferred name', 'will.d.preferred', { opt: true }) + inp('Phone', 'will.d.phone', { type: 'tel', hint: 'Canadian number.' }) +
    '<button type="button" class="btn navy" data-act="saveMe">Save</button><button type="button" class="btn quiet" data-act="close">Cancel</button>');
};
A.saveMe = function () {
  E = {}; need('will.d.first', 'Enter your first name.'); need('will.d.last', 'Enter your last name.');
  if (S.will.d.phone && !caPhone(S.will.d.phone)) E['will.d.phone'] = 'Enter a 10-digit Canadian number, like 416 555 0123.';
  if (Object.keys(E).length) { A.editMe(); E = {}; return; }
  S.user.name = (S.will.d.first + ' ' + S.will.d.last).trim(); save(); closeSheet(); render(); toast('Details saved');
};
A.chEmail = function () { S.draft = S.draft && S.draft.keep ? S.draft : {}; sheet('<h2 class="h2">Change email</h2>' + inp('New email', 'draft.email', { type: 'email' }) + '<button type="button" class="btn navy" data-act="saveEmail">Save</button><button type="button" class="btn quiet" data-act="close">Cancel</button>'); };
A.saveEmail = function () {
  if (!validEmail(S.draft.email)) { E['draft.email'] = 'Enter a valid email, like name@example.com.'; S.draft.keep = 1; A.chEmail(); E = {}; return; }
  S.user.email = S.draft.email.trim(); delete S.draft; save(); closeSheet(); render(); toast('Email changed');
};
A.chPw = function () {
  sheet('<h2 class="h2">Change password</h2><label class="field"><span class="label">Current password</span><input class="input" id="pw0" type="password" autocomplete="current-password"></label>' +
    '<label class="field"><span class="label">New password</span><input class="input' + (E.pw ? ' bad' : '') + '" id="pw" type="password" autocomplete="new-password"><span class="hint">At least 8 characters.</span>' + err('pw') + '</label>' +
    '<button type="button" class="btn navy" data-act="savePw">Save</button><button type="button" class="btn quiet" data-act="close">Cancel</button>');
};
A.savePw = function () {
  if (document.getElementById('pw').value.length < 8) { E.pw = 'Use at least 8 characters.'; A.chPw(); E = {}; return; }
  sheet('<span class="ico green round">' + ic('check', 24) + '</span><h2 class="h2">Password updated</h2><button type="button" class="btn navy" data-act="close">Done</button>');
};
A.receipt = function (el) { sheet('<h2 class="h2">Receipt</h2><div class="kv"><span>Service</span><b>' + esc(el.dataset.v) + '</b></div><div class="kv"><span>Paid by</span><b>' + esc(S.user.name) + '</b></div><p class="small">Prototype: the real receipt downloads as a PDF.</p><button type="button" class="btn navy" data-act="close">Done</button>'); };
