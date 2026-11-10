#!/usr/bin/env python3
"""Build derived 1.41.02 findings from pinned local TextAssets. Offline only."""
import argparse
import hashlib
import json
from pathlib import Path
from lua54_tables import parse, restore, rows

ROOT = Path(__file__).resolve().parents[1]


def sequence(value):
    if not value:
        return []
    return [value[key] for key in sorted(value)]


def build(source):
    pins = json.loads((ROOT / "data/build344-source-pins.json").read_text())
    tables, names = {}, {}
    for name, pin in pins["sources"].items():
        payload = (source / (pin["bundle"] + "-" + name)).read_bytes()
        if hashlib.sha256(payload).hexdigest() != pin["payload_sha256"]:
            raise ValueError("unreviewed source: " + name)
        if name.endswith(".lua"):
            key = name[:-4]
            tables[key] = rows(parse(restore(payload))[key])
        else:
            names.update({row["id"]: row["en"] for row in json.loads(payload)["datas"]})
    old = json.loads((ROOT / "data/progression.json").read_text())
    heroes = json.loads((ROOT / "data/heroes.json").read_text())
    old_buildings = {row["id"] for row in old["buildings"]}
    old_techs = {row["id"] for row in old["research"]}
    new_research = []
    for key, row in tables["CollegeTech"].items():
        if key in old_techs:
            continue
        levels = sorted((v for v in tables["CollegeTechLevel"].values() if v["techId"] == key), key=lambda v: v["level"])
        new_research.append({
            "id": key, "name": names.get(row["name"], row["name"]),
            "tree_id": row["techType"], "max_level": row["maxLevel"],
            "position": row["pos"], "tree_conditions": sequence(row["precondition"]),
            "research_data_total": sum(v["count"] for level in levels for v in level["specialCost"].values() if v["id"] == "item_research_info"),
            "levels": [{"level": v["level"], "base_time_seconds": v["upgradeTime"],
                        "costs": sequence(v["cost"]), "special_costs": sequence(v["specialCost"]),
                        "prerequisites": sequence(v["precondition"]), "benefits": sequence(v["benefit"])} for v in levels],
        })
    changed_base = []
    current_base = {v["level"]: v for v in tables["BuildingLevel"].values() if v["buildingId"] == 1001}
    for level in next(v for v in old["buildings"] if v["id"] == 1001)["levels"]:
        new = current_base[level["level"]]
        upgrade = tables["BuildingUpgrade"][new["id"]]
        old_cost = {(v["type"], v.get("item_id", "")): v["count"] for v in level["costs"]}
        new_cost = {(v["type"], v["id"]): v["count"] for v in upgrade["cost"].values()}
        old_gates = [{k: v for k, v in c.items() if k in ("id", "param1", "param2", "param3", "param4")} for c in level["prerequisites"]]
        if (old_cost != new_cost or level["base_time_seconds"] != upgrade["time"]
                or old_gates != sequence(new["precondition"])):
            changed_base.append(level["level"])
    titles = []
    for key, row in tables["ActivityTempleBattleTitle"].items():
        titles.append({"id": key, "name": names.get(row["name"], row["name"]),
                       "appoint_permission_flag": row["appoint"],
                       "benefits": [{"type": v["Type"], "value": v["Value"],
                                     "name": names.get(tables["DefineBenefit"][v["Type"]]["name"], "")}
                                    for v in row["benefit"].values()]})
    selected_params = ["kingdom_rank_max_list_queue", "kingdom_rank_max_list_approve",
                       "kingdom_official_record_limit", "kingdom_same_rank_time_limit",
                       "kingdom_rank_appoint_limit", "kingdom_rank_time_limit"]
    return {
        "source": {"app_version": "1.41.02", "version_code": 344, "catalog": pins["catalog"],
                   "status": "embedded_client_facts_not_live_patch_or_release_status"},
        "row_counts": {name: len(table) for name, table in tables.items()},
        "baseline": "data/model-manifest.json (1.30.07); this is not a diff against every later feature dataset",
        "base": {"max_level": tables["Building"][1001]["maxLv"],
                 "levels_with_changed_cost_time_or_prerequisites": changed_base},
        "playable_hero_ids": [key for key, row in tables["HeroInfo"].items() if row["heroType"] == 1 and row["showType"] == 1],
        "new_playable_hero_ids": [key for key, row in tables["HeroInfo"].items() if row["heroType"] == 1 and row["showType"] == 1 and key not in {v["id"] for v in heroes["playable_heroes"]}],
        "added_buildings": [{"id": key, "name": names.get(row["name"], row["name"]),
                             "type": row["type"], "max_level": row["maxLv"],
                             "show_conditions": sequence(row["showCondition"])}
                            for key, row in tables["Building"].items() if key not in old_buildings],
        "added_research": new_research,
        "alliance_competition_research_data_total": sum(
            cost["count"] for level in tables["CollegeTechLevel"].values()
            if tables["CollegeTech"][level["techId"]]["techType"] == 9
            for cost in level["specialCost"].values() if cost["id"] == "item_research_info"),
        "capitol": {"titles": titles,
                    "rotation_intervals": [{"id": key, "seconds": row["Time"]} for key, row in tables["KingdomBuffTimeQueue"].items()],
                    "parameters": {key: tables["ActivityTempleBattleParameter"][key]["value"] for key in selected_params}},
    }


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("source", type=Path)
    p.add_argument("output", type=Path)
    args = p.parse_args()
    result = build(args.source)
    args.output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
