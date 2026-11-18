/* Notarized Attestation, after it is chosen and paid for. Built from the live site's Document Upload and Signing screens:
   1. upload a government photo ID, front and back, for the testator and both witnesses (6 files)
   2. choose a time from the slots the legal team has opened (or see that none are open yet)
   3. the session is scheduled on Zoom; reschedule or cancel
   The system leads: the Dashboard and #/attest always open the next unfinished step. */
'use strict';
IC.upload = '<path d="M12 16V5M7.5 9.5L12 5l4.5 4.5M5 19h14"/>';

function att() { var w = S.will; if (!w.att) w.att = { docs: {}, slot: null, pick: '' }; return w.att; }
function attOn() { return S.will.signing === 'notary' && S.will.status === 'attest'; }
function attPeople() {
  var d = S.will.d, l = [{ k: 't', role: 'You', name: [d.first, d.middle, d.last].filter(Boolean).join(' ') || S.user.name, sub: 'Testator', icon: 'user' }];
  (d.w || []).forEach(function (x, i) { l.push({ k: 'w' + i, role: 'Witness ' + (i + 1), name: ((x.first || '') + ' ' + (x.last || '')).trim() || 'Witness ' + (i + 1), sub: 'Attestation witness', icon: 'people' }); });
  return l;
}
function attDocs() { var a = att(), n = 0, l = attPeople(); l.forEach(function (p) { ['f', 'b'].forEach(function (s) { if (a.docs[p.k + s]) n++; }); }); return { n: n, total: l.length * 2 }; }
function attStep() { var c = attDocs(); return c.n < c.total ? 'docs' : att().slot ? 'set' : 'time'; }
function attSlots() { return att().noSlots ? [] : (CFG.attestSlots || []); }

// Dashboard / My Will card for this stage: one next action.
function attCard() {
  var c = attDocs(), st = attStep(), a = att();
  if (st === 'docs') return '<section class="card tint"><span class="chip c-gold">' + ic('upload', 16) + 'Attestation · step 1 of 2</span><h2 class="h2">Upload your photo IDs</h2><p class="p">One government ID each for you and both witnesses, front and back.</p>' +
    '<div class="bar" role="img" aria-label="' + c.n + ' of ' + c.total + ' documents received"><i style="width:' + c.n / c.total * 100 + '%"></i></div><p class="small">' + c.n + ' of ' + c.total + ' documents received</p><a class="btn navy" href="#/attest/docs">' + (c.n ? 'Continue uploading' : 'Upload documents') + ic('next') + '</a></section>';
  if (st === 'time') return '<section class="card tint"><span class="chip c-gold">' + ic('cal', 16) + 'Attestation · step 2 of 2</span><h2 class="h2">Choose a time for your attestation</h2><p class="p">About 30 minutes on Zoom with your witnesses and attorney.</p>' +
    '<div class="acts">' + tag('c-grey', '2 witnesses needed', 'people') + tag('c-grey', 'About 30 minutes', 'clock') + tag('c-grey', 'Photo ID required', 'shield') + '</div><a class="btn navy" href="#/attest/schedule">Schedule attestation' + ic('next') + '</a></section>';
  return '<section class="card tint"><span class="chip c-green">' + ic('check', 16) + 'Attestation scheduled</span><h2 class="h2">' + esc(a.slot) + '</h2><p class="p">On Zoom, with your witnesses and attorney.</p><a class="btn navy" href="#/attest">View details' + ic('next') + '</a></section>';
}
function attSub(o) {
  var c = attDocs(), a = att();
  return '<a href="#/attest/docs"' + (o.sub === 'docs' ? ' aria-current="page"' : '') + '>Document Upload<span class="chip ' + (c.n === c.total ? 'c-green' : 'c-gold') + '" style="margin-left:auto;min-height:24px;font-size:13px">' + c.n + '/' + c.total + '</span></a>' +
    '<a href="#/attest/schedule"' + (o.sub === 'time' ? ' aria-current="page"' : '') + '>Attestation' + (a.slot ? '<span class="chip c-green" style="margin-left:auto;min-height:24px;font-size:13px">Booked</span>' : '') + '</a>';
}

