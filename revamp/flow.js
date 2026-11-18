/* Entry: value journey (free Will funnel), product tour (direct entry), account, sign in. */
'use strict';

/* ---------- value journey: six short steps, no questions asked ---------- */
// Step 2 asks five quick things about the family, nothing legal. Step 3 shows the result at once.
function calcForm() {
  var c = S.calc;
  function stepper(label, k) { return '<div class="field"><span class="label">' + label + '</span><div class="stepper"><button type="button" data-act="stepN" data-k="' + k + '" data-d="-1" aria-label="Fewer ' + label.toLowerCase() + '">' + '&minus;</button><b aria-live="polite">' + (c[k] || 0) + '</b><button type="button" data-act="stepN" data-k="' + k + '" data-d="1" aria-label="More ' + label.toLowerCase() + '">+</button></div></div>'; }
  return '<div class="field" role="radiogroup" aria-label="I am"><span class="label">I am</span><div class="pair">' + opt('A man', 'calc.sex', 'Male') + opt('A woman', 'calc.sex', 'Female') + '</div>' + err('calc.sex') + '</div>' +
    '<div class="field" role="radiogroup" aria-label="Married"><span class="label">Married?</span><div class="pair">' + opt('Yes', 'calc.married', 'yes') + opt('No', 'calc.married', 'no') + '</div>' + err('calc.married') + '</div>' +
    '<div class="pair">' + stepper('Sons', 'sons') + stepper('Daughters', 'daughters') + '</div>' +
    '<div class="field"><span class="label">Parents living</span><div class="pair"><label class="check"><input type="checkbox" data-f="calc.father"' + (c.father ? ' checked' : '') + '>Father</label><label class="check"><input type="checkbox" data-f="calc.mother"' + (c.mother ? ' checked' : '') + '>Mother</label></div></div>';
}
function calcShares() { var c = S.calc; return c.sex && c.married ? shares({ sex: c.sex, married: c.married === 'yes', sons: c.sons || 0, daughters: c.daughters || 0, father: !!c.father, mother: !!c.mother }) : null; }
function resultArt() {
  var l = calcShares();
  if (!l) return '<span class="lbl">Default law</span><div class="split"><i style="width:62%"></i><i style="width:38%"></i></div><span class="lbl">Islamic shares</span><div class="split b"><i style="width:26%"></i><i style="width:44%"></i><i style="width:30%"></i></div><span class="small">Illustration only. Your shares depend on your family.</span>';
  return '<span class="lbl">Your Islamic shares</span>' + sharesList(l) + '<div class="lost">' + ic('alert') + 'Without a Will<span>Your province decides</span></div><span class="small">Example only. A scholar confirms your shares.</span>';
}
A.stepN = function (el) { var k = el.dataset.k; S.calc[k] = Math.max(0, Math.min(12, (S.calc[k] || 0) + (+el.dataset.d))); save(); render(); };
A.calcNext = function () { E = {}; need('calc.sex', 'Choose one.'); need('calc.married', 'Choose Yes or No.'); if (Object.keys(E).length) return render(); go('#/start/2'); };
var JOURNEY = [
  { eb: 'Islamic Will', h: 'Will your family inherit the way you intend?', p: 'Check the difference in a minute.', cta: 'Check the difference',
    art: '<div class="row"><span class="ico navy round">' + ic('people', 24) + '</span><span class="lbl">Your family, your wishes</span></div>' },
  { eb: 'Step 1 of 2', h: 'Tell us about your family', p: 'Five quick answers. No names needed.', cta: 'See my shares', act: 'calcNext', art: calcForm },
  { eb: 'Problem 1', h: 'The wrong shares', p: 'Without a Will, provincial law divides your estate, not these shares.', cta: 'Next', art: resultArt },
  { eb: 'Problem 2', h: 'An estate no one can find', p: 'Accounts, debts and documents get missed when no one knows where they are.', cta: 'Next',
    art: '<div class="lost">' + ic('list') + 'Bank accounts<span>Where?</span></div><div class="lost">' + ic('scale') + 'Debts and zakat<span>How much?</span></div><div class="lost">' + ic('lock') + 'Documents<span>Who has them?</span></div>' },
  { eb: 'The fix', h: 'A Will sets it out. A Vault keeps it findable.', p: 'Start with your Will. The Vault is optional, for later.', cta: 'Next',
    art: '<div class="tick">' + ic('check') + 'Islamic Will: your shares and wishes, written down</div><div class="tick">' + ic('check') + 'Reviewed by a scholar</div><div class="tick">' + ic('check') + 'My Vault: one secure place for the details</div>' },
  { eb: 'Start today', h: 'Create your Islamic Will for free', p: 'About 30 minutes. Stop and return anytime.', cta: 'Create my Will', last: true,
    art: '<div class="tick">' + ic('check') + 'No card needed</div><div class="tick">' + ic('check') + 'Free to create and print</div><div class="tick">' + ic('check') + 'Your answers save as you go</div>' }
];
function artOf(s) { return '<div class="art">' + (typeof s.art === 'function' ? s.art() : s.art) + '</div>'; }
function ctaOf(s, href) { return s.act ? '<button type="button" class="btn navy" data-act="' + s.act + '">' + s.cta + ic('next') + '</button>' : '<a class="btn navy" href="' + href + '">' + s.cta + ic('next') + '</a>'; }
function steps(list, n, base, skipTo, doneTo) {
  var s = list[n];
  return '<div class="plain-hd">' + (n ? backBtn(base + (n - 1)) : '<span></span>') +
    (s.last ? '<a class="iconbtn end" href="#/signin">Sign in</a>' : '<a class="iconbtn end" href="' + skipTo + '">Skip</a>') + '</div>' +
    '<main class="scr">' + artOf(s) +
    '<div class="stack"><p class="eyebrow">' + s.eb + '</p><h1 class="h1">' + s.h + '</h1><p class="p">' + s.p + '</p></div>' +
    '<div class="grow"></div><div class="dots" role="img" aria-label="Step ' + (n + 1) + ' of ' + list.length + '">' + list.map(function (_, i) { return '<i' + (i === n ? ' class="on"' : '') + '></i>'; }).join('') + '</div>' +
    ctaOf(s, s.last ? doneTo : base + (n + 1)) +
    (n === 0 ? '<a class="btn quiet" href="#/signin">I already have an account</a>' : list === JOURNEY && !s.last ? '<p class="small center">Free to create and print.</p>' : '') + '</main>';
}
R.start = function (a) {
  if (S.signedIn) { location.replace('#/home'); return null; }
  var n = Math.min(JOURNEY.length - 1, Math.max(0, +a[0] || 0));
  return steps(JOURNEY, n, '#/start/', '#/start/' + (JOURNEY.length - 1), '#/account');
};

