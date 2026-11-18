/* The Will: Chapter → Section → Task. One section per screen, light header, one primary action. */
'use strict';

/* ---------- people already entered are reused everywhere ---------- */
function people() {
  var d = S.will.d, l = [];
  if (d.married === 'yes' && d.spouseFirst) l.push({ id: 'spouse', name: (d.spouseFirst + ' ' + (d.spouseLast || '')).trim(), rel: 'Spouse', adult: true });
  (d.children || []).forEach(function (c, i) { if (c.name) l.push({ id: 'child:' + i, name: c.name, rel: 'Child', adult: !c.minor }); });
  (d.siblings || []).forEach(function (s, i) { if (s.name) l.push({ id: 'sib:' + i, name: s.name, rel: 'Sibling', adult: true }); });
  return l;
}
function hasMinor() { return (S.will.d.children || []).some(function (c) { return c.name && c.minor; }); }
function chapters() {
  return CFG.chapters.map(function (c) { return { id: c.id, title: c.title, secs: c.sections.filter(function (s) { return s !== 'guardian' || hasMinor(); }) }; });
}
function who(ref) {
  if (!ref || !ref.src) return '';
  if (ref.src === 'new') return ((ref.first || '') + ' ' + (ref.last || '')).trim();
  if (ref.src === 'exec') return who(S.will.d.exec);
  var p = people().filter(function (x) { return x.id === ref.src; })[0];
  return p ? p.name : '';
}
function willShares() {
  var d = S.will.d, n = function (k) { return (d.children || []).filter(function (c) { return c.name && c.kind === k; }).length; };
  return d.sex ? shares({ sex: d.sex, married: d.married === 'yes', sons: n('Son'), daughters: n('Daughter'), father: d.father === 'yes', mother: d.mother === 'yes' }) : [];
}
function wasUsed() { return Math.round((S.will.d.was || []).reduce(function (t, r) { return t + (Number(r.pct) || 0); }, 0) * 10) / 10; }
function rows(path, list, render) { return list.map(function (x, i) { return render(x, i, path + '.' + i); }).join(''); }
function removeBtn(act, i, label) { return '<button type="button" class="iconbtn end" data-act="' + act + '" data-i="' + i + '" aria-label="Remove ' + esc(label) + '">' + ic('x', 20) + 'Remove</button>'; }

