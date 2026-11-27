"""Runtime kill-switch state.

The .env flags (PUBLISHING_ENABLED, GENERATION_ENABLED,
AUTO_OPTIMIZATION_ENABLED) set the *default* state when the system first
runs. From then on the source of truth is data/state.json, so `pinterest
pause` / `pinterest resume` can flip the switch on a live scheduler process
without editing environment files or restarting anything.
"""
from __future__ import annotations

import json
from pathlib import Path

from app.config import DATA_DIR, settings

STATE_PATH = DATA_DIR / "state.json"

_DEFAULTS = {
    "publishing_enabled": settings.publishing_enabled,
    "generation_enabled": settings.generation_enabled,
    "auto_optimization_enabled": settings.auto_optimization_enabled,
}


def _read() -> dict:
    if not STATE_PATH.exists():
        _write(_DEFAULTS)
        return dict(_DEFAULTS)
    with STATE_PATH.open("r", encoding="utf-8") as fh:
        data = json.load(fh)
    merged = dict(_DEFAULTS)
    merged.update(data)
    return merged


def _write(data: dict) -> None:
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with STATE_PATH.open("w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2)


def get_state() -> dict:
    return _read()


def set_flag(name: str, value: bool) -> dict:
    data = _read()
    data[name] = value
    _write(data)
    return data


def publishing_enabled() -> bool:
    return bool(_read().get("publishing_enabled", True))


def generation_enabled() -> bool:
    return bool(_read().get("generation_enabled", True))


def auto_optimization_enabled() -> bool:
    return bool(_read().get("auto_optimization_enabled", True))


def pause_publishing() -> dict:
    return set_flag("publishing_enabled", False)


def resume_publishing() -> dict:
    return set_flag("publishing_enabled", True)
