from pathlib import Path
import zipfile,sys
optional="--optional" in sys.argv
root=Path(__file__).resolve().parent.parent
assets=['manifest.json','manager.html','panel.html','settings.html','manual.html','terms.html','LICENSE','privacy.html','background.js','icons/icon16.png','icons/icon48.png','icons/icon128.png']
assets += sorted(str(p.relative_to(root)) for p in (root/'bookmark-core').glob('*') if p.suffix in ['.js','.css'])
missing=[p for p in assets if not (root/p).is_file()]
if missing: raise SystemExit('Missing package assets: '+', '.join(missing))
out=root/'dist';out.mkdir(exist_ok=True)
with zipfile.ZipFile(out/('1stTab-bookmarks-optional.zip' if optional else '1stTab-bookmarks.zip'),'w',zipfile.ZIP_DEFLATED) as z:
 for name in assets:
  info=zipfile.ZipInfo(name,date_time=(2026,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o644<<16
  z.writestr(info,(root/('manifest.optional.json' if optional and name=='manifest.json' else 'privacy.optional.html' if optional and name=='privacy.html' else name)).read_bytes())
print('Packaged',len(assets),'assets:',out/('1stTab-bookmarks-optional.zip' if optional else '1stTab-bookmarks.zip'))
