#!/usr/bin/env python3
"""Check locale coverage and rank data on both Season 1 pages."""
import json
import re
import unittest
from html.parser import HTMLParser

from build_page_i18n import page_languages

LANGUAGES = page_languages("season-1")
from check_season1 import ROOT, GUIDE, SKILLS


class Copy(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.strings = set()
        self.rank_rows = []
        self.skip = None
        self.in_rank = False
        self.selector_count = 0
        self.feed(path.read_text())

    def add(self, text):
        if text and any(char.isalpha() for char in text) and text.strip() != 'ZR:Reference':
            self.strings.add(text.strip())

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id') == 'language-select':
            self.selector_count += 1
        if tag in ('script', 'style', 'code') or 'data-i18n-ignore' in attrs:
            self.skip = tag
        if not self.skip:
            for key in ('aria-label', 'alt', 'placeholder', 'title'):
                self.add(attrs.get(key))
            if tag == 'meta' and attrs.get('name') == 'description':
                self.add(attrs.get('content'))
        if tag == 'td':
            self.in_rank = True

    def handle_endtag(self, tag):
        if tag == self.skip:
            self.skip = None
        if tag == 'td':
            self.in_rank = False

    def handle_data(self, data):
        if not self.skip:
            self.add(data)
        if self.in_rank:
            self.rank_rows.append(data.strip())


class SeasonOneLocales(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads((ROOT / 'data/ui_i18n/season-1.json').read_text())['strings']

    def test_every_visible_message_has_all_supported_locales(self):
        required = {'{0} skill shown', '{0} skills shown', 'No skills match these filters.'}
        for route in (GUIDE, SKILLS):
            page = Copy(ROOT / route / 'index.html')
            self.assertEqual(page.selector_count, 1)
            required |= page.strings
        self.assertFalse(required - self.data.keys(), required - self.data.keys())
        for key, variants in self.data.items():
            self.assertEqual(set(variants), set(LANGUAGES), key)
            for value in variants.values():
                self.assertTrue(value.strip(), key)
                self.assertEqual(sorted(re.findall(r'\{\d+\}', key)), sorted(re.findall(r'\{\d+\}', value)), key)
                self.assertNotIn('ZXQ', value)

    def test_thai_is_available_with_client_terms(self):
        for route in ('', GUIDE, SKILLS):
            html = (ROOT / route / 'index.html').read_text()
            self.assertRegex(html, r'data-i18n-languages="[^"]*\bth\b')
        for english, thai in (
            ('Radiated Land', 'แดนรังสี'),
            ('Virus Boss Invasion', 'บอสไวรัสบุก'),
            ('Resistance Research', 'การวิจัยความต้านทาน'),
            ('Season Boost', 'บัฟซีซัน'),
        ):
            self.assertEqual(self.data[english]['th'], thai)
        receipt = json.loads((ROOT / 'data/ui_i18n/season-1-provenance.json').read_text())
        self.assertEqual(receipt['thai']['rank_rows'], 152)
        self.assertIn('lang_hmi_th', receipt['bundles_by_client_locale']['th'])
        self.assertIn('lang_annou_th', receipt['bundles_by_client_locale']['th'])
        for english, row in self.data.items():
            self.assertIn('th', row, english)
            self.assertRegex(row['th'], r'[\u0e00-\u0e7f]', english)
            self.assertNotRegex(row['th'], r'ZXQ|[\ue000-\uf8ff]')
        home = json.loads((ROOT / 'data/ui_i18n/home.json').read_text())['strings']
        self.assertEqual(home['Radiated Land']['th'], self.data['Radiated Land']['th'])
        self.assertTrue(all(re.search(r'[\u0e00-\u0e7f]', row['th']) for row in home.values()))
        self.assertIn('"./assets/fonts/noto-sans-thai.woff2"', (ROOT / 'sw.js').read_text())

    def test_rank_effects_and_client_glossary(self):
        ranks = Copy(ROOT / SKILLS / 'index.html').rank_rows
        self.assertEqual(len(ranks), 152)
        self.assertTrue(all(rank in self.data for rank in ranks))
        for label, es, ko, zh in (
            ('Virus Lab', 'Laboratorio del Virus', '바이러스 실험실', '病毒实验室'),
            ('Radiated Land', 'Tierra radiactiva', '방사능 지대', '辐射之地'),
            ('Stamina Recovery', 'Recuperación de resistencia', '체력 충만', '体力充沛'),
        ):
            self.assertEqual([self.data[label][code] for code in ('es', 'ko', 'zh')], [es, ko, zh])

    def test_browser_data_matches_source_and_is_cached(self):
        script = (ROOT / 'i18n/season-1.js').read_text()
        rendered = json.loads(script.removeprefix('window.PAGE_I18N = ').removesuffix(';\n'))
        self.assertEqual(rendered, {code: {key: row[code] for key, row in self.data.items()} for code in LANGUAGES})
        for name in ('i18n/season-1.js', 'assets/season-1/localize.js'):
            self.assertIn('"./' + name + '"', (ROOT / 'sw.js').read_text())


if __name__ == '__main__':
    unittest.main()
