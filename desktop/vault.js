/* My Vault — desktop. Built from the client's ten "new pages" (Handover 1–10), in the Muslim Will design system.
   1 Dashboard · 2 Guided wizard · 3–6 the four sections and their Add forms · 7 Trusted People · 8 Reminders · 9 Release settings · 10 Export and close.
   Everything reads and writes S.vault, so the phone prototype sees the same items. */
'use strict';

/* ---------- schema (would come from the API) ---------- */
var ASSET_CATS = ['Real estate', 'Bank accounts', 'Registered plans', 'Pensions', 'Investments', 'Insurance', 'Benefits the estate can claim', 'Business', 'Vehicles', 'Valuables', 'Digital assets', 'Money owed to you', 'Held in trust (amanah)', 'Miscellaneous'];
var AMANAH = 'Held in trust (amanah)', BEN_CATS = ['Registered plans', 'Pensions', 'Insurance'];
var CAT_NOTE = { 'Registered plans': 'Named beneficiaries pass outside probate', 'Valuables': 'Counts toward zakat', 'Held in trust (amanah)': 'Returned to the owner, never counted in your estate' };
var LEGACY_CAT = { Property: 'Real estate', Vehicle: 'Vehicles', Account: 'Bank accounts', Other: 'Miscellaneous' };
var OBL_KINDS = [['bank', 'Debt to a bank or company', 'Loans, credit cards, mortgage', 'Bank debt'], ['person', 'Debt to a person', 'Family, friends, a business partner', 'Owed to a person'], ['mahr', 'Mahr', 'Deferred or unpaid', 'Mahr'], ['zakat', 'Zakat owed', 'Recorded by year', 'Religious due'], ['misc', 'Miscellaneous', 'Fidya, kaffarah, hajj badal, qard hasan', 'Religious due']];
var OBL_GROUPS = [['Debts', 'Paid first, after funeral costs', ['bank', 'person']], ['Mahr', '', ['mahr']], ['Zakat owed', 'By year, not one lump sum', ['zakat']], ['Miscellaneous obligations', 'Fidya, kaffarah, hajj badal, qard hasan', ['misc']]];
var TRIG = { death: 'On death', incap: 'On incapacity', either: 'Death or incapacity', date: 'On a date', event: 'On a life event' };
var TRIG_HINT = { death: 'After a death certificate is verified', incap: 'After a hospital letter is verified', either: 'Whichever is verified first', date: 'A birthday, an anniversary', event: 'Graduation, nikah, first child' };
var CURRENCIES = ['CAD', 'USD', 'EGP', 'PKR', 'Other'];
var REMINDERS = [['ready', 'Readiness nudges', 'Every two weeks until your Vault is ready', 'Email'], ['yearly', 'Yearly Vault review', 'Check values and recipients once a year', 'Email + SMS'], ['zakat', 'Ramadan and zakat', 'Before Ramadan and on your zakat date', 'Email'], ['dates', 'Renewal and expiry dates', 'Mortgage, insurance and investment dates you saved', 'Email'], ['milestone', 'Milestone dates', 'Before a scheduled message is delivered', 'Email'], ['life', 'Life events', 'After a marriage, birth or move', 'Email'], ['offers', 'Offers and price changes', 'We tell you before any offer or price ends', 'Email', true], ['security', 'Payment and security alerts', 'Failed payments, card expiry, recipient or trigger changes', 'Email + SMS', true]];
var G_OBL = [['mortgage', 'Mortgage', 'On your home or another property', 'bank'], ['car', 'Car finance', 'A car you are still paying for', 'bank'], ['loan', 'Personal or student loan', 'From a bank or lender', 'bank'], ['card', 'Credit card balance', 'Any card with money owed', 'bank'], ['mahr', 'Unpaid mahr', 'Owed to your wife', 'mahr'], ['zakat', 'Unpaid zakat or kaffarah', 'Religious dues not yet paid', 'zakat'], ['family', 'Money owed to family or friends', 'Personal debts, however small', 'person'], ['other', 'Something else', 'Taxes, bills or other obligations', 'bank']];
var G_ASSET = [['home', 'Home or property in Canada', 'Your home, a rental, land', 'Real estate'], ['abroad', 'Property abroad', 'Land or a home outside Canada', 'Real estate'], ['bank', 'Bank accounts', 'Chequing, savings', 'Bank accounts'], ['invest', 'Investments and registered plans', 'RRSP, TFSA, FHSA, stocks', 'Registered plans'], ['vehicle', 'Vehicles', 'Cars and other vehicles', 'Vehicles'], ['business', 'A business or share in one', 'Shares, a partnership', 'Business'], ['gold', 'Gold, jewellery and valuables', 'Items of value at home', 'Valuables'], ['other', 'Something else', 'Money owed to you, other items', 'Miscellaneous']];
var G_DOC = [['access', 'Account access instructions', 'Where accounts are and how to reach them'], ['insurance', 'Insurance policies', 'Life, home and other policies'], ['deeds', 'Property deeds and titles', 'Ownership documents'], ['letter', 'A private letter', 'Personal wishes or guidance'], ['business', 'Business instructions', 'Who to call, what to do'], ['other', 'Something else', 'Any other document']];
IC.star = '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9l-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z"/>';
IC.grid = '<rect x="3.5" y="3.5" width="7" height="7" rx="1"/><rect x="13.5" y="3.5" width="7" height="7" rx="1"/><rect x="3.5" y="13.5" width="7" height="7" rx="1"/><rect x="13.5" y="13.5" width="7" height="7" rx="1"/>';
IC.down2 = '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 20h14"/>';
IC.video = '<rect x="3" y="6.5" width="12" height="11" rx="2"/><path d="M15 10.5l6-3v9l-6-3"/>';
IC.mic = '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>';
IC.cal = '<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>';
MOD_IC.sealed = 'mail'; MOD_IC.words = 'video';

/* ---------- data helpers ---------- */
function vinit() {
  var v = S.vault;
  if (!v.rem) v.rem = {};
  if (!v.g) v.g = { obl: {}, assets: {}, docs: {}, det: {}, msg: 'later', at: 0 };
  if (!S.invited) S.invited = [];
}
function num(v) { var n = Number(String(v == null ? '' : v).replace(/[$,\s]/g, '')); return isNaN(n) ? null : n; }
function acat(x) { return x.cat || LEGACY_CAT[x.type] || 'Miscellaneous'; }
function okind(x) { return x.kind || ({ Loan: 'bank', Religious: 'zakat', Other: 'person' })[x.type] || 'bank'; }
function cad(list) { return list.reduce(function (t, x) { return t + ((x.cur || 'CAD') === 'CAD' ? (Number(x.amount) || 0) : 0); }, 0); }
function trigOf(x) { return x.trigger || 'death'; }
function trigLabel(x) { var t = trigOf(x); return t === 'date' ? 'Milestone' + (x.date ? ' · ' + x.date : '') : t === 'event' ? 'Milestone' + (x.event ? ' · ' + x.event : '') : TRIG[t]; }
function execName() { return who(S.will.d.exec); }
function trusted() {
  var l = [], seen = {}, e = execName();
  if (e) { l.push({ name: e, rel: 'Executor · from your Will', exec: true }); seen[norm(e)] = 1; }
  S.invited.forEach(function (p, i) { if (!seen[norm(p.name)]) { seen[norm(p.name)] = 1; l.push({ name: p.name, rel: p.rel || '', i: i, email: p.email, phone: p.phone, dob: p.dob }); } });
  return l;
}
function receives(name) { return S.vault.sealed.concat(S.vault.words).filter(function (x) { return (x.to || []).some(function (n) { return norm(n) === norm(name); }); }).length; }
function needsBen(x) { return BEN_CATS.indexOf(acat(x)) >= 0 && x.ben !== 'yes' && x.ben !== 'no'; }
// What is still open, in the order a person should do it. Drives the ring, the "next item" link and Home.
function readiness() {
  var v = S.vault, t = [];
  function add(ok, text, go) { t.push({ ok: !!ok, text: text, go: go }); }
  add(v.obl.length, 'add your obligations', '#/vault/obl'); add(v.assets.length, 'add what you own', '#/vault/assets');
  add(v.sealed.length, 'add a sealed document', '#/vault/sealed'); add(v.words.length, 'record a message', '#/vault/words');
  add(S.invited.length, 'add a recipient', '#/vault/people'); add(v.fallback, 'sign the final fallback', '#/vault/release');
  var ben = v.assets.map(function (x, i) { return needsBen(x) ? i : -1; }).filter(function (i) { return i >= 0; })[0];
  // The three checks below only count once there is something to check, so an empty Vault reads 0%.
  if (ben != null) add(false, 'confirm a beneficiary', '#/vault/assets/edit/' + ben);
  var np = S.invited.filter(function (p) { return receives(p.name) && !p.phone; })[0];
  if (np) add(false, 'add a phone number for ' + np.name.split(' ')[0], '#/vault/people');
  var todo = ['obl', 'assets', 'sealed', 'words'].filter(function (k) { return v[k].some(function (x) { return x.todo; }); })[0];
  if (todo) add(false, 'finish the items you skipped', '#/vault/' + todo);
  var left = t.filter(function (x) { return !x.ok; });
  return { pct: Math.round((t.length - left.length) / t.length * 100), left: left };
}

