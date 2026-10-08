from pathlib import Path,PurePosixPath
from html.parser import HTMLParser
import json,re,zipfile,hashlib,sys
optional="--optional" in sys.argv
root=Path(__file__).resolve().parent.parent
class Assets(HTMLParser):
 def __init__(self):super().__init__();self.refs=[]
 def handle_starttag(self,t,a):
  d=dict(a)
  if t in ('script','link'):self.refs.append(d.get('src') or d.get('href'))
with zipfile.ZipFile(root/('dist/1stTab-bookmarks-optional.zip' if optional else 'dist/1stTab-bookmarks.zip')) as z:
 names=set(z.namelist());m=json.loads(z.read('manifest.json'))
 assert set(m['permissions'])=={'bookmarks','storage','sidePanel','activeTab'}
 assert m['chrome_url_overrides']=={'newtab':'manager.html'}
 assert 'host_permissions' not in m
 if optional:
  assert m['optional_permissions']==['identity']
  assert set(m['optional_host_permissions'])=={'https://api.openai.com/*','https://www.googleapis.com/*'}
  assert m['oauth2']['scopes']==['https://www.googleapis.com/auth/drive.appdata']
 else: assert 'oauth2' not in m and 'optional_host_permissions' not in m
 assert m['minimum_chrome_version']=='116'
 for page in ['manager.html','panel.html','settings.html','manual.html','terms.html','privacy.html']:
  parser=Assets();parser.feed(z.read(page).decode())
  for ref in parser.refs:
   assert ref and not ref.startswith(('http:','https:','//')),f'Remote asset: {ref}'
   assert ref in names,f'Missing asset: {ref}'
 for name in names:
  assert z.read(name)==(root/('manifest.optional.json' if optional and name=='manifest.json' else 'privacy.optional.html' if optional and name=='privacy.html' else name)).read_bytes(),f'Stale bundled file {name}'
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
print('SHA256:',hashlib.sha256((root/('dist/1stTab-bookmarks-optional.zip' if optional else 'dist/1stTab-bookmarks.zip')).read_bytes()).hexdigest())
