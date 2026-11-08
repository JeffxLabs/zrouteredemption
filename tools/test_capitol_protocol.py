"""Offline tests; no publisher source or network required."""
import hashlib
import json
from pathlib import Path
import unittest
from unittest.mock import patch

import extract_capitol_protocol as subject


class CapitolProtocolTests(unittest.TestCase):
    def test_checked_in_contract(self):
        data = json.loads((Path(__file__).resolve().parents[1] / "data/capitol_protocol.json").read_text())
        self.assertEqual(data["source"]["plaintext_sha256"], subject.SOURCE_SHA256)
        self.assertEqual(set(data["messages"]), set(subject.MESSAGES))
        self.assertEqual(data["status"], "historical_static_evidence_not_latest_or_live_verified")
        for fields in data["messages"].values():
            self.assertEqual(len({f["number"] for f in fields}), len(fields))
            self.assertTrue(all(f["number"] > 0 for f in fields))
        self.assertEqual(data["messages"]["TempleDepriveTitleC2S"], [
            {"number": 1, "name": "title", "type": "int32", "repeated": False},
            {"number": 2, "name": "userUid", "type": "int64", "repeated": False},
        ])
        self.assertIn("TempleChanegeTitleC2S", data["messages"])

    def test_reject_unpinned_input(self):
        with self.assertRaisesRegex(ValueError, "unreviewed"):
            subject.extract(b"message TempleTitleDto {}")

    def test_parser_synthetic_contract(self):
        # Patching only the hash gate lets synthetic fixtures test the parser.
        raw = b"// example\nmessage Example { int32 id = 1; repeated Person people = 2; map<int32, int64> times = 3; }"
        with patch.object(subject, "SOURCE_SHA256", hashlib.sha256(raw).hexdigest()), patch.object(subject, "MESSAGES", ("Example",)):
            fields = subject.extract(raw)["messages"]["Example"]
        self.assertEqual([f["number"] for f in fields], [1, 2, 3])
        self.assertTrue(fields[1]["repeated"])
        self.assertEqual(fields[2]["type"], "map<int32,int64>")

    def test_unsupported_field_fails_closed(self):
        raw = b"message Example { optional int32 id = 1; }"
        with patch.object(subject, "SOURCE_SHA256", hashlib.sha256(raw).hexdigest()), patch.object(subject, "MESSAGES", ("Example",)):
            with self.assertRaisesRegex(ValueError, "unsupported"):
                subject.extract(raw)


if __name__ == "__main__":
    unittest.main()
