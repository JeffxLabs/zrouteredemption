#!/usr/bin/env python3
"""Extract Hero EXP facts from decrypted client tables into data/hero_exp.json.

Sources: HeroLevel (EXP per level), BFCastleBase (hero level cap per HQ level),
CastleBox (Hero EXP chest contents per HQ level), Item (EXP items),
PointSource + ActivityTarget (Alliance Competition hero-day points) and
data/progression.json (the Points Buff research).

Usage:
  python3 tools/extract_hero_exp.py /path/to/decrypted-lua-tables /path/to/lang_item_en.json data/hero_exp.json
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lua_tables import load  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent


def main(src, lang_item, out):
    src = Path(src)
    lang = {r["id"]: r["en"] for r in json.loads(Path(lang_item).read_text())["datas"]}
    level_rows = sorted((r for r in load(src / "HeroLevel.lua", "HeroLevel").values() if r["template_type"] == 1), key=lambda r: r["level"])
    levels, total = [], 0
    for r in level_rows:
        cost = sum(c["count"] for c in r["cost"] if c["type"] == 5)
        total += cost
        levels.append({"level": r["level"], "cost": cost, "cumulative": total})
    castle = load(src / "BFCastleBase.lua", "BFCastleBase")
    caps = [{"hq": k, "hero_level_cap": v["heroLvCap"]} for k, v in sorted(castle.items())]
    items = load(src / "Item.lua", "Item")
    boxes = load(src / "CastleBox.lua", "CastleBox")
    chests = []
    for n, grade in ((1, "R"), (2, "SR"), (3, "SSR"), (4, "UR")):
        item_id = f"item_castleBox_HeroEXP_{n}"
        by_hq = sorted((b["level"], b["reward"][0]["count"]) for b in boxes.values() if b["itemId"] == item_id)
        chests.append({"item_id": item_id, "grade": grade, "name": lang.get(items[item_id]["name"]), "icon": items[item_id]["icon"],
                       "quality": items[item_id]["quality"], "exp_by_hq": [{"hq": h, "exp": e} for h, e in by_hq]})
    battle = items["item_heroExp_1k"]
    sources = load(src / "PointSource.lua", "PointSource")
    targets = load(src / "ActivityTarget.lua", "ActivityTarget")
    hero_day = targets[5700104]
    exp_sources = []
    for sid in hero_day["pointSourceIds"]:
        s = sources[sid]
        bean = s["pointSourceBean"][0]
        if bean["id"] == 10003 and bean["param1"] == "5":  # consume resource type 5 = Hero EXP
            exp_sources.append({"point_source": sid, "exp": int(bean["param3"]), "points": s["pointValue"], "boost_benefit": (s["benefitIds"] or [None])[0]})
    progression = json.loads((ROOT / "data/progression.json").read_text())
    buff = next(t for t in progression["research"] if t["id"] == 9005)
    result = {
        "source": "HeroLevel, BFCastleBase, CastleBox, Item, PointSource, ActivityTarget (catalog V202610032200)",
        "levels": levels,
        "hq_caps": caps,
        "max_hq": max(c["hq"] for c in caps),
        "chests": chests,
        "battle_exp_item": {"item_id": "item_heroExp_1k", "name": lang.get(battle["name"]), "icon": battle["icon"], "exp": battle["value"]},
        "alliance_competition": {"activity_target": 5700104, "day": 4, "sources": exp_sources,
                                 "points_buff": {"research_id": 9005, "name": buff["name"],
                                                 "levels": [{"level": l["level"], "bonus": next(b["value"] for b in l["benefits"] if b["type"] == 6004)} for l in buff["levels"]]}},
    }
    Path(out).write_text(json.dumps(result, indent=1, ensure_ascii=False) + "\n")
    (ROOT / "hero-exp/hero_exp_data.js").write_text("window.HERO_EXP = " + json.dumps(result, ensure_ascii=False, separators=(",", ":")) + ";\n")
    print(len(levels), "levels; caps to HQ", result["max_hq"], "; duel", exp_sources)


if __name__ == "__main__":
    main(*sys.argv[1:4])
