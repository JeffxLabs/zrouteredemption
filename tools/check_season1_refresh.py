#!/usr/bin/env python3
"""Regression checks for the illustrated Season 1 guide."""
import hashlib
import json
import re
import unittest
from urllib.parse import urlsplit
from check_season1 import ROOT, GUIDE, SKILLS, Page


class IllustratedGuide(unittest.TestCase):
    def test_guide_covers_player_questions(self):
        guide = Page(GUIDE)
        self.assertTrue({'hero-changes', 'talent-items', 'outpost-playbook', 'launch-day'} <= set(guide.targets))
        self.assertEqual({int(m[1]) for href in guide.links() if (m := re.fullmatch(r'../heroes/#hero-(\d+)', href))},
                         {30003, 31003, 30006, 50006, 50011})

    def test_every_skill_can_be_linked_and_rank_rows_are_preserved(self):
        page = Page(SKILLS)
        self.assertEqual(len([n for n in page.targets if re.fullmatch(r'skill-\d+', n)]), 45)
        self.assertEqual(sum(kind == 'th' and a.get('scope') == 'row' for kind, a in page.nodes), 152)
        self.assertIn('skill-filter', page.targets)
        self.assertIn('skill-count', page.targets)

    def test_art_receipts_and_offline_coverage(self):
        sw = (ROOT / 'sw.js').read_text()
        directory = ROOT / 'assets/season-1/icons'
        manifest = json.loads((directory / 'sources.json').read_text())
        ids = set(map(str, [*range(1101, 1119), *range(1201, 1210), *range(2101, 2119)]))
        self.assertTrue(ids <= manifest['icons'].keys())
        for name, item in manifest['icons'].items():
            path = directory / (name + '.webp')
            self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), item['webp_sha256'])
            self.assertRegex(item['member'], r'assets/BuiltinFiles/P1/[0-9a-f]{32}\.bundle')
            self.assertIn('"./' + path.relative_to(ROOT).as_posix() + '"', sw)
        for href in Page(GUIDE).links('img', 'src'):
            url = urlsplit(href)
            if href.startswith('../assets/heroes/'):
                self.assertIn('"./' + url.path[3:] + '"', sw)


if __name__ == '__main__':
    unittest.main()
