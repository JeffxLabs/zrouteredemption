#!/usr/bin/env python3
"""Emit derived Capitol wire-field facts from a pinned, local plaintext schema.

No game code is executed and no sockets are opened. Raw source stays outside git.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re

SOURCE_SHA256 = "d8a12cfc91ce7c46acb1bdb0f024772ff322f040c7a25d294e1f0e4f1c012263"
MESSAGES = (
    "TempleTitleDto", "TempleTitleC2S", "TempleTitleS2C",
    "TempleAppointTitleC2S", "TempleApplicationTitleC2S", "TempleCancelTitleC2S",
    "TempleAgreeTitleApplicationC2S", "TempleTitleCDC2S", "TempleAutoApplicationC2S",
    "TempleApplicationListC2S", "TempleApplicationListS2C", "TempleApplicationPlayer",
    "TempleChanegeTitleC2S", "TempleDepriveTitleC2S", "UpdateTempleTitleS2C",
    "GetTempleTitleC2S", "PushTempleTitleS2C", "PushApplicationTitleS2C",
    "GetTempleTitleRecordC2S", "TempleTitleRecordS2C", "TempleTitleRecord",
)


def extract(raw, *, build344=False):
    digest = hashlib.sha256(raw).hexdigest()
    if digest != SOURCE_SHA256:
        raise ValueError("unreviewed schema SHA-256; do not relabel another version")
    source = re.sub(r"//[^\n]*", "", raw.decode("utf-8"))
    messages = {}
    field = re.compile(r"\s*(?:(repeated)\s+)?(map<\w+,\s*\w+>|\w+)\s+(\w+)\s*=\s*(\d+)\s*;\s*")
    for name in MESSAGES:
        match = re.search(r"\bmessage\s+" + re.escape(name) + r"\s*\{([^{}]*)\}", source)
        if not match:
            raise ValueError("missing or unsupported message: " + name)
        fields = []
        for statement in match[1].split(";"):
            if not statement.strip():
                continue
            parsed = field.fullmatch(statement + ";")
            if not parsed:
                raise ValueError("unsupported field in " + name)
            repeated, kind, key, number = parsed.groups()
            fields.append({"number": int(number), "name": key,
                           "type": kind.replace(" ", ""), "repeated": bool(repeated)})
        messages[name] = fields
    result = {
        "source": {"app_version": "1.22.05", "version_code": 250,
                   "package": "com.zroute.global.website", "catalog": "V202606032030",
                   "apk_sha256": "23e7d694915351860de717bb01a6da2d7179c93307ee9b29670aaae96d339bcd",
                   "table": "temple.proto", "plaintext_sha256": digest,
                   "bundle": "5bb809a11793b38211fa73788e9374c8"},
        "status": "historical_static_evidence_not_latest_or_live_verified",
        "messages": messages,
    }
    if build344:
        result["source"].update(app_version="1.41.02", version_code=344,
                                package="com.zroute.global", catalog="V202611021100",
                                apk_sha256="e8db032e0ab264f9282628484c97cc3ef0c4a9aedfd2128986d953f742f5efaf",
                                bundle="84b0b2a13d3cf9e5d0f0a00844d35c08")
        result["status"] = "build344_embedded_schema_not_live_verified"
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("schema", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--build344", action="store_true", help="use independently reviewed build-344 provenance")
    args = parser.parse_args()
    # Validate before touching the output. Both inspected schemas share this hash.
    result = extract(args.schema.read_bytes(), build344=args.build344)
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
