import {spawnSync} from 'node:child_process';
const steps=[['npm',['test']],['bash',['build.sh']],...['browser','i18n-browser','drive-browser','settings-browser','workspace-customization','workspace-preview','preview-build','native-extension','i18n-native','native-drive'].map(name=>[process.execPath,[`tests/${name}.mjs`]])];
for(const [command,args] of steps){console.log(`\nRunning ${command} ${args.join(' ')}`);const result=spawnSync(command,args,{stdio:'inherit',env:process.env});if(result.error)throw result.error;if(result.status!==0)process.exit(result.status||1);}
console.log('\nAll unit, package, browser and native integration checks passed. Live Google OAuth is a separate publisher check.');
