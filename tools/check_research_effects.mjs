#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const context = vm.createContext({ window: {} });
for (const path of ['research/research_data.js', 'research/research_effects.js']) {
  vm.runInContext(read(path), context, { filename: path });
}
const { RESEARCH_DATA: data, researchUpgradeEffect: effect } = context.window;
const all = data.trees.flatMap(tree => tree.techs);
const unlock = all.find(tech => tech.id === 11023);
assert.deepEqual([...effect(unlock).effects], ['Unlocks T10 Soldier Training']);
assert.deepEqual([...effect(unlock, 1, 1).effects], ['Unlocks T10 Soldier Training']);
assert.equal(effect(unlock, 0, 99).level, 1);
for (const tech of all) {
  for (const row of tech.levels) {
    const result = effect(tech, 0, row.level);
    assert.equal(result.level, row.level);
    assert.deepEqual([...result.effects], [...row.benefits, ...(tech.id === 11023 ? ['Unlocks T10 Soldier Training'] : [])]);
  }
}
const hp = all.find(tech => tech.id === 11001);
assert.equal(effect(hp).level, 1, 'Unplanned tech previews its first-level effect');
const preview = effect(hp, 2, 5);
assert.deepEqual([...preview.effects], [...hp.levels[4].benefits]);
assert.deepEqual([...preview.currentEffects], [...hp.levels[1].benefits]);
const translated = { ...hp, levels: hp.levels.map(row => ({ ...row, benefits: ['Localized effect'] })) };
assert.deepEqual([...effect(translated).effects], ['Localized effect']);
for (const match of read('research/index.html').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(match[1]);
assert.ok(read('research/index.html').includes('effectList(window.researchUpgradeEffect(x, 0, l.level).effects)'), 'Level table must include unlock effects');
console.log('Research effects: all per-level bonuses preserved, T10 unlock, current/target previews, localized benefits and script syntax passed.');
