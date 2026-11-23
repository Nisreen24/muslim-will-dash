# My Vault — canonical specification

One product, three surfaces: the mobile app (`Muslim Will - App/design/simulator-v41.html`), the web on desktop (`desktop/`) and the web on a phone (`revamp/`). Layout may differ. Everything below may not.

Where the surfaces disagreed, the rule chosen is marked **(rule)** with the reason.

## 1. Names

| Thing | Full name | Short label (tiles, stats, back links) | Object |
|---|---|---|---|
| Product | My Vault | Vault | |
| Module 1 | Obligations Register | Obligations | obligation |
| Module 2 | Estate Inventory | Assets | asset |
| Module 3 | Sealed Documents | Documents | document |
| Module 4 | Voice & Video Messages | Messages | message |
| People | Trusted People | | person, recipient, executor |
| Settings | Release settings · Reminders · Account and data | | |

Retired words, never shown: Sealed Disclosures, disclosure, sealed record, Final Words, Final messages, Audio (use Voice), Delete (use Remove), Cancel subscription (use Pause / Close), registers (use sections).

Icons: Obligations `scale` · Estate Inventory `list` · Sealed Documents `lock` · Voice & Video Messages `video` · Trusted People `people` · Release settings `shield` · Reminders `bell` · Account and data `download`.

## 2. Information architecture

```
My Vault
├─ Introduction (not subscribed)        5 steps, then checkout
├─ Checkout → "My Vault is active"
├─ Overview (hub)
│   ├─ readiness + one next step + guidance
│   ├─ Manage your Vault
│   │   ├─ Obligations Register      list · view · add · edit
│   │   ├─ Estate Inventory          list · view · add · edit
│   │   ├─ Sealed Documents          list · view · add · edit
│   │   └─ Voice & Video Messages    list · view · add · edit
│   ├─ People and release
│   │   ├─ Trusted People
│   │   └─ Release settings
│   └─ Vault settings
│       ├─ Reminders
│       └─ Account and data          plan · download · pause · close
├─ Guided setup
└─ Yearly review                        4 steps
```

## 3. Access and subscription

- Not subscribed: the Vault entry (tab, menu, banner) opens the Introduction. No management screen is reachable. Any deeper link returns to the Introduction.
- Subscribed: the Vault entry opens the Overview.
- Price comes from the API / config. Shown as `$7.99 CAD / month` (sample value).
- Billing line: `Billed each month until you pause or close it.`
- Exit line: `Pause or close anytime in Account and data.`
- Checkout title `Start My Vault`. Pay button `Pay <amount> and start`.
- After payment, every surface shows the same confirmation: `My Vault is active` / `Start with what your family would need first.` / primary `Open My Vault` / secondary `Back to Home` (`Back to Dashboard` on desktop). Paying clears Paused and Closed. **(rule: the app and desktop already did this; the web phone skipped the confirmation.)**
- One way out, in Account and data **(rule: the client's page 10; the app's separate "Cancel My Vault" in Profile is retired and points here)**:
  - Pause: read-only, release settings stay active, resume anytime.
  - Close: stops right away, nothing is released, everything is deleted after 90 days, reopen before then.
- Paused means read-only everywhere: no add, edit, remove, guided setup, yearly review or new people.

### States every surface supports

| State | What the Overview shows |
|---|---|
| Not subscribed | Introduction |
| Active · empty | 0% · `Next: add your obligations.` · `Start with guidance` |
| Active · partial | N% · next step · `Continue with guidance` |
| Needs action | items marked `Add details` / `Confirm beneficiary`; a recipient marked `Email missing` / `Phone missing` |
| Ready | `Your Vault is ready.` · `Everything is in place. Review it once a year.` |
| Yearly review due | `Everything is in place. Your yearly review is due.` · `Start yearly review` (only once nothing else is open) |
| Payment failed | `We couldn’t take your last payment.` `Update your card to keep your Vault active. Nothing is lost.` · `Update card` |
| Paused | `Your Vault is paused.` `You can read everything, but not change it.` · `Resume my Vault` |
| Closed | Introduction, with `Your Vault is closed.` `Everything is deleted after 90 days.` · `Reopen my Vault` |

## 4. Introduction (before subscribing)

Same five messages on every surface. The phone surfaces show one per screen (Back / Continue, step dots). Desktop shows them as one page: hero, then the sections in this order, one call to action at the end. The price appears once, in step 5.

The wording below is the one already built in the mobile app (v44); the web uses the same strings.

