/* Tabs and everything after the wizard: Home, Will, status, signing, payment, Vault, Profile. */
'use strict';
var ORDER = ['submitted', 'scholar', 'legal', 'ready', 'attest', 'complete'];
function stages() { return CFG.stages.filter(function (s) { return !s.only || s.only === S.will.signing; }); }
function inReview() { return ['submitted', 'scholar', 'legal'].indexOf(S.will.status) >= 0; }
function canPrint() { return ORDER.indexOf(S.will.status) >= ORDER.indexOf(CFG.rules.printFrom) && ORDER.indexOf(S.will.status) >= 0; }
var STAGE = {
  submitted: { now: 'We’ve received your Will.', next: 'Scholar review starts next.' },
  scholar: { now: 'A scholar is reviewing your Will.', next: 'Conformity review comes next.' },
  legal: { now: 'We’re checking it meets legal requirements.', next: 'Then it’s ready to sign.' },
  attest: { now: 'Payment received.', next: CFG.rules.attestNextStep }
};
function stageLabel() { var s = CFG.stages.filter(function (x) { return x.id === S.will.status; })[0]; return s ? s.label : ''; }
function doneCount() { return chapters().filter(function (c) { return S.will.done.indexOf(c.id) >= 0; }).length; }
function timeline() {
  var l = stages(), at = l.map(function (s) { return s.id; }).indexOf(S.will.status);
  return '<ol class="tl">' + l.map(function (s, i) {
    var st = i < at || S.will.status === 'complete' ? 'done' : i === at ? 'on' : '';
    return '<li class="' + st + '"><span class="dot">' + (st === 'done' ? ic('check', 16) : '') + '</span><span>' + s.label + '<small>' + (st === 'done' ? 'Done' : st === 'on' ? 'Now' : 'Not started') + (s.note && st !== 'done' ? ' · ' + s.note : '') + '</small></span></li>';
  }).join('') + '</ol>';
}

