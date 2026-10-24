#!/usr/bin/env node
/* Concatenates the viewer modules (in load order) into js/viewer/bundle.js so the 3D section needs ONE request instead of 14.
   Sources stay authoritative: run `node tools/build.js` after editing any js/viewer/*.js; `node tools/build.js --check` fails if the bundle is stale. */
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),dir=path.join(root,'js','viewer');
const entry=fs.readFileSync(path.join(root,'js','viewer.js'),'utf8');
const mods=entry.match(/var MODS=\[([^\]]*)\]/)[1].split(',').map(s=>s.trim().replace(/'/g,''));
const out=mods.map(m=>'/* ---- '+m+'.js ---- */\n'+fs.readFileSync(path.join(dir,m+'.js'),'utf8')).join('\n');
const target=path.join(dir,'bundle.js');
if(process.argv.includes('--check')){const cur=fs.existsSync(target)?fs.readFileSync(target,'utf8'):'';if(cur!==out){console.error('bundle.js is stale: run node tools/build.js');process.exit(1)}console.log('bundle.js is up to date ('+mods.length+' modules, '+out.length+' bytes)')}
else{fs.writeFileSync(target,out);console.log('wrote js/viewer/bundle.js',out.length,'bytes from',mods.length,'modules')}
