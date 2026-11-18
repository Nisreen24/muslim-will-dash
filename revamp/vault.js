/* My Vault — phone.
   The complete Vault journey, composed for a 375–430px screen in the approved mobile design language.
   The rules live in ../desktop/vault.js (item schema, readiness, validation, the guided step list, people,
   pause / close / export) and are shared by both builds; this file only decides how a phone shows them.
   Routes:  #/vault  ·  #/vault/guided/<n>  ·  #/vault/<section>  ·  …/view/<i>  ·  …/add/<step>  ·  …/edit/<i>/<step>
            #/vault/people  ·  #/vault/release  ·  #/vault/reminders  ·  #/vault/account */
'use strict';
IC.bell = IC.bell || '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 21h4"/>';

/* ---------- small pieces ---------- */
function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
function kv(k, val) { return val == null || val === '' ? '' : '<div class="kv"><span>' + k + '</span><b>' + esc(val) + '</b></div>'; }
// One header for every Vault screen: navy, gold eyebrow, one title, one line.
function mhead(o) {
  return '<header class="vhero">' + (o.back || o.right ? '<div class="row between">' + (o.back ? backBtn(o.back, o.backLabel || 'My Vault') : '<span></span>') + (o.right || '') + '</div>' : '') +
    '<p class="eyebrow">' + (o.eb || 'My Vault') + '</p><h1 class="' + (o.big ? 'h1' : 'h2') + '">' + o.h + '</h1>' + (o.p ? '<p class="p">' + o.p + '</p>' : '') + (o.extra || '') + '</header>';
}
function mnote(cls, icon, html, btn) { return '<section class="card pad-s vnote ' + cls + '"><div class="row">' + ic(icon) + '<span>' + html + '</span></div>' + (btn || '') + '</section>'; }
function mpaused() { return S.vault.paused ? mnote('amber', 'lock', '<span class="strong">Your Vault is paused.</span> You can read everything, but not change it.', '<button type="button" class="btn out sm" data-act="vresume">Resume my Vault</button>') : ''; }
var M_FOOT = '<p class="small">Your Will decides who inherits. Your Vault helps your executor find everything.</p>';
function mchip(m) {
  var l = S.vault[m.id];
  if (!l.length) return tag('c-grey', 'Not started');
  if (l.some(function (x) { return x.todo; }) || (m.id === 'assets' && l.some(needsBen))) return tag('c-amber', 'Needs details', 'alert');
  return tag('c-green', 'Complete', 'check');
}

/* ---------- next best action: one task, chosen from what is still open ---------- */
var NBA = {
  'add your obligations': ['Add what you owe.', 'Debts are settled before anything is shared.', 'Add an obligation'],
  'add what you own': ['Add your first asset.', 'So your family knows what exists.', 'Add an asset'],
  'add a sealed document': ['Seal a private document.', 'Opened only after a verified release.', 'Add a document'],
  'record a message': ['Leave a message.', 'Your own words, delivered when you choose.', 'Add a message'],
  'add a recipient': ['Choose who receives things.', 'They see nothing until a release.', 'Add a person'],
  'sign the final fallback': ['Sign the final fallback.', 'Only used if no executor can act.', 'Review and sign'],
  'confirm a beneficiary': ['Confirm a beneficiary.', 'One of your plans needs a yes or no.', 'Confirm now'],
  'finish the items you skipped': ['Finish the items you skipped.', 'They are marked “Add details”.', 'Finish now']
};
function nba() {
  vinit();
  var v = S.vault, r = readiness(), f = r.left[0], total = v.obl.length + v.assets.length + v.sealed.length + v.words.length;
  if (!f || v.paused) return null;
  if (!total && !S.invited.length && !v.fallback) return { eb: 'Set up your Vault', h: 'Let’s fill your Vault together.', p: 'One small question at a time. About 15 minutes.', cta: (v.g.at ? 'Continue' : 'Start') + ' with guidance', go: '#/vault/guided', setup: true };
  var d = NBA[f.text] || [f.text.charAt(0).toUpperCase() + f.text.slice(1) + '.', 'So they can receive what you left them.', 'Add phone number'], go = f.go;
  if (/^(add your|add what|add a sealed|record)/.test(f.text)) go += '/add';
  if (f.text === 'confirm a beneficiary') go += '/2';          // straight to the beneficiary step
  return { eb: 'Next step', h: d[0], p: d[1], cta: d[2], go: go };
}

/* ================= Not subscribed: discovery ================= */
function discovery(withNav) {
  var p = price('vault'), pr = CFG.pricing.vault;
  return mhead({ big: true, right: withNav ? '' : '<a class="iconbtn end" href="#/signin">Sign in</a>', h: 'Keep the rest of your estate organized.', p: 'Store important details your family may need later — in one secure place.' }) +
    '<main class="scr' + (withNav ? ' tabs' : '') + '">' +
    (S.vault.closed ? mnote('amber', 'alert', '<span class="strong">Your Vault is closed.</span> Everything is deleted after 90 days.', '<button type="button" class="btn out sm" data-act="vreopen">Reopen my Vault</button>') : '') +
    '<div class="list">' + CFG.vaultModules.map(function (m) { return '<div class="li"><span class="ico navy">' + ic(MOD_IC[m.id]) + '</span><span class="g"><span class="t">' + m.name + '</span><br><span class="s">' + m.desc + '</span></span></div>'; }).join('') + '</div>' +
    '<section class="card pad-s tint"><div class="row between"><span class="strong">' + esc(pr.name) + '</span><span class="tot">' + (p.known ? p.text : '[Price from API]') + '</span></div>' +
    '<p class="small">' + (pr.period ? 'Billed each ' + pr.period + '. ' : '') + 'Pause or close anytime.</p></section>' +
    '<a class="btn navy" href="' + (S.signedIn ? '#/pay/vault' : '#/account') + '">Start My Vault' + ic('next') + '</a></main>' + (withNav ? nav('vault') : '');
}

