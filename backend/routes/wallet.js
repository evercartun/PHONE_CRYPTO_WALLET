/**
 * routes/wallet.js
 *
 * GET  /api/wallet          — get wallet info (address, balances, total USD)
 * POST /api/wallet/send     — send crypto
 */

const express = require("express");
const router  = express.Router();
const db      = require("../data/db");
const { getPrices } = require("./prices");

/* ---- GET /api/wallet ---- */
router.get("/", (req, res) => {
  const wallet   = db.getWallet(req.userId);
  const prices   = getPrices();

  const balancesWithUSD = Object.entries(wallet.balances).map(([coinId, amount]) => ({
    coinId,
    amount,
    usdValue: amount * (prices[coinId] || 0),
  }));

  const totalUSD = balancesWithUSD.reduce((s, b) => s + b.usdValue, 0);

  res.json({
    address:   wallet.address,
    balances:  balancesWithUSD,
    totalUSD,
    updatedAt: new Date().toISOString(),
  });
});

/* ---- POST /api/wallet/send ---- */
router.post("/send", (req, res) => {
  const { coinId, toAddress, amount } = req.body;
  const wallet = db.getWallet(req.userId);
  const prices = getPrices();

  /* --- Validation --- */
  if (!coinId || !toAddress || !amount) {
    return res.status(400).json({ error: "coinId, toAddress and amount are required." });
  }
  const amt = parseFloat(amount);
  if (isNaN(amt) || amt <= 0) {
    return res.status(400).json({ error: "amount must be a positive number." });
  }
  const currentBalance = wallet.balances[coinId] || 0;
  if (amt > currentBalance) {
    return res.status(400).json({ error: "Insufficient balance." });
  }

  /* --- Execute --- */
  const networkFee = 0.000021; // simulated
  wallet.balances[coinId] -= (amt + networkFee);

  const tx = {
    id:         `tx-${Date.now()}`,
    userId:     req.userId,
    coinId,
    type:       "send",
    amount:     amt,
    fee:        networkFee,
    usdValue:   amt * (prices[coinId] || 0),
    toAddress,
    fromAddress: wallet.address,
    time:        new Date().toISOString(),
    status:      "pending",
    hash:        `0x${randomHex(64)}`,
  };

  db.addTransaction(tx);
  db.saveWallet(req.userId, wallet);

  // Simulate confirmation after 8s
  setTimeout(() => {
    tx.status = "confirmed";
    db.updateTransaction(tx.id, { status: "confirmed" });
  }, 8000);

  res.status(201).json({ transaction: tx });
});

function randomHex(len) {
  return [...Array(len)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");
}

module.exports = router;
