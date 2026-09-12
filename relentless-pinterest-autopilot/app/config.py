"""Central configuration loader.

Everything that could plausibly change per-user (sites, offers, boards,
brand identity) lives in JSON under config/ instead of being hardcoded in
Python, per the build spec. Secrets and operational toggles live in .env.
"""
from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CONFIG_DIR = PROJECT_ROOT / "config"
DATA_DIR = PROJECT_ROOT / "data"
LOGS_DIR = PROJECT_ROOT / "logs"
ASSETS_DIR = PROJECT_ROOT / "assets"
REPORTS_DIR = PROJECT_ROOT / "reports"

load_dotenv(PROJECT_ROOT / ".env")


def _load_json(name: str) -> Any:
    path = CONFIG_DIR / name
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def _env_bool(name: str, default: bool) -> bool:
    val = os.getenv(name)
    if val is None:
        return default
    return val.strip().lower() in ("1", "true", "yes", "on")


def _env_int(name: str, default: int) -> int:
    val = os.getenv(name)
    if val is None or val.strip() == "":
        return default
    try:
        return int(val)
    except ValueError:
        return default


@dataclass
class Settings:
    database_url: str = field(default_factory=lambda: os.getenv(
        "DATABASE_URL", f"sqlite:///{DATA_DIR / 'autopilot.db'}"
    ))

    pinterest_client_id: str = field(default_factory=lambda: os.getenv("PINTEREST_CLIENT_ID", ""))
    pinterest_client_secret: str = field(default_factory=lambda: os.getenv("PINTEREST_CLIENT_SECRET", ""))
    pinterest_access_token: str = field(default_factory=lambda: os.getenv("PINTEREST_ACCESS_TOKEN", ""))
    pinterest_refresh_token: str = field(default_factory=lambda: os.getenv("PINTEREST_REFRESH_TOKEN", ""))

    openai_api_key: str = field(default_factory=lambda: os.getenv("OPENAI_API_KEY", ""))

    wordpress_site_url: str = field(default_factory=lambda: os.getenv("WORDPRESS_SITE_URL", ""))
    wordpress_username: str = field(default_factory=lambda: os.getenv("WORDPRESS_USERNAME", ""))
    wordpress_app_password: str = field(default_factory=lambda: os.getenv("WORDPRESS_APP_PASSWORD", ""))

    publishing_enabled: bool = field(default_factory=lambda: _env_bool("PUBLISHING_ENABLED", True))
    generation_enabled: bool = field(default_factory=lambda: _env_bool("GENERATION_ENABLED", True))
    auto_optimization_enabled: bool = field(default_factory=lambda: _env_bool("AUTO_OPTIMIZATION_ENABLED", True))

    daily_pin_target: int = field(default_factory=lambda: _env_int("DAILY_PIN_TARGET", 5))
    min_queue_days: int = field(default_factory=lambda: _env_int("MIN_QUEUE_DAYS", 14))
    target_queue_days: int = field(default_factory=lambda: _env_int("TARGET_QUEUE_DAYS", 30))

    @property
    def pinterest_credentials_present(self) -> bool:
        return bool(self.pinterest_client_id and self.pinterest_client_secret and self.pinterest_refresh_token)

    @property
    def openai_available(self) -> bool:
        return bool(self.openai_api_key)


settings = Settings()


def load_sites() -> list[dict]:
    return _load_json("sites.json").get("sites", [])


def load_offers() -> list[dict]:
    return _load_json("offers.json").get("offers", [])


def load_boards() -> list[dict]:
    return _load_json("boards.json").get("boards", [])


def load_brand() -> dict:
    return _load_json("brand.json")


def save_boards(boards: list[dict]) -> None:
    path = CONFIG_DIR / "boards.json"
    payload = {
        "boards": boards,
        "note": "pinterest_board_id is populated by `pinterest sync-boards` once Pinterest OAuth credentials are available. Boards without a matching name on the connected Pinterest account can optionally be created via the API.",
    }
    with path.open("w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2)


def get_site(site_id: str) -> dict | None:
    return next((s for s in load_sites() if s["id"] == site_id), None)


def get_offer(offer_id: str) -> dict | None:
    return next((o for o in load_offers() if o["id"] == offer_id), None)


def brand_for_key(brand_key: str) -> dict:
    return load_brand().get(brand_key, {})


def brand_key_for_url(url: str) -> str | None:
    """Map a landing/destination URL to a brand key via domain_mappings."""
    brand = load_brand()
    domain_mappings = brand.get("domain_mappings", {})
    for domain, key in domain_mappings.items():
        if domain in url:
            return key
    return None


for _dir in (DATA_DIR, LOGS_DIR, REPORTS_DIR, ASSETS_DIR / "generated"):
    _dir.mkdir(parents=True, exist_ok=True)