/* ---------- Home: what do I have, what needs me, what's next ---------- */
function primary() {
  var w = S.will.status, chs = chapters();
  if (S.will.action && inReview()) return '<section class="card amber"><span class="chip c-amber">' + ic('alert', 16) + 'Action needed</span><h2 class="h2">A reviewer has a question</h2><p class="p">Answer it to keep your review moving.</p><button type="button" class="btn navy" data-act="answer">Answer question' + ic('next') + '</button></section>';
  if (w === 'none' && S.vault.active) { var st = vaultState(); return '<section class="card"><span class="chip ' + (st.healthy ? 'c-green' : 'c-gold') + '">' + st.label + '</span><h2 class="h2">My Vault</h2><p class="p">Everything important, in one secure place.</p><a class="btn navy" href="#/vault">Open My Vault' + ic('next') + '</a></section>'; }
  if (w === 'none') return '<section class="card"><h2 class="h2">Create your Islamic Will for free</h2><p class="p">No payment required. Save and return anytime.</p><button type="button" class="btn navy" data-act="startWill">Start my Will' + ic('next') + '</button></section>';
  if (w === 'progress') {
    // Next Best Action: one task, why it matters, how long, one button.
    var nt = nextTask(), n = doneCount(), started = Object.keys(ensureSec()).length > 0, mins = chMins(nt.ch.id);
    return '<section class="card"><p class="eyebrow">' + (started ? 'Continue your Will' : 'Your next step') + '</p><h2 class="h2">' + nt.t + '</h2><p class="p">' + nt.why + '</p>' +
      '<div class="bar" role="img" aria-label="' + n + ' of ' + chs.length + ' chapters complete"><i style="width:' + n / chs.length * 100 + '%"></i></div>' +
      '<p class="small">' + n + ' of ' + chs.length + ' chapters complete · Chapter ' + (nt.ci + 1) + ': ' + esc(nt.ch.title) + (mins ? ' · about ' + mins + ' minutes' : '') + '</p>' +
      '<button type="button" class="btn navy" data-act="startWill">Continue' + ic('next') + '</button><button type="button" class="btn quiet" data-act="journey">View journey</button></section>';
  }
  if (inReview()) return '<section class="card tint"><span class="chip c-gold">' + ic('clock', 16) + stageLabel() + '</span><h2 class="h2">Your Will is under review.</h2><p class="p">' + STAGE[w].now + ' Nothing is needed from you.</p><a class="btn quiet" href="#/will">See review status</a></section>';
  if (w === 'ready') return '<section class="card tint"><span class="chip c-gold">' + ic('pen', 16) + 'Ready to Sign</span><h2 class="h2">Your Will is ready to sign.</h2><p class="p">Choose how you’d like to sign.</p><a class="btn navy" href="#/sign">Continue to signing' + ic('next') + '</a></section>';
  if (w === 'attest' && typeof attCard === 'function') return attCard();      // desktop: the attestation steps
  if (w === 'attest') return '<section class="card tint"><span class="chip c-gold">' + ic('clock', 16) + 'Attestation</span><h2 class="h2">Your attestation is being arranged.</h2><p class="p">' + esc(STAGE.attest.next) + '</p><a class="btn quiet" href="#/will">See status</a></section>';
  return '<section class="card"><span class="chip c-green">' + ic('check', 16) + 'Completed</span><h2 class="h2">Your Islamic Will is ready.</h2><p class="p">View or review your Will anytime.</p><a class="btn navy" href="#/will/view">View my Will' + ic('next') + '</a></section>';
}
// Exactly one recommendation, chosen in priority order. Returns null when the main card already is the next step.
function banner() {
  var w = S.will.status, v = S.vault;
  if (S.will.action && inReview()) return null;                                  // 1 urgent action owns the screen
  if (w === 'progress' || w === 'ready') return null;                            // 2–3 nothing competes with the Will
  if (w === 'none' && !v.active) return null;
  if (w === 'none' && v.active) return { eb: 'Add to your plan', h: 'Create your Islamic Will for free.', p: 'No payment required.', cta: 'Start my Will', act: 'startWill' };
  if (v.active) {
    if (!v.assets.length) return { eb: 'Next step', h: 'Add your assets.', p: 'List what your family should know about.', cta: 'Add assets', go: '#/vault/assets' };          // 4 missing critical information
    if (!S.invited.length) return { eb: 'Next step', h: 'Keep your family in the loop.', p: 'Invite the people who may need access later.', cta: 'Invite family', act: 'invite' };   // 5 family access
    if (!v.reviewed) return { eb: 'Reminder', h: 'Review your plan.', p: 'Check your details are still right.', cta: 'Review now', act: 'reviewPlan' };                    // 8 maintenance
    return null;
  }
  if (!CFG.products.vault) return null;
  return { eb: 'Expand your estate plan', h: 'There’s more you can keep protected.', p: 'See what My Vault can help you organize.', cta: 'See how it works', go: '#/vault' };          // 6 Vault discovery
}
var MOD_IC = { obl: 'scale', assets: 'list', sealed: 'lock', words: 'pen' };
R.home = function () {
  var b = banner(), w = S.will.status, tiles = '';
  if (S.vault.active) tiles = '<section class="stack"><h2 class="h3">My Vault</h2><div class="tiles">' + CFG.vaultModules.map(function (m) { var n = S.vault[m.id].length; return '<a class="tile" href="#/vault/' + m.id + '" style="text-decoration:none"><span class="ico">' + ic(MOD_IC[m.id]) + '</span>' + m.short + '<small>' + (n ? n + ' added' : 'Not started') + '</small></a>'; }).join('') + '</div></section>';
  else if (w === 'complete') tiles = '<section class="stack"><h2 class="h3">Your Will</h2><div class="tiles">' +
    [['Beneficiaries', 'people', '#/will/view/family'], ['Guardians', 'shield', '#/will/view/guardian'], ['Documents', 'print', '#/will/view'], ['Update details', 'pen', '#/will/view/about']].map(function (t) { return '<a class="tile" href="' + t[2] + '" style="text-decoration:none"><span class="ico">' + ic(t[1]) + '</span>' + t[0] + '</a>'; }).join('') + '</div></section>';
  return '<main class="scr tabs home"><header class="stack" style="gap:4px"><p class="eyebrow">Assalamu Alaykum</p><h1 class="h1">Welcome' + (w === 'none' && !S.vault.active ? '' : ' back') + ', ' + esc(firstName()) + '</h1></header>' +
    primary() + tiles +
    (b ? '<section class="card navy"><p class="eyebrow">' + b.eb + '</p><h2 class="h2">' + b.h + '</h2><p class="p">' + b.p + '</p>' +
      (b.go ? '<a class="btn ondark" href="' + b.go + '">' + b.cta + ic('next') + '</a>' : '<button type="button" class="btn ondark" data-act="' + b.act + '">' + b.cta + ic('next') + '</button>') + '</section>' : '') +
    '</main>' + nav('home');
};
A.answer = function () {
  sheet('<h2 class="h2">Reviewer’s question</h2><p class="p">[The reviewer’s question appears here]</p><label class="field"><span class="label">Your answer</span><textarea class="input" id="ans"></textarea>' + err('ans') + '</label>' +
    '<button type="button" class="btn navy" data-act="answerSend">Send answer</button><button type="button" class="btn quiet" data-act="close">Later</button>');
};
A.answerSend = function () {
  if (!document.getElementById('ans').value.trim()) { E.ans = 'Write a short answer first.'; A.answer(); E = {}; return; }
  S.will.action = false; save(); closeSheet(); render();
};

