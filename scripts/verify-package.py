from pathlib import Path,PurePosixPath
from html.parser import HTMLParser
import json,re,zipfile,hashlib
root=Path(__file__).resolve().parent.parent
version=json.loads((root/'manifest.json').read_text())['version']
package=root/f'dist/1stTab-bookmarks-{version}.zip'
class Assets(HTMLParser):
 def __init__(self):super().__init__();self.refs=[]
 def handle_starttag(self,t,a):
  d=dict(a)
  if t in ('script','link'):self.refs.append(d.get('src') or d.get('href'))
with zipfile.ZipFile(package) as z:
 names=set(z.namelist());m=json.loads(z.read('manifest.json'))
 assert 'initial_bookmarks.json' in names
 assert m['default_locale']=='en'
 catalogs={lang:json.loads(z.read(f'_locales/{lang}/messages.json')) for lang in ['en','ru','ka','de','ja']}
 for lang,catalog in catalogs.items():
  assert catalog.keys()==catalogs['en'].keys(),f'Incomplete locale: {lang}'
  for key,value in catalog.items():
   assert value.get('message'),(lang,key)
   assert set(re.findall(r'\{(\w+)\}',value['message']))==set(re.findall(r'\{(\w+)\}',catalogs['en'][key]['message'])),(lang,key)
 for token in re.findall(r'__MSG_(\w+)__',json.dumps(m)):
  assert token in catalogs['en'],f'Unknown manifest message: {token}'
 assert 'bookmark-core/integrations.js' not in names
 for icon in (root/'icons/sites').glob('*'):
  if icon.suffix in ['.png','.svg','.ico','.webp']:assert str(icon.relative_to(root)) in names,f'Missing bundled icon: {icon.name}'
 assert set(m['permissions'])=={'bookmarks','storage','sidePanel','activeTab','favicon'}
 assert m['optional_permissions']==['identity']
 assert set(m['optional_host_permissions'])=={'https://www.googleapis.com/*'}
 assert m['oauth2']['client_id'].endswith('.apps.googleusercontent.com')
 assert m['oauth2']['scopes']==['https://www.googleapis.com/auth/drive.appdata']
 assert m['chrome_url_overrides']=={'newtab':'manager.html'}
 assert 'host_permissions' not in m
 assert m['minimum_chrome_version']=='116'
 for page in ['manager.html','panel.html','settings.html','manual.html','terms.html','privacy.html']:
  parser=Assets();parser.feed(z.read(page).decode())
  for ref in parser.refs:
   assert ref and not ref.startswith(('http:','https:','//')),f'Remote asset: {ref}'
   assert ref in names,f'Missing asset: {ref}'
 for name in names:
  assert z.read(name)==(root/name).read_bytes(),f'Stale bundled file {name}'
  if name.endswith('.css'):
   import posixpath
   for ref in re.findall(r'@import\s+url\([\"\']?([^\"\')]+)',z.read(name).decode()):
    assert posixpath.normpath(str(PurePosixPath(name).parent/ref)) in names,(name,ref)
  if name.endswith('.js'):
   s=z.read(name).decode()
   assert not re.search(r'chrome\.(history|sessions|tabGroups|system)|\beval\s*\(|new Function\s*\(',s),name
   for ref in re.findall(r'(?:from\s*|import\s*)[\'\"]([^\'\"]+)[\'\"]',s):
    if ref.startswith('.'):
     import posixpath
     assert posixpath.normpath(str(PurePosixPath(name).parent/ref)) in names,(name,ref)
 assert not any(name.endswith('.jsx') or name in ['app.js','finance.js','data.js','react.min.js'] for name in names)
print('Manifest, local resources, import graph, source parity and package boundaries verified.')
print('SHA256:',hashlib.sha256(package.read_bytes()).hexdigest())
