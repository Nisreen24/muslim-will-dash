/* The introduction before the Will — the approved six-step value journey (JOURNEY in flow.js), shown to a
   signed-in person the first time they choose "Start my Will". New visitors already see it at #/start.
   This file adds one route (#/intro/<n>) and wraps the Start action. It changes nothing inside the Will:
   the last button hands over to the Will's own start logic, untouched.
   Loaded by both builds; the desktop build gets the desktop composition. */
'use strict';
(function () {
  var startWill0 = A.startWill, N = JOURNEY.length, desktop = typeof dSteps === 'function';

  A.startWill = function (el) {
    if (S.will.status === 'none' && !S.introSeen) { closeSheet(); return go('#/intro/0'); }
    startWill0(el);
  };
  // The hand-over: from here on it is the existing Will entry.
  A.beginWill = function () { S.introSeen = true; save(); startWill0(); };
  A.introCalc = function () { E = {}; need('calc.sex', 'Choose one.'); need('calc.married', 'Choose Yes or No.'); if (Object.keys(E).length) return render(); go('#/intro/2'); };

  function cta(s, n) {
    if (s.last) return '<button type="button" class="btn navy" data-act="beginWill">' + s.cta + ic('next') + '</button>';
    if (s.act) return '<button type="button" class="btn navy" data-act="introCalc">' + s.cta + ic('next') + '</button>';
    return '<a class="btn navy" href="#/intro/' + (n + 1) + '">' + s.cta + ic('next') + '</a>';
  }
  var skip = '<button type="button" class="' + (desktop ? 'btn quiet' : 'iconbtn end') + '" data-act="beginWill">Skip</button>';

  R.intro = function (a) {
    if (S.will.status !== 'none') { location.replace('#/will'); return null; }
    var n = Math.min(N - 1, Math.max(0, +a[0] || 0)), s = JOURNEY[n], count = 'Step ' + (n + 1) + ' of ' + N;
    if (desktop) {
      var img = STEP_ART.journey[n];
      return '<div class="pub dsk">' + pubTop('<span class="chip c-green" style="align-self:center">' + ic('check', 16) + 'Free to create and print</span>' + (s.last ? '' : skip) + '<a class="btn out sm" href="#/home">Back to Dashboard</a>') +
        '<main class="duo"><div class="txt"><p class="eyebrow">' + s.eb + '</p><h1 class="h1">' + s.h + '</h1><p class="p">' + s.p + '</p>' +
        '<div class="acts">' + (n ? '<a class="btn out" href="#/intro/' + (n - 1) + '" style="min-width:0">' + ic('back') + 'Back</a>' : '') + cta(s, n) + '</div>' +
        '<nav class="dsk-dots" aria-label="' + count + '">' + JOURNEY.map(function (_, i) { return '<a href="#/intro/' + i + '" aria-label="Step ' + (i + 1) + ' of ' + N + '"' + (i === n ? ' aria-current="step"' : '') + '></a>'; }).join('') + '</nav><p class="small">' + count + '</p></div>' +
        (img ? '<div class="art img"><img src="assets/' + img + '.png" alt=""></div>' : artOf(s)) + '</main></div>';
    }
    return '<div class="plain-hd">' + (n ? backBtn('#/intro/' + (n - 1)) : backBtn('#/home', 'Home')) + (s.last ? '<span></span>' : skip) + '</div>' +
      '<main class="scr">' + artOf(s) +
      '<div class="stack"><p class="eyebrow">' + s.eb + '</p><h1 class="h1">' + s.h + '</h1><p class="p">' + s.p + '</p></div>' +
      '<div class="grow"></div><div class="dots" role="img" aria-label="' + count + '">' + JOURNEY.map(function (_, i) { return '<i' + (i === n ? ' class="on"' : '') + '></i>'; }).join('') + '</div>' +
      '<p class="small center">' + count + '</p>' + cta(s, n) + '</main>';
  };
})();
