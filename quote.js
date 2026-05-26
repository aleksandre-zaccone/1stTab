var { useState, useEffect } = React;
function QuoteWidget() {
  const [quote, setQuote] = window.useStorage("nt.quote", null, false);
  useEffect(() => {
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    if (quote && quote.date === today) return;
    async function fetchQuote() {
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
      }
    }
    fetchQuote();
  }, [quote, setQuote]);
  if (!quote) return /* @__PURE__ */ React.createElement("div", { className: "quote" }, '"Loading inspiration..."');
  return /* @__PURE__ */ React.createElement("div", { className: "quote" }, '"', quote.text, '"', /* @__PURE__ */ React.createElement("span", null, "\u2014 ", quote.author));
}
window.QuoteWidget = QuoteWidget;
