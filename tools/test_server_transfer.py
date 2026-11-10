import copy
import json
from pathlib import Path
import tempfile
import unittest

from compare_server_transfer import compare, differences, read_snapshot

BASE = Path(__file__).resolve().parents[1] / "data/server-transfer/build344.json"


class ServerTransferTests(unittest.TestCase):
    def setUp(self):
        self.baseline = read_snapshot(BASE)

    def test_baseline_does_not_claim_implemented(self):
        self.assertEqual(self.baseline["source"]["version_code"], 344)
        self.assertEqual(self.baseline["assessment"]["status"], "references_present_workflow_not_established")
        self.assertEqual(self.baseline["assessment"]["live_availability"], "unverified")
        item = self.baseline["evidence"]["items"]["item_UseUp_immigrantCard"]
        self.assertEqual(item["isUse"], 0)
        self.assertEqual(item["name"], "")

    def test_self_comparison(self):
        result = compare(self.baseline, self.baseline)
        self.assertFalse(result["evidence_changed"])
        self.assertEqual(result["source_identity_changes"], [])

    def test_item_activation_detected_without_inferring_release(self):
        updated = copy.deepcopy(self.baseline)
        updated["evidence"]["items"]["item_UseUp_immigrantCard"]["isUse"] = 1
        result = compare(self.baseline, updated)
        self.assertTrue(result["evidence_changed"])
        self.assertEqual(result["evidence_changes"][0]["path"], "/evidence/items/item_UseUp_immigrantCard/isUse")
        self.assertEqual(result["assessment_changes"], [])

    def test_hash_only_change_is_not_semantic_evidence(self):
        updated = copy.deepcopy(self.baseline)
        updated["sources"]["Item.lua"]["textasset_payload_sha256"] = "0" * 64
        result = compare(self.baseline, updated)
        self.assertFalse(result["evidence_changed"])
        self.assertEqual(len(result["source_identity_changes"]), 1)

    def test_add_remove_order_and_types(self):
        result = differences({"a/b": False, "old": 1}, {"a/b": 0, "new": 2})
        self.assertEqual([v["kind"] for v in result], ["changed", "added", "removed"])
        self.assertEqual(result[0]["path"], "/a~1b")
        self.assertTrue(differences([1, 2], [2, 1]))

    def test_invalid_snapshot_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            p = Path(directory) / "invalid.json"
            p.write_text(json.dumps({"schema_version": 99}))
            with self.assertRaises(ValueError):
                read_snapshot(p)


if __name__ == "__main__":
    unittest.main()
