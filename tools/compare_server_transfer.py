#!/usr/bin/env python3
"""Compare reviewed server-transfer snapshots; never infers feature availability.

Inputs are derived review JSON, not APKs/source or arbitrary game code. A change
is a review prompt, not proof of implementation. Exit 0 on a valid comparison,
including changes; exit 2 on invalid input. Output is JSON on stdout.
"""
import argparse
import json
from pathlib import Path

MAX_BYTES = 1024 * 1024


def read_snapshot(path):
    if path.stat().st_size > MAX_BYTES:
        raise ValueError("snapshot exceeds size limit")
    value = json.loads(path.read_text(encoding="utf-8"))
    if (not isinstance(value, dict) or value.get("schema_version") != 1
            or value.get("feature") != "permanent_server_transfer"):
        raise ValueError("unsupported snapshot schema/feature")
    for key in ("source", "assessment", "evidence", "review_scope", "sources"):
        if not isinstance(value.get(key), dict):
            raise ValueError("missing snapshot object: " + key)
    if not all(key in value["source"] for key in ("app_version", "version_code", "catalog")):
        raise ValueError("missing source version")
    if not isinstance(value["assessment"].get("status"), str):
        raise ValueError("missing review status")
    return value


def differences(before, after, path=""):
    """JSON-pointer paths; preserve list order and distinguish bools from ints."""
    if isinstance(before, dict) and isinstance(after, dict):
        result = []
        for key in sorted(before.keys() | after.keys()):
            escaped = key.replace("~", "~0").replace("/", "~1")
            here = path + "/" + escaped
            if key not in before:
                result.append({"path": here, "kind": "added", "after": after[key]})
            elif key not in after:
                result.append({"path": here, "kind": "removed", "before": before[key]})
            else:
                result.extend(differences(before[key], after[key], here))
        return result
    if type(before) is not type(after) or before != after:
        return [{"path": path, "kind": "changed", "before": before, "after": after}]
    return []


def compare(before, after):
    evidence = differences(before["evidence"], after["evidence"], "/evidence")
    return {
        "before": before["source"], "after": after["source"],
        "interpretation": "Changes require manual review; no implementation or live availability inference.",
        "evidence_changed": bool(evidence), "evidence_changes": evidence,
        "assessment_changes": differences(before["assessment"], after["assessment"], "/assessment"),
        "coverage_changes": differences(before["review_scope"], after["review_scope"], "/review_scope"),
        "source_identity_changes": differences(before["sources"], after["sources"], "/sources"),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("before", type=Path)
    parser.add_argument("after", type=Path)
    args = parser.parse_args()
    try:
        result = compare(read_snapshot(args.before), read_snapshot(args.after))
    except (OSError, ValueError, RecursionError) as exc:
        parser.error(str(exc))
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
