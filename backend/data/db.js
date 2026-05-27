/**
 * data/db.js
 *
 * In-memory data store — simulates a real database.
 *
 * In production, replace with:
 *   - PostgreSQL (via pg / Prisma) for wallets & transactions
 *   - Redis for caching prices
 *   - A blockchain node (Infura/Alchemy) for real on-chain data
 */

/* ---- Seed Data ---- */
const _wallets = {
  "demo-user-1": {
    address:  "0x7F3A9C4E2D81F630B92CA5E74D3F10B8C6E2D4A1",
    balances: {
      btc:  0.4821,
      eth:  3.142,
      sol:  48.5,
      usdc: 1200.0,
      ada:  3500,
    },
  },
};

let _transactions = _generateSeedTxs();

/* ---- Wallet CRUD ---- */
function getWallet(userId) {
  if (!_wallets[userId]) {
    /* Auto-create wallet for new user */
    _wallets[userId] = {
      address:  `0x${randomHex(40)}`,
      balances: { btc: 0, eth: 0, sol: 0, usdc: 0, ada: 0 },
    };
  }
  return _wallets[userId];
}

function saveWallet(userId, wallet) {
  _wallets[userId] = wallet;
}

/* ---- Transaction CRUD ---- */
function getTransactions(userId) {
  return _transactions
    .filter(t => t.userId === userId)
    .sort((a, b) => new Date(b.time) - new Date(a.time));
}

function getTransaction(txId) {
  return _transactions.find(t => t.id === txId) || null;
}

function addTransaction(tx) {
  _transactions.unshift(tx);
}

function updateTransaction(txId, patch) {
  const tx = _transactions.find(t => t.id === txId);
  if (tx) Object.assign(tx, patch);
}

/* ---- Seed Helpers ---- */
function _generateSeedTxs() {
  const coins  = ["btc","eth","sol","usdc","ada"];
  const types  = ["send","receive"];
  const txs    = [];
  const now    = Date.now();
  const prices = { btc:67420, eth:3521, sol:182, usdc:1, ada:0.612 };

  for (let i = 0; i < 18; i++) {
    const coinId  = coins[Math.floor(Math.random() * coins.length)];
    const type    = types[Math.floor(Math.random() * 2)];
    const maxAmt  = coinId === "usdc" ? 500 : coinId === "btc" ? 0.05 : 2;
    const amount  = parseFloat((Math.random() * maxAmt + 0.001).toFixed(4));

    txs.push({
      id:          `tx-seed-${i}`,
      userId:      "demo-user-1",
      coinId,
      type,
      amount,
      fee:         0.000021,
      usdValue:    amount * prices[coinId],
      toAddress:   `0x${randomHex(8)}...${randomHex(4)}`,
      fromAddress: "0x7F3A9C4E2D81F630B92CA5E74D3F10B8C6E2D4A1",
      time:        new Date(now - i * 3_600_000 * (1 + Math.random())).toISOString(),
      status:      i < 2 ? "pending" : "confirmed",
      hash:        `0x${randomHex(64)}`,
    });
  }
  return txs;
}

function randomHex(len) {
  return [...Array(len)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");
}

module.exports = {
  getWallet,
  saveWallet,
  getTransactions,
  getTransaction,
  addTransaction,
  updateTransaction,
};
