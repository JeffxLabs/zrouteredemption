#!/usr/bin/env python3
"""Extract the research tree layout from decrypted client tables.

Reads CollegeTechType and CollegeTech (tree grid positions, connector lines, icons,
names and description keys) plus the English building/benefit text, and writes
data/research_layout.json. Costs, times and benefits stay in data/progression.json.

Usage:
  python3 tools/extract_research_layout.py /path/to/decrypted-lua-tables \
      /path/to/lang_building_en.json /path/to/lang_benefit_en.json data/research_layout.json
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lua_tables import load  # noqa: E402


def clean(text):
    return re.sub(r"<[^>]+>", "", text or "").strip()


def condition(c, type_names):
    cid, p1, p2 = c["id"], c.get("param1"), c.get("param2")
    if cid == 20107 and p1 == "7":
        return {"kind": "institute_level", "level": int(p2), "text": f"Institute Lv. {p2}"}
    if cid == 20205:
        name = type_names.get(int(p1), f"Tree {p1}")
        return {"kind": "tree_progress", "tree": int(p1), "percent": int(p2), "text": f"{name} {p2}% complete"}
    if cid == 20201:
        return {"kind": "tech_level", "tech": int(p1), "level": int(p2), "text": f"Tech {p1} Lv. {p2}"}
    if cid == 110007:
        return {"kind": "monthly_card", "text": "Monthly Card purchased"}
    return {"kind": f"condition_{cid}", "text": f"Condition {cid}"}


def main(src, lang_building, lang_benefit, out):
    src = Path(src)
    lang = {}
    for path in (lang_building, lang_benefit):
        lang.update({r["id"]: r["en"] for r in json.loads(Path(path).read_text())["datas"]})
    types = load(src / "CollegeTechType.lua", "CollegeTechType")
    techs = load(src / "CollegeTech.lua", "CollegeTech")
    type_names = {t["id"]: lang.get(t["name"], t["name"]) for t in types.values()}

    trees = []
    for t in sorted(types.values(), key=lambda t: t["sort"]):
        nodes = []
        for c in sorted((c for c in techs.values() if c["techType"] == t["id"]), key=lambda c: c["id"]):
            _, row, col = (int(x) for x in c["pos"].split("_"))
            nodes.append({
                "id": c["id"], "name": lang.get(c["name"], c["name"]),
                "row": row, "col": col, "pos": c["pos"],
                "from": [p["pos"] for p in c["preLine"] or []],
                "icon": c["icon"], "max_level": c["maxLevel"],
                "description": clean(lang.get(c["des"])) or None,
                "frame": c["typeBaseFrame"],
            })
        trees.append({
            "id": t["id"], "name": type_names[t["id"]], "sort": t["sort"], "icon": t["pic"],
            "squad": t["troopIndex"] or None, "recommended": bool(t["recommend"]),
            "shown_when": [condition(c, type_names) for c in t["displayCondition"] or []],
            "unlock": [condition(c, type_names) for c in t["precondition"] or []],
            "techs": nodes,
        })
    Path(out).write_text(json.dumps({"source": "CollegeTechType, CollegeTech (catalog V202610032200)", "trees": trees},
                                    indent=1, ensure_ascii=False) + "\n")
    print(len(trees), "trees", sum(len(t["techs"]) for t in trees), "techs")


if __name__ == "__main__":
    main(*sys.argv[1:5])
