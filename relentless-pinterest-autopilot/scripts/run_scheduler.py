#!/usr/bin/env python3
"""Continuous scheduler entrypoint. Equivalent to `pinterest run`, kept as
a standalone script so it can be launched by systemd/supervisor/cron
without relying on the package being pip-installed.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.scheduler.runner import run_forever  # noqa: E402

if __name__ == "__main__":
    run_forever()
