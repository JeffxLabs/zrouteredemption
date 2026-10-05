(async () => {
  'use strict';
  // Refresh the shared offline cache even when landing directly on this tool.
  globalThis.navigator?.serviceWorker?.register('../sw.js').catch(() => {});
  const $ = id => document.getElementById(id), {esc, fmt, store, copy} = ZR;
  const ACTIVE = 'zr-fighter-plan', SAVED = 'zr-fighter-saved-plans';
  let D, M, plan, saved = [];
  function message(text, error = false) { $('status').textContent = text; $('status').classList.toggle('error', error); }
  try {
    const res = await fetch('../data/fighter.json');
    if (!res.ok) throw new Error('Could not load Fighter data.');
    D = await res.json(); M = FighterModel.create(D); plan = M.defaultPlan();
    const active = store.get(ACTIVE);
    if (active) { try { plan = M.parse(active); } catch (e) { message(`Saved active plan could not be restored: ${e.message}`, true); } }
    const raw = store.get(SAVED);
    if (raw) {
      try {
        const records = JSON.parse(raw);
        if (!Array.isArray(records) || records.length > 100) throw new Error('Invalid saved plans.');
        saved = records.map(r => {
          if (typeof r.id !== 'string') throw new Error('Invalid saved plan ID.');
          return {id: r.id, plan: M.validate(r.plan)};
        });
      } catch (e) { message(`Saved plans could not be restored: ${e.message}`, true); }
    }
  } catch (e) { message(e.message, true); return; }
  const rowLabel = id => {
    const r = M.levels.get(id);
    return `Lv.${r.level}${r.phase ? ` · Stage ${r.phase - 1}/5` : ''}`;
  };
  const opt = (v, text, chosen) => `<option value="${v}"${Number(chosen) === Number(v) ? ' selected' : ''}>${esc(text)}</option>`;
  const select = (attr, items) => `<select class="input" ${attr}>${items}</select>`;
  const num = (attr, value, max, disabled = false) => `<input class="input" type="number" min="0" max="${max}" step="1" value="${value}" ${attr}${disabled ? ' disabled' : ''}>`;
  const sideNames = {current: 'Current', target: 'Target'};
  const cbase = (slot, level, percent = 0) => Object.values(D.components).find(c => c.slot === slot && c.level === level && c.expPercentage === percent);
  function sideLevel(which) {
    const r = M.levels.get(plan.state[which].level), states = D.levels.filter(x => x.level === r.level);
    const attr = `data-side="${which}"`;
    return `<label>${sideNames[which]} level${select(`${attr} data-field="level"`,
      Array.from({length: 250}, (_,i) => opt(i + 1, `Lv.${i + 1}`, r.level)).join(''))}</label>
      <label>${sideNames[which]} stage${select(`${attr} data-field="stage"`, states.map(x => opt(x.id, x.phase ? `Stage ${x.phase - 1}/5` : 'Normal progress', r.id)).join(''))}</label>`;
  }
  function benefitTable(a, b, types) {
    const format = (t, v) => D.benefits[t]?.percent ? `${new Intl.NumberFormat(I18N?.locale || 'en-US', {maximumFractionDigits: 3}).format(v * 100)}%` : fmt(Math.floor(v + 1e-8));
    const keys = types || [...new Set([...Object.keys(a), ...Object.keys(b)])].map(Number).sort((x,y) => x-y);
    return `<table><thead><tr><th>Attribute</th><th>Current</th><th>Target</th><th>Change</th></tr></thead><tbody>${keys.map(t => {
      const av = a[t] || 0, bv = b[t] || 0;
      // The game floors the displayed current/target values, so use the difference of those displays.
      const delta = D.benefits[t]?.percent ? bv-av : Math.floor(bv + 1e-8)-Math.floor(av + 1e-8);
      return `<tr><td>${esc(D.benefits[t]?.name || t)}</td><td>${format(t,av)}</td><td>${format(t,bv)}</td><td class="${delta > 0 ? 'good' : delta < 0 ? 'error' : ''}">${delta > 0 ? '+' : delta < 0 ? '−' : ''}${format(t,Math.abs(delta))}</td></tr>`;
    }).join('')}</tbody></table>`;
  }
  function componentControl(which, slot) {
    const id = plan.state[which].components[slot], c = D.components[id], level = c?.level || 0;
    const attr = `data-side="${which}" data-slot="${slot}"`;
    const percentages = level ? Object.values(D.components).filter(c => c.slot === slot && c.level === level) : [];
    return `<div><label>${sideNames[which]} level${select(`${attr} data-field="component-level"`,
      opt(0,'Empty',level) + Array.from({length: 12},(_,i) => opt(i + 1, `Lv.${i + 1}`, level)).join(''))}</label>
      <label>Enhancement progress${select(`${attr} data-field="component-percent"`,
        percentages.length > 1 ? percentages.map(c => opt(c.expPercentage, `${c.expPercentage}%`, D.components[id].expPercentage)).join('') : opt(0,'Not applicable',0))}</label></div>`;
  }
  function componentCards() {
    return D.slots.map(({slot,name}) => {
      const a = plan.state.current.components[slot], b = plan.state.target.components[slot];
      const image = D.components[b]?.icon || D.components[a]?.icon || cbase(slot,1).icon;
      const recipe = M.componentRecipe(a,b);
      let note = recipe.kind === 'same' ? 'No component change.' : 'Replacement comparison; no upgrade recipe assumed.';
      if (recipe.kind === 'downgrade') note = 'Lower-level comparison; no refund is assumed.';
      if (recipe.kind === 'upgrade') {
        const parts = [];
        if (recipe.mergeCopies) parts.push(`${fmt(recipe.mergeCopies)} additional Lv.${recipe.mergeLevel} copies of this component (plus your equipped copy)`);
        if (recipe.feedXp) parts.push(`${fmt(recipe.feedXp)} feed XP`);
        note = parts.length ? `Recipe: ${parts.join(' and ')}.` : 'No additional recipe materials.';
      }
      return `<article class="component"><header><img src="${esc(image)}" alt=""><h3>${esc(name)}</h3></header><div class="pair">${componentControl('current',slot)}${componentControl('target',slot)}</div><p class="note">${esc(note)}</p></article>`;
    }).join('');
  }
  function moduleControl(which, slot) {
    const m = plan.state[which].modules[slot], item = D.modules[m.id];
    const items = Object.values(D.modules).filter(m => m.slot === slot);
    const attr = `data-side="${which}" data-slot="${slot}"`;
    const info = M.moduleInfo(m, plan.state[which].evolution);
    return `<div class="wingman-side"><label>${sideNames[which]} chip${select(`${attr} data-field="module"`, opt(0,'Empty',m.id) + items.map(i => opt(i.id,i.name,m.id)).join(''))}</label>
      <label>Star step${select(`${attr} data-field="module-star"`, item ? Object.keys(item.stars).map(star => opt(star,Number(star) <= 5 ? `${star}★` : `5★ + ${star-5} red`,m.star)).join('') : opt(0,'Empty',0))}</label>
      ${info ? `<p><b>Configured chip power: ${fmt(info.power)}</b><br>${esc(info.description)}</p>` : '<p class="note">No chip selected.</p>'}</div>`;
  }
  function moduleCards() {
    return Array.from({length:4},(_,slot) => {
      const a = plan.state.current.modules[slot], b = plan.state.target.modules[slot];
      const item = D.modules[b.id] || D.modules[a.id] || Object.values(D.modules).find(m => m.slot === slot);
      const copies = M.moduleCopies(a,b);
      const note = copies !== null ? `${fmt(copies)} additional copies of this exact chip to reach the target star step.` : 'Different/empty chips: compare effects, not an upgrade path. Acquisition and inventory are not included.';
      return `<article class="wingman-card"><header><img src="${esc(item.icon)}" alt=""><h3>${esc(item.type)}</h3></header><div class="pair">${moduleControl('current',slot)}${moduleControl('target',slot)}</div><p class="note">${esc(note)}</p></article>`;
    }).join('');
  }
  function savedMenu(chosen = $('saved-plans').value) {
    $('saved-plans').innerHTML = '<option value="">Choose a saved plan</option>' + saved.map(r => `<option value="${esc(r.id)}"${r.id === chosen ? ' selected' : ''}>${esc(r.plan.name || 'Unnamed plan')}</option>`).join('');
  }
  function persistActive() {
    const text = JSON.stringify(plan); store.set(ACTIVE,text);
    $('storage-warning').hidden = store.get(ACTIVE) === text;
  }
  function persistSaved(next) {
    const text = JSON.stringify(next); store.set(SAVED,text);
    if (store.get(SAVED) !== text) throw new Error('Browser storage is unavailable or full. Export this plan or copy its URL instead.');
    saved = next;
  }
  function render() {
    const s = plan.state, r = M.levels.get(s.current.level), budget = M.budget(s);
    const a = M.stats(s.current,s.other), b = M.stats(s.target,s.other);
    $('level-controls').innerHTML = sideLevel('current') + sideLevel('target') +
      `<label>Current normal-level progress${num('data-field="exp"', s.exp, Math.max(0,r.progressTotal-1), r.phase > 0 || !r.progressTotal)}</label>` +
      `<label>Combat Chips owned${num('data-field="chips"', s.holdings.chips,1e12)}</label><label>Fighter Parts owned${num('data-field="parts"',s.holdings.parts,1e12)}</label>`;
    $('materials').innerHTML = Object.entries(D.resources).map(([id,item]) => {
      const cost = budget.costs[id] || 0, owned = id === 'item_drone_data' ? s.holdings.chips : s.holdings.parts;
      return `<div class="total"><span><img src="${esc(item.icon)}" alt=""> ${esc(item.name)}</span><b>${fmt(cost)}</b><small>Need to acquire: ${fmt(Math.max(0,cost-owned))}</small></div>`;
    }).join('') + `<div class="total"><span>Upgrade clicks</span><b>${fmt(budget.normalClicks + budget.stageClicks)}</b><small>${fmt(budget.stageClicks)} Key Upgrade clicks</small></div>`;
    $('budget-note').textContent = budget.hasBonus ? 'No-bonus budget: normal-level clicks assume ordinary progress only. The client config contains bonus progress, so actual spending may be lower. RNG and carry-over are not predicted. Key Upgrade costs are fixed.' : 'Fixed Key Upgrade budget for this path. Component recipes, wingman acquisition and evolution are separate below.';
    $('upgrade-rows').innerHTML = `<table><thead><tr><th>From → to</th><th>Clicks</th><th>Combat Chips</th><th>Fighter Parts</th></tr></thead><tbody>${budget.rows.map(x => `<tr><td>${rowLabel(x.from)} → ${rowLabel(x.to)}</td><td>${fmt(x.clicks)}</td><td>${fmt(x.costs.item_drone_data || 0)}</td><td>${fmt(x.costs.item_drone_part || 0)}</td></tr>`).join('') || '<tr><td colspan="4">No Fighter upgrades selected.</td></tr>'}</tbody></table>`;
    $('components').innerHTML = componentCards();
    $('component-stats').innerHTML = benefitTable(a.components,b.components);
    $('fighter-stats').innerHTML = benefitTable(a.fighter,b.fighter,[10157,10158,10156]);
    $('hero-stats').innerHTML = benefitTable(a.hero,b.hero);
    const coeff = value => `${new Intl.NumberFormat(I18N?.locale || 'en-US', {maximumFractionDigits:2}).format(value / 100)}%`;
    $('coefficients').textContent = `ATK / DEF / HP conversion coefficients: ${[1,2,0].map(i => `${coeff(a.coefficients[i])} → ${coeff(b.coefficients[i])}`).join(' · ')}`;
    $('extra-controls').innerHTML = ['HP','ATK','DEF'].map((name,i) => `<label>Other Fighter ${name}${num(`data-field="other" data-slot="${i}"`,s.other[i],1e9)}</label>`).join('') +
      ['current','target'].map(which => `<label>${sideNames[which]} evolution level (0 = inactive)${num(`data-field="evolution" data-side="${which}"`,s[which].evolution,900)}</label>`).join('');
    const xp = M.evolutionXp(s.current.evolution,s.target.evolution);
    $('evolution-note').textContent = xp === null ? 'Evolution activation/reversal costs are not established and are not included. Stats and chip amplification can still be compared.' : `Evolution progress required: ${fmt(xp)} XP (before any current evolution progress). This is XP, not a count of Combat Chips; feed-item conversion and activation costs are not included.`;
    $('modules').innerHTML = moduleCards();
    $('plan-name').value = plan.name;
    savedMenu(); persistActive(); $('planner').hidden = false;
  }
  function replace(candidate, label) {
    const checked = M.validate(candidate);
    if (!confirm(`${label}\nReplace the active Fighter plan?`)) return false;
    plan = checked; render(); message(label); return true;
  }
  $('planner').addEventListener('change', e => {
    const el = e.target, field = el.dataset.field;
    if (!field) {
      if (el.id === 'plan-name') { plan.name = el.value.trim(); persistActive(); }
      return;
    }
    const p = M.clone(plan), s = p.state, which = el.dataset.side, slot = Number(el.dataset.slot), v = Number(el.value);
    try {
      if (el.value === '') throw new Error('Enter a value; use 0 when empty.');
      if (field === 'level') { s[which].level = D.levels.find(r => r.level === v).id; if (which === 'current') s.exp = 0; }
      if (field === 'stage') { s[which].level = v; if (which === 'current') s.exp = 0; }
      if (which === 'current' && ['stage','level'].includes(field) && s.target.level < s.current.level) s.target.level = s.current.level;
      if (field === 'exp') s.exp = v;
      if (['chips','parts'].includes(field)) s.holdings[field] = v;
      if (field === 'other') s.other[slot] = v;
      if (field === 'evolution') s[which].evolution = v;
      if (field === 'component-level') s[which].components[slot] = v ? cbase(slot,v).id : 0;
      if (field === 'component-percent') {
        const c = D.components[s[which].components[slot]];
        if (c) s[which].components[slot] = cbase(slot,c.level,v).id;
      }
      if (field === 'module') s[which].modules[slot] = {id:v,star:0};
      if (field === 'module-star') s[which].modules[slot].star = v;
      plan = M.validate(p); render(); message('Plan updated.');
    } catch (error) { render(); message(error.message,true); }
  });
  $('screenshot-example').onclick = () => replace(M.screenshotPlan(),'Loaded screenshot example. +5,100 other Fighter ATK is a manual, unexplained offset; 890K Chips is rounded in the screenshot.');
  $('reset').onclick = () => replace(M.defaultPlan(),'Started an empty plan.');
  $('save').onclick = () => {
    try {
      plan = M.validate({...plan, name:$('plan-name').value});
      if (!plan.name) throw new Error('Give this plan a name first.');
      const existing = saved.find(r => r.plan.name === plan.name);
      if (existing && !confirm(`Overwrite saved plan “${plan.name}”?`)) return;
      if (!existing && saved.length >= 100) throw new Error('Delete a saved plan before adding another (limit: 100).');
      const record = {id:existing?.id || Date.now().toString(36) + Math.random().toString(36).slice(2,8), plan:M.clone(plan)};
      persistSaved(existing ? saved.map(r => r.id === existing.id ? record : r) : [...saved,record]);
      persistActive(); savedMenu(record.id); message('Plan saved on this browser.');
    } catch (e) { message(e.message,true); }
  };
  $('load').onclick = () => { const r = saved.find(r => r.id === $('saved-plans').value); if (r) replace(r.plan,`Loaded “${r.plan.name}”.`); };
  $('delete').onclick = () => {
    const r = saved.find(r => r.id === $('saved-plans').value);
    if (r && confirm(`Delete saved plan “${r.plan.name}”?`)) {
      try { persistSaved(saved.filter(x => x.id !== r.id)); savedMenu(''); message('Saved plan deleted. Active plan unchanged.'); }
      catch (e) { message(e.message,true); }
    }
  };
  $('share').onclick = () => {
    try { const url = new URL(location.href); url.hash = 'plan=' + M.encode(plan); copy(url.href); }
    catch (e) { message(e.message,true); }
  };
  $('export').onclick = () => {
    const blob = new Blob([JSON.stringify(M.validate(plan),null,2)],{type:'application/json'});
    const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url;
    a.download = `${(plan.name || 'fighter-plan').replace(/[^a-z0-9_-]/gi,'-')}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
  };
  $('import').onclick = () => $('import-file').click();
  $('import-file').onchange = async e => {
    try { const file = e.target.files[0]; if (!file) return; if (file.size > FighterModel.MAX_BYTES) throw new Error('Plan file is too large.'); const candidate = M.parse(await file.text()); replace(candidate,`Imported “${candidate.name || 'Unnamed plan'}”.`); }
    catch (error) { message(error.message,true); } finally { e.target.value = ''; }
  };
  function sharedPlan() {
    if (!location.hash.startsWith('#plan=')) return;
    try { const candidate = M.decode(location.hash.slice(6)); replace(candidate,`Opened shared plan “${candidate.name || 'Unnamed plan'}”.`); }
    catch (e) { message(`Shared plan rejected: ${e.message}`,true); }
  }
  render(); if (!$('status').classList.contains('error')) message('Ready. Choose your current level and loadout, or load the screenshot example.');
  sharedPlan(); window.addEventListener('hashchange',sharedPlan);
  document.addEventListener('languagechange',render);
})();
