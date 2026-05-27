/**
 * routes/transactions.js
 *
 * GET  /api/transactions          — list all transactions (optionally filter by coinId)
 * GET  /api/transactions/:id      — get a single transaction
 * GET  /api/transactions/:id/status — polling endpoint for tx status
 */

const express = require("express");
const router  = express.Router();
const db      = require("../data/db");

/* ---- GET /api/transactions ---- */
router.get("/", (req, res) => {
  let txs = db.getTransactions(req.userId);

  /* Optional filter: ?coin=btc */
  if (req.query.coin) {
    txs = txs.filter(t => t.coinId === req.query.coin.toLowerCase());
  }

  /* Optional pagination: ?page=1&limit=20 */
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const start = (page - 1) * limit;
  const slice = txs.slice(start, start + limit);

  res.json({
    total: txs.length,
    page,
    limit,
    data:  slice,
  });
});

/* ---- GET /api/transactions/:id ---- */
router.get("/:id", (req, res) => {
  const tx = db.getTransaction(req.params.id);
  if (!tx || tx.userId !== req.userId) {
    return res.status(404).json({ error: "Transaction not found." });
  }
  res.json(tx);
});

/* ---- GET /api/transactions/:id/status ---- */
router.get("/:id/status", (req, res) => {
  const tx = db.getTransaction(req.params.id);
  if (!tx || tx.userId !== req.userId) {
    return res.status(404).json({ error: "Transaction not found." });
  }
  res.json({ id: tx.id, status: tx.status, hash: tx.hash });
});

module.exports = router;
