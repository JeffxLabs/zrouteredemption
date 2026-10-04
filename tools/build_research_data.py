#!/usr/bin/env python3
"""Build research/research_data.js from data/research_layout.json and data/progression.json.

Standard library only. Usage: python3 tools/build_research_data.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


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
                               "benefits": [benefit_text(b, ptypes.get(b["type"])) for b in lv["benefits"]]})
            desc = re.sub(r"\s*[+-]$", "", t["description"] or "").strip() or None
            techs.append({**{k: t[k] for k in ("id", "name", "row", "col", "pos", "from", "max_level")}, "description": desc,
                          "icon": f"../assets/research/tech/{t['icon']}.webp", "levels": levels, "has_costs": bool(levels)})
        trees.append({k: tree[k] for k in ("id", "name", "sort", "squad", "recommended", "unlock")} |
                     {"icon": f"../assets/research/{tree['icon']}.png", "techs": techs,
                      "rows": max(t["row"] for t in techs), "cols": max(t["col"] for t in techs)})
    out = {"source": "Layout: CollegeTechType/CollegeTech (catalog V202610032200). Costs, times, prerequisites and benefits: data/progression.json (client 1.30.07).",
           "trees": trees}
    (ROOT / "research/research_data.js").write_text("window.RESEARCH_DATA = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n")
    print(len(trees), "trees", sum(len(t["techs"]) for t in trees), "techs")


if __name__ == "__main__":
    main()
