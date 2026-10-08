export const PREFS_KEY='bookmarks.preferences.v1';
export const GRID_SHAPES=['rectangle','square','rounded','circle','sphere'];
export const DESIGNS=['prism','atelier','studio','pop','enterprise'];
const size=(value,min,max)=>{const n=Number(value);return Number.isFinite(n)?Math.round(Math.max(min,Math.min(max,n))*10)/10:1};
export function normalizePreferences(value={}){
 const v=value&&typeof value==='object'?value:{};
 return {...v,sidebarWidth:Number.isFinite(Number(v.sidebarWidth))?Math.round(Math.max(220,Math.min(520,Number(v.sidebarWidth)))):270,gridShape:GRID_SHAPES.includes(v.gridShape)?v.gridShape:'rectangle',design:DESIGNS.includes(v.design)?v.design:'enterprise',theme:['light','dark','system'].includes(v.theme)?v.theme:'light',textScale:size(v.textScale??1,.9,1.4),iconScale:size(v.iconScale??1,.9,1.5),density:v.density==='compact'?'compact':'comfortable',showNotes:v.showNotes!==false,reduceMotion:v.reduceMotion===true,view:v.view==='grid'?'grid':'list',sort:['title','newest'].includes(v.sort)?v.sort:'manual',treeOpen:v.treeOpen!==false,filtersOpen:v.filtersOpen===true,collapsed:Array.isArray(v.collapsed)?v.collapsed.filter(id=>typeof id==='string'):[]};
}
