#!/usr/bin/env node
/* Cross-check generated page data and translations for the ten supported locales. */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const LANGS = ["en", "fr", "ru", "tr", "pl", "es", "pt", "de", "ko", "zh"];
const TARGETS = LANGS.slice(1);
const issues = [];
const identical = Object.fromEntries(TARGETS.map(code => [code, []]));
let checked = 0;
const ALLOWED_IDENTICAL = new Set([
  "Z Route", "ZR:Reference", "Base 1–30", "GitHub ↗", "ROI", "PvP + PvE", "PvP", "PvE", "HP", "ATK", "DEF", "SSR", "SR", "UR", "HQ", "EXP", "VIP",
  "Lv.", "K", "M", "B", "Base", "Metal", "Oil", "Codes", "Name", "Stats", "Faction", "Total", "Radiation", "Level", "Tech", "Chips", "Max", "Sections",
  "Grenadier", "Disciple", "Hawkeye", "Sheriff", "Frankenstein", "Viper", "Anti-Pillage", "5 grenades"
]);

function read(relative) {
  return fs.readFileSync(path.join(ROOT, relative), "utf8");
}

function json(relative) {
  return JSON.parse(read(relative));
}

function runScript(relative, initial = {}) {
  const context = {window: {}, ...initial};
  vm.createContext(context);
  vm.runInContext(read(relative), context, {filename: relative});
  return context;
}

function vars(text) {
  return [...String(text ?? "").matchAll(/\{(\d+)\}/g)].map(match => Number(match[1])).sort((a, b) => a - b);
}

function issue(kind, where, detail) {
  issues.push({kind, where, detail});
}

function reportSame(code, source, translated, where) {
  if (typeof source !== "string" || !source.trim() || translated !== source) return;
  if (/^heroes\/\d+\/(?:name|display_name)$/.test(where)) return; // character names are proper nouns
  if (/^heroes\/meta\.unreleased\[\d+\]\.(?:name|skills\[\d+\]\.name)$/.test(where)) return; // unreleased character and skill names are proper nouns
  if (/^heroes\/meta\.(?:sources(?:\.|$)|squad\.counters|faction_icons)/.test(where)) return; // source references and stable data keys
  if (/\.source$|\.id$|\.kind$|\.row_evidence$|\.(?:tile|ring|shield|badge|icon)$/.test(where)) return;
  if (allowedEnglish(source)) return;
  identical[code].push(where + ": " + source.slice(0, 120));
}

function allowedEnglish(value) {
  const s = value.trim();
  if (!/[A-Za-z]/.test(s)) return true;
  if (ALLOWED_IDENTICAL.has(s)) return true;
  if (/^(?:Metal: \{0\}|HP \{0\} · ATK \{1\})$/.test(s)) return true;
  if (/^(?:Z Route|GitHub|ROI|PvP|PvE|HP|ATK|DEF|SSR|SR|UR|HQ|EXP|VIP|Lv\.?|K|M|B)(?:\s|$|[+·])/i.test(s)) return true;
  if (/^(?:[A-Z]{2,6}|(?:PvP|PvE)(?:\s*\+\s*(?:PvP|PvE))?|HP\s*\/\s*ATK|ATK\s*\/\s*DEF)$/i.test(s)) return true;
  if (/^\d[\d.,%★ →×+\-:()]*$/.test(s)) return true;
  return false;
}

function collectStrings(value, visit, keyPath = "") {
  if (typeof value === "string") visit(value, keyPath);
  else if (Array.isArray(value)) value.forEach((item, index) => collectStrings(item, visit, `${keyPath}[${index}]`));
  else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) collectStrings(item, visit, keyPath ? `${keyPath}.${key}` : key);
  }
}

function decodeHtml(text) {
  const named = {amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", times: "×", middot: "·", rarr: "→", larr: "←", ndash: "–", mdash: "—", hellip: "…"};
  return text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, token) => {
    if (token[0] === "#") {
      const value = token[1].toLowerCase() === "x" ? parseInt(token.slice(2), 16) : Number(token.slice(1));
      return Number.isFinite(value) ? String.fromCodePoint(value) : entity;
    }
    return named[token.toLowerCase()] ?? entity;
  });
}