/* ---------- sections: t = title, d = one short line, body = fields, ok = validation ---------- */
var SEC = {
  name: {
    t: 'Your legal name', d: 'As it appears on your ID.',
    body: function () {
      return '<div class="group">' + inp('First name', 'will.d.first', { ac: 'given-name' }) + inp('Middle name', 'will.d.middle', { opt: true, ac: 'additional-name' }) +
        inp('Last name', 'will.d.last', { ac: 'family-name' }) + inp('Preferred name', 'will.d.preferred', { opt: true }) + '</div>' +
        '<div class="group">' + dob('Date of birth', 'will.d.dob') + sel('Gender', 'will.d.sex', ['Male', 'Female']) + '</div>';
    },
    ok: function () {
      need('will.d.first', 'Enter your first name.'); need('will.d.last', 'Enter your last name.'); need('will.d.sex', 'Choose one.');
      var a = age(S.will.d.dob);
      if (a == null) E['will.d.dob'] = 'Choose the day, month and year.';
      else if (a < CFG.rules.minAge) E['will.d.dob'] = 'You need to be ' + CFG.rules.minAge + ' or older to make a Will.';
    }
  },
  contact: {
    t: 'Contact information', d: 'How we reach you about your Will.',
    body: function () { return '<div class="group">' + inp('Email', 'will.d.email', { type: 'email', mode: 'email', ac: 'email' }) + inp('Phone', 'will.d.phone', { type: 'tel', mode: 'tel', ac: 'tel-national', ph: '416 555 0123', hint: 'Canadian number.' }) + '</div>'; },
    ok: function () {
      if (!validEmail(S.will.d.email)) E['will.d.email'] = 'Enter a valid email, like name@example.com.';
      if (!caPhone(S.will.d.phone)) E['will.d.phone'] = 'Enter a 10-digit Canadian number, like 416 555 0123.';
      else S.will.d.phone = caPhone(S.will.d.phone);
    }
  },
  residency: {
    t: 'Where you live', d: 'Your Will follows the rules of your province.',
    body: function () { return '<div class="group">' + sel('Province or territory', 'will.d.province', CFG.provinces) + sel('Citizenship', 'will.d.citizenship', CFG.countries) + '</div>'; },
    ok: function () { need('will.d.province', 'Choose your province or territory.'); need('will.d.citizenship', 'Choose your citizenship.'); }
  },
  spouse: {
    t: 'Your spouse', d: 'We’ll reuse this later, so you only enter it once.',
    body: function () {
      return '<div class="group" role="radiogroup" aria-label="Are you married?"><span class="label">Are you married?</span>' + opt('Yes', 'will.d.married', 'yes') + opt('No', 'will.d.married', 'no') + err('will.d.married') + '</div>' +
        (S.will.d.married === 'yes' ? '<div class="group">' + inp('Spouse’s first name', 'will.d.spouseFirst') + inp('Spouse’s last name', 'will.d.spouseLast') + '</div>' : '');
    },
    ok: function () {
      if (!need('will.d.married', 'Choose Yes or No.')) return;
      if (S.will.d.married === 'yes') { need('will.d.spouseFirst', 'Enter your spouse’s first name.'); need('will.d.spouseLast', 'Enter your spouse’s last name.'); }
    }
  },
  children: {
    t: 'Your children', d: 'Add each child. Leave it empty if you have none.',
    body: function () {
      var l = S.will.d.children;
      return '<div class="stack">' + (l.length ? rows('will.d.children', l, function (c, i, p) {
        return '<div class="card"><div class="row between"><span class="strong">Child ' + (i + 1) + '</span>' + removeBtn('rmChild', i, 'child ' + (i + 1)) + '</div>' + inp('Full name', p + '.name') + sel('Son or daughter', p + '.kind', ['Son', 'Daughter']) +
          '<label class="check"><input type="checkbox" data-f="' + p + '.minor"' + (c.minor ? ' checked' : '') + '>Under 18</label></div>';
      }) : '<p class="p">No children added.</p>') +
        '<button type="button" class="btn out" data-act="addChild">' + ic('plus') + 'Add a child</button></div>';
    },
    ok: function () { S.will.d.children.forEach(function (c, i) { need('will.d.children.' + i + '.name', 'Enter a name, or remove this child.'); need('will.d.children.' + i + '.kind', 'Choose one.'); }); }
  },
  relatives: {
    t: 'Parents and siblings', d: 'Close relatives can affect Islamic shares.',
    body: function () {
      var l = S.will.d.siblings;
      return '<div class="group" role="radiogroup" aria-label="Is your father living?"><span class="label">Is your father living?</span>' + opt('Yes', 'will.d.father', 'yes') + opt('No', 'will.d.father', 'no') + err('will.d.father') + '</div>' +
        '<div class="group" role="radiogroup" aria-label="Is your mother living?"><span class="label">Is your mother living?</span>' + opt('Yes', 'will.d.mother', 'yes') + opt('No', 'will.d.mother', 'no') + err('will.d.mother') + '</div>' +
        '<div class="group"><span class="label">Siblings<i>Optional</i></span>' + rows('will.d.siblings', l, function (s, i, p) {
          return '<div class="row" style="align-items:flex-end"><div class="grow">' + inp('Sibling ' + (i + 1), p + '.name') + '</div>' + removeBtn('rmSib', i, 'sibling ' + (i + 1)) + '</div>';
        }) + '<button type="button" class="btn out" data-act="addSib">' + ic('plus') + 'Add a sibling</button></div>';
    },
    ok: function () { need('will.d.father', 'Choose Yes or No.'); need('will.d.mother', 'Choose Yes or No.'); S.will.d.siblings = S.will.d.siblings.filter(function (s) { return String(s.name || '').trim(); }); }
  },
  executor: {
    t: 'Primary executor', d: 'The person who carries out your Will.',
    body: function () { return rolePicker('will.d.exec', false); },
    ok: function () { roleOk('will.d.exec', 'Choose your executor.'); }
  },
  guardian: {
    t: 'Guardian', d: 'Who cares for your children under 18.',
    body: function () { return rolePicker('will.d.guard', true); },
    ok: function () { roleOk('will.d.guard', 'Choose a guardian.'); }
  },
  wasiyyah: {
    t: 'Wasiyyah', d: 'Leave up to one third to charity or people outside your heirs. Optional.',
    body: function () {
      var l = S.will.d.was, max = CFG.rules.wasiyyahMaxPct, used = wasUsed(), left = Math.round((max - used) * 10) / 10, n = l.filter(function (r) { return Number(r.pct) > 0; }).length;
      return '<div class="card tint"><p class="eyebrow">Wasiyyah budget</p><div class="row between"><span class="h2">' + used + '% used</span><span class="small">' + n + ' recipient' + (n === 1 ? '' : 's') + ' allocated</span></div>' +
        '<div class="bar" role="img" aria-label="' + used + '% of ' + max + '% used"><i style="width:' + Math.min(100, used / max * 100) + '%"></i></div>' +
        '<div class="row between"><span class="strong">' + (left >= 0 ? left + '% available' : 'Over by ' + (-left) + '%') + '</span>' +
        // Quick Fill only when there is something left to share out
        (l.length && left > 0 ? '<button type="button" class="btn out sm" data-act="splitEq">Split equally</button>' : '') + '</div>' + err('was') + '</div>' +
        '<div class="stack">' + rows('will.d.was', l, function (r, i, p) {
          return '<div class="card"><div class="row between"><span class="strong">Recipient ' + (i + 1) + '</span>' + removeBtn('rmWas', i, 'recipient ' + (i + 1)) + '</div>' + inp('Name', p + '.name') +
            '<div class="row" style="align-items:flex-end"><div class="grow">' + sel('Type', p + '.type', ['Charity', 'Person']) + '</div>' +
            '<label class="field"><span class="label">Share</span><span class="pct"><input class="input" data-f="' + p + '.pct" data-re data-num type="number" min="0" max="' + max + '" step="0.1" inputmode="decimal" value="' + esc(r.pct == null ? '' : r.pct) + '"><span class="strong">%</span></span></label></div></div>';
        }) + '<button type="button" class="btn out" data-act="addWas">' + ic('plus') + 'Add a recipient</button></div>';
    },
    ok: function () {
      S.will.d.was = S.will.d.was.filter(function (r) { return String(r.name || '').trim() || Number(r.pct) > 0; });
      S.will.d.was.forEach(function (r, i) { need('will.d.was.' + i + '.name', 'Enter a name.'); if (!r.type) r.type = 'Charity'; });
      if (wasUsed() > CFG.rules.wasiyyahMaxPct) E.was = 'That’s more than your ' + CFG.rules.wasiyyahMaxPct + '% budget. Lower a share to continue.';
    }
  },
  witness1: { t: 'Witness 1', d: 'Two adults who don’t inherit under this Will.', body: function () { return witness(0); }, ok: function () { witnessOk(0); } },
  witness2: { t: 'Witness 2', d: 'Your second witness.', body: function () { return witness(1); }, ok: function () { witnessOk(1); } }
};