/* ---------- product tour: four screens, only for people who did not come through the funnel ---------- */
var TOUR = [
  { eb: 'Muslim Will', h: 'Your estate plan, connected.', p: 'Your Will and your important details, in one place.', cta: 'Next',
    art: '<div class="row"><span class="ico navy">' + ic('will', 24) + '</span><span class="ico navy">' + ic('vault', 24) + '</span><span class="ico navy">' + ic('people', 24) + '</span></div>' },
  { eb: 'Islamic Will', h: 'Guided, one step at a time.', p: 'Answer short questions. Free to create and print.', cta: 'Next',
    art: '<div class="segs"><i class="done"></i><i class="on"></i><i></i></div><span class="lbl">Chapter, then section, then one task.</span>' },
  { eb: 'My Vault', h: 'Important details, kept safe.', p: 'Assets, obligations and documents, organized for your family.', cta: 'Next',
    art: '<div class="row"><span class="ico navy">' + ic('lock', 24) + '</span><span class="lbl">Optional. Add it when you want.</span></div>' },
  { eb: 'Flexible planning', h: 'Start with what matters now.', p: 'Add more whenever you’re ready.', cta: 'Get started', last: true,
    art: '<div class="tick">' + ic('check') + 'Begin with your Will</div><div class="tick">' + ic('check') + 'Add services later</div>' }
];
R.tour = function (a) {
  var n = Math.min(TOUR.length - 1, Math.max(0, +a[0] || 0));
  return steps(TOUR, n, '#/tour/', '#/account', '#/account');
};

