(async()=>{
if(location.protocol==='file:'){for(const a of document.querySelectorAll('a[href="manager.html"],a[href="settings.html"]'))a.href='innerDocumentation/design-directions/enterprise.html'+(a.getAttribute('href')==='settings.html'?'#settings':'');}
if(!globalThis.chrome?.storage?.local)return;
const {normalizePreferences,PREFS_KEY}=await import('./preferences.js');
const systemDark=matchMedia('(prefers-color-scheme: dark)');
let prefs=normalizePreferences({design:'enterprise'});
function apply(){const root=document.documentElement;root.dataset.design=prefs.design;root.dataset.theme=prefs.theme==='system'?(systemDark.matches?'dark':'light'):prefs.theme;root.style.setProperty('--text-scale',prefs.textScale);}
if(globalThis.chrome?.storage?.local){try{const stored=await chrome.storage.local.get(PREFS_KEY);prefs=normalizePreferences(stored[PREFS_KEY]||{design:'enterprise'});chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes[PREFS_KEY]){prefs=normalizePreferences(changes[PREFS_KEY].newValue);apply()}})}catch{}}
apply();systemDark.addEventListener('change',apply);

})().catch(()=>{});