/* ================= The journey: a state machine, not a page sequence =================
   Every section is a task. A task is done, now, or later. The system always knows the one task that is "now":
   the first task that is not done and still applies to this person (no guardian step without a child under 18).
   Screens ask the journey where to go; they never decide it themselves. */
var TASK = {            // [what to do, why — one short line each]
  name: ['Enter your legal name', 'It goes on the Will itself.'], contact: ['Add your contact details', 'So we can reach you about your Will.'], residency: ['Tell us where you live', 'Your province decides how a Will is signed.'],
  spouse: ['Add your spouse', 'We reuse this later for your executor and guardian.'], children: ['Add your children', 'Children under 18 need a guardian.'], relatives: ['Add parents and siblings', 'They can affect how shares are divided.'],
  executor: ['Choose your executor', 'The person who will manage your estate.'], guardian: ['Choose a guardian', 'Who would care for your children under 18.'],
  wasiyyah: ['Set your Wasiyyah', 'Optional. Up to one third for charity or others.'], witness1: ['Add your first witness', 'Two adults who do not inherit from this Will.'], witness2: ['Add your second witness', 'The second of your two witnesses.'],
  review: ['Review and submit', 'Check each part, then send it for review.']
};
function ensureSec() {
  var w = S.will;
  if (!w.secDone) { w.secDone = {}; chapters().forEach(function (ch) { if (w.done.indexOf(ch.id) >= 0) ch.secs.forEach(function (s) { w.secDone[s] = true; }); }); }
  return w.secDone;
}
function journey() {
  var sd = ensureSec(), out = [], found = false;
  chapters().forEach(function (ch, ci) { ch.secs.forEach(function (id, si) { var d = !!sd[id], st = d ? 'done' : found ? 'later' : 'now'; if (!d) found = true; out.push({ ci: ci, si: si, id: id, ch: ch, t: TASK[id][0], why: TASK[id][1], state: st }); }); });
  // a chapter is complete when every task that applies is done — recomputed, so a new guardian step reopens its chapter
  S.will.done = chapters().filter(function (ch) { return ch.secs.every(function (s) { return sd[s]; }); }).map(function (ch) { return ch.id; });
  return out;
}
function nextTask() { var j = journey(); return j.filter(function (x) { return x.state === 'now'; })[0] || j[j.length - 1]; }
function chState(j, ch) { var l = j.filter(function (x) { return x.ch.id === ch.id; }); return l.every(function (x) { return x.state === 'done'; }) ? 'done' : l.some(function (x) { return x.state === 'now'; }) ? 'now' : 'later'; }
function chMins(id) { var c = CFG.chapters.filter(function (x) { return x.id === id; })[0]; return c && c.mins; }
// Compact map for orientation. Finished chapters can be reviewed; later ones are shown but not open.
function journeyMap() {
  var j = journey(), mk = function (st) { return '<span class="mk">' + (st === 'done' ? ic('check', 16) : '') + '</span>'; };
  return '<ol class="jmap">' + chapters().map(function (ch, ci) {
    var st = chState(j, ch), inner = mk(st) + '<span class="g"><span class="t">' + esc(ch.title) + '</span><span class="s">' + { done: 'Done', now: 'Now', later: 'Later' }[st] + '</span></span>';
    return '<li class="' + st + '"' + (st === 'now' ? ' aria-current="step"' : '') + '>' + (st === 'done' ? '<a href="#/will/c/' + ci + '/0">' + inner + '<span class="rv">Review</span></a>' : '<div>' + inner + '</div>') +
      (st === 'now' && ch.secs.length > 1 ? '<ol>' + j.filter(function (x) { return x.ch.id === ch.id; }).map(function (x) { return '<li class="' + x.state + '">' + (x.state === 'done' ? ic('check', 16) : x.state === 'now' ? ic('next', 16) : '<span style="width:16px"></span>') + x.t + '</li>'; }).join('') + '</ol>' : '') + '</li>';
  }).join('') + '</ol><p class="small">Later steps open as you go.</p>';
}
A.journey = function () {
  var n = doneCount(), nt = nextTask();
  sheet('<h2 class="h2">Your journey</h2><p class="p strong">' + n + ' of ' + chapters().length + ' chapters complete</p>' + journeyMap() +
    (S.will.status === 'progress' ? '<button type="button" class="btn navy" data-act="startWill">Continue: ' + nt.t + ic('next') + '</button>' : '') + '<button type="button" class="btn quiet" data-act="close">Close</button>');
};
// A step that is still "later" cannot be opened by its address; the person is taken to the step that is "now".
function guardStep(ci, si) {
  if (S.will.status !== 'progress') return false;
  var me = journey().filter(function (x) { return x.ci === ci && x.si === si; })[0];
  if (me && me.state !== 'later') return false;
  var nt = nextTask(); location.replace('#/will/c/' + nt.ci + '/' + nt.si); return true;
}
// After submission each witness has an emailed invitation; the person can see that and send it again.
function witnessCard() {
  var w = (S.will.d.w || []).filter(function (x) { return x.first; });
  if (S.will.status === 'none' || S.will.status === 'progress' || !w.length) return '';
  return '<section class="card"><h2 class="h3">Witnesses</h2><p class="small">Each witness was emailed an invitation to confirm.</p><div>' + w.map(function (x, i) {
    return '<div class="kv" style="align-items:center"><span><span class="strong">' + esc((x.first + ' ' + (x.last || '')).trim()) + '</span><br><span class="small">' + esc(x.email || 'No email') + '</span></span><span class="row" style="gap:8px"><span class="chip c-gold">' + ic('mail', 16) + 'Invited</span><button type="button" class="btn out sm" data-act="resendW" data-i="' + i + '">Resend</button></span></div>';
  }).join('') + '</div></section>';
}
A.resendW = function () { toast('Invitation sent again'); };
A.roleUse = function (el) { set(el.dataset.p + '.src', el.dataset.v); delete UI['other:' + el.dataset.p]; E = {}; save(); render(); };
A.roleOther = function (el) { UI['other:' + el.dataset.p] = true; render(); };