/* ---------- Will tab ---------- */
function willTab() {
  var w = S.will.status, chs = chapters(), body;
  if (w === 'none') body = '<section class="card"><h2 class="h2">Create your Islamic Will for free</h2><p class="p">Guided, one step at a time. No payment required.</p><button type="button" class="btn navy" data-act="startWill">Start my Will' + ic('next') + '</button></section>';
  else if (w === 'progress') body = primary() + '<section class="card"><h2 class="h3">Your journey</h2>' + journeyMap() + '</section>';
  else if (w === 'complete') body = '<section class="card"><span class="chip c-green">' + ic('check', 16) + 'Completed</span><h2 class="h2">Your Islamic Will is ready.</h2><a class="btn navy" href="#/will/view">View my Will' + ic('next') + '</a></section>' +
    '<div class="list">' + [['Beneficiaries', 'people', '#/will/view/family'], ['Guardians', 'shield', '#/will/view/guardian'], ['Documents', 'print', '#/will/view'], ['Update details', 'pen', '#/will/view/about']].map(function (t) { return '<a class="li" href="' + t[2] + '"><span class="ico">' + ic(t[1]) + '</span><span class="g t">' + t[0] + '</span><span class="chev">' + ic('chev') + '</span></a>'; }).join('') + '</div>';
  else {
    var act = S.will.action && inReview();
    body = '<section class="card ' + (act ? 'amber' : 'tint') + '">' +
      (w === 'ready' ? '<span class="chip c-gold">' + ic('pen', 16) + 'Ready to Sign</span><h2 class="h2">Your Will is ready to sign.</h2><a class="btn navy" href="#/sign">Continue to signing' + ic('next') + '</a>'
        : '<span class="chip ' + (act ? 'c-amber' : 'c-gold') + '">' + ic(act ? 'alert' : 'clock', 16) + (act ? 'Action needed' : stageLabel()) + '</span>' +
          '<div class="kv"><span>Now</span><b>' + esc(STAGE[w].now) + '</b></div><div class="kv"><span>From you</span><b>' + (act ? 'Answer one question' : 'Nothing needed') + '</b></div><div class="kv"><span>Next</span><b>' + esc(STAGE[w].next) + '</b></div>' +
          (act ? '<button type="button" class="btn navy" data-act="answer">Answer question' + ic('next') + '</button>' : '')) + '</section>' +
      '<section class="card">' + timeline() + '</section>' + witnessCard() + '<a class="btn out" href="#/will/view">View my Will</a>';
  }
  return '<main class="scr tabs"><h1 class="h1">Your Will</h1>' + body + '</main>' + nav('will');
}
function viewWill(open) {
  if (S.will.status === 'none') { location.replace('#/will'); return null; }
  return '<div class="plain-hd">' + backBtn('#/will') + helpBtn() + '</div><main class="scr"><h1 class="h1">My Will</h1>' +
    (canEdit() ? '' : '<p class="small">Editing reopens after review.</p>') +
    '<div class="stack">' + reviewList(open, canEdit()) + '</div>' +
    (canPrint() ? '<button type="button" class="btn out noprint" data-act="print">' + ic('print') + 'Print basic Will</button>' : '') + '</main>';
}
A.print = function () { document.querySelectorAll('details.acc').forEach(function (d) { d.open = true; }); window.print(); };
function submitted() {
  return '<main class="scr" style="justify-content:center"><span class="ico green round">' + ic('check', 26) + '</span><h1 class="h1">Your Will is submitted</h1><p class="p">A scholar reviews it next. We’ll email you when anything changes.</p>' +
    '<div class="stack" style="margin-top:12px"><a class="btn navy" href="#/home">Back to Home' + ic('next') + '</a>' + (canPrint() ? '<a class="btn out" href="#/will/view">' + ic('print') + 'View and print my Will</a>' : '') + '</div></main>';
}
R.will = function (a) {
  if (a[0] === 'c') return wizard(+a[1] || 0, +a[2] || 0);
  if (a[0] === 'done') return chapterDone(+a[1] || 0);
  if (a[0] === 'submitted') return submitted();
  if (a[0] === 'view') return viewWill(a[1]);
  return willTab();
};

