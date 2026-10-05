import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8'), json=p=>JSON.parse(read(p));
const ids=['30011','40001','40002'], source=json('data/hero_insights.json');
const directory=json('data/heroes_directory.json');
function check(src,heroes) {
  for(const id of ids) {
    const expected=src.heroes[id], hero=heroes.find(h=>String(h.id)===id);
    assert.deepEqual(JSON.parse(JSON.stringify(hero.insight)),expected);
    assert.deepEqual(expected.tags,['SR']); assert.equal(expected.tips.length,2);
    assert.ok(expected.tips[1].includes('4★'));
  }
}
check(source,directory);
for(const id of ids) {
  const h=directory.find(h=>String(h.id)===id);
  assert.equal(h.level_benefits[0].type,10106,'Keep the raw configuration fact for provenance');
  assert.equal(h.level_benefits[0].value,0.01);
  assert.ok(h.insight.tips[0].includes('unverified'));
  assert.ok(h.skills.some(s=>s.name==='Survival Expert' && s.description.includes('5%')));
}
const enContext=vm.createContext({});
vm.runInContext(read('heroes/heroes_data.js')+';globalThis.testHeroes = HEROES_DATA;',enContext);
check(source,enContext.testHeroes);
assert.equal(json('data/heroes_meta.json').global_insights.at(-1).body,source.global.at(-1).body);
for(const code of ['fr','ru','tr','pl','es','pt','de','ko','zh']) {
  const local=json(`data/hero_insights_i18n/${code}.json`), context=vm.createContext({window:{}});
  vm.runInContext(read(`heroes/heroes_i18n/${code}.js`),context);
  const payload=context.window.HEROES_LOCALES[code]; check(local,payload.heroes);
  assert.ok(JSON.stringify(payload).includes(local.global.at(-1).body));
}
console.log('SR Soldier Load warning: raw facts retained, unsafe gathering/no-passive advice removed, source/output parity across all ten languages passed.');
