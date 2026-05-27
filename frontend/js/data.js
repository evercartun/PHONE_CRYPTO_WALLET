/**
 * data.js — Static coin definitions & simulated data generation
 * In a real app, this would be fetched from the backend API.
 */

const COINS = [
  { id: "btc",  name: "Bitcoin",   symbol: "BTC",  color: "#F7931A", bg: "#FFF4E6", basePrice: 67420.50, change: 2.34,  icon: "₿" },
  { id: "eth",  name: "Ethereum",  symbol: "ETH",  color: "#627EEA", bg: "#EEF1FD", basePrice: 3521.80,  change: -1.12, icon: "Ξ" },
  { id: "sol",  name: "Solana",    symbol: "SOL",  color: "#9945FF", bg: "#F3EEFF", basePrice: 182.40,   change: 5.67,  icon: "◎" },
  { id: "usdc", name: "USD Coin",  symbol: "USDC", color: "#2775CA", bg: "#EBF3FB", basePrice: 1.00,     change: 0.01,  icon: "$" },
  { id: "ada",  name: "Cardano",   symbol: "ADA",  color: "#0D1E2D", bg: "#E8EDF2", basePrice: 0.612,    change: -0.45, icon: "₳" },
];

const INITIAL_BALANCES = {
  btc:  0.4821,
  eth:  3.142,
  sol:  48.5,
  usdc: 1200.0,
  ada:  3500,
};

/**
 * Generate a set of fake historical transactions.
 * @param {number} count - how many to generate
 * @returns {Array} transaction objects
 */
function generateTransactions(count = 18) {
  const txs = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const coin   = COINS[Math.floor(Math.random() * COINS.length)];
    const type   = Math.random() > 0.5 ? "receive" : "send";
    const maxAmt = coin.id === "usdc" ? 500 : coin.id === "btc" ? 0.05 : 2;
    const amount = parseFloat((Math.random() * maxAmt + 0.001).toFixed(4));
    const addr   = `0x${randHex(8)}...${randHex(4)}`;

    txs.push({
      id:       `tx-${i}-${Date.now()}`,
      coin:     coin.id,
      type,
      amount,
      usdValue: amount * coin.basePrice,
      address:  addr,
      time:     new Date(now - i * 3_600_000 * (Math.random() * 24)).toISOString(),
      status:   i < 2 ? "pending" : "confirmed",
    });
  }

  return txs.sort((a, b) => new Date(b.time) - new Date(a.time));
}

/** Random hex string of given length */
function randHex(len) {
  return Math.random().toString(16).slice(2, 2 + len).toUpperCase().padEnd(len, "0");
}