/* Executor / Guardian: pick someone already entered, or add a new person. */
function rolePicker(p, isGuard) {
  var r = get(p) || {}, execSrc = (S.will.d.exec || {}).src, o = '', spouse = people().filter(function (x) { return x.id === 'spouse'; })[0];
  var extra = '';
  if (r.src === 'new') extra += '<div class="group">' + inp('First name', p + '.first') + inp('Last name', p + '.last') + sel('Relationship', p + '.rel', ['Relative', 'Friend', 'Professional', 'Other'], { opt: true }) + '</div>';
  if (r.src && !isGuard) extra += '<div class="group">' + inp('Email', p + '.email', { opt: true, type: 'email', mode: 'email' }) + inp('Phone', p + '.phone', { opt: true, type: 'tel', mode: 'tel', hint: 'Canadian number.' }) + '</div>';
  // Smart prompt: when we already know a likely person, ask one question instead of showing a list.
  var sug = isGuard ? (execSrc ? { src: 'exec', q: 'Should ' + esc(who(S.will.d.exec)) + ' also be the guardian?', why: 'You already chose them as your executor.', yes: 'Same as executor', no: 'Choose another person' } : null)
    : (spouse ? { src: 'spouse', q: 'Use your spouse as executor?', why: 'You already added ' + esc(spouse.name) + '.', yes: 'Use ' + esc(spouse.name), no: 'Choose someone else' } : null);
  if (!r.src && sug && !UI['other:' + p]) return '<div class="group prompt" role="group" aria-label="Suggestion"><p class="eyebrow">Suggestion</p><h2 class="h3">' + sug.q + '</h2><p class="small">' + sug.why + '</p>' +
    '<button type="button" class="opt" data-act="roleUse" data-p="' + p + '" data-v="' + sug.src + '"><span class="radio"></span><span>' + sug.yes + '<small>No retyping needed</small></span></button>' +
    '<button type="button" class="opt" data-act="roleOther" data-p="' + p + '"><span class="radio"></span><span>' + sug.no + '</span></button>' + err(p + '.src') + '</div>';
  // Already chosen from people we know: show the choice and how to change it.
  if (r.src && r.src !== 'new' && !UI['other:' + p]) return '<div class="group prompt"><div class="row between"><span><span class="eyebrow">' + (isGuard ? 'Your guardian' : 'Your executor') + '</span><br><span class="h3">' + ic('check', 20) + ' ' + esc(who(r)) + '</span></span><button type="button" class="btn out sm" data-act="roleOther" data-p="' + p + '">Change</button></div><p class="small">We use the details you already entered.</p></div>' + extra;
  if (isGuard && execSrc) o += opt('Same as executor', p + '.src', 'exec', esc(who(S.will.d.exec)));
  people().forEach(function (x) { if (x.adult && !(isGuard && x.id === execSrc)) o += opt('Use ' + esc(x.name), p + '.src', x.id, x.rel); });
  o += opt('Someone else', p + '.src', 'new');
  return '<div class="group" role="radiogroup" aria-label="Choose a person">' + o + err(p + '.src') + '</div>' + extra;
}
function roleOk(p, msg) {
  var r = get(p) || {};
  if (!r.src) { E[p + '.src'] = msg; return; }
  if (r.src === 'new') { need(p + '.first', 'Enter a first name.'); need(p + '.last', 'Enter a last name.'); }
  if (r.email && !validEmail(r.email)) E[p + '.email'] = 'Enter a valid email, or leave it empty.';
  if (r.phone && !caPhone(r.phone)) E[p + '.phone'] = 'Enter a 10-digit Canadian number, or leave it empty.';
}
function witness(i) {
  var p = 'will.d.w.' + i, w = S.will.d.w[i] || {};
  return '<div class="group">' + inp('First name', p + '.first') + inp('Last name', p + '.last') + err(p) + '</div>' +
    '<div class="group">' + dob('Date of birth', p + '.dob') + '</div>' +
    '<div class="group">' + inp('Email', p + '.email', { type: 'email', mode: 'email', hint: 'We’ll email them an invitation.' }) +
    (i === 1 ? '<label class="check"><input type="checkbox" data-f="' + p + '.same" data-re' + (w.same ? ' checked' : '') + '>Same address as Witness 1</label>' : '') +
    (i === 1 && w.same ? '' : inp('Address', p + '.addr', { ac: 'street-address' })) + '</div>';
}
function witnessOk(i) {
  var p = 'will.d.w.' + i, w = S.will.d.w[i] || (S.will.d.w[i] = {}), d = S.will.d;
  need(p + '.first', 'Enter a first name.'); need(p + '.last', 'Enter a last name.');
  var a = age(w.dob);
  if (a == null) E[p + '.dob'] = 'Choose the day, month and year.';
  else if (a < CFG.rules.minAge) E[p + '.dob'] = 'Witnesses must be ' + CFG.rules.minAge + ' or older.';
  if (!validEmail(w.email)) E[p + '.email'] = 'Enter a valid email, like name@example.com.';
  if (!(i === 1 && w.same)) need(p + '.addr', 'Enter an address.');
  var full = norm((w.first || '') + ' ' + (w.last || ''));
  if (!full) return;
  var heirs = people().map(function (x) { return norm(x.name); }).concat(d.was.filter(function (r) { return r.type === 'Person'; }).map(function (r) { return norm(r.name); }));
  if (heirs.indexOf(full) >= 0) E[p] = 'A witness can’t also inherit under this Will. Choose someone else.';
  else if (i === 1 && full === norm((d.w[0].first || '') + ' ' + (d.w[0].last || ''))) E[p] = 'Choose a different person from Witness 1.';
}