function resolvePath(root, dotted) {
  const stripped = dotted.replace(/^heroes\[\d+\]\.?/, "");
  let current = root;
  for (const token of stripped.matchAll(/([^[.]+)(?:\[(\d+)\])?/g)) {
    current = current?.[token[1]];
    if (token[2] !== undefined) current = current?.[Number(token[2])];
  }
  return current;
}

function checkTags(value, where) {
  collectStrings(value, (text, keyPath) => {
    if (/<\/?(?:color|link|u)(?:\s|=|\/?>)/i.test(text)) issue("rich tag", `${where}.${keyPath}`, text.slice(0, 100));
  });
}

function checkUnfilled(value, where, skip = () => false) {
  collectStrings(value, (text, keyPath) => {
    if (!skip(keyPath) && /\{\d+\}/.test(text)) issue("unfilled placeholder", `${where}.${keyPath}`, text.slice(0, 120));
  });
}

function checkChinese(value, where) {
  // Representative Traditional-only characters (not characters shared with Simplified).
  const traditionalOnly = new Set([..."體臺繁發現國學車馬門萬與為這樣說話裏後點數據戰龍風長時開關東業無會來從經過對問題書務線愛聲頭號飛單買滿觀廣場圖寶貝報導選擇結業質驗邊進隊隊員帶據傳轉總讓壓權類觀聽歡樂區處張並變難強職號斷還選認負產種術際館顯寫戶條費軍連號務結華陽陰語號勝盡遠尋過聯斬"]);
  collectStrings(value, (text, keyPath) => {
    const hits = [...new Set([...text].filter(char => traditionalOnly.has(char)))];
    if (hits.length) issue("Traditional character", `${where}.${keyPath}`, hits.join(""));
  });
}

function checkPageDictionaries() {
  for (const page of ["home", "heroes", "hero-exp", "research"]) {
    const source = json(`data/ui_i18n/${page}.json`).strings;
    const htmlPath = page === "home" ? "index.html" : `${page}/index.html`; // the landing page is the site root
    const html = read(htmlPath);
    const usedPattern = /(?:I18N\.t|\btr)\(\s*(['"])((?:\\.|(?!\1)[^\\])*)\1/g;
    let used;
    while ((used = usedPattern.exec(html))) {
      const english = used[2].replace(/\\(['"\\])/g, "$1");
      if (!(english in source)) issue("missing used UI key", htmlPath, english);
    }
    const staticHtml = html
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<(script|style|noscript|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
    const staticStrings = new Set();
    for (const match of staticHtml.matchAll(/>([^<>]+)</g)) {
      const value = decodeHtml(match[1]).trim();
      if (value) staticStrings.add(value);
    }
    for (const match of staticHtml.matchAll(/\b(?:aria-label|title|placeholder|alt)\s*=\s*(["'])(.*?)\1/gi)) {
      const value = decodeHtml(match[2]).trim();
      if (value) staticStrings.add(value);
    }
    for (const match of staticHtml.matchAll(/<meta\b[^>]*>/gi)) {
      if (!/\bname\s*=\s*(["'])description\1/i.test(match[0])) continue;
      const content = match[0].match(/\bcontent\s*=\s*(["'])(.*?)\1/i);
      if (content?.[2]) staticStrings.add(decodeHtml(content[2]).trim());
    }
    for (const english of staticStrings) {
      if (!/[A-Za-z]/.test(english) || english === "Z Route" || /^v\d+(?:\.\d+)+$/i.test(english) || allowedEnglish(english)) continue;
      if (!(english in source)) issue("missing used UI key", htmlPath, english);
    }
    const context = runScript(`i18n/${page}.js`);
    const dictionaries = context.window.PAGE_I18N;
    for (const code of TARGETS) {
      const dictionary = dictionaries?.[code];
      if (!dictionary) {
        issue("missing locale dictionary", `${page}/${code}`, "dictionary not found");
        continue;
      }
      for (const [english, translations] of Object.entries(source)) {
        checked++;
        const translated = dictionary[english];
        if (typeof translated !== "string" || !translated.trim()) issue("missing UI key", `${page}/${code}`, english);
        if (JSON.stringify(vars(english)) !== JSON.stringify(vars(translated))) issue("placeholder mismatch", `${page}/${code}`, english);
        reportSame(code, english, translated, `${page}/UI`);
      }
      checkTags(dictionary, `${page}/${code}`);
      if (code === "zh") checkChinese(dictionary, `${page}/${code}`);
    }
  }
}

function heroStrings(hero, visit, prefix) {
  const fields = ["name", "display_name", "variant_note", "army_name", "camp_label", "role_description", "story"];
  for (const field of fields) if (typeof hero[field] === "string") visit(hero[field], `${prefix}.${field}`);
  if (hero.training_center?.building_name) visit(hero.training_center.building_name, `${prefix}.training_center.building_name`);
  for (const [index, skill] of (hero.skills || []).entries()) {
    for (const field of ["type_name", "name", "effect_type", "description", "template"]) {
      if (typeof skill[field] === "string") visit(skill[field], `${prefix}.skills[${index}].${field}`);
    }
    for (const [n, row] of (skill.by_star || []).entries()) if (row.text) visit(row.text, `${prefix}.skills[${index}].by_star[${n}].text`);
    for (const [n, row] of (skill.star_upgrades || []).entries()) if (row.text) visit(row.text, `${prefix}.skills[${index}].star_upgrades[${n}].text`);
    for (const [n, row] of (skill.keywords || []).entries()) {
      visit(row.name, `${prefix}.skills[${index}].keywords[${n}].name`);
      visit(row.text, `${prefix}.skills[${index}].keywords[${n}].text`);
    }
  }
  for (const [n, row] of (hero.insight?.tags || []).entries()) visit(row, `${prefix}.insight.tags[${n}]`);
  if (hero.insight?.summary) visit(hero.insight.summary, `${prefix}.insight.summary`);
  for (const [n, row] of (hero.insight?.tips || []).entries()) visit(row, `${prefix}.insight.tips[${n}]`);
  if (hero.exclusive_gear) {
    for (const [n, row] of (hero.exclusive_gear.keywords || []).entries()) {
      visit(row.name, `${prefix}.exclusive_gear.keywords[${n}].name`);
      visit(row.text, `${prefix}.exclusive_gear.keywords[${n}].text`);
    }
    for (const [n, row] of (hero.exclusive_gear.skills || []).entries()) {
      visit(row.name, `${prefix}.exclusive_gear.skills[${n}].name`);
      visit(row.description, `${prefix}.exclusive_gear.skills[${n}].description`);
    }
    for (const [n, row] of (hero.exclusive_gear.upgraded_skills || []).entries()) {
      visit(row.name, `${prefix}.exclusive_gear.upgraded_skills[${n}].name`);
      visit(row.at_max, `${prefix}.exclusive_gear.upgraded_skills[${n}].at_max`);
    }
  }
}

function checkHeroes() {
  const context = runScript("heroes/heroes_data.js");
  const base = vm.runInContext("HEROES_DATA", context);
  const baseMeta = vm.runInContext("HEROES_META", context);
  for (const code of TARGETS) {
    const localeContext = runScript(`heroes/heroes_i18n/${code}.js`);
    const payload = localeContext.window.HEROES_LOCALES?.[code];
    if (!payload) {
      issue("missing locale data", `heroes/${code}`, "payload not found");
      continue;
    }
    const byId = new Map((payload.heroes || []).map(hero => [hero.id, hero]));
    if (byId.size !== base.length) issue("hero count mismatch", `heroes/${code}`, `${byId.size} vs ${base.length}`);
    for (const source of base) {
      const translated = byId.get(source.id);
      if (!translated) {
        issue("missing hero", `heroes/${code}`, String(source.id));
        continue;
      }
      const sourceSkills = source.skills || [], targetSkills = translated.skills || [];
      if (sourceSkills.length !== targetSkills.length) issue("skill count mismatch", `heroes/${code}/${source.id}`, `${targetSkills.length} vs ${sourceSkills.length}`);
      for (let i = 0; i < Math.min(sourceSkills.length, targetSkills.length); i++) {
        const a = sourceSkills[i], b = targetSkills[i];
        if (JSON.stringify(vars(a.template)) !== JSON.stringify(vars(b.template))) issue("skill template placeholders", `heroes/${code}/${source.id}/${a.slot}`, `${a.template} => ${b.template}`);
        if (JSON.stringify(a.by_star?.map(row => row.args)) !== JSON.stringify(b.by_star?.map(row => row.args))) issue("skill args changed", `heroes/${code}/${source.id}/${a.slot}`, "numeric skill args differ from English");
        for (const [rowIndex, row] of (b.by_star || []).entries()) {
          const missingArgs = [...new Set(vars(b.template).filter(index => index >= (row.args || []).length))];
          if (missingArgs.length) issue("skill placeholders without args", `heroes/${code}/${source.id}/${a.slot}/by_star[${rowIndex}]`, missingArgs.join(", "));
        }
        const renderedTexts = [["description", b.description], ...(b.by_star || []).map((row, index) => [`by_star[${index}]`, row.text]), ...(b.star_upgrades || []).map((row, index) => [`star_upgrades[${index}]`, row.text])];
        for (const [label, text] of renderedTexts) if (typeof text === "string" && /\{\d+\}/.test(text)) issue("unfilled skill placeholder", `heroes/${code}/${source.id}/${a.slot}/${label}`, text);
      }
      heroStrings(source, (text, where) => {
        const corresponding = where.replace(/^heroes\[\d+\]\.?/, "");
        const translatedText = resolvePath(translated, where.replace(/^heroes\[\d+\]\.?/, ""));
        checked++;
        if (text && (typeof translatedText !== "string" || !translatedText.trim())) issue("missing hero text", `heroes/${code}/${source.id}/${corresponding}`, "empty localization");
        reportSame(code, text, translatedText, `heroes/${source.id}/${corresponding}`);
      }, `heroes[${base.indexOf(source)}]`);
    }
    checkTags(payload, `heroes/${code}`);
    checkUnfilled(payload, `heroes/${code}`, keyPath => keyPath.endsWith(".template"));
    const meta = payload.meta || {};
    checkTags(meta, `heroes/${code}.meta`);
    if (code === "zh") {
      checkChinese(payload, `heroes/${code}`);
      checkChinese(meta, `heroes/${code}.meta`);
    }
    collectStrings(baseMeta, (text, where) => reportSame(code, text, resolvePath(meta, where), `heroes/meta.${where}`));
    for (const text of [meta.about, ...(meta.global_insights || []).flatMap(item => [item.title, item.text])]) {
      if (text && /<\/?(?:color|link|u)(?:\s|=|\/?>)/i.test(text)) issue("rich tag", `heroes/${code}.meta`, text.slice(0, 100));
    }
    for (const [key, item] of Object.entries(baseMeta.glossary || {})) {
      const translated = meta.glossary?.[key];
      if (!translated || !translated.name || !translated.text) issue("missing glossary entry", `heroes/${code}`, key);
      if (translated?.text && /\{\d+\}/.test(translated.text)) issue("unfilled glossary placeholder", `heroes/${code}/${key}`, translated.text);
    }
  }
}

function checkHeroExp() {
  const context = runScript("hero-exp/hero_exp_data.js");
  const base = context.window.HERO_EXP;
  const ids = [base.battle_exp_item.item_id, ...base.chests.map(chest => chest.item_id)];
  for (const code of TARGETS) {
    const localeContext = runScript(`hero-exp/hero_exp_i18n/${code}.js`);
    const locale = localeContext.window.HERO_EXP_I18N?.[code];
    if (!locale) {
      issue("missing locale data", `hero-exp/${code}`, "payload not found");
      continue;
    }
    for (const id of ids) {
      const translated = locale.items?.[id];
      if (!translated) issue("missing item name", `hero-exp/${code}`, id);
      const source = [base.battle_exp_item, ...base.chests].find(item => item.item_id === id)?.name;
      reportSame(code, source, translated, `hero-exp/${id}`);
      checked++;
    }
    if (!locale.points_buff_name) issue("missing research name", `hero-exp/${code}`, "points_buff_name");
    reportSame(code, base.alliance_competition.points_buff.name, locale.points_buff_name, "hero-exp/points buff");
    checkTags(locale, `hero-exp/${code}`);
    checkUnfilled(locale, `hero-exp/${code}`);
    if (code === "zh") checkChinese(locale, `hero-exp/${code}`);
  }
}

function checkResearch() {
  const context = runScript("research/research_data.js");
  const base = context.window.RESEARCH_DATA;
  for (const code of TARGETS) {
    const localeContext = runScript(`research/research_i18n/${code}.js`);
    const locale = localeContext.window.RESEARCH_I18N?.[code];
    if (!locale) {
      issue("missing locale data", `research/${code}`, "payload not found");
      continue;
    }
    const trees = new Map((locale.trees || []).map(tree => [tree.id, tree]));
    if (trees.size !== base.trees.length) issue("tree count mismatch", `research/${code}`, `${trees.size} vs ${base.trees.length}`);
    for (const tree of base.trees) {
      const localTree = trees.get(tree.id);
      if (!localTree) {
        issue("missing research tree", `research/${code}`, String(tree.id));
        continue;
      }
      reportSame(code, tree.name, localTree.name, `research/tree ${tree.id}`);
      const techs = new Map((localTree.techs || []).map(tech => [tech.id, tech]));
      if (techs.size !== tree.techs.length) issue("tech count mismatch", `research/${code}/${tree.id}`, `${techs.size} vs ${tree.techs.length}`);
      for (const tech of tree.techs) {
        const localTech = techs.get(tech.id);
        if (!localTech) {
          issue("missing tech", `research/${code}`, String(tech.id));
          continue;
        }
        reportSame(code, tech.name, localTech.name, `research/${tech.id}/name`);
        reportSame(code, tech.description, localTech.description, `research/${tech.id}/description`);
        if ((localTech.levels || []).length !== (tech.levels || []).length) issue("research level count mismatch", `research/${code}/${tech.id}`, "level rows differ");
        for (let i = 0; i < Math.min(tech.levels.length, localTech.levels.length); i++) {
          const a = tech.levels[i], b = localTech.levels[i];
          if (JSON.stringify(a.benefit_data?.map(({value, sign, parameter_type}) => [value, sign, parameter_type])) !== JSON.stringify(b.benefit_data?.map(({value, sign, parameter_type}) => [value, sign, parameter_type]))) issue("research benefit facts changed", `research/${code}/${tech.id}/level ${i + 1}`, "value/sign/type differs from English");
          for (let n = 0; n < Math.min(a.benefit_data?.length || 0, b.benefit_data?.length || 0); n++) reportSame(code, a.benefit_data[n].name, b.benefit_data[n].name, `research/${tech.id}/benefit`);
          for (let n = 0; n < Math.min(a.benefits?.length || 0, b.benefits?.length || 0); n++) {
            if (/\{\d+\}/.test(b.benefits[n])) issue("unfilled research placeholder", `research/${code}/${tech.id}`, b.benefits[n]);
            reportSame(code, a.benefits[n], b.benefits[n], `research/${tech.id}/benefit line`);
          }
        }
        checked++;
      }
    }
    checkTags(locale, `research/${code}`);
    checkUnfilled(locale, `research/${code}`);
    if (code === "zh") checkChinese(locale, `research/${code}`);
  }
}

function main() {
  checkPageDictionaries();
  checkHeroes();
  checkHeroExp();
  checkResearch();

  console.log(`Localization QA: ${checked} translated entries checked across ${LANGS.join(", ")}`);
  for (const kind of ["missing locale dictionary", "missing UI key", "missing used UI key", "missing locale data", "missing hero", "missing hero text", "missing item name", "missing research name", "missing glossary entry", "placeholder mismatch", "skill template placeholders", "skill args changed", "skill placeholders without args", "unfilled placeholder", "unfilled skill placeholder", "unfilled glossary placeholder", "unfilled research placeholder", "research benefit facts changed", "rich tag", "Traditional character"]) {
    const matches = issues.filter(item => item.kind === kind);
    console.log(`${kind}: ${matches.length}`);
    for (const item of matches.slice(0, 8)) console.log(`  ${item.where}: ${item.detail}`);
  }
  for (const code of TARGETS) {
    const candidates = identical[code];
    console.log(`same-as-English candidates ${code}: ${candidates.length}`);
    for (const candidate of candidates.slice(0, 5)) console.log(`  ${candidate}`);
  }
  if (issues.length) process.exitCode = 1;
}

main();
