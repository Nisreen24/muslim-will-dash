/* Stand-in for the API / remote config.
   Everything the brief says must be data-driven lives here: prices, chapter order, product availability,
   review stages and the rules the business has not confirmed yet. The screens read from this file and
   hard-code none of it. */
window.MW_CONFIG = {
  currency: 'CAD',

  // amount: null → the UI shows "Price confirmed at checkout" until the API returns one.
  pricing: {
    vault: { name: 'My Vault', amount: 7.99, period: 'month', sample: true },   // sample value: "about $7–8 / month"
    notary: { name: 'Notarized Attestation', amount: 275, was: 350, period: null, sample: true }   // sample: what the test site shows today
  },

  products: { will: true, vault: true, notary: true },

  // true → the Will is closed to everyone in both builds (see will-lock.js). false → everything opens again, unchanged.
  willLocked: true,

  // What the "Add to your plan" page lists. One short line each; price comes from `pricing`.
  packages: [
    { id: 'will', name: 'Basic Will', line: 'Create and print your Islamic Will.' },
    { id: 'vault', name: 'Will + Vault', line: 'One secure place for everything your family will need.', pricing: 'vault' },
    { id: 'notary', name: 'Notarized Will', line: 'Sign on Zoom with your attorney and both witnesses.', pricing: 'notary' }
  ],
  vaultPreviewUntilComplete: true,   // the site shows the Vault as "Preview — activates after attestation"

  // Chapter order is data. Sections inside a chapter are too.
  chapters: [
    { id: 'about', title: 'About You', mins: 5, sections: ['name', 'contact', 'residency'] },
    { id: 'family', title: 'Family', mins: 10, sections: ['spouse', 'children', 'relatives'] },
    { id: 'trusted', title: 'Executor & Guardian', mins: 5, sections: ['executor', 'guardian'] },   // 'guardian' only appears when there are children under 18
    { id: 'wasiyyah', title: 'Wasiyyah', mins: 3, sections: ['wasiyyah'] },
    { id: 'witnesses', title: 'Witnesses', mins: 2, sections: ['witness1', 'witness2'] },
    { id: 'review', title: 'Review & Submit', mins: 4, sections: ['review'] }
  ],

  // Stages after submission. 'only' limits a stage to one signing route.
  stages: [
    { id: 'submitted', label: 'Submitted' },
    { id: 'scholar', label: 'Scholar Review', note: 'Usually 2–3 days' },
    { id: 'legal', label: 'Conformity Review', note: 'Usually 3–5 days' },
    { id: 'ready', label: 'Ready to Sign' },
    { id: 'attest', label: 'Attestation', only: 'notary' },
    { id: 'complete', label: 'Completed' }
  ],

  rules: {
    wasiyyahMaxPct: 33.3,        // one third
    minAge: 18,                  // testator and witnesses; computed from today's date, never a fixed year
    country: 'CA',               // phone and province rules
    // Not confirmed by the business — kept as switches so no screen has to change:
    printFrom: 'submitted',      // stage from which the basic Will can be printed
    editWhileInReview: false,
    attestNextStep: 'Then upload photo IDs and choose a time.'
  },

  // Times the legal team has opened for attestation. Empty → "No times open right now".
  attestSlots: ['Sunday, September 27 · 9:00 – 10:00 AM', 'Monday, September 28 · 2:00 – 3:00 PM', 'Wednesday, September 30 · 6:00 – 7:00 PM', 'Saturday, October 3 · 11:00 AM – 12:00 PM'],   // sample values
  idFile: { types: ['jpg', 'jpeg', 'png', 'pdf'], maxMb: 10 },

  support: { email: null },      // null → "Support contact comes from config"

  provinces: ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon'],
  countries: ['Canada', 'Egypt', 'India', 'Lebanon', 'Morocco', 'Nigeria', 'Pakistan', 'Somalia', 'Syria', 'United Kingdom', 'United States', 'Other'],

  vaultModules: [
    { id: 'obl', name: 'Obligations Register', short: 'Obligations', desc: 'Debts, mahr, zakat and religious dues.', types: ['Loan', 'Religious', 'Other'], amount: true, one: 'obligation' },
    { id: 'assets', name: 'Estate Inventory', short: 'Assets', desc: 'What you own, in Canada and abroad.', types: ['Property', 'Vehicle', 'Account', 'Other'], amount: true, one: 'asset' },
    { id: 'sealed', name: 'Sealed Documents', short: 'Sealed', desc: 'Private files, released only on a trigger.', types: ['Note', 'Document'], amount: false, one: 'document' },
    { id: 'words', name: 'Voice & Video Messages', short: 'Messages', desc: 'Words for the people you love.', types: ['Letter', 'Voice', 'Video'], amount: false, one: 'message' }
  ]
};
