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
  // Numeric tuples keep even a whole-account plan small enough for a URL.
  // The fragment stays in the browser, rather than being sent to the web server.
  const MAX_LINK = 16000;
  function encodeLink(file, trees) {
    const clean = validate(file, trees), s = clean.state;
    const packed = [VERSION, clean.name, s.tree, s.speed, s.scope === 'all' ? 1 : 0,
      Object.entries(s.plan).map(([id, level]) => [+id, level.c, level.t])];
    const bytes = new TextEncoder().encode(JSON.stringify(packed));
    const encoded = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    if (encoded.length > MAX_LINK) throw new Error('Plan link too large');
    return encoded;
  }
  function decodeLink(encoded, trees) {
    if (typeof encoded !== 'string' || !encoded.length || encoded.length > MAX_LINK ||
        !/^[A-Za-z0-9_-]+$/.test(encoded)) throw new Error('Invalid research plan link');
    const binary = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
    const packed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, c => c.charCodeAt(0))));
    if (!Array.isArray(packed) || packed.length !== 6 || packed[0] !== VERSION ||
        ![0, 1].includes(packed[4]) || !Array.isArray(packed[5]) ||
        packed[5].length > trees.reduce((n, t) => n + t.techs.length, 0)) throw new Error('Invalid research plan link');
    const plan = {};
    for (const row of packed[5]) {
      if (!Array.isArray(row) || row.length !== 3 || !Number.isInteger(row[0]) ||
          Object.hasOwn(plan, row[0])) throw new Error('Invalid research plan link');
      plan[row[0]] = { c: row[1], t: row[2] };
    }
    return snapshot(packed[1], { plan, tree: packed[2], speed: packed[3], scope: packed[4] ? 'all' : 'tree' }, trees);
  }
  window.ResearchPlans = { validate, snapshot, parse, encodeLink, decodeLink, MAX_BYTES, MAX_LINK };
})();
