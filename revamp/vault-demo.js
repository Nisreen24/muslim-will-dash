/* Prototype presets for the Vault's subscription and review states. Not part of the product. */
'use strict';
(function () {
  function full(over) { return function () { sample(function (s) { allDone(s); s.will.status = 'complete'; demoVault(s, 'full'); s.vault.execInv = { sent: 'Nov 2, 2026', accepted: true }; s.invited[0].accepted = true; over(s); }); go('#/vault'); }; }
  DEMO['v-healthy'] = full(function () {});
  DEMO['v-review'] = full(function (s) { delete s.vault.reviewed; });
  DEMO['v-failed'] = full(function (s) { s.vault.billing = 'failed'; });
  DEMO['v-paused'] = full(function (s) { s.vault.paused = true; });
  DEMO['v-closed'] = full(function (s) { s.vault.active = false; s.vault.closed = true; });
})();
