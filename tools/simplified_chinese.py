#!/usr/bin/env python3
"""Convert Traditional client strings to Simplified Chinese with Apple's ICU transform."""
import json
import os
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def simplify(values):
    values = list(values)
    if not values:
        return []
    cache = Path(tempfile.gettempdir()) / "zrouteredemption-swift-module-cache"
    cache.mkdir(exist_ok=True)
    environment = os.environ.copy()
    environment.setdefault("CLANG_MODULE_CACHE_PATH", str(cache))
    result = subprocess.run(
        ["swift", str(ROOT / "tools/convert_traditional_chinese.swift")],
        input=json.dumps(values, ensure_ascii=False), text=True, capture_output=True, check=True, env=environment,
    )
    converted = json.loads(result.stdout)
    if len(converted) != len(values):
        raise RuntimeError("Traditional-to-Simplified conversion returned an unexpected result")
    return converted
