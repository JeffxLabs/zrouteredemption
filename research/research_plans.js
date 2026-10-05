/* Versioned, language-independent plan files. Costs are recalculated from the
 * site's data; imported files cannot inject names, artwork, or calculated costs. */
(() => {
  'use strict';
  const FORMAT = 'zroute-research-plan', VERSION = 1, MAX_BYTES = 1024 * 1024;
  function validate(file, trees) {
    const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
    if (!object(file) || file.format !== FORMAT || file.version !== VERSION ||
        typeof file.name !== 'string' || !file.name.trim() || file.name.length > 100 || !object(file.state)) {
      throw new Error('Invalid research plan');
    }
    const { plan, tree, speed, scope } = file.state;
    if (!object(plan) || !trees.some(t => t.id === tree) ||
        typeof speed !== 'number' || !Number.isFinite(speed) || speed < 0 || speed > 1000 ||
        !['tree', 'all'].includes(scope)) throw new Error('Invalid research plan');
    const techs = new Map(trees.flatMap(t => t.techs.map(x => [String(x.id), x.max_level])));
    const clean = {};
    for (const [id, level] of Object.entries(plan)) {
      const max = techs.get(id);
      if (max === undefined || !object(level) || !Number.isInteger(level.c) || !Number.isInteger(level.t) ||
          level.c < 0 || level.t < level.c || level.t > max) throw new Error('Invalid research plan');
      // Omitted technologies are level 0; keep files small despite UI defaults.
      if (level.c || level.t) clean[id] = { c: level.c, t: level.t };
    }
    return { format: FORMAT, version: VERSION, name: file.name.trim(),
      state: { plan: clean, tree, speed, scope } };
  }
  function snapshot(name, state, trees) {
    return validate({ format: FORMAT, version: VERSION, name, state }, trees);
  }
  function parse(text, trees) {
    if (typeof text !== 'string' || text.length > MAX_BYTES) throw new Error('Invalid research plan');
    return validate(JSON.parse(text), trees);
  }
  window.ResearchPlans = { validate, snapshot, parse, MAX_BYTES };
})();