| # | Eyebrow | Headline | Line | Body |
|---|---|---|---|---|
| 1 | My Vault | Keep the rest of your estate organized. | Store important details your family may need later — in one secure place. | Card: `What is My Vault?` / **Keep important information together.** / My Vault organizes estate information that doesn’t belong inside the Will itself. |
| 2 | What can I keep there? | Four places for what matters. | Each one has a clear purpose. | Obligations Register — Track debts, zakat and mahr. · Estate Inventory — List assets, accounts and property. · Sealed Documents — Keep sensitive information private. · Voice & Video Messages — Leave personal guidance for later. |
| 3 | Why does it matter? | Make things easier for your family. | Important information is easier to find when it is organized in one place. | Card: `Alongside your Will` / **Your Will decides who inherits.** / Your Vault helps your executor find everything. |
| 4 | How does access work? | Your information stays private and secure. | You decide who receives what, and when. | **Encrypted and private** — Only you can see your Vault while you use it. · **Released only after verification** — Nothing is released until our team verifies a death certificate or a hospital letter. · **Each person receives only their part** — Recipients get only what you assign to them. |
| 5 | Subscription | One plan. Everything included. | Start now and add things at your own pace. | price · `Billed each month until you pause or close it.` · Included: All four Vault sections · Trusted People and release settings · Reminders and a yearly review · Download a copy anytime · `Pause or close anytime in Account and data.` |

Buttons: steps 1–4 `Continue`; step 5 `Start My Vault` (signed out → create account, then checkout). `Step n of 5`. No other call to action, no repeated price.

## 5. Overview (hub)

- Header: eyebrow `Patriva · Secure Vault`, title `My Vault`, line `Everything important, in one secure place.`
- Readiness: the eight checks below, in this order. `pct = done / total`.
  1. at least one obligation — `add your obligations`
  2. at least one asset — `add what you own`
  3. at least one sealed document — `add a sealed document`
  4. at least one message — `record a message`
  5. at least one recipient — `add a recipient`
  6. final fallback signed — `sign the final fallback`
  7. (only while open) an asset in Registered plans / Pensions / Insurance without a Yes or No beneficiary answer — `confirm a beneficiary`
  8. (only while open) a recipient who receives something has no phone — `add a phone number for <first name>`
  9. (only while open) an item skipped in guided setup — `finish the items you skipped`
- Sentence: `Your Vault is N% ready.` / `Your Vault is ready.`
- Next step: one task, the first open check. `Next: <task>.`, or `One thing left: <task>.` when it is the last. **(rule: one task, as the app shows; desktop listed two.)**
- Buttons: primary `Start with guidance` until guided setup has been opened, then `Continue with guidance`; secondary `Go to the next item`, which opens the place of that task (the section list, or the item to fix).
- Figures: `Estate value` (across all assets) · `Obligations` (settled before distribution) · `Sealed documents` (released on your trigger) · `Messages` (voice and video). Money as `CAD 820,000`. Amanah is never counted.
- `Manage your Vault`: four rows — full name, one-line description, `N item(s)`, status `Not started` / `Needs details` / `Complete`. `Needs details` = any item skipped or missing a required answer.
- `People and release`: Trusted People (`N recipient(s) · fallback signed|not signed`), Release settings (`Nothing is released until we verify`).
- `Vault settings`: Reminders (`Never more than two a month`), Account and data (`Download a copy, pause or close`).
- Footer: `Your Will decides who inherits. Your Vault helps your executor find everything.`
- Home shows the same truth: the Vault chip is `Up to date` only at 100%, otherwise `N% ready`; the suggestion is the same next step.

## 6. Sections

| | Description | Empty title | Empty body | Add |
|---|---|---|---|---|
| Obligations Register | What you owe, so your executor can settle it first. | No obligations yet | Add any debts, zakat, mahr or other obligations you want recorded. | Add an obligation |
| Estate Inventory | Everything you own, in Canada and abroad. | No assets yet | Add your first asset to start building your estate inventory. | Add an asset |
| Sealed Documents | Private files, released only to the people you choose. | No sealed documents yet | Keep private files here. Nobody can open one before a verified release. | Add a document |
| Voice & Video Messages | Your own voice, delivered on the day you choose. | No messages yet | Record a short message, a du’a, or advice for your children. | Add a message |

- Row status: `Add details` (skipped or missing a required answer), `Confirm beneficiary`. No `Complete` / `Incomplete` on rows.
- Tap a row → the item's view (its fields, `Edit`, `Remove`). Never straight into the form.
- Filters, shown only when more than one option is in use, always starting with `All`:
  - Obligations by kind: `Debts` · `Mahr` · `Zakat owed` · `Miscellaneous obligations`
  - Estate Inventory by category in use
  - Sealed Documents and Messages by release: `On death` · `On incapacity` · `Death or incapacity` · `Milestone`
