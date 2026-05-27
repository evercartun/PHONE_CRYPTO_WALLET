/**
 * ui.js — DOM rendering helpers
 * Pure functions that build and update UI from wallet data.
 */

/* ============================================================
   FORMAT HELPERS
   ============================================================ */
const fmt    = (n, d = 2) => Number(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtUSD = n => "$" + fmt(n);
const fmtCoin= (n, d = 4) => fmt(n, d);

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60)    return `${Math.floor(diff)}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/* ============================================================
   SPARKLINE
   ============================================================ */
function buildSparkline(positive, color) {
  const pts = Array.from({ length: 12 }, (_, i) => {
    const base = 40 + Math.sin(i * 0.8) * 15 + Math.random() * 10;
    return positive
      ? 60 - base * 0.5 + i * 1.5
      : 60 - base * 0.5 - i * 1.2 + Math.random() * 8;
  });
  const min  = Math.min(...pts), max = Math.max(...pts);
  const norm = pts.map(p => 28 - ((p - min) / (max - min)) * 24);
  const W    = 80, step = W / (pts.length - 1);
  const path = norm.map((y, i) => `${i === 0 ? "M" : "L"} ${i * step} ${y}`).join(" ");
  const area = `${path} L ${(pts.length - 1) * step} 32 L 0 32 Z`;
  const gid  = `g${color.replace("#", "")}`;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", W);
  svg.setAttribute("height", 32);
  svg.setAttribute("viewBox", `0 0 ${W} 32`);
  svg.setAttribute("fill", "none");
  svg.innerHTML = `
    <defs>
      <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="${color}" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path d="${area}" fill="url(#${gid})"/>
    <path d="${path}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  `;
  return svg;
}

/* ============================================================
   HEADER
   ============================================================ */
function renderBalance(totalUSD) {
  document.getElementById("totalBalance").textContent = fmtUSD(totalUSD);
}

function renderAddress(addr) {
  const short = addr.slice(0, 6) + "..." + addr.slice(-4);
  document.getElementById("walletAddress").textContent  = short;
  document.getElementById("receiveAddress").textContent = short;
}

/* ============================================================
   ALLOCATION BAR
   ============================================================ */
function renderAllocation(coinData, totalUSD) {
  const bar    = document.getElementById("allocationBar");
  const legend = document.getElementById("allocationLegend");
  bar.innerHTML = legend.innerHTML = "";

  coinData.forEach(c => {
    const pct = totalUSD > 0 ? c.usdValue / totalUSD : 0;

    const seg = document.createElement("div");
    seg.className = "allocation-segment";
    seg.style.flex       = String(pct);
    seg.style.background = c.color;
    bar.appendChild(seg);

    const item = document.createElement("div");
    item.className = "legend-item";
    item.innerHTML = `<div class="legend-dot" style="background:${c.color}"></div>${c.symbol} ${(pct * 100).toFixed(1)}%`;
    legend.appendChild(item);
  });
}

/* ============================================================
   COIN LIST
   ============================================================ */
function renderCoinList(coinData, onCoinClick) {
  const list = document.getElementById("coinList");
  list.innerHTML = "";

  coinData.forEach(c => {
    const row = document.createElement("div");
    row.className = "coin-row";

    const sparkWrap = document.createElement("div");
    sparkWrap.className = "sparkline-wrap";
    sparkWrap.appendChild(buildSparkline(c.change >= 0, c.change >= 0 ? "#22D07A" : "#FF4D6A"));

    row.innerHTML = `
      <div class="coin-icon" style="background:${c.bg};color:${c.color}">${c.icon}</div>
      <div class="coin-info">
        <div class="coin-name">${c.name}</div>
        <div class="coin-balance">${fmtCoin(c.balance)} ${c.symbol}</div>
      </div>
    `;
    row.appendChild(sparkWrap);

    const vals = document.createElement("div");
    vals.className = "coin-values";
    vals.innerHTML = `
      <div class="coin-usd">${fmtUSD(c.usdValue)}</div>
      <div class="coin-change ${c.change >= 0 ? "positive" : "negative"}">${c.change >= 0 ? "+" : ""}${c.change}%</div>
    `;
    row.appendChild(vals);
    row.addEventListener("click", () => onCoinClick(c.id));
    list.appendChild(row);
  });
}

/* ============================================================
   LIVE PRICE LIST
   ============================================================ */
let _priceEls = {};
function renderPriceList(coinData) {
  const list = document.getElementById("priceList");
  list.innerHTML = "";
  _priceEls = {};

  coinData.forEach(c => {
    const row = document.createElement("div");
    row.className = "price-row";
    row.id = `price-row-${c.id}`;
    row.innerHTML = `
      <span class="price-symbol"><span style="color:${c.color}">${c.icon}</span> ${c.symbol}</span>
      <span class="price-value" id="price-val-${c.id}">${fmtUSD(c.price)}</span>
    `;
    list.appendChild(row);
    _priceEls[c.id] = row;
  });
}

function updatePriceTick(prices) {
  Object.entries(prices).forEach(([id, price]) => {
    const valEl = document.getElementById(`price-val-${id}`);
    const rowEl = _priceEls[id];
    if (!valEl || !rowEl) return;
    valEl.textContent = fmtUSD(price);
    rowEl.classList.add("tick");
    setTimeout(() => rowEl.classList.remove("tick"), 400);
  });
}

