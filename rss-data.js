/* ============================================================
   RSS data layer — feeds, articles, subscribe/unsubscribe.
   Storage (local, not synced — article bodies can be large):
     nt.rss.feeds    -> [ {id, url, feedUrl, title, category, tags, color, addedAt} ]
     nt.rss.articles -> { [feedId]: [ {id, title, url, summary, image, author, publishedAt} ] }
     nt.rss.state    -> { read: {[articleId]:true}, starred: {[articleId]:true} }
     nt.rss.view     -> "grid" | "list"
     nt.rss.expanded -> [categoryName]
   ============================================================ */
(function () {
  var K = {
    feeds: "nt.rss.feeds",
    articles: "nt.rss.articles",
    state: "nt.rss.state",
    view: "nt.rss.view",
    expanded: "nt.rss.expanded",
  };

  var CATEGORIES = ["News", "Technology", "Design", "Business", "Science"];
  var CAT_COLOR = {
    News: "#2f6feb", Technology: "#7c5cff", Design: "#e8568f",
    Business: "#15a06a", Science: "#e9883a", Other: "#8a8f98",
  };
  function catColor(c) { return CAT_COLOR[c] || CAT_COLOR.Other; }

  // Real topical photos (Unsplash). onError in the UI falls back to
  // picsum and then a gradient, so something real always shows.
  var IMG = {
    Technology: ["1518770660439-4636190af475", "1517336714731-489689fd1ca8", "1496171367470-9ed9a91ea931", "1488590528505-98d2b5aba04b", "1531297484001-80022131f5a1", "1550751827-4bd374c3f58b"],
    Design: ["1561070791-2526d30994b5", "1558655146-9f40138edfeb", "1626785774573-4b799315345d", "1545235617-9465d2a55698", "1502082553048-f009c37129b9", "1507925921958-8a62f3d1a50d"],
    Business: ["1611974789855-9c2a0a7236a3", "1460925895917-afdab827c52f", "1556761175-5973dc0f32e7", "1590283603385-17ffb3a7f29f", "1454165804606-c3d57bc86b40", "1543286386-713bdd548da4"],
    Science: ["1532094349884-543bc11b234d", "1576086213369-97a306d36557", "1581091226825-a6a2a5aee158", "1564325724739-bae0bd08762c", "1606206522398-de3b9b7c3a91", "1614935151651-0bea6508db6b"],
    News: ["1504711434969-e33886168f5c", "1495020689067-958852a7765e", "1585829365295-ab7cd400c167", "1503694978374-8a2fa686963a", "1568027762272-e4da8b386fda", "1524995997946-a1c2e315a42f"],
    Other: ["1506905925346-21bda4d32df4", "1441974231531-c6227db76b6e", "1469474968028-56623f02e42e"],
  };
  function imageFor(cat, i) {
    var pool = IMG[cat] || IMG.Other;
    var id = pool[((i % pool.length) + pool.length) % pool.length];
    return "https://images.unsplash.com/photo-" + id + "?w=900&q=80&auto=format&fit=crop";
  }

  function uid(p) { return (p || "x") + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3); }
  function hostOf(url) { try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return url; } }

  // ---------- generic storage ----------
  function get(key, fb) { return window.getStorage(key, fb); }
  function set(key, val) { return window.setStorage(key, val); }

  // ============================================================
  //  REAL RSS / ATOM PARSING  (this is "how RSS works")
  //  Given the XML text of a feed, extract channel + items.
  // ============================================================
  function firstText(node, names) {
    for (var i = 0; i < names.length; i++) {
      var el = node.querySelector(names[i]);
      if (el && el.textContent) return el.textContent.trim();
    }
    return "";
  }
  function stripHtml(s) {
    var d = document.createElement("div"); d.innerHTML = s || "";
    return (d.textContent || "").replace(/\s+/g, " ").trim();
  }
  function findImage(itemEl, html) {
    // media:content / media:thumbnail
    var m = itemEl.querySelector("content[url], thumbnail[url]");
    if (m && m.getAttribute("url")) return m.getAttribute("url");
    // enclosure
    var enc = itemEl.querySelector("enclosure[url]");
    if (enc && /image/i.test(enc.getAttribute("type") || "")) return enc.getAttribute("url");
    // first <img> in description/content
    var match = (html || "").match(/<img[^>]+src=["']([^"']+)["']/i);
    return match ? match[1] : "";
  }
  function parseFeedXML(xmlText) {
    var doc = new DOMParser().parseFromString(xmlText, "text/xml");
    if (doc.querySelector("parsererror")) throw new Error("Could not parse feed XML");
    var isAtom = !!doc.querySelector("feed > entry");
    var channelTitle = firstText(doc, isAtom ? ["feed > title"] : ["channel > title"]);
    var itemEls = Array.prototype.slice.call(doc.querySelectorAll(isAtom ? "entry" : "item"));
    var items = itemEls.map(function (el) {
      var rawDesc = firstText(el, ["description", "summary", "content"]);
      var link = "";
      if (isAtom) {
        var la = el.querySelector("link[rel='alternate'], link");
        link = la ? la.getAttribute("href") : "";
      } else {
        link = firstText(el, ["link"]);
      }
      return {
        title: firstText(el, ["title"]) || "(untitled)",
        url: link,
        summary: stripHtml(rawDesc).slice(0, 280),
        image: findImage(el, rawDesc),
        author: firstText(el, ["creator", "author > name", "author"]),
        publishedAt: firstText(el, ["pubDate", "published", "updated", "date"]),
      };
    });
    return { title: channelTitle, items: items };
  }

  // ============================================================
  //  FETCH  — in the packaged extension the background worker
  //  fetches with host permissions (no CORS). In this preview we
  //  can't fetch cross-origin, so we fall back to a realistic mock.
  // ============================================================
  async function fetchFeedXML(url) {
    try {
      if (chrome && chrome.runtime && chrome.runtime.id && chrome.runtime.sendMessage) {
        var res = await chrome.runtime.sendMessage({ action: "fetch-feed", url: url });
        if (res && res.xml) return res.xml;
        if (res && res.error) throw new Error(res.error);
      }
    } catch (e) { /* fall through to mock */ }
    return null; // signals: use mock generator
  }

  // ---------- mock article generator (preview only) ----------
  var HEADLINES = [
    ["The quiet return of RSS, and why power users never left", "Open feeds are seeing a revival as readers tire of algorithmic timelines and walled gardens.", ["web", "rss"]],
    ["A field guide to designing calmer software", "Fewer notifications, gentler defaults, and interfaces that respect attention as a finite resource.", ["ux", "craft"]],
    ["On-device AI takes a leap with the new silicon", "Larger models now run locally with battery gains that surprised early testers.", ["ai", "hardware"]],
    ["Markets steady as central banks signal a slower path", "Investors read a measured tone from policymakers, easing fears of further sharp moves.", ["markets"]],
    ["Researchers demo a battery that charges in five minutes", "A new electrode chemistry hits fast-charge targets without the usual trade-off in lifespan.", ["energy"]],
    ["Why typography is having a moment again on the web", "Variable fonts and better rendering pull type back to the center of interface design.", ["type", "web"]],
    ["Inside the comeback of the personal homepage", "A small but growing movement trades social profiles for sites people actually own.", ["web", "indie"]],
    ["A practical guide to color contrast in dark mode", "Accessible palettes need more than inverted values to keep text legible after dark.", ["a11y", "color"]],
    ["Open-source maintainers are burning out. Here's a fix.", "Sustainable funding and shared governance could keep critical projects healthy.", ["oss"]],
    ["The case for slower, more deliberate product launches", "Teams shipping less but finishing more are quietly outperforming the move-fast crowd.", ["product"]],
    ["What a decade of remote work actually changed", "Beyond the commute: the subtle shifts in how teams build trust and make decisions.", ["work"]],
    ["A short history of the humble progress bar", "How a tiny piece of UI came to shape our patience and our perception of time.", ["ux", "history"]],
  ];
  function mockArticlesFor(feed, n) {
    var out = [];
    var pool = HEADLINES.slice().sort(function () { return Math.random() - 0.5; });
    var count = n || (4 + Math.floor(Math.random() * 4));
    for (var i = 0; i < count; i++) {
      var hd = pool[i % pool.length];
      var hoursAgo = i * (2 + Math.floor(Math.random() * 6)) + 1;
      out.push({
        id: uid("a"),
        title: hd[0],
        url: feed.url + "/article/" + (i + 1),
        summary: hd[1],
        image: imageFor(feed.category, i),
        author: feed.title,
        publishedAt: new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString(),
        tags: hd[2],
      });
    }
    return out;
  }

  // ============================================================
  //  PUBLIC API
  // ============================================================
  async function getFeeds() { return (await get(K.feeds, [])) || []; }
  async function getArticlesMap() { return (await get(K.articles, {})) || {}; }
  async function getState() { return (await get(K.state, { read: {}, starred: {} })) || { read: {}, starred: {} }; }

  // Backfill images for any articles seeded before images existed.
  async function ensureImages() {
    var feeds = await getFeeds();
    var map = await getArticlesMap();
    var changed = false;
    feeds.forEach(function (f) {
      (map[f.id] || []).forEach(function (a, i) {
        if (!a.image) { a.image = imageFor(f.category, i); changed = true; }
      });
    });
    if (changed) await set(K.articles, map);
  }

  function guessCategory(host) {
    var h = host.toLowerCase();
    if (/(theverge|wired|techcrunch|arstechnica|engadget)/.test(h)) return "Technology";
    if (/(smashing|alistapart|dribbble|css-tricks|designm)/.test(h)) return "Design";
    if (/(bloomberg|wsj|ft\.|economist|forbes)/.test(h)) return "Business";
    if (/(nature|sciencemag|newscientist|quanta|nasa)/.test(h)) return "Science";
    if (/(nytimes|guardian|bbc|reuters|apnews|npr)/.test(h)) return "News";
    return "Technology";
  }

  // Subscribe — accepts a site or feed URL. Parses real XML when the
  // background worker can fetch it; otherwise seeds realistic articles.
  async function subscribe(input, opts) {
    opts = opts || {};
    var url = input.trim();
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    var host = hostOf(url);

    var feeds = await getFeeds();
    if (feeds.some(function (f) { return f.feedUrl === url || f.url === url; })) {
      throw new Error("Already subscribed to " + host);
    }

    var category = opts.category || guessCategory(host);
    var feed = {
      id: uid("f"),
      url: "https://" + host,
      feedUrl: url,
      title: opts.title || "",
      category: category,
      tags: opts.tags || [],
      color: catColor(category),
      addedAt: Date.now(),
    };

    var xml = await fetchFeedXML(url);
    var articles;
    if (xml) {
      var parsed = parseFeedXML(xml);
      if (parsed.title) feed.title = feed.title || parsed.title;
      articles = parsed.items.map(function (it) {
        return Object.assign({ id: uid("a"), tags: feed.tags }, it);
      });
    } else {
      feed.title = feed.title || titleCaseHost(host);
      articles = mockArticlesFor(feed);
    }

    feeds.push(feed);
    var map = await getArticlesMap();
    map[feed.id] = articles;
    await set(K.feeds, feeds);
    await set(K.articles, map);
    return feed;
  }

  async function unsubscribe(feedId) {
    var feeds = await getFeeds();
    feeds = feeds.filter(function (f) { return f.id !== feedId; });
    var map = await getArticlesMap();
    var removed = map[feedId] || [];
    delete map[feedId];
    // also drop read/star flags for its articles
    var st = await getState();
    removed.forEach(function (a) { delete st.read[a.id]; delete st.starred[a.id]; });
    await set(K.feeds, feeds);
    await set(K.articles, map);
    await set(K.state, st);
  }

  async function setRead(articleId, val) {
    var st = await getState();
    if (val) st.read[articleId] = true; else delete st.read[articleId];
    await set(K.state, st);
    return st;
  }
  async function setStar(articleId, val) {
    var st = await getState();
    if (val) st.starred[articleId] = true; else delete st.starred[articleId];
    await set(K.state, st);
    return st;
  }
  async function markAllRead(articleIds) {
    var st = await getState();
    articleIds.forEach(function (id) { st.read[id] = true; });
    await set(K.state, st);
    return st;
  }

  function titleCaseHost(host) {
    var core = host.split(".")[0];
    return core.charAt(0).toUpperCase() + core.slice(1);
  }

  // ---------- seed defaults on first run ----------
  async function ensureSeed() {
    var feeds = await getFeeds();
    if (feeds.length) return;
    var seed = [
      { url: "https://www.theverge.com/rss/index.xml", title: "The Verge", category: "Technology", tags: ["tech"], color: catColor("Technology") },
      { url: "https://www.wired.com/feed/rss", title: "Wired", category: "Technology", tags: ["tech"], color: catColor("Technology") },
      { url: "https://arstechnica.com/feed/", title: "Ars Technica", category: "Technology", tags: ["tech"], color: catColor("Technology") },
      { url: "https://www.smashingmagazine.com/feed/", title: "Smashing Magazine", category: "Design", tags: ["design", "ux"], color: catColor("Design") },
      { url: "https://alistapart.com/main/feed/", title: "A List Apart", category: "Design", tags: ["web"], color: catColor("Design") },
      { url: "https://feeds.bloomberg.com/markets/news.rss", title: "Bloomberg Markets", category: "Business", tags: ["markets"], color: catColor("Business") },
      { url: "https://www.technologyreview.com/feed/", title: "MIT Tech Review", category: "Science", tags: ["science"], color: catColor("Science") },
      { url: "https://feeds.npr.org/1001/rss.xml", title: "NPR News", category: "News", tags: ["world"], color: catColor("News") },
    ];
    var feedList = [], map = {};
    seed.forEach(function (s) {
      var host = hostOf(s.url);
      var f = {
        id: uid("f"), url: "https://" + host, feedUrl: s.url, title: s.title,
        category: s.category, tags: s.tags, color: s.color, addedAt: Date.now(),
      };
      feedList.push(f);
      map[f.id] = mockArticlesFor(f);
    });
    await set(K.feeds, feedList);
    await set(K.articles, map);
  }

  window.RSS = {
    KEYS: K,
    CATEGORIES: CATEGORIES,
    catColor: catColor,
    hostOf: hostOf,
    parseFeedXML: parseFeedXML,
    getFeeds: getFeeds,
    getArticlesMap: getArticlesMap,
    getState: getState,
    subscribe: subscribe,
    unsubscribe: unsubscribe,
    setRead: setRead,
    setStar: setStar,
    markAllRead: markAllRead,
    ensureSeed: ensureSeed,
    ensureImages: ensureImages,
    imageFor: imageFor,
  };
})();
