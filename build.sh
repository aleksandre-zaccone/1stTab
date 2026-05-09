#!/usr/bin/env bash
# 1stTab production build — compiles JSX and creates Web Store zip
set -e
cd "$(dirname "$0")"

EB="node_modules/.bin/esbuild"
FLAGS="--jsx=transform --jsx-factory=React.createElement --jsx-fragment=React.Fragment --target=chrome112"

echo "▶ Compiling JSX..."
for f in tweaks-panel icons data clocks weather quote bookmarks manager app manager-app settings-app panel; do
  $EB ${f}.jsx $FLAGS --outfile=${f}.js
  echo "  ✓ ${f}.js"
done

echo "▶ Packaging..."
python3 - << 'PYEOF'
import zipfile, os
files = [
  'manifest.json','newtab.html','manager.html','settings.html','privacy.html','dashboard.css',
  'react.min.js','react-dom.min.js','defaults.js',
  'tweaks-panel.js','icons.js','data.js','clocks.js','weather.js','quote.js',
  'bookmarks.js','manager.js','app.js','manager-app.js','settings-app.js','panel.js',
  'panel.html','panel.css','background.js',
  'icons/icon16.png','icons/icon48.png','icons/icon128.png',
]
with zipfile.ZipFile('1stTab.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    [z.write(f) for f in files]
print(f"  ✓ 1stTab.zip — {os.path.getsize('1stTab.zip')//1024} KB")
PYEOF
echo "▶ Done. Upload 1stTab.zip to the Chrome Web Store."
