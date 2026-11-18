/* Core: state, helpers, router, bottom sheet, prototype controls. No screen markup lives here. */
'use strict';
var CFG = window.MW_CONFIG;
var KEY = 'mw-revamp-v1';
var E = {};                 // field errors for the screen being shown: path → message
var R = {};                 // routes: name → function(args) returning HTML
var A = {};                 // actions: name → function(element)
var UI = { filter: 'All', open: null };   // throwaway view state

function fresh() {
  return {
    entry: 'will',           // 'will' (free Will funnel) | 'vault' (My Vault entry) | 'direct' (opened the app with no campaign)
    signedIn: false, toured: false,
    user: { name: '', email: '' },
    will: { status: 'none', ch: 0, sec: 0, done: [], action: false, signing: null, d: { children: [], siblings: [], was: [], w: [{}, {}] } },
    vault: { active: false, obl: [], assets: [], sealed: [], words: [], reviewed: null },
    invited: [],
    calc: { sons: 0, daughters: 0 }      // answers from the value journey; reused in the Will so nothing is asked twice
  };
}
function load() { try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.will && s.vault) return s; } catch (e) {} return fresh(); }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
var S = load();
if (!S.calc) S.calc = { sons: 0, daughters: 0 };

/* ---------- helpers ---------- */
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function get(p) { return p.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, S); }
function set(p, v) {
  var ks = p.split('.'), o = S;
  for (var i = 0; i < ks.length - 1; i++) { if (o[ks[i]] == null) o[ks[i]] = /^\d+$/.test(ks[i + 1]) ? [] : {}; o = o[ks[i]]; }
  o[ks[ks.length - 1]] = v;
}
function go(h) { if (location.hash === h) render(); else location.hash = h; }
function firstName() { return (S.will.d.preferred || S.will.d.first || S.user.name || '').trim().split(' ')[0] || 'there'; }
function money(n) { return '$' + Number(n).toLocaleString('en-CA', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }); }
function price(k) {
  var p = CFG.pricing[k];
  if (!p || p.amount == null) return { known: false, text: 'Price confirmed at checkout' };
  return { known: true, text: money(p.amount) + ' ' + CFG.currency + (p.period ? ' / ' + p.period : '') };
}
function age(d) {
  if (!d || !d.y || !d.m || !d.d) return null;
  var t = new Date(), a = t.getFullYear() - d.y;
  if (t.getMonth() + 1 < d.m || (t.getMonth() + 1 === +d.m && t.getDate() < d.d)) a--;
  return a;
}
var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function fmtDob(d) { return d && d.y ? d.d + ' ' + MONTHS[d.m - 1] + ' ' + d.y : ''; }
function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v || ''); }
// Canadian numbers only: 10 digits, optional leading 1, area code and exchange start 2–9.
function caPhone(v) { var d = String(v || '').replace(/\D/g, ''); if (d.length === 11 && d[0] === '1') d = d.slice(1); return /^[2-9]\d{2}[2-9]\d{6}$/.test(d) ? d : null; }
function fmtPhone(v) { var d = caPhone(v); return d ? '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6) : (v || ''); }
function norm(s) { return String(s || '').trim().toLowerCase().replace(/\s+/g, ' '); }


/* Islamic shares for the common family shapes (spouse, children, parents).
   PROTOTYPE STAND-IN: in the product these numbers come from the API's inheritance table and a scholar confirms them.
   Anything this simple version cannot place is shown as "Other relatives", never guessed. */
function shares(o) {
  var kids = o.sons + o.daughters, r = [], sp = 0;
  function add(n, f) { if (f > 0.0001) r.push({ n: n, f: f }); }
  function total() { return r.reduce(function (t, x) { return t + x.f; }, 0); }
  if (o.married) { sp = o.sex === 'Female' ? (kids ? 1 / 4 : 1 / 2) : (kids ? 1 / 8 : 1 / 4); add(o.sex === 'Female' ? 'Husband' : 'Wife', sp); }
  if (kids) {
    if (o.mother) add('Mother', 1 / 6);
    if (o.father) add('Father', 1 / 6);
    if (o.sons) {
      var unit = Math.max(0, 1 - total()) / (o.sons * 2 + o.daughters);
      add(o.sons > 1 ? 'Sons (' + o.sons + ')' : 'Son', unit * 2 * o.sons);
      add(o.daughters > 1 ? 'Daughters (' + o.daughters + ')' : 'Daughter', unit * o.daughters);
    } else {
      add(o.daughters > 1 ? 'Daughters (' + o.daughters + ')' : 'Daughter', o.daughters === 1 ? 1 / 2 : 2 / 3);
      var t = total();
      if (t > 1) r.forEach(function (x) { x.f = x.f / t; });                       // shares exceed the estate: reduce all in proportion
      else if (t < 1) { var fa = r.filter(function (x) { return x.n === 'Father'; })[0]; if (fa) fa.f += 1 - t; else add('Other relatives', 1 - t); }
    }
  } else if (o.mother && o.father) { add('Mother', (1 - sp) / 3); add('Father', (1 - sp) * 2 / 3); }
  else if (o.mother) { add('Mother', 1 / 3); add('Other relatives', 1 - sp - 1 / 3); }
  else if (o.father) add('Father', 1 - sp);
  else add('Other relatives', 1 - sp);
  return r;
}
function pct(f) { return Math.round(f * 1000) / 10; }
function sharesList(list, suffix) {
  return list.map(function (h) { return '<div class="share"><div class="row between"><span class="strong">' + h.n + '</span><span class="strong">' + pct(h.f) + '%' + (suffix || '') + '</span></div><div class="bar" aria-hidden="true"><i style="width:' + pct(h.f) + '%"></i></div></div>'; }).join('');
}

/* ---------- icons (inline stroke SVG, never emoji) ---------- */
var IC = {
  back: '<path d="M15 6l-6 6 6 6"/>', next: '<path d="M5 12h14M13 6l6 6-6 6"/>', chev: '<path d="M9 6l6 6-6 6"/>', down: '<path d="M6 9l6 6 6-6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01"/>',
  home: '<path d="M3 10.5l9-7 9 7V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  will: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  vault: '<rect x="3" y="4.5" width="18" height="14" rx="2"/><circle cx="12" cy="11.5" r="2.6"/><path d="M7 18.5V20M17 18.5V20"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4.5 4-6.5 8-6.5s7.2 2 8 6.5"/>',
  people: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c.6-3.4 3-5.3 6-5.3s5.4 1.9 6 5.3"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 14.6c2.4.2 4 1.8 4.5 4.4"/>',
  shield: '<path d="M12 3l7.5 3v5.5c0 4.8-3.3 8.4-7.5 9.5-4.2-1.1-7.5-4.7-7.5-9.5V6z"/>',
  scale: '<path d="M12 4v16M8 20h8M4 8h16"/><path d="M6.5 8l-3 6a3.2 3.2 0 0 0 6 0zM17.5 8l-3 6a3.2 3.2 0 0 0 6 0z"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
  lock: '<rect x="4" y="10.5" width="16" height="10.5" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', print: '<path d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="7" y="14" width="10" height="7"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5M12 16.5h.01"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/>', stamp: '<path d="M8 14c0-2 1.5-3 1.5-5a2.5 2.5 0 0 1 5 0c0 2 1.5 3 1.5 5"/><rect x="4" y="14" width="16" height="4" rx="1"/><path d="M5 21h14"/>',
  house: '<path d="M4 11l8-6 8 6v9H4z"/><path d="M10 20v-5h4v5"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>'
};
function ic(n, s) { return '<svg width="' + (s || 22) + '" height="' + (s || 22) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[n] + '</svg>'; }

/* ---------- form pieces ---------- */
function err(p) { return E[p] ? '<span class="err" id="e-' + p + '">' + ic('alert', 18) + '<span>' + esc(E[p]) + '</span></span>' : ''; }
function aria(p) { return E[p] ? ' aria-invalid="true" aria-describedby="e-' + p + '"' : ''; }
function inp(label, p, o) {
  o = o || {};
  return '<label class="field"><span class="label">' + label + (o.opt ? '<i>Optional</i>' : '') + '</span>' +
    '<input class="input' + (E[p] ? ' bad' : '') + '" data-f="' + p + '" type="' + (o.type || 'text') + '" value="' + esc(get(p) || '') + '"' +
    (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + (o.mode ? ' inputmode="' + o.mode + '"' : '') + (o.ac ? ' autocomplete="' + o.ac + '"' : '') + aria(p) + '>' +
    (o.hint ? '<span class="hint">' + o.hint + '</span>' : '') + err(p) + '</label>';
}
function sel(label, p, list, o) {
  o = o || {}; var v = get(p) || '';
  return '<label class="field"><span class="label">' + label + (o.opt ? '<i>Optional</i>' : '') + '</span><select class="input' + (E[p] ? ' bad' : '') + '" data-f="' + p + '"' + (o.re ? ' data-re' : '') + aria(p) + '>' +
    '<option value="">' + (o.ph || 'Select') + '</option>' + list.map(function (x) { return '<option' + (x === v ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select>' + err(p) + '</label>';
}
// Date of birth as three pickers: no keyboard needed, no ambiguous formats.
function dob(label, p) {
  var v = get(p) || {}, y = new Date().getFullYear(), ys = [], ds = [], i;
  for (i = y; i >= y - 105; i--) ys.push(i);
  for (i = 1; i <= 31; i++) ds.push(i);
  function s(k, name, list, show) { return '<select class="input' + (E[p] ? ' bad' : '') + '" data-f="' + p + '.' + k + '" data-num aria-label="' + name + '"><option value="">' + name + '</option>' + list.map(function (x, n) { var val = show ? n + 1 : x; return '<option value="' + val + '"' + (+v[k] === val ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select>'; }
  return '<fieldset class="field" style="border:0;padding:0"><legend class="label" style="padding:0;margin-bottom:8px">' + label + '</legend><div class="three">' + s('d', 'Day', ds) + s('m', 'Month', MONTHS, true) + s('y', 'Year', ys) + '</div>' + err(p) + '</fieldset>';
}
function opt(label, p, v, sub) {
  var on = get(p) === v;
  return '<button type="button" class="opt' + (on ? ' on' : '') + '" role="radio" aria-checked="' + on + '" data-act="pick" data-p="' + p + '" data-v="' + esc(v) + '"><span class="radio"></span><span>' + label + (sub ? '<small>' + sub + '</small>' : '') + '</span></button>';
}
function need(p, msg) { if (!String(get(p) || '').trim()) { E[p] = msg; return false; } return true; }

/* ---------- bottom sheet ---------- */
var lastFocus = null;
function sheet(html) {
  closeSheet(); lastFocus = document.activeElement;
  var b = document.createElement('div'); b.className = 'sheet-back'; b.id = 'sheet';
  b.innerHTML = '<div class="sheet" role="dialog" aria-modal="true">' + html + '</div>';
  document.body.appendChild(b);
  var f = b.querySelector('input,select,textarea,button'); if (f) f.focus();
}
function closeSheet() { var b = document.getElementById('sheet'); if (b) { b.remove(); if (lastFocus && document.contains(lastFocus)) lastFocus.focus(); } }
A.close = closeSheet;

/* ---------- shared chrome ---------- */
function nav(cur) {
  var t = [['home', 'Home', 'home'], ['will', 'Will', 'will'], ['vault', 'Vault', 'vault'], ['profile', 'Profile', 'user']];
  return '<nav class="nav" aria-label="Main"><span class="brand">The Muslim Will<small>A PRODUCT OF PATRIVA</small></span>' + t.map(function (x) { return '<a href="#/' + x[0] + '"' + (cur === x[0] ? ' aria-current="page"' : '') + '>' + ic(x[2], 24) + x[1] + '</a>'; }).join('') + '</nav>';
}
function backBtn(h, label) { return '<a class="iconbtn" href="' + h + '">' + ic('back') + (label || 'Back') + '</a>'; }
function helpBtn() { return '<button type="button" class="iconbtn end" data-act="help">' + ic('help') + 'Get help</button>'; }

A.help = function () {
  sheet('<h2 class="h2">Get help</h2>' +
    '<details class="acc"><summary>Can I stop and come back?' + ic('down') + '</summary><div class="in"><p class="p">Yes. Your answers save as you go.</p></div></details>' +
    '<details class="acc"><summary>Do I have to pay?' + ic('down') + '</summary><div class="in"><p class="p">No. Creating and printing your basic Will is free.</p></div></details>' +
    '<details class="acc"><summary>Who reviews my Will?' + ic('down') + '</summary><div class="in"><p class="p">A scholar, then a legal check. We tell you if anything is needed.</p></div></details>' +
    '<p class="small">' + (CFG.support.email ? 'Email ' + esc(CFG.support.email) : '[Support contact comes from config]') + '</p>' +
    '<button type="button" class="btn out" data-act="close">Close</button>');
};
A.legal = function (el) {
  var which = el.dataset.v === 'privacy' ? 'Privacy Policy' : 'Terms of Use';
  sheet('<h2 class="h2">' + which + '</h2><p class="p">[' + which + ' text from legal]</p><button type="button" class="btn out" data-act="close">Close</button>');
};
A.pick = function (el) { set(el.dataset.p, el.dataset.v); delete E[el.dataset.p]; save(); render(); };

/* ---------- router ---------- */
function start() {
  if (S.signedIn) return '#/home';
  return S.entry === 'vault' ? '#/vault-entry' : S.entry === 'direct' ? '#/tour/0' : '#/start/0';
}
function render() {
  var parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean), name = parts[0];
  if (!name || !R[name]) { location.replace(start()); return; }
  var open = ['start', 'tour', 'account', 'signin', 'vault-entry'];
  if (!S.signedIn && open.indexOf(name) < 0) { location.replace(start()); return; }
  var html = R[name](parts.slice(1));
  if (html == null) return;                       // the route redirected
  document.getElementById('app').innerHTML = html;
  var bad = document.querySelector('.input.bad'); if (bad) bad.focus();
}
window.addEventListener('hashchange', function () { E = {}; UI.filter = 'All'; closeSheet(); render(); window.scrollTo(0, 0); });

document.addEventListener('click', function (e) {
  var a = e.target.closest('[data-act]');
  if (a && A[a.dataset.act]) { if (a.tagName !== 'INPUT') e.preventDefault(); A[a.dataset.act](a); return; }
  if (e.target.id === 'sheet') closeSheet();
});
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeSheet(); document.getElementById('demo').hidden = true; } });
function onField(e) {
  var el = e.target, p = el.dataset && el.dataset.f; if (!p) return;
  var v = el.type === 'checkbox' ? el.checked : el.value;
  if (el.dataset.num != null) v = v === '' ? '' : Number(v);
  set(p, v); save();
  var root = p.replace(/\.(d|m|y)$/, '');
  if (E[p] || E[root]) { delete E[p]; delete E[root]; if (e.type === 'change') render(); }
  else if (el.dataset.re != null && e.type === 'change') render();
}
document.addEventListener('input', onField);
document.addEventListener('change', onField);

/* ---------- prototype controls (outside the product) ---------- */
function sample(over) {
  var s = fresh();
  s.signedIn = true; s.toured = true; s.user = { name: 'Amany Reda', email: 'amany@example.com' };
  s.will.d = {
    first: 'Amany', middle: '', last: 'Reda', preferred: '', sex: 'Female', dob: { d: 12, m: 4, y: 1974 }, email: 'amany@example.com', phone: '4165550123',
    province: 'Ontario', citizenship: 'Canada', married: 'yes', spouseFirst: 'Omar', spouseLast: 'Hassan',
    children: [{ name: 'Layla Hassan', kind: 'Daughter', minor: true }, { name: 'Yusuf Hassan', kind: 'Son', minor: false }], father: 'no', mother: 'yes', siblings: [{ name: 'Mona Reda' }],
    exec: { src: 'spouse' }, guard: { src: 'sib:0' },
    was: [{ name: 'Local masjid fund', type: 'Charity', pct: 5 }],
    w: [{ first: 'Hana', last: 'Aziz', dob: { d: 3, m: 9, y: 1980 }, email: 'hana@example.com', addr: '12 King St, Toronto' }, { first: 'Karim', last: 'Aziz', dob: { d: 21, m: 1, y: 1978 }, email: 'karim@example.com', same: true }]
  };
  over(s); S = s; save(); document.getElementById('demo').hidden = true; go('#/home');
}
function allDone(s) { s.will.done = CFG.chapters.map(function (c) { return c.id; }); }
var DEMO = {
  'e-will': function () { S = fresh(); save(); go('#/start/0'); },
  'e-vault': function () { S = fresh(); S.entry = 'vault'; save(); go('#/vault-entry'); },
  'e-direct': function () { S = fresh(); S.entry = 'direct'; save(); go('#/tour/0'); },
  'w-none': function () { sample(function (s) { s.will.d = fresh().will.d; s.will.d.first = 'Amany'; s.will.d.last = 'Reda'; s.will.d.email = s.user.email; }); },
  'w-progress': function () { sample(function (s) { s.will.status = 'progress'; s.will.done = ['about']; s.will.ch = 1; s.will.sec = 0; s.will.d.exec = {}; s.will.d.guard = {}; s.will.d.was = []; s.will.d.w = [{}, {}]; }); },
  'w-scholar': function () { sample(function (s) { allDone(s); s.will.status = 'scholar'; }); },
  'w-action': function () { sample(function (s) { allDone(s); s.will.status = 'scholar'; s.will.action = true; }); },
  'w-legal': function () { sample(function (s) { allDone(s); s.will.status = 'legal'; }); },
  'w-ready': function () { sample(function (s) { allDone(s); s.will.status = 'ready'; }); },
  'w-complete': function () { sample(function (s) { allDone(s); s.will.status = 'complete'; s.will.signing = 'home'; }); },
  'v-empty': function () { sample(function (s) { allDone(s); s.will.status = 'complete'; s.vault.active = true; }); },
  'v-part': function () { sample(function (s) { allDone(s); s.will.status = 'complete'; s.vault.active = true; s.vault.assets = [{ name: 'Family home', type: 'Property', amount: 820000 }, { name: 'Savings account', type: 'Account', amount: 46000 }]; s.vault.obl = [{ name: 'Car loan', type: 'Loan', amount: 12400 }]; }); },
  'v-healthy': function () { sample(function (s) { allDone(s); s.will.status = 'complete'; s.vault.active = true; s.vault.reviewed = 'today'; s.invited = [{ name: 'Omar Hassan', email: 'omar@example.com' }]; s.vault.assets = [{ name: 'Family home', type: 'Property', amount: 820000 }, { name: 'Toyota Sienna', type: 'Vehicle', amount: 28000 }, { name: 'Savings account', type: 'Account', amount: 46000 }]; s.vault.obl = [{ name: 'Car loan', type: 'Loan', amount: 12400 }, { name: 'Zakat owed', type: 'Religious', amount: 900 }]; s.vault.sealed = [{ name: 'Where the deeds are kept', type: 'Note' }]; s.vault.words = [{ name: 'A letter to Layla', type: 'Letter' }]; }); },
  'v-only': function () { sample(function (s) { s.entry = 'vault'; s.will.d = fresh().will.d; s.will.d.first = 'Amany'; s.will.d.last = 'Reda'; s.vault.active = true; s.vault.assets = [{ name: 'Family home', type: 'Property', amount: 820000 }]; }); },
  'next': function () {
    var order = ['submitted', 'scholar', 'legal', 'ready'], i = order.indexOf(S.will.status);
    if (i >= 0 && i < 3) { S.will.status = order[i + 1]; S.will.action = false; }
    else if (S.will.status === 'attest') S.will.status = 'complete';
    save(); render();
  }
};
document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-demo]'); if (b) { DEMO[b.dataset.demo](); return; }
  if (e.target.closest('#demo-toggle')) document.getElementById('demo').hidden = false;
  if (e.target.closest('#demo-x')) document.getElementById('demo').hidden = true;
});

/* Sample Vaults for the prototype presets, in the full item shape the desktop Vault uses. */
function demoVault(s, level) {
  var v = s.vault; v.active = true;
  v.assets = [{ cat: 'Real estate', name: 'Family home · Oakville, ON', amount: 820000, cur: 'CAD', country: 'Canada', own: 'joint', type: 'Real estate' }];
  if (level === 'one') return;
  v.assets.push({ cat: 'Registered plans', kindOf: 'RRSP', name: 'RRSP · Wealthsimple', amount: 42000, cur: 'CAD', country: 'Canada', own: 'alone', ben: level === 'full' ? 'yes' : 'unsure', benName: level === 'full' ? 'Omar Hassan' : '', type: 'Registered plans' });
  v.obl = [{ kind: 'bank', name: 'Car loan · TD Auto Finance', amount: 12400, started: '2023-05-01', type: 'Loan' }];
  if (level !== 'full') return;
  v.assets.push({ cat: 'Bank accounts', name: 'Chequing and savings · RBC', amount: 46000, cur: 'CAD', country: 'Canada', own: 'alone', type: 'Bank accounts' },
    { cat: 'Real estate', name: 'Apartment · Alexandria, Egypt', amount: 95000, cur: 'CAD', country: 'Egypt', own: 'alone', docs: 'Title documents in Arabic', type: 'Real estate' },
    { cat: 'Vehicles', name: 'Toyota Sienna', amount: 28000, cur: 'CAD', country: 'Canada', own: 'alone', type: 'Vehicles' },
    { cat: 'Held in trust (amanah)', name: 'Mother’s gold bangles', amount: null, benName: 'Mother', country: 'Canada', type: 'Held in trust (amanah)' });
  v.obl.push({ kind: 'zakat', sub: '1446 AH', name: 'Zakat for 1446 AH', amount: 900, type: 'Religious' }, { kind: 'person', name: 'Mona Reda', amount: 2000, notes: 'Interest-free loan, 2024', type: 'Other' });
  v.sealed = [{ name: 'Where the deeds are kept', file: 'deeds-note.pdf', trigger: 'either', to: ['Omar Hassan'], type: 'Document' }];
  v.words = [{ name: 'For Layla, on her 18th birthday', kind: 'video', rec: true, trigger: 'date', date: '2032-06-04', before: 'Deliver on the date anyway', to: ['Layla Hassan'], type: 'Video' }];
  v.reviewed = 'today'; v.fallback = 'Oct 12, 2026';
  s.invited = [{ name: 'Omar Hassan', rel: 'Spouse', email: 'omar@example.com', phone: '4165550142', told: true }, { name: 'Layla Hassan', rel: 'Child', email: 'layla@example.com', phone: '4165550177', dob: '2014-06-04' }];
}
DEMO['v-part'] = function () { sample(function (s) { allDone(s); s.will.status = 'complete'; demoVault(s, 'part'); }); };
DEMO['v-healthy'] = function () { sample(function (s) { allDone(s); s.will.status = 'complete'; demoVault(s, 'full'); }); };
DEMO['v-only'] = function () { sample(function (s) { s.entry = 'vault'; s.will.d = fresh().will.d; s.will.d.first = 'Amany'; s.will.d.last = 'Reda'; demoVault(s, 'one'); }); };

/* Legal and religious terms, explained on request in one or two plain sentences. [link text, title, explanation] */
var TERMS = {
  executor: ['What is an executor?', 'Executor', 'The person who carries out your Will. They pay what you owe, then share your estate the way you wrote it.'],
  guardian: ['What is a guardian?', 'Guardian', 'The adult who would care for your children under 18 if both parents have passed away.'],
  wasiyyah: ['What is a Wasiyyah?', 'Wasiyyah', 'A bequest. You may leave up to one third of your estate to charity, or to people who are not already your heirs.'],
  witness: ['Why do I need witnesses?', 'Witnesses', 'Two adults watch you sign your Will and sign it too. That is what makes it valid. They cannot be people who inherit from it.'],
  attestation: ['What is attestation?', 'Notarized Attestation', 'A guided Zoom session where you, your attorney and both witnesses sign together. A legal representative checks everyone’s photo ID.'],
  scholar: ['What is Scholar Review?', 'Scholar Review', 'A scholar checks that your Will follows Islamic inheritance rules before you sign it.'],
  legal: ['What is Conformity Review?', 'Conformity Review', 'A check that your Will meets the legal requirements of your province.'],
  beneficiary: ['What is a beneficiary?', 'Beneficiary', 'The person named on a plan or policy to receive it directly. It usually passes to them outside your Will.']
};
var TERM_OF = { executor: 'executor', guardian: 'guardian', wasiyyah: 'wasiyyah', witness1: 'witness', witness2: 'witness' };
function termLink(k) { var t = TERMS[k]; return t ? '<button type="button" class="termlink" data-act="term" data-v="' + k + '">' + ic('help', 18) + t[0] + '</button>' : ''; }
A.term = function (el) { var t = TERMS[el.dataset.v]; sheet('<h2 class="h2">' + t[1] + '</h2><p class="p">' + t[2] + '</p><button type="button" class="btn navy" data-act="close">Got it</button>'); };
// Compact reassurance after an action: "Did that work?" should never be a question.
function toast(msg) {
  var t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.innerHTML = ic('check', 20) + '<span>' + esc(msg) + '</span>'; t.className = 'show';
  clearTimeout(toast.timer); toast.timer = setTimeout(function () { t.className = ''; }, 3500);
}
DEMO['w-late'] = function () { sample(function (s) { s.will.status = 'progress'; s.will.done = ['about', 'family', 'trusted', 'wasiyyah']; s.will.d.w = [{}, {}]; }); };
