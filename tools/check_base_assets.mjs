#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
const root = new URL('../', import.meta.url);
const read = file => readFileSync(new URL(file, root), 'utf8');
const html = read('base/index.html'), map = JSON.parse(read('data/building_icons.json'));
const progression = JSON.parse(read('data/progression.json')), resources = JSON.parse(read('data/resources.json'));
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter(m => !/\bsrc=/.test(m[1])).map(m => m[2]);
for (const source of scripts) new vm.Script(source);
for (const id of [...html.match(/const BUILDING_IDS = \[([^\]]+)\]/)[1].split(',').map(Number), 1001, ...resources.producer_buildings.map(x => x.building_id)]) {
  assert.ok(map.icons[id], `Missing original icon for building ${id}`);
  assert.ok(existsSync(new URL(`assets/buildings/${id}.webp`, root)));
}
assert.equal(map.icons[5044], 'Icon_Build_HeroCamp3', 'Use client ID mapping, not guessed English order');
assert.equal(map.icons[5045], 'Icon_Build_HeroCamp1');
assert.equal(map.icons[5046], 'Icon_Build_HeroCamp2');
assert.ok(html.includes('href="../assets/app.css"') && html.includes('src="../assets/app.js"'));
assert.ok(html.includes('class="app-header"') && html.includes('class="desktop-nav"'));
const bottom = html.match(/<nav class="bottom-nav"[\s\S]*?<\/nav>/)[0];
assert.equal([...bottom.matchAll(/<svg/g)].length, 5, 'Same five SVG navigation entries as research/hero/fighter pages');
assert.ok(!html.includes('assets/buildings/${type}.svg'));
const precache = JSON.parse(read('sw.js').match(/const ASSETS = (\[[^\n]+\]);/)[1]);
for (const file of precache) assert.ok(existsSync(new URL(file, root)), `Missing precache asset: ${file}`);
assert.ok(precache.includes('./assets/app.css') && precache.includes('./assets/buildings/icons.js'));
const defaults = { 'builder-slots': '1', 'vip-level': '0', 'free-minutes': '0', 'other-speed': '0',
  'roi-producer': '1016', 'roi-current': '0', 'roi-target': '1', 'roi-speed': '0', 'roi-free': '0',
  'roi-production': '0', 'roi-utilization': '100' };
const nodes = new Map();
function node(id) {
  if (!nodes.has(id)) {
    let content = '';
    const classes = new Set();
    const item = { value: defaults[id] ?? (id.startsWith('roi-value-') ? '1' : '0'), textContent: '',
      style: {}, hidden: false, dataset: {}, attrs: {}, listeners: {},
      classList: { toggle(c, on) { if (on) classes.add(c); else classes.delete(c); }, contains: c => classes.has(c) },
      setAttribute(k, v) { this.attrs[k] = String(v); }, removeAttribute(k) { delete this.attrs[k]; },
      addEventListener(k, fn) { this.listeners[k] = fn; }, querySelectorAll: () => [], click() {}, remove() {},
    };
    Object.defineProperty(item, 'innerHTML', { get() { return content; }, set(value) {
      content = String(value);
      if (content.includes('<option')) {
        const options = [...content.matchAll(/<option([^>]*)>([^<]*)<\/option>/g)];
        const opt = options.find(m => /selected/.test(m[1])) || options[0];
        if (opt) item.value = opt[1].match(/value="([^"]*)"/)?.[1] ?? opt[2];
      }
    } });
    nodes.set(id, item);
  }
  return nodes.get(id);
}
const links = ['base', 'roi', 'base', 'roi'].map((view, i) => { const n = node('nav-' + i); n.dataset.view = view; return n; });
const document = { getElementById: node, querySelectorAll: () => links, addEventListener() {},
  createElement() { return { set textContent(v) { this.innerHTML = String(v).replace(/[<>&"]/g, '_'); } }; } };
const context = vm.createContext({ window: { addEventListener() {} }, document, navigator: {},
  location: { pathname: '/base/', search: '?current=22', hash: '' }, history: { replaceState() {} },
  fetch: async file => ({ ok: true, json: async () => file.includes('progression') ? progression : resources }),
  scrollTo() {}, console, Intl, URLSearchParams, setTimeout, clearTimeout,
});
vm.runInContext(read('assets/buildings/icons.js'), context);
const app = scripts.at(-1).replace('    init();', '    window.BASE_TEST = { setView, render, renderRoi, roiProductionFactor, buildingGlyph }; window.INIT = init();');
vm.runInContext(app, context);
await context.window.INIT;
assert.equal(node('error').style.display, 'none', node('error').textContent);
assert.ok(node('stage-list').innerHTML.includes('assets/buildings/1001.webp'));
assert.ok(node('stage-list').innerHTML.includes('assets/ui/food.webp'));
assert.ok(node('building-inputs').innerHTML.includes('assets/buildings/5044.webp'));
assert.ok(node('base-value').innerHTML.includes('assets/buildings/1001.webp'));
for (const match of node('stage-list').innerHTML.matchAll(/src="([^"]+)"/g)) assert.ok(existsSync(new URL(match[1], new URL('base/', root))), match[1]);
context.window.BASE_TEST.setView('roi');
assert.equal(node('base-view').hidden, true); assert.equal(node('roi-view').hidden, false);
assert.equal(links[1].attrs['aria-current'], 'page'); assert.equal(links[0].attrs['aria-current'], undefined);
assert.ok(node('roi-title').innerHTML.includes('assets/buildings/1016.webp'));
assert.equal(node('roi-error').style.display, 'none', node('roi-error').textContent);
const survivorBenefits = new Map(progression.benefits.map(item => [item.id, item.name]));
for (const id of [20001, 20002, 20003, 20006]) assert.ok(survivorBenefits.has(id), `Missing client Survivor benefit ${id}`);
for (const [container, ids] of [['roi-survivor-output-inputs', [20001, 20002, 20003]], ['roi-survivor-shared-inputs', [20006]]]) {
  for (const id of ids) assert.ok(node(container).innerHTML.includes(`data-benefit-id="${id}"`), `Missing rendered Survivor benefit ${id}`);
}
for (const icon of ['food', 'metal', 'oil']) assert.ok(node('roi-survivor-output-inputs').innerHTML.includes(`assets/ui/${icon}.webp`));
assert.equal(context.window.BASE_TEST.roiProductionFactor(2, 10, {2: 25}), 1.35);
node('roi-producer').value = '1017';
context.window.BASE_TEST.renderRoi();
const basePayback = node('roi-payback').textContent, baseUpgradeRows = node('roi-rows').innerHTML;
node('roi-survivor-output-2').value = '25';
node('roi-survivor-free').value = '10';
context.window.BASE_TEST.renderRoi();
assert.ok(node('roi-output-note').textContent.includes('+25% applied output bonus'));
assert.ok(node('roi-modifier-summary').textContent.includes('Survivor +10m'));
assert.notEqual(node('roi-payback').textContent, basePayback, 'Survivor output bonus changes the break-even calculation');
assert.notEqual(node('roi-rows').innerHTML, baseUpgradeRows, 'Survivor free-finish time changes upgrade build times');
context.window.BASE_TEST.setView('base');
assert.equal(links[0].attrs['aria-current'], 'page');
console.log('Base assets/nav: complete ID mappings, real asset paths, calculator self-checks, rendered base/ROI icons and synchronized navigation passed.');
