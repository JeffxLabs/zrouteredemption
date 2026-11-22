#!/usr/bin/env python3
"""Dependency-free checks for the Season 1 guide and GitHub Pages links."""
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
                        self.assertIn(url.fragment, Page(url.path.removeprefix(BASE)).targets, link)

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
