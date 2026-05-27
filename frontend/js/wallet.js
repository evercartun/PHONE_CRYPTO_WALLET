/**
 * wallet.js — Core wallet state & business logic
 * Simulates what a real blockchain wallet backend would provide.
 */

const Wallet = (() => {

  /* ---- Internal State ---- */
  let _balances  = { ...INITIAL_BALANCES };
  let _prices    = Object.fromEntries(COINS.map(c => [c.id, c.basePrice]));
  let _txs       = generateTransactions(18);
  let _address   = "0x7F3A9C4E2D81F630B92CA5E74D3F10B8C6E2D4A1";
  let _tickTimer = null;
  let _listeners = {};

  /* ---- Event Emitter ---- */
  function on(event, cb)   { (_listeners[event] = _listeners[event] || []).push(cb); }
  function emit(event, data) { (_listeners[event] || []).forEach(cb => cb(data)); }

  /* ---- Price Simulation ---- */
  function startPriceTicker(intervalMs = 2000) {
    _tickTimer = setInterval(() => {
      COINS.forEach(c => {
        const delta    = (Math.random() - 0.499) * c.basePrice * 0.0008;
        _prices[c.id]  = Math.max(0.0001, _prices[c.id] + delta);
      });
      emit("pricesUpdated", { ..._prices });
    }, intervalMs);
  }

  function stopPriceTicker() { clearInterval(_tickTimer); }

  /* ---- Computed ---- */
  function getTotalUSD() {
    return COINS.reduce((sum, c) => sum + (_balances[c.id] || 0) * _prices[c.id], 0);
  }

  function getCoinData() {
    return COINS.map(c => ({
      ...c,
      balance:  _balances[c.id] || 0,
      price:    _prices[c.id],
      usdValue: (_balances[c.id] || 0) * _prices[c.id],
    })).sort((a, b) => b.usdValue - a.usdValue);
  }

  /* ---- Transactions ---- */
  function getTransactions(coinId = null) {
    return coinId ? _txs.filter(t => t.coin === coinId) : _txs;
  }

  /**
   * Send crypto.
   * Returns { ok: true } or { ok: false, error: string }
   */
  function send({ coinId, toAddress, amount }) {
    const amt = parseFloat(amount);

    if (!toAddress || !toAddress.trim())         return { ok: false, error: "Enter a recipient address." };
    if (isNaN(amt) || amt <= 0)                  return { ok: false, error: "Enter a valid amount." };
    if (amt > (_balances[coinId] || 0))           return { ok: false, error: "Insufficient balance." };

    // Deduct balance
    _balances[coinId] -= amt;

    // Record transaction
    const coin = COINS.find(c => c.id === coinId);
    const tx = {
      id:       `tx-${Date.now()}`,
      coin:     coinId,
      type:     "send",
      amount:   amt,
      usdValue: amt * _prices[coinId],
      address:  toAddress,
      time:     new Date().toISOString(),
      status:   "pending",
    };
    _txs.unshift(tx);

    emit("transactionAdded", tx);
    emit("balancesUpdated",  { ..._balances });

    // Simulate confirmation after 8 seconds
    setTimeout(() => {
      tx.status = "confirmed";
      emit("transactionConfirmed", tx);
    }, 8000);

    return { ok: true, tx };
  }

  /* ---- Public API ---- */
  return {
    on,
    getAddress:    () => _address,
    getPrices:     () => ({ ..._prices }),
    getBalances:   () => ({ ..._balances }),
    getTotalUSD,
    getCoinData,
    getTransactions,
    send,
    startPriceTicker,
    stopPriceTicker,
  };

})();
