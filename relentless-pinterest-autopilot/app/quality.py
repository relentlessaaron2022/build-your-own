"""Quality control gate. Every pin must pass every check in the spec's
list before it's allowed into the publish queue; failures mark the pin
REGENERATE rather than publishing something broken.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import requests
from PIL import Image

from app.config import load_boards
from app.duplicate import is_duplicate_against
from app.logging_config import get_logger

logger = get_logger(__name__)

EXPECTED_SIZE = (1000, 1500)


@dataclass
class QualityResult:
    passed: bool
    failures: list[str] = field(default_factory=list)


def _check_destination_url(url: str, check_network: bool) -> str | None:
    if not url:
        return "destination URL is empty"
    if not check_network:
        return None
    try:
        resp = requests.head(url, timeout=10, allow_redirects=True)
        if resp.status_code >= 400:
            # Some sites reject HEAD; retry with a lightweight GET before failing.
            resp = requests.get(url, timeout=10, allow_redirects=True, stream=True)
        if resp.status_code >= 400:
            return f"destination URL returned HTTP {resp.status_code}"
    except requests.RequestException as exc:
        return f"destination URL unreachable: {exc}"
    return None


def _check_image(image_path: str) -> tuple[str | None, str]:
    if not image_path or not Path(image_path).exists():
        return "image file does not exist", ""
    try:
        with Image.open(image_path) as img:
            if img.size != EXPECTED_SIZE:
                return f"image dimensions {img.size} != required {EXPECTED_SIZE}", ""
    except Exception as exc:  # noqa: BLE001
        return f"image could not be opened: {exc}", ""
    return None, image_path


def _check_board_exists(board_name_or_id: str) -> str | None:
    if not board_name_or_id:
        return "no board assigned"
    boards = load_boards()
    for b in boards:
        if board_name_or_id in (b.get("name"), b.get("pinterest_board_id")):
            return None
    return f"board '{board_name_or_id}' not found in configured boards"


def _check_destination_relevance(destination_url: str, landing_url: str) -> str | None:
    if not destination_url:
        return None  # already caught by _check_destination_url
    if landing_url and landing_url.split("//")[-1].split("/")[0] not in destination_url:
        return "destination URL does not match campaign's landing domain"
    return None


def run_quality_checks(
    *,
    headline: str,
    description: str,
    destination_url: str,
    landing_url: str,
    board_name: str,
    campaign_active: bool,
    image_path: str,
    image_hash: str,
    text_for_dupe_check: str,
    existing_pins: list[dict],
    check_network: bool = True,
) -> QualityResult:
    failures: list[str] = []

    if not headline or not headline.strip():
        failures.append("headline is empty")
    elif len(headline) > 100:
        failures.append("headline is unusually long and may be truncated by Pinterest")

    if not description or not description.strip():
        failures.append("description is empty")

    img_error, _ = _check_image(image_path)
    if img_error:
        failures.append(img_error)

    board_error = _check_board_exists(board_name)
    if board_error:
        failures.append(board_error)

    if not campaign_active:
        failures.append("campaign is not active")

    url_error = _check_destination_url(destination_url, check_network)
    if url_error:
        failures.append(url_error)

    relevance_error = _check_destination_relevance(destination_url, landing_url)
    if relevance_error:
        failures.append(relevance_error)

    is_dup, dup_reason = is_duplicate_against(
        image_hash=image_hash, text=text_for_dupe_check, existing=existing_pins
    )
    if is_dup:
        failures.append(f"duplicate detected: {dup_reason}")

    return QualityResult(passed=not failures, failures=failures)
