/* Pure, tested Fighter planning model. No replay simulation or combat scoring. */
(function (root) {
  'use strict';
  const FORMAT = 'zroute-fighter-plan', VERSION = 1, MAX_LINK = 16000, MAX_BYTES = 1024 * 1024;
  const clone = x => JSON.parse(JSON.stringify(x));
  function create(D) {
    const levels = new Map(D.levels.map(r => [r.id, r]));
    const integer = (v, min, max, label) => {
      if (!Number.isInteger(v) || v < min || v > max) throw new Error(`Invalid ${label}.`);
      return v;
    };
    function side(value) {
      if (!value || !levels.has(value.level)) throw new Error('Unknown Fighter level/stage.');
      if (!Array.isArray(value.components) || value.components.length !== 6) throw new Error('Six component slots are required.');
      const components = value.components.map((id, slot) => {
        integer(id, 0, 9999999, 'component');
        if (id && D.components[id]?.slot !== slot) throw new Error('Component does not belong in this slot.');
        return id;
      });
      integer(value.evolution, 0, 900, 'evolution level');
      if (value.evolution && !D.evolution[value.evolution]) throw new Error('Unknown evolution level.');
      if (!Array.isArray(value.modules) || value.modules.length !== 4) throw new Error('Four wingman chip slots are required.');
      const modules = value.modules.map((m, slot) => {
        if (!m) throw new Error('Invalid wingman chip.');
        integer(m.id, 0, 999999, 'wingman chip'); integer(m.star, 0, 10, 'chip stars');
        if (!m.id && m.star !== 0) throw new Error('An empty chip cannot have stars.');
        if (m.id && (D.modules[m.id]?.slot !== slot || !D.modules[m.id].stars[m.star])) throw new Error('Invalid wingman chip slot/stars.');
        return {id: m.id, star: m.star};
      });
      return {level: value.level, components, evolution: value.evolution, modules};
    }
    function validate(doc) {
      if (!doc || doc.format !== FORMAT || doc.version !== VERSION || !doc.state) throw new Error('Unsupported Fighter plan.');
      if (typeof doc.name !== 'string' || doc.name.length > 100) throw new Error('Plan name must be at most 100 characters.');
      const s = doc.state, current = side(s.current), target = side(s.target), row = levels.get(current.level);
      if (target.level < current.level) throw new Error('Target Fighter level/stage must not precede the current state.');
      const maxExp = row.phase || !row.progressTotal ? 0 : row.progressTotal - 1;
      const exp = integer(s.exp, 0, maxExp, 'current progress');
      if (!Array.isArray(s.other) || s.other.length !== 3) throw new Error('Three other Fighter bonuses are required.');
      const other = s.other.map(v => {
        if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 1e9) throw new Error('Invalid other Fighter bonus.');
        return v;
      });
      if (!s.holdings) throw new Error('Material holdings are required.');
      const holdings = {chips: integer(s.holdings.chips, 0, 1e12, 'Combat Chip holdings'),
        parts: integer(s.holdings.parts, 0, 1e12, 'Fighter Parts holdings')};
      return {format: FORMAT, version: VERSION, name: doc.name.trim(), state: {current, target, exp, other, holdings}};
    }
    function defaultPlan() {
      const current = {level: 1, components: [0,0,0,0,0,0], evolution: 0,
        modules: Array.from({length: 4}, () => ({id: 0, star: 0}))};
      return {format: FORMAT, version: VERSION, name: '', state: {current, target: clone(current), exp: 0,
        other: [0,0,0], holdings: {chips: 0, parts: 0}}};
    }
    function screenshotPlan() {
      const p = defaultPlan(); p.name = 'Lv.95 screenshot example';
      p.state.current.level = 170; p.state.current.components = [110700,120700,130700,140600,150700,160600];
      p.state.target = clone(p.state.current); p.state.target.level = 171;
      // The screenshots imply +5,100 extra ATK; its source is not visible.
      p.state.other = [0,5100,0]; p.state.holdings = {chips: 890000, parts: 92};
      return validate(p);
    }
    const add = (map, rows) => { for (const [t, v] of rows) map[t] = (map[t] || 0) + v; };
    function stats(value, other = [0,0,0]) {
      const r = levels.get(value.level), extras = {}, components = {}, fighter = {}, hero = {};
      for (const id of value.components) if (id) add(components, D.components[id].benefits);
      add(extras, Object.entries(components).map(([t, v]) => [Number(t), v]));
      if (value.evolution) add(extras, D.evolution[value.evolution].benefits);
      [10156,10157,10158].forEach((t,i) => { extras[t] = (extras[t] || 0) + other[i]; });
      add(fighter, r.benefits); add(hero, r.converted);
      r.benefits.forEach(([t],i) => {
        fighter[t] += extras[t] || 0;
        const heroType = r.converted[i][0];
        hero[heroType] += (extras[t] || 0) * r.uavConv[i] / 10000;
      });
      for (const [t,v] of Object.entries(components)) if (![10156,10157,10158].includes(Number(t))) hero[t] = (hero[t] || 0) + v;
      return {fighter, hero, components, coefficients: r.uavConv};
    }
    function budget(s) {
      const costs = {}, rows = []; let normalClicks = 0, stageClicks = 0, hasBonus = false;
      for (let id = s.current.level; id < s.target.level; id++) {
        const r = levels.get(id), to = levels.get(id + 1);
        if (!r || !to || r.progressAdd <= 0) throw new Error('Missing upgrade data.');
        const progress = id === s.current.level ? s.exp : 0;
        const clicks = Math.ceil((r.progressTotal - progress) / r.progressAdd);
        const rowCosts = {};
        for (const c of r.cost) {
          rowCosts[c.id] = Math.abs(c.count) * clicks;
          costs[c.id] = (costs[c.id] || 0) + rowCosts[c.id];
        }
        if (r.phase) stageClicks += clicks; else normalClicks += clicks;
        hasBonus ||= r.bonusRate > 0;
        rows.push({from: id, to: id + 1, clicks, costs: rowCosts});
      }
      return {costs, rows, normalClicks, stageClicks, hasBonus};
    }
    function componentRecipe(aId, bId) {
      if (aId === bId) return {kind: 'same'};
      if (!aId || !bId) return {kind: 'replacement'};
      const a = D.components[aId], b = D.components[bId];
      if (a.slot !== b.slot) throw new Error('Different component slots.');
      if (b.level < a.level || (b.level === a.level && b.exp < a.exp)) return {kind: 'downgrade'};
      let mergeCopies = 0, feedXp = 0;
      if (a.level < 8) mergeCopies = 3 ** (Math.min(b.level, 8) - a.level) - 1;
      if (b.level >= 8) {
        for (let level = Math.max(a.level, 8); level < b.level; level++) {
          const base = Object.values(D.components).find(c => c.slot === a.slot && c.level === level && c.expPercentage === 0);
          feedXp += base.maxExp;
        }
        feedXp += b.exp - (a.level >= 8 ? a.exp : 0);
      }
      return {kind: 'upgrade', mergeCopies, mergeLevel: a.level, feedXp};
    }
    const strip = s => String(s).replace(/<[^>]*>/g, '');
    function moduleInfo(m, evolution = 0) {
      if (!m.id) return null;
      const item = D.modules[m.id], r = item.stars[m.star];
      const amp = item.amplification[D.evolution[evolution]?.increaseLevel ?? 0];
      const args = [r.args[0], amp?.args[0] || '0', r.args[1], amp?.args[1] || '0'];
      return {name: item.name, power: r.power + (amp?.power || 0),
        description: strip(r.template.replace(/\{(\d+)\}/g, (_, n) => strip(args[n] || '0'))),
        nextCopies: r.copies};
    }
    function moduleCopies(a, b) {
      if (a.id !== b.id || !a.id || b.star < a.star) return null;
      let copies = 0;
      for (let star = a.star; star < b.star; star++) copies += D.modules[a.id].stars[star].copies;
      return copies;
    }
    function evolutionXp(a, b) {
      if (b < a || (!a && b)) return null; // Activation cost is not established.
      let xp = 0;
      for (let i = a; i < b; i++) xp += D.evolution[i].progressTotal;
      return xp;
    }
    function parse(text) {
      if (typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_BYTES) throw new Error('Plan file is too large.');
      return validate(JSON.parse(text));
    }
    function encode(doc) {
      const bytes = new TextEncoder().encode(JSON.stringify(validate(doc)));
      let raw = ''; for (const b of bytes) raw += String.fromCharCode(b);
      const payload = btoa(raw).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
      if (payload.length > MAX_LINK) throw new Error('Plan link is too large.');
      return payload;
    }
    function decode(payload) {
      if (typeof payload !== 'string' || payload.length > MAX_LINK || !/^[A-Za-z0-9_-]+$/.test(payload) || payload.length % 4 === 1) throw new Error('Invalid plan link.');
      const raw = atob(payload.replace(/-/g,'+').replace(/_/g,'/') + '='.repeat((4-payload.length%4)%4));
      return parse(new TextDecoder('utf-8', {fatal:true}).decode(Uint8Array.from(raw,c=>c.charCodeAt(0))));
    }
    return {validate, defaultPlan, screenshotPlan, levels, stats, budget, componentRecipe,
      moduleInfo, moduleCopies, evolutionXp, parse, encode, decode, clone};
  }
  root.FighterModel = {create, FORMAT, VERSION, MAX_BYTES};
})(globalThis);
