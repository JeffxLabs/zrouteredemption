#!/usr/bin/env python3
"""Build lightweight, per-language Hero EXP item-name scripts from client language files."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LANGUAGES = ("fr", "ru", "tr", "pl", "es", "pt", "de", "ko", "zh")


def main():
    data = json.loads((ROOT / "data/hero_exp.json").read_text())
    out_dir = ROOT / "hero-exp/hero_exp_i18n"
    out_dir.mkdir(exist_ok=True)
    for code in LANGUAGES:
        suffix = "zh_tw" if code == "zh" else code
        item_rows = json.loads((ROOT / f".i18n-src/lang_item_{suffix}.json").read_text())["datas"]
        building_rows = json.loads((ROOT / f".i18n-src/lang_building_{suffix}.json").read_text())["datas"]
        items = {row["id"]: row.get(suffix) for row in item_rows}
        buildings = {row["id"]: row.get(suffix) for row in building_rows}
        item_ids = [data["battle_exp_item"]["item_id"], *(chest["item_id"] for chest in data["chests"])]
        raw = [items.get("itemname_" + item_id.removeprefix("item_"), "") for item_id in item_ids]
        raw.append(buildings.get("collegeTech_9005", ""))
        if code == "zh":
            from simplified_chinese import simplify
            raw = simplify(raw)
        names = {item_id: name for item_id, name in zip(item_ids, raw[:-1])}
        locale = {"items": names, "points_buff_name": raw[-1]}
        (out_dir / f"{code}.js").write_text(
            "window.HERO_EXP_I18N = window.HERO_EXP_I18N || {}; window.HERO_EXP_I18N[" +
            json.dumps(code) + "] = " + json.dumps(locale, ensure_ascii=False, separators=(",", ":")) + ";\n"
        )
    print("Built Hero EXP item labels for", len(LANGUAGES), "languages")


if __name__ == "__main__":
    main()
