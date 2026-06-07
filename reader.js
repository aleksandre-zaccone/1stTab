/* ============================================================
   RSS Reader UI  —  window.ReaderApp
   Tree sidebar (categories -> feeds, like bookmarks) + grid/list
   article views + reading pane + subscribe/unsubscribe modal.
   ============================================================ */
(function () {
  var h = React.createElement;
  var useState = React.useState, useEffect = React.useEffect, useMemo = React.useMemo, useCallback = React.useCallback;
  var RSS = window.RSS;

  // ---- read-only preview flag ----
  // The Reader ships as a demo preview: feeds/articles are sample data and
  // every mutating action (subscribe, unsubscribe, star, mark-read, follow
  // links) is disabled until the feature is fully released.
  var READ_ONLY = true;

  // ---- local icons ----
  function svg(props, children) {
    return h("svg", Object.assign({ width: props.s || 18, height: props.s || 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: props.w || 1.8, strokeLinecap: "round", strokeLinejoin: "round" }, props.x || {}), children);
  }
  var RI = {
    rss: function (p) { p = p || {}; return svg({ s: p.s }, [h("path", { key: 1, d: "M5 11a8 8 0 0 1 8 8M5 5a14 14 0 0 1 14 14" }), h("circle", { key: 2, cx: 6, cy: 18, r: 1.5, fill: "currentColor", stroke: "none" })]); },
    grid: function (p) { p = p || {}; return svg({ s: p.s || 16 }, [h("rect", { key: 1, x: 3, y: 3, width: 8, height: 8, rx: 1.5 }), h("rect", { key: 2, x: 13, y: 3, width: 8, height: 8, rx: 1.5 }), h("rect", { key: 3, x: 3, y: 13, width: 8, height: 8, rx: 1.5 }), h("rect", { key: 4, x: 13, y: 13, width: 8, height: 8, rx: 1.5 })]); },
    list: function (p) { p = p || {}; return svg({ s: p.s || 16 }, [h("path", { key: 1, d: "M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" })]); },
    mag: function (p) { p = p || {}; return svg({ s: p.s || 16 }, [h("rect", { key: 1, x: 3, y: 3, width: 18, height: 8, rx: 1.5 }), h("rect", { key: 2, x: 3, y: 14, width: 8, height: 7, rx: 1.5 }), h("rect", { key: 3, x: 13, y: 14, width: 8, height: 7, rx: 1.5 })]); },
    star: function (p) { p = p || {}; return h("svg", { width: p.s || 17, height: p.s || 17, viewBox: "0 0 24 24", fill: p.fill ? "currentColor" : "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" }, h("path", { d: "m12 3 2.6 5.6L20.5 9l-4.5 4 1.2 6L12 16l-5.2 3 1.2-6-4.5-4 5.9-.4z" })); },
    plus: function (p) { p = p || {}; return svg({ s: p.s || 16, w: 2 }, [h("path", { key: 1, d: "M12 5v14M5 12h14" })]); },
    x: function (p) { p = p || {}; return svg({ s: p.s || 16, w: 2 }, [h("path", { key: 1, d: "M6 6l12 12M18 6L6 18" })]); },
    chev: function (p) { p = p || {}; return h("svg", { width: 11, height: 11, viewBox: "0 0 10 10", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" }, h("polyline", { points: "3.5 2 6.5 5 3.5 8" })); },
    back: function (p) { p = p || {}; return svg({ s: p.s || 18 }, [h("path", { key: 1, d: "M15 5l-7 7 7 7" })]); },
    fwd: function (p) { p = p || {}; return svg({ s: p.s || 18 }, [h("path", { key: 1, d: "M9 5l7 7-7 7" })]); },
    ext: function (p) { p = p || {}; return svg({ s: p.s || 15 }, [h("path", { key: 1, d: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" })]); },
    search: function (p) { p = p || {}; return svg({ s: p.s || 15, w: 1.9 }, [h("circle", { key: 1, cx: 11, cy: 11, r: 7 }), h("path", { key: 2, d: "m20 20-3-3" })]); },
    check: function (p) { p = p || {}; return svg({ s: p.s || 15, w: 2 }, [h("path", { key: 1, d: "M20 6L9 17l-5-5" })]); },
    image: function (p) { p = p || {}; return h("svg", { width: 26, height: 26, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.4 }, [h("rect", { key: 1, x: 3, y: 3, width: 18, height: 18, rx: 3 }), h("circle", { key: 2, cx: 8.5, cy: 8.5, r: 1.6 }), h("path", { key: 3, d: "m21 16-5-5L5 21" })]); },
    dot: function (p) { p = p || {}; return svg({ s: p.s || 16 }, [h("circle", { key: 1, cx: 12, cy: 12, r: 9 })]); },
  };

  function relTime(iso) {
    if (!iso) return "";
    var t = new Date(iso).getTime();
    if (isNaN(t)) return "";
    var diff = Math.max(1, Math.round((Date.now() - t) / 60000));
    if (diff < 60) return diff + "m";
    if (diff < 1440) return Math.round(diff / 60) + "h";
    return Math.round(diff / 1440) + "d";
  }

  function phGrad(color, i) {
    var ang = 120 + ((i || 0) * 37) % 90;
    return "linear-gradient(" + ang + "deg, " + color + ", color-mix(in oklab, " + color + " 60%, #11151c))";
  }

  function Photo(props) {
    var st = useState(0); var stage = st[0], setStage = st[1];
    var color = props.color, img = props.image, i = props.i, cls = props.className;
    if (img && stage < 2) {
      var src = stage === 0 ? img
        : "https://picsum.photos/seed/rss" + encodeURIComponent(String(props.seed || "") + i) + "/900/560";
      return h("div", { className: "rd-ph " + (cls || "") },
        h("img", { src: src, alt: "", loading: "lazy", onError: function () { setStage(stage + 1); } }));
    }
    return h("div", { className: "rd-ph " + (cls || ""), style: { background: phGrad(color, i) } },
      h("span", { className: "rd-ph-glyph" }, RI.image()));
  }

  // ============================================================
  function ReaderApp() {
    var s0 = useState([]), feeds = s0[0], setFeeds = s0[1];
    var s1 = useState({}), artMap = s1[0], setArtMap = s1[1];
    var s2 = useState({ read: {}, starred: {} }), state = s2[0], setState = s2[1];
    var s3 = useState({ type: "all" }), scope = s3[0], setScope = s3[1];
    var s4 = useState("grid"), view = s4[0], setView = s4[1];
    var s5 = useState([]), expanded = s5[0], setExpanded = s5[1];
    var s6 = useState(""), q = s6[0], setQ = s6[1];
    var s7 = useState(null), open = s7[0], setOpen = s7[1];     // open article
    var s8 = useState(false), addOpen = s8[0], setAddOpen = s8[1];
    var s9 = useState(true), loading = s9[0], setLoading = s9[1];

    var reload = useCallback(async function () {
      var r = await Promise.all([RSS.getFeeds(), RSS.getArticlesMap(), RSS.getState(), window.getStorage(RSS.KEYS.view, "grid"), window.getStorage(RSS.KEYS.expanded, RSS.CATEGORIES)]);
      setFeeds(r[0]); setArtMap(r[1]); setState(r[2]); setView(r[3] || "grid"); setExpanded(r[4] || []);
      setLoading(false);
    }, []);

    useEffect(function () { (async function () { await RSS.ensureSeed(); await RSS.ensureImages(); await reload(); })(); }, [reload]);

    var setViewP = function (v) { setView(v); window.setStorage(RSS.KEYS.view, v); };
    var toggleCat = function (c) {
      var next = expanded.indexOf(c) >= 0 ? expanded.filter(function (x) { return x !== c; }) : expanded.concat([c]);
      setExpanded(next); window.setStorage(RSS.KEYS.expanded, next);
    };

    // feed lookup
    var feedById = useMemo(function () { var m = {}; feeds.forEach(function (f) { m[f.id] = f; }); return m; }, [feeds]);

    // flat article list with feed ref
    var allArticles = useMemo(function () {
      var out = [];
      feeds.forEach(function (f) { (artMap[f.id] || []).forEach(function (a) { out.push({ a: a, f: f }); }); });
      out.sort(function (x, y) { return new Date(y.a.publishedAt) - new Date(x.a.publishedAt); });
      return out;
    }, [feeds, artMap]);

    var unreadCountFeed = useCallback(function (fid) {
      var arr = artMap[fid] || []; var n = 0;
      for (var i = 0; i < arr.length; i++) if (!state.read[arr[i].id]) n++;
      return n;
    }, [artMap, state]);

    // category -> feeds
    var byCat = useMemo(function () {
      var m = {};
      RSS.CATEGORIES.forEach(function (c) { m[c] = []; });
      feeds.forEach(function (f) { (m[f.category] = m[f.category] || []).push(f); });
      return m;
    }, [feeds]);

    var totalUnread = allArticles.filter(function (it) { return !state.read[it.a.id]; }).length;
    var starredCount = allArticles.filter(function (it) { return state.starred[it.a.id]; }).length;

    // current list per scope + search
    var ql = q.toLowerCase().trim();
    var current = useMemo(function () {
      var list = allArticles.filter(function (it) {
        var a = it.a, f = it.f;
        if (scope.type === "unread" && state.read[a.id]) return false;
        if (scope.type === "starred" && !state.starred[a.id]) return false;
        if (scope.type === "category" && f.category !== scope.value) return false;
        if (scope.type === "feed" && f.id !== scope.value) return false;
        if (ql) {
          var hay = (a.title + " " + a.summary + " " + f.title + " " + (a.tags || []).join(" ")).toLowerCase();
          if (hay.indexOf(ql) < 0) return false;
        }
        return true;
      });
      return list;
    }, [allArticles, scope, state, ql]);

    var scopeTitle = scope.type === "all" ? "All articles"
      : scope.type === "unread" ? "Unread"
      : scope.type === "starred" ? "Starred"
      : scope.type === "category" ? scope.value
      : scope.type === "feed" ? (feedById[scope.value] && feedById[scope.value].title) || "Feed"
      : "Articles";

    // actions (no-ops in read-only preview)
    var openArticle = async function (it) {
      setOpen(it);
      if (READ_ONLY) return;
      if (!state.read[it.a.id]) { var st = await RSS.setRead(it.a.id, true); setState(Object.assign({}, st)); }
    };
    var toggleStar = async function (e, id) {
      e.preventDefault(); e.stopPropagation();
      if (READ_ONLY) return;
      var st = await RSS.setStar(id, !state.starred[id]); setState(Object.assign({}, st));
    };
    var doUnsub = async function (e, f) {
      e.preventDefault(); e.stopPropagation();
      if (READ_ONLY) return;
      if (!window.confirm("Unsubscribe from " + f.title + "?")) return;
      await RSS.unsubscribe(f.id);
      if (scope.type === "feed" && scope.value === f.id) setScope({ type: "all" });
      await reload();
    };
    var doMarkAllRead = async function () {
      if (READ_ONLY) return;
      var st = await RSS.markAllRead(current.map(function (it) { return it.a.id; }));
      setState(Object.assign({}, st));
    };

    // ---------- sidebar ----------
    function NavItem(props) {
      return h("button", { className: "rd-nav" + (props.active ? " active" : ""), onClick: props.onClick },
        h("span", { className: "rd-nav-ic" }, props.icon),
        h("span", { className: "rd-nav-lbl" }, props.label),
        props.count != null && h("span", { className: "rd-nav-ct" }, props.count));
    }

    var sidebar = h("aside", { className: "rd-side" },
      h("div", { className: "rd-side-h" }, "Library"),
      h(NavItem, { icon: RI.rss({ s: 16 }), label: "All articles", count: allArticles.length, active: scope.type === "all", onClick: function () { setScope({ type: "all" }); } }),
      h(NavItem, { icon: RI.dot({ s: 15 }), label: "Unread", count: totalUnread, active: scope.type === "unread", onClick: function () { setScope({ type: "unread" }); } }),
      h(NavItem, { icon: RI.star({ s: 15 }), label: "Starred", count: starredCount, active: scope.type === "starred", onClick: function () { setScope({ type: "starred" }); } }),

      h("div", { className: "rd-side-h" }, "Feeds"),
      h("div", { className: "rd-tree" },
        RSS.CATEGORIES.map(function (c) {
          var list = byCat[c] || [];
          if (!list.length) return null;
          var isOpen = expanded.indexOf(c) >= 0;
          var catUnread = list.reduce(function (n, f) { return n + unreadCountFeed(f.id); }, 0);
          return h("div", { key: c, className: "rd-cat" },
            h("button", { className: "rd-catrow" + (scope.type === "category" && scope.value === c ? " active" : ""),
              onClick: function () { setScope({ type: "category", value: c }); } },
              h("span", { className: "rd-chev" + (isOpen ? " open" : ""), onClick: function (e) { e.stopPropagation(); toggleCat(c); } }, RI.chev()),
              h("span", { className: "rd-cat-dot", style: { background: RSS.catColor(c) } }),
              h("span", { className: "rd-cat-name" }, c),
              catUnread > 0 && h("span", { className: "rd-nav-ct" }, catUnread)
            ),
            isOpen && h("div", { className: "rd-feedlist" },
              list.map(function (f) {
                var u = unreadCountFeed(f.id);
                return h("div", { key: f.id, className: "rd-feedwrap" },
                  h("button", { className: "rd-feed" + (scope.type === "feed" && scope.value === f.id ? " active" : ""),
                    onClick: function () { setScope({ type: "feed", value: f.id }); } },
                    h("span", { className: "rd-feed-fav", style: { background: f.color } }),
                    h("span", { className: "rd-feed-name" }, f.title),
                    u > 0 && h("span", { className: "rd-nav-ct" }, u)
                  ),
                  !READ_ONLY && h("button", { className: "rd-unsub", title: "Unsubscribe", onClick: function (e) { doUnsub(e, f); } }, RI.x({ s: 12 }))
                );
              })
            )
          );
        })
      ),
      !READ_ONLY && h("button", { className: "rd-addfeed", onClick: function () { setAddOpen(true); } }, RI.plus({ s: 15 }), "Subscribe to feed")
    );

    // ---------- article list (grid / list) ----------
    function Card(props) {
      var a = props.a, f = props.f, read = props.read, starred = props.starred, i = props.i;
      return h("div", { className: "rd-card" + (read ? " read" : "") + (props.size ? " rd-card--" + props.size : ""), onClick: function () { openArticle({ a: a, f: f }); } },
        h(Photo, { color: f.color, image: a.image, i: i, seed: a.id }),
        h("div", { className: "rd-card-body" },
          h("div", { className: "rd-src" },
            h("span", { className: "rd-src-fav", style: { background: f.color } }),
            h("b", null, f.title), h("span", { className: "rd-sep" }), h("span", null, relTime(a.publishedAt)),
            h("span", { className: "rd-cat-tag", style: { color: f.color } }, f.category)),
          h("h3", { className: "rd-card-title" }, a.title),
          h("p", { className: "rd-card-sum" }, a.summary),
          (a.tags && a.tags.length) ? h("div", { className: "rd-tags" }, a.tags.map(function (t) { return h("span", { key: t, className: "rd-tag" }, "#" + t); })) : null
        ),
        !READ_ONLY && h("button", { className: "rd-star" + (starred ? " on" : ""), title: starred ? "Unstar" : "Star", onClick: function (e) { toggleStar(e, a.id); } }, RI.star({ s: 16, fill: starred }))
      );
    }

    function Row(props) {
      var a = props.a, f = props.f, read = props.read, starred = props.starred, i = props.i;
      return h("div", { className: "rd-row" + (read ? " read" : ""), onClick: function () { openArticle({ a: a, f: f }); } },
        h(Photo, { color: f.color, image: a.image, i: i, seed: a.id, className: "rd-row-ph" }),
        h("div", { className: "rd-row-body" },
          h("div", { className: "rd-src" },
            h("span", { className: "rd-src-fav", style: { background: f.color } }),
            h("b", null, f.title), h("span", { className: "rd-sep" }), h("span", null, relTime(a.publishedAt)),
            h("span", { className: "rd-cat-tag", style: { color: f.color } }, f.category)),
          h("div", { className: "rd-row-title" }, a.title),
          h("div", { className: "rd-row-sum" }, a.summary)
        ),
        !READ_ONLY && h("button", { className: "rd-star" + (starred ? " on" : ""), title: starred ? "Unstar" : "Star", onClick: function (e) { toggleStar(e, a.id); } }, RI.star({ s: 16, fill: starred }))
      );
    }

    var listEl;
    if (loading) {
      listEl = h("div", { className: "rd-empty" }, "Loading feeds\u2026");
    } else if (!current.length) {
      listEl = h("div", { className: "rd-empty" },
        h("div", { className: "rd-empty-ic" }, RI.rss({ s: 30 })),
        h("div", null, q ? "No articles match \u201C" + q + "\u201D"
          : scope.type === "starred" ? "No starred articles yet"
          : scope.type === "unread" ? "You're all caught up \u2728"
          : "No articles here yet"),
        scope.type === "all" && !q && !READ_ONLY && h("button", { className: "rd-link", onClick: function () { setAddOpen(true); } }, "Subscribe to a feed"));
    } else if (view === "grid") {
      listEl = h("div", { className: "rd-grid" }, current.map(function (it, i) {
        return h(Card, { key: it.a.id, a: it.a, f: it.f, i: i, read: !!state.read[it.a.id], starred: !!state.starred[it.a.id] });
      }));
    } else if (view === "magazine") {
      var featured = current.slice(0, 5);
      var grid = current.slice(featured.length);
      var sizeFor = function (i) { var m = i % 5; return m === 0 ? "lg" : m === 1 ? "md" : "sm"; };
      listEl = h("div", { className: "rd-mag" },
        h(MagSlider, { items: featured, open: openArticle }),
        grid.length ? h("div", { className: "rd-mag-grid" }, grid.map(function (it, i) {
          return h(Card, { key: it.a.id, a: it.a, f: it.f, i: i + featured.length, size: sizeFor(i), read: !!state.read[it.a.id], starred: !!state.starred[it.a.id] });
        })) : null
      );
    } else {
      listEl = h("div", { className: "rd-rows" }, current.map(function (it, i) {
        return h(Row, { key: it.a.id, a: it.a, f: it.f, i: i, read: !!state.read[it.a.id], starred: !!state.starred[it.a.id] });
      }));
    }

    // ---------- topbar ----------
    var topbar = h("div", { className: "rd-top" },
      h("div", { className: "rd-top-title" },
        h("h1", null, scopeTitle),
        h("span", { className: "rd-top-sub" }, current.length + " article" + (current.length === 1 ? "" : "s")
          + (scope.type !== "unread" && scope.type !== "starred" ? " \u00B7 " + current.filter(function (it) { return !state.read[it.a.id]; }).length + " unread" : ""))),
      h("div", { className: "rd-grow" }),
      h("div", { className: "rd-search" }, RI.search(), h("input", { type: "text", placeholder: "Search articles\u2026", value: q, onChange: function (e) { setQ(e.target.value); } })),
      current.some(function (it) { return !state.read[it.a.id]; }) && !READ_ONLY && h("button", { className: "rd-ghost", onClick: doMarkAllRead, title: "Mark all as read" }, RI.check(), "Mark read"),
      h("div", { className: "rd-viewtoggle" },
        h("button", { className: "rd-vt" + (view === "magazine" ? " active" : ""), title: "Magazine", onClick: function () { setViewP("magazine"); } }, RI.mag()),
        h("button", { className: "rd-vt" + (view === "grid" ? " active" : ""), title: "Grid", onClick: function () { setViewP("grid"); } }, RI.grid()),
        h("button", { className: "rd-vt" + (view === "list" ? " active" : ""), title: "List", onClick: function () { setViewP("list"); } }, RI.list())),
      !READ_ONLY && h("button", { className: "rd-primary", onClick: function () { setAddOpen(true); } }, RI.plus(), "Add feed")
    );

    // ---------- reading overlay ----------
    var reading = open && h(ReadingPane, {
      it: open, starred: !!state.starred[open.a.id],
      onClose: function () { setOpen(null); },
      onStar: function (e) { toggleStar(e, open.a.id); },
    });

    // ---------- coming-soon disclaimer ----------
    var banner = READ_ONLY && h("div", { className: "rd-banner" },
      h("span", { className: "rd-banner-badge" }, "Coming soon"),
      h("span", { className: "rd-banner-txt" },
        h("b", null, "The Reader is a preview."),
        " Browse the sample feeds below \u2014 subscribing, starring and syncing your own articles arrive in a future update.")
    );

    // ---------- add-feed modal ----------
    var modal = !READ_ONLY && addOpen && h(AddFeedModal, { onClose: function () { setAddOpen(false); }, onDone: async function () { setAddOpen(false); await reload(); } });

    return h("div", { className: "rd" },
      sidebar,
      h("div", { className: "rd-stage" }, topbar, banner, h("div", { className: "rd-scroll" }, listEl)),
      reading, modal
    );
  }

  // ============================================================
  function ReadingPane(props) {
    var a = props.it.a, f = props.it.f;
    var body = a.summary + " " + a.summary;
    return h("div", { className: "rd-reading-overlay", onClick: props.onClose },
      h("div", { className: "rd-reading", onClick: function (e) { e.stopPropagation(); } },
        h("div", { className: "rd-reading-bar" },
          h("button", { className: "rd-iconbtn", onClick: props.onClose, title: "Back" }, RI.back()),
          h("div", { className: "rd-grow" }),
          !READ_ONLY && h("button", { className: "rd-iconbtn" + (props.starred ? " on" : ""), onClick: props.onStar, title: props.starred ? "Unstar" : "Star" }, RI.star({ s: 18, fill: props.starred })),
          !READ_ONLY && h("a", { className: "rd-iconbtn", href: a.url, target: "_blank", rel: "noopener", title: "Open original" }, RI.ext())
        ),
        h("div", { className: "rd-reading-scroll" },
          h("div", { className: "rd-reading-inner" },
            h("div", { className: "rd-src" },
              h("span", { className: "rd-src-fav", style: { background: f.color } }),
              h("b", null, f.title), h("span", { className: "rd-sep" }), h("span", null, relTime(a.publishedAt) + " ago"),
              h("span", { className: "rd-cat-tag", style: { color: f.color } }, f.category)),
            h("h1", { className: "rd-reading-title" }, a.title),
            (a.tags && a.tags.length) ? h("div", { className: "rd-tags", style: { marginTop: 12 } }, a.tags.map(function (t) { return h("span", { key: t, className: "rd-tag" }, "#" + t); })) : null,
            h(Photo, { color: f.color, image: a.image, i: 0, seed: a.id, className: "rd-reading-hero" }),
            h("p", { className: "rd-reading-body lead" }, a.summary),
            h("p", { className: "rd-reading-body" }, "This is a preview of the article as it would appear in your reader. " + body),
            h("p", { className: "rd-reading-body" }, "In the packaged extension the full text and images are pulled straight from the feed. " + a.summary),
            READ_ONLY
              ? h("div", { className: "rd-readmore rd-readmore--disabled" }, "Opening the original article is disabled in this preview")
              : h("a", { className: "rd-readmore", href: a.url, target: "_blank", rel: "noopener" }, "Read full article on " + RSS.hostOf(f.url), RI.ext({ s: 14 }))
          )
        )
      )
    );
  }

  // ============================================================
  function AddFeedModal(props) {
    var su = useState(""), url = su[0], setUrl = su[1];
    var sc = useState(RSS.CATEGORIES[1]), cat = sc[0], setCat = sc[1];
    var stg = useState(""), tags = stg[0], setTags = stg[1];
    var sb = useState(false), busy = sb[0], setBusy = sb[1];
    var se = useState(""), err = se[0], setErr = se[1];

    var submit = async function (e) {
      e.preventDefault();
      if (!url.trim()) return;
      setBusy(true); setErr("");
      try {
        await RSS.subscribe(url.trim(), {
          category: cat,
          tags: tags.split(",").map(function (t) { return t.trim().replace(/^#/, ""); }).filter(Boolean),
        });
        props.onDone();
      } catch (ex) {
        setErr(ex.message || "Could not subscribe");
        setBusy(false);
      }
    };

    return h("div", { className: "rd-modal-overlay", onClick: props.onClose },
      h("form", { className: "rd-modal", onClick: function (e) { e.stopPropagation(); }, onSubmit: submit },
        h("div", { className: "rd-modal-head" },
          h("h2", null, "Subscribe to a feed"),
          h("button", { type: "button", className: "rd-iconbtn", onClick: props.onClose }, RI.x())),
        h("p", { className: "rd-modal-hint" }, "Paste a site or RSS/Atom feed URL. We\u2019ll fetch the feed and start tracking new articles."),
        h("label", { className: "rd-field" },
          h("span", null, "Feed or site URL"),
          h("input", { type: "text", autoFocus: true, placeholder: "https://www.theverge.com/rss/index.xml", value: url, onChange: function (e) { setUrl(e.target.value); } })),
        h("div", { className: "rd-field-row" },
          h("label", { className: "rd-field" },
            h("span", null, "Category"),
            h("select", { value: cat, onChange: function (e) { setCat(e.target.value); } },
              RSS.CATEGORIES.map(function (c) { return h("option", { key: c, value: c }, c); }))),
          h("label", { className: "rd-field" },
            h("span", null, "Tags (optional)"),
            h("input", { type: "text", placeholder: "tech, ai", value: tags, onChange: function (e) { setTags(e.target.value); } }))),
        err && h("div", { className: "rd-modal-err" }, err),
        h("div", { className: "rd-modal-foot" },
          h("button", { type: "button", className: "rd-ghost", onClick: props.onClose }, "Cancel"),
          h("button", { type: "submit", className: "rd-primary", disabled: busy }, busy ? "Subscribing\u2026" : "Subscribe"))
      )
    );
  }

  // ============================================================
  function Slide(props) {
    var a = props.it.a, f = props.it.f;
    return h("div", { className: "rd-slide", onClick: function () { props.open(props.it); } },
      h(Photo, { color: f.color, image: a.image, i: 0, seed: a.id, className: "rd-slide-ph" }),
      h("div", { className: "rd-slide-scrim" }),
      h("div", { className: "rd-slide-body" },
        h("span", { className: "rd-slide-cat", style: { background: f.color } }, f.category),
        h("h2", { className: "rd-slide-title" }, a.title),
        h("p", { className: "rd-slide-sum" }, a.summary),
        h("div", { className: "rd-src light" },
          h("span", { className: "rd-src-fav", style: { background: f.color } }),
          h("b", null, f.title), h("span", { className: "rd-sep" }), h("span", null, relTime(a.publishedAt)))
      )
    );
  }

  function MagSlider(props) {
    var items = props.items || [];
    var n = items.length;
    var st = useState(0); var idx = st[0], setIdx = st[1];
    var hv = useState(false); var hover = hv[0], setHover = hv[1];
    useEffect(function () {
      if (n <= 1 || hover) return;
      var t = setInterval(function () { setIdx(function (i) { return (i + 1) % n; }); }, 6000);
      return function () { clearInterval(t); };
    }, [n, hover]);
    useEffect(function () { if (idx >= n) setIdx(0); }, [n, idx]);
    if (!n) return null;
    var go = function (d) { setIdx(function (i) { return (i + d + n) % n; }); };
    return h("div", { className: "rd-slider", onMouseEnter: function () { setHover(true); }, onMouseLeave: function () { setHover(false); } },
      h("div", { className: "rd-slider-track", style: { transform: "translateX(" + (-idx * 100) + "%)" } },
        items.map(function (it) { return h(Slide, { key: it.a.id, it: it, open: props.open }); })),
      n > 1 && h("button", { className: "rd-slider-arrow left", title: "Previous", onClick: function (e) { e.stopPropagation(); go(-1); } }, RI.back()),
      n > 1 && h("button", { className: "rd-slider-arrow right", title: "Next", onClick: function (e) { e.stopPropagation(); go(1); } }, RI.fwd()),
      n > 1 && h("div", { className: "rd-slider-dots" },
        items.map(function (it, i) { return h("button", { key: i, className: "rd-dot" + (i === idx ? " on" : ""), onClick: function (e) { e.stopPropagation(); setIdx(i); } }); }))
    );
  }

  window.ReaderApp = ReaderApp;
})();
