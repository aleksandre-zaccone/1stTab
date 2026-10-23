from pathlib import Path
import json,zipfile
root=Path(__file__).resolve().parent.parent
version=json.loads((root/'manifest.json').read_text())['version']
assets=['initial_bookmarks.json','manifest.json','manager.html','panel.html','settings.html','manual.html','terms.html','LICENSE','privacy.html','background.js','icons/icon16.png','icons/icon48.png','icons/icon128.png']
assets += sorted(str(p.relative_to(root)) for p in (root/'bookmark-core').glob('*') if p.suffix in ['.js','.css'] and p.name!='integrations.js')
assets += sorted(str(p.relative_to(root)) for p in (root/'icons/sites').glob('*') if p.suffix in ['.png','.svg','.ico','.webp'])
assets += sorted(str(p.relative_to(root)) for p in (root/'_locales').glob('*/messages.json'))
missing=[p for p in assets if not (root/p).is_file()]
if missing: raise SystemExit('Missing package assets: '+', '.join(missing))
out=root/'dist';out.mkdir(exist_ok=True)
package=out/f'1stTab-bookmarks-{version}.zip'
with zipfile.ZipFile(package,'w',zipfile.ZIP_DEFLATED) as z:
 for name in assets:
  info=zipfile.ZipInfo(name,date_time=(2026,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o644<<16
  z.writestr(info,(root/name).read_bytes())
print('Packaged',len(assets),'assets:',package)
