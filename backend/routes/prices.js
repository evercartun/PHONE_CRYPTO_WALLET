/**
 * routes/prices.js
 *
 * GET /api/prices       — all coin prices
 * GET /api/prices/:id   — single coin price
 *
 * Public (no auth required).
 * Prices are simulated and tick every 2s server-side.
 */

const express = require("express");
const router  = express.Router();

/* ---- Coin definitions ---- */
const COINS = [
  { id: "btc",  name: "Bitcoin",   symbol: "BTC",  basePrice: 67420.50 },
  { id: "eth",  name: "Ethereum",  symbol: "ETH",  basePrice: 3521.80  },
  { id: "sol",  name: "Solana",    symbol: "SOL",  basePrice: 182.40   },
  { id: "usdc", name: "USD Coin",  symbol: "USDC", basePrice: 1.00     },
  { id: "ada",  name: "Cardano",   symbol: "ADA",  basePrice: 0.612    },
];

/* ---- In-memory price state ---- */
let _prices = Object.fromEntries(COINS.map(c => [c.id, c.basePrice]));

/* Tick prices every 2 seconds */
setInterval(() => {
  COINS.forEach(c => {
    const delta  = (Math.random() - 0.499) * c.basePrice * 0.0008;
    _prices[c.id] = Math.max(0.0001, _prices[c.id] + delta);
  });
}, 2000);

/* Exported for use in wallet route */
function getPrices() { return { ..._prices }; }

/* ---- GET /api/prices ---- */
router.get("/", (req, res) => {
  const result = COINS.map(c => ({
    ...c,
    price:       _prices[c.id],
    change24h:   getChange(c.id),
    updatedAt:   new Date().toISOString(),
  }));
  res.json(result);
});

/* ---- GET /api/prices/:id ---- */
router.get("/:id", (req, res) => {
  const coin = COINS.find(c => c.id === req.params.id.toLowerCase());
  if (!coin) return res.status(404).json({ error: "Coin not found." });

  res.json({
    ...coin,
    price:     _prices[coin.id],
    change24h: getChange(coin.id),
    updatedAt: new Date().toISOString(),
  });
});

/* Simulate a 24h change % */
const _changes = Object.fromEntries(COINS.map(c => [c.id, (Math.random() * 10 - 5).toFixed(2)]));
function getChange(id) { return parseFloat(_changes[id]); }

module.exports = router;
module.exports.getPrices = getPrices;