- Remove: sheet `Remove this item?`, then toast `Removed`. Save: toast `<name> saved`, back to the section list.
- Form titles: `Add an obligation` / `Edit obligation`, `Add an asset` / `Edit asset`, `Add a sealed document` / `Edit sealed document`, `Add a voice message` / `Add a video message` / `Edit voice message` / `Edit video message`.
- Save buttons: `Save` (obligation, asset) · `Seal and save` (document) · `Save message`.

## 7. Data collected

**Obligation**
- Kind (required): `Debt to a bank or company` · `Debt to a person` · `Mahr` · `Zakat owed` · `Miscellaneous`
- Depending on kind: `Which one?` (bank), `Is it deferred or unpaid?` (mahr), zakat year (zakat)
- `Owed to` / `Title` (required)
- `Amount` in CAD — optional; empty marks the item `Add details`. Hint `In CAD. An estimate is fine.` Error `Enter an amount, like 2000. An estimate is fine.`
- `Date it started` · `How to repay` · joint obligation (tick) · `Notes for your executor` · `Proof` (file) — all optional

**Asset**
- Category (required), 14: Real estate · Bank accounts · Registered plans · Pensions · Investments · Insurance · Benefits the estate can claim · Business · Vehicles · Valuables · Digital assets · Money owed to you · Held in trust (amanah) · Miscellaneous
- `Type` (optional free text, e.g. RRSP, TFSA) · Name (required) · `Approximate value` + currency (optional; hint `Rough is fine.`; error `Enter a rough value, like 42000.`) · Country (required) · Ownership: `Alone` / `Jointly`
- Amanah: `Return it to` instead of value and ownership; never counted.
- Registered plans, Pensions, Insurance: `Is a beneficiary named on it?` `Yes` / `No` / `I’m not sure` (hint `We’ll remind you to check`); if Yes, `Beneficiary’s name` (required).
- `Where the documents are` · `Notes for your executor` — optional
- Warning: `Never put passwords or PINs here. Keep them in Sealed Documents.`
- Currencies: CAD · USD · EGP · PKR · GBP · EUR · SAR · AED · Other. Totals add CAD only.
- Countries: the list in `revamp/config.js`.

**Sealed document**
- `File` · `Title` (required) · `When should it be released?` (required: On death / On incapacity / Death or incapacity) · `Who receives it?` (required, at least one, chosen from Trusted People only) · `Message to go with it` (optional)
- One object. No sub-types. **(rule: the web model; the app's Document / Private instructions / Personal message split is retired — a note is a document with a message and no file.)**

**Message**
- Kind: `Voice message` (Just your voice) / `Video message` (Your face and voice)
- `Title` (required) · recording (required, up to 10 minutes) · `When should it be delivered?` (required: On death / On incapacity / Death or incapacity / On a date / On a life event) · date `YYYY-MM-DD` or the event · for a date: what happens if you pass away before then · `Who receives it?` (required, from Trusted People)

**Person**
- `Full name` (required) · `Relationship` (required) · `Email` · `Mobile phone` · `Date of birth`
- Status: `Email missing` → `Phone missing` → `Not invited` → `Invite sent <date>` → `Accepted`
- Executors come from the Will and are invited when the Vault becomes active. Recipients are contacted only if the owner chooses `Tell them now` (`Resend invite` afterwards). **(rule: the web; the app said recipients are never contacted.)**
- Final fallback: `The Muslim Will` appoints a lawyer if no executor can act; needs a signed acceptance; `Review and sign`, then `Signed <date>`.

## 8. Release, reminders, review

- Release settings, four steps: `Someone reports` → `We verify` → `Items are released` → `<Executor> takes over`. `There is no waiting period. Release happens as soon as verification is complete.` Plus the executor order, the fallback, and counts per trigger.
- Reminders: Readiness nudges · Yearly Vault review · Ramadan and zakat · Renewal and expiry dates · Milestone dates · Life events, and two that are always on: Offers and price changes · Payment and security alerts.
- Yearly review, four steps: `Values` (Are these amounts still about right?) → `People` (Can we still reach everyone?) → `Release` (Is each item still released the right way?) → `Check-in` (Are you well?). Buttons `All correct` / `Continue` / `Finish review`. Toast `Yearly review done`. Then the Overview says `Reviewed <date>. We’ll remind you next year.`

## 9. Guided setup

Welcome → what you owe → each obligation → what you own → each asset → who receives things → if no executor can act → private documents → each document → a message → your message → review.

- Welcome: `Let’s fill your Vault together.` / `One small question at a time. About 15 minutes, and you can stop at any step.`
- Every step after the first has `Skip for now` and `Save and exit`. A skipped item stays on the list marked `Add details`.
- `Something else` under obligations is saved as Miscellaneous.
- End: `MashaAllah, your Vault has taken shape.` / `Finish and go to My Vault`.

## 10. Action words

Add · Edit · Remove · Save · View · Continue · Review · Manage · Start · Resume. One primary action per screen.
