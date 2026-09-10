/* Family Vault comparison + upgrade drawer — shared component.
   Opens from any element with [data-open-family-drawer].
   Steps: 1 compare → 2 confirm (validated) → 3 success. */
(function () {
  const css = `
  .fd-overlay {
    position: fixed;
    inset: 0;
    background: rgba(13, 27, 49, 0.45);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s ease;
    z-index: 90;
  }
  .fd-overlay.open { opacity: 1; pointer-events: auto; }
  .fd-drawer {
    position: fixed;
    top: 0;
    right: 0;
    height: 100%;
    width: 448px;
    max-width: 92vw;
    background: #F7F5F0;
    z-index: 91;
    display: flex;
    flex-direction: column;
    transform: translateX(103%);
    transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
    box-shadow: -8px 0 28.8px rgba(13, 27, 49, 0.22);
    font-family: 'Poppins', sans-serif;
    color: #16243D;
  }
  .fd-drawer.open { transform: translateX(0); }
  .fd-drawer svg { display: block; }
  .fd-head { padding: 20.8px 20.8px 14.4px; position: relative; }
  .fd-eyebrow { font-size: 9.6px; font-weight: 600; letter-spacing: 0.2em; color: #C9A45C; }
  .fd-headline {
    font-family: 'Playfair Display', serif;
    font-size: 19.2px;
    font-weight: 500;
    color: #16243D;
    margin-top: 7.2px;
    outline: none;
  }
  .fd-support { font-size: 11.6px; font-weight: 400; color: #6F7580; margin-top: 4.8px; }
  .fd-close {
    position: absolute;
    top: 14.4px;
    right: 14.4px;
    width: 28.8px;
    height: 28.8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: #3E4553;
    cursor: pointer;
  }
  .fd-close:hover { background: #EFEBE0; }
  .fd-close:active { transform: translateY(1px); }
  .fd-close:focus-visible { outline: 2px solid #C9A45C; outline-offset: 2px; }
  .fd-body { flex: 1; overflow-y: auto; padding: 0 20.8px 16px; scrollbar-width: none; }
  .fd-body::-webkit-scrollbar { display: none; }
  .fd-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 9.6px; }
  .fd-card {
    background: #FFFFFF;
    border: 0.8px solid #EAE6DC;
    border-radius: 11.2px;
    padding: 14.4px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .fd-card.gold {
    background: #FDFBF6;
    border: 1.2px solid #C9A45C;
    box-shadow: 0 4.8px 16px rgba(201, 164, 92, 0.14);
  }
  .fd-label { font-size: 8px; font-weight: 600; letter-spacing: 0.16em; color: #8A8F99; }
  .fd-card.gold .fd-label { color: #C9A45C; }
  .fd-title { font-size: 12.8px; font-weight: 600; color: #1C2B4A; margin-top: 6.4px; }
  .fd-price { font-size: 11.2px; font-weight: 500; color: #3E4553; margin-top: 3.2px; }
  .fd-list { list-style: none; margin: 9.6px 0 0; padding: 0; display: flex; flex-direction: column; gap: 5.6px; }
  .fd-list li { display: flex; align-items: center; gap: 6.4px; font-size: 10.8px; font-weight: 400; color: #3E4553; }
  .fd-list li svg { flex: none; color: #8A8F99; }
  .fd-card.gold .fd-list li svg { color: #C9A45C; }
  .fd-status {
    margin-top: 11.2px;
    background: #EFEBE0;
    color: #3E4553;
    font-size: 9.6px;
    font-weight: 600;
    padding: 3.2px 9.6px;
    border-radius: 999px;
  }
  .fd-save {
    background: #C09B4E;
    color: #FFFDF6;
    font-size: 9.6px;
    font-weight: 600;
    padding: 3.2px 9.6px;
    border-radius: 999px;
    white-space: nowrap;
  }
  .fd-card .fd-save { margin-top: 11.2px; }
  .fd-table {
    margin-top: 12.8px;
    background: #FFFFFF;
    border: 0.8px solid #EAE6DC;
    border-radius: 11.2px;
    overflow: hidden;
  }
  .fd-row { display: grid; grid-template-columns: 1fr 1fr; padding: 8.8px 14.4px; border-top: 0.8px solid #F0EDE5; }
  .fd-row:first-child { border-top: none; }
  .fd-row.head { background: #FCFAF4; }
  .fd-row span { font-size: 10.8px; font-weight: 400; color: #3E4553; }
  .fd-row span + span { font-weight: 500; color: #1C2B4A; }
  .fd-row.head span { font-size: 10.4px; font-weight: 600; color: #1C2B4A; }
  .fd-foot { padding: 12.8px 20.8px 17.6px; border-top: 0.8px solid #E5E1D6; }
  .fd-reassure { font-size: 10.4px; font-weight: 400; color: #6F7580; margin-bottom: 9.6px; }
  .fd-cta {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 35.2px;
    background: #C9A45C;
    border: none;
    border-radius: 8px;
    font-family: 'Poppins', sans-serif;
    font-size: 12px;
    font-weight: 600;
    color: #16233F;
    cursor: pointer;
  }
  .fd-cta:hover { background: #D2AE66; }
  .fd-cta:active { transform: translateY(1px); }
  .fd-cta:focus-visible { outline: 2px solid #16233F; outline-offset: 2px; }
  .fd-details, .fd-back {
    display: block;
    width: 100%;
    text-align: center;
    margin-top: 9.6px;
    font-size: 11.2px;
    font-weight: 600;
    color: #16233F;
    background: none;
    border: none;
    cursor: pointer;
    font-family: 'Poppins', sans-serif;
    text-decoration: underline;
    text-underline-offset: 2.4px;
    text-decoration-thickness: 0.8px;
  }
  .fd-details:hover, .fd-back:hover { color: #3B4A6B; }
  .fd-details:active, .fd-back:active { color: #0F1A30; }
  .fd-details:focus-visible, .fd-back:focus-visible { outline: 2px solid #C9A45C; outline-offset: 2px; }

  /* Confirm step */
  .fd-sum {
    background: #FFFFFF;
    border: 0.8px solid #EAE6DC;
    border-radius: 11.2px;
    overflow: hidden;
  }
  .fd-sum-row { display: flex; align-items: center; gap: 9.6px; padding: 10.4px 14.4px; border-top: 0.8px solid #F0EDE5; }
  .fd-sum-row:first-child { border-top: none; }
  .fd-sum-row > span:first-child { font-size: 9.6px; font-weight: 600; letter-spacing: 0.1em; color: #8A8F99; min-width: 84px; }
  .fd-sum-row strong { font-size: 11.6px; font-weight: 600; color: #1C2B4A; }
  .fd-sum-row small { font-size: 11.2px; font-weight: 400; color: #6F7580; }
  .fd-sum-row .fd-save { margin-left: auto; }
  .fd-section-label { font-size: 10.8px; font-weight: 600; color: #1C2B4A; margin-top: 16px; }
  .fd-section-sub { font-size: 10.4px; font-weight: 400; color: #6F7580; margin-top: 2.4px; }
  .fd-members { margin-top: 9.6px; display: flex; flex-direction: column; gap: 8px; }
  .fd-member-row { display: flex; align-items: center; gap: 8px; }
  .fd-input {
    flex: 1;
    height: 35.2px;
    padding: 0 11.2px;
    background: #FFFFFF;
    border: 0.8px solid #DDD9CF;
    border-radius: 8px;
    font-family: 'Poppins', sans-serif;
    font-size: 11.6px;
    color: #16243D;
  }
  .fd-input::placeholder { color: #9CA1AB; }
  .fd-input:focus { outline: none; border-color: #C9A45C; box-shadow: 0 0 0 2.4px rgba(201, 164, 92, 0.25); }
  .fd-input.invalid { border-color: #B3413A; }
  .fd-remove {
    width: 28.8px;
    height: 28.8px;
    min-width: 28.8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: #8A8F99;
    cursor: pointer;
  }
  .fd-remove:hover { background: #EFEBE0; color: #3E4553; }
  .fd-remove:focus-visible { outline: 2px solid #C9A45C; outline-offset: 2px; }
  .fd-add {
    display: flex;
    align-items: center;
    gap: 6.4px;
    margin-top: 8px;
    background: none;
    border: none;
    font-family: 'Poppins', sans-serif;
    font-size: 10.8px;
    font-weight: 600;
    color: #16233F;
    cursor: pointer;
    padding: 4px 0;
  }
  .fd-add:hover { color: #3B4A6B; }
  .fd-add:focus-visible { outline: 2px solid #C9A45C; outline-offset: 2px; }
  .fd-add[disabled] { color: #9CA1AB; cursor: default; }
  .fd-ack { display: flex; align-items: flex-start; gap: 8px; margin-top: 16px; }
  .fd-ack input {
    width: 12.8px;
    height: 12.8px;
    margin-top: 2.4px;
    accent-color: #C9A45C;
  }
  .fd-ack input:focus-visible { outline: 2px solid #C9A45C; outline-offset: 2px; }
  .fd-ack label { font-size: 10.8px; font-weight: 400; color: #3E4553; cursor: pointer; }
  .fd-err { font-size: 10.4px; font-weight: 400; color: #B3413A; margin-top: 4.8px; }
  .fd-err[hidden] { display: none; }

  /* Success step */
  .fd-success { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 24px 9.6px 9.6px; }
  .fd-success-icon {
    width: 44.8px;
    height: 44.8px;
    border-radius: 999px;
    background: #FDFBF6;
    border: 1.2px solid #C9A45C;
    color: #C9A45C;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .fd-success p { font-size: 11.6px; font-weight: 400; color: #3E4553; line-height: 18.4px; margin-top: 12.8px; max-width: 320px; }
  `;

  const check = (w) =>
    `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`;
  const arrow =
    '<svg width="14.4" height="14.4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>';
  const xIcon = (w) =>
    `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>`;

  const html = `
  <div class="fd-drawer" role="dialog" aria-modal="true" aria-labelledby="fd-headline" hidden>
    <div class="fd-head">
      <div class="fd-eyebrow">FAMILY VAULT</div>
      <h2 class="fd-headline" id="fd-headline" tabindex="-1"></h2>
      <p class="fd-support"></p>
      <button class="fd-close" type="button" aria-label="Close drawer">${xIcon(14.4)}</button>
    </div>

    <div class="fd-body">
      <!-- STEP 1 — compare -->
      <div class="fd-step" data-step="1">
        <div class="fd-cols">
          <div class="fd-card">
            <div class="fd-label">CURRENT PLAN</div>
            <div class="fd-title">Individual Vault</div>
            <div class="fd-price">$5.99 CAD / month</div>
            <ul class="fd-list">
              <li>${check(11.2)}1 member</li>
              <li>${check(11.2)}Personal Vault access</li>
              <li>${check(11.2)}Secure document storage</li>
              <li>${check(11.2)}Estate organization tools</li>
            </ul>
            <span class="fd-status">Active</span>
          </div>
          <div class="fd-card gold">
            <div class="fd-label">RECOMMENDED FOR FAMILIES</div>
            <div class="fd-title">Family Vault</div>
            <div class="fd-price">Family pricing</div>
            <ul class="fd-list">
              <li>${check(11.2)}Up to 5 members</li>
              <li>${check(11.2)}Family member access</li>
              <li>${check(11.2)}Shared estate organization</li>
              <li>${check(11.2)}Secure document storage</li>
              <li>${check(11.2)}Lower cost per person</li>
            </ul>
            <span class="fd-save">Save 33% per person</span>
          </div>
        </div>
        <div class="fd-table">
          <div class="fd-row head"><span>Individual Vault</span><span>Family Vault</span></div>
          <div class="fd-row"><span>1 member</span><span>Up to 5 members</span></div>
          <div class="fd-row"><span>Personal access</span><span>Family access</span></div>
          <div class="fd-row"><span>Standard individual pricing</span><span>Save 33% per person</span></div>
        </div>
      </div>

      <!-- STEP 2 — confirm -->
      <div class="fd-step" data-step="2" hidden>
        <div class="fd-sum">
          <div class="fd-sum-row">
            <span>CURRENT</span>
            <strong>Individual Vault</strong>
            <small>$5.99 CAD / month</small>
          </div>
          <div class="fd-sum-row">
            <span>NEW PLAN</span>
            <strong>Family Vault</strong>
            <small>Family pricing</small>
            <span class="fd-save">Save 33% per person</span>
          </div>
        </div>

        <div class="fd-section-label">Invite family members <span style="font-weight:400;color:#8A8F99;">(optional)</span></div>
        <div class="fd-section-sub">You can invite up to 4 members now, or add them later from your Vault.</div>
        <div class="fd-members"></div>
        <button class="fd-add" type="button">
          <svg width="11.2" height="11.2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
          Add another member
        </button>

        <div class="fd-ack">
          <input type="checkbox" id="fd-ack-box">
          <label for="fd-ack-box">I understand my subscription will change from Individual Vault to Family Vault pricing.</label>
        </div>
        <div class="fd-err" id="fd-ack-err" hidden>Please confirm you understand the plan change before continuing.</div>
      </div>

      <!-- STEP 3 — success -->
      <div class="fd-step" data-step="3" hidden>
        <div class="fd-success">
          <div class="fd-success-icon">${check(19.2)}</div>
          <p id="fd-success-msg">We&rsquo;ve received your upgrade request. Your current Vault stays active until the upgrade is confirmed.</p>
        </div>
      </div>
    </div>

    <div class="fd-foot">
      <!-- FOOT 1 -->
      <div class="fd-foot-step" data-step="1">
        <p class="fd-reassure">Your current Vault stays active until you confirm the upgrade.</p>
        <button class="fd-cta" type="button" data-action="to-confirm">Switch to Family Vault ${arrow}</button>
        <a class="fd-details" href="plans.html#family">View full plan details</a>
      </div>
      <!-- FOOT 2 -->
      <div class="fd-foot-step" data-step="2" hidden>
        <p class="fd-reassure">Nothing changes until you confirm. Your current Vault stays active.</p>
        <button class="fd-cta" type="button" data-action="confirm">Confirm upgrade ${arrow}</button>
        <button class="fd-back" type="button" data-action="back">Back to comparison</button>
      </div>
      <!-- FOOT 3 -->
      <div class="fd-foot-step" data-step="3" hidden>
        <button class="fd-cta" type="button" data-action="done">Done</button>
      </div>
    </div>
  </div>`;

  const HEAD_COPY = {
    1: ['Is Family Vault right for you?', 'Compare your current Vault with Family Vault before making a decision.'],
    2: ['Confirm your upgrade', 'Review the change to your Vault plan before we process it.'],
    3: ['Upgrade request received', ''],
  };

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.className = 'fd-overlay';
  document.body.appendChild(overlay);

  const wrap = document.createElement('div');
  wrap.innerHTML = html;
  const drawer = wrap.firstElementChild;
  document.body.appendChild(drawer);

  const closeBtn = drawer.querySelector('.fd-close');
  const headline = drawer.querySelector('.fd-headline');
  const support = drawer.querySelector('.fd-support');
  const membersBox = drawer.querySelector('.fd-members');
  const addBtn = drawer.querySelector('.fd-add');
  const ackBox = drawer.querySelector('#fd-ack-box');
  const ackErr = drawer.querySelector('#fd-ack-err');
  let lastFocus = null;
  let isOpen = false;
  let step = 1;

  /* ---------- member rows ---------- */
  const MAX_MEMBERS = 4;
  function memberRows() {
    return Array.from(membersBox.querySelectorAll('.fd-member-row'));
  }
  function addMemberRow(focus) {
    if (memberRows().length >= MAX_MEMBERS) return;
    const row = document.createElement('div');
    row.className = 'fd-member-row';
    row.innerHTML = `
      <input class="fd-input" type="email" placeholder="member@email.com" aria-label="Family member email">
      <button class="fd-remove" type="button" aria-label="Remove this member">${xIcon(12)}</button>`;
    const err = document.createElement('div');
    err.className = 'fd-err';
    err.hidden = true;
    membersBox.appendChild(row);
    membersBox.appendChild(err);
    const input = row.querySelector('.fd-input');
    input.addEventListener('input', () => {
      input.classList.remove('invalid');
      err.hidden = true;
    });
    row.querySelector('.fd-remove').addEventListener('click', () => {
      err.remove();
      row.remove();
      if (!memberRows().length) addMemberRow(false);
      addBtn.disabled = memberRows().length >= MAX_MEMBERS;
      addBtn.focus();
    });
    addBtn.disabled = memberRows().length >= MAX_MEMBERS;
    if (focus) input.focus();
  }
  addBtn.addEventListener('click', () => addMemberRow(true));

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function validateConfirmStep() {
    let firstBad = null;
    const seen = new Set();
    memberRows().forEach((row) => {
      const input = row.querySelector('.fd-input');
      const err = row.nextElementSibling;
      const value = input.value.trim();
      let message = '';
      if (value) {
        if (!EMAIL_RE.test(value)) message = 'Please enter a valid email address.';
        else if (seen.has(value.toLowerCase())) message = 'This email has already been added.';
        else seen.add(value.toLowerCase());
      }
      input.classList.toggle('invalid', !!message);
      err.textContent = message;
      err.hidden = !message;
      if (message && !firstBad) firstBad = input;
    });
    if (!ackBox.checked) {
      ackErr.hidden = false;
      if (!firstBad) firstBad = ackBox;
    } else {
      ackErr.hidden = true;
    }
    if (firstBad) {
      firstBad.focus();
      return null;
    }
    return { members: Array.from(seen) };
  }
  ackBox.addEventListener('change', () => { if (ackBox.checked) ackErr.hidden = true; });

  /* ---------- steps ---------- */
  function showStep(next) {
    step = next;
    drawer.querySelectorAll('.fd-step').forEach((el) => { el.hidden = el.dataset.step !== String(next); });
    drawer.querySelectorAll('.fd-foot-step').forEach((el) => { el.hidden = el.dataset.step !== String(next); });
    headline.textContent = HEAD_COPY[next][0];
    support.textContent = HEAD_COPY[next][1];
    support.hidden = !HEAD_COPY[next][1];
    drawer.querySelector('.fd-body').scrollTop = 0;
    if (next === 2) {
      if (!memberRows().length) addMemberRow(false);
      headline.focus();
    } else if (next === 3) {
      headline.focus();
    }
  }
  function resetFlow() {
    memberRows().forEach((row) => { row.nextElementSibling.remove(); row.remove(); });
    ackBox.checked = false;
    ackErr.hidden = true;
    addBtn.disabled = false;
    showStep(1);
  }

  /* ---------- open / close ---------- */
  function focusables() {
    return Array.from(
      drawer.querySelectorAll('button, a[href], input, [tabindex="-1"]:focus')
    ).filter((el) => !el.disabled && el.offsetParent !== null);
  }
  function open(trigger) {
    lastFocus = trigger || document.activeElement;
    resetFlow();
    drawer.hidden = false;
    requestAnimationFrame(() => {
      overlay.classList.add('open');
      drawer.classList.add('open');
    });
    document.body.style.overflow = 'hidden';
    isOpen = true;
    closeBtn.focus();
    document.addEventListener('keydown', onKeydown, true);
  }
  function close() {
    if (!isOpen) return;
    isOpen = false;
    overlay.classList.remove('open');
    drawer.classList.remove('open');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKeydown, true);
    drawer.addEventListener('transitionend', () => { if (!isOpen) drawer.hidden = true; }, { once: true });
    if (lastFocus) lastFocus.focus();
  }
  function onKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === 'Tab') {
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (!drawer.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  overlay.addEventListener('click', close);
  closeBtn.addEventListener('click', close);

  drawer.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'to-confirm') showStep(2);
    if (action === 'back') showStep(1);
    if (action === 'done') close();
    if (action === 'confirm') {
      const payload = validateConfirmStep();
      if (!payload) return;
      // TODO: connect the billing API here — submit { plan: 'family', members: payload.members }.
      // Nothing is charged or changed client-side; this only records the upgrade request.
      const msg = drawer.querySelector('#fd-success-msg');
      msg.textContent = payload.members.length
        ? `We’ve received your upgrade request and will invite ${payload.members.length} ${payload.members.length === 1 ? 'member' : 'members'} once Family Vault is active. Your current Vault stays active until the upgrade is confirmed.`
        : 'We’ve received your upgrade request. Your current Vault stays active until the upgrade is confirmed.';
      showStep(3);
    }
  });

  /* "View full plan details": on the plans page, apply the Family Vault filter in place;
     elsewhere navigate to plans.html#family (the page applies the filter from the hash). */
  drawer.querySelector('.fd-details').addEventListener('click', (e) => {
    const familyPill = document.querySelector('.filter-pill[data-filter="family"]');
    if (familyPill) {
      e.preventDefault();
      close();
      familyPill.click();
      familyPill.focus();
    }
  });

  document.querySelectorAll('[data-open-family-drawer]').forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      open(trigger);
    });
  });
})();