/* ---------- account: one screen, email in three short steps ---------- */
function afterAuth() {
  S.signedIn = true;
  var parts = (S.user.name || '').trim().split(/\s+/), d = S.will.d;
  if (!d.first && parts[0]) { d.first = parts[0]; d.last = parts.length > 1 ? parts[parts.length - 1] : ''; d.middle = parts.slice(1, -1).join(' '); }
  if (!d.email) d.email = S.user.email;
  // Reuse what the value journey already asked.
  var c = S.calc;
  if (c.sex && !d.sex) {
    d.sex = c.sex; if (!d.married) d.married = c.married;
    if (!d.father) d.father = c.father ? 'yes' : 'no'; if (!d.mother) d.mother = c.mother ? 'yes' : 'no';
    if (!d.children.length) { for (var i = 0; i < (c.sons || 0); i++) d.children.push({ name: '', kind: 'Son', minor: false }); for (i = 0; i < (c.daughters || 0); i++) d.children.push({ name: '', kind: 'Daughter', minor: false }); }
  }
  // Respect why they came: no "Will or Vault?" gateway, no plan picker, no payment unless they chose a paid service.
  if (S.entry === 'will') { if (S.will.status === 'none') S.will.status = 'progress'; save(); go('#/will/c/' + S.will.ch + '/' + S.will.sec); }
  else if (S.entry === 'vault' && !S.vault.active) { save(); go('#/pay/vault'); }
  else { save(); go('#/home'); }
}
var SSO = '<button type="button" class="btn out" data-act="sso" data-v="Google"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.5 12.2c0-.7-.1-1.4-.2-2H12v4.1h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8.1z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.3-1.9-6.2-4.6H2.2v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.2a11 11 0 0 0 0 9.8z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.6l3.1-3.1A11 11 0 0 0 2.2 7.1l3.6 2.8C6.7 7.3 9.1 5.4 12 5.4z"/></svg>Continue with Google</button>' +
  '<button type="button" class="btn out" data-act="sso" data-v="Apple"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.4 12.6c0-2.2 1.8-3.2 1.9-3.3-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.4.8s-1.8-.8-2.9-.8c-1.5 0-2.9.9-3.7 2.2-1.6 2.7-.4 6.8 1.1 9 .8 1.1 1.7 2.3 2.8 2.3s1.6-.7 3-.7 1.8.7 3 .7 2-1.1 2.8-2.2c.9-1.3 1.2-2.5 1.2-2.6-.1 0-2.6-1-2.6-3.7zM14.2 6.1c.6-.8 1-1.8.9-2.9-.9 0-2 .6-2.6 1.4-.6.7-1.1 1.8-.9 2.8 1 .1 2-.5 2.6-1.3z"/></svg>Continue with Apple</button>';
var LEGAL = '<p class="small center">By continuing you agree to the <button type="button" class="strong" style="text-decoration:underline" data-act="legal" data-v="terms">Terms of Use</button> and <button type="button" class="strong" style="text-decoration:underline" data-act="legal" data-v="privacy">Privacy Policy</button>.</p>';

