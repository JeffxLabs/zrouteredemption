#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const nodes = new Map(), storage = new Map();
let allowConfirm = true, storageFails = false, downloaded = false;
function node(id) {
  if (!nodes.has(id)) nodes.set(id, {
    value: '', innerHTML: '', textContent: '', disabled: false, hidden: false,
    style: { setProperty() {} }, classList: { add() {}, remove() {}, toggle() {} },
    listeners: {}, addEventListener(name, cb) { this.listeners[name] = cb; },
    scrollIntoView() {}, setAttribute() {},
  });
  return nodes.get(id);
}
const body = { appendChild() {} };
const document = {
  body, head: { appendChild() {} }, querySelector: node, querySelectorAll: () => [],
  addEventListener() {}, createElement() { return { click() { downloaded = true; }, remove() {} }; },
};
const context = vm.createContext({ window: {}, document,
  I18N: { language: 'en', locale: 'en-US', t: (key, args = []) => key.replace(/\{(\d+)\}/g, (_, i) => args[i]), apply() {} },
  localStorage: { setItem(k, v) { if (storageFails) throw Error('quota'); storage.set(k, v); } },
  location: { hash: '#tree-11', pathname: '/research/', search: '' }, history: { replaceState() {} },
  confirm: () => allowConfirm, Blob, URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} },
  setTimeout: fn => fn(), Intl, console,
});
context.window.ZR = { store: { get: k => storage.get(k) ?? null, set: (k, v) => storage.set(k, v) },
  esc: x => String(x ?? '').replace(/[<>"&]/g, '_'), fmt: String, short: String,
  duration: x => String(x), copy() {}, toast() {} };
for (const path of ['research/research_data.js', 'research/research_effects.js', 'research/research_plans.js']) vm.runInContext(read(path), context);
const { ResearchPlans: RP, RESEARCH_DATA: data } = context.window;
const state = { plan: { 1001: { c: 1, t: 2 }, 11001: { c: 2, t: 7 }, 11023: { c: 0, t: 1 } }, tree: 11, speed: 125.5, scope: 'all' };
const original = RP.snapshot('T10 plan', state, data.trees);
const roundtrip = RP.parse(JSON.stringify(original), data.trees);
assert.equal(JSON.stringify(roundtrip), JSON.stringify(original));
state.plan[11001].t = 9;
assert.equal(original.state.plan[11001].t, 7, 'Saved snapshot is independent of edits');
const clone = () => JSON.parse(JSON.stringify(original));
const mutations = [
  x => x.format = 'another-tool', x => x.version = 2, x => x.name = '', x => x.name = 'x'.repeat(101),
  x => x.state.tree = 999, x => x.state.speed = -1, x => x.state.speed = Infinity,
  x => x.state.speed = '100', x => x.state.speed = 1001, x => x.state.scope = 'bogus',
  x => x.state.plan = [], x => x.state.plan[99999] = { c: 0, t: 1 },
  x => x.state.plan[11001].c = -1, x => x.state.plan[11001].t = 11,
  x => x.state.plan[11001].t = 1, x => x.state.plan[11001].t = 2.5,
  x => x.state.plan[11001] = null,
];
for (const mutate of mutations) { const file = clone(); mutate(file); assert.throws(() => RP.validate(file, data.trees)); }
assert.throws(() => RP.parse('{bad json', data.trees));
assert.throws(() => RP.parse(' '.repeat(RP.MAX_BYTES + 1), data.trees));
const poison = clone(); poison.state.plan = JSON.parse('{"__proto__":{"c":0,"t":1}}');
assert.throws(() => RP.validate(poison, data.trees));
assert.equal({}.c, undefined);
const app = [...read('research/index.html').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].at(-1)[1];
await vm.runInContext(app, context);
const click = id => node('#' + id).listeners.click();
const importFile = async text => {
  const input = { files: [{ size: text.length, text: async () => text }], value: 'file' };
  await node('#import-plan-file').listeners.change({ target: input });
  assert.equal(input.value, '', 'File picker resets for repeated imports');
};
// Imports and named plans preserve all trees, current/target levels, speed and scope.
await importFile(JSON.stringify(original));
assert.deepEqual(JSON.parse(storage.get('zr-research-plan')), JSON.parse(JSON.stringify(original.state)));
assert.equal(node('#plan-name').value, 'T10 plan');
click('save-plan');
const library = JSON.parse(storage.get('zr-research-saved-plans'));
assert.equal(library.length, 1); assert.equal(library[0].state.plan[11001].t, 7);
node('#saved-plans').value = '0';
const before = storage.get('zr-research-plan');
allowConfirm = false;
const changed = clone(); changed.state.speed = 200;
await importFile(JSON.stringify(changed));
assert.equal(storage.get('zr-research-plan'), before, 'Cancelled import preserves active plan');
await importFile('{broken');
assert.equal(storage.get('zr-research-plan'), before, 'Invalid import preserves active plan');
click('delete-plan');
assert.equal(JSON.parse(storage.get('zr-research-saved-plans')).length, 1, 'Cancelled delete preserves snapshots');
allowConfirm = true;
click('load-plan');
assert.equal(storage.get('zr-research-plan'), before, 'Loading reproduces the snapshot');
click('export-plan'); assert.equal(downloaded, true, 'Export triggers file download');
storageFails = true; node('#plan-name').value = 'Blocked save'; click('save-plan');
assert.equal(JSON.parse(storage.get('zr-research-saved-plans')).length, 1);
assert.match(node('#plan-status').textContent, /Could not save/);
storageFails = false; click('delete-plan');
assert.equal(JSON.parse(storage.get('zr-research-saved-plans')).length, 0);
assert.equal(storage.get('zr-research-plan'), before, 'Deleting snapshot leaves active plan intact');
console.log('Research plans: JSON round trips, validation, snapshot independence, import/save/load/export/delete handlers, cancellation and storage failures passed.');
