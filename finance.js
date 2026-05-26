var { useState, useEffect, useRef } = React;
function playChime(isBreak) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = isBreak ? 392 : 659;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(1e-3, ctx.currentTime + 1.5);
    osc.start();
    osc.stop(ctx.currentTime + 1.5);
    setTimeout(() => ctx.close(), 2e3);
  } catch (e) {
  }
}
function PomodoroWidget() {
  const [workMin] = window.useStorage("dash.pomodoro.work", 25, false);
  const [breakMin] = window.useStorage("dash.pomodoro.break", 5, false);
  const [phase, setPhase] = useState("work");
  const [remaining, setRemaining] = useState(null);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const tickRef = useRef(null);
  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    if (!running) setRemaining(phase === "work" ? workMin * 60 : breakMin * 60);
  }, [phase, workMin, breakMin]);
  useEffect(() => {
    if (running) {
      tickRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(tickRef.current);
            setRunning(false);
            const nextPhase = phaseRef.current === "work" ? "break" : "work";
            playChime(nextPhase === "break");
            if (phaseRef.current === "work") setSessions((s) => s + 1);
            setPhase(nextPhase);
            return 0;
          }
          return prev - 1;
        });
      }, 1e3);
    } else {
      clearInterval(tickRef.current);
    }
    return () => clearInterval(tickRef.current);
  }, [running]);
  const secs = remaining ?? (phase === "work" ? workMin * 60 : breakMin * 60);
  const total = phase === "work" ? workMin * 60 : breakMin * 60;
  const pct = total > 0 ? (1 - secs / total) * 100 : 0;
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  function reset() {
    clearInterval(tickRef.current);
    setRunning(false);
    setPhase("work");
    setRemaining(workMin * 60);
  }
  return /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("div", { className: "card-title" }, "POMODORO \xB7 ", sessions > 0 && `${sessions} done`)), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "10px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 600, color: "var(--text-mute)", marginBottom: 4, letterSpacing: "0.1em" } }, phase === "work" ? "\u25CF WORK" : "\u25CB BREAK"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 32, fontWeight: 600, fontFamily: "var(--font-mono)", letterSpacing: "-0.02em" } }, mm, ":", ss), /* @__PURE__ */ React.createElement("div", { style: { height: 4, background: "var(--surface-2)", borderRadius: 2, margin: "12px 0", overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", width: `${pct}%`, background: "var(--accent)", transition: "width 1s linear" } })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, justifyContent: "center" } }, /* @__PURE__ */ React.createElement("button", { className: "btn ghost", style: { padding: "6px 12px" }, onClick: () => setRunning((r) => !r) }, running ? "Pause" : "Start"), /* @__PURE__ */ React.createElement("button", { className: "btn ghost", style: { padding: "6px 12px" }, onClick: reset }, "Reset"))));
}
const DEFAULT_COINS = ["bitcoin", "ethereum", "solana"];
const COIN_SYM = { bitcoin: "BTC", ethereum: "ETH", solana: "SOL", binancecoin: "BNB", ripple: "XRP", dogecoin: "DOGE", cardano: "ADA" };
function CryptoWidget() {
  const [config] = window.useStorage("dash.crypto", { coins: DEFAULT_COINS }, false);
  const [prices, setPrices] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const coins = config?.coins || DEFAULT_COINS;
  async function fetchPrices() {
    setLoading(true);
    try {
      const result = await chrome.runtime.sendMessage({ action: "crypto-prices", coins });
      if (result.error) throw new Error(result.error);
      setPrices(result.data);
      setError(null);
    } catch (e) {
      setError("Unavailable");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    fetchPrices();
    const id = setInterval(fetchPrices, 6e4);
    return () => clearInterval(id);
  }, [JSON.stringify(coins)]);
  function fmtP(n) {
    if (n == null) return "\u2014";
    if (n >= 1e3) return "$" + n.toLocaleString("en", { maximumFractionDigits: 0 });
    return "$" + n.toFixed(n >= 1 ? 2 : 4);
  }
  return /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("div", { className: "card-title" }, "CRYPTO ", loading && "\u21BB")), error && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-mute)", textAlign: "center", padding: "10px 0" } }, error), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gap: 2 } }, prices && coins.map((coin) => {
    const d = prices[coin];
    if (!d) return null;
    const chg = d.usd_24h_change;
    return /* @__PURE__ */ React.createElement("div", { key: coin, style: { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 500 } }, COIN_SYM[coin] || coin.slice(0, 4).toUpperCase()), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, fontFamily: "var(--font-mono)" } }, fmtP(d.usd)), chg != null && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 500, color: chg >= 0 ? "var(--positive)" : "#dc2626" } }, chg >= 0 ? "+" : "", chg.toFixed(2), "%")));
  })));
}
const DEFAULT_FX = { base: "USD", targets: ["EUR", "GBP", "JPY", "CAD", "AUD", "INR"] };
function FXWidget() {
  const [config] = window.useStorage("dash.fx", DEFAULT_FX, false);
  const [rates, setRates] = useState(null);
  const [error, setError] = useState(null);
  const { base, targets } = { ...DEFAULT_FX, ...config };
  async function fetchRates() {
    try {
      const result = await chrome.runtime.sendMessage({ action: "fx-rates", base });
      if (result.error) throw new Error(result.error);
      setRates(result.data?.rates || {});
      setError(null);
    } catch (e) {
      setError("Unavailable");
    }
  }
  useEffect(() => {
    fetchRates();
    const id = setInterval(fetchRates, 36e5);
    return () => clearInterval(id);
  }, [base]);
  function fmtR(c, v) {
    if (v == null) return "\u2014";
    const dp = ["JPY", "KRW", "IDR", "VND"].includes(c) ? 2 : 4;
    return v.toFixed(dp);
  }
  return /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("div", { className: "card-title" }, "FX \xB7 ", base)), error && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-mute)", textAlign: "center", padding: "10px 0" } }, error), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gap: 2 } }, rates && targets.map((t) => rates[t] != null && /* @__PURE__ */ React.createElement("div", { key: t, style: { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 500 } }, t), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 600, fontFamily: "var(--font-mono)" } }, fmtR(t, rates[t]))))));
}
function HistoryWidget() {
  const [items, setItems] = useState(null);
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.history) {
      chrome.history.search({ text: "", maxResults: 8 }, (res) => setItems(res || []));
    } else {
      setItems([]);
    }
  }, []);
  function ago(ms) {
    const d = Date.now() - ms;
    if (d < 6e4) return "now";
    if (d < 36e5) return Math.round(d / 6e4) + "m";
    if (d < 864e5) return Math.round(d / 36e5) + "h";
    return Math.round(d / 864e5) + "d";
  }
  return /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("div", { className: "card-title" }, "RECENT HISTORY")), items === null && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-mute)", textAlign: "center", padding: "10px 0" } }, "Loading\u2026"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gap: 2 } }, (items || []).map((item, i) => /* @__PURE__ */ React.createElement("a", { key: i, href: item.url, target: "_blank", rel: "noopener noreferrer", style: { display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)", minWidth: 0 } }, /* @__PURE__ */ React.createElement(
    "img",
    {
      style: { width: 16, height: 16, borderRadius: 4, flexShrink: 0 },
      src: window.faviconUrl ? window.faviconUrl(item.url, 16) : "",
      alt: "",
      onError: (e) => {
        e.target.style.display = "none";
      }
    }
  ), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 } }, item.title || item.url), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--text-mute)", fontFamily: "var(--font-mono)" } }, ago(item.lastVisitTime))))), items && items.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-mute)", textAlign: "center", padding: "10px 0" } }, "No history yet."));
}
function StockWidget() {
  const [plus] = window.useStorage("1stTab.plus", { active: false }, false);
  const [config] = window.useStorage("dash.stocks", { symbols: ["AAPL", "TSLA", "MSFT"] }, false);
  const [finnhubKey] = window.useStorage("1stTab.finnhubKey", "", false);
  const [quotes, setQuotes] = useState(null);
  const [error, setError] = useState(null);
  const isPlus = plus?.active;
  async function fetchQuotes() {
    if (!finnhubKey) {
      setError("Add API key in Settings");
      return;
    }
    try {
      const result = await chrome.runtime.sendMessage({
        action: "stock-quotes",
        symbols: config?.symbols || ["AAPL"],
        apiKey: finnhubKey
      });
      if (result.error) throw new Error(result.error);
      setQuotes(result.quotes || []);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    if (!isPlus) return;
    fetchQuotes();
    const id = setInterval(fetchQuotes, 3e5);
    return () => clearInterval(id);
  }, [isPlus, finnhubKey]);
  if (!isPlus) {
    return /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("div", { className: "card-title" }, "STOCKS \xB7 ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--accent)" } }, "PLUS"))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-mute)", textAlign: "center", padding: "10px 0" } }, "Requires 1stTab Plus"));
  }
  function fmtChg(q) {
    if (!q || q.c == null || q.pc == null || q.pc === 0) return "\u2014";
    const pct = (q.c - q.pc) / q.pc * 100;
    return (pct >= 0 ? "+" : "") + pct.toFixed(2) + "%";
  }
  return /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("div", { className: "card-title" }, "STOCKS")), error && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-mute)", textAlign: "center", padding: "10px 0" } }, error), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gap: 2 } }, (quotes || []).map((q) => /* @__PURE__ */ React.createElement("div", { key: q.symbol, style: { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 500 } }, q.symbol), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, fontFamily: "var(--font-mono)" } }, "$", q.c != null ? q.c.toFixed(2) : "\u2014"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 500, color: q.c - q.pc >= 0 ? "var(--positive)" : "#dc2626" } }, fmtChg(q)))))));
}
function FinanceWidget() {
  return /* @__PURE__ */ React.createElement("div", { className: "finance-widgets", style: { display: "flex", flexDirection: "column", gap: 18 } }, /* @__PURE__ */ React.createElement(PomodoroWidget, null), /* @__PURE__ */ React.createElement(CryptoWidget, null), /* @__PURE__ */ React.createElement(FXWidget, null), /* @__PURE__ */ React.createElement(HistoryWidget, null), /* @__PURE__ */ React.createElement(StockWidget, null));
}
window.FinanceWidget = FinanceWidget;
window.PomodoroWidget = PomodoroWidget;
window.CryptoWidget = CryptoWidget;
window.FXWidget = FXWidget;
window.HistoryWidget = HistoryWidget;
window.StockWidget = StockWidget;
