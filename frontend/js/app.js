/**
 * app.js — Main application controller
 * Wires together Wallet (state) and UI (rendering).
 */

(function () {

  /* ---- App State ---- */
  const state = {
    tab:        "portfolio",
    filterCoin: null,
    sendForm: {
      coinId:  "btc",
      address: "",
      amount:  "",
      step:    "form",  // "form" | "confirm" | "success"
    },
  };

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    renderAddress(Wallet.getAddress());
    renderQR();
    refreshPortfolio();
    refreshHistory();
    bindTabs();
    bindHeaderActions();
    bindSendModal();
    bindReceiveModal();
    bindCloseButtons();
    Wallet.on("pricesUpdated",       onPricesUpdated);
    Wallet.on("balancesUpdated",     onBalancesUpdated);
    Wallet.on("transactionAdded",    onTransactionAdded);
    Wallet.on("transactionConfirmed",onTransactionConfirmed);
    Wallet.startPriceTicker(2000);
  }

  /* ============================================================
     RENDER HELPERS
     ============================================================ */
  function refreshPortfolio() {
    const coinData = Wallet.getCoinData();
    const total    = Wallet.getTotalUSD();
    renderBalance(total);
    renderAllocation(coinData, total);
    renderCoinList(coinData, (coinId) => {
      state.filterCoin = coinId;
      switchTab("history");
    });
    renderPriceList(coinData);
  }

  function refreshHistory() {
    const txs = Wallet.getTransactions(state.filterCoin);
    renderFilterPills(COINS, state.filterCoin, (coinId) => {
      state.filterCoin = coinId;
      refreshHistory();
    });
    renderTxList(txs);
  }

  /* ============================================================
     TABS
     ============================================================ */
  function bindTabs() {
    document.querySelectorAll(".tab").forEach(btn => {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });
  }

  function switchTab(name) {
    state.tab = name;
    document.querySelectorAll(".tab").forEach(b =>
      b.classList.toggle("active", b.dataset.tab === name)
    );
    document.querySelectorAll(".tab-section").forEach(s =>
      s.classList.toggle("hidden", s.id !== `tab-${name}`)
    );
    if (name === "history") refreshHistory();
    if (name === "portfolio") refreshPortfolio();
  }

  /* ============================================================
     HEADER ACTION BUTTONS
     ============================================================ */
  function bindHeaderActions() {
    document.getElementById("btnSend").addEventListener("click", () => openSendModal());
    document.getElementById("btnReceive").addEventListener("click", () => openModal("modalReceive"));
    document.getElementById("btnHistory").addEventListener("click", () => switchTab("history"));
  }

  /* ============================================================
     SEND MODAL
     ============================================================ */
  function openSendModal() {
    state.sendForm = { coinId: "btc", address: "", amount: "", step: "form" };
    renderSendStep("form");
    openModal("modalSend");
  }

  function renderSendStep(step) {
    state.sendForm.step = step;
    document.getElementById("sendStepForm").classList.toggle("hidden", step !== "form");
    document.getElementById("sendStepConfirm").classList.toggle("hidden", step !== "confirm");
    document.getElementById("sendStepSuccess").classList.toggle("hidden", step !== "success");

    if (step === "form") {
      renderCoinPicker(COINS, state.sendForm.coinId, (id) => {
        state.sendForm.coinId = id;
        renderCoinPicker(COINS, id, arguments.callee);
        updateAmountUSD();
      });
      document.getElementById("sendAddress").value = state.sendForm.address;
      document.getElementById("sendAmount").value  = state.sendForm.amount;
      updateAmountUSD();
    }

    if (step === "confirm") {
      renderConfirmBox(state.sendForm, Wallet.getPrices(), Wallet.getBalances());
    }
  }

  function updateAmountUSD() {
    const amt    = parseFloat(document.getElementById("sendAmount").value) || 0;
    const prices = Wallet.getPrices();
    const el     = document.getElementById("amountUSD");
    el.textContent = amt > 0 ? `≈ ${fmtUSD(amt * prices[state.sendForm.coinId])}` : "";
  }

  function bindSendModal() {
    /* Coin picker (initial render) */
    renderCoinPicker(COINS, state.sendForm.coinId, (id) => {
      state.sendForm.coinId = id;
      renderCoinPicker(COINS, id, arguments.callee);
    });

    /* Live amount ↔ USD */
    document.getElementById("sendAmount").addEventListener("input", e => {
      state.sendForm.amount = e.target.value;
      updateAmountUSD();
    });
    document.getElementById("sendAddress").addEventListener("input", e => {
      state.sendForm.address = e.target.value;
    });

    /* MAX button */
    document.getElementById("maxBtn").addEventListener("click", () => {
      const bal = Wallet.getBalances()[state.sendForm.coinId] || 0;
      document.getElementById("sendAmount").value = bal;
      state.sendForm.amount = String(bal);
      updateAmountUSD();
    });

    /* Review → Confirm */
    document.getElementById("btnReview").addEventListener("click", () => {
      state.sendForm.address = document.getElementById("sendAddress").value.trim();
      state.sendForm.amount  = document.getElementById("sendAmount").value;

      if (!state.sendForm.address) { showNotification("Enter a recipient address.", "error"); return; }
      const amt = parseFloat(state.sendForm.amount);
      if (!amt || amt <= 0) { showNotification("Enter a valid amount.", "error"); return; }
      const bal = Wallet.getBalances()[state.sendForm.coinId] || 0;
      if (amt > bal) { showNotification("Insufficient balance.", "error"); return; }

      renderSendStep("confirm");
    });

    /* Back */
    document.getElementById("btnBack").addEventListener("click", () => renderSendStep("form"));

    /* Confirm & Send */
    document.getElementById("btnConfirm").addEventListener("click", () => {
      const result = Wallet.send({
        coinId:    state.sendForm.coinId,
        toAddress: state.sendForm.address,
        amount:    state.sendForm.amount,
      });

      if (!result.ok) { showNotification(result.error, "error"); return; }

      renderSendStep("success");
      refreshPortfolio();

      setTimeout(() => {
        closeModal("modalSend");
        const coin = COINS.find(c => c.id === state.sendForm.coinId);
        showNotification(`Sent ${fmtCoin(parseFloat(state.sendForm.amount))} ${coin.symbol} successfully`);
        if (state.tab === "history") refreshHistory();
      }, 2200);
    });
  }

  /* ============================================================
     RECEIVE MODAL
     ============================================================ */
  function bindReceiveModal() {
    document.getElementById("btnCopyAddress").addEventListener("click", () => {
      const addr = Wallet.getAddress();
      if (navigator.clipboard) navigator.clipboard.writeText(addr);
      showNotification("Address copied to clipboard!");
    });
  }

  /* ============================================================
     MODAL OPEN / CLOSE
     ============================================================ */
  function openModal(id) {
    const el = document.getElementById(id);
    el.classList.remove("hidden");
    el.addEventListener("click", backdropClose);
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    el.classList.add("hidden");
    el.removeEventListener("click", backdropClose);
  }

  function backdropClose(e) {
    if (e.target === e.currentTarget) closeModal(e.currentTarget.id);
  }

  function bindCloseButtons() {
    document.querySelectorAll(".close-btn[data-close]").forEach(btn => {
      btn.addEventListener("click", () => closeModal(btn.dataset.close));
    });
  }

  /* ============================================================
     WALLET EVENT HANDLERS
     ============================================================ */
  function onPricesUpdated(prices) {
    updatePriceTick(prices);
    // Also refresh balance total
    renderBalance(Wallet.getTotalUSD());
  }

  function onBalancesUpdated() {
    refreshPortfolio();
  }

  function onTransactionAdded() {
    if (state.tab === "history") refreshHistory();
  }

  function onTransactionConfirmed() {
    if (state.tab === "history") refreshHistory();
    showNotification("Transaction confirmed on-chain! ✓");
  }

  /* ============================================================
     FORMAT HELPER (needed in app scope)
     ============================================================ */
  const fmtUSD  = n => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtCoin = (n, d = 4) => Number(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

  /* ---- Boot ---- */
  document.addEventListener("DOMContentLoaded", init);

})();