/* ---------- Signing: two clearly different routes; payment only after choosing the paid one ---------- */
R.sign = function (a) {
  if (S.will.status !== 'ready') { location.replace('#/will'); return null; }
  if (a[0] === 'home') return '<div class="plain-hd">' + backBtn('#/sign') + helpBtn() + '</div><main class="scr"><p class="eyebrow">Sign at home</p><h1 class="h1">Three steps to finish</h1>' +
    '<ol class="tl"><li class="on"><span class="dot"></span><span>Print your Will</span></li><li><span class="dot"></span><span>Sign it with both witnesses present</span></li><li><span class="dot"></span><span>Confirm here</span></li></ol>' +
    '<div class="grow"></div><button type="button" class="btn out" data-act="printWill">' + ic('print') + 'Print my Will</button><button type="button" class="btn navy" data-act="askSigned">I’ve signed my Will' + ic('next') + '</button></main>';
  var p = price('notary');
  return '<div class="plain-hd">' + backBtn('#/home', 'Home') + helpBtn() + '</div><main class="scr"><h1 class="h1">How would you like to sign?</h1>' +
    '<section class="card"><div class="row"><span class="ico">' + ic('house', 24) + '</span><span class="chip c-green">Included · no payment</span></div><h2 class="h3">Sign at home</h2><p class="p">Print your Will and sign it with your two witnesses.</p>' +
    '<details class="acc"><summary>What happens next' + ic('down') + '</summary><div class="in"><p class="p">Print, sign with both witnesses present, then confirm here.</p></div></details>' +
    '<a class="btn out" href="#/sign/home">Sign at home' + ic('next') + '</a></section>' +
    (CFG.products.notary ? '<section class="card navy"><div class="row"><span class="ico navy" style="background:rgba(200,168,104,.16)">' + ic('stamp', 24) + '</span><span class="chip c-ondark">Paid service</span></div><h2 class="h3">Notarized Attestation</h2><p class="p">Sign on Zoom with your attorney and both witnesses.</p>' +
      '<p class="strong" style="color:#FBF8F3">' + p.text + '</p>' +
      '<details class="acc"><summary>What happens next' + ic('down') + '</summary><div class="in"><p class="p">Pay, then ' + esc(CFG.rules.attestNextStep.replace(/^We’ll/, 'we’ll')) + '</p></div></details>' +
      '<a class="btn gold" href="#/pay/notary">Choose Notarized' + ic('next') + '</a></section>' : '') + '</main>';
};
A.printWill = function () { go('#/will/view'); };
A.askSigned = function () { sheet('<h2 class="h2">Confirm you’ve signed</h2><p class="p">You and both witnesses signed the printed Will.</p><button type="button" class="btn navy" data-act="signedHome">Yes, it’s signed</button><button type="button" class="btn quiet" data-act="close">Not yet</button>'); };
A.signedHome = function () { S.will.signing = 'home'; S.will.status = 'complete'; save(); closeSheet(); go('#/home'); };

