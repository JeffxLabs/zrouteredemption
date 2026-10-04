#!/usr/bin/env python3
"""Build research/research_data.js from data/research_layout.json and data/progression.json.

Standard library only. Usage: python3 tools/build_research_data.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LANGUAGES = ("fr", "ru", "tr", "pl", "es", "pt", "de", "ko", "zh")


def benefit_text(b, ptype):
    name = re.sub(r"<[^>]+>", "", b["name"] or f"Benefit {b['type']}").strip()
    sign = "+"
    if name.endswith(("+", "-")):
        sign, name = name[-1], name[:-1].strip()
    v = b["value"]
    if ptype == 1:
        value = f"{round(v * 100, 3):g}%"
    elif ptype == 3:
        value = f"{v:g}"
    else:
        value = f"{v:,.0f}" if float(v).is_integer() else f"{v:g}"
    return f"{name} {sign}{value}"


def benefit_parts(b, ptype, name=None):
    source_name = re.sub(r"<[^>]+>", "", b["name"] or f"Benefit {b['type']}").strip()
    label = re.sub(r"<[^>]+>", "", name if name is not None else source_name).strip()
    sign = source_name[-1] if source_name.endswith(("+", "-")) else "+"
    label = re.sub(r"\s*[+-]$", "", label).strip()
    return {"name": label, "sign": sign, "value": b["value"], "parameter_type": ptype}


def clean_text(text):
    text = re.sub(r"<link=[^>]*>|</link>|<u>|</u>|<color=[^>]*>|</color>", "", text or "")
    return re.sub(r"\s*[+-]$", "", text).strip()


def description_key(text, lookup):
    return lookup.get(clean_text(text).casefold())


def main():
    layout = json.loads((ROOT / "data/research_layout.json").read_text())
    prog = json.loads((ROOT / "data/progression.json").read_text())
    ptypes = {b["id"]: b["parameter_type"] for b in prog["benefits"]}
    research = {r["id"]: r for r in prog["research"]}
    tech_names = {t["id"]: t["name"] for tr in layout["trees"] for t in tr["techs"]}
    trees = []
    for tree in layout["trees"]:
        techs = []
        for t in tree["techs"]:
            r = research.get(t["id"])
            levels = []
            for lv in (r["levels"] if r else []):
                cost = {c["type"]: c["count"] for c in lv["costs"]}
                chips = sum(s["count"] for s in lv["special_costs"] if s.get("item_id") == "item_research_info")
                inst = max((q["minimum_level"] for q in lv["prerequisites"] if q["kind"] == "any_building_class_level"), default=0)
                req = [{"tech": q["research_id"], "level": q["minimum_level"], "name": tech_names.get(q["research_id"])}
                       for q in lv["prerequisites"] if q["kind"] == "research_level"]
                levels.append({"level": lv["level"], "time": lv["base_time_seconds"], "power": lv["ability"],
                               "food": cost.get(1, 0), "metal": cost.get(2, 0), "oil": cost.get(3, 0), "chips": chips,
                               "institute": inst, "req": req,
                               "benefits": [benefit_text(b, ptypes.get(b["type"])) for b in lv["benefits"]],
                               "benefit_data": [benefit_parts(b, ptypes.get(b["type"])) for b in lv["benefits"]]})
            desc = re.sub(r"\s*[+-]$", "", t["description"] or "").strip() or None
            techs.append({**{k: t[k] for k in ("id", "name", "row", "col", "pos", "from", "max_level")}, "description": desc,
                          "icon": f"../assets/research/tech/{t['icon']}.webp", "levels": levels, "has_costs": bool(levels)})
        trees.append({k: tree[k] for k in ("id", "name", "sort", "squad", "recommended", "unlock")} |
                     {"icon": f"../assets/research/{tree['icon']}.png", "techs": techs,
                      "rows": max(t["row"] for t in techs), "cols": max(t["col"] for t in techs)})
    out = {"source": "Layout: CollegeTechType/CollegeTech (catalog V202610032200). Costs, times, prerequisites and benefits: data/progression.json (client 1.30.07).",
           "trees": trees}
    (ROOT / "research/research_data.js").write_text("window.RESEARCH_DATA = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n")
    locale_dir = ROOT / "research/research_i18n"
    locale_dir.mkdir(exist_ok=True)
    for code in LANGUAGES:
        suffix = "zh_tw" if code == "zh" else code
        field = suffix
        source_tables = {}
        raw_values = []
        for table in ("building", "benefit"):
            rows = json.loads((ROOT / f".i18n-src/lang_{table}_{suffix}.json").read_text())["datas"]
            table_map = {row["id"]: row.get(field) for row in rows}
            source_tables[table] = table_map
            raw_values.extend(value or "" for value in table_map.values())
        if code == "zh":
            from simplified_chinese import simplify
            converted = iter(simplify(raw_values))
            source_tables = {table: {key: next(converted) for key in values} for table, values in source_tables.items()}
        building, benefit = source_tables["building"], source_tables["benefit"]
        benefit_en_rows = json.loads((ROOT / ".i18n-src/lang_benefit_en.json").read_text())["datas"]
        benefit_en = {row["id"]: row.get("en") for row in benefit_en_rows}
        benefit_by_english = {}
        for key, value in benefit_en.items():
            if value:
                benefit_by_english.setdefault(value, []).append(key)
        benefit_by_description = {}
        for key, value in benefit_en.items():
            if value:
                benefit_by_description.setdefault(clean_text(value).casefold(), []).append(key)

        def benefit_key(type_id, name):
            direct = f"benefit_{type_id}"
            if direct in benefit:
                return direct
            exact = benefit_by_english.get(name, [])
            return exact[0] if exact else None

        localized_benefit_name = {}
        for b in prog["benefits"]:
            key = benefit_key(b["id"], b["name"] or "")
            if key and benefit.get(key):
                localized_benefit_name[b["id"]] = benefit[key]
        localized_tech_names = {t["id"]: building.get(f"collegeTech_{t['id']}") or t["name"]
                                for tree in layout["trees"] for t in tree["techs"]}
        tree_names = {tree["id"]: building.get(f"science_research_type_{tree['id']:02d}") or tree["name"]
                      for tree in layout["trees"]}

        def localized_benefit_text(b, ptype):
            name = localized_benefit_name.get(b["type"], b["name"] or f"Benefit {b['type']}")
            name = re.sub(r"<[^>]+>", "", name).strip()
            source_name = re.sub(r"<[^>]+>", "", b["name"] or f"Benefit {b['type']}").strip()
            sign = source_name[-1] if source_name.endswith(("+", "-")) else "+"
            name = re.sub(r"\s*[+-]$", "", name).strip()
            value = b["value"]
            if ptype == 1:
                shown = f"{round(value * 100, 3):g}%"
            elif ptype == 3:
                shown = f"{value:g}"
            else:
                shown = f"{value:,.0f}" if float(value).is_integer() else f"{value:g}"
            return f"{name} {sign}{shown}"

        locale_trees = []
        for tree in layout["trees"]:
            locale_techs = []
            for tech in tree["techs"]:
                research_row = research.get(tech["id"])
                levels = []
                for level in (research_row["levels"] if research_row else []):
                    levels.append({"level": level["level"],
                                   "benefits": [localized_benefit_text(b, ptypes.get(b["type"])) for b in level["benefits"]],
                                   "benefit_data": [benefit_parts(b, ptypes.get(b["type"]), localized_benefit_name.get(b["type"])) for b in level["benefits"]]})
                desc = clean_text(tech["description"] or "")
                desc_key = description_key(tech["description"] or "", benefit_by_description)
                description = benefit.get(desc_key[0]) if desc_key else None
                locale_techs.append({"id": tech["id"], "name": localized_tech_names[tech["id"]],
                                     "description": clean_text(description or desc),
                                     "levels": levels})
            locale_trees.append({"id": tree["id"], "name": tree_names[tree["id"]], "techs": locale_techs})
        locale = {"trees": locale_trees}
        (locale_dir / f"{code}.js").write_text("window.RESEARCH_I18N = window.RESEARCH_I18N || {}; window.RESEARCH_I18N[" +
            json.dumps(code) + "] = " + json.dumps(locale, ensure_ascii=False, separators=(",", ":")) + ";\n")
    print(len(trees), "trees", sum(len(t["techs"]) for t in trees), "techs")


if __name__ == "__main__":
    main()
