/* My Vault presentation components. Pure functions: data in, HTML string out. No state, no storage. */
(function () {
  'use strict';
  var ic = MW.ic, esc = MW.esc, C = window.MW_CONFIG;

  function attrs(o) { if (!o) return ''; return Object.keys(o).map(function (k) { return o[k] === true ? ' ' + k : (o[k] === false || o[k] == null) ? '' : ' ' + k + '="' + esc(o[k]) + '"'; }).join(''); }

  function fmtTime(iso) {
    if (!iso) return '';
    var d = new Date(iso), n = new Date();
    var t = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (d.toDateString() === n.toDateString()) return 'today at ' + t;
    var y = new Date(n); y.setDate(n.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return 'yesterday at ' + t;
    return d.toLocaleDateString('en-CA', { day: 'numeric', month: 'short', year: d.getFullYear() === n.getFullYear() ? undefined : 'numeric' }) + ' at ' + t;
  }
  function fmtDate(iso) { return iso ? new Date(iso).toLocaleDateString('en-CA', { day: 'numeric', month: 'long', year: 'numeric' }) : ''; }
  function fmtPrice(p) { if (!p) return ''; return '$' + Number(p.price).toFixed(2) + ' ' + p.currency + ' / ' + p.interval; }

  /* Button or link. kind: primary | secondary | quiet | danger | onnavy | text */
  function btn(label, o) {
    o = o || {};
    var cls = 'v-btn v-btn--' + (o.kind || 'primary') + (o.size ? ' v-btn--' + o.size : '') + (o.block ? ' v-btn--block' : '');
    var inner = (o.iconLeft ? ic(o.iconLeft, 20) : '') + '<span>' + esc(label) + '</span>' + (o.icon ? ic(o.icon, 20) : '');
    var a = Object.assign({}, o.attrs || {});
    if (o.act) a['data-act'] = o.act;
    if (o.href) return '<a class="' + cls + '" href="' + esc(o.href) + '"' + attrs(a) + '>' + inner + '</a>';
    return '<button class="' + cls + '" type="' + (o.submit ? 'submit' : 'button') + '"' + (o.disabled ? ' disabled' : '') + (o.busy ? ' aria-busy="true"' : '') + attrs(a) + '>' + (o.busy ? '<span class="v-spin" aria-hidden="true"></span>' : '') + inner + '</button>';
  }

  /* Status chip: always icon + word. kind: draft | complete | pending | none | warn | locked | current | info */
  var CHIP_ICON = { draft: 'pen', complete: 'check', pending: 'clock', none: 'info', warn: 'alert', locked: 'lock', current: 'compass', info: 'info' };
  function chip(kind, label) { return '<span class="v-chip v-chip--' + kind + '">' + ic(CHIP_ICON[kind] || 'info', 16) + '<span>' + esc(label) + '</span></span>'; }

  /* Unified navy Vault header. hero:true is the discovery variant. */
  function head(o) {
    return '<div class="v-wrap"><header class="v-head' + (o.hero ? ' v-head--hero' : '') + '"><div class="v-head-in">' +
      '<div class="v-head-tx">' + (o.eyebrow ? '<p class="v-eyebrow">' + ic(o.eyeIcon || 'vault', 18) + esc(o.eyebrow) + '</p>' : '') +
      '<h1>' + esc(o.title) + '</h1>' + (o.desc ? '<p class="v-head-desc">' + esc(o.desc) + '</p>' : '') + (o.extra || '') + '</div>' +
      (o.actions ? '<div class="v-head-acts">' + o.actions + '</div>' : '') + '</div></header></div>';
  }

  function banner(kind, html, action) {
    var icn = { info: 'info', ok: 'check', warn: 'alert', error: 'alert', pending: 'clock', saved: 'save' }[kind] || 'info';
    return '<div class="v-banner v-banner--' + kind + '" role="' + (kind === 'error' ? 'alert' : 'status') + '">' + ic(icn, 22) + '<div class="v-banner-tx">' + html + '</div>' + (action || '') + '</div>';
  }

  /* Flag for anything that still needs backend work or sign-off. Visible in the prototype only. */
  function flag(text) { return '<p class="v-flag">' + ic('info', 16) + '<span>' + esc(text) + '</span></p>'; }

  /* Next-action card: one primary action. */
  function nextCard(na, extra) {
    var kind = na.kind === 'done' ? 'complete' : na.kind === 'draft' || na.kind === 'resume' ? 'draft' : 'current';
    return '<section class="v-card v-next" aria-labelledby="next-t">' +
      '<div class="v-next-tx">' + chip(kind, na.label || 'Next step') + '<h2 id="next-t">' + esc(na.title) + '</h2>' + (na.text ? '<p>' + esc(na.text) + '</p>' : '') + (extra || '') + '</div>' +
      '<div class="v-next-acts">' + btn(na.cta, { href: na.href, kind: na.quiet ? 'secondary' : 'primary', icon: 'arrow' }) +
      (na.secondary ? btn(na.secondary.label, { href: na.secondary.href, kind: 'text' }) : '') + '</div></section>';
  }

  /* Module row: icon, name, description, status, chevron. locked rows are not links. */
  function moduleRow(o) {
    var tag = o.locked ? 'div' : 'a';
    return '<' + tag + ' class="v-mrow' + (o.locked ? ' is-locked' : '') + '"' + (o.locked ? '' : ' href="' + o.href + '"') + '>' +
      '<span class="v-mrow-ic">' + ic(o.icon, 24) + '</span>' +
      '<span class="v-mrow-tx"><span class="v-mrow-name">' + esc(o.name) + '</span><span class="v-mrow-one">' + esc(o.one) + '</span></span>' +
      '<span class="v-mrow-st">' + (o.status || '') + '</span>' + (o.locked ? '' : '<span class="v-mrow-go">' + ic('chev', 20) + '</span>') + '</' + tag + '>';
  }

  /* Trusted Person selector. Searchable once the list is long. */
  function personSelector(o) {
    var people = o.people, q = (o.query || '').toLowerCase(), searchable = people.length > 5;
    var shown = people.filter(function (p) { return !q || (p.name + ' ' + p.email + ' ' + (p.relationship || '')).toLowerCase().indexOf(q) >= 0; });
    var h = '<fieldset class="v-fieldset"><legend class="v-label">' + esc(o.legend || 'Who should receive it?') + '</legend>' +
      (o.hint ? '<p class="v-hint">' + esc(o.hint) + '</p>' : '');
    if (searchable) h += '<div class="v-search">' + ic('search', 20) + '<input class="v-input" type="search" id="ps-q" data-field="__psq" value="' + esc(o.query || '') + '" placeholder="Search by name or email" aria-label="Search trusted people"></div>';
    if (!people.length) h += '<p class="v-muted">You haven’t added anyone yet.</p>';
    h += '<div class="v-checks" role="group">' + shown.map(function (p) {
      var on = o.selected.indexOf(p.id) >= 0;
      return '<label class="v-check' + (on ? ' on' : '') + '"><input type="checkbox" data-act="ps:toggle" data-id="' + p.id + '"' + (on ? ' checked' : '') + '>' +
        '<span class="v-av" aria-hidden="true">' + esc(initials(p.name)) + '</span><span class="v-check-tx"><b>' + esc(p.name) + '</b><small>' + esc([p.relationship, p.email].filter(Boolean).join(' · ')) + '</small></span><span class="v-tick">' + ic('check', 18) + '</span></label>';
    }).join('') + (people.length && !shown.length ? '<p class="v-muted">No one matches “' + esc(o.query) + '”.</p>' : '') + '</div>';
    if (o.allowAdd !== false) h += o.adding ? personMiniForm(o.addValues || {}, o.addErrors || {}) : btn('Add a new person', { kind: 'secondary', iconLeft: 'plus', act: 'ps:add' });
    return h + '</fieldset>';
  }
  function personMiniForm(v, e) {
    return '<div class="v-mini" role="group" aria-label="New trusted person"><p class="v-mini-t">New trusted person</p><div class="v-grid2">' +
      field({ k: '__pn', type: 'text', label: 'Full name', req: true }, { __pn: v.name }, { __pn: e.name }) +
      field({ k: '__pe', type: 'email', label: 'Email', req: true, hint: 'We contact them here only if information is released.' }, { __pe: v.email }, { __pe: e.email }) + '</div>' +
      '<div class="v-row-acts">' + btn('Save person', { act: 'ps:save', kind: 'primary', size: 'sm' }) + btn('Cancel', { act: 'ps:cancel', kind: 'text' }) + '</div></div>';
  }
  function initials(n) { return String(n || '?').trim().split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase(); }

  /* Release trigger selector: three large radio cards. */
  function triggerSelector(o) {
    return '<fieldset class="v-fieldset"><legend class="v-label">' + esc(o.legend || 'When should this information be released?') + '</legend>' +
      (o.hint ? '<p class="v-hint">' + esc(o.hint) + '</p>' : '') +
      '<div class="v-choices v-choices--3">' + C.triggers.map(function (t) {
        var on = o.value === t.id;
        return '<label class="v-choice' + (on ? ' on' : '') + '"><input type="radio" name="' + (o.name || 'trigger') + '" value="' + t.id + '" data-act="' + (o.act || 'trigger') + '"' + (on ? ' checked' : '') + '><span class="v-radio" aria-hidden="true"></span><span>' + esc(t.label) + '</span></label>';
      }).join('') + '</div>' + (o.error ? '<p class="v-err" role="alert">' + ic('alert', 16) + esc(o.error) + '</p>' : '') +
      '<p class="v-hint v-hint--icon">' + ic('shield', 18) + esc(C.verification.summary) + '</p></fieldset>';
  }

  /* Guided setup progress: named sections plus "Question x of y". */
  function guidedProgress(o) {
    return '<div class="v-gprog"><ol class="v-gsec" aria-label="Sections">' + o.sections.map(function (s, i) {
      var st = i < o.secIndex ? 'done' : i === o.secIndex ? 'cur' : '';
      return '<li class="' + st + '"' + (st === 'cur' ? ' aria-current="step"' : '') + '><span class="v-gdot">' + (st === 'done' ? ic('check', 14) : i + 1) + '</span>' + esc(s.label) + '</li>';
    }).join('') + '</ol><div class="v-gbar" role="progressbar" aria-valuemin="1" aria-valuemax="' + o.total + '" aria-valuenow="' + (o.index + 1) + '" aria-label="Guided setup progress"><i style="width:' + Math.round((o.index + 1) / o.total * 100) + '%"></i></div>' +
      '<p class="v-gcount">Question ' + (o.index + 1) + ' of ' + o.total + '</p></div>';
  }

  /* Item form steps */
  function formSteps(steps, cur) {
    return '<ol class="v-fsteps" aria-label="Steps">' + steps.map(function (s, i) {
      var st = i < cur ? 'done' : i === cur ? 'cur' : '';
      return '<li class="' + st + '"' + (st === 'cur' ? ' aria-current="step"' : '') + '><span class="v-gdot">' + (st === 'done' ? ic('check', 14) : i + 1) + '</span>' + esc(s) + '</li>';
    }).join('') + '</ol>';
  }

  /* Category selection grid; grouped when groups are given. */
  function catGrid(module, selected) {
    var m = C.modules[module];
    function card(c) {
      var on = selected === c.id;
      return '<label class="v-cat' + (on ? ' on' : '') + '"><input type="radio" name="cat" value="' + c.id + '" data-act="form:cat"' + (on ? ' checked' : '') + '><span class="v-cat-ic">' + ic(c.icon, 26) + '</span><span class="v-cat-tx"><b>' + esc(c.label) + '</b><small>' + esc(c.hint) + '</small></span></label>';
    }
    if (!m.groups) return '<fieldset class="v-fieldset"><legend class="v-label">What would you like to add?</legend><div class="v-cats">' + m.cats.map(card).join('') + '</div></fieldset>';
    return '<fieldset class="v-fieldset"><legend class="v-label">What would you like to add?</legend>' + m.groups.map(function (g) {
      return '<h3 class="v-group-t">' + esc(g) + ' obligations</h3><div class="v-cats">' + m.cats.filter(function (c) { return c.group === g; }).map(card).join('') + '</div>';
    }).join('') + '</fieldset>';
  }

  /* Form field. values/errors are keyed by field key. */
  function field(f, values, errors) {
    var cfg = f.configKey ? C[f.configKey] : null;
    if (cfg && cfg.enabled === false) return '';
    var label = cfg ? cfg.label : f.label, hint = cfg ? cfg.help : f.hint;
    var id = 'f-' + f.k, val = values[f.k] == null ? '' : values[f.k], err = errors && errors[f.k];
    var lab = '<span class="v-label">' + esc(label) + (f.optional ? ' <span class="v-opt">(optional)</span>' : '') + '</span>';
    var hintH = hint ? '<span class="v-hint" id="' + id + '-h">' + esc(hint) + '</span>' : '';
    var errH = err ? '<span class="v-err" id="' + id + '-e" role="alert">' + ic('alert', 16) + esc(err) + '</span>' : '';
    var desc = [hint ? id + '-h' : '', err ? id + '-e' : ''].filter(Boolean).join(' ');
    var aria = (desc ? ' aria-describedby="' + desc + '"' : '') + (err ? ' aria-invalid="true"' : '') + (f.req ? ' aria-required="true"' : '');
    var flagH = (cfg && cfg.approved === false) ? flag('Wording pending Scholar and business approval.') : f.backend ? flag(f.backend) : '';
    if (f.type === 'radio') {
      return '<fieldset class="v-field v-fieldset"><legend class="v-label">' + esc(label) + (f.optional ? ' <span class="v-opt">(optional)</span>' : '') + '</legend>' + hintH +
        '<div class="v-choices">' + f.options.map(function (op) {
          var on = val === op;
          return '<label class="v-choice v-choice--sm' + (on ? ' on' : '') + '"><input type="radio" name="' + id + '" value="' + esc(op) + '" data-field="' + f.k + '"' + (on ? ' checked' : '') + '><span class="v-radio" aria-hidden="true"></span><span>' + esc(op) + '</span></label>';
        }).join('') + '</div>' + errH + flagH + '</fieldset>';
    }
    if (f.type === 'textarea') return '<label class="v-field" for="' + id + '">' + lab + hintH + '<textarea class="v-input v-textarea" id="' + id + '" rows="' + (f.rows || 4) + '" data-field="' + f.k + '"' + aria + '>' + esc(val) + '</textarea>' + errH + '</label>';
    if (f.type === 'money') {
      var cur = values[f.k + '_cur'] || 'CAD';
      return '<div class="v-field"><label for="' + id + '">' + lab + '</label>' + hintH + '<div class="v-money"><input class="v-input" id="' + id + '" inputmode="decimal" autocomplete="off" data-field="' + f.k + '" value="' + esc(val) + '" placeholder="0"' + aria + '>' +
        '<select class="v-input v-select" data-field="' + f.k + '_cur" aria-label="Currency">' + C.currencies.map(function (c) { return '<option' + (c === cur ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div>' + errH + '</div>';
    }
    if (f.type === 'file') {
      var names = Array.isArray(val) ? val : [];
      return '<div class="v-field"><span class="v-label">' + esc(label) + ' <span class="v-opt">(optional)</span></span>' + hintH +
        '<label class="v-file" for="' + id + '">' + ic('file', 22) + '<span>Choose files</span><input id="' + id + '" type="file" multiple data-field="' + f.k + '" class="v-sr"></label>' +
        (names.length ? '<ul class="v-files">' + names.map(function (n) { return '<li>' + ic('file', 18) + esc(n) + '</li>'; }).join('') + '</ul>' : '') + flagH + '</div>';
    }
    return '<label class="v-field" for="' + id + '">' + lab + hintH + '<input class="v-input" id="' + id + '" type="' + (f.type === 'email' ? 'email' : 'text') + '" data-field="' + f.k + '" value="' + esc(val) + '"' + (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : '') + (f.type === 'email' ? ' autocomplete="email"' : '') + aria + '>' + errH + '</label>';
  }

  /* Draft / saved status line */
  function draftStatus(o) {
    if (o.saveFailed) return '<span class="v-save v-save--err">' + ic('alert', 18) + 'Not saved yet</span>';
    if (o.dirty) return '<span class="v-save">' + ic('pen', 18) + 'Unsaved changes</span>';
    if (o.status === 'draft') return '<span class="v-save">' + ic('save', 18) + 'Draft saved ' + esc(fmtTime(o.savedAt)) + '</span>';
    if (o.savedAt) return '<span class="v-save">' + ic('check', 18) + 'Saved ' + esc(fmtTime(o.savedAt)) + '</span>';
    return '';
  }

  /* Review summary: groups of label/value rows with an edit action each. */
  function reviewSummary(groups) {
    return '<div class="v-review">' + groups.map(function (g) {
      return '<section class="v-rev-g"><div class="v-rev-h"><h3>' + esc(g.title) + '</h3>' + (g.edit ? btn('Edit', { kind: 'text', href: g.edit.href, act: g.edit.act, attrs: g.edit.attrs, iconLeft: 'pen' }) : '') + '</div>' +
        (g.rows.length ? '<dl class="v-rev-dl">' + g.rows.map(function (r) { return '<div><dt>' + esc(r[0]) + '</dt><dd>' + (r[2] ? r[1] : esc(r[1] || '—')) + '</dd></div>'; }).join('') + '</dl>' : '<p class="v-muted">' + esc(g.empty || 'Nothing added.') + '</p>') + '</section>';
    }).join('') + '</div>';
  }

  function emptyState(o) {
    return '<div class="v-empty"><span class="v-empty-ic">' + ic(o.icon || 'vault', 30) + '</span><h2>' + esc(o.title) + '</h2>' + (o.text ? '<p>' + esc(o.text) + '</p>' : '') + (o.actions ? '<div class="v-row-acts">' + o.actions + '</div>' : '') + '</div>';
  }
  function errorState(o) {
    return '<div class="v-empty v-empty--err" role="alert"><span class="v-empty-ic">' + ic('alert', 30) + '</span><h2>' + esc(o.title) + '</h2><p>' + esc(o.text) + '</p>' + (o.actions ? '<div class="v-row-acts">' + o.actions + '</div>' : '') + '</div>';
  }
  function skeleton(lines) {
    var h = '<div class="v-skel" aria-hidden="true">';
    for (var i = 0; i < (lines || 3); i++) h += '<i style="width:' + [92, 70, 84, 56, 76][i % 5] + '%"></i>';
    return h + '</div>';
  }
  function loadingPage() {
    return '<div class="v-loading" role="status" aria-live="polite"><span class="v-sr">Loading your Vault</span>' +
      '<div class="v-wrap"><div class="v-head v-head--skel"><div class="v-head-in"><div class="v-head-tx">' + skeleton(2) + '</div></div></div></div>' +
      '<div class="v-wrap"><div class="v-cols"><div class="v-col">' + '<div class="v-card">' + skeleton(4) + '</div><div class="v-card">' + skeleton(5) + '</div></div><div class="v-col">' + '<div class="v-card">' + skeleton(3) + '</div></div></div></div></div>';
  }

  /* Confirmation dialog markup. actions: [{label, act, kind}] */
  function dialog(o) {
    return '<dialog class="v-dialog" aria-labelledby="dlg-t"><form method="dialog" class="v-dialog-in">' +
      (o.icon ? '<span class="v-dialog-ic v-dialog-ic--' + (o.tone || 'info') + '">' + ic(o.icon, 26) + '</span>' : '') +
      '<h2 id="dlg-t">' + esc(o.title) + '</h2>' + (o.body ? '<div class="v-dialog-body">' + o.body + '</div>' : '') +
      '<div class="v-dialog-acts">' + o.actions.map(function (a) { return btn(a.label, { kind: a.kind || 'secondary', act: a.act }); }).join('') + '</div></form></dialog>';
  }

  window.VC = {
    btn: btn, chip: chip, head: head, banner: banner, flag: flag, nextCard: nextCard, moduleRow: moduleRow,
    personSelector: personSelector, personMiniForm: personMiniForm, triggerSelector: triggerSelector, guidedProgress: guidedProgress, formSteps: formSteps,
    catGrid: catGrid, field: field, draftStatus: draftStatus, reviewSummary: reviewSummary, emptyState: emptyState,
    errorState: errorState, skeleton: skeleton, loadingPage: loadingPage, dialog: dialog, initials: initials,
    fmtTime: fmtTime, fmtDate: fmtDate, fmtPrice: fmtPrice
  };
})();
