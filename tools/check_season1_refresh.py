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

    def test_virus_lab_priority_is_in_opening_and_building_card(self):
        html = (ROOT / GUIDE / 'index.html').read_text()
        for tag, anchor in [('section', 'start'), ('article', 'virus-lab')]:
            with self.subTest(anchor=anchor):
                block = html.split(f'id="{anchor}"', 1)[1].split(f'</{tag}>', 1)[0]
                self.assertIn('Upgrade the Virus Lab to Lv.30 as soon as you can.', block)
                self.assertIn('Your base does not need to be Lv.30 to do this.', block)
                self.assertNotIn('Base Lv.10', block)

    def test_tactical_tips_are_in_the_relevant_sections(self):
        page = Page(GUIDE)
        html = (ROOT / GUIDE / 'index.html').read_text()
        self.assertIn('#first-kill-rewards', page.links())
        for anchor, copy in (
            ('first-kill-rewards', 'Radiated Zombies and Radiated Elites'),
            ('refinery', 'Refinery I Lv.6 requires Refinery II Lv.5.'),
            ('rally-resistance', 'Have your highest-resistance player lead the rally'),
            ('hero-changes', 'Avoid promoting Aria right before an important fight'),
        ):
            with self.subTest(anchor=anchor):
                self.assertIn(anchor, page.targets)
                block = html.partition(f'id="{anchor}"')[2]
                end_tag = '<h3' if anchor in {'first-kill-rewards', 'rally-resistance'} else '</article>' if anchor == 'refinery' else '</section>'
                self.assertIn(copy, block.split(end_tag, 1)[0])

    def test_warmup_steps_precede_launch_and_use_offline_game_art(self):
        page = Page(GUIDE)
        html = (ROOT / GUIDE / 'index.html').read_text()
        self.assertTrue({'warmup', 'launch-day', 'season-boost', 'settlement-loot'} <= set(page.targets))
        warmup = html.split('id="warmup"', 1)[1].split('id="launch-day"', 1)[0]
        self.assertIn('Phase Quest', warmup)
        self.assertIn('Unclaimed rewards are not mailed.', warmup)
        self.assertIn('three rewarded attacks per day across both bosses', warmup)
        self.assertIn('separate from your Virus Lab', warmup)
        self.assertIn('#warmup', page.links())
        manifest = json.loads((ROOT / 'assets/season-1/activities/sources.json').read_text())['sprites']
        sw = (ROOT / 'sw.js').read_text()
        for name, art in manifest.items():
            path = f'assets/season-1/activities/{name}.webp'
            self.assertIn('../' + path, page.links('img', 'src'))
            self.assertIn('"./' + path + '"', sw)
            self.assertEqual(hashlib.sha256((ROOT / path).read_bytes()).hexdigest(), art['webp_sha256'])

    def test_player_pages_do_not_show_evidence_citations(self):
        for route in (GUIDE, SKILLS):
            with self.subTest(route=route):
                page = Page(route)
                self.assertFalse(any('source' in a.get('class', '').split() for _, a in page.nodes))
                self.assertFalse(any(href.startswith(('#src-', '../#src-')) for href in page.links()))

    def test_buildings_and_exclusive_weapons_show_in_game_art(self):
        guide = Page(GUIDE)
        html = (ROOT / GUIDE / 'index.html').read_text()
        self.assertNotIn('Wait for the server restart', html)
        self.assertIn('50 matching weapon shards', html)
        expected = {'class-hall', 'virus-lab', 'refinery', 'world-geographic',
                    'unit-type-base', 'warrior-base', 'assault-base', 'tactical-base',
                    'emergency-center', 'radiation-shelter',
                    'weapon-monroe', 'weapon-leah', 'weapon-yana'}
        folder = 'assets/season-1/field-guide/'
        images = {href for href in guide.links('img', 'src') if href.startswith('../' + folder)}
        self.assertEqual(images, {'../' + folder + name + '.webp' for name in expected})
        manifest = json.loads((ROOT / folder / 'sources.json').read_text())['sprites']
        self.assertEqual(set(manifest), expected)
        sw = (ROOT / 'sw.js').read_text()
        for name, art in manifest.items():
            path = folder + name + '.webp'
            self.assertIn('"./' + path + '"', sw)
            self.assertEqual(hashlib.sha256((ROOT / path).read_bytes()).hexdigest(), art['webp_sha256'])

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