/* ---------- 1 · Document Upload ---------- */
function idSet(k, file) {
  var okType = /\.(jpe?g|png|pdf)$/i.test(file.name), max = (CFG.idFile && CFG.idFile.maxMb || 10) * 1048576;
  if (!okType || file.size > max) { E['id:' + k] = 'Use a JPG, PNG or PDF file under 10 MB.'; return render(); }
  delete E['id:' + k]; att().docs[k] = file.name; save(); render(); toast('ID received');
}
function idBox(p, side) {
  var k = p.k + side, f = att().docs[k], label = (side === 'f' ? 'Front' : 'Back') + ' of ID';
  return '<div class="field"><span class="label">' + label + '</span><div class="dropz' + (f ? ' has' : '') + '" data-k="' + k + '">' +
    (f ? '<span class="ico green round" style="width:40px;height:40px">' + ic('check', 20) + '</span><span class="strong">' + esc(f) + '</span><div class="acts" style="justify-content:center"><label class="btn out sm" style="cursor:pointer"><input type="file" class="idfile" data-k="' + k + '" accept=".jpg,.jpeg,.png,.pdf" hidden>Replace</label><button type="button" class="btn quiet" data-act="idrm" data-k="' + k + '">Remove</button></div>'
       : ic('upload', 26) + '<span class="p">Drop a photo or PDF here</span><label class="btn out" style="cursor:pointer;min-width:0"><input type="file" class="idfile" data-k="' + k + '" accept=".jpg,.jpeg,.png,.pdf" aria-label="' + label + ' for ' + esc(p.name) + '" hidden>Choose file</label><span class="small">JPG, PNG or PDF · max 10 MB</span>') +
    '</div>' + (E['id:' + k] ? '<span class="err">' + ic('alert', 18) + '<span>' + esc(E['id:' + k]) + '</span></span>' : '') + '</div>';
}
function attDocsPage() {
  var c = attDocs(), a = att(), done = c.n === c.total;
  return shell('will', 'Document Upload', page('<header class="pg-h"><div class="stack"><p class="eyebrow">Attestation · step 1 of 2</p><h1 class="h1">Document Upload</h1><p class="p">A government photo ID for you and both witnesses. Front and back of each.</p>' +
    '<button type="button" class="termlink" data-act="idwhy">' + ic('help', 18) + 'Why do we need these?</button></div></header>' +
    '<section class="vband ready" style="padding-block:28px"><div class="stack" style="gap:6px;flex:1"><p class="eyebrow">Your progress</p><h2 class="h2">' + c.n + ' of ' + c.total + ' documents received</h2><p class="p">' + (done ? 'Everything is in. Next, choose a time.' : (c.total - c.n) + ' still needed.') + '</p></div>' +
    '<div class="iddots" role="img" aria-label="' + c.n + ' of ' + c.total + ' received">' + attPeople().map(function (p) { return ['f', 'b'].map(function (s) { return '<i class="' + (a.docs[p.k + s] ? 'on' : '') + '">' + (a.docs[p.k + s] ? ic('check', 16) : '') + '</i>'; }).join(''); }).join('') + '</div></section>' +
    attPeople().map(function (p) {
      var n = (a.docs[p.k + 'f'] ? 1 : 0) + (a.docs[p.k + 'b'] ? 1 : 0);
      return '<section class="card"><div class="row"><span class="ico" style="width:56px;height:56px">' + ic(p.icon, 26) + '</span><div class="stack" style="gap:0;flex:1"><span class="eyebrow">' + p.role + '</span><span class="h3">' + esc(p.name) + '</span><span class="small">' + p.sub + '</span></div>' +
        (n === 2 ? tag('c-green', 'Complete', 'check') : n ? tag('c-gold', '1 of 2', 'clock') : tag('c-grey', 'Not started')) + '</div><div class="g2">' + idBox(p, 'f') + idBox(p, 'b') + '</div></section>';
    }).join('') +
    '<section class="card pad-s tint noteb"><div class="row">' + ic('shield') + '<span>Your legal representative checks each ID against the person during the session. Make sure the photo is clear and the name is readable.</span></div></section>' +
    '<div class="acts"><a class="btn out" href="#/home" style="min-width:0">' + ic('back') + 'Back to Dashboard</a><span class="sp"></span><span class="small">' + ic('check', 16) + ' Saved as you go</span><a class="btn navy" href="#/attest/schedule">' + (done ? 'Choose a time' : 'Continue to scheduling') + ic('next') + '</a></div>'), { sub: 'docs' });
}
A.idrm = function (el) { delete att().docs[el.dataset.k]; save(); render(); toast('Removed'); };
A.idwhy = function () { sheet('<h2 class="h2">Why we need photo IDs</h2><p class="p">During the attestation your legal representative confirms that each person on the call is who they say they are. The IDs are used for that check only.</p><button type="button" class="btn navy" data-act="close">Got it</button>'); };
document.addEventListener('change', function (e) { if (e.target.classList && e.target.classList.contains('idfile') && e.target.files[0]) idSet(e.target.dataset.k, e.target.files[0]); });
document.addEventListener('dragover', function (e) { if (e.target.closest && e.target.closest('.dropz')) e.preventDefault(); });
document.addEventListener('drop', function (e) { var z = e.target.closest && e.target.closest('.dropz'); if (z && e.dataTransfer.files[0]) { e.preventDefault(); idSet(z.dataset.k, e.dataTransfer.files[0]); } });