/* ============================================================
   FILTER PILLS (History)
   ============================================================ */
function renderFilterPills(coins, activeCoinId, onFilter) {
  const wrap = document.getElementById("filterPills");
  wrap.innerHTML = "";

  const allPill = document.createElement("button");
  allPill.className  = "filter-pill" + (!activeCoinId ? " active" : "");
  allPill.textContent = "All";
  allPill.addEventListener("click", () => onFilter(null));
  wrap.appendChild(allPill);

  coins.forEach(c => {
    const pill = document.createElement("button");
    pill.className   = "filter-pill" + (activeCoinId === c.id ? " active" : "");
    pill.textContent = `${c.icon} ${c.symbol}`;
    pill.style.background    = activeCoinId === c.id ? c.color : "";
    pill.style.color         = activeCoinId === c.id ? "#fff"  : "";
    pill.style.borderColor   = activeCoinId === c.id ? c.color : "";
    pill.addEventListener("click", () => onFilter(c.id));
    wrap.appendChild(pill);
  });
}

/* ============================================================
   TRANSACTION LIST
   ============================================================ */
function renderTxList(txs) {
  const list = document.getElementById("txList");
  list.innerHTML = "";

  if (!txs.length) {
    list.innerHTML = `<div style="text-align:center;padding:40px;color:#aaa;font-size:14px">No transactions found</div>`;
    return;
  }

  txs.forEach((tx, i) => {
    const coin = COINS.find(c => c.id === tx.coin);
    const row  = document.createElement("div");
    row.className = "tx-row";

    const pending = tx.status === "pending"
      ? `<span class="tx-badge-pending">PENDING</span>` : "";

    row.innerHTML = `
      <div class="tx-icon ${tx.type}">${tx.type === "receive" ? "↓" : "↑"}</div>
      <div class="tx-info">
        <div class="tx-title-row">
          <span class="tx-type">${tx.type}</span>
          <span class="tx-coin" style="color:${coin.color}">${coin.symbol}</span>
          ${pending}
        </div>
        <div class="tx-meta">${tx.address} · ${timeAgo(tx.time)}</div>
      </div>
      <div class="tx-amounts">
        <div class="tx-amount ${tx.type}">${tx.type === "receive" ? "+" : "-"}${fmtCoin(tx.amount)} ${coin.symbol}</div>
        <div class="tx-usd">${fmtUSD(tx.usdValue)}</div>
      </div>
    `;
    list.appendChild(row);
  });
}

/* ============================================================
   COIN PICKER (Send Modal)
   ============================================================ */
function renderCoinPicker(coins, activeCoinId, onSelect) {
  const wrap = document.getElementById("coinPicker");
  wrap.innerHTML = "";

  coins.forEach(c => {
    const btn = document.createElement("button");
    btn.className = "coin-pick-btn" + (c.id === activeCoinId ? " active" : "");
    btn.textContent = `${c.icon} ${c.symbol}`;
    if (c.id === activeCoinId) {
      btn.style.borderColor = c.color;
      btn.style.color       = c.color;
      btn.style.background  = c.bg;
    }
    btn.addEventListener("click", () => onSelect(c.id));
    wrap.appendChild(btn);
  });
}

/* ============================================================
   CONFIRM BOX
   ============================================================ */
function renderConfirmBox(sendForm, prices, balances) {
  const coin  = COINS.find(c => c.id === sendForm.coinId);
  const amt   = parseFloat(sendForm.amount);
  const fee   = 1.20;
  const rows  = [
    ["Sending",     `${fmtCoin(amt)} ${coin.symbol}`],
    ["USD Value",   fmtUSD(amt * prices[coin.id])],
    ["To",          sendForm.address],
    ["Network Fee", `~${fmtUSD(fee)}`],
    ["You'll have", `${fmtCoin(balances[coin.id] - amt)} ${coin.symbol}`],
  ];

  const box = document.getElementById("confirmBox");
  box.innerHTML = rows.map(([k, v]) => `
    <div class="confirm-row">
      <span class="confirm-key">${k}</span>
      <span class="confirm-value ${k === "To" ? "mono-sm" : ""}">${v}</span>
    </div>
  `).join("");
}

/* ============================================================
   QR GRID (Receive Modal) — decorative
   ============================================================ */
function renderQR() {
  const grid = document.getElementById("qrGrid");
  grid.innerHTML = "";
  for (let i = 0; i < 81; i++) {
    const cell = document.createElement("div");
    cell.className = "qr-cell";
    cell.style.background = Math.random() > 0.48 ? "#1A1333" : "transparent";
    grid.appendChild(cell);
  }
}

/* ============================================================
   NOTIFICATION TOAST
   ============================================================ */
let _notifTimer = null;
function showNotification(msg, type = "success") {
  const el = document.getElementById("notification");
  el.textContent = (type === "error" ? "⚠ " : "✓ ") + msg;
  el.className   = `notification ${type}`;
  if (_notifTimer) clearTimeout(_notifTimer);
  _notifTimer = setTimeout(() => el.className = "notification hidden", 3500);
}