/* ---------- Payment: reached only from a paid service the user chose ---------- */
R.pay = function (a) {
  var k = a[0], pr = CFG.pricing[k]; if (!pr) { location.replace('#/home'); return null; }
  if (k === 'vault' && S.vault.active) { location.replace('#/vault'); return null; }
  if (k === 'notary' && S.will.status !== 'ready') { location.replace('#/will'); return null; }
  var p = price(k), line = k === 'vault' ? 'One secure place for your estate details.' : 'Sign on Zoom with your attorney and both witnesses.';
  return '<div class="plain-hd">' + backBtn(k === 'vault' ? '#/vault' : '#/sign') + helpBtn() + '</div><main class="scr"><h1 class="h1">Checkout</h1>' +
    '<section class="card tint"><div class="row between"><span class="h3">' + esc(pr.name) + '</span><span class="strong">' + (p.known ? p.text : '[Price from API]') + '</span></div><p class="p">' + line + '</p>' + (pr.period ? '<p class="small">Billed each ' + pr.period + '.</p>' : '') + '</section>' +
    '<form class="stack lg" data-act-submit="pay" data-k="' + k + '"><div class="group">' +
    '<label class="field"><span class="label">Name on card</span><input class="input" autocomplete="cc-name"></label>' +
    '<label class="field"><span class="label">Card number</span><input class="input" inputmode="numeric" autocomplete="cc-number" placeholder="1234 5678 9012 3456"></label>' +
    '<div class="row"><label class="field grow"><span class="label">Expiry</span><input class="input" inputmode="numeric" autocomplete="cc-exp" placeholder="MM / YY"></label><label class="field grow"><span class="label">CVC</span><input class="input" inputmode="numeric" autocomplete="cc-csc" placeholder="123"></label></div></div>' +
    '<button class="btn navy" type="submit">' + (p.known ? 'Pay ' + p.text.split(' / ')[0] : 'Pay') + ic('next') + '</button></form>' +
    '<p class="small center">Prototype: no card is charged.</p>' + LEGAL + '</main>';
};
A.pay = function (form) {
  var k = form.dataset.k;
  if (k === 'vault') S.vault.active = true; else { S.will.signing = 'notary'; S.will.status = 'attest'; }
  save(); go('#/paid/' + k);
};
R.paid = function (a) {
  var v = a[0] === 'vault';
  return '<main class="scr" style="justify-content:center"><span class="ico green round">' + ic('check', 26) + '</span><h1 class="h1">' + (v ? 'My Vault is active' : 'Payment received') + '</h1><p class="p">' + (v ? 'Start with what you know. Add the rest later.' : esc(CFG.rules.attestNextStep)) + '</p>' +
    '<div class="stack" style="margin-top:12px">' + (v ? '<a class="btn navy" href="#/vault">Open My Vault' + ic('next') + '</a><a class="btn quiet" href="#/home">Back to Home</a>' : '<a class="btn navy" href="#/home">Back to Home' + ic('next') + '</a>') + '</div></main>';
};