A.addChild = function () { S.will.d.children.push({ name: '', minor: false }); save(); render(); };
A.rmChild = function (el) { S.will.d.children.splice(+el.dataset.i, 1); save(); render(); };
A.addSib = function () { S.will.d.siblings.push({ name: '' }); save(); render(); };
A.rmSib = function (el) { S.will.d.siblings.splice(+el.dataset.i, 1); save(); render(); };
A.addWas = function () { S.will.d.was.push({ name: '', type: 'Charity', pct: '' }); save(); render(); };
A.rmWas = function (el) { S.will.d.was.splice(+el.dataset.i, 1); E = {}; save(); render(); };
A.splitEq = function () { var l = S.will.d.was, each = Math.floor(CFG.rules.wasiyyahMaxPct / l.length * 10) / 10; l.forEach(function (r) { r.pct = each; }); E = {}; save(); render(); };

/* ---------- summaries, reused by Review, View my Will and print ---------- */
function summary(id) {
  var d = S.will.d, yn = function (v) { return v === 'yes' ? 'Yes' : v === 'no' ? 'No' : ''; };
  if (id === 'about') return [['Name', [d.first, d.middle, d.last].filter(Boolean).join(' ')], ['Date of birth', fmtDob(d.dob)], ['Gender', d.sex], ['Email', d.email], ['Phone', fmtPhone(d.phone)], ['Province', d.province], ['Citizenship', d.citizenship]];
  if (id === 'family') return [['Spouse', d.married === 'yes' ? (d.spouseFirst + ' ' + d.spouseLast) : 'Not married'], ['Children', d.children.map(function (c) { return c.name + (c.minor ? ' (under 18)' : ''); }).join(', ') || 'None'], ['Father living', yn(d.father)], ['Mother living', yn(d.mother)], ['Siblings', d.siblings.map(function (s) { return s.name; }).join(', ') || 'None']];
  if (id === 'executor') return [['Primary executor', who(d.exec)]];
  if (id === 'guardian') return [['Guardian', hasMinor() ? who(d.guard) : 'Not needed']];
  if (id === 'wasiyyah') {
    // Wasiyyah first, then the heirs' Islamic shares of what remains, shown as a share of the whole estate.
    var rest = (100 - wasUsed()) / 100, rows = d.was.length ? d.was.map(function (r) { return ['Wasiyyah · ' + r.name, (Number(r.pct) || 0) + '%']; }) : [['Wasiyyah', 'None']];
    willShares().forEach(function (h) { rows.push([h.n, pct(h.f * rest) + '%']); });
    return rows;
  }
  if (id === 'witnesses') return d.w.map(function (w, i) { return ['Witness ' + (i + 1), ((w.first || '') + ' ' + (w.last || '')).trim()]; });
  return [];
}
// The six things people check, in the order the meeting listed them → where each is edited.
var REVIEW = [
  { id: 'about', label: 'About You', ch: 'about', sec: 0 }, { id: 'family', label: 'Family', ch: 'family', sec: 0 },
  { id: 'executor', label: 'Executor', ch: 'trusted', sec: 0 }, { id: 'guardian', label: 'Guardians', ch: 'trusted', sec: 1 },
  { id: 'wasiyyah', label: 'Distribution', ch: 'wasiyyah', sec: 0 }, { id: 'witnesses', label: 'Witnesses', ch: 'witnesses', sec: 0 }
];
function chIndex(id) { return chapters().map(function (c) { return c.id; }).indexOf(id); }
function canEdit() { return S.will.status === 'progress' || S.will.status === 'complete' || (CFG.rules.editWhileInReview && S.will.status !== 'none'); }
function reviewList(openId, withEdit) {
  return REVIEW.map(function (r) {
    var done = S.will.done.indexOf(r.ch) >= 0, kv = summary(r.id), skip = r.id === 'guardian' && !hasMinor();
    var href = '#/will/c/' + chIndex(r.ch) + '/' + (skip ? 0 : r.sec);
    return '<details class="acc"' + (openId === r.ch || openId === r.id ? ' open' : '') + '><summary><span class="row">' +
      (done ? '<span class="ico green round" style="width:32px;height:32px">' + ic('check', 18) + '</span>' : '<span class="chip c-amber">' + ic('alert', 16) + 'To do</span>') + r.label + '</span>' + ic('down') + '</summary><div class="in">' +
      (done ? kv.map(function (x) { return '<div class="kv"><span>' + esc(x[0]) + '</span><b>' + esc(x[1] || '—') + '</b></div>'; }).join('') : '<p class="p">Not finished yet.</p>') +
      (withEdit && !skip ? '<a class="btn out sm noprint" href="' + href + '">' + ic('pen', 18) + (done ? 'Edit' : 'Complete') + '</a>' : '') + '</div></details>';
  }).join('');
}

