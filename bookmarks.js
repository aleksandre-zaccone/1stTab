var { useState, useMemo, useEffect, useCallback, useRef } = React;
var h = React.createElement;
var BM_KEYS = {
  labels: "nt.bm.showLabels",
  cap: "nt.bm.stripCap",
  collapsed: "nt.bm.collapsedTags",
  sort: "nt.bm.sort",
  shape: "nt.bm.shape",
  view: "nt.bm.view"
};
var BM_SHAPES = [
  { id: "squircle", label: "Squircle" },
  { id: "circle", label: "Circle" },
  { id: "card", label: "Card" },
  { id: "oval", label: "Oval" },
  { id: "square", label: "Square" }
];
function normalizeTags(meta) {
  if (!meta) return [];
  if (Array.isArray(meta.tags)) return meta.tags.filter(Boolean);
  if (meta.tag) return [meta.tag];
  return [];
}
function tagHue(name) {
  var hsh = 0;
  for (var i = 0; i < name.length; i++) hsh = (hsh * 31 + name.charCodeAt(i)) % 360;
  return hsh;
}
function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (e) {
    return "";
  }
}
function BookmarksHero() {
  var [bookmarks, setBookmarks] = useState([]);
  var [folders, setFolders] = useState([]);
  var [folderCount, setFolderCount] = useState(0);
  var [meta, setMeta] = useState({});
  var [query, setQuery] = useState("");
  var [showLabels, setShowLabels] = useState(true);
  var [cap, setCap] = useState(10);
  var [shape, setShape] = useState("squircle");
  var [view, setView] = useState("tree");
  var [collapsed, setCollapsed] = useState([]);
  var [activeFolderId, setActiveFolderId] = useState("all");
  var [expandedFolders, setExpandedFolders] = useState(["1", "2"]);
  var [settingsOpen, setSettingsOpen] = useState(false);
  var settingsRef = useRef(null);
  var refresh = useCallback(async function() {
    var res = await Promise.all([
      window.Bookmarks.getTree(),
      window.getStorage(window.STORAGE_KEYS.bookmarkMeta, {})
    ]);
    var tree = res[0], m = res[1];
    var b = [], f = [], fc = 0;
    (function walk(nodes) {
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (node.children) {
          if (node.id !== "0") {
            f.push(node);
            fc++;
          }
          walk(node.children);
        } else if (node.url) b.push(node);
      }
    })(tree);
    setBookmarks(b);
    setFolders(f);
    setFolderCount(fc);
    setMeta(m || {});
  }, []);
  useEffect(function() {
    refresh();
    chrome.bookmarks.onCreated.addListener(refresh);
    chrome.bookmarks.onRemoved.addListener(refresh);
    chrome.bookmarks.onChanged.addListener(refresh);
    chrome.bookmarks.onMoved.addListener(refresh);
    var storageListener = function(changes) {
      if (changes[window.STORAGE_KEYS.bookmarkMeta]) {
        setMeta(changes[window.STORAGE_KEYS.bookmarkMeta].newValue || {});
      }
    };
    chrome.storage.onChanged.addListener(storageListener);
    return function() {
      chrome.bookmarks.onCreated.removeListener(refresh);
      chrome.bookmarks.onRemoved.removeListener(refresh);
      chrome.bookmarks.onChanged.removeListener(refresh);
      chrome.bookmarks.onMoved.removeListener(refresh);
      chrome.storage.onChanged.removeListener(storageListener);
    };
  }, [refresh]);
  useEffect(function() {
    window.getStorage(BM_KEYS.labels, true).then(setShowLabels);
    window.getStorage(BM_KEYS.cap, 10).then(function(v) {
      setCap(Math.min(10, v || 10));
    });
    window.getStorage(BM_KEYS.shape, "squircle").then(setShape);
    window.getStorage(BM_KEYS.view, "tree").then(function(v) {
      setView(v === "grid" ? "card" : v);
    });
    window.getStorage(BM_KEYS.collapsed, []).then(setCollapsed);
    window.getStorage(window.STORAGE_KEYS.folder, "all").then(setActiveFolderId);
    window.getStorage(window.STORAGE_KEYS.treeExpanded, ["1", "2"]).then(setExpandedFolders);
  }, []);
  useEffect(function() {
    if (!settingsOpen) return;
    var onDoc = function(e) {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return function() {
      document.removeEventListener("mousedown", onDoc);
    };
  }, [settingsOpen]);
  var setLabelsP = function(v) {
    setShowLabels(v);
    window.setStorage(BM_KEYS.labels, v);
  };
  var setCapP = function(v) {
    setCap(v);
    window.setStorage(BM_KEYS.cap, v);
  };
  var setShapeP = function(v) {
    setShape(v);
    window.setStorage(BM_KEYS.shape, v);
  };
  var setViewP = function(v) {
    setView(v);
    window.setStorage(BM_KEYS.view, v);
  };
  var setFolderP = function(id) {
    setActiveFolderId(id);
    window.setStorage(window.STORAGE_KEYS.folder, id);
  };
  var toggleExpand = function(e, id) {
    e.stopPropagation();
    var next = expandedFolders.indexOf(id) >= 0 ? expandedFolders.filter(function(x) {
      return x !== id;
    }) : expandedFolders.concat([id]);
    setExpandedFolders(next);
    window.setStorage(window.STORAGE_KEYS.treeExpanded, next);
  };
  var toggleCollapse = function(tag) {
    var next = collapsed.indexOf(tag) >= 0 ? collapsed.filter(function(t) {
      return t !== tag;
    }) : collapsed.concat([tag]);
    setCollapsed(next);
    window.setStorage(BM_KEYS.collapsed, next);
  };
  var togglePin = async function(id) {
    var cur = meta[id] || {};
    var next = Object.assign({}, meta);
    next[id] = Object.assign({}, cur, { pinned: !cur.pinned });
    setMeta(next);
    await window.setStorage(window.STORAGE_KEYS.bookmarkMeta, next);
  };
  var q = query.toLowerCase().trim();
  var matches = function(b) {
    if (!q) return true;
    return (b.title || "").toLowerCase().indexOf(q) >= 0 || (b.url || "").toLowerCase().indexOf(q) >= 0 || normalizeTags(meta[b.id]).join(" ").toLowerCase().indexOf(q) >= 0;
  };
  var pinned = bookmarks.filter(function(b) {
    return meta[b.id] && meta[b.id].pinned;
  });
  var pinnedShown = pinned.filter(matches).slice(0, Math.min(cap, 10));
  var folderDescendantIds = useMemo(function() {
    var childMap = {};
    folders.forEach(function(f) {
      if (!childMap[f.parentId]) childMap[f.parentId] = [];
      childMap[f.parentId].push(f.id);
    });
    var result = {};
    folders.forEach(function(f) {
      var ids = /* @__PURE__ */ new Set([f.id]);
      var stack = (childMap[f.id] || []).slice();
      while (stack.length) {
        var x = stack.pop();
        if (ids.has(x)) continue;
        ids.add(x);
        (childMap[x] || []).forEach(function(c) {
          stack.push(c);
        });
      }
      result[f.id] = ids;
    });
    return result;
  }, [folders]);
  var treeFiltered = useMemo(function() {
    var items = bookmarks;
    if (activeFolderId !== "all") {
      var allowed = folderDescendantIds[activeFolderId] || /* @__PURE__ */ new Set([activeFolderId]);
      items = items.filter(function(x) {
        return allowed.has(x.parentId);
      });
    }
    items = items.filter(matches);
    return items.slice().sort(function(a, b) {
      var pa = meta[a.id] && meta[a.id].pinned ? 0 : 1;
      var pb = meta[b.id] && meta[b.id].pinned ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return (a.title || "").localeCompare(b.title || "");
    });
  }, [bookmarks, meta, activeFolderId, q, folderDescendantIds]);
  var groups = useMemo(function() {
    var map = {};
    var order = [];
    var untagged = [];
    bookmarks.forEach(function(b) {
      if (!matches(b)) return;
      var tags = normalizeTags(meta[b.id]);
      if (tags.length === 0) {
        untagged.push(b);
        return;
      }
      tags.forEach(function(t) {
        if (!map[t]) {
          map[t] = [];
          order.push(t);
        }
        map[t].push(b);
      });
    });
    order.sort(function(a, b) {
      return map[b].length - map[a].length || a.localeCompare(b);
    });
    var out = order.map(function(t) {
      return { tag: t, items: map[t] };
    });
    if (untagged.length) out.push({ tag: "Untagged", items: untagged, untagged: true });
    return out;
  }, [bookmarks, meta, q]);
  var totalShown = groups.reduce(function(n, g) {
    return n + g.items.length;
  }, 0);
  return h(
    "div",
    { className: "card hero-card bm-hero", "data-shape": shape },
    // header
    h(
      "div",
      { className: "card-head bm-head" },
      h(
        "div",
        { className: "bm-title-wrap" },
        h("h2", { className: "bm-title" }, "Bookmarks"),
        h("span", { className: "bm-sub" }, bookmarks.length + " saved \xB7 " + folderCount + " folders")
      ),
      h(
        "div",
        { className: "bm-head-actions" },
        h(
          "div",
          { className: "bm-search" },
          h(Icon.search, { size: 15, style: { color: "var(--text-mute)", flexShrink: 0 } }),
          h("input", {
            type: "text",
            placeholder: "Search bookmarks\u2026",
            value: query,
            onChange: function(e) {
              setQuery(e.target.value);
            }
          })
        ),
        h(
          "div",
          { className: "bm-viewtoggle" },
          h("button", {
            className: "bm-vt-btn" + (view === "tree" ? " active" : ""),
            title: "Folder tree",
            onClick: function() {
              setViewP("tree");
            }
          }, h(Icon.folder, { size: 16 })),
          h("button", {
            className: "bm-vt-btn" + (view === "card" ? " active" : ""),
            title: "Card view",
            onClick: function() {
              setViewP("card");
            }
          }, h(Icon.gridIcon, { size: 16 }))
        ),
        h(
          "div",
          { className: "bm-settings", ref: settingsRef },
          h("button", {
            className: "bm-iconbtn" + (settingsOpen ? " active" : ""),
            title: "Display options",
            onClick: function() {
              setSettingsOpen(function(s) {
                return !s;
              });
            }
          }, h(Icon.sliders ? Icon.sliders : Icon.settings, { size: 16 })),
          settingsOpen && h(
            "div",
            { className: "bm-pop" },
            h(
              "div",
              { className: "bm-pop-row" },
              h("span", { className: "bm-pop-label" }, "Labels under logos"),
              h("button", {
                className: "bm-switch" + (showLabels ? " on" : ""),
                onClick: function() {
                  setLabelsP(!showLabels);
                }
              }, h("span", { className: "bm-switch-dot" }))
            ),
            h(
              "div",
              { className: "bm-pop-row col" },
              h("span", { className: "bm-pop-label" }, "Logo shape"),
              h(
                "div",
                { className: "bm-shapes" },
                BM_SHAPES.map(function(s) {
                  return h("button", {
                    key: s.id,
                    className: "bm-shape-btn" + (shape === s.id ? " active" : ""),
                    title: s.label,
                    onClick: function() {
                      setShapeP(s.id);
                    }
                  }, h("span", { className: "bm-shape-prev shape-" + s.id }), h("span", { className: "bm-shape-lbl" }, s.label));
                })
              )
            ),
            h(
              "div",
              { className: "bm-pop-row col" },
              h(
                "div",
                { className: "bm-pop-row", style: { width: "100%" } },
                h("span", { className: "bm-pop-label" }, "Quick-access size"),
                h("span", { className: "bm-pop-val" }, cap)
              ),
              h("input", {
                type: "range",
                min: 4,
                max: 10,
                step: 1,
                value: cap,
                className: "bm-range",
                onChange: function(e) {
                  setCapP(parseInt(e.target.value, 10));
                }
              })
            )
          )
        ),
        h("a", { href: "manager.html", className: "card-action" }, "Manage \u2192")
      )
    ),
    // ----- tier 1: pinned quick-access strip -----
    pinned.length > 0 && h(
      "div",
      { className: "bm-quick" },
      h(
        "div",
        { className: "bm-quick-grid" },
        pinnedShown.map(function(b) {
          return h(
            "div",
            { key: b.id, className: "qtile-wrap" },
            h(
              "a",
              { href: b.url, className: "qtile", title: b.title + " \u2014 " + hostOf(b.url) },
              h(
                "span",
                { className: "qtile-logo", style: { background: meta[b.id] && meta[b.id].color || "var(--surface-2)" } },
                h(window.BookmarkIcon, { url: b.url, title: b.title, meta: meta[b.id] })
              ),
              showLabels && h("span", { className: "qtile-name" }, b.title)
            ),
            h("button", {
              className: "qtile-unpin",
              title: "Unpin",
              onClick: function(e) {
                e.preventDefault();
                e.stopPropagation();
                togglePin(b.id);
              }
            }, h(Icon.close, { size: 11 }))
          );
        })
      ),
      pinned.length > pinnedShown.length && !q && h(
        "div",
        { className: "bm-quick-more" },
        "+" + (pinned.length - pinnedShown.length) + " more pinned \xB7 the quick strip shows your top " + Math.min(cap, 10) + " \u2014 unpin to swap"
      )
    ),
    // ----- folder tree view -----
    view === "tree" && h(
      "div",
      { className: "bm-tree-layout" },
      h(
        "div",
        { className: "bm-tree" },
        h(
          "div",
          {
            className: "tree-node tree-node-all" + (activeFolderId === "all" ? " selected" : ""),
            onClick: function() {
              setFolderP("all");
            }
          },
          h("span", { className: "tree-chevron placeholder" }, h(ChevronGlyph, null)),
          h("span", { className: "tree-icon" }, h(Icon.zap || Icon.folder, { size: 15 })),
          h("span", { className: "tree-label" }, "All Bookmarks"),
          h("span", { className: "tree-count" }, bookmarks.length)
        ),
        folders.filter(function(f) {
          return f.parentId === "0";
        }).map(function(f) {
          return h(TreeNode, {
            key: f.id,
            node: f,
            depth: 0,
            activeId: activeFolderId,
            onSelect: setFolderP,
            expandedIds: expandedFolders,
            onToggle: toggleExpand
          });
        })
      ),
      h(
        "div",
        { className: "bm-list-pane" },
        treeFiltered.map(function(b) {
          return h(BookmarkRow, {
            key: b.id,
            bookmark: b,
            meta: meta[b.id],
            pinned: !!(meta[b.id] && meta[b.id].pinned),
            onTogglePin: function() {
              togglePin(b.id);
            }
          });
        }),
        treeFiltered.length === 0 && h(
          "div",
          { className: "bm-empty" },
          q ? "No bookmarks match \u201C" + query + "\u201D" : "This folder is empty"
        )
      )
    ),
    // ----- tier 2: tag groups (grid / card) -----
    view !== "tree" && h(
      "div",
      { className: "bm-groups" },
      groups.map(function(g) {
        var isCol = collapsed.indexOf(g.tag) >= 0;
        var hue = g.untagged ? null : tagHue(g.tag);
        return h(
          "section",
          { key: g.tag, className: "bm-group" },
          h(
            "button",
            {
              className: "bm-group-head" + (isCol ? " collapsed" : ""),
              onClick: function() {
                toggleCollapse(g.tag);
              }
            },
            h("span", { className: "bm-group-chev" }, h(ChevronGlyph, null)),
            g.untagged ? h("span", { className: "bm-group-dot untagged" }) : h("span", { className: "bm-group-dot", style: { background: "hsl(" + hue + " 65% 55%)" } }),
            h("span", { className: "bm-group-name" }, g.tag),
            h("span", { className: "bm-group-count" }, g.items.length)
          ),
          !isCol && h(
            "div",
            { className: "bm-group-grid" + (view === "grid" ? " grid-mode" : "") },
            g.items.map(function(b) {
              return h(BookmarkCard, {
                key: g.tag + ":" + b.id,
                bookmark: b,
                meta: meta[b.id],
                view,
                pinned: !!(meta[b.id] && meta[b.id].pinned),
                onTogglePin: function() {
                  togglePin(b.id);
                }
              });
            })
          )
        );
      }),
      totalShown === 0 && h(
        "div",
        { className: "bm-empty" },
        q ? "No bookmarks match \u201C" + query + "\u201D" : "No bookmarks yet"
      )
    )
  );
}
function ChevronGlyph() {
  return h(
    "svg",
    { width: "10", height: "10", viewBox: "0 0 10 10", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" },
    h("polyline", { points: "3.5 2 6.5 5 3.5 8" })
  );
}
function BookmarkCard(props) {
  var b = props.bookmark, meta = props.meta, pinned = props.pinned;
  var host = useMemo(function() {
    return hostOf(b.url);
  }, [b.url]);
  var pinBtn = h("button", {
    className: "bcard-pin" + (pinned ? " active" : ""),
    title: pinned ? "Unpin from quick access" : "Pin to quick access",
    onClick: function(e) {
      e.preventDefault();
      e.stopPropagation();
      props.onTogglePin && props.onTogglePin();
    }
  }, h(Icon.pin, { size: 13 }));
  if (props.view === "grid") {
    return h(
      "div",
      { className: "bcard-wrap grid" },
      h(
        "a",
        { href: b.url, className: "bcard bcard-grid", title: b.title + " \u2014 " + host },
        h(
          "span",
          { className: "bcard-logo", style: { background: meta && meta.color || "var(--surface)" } },
          h(window.BookmarkIcon, { url: b.url, title: b.title, meta })
        ),
        h("span", { className: "bcard-gname" }, b.title)
      ),
      pinBtn
    );
  }
  return h(
    "div",
    { className: "bcard-wrap" },
    h(
      "a",
      { href: b.url, className: "bcard", title: b.title },
      h(
        "span",
        { className: "bcard-logo", style: { background: meta && meta.color || "var(--surface)" } },
        h(window.BookmarkIcon, { url: b.url, title: b.title, meta })
      ),
      h(
        "span",
        { className: "bcard-text" },
        h("span", { className: "bcard-name" }, b.title),
        h("span", { className: "bcard-host" }, host)
      )
    ),
    pinBtn
  );
}
function TreeNode(props) {
  var node = props.node, depth = props.depth, activeId = props.activeId;
  var isExpanded = props.expandedIds.indexOf(node.id) >= 0;
  var isSelected = activeId === node.id;
  var subFolders = (node.children || []).filter(function(c) {
    return c.children;
  });
  var directCount = (node.children || []).filter(function(c) {
    return c.url;
  }).length;
  var hasChildren = subFolders.length > 0;
  return h(
    "div",
    { className: "tree-group" },
    h(
      "div",
      {
        className: "tree-node" + (isSelected ? " selected" : ""),
        style: { paddingLeft: 8 + depth * 14 },
        onClick: function() {
          props.onSelect(node.id);
        }
      },
      h("span", {
        className: "tree-chevron" + (isExpanded ? " expanded" : "") + (hasChildren ? "" : " placeholder"),
        onClick: function(e) {
          e.stopPropagation();
          if (hasChildren) props.onToggle(e, node.id);
        }
      }, h(ChevronGlyph, null)),
      h("span", { className: "tree-icon" }, h(Icon.folder, { size: 15 })),
      h("span", { className: "tree-label" }, node.title || "(untitled)"),
      directCount > 0 && h("span", { className: "tree-count" }, directCount)
    ),
    isExpanded && hasChildren && h(
      "div",
      { className: "tree-children" },
      subFolders.map(function(c) {
        return h(TreeNode, {
          key: c.id,
          node: c,
          depth: depth + 1,
          activeId,
          onSelect: props.onSelect,
          expandedIds: props.expandedIds,
          onToggle: props.onToggle
        });
      })
    )
  );
}
function BookmarkRow(props) {
  var b = props.bookmark, meta = props.meta, pinned = props.pinned;
  var host = useMemo(function() {
    return hostOf(b.url);
  }, [b.url]);
  var tags = normalizeTags(meta);
  return h(
    "div",
    { className: "bm-row-wrap" },
    h(
      "a",
      { href: b.url, className: "bm-row", title: b.title },
      h(
        "span",
        { className: "bm-row-logo", style: { background: meta && meta.color || "var(--surface-2)" } },
        h(window.BookmarkIcon, { url: b.url, title: b.title, meta })
      ),
      h(
        "span",
        { className: "bm-row-main" },
        h(
          "span",
          { className: "bm-row-name" },
          b.title,
          tags.map(function(t) {
            return h("span", { key: t, className: "bm-row-tag" }, t);
          })
        ),
        meta && meta.desc ? h("span", { className: "bm-row-desc" }, meta.desc) : null
      ),
      h("span", { className: "bm-row-host" }, host)
    ),
    h("button", {
      className: "bcard-pin" + (pinned ? " active" : ""),
      title: pinned ? "Unpin from quick access" : "Pin to quick access",
      onClick: function(e) {
        e.preventDefault();
        e.stopPropagation();
        props.onTogglePin && props.onTogglePin();
      }
    }, h(Icon.pin, { size: 13 }))
  );
}
window.BookmarksHero = BookmarksHero;