/* ================= Checkout: only after choosing Start My Vault ================= */
var pay0 = R.pay, apay0 = A.pay;
R.pay = function (a) {
  if (a[0] !== 'vault') return pay0(a);
  if (S.vault.active) { location.replace('#/vault'); return null; }
  var p = price('vault'), pr = CFG.pricing.vault;
  return '<div class="plain-hd">' + backBtn('#/vault', 'My Vault') + helpBtn() + '</div><main class="scr"><h1 class="h1">Start My Vault</h1>' +
    '<section class="card tint"><div class="row between"><span class="h3">' + esc(pr.name) + '</span><span class="strong">' + (p.known ? p.text : '[Price from API]') + '</span></div>' +
    CFG.vaultModules.map(function (m) { return '<div class="tick">' + ic('check', 20) + '<span>' + m.name + '</span></div>'; }).join('') +
    '<p class="small">' + (pr.period ? 'Billed each ' + pr.period + ' until you pause or close it. ' : '') + 'You can pause or close your Vault anytime in Vault settings, and download a copy of everything first.</p></section>' +
    '<form class="stack lg" data-act-submit="pay" data-k="vault"><div class="group">' +
    '<label class="field"><span class="label">Name on card</span><input class="input" autocomplete="cc-name"></label>' +
    '<label class="field"><span class="label">Card number</span><input class="input" inputmode="numeric" autocomplete="cc-number" placeholder="1234 5678 9012 3456"></label>' +
    '<div class="row"><label class="field grow"><span class="label">Expiry</span><input class="input" inputmode="numeric" autocomplete="cc-exp" placeholder="MM / YY"></label><label class="field grow"><span class="label">CVC</span><input class="input" inputmode="numeric" autocomplete="cc-csc" placeholder="123"></label></div></div>' +
    '<button class="btn navy" type="submit">' + (p.known ? 'Pay ' + p.text.split(' / ')[0] + ' and start' : 'Pay and start') + ic('next') + '</button></form>' +
    '<p class="small center">Prototype: no card is charged.</p>' + LEGAL + '</main>';
};
// After activation the person lands in setup, not on a "thank you" page.
A.pay = function (form) {
  if (form.dataset.k !== 'vault') return apay0(form);
  S.vault.active = true; S.vault.closed = false; S.vault.paused = false; vinit(); save();
  go('#/vault/guided/0'); toast('My Vault is active');
};

/* ================= Active Vault: home ================= */
function mHome() {
  var v = S.vault, r = readiness(), n = nba(), e = execName(), own = v.assets.filter(function (x) { return acat(x) !== AMANAH; }), card;
  if (n) card = '<section class="card"><p class="eyebrow">' + n.eb + '</p><h2 class="h2">' + n.h + '</h2><p class="p">' + n.p + '</p>' +
    (n.setup ? '' : '<div class="bar" role="img" aria-label="' + r.pct + '% ready"><i style="width:' + r.pct + '%"></i></div><p class="small">Your Vault is ' + r.pct + '% ready · ' + plural(r.left.length, 'thing') + ' left</p>') +
    '<a class="btn navy" href="' + n.go + '">' + n.cta + ic('next') + '</a>' + (n.setup ? '' : '<a class="btn quiet" href="#/vault/guided">Guide me step by step</a>') + '</section>';
  else if (v.paused) card = '';
  else card = '<section class="card tint"><span class="chip c-green">' + ic('check', 16) + 'Up to date</span><h2 class="h2">Your Vault is ready.</h2><p class="p">' + (v.reviewed ? 'Everything is in place. Review it once a year.' : 'Everything is in place. Your yearly review is due.') + '</p>' +
    (v.reviewed ? '' : '<button type="button" class="btn navy" data-act="reviewPlan">Start yearly review' + ic('next') + '</button>') + '</section>';
  return mhead({ big: true, h: 'Everything important, in one secure place.', extra: '<div class="stats"><div class="stat"><b>' + money(cad(own)) + '</b><span>Estate value</span></div><div class="stat"><b>' + money(cad(v.obl)) + '</b><span>Obligations</span></div><div class="stat"><b>' + v.sealed.length + '</b><span>Sealed</span></div><div class="stat"><b>' + v.words.length + '</b><span>Final messages</span></div></div>' }) +
    '<main class="scr tabs">' + mpaused() + card +
    '<section class="stack"><h2 class="h3">Your Vault</h2><div class="list">' + CFG.vaultModules.map(function (m) {
      var c = v[m.id].length;
      return '<a class="li" href="#/vault/' + m.id + '"><span class="ico">' + ic(MOD_IC[m.id]) + '</span><span class="g"><span class="t">' + m.name + '</span><br><span class="s">' + (c ? plural(c, 'item') : m.desc) + '</span><span class="tags">' + mchip(m) + '</span></span><span class="chev">' + ic('chev') + '</span></a>';
    }).join('') + '</div></section>' +
    '<section class="stack"><h2 class="h3">People and settings</h2><div class="list">' +
    [['people', 'Trusted People', 'people', (e ? 'Executor: ' + esc(e) + ' · ' : '') + plural(S.invited.length, 'recipient')], ['release', 'Release settings', 'shield', v.fallback ? 'Final fallback signed' : 'Final fallback not signed'], ['reminders', 'Reminders', 'bell', 'Never more than two a month'], ['account', 'Account and data', 'down2', 'Download a copy, pause or close']].map(function (t) {
      return '<a class="li" href="#/vault/' + t[0] + '"><span class="ico">' + ic(t[2]) + '</span><span class="g"><span class="t">' + t[1] + '</span><br><span class="s">' + t[3] + '</span></span><span class="chev">' + ic('chev') + '</span></a>';
    }).join('') + '</div></section>' +
    (CFG.vaultPreviewUntilComplete && S.will.status !== 'complete' && S.will.status !== 'none' ? '<p class="small">' + ic('lock', 16) + ' Preview · your Vault activates after attestation.</p>' : '') +
    (CFG.pricing.vault.offerEnds ? '<p class="small"><span class="strong">Your current offer ends on ' + esc(CFG.pricing.vault.offerEnds) + '.</span> We always tell you before an offer ends.</p>' : '') + M_FOOT + '</main>' + nav('vault');
}

