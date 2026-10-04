#!/usr/bin/env python3
"""Build data/heroes_directory.json and heroes/heroes_data.js.

Inputs (all in this repository):
  data/heroes.json          client tables HeroInfo/HeroLevel/HeroStar/NewHeroSkill/... (1.30.07)
  data/lang_hero_en.json    English hero text from the live client catalog
  data/hero_insights.json   curated analysis (tags, tips, global insights)
  assets/heroes/{skills,heads,ui}/  sprites exported from the client's UI_HeroSkill / UI_HeroIcon / UI_Hero atlases

Standard library only.  Usage: python3 tools/build_heroes_directory.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LANG_CATALOG = "V202610032200"

QUALITY = {3: "SR", 4: "SSR", 5: "UR"}
ROLE_KEY = {1: "hero_TYPE_02", 2: "hero_TYPE_03", 3: "hero_TYPE_04"}  # army_type -> client label key
ROLE_SHORT = {1: "Frontline", 2: "Support", 3: "Backline"}
CAMP = {1: "Tactical", 2: "Assault", 3: "Warrior"}  # confirmed by levelBenefit names and faction emblems
COUNTERS = {3: 2, 2: 1, 1: 3}  # Warrior > Assault > Tactical > Warrior (lang_hmi faction_counter_guide)
SKILL_TYPE_KEY = {1: "hero_skillType_1", 2: "hero_skillType_2", 3: "hero_skillType_3", 4: "hero_skillType_4"}

# Client sprite names that differ from the English hero name.  "artwork" = matched by comparing the
# client head icon with the hero card; everything else matches by name or transliteration.
SPRITE_NAME = {
    10005: "Rachel", 10006: "Nora", 10011: "NoraClassics", 10007: "Arnold", 10008: "Zara",
    20005: "Jinmina", 20006: "Conan", 20009: "Logan", 30001: "Brooks", 30003: "Alia", 31003: "Alia",
    30004: "Celeste", 30005: "Liyu", 30006: "Monroe", 30007: "Jack", 30011: "Jackson", 40001: "Jamal",
    40002: "Hank", 40010: "Taylor", 50001: "Deke", 50002: "Carter", 50003: "Lucien", 50004: "Bekka",
    50005: "Vigilo", 50006: "Leah", 50007: "Silas", 50008: "Katya", 50009: "Vera", 50010: "Vince",
    50011: "Yana", 50012: "Victor", 50013: "Niko",
}
HEAD_SPRITE = {**SPRITE_NAME, 30003: "AliaClassics", 31003: "Alia", 30006: "MarilynMonroe"}
ARTWORK_MATCH = {30001, 50001, 50013, 30006, 30003, 31003}

# Heroes whose client name collides with another hero.
VARIANT = {
    10006: ("Nora", None, "Awakened Nora, unlocked through the Nora Awakening Project (the antidote questline). The pre-antidote crossbow Nora (#10011) from the early story is not listed."),
    30003: ("Aria", "SSR", "SSR Aria (#30003)."),
    31003: ("Aria", "UR", "UR-quality Aria (#31003). The client has no separate name or skill text for her and reuses SSR Aria's skills, skill weights and level curve, so this card shows #30003's text."),
}
TEXT_ALIAS = {31003: 30003}  # hero whose text is borrowed
EXCLUDE = {10011}  # pre-antidote Nora, superseded by Awakened Nora (#10006)
WEAPON_ART = {30006, 50006, 50011}

# Heroes whose text and skill sprites are in the client but who are not in the playable table.
UNRELEASED = [10009, 10010, 20008, 40004, 40011, 40012]


def clean(text):
    """Strip Unity rich text, keep [Keyword] markers."""
    text = re.sub(r"<link=[^>]*>|</link>|<u>|</u>|<color=[^>]*>|</color>", "", text or "")
    return re.sub(r"\s*\n\s*", " ", text).strip()


def fmt_cd(ms):
    return f"{ms / 1000:.2f}s" if ms else None


def main():
    heroes = json.loads((ROOT / "data/heroes.json").read_text())
    lang = {row["id"]: row["en"] for row in json.loads((ROOT / "data/lang_hero_en.json").read_text())["datas"]}
    insights = json.loads((ROOT / "data/hero_insights.json").read_text())
    skills_by_group = {}
    for row in heroes["skills"]:
        skills_by_group.setdefault(row["group_id"], []).append(row)
    gear_by_hero = {g["hero_id"]: g for g in heroes["exclusive_gear"]}
    gear_curve = heroes["exclusive_gear_level_curve"]
    skill_icons = ROOT / "assets/heroes/skills"
    heads = ROOT / "assets/heroes/heads"
    playable = [h for h in heroes["playable_heroes"] if h["id"] not in EXCLUDE]
    rules = {k: v["en"] for k, v in json.loads((ROOT / "data/lang_rules_en.json").read_text())["strings"].items()}

    def ins_for(hid):
        return insights["heroes"].get(str(hid), {})

    def keywords(text_id):
        found = []
        for key in sorted(lang):
            if key.startswith(text_id + "_link"):
                body = clean(lang[key])
                m = re.match(r"\[([^\]]+)\]:?\s*(.*)", body)
                if m:
                    found.append({"name": m.group(1), "text": m.group(2)})
        return found

    # Stat ranks inside the same quality+role, and across all heroes.
    def rank(hero, stat, pool):
        ordered = sorted(pool, key=lambda h: -h["base_stats"][stat])
        return {"rank": [h["id"] for h in ordered].index(hero["id"]) + 1, "of": len(ordered)}

    out = []
    for hero in playable:
        hid = hero["id"]
        tid = TEXT_ALIAS.get(hid, hid)
        name = lang.get(f"hero_{tid}") or hero["name"]
        variant = VARIANT.get(hid)
        peers = [h for h in playable if h["quality"] == hero["quality"] and h["army_type"] == hero["army_type"]]
        sprite = SPRITE_NAME[hid]

        skills = []
        for slot, group in enumerate(hero["skill_group_ids"], 1):
            rows = sorted(skills_by_group.get(group, []), key=lambda r: r["star"])
            if not rows:
                continue
            first = rows[0]
            stype = first["type"]
            text_slot = slot if stype != 4 else None
            sname = lang.get(f"heroSkillName_{tid}_{text_slot}") if text_slot else None
            sdesc = lang.get(f"heroSkillDes_{tid}_{text_slot}") if text_slot else None
            icon = skill_icons / f"{hid}_{slot}.webp"
            unlock = f"Hero Lv. {first['required_hero_level']}"
            if first["required_hero_star"]:
                unlock += f" · {first['required_hero_star']}★"
            skills.append({
                "slot": slot,
                "group_id": group,
                "type": stype,
                "type_name": lang[SKILL_TYPE_KEY[stype]],
                "name": sname or ("Specialty" if stype == 4 else "Unnamed skill"),
                "name_in_client": bool(sname),
                "description": clean(sdesc) if sdesc else (
                    "Specialty slot. The client has no name or description for it; it unlocks at Hero Lv. 31 and 4★ and its weight does not grow with stars."
                    if stype == 4 else "The client has no name for this skill."),
                "description_in_client": bool(sdesc),
                "keywords": keywords(f"heroSkillDes_{tid}_{text_slot}") if text_slot else [],
                "cooldown_ms": first["cooldown"],
                "cooldown": fmt_cd(first["cooldown"]) or "Passive",
                "unlock": unlock,
                "unlock_level": first["required_hero_level"],
                "unlock_star": first["required_hero_star"],
                "icon": f"../assets/heroes/skills/{hid}_{slot}.webp" if icon.exists() else None,
                "icon_sprite": f"Hero_{sprite}_skill_0{slot}" if icon.exists() else None,
                "weights": [{"star": r["star"], "weight": r["ability"], "max_skill_level": r["skill_max_level"]}
                            for r in rows if not r["required_exclusive_gear_level"]],
                "gear_upgrades": [{"weapon_level": r["required_exclusive_gear_level"], "gear_weight": r["exclusive_gear_ability"]}
                                  for r in rows if r["required_exclusive_gear_level"]],
            })

        gear = gear_by_hero.get(hid)
        gear_out = None
        if gear:
            def last_value(kind, stat):
                vals = [b["value"] for r in gear["strengthen_levels"] for b in r[kind] if b["name"] == stat]
                return max(vals) if vals else 0
            top = gear_curve[-1]
            gskills = []
            for key, icon_key in (("1", "1"), ("2", "2"), ("4", "4")):
                gskills.append({
                    "name": clean(lang.get(f"exclusiveSkillName_{hid}_{key}")),
                    "description": clean(lang.get(f"exclusiveSkillDes_{hid}_{key}")),
                    "icon": f"../assets/heroes/skills/{hid}_gear_{icon_key}.webp",
                })
            talent = {1: 2, 2: 3, 3: 1}[hero["camp_type"]]  # Talent_1 Warrior, _2 Tactical, _3 Assault
            gskills.append({
                "name": clean(lang.get(f"exclusiveSkillName_Talent_{talent}")),
                "description": clean(lang.get(f"exclusiveSkillDes_Talent_{talent}")),
                "icon": f"../assets/heroes/skills/{hid}_gear_talent.webp",
            })
            gear_out = {
                "gear_id": gear["gear_id"],
                "weapon_icon": f"../assets/heroes/ui/weapon_{hid}.webp",
                "hero_art": f"../assets/heroes/super_{hid}.webp" if hid in WEAPON_ART else None,
                "season_day": int(gear["open_conditions"][0]["param3"]) if gear["open_conditions"] else None,
                "level_cap": len(gear_curve),
                "shards_per_level_curve": sum(r["fragment_count"] for r in gear_curve),
                "strengthen_levels": max(r["level"] for r in gear["strengthen_levels"]),
                "strengthen_shards": sum(r["fragment_count"] for r in gear["strengthen_levels"]),
                "max_level_bonus": {b["name"]: b["value"] for b in top["benefits"]},
                "skill_caps_at_max": top["skill_max_levels"],
                "max_strengthen_personal": {s: last_value("personal_benefits", s) for s in ("Hero HP", "Hero ATK", "Hero DEF")},
                "max_strengthen_all_heroes": {s: last_value("all_hero_benefits", s) for s in ("Hero HP", "Hero ATK", "Hero DEF")},
                "keywords": [{"name": m.group(1), "text": m.group(2)} for k in sorted(lang)
                             if k.startswith(f"exclusiveSkillDes_{hid}_link")
                             for m in [re.match(r"\[([^\]]+)\]:?\s*(.*)", clean(lang[k]))] if m],
                "skills": gskills,
            }

        ins = ins_for(hid)
        out.append({
            "id": hid,
            "name": name,
            "display_name": f"{name} ({variant[1]})" if variant and variant[1] else name,
            "variant_note": variant[2] if variant else None,
            "text_source_id": tid,
            "quality": hero["quality"],
            "quality_name": QUALITY[hero["quality"]],
            "army_type": hero["army_type"],
            "army_name": lang[ROLE_KEY[hero["army_type"]]],
            "role_short": ROLE_SHORT[hero["army_type"]],
            "role_description": lang.get(ROLE_KEY[hero["army_type"]] + "_Des"),
            "role_icon": f"../assets/heroes/ui/role_{hero['army_type']}.webp",
            "camp_type": hero["camp_type"],
            "camp_name": CAMP[hero["camp_type"]],
            "faction_icon": f"../assets/heroes/ui/faction_{hero['camp_type']}.webp",
            "training_center": hero["training_center"],
            "base_stats": hero["base_stats"],
            "stat_ranks": {
                "peer_scope": f"{QUALITY[hero['quality']]} {ROLE_SHORT[hero['army_type']]}",
                "peers": {s: rank(hero, s, peers) for s in ("hp", "attack", "defense")},
                "all": {s: rank(hero, s, playable) for s in ("hp", "attack", "defense")},
            },
            "level_curve_id": hero["level_curve_id"],
            "level_benefits": hero["level_benefits"],
            "max_level": hero["max_level"],
            "image": f"../assets/heroes/cards/{hid}.webp",
            "rarity_logo": f"../assets/heroes/ui/rarity_{hero['quality']}.webp",
            "camp_shield": f"../assets/heroes/ui/camp_{hero['camp_type']}.webp",
            "faction_ring": f"../assets/heroes/ui/faction_ring_{hero['camp_type']}.webp",
            "role_ring": f"../assets/heroes/ui/role_ring_{hero['army_type']}.webp",
            "position": ins_for(hid).get("position"),
            "counters": CAMP[COUNTERS[hero["camp_type"]]],
            "countered_by": CAMP[next(c for c, t in COUNTERS.items() if t == hero["camp_type"])],
            "head": f"../assets/heroes/heads/{hid}.webp" if (heads / f"{hid}.webp").exists() else None,
            "head_sprite": f"Icon_Hero_{HEAD_SPRITE[hid]}",
            "sprite_match": "artwork" if hid in ARTWORK_MATCH else "name",
            "story": clean(lang.get(f"hero_story_{tid}")) or None,
            "skills": skills,
            "exclusive_gear": gear_out,
            "insight": ins,
        })

    def by(hid):
        return next(h for h in out if h["id"] == hid)

    c1, c2 = heroes["level_curves"]["1"], heroes["level_curves"]["2"]

    def curve_val(row, name):
        return next(b["value"] for b in row["benefits"] if b["name"] == name)

    # Glossary: [Keyword] definitions from *_link text, plus core terms from the game's stat and damage-type help.
    glossary = {}
    for key in sorted(lang):
        if "_link" in key:
            m = re.match(r"\[([^\]]+)\]:?\s*(.*)", clean(lang[key]))
            if m:
                glossary[m.group(1)] = {"text": m.group(2), "source": key, "kind": "keyword"}
    for talent in (1, 2, 3):
        glossary[clean(lang[f"exclusiveSkillName_Talent_{talent}"]).replace("[Faction Boost] ", "")] = {
            "text": clean(lang[f"exclusiveSkillDes_Talent_{talent}"]), "source": f"exclusiveSkillName_Talent_{talent}", "kind": "keyword"}
    glossary["Faction Boost"] = {"text": "Exclusive-weapon talent that raises HP, ATK and DEF of all allied heroes of the weapon's faction.", "source": "exclusiveSkillDes_Talent_1..3", "kind": "keyword"}
    terms = [
        ("Radiation DMG", ["Radiation DMG", "Radiation damage"], lang["hero_skillEffectType_Des_3"] + " " + lang["hero_skillEffectType_Des_4"], "hero_skillEffectType_Des_3/4"),
        ("Physical DMG", ["Physical DMG", "Physical damage"], lang["hero_skillEffectType_Des_1"] + " " + lang["hero_skillEffectType_Des_2"], "hero_skillEffectType_Des_1/2"),
        ("DEF", ["DEF"], lang["hero_Attr_Def_Des"], "hero_Attr_Def_Des"),
        ("ATK", ["ATK"], lang["hero_Attr_Atk_Des"], "hero_Attr_Atk_Des"),
        ("Front row", ["front-row", "front row", "front enemies"], clean(rules["city_popup_messages_text_18"]) + " A squad has 2 front-row slots.", "city_popup_messages_text_18"),
        ("Back row", ["back-row", "back row", "back enemies"], "The 3 rear slots of a squad, where Backline heroes deal damage from safety.", "squad layout"),
        ("Monsters", ["monsters", "Monsters"], "Zombies and other PvE enemies (wild, rally and event monsters). Skills that mention monsters do nothing against players.", "skill wording"),
    ]
    for name, match, text, source in terms:
        glossary[name] = {"text": clean(text), "source": source, "kind": "term", "match": match}

    unreleased = []
    for uid in UNRELEASED:
        uskills = []
        for slot in (1, 2, 3):
            n, d = lang.get(f"heroSkillName_{uid}_{slot}"), lang.get(f"heroSkillDes_{uid}_{slot}")
            icon = skill_icons / f"{uid}_{slot}.webp"
            if n or d or icon.exists():
                uskills.append({"slot": slot, "name": clean(n) if n else None, "description": clean(d) if d else None,
                                "icon": f"../assets/heroes/skills/{uid}_{slot}.webp" if icon.exists() else None})
        unreleased.append({"id": uid, "name": clean(lang.get(f"hero_{uid}")), "story": clean(lang.get(f"hero_story_{uid}"))[:400] or None, "skills": uskills})

    meta = {
        "sources": {
            "tables": "client 1.30.07 (catalog V202608062022): HeroInfo, HeroLevel, HeroStar, NewHeroSkill, NewHeroSkillLevel, HeroExclusive*",
            "text": f"lang_hero_en.json from client catalog {LANG_CATALOG}",
            "sprites": f"UI_HeroSkill, UI_HeroIcon and UI_Hero sprite atlases from client catalog {LANG_CATALOG}",
        },
        "level_curves": {
            cid: [{"level": r["level"], "hp": round(curve_val(r, "Hero HP")), "attack": round(curve_val(r, "Hero ATK")),
                   "defense": round(curve_val(r, "Hero DEF")), "command": curve_val(r, "Command")}
                  for r in curve if r["level"] in (1, 10, 20, 30, 40, 50, 65, 80, 100, 120, 150, 175)]
            for cid, curve in (("1", c1), ("2", c2))
        },
        "star_steps": [{"step": r["step"], "star": r["whole_star"], "shards": r["fragment_count"],
                        "hp": r["benefits"][0]["value"], "attack": r["benefits"][1]["value"], "defense": r["benefits"][2]["value"],
                        "skill_cap": r["skill_slots"][0]["level_limit"]} for r in heroes["star_curve"]],
        "skill_books": {q: [sum(c["count"] for r in v[:n] for c in r["costs"]) for n in (5, 10, 20, 30, len(v))]
                        for q, v in heroes["skill_level_curves"].items()},
        "global_insights": insights["global"],
        "squad": {
            "size": 5, "front_slots": 2, "back_slots": 3,
            "lineup_bonus": [{"condition": clean(rules[f"lineup_benefit_condition_{i}"]), "effect": clean(rules[f"lineup_benefit_des_{i}"]),
                              "percent": p, "pattern": pat}
                             for i, p, pat in ((1, 5, [3]), (2, 10, [3, 2]), (3, 15, [4]), (4, 20, [5]))],
            "counters": [{"faction": CAMP[a], "beats": CAMP[b], "faction_id": a, "beats_id": b} for a, b in COUNTERS.items()],
            "counter_reduction_percent": 20,
            "rules_text": {k: clean(rules[k]) for k in ("faction_counter_guide", "faction_counter_effect_description",
                           "faq_report_contrast_hero_num", "faq_report_contrast_position", "city_popup_messages_text_18",
                           "loading_tips_09", "same_faction_count_bonus_guide", "Equipment_Attribute_Description_4")},
            "row_evidence": "Skill texts target 'the 2 front enemies' and 'the 3 back enemies' (Bekka, Celeste, Yana), so a squad is 2 front + 3 back.",
        },
        "glossary": glossary,
        "unreleased": unreleased,
        "faction_icons": {CAMP[c]: {"shield": f"../assets/heroes/ui/camp_{c}.webp", "ring": f"../assets/heroes/ui/faction_ring_{c}.webp",
                                    "badge": f"../assets/heroes/ui/badge_{c}.webp"} for c in CAMP},
        "role_icons": {ROLE_SHORT[r]: {"tile": f"../assets/heroes/ui/role_{r}.webp", "ring": f"../assets/heroes/ui/role_ring_{r}.webp",
                                       "label": lang[ROLE_KEY[r]], "description": lang.get(ROLE_KEY[r] + "_Des")} for r in ROLE_SHORT},
        "about": insights["_about"],
    }
    assert len(out) == 31 and by(50004)["stat_ranks"]["all"]["hp"]["rank"] == 1

    (ROOT / "data/heroes_directory.json").write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n")
    (ROOT / "data/heroes_meta.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False) + "\n")
    (ROOT / "heroes/heroes_data.js").write_text(
        "const HEROES_DATA = " + json.dumps(out, indent=2, ensure_ascii=False) + ";\n"
        "const HEROES_META = " + json.dumps(meta, indent=2, ensure_ascii=False) + ";\n")
    print(f"{len(out)} heroes, {sum(1 for h in out for s in h['skills'] if s['icon'])} skill icons")


if __name__ == "__main__":
    main()
