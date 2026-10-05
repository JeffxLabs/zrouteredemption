import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const D = JSON.parse(fs.readFileSync(path.join(root,'data/fighter.json'),'utf8'));
const context = vm.createContext({TextEncoder,TextDecoder,btoa,atob});
vm.runInContext(fs.readFileSync(path.join(root,'fighter/fighter_model.js'),'utf8'),context);
const M = context.FighterModel.create(D), plain = v => JSON.parse(JSON.stringify(v));
assert.equal(D.levels.length,766); assert.equal(Object.keys(D.components).length,2448); assert.equal(Object.keys(D.modules).length,32);
for (let i=0;i<D.levels.length;i++) assert.equal(D.levels[i].id,i+1);
const p = M.screenshotPlan(), a = M.stats(p.state.current,p.state.other), b = M.stats(p.state.target,p.state.other);
assert.equal(M.levels.get(p.state.current.level).phase-1,3);
assert.equal(Math.floor(a.fighter[10156]),1115716); assert.equal(Math.floor(a.fighter[10157]),32545); assert.equal(Math.floor(a.fighter[10158]),4309);
assert.equal(Math.floor(b.fighter[10156]),1134504); assert.equal(Math.floor(b.fighter[10157]),33015); assert.equal(Math.floor(b.fighter[10158]),4403);
assert.deepEqual(plain(a.components),{'10002':186000,'10003':2000,'10004':890,'10017':0.025,'10156':405900,'10157':9700,'10158':760});
assert.deepEqual(plain(a.coefficients),[1600,1600,1600]);
let budget = M.budget(p.state);
assert.equal(budget.costs.item_drone_data,12000); assert.equal(budget.costs.item_drone_part,90); assert.equal(budget.stageClicks,1); assert.equal(budget.hasBonus,false);
const q = M.clone(p); q.state.target.level=172; budget=M.budget(q.state);
assert.equal(budget.costs.item_drone_data,24000); assert.equal(budget.costs.item_drone_part,180); assert.equal(M.levels.get(172).level,96);
const n = M.defaultPlan(); n.state.target.level=2; budget=M.budget(n.state); assert.equal(budget.normalClicks,5); assert.equal(budget.hasBonus,true); assert.equal(budget.costs.item_drone_data,5000);
n.state.exp=4000; assert.equal(M.budget(n.state).costs.item_drone_data,1000);
assert.deepEqual(plain(M.componentRecipe(110700,110800)),{kind:'upgrade',mergeCopies:2,mergeLevel:7,feedXp:0});
assert.equal(M.componentRecipe(110600,110800).mergeCopies,8);
assert.equal(M.componentRecipe(110850,110900).feedXp,2187);
assert.equal(M.componentRecipe(110800,110900).feedXp,4374);
assert.equal(M.componentRecipe(110700,110900).feedXp,4374);
assert.equal(M.componentRecipe(110800,110700).kind,'downgrade');
assert.equal(M.moduleCopies({id:1001,star:0},{id:1001,star:2}),3);
assert.equal(M.moduleCopies({id:1001,star:0},{id:1002,star:0}),null);
assert.ok(M.moduleInfo({id:1001,star:0},0).description.includes('200K'));
assert.ok(!M.moduleInfo({id:1001,star:0},100).description.includes('<'));
assert.equal(M.evolutionXp(0,1),null); assert.equal(M.evolutionXp(1,2),D.evolution[1].progressTotal);
p.name='测试 ✈️ / Équipe'; assert.deepEqual(plain(M.decode(M.encode(p))),plain(M.validate(p)));
assert.deepEqual(plain(M.parse(JSON.stringify(p))),plain(M.validate(p)));
const reject = mutate => { const bad=M.clone(p); mutate(bad); assert.throws(()=>M.validate(bad)); };
reject(x=>x.version=2); reject(x=>x.state.target.level=1); reject(x=>x.state.current.components[0]=120700);
reject(x=>x.state.current.modules[0]={id:1002,star:0}); reject(x=>x.state.current.modules[0]={id:1001,star:99});
reject(x=>x.state.exp=1); reject(x=>x.state.other[0]=Infinity); reject(x=>x.state.holdings.chips=-1);
reject(x=>x.name='x'.repeat(101)); reject(x=>x.state.current.evolution=901);
for (const text of ['','A','!!!!','x'.repeat(16001)]) assert.throws(()=>M.decode(text));
assert.throws(()=>M.parse(' '.repeat(1024*1024+1)));
const all=M.defaultPlan(); all.state.target.level=766; assert.equal(M.budget(all.state).rows.length,765);
const images = new Set([...Object.values(D.components),...Object.values(D.modules),...Object.values(D.resources)].map(x=>x.icon));
images.add('../assets/fighter/UVA_icon_skin_01.webp');
for(const icon of images) assert.ok(fs.existsSync(path.join(root,icon.replace('../',''))),icon);
const provenance=JSON.parse(fs.readFileSync(path.join(root,'assets/fighter/provenance.json'),'utf8'));
assert.equal(Object.keys(provenance.sprites).length,59);
const precache=JSON.parse(fs.readFileSync(path.join(root,'sw.js'),'utf8').match(/const ASSETS = (\[[^\n]+\]);/)[1]);
for(const icon of images) assert.ok(precache.includes('./'+icon.replace('../','')));
for(const page of ['index.html','heroes/index.html','hero-exp/index.html','research/index.html','fighter/index.html','promo-codes/index.html']) {
  const html=fs.readFileSync(path.join(root,page),'utf8');
  const nav=html.match(/<nav class="bottom-nav"[\s\S]*?<\/nav>/)[0];
  assert.equal([...nav.matchAll(/<a\b/g)].length,7,page);
}