/* ================= Sections: list ================= */
var M_DESC = { obl: 'What you owe, so your executor can settle it first.', assets: 'Everything you own, in Canada and abroad.', sealed: 'Private files, released only to the people you choose.', words: 'Your own voice, delivered on the day you choose.' };
var M_NONE = { obl: ['No obligations yet', 'Add any debts, zakat, mahr or other obligations you want recorded.'], assets: ['No assets yet', 'Add your first asset to start building your estate inventory.'], sealed: ['No sealed documents yet', 'Keep private files here. Nobody can open one before a verified release.'], words: ['No messages yet', 'Record a short message, a du’a, or advice for your children.'] };
function addLabel(m) { return 'Add ' + (/^[aeiou]/.test(m.one) ? 'an ' : 'a ') + m.one; }
function mrow(m, r, sub, tags, amount) {
  return '<a class="li" href="#/vault/' + m.id + '/view/' + r.i + '"><span class="g"><span class="t">' + esc(r.x.name) + '</span>' + (sub ? '<br><span class="s">' + esc(sub) + '</span>' : '') + (tags ? '<span class="tags">' + tags + '</span>' : '') + '</span>' +
    (amount != null ? '<span class="amt">' + amount + '</span>' : '') + '<span class="chev">' + ic('chev') + '</span></a>';
}
function mgroup(title, note, rows) { return rows ? '<section class="stack"><div class="gh"><h2 class="h3">' + title + '</h2>' + (note ? '<span class="small">' + note + '</span>' : '') + '</div><div class="list">' + rows + '</div></section>' : ''; }
function todoTag(x) { return x.todo ? tag('c-amber', 'Add details', 'alert') : ''; }
function mSection(m) {
  var v = S.vault, l = v[m.id].map(function (x, i) { return { x: x, i: i }; }), top = '', body = '';
  if (m.id === 'obl') {
    top = '<section class="card pad-s"><div class="row between"><span class="strong">Total recorded</span><span class="tot">' + money(cad(v.obl)) + '</span></div><p class="small">Settled before anything is shared.</p></section>';
    body = OBL_GROUPS.map(function (g) {
      return mgroup(g[0], g[1], l.filter(function (r) { return g[2].indexOf(okind(r.x)) >= 0; }).map(function (r) {
        var k = OBL_KINDS.filter(function (o) { return o[0] === okind(r.x); })[0];
        return mrow(m, r, [k[3], r.x.sub, r.x.file ? 'Proof attached' : ''].filter(Boolean).join(' · '), todoTag(r.x), amtText(r.x));
      }).join(''));
    }).join('');
  } else if (m.id === 'assets') {
    var own = v.assets.filter(function (x) { return acat(x) !== AMANAH; }), cats = ASSET_CATS.filter(function (c) { return v.assets.some(function (x) { return acat(x) === c; }); });
    var np = cad(own.filter(function (x) { return x.ben === 'yes'; })), ab = cad(own.filter(function (x) { return x.country && x.country !== 'Canada'; }));
    top = '<section class="card pad-s"><div class="row between"><span class="strong">Estimated estate value</span><span class="tot">' + money(cad(own)) + '</span></div>' +
      (np || ab ? '<p class="small">' + [np ? money(np) + ' not in probate' : '', ab ? money(ab) + ' abroad' : ''].filter(Boolean).join(' · ') + '</p>' : '') +
      (own.some(function (x) { return x.cur && x.cur !== 'CAD'; }) ? '<p class="small">Totals add CAD values only.</p>' : '') + '</section>' +
      (cats.length > 1 ? '<div class="filters" role="group" aria-label="Filter by category">' + ['All'].concat(cats).map(function (c) { return '<button type="button" data-act="filter" data-v="' + c + '" aria-pressed="' + (UI.filter === c) + '">' + c + '</button>'; }).join('') + '</div>' : '');
    body = cats.filter(function (c) { return UI.filter === 'All' || UI.filter === c; }).map(function (c) {
      return mgroup(c, CAT_NOTE[c], l.filter(function (r) { return acat(r.x) === c; }).map(function (r) {
        var x = r.x, abroad = x.country && x.country !== 'Canada';
        return mrow(m, r, [x.kindOf, x.own === 'joint' ? 'Joint' : '', abroad ? x.country : '', x.ben === 'yes' ? 'Not in probate' : '', c === AMANAH && x.benName ? 'Return to ' + x.benName : ''].filter(Boolean).join(' · '),
          (needsBen(x) ? tag('c-amber', 'Confirm beneficiary', 'alert') : '') + todoTag(x), c === AMANAH ? null : amtText(x));
      }).join(''));
    }).join('');
  } else if (m.id === 'sealed') {
    top = '<p class="small">' + ic('lock', 16) + ' Each file has its own release trigger. Nobody, including our staff, can open one early.</p>';
    body = '<div class="list">' + l.map(function (r) { return mrow(m, r, [trigLabel(r.x), (r.x.to || []).length ? 'to ' + r.x.to.join(', ') : ''].filter(Boolean).join(' · '), todoTag(r.x)); }).join('') + '</div>';
  } else {
    body = '<div class="list">' + l.map(function (r) { return mrow(m, r, [r.x.kind === 'video' ? 'Video' : 'Voice', trigLabel(r.x), (r.x.to || []).length ? 'to ' + r.x.to.join(', ') : ''].filter(Boolean).join(' · '), todoTag(r.x)); }).join('') + '</div>';
  }
  var add = '<a class="btn navy" href="#/vault/' + m.id + '/add">' + ic('plus') + addLabel(m) + '</a>';
  return mhead({ back: '#/vault', h: m.name, p: M_DESC[m.id] }) + '<main class="scr">' + mpaused() +
    (l.length ? top + body : '<section class="card empty"><span class="ico">' + ic(MOD_IC[m.id], 26) + '</span><h2 class="h3">' + M_NONE[m.id][0] + '</h2><p class="p">' + M_NONE[m.id][1] + '</p>' + (v.paused ? '' : add) + '</section>') +
    '<div class="grow"></div></main>' + (l.length && !v.paused ? '<div class="foot">' + add + '</div>' : '');
}

/* ================= Sections: one item ================= */
function mView(m, i) {
  var x = S.vault[m.id][i]; if (!x) { location.replace('#/vault/' + m.id); return null; }
  var rows, tags = todoTag(x), to = (x.to || []).join(', ');
  if (m.id === 'obl') {
    var k = OBL_KINDS.filter(function (o) { return o[0] === okind(x); })[0];
    rows = kv('Kind', k[1]) + kv(okind(x) === 'zakat' ? 'Zakat year' : 'Which one', x.sub) + kv('Amount', amtText(x) || 'Not entered yet') + kv('Started', x.started) + kv('How to repay', x.repay) + kv('Notes', x.notes) + kv('Proof', x.file);
  } else if (m.id === 'assets') {
    var am = acat(x) === AMANAH;
    tags += needsBen(x) ? tag('c-amber', 'Confirm beneficiary', 'alert') : '';
    rows = kv('Category', acat(x)) + kv('Type', x.kindOf) + (am ? kv('Return it to', x.benName) : kv('Approximate value', amtText(x) || 'Not entered yet')) + kv('Country', x.country) + (am ? '' : kv('Ownership', x.own === 'joint' ? 'Jointly owned' : 'Owned alone')) +
      (BEN_CATS.indexOf(acat(x)) >= 0 ? kv('Beneficiary named', x.ben === 'yes' ? (x.benName || 'Yes') : x.ben === 'no' ? 'No' : 'Not confirmed') : '') + kv('Documents', x.docs) + kv('Notes', x.notes) + (CAT_NOTE[acat(x)] ? kv('Good to know', CAT_NOTE[acat(x)]) : '') + (!am && x.country && x.country !== 'Canada' ? kv('Abroad', 'Another country’s rules may apply') : '');
  } else if (m.id === 'sealed') rows = kv('File', x.file || 'No file yet') + kv('Released', trigLabel(x)) + kv('Recipients', to || 'Not chosen yet') + kv('Message', x.note);
  else rows = kv('Type', x.kind === 'video' ? 'Video' : 'Voice') + kv('Recording', x.rec ? 'Recorded' : 'Not recorded yet') + kv('Delivered', trigLabel(x)) + (trigOf(x) === 'date' ? kv('If you pass away before then', x.before) : '') + kv('Recipients', to || 'Not chosen yet');
  return mhead({ back: '#/vault/' + m.id, backLabel: m.short, eb: m.name, h: esc(x.name) }) + '<main class="scr">' + mpaused() + (tags ? '<div class="acts">' + tags + '</div>' : '') +
    '<section class="card">' + rows + '</section>' +
    (m.id === 'sealed' || m.id === 'words' ? '<p class="small">' + ic('lock', 16) + ' Private until a verified release.</p>' : '') + '<div class="grow"></div>' +
    (S.vault.paused ? '' : '<div class="stack"><a class="btn navy" href="#/vault/' + m.id + '/edit/' + i + '">' + ic('pen') + 'Edit</a><button type="button" class="btn danger" data-act="vaskdel" data-m="' + m.id + '" data-i="' + i + '">Remove</button></div>') + '</main>';
}

