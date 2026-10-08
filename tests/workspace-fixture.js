// Preview/test data only. This fixture is excluded from extension packages.
export async function seedWorkspace(){
 await chrome.bookmarks.remove('a');await chrome.bookmarks.removeTree('folder');await chrome.bookmarks.remove('m');
 const folders=new Map([['bar','bar'],['other','other']]);
 async function folder(path){if(folders.has(path))return folders.get(path);const parts=path.split('/'),title=parts.pop(),parentId=await folder(parts.join('/'));const created=await chrome.bookmarks.create({parentId,title});folders.set(path,created.id);return created.id;}
 const entries=[
  ['Figma','https://figma.com','A shared canvas for your next big idea.','bar/Design',['design','tools'],true],
  ['Layers','https://layers.to','Fresh work from designers worth following.','bar/Design',['inspiration','design'],false],
  ['Mobbin','https://mobbin.com','Small interactions. Beautiful product details.','bar/Design/UI patterns',['ui patterns','mobile'],false],
  ['Page Flows','https://pageflows.com','Reference flows for onboarding and checkout.','bar/Design/UI patterns',['ui patterns','onboarding'],false],
  ['Material Design','https://m3.material.io','Components, foundations and interaction guidance.','bar/Design/Design systems',['components','reference'],true],
  ['Atlassian Design','https://atlassian.design','Patterns for clear and consistent work tools.','bar/Design/Design systems',['enterprise','components'],false],
  ['Carbon Design System','https://carbondesignsystem.com','Reusable foundations for enterprise interfaces.','bar/Design/Design systems',['enterprise','accessibility'],false],
  ['Lucide Icons','https://lucide.dev','A consistent icon set for interface projects.','bar/Design/Assets',['icons','tools'],false],
  ['Google Fonts','https://fonts.google.com','Explore type families for the next design study.','bar/Design/Assets',['typography','assets'],false],
  ['Unsplash','https://unsplash.com','Photography references for mood boards.','bar/Design/Assets',['photography','inspiration'],false],
  ['GitHub','https://github.com','The projects you are building and following.','bar/Build',['code','work'],true],
  ['MDN Web Docs','https://developer.mozilla.org','A reliable reference for everything web.','bar/Build/Frontend',['reference','javascript'],true],
  ['React Docs','https://react.dev','Components, state and interface architecture.','bar/Build/Frontend',['react','reference'],false],
  ['TypeScript Handbook','https://www.typescriptlang.org/docs/','Types and patterns for maintainable applications.','bar/Build/Frontend',['typescript','reference'],false],
  ['web.dev','https://web.dev','Notes on performance, accessibility and the web.','bar/Build/Frontend',['performance','accessibility'],false],
  ['Node.js Docs','https://nodejs.org/docs/latest/api/','Server-side JavaScript APIs and runtime reference.','bar/Build/Backend',['nodejs','reference'],false],
  ['PostgreSQL Docs','https://www.postgresql.org/docs/','Keep database concepts and queries close at hand.','bar/Build/Backend',['database','reference'],false],
  ['Docker Docs','https://docs.docker.com','Container workflows for development and delivery.','bar/Build/DevOps',['devops','tools'],false],
  ['GitHub Actions','https://docs.github.com/en/actions','Build and release automation references.','bar/Build/DevOps',['automation','devops'],false],
  ['Chrome Extensions','https://developer.chrome.com/docs/extensions/','Extension platform documentation for 1stTab.','bar/Build/Frontend/Browser extensions',['extensions','reference'],true],
  ['Linear','https://linear.app','A little clarity for what comes next.','bar/Work/Planning',['planning','work'],true],
  ['Notion','https://www.notion.so','A place for project briefs and meeting notes.','bar/Work/Planning',['notes','planning'],false],
  ['FigJam','https://www.figma.com/figjam/','Workshop boards and team planning sessions.','bar/Work/Planning',['collaboration','planning'],false],
  ['Slack','https://slack.com','Team conversations and shared updates.','bar/Work/Collaboration',['communication','work'],false],
  ['Google Meet','https://meet.google.com','A quick place to start a team call.','bar/Work/Collaboration',['meetings','work'],false],
  ['Google Docs','https://docs.google.com','Collaborative writing and project documents.','bar/Work/Collaboration',['documents','collaboration'],false],
  ['arXiv','https://arxiv.org','Research papers for the reading queue.','other/Research/Papers',['research','papers'],false],
  ['Semantic Scholar','https://www.semanticscholar.org','Find papers and follow related research.','other/Research/Papers',['research','reading'],false],
  ['Our World in Data','https://ourworldindata.org','Charts and datasets for exploring global topics.','other/Research/Data',['data','research'],true],
  ['Data.gov','https://data.gov','A catalog of public datasets for analysis.','other/Research/Data',['data','open data'],false],
  ['Are.na','https://are.na','Collect thoughts. Make unexpected connections.','other/Inspiration',['ideas','research'],true],
  ['A List Apart','https://alistapart.com','Thoughtful writing about making things for the web.','other/Inspiration/Reading',['reading','design'],false],
  ['Smashing Magazine','https://www.smashingmagazine.com','Articles for the design and development reading list.','other/Inspiration/Reading',['reading','frontend'],false],
  ['CSS-Tricks','https://css-tricks.com','Layout ideas and practical CSS techniques.','other/Inspiration/Reading',['css','frontend'],false],
  ['Behance','https://www.behance.net','Creative projects for visual research.','other/Inspiration/Galleries',['inspiration','portfolios'],false],
  ['Dribbble','https://dribbble.com','Interface and visual design explorations.','other/Inspiration/Galleries',['inspiration','ui patterns'],false],
  ['freeCodeCamp','https://www.freecodecamp.org','Practice web development with guided exercises.','other/Learning/Courses',['learning','code'],false],
  ['Khan Academy','https://www.khanacademy.org','Build foundations with structured lessons.','other/Learning/Courses',['learning','courses'],false],
  ['MIT OpenCourseWare','https://ocw.mit.edu','University course materials for self-study.','other/Learning/Courses',['learning','research'],false],
  ['Exercism','https://exercism.org','Small programming exercises for regular practice.','other/Learning/Practice',['practice','code'],false]
 ];
 const items={};
 for(const [title,url,note,path,tags,pinned]of entries){const parentId=await folder(path),b=await chrome.bookmarks.create({title,url,parentId});items[b.id]={tags,note,pinned};}
 await chrome.storage.local.set({'bookmarks.metadata.v1':{version:1,items}});
}