/* ---------- Vault ---------- */
function vaultState() {
  var started = CFG.vaultModules.filter(function (m) { return S.vault[m.id].length; }).length, all = CFG.vaultModules.length;
  return started === all ? { healthy: true, label: 'Up to date' } : { healthy: false, label: started + ' of ' + all + ' sections started' };
}
function sum(list) { return list.reduce(function (t, x) { return t + (Number(x.amount) || 0); }, 0); }
// One header for every Vault screen: same navy, same gold, same motif.
function vhero(o) {
  return '<header class="vhero">' + (o.top || '') + '<p class="eyebrow">My Vault</p><h1 class="' + (o.small ? 'h2' : 'h1') + '">' + o.h + '</h1>' + (o.p ? '<p class="p">' + o.p + '</p>' : '') + (o.extra || '') + '</header>';
}
function discovery(withNav) {
  var p = price('vault');
  return vhero({ top: withNav ? '' : '<div class="row between"><span></span><a class="iconbtn end" href="#/signin">Sign in</a></div>', h: 'Keep the rest of your estate organized.', p: 'Store important details your family may need later — in one secure place.' }) +
    '<main class="scr' + (withNav ? ' tabs' : '') + '"><div class="list">' + CFG.vaultModules.map(function (m) { return '<div class="li"><span class="ico navy">' + ic(MOD_IC[m.id]) + '</span><span class="g"><span class="t">' + m.name + '</span><br><span class="s">' + m.desc + '</span></span></div>'; }).join('') + '</div>' +
    '<div class="row between"><span class="h3">' + (p.known ? p.text : '[Price from API]') + '</span></div>' +
    '<a class="btn navy" href="' + (S.signedIn ? '#/pay/vault' : '#/account') + '">Start My Vault' + ic('next') + '</a></main>' + (withNav ? nav('vault') : '');
}
R['vault-entry'] = function () { if (S.signedIn) { location.replace('#/vault'); return null; } return discovery(false); };
R.vault = function (a) {
  if (!S.vault.active) return discovery(true);            // never an empty dashboard for someone who doesn't own it
  var m = CFG.vaultModules.filter(function (x) { return x.id === a[0]; })[0];
  if (m) return vaultModule(m);
  var st = vaultState(), v = S.vault;
  return vhero({ h: 'Everything important, in one secure place.', extra: '<div class="stats"><div class="stat"><b>' + money(sum(v.assets)) + '</b><span>Estate value</span></div><div class="stat"><b>' + money(sum(v.obl)) + '</b><span>Obligations</span></div><div class="stat"><b>' + v.sealed.length + '</b><span>Sealed</span></div><div class="stat"><b>' + v.words.length + '</b><span>Final messages</span></div></div>' }) +
    '<main class="scr tabs"><div class="row between"><span class="chip ' + (st.healthy ? 'c-green' : 'c-gold') + '">' + ic(st.healthy ? 'check' : 'clock', 16) + st.label + '</span>' + (v.reviewed ? '<span class="small">Reviewed ' + esc(v.reviewed) + '</span>' : '') + '</div>' +
    '<div class="list">' + CFG.vaultModules.map(function (x) { var n = v[x.id].length; return '<a class="li" href="#/vault/' + x.id + '"><span class="ico">' + ic(MOD_IC[x.id]) + '</span><span class="g"><span class="t">' + x.name + '</span><br><span class="s">' + (n ? n + ' added' : 'Not started') + '</span></span><span class="chev">' + ic('chev') + '</span></a>'; }).join('') + '</div></main>' + nav('vault');
};
function vaultModule(m) {
  var items = S.vault[m.id], types = ['All'].concat(m.types), shown = items.map(function (x, i) { return { x: x, i: i }; }).filter(function (r) { return UI.filter === 'All' || r.x.type === UI.filter; });
  return vhero({ small: true, top: '<div class="row between">' + backBtn('#/vault', 'My Vault') + '</div>', h: m.name, p: m.desc }) +
    '<main class="scr">' + (items.length ? '<div class="filters" role="group" aria-label="Filter">' + types.map(function (t) { return '<button type="button" data-act="filter" data-v="' + t + '" aria-pressed="' + (UI.filter === t) + '">' + t + '</button>'; }).join('') + '</div>' +
      (shown.length ? '<div class="list">' + shown.map(function (r) { return '<button type="button" class="li" data-act="item" data-m="' + m.id + '" data-i="' + r.i + '"><span class="g"><span class="t">' + esc(r.x.name) + '</span><br><span class="s">' + esc(r.x.type) + '</span></span>' + (m.amount && r.x.amount ? '<span class="amt">' + money(r.x.amount) + '</span>' : '') + '<span class="chev">' + ic('chev') + '</span></button>'; }).join('') + '</div>' : '<p class="p">Nothing under ' + esc(UI.filter) + ' yet.</p>')
      : '<section class="card"><h2 class="h3">Nothing added yet</h2><p class="p">Start with one. You can add more anytime.</p></section>') +
    '<div class="grow"></div></main><div class="foot"><button type="button" class="btn navy" data-act="addItem" data-m="' + m.id + '">' + ic('plus') + 'Add ' + (/^[aeiou]/.test(m.one) ? 'an ' : 'a ') + m.one + '</button></div>';
}
A.filter = function (el) { UI.filter = el.dataset.v; render(); };
A.addItem = function (el) {
  var m = CFG.vaultModules.filter(function (x) { return x.id === el.dataset.m; })[0];
  if (!el.dataset.keep) S.draft = { type: '' };
  sheet('<h2 class="h2">Add ' + (/^[aeiou]/.test(m.one) ? 'an ' : 'a ') + m.one + '</h2>' + inp('Name', 'draft.name') + sel('Type', 'draft.type', m.types) +
    (m.amount ? inp('Amount', 'draft.amount', { opt: true, mode: 'decimal', hint: 'In ' + CFG.currency + '. An estimate is fine.' }) : '') +
    '<button type="button" class="btn navy" data-act="saveItem" data-m="' + m.id + '">Save</button><button type="button" class="btn quiet" data-act="close">Cancel</button>');
};
A.saveItem = function (el) {
  E = {}; need('draft.name', 'Enter a name.'); need('draft.type', 'Choose a type.');
  var amt = String(S.draft.amount || '').replace(/[$,\s]/g, '');
  if (amt && isNaN(Number(amt))) E['draft.amount'] = 'Enter a number, like 12000.';
  if (Object.keys(E).length) { A.addItem({ dataset: { m: el.dataset.m, keep: '1' } }); E = {}; return; }
  S.vault[el.dataset.m].push({ name: S.draft.name.trim(), type: S.draft.type, amount: amt ? Number(amt) : null });
  delete S.draft; UI.filter = 'All'; save(); closeSheet(); render(); toast('Saved');
};
A.item = function (el) {
  var x = S.vault[el.dataset.m][+el.dataset.i];
  sheet('<h2 class="h2">' + esc(x.name) + '</h2><div class="kv"><span>Type</span><b>' + esc(x.type) + '</b></div>' + (x.amount ? '<div class="kv"><span>Amount</span><b>' + money(x.amount) + '</b></div>' : '') +
    '<button type="button" class="btn out" data-act="close">Done</button><button type="button" class="btn danger" data-act="rmItem" data-m="' + el.dataset.m + '" data-i="' + el.dataset.i + '">Remove</button>');
};
A.rmItem = function (el) { S.vault[el.dataset.m].splice(+el.dataset.i, 1); save(); closeSheet(); render(); };
A.reviewPlan = function () { S.vault.reviewed = 'today'; save(); go('#/vault'); };

