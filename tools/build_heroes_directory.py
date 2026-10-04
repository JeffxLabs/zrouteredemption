#!/usr/bin/env python3
"""Build data/heroes_directory.json and heroes/heroes_data.js.

Inputs (all in this repository):
  data/heroes.json          client tables HeroInfo/HeroLevel/HeroStar/NewHeroSkill/... (1.30.07)
  data/hero_skills.json     skill values, icons and squad rules (tools/extract_hero_skills.py)
  data/lang_hero_en.json    English hero text from the live client catalog
  data/hero_insights.json   curated analysis (tags, tips, global insights)
  assets/heroes/{skills,heads,ui}/  sprites exported from the client's UI_HeroSkill / UI_HeroIcon / UI_Hero atlases

Standard library only.  Usage: python3 tools/build_heroes_directory.py
"""
import json
import re
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LANG_CATALOG = "V202610032200"

QUALITY = {3: "SR", 4: "SSR", 5: "UR"}
ROLE_KEY = {1: "hero_TYPE_02", 2: "hero_TYPE_03", 3: "hero_TYPE_04"}  # army_type -> client label key
ROLE_SHORT = {1: "Frontline", 2: "Support", 3: "Backline"}
CAMP = {1: "Tactical", 2: "Assault", 3: "Warrior"}  # confirmed by levelBenefit names and faction emblems
COUNTERS = {3: 2, 2: 1, 1: 3}  # Warrior > Assault > Tactical > Warrior (lang_hmi faction_counter_guide)
SKILL_TYPE_KEY = {1: "hero_skillType_1", 2: "hero_skillType_2", 3: "hero_skillType_3", 4: "hero_skillType_4"}


# Heroes whose client name collides with another hero.
VARIANT = {
    10006: ("Nora", None, "Awakened Nora, unlocked through the Nora Awakening Project (the antidote questline). In the client she replaces the early-story crossbow Nora (#10011), who is not listed."),
    30003: ("Aria", "SSR", "SSR Aria. In Season 1 she is upgraded to UR Aria (#31003), who replaces her."),
    31003: ("Aria", "UR", "UR Aria, the Season 1 upgrade of SSR Aria (#30003), with stronger versions of her skills."),
}
TEXT_ALIAS = {31003: 30003}  # story text is borrowed from SSR Aria
EXCLUDE = {10011}  # pre-antidote Nora, superseded by Awakened Nora (#10006)
WEAPON_ART = {30006, 50006, 50011}

# Heroes whose text and skill sprites are in the client but who are not in the playable table.
UNRELEASED = [10009, 10010, 20008, 40004, 40011, 40012]
LANGUAGES = ("fr", "ru", "tr", "pl", "es", "pt", "de", "ko", "zh")


def clean(text):
    """Strip Unity rich text, keep [Keyword] markers."""
    def keyword_link(match):
        label = match.group(1).strip()
        wrapped = re.fullmatch(r"\[([^\]]+)\]|【([^】]+)】", label)
        if wrapped:
            label = wrapped.group(1) or wrapped.group(2)
        return f"[{label}]"
    text = re.sub(r"<link=[^>]*><u>(.*?)</u></link>", keyword_link, text or "", flags=re.S)
    text = re.sub(r"<link=[^>]*>|</link>|<u>|</u>|<color=[^>]*>|</color>", "", text or "")
    return re.sub(r"\s*\n\s*", " ", text).strip()


def link_definition(text):
    body = clean(text)
    match = re.match(r"^\s*(?:\[([^\]]+)\]|【([^】]+)】|([^:：]+?))\s*[:：]\s*(.*)$", body)
    if not match:
        return None
    return (match.group(1) or match.group(2) or match.group(3) or "").strip(), match.group(4).strip()


def fmt_cd(ms):
    return f"{ms / 1000:.2f}s" if ms else None


def fill(template, args, unknown=False):
    args = list(args or [])
    def repl(match):
        index = int(match.group(1))
        if index < len(args):
            value = args[index]
            if isinstance(value, float) and value.is_integer():
                return str(int(value))
            return str(value)
        return "?" if unknown else match.group(0)
    return re.sub(r"\{(\d+)\}", repl, template or "")


