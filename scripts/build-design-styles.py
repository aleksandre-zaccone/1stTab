from pathlib import Path
import json,re
root=Path(__file__).resolve().parent.parent

def scale_css(css):
 def rule(m):
  selector,body=m[1],m[2]
  factor='--icon-scale' if '.bookmark-tile' in selector else '--text-scale'
  body=re.sub(r'(font-size\s*:\s*)([\d.]+)px',lambda n:n[1]+'calc('+n[2]+'px * var('+factor+',1))',body)
  body=re.sub(r'(font\s*:\s*)([\d.]+)px',lambda n:n[1]+'calc('+n[2]+'px * var(--text-scale,1))',body)
  if re.search(r'\bsvg\b|\.icon-button|\.tree-toggle|\.favorite\b|\.brand-symbol|\.bookmark-tile|input\[type=checkbox\]',selector):
   body=re.sub(r'((?:min-)?(?:width|height)\s*:\s*)([\d.]+)px',lambda n:n[1]+'calc('+n[2]+'px * var(--icon-scale,1))',body)
  return selector+'{'+body+'}'
 return re.sub(r'([^{}]+)\{([^{}]*)\}',rule,css)

variants=json.loads((root/'scripts/design-styles.json').read_text())
chunks=['/* Scoped design choices. All themes share the same bookmark functionality. */']
for name,css in variants.items():
 prefix=':root[data-design="'+name+'"]'
 def scope(m):
  selectors=[]
  for selector in m[1].split(','):
   selector=selector.strip()
   selectors.append(prefix+':not([data-theme="dark"])' if selector==':root' else prefix+' '+selector)
  return ','.join(selectors)+'{'+m[2]+'}'
 chunks.append(re.sub(r'([^{}]+)\{([^{}]*)\}',scope,css))
# Shared dark surfaces keep every design readable while retaining its typography and shapes.
chunks.append('''
/* Warm, cool and playful dark palettes retain the selected design. */
:root[data-theme=dark][data-design=atelier]{--bg:#1e1b18;--surface:#29251f;--surface-2:#353027;--surface-hover:#393126;--text:#f2e9da;--text-2:#d2c4b1;--text-mute:#b8a992;--border:#494034;--border-strong:#796a55;--accent:#e5a586;--accent-hover:#edb798;--accent-soft:#51382c;--accent-text:#f0b899;--sidebar:#25211b;--sidebar-text:#d6c9b6;--sidebar-muted:#b8aa92;--sidebar-line:#524736;--sidebar-hover:#393126;--tag:#46392c;--tag-text:#ddc4a4}
:root[data-theme=dark][data-design=studio]{--bg:#111b29;--surface:#1b293b;--surface-2:#26364d;--surface-hover:#283b55;--accent:#8bb9ff;--accent-hover:#b6d3ff;--accent-soft:#263e65;--accent-text:#b6d3ff;--sidebar:#172334;--sidebar-hover:#26364d}
:root[data-theme=dark][data-design=pop]{--bg:#211d29;--surface:#2c2638;--surface-2:#3a3048;--surface-hover:#413350;--accent:#ccb0ff;--accent-hover:#decaff;--accent-soft:#4b365f;--accent-text:#e2caff;--sidebar:#302737;--sidebar-hover:#49354f}
:root[data-theme=dark][data-design=enterprise]{--bg:#131c28;--surface:#1d2939;--surface-2:#28374a;--surface-hover:#2c3d52;--text:#e9eef5;--text-2:#bdcbdc;--text-mute:#a2b3c8;--border:#36465c;--border-strong:#657d99;--accent:#95b8df;--accent-hover:#b4cfed;--accent-soft:#2e4764;--accent-text:#b4cfed;--sidebar:#182333;--sidebar-text:#c0cede;--sidebar-muted:#9cafc7;--sidebar-line:#36465c;--sidebar-hover:#28374a}
:root[data-theme=dark][data-design] body{background:var(--bg)}
:root[data-theme=dark][data-design] .tree{background:var(--sidebar);border-color:var(--border);box-shadow:none}
:root[data-theme=dark][data-design] .sidebar-brand,:root[data-theme=dark][data-design] .tree-head h2{color:var(--text)}
:root[data-theme=dark][data-design] .sidebar-brand b{color:var(--accent)}
:root[data-theme=dark][data-design] .tree-head .icon-button{background:var(--surface-2);color:var(--text);border-color:var(--border)}
:root[data-theme=dark][data-design] .tree-node.selected,:root[data-theme=dark][data-design] .tree-node.selected:hover{background:var(--accent-soft);color:var(--accent-text);box-shadow:none}
:root[data-theme=dark][data-design] .tree-node.selected svg{color:var(--accent-text)}
:root[data-theme=dark][data-design] .tree-node:hover{background:var(--surface-2);color:var(--text)}
:root[data-theme=dark][data-design] .search-box{background:var(--surface);border-color:var(--border-strong);box-shadow:none}
:root[data-theme=dark][data-design] .collection-tab.active{background:var(--accent-soft);color:var(--accent-text);border-color:var(--border)}
:root[data-theme=dark][data-design] .results.list .bookmark{background:var(--surface);border-color:var(--border);border-left-color:var(--card-spot);box-shadow:none}
:root[data-theme=dark][data-design] .results.grid .bookmark{background:var(--surface);border-color:var(--border);box-shadow:none}
:root[data-theme=dark][data-design] .bookmark-note{color:var(--text-mute)}
:root[data-theme=dark][data-design] .bookmark-meta{border-color:var(--border)}
:root[data-theme=dark][data-design] .folder-chip,:root[data-theme=dark][data-design] .row-actions .icon-button{background:var(--surface-2);border-color:var(--border);color:var(--text-2)}
:root[data-theme=dark][data-design] .tree-actions .icon-button:hover{background:var(--surface-2);color:var(--text)}
/* Replace light-only fills and text while keeping each design's geometry. */
:root[data-theme=dark][data-design] .bookmark-tile{background:color-mix(in srgb,var(--card-spot) 22%,var(--surface));color:color-mix(in srgb,var(--card-spot) 80%,white)}
:root[data-theme=dark][data-design] .tag{background:color-mix(in srgb,var(--card-spot) 13%,var(--surface));color:color-mix(in srgb,var(--card-spot) 75%,white)}
:root[data-theme=dark][data-design] .primary{background:var(--accent);border-color:var(--accent);color:var(--bg);box-shadow:none}
:root[data-theme=dark][data-design] .primary:hover{background:var(--accent-hover);border-color:var(--accent-hover)}
:root[data-theme=dark][data-design] .eyebrow,:root[data-theme=dark][data-design] .search-box svg{color:var(--accent-text)}
:root[data-theme=dark][data-design] .workspace-tools .icon-button:hover,:root[data-theme=dark][data-design] .workspace-tools .icon-button[aria-expanded=true]{color:var(--accent-text)}
:root[data-theme=dark][data-design] .card-controls{color:var(--text-mute)}
''')
(root/'bookmark-core/themes.css').write_text(scale_css('\n'.join(chunks)))
# Scaling is idempotent: only plain pixel values are converted.
p=root/'bookmark-core/style.css';p.write_text(scale_css(p.read_text()))
print('Built scoped design themes and independent text/icon scaling.')
