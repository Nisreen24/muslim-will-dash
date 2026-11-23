/* Mock backend for the prototype.
   BACKEND: replace each function with a call to the live API. The UI only depends on the shapes returned here.
   Demo failures are switched on from the prototype panel (MW_API.fail.*). */
(function () {
  'use strict';
  var fail = { pricing: false, payment: false };

  function later(ms, fn) { return new Promise(function (res, rej) { setTimeout(function () { try { res(fn()); } catch (e) { rej(e); } }, ms); }); }

  window.MW_API = {
    fail: fail,

    // GET /products/vault/pricing  → { price, currency, interval, trialDays }
    // The amount below is mock data for the prototype only.
    fetchVaultPricing: function () {
      return later(700, function () {
        if (fail.pricing) throw new Error('pricing_unavailable');
        return { productId: 'vault', name: 'My Vault', price: 7.99, currency: 'CAD', interval: 'month', taxNote: 'Taxes are added at checkout where they apply.' };
      });
    },

    // POST /subscriptions  { productId, paymentMethod }  → { status, subscriptionId }
    startSubscription: function (payload) {
      return later(1200, function () {
        if (fail.payment) throw new Error('payment_declined');
        return { status: 'active', subscriptionId: 'sub_' + Math.random().toString(36).slice(2, 10), productId: payload.productId };
      });
    },

    // GET /vault  → the holder's Vault. The prototype keeps it in localStorage (see store.js).
    loadVault: function () { return later(450, function () { return true; }); }
  };
})();