def upgrade_args(text, english):
    """Recover the extracted numeric arguments for a generic client upgrade template."""
    normalize = lambda value: re.sub(r"\(s\)", "s", clean(value))
    text = normalize(text)
    for key, source in english.items():
        if not key.startswith("heroSkillDes_upgrade_") or not source:
            continue
        pieces = re.split(r"(\{\d+\})", normalize(source))
        pattern = "^" + "".join("(.+?)" if re.fullmatch(r"\{\d+\}", piece) else
                                (re.escape(piece) if piece else "") for piece in pieces) + "$"
        match = re.match(pattern, text, flags=re.IGNORECASE)
        if match:
            return key, list(match.groups())
    return None, []


def main():
    heroes = json.loads((ROOT / "data/heroes.json").read_text())
    lang = {row["id"]: row["en"] for row in json.loads((ROOT / "data/lang_hero_en.json").read_text())["datas"]}
    insights = json.loads((ROOT / "data/hero_insights.json").read_text())
    client = json.loads((ROOT / "data/hero_skills.json").read_text())["heroes"]
    skills_by_group = {}
    for row in heroes["skills"]:
        skills_by_group.setdefault(row["group_id"], []).append(row)
    gear_by_hero = {g["hero_id"]: g for g in heroes["exclusive_gear"]}
    gear_curve = heroes["exclusive_gear_level_curve"]
    skill_icons = ROOT / "assets/heroes/skills"
    heads = ROOT / "assets/heroes/heads"
    playable = [h for h in heroes["playable_heroes"] if h["id"] not in EXCLUDE]
    rules = {k: v["en"] for k, v in json.loads((ROOT / "data/lang_rules_en.json").read_text())["strings"].items()}
    building_en = {row["id"]: row.get("en") for row in json.loads((ROOT / ".i18n-src/lang_building_en.json").read_text())["datas"]}
    building_key = {value: key for key, value in building_en.items() if value}

    def ins_for(hid):
        return insights["heroes"].get(str(hid), {})

    def keywords(text_id):
        found = []
        for key in sorted(lang):
            if key.startswith(text_id + "_link"):
                parsed = link_definition(lang[key])
                if parsed:
                    found.append({"name": parsed[0], "text": parsed[1]})
        return found

    # Stat ranks inside the same quality+role, and across all heroes.
    def rank(hero, stat, pool):
        ordered = sorted(pool, key=lambda h: -h["base_stats"][stat])
        return {"rank": [h["id"] for h in ordered].index(hero["id"]) + 1, "of": len(ordered)}

    out = []
    for hero in playable:
        hid = hero["id"]
        tid = TEXT_ALIAS.get(hid, hid)
        name = client[str(hid)]["name"] or lang.get(f"hero_{tid}") or hero["name"]
        variant = VARIANT.get(hid)
        peers = [h for h in playable if h["quality"] == hero["quality"] and h["army_type"] == hero["army_type"]]

        cs = {x["slot"]: x for x in client[str(hid)]["skills"]}
        skills = []
        for slot, group in enumerate(hero["skill_group_ids"], 1):
            rows = sorted(skills_by_group.get(group, []), key=lambda r: r["star"])
            if not rows:
                continue
            first = rows[0]
            stype = first["type"]
            c = cs.get(slot, {})
            icon = skill_icons / f"{hid}_{slot}.webp"
            unlock = f"Hero Lv. {first['required_hero_level']}"
            if first["required_hero_star"]:
                unlock += f" · {first['required_hero_star']}★"
            entry = {
                "slot": slot,
                "group_id": group,
                "type": stype,
                "type_name": lang[SKILL_TYPE_KEY[stype]],
                "name": clean(c.get("name")) or ("Specialty" if stype == 4 else "Unnamed skill"),
                "name_in_client": bool(c.get("name")),
                "effect_type": c.get("effect_type"),
                "effect_type_source": c.get("effect_type"),
                "is_pve_only": bool(re.search(r"monster", (c.get("by_star") or [{}])[-1].get("text", c.get("text", "")), re.I)),
                "cooldown_s": c.get("cooldown_s") or (first["cooldown"] or 0) / 1000,
                "cooldown_ms": first["cooldown"],
                "cooldown": f"{c['cooldown_s']:g}s" if c.get("cooldown_s") else "Passive",
                "unlock": unlock,
                "unlock_level": first["required_hero_level"],
                "unlock_star": first["required_hero_star"],
                "icon": f"../assets/heroes/skills/{hid}_{slot}.webp" if icon.exists() else None,
                "icon_sprite": c.get("icon_sprite"),
                "gear_upgrades": [{"weapon_level": r["required_exclusive_gear_level"]} for r in rows if r["required_exclusive_gear_level"]],
            }
            if stype == 4:
                entry["description"] = clean(c.get("text")) or "No description in the client."
                entry["description_in_client"] = bool(c.get("text"))
            else:
                entry["description"] = clean(c["by_star"][5]["text"]) if c.get("by_star") else clean(lang.get(f"heroSkillDes_{tid}_{slot}"))
                entry["description_in_client"] = bool(c.get("template"))
                entry["template"] = clean(c.get("template"))
                entry["by_star"] = [{"star": b["star"], "skill_level": b["skill_level"], "args": b["args"], "text": clean(b["text"])} for b in c.get("by_star", [])]
                entry["star_upgrades"] = []
                for upgrade in c.get("star_upgrades", []):
                    key, args = upgrade_args(upgrade["text"], lang)
                    template = clean(lang.get(key) or upgrade["text"]) if key else clean(upgrade["text"])
                    entry["star_upgrades"].append({"star": upgrade["star"], "template": template,
                                                    "args": args, "text": clean(fill(template, args))})
                entry["keywords"] = keywords(c.get("desc_key", ""))
                if c.get("value_note"):
                    entry["value_note"] = c["value_note"]
            skills.append(entry)

        gear = gear_by_hero.get(hid)
        gear_out = None
        if gear:
            def last_value(kind, stat):
                vals = [b["value"] for r in gear["strengthen_levels"] for b in r[kind] if b["name"] == stat]
                return max(vals) if vals else 0
            top = gear_curve[-1]
            gskills = []
            for g in client[str(hid)]["exclusive_gear_skills"]:
                if g["slot"] < 5:
                    continue
                icon_path = skill_icons / f"{hid}_gear_{g['slot']}.webp"
                gskills.append({"name": clean(g.get("name")), "description": clean(g.get("text") or g.get("template")),
                                "icon": f"../assets/heroes/skills/{hid}_gear_{g['slot']}.webp" if icon_path.exists() else None})
            upgraded = [{"slot": g["slot"], "name": clean(g.get("name")), "at_max": clean(g["by_star"][5]["text"]),
                         "icon": f"../assets/heroes/skills/{hid}_gear_{g['slot']}.webp"}
                        for g in client[str(hid)]["exclusive_gear_skills"] if g["slot"] < 5 and g.get("by_star")]
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
                "upgraded_skills": upgraded,
            }

        ins = ins_for(hid)
        dmg = next((x["effect_type"] for x in skills if x.get("effect_type") in ("Physical DMG", "Radiation DMG") and x["type"] == 2), None) \
            or next((x["effect_type"] for x in skills if x.get("effect_type") in ("Physical DMG", "Radiation DMG")), None)
        out.append({
            "id": hid,
            "damage_type": {"Physical DMG": "Physical", "Radiation DMG": "Radiation"}.get(dmg),
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
            "head_sprite": client[str(hid)]["head_sprite"],
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
        talent_name = re.sub(r"^\[[^\]]+\]\s*", "", clean(lang[f"exclusiveSkillName_Talent_{talent}"]))
        glossary[talent_name] = {
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
            "tables": "client 1.30.07 (catalog V202608062022): HeroInfo, HeroLevel, HeroStar, NewHeroSkill, HeroExclusive*; skill values, icons and squad rules from HeroSkillDes, HeroInfo, HeroCamp and HeroCampAttr of catalog V202610032200",
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
    english_lang = lang
    talent_factors = {}
    for hero_skills in client.values():
        for skill in hero_skills.get("exclusive_gear_skills", []):
            name_key = skill.get("name_key", "")
            if name_key.startswith("exclusiveSkillName_Talent_"):
                talent_factors[name_key.rsplit("_", 1)[-1]] = skill.get("factors") or []

    # Per-language Heroes payloads are requested only when selected. Numbers,
    # ids, icons, hashes and planner facts stay shared with the English source.
    note_file = ROOT / "data/hero_notes_i18n.json"
    own_text = json.loads(note_file.read_text()).get("strings", {}) if note_file.exists() else {}
    template_overrides = json.loads((ROOT / "data/hero_skill_template_i18n.json").read_text())
    hero_ui_strings = json.loads((ROOT / "data/ui_i18n/heroes.json").read_text()).get("strings", {})
    faction_key = {"Warrior": "hero_type_tips_01", "Assault": "hero_type_tips_02", "Tactical": "hero_type_tips_03"}
    locale_dir = ROOT / "heroes/heroes_i18n"
    locale_dir.mkdir(exist_ok=True)
    for code in LANGUAGES:
        suffix = "zh_tw" if code == "zh" else code
        tables = {}
        values = []
        for table in ("hero", "hmi", "tips", "base", "building", "benefit"):
            rows = json.loads((ROOT / f".i18n-src/lang_{table}_{suffix}.json").read_text())["datas"]
            table_map = {row["id"]: row.get(suffix) for row in rows}
            tables[table] = table_map
            values.extend(value or "" for value in table_map.values())
        if code == "zh":
            from simplified_chinese import simplify
            converted = iter(simplify(values))
            tables = {table: {key: next(converted) for key in table_map} for table, table_map in tables.items()}
        lang = tables["hero"]
        rules_lang = {}
        for key, spec in json.loads((ROOT / "data/lang_rules_en.json").read_text())["strings"].items():
            table = re.fullmatch(r"lang_(.+)_en\.json", spec["file"]).group(1)
            rules_lang[key] = tables.get(table, {}).get(key) or spec["en"]
        insights_file = ROOT / f"data/hero_insights_i18n/{code}.json"
        localized_insights = json.loads(insights_file.read_text()) if insights_file.exists() else insights
        def own(text):
            return own_text.get(text, {}).get(code, text)
        def faction_label(faction):
            return tables["hmi"].get(faction_key[faction]) or own(faction)
        def keywords_for(prefix):
            found = []
            for key in sorted(lang):
                if not key.startswith(prefix + "_link"):
                    continue
                parsed = link_definition(lang[key])
                if parsed:
                    found.append({"name": parsed[0], "text": parsed[1], "source": key})
            return found
        linked_labels = {}
        for source_text_value in lang.values():
            for link in re.finditer(r"<link=([^>]+)><u>(.*?)</u></link>", source_text_value or "", flags=re.S):
                label = clean(link.group(2)).strip()
                if label.startswith("[") and label.endswith("]"):
                    label = label[1:-1]
                linked_labels.setdefault(link.group(1), set()).add(label)
        def localized_template(key, fallback, args=None, unknown=False):
            template = template_overrides.get(key, {}).get(code) or lang.get(key) or fallback
            return clean(fill(template, args, unknown=unknown))
        def localized_upgrade(text, english_upgrades):
            key, args = upgrade_args(text, english_upgrades)
            if key and lang.get(key):
                template = clean(lang[key])
                return {"template": template, "args": args, "text": clean(fill(template, args))}
            fallback = own(text)
            return {"template": fallback, "args": [], "text": fallback}
        def source_text(key, fallback=""):
            return clean(lang.get(key) or fallback) if key else clean(fallback)
        def talent_name_parts(key, fallback=""):
            raw = lang.get(key) or fallback or ""
            match = re.search(r"<color=[^>]*>(.*?)</color>\s*(.*)$", raw)
            if match:
                label = clean(match.group(1))
                title = clean(match.group(2))
            else:
                text = clean(raw)
                match = re.match(r"^\[([^\]]+)\]\s*(.*)$", text)
                label, title = (match.group(1), match.group(2)) if match else ("", text)
            label = re.sub(r"^\[([^\]]+)\]$|^【([^】]+)】$", lambda item: item.group(1) or item.group(2), label).strip()
            return label, title
        def talent_display_name(key, fallback=""):
            label, title = talent_name_parts(key, fallback)
            return (f"[{label}] {title}" if label and title else title) or clean(fallback)
        def effect_text(effect):
            key = next((k for k, value in english_lang.items() if k.startswith("hero_skillEffectType_") and value == effect), None)
            return clean(lang.get(key) or effect) if key else effect

        loc_heroes = deepcopy(out)
        for h in loc_heroes:
            hid = h["id"]
            tid = h["text_source_id"]
            raw = client.get(str(hid), {})
            raw_skills = {s["slot"]: s for s in raw.get("skills", [])}
            raw_gear_skills = {s["slot"]: s for s in raw.get("exclusive_gear_skills", [])}
            hero_name = clean(lang.get(f"hero_{hid}") or lang.get(f"hero_{tid}") or h["name"])
            h["name"] = hero_name
            h["display_name"] = f"{hero_name} ({'SSR' if h['quality'] == 4 else 'UR'})" if hid in VARIANT and VARIANT[hid][1] else hero_name
            h["variant_note"] = own(h["variant_note"]) if h.get("variant_note") else None
            h["army_name"] = source_text(ROLE_KEY[h["army_type"]], h["army_name"])
            h["camp_label"] = faction_label(h["camp_name"])
            role_translation = hero_ui_strings.get(h["role_short"], {}).get(code, h["role_short"])
            h["stat_ranks"]["peer_scope"] = f"{h['quality_name']} {role_translation}"
            for benefit in h.get("level_benefits", []):
                benefit["name"] = tables["benefit"].get(f"benefit_{benefit['type']}") or benefit["name"]
            h["role_description"] = source_text(ROLE_KEY[h["army_type"]] + "_Des", h.get("role_description") or "")
            h["story"] = source_text(f"hero_story_{tid}") or None
            building_name = h["training_center"].get("building_name")
            key = building_key.get(building_name)
            h["training_center"]["building_name"] = tables.get("building", {}).get(key) or building_name
            h["insight"] = deepcopy(localized_insights.get("heroes", {}).get(str(hid), h["insight"]))
            for skill in h["skills"]:
                raw_skill = raw_skills.get(skill["slot"], {})
                skill["name"] = source_text(raw_skill.get("name_key"), skill["name"])
                skill["type_name"] = source_text(SKILL_TYPE_KEY[skill["type"]], skill["type_name"])
                skill["effect_type"] = effect_text(skill.get("effect_type")) if skill.get("effect_type") else None
                template = clean(template_overrides.get(raw_skill.get("desc_key"), {}).get(code) or
                                  lang.get(raw_skill.get("desc_key")) or raw_skill.get("template") or skill.get("template") or "")
                if skill["type"] == 4:
                    skill["description"] = localized_template(raw_skill.get("desc_key"), raw_skill.get("template") or skill.get("description"), raw_skill.get("factors"), unknown=True)
                else:
                    skill["template"] = template
                    for entry in skill.get("by_star", []):
                        entry["text"] = localized_template(raw_skill.get("desc_key"), template, entry.get("args"))
                    max_star = next((entry for entry in skill.get("by_star", []) if entry["star"] == 5), None)
                    skill["description"] = max_star["text"] if max_star else localized_template(raw_skill.get("desc_key"), template, unknown=True)
                    skill["star_upgrades"] = [{"star": upgrade["star"], **localized_upgrade(upgrade["text"], english_lang)}
                                               for upgrade in skill.get("star_upgrades", [])]
                    skill["keywords"] = [{"name": item["name"], "text": item["text"]}
                                         for item in keywords_for(raw_skill.get("desc_key", ""))]
                if skill.get("value_note"):
                    skill["value_note"] = own(skill["value_note"])
            gear = h.get("exclusive_gear")
            if gear:
                for item in gear.get("skills", []):
                    raw_skill = raw_gear_skills.get(next((x["slot"] for x in raw.get("exclusive_gear_skills", [])
                                                         if clean(x.get("name")) == item.get("name") and x.get("slot", 0) >= 5), -1), {})
                    if raw_skill:
                        name_key = raw_skill.get("name_key")
                        item["name"] = talent_display_name(name_key, item["name"]) if name_key and name_key.startswith("exclusiveSkillName_Talent_") else source_text(name_key, item["name"])
                        args = (raw_skill.get("by_star") or [{}])[-1].get("args") or raw_skill.get("factors") or []
                        item["description"] = localized_template(raw_skill.get("desc_key"), raw_skill.get("template") or item["description"], args, unknown=True)
                for item in gear.get("upgraded_skills", []):
                    raw_skill = raw_gear_skills.get(item["slot"], {})
                    if raw_skill:
                        item["name"] = source_text(raw_skill.get("name_key"), item["name"])
                        args = next((entry.get("args") for entry in raw_skill.get("by_star", []) if entry.get("star") == 5), [])
                        item["at_max"] = localized_template(raw_skill.get("desc_key"), raw_skill.get("template") or item["at_max"], args, unknown=True)
                gear["keywords"] = [{"name": item["name"], "text": item["text"]}
                                    for item in keywords_for(f"exclusiveSkillDes_{hid}")]

        loc_meta = deepcopy(meta)
        loc_meta["global_insights"] = deepcopy(localized_insights.get("global", meta["global_insights"]))
        loc_meta["about"] = localized_insights.get("_about", meta["about"])
        loc_meta["role_icons"] = deepcopy(meta["role_icons"])
        for role, icon in loc_meta["role_icons"].items():
            role_id = next((number for number, label in ROLE_SHORT.items() if label == role), None)
            if role_id:
                icon["label"] = source_text(ROLE_KEY[role_id], icon["label"])
                icon["description"] = source_text(ROLE_KEY[role_id] + "_Des", icon.get("description") or "")
        loc_meta["unreleased"] = deepcopy(meta["unreleased"])
        for unreleased in loc_meta["unreleased"]:
            uid = unreleased["id"]
            unreleased["name"] = source_text(f"hero_{uid}", unreleased.get("name") or "")
            unreleased["story"] = source_text(f"hero_story_{uid}", unreleased.get("story") or "")[:400] or None
            for skill in unreleased["skills"]:
                skill["name"] = source_text(f"heroSkillName_{uid}_{skill['slot']}", skill.get("name") or "") or None
                skill["description"] = localized_template(f"heroSkillDes_{uid}_{skill['slot']}", skill.get("description") or "", unknown=True) or None

        for key, entry in loc_meta["glossary"].items():
            source = entry.get("source", "")
            entry["id"] = key
            if entry.get("kind") == "keyword":
                if "_link" in source:
                    item = next((x for x in keywords_for(source.split("_link")[0]) if x["source"] == source), None)
                    if item:
                        entry["name"], entry["text"] = item["name"], item["text"]
                        entry["match"] = sorted({item["name"], *linked_labels.get(source, set())})
                elif source.startswith("exclusiveSkillName_Talent_"):
                    talent = source.rsplit("_", 1)[-1]
                    _, entry["name"] = talent_name_parts(source, key)
                    entry["text"] = localized_template(f"exclusiveSkillDes_Talent_{talent}", entry.get("text", ""), talent_factors.get(talent), unknown=True)
            else:
                if source == "hero_skillEffectType_Des_3/4":
                    entry["text"] = source_text("hero_skillEffectType_Des_3") + " " + source_text("hero_skillEffectType_Des_4")
                elif source == "hero_skillEffectType_Des_1/2":
                    entry["text"] = source_text("hero_skillEffectType_Des_1") + " " + source_text("hero_skillEffectType_Des_2")
                elif source in rules_lang:
                    entry["text"] = clean(rules_lang[source])
                elif source in lang:
                    entry["text"] = source_text(source, entry.get("text", ""))
                else:
                    entry["text"] = own(entry.get("text", ""))
                entry["name"] = own(key)
                entry["match"] = [own(term) for term in entry.get("match", [])]
        boost_text = own("Exclusive-weapon talent that raises HP, ATK and DEF of all allied heroes of the weapon's faction.")
        boost_label, _ = talent_name_parts("exclusiveSkillName_Talent_1", own("Faction Boost"))
        if "Faction Boost" in loc_meta["glossary"]:
            loc_meta["glossary"]["Faction Boost"]["text"] = boost_text
            loc_meta["glossary"]["Faction Boost"]["name"] = boost_label or own("Faction Boost")
            loc_meta["glossary"]["Faction Boost"]["match"] = [boost_label or own("Faction Boost")]
        loc_meta["faction_labels"] = {
            "Warrior": faction_label("Warrior"),
            "Assault": faction_label("Assault"),
            "Tactical": faction_label("Tactical"),
        }
        loc_meta["squad"]["lineup_bonus"] = deepcopy(meta["squad"]["lineup_bonus"])
        for i, item in enumerate(loc_meta["squad"]["lineup_bonus"], 1):
            item["condition"] = clean(rules_lang.get(f"lineup_benefit_condition_{i}") or item["condition"])
            item["effect"] = clean(rules_lang.get(f"lineup_benefit_des_{i}") or item["effect"])
        loc_meta["squad"]["rules_text"] = {key: clean(rules_lang.get(key) or value) for key, value in meta["squad"]["rules_text"].items()}
        faction_template = own("Hero faction. {0} beats {1}: {0} heroes take 20% less damage from {1} heroes. {2} beats {0}.")
        for faction in CAMP.values():
            beats_faction = CAMP[COUNTERS[next(k for k, v in CAMP.items() if v == faction)]]
            weak = next(CAMP[k] for k, v in COUNTERS.items() if CAMP[v] == faction)
            labels = loc_meta["faction_labels"]
            faction_label, beats_label, weak_label = (labels.get(name, name) for name in (faction, beats_faction, weak))
            loc_meta["glossary"][faction] = {"id": faction, "name": faction_label, "text": fill(faction_template, [faction_label, beats_label, weak_label]),
                                               "source": "faction_counter_guide", "kind": "term", "match": [faction_label]}
        loc_meta["glossary"]["Front row"]["text"] = clean(rules_lang.get("city_popup_messages_text_18") or meta["squad"]["rules_text"]["city_popup_messages_text_18"]) + " " + own("A squad has 2 front-row slots.")
        loc_meta["glossary"]["Back row"]["text"] = own("The 3 rear slots of a squad, where Backline heroes deal damage from safety.")
        loc_meta["glossary"]["Monsters"]["text"] = own("Zombies and other PvE enemies (wild, rally and event monsters). Skills that mention monsters do nothing against players.")
        loc_meta["glossary"]["Faction Boost"]["name"] = own("Faction Boost")
        (locale_dir / f"{code}.js").write_text(
            "window.HEROES_LOCALES = window.HEROES_LOCALES || {}; window.HEROES_LOCALES[" + json.dumps(code) + "] = {heroes:" +
            json.dumps(loc_heroes, ensure_ascii=False, separators=(",", ":")) + ",meta:" +
            json.dumps(loc_meta, ensure_ascii=False, separators=(",", ":")) + "};\n"
        )

    (ROOT / "data/heroes_directory.json").write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n")
    (ROOT / "data/heroes_meta.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False) + "\n")
    (ROOT / "heroes/heroes_data.js").write_text(
        "const HEROES_DATA = " + json.dumps(out, indent=2, ensure_ascii=False) + ";\n"
        "const HEROES_META = " + json.dumps(meta, indent=2, ensure_ascii=False) + ";\n")
    print(f"{len(out)} heroes, {sum(1 for h in out for s in h['skills'] if s['icon'])} skill icons")


if __name__ == "__main__":
    main()
