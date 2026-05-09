var { useState, useEffect } = React;
function QuoteWidget() {
  const [quote, setQuote] = (window.useStorage || useStorage)("dash.quote", null, true);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    if (quote && quote.date === today) return;
    async function fetchQuote() {
      setLoading(true);
      try {
        const res = await fetch("https://dummyjson.com/quotes/random");
        const data = await res.json();
        if (data && data.quote) {
          setQuote({
            text: data.quote,
            author: data.author,
            date: today
          });
        }
      } catch (e) {
        console.error("Failed to fetch quote:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchQuote();
  }, [quote, setQuote]);
  if (!quote) return null;
  return /* @__PURE__ */ React.createElement("div", { className: "quote-widget" }, /* @__PURE__ */ React.createElement("div", { className: "quote-content" }, /* @__PURE__ */ React.createElement("span", { className: "quote-text" }, '"', quote.text, '"'), /* @__PURE__ */ React.createElement("span", { className: "quote-author" }, "\u2014 ", quote.author)));
}
window.QuoteWidget = QuoteWidget;
