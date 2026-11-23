/* My Vault screens, router and interactions. State lives in store.js; markup helpers in components.js. */
(function () {
  'use strict';
  var C = window.MW_CONFIG, V = window.VaultStore, sel = V.sel, act = V.act, API = window.MW_API;
  var ic = MW.ic, esc = MW.esc, b = VC.btn;
  var root, lastRouteKey = '', dlgHandlers = {}, saveTimer = null, mnavHTML = '';

  var UI = {
    pricing: { status: 'idle', data: null },
    sub: { busy: false, error: '', done: false, values: {}, errors: {} },
    ps: { query: '', adding: false, values: {}, errors: {} },
    form: null, person: null, rel: null,
    guided: { formOpen: false, trigger: '', people: [], error: '', resumeAck: false, justCompleted: false },
    flash: null, returnTo: ''
  };

  /* ---------- routing ---------- */
  function parse() {
    var h = location.hash.replace(/^#\/?/, ''), parts = h.split('?'), q = {};
    (parts[1] || '').split('&').forEach(function (kv) { if (!kv) return; var p = kv.split('='); q[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ''); });
    return { path: parts[0].split('/').filter(Boolean), q: q };
  }
  function go(h) { if (location.hash === h) render(); else location.hash = h; }
  function moduleName(m) { return C.modules[m] ? C.modules[m].name : ''; }
  var CR_VAULT = { label: 'My Vault', href: '#/overview' };

  /* ---------- shell ---------- */
  function renderShell(active, crumbs) {
    var s = sel.state(), drafts = function (m) { var n = sel.moduleSummary(m).drafts; return n ? n + ' draft' + (n > 1 ? 's' : '') : ''; };
    var relBadge = sel.unassigned().length ? 'Assign' : sel.releaseNeedsReview() ? 'Review' : '';
    var sections = [
      { id: 'overview', label: 'Overview', href: '#/overview' },
      { id: 'people', label: 'Trusted People', href: '#/people' },
      { id: 'assets', label: 'Estate Inventory', href: '#/assets', badge: drafts('assets') },
      { id: 'obligations', label: 'Obligations', href: '#/obligations', badge: drafts('obligations') },
      { id: 'sealed', label: 'Sealed Disclosures', href: '#/sealed', badge: drafts('sealed') },
      { id: 'final', label: 'Final Words', href: '#/final', badge: drafts('final') },
      { id: 'release', label: 'Release Rules', href: '#/release', badge: relBadge },
      { id: 'settings', label: 'Vault settings', href: '#/settings' }
    ];
    mnavHTML = s.subscribed ? '<nav class="v-mnav" aria-label="My Vault sections">' + sections.map(function (x) { var on = x.id === active; return '<a href="' + x.href + '"' + (on ? ' class="on" aria-current="page"' : '') + '>' + esc(x.label) + (x.badge ? '<span class="sb-badge">' + esc(x.badge) + '</span>' : '') + '</a>'; }).join('') + '</nav>' : '';
    var sbHTML = MW.sidebar({ active: 'vault', vaultActive: s.subscribed ? active : null, willStatus: 'Complete', vault: { subscribed: s.subscribed, sections: sections } });
    document.getElementById('sidebar').innerHTML = sbHTML;
    document.getElementById('sb-demo').innerHTML = demoPanel();
    document.getElementById('topbar').innerHTML = MW.topbar({ crumbs: crumbs });
  }
  function demoPanel() {
    return '<span class="sb-demo-t">Prototype · Vault state</span><label class="v-sr" for="demo-seed">Vault state</label>' +
      '<select id="demo-seed"><option value="">Load a state…</option><option value="none">Not subscribed</option><option value="new">Just subscribed (empty)</option><option value="progress">In progress (guided paused)</option><option value="done">Set up</option></select>' +
      '<label class="sb-chk"><input type="checkbox" id="demo-fprice"' + (API.fail.pricing ? ' checked' : '') + '> Price fails to load</label>' +
      '<label class="sb-chk"><input type="checkbox" id="demo-fpay"' + (API.fail.payment ? ' checked' : '') + '> Payment is declined</label>' +
      '<label class="sb-chk"><input type="checkbox" id="demo-fsave"' + (V.flags.saveError ? ' checked' : '') + '> Saving fails</label>' +
      '<button type="button" id="demo-loading">Show loading state</button>';
  }

  /* ---------- render ---------- */
  function render() {
    var r = parse(), s = sel.state();
    var name = r.path[0] || (s.subscribed ? 'overview' : 'discover');
    if (!s.subscribed && ['discover', 'subscribe'].indexOf(name) < 0) {
      UI.returnTo = '#/' + r.path.join('/');
      history.replaceState(null, '', '#/discover?from=' + encodeURIComponent(r.path[0] || ''));
      r = parse(); name = 'discover';
    }
    if (s.subscribed && name === 'discover') { history.replaceState(null, '', '#/overview'); r = parse(); name = 'overview'; }
    if (s.subscribed && name === 'subscribe' && !UI.sub.done) { history.replaceState(null, '', '#/overview'); r = parse(); name = 'overview'; }

    var key = r.path.join('/');
    var changed = key !== lastRouteKey;
    if (changed) onRouteChange(r, lastRouteKey);
    lastRouteKey = key;

    var fn = SCREENS[name] || notFound;
    var out = fn(r);
    renderShell(out.active || name, out.crumbs || [CR_VAULT]);
    var top = sel.saveFailed() ? '<div class="v-wrap" style="padding-top:1rem">' + VC.banner('error', '<b>We couldn’t save your last change.</b> It’s still on this page. Check your connection and try again.', b('Try again', { act: 'save:retry', kind: 'secondary', size: 'sm' })) + '</div>' : '';
    root.innerHTML = top + mnavHTML + out.head + '<div class="v-wrap v-body"><div class="v-stack">' + flashHTML() + out.body + '</div></div>';
    var onPill = root.querySelector('.v-mnav a.on');   // phones: keep the current section pill in view
    if (onPill) onPill.parentNode.scrollLeft = Math.max(0, onPill.offsetLeft - onPill.parentNode.offsetLeft - 20);
    if (changed) {
      window.scrollTo(0, 0);
      var h1 = root.querySelector('h1'); if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
      document.title = (out.title || 'My Vault') + ' — Muslim Will';
    }
  }
  function rerender() {
    var a = document.activeElement, id = a && a.id, pos = null;
    try { pos = a && a.selectionStart; } catch (e) { pos = null; }
    render();
    if (id) { var el = document.getElementById(id); if (el) { el.focus({ preventScroll: true }); try { if (pos != null) el.setSelectionRange(pos, pos); } catch (e) { /* not a text field */ } } }
  }
  function flashHTML() { if (!UI.flash) return ''; var f = UI.flash; UI.flash = null; return VC.banner(f.kind || 'ok', esc(f.text)); }

  function onRouteChange(r, prev) {
    var n = r.path[0];
    UI.ps = { query: '', adding: false, values: {}, errors: {} };
    if (['assets', 'obligations', 'sealed', 'final'].indexOf(n) >= 0 && r.path[1]) initForm(n, r.path[1], r.q);
    else UI.form = null;
    if (n === 'people' && r.path[1]) initPerson(r.path[1], r.q); else UI.person = null;
    if (n === 'release' && r.path[1] && r.path[1] !== 'review') initRel(r.path[1]); else UI.rel = null;
    if (n !== 'guided') { UI.guided.formOpen = false; UI.guided.resumeAck = false; UI.guided.justCompleted = false; }
    if (n !== 'subscribe') { UI.sub.done = false; UI.sub.error = ''; }
  }

  /* ---------- pricing (from API, never hard-coded) ---------- */
  function ensurePricing() {
    if (UI.pricing.status !== 'idle') return;
    UI.pricing.status = 'loading';
    API.fetchVaultPricing().then(function (p) { UI.pricing = { status: 'ready', data: p }; rerender(); })
      .catch(function () { UI.pricing = { status: 'error', data: null }; rerender(); });
  }
  function priceBlock(compact) {
    var p = UI.pricing;
    if (p.status === 'error') return VC.banner('error', '<b>We couldn’t load the price.</b> Please try again in a moment.', b('Try again', { act: 'price:retry', kind: 'secondary', size: 'sm' }));
    if (p.status !== 'ready') return '<div role="status" aria-live="polite"><span class="v-sr">Loading price</span>' + VC.skeleton(compact ? 1 : 2) + '</div>';
    return '<p class="v-price-amt">$' + Number(p.data.price).toFixed(2) + '<small>' + esc(p.data.currency) + ' / ' + esc(p.data.interval) + '</small></p>';
  }

  /* ================= SCREENS ================= */
  var SCREENS = {};

  /* 1 · Discovery (non-subscriber) */
  SCREENS.discover = function (r) {
    ensurePricing();
    var from = r.q.from && C.modules[r.q.from] ? C.modules[r.q.from].name : r.q.from === 'people' ? 'Trusted People' : r.q.from === 'release' ? 'Release Rules' : '';
    var mods = C.moduleOrder.map(function (m) { var x = C.modules[m]; return VC.moduleRow({ icon: x.icon, name: x.name, one: x.one, locked: true, status: VC.chip('locked', 'Included') }); }).join('');
    var ready = UI.pricing.status === 'ready';
    var body = (from ? VC.banner('info', '<b>' + esc(from) + ' is part of My Vault.</b> Start My Vault and we’ll take you straight there.') : '') +
      '<div class="v-cols"><div class="v-col">' +
      '<section class="v-card" aria-labelledby="inside-t"><h2 id="inside-t">What’s inside</h2><div class="v-mrows">' + mods + '</div>' +
      '<p class="v-muted">You also choose your Trusted People, and when each item is released.</p></section>' +
      '<section class="v-card v-story" aria-labelledby="why-t"><p class="v-eyebrow" style="color:var(--gold-ink)" id="why-t">' + ic('compass', 18) + 'Why it matters</p>' +
      '<blockquote>When a parent dies, children are often left asking: which bank, which policy, was any zakat still owed?</blockquote>' +
      '<p>My Vault keeps the answers in one private place, ready for the people you choose.</p></section>' +
      '<section class="v-card" aria-labelledby="priv-t"><h2 id="priv-t">Private until it’s needed</h2><ul class="v-points">' +
      '<li>' + ic('eyeoff', 22) + '<span><b>No one can see it while you’re alive.</b>Not your family, and not the people you choose.</span></li>' +
      '<li>' + ic('shield', 22) + '<span><b>Released only on your conditions.</b>After your death, if you become incapacitated, or either, and only after verification.</span></li>' +
      '<li>' + ic('people', 22) + '<span><b>Each person receives only what you choose.</b>You decide item by item.</span></li></ul></section>' +
      '</div><div class="v-col"><section class="v-card v-price" aria-labelledby="price-t"><h2 id="price-t">My Vault</h2>' + priceBlock() +
      (ready ? '<p class="v-muted">Cancel anytime from Vault settings. ' + esc(UI.pricing.data.taxNote || '') + '</p>' : '') +
      b('Start My Vault', { href: ready ? '#/subscribe' : null, act: ready ? null : 'noop', disabled: !ready, kind: 'primary', block: true, icon: 'arrow' }) +
      b('Back to Home', { href: 'index.html', kind: 'text' }) + '</section></div></div>';
    return { title: 'My Vault', crumbs: [{ label: 'My Vault' }], active: 'vault',
      head: VC.head({ hero: true, eyebrow: 'My Vault', title: 'Keep the rest of your estate organized.', desc: 'Your Will says who inherits. My Vault helps your family find everything else.' }), body: body };
  };

  /* 2 · Subscription activation */
  SCREENS.subscribe = function () {
    ensurePricing();
    var crumbs = [{ label: 'My Vault', href: '#/discover' }, { label: 'Start My Vault' }];
    if (UI.sub.done) {
      var ret = UI.returnTo && UI.returnTo !== '#/' && UI.returnTo.indexOf('discover') < 0 ? UI.returnTo : '';
      var retName = ret ? (moduleName(ret.split('/')[1]) || (ret.indexOf('people') >= 0 ? 'Trusted People' : ret.indexOf('release') >= 0 ? 'Release Rules' : '')) : '';
      return { title: 'My Vault is ready', crumbs: crumbs, head: VC.head({ eyebrow: 'My Vault', title: 'You’re all set.' }),
        body: '<section class="v-card v-success"><span class="v-success-ic">' + ic('check', 34) + '</span><h2>My Vault is ready.</h2><p>Nothing is shared while you’re alive. Start with what your family would need first.</p>' +
          '<div class="v-row-acts">' + b(retName ? 'Continue to ' + retName : 'Open My Vault', { act: 'sub:open', kind: 'primary', icon: 'arrow' }) + '</div></section>' };
    }
    var p = UI.pricing, s = UI.sub, v = s.values, e = s.errors, ready = p.status === 'ready';
    var body = (s.error ? VC.banner('error', esc(s.error)) : '') +
      '<div class="v-cols"><div class="v-col"><form class="v-card v-form" id="payform" novalidate aria-labelledby="pay-t"><h2 id="pay-t">Payment details</h2>' +
      VC.flag('Prototype: no real payment is taken. Connect the billing API at MW_API.startSubscription.') +
      VC.field({ k: 'name', type: 'text', label: 'Name on card', req: true }, v, e) +
      VC.field({ k: 'card', type: 'text', label: 'Card number', req: true, placeholder: '1234 5678 9012 3456' }, v, e) +
      '<div class="v-grid2">' + VC.field({ k: 'exp', type: 'text', label: 'Expiry date', req: true, placeholder: 'MM / YY' }, v, e) + VC.field({ k: 'cvc', type: 'text', label: 'Security code', req: true, hint: '3 or 4 digits on the back.' }, v, e) + '</div>' +
      '<div class="v-row-acts">' + b(s.busy ? 'Starting your Vault…' : 'Start My Vault', { submit: true, kind: 'primary', busy: s.busy, disabled: s.busy || !ready }) + b('Back', { href: '#/discover', kind: 'text' }) + '</div></form></div>' +
      '<div class="v-col"><section class="v-card v-price" aria-labelledby="sum-t"><h2 id="sum-t">Summary</h2>' + priceBlock(true) +
      (ready ? VC.reviewSummary([{ title: 'My Vault', rows: [['Billed', 'Every ' + p.data.interval + ', starting today'], ['Cancel', 'Anytime, from Vault settings'], ['Taxes', p.data.taxNote || '']] }]) : '') +
      '</section></div></div>';
    return { title: 'Start My Vault', crumbs: crumbs, head: VC.head({ eyebrow: 'Start My Vault', title: 'Confirm and start My Vault', desc: 'You’ll go straight to your Vault when it’s done.' }), body: body };
  };

  /* 3 · Overview */
  SCREENS.overview = function () {
    var s = sel.state(), na = sel.nextAction(), un = sel.unassigned(), tc = sel.triggerCounts();
    var extra = na.kind === 'resume' && s.guided.lastSavedAt ? '<p class="v-save">' + ic('save', 18) + 'Last saved ' + esc(VC.fmtTime(s.guided.lastSavedAt)) + '</p>' : '';
    var rows = C.moduleOrder.map(function (m) {
      var x = C.modules[m], sm = sel.moduleSummary(m);
      var st = sm.count ? '<span class="v-muted">' + sm.count + ' item' + (sm.count > 1 ? 's' : '') + '</span>' + (sm.drafts ? VC.chip('draft', sm.drafts + ' draft' + (sm.drafts > 1 ? 's' : '')) : '') : VC.chip('none', 'Nothing added yet');
      return VC.moduleRow({ icon: x.icon, name: x.name, one: x.one, href: '#/' + m, status: st });
    }).join('');
    var people = s.people.length ? '<div class="v-plist">' + s.people.map(function (p) {
      var n = sel.itemsFor(p.id).length;
      return '<div class="v-prow"><span class="v-av" aria-hidden="true">' + esc(VC.initials(p.name)) + '</span><span class="v-prow-tx"><b>' + esc(p.name) + '</b><small>' + (n ? 'Receives ' + n + ' item' + (n > 1 ? 's' : '') : 'Receives nothing yet') + '</small></span></div>';
    }).join('') + '</div>' : '<p class="v-muted">No one yet. Add the people who should receive your information.</p>';
    var trig = C.triggers.map(function (t) { return '<div><span>' + esc(t.label) + '</span><b>' + (tc[t.id] || 0) + '</b></div>'; }).join('');
    var g = s.guided, gtxt = g.status === 'completed' ? 'Finished ' + VC.fmtDate(g.completedAt) + '.' : g.status === 'in_progress' ? 'Paused. Last saved ' + VC.fmtTime(g.lastSavedAt) + '.' : 'Not started.';
    var body = '<div class="v-cols"><div class="v-col">' + VC.nextCard(na, extra) +
      '<section aria-labelledby="added-t" class="v-stack" style="gap:1rem"><h2 class="v-sec-t" id="added-t">What you’ve added</h2><div class="v-mrows">' + rows + '</div></section></div>' +
      '<div class="v-col">' +
      '<section class="v-card" aria-labelledby="who-t"><div class="v-card-h"><h2 id="who-t">Who receives it</h2></div>' + people +
      (un.length ? VC.chip('pending', un.length + ' item' + (un.length > 1 ? 's have' : ' has') + ' no recipient yet') : '') +
      '<div class="v-row-acts">' + b(s.people.length ? 'Manage Trusted People' : 'Add a trusted person', { href: s.people.length ? '#/people' : '#/people/new', kind: 'text' }) + '</div></section>' +
      '<section class="v-card" aria-labelledby="when-t"><div class="v-card-h"><h2 id="when-t">When it’s released</h2>' + (sel.releaseNeedsReview() ? VC.chip('pending', 'Needs review') : s.release.reviewedAt ? VC.chip('complete', 'Reviewed') : '') + '</div>' +
      '<div class="v-trig">' + trig + '</div><p class="v-hint v-hint--icon">' + ic('shield', 18) + esc(C.verification.summary) + '</p>' +
      '<div class="v-row-acts">' + b('Release Rules', { href: '#/release', kind: 'text' }) + '</div></section>' +
      '<section class="v-card" aria-labelledby="gs-t"><h2 id="gs-t" style="font-size:1.25rem">Guided setup</h2><p class="v-muted">' + esc(gtxt) + '</p>' +
      (na.kind !== 'resume' && na.kind !== 'start' ? '<div class="v-row-acts">' + b(g.status === 'completed' ? 'Go through it again' : g.status === 'in_progress' ? 'Continue' : 'Start guided setup', { href: '#/guided', kind: 'text' }) + '</div>' : '') + '</section>' +
      '</div></div>' + (s.lastSavedAt ? '<p class="v-save">' + ic('check', 18) + 'All changes saved ' + esc(VC.fmtTime(s.lastSavedAt)) + '</p>' : '');
    return { title: 'My Vault', crumbs: [{ label: 'My Vault' }], active: 'overview',
      head: VC.head({ eyebrow: 'My Vault', title: 'Everything important, in one secure place.', desc: 'Private while you’re alive. Released only on the conditions you set.', actions: b('Add something', { href: '#/add', kind: 'ghostnavy', iconLeft: 'plus' }) }), body: body };
  };

  /* Manual entry chooser */
  SCREENS.add = function () {
    var cards = C.moduleOrder.map(function (m) { var x = C.modules[m]; return '<a class="v-cat" href="#/' + m + '/new"><span class="v-cat-ic">' + ic(x.icon, 26) + '</span><span class="v-cat-tx"><b>' + esc(x.addLabel) + '</b><small>' + esc(x.one) + '</small></span></a>'; }).join('') +
      '<a class="v-cat" href="#/people/new"><span class="v-cat-ic">' + ic('people', 26) + '</span><span class="v-cat-tx"><b>Add a trusted person</b><small>Someone who may receive your information.</small></span></a>';
    var g = sel.state().guided;
    return { title: 'Add something', crumbs: [CR_VAULT, { label: 'Add something' }], active: 'overview',
      head: VC.head({ eyebrow: 'My Vault', title: 'What would you like to add?' }),
      body: '<div class="v-cats">' + cards + '</div>' + (g.status !== 'completed' ? VC.banner('info', 'Not sure where to start? Guided setup asks one question at a time.', b(g.status === 'in_progress' ? 'Continue guided setup' : 'Start guided setup', { href: '#/guided', kind: 'secondary', size: 'sm' })) : '') };
  };

  /* Module list screens: Estate Inventory, Obligations, Sealed Disclosures, Final Words */
  function recipientsLine(it) {
    var as = it.assignments || [];
    if (!as.length) return it.status === 'draft' ? '' : VC.chip('pending', 'No recipient yet');
    var names = as.map(function (a) { var p = sel.person(a.personId); return p ? p.name.split(' ')[0] : 'Removed person'; });
    var trigs = as.map(function (a) { return a.trigger; }).filter(function (t, i, x) { return x.indexOf(t) === i; });
    return '<span>' + ic('people', 18) + '</span><span>' + esc(names.join(', ')) + '</span><span aria-hidden="true">·</span><span>' + esc(trigs.length === 1 ? sel.triggerLabel(trigs[0], true) : 'Different conditions') + '</span>';
  }
  function itemRow(it) {
    var c = sel.cat(it.module, it.cat) || { icon: 'file', label: '' };
    return '<div class="v-li"><span class="v-li-ic">' + ic(c.icon, 24) + '</span><div class="v-li-tx"><b>' + esc(sel.title(it)) + '</b>' + (sel.sub(it) ? '<small>' + esc(sel.sub(it)) + '</small>' : '') +
      '<div class="v-li-meta">' + recipientsLine(it) + '</div></div>' +
      '<div class="v-li-acts">' + (it.status === 'draft' ? VC.chip('draft', 'Draft') : VC.chip('complete', 'Complete')) + b(it.status === 'draft' ? 'Finish' : 'View or edit', { href: '#/' + it.module + '/' + it.id, kind: 'secondary', size: 'sm' }) + '</div></div>';
  }
  function moduleScreen(m) {
    return function () {
      var x = C.modules[m], items = sel.items(m), sm = sel.moduleSummary(m), g = sel.state().guided, body;
      if (!items.length) {
        body = (x.backendNote ? VC.flag(x.backendNote) : '') + VC.emptyState({ icon: x.icon, title: x.empty.title, text: x.empty.text,
          actions: b(x.addLabel, { href: '#/' + m + '/new', kind: 'primary', iconLeft: 'plus' }) + ((m === 'assets' || m === 'obligations') && g.status !== 'completed' ? b(g.status === 'in_progress' ? 'Continue guided setup' : 'Start guided setup', { href: '#/guided', kind: 'secondary' }) : '') });
      } else {
        var groups = x.groups ? x.groups.map(function (gr) { return { t: gr + ' obligations', items: items.filter(function (i) { var c = sel.cat(m, i.cat); return c && c.group === gr; }) }; }) :
          x.cats.map(function (c) { return { t: c.label, items: items.filter(function (i) { return i.cat === c.id; }) }; });
        body = (x.backendNote ? VC.flag(x.backendNote) : '') + '<p class="v-muted">' + sm.count + ' item' + (sm.count > 1 ? 's' : '') + (sm.drafts ? ' · ' + sm.drafts + ' draft' + (sm.drafts > 1 ? 's' : '') + '. Drafts aren’t released to anyone.' : '') + '</p>' +
          groups.filter(function (gp) { return gp.items.length; }).map(function (gp) { return '<h2 class="v-glist-t">' + esc(gp.t) + '</h2><div class="v-list">' + gp.items.map(itemRow).join('') + '</div>'; }).join('');
      }
      return { title: x.name, crumbs: [CR_VAULT, { label: x.name }], active: m,
        head: VC.head({ eyebrow: 'My Vault', eyeIcon: x.icon, title: x.name, desc: x.one, actions: items.length ? b(x.addLabel, { href: '#/' + m + '/new', kind: 'onnavy', iconLeft: 'plus' }) : '' }), body: body };
    };
  }

  /* ---------- item form (shared by all four modules and guided setup) ---------- */
  var STEPS = ['Type', 'Details', 'Who receives it', 'Review'];
  function initForm(m, id, q) {
    var it = id === 'new' ? null : sel.item(id);
    if (id !== 'new' && !it) { UI.form = { missing: true, module: m }; return; }
    var people = it ? (it.assignments || []).map(function (a) { return a.personId; }) : [];
    var trigs = it ? (it.assignments || []).map(function (a) { return a.trigger; }).filter(function (t, i, x) { return x.indexOf(t) === i; }) : [];
    UI.form = { module: m, id: it ? it.id : null, isNew: !it, cat: it ? it.cat : (q.cat || ''), values: it ? JSON.parse(JSON.stringify(it.values || {})) : {}, people: people,
      trigger: trigs.length === 1 ? trigs[0] : '', mixed: trigs.length > 1, status: it ? it.status : 'new', savedAt: it ? it.updatedAt : null, dirty: false, errors: {},
      step: it ? (q.step ? +q.step : (it.status === 'draft' ? 1 : 3)) : (q.cat ? 1 : 0), via: it ? it.via : 'manual' };
  }
  function visibleFields(f) { var c = sel.cat(f.module, f.cat); return c ? c.fields.filter(function (x) { return !x.when || x.when(f.values); }) : []; }
  function validateDetails(f) {
    var e = {};
    visibleFields(f).forEach(function (x) {
      var val = f.values[x.k];
      if (x.req && (val == null || String(val).trim() === '')) e[x.k] = 'Please fill this in.';
      if (x.type === 'money' && val && isNaN(Number(String(val).replace(/[, ]/g, '')))) e[x.k] = 'Enter a number, like 2500.';
    });
    return e;
  }
  function hasContent(f) { return Object.keys(f.values).some(function (k) { return k.slice(-4) !== '_cur' && String(f.values[k] || '').trim(); }); }
  function assignmentsOf(f) { return f.people.length && f.trigger ? f.people.map(function (pid) { return { personId: pid, trigger: f.trigger }; }) : (f.mixed && !f.people.length ? [] : f.mixed ? (sel.item(f.id) || {}).assignments || [] : []); }
  function persistDraft() {
    var f = UI.form; if (!f || !f.cat || !(f.isNew || f.status === 'draft') || !hasContent(f)) return;
    f.id = act.saveItem({ id: f.id, module: f.module, cat: f.cat, values: f.values, status: 'draft', assignments: assignmentsOf(f), via: f.guided ? 'guided' : f.via });
    f.status = 'draft'; f.savedAt = new Date().toISOString(); f.dirty = false;
    if (sel.saveFailed()) { if (!root.querySelector('.v-banner--error')) rerender(); return; }
    var el = document.getElementById('v-save-status'); if (el) el.innerHTML = VC.draftStatus({ status: 'draft', savedAt: f.savedAt });
  }
  function fieldsHTML(f) {
    var h = '<div class="v-form">' + visibleFields(f).map(function (x) { return VC.field(x, f.values, f.errors); }).join('') + '</div>';
    if (f.module === 'assets') h += VC.banner('info', 'Never enter passwords or PINs here. Keep them in <a href="#/sealed">Sealed Disclosures</a>, which stay locked until release.');
    return h;
  }
  function formReview(f) {
    var c = sel.cat(f.module, f.cat), rows = visibleFields(f).map(function (x) {
      var cfg = x.configKey ? C[x.configKey] : null, val = f.values[x.k];
      if (x.type === 'money') val = val ? (f.values[x.k + '_cur'] || 'CAD') + ' ' + Number(String(val).replace(/[, ]/g, '')).toLocaleString('en-CA') : '';
      if (x.type === 'file') val = (val || []).join(', ');
      return [cfg ? cfg.label : x.label, val];
    }).filter(function (r) { return r[1]; });
    var names = f.people.map(function (pid) { var p = sel.person(pid); return p ? p.name : ''; }).filter(Boolean);
    return VC.reviewSummary([
      { title: 'Type', rows: [['Category', c ? c.label : '']], edit: { act: 'form:step', attrs: { 'data-step': '0' } } },
      { title: 'Details', rows: rows, edit: { act: 'form:step', attrs: { 'data-step': '1' } } },
      { title: 'Who receives it', rows: names.length ? [['People', names.join(', ')], ['Released', f.trigger ? sel.triggerLabel(f.trigger) : (f.mixed ? 'Different for each person (see Release Rules)' : 'Not chosen yet')]] : [], empty: 'No one yet. It won’t be released to anyone until you choose.', edit: { act: 'form:step', attrs: { 'data-step': '2' } } }
    ]);
  }
  function itemFormScreen(m) {
    return function (r) {
      var x = C.modules[m], f = UI.form;
      if (!f || f.missing) return { title: 'Not found', crumbs: [CR_VAULT, { label: x.name, href: '#/' + m }], active: m, head: VC.head({ eyebrow: x.name, title: 'We couldn’t find that item' }),
        body: VC.errorState({ title: 'This item isn’t available', text: 'It may have been deleted. Your other items are safe.', actions: b('Back to ' + x.name, { href: '#/' + m, kind: 'primary' }) }) };
      var c = sel.cat(m, f.cat), title = f.isNew ? x.addLabel : (c ? sel.title({ module: m, cat: f.cat, values: f.values }) : x.name);
      var stepBody = f.step === 0 ? VC.catGrid(m, f.cat) + (f.errors.cat ? '<p class="v-err" role="alert">' + ic('alert', 16) + esc(f.errors.cat) + '</p>' : '') :
        f.step === 1 ? '<h2>' + esc(c ? c.label : '') + '</h2>' + fieldsHTML(f) :
        f.step === 2 ? (f.mixed ? VC.banner('info', 'Different people receive this item on different conditions. Choosing a condition here applies it to everyone selected.') : '') +
          VC.personSelector({ people: sel.state().people, selected: f.people, query: UI.ps.query, adding: UI.ps.adding, addValues: UI.ps.values, addErrors: UI.ps.errors, hint: 'They can’t see anything now. You can also decide later.' }) +
          VC.triggerSelector({ value: f.trigger, error: f.errors.trigger }) :
        '<h2>Check and save</h2>' + formReview(f);
      var last = f.step === 3, canDraft = f.isNew || f.status === 'draft';
      var bar = '<div class="v-formbar">' + (f.step > 0 ? b('Back', { act: 'form:back', kind: 'secondary', iconLeft: 'back' }) : b('Cancel', { href: '#/' + m, kind: 'text' })) +
        '<span id="v-save-status">' + VC.draftStatus({ status: f.status, savedAt: f.savedAt, dirty: f.dirty && !canDraft, saveFailed: sel.saveFailed() }) + '</span><div class="v-push">' +
        (canDraft && f.step > 0 && !last ? b('Save as draft', { act: 'form:draft', kind: 'secondary' }) : '') +
        (!last ? b('Continue', { act: 'form:next', kind: 'primary', icon: 'arrow' }) :
          (f.isNew || f.status === 'draft' ? b('Save and add another', { act: 'form:saveanother', kind: 'secondary' }) : '') + b(f.isNew || f.status === 'draft' ? 'Save' : 'Save changes', { act: 'form:save', kind: 'primary', iconLeft: 'check' })) + '</div></div>';
      var body = '<div class="v-narrow v-stack">' + VC.formSteps(STEPS, f.step) + '<section class="v-card v-formcard">' + stepBody + bar + '</section>' +
        (!f.isNew ? '<div>' + b('Delete this ' + x.noun, { act: 'form:delete', kind: 'danger', iconLeft: 'trash' }) + '</div>' : '') + '</div>';
      return { title: title, crumbs: [CR_VAULT, { label: x.name, href: '#/' + m }, { label: f.isNew ? x.addLabel : 'Edit' }], active: m,
        head: VC.head({ eyebrow: x.name, eyeIcon: x.icon, title: title, desc: f.isNew ? 'Rough figures are fine. You can change anything later.' : (f.status === 'draft' ? 'This is a draft. It isn’t released to anyone until you save it.' : '') }), body: body };
    };
  }

  /* 6–7 · Trusted People */
  SCREENS.people = function (r) {
    if (r.path[1]) return personForm(r);
    var s = sel.state(), q = UI.ps.query.toLowerCase();
    var list = s.people.filter(function (p) { return !q || (p.name + ' ' + p.email).toLowerCase().indexOf(q) >= 0; });
    var body = !s.people.length ? VC.emptyState({ icon: 'people', title: 'No trusted people yet', text: 'Add the people who should receive your information. They won’t be told anything now.', actions: b('Add a person', { href: '#/people/new', kind: 'primary', iconLeft: 'plus' }) }) :
      (s.people.length > 6 ? '<div class="v-search">' + ic('search', 20) + '<input class="v-input" type="search" id="people-q" data-field="__psq" value="' + esc(UI.ps.query) + '" placeholder="Search by name or email" aria-label="Search trusted people"></div>' : '') +
      '<div class="v-list">' + list.map(function (p) {
        var n = sel.itemsFor(p.id).length;
        return '<div class="v-li"><span class="v-av" aria-hidden="true">' + esc(VC.initials(p.name)) + '</span><div class="v-li-tx"><b>' + esc(p.name) + '</b><small>' + esc([p.relationship, p.email].filter(Boolean).join(' · ')) + '</small></div>' +
          '<div class="v-li-acts">' + (n ? '<span class="v-muted">Receives ' + n + ' item' + (n > 1 ? 's' : '') + '</span>' : VC.chip('none', 'Receives nothing yet')) + b('What they receive', { href: '#/release/' + p.id, kind: 'text' }) + b('Edit', { href: '#/people/' + p.id, kind: 'secondary', size: 'sm', iconLeft: 'pen' }) + '</div></div>';
      }).join('') + (!list.length ? '<p class="v-muted" style="padding:1.25rem 1.5rem">No one matches “' + esc(UI.ps.query) + '”.</p>' : '') + '</div>';
    return { title: 'Trusted People', crumbs: [CR_VAULT, { label: 'Trusted People' }], active: 'people',
      head: VC.head({ eyebrow: 'My Vault', eyeIcon: 'people', title: 'Trusted People', desc: 'The people who may receive your information. They can’t see anything while you’re alive.', actions: s.people.length ? b('Add a person', { href: '#/people/new', kind: 'onnavy', iconLeft: 'plus' }) : '' }), body: body };
  };
  function initPerson(id, q) {
    var p = id === 'new' ? null : sel.person(id);
    UI.person = { id: p ? p.id : null, isNew: !p, missing: id !== 'new' && !p, values: p ? { name: p.name, email: p.email, relationship: p.relationship } : {}, errors: {}, dupOk: false, ret: q.ret || '' };
  }
  function personForm() {
    var P = UI.person, v = P.values, e = P.errors;
    if (P.missing) return { title: 'Not found', crumbs: [CR_VAULT, { label: 'Trusted People', href: '#/people' }], active: 'people', head: VC.head({ eyebrow: 'Trusted People', title: 'We couldn’t find that person' }), body: VC.errorState({ title: 'This person isn’t in your list', text: 'They may have been removed.', actions: b('Back to Trusted People', { href: '#/people', kind: 'primary' }) }) };
    var n = P.id ? sel.itemsFor(P.id).length : 0;
    var body = '<div class="v-narrow v-stack"><form class="v-card v-form" id="personform" novalidate>' +
      VC.field({ k: 'name', type: 'text', label: 'Full name', req: true, hint: 'As your family would know them.' }, v, e) +
      VC.field({ k: 'email', type: 'email', label: 'Email', req: true, hint: 'We contact them here only if information is released to them.' }, v, e) +
      VC.field({ k: 'relationship', type: 'radio', label: 'Relationship', optional: true, options: ['Spouse', 'Child', 'Parent', 'Sibling', 'Friend', 'Other'] }, v, e) +
      VC.banner('info', 'They won’t be told anything now. ' + esc(C.verification.summary)) +
      (n ? '<p class="v-muted">' + esc(v.name || 'This person') + ' receives ' + n + ' item' + (n > 1 ? 's' : '') + '.</p>' : '') +
      '<div class="v-formbar">' + b('Cancel', { href: P.ret || '#/people', kind: 'text' }) + '<div class="v-push">' + b(P.isNew ? 'Save person' : 'Save changes', { submit: true, kind: 'primary', iconLeft: 'check' }) + '</div></div></form>' +
      (!P.isNew ? '<div>' + b('Remove this person', { act: 'person:delete', kind: 'danger', iconLeft: 'trash' }) + '</div>' : '') + '</div>';
    return { title: P.isNew ? 'Add a trusted person' : 'Edit ' + v.name, crumbs: [CR_VAULT, { label: 'Trusted People', href: '#/people' }, { label: P.isNew ? 'Add a person' : 'Edit' }], active: 'people',
      head: VC.head({ eyebrow: 'Trusted People', eyeIcon: 'people', title: P.isNew ? 'Add a trusted person' : 'Edit ' + (sel.person(P.id) || {}).name }), body: body };
  }

  /* 12–14 · Release Rules */
  SCREENS.release = function (r) {
    if (r.path[1] === 'review') return releaseReview();
    if (r.path[1]) return releasePerson();
    var s = sel.state(), un = sel.unassigned(), needs = sel.releaseNeedsReview();
    var how = '<section class="v-card" aria-labelledby="how-t"><h2 id="how-t">How release works</h2><ol class="v-howsteps">' + C.verification.steps.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ol>' +
      (C.verification.approved ? '' : VC.flag(C.verification.pendingNote)) + '</section>';
    var unH = un.length ? '<section class="v-card" aria-labelledby="un-t"><div class="v-card-h"><h2 id="un-t">Not assigned yet</h2>' + VC.chip('pending', un.length + ' item' + (un.length > 1 ? 's' : '')) + '</div><p>These items won’t be released to anyone until you choose who receives them.</p><div class="v-list">' +
      un.map(function (it) { return '<div class="v-li"><span class="v-li-ic">' + ic((sel.cat(it.module, it.cat) || {}).icon || 'file', 24) + '</span><div class="v-li-tx"><b>' + esc(sel.title(it)) + '</b><small>' + esc(moduleName(it.module)) + '</small></div><div class="v-li-acts">' + b('Choose people', { href: '#/' + it.module + '/' + it.id + '?step=2', kind: 'secondary', size: 'sm' }) + '</div></div>'; }).join('') + '</div></section>' : '';
    var people = s.people.length ? s.people.map(function (p) {
      var items = sel.itemsFor(p.id);
      return '<section class="v-card" aria-label="' + esc(p.name) + '"><div class="v-card-h"><div class="v-prow" style="padding:0"><span class="v-av" aria-hidden="true">' + esc(VC.initials(p.name)) + '</span><span class="v-prow-tx"><b style="font-size:1.25rem">' + esc(p.name) + '</b><small>' + esc(p.email) + '</small></span></div>' +
        b('Change what they receive', { href: '#/release/' + p.id, kind: 'secondary', size: 'sm', iconLeft: 'pen' }) + '</div>' +
        (items.length ? '<div class="v-rev-dl">' + items.map(function (it) { var a = sel.assignment(it, p.id); return '<div><dt>' + esc(sel.title(it)) + (it.status === 'draft' ? ' (draft)' : '') + '</dt><dd>' + esc(sel.triggerLabel(a.trigger)) + '</dd></div>'; }).join('') + '</div>' : '<p class="v-muted">Nothing assigned yet.</p>') + '</section>';
    }).join('') : VC.emptyState({ icon: 'people', title: 'Add someone to release information to', text: 'Release Rules start with the people you trust.', actions: b('Add a trusted person', { href: '#/people/new?ret=' + encodeURIComponent('#/release'), kind: 'primary', iconLeft: 'plus' }) });
    var status = needs ? VC.banner('pending', '<b>You have changes to review.</b> Your choices are saved as a draft until you review and confirm them.', b('Review and confirm', { href: '#/release/review', kind: 'primary', size: 'sm' })) :
      s.release.reviewedAt ? VC.banner('ok', 'Release rules confirmed ' + esc(VC.fmtTime(s.release.reviewedAt)) + '.') : '';
    return { title: 'Release Rules', crumbs: [CR_VAULT, { label: 'Release Rules' }], active: 'release',
      head: VC.head({ eyebrow: 'My Vault', eyeIcon: 'shield', title: 'Release Rules', desc: 'Who receives what, and when. Nothing is released while you’re alive.' }),
      body: status + '<div class="v-cols"><div class="v-col">' + unH + people + '</div><div class="v-col">' + how + '</div></div>' + VC.flag('Backend: only confirmed rules should be used at release time. Drafted changes stay pending until confirmed.') };
  };
  function initRel(pid) {
    var p = sel.person(pid); if (!p) { UI.rel = { missing: true }; return; }
    var map = {}; sel.items().forEach(function (it) { var a = sel.assignment(it, pid); map[it.id] = a ? a.trigger : null; });
    UI.rel = { pid: pid, map: map, on: Object.keys(map).filter(function (k) { return map[k]; }), error: '' };
  }
  function releasePerson() {
    var R = UI.rel;
    if (!R || R.missing) return { title: 'Not found', crumbs: [CR_VAULT, { label: 'Release Rules', href: '#/release' }], active: 'release', head: VC.head({ eyebrow: 'Release Rules', title: 'We couldn’t find that person' }), body: VC.errorState({ title: 'This person isn’t in your list', text: 'They may have been removed.', actions: b('Back to Release Rules', { href: '#/release', kind: 'primary' }) }) };
    var p = sel.person(R.pid), first = p.name.split(' ')[0];
    var groups = C.moduleOrder.map(function (m) {
      var items = sel.items(m); if (!items.length) return '';
      return '<h2 class="v-glist-t">' + esc(moduleName(m)) + '</h2><div class="v-assign">' + items.map(function (it) {
        var on = R.on.indexOf(it.id) >= 0, t = R.map[it.id];
        return '<div class="v-arow' + (on ? ' on' : '') + '"><label class="v-arow-main"><input type="checkbox" data-act="rel:toggle" data-id="' + it.id + '"' + (on ? ' checked' : '') + '><span class="v-arow-tx"><b>' + esc(sel.title(it)) + '</b><small>' + esc(sel.sub(it) || (sel.cat(m, it.cat) || {}).label || '') + (it.status === 'draft' ? ' · Draft' : '') + '</small></span></label>' +
          (on ? '<fieldset class="v-seg" aria-label="When should ' + esc(first) + ' receive ' + esc(sel.title(it)) + '?"><legend class="v-sr">When</legend>' + C.triggers.map(function (tr) {
            return '<label class="' + (t === tr.id ? 'on' : '') + '"><input type="radio" name="t-' + it.id + '" data-act="rel:trig" data-id="' + it.id + '" value="' + tr.id + '"' + (t === tr.id ? ' checked' : '') + '>' + esc(tr.short) + '</label>';
          }).join('') + '</fieldset>' : '') + '</div>';
      }).join('') + '</div>';
    }).join('');
    var body = '<div class="v-narrow v-stack" style="max-width:64rem">' + (R.error ? VC.banner('error', esc(R.error)) : '') +
      (groups || VC.emptyState({ icon: 'vault', title: 'Nothing to assign yet', text: 'Add assets, obligations or messages first.', actions: b('Add something', { href: '#/add', kind: 'primary' }) })) +
      '<div class="v-endbar">' + b('Cancel', { href: '#/release', kind: 'text' }) + '<div class="v-push">' + b('Save for ' + first, { act: 'rel:save', kind: 'primary', iconLeft: 'check' }) + '</div></div></div>';
    return { title: 'What ' + first + ' receives', crumbs: [CR_VAULT, { label: 'Release Rules', href: '#/release' }, { label: p.name }], active: 'release',
      head: VC.head({ eyebrow: 'Release Rules', eyeIcon: 'shield', title: 'What should ' + first + ' receive?', desc: 'Choose each item, then when it’s released. ' + first + ' can’t see anything while you’re alive.' }), body: body };
  }
  function releaseReview() {
    var s = sel.state(), un = sel.unassigned();
    var groups = s.people.map(function (p) {
      var items = sel.itemsFor(p.id);
      return { title: p.name, rows: items.map(function (it) { return [sel.title(it), sel.triggerLabel(sel.assignment(it, p.id).trigger)]; }), empty: 'Receives nothing.', edit: { href: '#/release/' + p.id } };
    });
    if (un.length) groups.push({ title: 'Not released to anyone', rows: un.map(function (it) { return [sel.title(it), moduleName(it.module)]; }) });
    var body = '<div class="v-narrow v-stack" style="max-width:64rem">' + VC.banner('info', '<b>Nothing is shared while you’re alive.</b> ' + esc(C.verification.summary)) +
      (s.people.length ? VC.reviewSummary(groups) : VC.emptyState({ icon: 'people', title: 'No one to release to yet', text: 'Add a trusted person first.', actions: b('Add a trusted person', { href: '#/people/new', kind: 'primary' }) })) +
      '<div class="v-endbar">' + b('Back', { href: '#/release', kind: 'text' }) + '<div class="v-push">' + b('Confirm release rules', { act: 'rel:confirm', kind: 'primary', iconLeft: 'check', disabled: !s.people.length }) + '</div></div></div>';
    return { title: 'Review release rules', crumbs: [CR_VAULT, { label: 'Release Rules', href: '#/release' }, { label: 'Review' }], active: 'release',
      head: VC.head({ eyebrow: 'Release Rules', eyeIcon: 'shield', title: 'Review your release rules', desc: 'Check who receives what, and when. You can change this anytime.' }), body: body };
  }

  /* 4, 5, 15, 19, 20 · Guided setup */
  SCREENS.guided = function () {
    var g = sel.state().guided, steps = sel.guidedSteps();
    var exitBtn = b('Save and exit', { act: 'g:exit', kind: 'ghostnavy', iconLeft: 'save' });
    var crumbs = [CR_VAULT, { label: 'Guided setup' }];
    if (UI.guided.justCompleted) {
      var n = sel.items().length, pc = sel.state().people.length;
      return { title: 'Guided setup finished', crumbs: crumbs, active: 'overview', head: VC.head({ eyebrow: 'Guided setup', title: 'Your Vault is set up.' }),
        body: '<section class="v-card v-success"><span class="v-success-ic">' + ic('check', 34) + '</span><h2>Well done. Your information is saved.</h2><p>' + n + ' item' + (n === 1 ? '' : 's') + ' and ' + pc + ' trusted ' + (pc === 1 ? 'person' : 'people') + '. Nothing is shared while you’re alive.</p>' +
          '<p>Your Vault is never really finished. Add or change things when life changes.</p><div class="v-row-acts">' + b('Go to My Vault', { href: '#/overview', kind: 'primary', icon: 'arrow' }) + b('Review release rules', { href: '#/release', kind: 'text' }) + '</div>' +
          VC.flag('A yearly review reminder needs the notifications service.') + '</section>' };
    }
    if (g.status === 'not_started') {
      return { title: 'Guided setup', crumbs: crumbs, active: 'overview', head: VC.head({ eyebrow: 'Guided setup', eyeIcon: 'compass', title: 'Set up your Vault step by step', desc: 'We’ll help you remember the important information your family may need.' }),
        body: '<div class="v-cols"><div class="v-col"><section class="v-card"><h2>How it works</h2><ul class="v-points">' +
          '<li>' + ic('compass', 22) + '<span><b>One question at a time.</b>Answer yes or no, and add details only when you have something.</span></li>' +
          '<li>' + ic('chev', 22) + '<span><b>Skip anything.</b>Come back to it later.</span></li>' +
          '<li>' + ic('save', 22) + '<span><b>Save and exit whenever you like.</b>We keep your place.</span></li>' +
          '<li>' + ic('check', 22) + '<span><b>Check everything at the end.</b>Nothing is shared while you’re alive.</span></li></ul>' +
          '<ol class="v-gsec" aria-label="Sections">' + sel.sections.map(function (s, i) { return '<li><span class="v-gdot">' + (i + 1) + '</span>' + esc(s.label) + '</li>'; }).join('') + '</ol>' +
          '<div class="v-row-acts">' + b('Start guided setup', { act: 'g:start', kind: 'primary', icon: 'arrow' }) + b('Add something manually', { href: '#/add', kind: 'text' }) + '</div></section></div>' +
          '<div class="v-col"><section class="v-card v-story"><h2>Before you start</h2><p>Rough figures are fine. You don’t need statements in front of you.</p><p>Keep passwords out of your answers. They belong in Sealed Disclosures.</p></section></div></div>' };
    }
    if (g.status === 'completed' && !UI.guided.resumeAck) {
      return { title: 'Guided setup', crumbs: crumbs, active: 'overview', head: VC.head({ eyebrow: 'Guided setup', eyeIcon: 'compass', title: 'You finished guided setup', desc: 'Finished ' + VC.fmtDate(g.completedAt) + '.' }),
        body: '<section class="v-card"><p>Go through the questions again to check for anything new. Everything you added stays as it is.</p><div class="v-row-acts">' + b('Go through it again', { act: 'g:restart', kind: 'primary' }) + b('Back to My Vault', { href: '#/overview', kind: 'text' }) + '</div></section>' };
    }
    var i = Math.min(g.step, steps.length - 1), st = steps[i];
    if (g.status === 'in_progress' && !UI.guided.resumeAck) {
      return { title: 'Continue guided setup', crumbs: crumbs, active: 'overview', head: VC.head({ eyebrow: 'Guided setup', eyeIcon: 'compass', title: 'Welcome back.' }),
        body: '<div class="v-narrow v-stack"><section class="v-card v-qcard">' + VC.chip('draft', 'Paused') + '<h2 class="v-q" style="font-size:2rem">Pick up where you left off.</h2>' +
          '<p class="v-qhint">You stopped at <b>' + esc(st.label) + '</b>. Last saved ' + esc(VC.fmtTime(g.lastSavedAt)) + '.</p>' +
          VC.guidedProgress({ sections: sel.sections, secIndex: secIndex(st), index: i, total: steps.length }) +
          '<div class="v-row-acts">' + b('Continue where I left off', { act: 'g:resume', kind: 'primary', icon: 'arrow' }) + b('Start from the beginning', { act: 'g:restart', kind: 'secondary' }) + b('Back to My Vault', { href: '#/overview', kind: 'text' }) + '</div>' +
          '<p class="v-muted">Starting from the beginning keeps everything you’ve already added.</p></section></div>' };
    }
    var q = guidedStep(st, i, steps);
    return { title: 'Guided setup', crumbs: crumbs, active: 'overview', head: VC.head({ eyebrow: 'Guided setup', eyeIcon: 'compass', title: 'Set up your Vault', actions: exitBtn }),
      body: '<div class="v-narrow v-stack" style="max-width:60rem">' + VC.guidedProgress({ sections: sel.sections, secIndex: secIndex(st), index: i, total: steps.length }) + q + '</div>' };
  };
  function secIndex(st) { return sel.sections.map(function (s) { return s.id; }).indexOf(st.section); }
  function gNav(next, opts) {
    opts = opts || {};
    return '<div class="v-endbar">' + b('Back', { act: 'g:back', kind: 'secondary', iconLeft: 'back', disabled: opts.first }) +
      '<span id="v-save-status">' + (sel.state().guided.lastSavedAt ? VC.draftStatus({ savedAt: sel.state().guided.lastSavedAt, saveFailed: sel.saveFailed() }) : '') + '</span><div class="v-push">' + next + '</div></div>';
  }
  function guidedStep(st, i, steps) {
    var s = sel.state(), G = UI.guided;
    if (st.type === 'people') {
      var list = s.people.length ? '<ul class="v-added">' + s.people.map(function (p) { return '<li>' + ic('check', 20) + '<span>' + esc(p.name) + '<small>' + esc(p.email) + '</small></span></li>'; }).join('') + '</ul>' : '';
      return '<section class="v-card v-qcard"><h2 class="v-q">Who should receive information when the time comes?</h2><p class="v-qhint">Add the people you trust. You’ll choose what each person receives later.</p>' + list +
        (UI.ps.adding ? VC.personMiniForm(UI.ps.values, UI.ps.errors) : b(s.people.length ? 'Add another person' : 'Add a person', { act: 'ps:add', kind: 'secondary', iconLeft: 'plus' })) +
        gNav(b(s.people.length ? 'Continue' : 'Skip for now', { act: 'g:next', kind: s.people.length ? 'primary' : 'secondary', icon: 'arrow' }), { first: true }) + '</section>';
    }
    if (st.type === 'category') {
      var c = sel.cat(st.module, st.cat), items = sel.items(st.module).filter(function (it) { return it.cat === st.cat; }), ans = s.guided.answers[st.id];
      if (G.formOpen && UI.form) {
        var f = UI.form;
        return '<section class="v-card v-qcard"><p class="v-eyebrow" style="color:var(--gold-ink)">' + ic(c.icon, 18) + esc(c.label) + '</p><h2 class="v-q" style="font-size:2rem">Tell us a little about it.</h2>' + fieldsHTML(f) +
          '<div class="v-endbar">' + b('Cancel', { act: 'g:formcancel', kind: 'text' }) + '<span id="v-save-status">' + VC.draftStatus({ status: f.status, savedAt: f.savedAt, saveFailed: sel.saveFailed() }) + '</span><div class="v-push">' + b('Save', { act: 'g:formsave', kind: 'primary', iconLeft: 'check' }) + '</div></div></section>';
      }
      var added = items.length ? '<ul class="v-added">' + items.map(function (it) { return '<li>' + ic(it.status === 'draft' ? 'pen' : 'check', 20) + '<span>' + esc(sel.title(it)) + (sel.sub(it) ? '<small>' + esc(sel.sub(it)) + '</small>' : '') + '</span>' + (it.status === 'draft' ? VC.chip('draft', 'Draft') : '') + '</li>'; }).join('') + '</ul>' : '';
      var answers = items.length ? b('Add another', { act: 'g:yes', kind: 'secondary', iconLeft: 'plus' }) :
        '<div class="v-answers">' + b('Yes, add one', { act: 'g:yes', kind: 'primary' }) + b('No', { act: 'g:no', kind: 'secondary' }) + b('Skip for now', { act: 'g:skip', kind: 'text' }) + '</div>';
      var prev = !items.length && ans ? '<p class="v-muted">You answered “' + (ans === 'no' ? 'No' : 'Skip for now') + '” last time.</p>' : '';
      return '<section class="v-card v-qcard"><p class="v-eyebrow" style="color:var(--gold-ink)">' + ic(c.icon, 18) + esc(st.section === 'assets' ? 'Assets' : 'Obligations') + ' · ' + esc(c.label) + '</p><h2 class="v-q">' + esc(c.question) + '</h2>' + (c.qhint ? '<p class="v-qhint">' + esc(c.qhint) + '</p>' : '') +
        added + prev + answers + gNav(items.length ? b('Continue', { act: 'g:next', kind: 'primary', icon: 'arrow' }) : '') + '</section>';
    }
    if (st.type === 'release') {
      var un = sel.unassigned();
      if (!un.length) return '<section class="v-card v-qcard"><h2 class="v-q">When should this information be released?</h2><p class="v-qhint">Everything you added already has someone to receive it. You can change this anytime in Release Rules.</p>' + gNav(b('Continue', { act: 'g:next', kind: 'primary', icon: 'arrow' })) + '</section>';
      return '<section class="v-card v-qcard"><h2 class="v-q">When should this information be released?</h2><p class="v-qhint">This applies to the ' + un.length + ' item' + (un.length > 1 ? 's' : '') + ' you added without a recipient. You can set different people for each item later.</p>' +
        (G.error ? VC.banner('error', esc(G.error)) : '') + VC.triggerSelector({ value: G.trigger, act: 'g:trigger', legend: 'Release it', name: 'gtrigger' }) +
        VC.personSelector({ people: s.people, selected: G.people, query: UI.ps.query, adding: UI.ps.adding, addValues: UI.ps.values, addErrors: UI.ps.errors }) +
        gNav(b('Decide later', { act: 'g:next', kind: 'text' }) + b('Continue', { act: 'g:release', kind: 'primary', icon: 'arrow' })) + '</section>';
    }
    // review
    var skipped = steps.filter(function (x) { return x.type === 'category' && s.guided.answers[x.id] === 'skip' && !sel.items(x.module).some(function (it) { return it.cat === x.cat; }); });
    function grp(m, title) { return { title: title, rows: sel.items(m).map(function (it) { return [(sel.cat(m, it.cat) || {}).label, sel.title(it) + (it.status === 'draft' ? ' (draft)' : '')]; }), empty: 'Nothing added.', edit: { act: 'g:goto', attrs: { 'data-step': String(steps.findIndex(function (x) { return x.section === m; })) } } }; }
    var un2 = sel.unassigned();
    return '<section class="v-card v-qcard"><h2 class="v-q">Check what you’ve added.</h2><p class="v-qhint">You can change anything now or later.</p>' +
      VC.reviewSummary([
        { title: 'Trusted People', rows: s.people.map(function (p) { return [p.name, p.email]; }), empty: 'No one yet.', edit: { act: 'g:goto', attrs: { 'data-step': '0' } } },
        grp('assets', 'Assets'), grp('obligations', 'Obligations'),
        { title: 'Release', rows: [['Items with a recipient', String(sel.items().filter(function (it) { return (it.assignments || []).length; }).length)], ['Items without a recipient', String(un2.length)]], edit: { act: 'g:goto', attrs: { 'data-step': String(steps.length - 2) } } }
      ]) + (skipped.length ? VC.banner('pending', '<b>Skipped for now:</b> ' + esc(skipped.map(function (x) { return x.label; }).join(', ')) + '. You can add these anytime.') : '') +
      (sel.drafts().length ? VC.banner('pending', '<b>' + sel.drafts().length + ' draft' + (sel.drafts().length > 1 ? 's' : '') + '</b> still need finishing. Drafts aren’t released to anyone.') : '') +
      gNav(b('Finish guided setup', { act: 'g:finish', kind: 'primary', iconLeft: 'check' })) + '</section>';
  }

  /* Settings */
  SCREENS.settings = function () {
    ensurePricing();
    var s = sel.state();
    return { title: 'Vault settings', crumbs: [CR_VAULT, { label: 'Vault settings' }], active: 'settings', head: VC.head({ eyebrow: 'My Vault', eyeIcon: 'gear', title: 'Vault settings' }),
      body: '<div class="v-narrow v-stack"><section class="v-card"><div class="v-card-h"><h2>Subscription</h2>' + VC.chip('complete', 'Active') + '</div>' + priceBlock(true) +
        '<p class="v-muted">Started ' + esc(VC.fmtDate(s.subscribedAt)) + '.</p><div class="v-row-acts">' + b('Cancel My Vault', { act: 'sub:cancel', kind: 'danger' }) + '</div></section></div>' };
  };

  function notFound() {
    return { title: 'Page not found', crumbs: [CR_VAULT, { label: 'Not found' }], head: VC.head({ eyebrow: 'My Vault', title: 'We couldn’t find that page' }),
      body: VC.errorState({ title: 'This page doesn’t exist', text: 'The link may be out of date. Your Vault is safe.', actions: b('Go to My Vault', { href: '#/overview', kind: 'primary' }) }) };
  }

  SCREENS.assets = function (r) { return r.path[1] ? itemFormScreen('assets')(r) : moduleScreen('assets')(r); };
  SCREENS.obligations = function (r) { return r.path[1] ? itemFormScreen('obligations')(r) : moduleScreen('obligations')(r); };
  SCREENS.sealed = function (r) { return r.path[1] ? itemFormScreen('sealed')(r) : moduleScreen('sealed')(r); };
  SCREENS.final = function (r) { return r.path[1] ? itemFormScreen('final')(r) : moduleScreen('final')(r); };

  /* ================= INTERACTIONS ================= */
  function toast(msg) {
    var old = document.querySelector('.v-toast'); if (old) old.remove();
    var t = document.createElement('div'); t.className = 'v-toast'; t.setAttribute('role', 'status'); t.innerHTML = ic('check', 20) + esc(msg);
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3200);
  }
  function openDialog(o, handlers) {
    var host = document.getElementById('dlg-root'); host.innerHTML = VC.dialog(o); dlgHandlers = handlers || {};
    var d = host.querySelector('dialog'); d.addEventListener('close', function () { host.innerHTML = ''; }); d.showModal();
  }
  function closeDialog() { var d = document.querySelector('#dlg-root dialog'); if (d) d.close(); }

  function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || '').trim()); }

  /* Save a person from any form, with duplicate and multi-item checks. done(id) runs after saving. */
  function savePersonFlow(values, id, done, dupOk) {
    var dup = !dupOk && sel.findDuplicate(values, id);
    if (dup) {
      openDialog({ icon: 'people', title: 'Is this the same person?', body: '<p>You already have <b>' + esc(dup.name) + '</b>' + (dup.email ? ' (' + esc(dup.email) + ')' : '') + ' in your Trusted People.</p><p class="v-muted">Using the existing person avoids sending their information to two records.</p>',
        actions: [{ label: 'Save as a new person', act: 'd:new', kind: 'secondary' }, { label: 'Use ' + dup.name.split(' ')[0], act: 'd:use', kind: 'primary' }] },
        { 'd:use': function () { done(dup.id, true); }, 'd:new': function () { savePersonFlow(values, id, done, true); } });
      return;
    }
    var prev = id && sel.person(id), n = id ? sel.itemsFor(id).length : 0;
    if (prev && n > 1 && (prev.name !== values.name.trim() || prev.email !== values.email.trim())) {
      openDialog({ icon: 'info', title: 'Update ' + prev.name.split(' ')[0] + '’s details?', body: '<p>' + esc(prev.name) + ' receives ' + n + ' items. The new details will be used for all of them.</p><p class="v-muted">Who receives what, and when, stays the same.</p>',
        actions: [{ label: 'Cancel', act: 'd:cancel', kind: 'secondary' }, { label: 'Update details', act: 'd:ok', kind: 'primary' }] },
        { 'd:ok': function () { done(act.savePerson(Object.assign({ id: id }, values))); } });
      return;
    }
    done(act.savePerson(Object.assign({ id: id }, values)));
  }

  function formGoStep(n) { var f = UI.form; f.step = n; f.errors = {}; render(); var h = root.querySelector('.v-formcard'); if (h) { h.scrollIntoView({ block: 'start' }); } }
  function formNext() {
    var f = UI.form;
    if (f.step === 0) { if (!f.cat) { f.errors = { cat: 'Choose a type to continue.' }; return render(); } return formGoStep(1); }
    if (f.step === 1) { f.errors = validateDetails(f); if (Object.keys(f.errors).length) { render(); var first = root.querySelector('[aria-invalid="true"]'); if (first) first.focus(); return; } return formGoStep(2); }
    if (f.step === 2) { if (f.people.length && !f.trigger && !f.mixed) { f.errors = { trigger: 'Choose when it should be released, or remove the people for now.' }; return render(); } return formGoStep(3); }
  }
  function formSave(another) {
    var f = UI.form, m = f.module, x = C.modules[m];
    var errs = validateDetails(f); if (Object.keys(errs).length) { f.errors = errs; return formGoStep(1); }
    f.id = act.saveItem({ id: f.id, module: m, cat: f.cat, values: f.values, status: 'complete', assignments: assignmentsOf(f), via: f.via });
    toast(x.noun.charAt(0).toUpperCase() + x.noun.slice(1) + ' saved');
    lastRouteKey = '';   // forces a fresh form even when the address stays the same
    go(another ? '#/' + m + '/new?cat=' + f.cat : '#/' + m);
  }

  function guidedGo(i) { var steps = sel.guidedSteps(); i = Math.max(0, Math.min(steps.length - 1, i)); UI.guided.formOpen = false; UI.guided.error = ''; UI.ps.adding = false; act.guidedGo(i); render(); window.scrollTo(0, 0); var q = root.querySelector('.v-q'); if (q) { q.setAttribute('tabindex', '-1'); q.focus({ preventScroll: true }); } }

  var ACTIONS = {
    'noop': function () {},
    'save:retry': function () { act.retrySave(); rerender(); if (!sel.saveFailed()) toast('All changes saved'); },
    'price:retry': function () { UI.pricing = { status: 'idle', data: null }; render(); },
    'sub:open': function () { var ret = UI.returnTo && UI.returnTo.indexOf('discover') < 0 && UI.returnTo !== '#/' ? UI.returnTo : '#/overview'; UI.sub.done = false; UI.returnTo = ''; go(ret); },
    'sub:cancel': function () {
      openDialog({ icon: 'alert', tone: 'warn', title: 'Cancel My Vault?', body: '<p>You’ll keep access until the end of this billing period.</p>' + VC.flag('Not decided yet: what happens to stored information after cancelling, and for how long it is kept.'),
        actions: [{ label: 'Keep My Vault', act: 'd:keep', kind: 'primary' }, { label: 'Cancel My Vault', act: 'd:cancelsub', kind: 'dangerfill' }] },
        { 'd:cancelsub': function () { act.cancel(); UI.flash = { kind: 'info', text: 'My Vault is cancelled. You can start it again anytime.' }; go('#/discover'); } });
    },
    /* form */
    'form:back': function () { formGoStep(Math.max(0, UI.form.step - 1)); },
    'form:next': formNext,
    'form:step': function (el) { formGoStep(+el.getAttribute('data-step')); },
    'form:draft': function () { var f = UI.form; if (!f.cat) return; if (!hasContent(f)) { f.errors = { __: 1 }; toast('Add at least one detail first'); return; } persistDraft(); toast('Draft saved. Finish it anytime.'); go('#/' + f.module); },
    'form:save': function () { formSave(false); },
    'form:saveanother': function () { formSave(true); },
    'form:delete': function () {
      var f = UI.form, x = C.modules[f.module];
      openDialog({ icon: 'trash', tone: 'warn', title: 'Delete this ' + x.noun + '?', body: '<p>“' + esc(sel.title({ module: f.module, cat: f.cat, values: f.values })) + '” will be removed from your Vault. This can’t be undone.</p>',
        actions: [{ label: 'Keep it', act: 'd:keep', kind: 'secondary' }, { label: 'Delete', act: 'd:del', kind: 'dangerfill' }] },
        { 'd:del': function () { act.deleteItem(f.id); toast('Deleted'); go('#/' + f.module); } });
    },
    /* person selector (inside item form, guided) */
    'ps:add': function () { UI.ps.adding = true; UI.ps.values = {}; UI.ps.errors = {}; render(); var el = document.getElementById('f-__pn'); if (el) el.focus(); },
    'ps:cancel': function () { UI.ps.adding = false; render(); },
    'ps:save': function () {
      var v = UI.ps.values, e = {};
      if (!String(v.name || '').trim()) e.name = 'Please enter their name.';
      if (!validEmail(v.email)) e.email = 'Enter an email like name@example.com.';
      UI.ps.errors = e; if (Object.keys(e).length) return render();
      savePersonFlow({ name: v.name, email: v.email, relationship: '' }, null, function (id) {
        UI.ps.adding = false; UI.ps.values = {};
        var list = UI.form && !UI.guided.formOpen && location.hash.indexOf('guided') < 0 ? UI.form.people : UI.guided.people;
        if (list.indexOf(id) < 0) list.push(id);
        toast('Trusted person added'); render();
      });
    },
    /* person form */
    'person:delete': function () {
      var P = UI.person, p = sel.person(P.id), n = sel.itemsFor(P.id).length;
      openDialog({ icon: 'trash', tone: 'warn', title: 'Remove ' + p.name + '?', body: n ? '<p>' + esc(p.name) + ' receives ' + n + ' item' + (n > 1 ? 's' : '') + '. If you remove them, those items won’t go to them.</p><p class="v-muted">You’ll be asked to review your release rules.</p>' : '<p>They don’t receive anything yet.</p>',
        actions: [{ label: 'Keep', act: 'd:keep', kind: 'secondary' }, { label: 'Remove', act: 'd:rm', kind: 'dangerfill' }] },
        { 'd:rm': function () { act.deletePerson(P.id); toast('Removed'); go('#/people'); } });
    },
    /* release */
    'rel:save': function () {
      var R = UI.rel, missing = R.on.filter(function (id) { return !R.map[id]; });
      if (missing.length) { R.error = 'Choose when each selected item should be released.'; return render(); }
      var map = {}; Object.keys(R.map).forEach(function (id) { map[id] = R.on.indexOf(id) >= 0 ? R.map[id] : null; });
      act.setPersonItems(R.pid, map); UI.flash = { kind: 'pending', text: 'Saved as a draft. Review and confirm your release rules when you’re ready.' }; go('#/release');
    },
    'rel:confirm': function () { act.confirmRelease(); UI.flash = { kind: 'ok', text: 'Release rules confirmed.' }; go('#/release'); },
    /* guided */
    'g:start': function () { act.guidedStart(); UI.guided.resumeAck = true; render(); },
    'g:resume': function () { UI.guided.resumeAck = true; render(); },
    'g:restart': function () { act.guidedRestart(); UI.guided.resumeAck = true; render(); },
    'g:exit': function () { if (UI.guided.formOpen) persistDraft(); act.guidedSaveExit(); UI.guided.formOpen = false; UI.flash = { kind: 'saved', text: 'Your progress is saved. Continue anytime from where you left off.' }; go('#/overview'); },
    'g:back': function () { guidedGo(sel.state().guided.step - 1); },
    'g:next': function () { guidedGo(sel.state().guided.step + 1); },
    'g:goto': function (el) { guidedGo(+el.getAttribute('data-step')); },
    'g:no': function () { var st = sel.guidedSteps()[sel.state().guided.step]; act.guidedAnswer(st.id, 'no'); guidedGo(sel.state().guided.step + 1); },
    'g:skip': function () { var st = sel.guidedSteps()[sel.state().guided.step]; act.guidedAnswer(st.id, 'skip'); guidedGo(sel.state().guided.step + 1); },
    'g:yes': function () {
      var st = sel.guidedSteps()[sel.state().guided.step]; act.guidedAnswer(st.id, 'yes');
      UI.form = { module: st.module, id: null, isNew: true, cat: st.cat, values: {}, people: [], trigger: '', status: 'new', errors: {}, step: 1, via: 'guided', guided: true };
      UI.guided.formOpen = true; render(); var el = root.querySelector('.v-qcard input, .v-qcard textarea'); if (el) el.focus();
    },
    'g:formcancel': function () { UI.guided.formOpen = false; render(); },
    'g:formsave': function () {
      var f = UI.form; f.errors = validateDetails(f);
      if (Object.keys(f.errors).length) { render(); var first = root.querySelector('[aria-invalid="true"]'); if (first) first.focus(); return; }
      act.saveItem({ id: f.id, module: f.module, cat: f.cat, values: f.values, status: 'complete', assignments: [], via: 'guided' });
      UI.guided.formOpen = false; toast('Added'); render();
    },
    'g:release': function () {
      var G = UI.guided;
      if (!G.trigger || !G.people.length) { G.error = !G.trigger ? 'Choose when it should be released, or pick “Decide later”.' : 'Choose at least one person, or pick “Decide later”.'; return render(); }
      act.assignAll(sel.unassigned().map(function (i) { return i.id; }), G.people.slice(), G.trigger); G.error = ''; guidedGo(sel.state().guided.step + 1);
    },
    'g:finish': function () { act.guidedComplete(); UI.guided.justCompleted = true; render(); }
  };

  function onClick(e) {
    var soon = e.target.closest('[data-soon]');
    if (soon) { e.preventDefault(); toast(soon.getAttribute('data-soon') + ' isn’t part of this prototype yet'); return; }
    var el = e.target.closest('[data-act]');
    if (!el || el.tagName === 'INPUT') return;
    var a = el.getAttribute('data-act');
    if (a.indexOf('d:') === 0) { e.preventDefault(); var h = dlgHandlers[a]; closeDialog(); if (h) h(); return; }
    if (ACTIONS[a]) { e.preventDefault(); ACTIONS[a](el); }
  }
  function onChange(e) {
    var el = e.target, a = el.getAttribute('data-act');
    if (a === 'form:cat') { UI.form.cat = el.value; UI.form.errors = {}; return rerender(); }
    if (a === 'ps:toggle') {
      var list = UI.form && location.hash.indexOf('guided') < 0 ? UI.form.people : UI.guided.people, id = el.getAttribute('data-id'), i = list.indexOf(id);
      if (el.checked && i < 0) list.push(id); if (!el.checked && i >= 0) list.splice(i, 1);
      if (UI.form) UI.form.dirty = true; return rerender();
    }
    if (a === 'trigger') { UI.form.trigger = el.value; UI.form.errors = {}; UI.form.dirty = true; return rerender(); }
    if (a === 'g:trigger') { UI.guided.trigger = el.value; UI.guided.error = ''; return rerender(); }
    if (a === 'rel:toggle') { var R = UI.rel, idx = R.on.indexOf(el.getAttribute('data-id')); if (el.checked && idx < 0) R.on.push(el.getAttribute('data-id')); if (!el.checked && idx >= 0) R.on.splice(idx, 1); R.error = ''; return rerender(); }
    if (a === 'rel:trig') { UI.rel.map[el.getAttribute('data-id')] = el.value; UI.rel.error = ''; return rerender(); }
    var k = el.getAttribute('data-field');
    if (k && el.type === 'file') { setField(k, Array.prototype.map.call(el.files, function (f) { return f.name; })); return rerender(); }
    if (k && (el.type === 'radio' || el.tagName === 'SELECT')) { setField(k, el.value); return rerender(); }
    // demo panel
    if (el.id === 'demo-seed' && el.value) { act.seed(el.value); resetUI(); lastRouteKey = '__'; go(el.value === 'none' ? '#/discover' : '#/overview'); }
    if (el.id === 'demo-fprice') { API.fail.pricing = el.checked; UI.pricing = { status: 'idle', data: null }; render(); }
    if (el.id === 'demo-fpay') { API.fail.payment = el.checked; }
    if (el.id === 'demo-fsave') { V.flags.saveError = el.checked; }
  }
  function onInput(e) {
    var el = e.target, k = el.getAttribute('data-field');
    if (!k || el.type === 'radio' || el.type === 'file' || el.tagName === 'SELECT') return;
    if (k === '__psq') { UI.ps.query = el.value; return rerender(); }
    setField(k, el.value, true);
  }
  function setField(k, val, typing) {
    if (k === '__pn' || k === '__pe') { UI.ps.values[k === '__pn' ? 'name' : 'email'] = val; return; }
    var p = location.hash;
    if (p.indexOf('#/subscribe') === 0) { UI.sub.values[k] = val; if (UI.sub.errors[k]) { delete UI.sub.errors[k]; } return; }
    if (p.indexOf('#/people/') === 0 && UI.person) { UI.person.values[k] = val; return; }
    if (UI.form) {
      UI.form.values[k] = val; UI.form.dirty = true; if (UI.form.errors[k]) delete UI.form.errors[k];
      if (UI.form.isNew || UI.form.status === 'draft') { clearTimeout(saveTimer); saveTimer = setTimeout(persistDraft, typing ? 900 : 50); }
      else { var st = document.getElementById('v-save-status'); if (st) st.innerHTML = VC.draftStatus({ dirty: true }); }
    }
  }
  function onSubmit(e) {
    var form = e.target;
    if (form.id === 'payform') {
      e.preventDefault();
      var v = UI.sub.values, er = {};
      if (!String(v.name || '').trim()) er.name = 'Enter the name on the card.';
      if (String(v.card || '').replace(/\D/g, '').length < 12) er.card = 'Enter the full card number.';
      if (!/^\s*\d{2}\s*\/\s*\d{2}\s*$/.test(v.exp || '')) er.exp = 'Use the format MM / YY.';
      if (!/^\d{3,4}$/.test(String(v.cvc || '').trim())) er.cvc = 'Enter the 3 or 4 digits.';
      UI.sub.errors = er; UI.sub.error = '';
      if (Object.keys(er).length) { render(); var f1 = root.querySelector('[aria-invalid="true"]'); if (f1) f1.focus(); return; }
      UI.sub.busy = true; render();
      API.startSubscription({ productId: 'vault' }).then(function () { UI.sub.busy = false; UI.sub.done = true; act.subscribe(); render(); })
        .catch(function () { UI.sub.busy = false; UI.sub.error = 'Your payment didn’t go through, and nothing was charged. Check the card details and try again.'; render(); });
    }
    if (form.id === 'personform') {
      e.preventDefault();
      var P = UI.person, pv = P.values, pe = {};
      if (!String(pv.name || '').trim()) pe.name = 'Please enter their full name.';
      if (!validEmail(pv.email)) pe.email = 'Enter an email like name@example.com.';
      P.errors = pe; if (Object.keys(pe).length) { render(); var f2 = root.querySelector('[aria-invalid="true"]'); if (f2) f2.focus(); return; }
      savePersonFlow({ name: pv.name, email: pv.email, relationship: pv.relationship || '' }, P.id, function (id, used) { toast(used ? 'Using the existing person' : 'Saved'); go(P.ret || '#/people'); });
    }
  }
  function resetUI() {
    UI.form = UI.person = UI.rel = null; UI.ps = { query: '', adding: false, values: {}, errors: {} };
    UI.guided = { formOpen: false, trigger: '', people: [], error: '', resumeAck: false, justCompleted: false }; UI.sub = { busy: false, error: '', done: false, values: {}, errors: {} };
  }

  /* ---------- boot ---------- */
  function boot() {
    MW.sprite();
    root = document.getElementById('vault-root');
    document.addEventListener('click', onClick);
    document.addEventListener('change', onChange);
    document.addEventListener('input', onInput);
    document.addEventListener('submit', onSubmit);
    document.addEventListener('click', function (e) { if (e.target.id === 'demo-loading') { showLoading(); } });
    window.addEventListener('hashchange', render);
    V.subscribe(function () { /* store changed: sidebar badges and save banner refresh on next render */ });
    showLoading();
  }
  function showLoading() {
    renderShell('overview', [CR_VAULT]);
    root.innerHTML = VC.loadingPage();
    API.loadVault().then(function () { lastRouteKey = '__'; render(); }).catch(function () {
      root.innerHTML = '<div class="v-wrap v-body">' + VC.errorState({ title: 'We couldn’t open your Vault', text: 'Your information is safe. Check your connection and try again.', actions: b('Try again', { act: 'noop', kind: 'primary', attrs: { onclick: 'location.reload()' } }) }) + '</div>';
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
