var { useState, useEffect } = React;

function QuoteWidget() {
  // Use window.useStorage to ensure it is found if not globally bound yet
  const [quote, setQuote] = (window.useStorage || useStorage)('dash.quote', null, true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (quote && quote.date === today) return;

    async function fetchQuote() {
      setLoading(true);
      try {
        const res = await fetch('https://dummyjson.com/quotes/random');
        const data = await res.json();
        if (data && data.quote) {
          setQuote({
            text: data.quote,
            author: data.author,
            date: today
          });
        }
      } catch (e) {
        console.error('Failed to fetch quote:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchQuote();
  }, [quote, setQuote]);

  if (!quote) return null;

  return (
    <div className="quote-widget">
      <div className="quote-content">
        <span className="quote-text">"{quote.text}"</span>
        <span className="quote-author">— {quote.author}</span>
      </div>
    </div>
  );
}

window.QuoteWidget = QuoteWidget;
