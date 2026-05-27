/**
 * server.js — CryptoVault Backend (Node.js + Express)
 *
 * Simulates a real crypto wallet backend API.
 * In production you would connect to a real blockchain node
 * (e.g. Infura for Ethereum, Bitcoin Core RPC, etc.)
 *
 * Run:
 *   npm install
 *   node server.js
 *
 * API base: http://localhost:3000/api
 */

const express    = require("express");
const cors       = require("cors");
const helmet     = require("helmet");
const morgan     = require("morgan");
const path       = require("path");

const walletRoutes      = require("./routes/wallet");
const priceRoutes       = require("./routes/prices");
const transactionRoutes = require("./routes/transactions");
const authMiddleware    = require("./middleware/auth");
const errorHandler      = require("./middleware/errorHandler");

const app  = express();
const PORT = process.env.PORT || 3000;

/* ---- Middleware ---- */
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "*" }));
app.use(express.json());
app.use(morgan("dev"));

/* ---- Serve frontend ---- */
app.use(express.static(path.join(__dirname, "../frontend")));

/* ---- API Routes ---- */
// Auth is applied per-route (public routes: prices)
app.use("/api/prices",       priceRoutes);
app.use("/api/wallet",       authMiddleware, walletRoutes);
app.use("/api/transactions", authMiddleware, transactionRoutes);

/* ---- Catch-all: serve index.html for SPA ---- */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

/* ---- Error Handler (must be last) ---- */
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🚀 CryptoVault server running at http://localhost:${PORT}`);
  console.log(`   API:      http://localhost:${PORT}/api`);
  console.log(`   Frontend: http://localhost:${PORT}\n`);
});

module.exports = app;
