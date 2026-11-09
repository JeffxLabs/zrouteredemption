import json
from pathlib import Path
import struct
import unittest
from lua54_tables import HEADER, parse, restore, rows


def uint(value):
    parts = [value & 127 | 128]
    value >>= 7
    while value:
        parts.insert(0, value & 127)
        value >>= 7
    return bytes(parts)


def string(value):
    raw = value.encode()
    return uint(len(raw) + 1) + raw


def ins(op, a=0, b=0, c=0, k=0):
    return op | a << 7 | k << 15 | b << 16 | c << 24


def fixture(instructions):
    constants = b'\x04' + string('Config') + b'\x04' + string('Example')
    return (HEADER + b'\x01' + b'\x80\x80\x80\x00\x01\x04'
            + uint(len(instructions)) + struct.pack('<' + 'I' * len(instructions), *instructions)
            + uint(2) + constants + b'\x81\x01\x00\x00\x80\x80\x80\x80\x80')


class LiteralTablesTests(unittest.TestCase):
    def test_literal_only(self):
        b = fixture([ins(81), ins(11, 0, 0, 0), ins(19, 1), ins(82),
                     ins(1, 2) | (65542 << 15), ins(17, 1, 1, 2),
                     ins(18, 0, 1, 1), ins(70)])
        self.assertEqual(parse(b), {'Example': {1: 7}})

    def test_call_forbidden(self):
        with self.assertRaisesRegex(ValueError, 'unsupported opcode'):
            parse(fixture([ins(68), ins(70)]))

    def test_truncated_and_trailing(self):
        b = fixture([ins(81), ins(70)])
        for value in (b[:-1], b + b'x'):
            with self.assertRaises(ValueError):
                parse(value)

    def test_sparse_mask_roundtrip(self):
        b = fixture([ins(81), ins(70)])
        self.assertEqual(restore(restore(b)), b)

    def test_metadata_not_a_row(self):
        self.assertEqual(rows({'keys': {1: 9}, 'keys2Index': {'id': 1, 'x': 2},
                               'defaults': {'x': 4}, 9: {1: 9, 2: 'DEFAULT'},
                               'ENUM': {1: 'not data'}}), {9: {'id': 9, 'x': 4}})

    def test_checked_in_findings(self):
        j = json.loads((Path(__file__).resolve().parents[1] / 'data/build344-findings.json').read_text())
        self.assertEqual(j['row_counts']['Building'], 107)
        self.assertEqual(j['row_counts']['CollegeTech'], 332)
        self.assertEqual(j['new_playable_hero_ids'], [])
        self.assertEqual(j['base']['levels_with_changed_cost_time_or_prerequisites'], [])
        self.assertEqual(sum(x['research_data_total'] for x in j['added_research']), 20760)


if __name__ == '__main__':
    unittest.main()
