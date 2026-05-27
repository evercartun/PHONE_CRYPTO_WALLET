# CryptoVault — Simulated Crypto Wallet

A full-stack crypto wallet demo with a **Node.js/Express backend** and a
**vanilla HTML/CSS/JS frontend**.

---

## Project Structure

```
crypto-wallet/
├── package.json
├── README.md
│
├── frontend/                   ← Static frontend (no build step needed)
│   ├── index.html              ← Single HTML shell
│   ├── css/
│   │   └── styles.css          ← All styles (variables, layout, components, animations)
│   └── js/
│       ├── data.js             ← Coin definitions & tx generator
│       ├── wallet.js           ← State machine / business logic (event-emitter pattern)
│       ├── ui.js               ← Pure DOM rendering helpers
│       └── app.js              ← Main controller – wires wallet ↔ ui
│
└── backend/                    ← Express REST API
    ├── server.js               ← Entry point, middleware setup
    ├── routes/
    │   ├── wallet.js           ← GET /api/wallet, POST /api/wallet/send
    │   ├── prices.js           ← GET /api/prices, GET /api/prices/:id
    │   └── transactions.js     ← GET /api/transactions, GET /api/transactions/:id
    ├── middleware/
    │   ├── auth.js             ← Bearer-token auth (swap with real JWT in prod)
    │   └── errorHandler.js     ← Global error handler
    └── data/
        └── db.js               ← In-memory store (swap with PostgreSQL in prod)
```

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Run the server
```bash
# Production
npm start

# Development (auto-restart on changes)
npm run dev
```

### 3. Open the app
Navigate to **http://localhost:3000** in your browser.

---

## API Reference

All API routes are prefixed with `/api`.

### Prices (public — no auth)
| Method | Endpoint            | Description            |
|--------|---------------------|------------------------|
| GET    | `/api/prices`       | All coin prices        |
| GET    | `/api/prices/:id`   | Single coin price      |

### Wallet (requires `Authorization: Bearer demo-token-<userId>`)
| Method | Endpoint            | Description                       |
|--------|---------------------|-----------------------------------|
| GET    | `/api/wallet`       | Balances + total USD              |
| POST   | `/api/wallet/send`  | Send crypto (body: coinId, toAddress, amount) |

### Transactions (requires auth)
| Method | Endpoint                        | Description                |
|--------|---------------------------------|----------------------------|
| GET    | `/api/transactions`             | List all (filter: `?coin=btc&page=1&limit=20`) |
| GET    | `/api/transactions/:id`         | Get one                    |
| GET    | `/api/transactions/:id/status`  | Poll confirmation status   |

---

## Frontend Architecture

The frontend uses a **3-layer separation** with no framework or build tools:

| File        | Role                                                     |
|-------------|----------------------------------------------------------|
| `data.js`   | Static config (coin list, initial balances, tx factory)  |
| `wallet.js` | State + logic module with a simple event-emitter. Exposes `Wallet.send()`, `Wallet.getCoinData()`, etc. |
| `ui.js`     | Pure rendering functions — never read state themselves   |
| `app.js`    | Controller — subscribes to `Wallet` events, calls `ui.js` renderers, handles DOM events |

### Data Flow
```
User action (click)
  → app.js handler
    → Wallet.send() / Wallet.getBalances()
      → Wallet emits events (balancesUpdated, transactionAdded …)
        → app.js listener calls ui.js renderer
          → DOM updated
```

---

## Upgrading to Real Blockchain

To wire this up to a real blockchain:

1. **Prices** — Replace the ticker in `routes/prices.js` with calls to CoinGecko or CryptoCompare API.
2. **Balances** — In `routes/wallet.js`, query an Ethereum node (via [ethers.js](https://docs.ethers.org/) + Infura) for real on-chain balances.
3. **Send** — Sign transactions client-side with MetaMask / WalletConnect, broadcast via `eth_sendRawTransaction`.
4. **Database** — Swap `data/db.js` with PostgreSQL + Prisma for persistent storage.
5. **Auth** — Replace the demo token in `middleware/auth.js` with proper `jsonwebtoken` + bcrypt password hashing.

---

## Tech Stack

| Layer    | Tech                             |
|----------|----------------------------------|
| Frontend | HTML5, CSS3, Vanilla JS (ES6+)   |
| Backend  | Node.js 18+, Express 4           |
| Security | helmet, cors, bearer-token auth  |
| Logging  | morgan                           |
| Dev      | nodemon, jest, supertest         |
