#!/usr/bin/env python3
"""Extract hero skill values, icons and squad rules from decrypted client config tables.

The client stores each skill's displayed numbers in HeroSkillDes and fills the {n}
placeholders with (starBase + starGrow * skillLevel) * starFactor, choosing the
parameter row by whole star (HeroUIUtil.GetHeroSkillTip). This tool applies the same
formula; it never executes client code.

Usage:
  python3 tools/extract_hero_skills.py /path/to/decrypted-lua-tables data/lang_hero_en.json,data/lang_rules_en.json data/hero_skills.json

The decrypted tables (HeroSkillDes, HeroInfo, NewHeroSkill, HeroCamp, HeroCampAttr,
HeroExclusive) stay outside the repository.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lua_tables import load  # noqa: E402

STAR_LEVEL_CAP = {0: 1, 1: 1, 2: 5, 3: 10, 4: 20, 5: 30}
EFFECT_TYPE = {0: None, 1: "Physical DMG", 2: "Physical DEF", 3: "Radiation DMG", 4: "Energy DEF", 5: "Buff", 6: "Debuff"}


def fmt(value, param_type):
    """HeroUIUtil.FormatSkillParamValue: type 1 raw (2 decimals), otherwise percent."""
    if param_type == 1:
        return f"{round(value, 2):g}"
    return f"{round(value * 100, 2):g}%"


def raw(params, star, level):
    if not params:
        return None
    p = params[min(star, len(params) - 1)]
    return (p["starBase"] + p["starGrow"] * level) * p["starFactor"]


def args_for(row, star, level):
    """Placeholder arguments in the order the client passes them to FormatLanguageKey."""
    v1 = raw(row["skillDescParams"], star, level)
    v3 = raw(row["skillDescParams2"], star, level)
    a1 = fmt(v1, row["skillDescParamType"]) if v1 is not None else None
    a3 = fmt(v3, row["skillDescParam2Type"]) if v3 is not None else "0%"
    if row["skillCD"] and row["skillCD"] > 0:
        return [a1, f"{round(row['skillCD'], 2):g}", a3]
    return [a1, a3]


def fill(template, args):
    out = template or ""
    for i, a in enumerate(args):
        out = out.replace("{%d}" % i, str(a))
    return out


def factors_list(skill_factor):
    if isinstance(skill_factor, dict):
        return [skill_factor[k] for k in sorted(skill_factor)]
    return list(skill_factor or [])


def main(src, lang_path, out_path):
    src = Path(src)
    lang = {}
    for path in str(lang_path).split(","):
        doc = json.loads(Path(path).read_text())
        if "datas" in doc:
            lang.update({r["id"]: r["en"] for r in doc["datas"]})
        else:  # data/lang_rules_en.json: {"strings": {key: {"en": ...}}}
            for k, v in doc["strings"].items():
                lang.setdefault(k, v["en"])
    des = load(src / "HeroSkillDes.lua", "HeroSkillDes")
    info = load(src / "HeroInfo.lua", "HeroInfo")
    camp = load(src / "HeroCamp.lua", "HeroCamp")
    camp_attr = load(src / "HeroCampAttr.lua", "HeroCampAttr")
    exclusive = load(src / "HeroExclusive.lua", "HeroExclusive")

    heroes = {}
    for hero in sorted((h for h in info.values() if h["heroType"] == 1 and h["showType"] == 1), key=lambda h: h["id"]):
        rows = sorted((r for r in des.values() if r["heroId"] == hero["id"]), key=lambda r: (r["isExclusiveGearSkill"], r["skillSlot"]))
        skills, gear = [], []
        for r in rows:
            entry = {
                "slot": r["skillSlot"], "skill_des_id": r["id"], "icon_sprite": r["skillIcon"],
                "skill_type": r["skillType"], "effect_type": EFFECT_TYPE.get(r["skillEffectType"]),
                "cooldown_s": r["skillCD"] or 0,
                "name_key": r["skillName"], "name": lang.get(r["skillName"]),
                "desc_key": r["skillDesc"], "template": lang.get(r["skillDesc"]),
            }
            if r["skillType"] == 4:
                facs = factors_list(r["skillFactor"])
                entry["factors"] = facs[-1] if facs else []
                entry["text"] = fill(entry["template"], entry["factors"]) if entry["template"] else None
            elif r["isExclusiveGearSkill"] and r["skillSlot"] > 4:
                facs = factors_list(r["skillFactor"])
                entry["text"] = fill(entry["template"], facs[0] if facs else [])
            else:
                entry["by_star"] = []
                for star in range(6):
                    level = STAR_LEVEL_CAP[star]
                    args = args_for(r, star, level)
                    entry["by_star"].append({"star": star, "skill_level": level, "args": args, "text": fill(entry["template"], args)})
                tmpl = (entry["template"] or "").lower()
                top = raw(r["skillDescParams"], 5, 30)
                if r["skillDescParamType"] == 0 and top is not None and top > 1 and ("reduc" in tmpl or "less damage" in tmpl):
                    entry["value_note"] = "The client's own table gives a reduction above 100% here, which looks like a game data error. Shown as the game displays it."
                entry["at_level_40"] = fill(entry["template"], args_for(r, 5, 40)) if r["isExclusiveGearSkill"] or hero["id"] in {e["heroID"] for e in exclusive.values()} else None
                entry["star_upgrades"] = []
                for i, eff in enumerate(r["skillEffect"] or [], 1):
                    if eff and eff.get("Desc") and lang.get(eff["Desc"]):
                        entry["star_upgrades"].append({"star": i, "text": fill(lang[eff["Desc"]], eff.get("Factor") or [])})
                cd = [c.get("factor") for c in (r["cdParam"] or []) if isinstance(c, dict)]
                if any(cd):
                    entry["cooldown_speed_param"] = cd
            (gear if r["isExclusiveGearSkill"] else skills).append(entry)
        heroes[hero["id"]] = {
            "name": lang.get(hero["name"]), "head_sprite": hero["heroIcon"], "card_sprite": hero["image"],
            "replaced_by": None, "replaces": hero["heroReplace"] or None,
            "season_upgrade_to": hero["upHeroId"] or None, "season_upgrade_season": hero["seasonUpId"] or None,
            "skills": skills, "exclusive_gear_skills": gear,
        }
    for hid, h in heroes.items():
        if h["replaces"] and h["replaces"] in heroes:
            heroes[h["replaces"]]["replaced_by"] = hid

    result = {
        "source": {"tables": ["HeroSkillDes", "HeroInfo", "HeroCamp", "HeroCampAttr", "HeroExclusive"],
                   "formula": "(starBase + starGrow * skillLevel) * starFactor, star row = whole stars; skill level = star cap (1/1/5/10/20/30)"},
        "camp_counters": [{"camp": c["type"], "beats_camp": c["restrainType"], "damage_reduction": c["damageSubPercent"]} for c in camp.values()],
        "lineup_bonus": [{"same_faction": a["sameCampHeroCount"], "second_faction": a["otherSameCampHeroCount"],
                          "percent": a["attribute"][0]["percent"] if a["attribute"] else 0} for a in camp_attr.values() if a["id"]],
        "heroes": heroes,
    }
    Path(out_path).write_text(json.dumps(result, indent=1, ensure_ascii=False) + "\n")
    print(f"{len(heroes)} heroes, {sum(len(h['skills']) for h in heroes.values())} skills")


if __name__ == "__main__":
    main(*sys.argv[1:4])