// Page smoke test with a minimal DOM: render, edits, sharing, rejected imports,
// replacement confirmation, and named snapshots. No browser layout claim.
const elements = new Map(), events={};
function element(id) {
  if (!elements.has(id)) elements.set(id,{id,value:'',hidden:true,textContent:'',innerHTML:'',dataset:{},
    classList:{values:new Set(),toggle(k,on){on?this.values.add(k):this.values.delete(k);},contains(k){return this.values.has(k);}},
    addEventListener(type,fn){this[type]=fn;},click(){this.onclick?.();}});
  return elements.get(id);
}
const storage=new Map(); let copied='', confirmResult=true, registeredWorker='';
const browser=vm.createContext({TextEncoder,TextDecoder,btoa,atob,URL,Blob,setTimeout,clearTimeout,Intl,
  document:{getElementById:element,createElement:()=>({click(){}}),addEventListener:(name,fn)=>events[name]=fn},
  location:{href:'https://example.test/fighter/',hash:''},
  navigator:{serviceWorker:{register:async url=>{registeredWorker=url;}}},
  I18N:{locale:'en-US'},confirm:()=>confirmResult,
  ZR:{esc:v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
    fmt:v=>Number(v).toLocaleString('en-US'),store:{get:k=>storage.get(k)||null,set:(k,v)=>storage.set(k,v)},copy:v=>copied=v},
  fetch:async()=>({ok:true,json:async()=>D})});
browser.window=browser; browser.addEventListener=(type,fn)=>events[type]=fn;
vm.runInContext(fs.readFileSync(path.join(root,'fighter/fighter_model.js'),'utf8'),browser);
await vm.runInContext(fs.readFileSync(path.join(root,'fighter/fighter.js'),'utf8'),browser);
assert.equal(element('planner').hidden,false);
assert.equal(registeredWorker,'../sw.js');
// Card classes must not collide with the shared fixed-height .chip pill.
assert.equal([...element('modules').innerHTML.matchAll(/class="wingman-card"/g)].length,4);
assert.equal([...element('modules').innerHTML.matchAll(/class="wingman-side"/g)].length,8);
assert.ok(!element('modules').innerHTML.includes('class="chip"'));
const fighterHtml=fs.readFileSync(path.join(root,'fighter/index.html'),'utf8');
assert.ok(fighterHtml.includes('#modules{grid-template-columns:repeat(2,minmax(0,1fr))}'));
assert.ok(fighterHtml.includes('@media(max-width:599px){.wingman-card .pair{grid-template-columns:minmax(0,1fr)}'));
assert.ok(fighterHtml.includes('src="fighter.js?v=24"'));
assert.ok(precache.includes('./fighter/fighter.js?v=24'));
element('planner').change({target:{value:'1001',dataset:{field:'module',side:'target',slot:'0'}}});
assert.ok(element('modules').innerHTML.includes('Warrior - Vanguard'));
assert.ok(element('modules').innerHTML.includes('200K'));
assert.ok(!element('modules').innerHTML.includes('class="chip"'));
element('screenshot-example').click();
assert.ok(element('fighter-stats').innerHTML.includes('32,545')); assert.ok(element('materials').innerHTML.includes('12,000'));
element('share').click(); assert.ok(copied.startsWith('https://example.test/fighter/#plan='));
const before=storage.get('zr-fighter-plan'); confirmResult=false; element('reset').click(); assert.equal(storage.get('zr-fighter-plan'),before);
confirmResult=true; element('plan-name').value='<script>alert(1)</script>'; element('save').click();
assert.ok(!element('saved-plans').innerHTML.includes('<script>')); assert.ok(element('saved-plans').innerHTML.includes('&lt;script&gt;'));
element('planner').change({target:{value:'-1',dataset:{field:'chips'}}});
assert.ok(element('status').classList.contains('error')); assert.equal(JSON.parse(storage.get('zr-fighter-plan')).state.holdings.chips,890000);
element('import-file').files=[{size:2,text:async()=>'{}'}]; await element('import-file').onchange({target:element('import-file')});
assert.equal(JSON.parse(storage.get('zr-fighter-plan')).state.current.level,170);
browser.location.hash='#plan=!!!!'; events.hashchange(); assert.ok(element('status').textContent.includes('rejected'));
assert.equal(JSON.parse(storage.get('zr-fighter-plan')).state.current.level,170);
assert.ok(events.languagechange);
browser.ZR.store.set=()=>{};
element('reset').click(); assert.equal(element('storage-warning').hidden,false);
element('plan-name').value='Cannot persist'; element('save').click();
assert.ok(element('status').textContent.includes('storage is unavailable'));
console.log(`Fighter checks passed: screenshots, all ${D.levels.length} states, costs, recipes, chip effects, ${images.size} original icons, validation/sharing and UI smoke tests.`);