/* ---------- wizard screen ---------- */
function wizard(ci, si) {
  var chs = chapters(), ch = chs[ci];
  if (!ch) { location.replace('#/will'); return null; }
  si = Math.min(si, ch.secs.length - 1);
  if (guardStep(ci, si)) return null;
  var id = ch.secs[si], def = SEC[id], n = ch.secs.length, inFlow = S.will.status === 'progress';
  if (inFlow) { S.will.ch = ci; S.will.sec = si; save(); }
  var back = si > 0 ? '#/will/c/' + ci + '/' + (si - 1) : inFlow ? (ci > 0 ? '#/will/c/' + (ci - 1) + '/' + (chs[ci - 1].secs.length - 1) : '#/will') : '#/will/view';
  var head = '<header class="whd"><div class="top">' + backBtn(back) + helpBtn() + '</div>' +
    '<p class="eyebrow">Chapter ' + (ci + 1) + ' of ' + chs.length + ' · ' + esc(ch.title) + '</p>' +
    // The segments are sections of THIS chapter, and say so. Chapter progress is the line above.
    (n > 1 ? '<div class="segs" aria-hidden="true">' + ch.secs.map(function (_, i) { return '<i class="' + (i < si ? 'done' : i === si ? 'on' : '') + '"></i>'; }).join('') + '</div>' : '') +
    // Compact progress; the full map opens on request instead of sitting on screen.
    '<div class="row between"><span class="small strong">' + (n > 1 ? 'Step ' + (si + 1) + ' of ' + n + ' · ' : '') + doneCount() + ' of ' + chs.length + ' chapters done</span><button type="button" class="termlink" data-act="journey">View journey</button></div>';
  if (id === 'review') {
    var missing = REVIEW.filter(function (r) { return S.will.done.indexOf(r.ch) < 0; }).length;
    return head + '<h1 class="h1">Review your Will</h1><p class="p">Check each part. Edit anything.</p></header>' +
      '<main class="scr"><div class="stack">' + reviewList(null, true) + '</div></main>' +
      '<div class="foot">' + (missing ? '<p class="small center">Finish the parts marked “To do” to submit.</p>' : '') +
      '<button type="button" class="btn navy" data-act="askSubmit"' + (missing ? ' disabled' : '') + '>Submit my Will' + ic('next') + '</button>' +
      '<a class="btn quiet" href="#/home">Save and go Home</a></div>';
  }
  return head + '<h1 class="h1">' + TASK[id][0] + '</h1><p class="p">' + def.d + '</p>' + termLink(TERM_OF[id]) + '</header>' +
    '<main class="scr"><form data-act-submit="wnext" data-ci="' + ci + '" data-si="' + si + '" novalidate>' + def.body() + '<button type="submit" hidden></button></form></main>' +
    '<div class="foot"><button type="button" class="btn navy" data-act="wnext" data-ci="' + ci + '" data-si="' + si + '">' + (inFlow ? 'Continue' : 'Save changes') + ic('next') + '</button>' +
    (inFlow ? '<a class="btn quiet" href="#/home">Save and go Home</a>' : '') + '</div>';
}
A.wnext = function (el) {
  var ci = +el.dataset.ci, si = +el.dataset.si, chs = chapters(), ch = chs[ci], id = ch.secs[si], def = SEC[id];
  E = {}; def.ok();
  if (Object.keys(E).length) { save(); return render(); }
  var sd = ensureSec(), was = !!sd[id]; sd[id] = true; journey(); save();
  if (S.will.status !== 'progress') { toast('Changes saved'); return go('#/will/view/' + ch.id); }
  chs = chapters(); ch = chs[ci];                                   // the guardian step may have appeared or gone
  var chDone = ch.secs.every(function (x) { return sd[x]; });
  if (!was && chDone) return go('#/will/done/' + ci);               // a chapter finished: one compact confirmation, then onward
  var nt = nextTask(); toast(def.t + ' saved'); go('#/will/c/' + nt.ci + '/' + nt.si);      // otherwise straight to the next task
};
// Compact success: what was saved, where you are, what's next.
function chapterDone(ci) {
  var chs = chapters(), ch = chs[ci], nt = nextTask(), doneN = doneCount();
  if (!ch || S.will.status !== 'progress') { location.replace('#/will'); return null; }
  S.will.ch = nt.ci; S.will.sec = nt.si; save();
  return '<main class="scr" style="justify-content:center"><span class="ico green round">' + ic('check', 26) + '</span>' +
    '<h1 class="h1">' + esc(ch.title) + ' saved</h1><p class="p strong">' + doneN + ' of ' + chs.length + ' chapters complete</p>' +
    '<div class="bar" aria-hidden="true"><i style="width:' + doneN / chs.length * 100 + '%"></i></div>' +
    '<div class="card tint"><p class="eyebrow">Next</p><h2 class="h3">' + nt.t + '</h2><p class="small">' + nt.why + (chMins(nt.ch.id) ? ' About ' + chMins(nt.ch.id) + ' minutes.' : '') + '</p></div>' +
    '<div class="stack"><a class="btn navy" href="#/will/c/' + nt.ci + '/' + nt.si + '">Continue to ' + esc(nt.ch.id === 'review' ? 'Review' : nt.ch.title) + ic('next') + '</a><a class="btn quiet" href="#/home">Back to Home</a></div></main>';
}
A.askSubmit = function () {
  sheet('<h2 class="h2">Submit your Will?</h2><p class="p">A scholar reviews it next. You can still view it anytime.</p>' +
    '<button type="button" class="btn navy" data-act="submitWill">Submit my Will</button><button type="button" class="btn quiet" data-act="close">Not yet</button>');
};
A.submitWill = function () { ensureSec().review = true; journey(); S.will.status = 'submitted'; save(); closeSheet(); go('#/will/submitted'); };
A.startWill = function () { if (S.will.status === 'none') S.will.status = 'progress'; var nt = nextTask(); save(); closeSheet(); go('#/will/c/' + nt.ci + '/' + nt.si); };