R.account = function (a) {
  if (S.signedIn) { location.replace('#/home'); return null; }
  var back = S.entry === 'vault' ? '#/vault-entry' : S.entry === 'direct' ? '#/tour/' + (TOUR.length - 1) : '#/start/' + (JOURNEY.length - 1);
  if (a[0] === 'email') {
    var n = Math.min(3, Math.max(1, +a[1] || 1));
    var f = n === 1 ? inp('Full legal name', 'user.name', { ac: 'name', hint: 'As it appears on your ID.' })
      : n === 2 ? inp('Email', 'user.email', { type: 'email', mode: 'email', ac: 'email' })
      : '<label class="field"><span class="label">Password</span><input class="input' + (E.pw ? ' bad' : '') + '" id="pw" type="password" autocomplete="new-password"><span class="hint">At least 8 characters.</span>' + err('pw') + '</label><label class="check"><input type="checkbox" data-act="showpw">Show password</label>';
    return '<div class="plain-hd">' + backBtn(n === 1 ? '#/account' : '#/account/email/' + (n - 1)) + '<span class="small">Step ' + n + ' of 3</span></div>' +
      '<main class="scr"><h1 class="h1">' + ['What’s your name?', 'What’s your email?', 'Create a password'][n - 1] + '</h1>' +
      '<form class="stack lg" data-act-submit="acctNext" data-n="' + n + '">' + f + '<button class="btn navy" type="submit">' + (n === 3 ? 'Create account' : 'Continue') + ic('next') + '</button></form></main>';
  }
  return '<div class="plain-hd">' + backBtn(back) + '</div>' +
    '<main class="scr"><div class="stack"><h1 class="h1">' + (S.entry === 'will' ? 'Save your Will as you go' : 'Create your account') + '</h1>' +
    '<p class="p">' + (S.entry === 'will' ? 'Free. No card needed.' : 'One account for your Will and your Vault.') + '</p></div>' +
    '<div class="stack">' + SSO + '<a class="btn navy" href="#/account/email/1">' + ic('mail') + 'Continue with email</a></div>' +
    '<a class="btn quiet" href="#/signin">I already have an account</a><div class="grow"></div>' + LEGAL + '</main>';
};
A.showpw = function (el) { var p = document.getElementById('pw'); if (p) p.type = el.checked ? 'text' : 'password'; };
A.sso = function () { S.user = { name: S.user.name || 'Amany Reda', email: S.user.email || 'amany@example.com' }; afterAuth(); };   // prototype: no real provider is called
A.acctNext = function (form) {
  var n = +form.dataset.n; E = {};
  if (n === 1) { if (String(S.user.name || '').trim().split(/\s+/).length < 2) E['user.name'] = 'Enter your first and last name.'; }
  if (n === 2 && !validEmail(S.user.email)) E['user.email'] = 'Enter a valid email, like name@example.com.';
  if (n === 3) { var pw = document.getElementById('pw').value; if (pw.length < 8) E.pw = 'Use at least 8 characters.'; }   // the password is never stored in the prototype
  if (Object.keys(E).length) return render();
  if (n < 3) go('#/account/email/' + (n + 1)); else afterAuth();
};
document.addEventListener('submit', function (e) { var f = e.target.closest('[data-act-submit]'); if (f) { e.preventDefault(); A[f.dataset.actSubmit](f); } });

R.signin = function () {
  if (S.signedIn) { location.replace('#/home'); return null; }
  return '<div class="plain-hd">' + backBtn(start()) + '</div><main class="scr"><h1 class="h1">Welcome back</h1>' +
    '<div class="stack">' + SSO + '</div><p class="small center">or use your email</p>' +
    '<form class="stack lg" data-act-submit="signin">' + inp('Email', 'user.email', { type: 'email', mode: 'email', ac: 'email' }) +
    '<label class="field"><span class="label">Password</span><input class="input' + (E.pw ? ' bad' : '') + '" id="pw" type="password" autocomplete="current-password">' + err('pw') + '</label>' +
    '<button class="btn navy" type="submit">Sign in' + ic('next') + '</button></form>' +
    '<button type="button" class="btn quiet" data-act="forgot">Forgot password?</button>' +
    '<a class="btn quiet" href="' + (S.entry === 'will' ? '#/start/0' : '#/account') + '">Create an account</a></main>';
};
A.signin = function () {
  E = {};
  if (!validEmail(S.user.email)) E['user.email'] = 'Enter a valid email, like name@example.com.';
  if (!document.getElementById('pw').value) E.pw = 'Enter your password.';
  if (Object.keys(E).length) return render();
  if (!S.user.name) S.user.name = 'Amany Reda';
  S.signedIn = true; save(); go('#/home');      // returning users land on Home, which shows what to do next
};
A.forgot = function () {
  sheet('<h2 class="h2">Reset your password</h2>' + inp('Email', 'user.email', { type: 'email', mode: 'email', ac: 'email' }) +
    '<button type="button" class="btn navy" data-act="forgotSend">Send reset link</button><button type="button" class="btn quiet" data-act="close">Cancel</button>');
};
A.forgotSend = function () {
  if (!validEmail(S.user.email)) { E['user.email'] = 'Enter a valid email, like name@example.com.'; A.forgot(); E = {}; return; }
  sheet('<span class="ico green round">' + ic('check', 24) + '</span><h2 class="h2">Check your email</h2><p class="p">We sent a reset link to ' + esc(S.user.email) + '.</p><button type="button" class="btn navy" data-act="close">Done</button>');
};
