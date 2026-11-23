/* My Vault state: data, actions and selectors. No DOM code here.
   BACKEND: persistence uses localStorage in the prototype. Swap persist()/load() for the Vault API. */
(function () {
  'use strict';
  var C = window.MW_CONFIG;
  var KEY = 'mw.vault.v1';
  var listeners = [];
  var flags = { saveError: false };
  var status = { saveFailed: false };

  function now() { return new Date().toISOString(); }
  function uid(p) { return p + '_' + Math.random().toString(36).slice(2, 9); }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function blank() {
    return { v: 1, subscribed: false, subscribedAt: null, people: [], items: [],
      guided: { status: 'not_started', step: 0, answers: {}, lastSavedAt: null, completedAt: null },
      release: { reviewedAt: null, changedAt: null }, lastSavedAt: null };
  }
  function load() {
    try { var raw = localStorage.getItem(KEY); if (raw) { var s = JSON.parse(raw); if (s && s.v === 1) return Object.assign(blank(), s); } } catch (e) { /* storage blocked */ }
    return blank();
  }
  var S = load();

  function emit() { listeners.forEach(function (f) { f(); }); }
  function persist() {
    if (flags.saveError) throw new Error('save_failed');
    S.lastSavedAt = now();
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* private mode: keep in memory */ }
  }
  // Apply a change, then save. If saving fails the change stays on this page and can be retried.
  function commit(mutate) {
    mutate(S);
    try { persist(); status.saveFailed = false; } catch (e) { status.saveFailed = true; }
    emit();
  }

  /* ---------- helpers ---------- */
  function cat(module, id) { var m = C.modules[module]; return m && m.cats.filter(function (c) { return c.id === id; })[0]; }
  function itemTitle(it) { var c = cat(it.module, it.cat); var t = c && c.title(it.values || {}); return t || (c ? c.label : 'Untitled'); }
  function itemSub(it) { var c = cat(it.module, it.cat); return (c && c.sub(it.values || {})) || ''; }
  function triggerLabel(id, short) { var t = C.triggers.filter(function (x) { return x.id === id; })[0]; return t ? (short ? t.short : t.label) : ''; }
  function normName(n) { return String(n || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z؀-ۿ ]/g, '').replace(/\s+/g, ' ').trim(); }
  function lev(a, b) {
    var m = a.length, n = b.length, d = [], i, j;
    for (i = 0; i <= m; i++) { d[i] = [i]; }
    for (j = 1; j <= n; j++) { d[0][j] = j; }
    for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  }

  /* ---------- guided setup steps (derived from config) ---------- */
  function guidedSteps() {
    var steps = [{ id: 'people', section: 'people', type: 'people', label: 'Trusted People' }];
    C.modules.assets.cats.forEach(function (c) { steps.push({ id: 'assets:' + c.id, section: 'assets', type: 'category', module: 'assets', cat: c.id, label: c.label }); });
    C.modules.obligations.cats.forEach(function (c) { steps.push({ id: 'obligations:' + c.id, section: 'obligations', type: 'category', module: 'obligations', cat: c.id, label: c.label }); });
    steps.push({ id: 'release', section: 'release', type: 'release', label: 'Release' });
    steps.push({ id: 'review', section: 'review', type: 'review', label: 'Review' });
    return steps;
  }
  var SECTIONS = [
    { id: 'people', label: 'People' }, { id: 'assets', label: 'Assets' }, { id: 'obligations', label: 'Obligations' },
    { id: 'release', label: 'Release' }, { id: 'review', label: 'Review' }
  ];

  /* ---------- selectors ---------- */
  var sel = {
    state: function () { return S; },
    saveFailed: function () { return status.saveFailed; },
    items: function (module) { return S.items.filter(function (i) { return !module || i.module === module; }); },
    item: function (id) { return S.items.filter(function (i) { return i.id === id; })[0]; },
    person: function (id) { return S.people.filter(function (p) { return p.id === id; })[0]; },
    drafts: function () { return S.items.filter(function (i) { return i.status === 'draft'; }); },
    unassigned: function () { return S.items.filter(function (i) { return i.status === 'complete' && !(i.assignments || []).length; }); },
    itemsFor: function (personId) { return S.items.filter(function (i) { return (i.assignments || []).some(function (a) { return a.personId === personId; }); }); },
    assignment: function (item, personId) { return (item.assignments || []).filter(function (a) { return a.personId === personId; })[0]; },
    moduleSummary: function (m) { var it = sel.items(m); return { count: it.length, drafts: it.filter(function (i) { return i.status === 'draft'; }).length }; },
    triggerCounts: function () {
      var out = {}; C.triggers.forEach(function (t) { out[t.id] = 0; });
      S.items.forEach(function (i) { var seen = {}; (i.assignments || []).forEach(function (a) { if (!seen[a.trigger]) { out[a.trigger] = (out[a.trigger] || 0) + 1; seen[a.trigger] = 1; } }); });
      return out;
    },
    releaseNeedsReview: function () { var r = S.release; return !!r.changedAt && (!r.reviewedAt || r.changedAt > r.reviewedAt); },
    guidedSteps: guidedSteps,
    sections: SECTIONS,
    title: itemTitle,
    sub: itemSub,
    cat: cat,
    triggerLabel: triggerLabel,
    findDuplicate: function (p, exceptId) {
      var n = normName(p.name), e = String(p.email || '').trim().toLowerCase();
      return S.people.filter(function (x) {
        if (x.id === exceptId) return false;
        var xn = normName(x.name), xe = String(x.email || '').trim().toLowerCase();
        if (e && xe && e === xe) return true;
        if (n && xn && (n === xn || (n.length > 4 && lev(n, xn) <= 2))) return true;
        return false;
      })[0] || null;
    },

    /* The single most useful next step. Home uses this too. */
    nextAction: function () {
      var steps = guidedSteps(), g = S.guided, drafts = sel.drafts(), un = sel.unassigned();
      if (!S.subscribed) return { kind: 'discover', title: 'Keep the rest of your estate organized.', cta: 'See how it works', href: 'vault.html#/discover' };
      if (g.status === 'in_progress') {
        var st = steps[Math.min(g.step, steps.length - 1)];
        return { kind: 'resume', label: 'Guided setup · paused', title: 'Pick up where you left off.', text: 'Next: ' + st.label + '.', cta: 'Continue guided setup', href: '#/guided', secondary: { label: 'Add something manually', href: '#/add' } };
      }
      if (!S.items.length && g.status === 'not_started') return { kind: 'start', label: 'Getting started', title: 'Set up your Vault step by step', text: 'We’ll help you remember the important information your family may need.', cta: 'Start guided setup', href: '#/guided', secondary: { label: 'Add something manually', href: '#/add' } };
      if (drafts.length) {
        var d = drafts[0];
        return { kind: 'draft', label: drafts.length === 1 ? '1 draft' : drafts.length + ' drafts', title: drafts.length === 1 ? 'Finish your draft.' : 'Finish your ' + drafts.length + ' drafts.', text: 'Next: ' + itemTitle(d) + '. Drafts aren’t released to anyone.', cta: 'Finish draft', href: '#/' + d.module + '/' + d.id };
      }
      if (!S.people.length) return { kind: 'people', label: 'Trusted People', title: 'Add a trusted person.', text: 'Choose who should receive your information when the time comes.', cta: 'Add a trusted person', href: '#/people/new' };
      if (un.length) return { kind: 'assign', label: 'Release Rules', title: un.length === 1 ? 'Choose who receives 1 item.' : 'Choose who receives ' + un.length + ' items.', text: 'Items without a recipient won’t be released to anyone.', cta: 'Assign recipients', href: '#/release' };
      if (sel.releaseNeedsReview()) return { kind: 'review', label: 'Release Rules', title: 'Review your release rules.', text: 'You changed who receives what. Check it and save.', cta: 'Review release rules', href: '#/release/review' };
      return { kind: 'done', label: 'Up to date', title: 'Your Vault is up to date.', text: 'Review it when life changes, like a new account or a new child.', cta: 'Add something', href: '#/add', quiet: true };
    }
  };

  /* ---------- actions ---------- */
  var act = {
    subscribe: function () { commit(function (s) { s.subscribed = true; s.subscribedAt = now(); }); },
    cancel: function () { commit(function (s) { s.subscribed = false; }); },
    retrySave: function () { commit(function () {}); },

    savePerson: function (p) {
      var id = p.id || uid('p');
      commit(function (s) {
        var rec = { id: id, name: String(p.name).trim(), email: String(p.email || '').trim(), relationship: p.relationship || '', updatedAt: now() };
        var i = s.people.findIndex(function (x) { return x.id === id; });
        if (i >= 0) s.people[i] = Object.assign({}, s.people[i], rec); else s.people.push(Object.assign(rec, { createdAt: now() }));
      });
      return id;
    },
    deletePerson: function (id) {
      commit(function (s) {
        s.people = s.people.filter(function (p) { return p.id !== id; });
        var touched = false;
        s.items.forEach(function (i) { var before = (i.assignments || []).length; i.assignments = (i.assignments || []).filter(function (a) { return a.personId !== id; }); if (i.assignments.length !== before) touched = true; });
        if (touched) s.release.changedAt = now();
      });
    },

    saveItem: function (it) {
      var id = it.id || uid('i');
      commit(function (s) {
        var i = s.items.findIndex(function (x) { return x.id === id; });
        var prev = i >= 0 ? s.items[i] : null;
        var rec = { id: id, module: it.module, cat: it.cat, values: clone(it.values || {}), status: it.status || 'complete', assignments: clone(it.assignments || []), via: it.via || (prev && prev.via) || 'manual', updatedAt: now() };
        if (prev && JSON.stringify(prev.assignments || []) !== JSON.stringify(rec.assignments)) s.release.changedAt = now();
        if (!prev && rec.assignments.length) s.release.changedAt = now();
        if (i >= 0) s.items[i] = Object.assign({}, prev, rec); else s.items.push(Object.assign(rec, { createdAt: now() }));
      });
      return id;
    },
    deleteItem: function (id) { commit(function (s) { s.items = s.items.filter(function (i) { return i.id !== id; }); }); },

    // map: { itemId: triggerId | null }
    setPersonItems: function (personId, map) {
      commit(function (s) {
        s.items.forEach(function (i) {
          if (!(i.id in map)) return;
          var rest = (i.assignments || []).filter(function (a) { return a.personId !== personId; });
          if (map[i.id]) rest.push({ personId: personId, trigger: map[i.id] });
          i.assignments = rest;
        });
        s.release.changedAt = now();
      });
    },
    assignAll: function (itemIds, personIds, trigger) {
      commit(function (s) {
        s.items.forEach(function (i) {
          if (itemIds.indexOf(i.id) < 0) return;
          var keep = (i.assignments || []).filter(function (a) { return personIds.indexOf(a.personId) < 0; });
          personIds.forEach(function (pid) { keep.push({ personId: pid, trigger: trigger }); });
          i.assignments = keep;
        });
        s.release.changedAt = now();
      });
    },
    confirmRelease: function () { commit(function (s) { s.release.reviewedAt = now(); if (!s.release.changedAt) s.release.changedAt = s.release.reviewedAt; }); },

    guidedStart: function () { commit(function (s) { s.guided.status = 'in_progress'; s.guided.step = 0; s.guided.lastSavedAt = now(); }); },
    guidedGo: function (i) { commit(function (s) { s.guided.step = i; s.guided.lastSavedAt = now(); if (s.guided.status === 'not_started') s.guided.status = 'in_progress'; }); },
    guidedAnswer: function (stepId, val) { commit(function (s) { s.guided.answers[stepId] = val; s.guided.lastSavedAt = now(); }); },
    guidedSaveExit: function () { commit(function (s) { s.guided.lastSavedAt = now(); }); },
    guidedComplete: function () { commit(function (s) { s.guided.status = 'completed'; s.guided.completedAt = now(); s.guided.lastSavedAt = now(); }); },
    guidedRestart: function () { commit(function (s) { s.guided.status = 'in_progress'; s.guided.step = 0; s.guided.lastSavedAt = now(); }); },

    reset: function () { S = blank(); commit(function () {}); },
    seed: function (name) {
      var s = blank();
      var hoursAgo = function (h) { return new Date(Date.now() - h * 3600e3).toISOString(); };
      if (name !== 'none') { s.subscribed = true; s.subscribedAt = hoursAgo(240); }
      if (name === 'progress' || name === 'done') {
        s.people = [
          { id: 'p_sara', name: 'Sara Haddad', email: 'sara.haddad@example.com', relationship: 'Daughter', createdAt: hoursAgo(200) },
          { id: 'p_omar', name: 'Omar Haddad', email: 'omar.haddad@example.com', relationship: 'Brother', createdAt: hoursAgo(200) }
        ];
        s.items = [
          { id: 'i_bank', module: 'assets', cat: 'bank', status: 'complete', via: 'guided', values: { institution: 'RBC', accountType: 'Chequing', location: 'In Canada', value: '18000', value_cur: 'CAD', where: 'Statements in my email' }, assignments: [{ personId: 'p_sara', trigger: 'either' }] },
          { id: 'i_bank2', module: 'assets', cat: 'bank', status: 'complete', via: 'guided', values: { institution: 'Banque Misr', accountType: 'Savings', location: 'In another country', country: 'Egypt', value: '250000', value_cur: 'EGP' }, assignments: [{ personId: 'p_sara', trigger: 'death' }, { personId: 'p_omar', trigger: 'death' }] },
          { id: 'i_home', module: 'assets', cat: 'property', status: name === 'done' ? 'complete' : 'draft', via: 'guided', values: { description: 'Family home', location: 'In Canada', place: 'Mississauga', ownership: 'Jointly', value: '950000', value_cur: 'CAD' }, assignments: name === 'done' ? [{ personId: 'p_sara', trigger: 'death' }] : [] },
          { id: 'i_loan', module: 'obligations', cat: 'loan', status: 'complete', via: 'guided', values: { lender: 'TD Bank', kind: 'Car loan', value: '9400', value_cur: 'CAD' }, assignments: name === 'done' ? [{ personId: 'p_omar', trigger: 'either' }] : [] }
        ];
        if (name === 'done') {
          s.items.push({ id: 'i_zakat', module: 'obligations', cat: 'zakat', status: 'complete', via: 'manual', values: { year: '1446 AH', value: '1200', value_cur: 'CAD' }, assignments: [{ personId: 'p_omar', trigger: 'death' }] });
          s.items.push({ id: 'i_msg', module: 'final', cat: 'message', status: 'complete', via: 'manual', values: { title: 'To my children', body: 'Look after each other.' }, assignments: [{ personId: 'p_sara', trigger: 'death' }] });
          s.guided = { status: 'completed', step: 0, answers: {}, lastSavedAt: hoursAgo(30), completedAt: hoursAgo(30) };
          s.release = { changedAt: hoursAgo(31), reviewedAt: hoursAgo(30) };
        } else {
          s.guided = { status: 'in_progress', step: 11, answers: { 'assets:pension': 'no', 'assets:investment': 'skip' }, lastSavedAt: hoursAgo(26), completedAt: null };
          s.release = { changedAt: hoursAgo(26), reviewedAt: null };
        }
        s.items.forEach(function (i) { i.createdAt = i.updatedAt = hoursAgo(26); });
      }
      S = s;
      commit(function () {});
    }
  };

  window.VaultStore = {
    sel: sel, act: act, flags: flags, uid: uid,
    subscribe: function (f) { listeners.push(f); return function () { listeners = listeners.filter(function (x) { return x !== f; }); }; }
  };
})();
