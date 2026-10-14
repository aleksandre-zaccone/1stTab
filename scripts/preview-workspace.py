"""Render the real workspace UI with the first-install starter bookmarks."""
from pathlib import Path
import argparse, base64, json, mimetypes, os, re
root = Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('output',nargs='?',default=str(root/'innerDocumentation/workspace-preview.html'))
parser.add_argument('--design',choices=['prism','atelier','studio','pop','enterprise'],default='enterprise')
args=parser.parse_args();out=Path(args.output).resolve()
imports = re.compile(r"import\s*\{([^}]+)\}\s*from\s*['\"]\./([\w-]+)\.js['\"]\s*;")
exports = re.compile(r'\bexport\s+(?:async\s+)?(?:function|class|const)\s+(\w+)')
chunks=[]
site_icons={str(p.relative_to(root)):'data:'+mimetypes.guess_type(p.name)[0]+';base64,'+base64.b64encode(p.read_bytes()).decode() for p in (root/'icons/sites').glob('*') if p.suffix in ['.png','.svg','.ico','.webp']}
chunks.append('const __siteIcons='+json.dumps(site_icons)+';')
mock=(root/'tests/mock-chrome.js').read_text().replace('export function','function')
chunks.append(mock+"\nwindow.chrome=mockChrome();chrome.runtime={getURL:p=>__siteIcons[p]||(p==='manager.html'?location.href:p),getManifest:()=>({version:"+json.dumps(json.loads((root/'manifest.json').read_text())['version'])+"})};chrome.tabs={create:async v=>v};")
starter=json.loads((root/'initial_bookmarks.json').read_text())
chunks.append('''// Clear mock test bookmarks, then run the actual first-install initializer.
await chrome.bookmarks.remove('a');await chrome.bookmarks.removeTree('folder');await chrome.bookmarks.removeTree('managed');
await chrome.storage.local.set({'bookmarks.initialBookmarks.v1':{pending:true}});
const __starter='''+json.dumps(starter)+''',__nativeFetch=window.fetch.bind(window);
window.fetch=(url,...args)=>String(url)==='initial_bookmarks.json'?Promise.resolve(new Response(JSON.stringify(__starter),{headers:{'Content-Type':'application/json'}})):__nativeFetch(url,...args);''')
chunks.append('''const __prefKey='bookmarks.preferences.v1',__previewKey='1sttab.preview.preferences:'+location.pathname;
let __savedPrefs={design:'''+json.dumps(args.design)+''',view:'''+json.dumps('grid')+'''};try{const stored=localStorage.getItem(__previewKey);if(stored)__savedPrefs=JSON.parse(stored)}catch{}
await chrome.storage.local.set({[__prefKey]:__savedPrefs});
const __setStorage=chrome.storage.local.set.bind(chrome.storage.local);
chrome.storage.local.set=async value=>{await __setStorage(value);if(Object.hasOwn(value,__prefKey)){try{localStorage.setItem(__previewKey,JSON.stringify(value[__prefKey]))}catch{}}};''')
for name in ['preferences','library','transfer','recovery','integrations','favicon','initial-bookmarks','ui']:
    source=(root/f'bookmark-core/{name}.js').read_text()
    if name=='ui':
        for doc in ['manual.html','privacy.html','terms.html']:
            source=source.replace("href:'"+doc+"'", "href:"+json.dumps(os.path.relpath(root/doc,out.parent)))
    names=exports.findall(source)
    source=imports.sub(lambda m:'const {'+m[1]+'}=__'+m[2].replace('-','_')+';', source)
    source=re.sub(r'\bexport\s+','',source)
    chunks.append('const __'+name.replace('-','_')+'=(()=>{'+source+'\nreturn {'+','.join(names)+'};})();')
chunks.append("const __previewObserver=new MutationObserver(()=>{if(document.querySelector('#status')?.textContent==='Library ready.'){__previewObserver.disconnect();const params=new URL(location.href).searchParams;if(params.get('filters')==='1'&&document.querySelector('#filter-tray').hidden)document.querySelector('#filters-toggle').click();const section=params.get('settings');if(section==='1'||section==='library'){document.querySelector('button[aria-label=Settings]')?.click();if(section==='library')document.querySelector('#settings-library-tools')?.scrollIntoView({block:'center'})}}});__previewObserver.observe(document.body,{childList:true,subtree:true,characterData:true});")
style='\n'.join((root/f'bookmark-core/{name}.css').read_text().replace("@import url('./tokens.css');",'') for name in ['tokens','style','themes','settings','layout'])
script='\n'.join(chunks).replace('</script','<\\/script')
out.parent.mkdir(parents=True,exist_ok=True)
out.write_text('<!doctype html><html lang="en" data-preview="true"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>1stTab — '+args.design.title()+' workspace preview</title><style>'+style+'</style></head><body><main id="app"></main><script type="module">'+script+'</script></body></html>')
print('Standalone preview:',out)