/* ---------- shared pieces ---------- */
function seg(mode) {
  return '<nav class="seg" aria-label="How to fill your Vault"><a href="#/vault/guided"' + (mode === 'guided' ? ' aria-current="page"' : '') + '>' + ic('star', 18) + 'Guided</a><a href="#/vault"' + (mode !== 'guided' ? ' aria-current="page"' : '') + '>' + ic('grid', 18) + 'Manual</a></nav>';
}
function vpage(inner, o) { o = o || {}; o.mid = seg(o.mode); return shell('vault', 'My Vault', page(inner), o); }
function tabs(list, cur, label) { return '<nav class="vtabs" aria-label="' + label + '">' + list.map(function (t, i) { return '<a href="' + t[0] + '"' + (t[0] === cur ? ' aria-current="page"' : '') + '>' + (t[2] ? ic(t[2], 20) : '<small>' + (i + 1) + '</small>') + t[1] + '</a>'; }).join('') + '</nav>'; }
function secTabs(id) { return tabs(CFG.vaultModules.map(function (m) { return ['#/vault/' + m.id, m.name]; }), '#/vault/' + id, 'Vault sections'); }
function setTabs(id) { return tabs([['#/vault/people', 'Trusted People', 'people'], ['#/vault/release', 'Release settings', 'shield'], ['#/vault/reminders', 'Reminders', 'bell'], ['#/vault/account', 'Account and data', 'down2']], '#/vault/' + id, 'Vault settings'); }
// One header for every inner Vault page — the approved Vault identity: navy band, gold eyebrow, white title, one line, one action.
function vhead(icon, title, desc, action) { return '<header class="vhd"><a class="vback" href="#/vault">' + ic('back', 18) + 'My Vault</a><div class="vhd-row"><div class="stack"><p class="eyebrow">My Vault</p><h1 class="h1">' + title + '</h1><p class="p">' + desc + '</p></div>' + (action || '') + '</div></header>'; }
// Figures: small uppercase label, bold number, one caption (the approved stat card).
function vstat(label, val, cap, icon) { return '<div class="vstat"><span class="panel-t">' + (icon ? '<i>' + ic(icon, 16) + '</i>' : '') + label + '</span><b>' + val + '</b>' + (cap ? '<span class="small">' + cap + '</span>' : '') + '</div>'; }
function cadv(n) { return '<small>' + CFG.currency + '</small>' + money(n).slice(1); }
function tag(cls, text, icon) { return '<span class="chip ' + cls + '">' + (icon ? ic(icon, 16) : '') + text + '</span>'; }
function area(label, p, o) { o = o || {}; return '<label class="field"><span class="label">' + label + (o.opt ? '<i>Optional</i>' : '') + '</span><textarea class="input" data-f="' + p + '">' + esc(get(p) || '') + '</textarea></label>'; }
function paused() { return S.vault.paused ? '<section class="card pad-s amber noteb"><div class="row">' + ic('lock') + '<span><span class="strong">Your Vault is paused.</span> You can read everything, but not change it.</span></div><button type="button" class="btn out sm" data-act="vresume">Resume</button></section>' : ''; }
var FOOT = '<p class="small">' + ic('alert', 16) + ' Your Will decides who inherits. Your Vault helps your executor find everything.</p>';

/* ================= 1 · Dashboard ================= */
function vDash() {
  var v = S.vault, r = readiness(), e = execName(), first = r.left[0];
  var trig = {}; v.sealed.concat(v.words).forEach(function (x) { var t = trigOf(x); t = t === 'date' || t === 'event' ? 'ms' : t; trig[t] = (trig[t] || 0) + 1; });
  var status = { obl: v.obl.length, assets: v.assets.length, sealed: v.sealed.length, words: v.words.length };
  function chipFor(m) {
    var l = v[m.id], sched = l.filter(function (x) { return trigOf(x) === 'date' || trigOf(x) === 'event'; }).length;
    if (!l.length) return tag('c-grey', 'Not started');
    if (l.some(function (x) { return x.todo; }) || (m.id === 'assets' && l.some(needsBen))) return tag('c-amber', 'Needs details', 'alert');
    if (m.id === 'words' && sched) return tag('c-grey', sched + ' scheduled');
    return tag('c-green', 'Complete', 'check');
  }
  return vpage(
    // The Vault landing header: identity on the left, readiness and the next step on the right, in one navy band.
    '<section class="vhd dash"><div class="stack"><p class="eyebrow">Patriva · Secure Vault</p><h1 class="h1">My Vault</h1><p class="p">Everything important, in one secure place.</p></div>' +
    '<div class="vready"><div class="ring" style="--p:' + r.pct + '" role="img" aria-label="' + r.pct + '% ready"><b>' + r.pct + '%</b><span>Ready</span></div>' +
    '<div class="stack"><h2 class="h3">' + (r.left.length ? 'Your Vault is ' + r.pct + '% ready.' : 'Your Vault is ready.') + '</h2><p class="p">' +
    (r.left.length ? (r.left.length === 1 ? 'One thing left: ' : r.left.length === 2 ? 'Two things left: ' : 'Next: ') + r.left.slice(0, 2).map(function (x) { return x.text; }).join(', and ') + '.' : 'Everything is in place. Review it once a year.') + '</p>' +
    (first ? '<div class="acts"><a class="btn gold sm" href="#/vault/guided">' + ic('star', 18) + (S.vault.g.at ? 'Continue with guidance' : 'Finish with guidance') + '</a><a class="lnk on-dark" href="' + first.go + '">Go to the next item' + ic('next', 18) + '</a></div>' : '') + '</div></div></section>' + paused() +
    '<div class="vstats">' + vstat('Estate value', cadv(cad(v.assets.filter(function (x) { return acat(x) !== AMANAH; }))), 'across all assets', 'house') + vstat('Obligations', cadv(cad(v.obl)), 'settled before distribution', 'scale') + vstat('Sealed', v.sealed.length, 'released on your trigger', 'lock') + vstat('Final messages', v.words.length, 'voice and video', 'video') + '</div>' +
    (v.reviewed ? '' : '<section class="card pad-s amber noteb"><div class="row">' + ic('cal') + '<span><span class="strong">Yearly review due.</span> Check values and recipients once a year.</span></div><button type="button" class="btn out sm" data-act="reviewPlan">Start review</button></section>') +
    '<h2 class="sec">Manage your vault</h2><div class="g2">' + CFG.vaultModules.map(function (m) {
      return '<a class="card modlink" href="#/vault/' + m.id + '"><span class="ico navy">' + ic(MOD_IC[m.id], 26) + '</span><span class="g"><span class="h3">' + m.name + '</span><span class="small">' + m.desc + '</span><span class="row" style="gap:10px;margin-top:6px"><span class="cnt">' + status[m.id] + ' item' + (status[m.id] === 1 ? '' : 's') + '</span>' + chipFor(m) + '</span></span><span class="chev">' + ic('chev') + '</span></a>';
    }).join('') + '</div>' +
    '<div class="g2"><section class="card"><div class="row between"><h2 class="h3">Trusted People</h2><a class="lnk" href="#/vault/people">Manage</a></div>' +
    (e ? '<div class="prow"><span class="num">1</span><span class="g"><span class="strong">' + esc(e) + '</span><br><span class="small">Executor · from your Will</span></span></div>' : '<p class="p">No executor yet. You choose one in your Will.</p>') +
    '<div class="prow"><span class="ico" style="width:36px;height:36px">' + ic('shield', 18) + '</span><span class="g"><span class="strong">The Muslim Will</span><br><span class="small">Final fallback</span></span>' + (v.fallback ? tag('c-navy', 'Signed ' + esc(v.fallback)) : tag('c-amber', 'Not signed', 'alert')) + '</div>' +
    '<p class="small">' + S.invited.length + ' recipient' + (S.invited.length === 1 ? '' : 's') + ' · each one receives only what you assign</p></section>' +
    '<section class="card"><h2 class="h3">How your Vault is released</h2><p class="p">Nothing is released until our team verifies a death certificate or a hospital incapacity letter.</p>' +
    '<div class="acts">' + [['death', 'On death', 'lock'], ['incap', 'On incapacity', 'alert'], ['either', 'Either', 'shield'], ['ms', 'Milestone', 'cal']].map(function (t) { return tag(trig[t[0]] ? 'c-gold' : 'c-grey', t[1] + ' · ' + (trig[t[0]] || 0), t[2]); }).join('') + '</div>' +
    '<a class="lnk" href="#/vault/release">Release settings' + ic('next', 18) + '</a></section></div>' +
    '<section class="card"><h2 class="h3">Vault settings</h2><div class="g4">' + [['people', 'Trusted People', 'people'], ['release', 'Release settings', 'shield'], ['reminders', 'Reminders', 'bell'], ['account', 'Account and data', 'down2']].map(function (t) { return '<a class="setlink" href="#/vault/' + t[0] + '"><span class="ico">' + ic(t[2]) + '</span>' + t[1] + '<span class="chev">' + ic('chev') + '</span></a>'; }).join('') + '</div>' +
    '<div class="acts"><a class="lnk" href="#/plan">Plan and billing</a>' + (CFG.vaultPreviewUntilComplete && S.will.status !== 'complete' && S.will.status !== 'none' ? '<span class="small">' + ic('lock', 16) + ' Preview · activates after attestation</span>' : '') + '</div></section>' +
    (CFG.pricing.vault.offerEnds ? '<section class="card pad-s tint"><span class="strong">Your current offer ends on ' + esc(CFG.pricing.vault.offerEnds) + '.</span><span class="small">We always tell you before an offer ends.</span></section>' : '') + FOOT);
}