/* ================= Sections: add and edit, a few fields at a time ================= */
function mamount() { var d = S.draft; if (d.amount === '' || d.amount == null || num(d.amount) == null) E['draft.amount'] = 'Enter a number, like 2000. An estimate is fine.'; }
function mto() { var d = S.draft; return trusted().filter(function (p, i) { return (d.to || [])[i]; }).length; }
function mtrig(keys, label) { return '<div class="pickgrid" role="radiogroup" aria-label="' + label + '">' + keys.map(function (k) { return opt(TRIG[k], 'draft.trigger', k, TRIG_HINT[k]); }).join('') + '</div>' + err('draft.trigger'); }
function mfile(d, hint) { return '<div class="filebox">' + (d.file ? '<span class="strong">' + esc(d.file) + '</span>' : '<span class="small">' + hint + '</span>') + '<label class="btn out sm" style="cursor:pointer"><input type="file" id="vfile" hidden>' + (d.file ? 'Replace file' : 'Choose a file') + '</label></div>'; }
function mfsteps(mid, d) {
  if (mid === 'obl') return [
    { t: 'What kind of obligation?', lede: 'Record it once. Your executor sees it in the order they settle things.',
      body: '<div class="pickgrid" role="radiogroup" aria-label="What kind of obligation?">' + OBL_KINDS.map(function (k) { return opt(k[1], 'draft.kind', k[0], k[2]); }).join('') + '</div>' + err('draft.kind'),
      check: function () { need('draft.kind', 'Choose one.'); } },
    { t: 'The details', lede: 'An estimate is fine. You can correct it later.',
      body: '<div class="group">' + (d.kind === 'misc' ? sel('Which one?', 'draft.sub', ['Fidya (missed fasts)', 'Kaffarah', 'Hajj badal', 'Qard hasan']) : '') + (d.kind === 'zakat' ? inp('Zakat year', 'draft.sub', { ph: 'For example 1446 AH' }) : '') +
        inp(d.kind === 'zakat' || d.kind === 'misc' ? 'Title' : 'Owed to', 'draft.name') + inp('Amount', 'draft.amount', { mode: 'decimal', hint: 'In CAD.' }) + '</div>',
      check: function () { need('draft.name', 'Enter who it is owed to, or a title.'); mamount(); } },
    { t: 'Anything to add?', lede: 'All optional. Skip what you don’t know.',
      body: '<div class="group">' + inp('Date it started', 'draft.started', { opt: true, ph: 'YYYY-MM-DD' }) + inp('How to repay', 'draft.repay', { opt: true }) + area('Notes for your executor', 'draft.notes', { opt: true }) +
        '<div class="field"><span class="label">Proof<i>Optional</i></span>' + mfile(d, 'A note, message or receipt') + '</div></div><p class="small">Religious terms follow the scholars board’s wording.</p>' }
  ];
  if (mid === 'assets') {
    var ben = BEN_CATS.indexOf(d.cat) >= 0, am = d.cat === AMANAH, l = [
      { t: 'What is it?', lede: 'Rough details are fine. You can update them anytime.',
        body: '<div class="group">' + sel('Category', 'draft.cat', ASSET_CATS, { re: true }) + (CAT_NOTE[d.cat] ? '<p class="small">' + CAT_NOTE[d.cat] + '.</p>' : '') +
          inp('Type', 'draft.kindOf', { opt: true, hint: d.cat === 'Registered plans' ? 'RRSP, RRIF, TFSA, FHSA, RESP, RDSP, LIRA, LIF' : '' }) + inp(am ? 'What is it?' : 'Name or institution', 'draft.name') + '</div>',
        check: function () { need('draft.cat', 'Choose a category.'); need('draft.name', 'Enter a name.'); } },
      { t: am ? 'Who does it belong to?' : 'Value and ownership', lede: am ? 'It is returned to its owner and never counted in your estate.' : 'A rough value is enough.',
        body: '<div class="group">' + (am ? inp('Return it to', 'draft.benName') : inp('Approximate value', 'draft.amount', { mode: 'decimal' }) + sel('Currency', 'draft.cur', CURRENCIES)) + sel('Country', 'draft.country', CFG.countries) + '</div>' +
          (am ? '' : '<div class="group"><span class="label">Do you own it alone?</span><div class="pickgrid" role="radiogroup" aria-label="Do you own it alone?">' + opt('Yes, alone', 'draft.own', 'alone') + opt('Jointly', 'draft.own', 'joint') + '</div></div>'),
        check: function () { if (!am) mamount(); need('draft.country', 'Choose a country.'); } }
    ];
    if (ben) l.push({ t: 'Is a beneficiary named on it?', lede: 'Plans with a named beneficiary pass outside probate.',
      body: termLink('beneficiary') + '<div class="pickgrid" role="radiogroup" aria-label="Is a beneficiary named on it?">' + opt('Yes', 'draft.ben', 'yes') + opt('No', 'draft.ben', 'no') + opt('I’m not sure', 'draft.ben', 'unsure', 'We’ll remind you to check') + '</div>' + err('draft.ben') +
        (d.ben === 'yes' ? '<div class="group">' + inp('Beneficiary’s name', 'draft.benName') + '</div>' : ''),
      check: function () { need('draft.ben', 'Choose one.'); if (S.draft.ben === 'yes') need('draft.benName', 'Enter the beneficiary’s name.'); } });
    l.push({ t: 'Notes for your executor', lede: 'All optional. Say where the papers are.',
      body: '<div class="group">' + inp('Where are the documents?', 'draft.docs', { opt: true }) + area('Notes', 'draft.notes', { opt: true }) + '</div>' + mnote('amber', 'alert', 'Never put passwords or PINs here. Keep them in Sealed Documents.') });
    return l;
  }
  var who = { t: 'Who receives it?', lede: 'They receive only this. They see nothing now.',
    body: recipientPicker() + (mid === 'sealed' ? '<div class="group">' + area('Message to go with it', 'draft.note', { opt: true }) + '</div>' : ''),
    check: function () { if (!mto()) E['draft.to'] = 'Choose at least one person.'; } };
  if (mid === 'sealed') return [
    { t: 'The file', lede: 'It stays encrypted and unopened until a verified release.',
      body: '<div class="group"><div class="field"><span class="label">File</span>' + mfile(d, 'PDF, image or note') + err('draft.file') + '</div>' + inp('Title', 'draft.name') + '</div>',
      check: function () { if (!S.draft.file) E['draft.file'] = 'Choose a file.'; need('draft.name', 'Enter a title.'); } },
    { t: 'When should it be released?', lede: 'Nothing is released before our team verifies it.', body: mtrig(['death', 'incap', 'either'], 'When should it be released?'), check: function () { need('draft.trigger', 'Choose when.'); } },
    who
  ];
  return [
    { t: 'Your message', lede: 'Your own words. Record again as often as you like.',
      body: '<div class="pickgrid" role="radiogroup" aria-label="Voice or video">' + opt(ic('mic') + ' Voice message', 'draft.kind', 'voice', 'Just your voice') + opt(ic('video') + ' Video message', 'draft.kind', 'video', 'Your face and voice') + '</div>' +
        '<div class="group"><div class="field"><span class="label">Recording</span><div class="filebox">' + (d.rec ? '<span class="strong">' + ic('check', 18) + ' Recorded</span>' : '<span class="small">Up to 10 minutes.</span>') + '<button type="button" class="btn out sm" data-act="vrec">' + (d.rec ? 'Record again' : 'Record') + '</button></div>' + err('draft.rec') + '</div>' + inp('Title', 'draft.name', { ph: 'For Layla' }) + '</div>',
      check: function () { if (!S.draft.rec) E['draft.rec'] = 'Record your message first.'; need('draft.name', 'Enter a title.'); } },
    { t: 'When should it be delivered?', lede: 'It stays private until the moment you choose.',
      body: mtrig(['death', 'incap', 'either', 'date', 'event'], 'When should it be delivered?') +
        (d.trigger === 'date' ? '<div class="group">' + inp('Date', 'draft.date', { ph: 'YYYY-MM-DD', hint: 'A birthday or anniversary.' }) + sel('If I pass away before then', 'draft.before', ['Deliver on the date anyway', 'Deliver once verified']) + '</div>' : '') +
        (d.trigger === 'event' ? '<div class="group">' + inp('Which life event?', 'draft.event', { ph: 'Graduation, nikah, first child' }) + '</div>' : ''),
      check: function () { var x = S.draft; need('draft.trigger', 'Choose when.'); if (x.trigger === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(x.date || '')) E['draft.date'] = 'Enter a date like 2032-06-04.'; if (x.trigger === 'event') need('draft.event', 'Say which event.'); } },
    who
  ];
}
function mbase(m, idx) { return '#/vault/' + m + '/' + (idx != null ? 'edit/' + idx : 'add') + '/'; }
function mForm(m, idx, n) {
  if (S.vault.paused) { location.replace('#/vault/' + m.id); return null; }
  var edit = idx != null, key = m.id + ':' + (edit ? idx : 'new');
  if (edit && !S.vault[m.id][idx]) { location.replace('#/vault/' + m.id); return null; }
  if (!S.draft || S.draft._k !== key) {
    var src = edit ? JSON.parse(JSON.stringify(S.vault[m.id][idx])) : { cur: 'CAD', country: 'Canada', own: 'alone', kind: m.id === 'words' ? 'voice' : undefined };
    if (m.id === 'assets' && edit && !src.cat) src.cat = acat(src);
    if (m.id === 'obl' && edit && !src.kind) src.kind = okind(src);
    var names = trusted().map(function (p) { return norm(p.name); });
    src.to = names.map(function (x) { return (src.to || []).some(function (t) { return norm(t) === x; }); });
    src._k = key; S.draft = src; save();
  }
  var l = mfsteps(m.id, S.draft); n = Math.max(0, Math.min(l.length - 1, n || 0));
  var st = l[n], last = n === l.length - 1, saveLabel = m.id === 'sealed' ? 'Seal and save' : m.id === 'words' ? 'Save message' : 'Save';
  return '<header class="vhero"><div class="row between"><button type="button" class="iconbtn" data-act="vcancel" data-m="' + m.id + '">' + ic('x') + 'Cancel</button><span class="vstep">Step ' + (n + 1) + ' of ' + l.length + '</span></div>' +
    '<p class="eyebrow">' + (edit ? 'Edit · ' : 'Add · ') + m.name + '</p><h1 class="h2">' + st.t + '</h1>' +
    '<div class="segs" role="img" aria-label="Step ' + (n + 1) + ' of ' + l.length + '">' + l.map(function (x, i) { return '<i class="' + (i < n ? 'done' : i === n ? 'on' : '') + '"></i>'; }).join('') + '</div></header>' +
    '<main class="scr"><p class="p">' + st.lede + '</p>' + st.body + '<div class="grow"></div></main>' +
    '<div class="foot"><button type="button" class="btn navy" data-act="mnext" data-m="' + m.id + '"' + (edit ? ' data-i="' + idx + '"' : '') + ' data-n="' + n + '">' + (last ? saveLabel : 'Continue') + ic('next') + '</button>' +
    (n ? '<a class="btn quiet" href="' + mbase(m.id, edit ? idx : null) + (n - 1) + '">Back</a>' : '') + '</div>';
}
A.mnext = function (el) {
  var mid = el.dataset.m, i = el.dataset.i, n = +el.dataset.n, l = mfsteps(mid, S.draft); E = {};
  if (l[n].check) l[n].check();
  if (Object.keys(E).length) { save(); return render(); }
  l = mfsteps(mid, S.draft);
  if (n < l.length - 1) return go(mbase(mid, i) + (n + 1));
  var ds = { m: mid }; if (i != null) ds.i = i;
  A.vsave({ dataset: ds });                       // the shared save: validates everything once more, stores the item, confirms
};

