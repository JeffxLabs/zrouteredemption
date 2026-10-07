#!/usr/bin/env python3
"""Assemble small per-page UI dictionaries as local JavaScript data files."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LANGUAGES = ("fr", "ru", "tr", "pl", "es", "pt", "de", "ko", "zh")
PAGES = ("home", "heroes", "hero-exp", "research")


def main():
    for page in PAGES:
        source = ROOT / "data/ui_i18n" / f"{page}.json"
        data = json.loads(source.read_text()) if source.exists() else {"strings": {}}
        dictionaries = {code: {} for code in LANGUAGES}
        missing = []
        for english, translations in data.get("strings", {}).items():
            for code in LANGUAGES:
                value = translations.get(code, english)
                dictionaries[code][english] = value
                if value == english:
                    missing.append((english, code))
        output = ROOT / "i18n" / f"{page}.js"
        output.parent.mkdir(exist_ok=True)
        output.write_text("window.PAGE_I18N = " + json.dumps(dictionaries, ensure_ascii=False, separators=(",", ":")) + ";\n")
        print(f"{page}: {len(data.get('strings', {}))} source strings; {len(missing)} English fallbacks")


if __name__ == "__main__":
    main()