/* ================= 3–6 · Sections ================= */
function rowHtml(m, x, i, title, sub, tags, amount) {
  return '<div class="vrow"><div class="g"><span class="t">' + esc(title) + '</span>' + (sub ? '<span class="s">' + esc(sub) + '</span>' : '') + (tags ? '<span class="acts" style="gap:8px;margin-top:6px">' + tags + '</span>' : '') + '</div>' +
    (amount != null ? '<span class="amt">' + amount + '</span>' : '') + (S.vault.paused ? '' : '<a class="iconbtn end" href="#/vault/' + m.id + '/edit/' + i + '" aria-label="Edit ' + esc(title) + '">' + ic('pen', 20) + 'Edit</a>') + '</div>';
}
function amtText(x) { return x.amount == null || x.amount === '' ? null : (x.cur && x.cur !== 'CAD' ? x.cur + ' ' + money(x.amount).slice(1) : money(x.amount)); }
function groupCard(title, note, rows) { return rows ? '<section class="card"><div class="row between"><h2 class="h3">' + title + '</h2>' + (note ? '<span class="small">' + note + '</span>' : '') + '</div><div>' + rows + '</div></section>' : ''; }
function vSection(m) {
  var v = S.vault, l = v[m.id].map(function (x, i) { return { x: x, i: i }; }), art = /^[aeiou]/.test(m.one) ? 'an ' : 'a ', body = '', totals = '';
  var addBtn = v.paused ? '' : '<a class="btn navy" href="#/vault/' + m.id + '/add">' + ic('plus') + 'Add ' + art + m.one + '</a>';
  var todoTag = function (x) { return x.todo ? tag('c-amber', 'Add details', 'alert') : ''; };
  if (m.id === 'obl') {
    var by = function (ks) { return cad(v.obl.filter(function (x) { return ks.indexOf(okind(x)) >= 0; })); };
    totals = '<div class="vstats">' + vstat('Total recorded', cadv(cad(v.obl)), 'settled before distribution', 'scale') + vstat('Bank debts', cadv(by(['bank'])), 'loans, cards, mortgage') + vstat('Religious dues', cadv(by(['zakat', 'misc'])), 'zakat, fidya, kaffarah') + vstat('Owed to people', cadv(by(['person', 'mahr'])), 'family, friends, mahr') + '</div>';
    body = OBL_GROUPS.map(function (g) {
      return groupCard(g[0], g[1], l.filter(function (r) { return g[2].indexOf(okind(r.x)) >= 0; }).map(function (r) {
        var k = OBL_KINDS.filter(function (o) { return o[0] === okind(r.x); })[0];
        return rowHtml(m, r.x, r.i, r.x.name, [r.x.sub, r.x.started ? 'Since ' + r.x.started : '', r.x.notes].filter(Boolean).join(' · '), tag(k[0] === 'zakat' || k[0] === 'misc' ? 'c-gold' : 'c-navy', k[3]) + (r.x.file ? tag('c-grey', 'Proof attached') : '') + todoTag(r.x), amtText(r.x));
      }).join(''));
    }).join('');
  } else if (m.id === 'assets') {
    var own = v.assets.filter(function (x) { return acat(x) !== AMANAH; }), cats = ASSET_CATS.filter(function (c) { return v.assets.some(function (x) { return acat(x) === c; }); });
    totals = '<div class="vstats">' + vstat('Estimated estate value', cadv(cad(own)), 'across all assets', 'house') + vstat('Not in probate', cadv(cad(own.filter(function (x) { return x.ben === 'yes'; }))), 'named beneficiaries') + vstat('Abroad', cadv(cad(own.filter(function (x) { return x.country && x.country !== 'Canada'; }))), 'outside Canada') + '</div>' +
      (cats.length > 1 ? '<div class="filters" role="group" aria-label="Filter by category">' + ['All'].concat(cats).map(function (c) { return '<button type="button" data-act="filter" data-v="' + c + '" aria-pressed="' + (UI.filter === c) + '">' + c + '</button>'; }).join('') + '</div>' : '') +
      (own.some(function (x) { return x.cur && x.cur !== 'CAD'; }) ? '<p class="small">Totals add CAD values only. Other currencies are listed, not converted.</p>' : '');
    body = cats.filter(function (c) { return UI.filter === 'All' || UI.filter === c; }).map(function (c) {
      return groupCard(c, CAT_NOTE[c], l.filter(function (r) { return acat(r.x) === c; }).map(function (r) {
        var x = r.x, abroad = x.country && x.country !== 'Canada';
        var tags = (x.own === 'joint' ? tag('c-navy', 'Joint') : '') + (abroad ? tag('c-gold', 'Abroad') + tag('c-amber', 'Other country’s rules may apply', 'alert') : '') + (x.ben === 'yes' ? tag('c-green', 'Not in probate') : '') + (needsBen(x) ? tag('c-amber', 'Confirm beneficiary', 'alert') : '') + (c === AMANAH ? tag('c-gold', 'Amanah') : '') + (c === 'Money owed to you' ? tag('c-navy', 'Owed to you') : '') + todoTag(x);
        return rowHtml(m, x, r.i, x.name, [x.kindOf, x.ben === 'yes' && x.benName ? 'Beneficiary: ' + x.benName : '', x.docs].filter(Boolean).join(' · '), tags, c === AMANAH ? null : amtText(x));
      }).join(''));
    }).join('');
  } else if (m.id === 'sealed') {
    totals = '<section class="card pad-s tint noteb"><div class="row">' + ic('lock') + '<span>Each file has its own release trigger. Nobody, including our staff, can open one before a verified release.</span></div></section>';
    body = groupCard('Your sealed files', l.length + ' file' + (l.length === 1 ? '' : 's') + ' · encrypted', l.map(function (r) {
      return rowHtml(m, r.x, r.i, r.x.name, [r.x.file || (r.x.todo ? 'No file yet' : 'Note'), (r.x.to || []).length ? 'to ' + r.x.to.join(', ') : ''].filter(Boolean).join(' · '), tag('c-gold', trigLabel(r.x)) + todoTag(r.x));
    }).join(''));
  } else {
    totals = v.paused ? '' : '<section class="card recnew"><div class="stack" style="gap:4px"><h2 class="h3">Record something new</h2><p class="p">A short message, a du’a, advice for your children. Up to 10 minutes each.</p></div><div class="acts"><a class="btn out" href="#/vault/words/add/voice">' + ic('mic') + 'Record voice</a><a class="btn out" href="#/vault/words/add/video">' + ic('video') + 'Record video</a></div></section>';
    addBtn = '';
    body = groupCard('Your messages', l.length + ' recorded', l.map(function (r) {
      return rowHtml(m, r.x, r.i, r.x.name, [r.x.kind === 'video' ? 'Video' : 'Voice', (r.x.to || []).length ? 'to ' + r.x.to.join(', ') : ''].filter(Boolean).join(' · '), tag(trigOf(r.x) === 'date' || trigOf(r.x) === 'event' ? 'c-navy' : 'c-gold', trigLabel(r.x)) + todoTag(r.x));
    }).join(''));
  }
  var icon = { obl: 'scale', assets: 'house', sealed: 'mail', words: 'video' }[m.id];
  var desc = { obl: 'What you owe, to people and to Allah, so your executor can settle it first.', assets: 'Everything you own, in Canada and abroad.', sealed: 'Private files, released only to the people you choose.', words: 'Your own voice, delivered on the day you choose.' }[m.id];
  var none = { obl: 'No obligations yet', assets: 'No assets yet', sealed: 'No sealed documents yet', words: 'No messages yet' }[m.id];
  return vpage(vhead(icon, m.name, desc, l.length ? addBtn : '') + secTabs(m.id) + paused() +
    (l.length ? totals + body : (m.id === 'words' ? totals : '') + '<section class="card empty"><span class="ico">' + ic(icon, 26) + '</span><h2 class="h3">' + none + '</h2><p class="p">Start with one. You can add more anytime.</p>' + (m.id === 'words' ? '' : addBtn) + '</section>') + FOOT, { sub: m.id });
}
A.vfilter = function (el) { UI.filter = el.value; render(); };
document.addEventListener('change', function (e) { var a = e.target.dataset && e.target.dataset.actChange; if (a && A[a]) A[a](e.target); });