/* ---------- Profile ---------- */
R.profile = function () {
  var v = S.vault.active;
  return '<main class="scr tabs"><h1 class="h1">Profile</h1>' +
    '<section class="card"><div class="row"><span class="ico navy round">' + ic('user', 24) + '</span><span><span class="strong">' + esc(S.user.name || firstName()) + '</span><br><span class="small">' + esc(S.user.email) + '</span></span></div></section>' +
    '<section class="stack"><h2 class="h3">Your plan</h2><div class="list">' +
    '<div class="li"><span class="g"><span class="t">Islamic Will</span><br><span class="s">Create and print</span></span><span class="chip c-green">Free</span></div>' +
    '<a class="li" href="#/vault"><span class="g"><span class="t">My Vault</span><br><span class="s">' + (v ? price('vault').text : 'Not added') + '</span></span>' + (v ? '<span class="chip c-green">Active</span>' : '<span class="chev">' + ic('chev') + '</span>') + '</a>' +
    (S.will.signing === 'notary' ? '<div class="li"><span class="g"><span class="t">Notarized Attestation</span><br><span class="s">' + (S.will.status === 'complete' ? 'Completed' : 'Being arranged') + '</span></span><span class="chip c-gold">Paid</span></div>' : '') + '</div></section>' +
    '<section class="stack"><h2 class="h3">People with access</h2>' + (S.invited.length ? '<div class="list">' + S.invited.map(function (p, i) { return '<div class="li"><span class="g"><span class="t">' + esc(p.name) + '</span><br><span class="s">' + esc(p.email || p.rel || 'No email yet') + '</span></span>' + removeBtn('rmInvite', i, p.name) + '</div>'; }).join('') + '</div>' : '<p class="p">No one invited yet.</p>') +
    '<button type="button" class="btn out" data-act="invite">' + ic('plus') + 'Invite family</button></section>' +
    '<div class="list"><button type="button" class="li" data-act="help"><span class="g t">Get help</span><span class="chev">' + ic('chev') + '</span></button>' +
    '<button type="button" class="li" data-act="legal" data-v="terms"><span class="g t">Terms of Use</span><span class="chev">' + ic('chev') + '</span></button>' +
    '<button type="button" class="li" data-act="legal" data-v="privacy"><span class="g t">Privacy Policy</span><span class="chev">' + ic('chev') + '</span></button></div>' +
    '<button type="button" class="btn out" data-act="signout">Sign out</button></main>' + nav('profile');
};
A.invite = function (el) {
  if (!el || !el.dataset || !el.dataset.keep) S.draft = {};
  var fam = people().filter(function (x) { return x.adult && !S.invited.some(function (i) { return norm(i.name) === norm(x.name); }); });
  sheet('<h2 class="h2">Invite family</h2><p class="p">They’ll get an email. They can’t see anything yet.</p>' +
    // Reuse people already entered in the Will
    (fam.length ? '<div class="filters" style="margin:0;padding:0">' + fam.map(function (x) { return '<button type="button" data-act="inviteUse" data-v="' + esc(x.name) + '">' + esc(x.name) + '</button>'; }).join('') + '</div>' : '') +
    inp('Name', 'draft.name') + inp('Email', 'draft.email', { type: 'email', mode: 'email' }) +
    '<button type="button" class="btn navy" data-act="inviteSend">Send invitation</button><button type="button" class="btn quiet" data-act="close">Cancel</button>');
};
A.inviteUse = function (el) { S.draft.name = el.dataset.v; A.invite({ dataset: { keep: '1' } }); };
A.inviteSend = function () {
  E = {}; need('draft.name', 'Enter a name.'); if (!validEmail(S.draft.email)) E['draft.email'] = 'Enter a valid email, like name@example.com.';
  if (Object.keys(E).length) { A.invite({ dataset: { keep: '1' } }); E = {}; return; }
  S.invited.push({ name: S.draft.name.trim(), email: S.draft.email.trim() }); delete S.draft; save(); closeSheet(); render();
};
A.rmInvite = function (el) { S.invited.splice(+el.dataset.i, 1); save(); render(); };
A.signout = function () { S.signedIn = false; save(); go('#/signin'); };

if (!window.MW_DEFER) render();
