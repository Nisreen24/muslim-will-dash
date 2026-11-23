/* My Vault configuration.
   Everything here is product configuration, not UI. Prices are NOT here: they come from the pricing API (see mock-api.js).
   Items marked `approved: false` or `pending` are copy or rules that still need business, legal or Scholar sign-off. */
(function () {
  'use strict';

  var HOME_COUNTRY = 'Canada';
  var CURRENCIES = ['CAD', 'USD', 'GBP', 'EUR', 'AED', 'SAR', 'EGP', 'PKR', 'INR', 'MYR'];

  function v(x) { return (x == null ? '' : String(x)).trim(); }
  function money(a, c) { if (!v(a)) return ''; var n = Number(String(a).replace(/[^0-9.]/g, '')); return isNaN(n) ? '' : (c || 'CAD') + ' ' + n.toLocaleString('en-CA'); }
  function join() { return Array.prototype.filter.call(arguments, Boolean).join(' · '); }

  // Fields shared by assets and obligations, appended after the category fields.
  var PAPERWORK = { k: 'where', type: 'text', label: 'Where can your family find the paperwork?', optional: true, hint: 'For example: "Statements in my email" or "Blue folder in the study".' };
  var NOTES = { k: 'notes', type: 'textarea', label: 'Notes for your family', optional: true };
  var DOCS = { k: 'docs', type: 'file', label: 'Supporting documents', optional: true, hint: 'Agreements, statements or receipts.', backend: 'File upload needs the document storage API. The prototype keeps file names only.' };

  var ASSETS = [
    { id: 'bank', label: 'Bank account', hint: 'Main and secondary accounts', icon: 'bank',
      question: 'Do you have a bank account?', qhint: 'Include your main account and any secondary ones.',
      fields: [
        { k: 'institution', type: 'text', label: 'Bank or credit union', req: true, placeholder: 'e.g. RBC' },
        { k: 'accountType', type: 'radio', label: 'Type of account', options: ['Chequing', 'Savings', 'Joint account', 'Not sure'] },
        { k: 'location', type: 'radio', label: 'Where is the account?', options: ['In ' + HOME_COUNTRY, 'In another country'] },
        { k: 'country', type: 'text', label: 'Which country?', req: true, when: function (x) { return x.location === 'In another country'; } },
        { k: 'value', type: 'money', label: 'Approximate balance', optional: true, hint: 'A rough figure is fine.' }
      ],
      title: function (x) { return join(v(x.institution), v(x.accountType)); },
      sub: function (x) { return join(x.location === 'In another country' ? v(x.country) : x.location, money(x.value, x.value_cur)); } },
    { id: 'property', label: 'Property', hint: 'Home, land or rental, here or abroad', icon: 'house',
      question: 'Do you own property, here or in another country?', qhint: 'Your home, land, a rental, or a share in any of these.',
      fields: [
        { k: 'description', type: 'text', label: 'What is it?', req: true, placeholder: 'e.g. Family home' },
        { k: 'location', type: 'radio', label: 'Where is it?', options: ['In ' + HOME_COUNTRY, 'In another country'] },
        { k: 'place', type: 'text', label: 'City or address', optional: true },
        { k: 'ownership', type: 'radio', label: 'How do you own it?', options: ['On my own', 'Jointly', 'Not sure'] },
        { k: 'value', type: 'money', label: 'Approximate value', optional: true }
      ],
      title: function (x) { return v(x.description); },
      sub: function (x) { return join(v(x.place) || x.location, x.ownership, money(x.value, x.value_cur)); } },
    { id: 'pension', label: 'Pension', hint: 'Workplace or government pension', icon: 'pension',
      question: 'Do you have a pension?', qhint: 'From an employer, a union, or the government.',
      fields: [
        { k: 'provider', type: 'text', label: 'Pension provider or employer', req: true },
        { k: 'planType', type: 'radio', label: 'Type of pension', options: ['Workplace pension', 'Government pension', 'Other'] },
        { k: 'beneficiary', type: 'radio', label: 'Is a beneficiary named on it?', options: ['Yes', 'No', 'Not sure'] }
      ],
      title: function (x) { return v(x.provider); },
      sub: function (x) { return join(x.planType, x.beneficiary === 'Yes' ? 'Beneficiary named' : ''); } },
    { id: 'investment', label: 'Investments', hint: 'TFSA, RRSP, shares, funds', icon: 'chart',
      question: 'Do you have investments?', qhint: 'For example a TFSA, RRSP, shares or funds.',
      fields: [
        { k: 'provider', type: 'text', label: 'Where are they held?', req: true, placeholder: 'e.g. Wealthsimple' },
        { k: 'kind', type: 'radio', label: 'Type', options: ['TFSA', 'RRSP or RRIF', 'Non-registered', 'Other'] },
        { k: 'beneficiary', type: 'radio', label: 'Is a beneficiary named on it?', options: ['Yes', 'No', 'Not sure'] },
        { k: 'value', type: 'money', label: 'Approximate value', optional: true }
      ],
      title: function (x) { return join(v(x.provider), x.kind); },
      sub: function (x) { return join(x.beneficiary === 'Yes' ? 'Beneficiary named' : '', money(x.value, x.value_cur)); } },
    { id: 'insurance', label: 'Life insurance', hint: 'Personal or through work', icon: 'shield',
      question: 'Do you have life insurance?', qhint: 'Include policies through your employer.',
      fields: [
        { k: 'insurer', type: 'text', label: 'Insurance company', req: true },
        { k: 'through', type: 'radio', label: 'How did you get it?', options: ['On my own', 'Through work', 'Not sure'] },
        { k: 'beneficiary', type: 'radio', label: 'Is a beneficiary named on it?', options: ['Yes', 'No', 'Not sure'] },
        { k: 'value', type: 'money', label: 'Coverage amount', optional: true }
      ],
      title: function (x) { return v(x.insurer); },
      sub: function (x) { return join(x.through, money(x.value, x.value_cur)); } },
    { id: 'vehicle', label: 'Vehicle', hint: 'Car, van or motorcycle', icon: 'car',
      question: 'Do you own a vehicle?',
      fields: [
        { k: 'description', type: 'text', label: 'Make and model', req: true, placeholder: 'e.g. Toyota Camry' },
        { k: 'ownership', type: 'radio', label: 'Is it paid off?', options: ['Paid off', 'Financed', 'Leased'] }
      ],
      title: function (x) { return v(x.description); },
      sub: function (x) { return v(x.ownership); } },
    { id: 'business', label: 'Business interest', hint: 'A company or partnership share', icon: 'briefcase',
      question: 'Do you own all or part of a business?',
      fields: [
        { k: 'name', type: 'text', label: 'Business name', req: true },
        { k: 'share', type: 'text', label: 'Your share', optional: true, placeholder: 'e.g. 50%' },
        { k: 'contact', type: 'text', label: 'Who should your family contact?', optional: true, hint: 'A partner or accountant.' }
      ],
      title: function (x) { return v(x.name); },
      sub: function (x) { return join(v(x.share) ? v(x.share) + ' share' : '', v(x.contact)); } },
    { id: 'owed', label: 'Money owed to you', hint: 'Loans you gave to others', icon: 'handshake',
      question: 'Does anyone owe you money?', qhint: 'For example a loan to a relative or friend.',
      fields: [
        { k: 'person', type: 'text', label: 'Who owes you?', req: true },
        { k: 'value', type: 'money', label: 'How much?', req: true },
        { k: 'agreement', type: 'radio', label: 'Is there a written agreement?', options: ['Yes, written', 'Verbal only', 'Not sure'] },
        { k: 'forgive', type: 'radio', configKey: 'forgiveOption', options: ['Yes, forgive it', 'No', 'I’ll decide later'] }
      ],
      title: function (x) { return 'Owed by ' + v(x.person); },
      sub: function (x) { return join(money(x.value, x.value_cur), x.forgive === 'Yes, forgive it' ? 'Forgive if uncollected' : ''); } },
    { id: 'other', label: 'Something else', hint: 'Valuables, digital assets, anything else', icon: 'box',
      question: 'Is there anything else of value your family should know about?', qhint: 'Gold, jewellery, a safe deposit box, digital assets.',
      fields: [
        { k: 'description', type: 'text', label: 'What is it?', req: true },
        { k: 'value', type: 'money', label: 'Approximate value', optional: true }
      ],
      title: function (x) { return v(x.description); },
      sub: function (x) { return money(x.value, x.value_cur); } }
  ];
  ASSETS.forEach(function (c) { c.fields = c.fields.concat([PAPERWORK, NOTES]); });

  var OBLIGATIONS = [
    { id: 'loan', group: 'Financial', label: 'Loan', hint: 'Mortgage, car or personal loan', icon: 'bank',
      question: 'Do you have any loans?', qhint: 'A mortgage, car loan, line of credit or personal loan.',
      fields: [
        { k: 'lender', type: 'text', label: 'Lender', req: true, placeholder: 'e.g. TD Bank' },
        { k: 'kind', type: 'radio', label: 'Type of loan', options: ['Mortgage', 'Car loan', 'Line of credit', 'Personal loan', 'Other'] },
        { k: 'value', type: 'money', label: 'Amount still owed', optional: true }
      ],
      title: function (x) { return join(x.kind, v(x.lender)); },
      sub: function (x) { return money(x.value, x.value_cur); } },
    { id: 'credit', group: 'Financial', label: 'Credit card', hint: 'Any balance you carry', icon: 'card',
      question: 'Do you carry a balance on a credit card?',
      fields: [
        { k: 'issuer', type: 'text', label: 'Card issuer', req: true },
        { k: 'value', type: 'money', label: 'Approximate balance', optional: true }
      ],
      title: function (x) { return 'Credit card · ' + v(x.issuer); },
      sub: function (x) { return money(x.value, x.value_cur); } },
    { id: 'personal', group: 'Financial', label: 'Money you owe a person', hint: 'A loan from family or a friend', icon: 'handshake',
      question: 'Do you owe money to a relative or friend?',
      fields: [
        { k: 'person', type: 'text', label: 'Who do you owe?', req: true },
        { k: 'value', type: 'money', label: 'How much?', optional: true }
      ],
      title: function (x) { return 'Owed to ' + v(x.person); },
      sub: function (x) { return money(x.value, x.value_cur); } },
    { id: 'mahr', group: 'Religious', label: 'Deferred mahr', hint: 'Agreed at nikah, not yet paid', icon: 'ring',
      question: 'Do you owe a deferred mahr?', qhint: 'Mahr agreed at your nikah that hasn’t been paid yet.',
      fields: [
        { k: 'person', type: 'text', label: 'Owed to', req: true },
        { k: 'value', type: 'money', label: 'Amount', req: true },
        { k: 'agreed', type: 'text', label: 'When was it agreed?', optional: true, placeholder: 'e.g. At our nikah in 2012' }
      ],
      title: function (x) { return 'Deferred mahr to ' + v(x.person); },
      sub: function (x) { return money(x.value, x.value_cur); } },
    { id: 'zakat', group: 'Religious', label: 'Outstanding zakat', hint: 'Zakat not yet paid, by year', icon: 'moon',
      question: 'Is any zakat still unpaid?', qhint: 'Add one entry for each year.',
      fields: [
        { k: 'year', type: 'text', label: 'Which year?', req: true, placeholder: 'e.g. 1446 AH' },
        { k: 'value', type: 'money', label: 'Amount still owed', optional: true }
      ],
      title: function (x) { return 'Zakat · ' + v(x.year); },
      sub: function (x) { return money(x.value, x.value_cur); } },
    { id: 'kaffarah', group: 'Religious', label: 'Kaffarah', hint: 'Expiation still owed', icon: 'moon',
      question: 'Do you owe any kaffarah?',
      fields: [
        { k: 'reason', type: 'radio', label: 'What is it for?', options: ['A broken oath', 'Missed fasts', 'Something else'] },
        { k: 'description', type: 'text', label: 'Short description', req: true },
        { k: 'value', type: 'money', label: 'Estimated cost', optional: true }
      ],
      title: function (x) { return 'Kaffarah · ' + (v(x.reason) || v(x.description)); },
      sub: function (x) { return join(v(x.description), money(x.value, x.value_cur)); } },
    { id: 'hajj', group: 'Religious', label: 'Hajj Badal', hint: 'Hajj performed on your behalf', icon: 'kaaba',
      question: 'Should someone perform Hajj on your behalf (Hajj Badal)?',
      fields: [
        { k: 'reason', type: 'text', label: 'Why is it needed?', optional: true, placeholder: 'e.g. Obligatory Hajj not yet performed' },
        { k: 'funds', type: 'radio', label: 'Have you set money aside for it?', options: ['Yes', 'No', 'Not sure'] },
        { k: 'value', type: 'money', label: 'Amount set aside', optional: true, when: function (x) { return x.funds === 'Yes'; } }
      ],
      title: function () { return 'Hajj Badal'; },
      sub: function (x) { return join(v(x.reason), x.funds === 'Yes' ? 'Funds set aside' : ''); } },
    { id: 'otherreligious', group: 'Religious', label: 'Other religious obligation', hint: 'Fidya, nadhr or other dues', icon: 'moon',
      question: 'Is there any other religious obligation to settle?', qhint: 'For example fidya or a vow (nadhr).',
      fields: [
        { k: 'description', type: 'text', label: 'What is it?', req: true },
        { k: 'value', type: 'money', label: 'Estimated amount', optional: true }
      ],
      title: function (x) { return v(x.description); },
      sub: function (x) { return money(x.value, x.value_cur); } }
  ];
  OBLIGATIONS.forEach(function (c) { c.fields = c.fields.concat([DOCS, PAPERWORK, NOTES]); });

  var SEALED = [
    { id: 'note', label: 'Private note', hint: 'Something only certain people should know', icon: 'lock',
      fields: [{ k: 'title', type: 'text', label: 'Title', req: true }, { k: 'body', type: 'textarea', label: 'Your note', req: true }],
      title: function (x) { return v(x.title); }, sub: function () { return 'Private note'; } },
    { id: 'location', label: 'Where things are kept', hint: 'Documents, keys, a safe', icon: 'key',
      fields: [{ k: 'title', type: 'text', label: 'What is it?', req: true, placeholder: 'e.g. Safe deposit box' }, { k: 'body', type: 'textarea', label: 'Where is it, and how to reach it?', req: true }],
      title: function (x) { return v(x.title); }, sub: function () { return 'Location'; } },
    { id: 'instructions', label: 'Instructions', hint: 'Steps for your family to follow', icon: 'list',
      fields: [{ k: 'title', type: 'text', label: 'Title', req: true }, { k: 'body', type: 'textarea', label: 'Instructions', req: true }],
      title: function (x) { return v(x.title); }, sub: function () { return 'Instructions'; } }
  ];

  var FINAL = [
    { id: 'message', label: 'Written message', hint: 'A letter to someone you love', icon: 'message',
      fields: [{ k: 'title', type: 'text', label: 'Who is it for?', req: true, placeholder: 'e.g. To my children' }, { k: 'body', type: 'textarea', label: 'Your message', req: true, rows: 8 }],
      title: function (x) { return v(x.title); }, sub: function () { return 'Written message'; } },
    { id: 'wishes', label: 'Personal wishes', hint: 'Funeral, burial or family wishes', icon: 'leaf',
      fields: [{ k: 'title', type: 'text', label: 'Title', req: true, placeholder: 'e.g. My funeral wishes' }, { k: 'body', type: 'textarea', label: 'Your wishes', req: true, rows: 8 }],
      title: function (x) { return v(x.title); }, sub: function () { return 'Personal wishes'; } }
  ];

  window.MW_CONFIG = {
    homeCountry: HOME_COUNTRY,
    currencies: CURRENCIES,
    modules: {
      assets: { id: 'assets', name: 'Estate Inventory', icon: 'list', noun: 'asset', addLabel: 'Add an asset', one: 'Accounts, property and other assets, here or abroad.', cats: ASSETS,
        empty: { title: 'No assets added yet', text: 'A short list of your accounts and property saves your family a long search.' } },
      obligations: { id: 'obligations', name: 'Obligations', icon: 'scale', noun: 'obligation', addLabel: 'Add an obligation', one: 'Debts and religious dues to settle before anything is shared.', cats: OBLIGATIONS, groups: ['Financial', 'Religious'],
        empty: { title: 'No obligations added yet', text: 'Debts are settled first. Listing them helps your executor do this correctly.' } },
      sealed: { id: 'sealed', name: 'Sealed Disclosures', icon: 'lock', noun: 'disclosure', addLabel: 'Add a disclosure', one: 'Private notes released only on your conditions.', cats: SEALED,
        empty: { title: 'No sealed disclosures yet', text: 'Keep private notes here. Nobody can open them while you’re alive.' } },
      final: { id: 'final', name: 'Final Words', icon: 'message', noun: 'message', addLabel: 'Write a message', one: 'Personal messages and wishes for the people you love.', cats: FINAL,
        empty: { title: 'No messages yet', text: 'A few words can mean a great deal to the people you leave behind.' },
        backendNote: 'Video and audio messages need the media upload API. Written messages work now.' }
    },
    moduleOrder: ['assets', 'obligations', 'sealed', 'final'],

    // Release triggers. Ids are stable; labels are copy.
    triggers: [
      { id: 'death', label: 'After my death', short: 'After death' },
      { id: 'incapacity', label: 'If I become incapacitated', short: 'If incapacitated' },
      { id: 'either', label: 'In either situation', short: 'Either situation' }
    ],

    // Verification is an operational and legal process that is not built yet. Keep it configurable.
    verification: {
      approved: false,
      summary: 'Information is released only when your chosen condition is met and the required verification is complete.',
      steps: [
        'Someone reports a death or incapacity to Muslim Will.',
        'Muslim Will completes the required verification.',
        'Each person receives only the items you assigned to them, for the condition you chose.'
      ],
      pendingNote: 'Verification steps, documents required and timing are still to be confirmed by Muslim Will operations and legal.'
    },

    // Money owed to the user: may be forgiven if uncollectable. Copy needs Scholar / business approval before launch.
    forgiveOption: {
      enabled: true,
      approved: false,
      label: 'If this amount cannot be collected, should it be forgiven?',
      help: 'Your family will see your answer. You can change it anytime.'
    },

    reviewReminderMonths: 12,
    supportEmail: 'support@muslimwill.example'
  };
})();