/* ================= 3–6 · Add / edit forms ================= */
function recipientPicker() {
  var l = trusted();
  return '<fieldset class="field" style="border:0;padding:0"><legend class="label" style="padding:0;margin-bottom:8px">Who receives it?</legend>' +
    (l.length ? '<div class="pickgrid">' + l.map(function (p, i) { var on = !!(S.draft.to || [])[i]; return '<label class="opt' + (on ? ' on' : '') + '"><input type="checkbox" data-f="draft.to.' + i + '" data-re' + (on ? ' checked' : '') + ' style="width:24px;height:24px;accent-color:#172033"><span>' + esc(p.name) + '<small>' + esc(p.rel || 'Recipient') + (p.exec || (p.email && p.phone) ? '' : ' · contact details missing') + '</small></span></label>'; }).join('') + '</div>' : '<p class="p">No trusted people yet.</p>') +
    err('draft.to') + '<a class="lnk" href="#/vault/people">' + ic('plus', 18) + 'Add someone new</a></fieldset>';
}
function trigPicker(keys, label) { return '<div class="field" role="radiogroup" aria-label="' + label + '"><span class="label">' + label + '</span><div class="pickgrid">' + keys.map(function (k) { return opt(TRIG[k], 'draft.trigger', k, TRIG_HINT[k]); }).join('') + '</div>' + err('draft.trigger') + '</div>'; }
function vForm(m, idx, preset) {
  if (S.vault.paused) { location.replace('#/vault/' + m.id); return null; }
  var edit = idx != null, key = m.id + ':' + (edit ? idx : 'new');
  if (edit && !S.vault[m.id][idx]) { location.replace('#/vault/' + m.id); return null; }
  if (!S.draft || S.draft._k !== key) {
    var src = edit ? JSON.parse(JSON.stringify(S.vault[m.id][idx])) : { cur: 'CAD', country: 'Canada', own: 'alone', kind: m.id === 'words' ? (preset || 'voice') : undefined };
    if (m.id === 'assets' && edit && !src.cat) src.cat = acat(src);
    if (m.id === 'obl' && edit && !src.kind) src.kind = okind(src);
    var names = trusted().map(function (p) { return norm(p.name); });
    src.to = names.map(function (n) { return (src.to || []).some(function (t) { return norm(t) === n; }); });
    src._k = key; S.draft = src; save();
  }
  var d = S.draft, f = '', title, lede, saveLabel = 'Save';
  if (m.id === 'obl') {
    title = edit ? 'Edit obligation' : 'Add an obligation'; lede = 'Record it once. Your executor sees it in the order they settle things.';
    f = '<div class="group" role="radiogroup" aria-label="What kind of obligation?"><span class="label">What kind of obligation?</span><div class="pickgrid">' + OBL_KINDS.map(function (k) { return opt(k[1], 'draft.kind', k[0], k[2]); }).join('') + '</div>' + err('draft.kind') + '</div>' +
      '<div class="group">' + (d.kind === 'misc' ? sel('Which one?', 'draft.sub', ['Fidya (missed fasts)', 'Kaffarah', 'Hajj badal', 'Qard hasan']) : '') + (d.kind === 'zakat' ? inp('Zakat year', 'draft.sub', { ph: 'For example 1446 AH' }) : '') +
      inp(d.kind === 'zakat' || d.kind === 'misc' ? 'Title' : 'Owed to', 'draft.name') + inp('Amount', 'draft.amount', { mode: 'decimal', hint: 'In CAD. An estimate is fine.' }) + inp('Date it started', 'draft.started', { opt: true, ph: 'YYYY-MM-DD' }) + inp('How to repay', 'draft.repay', { opt: true }) + '</div>' +
      '<div class="group">' + area('Notes for your executor', 'draft.notes', { opt: true }) + '<div class="field"><span class="label">Proof<i>Optional</i></span><div class="filebox">' + (d.file ? '<span class="strong">' + esc(d.file) + '</span>' : '<span class="small">A note, message or receipt</span>') + '<label class="btn out sm" style="cursor:pointer"><input type="file" id="vfile" hidden>' + (d.file ? 'Replace' : 'Choose a file') + '</label></div></div></div><p class="small">Religious terms follow the scholars board’s wording.</p>';
  } else if (m.id === 'assets') {
    title = edit ? 'Edit asset' : 'Add an asset'; lede = 'Rough values are fine. You can update them anytime.';
    var ben = BEN_CATS.indexOf(d.cat) >= 0, am = d.cat === AMANAH;
    f = '<div class="group">' + sel('Category', 'draft.cat', ASSET_CATS, { re: true }) + inp('Type', 'draft.kindOf', { opt: true, hint: d.cat === 'Registered plans' ? 'RRSP, RRIF, TFSA, FHSA, RESP, RDSP, LIRA, LIF' : '' }) + inp(am ? 'What is it?' : 'Name or institution', 'draft.name') +
      (am ? inp('Return it to', 'draft.benName') : inp('Approximate value', 'draft.amount', { mode: 'decimal', hint: 'Rough is fine.' }) + sel('Currency', 'draft.cur', CURRENCIES)) + sel('Country', 'draft.country', CFG.countries) + '</div>' +
      (am ? '' : '<div class="group" role="radiogroup" aria-label="Do you own it alone?"><span class="label">Do you own it alone?</span><div class="pickgrid">' + opt('Yes, alone', 'draft.own', 'alone') + opt('Jointly', 'draft.own', 'joint') + '</div></div>') +
      (ben ? '<div class="group" role="radiogroup" aria-label="Is a beneficiary named?"><span class="label">Is a beneficiary named on this?</span>' + termLink('beneficiary') + '<div class="pickgrid">' + opt('Yes', 'draft.ben', 'yes') + opt('No', 'draft.ben', 'no') + opt('I’m not sure', 'draft.ben', 'unsure') + '</div>' + err('draft.ben') + '</div>' +
        (d.ben === 'yes' ? '<div class="group">' + inp('Beneficiary’s name', 'draft.benName') + '<p class="small">' + ic('check', 16) + ' Marked not in probate. Your executor still sees it.</p></div>' : '') : '') +
      '<div class="group">' + inp('Where are the documents?', 'draft.docs', { opt: true }) + area('Notes for your executor', 'draft.notes', { opt: true }) + '</div>' +
      '<section class="card pad-s amber noteb"><div class="row">' + ic('alert') + '<span>Never put passwords or PINs here. Keep them in <a href="#/vault/sealed">Sealed Documents</a>.</span></div></section>';
  } else if (m.id === 'sealed') {
    title = edit ? 'Edit sealed document' : 'Add a sealed document'; lede = 'It stays encrypted and unopened until a verified release.'; saveLabel = 'Seal and save';
    f = '<div class="group"><div class="field"><span class="label">File</span><div class="filebox">' + (d.file ? '<span class="strong">' + esc(d.file) + '</span><span class="small">Encrypted on upload</span>' : '<span class="small">PDF, image or note</span>') + '<label class="btn out sm" style="cursor:pointer"><input type="file" id="vfile" hidden>' + (d.file ? 'Replace' : 'Choose a file') + '</label></div>' + err('draft.file') + '</div>' + inp('Title', 'draft.name') + '</div>' +
      '<div class="group">' + trigPicker(['death', 'incap', 'either'], 'When should this be released?') + '</div><div class="group">' + recipientPicker() + '</div><div class="group">' + area('Message to go with it', 'draft.note', { opt: true }) + '</div>';
  } else {
    title = (edit ? 'Edit ' : 'Add a ') + (d.kind === 'video' ? 'video' : 'voice') + ' message'; lede = 'Your own words, delivered when they matter most.'; saveLabel = 'Save message';
    var minor = trusted().filter(function (p, i) { return (d.to || [])[i] && p.dob && age({ y: +p.dob.slice(0, 4), m: +p.dob.slice(5, 7) || 1, d: +p.dob.slice(8, 10) || 1 }) < 18; })[0];
    f = '<div class="group"><div class="field"><span class="label">Recording</span><div class="filebox">' + (d.rec ? '<span class="strong">' + ic(d.kind === 'video' ? 'video' : 'mic', 18) + ' Recorded</span><span class="small">Up to 10 minutes</span>' : '<span class="small">Up to 10 minutes. Record again as often as you like.</span>') + '<button type="button" class="btn out sm" data-act="vrec">' + (d.rec ? 'Record again' : 'Record') + '</button></div>' + err('draft.rec') + '</div>' + inp('Title', 'draft.name') + '</div>' +
      '<div class="group">' + trigPicker(['death', 'incap', 'either', 'date', 'event'], 'When should it be delivered?') + '</div>' +
      (d.trigger === 'date' ? '<div class="group">' + inp('Date', 'draft.date', { ph: 'YYYY-MM-DD', hint: 'A birthday or anniversary.' }) + sel('If I pass away before then', 'draft.before', ['Deliver on the date anyway', 'Deliver once verified']) + '</div>' : '') +
      (d.trigger === 'event' ? '<div class="group">' + inp('Which life event?', 'draft.event', { ph: 'Graduation, nikah, first child' }) + '</div>' : '') +
      '<div class="group">' + recipientPicker() + (minor ? '<p class="small">' + esc(minor.name.split(' ')[0]) + ' is under 18. We deliver to their own email and phone on the day; check those details at your yearly review.</p>' : '') + '</div>';
  }
  return vpage('<a class="iconbtn" href="#/vault/' + m.id + '" data-act="vcancel" data-m="' + m.id + '">' + ic('back') + m.name + '</a><div class="cols wz"><div><div class="whead vn"><p class="eyebrow">My Vault · ' + m.name + '</p><h1 class="h1">' + title + '</h1><p class="p">' + lede + '</p></div>' +
    '<form class="wbody" data-act-submit="vsave" data-m="' + m.id + '"' + (edit ? ' data-i="' + idx + '"' : '') + ' novalidate>' + f +
    '<div class="acts">' + (edit ? '<button type="button" class="btn danger" style="min-width:0" data-act="vaskdel" data-m="' + m.id + '" data-i="' + idx + '">Remove</button>' : '') + '<span class="sp"></span><button type="button" class="btn out" style="min-width:0" data-act="vcancel" data-m="' + m.id + '">Cancel</button><button class="btn navy" type="submit">' + saveLabel + ic('next') + '</button></div></form></div>' +
    '<aside class="rail"><section class="card pad-s"><div class="tick">' + ic('lock') + 'Encrypted and private</div><div class="tick">' + ic('check') + 'Edit or remove anytime</div><button type="button" class="btn out sm" data-act="help">' + ic('help', 18) + 'Get help</button></section></aside></div>', { sub: m.id });
}
A.vcancel = function (el) { delete S.draft; save(); go('#/vault/' + el.dataset.m); };
A.vrec = function () { S.draft.rec = true; delete E['draft.rec']; save(); render(); };      // prototype: nothing is recorded
document.addEventListener('change', function (e) { if (e.target.id === 'vfile' && e.target.files[0]) { S.draft.file = e.target.files[0].name; delete E['draft.file']; save(); render(); } });   // only the file name is kept
A.vsave = function (form) {
  var mid = form.dataset.m, d = S.draft, l = S.vault[mid], t = trusted(), x; E = {};
  var to = t.filter(function (p, i) { return (d.to || [])[i]; }).map(function (p) { return p.name; }), amt = num(d.amount);
  need('draft.name', mid === 'obl' ? 'Enter who it is owed to, or a title.' : mid === 'assets' ? 'Enter a name.' : 'Enter a title.');
  if (mid === 'obl') {
    need('draft.kind', 'Choose one.'); if (d.amount === '' || d.amount == null || amt == null) E['draft.amount'] = 'Enter an amount, like 2000. An estimate is fine.';
    x = { kind: d.kind, sub: d.sub, name: d.name, amount: amt, started: d.started, repay: d.repay, notes: d.notes, file: d.file, type: d.kind === 'zakat' || d.kind === 'misc' ? 'Religious' : d.kind === 'bank' ? 'Loan' : 'Other' };
  } else if (mid === 'assets') {
    need('draft.cat', 'Choose a category.'); need('draft.country', 'Choose a country.');
    var am = d.cat === AMANAH; if (!am && (d.amount === '' || d.amount == null || amt == null)) E['draft.amount'] = 'Enter a rough value, like 42000.';
    if (BEN_CATS.indexOf(d.cat) >= 0) { need('draft.ben', 'Choose one.'); if (d.ben === 'yes') need('draft.benName', 'Enter the beneficiary’s name.'); }
    x = { cat: d.cat, kindOf: d.kindOf, name: d.name, amount: am ? null : amt, cur: d.cur || 'CAD', country: d.country, own: d.own, ben: BEN_CATS.indexOf(d.cat) >= 0 ? d.ben : undefined, benName: d.benName, docs: d.docs, notes: d.notes, type: d.cat };
  } else {
    need('draft.trigger', 'Choose when.'); if (!to.length) E['draft.to'] = 'Choose at least one person.';
    if (mid === 'sealed') { if (!d.file) E['draft.file'] = 'Choose a file.'; x = { name: d.name, file: d.file, trigger: d.trigger, to: to, note: d.note, type: 'Document' }; }
    else {
      if (!d.rec) E['draft.rec'] = 'Record your message first.';
      if (d.trigger === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(d.date || '')) E['draft.date'] = 'Enter a date like 2032-06-04.';
      if (d.trigger === 'event') need('draft.event', 'Say which event.');
      x = { name: d.name, kind: d.kind, rec: true, trigger: d.trigger, date: d.date, event: d.event, before: d.before, to: to, type: d.kind === 'video' ? 'Video' : 'Voice' };
    }
  }
  if (Object.keys(E).length) { save(); return render(); }
  if (form.dataset.i != null) { if (l[+form.dataset.i].gk) x.gk = l[+form.dataset.i].gk; l[+form.dataset.i] = x; } else l.push(x);      // keep the link to its guided step
  delete S.draft; UI.filter = 'All'; save(); go('#/vault/' + mid); toast(x.name + ' saved');
};
A.vaskdel = function (el) { sheet('<h2 class="h2">Remove this item?</h2><p class="p">It is deleted from your Vault. This can’t be undone.</p><button type="button" class="btn danger" data-act="vdel" data-m="' + el.dataset.m + '" data-i="' + el.dataset.i + '">Remove</button><button type="button" class="btn quiet" data-act="close">Keep it</button>'); };
A.vdel = function (el) { S.vault[el.dataset.m].splice(+el.dataset.i, 1); delete S.draft; save(); closeSheet(); go('#/vault/' + el.dataset.m); toast('Removed'); };