/* ---------- 2 · Choose a time ---------- */
function attSchedulePage() {
  var a = att(), slots = attSlots(), c = attDocs();
  return shell('will', 'Attestation', page('<header class="pg-h"><div class="stack"><p class="eyebrow">Attestation · step 2 of 2</p><h1 class="h1">' + (a.slot ? 'Choose a new time' : 'Choose a time for your attestation') + '</h1><p class="p">You, your attorney and both witnesses sign together on Zoom. About 30 minutes.</p>' + termLink('attestation') + '</div></header>' +
    (c.n < c.total ? '<section class="card pad-s amber noteb"><div class="row">' + ic('alert') + '<span><span class="strong">' + (c.total - c.n) + ' photo IDs still needed.</span> You can book now and finish them before the session.</span></div><a class="btn out sm" href="#/attest/docs">Upload IDs</a></section>' : '') +
    (slots.length ? '<div class="cols"><section class="card"><h2 class="h3">Times our legal team has opened</h2><div class="pickgrid" role="radiogroup" aria-label="Available times">' + slots.map(function (s) { return opt(esc(s), 'will.att.pick', s); }).join('') + '</div>' + err('will.att.pick') +
        '<div class="acts"><a class="btn out" href="' + (a.slot ? '#/attest' : '#/attest/docs') + '" style="min-width:0">' + ic('back') + 'Back</a><span class="sp"></span><button type="button" class="btn navy" data-act="attBook">Confirm this time' + ic('next') + '</button></div></section>' +
        '<aside class="rail"><section class="card pad-s"><h2 class="panel-t">Who joins</h2><div class="tick">' + ic('check') + 'You</div><div class="tick">' + ic('check') + 'Your two witnesses</div><div class="tick">' + ic('check') + 'Your attorney and a legal representative</div><p class="small">Everyone gets their own invitation by email.</p></section></aside></div>'
      : '<section class="card hero" style="text-align:center;align-items:center"><span class="ico round">' + ic('cal', 26) + '</span><h2 class="h2">No times open right now</h2><p class="p">Our legal team hasn’t published availability yet. We’ll email you as soon as slots open.</p><a class="btn out" href="#/home" style="align-self:center">Back to Dashboard</a></section>')), { sub: 'time' });
}
A.attBook = function () {
  var a = att(); E = {};
  if (!a.pick) { E['will.att.pick'] = 'Choose one of the times.'; return render(); }
  a.slot = a.pick; save(); go('#/attest'); toast('Attestation scheduled');
};

