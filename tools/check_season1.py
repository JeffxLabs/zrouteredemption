#!/usr/bin/env python3
"""Dependency-free checks for the Season 1 guide and GitHub Pages links."""
import json
import re
import unittest
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit

ROOT = Path(__file__).resolve().parents[1]
BASE = '/zrouteredemption/'
GUIDE = 'season-1/'
SKILLS = GUIDE + 'skills/'
PAGES = ('', 'base/', 'heroes/', 'hero-exp/', 'research/', 'fighter/')


class Page(HTMLParser):
    def __init__(self, route):
        super().__init__()
        self.nodes = []
        self.targets = []
        self.feed((ROOT / route / 'index.html').read_text())

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.nodes.append((tag, attrs))
        if 'id' in attrs:
            self.targets.append(attrs['id'])

    def links(self, tag='a', attr='href'):
        return [node[attr] for kind, node in self.nodes if kind == tag and attr in node]


class SeasonOne(unittest.TestCase):
    def test_guide_is_discoverable(self):
        for route in PAGES:
            with self.subTest(route=route):
                links = Page(route).links()
                self.assertGreaterEqual(links.count('../' + GUIDE if route else GUIDE), 2)

    def test_home_has_a_season_guide_card(self):
        home = Page('')
        cards = [node for tag, node in home.nodes if tag == 'a' and 'tool' in node.get('class', '').split()]
        self.assertEqual(len([node for node in cards if node.get('href') == GUIDE]), 1)

    def test_season_bottom_navigation_matches_home(self):
        def tabs(route):
            html = (ROOT / route / 'index.html').read_text()
            nav = re.search(r'<nav class="bottom-nav"[^>]*>(.*?)</nav>', html, re.S)
            if nav is None:
                self.fail(f'{route}: use the standard bottom navigation')
            out = []
            for href, icon, label in re.findall(r'<a href="([^"]+)"[^>]*>(<svg[^>]*>.*?</svg>)<span>([^<]+)</span></a>', nav[1], re.S):
                out.append((urljoin(BASE + route, href), icon, label))
            return out

        expected = tabs('')
        self.assertEqual(len(expected), 6)
        for route in (GUIDE, SKILLS):
            with self.subTest(route=route):
                self.assertEqual(tabs(route), expected)

    def test_pages_have_resolvable_links_assets_and_fragments(self):
        for route in (GUIDE, SKILLS):
            with self.subTest(route=route):
                page = Page(route)
                self.assertEqual(len(page.targets), len(set(page.targets)))
                for link in page.links() + page.links('link') + page.links('img', 'src') + page.links('script', 'src'):
                    url = urlsplit(urljoin(BASE + route, link))
                    if url.netloc or url.scheme:
                        continue
                    self.assertTrue(url.path.startswith(BASE), link)
                    local = ROOT / url.path.removeprefix(BASE)
                    self.assertTrue((local / 'index.html' if local.is_dir() else local).is_file(), link)
                    if url.fragment:
                        route_target = url.path.removeprefix(BASE)
                        if route_target == 'heroes/' and re.fullmatch(r'hero-\d+', url.fragment):
                            # The hero directory interprets its modal deep links at runtime.
                            heroes = json.loads((ROOT / 'data/heroes_directory.json').read_text())
                            self.assertIn(int(url.fragment[5:]), {hero['id'] for hero in heroes}, link)
                        else:
                            self.assertIn(url.fragment, Page(route_target).targets, link)

    def test_navigation_covers_player_decisions(self):
        targets = Page(GUIDE).targets
        for topic in ('start', 'buildings', 'resistance', 'classes', 'milestones', 'territory', 'events', 'rewards', 'faq', 'sources'):
            self.assertIn(topic, targets)
            self.assertIn('#' + topic, Page(GUIDE).links())

    def test_reference_covers_every_s1_eligible_skill(self):
        page = Page(SKILLS)
        ids = [int(m[1]) for node in page.targets if (m := re.fullmatch(r'skill-(\d+)', node))]
        self.assertEqual(sorted(ids), [*range(1101, 1119), *range(1201, 1210), *range(2101, 2119)])
        tables = Counter(node['data-skill'] for kind, node in page.nodes if kind == 'table' and 'data-skill' in node)
        self.assertEqual(tables, Counter(str(i) for i in ids))

    def test_guide_and_reference_are_precached(self):
        sw = (ROOT / 'sw.js').read_text()
        for asset in (GUIDE, GUIDE + 'index.html', SKILLS, SKILLS + 'index.html', 'assets/season-1/guide.css'):
            self.assertIn('"./' + asset + '"', sw)


if __name__ == '__main__':
    unittest.main()