/* ================= Guided setup: one small question per screen ================= */
function mGuided(a) {
  if (S.vault.paused) { location.replace('#/vault'); return null; }
  var g = S.vault.g, l = gsteps();
  if (a[0] == null) { location.replace('#/vault/guided/' + Math.min(l.length - 1, g.at || 0)); return null; }
  var n = Math.max(0, Math.min(l.length - 1, +a[0] || 0)), st = l[n], base = '#/vault/guided/', body, p, det, primary = 'Continue', canSkip = n > 0 && st.id !== 'review';
  g.at = n; save();
  var same = l.filter(function (x) { return x.id === st.id; }), count = same.length > 1 ? ' · ' + (same.indexOf(st) + 1) + ' of ' + same.length : '';
  var visit = st.id + ':' + (st.k || '');
  if (UI.gvisit !== visit) {           // first visit to a detail step: start from what is already in the Vault
    UI.gvisit = visit; var it = st.id === 'obl' ? gitem('obl', 'o:' + st.k) : st.id === 'asset' ? gitem('assets', 'a:' + st.k) : null;
    if (it) { det = gdet(st.k); if (it.name !== st.d[1]) det.name = it.name; det.amount = it.amount == null ? '' : it.amount; if (it.cur) det.cur = it.cur; if (it.own) det.own = it.own; if (it.ben) det.ben = it.ben; if (it.benName) det.benName = it.benName; save(); }
  }
  function q(h, sub) { return '<h1 class="h2">' + h + '</h1>' + (sub ? '<p class="p">' + sub + '</p>' : ''); }
  if (st.id === 'welcome') {
    primary = 'Start';
    body = q('Let’s fill your Vault together.', 'One small question at a time. About 15 minutes, and you can stop at any step.') + '<div class="stack">' +
      [['Obligations', 'What should be paid first.'], ['Estate Inventory', 'What you own, here and abroad.'], ['People', 'Who receives what.'], ['Sealed Documents', 'Private papers, opened only when needed.'], ['Messages', 'Words for the people you love.'], ['Review', 'Check it all, then finish.']].map(function (x, i) { return '<div class="intro"><span class="num">' + (i + 1) + '</span><span><span class="strong">' + x[0] + '</span><br><span class="small">' + x[1] + '</span></span></div>'; }).join('') + '</div>';
  } else if (st.id === 'oblpick') body = q('Is there anything to pay before your estate is shared?', 'Tick all that apply. We’ll ask about each one next.') + tiles(G_OBL, 'obl') + '<p class="small">Nothing to add? Leave them all empty and continue.</p>';
  else if (st.id === 'obl') { p = 'vault.g.det.' + st.k; gdet(st.k); body = q(st.d[1], st.d[2] + '. Two short answers.') + '<div class="group">' + inp(st.d[3] === 'zakat' ? 'What is it for?' : 'Who is it owed to?', p + '.name', { opt: true, ph: st.d[1] }) + inp('Roughly how much is left?', p + '.amount', { opt: true, mode: 'decimal', hint: 'In CAD. An estimate is fine.' }) + '</div>'; }
  else if (st.id === 'assetpick') body = q('What do you own, in Canada or abroad?', 'Tick all that apply. We’ll ask about each one next.') + tiles(G_ASSET, 'assets');
  else if (st.id === 'asset') {
    p = 'vault.g.det.' + st.k; det = gdet(st.k); var ben = BEN_CATS.indexOf(st.d[3]) >= 0;
    body = q(st.d[1], st.d[2] + '.') + '<div class="group">' + inp('What should we call it?', p + '.name', { opt: true, ph: st.d[1] }) + inp('Roughly what is it worth?', p + '.amount', { opt: true, mode: 'decimal', hint: 'Rough is fine.' }) + sel('Currency', p + '.cur', CURRENCIES) + '</div>' +
      '<div class="group"><span class="label">Do you own it alone?</span><div class="pickgrid" role="radiogroup" aria-label="Do you own it alone?">' + opt('Yes, alone', p + '.own', 'alone') + opt('Jointly', p + '.own', 'joint') + '</div></div>' +
      (ben ? '<div class="group"><span class="label">Is a beneficiary named on it?</span><div class="pickgrid" role="radiogroup" aria-label="Is a beneficiary named on it?">' + opt('Yes', p + '.ben', 'yes') + opt('No', p + '.ben', 'no') + opt('I’m not sure', p + '.ben', 'unsure', 'We’ll remind you to check') + '</div>' + (det.ben === 'yes' ? inp('Beneficiary’s name', p + '.benName') : '') + '</div>' : '');
  } else if (st.id === 'people') {
    var fam = people(), others = S.invited.filter(function (x) { return !fam.some(function (f) { return norm(f.name) === norm(x.name); }); });
    body = q('Who should receive things from your Vault?', 'Tick the people you’ll leave documents or messages to. Contact details can come later.') +
      (fam.length ? '<div class="pickgrid">' + fam.map(function (x) { var on = S.invited.some(function (i) { return norm(i.name) === norm(x.name); }); return '<button type="button" class="opt' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-act="gperson" data-v="' + esc(x.name) + '" data-rel="' + x.rel + '"><span class="box">' + (on ? ic('check', 18) : '') + '</span><span>' + esc(x.name) + '<small>' + x.rel + ' · from your Will</small></span></button>'; }).join('') + '</div>' : '<p class="small">No family in your Will yet.</p>') +
      (others.length ? '<p class="small strong">Also added: ' + others.map(function (x) { return esc(x.name); }).join(', ') + '</p>' : '') + '<button type="button" class="btn out" data-act="invite">' + ic('plus') + 'Add someone else</button>';
  } else if (st.id === 'fallback') {
    body = q('If none of your executors can act', 'The Muslim Will can step in and appoint a lawyer for your estate. It needs your signed acceptance.') +
      (execName() ? '<div class="prow"><span class="num">1</span><span class="g"><span class="strong">' + esc(execName()) + '</span><br><span class="small">Your executor · from your Will</span></span></div>' : '') +
      (S.vault.fallback ? '<div class="prow"><span class="ico green round">' + ic('check', 22) + '</span><span class="g"><span class="strong">Signed ' + esc(S.vault.fallback) + '</span></span></div>' : '<p class="small">[Wording pending legal review]</p><button type="button" class="btn out" data-act="vsigned">' + ic('pen') + 'I accept and sign</button>');
  } else if (st.id === 'docpick') body = q('What should your family open only when the time comes?', 'Tick what you’d like to keep here. We’ll take them one by one.') + tiles(G_DOC, 'docs');
  else if (st.id === 'doc') {
    p = 'vault.g.det.d_' + st.k; det = gdet('d_' + st.k); if (!det.trigger) { det.trigger = 'either'; save(); }
    body = q(st.d[1], st.d[2] + '. Three short answers.') +
      '<div class="group"><div class="field"><span class="label">1. The file</span><div class="filebox">' + (det.file ? '<span class="strong">' + esc(det.file) + '</span>' : '<span class="small">PDF, photo or note</span>') + '<label class="btn out sm" style="cursor:pointer"><input type="file" id="gfile" data-p="' + p + '.file" hidden>' + (det.file ? 'Replace file' : 'Choose a file') + '</label></div></div></div>' +
      '<div class="group"><span class="label">2. When should it be released?</span><div class="pickgrid" role="radiogroup" aria-label="When should it be released?">' + ['death', 'incap', 'either'].map(function (k) { return opt(TRIG[k], p + '.trigger', k, TRIG_HINT[k]); }).join('') + '</div></div>' +
      '<div class="group">' + gto(p).replace('Who receives it?', '3. Who receives it?') + '</div>';
  } else if (st.id === 'msg') body = q('Would you like to leave a message?', 'A few words of advice, a du’a, a story.') + '<div class="pickgrid" role="radiogroup" aria-label="Message">' + opt(ic('video') + ' Record a video', 'vault.g.msg', 'video', 'Your face and voice') + opt(ic('mic') + ' Record a voice message', 'vault.g.msg', 'audio', 'Just your voice') + opt('Maybe later', 'vault.g.msg', 'later', 'We’ll keep this section open') + '</div>';
  else if (st.id === 'msgd') {
    p = 'vault.g.det.m'; det = gdet('m'); if (!det.trigger) { det.trigger = 'death'; save(); }
    body = q('Your ' + (g.msg === 'video' ? 'video' : 'voice') + ' message', 'Four short answers.') +
      '<div class="group"><div class="field"><span class="label">1. Record</span><div class="filebox">' + (det.rec ? '<span class="strong">' + ic('check', 18) + ' Recorded</span>' : '<span class="small">Up to 10 minutes</span>') + '<button type="button" class="btn out sm" data-act="grec">' + (det.rec ? 'Record again' : 'Record') + '</button></div></div>' + inp('2. Give it a title', p + '.name', { opt: true, ph: 'For Layla' }) + '</div>' +
      '<div class="group"><span class="label">3. When should it be delivered?</span><div class="pickgrid" role="radiogroup" aria-label="When should it be delivered?">' + ['death', 'incap', 'either', 'date'].map(function (k) { return opt(TRIG[k], p + '.trigger', k, TRIG_HINT[k]); }).join('') + '</div>' + (det.trigger === 'date' ? inp('Date', p + '.date', { ph: 'YYYY-MM-DD' }) : '') + '</div>' +
      '<div class="group">' + gto(p).replace('Who receives it?', '4. Who receives it?') + '</div>';
  } else {
    var v = S.vault, open = function (k) { return v[k].filter(function (x) { return x.todo; }).length; };
    var rows = [['Obligations Register', v.obl.length, open('obl'), 'oblpick'], ['Estate Inventory', v.assets.length, open('assets'), 'assetpick'], ['People', S.invited.length, 0, 'people'], ['Sealed Documents', v.sealed.length, open('sealed'), 'docpick'], ['Voice &amp; Video Messages', v.words.length, open('words'), 'msg']];
    body = q('MashaAllah, your Vault has taken shape.', 'Anything you skipped stays on your list, marked “Add details”. Tap a row to change it.') + '<div class="list">' + rows.map(function (r) {
      var at = l.map(function (x) { return x.id; }).indexOf(r[3]);
      return '<a class="li" href="' + base + at + '"><span class="g"><span class="t">' + r[0] + '</span><br><span class="s">' + r[1] + ' added' + (r[2] ? ' · ' + r[2] + ' need details' : '') + '</span><span class="tags">' + (r[2] ? tag('c-amber', 'Add details', 'alert') : r[1] ? tag('c-green', 'Done', 'check') : tag('c-grey', 'Skipped')) + '</span></span><span class="chev">' + ic('chev') + '</span></a>';
    }).join('') + '</div>';
  }
  var next = l[n + 1];
  return '<header class="vhero"><div class="row between"><a class="iconbtn" href="#/vault">' + ic('x') + (n ? 'Save and exit' : 'Close') + '</a><span class="vstep">Step ' + (n + 1) + ' of ' + l.length + '</span></div>' +
    '<p class="eyebrow">Guided setup · ' + G_SECTIONS[st.sec] + count + '</p><div class="bar" role="img" aria-label="Step ' + (n + 1) + ' of ' + l.length + '"><i style="width:' + Math.round((n + 1) / l.length * 100) + '%"></i></div></header>' +
    '<main class="scr">' + body + '<section class="card pad-s tint"><span class="eyebrow">Why we ask</span><p class="small">' + G_TIP[st.id] + '</p></section>' +
    (next ? '<p class="small"><span class="strong">Next:</span> ' + esc(next.t) + '</p>' : '') + '<div class="grow"></div></main>' +
    '<div class="foot">' + (next ? '<button type="button" class="btn navy" data-act="gnext" data-n="' + n + '">' + primary + ic('next') + '</button>' : '<a class="btn navy" href="#/vault">Finish and go to My Vault' + ic('next') + '</a>') +
    (n ? '<div class="pair"><a class="btn quiet" href="' + base + (n - 1) + '">Back</a>' + (canSkip ? '<button type="button" class="btn quiet" data-act="gskip" data-n="' + n + '">Skip for now</button>' : '<span></span>') + '</div>' : '<a class="btn quiet" href="#/vault">I’d rather fill it in myself</a>') + '</div>';
}

/* ================= People, release, reminders, account ================= */
function mfallback() {
  var f = S.vault.fallback;
  return '<section class="card pad-s"><div class="row" style="align-items:flex-start"><span class="ico">' + ic('shield') + '</span><span><span class="strong">The Muslim Will · final fallback</span><br><span class="small">If no executor can act, we appoint a lawyer for your estate.</span></span></div>' +
    (f ? tag('c-green', 'You signed ' + esc(f), 'check') : tag('c-amber', 'Not signed', 'alert') + '<button type="button" class="btn out" data-act="vsign">Review and sign</button>') + '</section>';
}
function mexec() {
  var e = execName(), x = S.will.d.exec || {};
  return '<section class="stack"><div class="gh"><h2 class="h3">Executor</h2><span class="small">From your Will. To change it, update your Will.</span></div>' +
    (e ? '<div class="list"><a class="li" href="#/will/view"><span class="ico navy round">' + ic('user') + '</span><span class="g"><span class="t">' + esc(e) + '</span><br><span class="s">' + esc([x.src === 'spouse' ? 'Spouse' : x.rel, x.phone ? fmtPhone(x.phone) : ''].filter(Boolean).join(' · ') || 'Executor') + '</span></span><span class="chev">' + ic('chev') + '</span></a></div>'
      : '<section class="card pad-s"><p class="p">No executor yet. You choose one in your Will.</p><a class="btn out" href="#/will">Go to my Will</a></section>') + mfallback() + '</section>';
}
function mPeople() {
  var rec = S.invited;
  return mhead({ back: '#/vault', h: 'Trusted People', p: 'The people who act for you, and the people you leave things to.' }) + '<main class="scr">' + mexec() +
    '<section class="stack"><div class="gh"><h2 class="h3">Recipients</h2><span class="small">They receive only what you assign, and have no authority over your estate.</span></div>' +
    (rec.length ? '<div class="list">' + rec.map(function (p, i) {
      var n = receives(p.name), st = !p.email || !p.phone ? tag('c-amber', (!p.email ? 'Email' : 'Phone') + ' missing', 'alert') : p.told ? tag('c-gold', 'Invited') : tag('c-grey', 'Not invited yet');
      return '<button type="button" class="li" data-act="vperson" data-i="' + i + '"><span class="g"><span class="t">' + esc(p.name) + '</span><br><span class="s">' + esc([p.rel, 'Receives ' + plural(n, 'item')].filter(Boolean).join(' · ')) + '</span><span class="tags">' + st + '</span></span><span class="chev">' + ic('chev') + '</span></button>';
    }).join('') + '</div>' : '<section class="card empty"><span class="ico">' + ic('people', 26) + '</span><h2 class="h3">No recipients yet</h2><p class="p">Add the people you’ll leave documents or messages to.</p></section>') +
    '<p class="small">We don’t contact recipients until something is released.</p></section><div class="grow"></div></main>' +
    '<div class="foot"><button type="button" class="btn navy" data-act="invite">' + ic('plus') + 'Add a person</button></div>';
}
function mRelease() {
  var v = S.vault, trig = {}; v.sealed.concat(v.words).forEach(function (x) { var t = trigOf(x); t = t === 'date' || t === 'event' ? 'ms' : t; trig[t] = (trig[t] || 0) + 1; });
  var e = execName() ? esc(execName().split(' ')[0]) : 'Your executor';
  return mhead({ back: '#/vault', h: 'Release settings', p: 'How your Vault is opened when the time comes.' }) + '<main class="scr">' +
    '<section class="card"><h2 class="h3">How release works</h2><ol class="tl">' + [['Someone reports', 'Your executor or a family member reports a death or incapacity.'], ['We verify', 'A death certificate, or a hospital letter confirmed with the hospital.'], ['Items are released', 'Each item goes only to its recipients, if its trigger matches.'], [e + ' takes over', 'They see your obligations and inventory to settle the estate.']].map(function (s, i) { return '<li class="done"><span class="dot" style="color:#fff;font-size:14px">' + (i + 1) + '</span><span>' + s[0] + '<small>' + s[1] + '</small></span></li>'; }).join('') + '</ol>' +
    '<p class="small">There is no waiting period. Release happens as soon as verification is complete' + (CFG.rules.releaseTurnaround ? ', usually within ' + esc(CFG.rules.releaseTurnaround) : '') + '.</p></section>' + mfallback() +
    '<section class="card"><h2 class="h3">Triggers on your items</h2><p class="small">Each item has its own trigger. Change it on the item itself.</p><div>' + [['death', 'On death'], ['incap', 'On incapacity'], ['either', 'Death or incapacity'], ['ms', 'Milestone date']].map(function (t) { return '<div class="kv"><span>' + t[1] + '</span><b>' + plural(trig[t[0]] || 0, 'item') + '</b></div>'; }).join('') + '</div></section>' +
    '<div class="list"><a class="li" href="#/vault/sealed"><span class="g t">Sealed Documents</span><span class="chev">' + ic('chev') + '</span></a><a class="li" href="#/vault/words"><span class="g t">Voice &amp; Video Messages</span><span class="chev">' + ic('chev') + '</span></a></div></main>';
}
function mReminders() {
  var rem = S.vault.rem;
  return mhead({ back: '#/vault', h: 'Reminders', p: 'A few well-timed nudges. Never more than two a month.' }) + '<main class="scr"><div class="list">' + REMINDERS.map(function (r) {
    var on = r[4] || rem[r[0]] !== false;
    return '<div class="li"><span class="g"><span class="t" id="rm-' + r[0] + '">' + r[1] + '</span><br><span class="s">' + r[2] + ' · ' + r[3] + '</span>' + (r[4] ? '<span class="tags">' + tag('c-grey', 'Always on', 'lock') + '</span>' : '') + '</span>' +
      (r[4] ? '' : '<span class="small strong">' + (on ? 'On' : 'Off') + '</span><button type="button" class="switch" role="switch" aria-checked="' + on + '" aria-labelledby="rm-' + r[0] + '" data-act="vrem" data-k="' + r[0] + '"></button>') + '</div>';
  }).join('') + '</div>' +
    '<section class="card"><h2 class="h3">Where should we reach you?</h2><div class="group">' + inp('Email', 'user.email', { type: 'email' }) + inp('Mobile phone', 'will.d.phone', { type: 'tel', hint: 'Canadian number.' }) + '</div><p class="small">Saved as you type.</p></section></main>';
}
function mAccount() {
  var v = S.vault, p = price('vault');
  return mhead({ back: '#/vault', h: 'Account and data', p: 'Your information is yours. Take a copy any time.' }) + '<main class="scr">' + mpaused() +
    '<section class="card"><h2 class="h3">Download a copy</h2><p class="p">A password-protected ZIP of everything in your Vault.</p><label class="field"><span class="label">Choose a password for the file</span><input class="input' + (E.zip ? ' bad' : '') + '" id="zip" type="password" autocomplete="new-password"><span class="hint">We can’t recover this password. Keep it somewhere safe.</span>' + err('zip') + '</label><button type="button" class="btn navy" data-act="vexport">Prepare download</button></section>' +
    '<section class="card"><h2 class="h3">Your plan</h2><div class="kv"><span>My Vault</span><b>' + (p.known ? p.text : '[Price from API]') + '</b></div><div class="kv"><span>Status</span><b>' + (v.paused ? 'Paused' : 'Active') + '</b></div></section>' +
    '<section class="card"><h2 class="h3">' + (v.paused ? 'Your Vault is paused' : 'Money tight? Pause instead') + '</h2><p class="p">' + (v.paused ? 'It is read-only. Your release settings stay active.' : 'Keep your Vault safe and read-only at a lower price. Your release settings stay active.') + '</p><button type="button" class="btn out" data-act="' + (v.paused ? 'vresume' : 'vaskpause') + '">' + (v.paused ? 'Resume my Vault' : 'Pause my Vault') + '</button></section>' +
    '<section class="card"><h2 class="h3">Close my Vault</h2><p class="p">It stops working right away and nothing will be released. Everything is deleted after 90 days; you can reopen before then.</p><button type="button" class="btn danger" data-act="vaskclose">Close my Vault</button></section></main>';
}

/* ================= routing ================= */
R.vault = function (a) {
  vinit();
  if (!S.vault.active) { if (a[0]) { location.replace('#/vault'); return null; } return discovery(true); }      // no management page for someone who doesn't own it
  var m = CFG.vaultModules.filter(function (x) { return x.id === a[0]; })[0];
  if (m) return a[1] === 'add' ? mForm(m, null, +a[2] || 0) : a[1] === 'edit' ? mForm(m, +a[2], +a[3] || 0) : a[1] === 'view' ? mView(m, +a[2]) : mSection(m);
  if (a[0] === 'guided') return mGuided(a.slice(1));
  if (a[0] === 'people') return mPeople();
  if (a[0] === 'release') return mRelease();
  if (a[0] === 'reminders') return mReminders();
  if (a[0] === 'account') return mAccount();
  if (a[0]) { location.replace('#/vault'); return null; }
  return mHome();
};
// Removing an item from its own page goes back to the list (shared A.vdel); cancelling an edit goes back to the item.
A.vcancel = function (el) { var k = S.draft && S.draft._k, m = el.dataset.m, i = k && k.split(':')[1]; delete S.draft; save(); go('#/vault/' + m + (i && i !== 'new' ? '/view/' + i : '')); };

/* ================= Home: stop promoting the Vault once it is owned; recommend the next Vault task ================= */
var banner0 = banner;
banner = function () {
  var b = banner0(), w = S.will.status;
  if (!S.vault.active || !b || w === 'none') return b;          // not owned → discovery banner; Vault only → the Will invitation
  if (S.vault.paused) return null;
  var n = nba();
  return n ? { eb: 'Next in your Vault', h: n.h, p: n.p, cta: n.cta, go: n.go } : (S.vault.reviewed ? null : b);
};