/* ---------- 3 · Scheduled ---------- */
function attScheduledPage() {
  var a = att(), c = attDocs();
  return shell('will', 'Attestation', page('<section class="card" style="padding:0;overflow:hidden;max-width:960px;width:100%;margin:0 auto"><div class="vband" style="border-radius:0;align-items:center;text-align:center"><span class="ico round" style="background:#C9A15B;color:#172033;width:64px;height:64px">' + ic('check', 30) + '</span><h1 class="h1" style="font-size:var(--fs-h2)">Your attestation is scheduled</h1><p class="p strong" style="color:#E3CD9F">' + esc(a.slot) + '</p></div>' +
    '<div class="stack lg" style="padding:clamp(22px,2.4vw,40px);max-width:720px;width:100%;margin:0 auto">' +
    '<section class="card pad-s"><div class="row">' + ic('video') + '<h2 class="h3">Online attestation</h2></div><p class="p">Your Zoom meeting is ready. Your witnesses and attorney receive their own invitations.</p><button type="button" class="lnk" data-act="attZoom">Open your Zoom link' + ic('next', 18) + '</button></section>' +
    '<section class="card pad-s amber"><h2 class="panel-t">Before your session</h2><div class="tick">' + ic('check') + 'Have your government photo ID ready</div><div class="tick">' + ic('check') + 'Test your camera and microphone</div><div class="tick">' + ic('check') + 'Confirm your witnesses can attend</div>' +
    (c.n < c.total ? '<p class="small">' + ic('alert', 16) + ' ' + (c.total - c.n) + ' photo IDs still to upload. <a href="#/attest/docs">Upload now</a></p>' : '') + '</section>' +
    '<div class="acts" style="justify-content:center"><a class="btn navy" href="#/home">Return to Dashboard' + ic('next') + '</a></div><div class="acts" style="justify-content:center"><a class="btn quiet" href="#/attest/schedule">Reschedule</a><button type="button" class="btn quiet" data-act="attAskCancel">Cancel session</button></div></div></section>'), { sub: 'time' });
}
A.attZoom = function () { sheet('<h2 class="h2">Your Zoom link</h2><p class="p">[The Zoom link opens here on the day]</p><button type="button" class="btn navy" data-act="close">Close</button>'); };
A.attAskCancel = function () { sheet('<h2 class="h2">Cancel this session?</h2><p class="p">Your time is released. You can choose another one whenever you’re ready.</p><button type="button" class="btn danger" data-act="attCancel">Cancel session</button><button type="button" class="btn quiet" data-act="close">Keep it</button>'); };
A.attCancel = function () { var a = att(); a.slot = null; a.pick = ''; save(); closeSheet(); go('#/attest/schedule'); toast('Session cancelled'); };

R.attest = function (a) {
  if (!attOn()) { location.replace(S.will.status === 'ready' ? '#/sign' : '#/will'); return null; }
  if (a[0] === 'docs') return attDocsPage();
  if (a[0] === 'schedule') return attSchedulePage();
  var st = attStep();                                   // no step named: open the next unfinished one
  return st === 'docs' ? attDocsPage() : st === 'time' ? attSchedulePage() : attScheduledPage();
};

/* prototype presets for this stage */
function demoAtt(fn) { sample(function (s) { allDone(s); s.will.status = 'attest'; s.will.signing = 'notary'; s.will.att = { docs: {}, slot: null, pick: '' }; fn(s.will.att); }); }
var ALL_IDS = { tf: 'my-id-front.jpg', tb: 'my-id-back.jpg', w0f: 'hana-front.jpg', w0b: 'hana-back.jpg', w1f: 'karim-front.pdf', w1b: 'karim-back.pdf' };
DEMO['a-docs'] = function () { demoAtt(function (a) { a.docs = { tf: 'my-id-front.jpg', tb: 'my-id-back.jpg' }; }); };
DEMO['a-time'] = function () { demoAtt(function (a) { a.docs = Object.assign({}, ALL_IDS); }); };
DEMO['a-none'] = function () { demoAtt(function (a) { a.docs = Object.assign({}, ALL_IDS); a.noSlots = true; }); };
DEMO['a-set'] = function () { demoAtt(function (a) { a.docs = Object.assign({}, ALL_IDS); a.slot = (CFG.attestSlots || ['[time from API]'])[0]; }); };