/* ================= 2 · Guided mode =================
   One small step at a time. Every item the person ticks gets its own screen, and every screen says
   where they are, why we ask, and what comes next. Each step saves a real Vault item as it goes. */
var G_SECTIONS = ['Welcome', 'Obligations', 'Estate Inventory', 'People', 'Sealed Documents', 'Messages', 'Review'];
var G_TIP = {
  welcome: 'You can stop at any step. Everything you entered stays saved.',
  oblpick: 'Debts are settled before anything is shared, so your executor needs the list.', obl: 'A rough amount is enough. You can correct it later.',
  assetpick: 'What matters is that your family knows it exists. Values can be rough.', asset: 'Never put passwords or PINs here. They belong in Sealed Documents.',
  people: 'Recipients receive only what you assign. They see nothing now.', fallback: 'This only applies if none of your executors can act.',
  docpick: 'Files stay encrypted. Nobody can open them before a verified release.', doc: 'No file at hand? Skip it. It stays on your list.',
  msg: 'Record again as often as you like. Up to 10 minutes.', msgd: 'It stays private until the moment you choose.', review: 'Nothing is shared with anyone yet.'
};
function gkey(n) { return norm(n).replace(/[^a-z0-9]+/g, '_'); }
function tiles(defs, key) { return '<div class="pickgrid">' + defs.map(function (d) { var on = !!S.vault.g[key][d[0]]; return '<button type="button" class="opt' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-act="gtog" data-k="' + key + '" data-v="' + d[0] + '"><span class="box">' + (on ? ic('check', 18) : '') + '</span><span>' + d[1] + '<small>' + d[2] + '</small></span></button>'; }).join('') + '</div>'; }
function chosen(defs, key) { return defs.filter(function (d) { return S.vault.g[key][d[0]]; }); }
// The step list is rebuilt from the answers, so ticking "Mortgage" adds a Mortgage step right after.
function gsteps() {
  var g = S.vault.g, l = [{ id: 'welcome', sec: 0, t: 'Welcome' }, { id: 'oblpick', sec: 1, t: 'What you owe' }];
  chosen(G_OBL, 'obl').forEach(function (d) { l.push({ id: 'obl', k: d[0], d: d, sec: 1, t: d[1] }); });
  l.push({ id: 'assetpick', sec: 2, t: 'What you own' });
  chosen(G_ASSET, 'assets').forEach(function (d) { l.push({ id: 'asset', k: d[0], d: d, sec: 2, t: d[1] }); });
  l.push({ id: 'people', sec: 3, t: 'Who receives things' }, { id: 'fallback', sec: 3, t: 'If no executor can act' }, { id: 'docpick', sec: 4, t: 'Private documents' });
  chosen(G_DOC, 'docs').forEach(function (d) { l.push({ id: 'doc', k: d[0], d: d, sec: 4, t: d[1] }); });
  l.push({ id: 'msg', sec: 5, t: 'A message for someone' });
  if (g.msg === 'video' || g.msg === 'audio') l.push({ id: 'msgd', sec: 5, t: 'Your message' });
  l.push({ id: 'review', sec: 6, t: 'Review' });
  return l;
}
function gitem(list, gk) { return S.vault[list].filter(function (x) { return x.gk === gk; })[0]; }
function gup(list, gk, item) { var l = S.vault[list], cur = gitem(list, gk); item.gk = gk; if (cur) l[l.indexOf(cur)] = Object.assign({}, cur, item); else l.push(item); }
function gprune(list, prefix, keep) { S.vault[list] = S.vault[list].filter(function (x) { return !x.gk || x.gk.indexOf(prefix) !== 0 || keep.indexOf(x.gk) >= 0; }); }
function gdet(k) { var g = S.vault.g; if (!g.det[k]) g.det[k] = { cur: 'CAD', own: 'alone', to: {} }; if (!g.det[k].to) g.det[k].to = {}; return g.det[k]; }
function gnames(det) { return trusted().filter(function (p) { return det.to[gkey(p.name)]; }).map(function (p) { return p.name; }); }
function gto(p) {
  var l = trusted();
  return '<div class="field"><span class="label">Who receives it?</span>' + (l.length ? '<div class="pickgrid">' + l.map(function (x) { var path = p + '.to.' + gkey(x.name), on = !!get(path); return '<button type="button" class="opt' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-act="gflag" data-p="' + path + '"><span class="box">' + (on ? ic('check', 18) : '') + '</span><span>' + esc(x.name) + '<small>' + esc(x.rel || 'Recipient') + '</small></span></button>'; }).join('') + '</div>' : '<p class="p">No one added yet. Go back one step to add people, or skip for now.</p>') + '</div>';
}
// Writes the current step into the Vault. `skipped` keeps the item on the list without its details.
function gsave(st, skipped) {
  var v = S.vault, det, amt, label;
  if (st.id === 'oblpick') gprune('obl', 'o:', chosen(G_OBL, 'obl').map(function (d) { return 'o:' + d[0]; }));
  if (st.id === 'assetpick') gprune('assets', 'a:', chosen(G_ASSET, 'assets').map(function (d) { return 'a:' + d[0]; }));
  if (st.id === 'docpick') gprune('sealed', 'd:', chosen(G_DOC, 'docs').map(function (d) { return 'd:' + d[0]; }));
  if (st.id === 'msg' && v.g.msg === 'later') gprune('words', 'm:', []);
  if (st.id === 'obl' || st.id === 'asset') {
    det = gdet(st.k); amt = skipped || det.amount === '' || det.amount == null ? null : num(det.amount); label = (det.name || '').trim() || st.d[1];
    if (st.id === 'obl') gup('obl', 'o:' + st.k, { kind: st.d[3], name: label, amount: amt, todo: amt == null, type: 'Loan' });
    else { var ben = BEN_CATS.indexOf(st.d[3]) >= 0; gup('assets', 'a:' + st.k, { cat: st.d[3], name: label, amount: amt, cur: det.cur || 'CAD', own: det.own || 'alone', country: st.k === 'abroad' ? 'Other' : 'Canada', ben: ben ? det.ben : undefined, benName: det.benName, todo: amt == null, type: st.d[3] }); }
  }
  if (st.id === 'doc') { det = gdet('d_' + st.k); var to = gnames(det); gup('sealed', 'd:' + st.k, { name: st.d[1], file: skipped ? null : det.file || null, trigger: det.trigger || 'either', to: to, todo: skipped || !det.file || !to.length, type: 'Document' }); }
  if (st.id === 'msgd') { det = gdet('m'); var to2 = gnames(det), kind = v.g.msg === 'video' ? 'video' : 'voice'; gup('words', 'm:1', { name: (det.name || '').trim() || 'My message', kind: kind, rec: !skipped && !!det.rec, trigger: det.trigger || 'death', date: det.date, to: to2, todo: skipped || !det.rec || !to2.length, type: kind === 'video' ? 'Video' : 'Voice' }); }
  save();
}
function gcheck(st) {
  E = {}; var det;
  if (st.id === 'obl' || st.id === 'asset') { det = gdet(st.k); if (det.amount !== '' && det.amount != null && num(det.amount) == null) E['vault.g.det.' + st.k + '.amount'] = 'Enter a number, like 12000, or leave it empty.'; if (st.id === 'asset' && det.ben === 'yes' && !String(det.benName || '').trim()) E['vault.g.det.' + st.k + '.benName'] = 'Enter the beneficiary’s name.'; }
  if (st.id === 'msgd') { det = gdet('m'); if (det.trigger === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(det.date || '')) E['vault.g.det.m.date'] = 'Enter a date like 2032-06-04.'; }
  return !Object.keys(E).length;
}
A.gnext = function (el) { var l = gsteps(), n = +el.dataset.n, st = l[n]; if (!gcheck(st)) return render(); gsave(st, false); if (st.k) toast(st.t + ' saved'); l = gsteps(); go('#/vault/guided/' + Math.min(l.length - 1, n + 1)); };
A.gskip = function (el) { var l = gsteps(), n = +el.dataset.n; E = {}; gsave(l[n], true); go('#/vault/guided/' + Math.min(l.length - 1, n + 1)); };
A.gtog = function (el) { var o = S.vault.g[el.dataset.k]; o[el.dataset.v] = !o[el.dataset.v]; save(); render(); };
A.gflag = function (el) { set(el.dataset.p, !get(el.dataset.p)); save(); render(); };
A.gperson = function (el) { var n = el.dataset.v, i = S.invited.map(function (p) { return norm(p.name); }).indexOf(norm(n)); if (i >= 0) S.invited.splice(i, 1); else S.invited.push({ name: n, rel: el.dataset.rel || '', email: '', phone: '', dob: '' }); save(); render(); };
A.grec = function () { gdet('m').rec = true; save(); render(); };                                  // prototype: nothing is recorded
document.addEventListener('change', function (e) { if (e.target.id === 'gfile' && e.target.files[0]) { set(e.target.dataset.p, e.target.files[0].name); save(); render(); } });

function vGuided(a) {
  if (S.vault.paused) { location.replace('#/vault'); return null; }
  var g = S.vault.g, l = gsteps();
  if (a[0] == null) { location.replace('#/vault/guided/' + Math.min(l.length - 1, g.at || 0)); return null; }
  var n = Math.max(0, Math.min(l.length - 1, +a[0] || 0)), st = l[n], base = '#/vault/guided/', body, p, det, primary = 'Continue', canSkip = n > 0 && st.id !== 'review';
  g.at = n; save();
  var same = l.filter(function (x) { return x.id === st.id; }), nth = same.indexOf(st) + 1, count = '<span class="chip c-gold" style="margin-left:10px">' + nth + ' of ' + same.length + '</span>';
  // First visit to a detail step: start from what is already in the Vault, so edits made elsewhere aren't overwritten.
  var visit = st.id + ':' + (st.k || '');
  if (UI.gvisit !== visit) {
    UI.gvisit = visit; var it = st.id === 'obl' ? gitem('obl', 'o:' + st.k) : st.id === 'asset' ? gitem('assets', 'a:' + st.k) : null;
    if (it) { det = gdet(st.k); if (it.name !== st.d[1]) det.name = it.name; det.amount = it.amount == null ? '' : it.amount; if (it.cur) det.cur = it.cur; if (it.own) det.own = it.own; if (it.ben) det.ben = it.ben; if (it.benName) det.benName = it.benName; save(); }
  }
  if (st.id === 'welcome') {
    primary = g.at0 ? 'Continue' : 'Start';
    body = '<p class="eyebrow">Bismillah · about 15 minutes</p><h1 class="h1">Let’s fill your Vault together.</h1><p class="p">One small question at a time. We’ll tell you what each one is for.</p><div class="g2">' +
      [['Obligations', 'What should be paid first.'], ['Estate Inventory', 'What you own, here and abroad.'], ['People', 'Who receives what.'], ['Sealed Documents', 'Private papers, opened only when needed.'], ['Messages', 'Words for the people you love.'], ['Review', 'Check it all, then finish.']].map(function (x, i) { return '<div class="intro"><span class="num">' + (i + 1) + '</span><span><span class="strong">' + x[0] + '</span><br><span class="small">' + x[1] + '</span></span></div>'; }).join('') + '</div>';
  } else if (st.id === 'oblpick') body = '<p class="eyebrow">Obligations</p><h1 class="h1">Is there anything to pay before your estate is shared?</h1><p class="p">Tick all that apply. We’ll ask about each one next.</p>' + tiles(G_OBL, 'obl') + '<p class="small">Nothing to add? Leave them all empty and continue.</p>';
  else if (st.id === 'obl') { p = 'vault.g.det.' + st.k; gdet(st.k); body = '<p class="eyebrow">Obligations' + count + '</p><h1 class="h1">' + st.d[1] + '</h1><p class="p">' + st.d[2] + '. Two short answers.</p><div class="group">' + inp(st.d[3] === 'zakat' ? 'What is it for?' : 'Who is it owed to?', p + '.name', { opt: true, ph: st.d[1] }) + inp('Roughly how much is left?', p + '.amount', { opt: true, mode: 'decimal', hint: 'In CAD. An estimate is fine.' }) + '</div>'; }
  else if (st.id === 'assetpick') body = '<p class="eyebrow">Estate Inventory</p><h1 class="h1">What do you own, in Canada or abroad?</h1><p class="p">Tick all that apply. We’ll ask about each one next.</p>' + tiles(G_ASSET, 'assets');
  else if (st.id === 'asset') {
    p = 'vault.g.det.' + st.k; det = gdet(st.k); var ben = BEN_CATS.indexOf(st.d[3]) >= 0;
    body = '<p class="eyebrow">Estate Inventory' + count + '</p><h1 class="h1">' + st.d[1] + '</h1><p class="p">' + st.d[2] + '.</p><div class="group">' + inp('What should we call it?', p + '.name', { opt: true, ph: st.d[1] }) + inp('Roughly what is it worth?', p + '.amount', { opt: true, mode: 'decimal', hint: 'Rough is fine.' }) + sel('Currency', p + '.cur', CURRENCIES) + '</div>' +
      '<div class="group" role="radiogroup" aria-label="Do you own it alone?"><span class="label">Do you own it alone?</span><div class="pickgrid">' + opt('Yes, alone', p + '.own', 'alone') + opt('Jointly', p + '.own', 'joint') + '</div></div>' +
      (ben ? '<div class="group" role="radiogroup" aria-label="Is a beneficiary named?"><span class="label">Is a beneficiary named on it?</span><div class="pickgrid">' + opt('Yes', p + '.ben', 'yes') + opt('No', p + '.ben', 'no') + opt('I’m not sure', p + '.ben', 'unsure', 'We’ll remind you to check') + '</div></div>' + (det.ben === 'yes' ? '<div class="group">' + inp('Beneficiary’s name', p + '.benName') + '</div>' : '') : '');
  } else if (st.id === 'people') {
    var fam = people(), others = S.invited.filter(function (x) { return !fam.some(function (f) { return norm(f.name) === norm(x.name); }); });
    body = '<p class="eyebrow">People</p><h1 class="h1">Who should receive things from your Vault?</h1><p class="p">Tick the people you’ll leave documents or messages to. Contact details can come later.</p>' +
      (fam.length ? '<div class="pickgrid">' + fam.map(function (x) { var on = S.invited.some(function (i) { return norm(i.name) === norm(x.name); }); return '<button type="button" class="opt' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-act="gperson" data-v="' + esc(x.name) + '" data-rel="' + x.rel + '"><span class="box">' + (on ? ic('check', 18) : '') + '</span><span>' + esc(x.name) + '<small>' + x.rel + ' · from your Will</small></span></button>'; }).join('') + '</div>' : '<p class="p">No family in your Will yet.</p>') +
      (others.length ? '<p class="small strong">Also added: ' + others.map(function (x) { return esc(x.name); }).join(', ') + '</p>' : '') + '<div class="acts"><button type="button" class="btn out" data-act="invite">' + ic('plus') + 'Add someone else</button></div>';
  } else if (st.id === 'fallback') {
    body = '<p class="eyebrow">People</p><h1 class="h1">If none of your executors can act</h1><p class="p">The Muslim Will can step in and appoint a lawyer for your estate. It needs your signed acceptance.</p>' +
      (execName() ? '<div class="prow"><span class="num">1</span><span class="g"><span class="strong">' + esc(execName()) + '</span><br><span class="small">Your executor · from your Will</span></span></div>' : '') +
      (S.vault.fallback ? '<div class="prow"><span class="ico green round" style="width:36px;height:36px">' + ic('check', 18) + '</span><span class="g"><span class="strong">Signed ' + esc(S.vault.fallback) + '</span></span></div>' : '<p class="small">[Wording pending legal review]</p><div class="acts"><button type="button" class="btn out" data-act="vsigned">' + ic('pen') + 'I accept and sign</button></div>');
  } else if (st.id === 'docpick') body = '<p class="eyebrow">Sealed Documents</p><h1 class="h1">What should your family open only when the time comes?</h1><p class="p">Tick what you’d like to keep here. We’ll take them one by one.</p>' + tiles(G_DOC, 'docs');
  else if (st.id === 'doc') {
    p = 'vault.g.det.d_' + st.k; det = gdet('d_' + st.k); if (!det.trigger) { det.trigger = 'either'; save(); }
    body = '<p class="eyebrow">Sealed Documents' + count + '</p><h1 class="h1">' + st.d[1] + '</h1><p class="p">' + st.d[2] + '. Three short answers.</p>' +
      '<div class="group"><div class="field"><span class="label">1. The file</span><div class="filebox">' + (det.file ? '<span class="strong">' + esc(det.file) + '</span><span class="small">Encrypted on upload</span>' : '<span class="small">PDF, photo or note</span>') + '<label class="btn out sm" style="cursor:pointer"><input type="file" id="gfile" data-p="' + p + '.file" hidden>' + (det.file ? 'Replace' : 'Choose a file') + '</label></div></div></div>' +
      '<div class="group" role="radiogroup" aria-label="When should it be released?"><span class="label">2. When should it be released?</span><div class="pickgrid">' + ['death', 'incap', 'either'].map(function (k) { return opt(TRIG[k], p + '.trigger', k, TRIG_HINT[k]); }).join('') + '</div></div>' +
      '<div class="group">' + gto(p).replace('Who receives it?', '3. Who receives it?') + '</div>';
  } else if (st.id === 'msg') body = '<p class="eyebrow">Voice &amp; Video Messages</p><h1 class="h1">Would you like to leave a message?</h1><p class="p">A few words of advice, a du’a, a story.</p><div class="pickgrid" role="radiogroup" aria-label="Message">' + opt(ic('video') + ' Record a video', 'vault.g.msg', 'video', 'Your face and voice') + opt(ic('mic') + ' Record a voice message', 'vault.g.msg', 'audio', 'Just your voice') + opt('Maybe later', 'vault.g.msg', 'later', 'We’ll keep this section open') + '</div>';
  else if (st.id === 'msgd') {
    p = 'vault.g.det.m'; det = gdet('m'); if (!det.trigger) { det.trigger = 'death'; save(); }
    body = '<p class="eyebrow">Voice &amp; Video Messages</p><h1 class="h1">Your ' + (g.msg === 'video' ? 'video' : 'voice') + ' message</h1><p class="p">Four short steps on this screen.</p>' +
      '<div class="group"><div class="field"><span class="label">1. Record</span><div class="filebox">' + (det.rec ? '<span class="strong">' + ic(g.msg === 'video' ? 'video' : 'mic', 18) + ' Recorded</span>' : '<span class="small">Up to 10 minutes</span>') + '<button type="button" class="btn out sm" data-act="grec">' + (det.rec ? 'Record again' : 'Record') + '</button></div></div>' + inp('2. Give it a title', p + '.name', { opt: true, ph: 'For Layla' }) + '</div>' +
      '<div class="group" role="radiogroup" aria-label="When should it be delivered?"><span class="label">3. When should it be delivered?</span><div class="pickgrid">' + ['death', 'incap', 'either', 'date'].map(function (k) { return opt(TRIG[k], p + '.trigger', k, TRIG_HINT[k]); }).join('') + '</div>' + (det.trigger === 'date' ? inp('Date', p + '.date', { ph: 'YYYY-MM-DD' }) : '') + '</div>' +
      '<div class="group">' + gto(p).replace('Who receives it?', '4. Who receives it?') + '</div>';
  } else {
    var v = S.vault, open = function (k) { return v[k].filter(function (x) { return x.todo; }).length; };
    var rows = [['Obligations Register', v.obl.length, open('obl'), 'oblpick'], ['Estate Inventory', v.assets.length, open('assets'), 'assetpick'], ['People', S.invited.length, 0, 'people'], ['Sealed Documents', v.sealed.length, open('sealed'), 'docpick'], ['Voice &amp; Video Messages', v.words.length, open('words'), 'msg']];
    body = '<p class="eyebrow">Review</p><h1 class="h1">MashaAllah, your Vault has taken shape.</h1><p class="p">Anything you skipped stays on your list, marked “Add details”.</p><div>' + rows.map(function (r) {
      var at = l.map(function (x) { return x.id; }).indexOf(r[3]);
      return '<div class="vrow"><div class="g"><span class="t">' + r[0] + '</span><span class="s">' + r[1] + ' added' + (r[2] ? ' · ' + r[2] + ' need details' : '') + '</span></div>' + (r[2] ? tag('c-amber', 'Add details', 'alert') : r[1] ? tag('c-green', 'Done', 'check') : tag('c-grey', 'Skipped')) + '<a class="btn out sm" href="' + base + at + '">Edit</a></div>';
    }).join('') + '</div>';
  }
  var next = l[n + 1], sec0 = function (i) { return l.map(function (x) { return x.sec; }).indexOf(i); };
  var saved = [].concat(S.vault.obl, S.vault.assets, S.vault.sealed, S.vault.words).filter(function (x) { return x.gk; });
  var rail = '<section class="card pad-s"><h2 class="panel-t">Why we ask</h2><p class="p">' + G_TIP[st.id] + '</p></section>' +
    '<section class="card pad-s"><h2 class="panel-t">Saved so far</h2>' + (saved.length ? '<ul class="check-l">' + saved.slice(-6).map(function (x) { return '<li' + (x.todo ? ' class="todo"' : '') + '>' + ic(x.todo ? 'alert' : 'check', 20) + '<span>' + esc(x.name) + '</span></li>'; }).join('') + '</ul>' + (saved.length > 6 ? '<p class="small">and ' + (saved.length - 6) + ' more</p>' : '') : '<p class="small">Your answers appear here as you go.</p>') +
    '<button type="button" class="btn out sm" data-act="help">' + ic('help', 18) + 'Get help</button></section>';
  return vpage('<section class="card pad-s gtop"><div class="row between"><span class="eyebrow">Fill your Vault · guided</span><span class="small strong">Step ' + (n + 1) + ' of ' + l.length + '</span></div><div class="bar" role="img" aria-label="Step ' + (n + 1) + ' of ' + l.length + '"><i style="width:' + Math.round((n + 1) / l.length * 100) + '%"></i></div>' +
    '<ol class="grail" aria-label="Sections">' + G_SECTIONS.map(function (t, i) { return '<li><a href="' + base + sec0(i) + '"' + (i === st.sec ? ' aria-current="step"' : '') + '><span class="num' + (i < st.sec ? ' ok' : '') + '">' + (i < st.sec ? ic('check', 16) : i + 1) + '</span>' + t + '</a></li>'; }).join('') + '</ol></section>' +
    '<div class="cols wz"><section class="card hero gbody">' + body +
    (next ? '<p class="gnext">' + ic('next', 18) + '<span><span class="strong">Next:</span> ' + esc(next.t) + '</span></p>' : '') +
    '<div class="acts">' + (n ? '<a class="btn out" style="min-width:0" href="' + base + (n - 1) + '">' + ic('back') + 'Back</a>' : '<a class="lnk" href="#/vault">I’d rather fill it in myself</a>') + '<span class="sp"></span>' +
    (n ? '<a class="btn quiet" href="#/vault">Save and exit</a>' : '') + (canSkip ? '<button type="button" class="btn quiet" data-act="gskip" data-n="' + n + '">Skip for now</button>' : '') +
    (next ? '<button type="button" class="btn navy" data-act="gnext" data-n="' + n + '">' + primary + ic('next') + '</button>' : '<a class="btn navy" href="#/vault">Finish and go to My Vault' + ic('next') + '</a>') + '</div></section>' +
    '<aside class="rail">' + rail + '</aside></div>', { mode: 'guided', saved: true });
}

/* ================= 7 · Trusted People ================= */
function fallbackRow() {
  var f = S.vault.fallback;
  return '<div class="prow"><span class="ico" style="width:36px;height:36px">' + ic('shield', 18) + '</span><span class="g"><span class="strong">The Muslim Will (final fallback)</span><br><span class="small">If no executor can act, we appoint a lawyer for your estate.</span></span>' +
    (f ? tag('c-navy', 'You signed ' + esc(f)) : tag('c-amber', 'Not signed', 'alert') + '<button type="button" class="btn out sm" data-act="vsign">Review and sign</button>') + '</div>';
}
function execCard(full) {
  var e = execName(), x = S.will.d.exec || {};
  return '<section class="card"><h2 class="h2">' + (full ? 'Executors' : 'Executor order') + '</h2><p class="p">From your Will. To change them, update your Will.</p>' +
    (e ? '<div class="prow"><span class="num">1</span><span class="g"><span class="strong">' + esc(e) + '</span><br><span class="small">' + esc([x.src === 'spouse' ? 'Spouse' : x.rel, x.email, x.phone ? fmtPhone(x.phone) : ''].filter(Boolean).join(' · ') || 'Executor') + '</span></span>' + tag('c-gold', 'From your Will') + '</div>' : '<p class="p strong">No executor yet.</p>') + fallbackRow() +
    '<div class="acts"><a class="btn out" href="' + (S.will.status === 'none' ? '#/will' : '#/will/view/executor') + '">' + (e ? 'Update executors in my Will' : 'Go to my Will') + '</a></div></section>';
}
A.vsign = function () { sheet('<h2 class="h2">Final fallback</h2><p class="p">If none of your executors can act, The Muslim Will appoints a lawyer to handle your estate. It is added to your Will at its next update.</p><p class="small">[Wording pending legal review]</p><button type="button" class="btn navy" data-act="vsigned">I accept and sign</button><button type="button" class="btn quiet" data-act="close">Not now</button>'); };
A.vsigned = function () { S.vault.fallback = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }); save(); closeSheet(); render(); toast('Signed'); };
function vPeople() {
  var rec = S.invited;
  return vpage(vhead('people', 'Trusted People', 'The people who act for you, and the people you leave things to.') + setTabs('people') + execCard(true) +
    '<section class="card"><div class="row between"><div class="stack" style="gap:4px"><h2 class="h2">Recipients</h2><p class="p">They receive only what you assign. They have no authority over your estate.</p></div><button type="button" class="btn navy" data-act="invite">' + ic('plus') + 'Add a person</button></div>' +
    (rec.length ? '<div>' + rec.map(function (p, i) {
      var n = receives(p.name), st = !p.email || !p.phone ? tag('c-amber', (!p.email ? 'Email' : 'Phone') + ' missing', 'alert') : p.told ? tag('c-gold', 'Invited') : tag('c-grey', 'Not invited yet');
      return '<div class="vrow"><div class="g"><span class="t">' + esc(p.name) + '</span><span class="s">' + esc([p.rel, p.email, p.phone ? fmtPhone(p.phone) : ''].filter(Boolean).join(' · ') || 'No contact details yet') + '</span><span class="s">Receives ' + n + ' item' + (n === 1 ? '' : 's') + '</span></div>' + st +
        '<button type="button" class="iconbtn end" data-act="vperson" data-i="' + i + '" aria-label="Edit ' + esc(p.name) + '">' + ic('pen', 20) + 'Edit</button></div>';
    }).join('') + '</div>' : '<p class="p">No recipients yet.</p>') +
    '<p class="small">' + ic('mail', 16) + ' We don’t contact recipients until something is released, unless you tell them now.</p></section>');
}
// One dialog adds or edits a recipient; it replaces the old "Invite family" sheet on desktop.
A.invite = function (el) {
  if (!el || !el.dataset || !el.dataset.keep) S.draft = { _k: 'person' };
  var d = S.draft, fam = d.i == null ? people().filter(function (x) { return !S.invited.some(function (i) { return norm(i.name) === norm(x.name); }); }) : [];
  sheet('<h2 class="h2">' + (d.i == null ? 'Add a person' : 'Edit person') + '</h2>' +
    (fam.length && !d.name ? '<div class="filters" style="margin:0;padding:0;flex-wrap:wrap">' + fam.map(function (x) { return '<button type="button" data-act="inviteUse" data-v="' + esc(x.name) + '" data-rel="' + x.rel + '">' + esc(x.name) + '</button>'; }).join('') + '</div>' : '') +
    inp('Full name', 'draft.name') + sel('Relationship', 'draft.rel', ['Spouse', 'Child', 'Parent', 'Sibling', 'Relative', 'Friend', 'Other']) + inp('Email', 'draft.email', { opt: true, type: 'email', hint: 'We send the secure invite here.' }) + inp('Mobile phone', 'draft.phone', { opt: true, type: 'tel', hint: 'For the one-time code. Canadian number.' }) + inp('Date of birth', 'draft.dob', { opt: true, ph: 'YYYY-MM-DD', hint: 'Only for children.' }) +
    '<button type="button" class="btn navy" data-act="inviteSend">Save person</button>' + (d.i != null ? '<button type="button" class="btn danger" data-act="vrmperson">Remove</button>' : '') + '<button type="button" class="btn quiet" data-act="close">Cancel</button>');
};
A.inviteUse = function (el) { S.draft.name = el.dataset.v; S.draft.rel = el.dataset.rel || ''; A.invite({ dataset: { keep: '1' } }); };
A.inviteFor = function (el) { S.draft = { _k: 'person', name: el.dataset.v }; A.invite({ dataset: { keep: '1' } }); };
A.vperson = function (el) { var p = S.invited[+el.dataset.i]; S.draft = { _k: 'person', i: +el.dataset.i, name: p.name, rel: p.rel, email: p.email, phone: p.phone, dob: p.dob }; A.invite({ dataset: { keep: '1' } }); };
A.inviteSend = function () {
  var d = S.draft; E = {}; need('draft.name', 'Enter a name.'); need('draft.rel', 'Choose one.');
  if (d.email && !validEmail(d.email)) E['draft.email'] = 'Enter a valid email, or leave it empty.';
  if (d.phone && !caPhone(d.phone)) E['draft.phone'] = 'Enter a 10-digit Canadian number, or leave it empty.';
  if (d.dob && !/^\d{4}-\d{2}-\d{2}$/.test(d.dob)) E['draft.dob'] = 'Use a date like 2017-08-21.';
  if (Object.keys(E).length) { A.invite({ dataset: { keep: '1' } }); E = {}; return; }
  var p = { name: d.name.trim(), rel: d.rel, email: (d.email || '').trim(), phone: d.phone ? caPhone(d.phone) : '', dob: d.dob || '' };
  if (d.i != null) { p.told = S.invited[d.i].told; S.invited[d.i] = p; } else S.invited.push(p);
  delete S.draft; save(); closeSheet(); render(); toast(p.name + ' saved');
};
A.vrmperson = function () { S.invited.splice(S.draft.i, 1); delete S.draft; save(); closeSheet(); render(); };

/* ================= 9 · Release settings ================= */
function vRelease() {
  var v = S.vault, trig = {}; v.sealed.concat(v.words).forEach(function (x) { var t = trigOf(x); t = t === 'date' || t === 'event' ? 'ms' : t; trig[t] = (trig[t] || 0) + 1; });
  var e = execName() ? execName().split(' ')[0] : 'Your executor';
  return vpage(vhead('shield', 'Release settings', 'How your Vault is opened when the time comes.') + setTabs('release') +
    '<section class="card"><h2 class="h2">How release works</h2><div class="g4">' + [['Someone reports', 'Your executor or a family member reports a death or incapacity.'], ['We verify', 'A death certificate, or a hospital letter confirmed with the hospital.'], ['Items are released', 'Each item goes only to its recipients, if its trigger matches.'], [esc(e) + ' takes over', 'They see your obligations and inventory to settle the estate.']].map(function (s, i) { return '<div class="stepc"><span class="panel-t">Step ' + (i + 1) + '</span><span class="strong">' + s[0] + '</span><span class="small">' + s[1] + '</span></div>'; }).join('') + '</div>' +
    '<p class="small">' + ic('clock', 16) + ' There is no waiting period. Release happens as soon as verification is complete' + (CFG.rules.releaseTurnaround ? ', usually within ' + esc(CFG.rules.releaseTurnaround) : '') + '.</p></section>' + execCard(false) +
    '<section class="card"><h2 class="h2">Triggers on your items</h2><p class="p">Each item has its own trigger. Change it on the item itself.</p><div class="acts">' + [['death', 'On death'], ['incap', 'On incapacity'], ['either', 'Death or incapacity'], ['ms', 'Milestone date']].map(function (t) { return tag(trig[t[0]] ? 'c-gold' : 'c-grey', t[1] + ' · ' + (trig[t[0]] || 0)); }).join('') + '</div>' +
    '<div class="acts"><a class="btn out sm" href="#/vault/sealed">Sealed Documents</a><a class="btn out sm" href="#/vault/words">Voice &amp; Video Messages</a></div></section>');
}

/* ================= 8 · Reminders ================= */
function vReminders() {
  var rem = S.vault.rem;
  return vpage(vhead('bell', 'Reminders', 'A few well-timed nudges. Never more than two a month.') + setTabs('reminders') +
    '<div class="list">' + REMINDERS.map(function (r) {
      var on = r[4] || rem[r[0]] !== false;
      return '<div class="li"><span class="g"><span class="t" id="rm-' + r[0] + '">' + r[1] + '</span><br><span class="s">' + r[2] + ' · ' + r[3] + '</span></span>' + (r[4] ? tag('c-grey', 'Always on', 'lock') : '<span class="small strong">' + (on ? 'On' : 'Off') + '</span><button type="button" class="switch" role="switch" aria-checked="' + on + '" aria-labelledby="rm-' + r[0] + '" data-act="vrem" data-k="' + r[0] + '"></button>') + '</div>';
    }).join('') + '</div>' +
    '<section class="card"><h2 class="h3">Where should we reach you?</h2><div class="group">' + inp('Email', 'user.email', { type: 'email' }) + inp('Mobile phone', 'will.d.phone', { type: 'tel', hint: 'Canadian number.' }) + '</div><p class="small">' + ic('check', 16) + ' Saved as you type.</p></section>');
}
A.vrem = function (el) { var r = S.vault.rem; r[el.dataset.k] = r[el.dataset.k] === false; save(); render(); toast('Reminder ' + (r[el.dataset.k] === false ? 'turned off' : 'turned on')); };

/* ================= 10 · Account and data ================= */
function vAccount() {
  var v = S.vault;
  return vpage(vhead('down2', 'Account and data', 'Your information is yours. Take a copy any time.') + setTabs('account') +
    '<section class="card"><h2 class="h2">Download a copy</h2><p class="p">A password-protected ZIP of everything in your Vault.</p><div class="group"><label class="field"><span class="label">Choose a password for the file</span><input class="input' + (E.zip ? ' bad' : '') + '" id="zip" type="password" autocomplete="new-password"><span class="hint">We can’t recover this password. Keep it safe.</span>' + err('zip') + '</label></div><div class="acts"><button type="button" class="btn navy" data-act="vexport">Prepare download</button></div></section>' +
    '<div class="g2"><section class="card"><h2 class="h2">' + (v.paused ? 'Your Vault is paused' : 'Pause instead') + '</h2><p class="p">' + (v.paused ? 'It is read-only. Your release settings stay active.' : 'Keep your Vault safe and read-only at a lower price. Release settings stay active.') + '</p><span class="grow"></span><div class="acts"><button type="button" class="btn out" data-act="' + (v.paused ? 'vresume' : 'vaskpause') + '">' + (v.paused ? 'Resume my Vault' : 'Pause my Vault') + '</button></div></section>' +
    '<section class="card"><h2 class="h2">Close my Vault</h2><p class="p">Nothing will be released. Everything is deleted after 90 days; you can reopen before then.</p><span class="grow"></span><div class="acts"><button type="button" class="btn danger" data-act="vaskclose">Close my Vault</button></div></section></div>');
}
A.vexport = function () { if (document.getElementById('zip').value.length < 8) { E.zip = 'Use at least 8 characters.'; return render(); } sheet('<span class="ico green round">' + ic('check', 24) + '</span><h2 class="h2">We’re preparing your copy</h2><p class="p">We’ll email you when it’s ready. The link works for 24 hours and needs a code sent to your phone.</p><button type="button" class="btn navy" data-act="close">Done</button>'); };
A.vaskpause = function () { sheet('<h2 class="h2">Pause your Vault?</h2><p class="p">You can read everything but not change it. Resume anytime.</p><p class="small">[Paused price from the API]</p><button type="button" class="btn navy" data-act="vpause">Pause my Vault</button><button type="button" class="btn quiet" data-act="close">Not now</button>'); };
A.vpause = function () { S.vault.paused = true; save(); closeSheet(); render(); };
A.vresume = function () { S.vault.paused = false; save(); render(); };
A.vaskclose = function () { sheet('<h2 class="h2">Close your Vault?</h2><p class="p">It stops working right away and nothing will be released. Everything is permanently deleted after 90 days.</p><button type="button" class="btn danger" data-act="vclose">Close my Vault</button><button type="button" class="btn quiet" data-act="close">Keep my Vault</button>'); };
A.vclose = function () { S.vault.active = false; S.vault.paused = false; S.vault.closed = true; save(); closeSheet(); go('#/vault'); };
A.vreopen = function () { S.vault.active = true; S.vault.closed = false; save(); render(); };

/* ================= routing: active Vault only ================= */
R.vault = function (a) {
  vinit();
  if (!S.vault.active) {
    if (a[0]) { location.replace('#/vault'); return null; }                      // no management page for someone who doesn't own it
    return shell('vault', 'My Vault', page((S.vault.closed ? '<section class="card pad-s amber noteb"><div class="row">' + ic('alert') + '<span><span class="strong">Your Vault is closed.</span> Everything is deleted after 90 days.</span></div><button type="button" class="btn out sm" data-act="vreopen">Reopen my Vault</button></section>' : '') + discoveryBody()));
  }
  var m = CFG.vaultModules.filter(function (x) { return x.id === a[0]; })[0];
  if (m) return a[1] === 'add' ? vForm(m, null, a[2]) : a[1] === 'edit' ? vForm(m, +a[2]) : vSection(m);
  if (a[0] === 'guided') return vGuided(a.slice(1));
  if (a[0] === 'people') return vPeople();
  if (a[0] === 'release') return vRelease();
  if (a[0] === 'reminders') return vReminders();
  if (a[0] === 'account') return vAccount();
  if (a[0]) { location.replace('#/vault'); return null; }
  return vDash();
};
// The old short "add" sheet is replaced by the full form on desktop.
A.addItem = function (el) { go('#/vault/' + el.dataset.m + '/add'); };
A.item = function (el) { go('#/vault/' + el.dataset.m + '/edit/' + el.dataset.i); };
