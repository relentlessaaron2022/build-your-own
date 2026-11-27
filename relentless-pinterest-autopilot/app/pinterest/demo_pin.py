"""One-pin actions for the local connect demo.

Creating or publishing a held pin calls the Pinterest API once, and only
from the button the operator pressed. Scheduling writes a local row with
status manual_hold. The scheduler publishes queued and scheduled pins
only, so a held demo pin is not published when `pinterest run` is active.
"""
from __future__ import annotations

import datetime as dt
import io
import re
import uuid
from pathlib import Path
from urllib.parse import urlparse
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from PIL import Image, ImageDraw
from sqlalchemy import select, update

from app import config as app_config
from app import state
from app.creative.fonts import load_font
from app.db import Campaign, Pin, PinConcept, get_session
from app.logging_config import get_logger
from app.pinterest.client import PinterestAPIError, PinterestClient
from app.publish_lock import single_publisher

logger = get_logger(__name__)

MANUAL_DEMO_CAMPAIGN = "Manual Pinterest demo"
MANUAL_HOLD_STATUS = "manual_hold"
MANUAL_PUBLISHING_STATUS = "manual_publishing"
_BOARD_ID = re.compile(r"[A-Za-z0-9_-]{1,64}")
_REMOTE_PIN_ID = re.compile(r"[A-Za-z0-9_-]+")


class DemoPinError(Exception):
    """Operator-facing pin error. The message must not contain secrets."""


def parse_schedule_time(raw: str) -> dt.datetime:
    text = (raw or "").strip()
    if not text:
        raise DemoPinError(
            "Choose a date and time to schedule the pin. Nothing was sent to Pinterest."
        )
    try:
        parsed = dt.datetime.fromisoformat(text)
    except ValueError:
        raise DemoPinError("The schedule time is not a valid date. Nothing was sent to Pinterest.") from None
    if parsed.tzinfo is None:
        try:
            zone = ZoneInfo(app_config.settings.scheduler_timezone)
        except (ZoneInfoNotFoundError, ValueError):
            raise DemoPinError("SCHEDULER_TIMEZONE is invalid. Nothing was sent to Pinterest.") from None
        parsed = parsed.replace(tzinfo=zone)
    when = parsed.astimezone(dt.timezone.utc)
    if when <= dt.datetime.now(dt.timezone.utc) + dt.timedelta(seconds=30):
        raise DemoPinError(
            "Schedule time must be in the future. Use Create this pin now to publish immediately. "
            "Nothing was sent to Pinterest."
        )
    return when


def create_demo_pin(
    *,
    board_id: str,
    title: str,
    description: str,
    link: str,
    image_bytes: bytes | None,
    use_sample: bool,
    client: PinterestClient | None = None,
) -> dict:
    if not state.publishing_enabled():
        raise DemoPinError(
            "Publishing is paused. Run `pinterest resume`, then press the button again. Nothing was sent."
        )
    spec = _validate_fields(board_id=board_id, title=title, description=description, link=link)
    image_path = store_pin_image(image_bytes=image_bytes, use_sample=use_sample, title=spec["title"])
    result = _publish_new_pin(spec, image_path, client)
    if result.get("reason") == "publisher_busy":
        raise DemoPinError("Another local publisher is running. Nothing was sent to Pinterest.")
    return result


def schedule_demo_pin(
    *,
    board_id: str,
    title: str,
    description: str,
    link: str,
    image_bytes: bytes | None,
    use_sample: bool,
    publish_at: dt.datetime,
    client: PinterestClient | None = None,
) -> dict:
    """Save one pin locally. This does not call create-pin and the worker will not send it."""
    if publish_at.tzinfo is None:
        publish_at = publish_at.replace(tzinfo=dt.timezone.utc)
    if publish_at <= dt.datetime.now(dt.timezone.utc) + dt.timedelta(seconds=30):
        raise DemoPinError(
            "Schedule time must be in the future. Use Create this pin now to publish immediately. "
            "Nothing was sent to Pinterest."
        )
    spec = _validate_fields(board_id=board_id, title=title, description=description, link=link)
    image_path = store_pin_image(image_bytes=image_bytes, use_sample=use_sample, title=spec["title"])
    api = client or PinterestClient()
    board_name = _matching_board(api, spec["board_id"])["name"]
    local_id = _insert_pin(
        spec,
        image_path=image_path,
        board_name=board_name,
        status=MANUAL_HOLD_STATUS,
        scheduled_at=publish_at.astimezone(dt.timezone.utc),
        remote_id="",
    )
    logger.info("Scheduled one demo pin locally (not sent to Pinterest)")
    return {
        "kind": "scheduled",
        "local_id": local_id,
        "board_name": board_name,
        "publish_at": format_local(publish_at),
        "sent_to_pinterest": False,
        "pin_url": "",
    }


def publish_held_pin(local_id: int, *, client: PinterestClient | None = None) -> dict:
    if not state.publishing_enabled():
        raise DemoPinError(
            "Publishing is paused. Run `pinterest resume`, then press the button again. Nothing was sent."
        )
    result = _publish_held_locked(local_id, client)
    if result.get("reason") == "publisher_busy":
        raise DemoPinError("Another local publisher is running. Nothing was sent to Pinterest.")
    return result


def list_held_pins() -> list[dict]:
    with get_session() as session:
        rows = session.execute(
            select(Pin, PinConcept)
            .join(PinConcept, Pin.concept_id == PinConcept.id)
            .join(Campaign, PinConcept.campaign_id == Campaign.id)
            .where(Campaign.name == MANUAL_DEMO_CAMPAIGN, Pin.status == MANUAL_HOLD_STATUS)
            .order_by(Pin.scheduled_at.asc(), Pin.id.asc())
        ).all()
        held = []
        for pin, concept in rows:
            when = ""
            if pin.scheduled_at is not None:
                when = format_local(_as_utc(pin.scheduled_at))
            held.append(
                {
                    "local_id": pin.id,
                    "title": concept.headline,
                    "board_name": concept.board_id,
                    "publish_at": when,
                }
            )
        return held


def store_pin_image(*, image_bytes: bytes | None, use_sample: bool, title: str) -> Path:
    root = app_config.ASSETS_DIR / "generated"
    root.mkdir(parents=True, exist_ok=True)
    path = root / f"demo-{uuid.uuid4().hex}.png"
    if use_sample:
        write_sample_png(path, title)
        return path.resolve()
    if not image_bytes:
        raise DemoPinError("Upload a PNG or JPEG, or leave Use a sample graphic checked.")
    if len(image_bytes) > 8 * 1024 * 1024:
        raise DemoPinError("Image must be 8 MB or smaller.")
    try:
        with Image.open(io.BytesIO(image_bytes)) as image:
            image.load()
            if image.width < 1 or image.height < 1:
                raise DemoPinError("That image is empty.")
            image.convert("RGB").save(path, "PNG")
    except DemoPinError:
        path.unlink(missing_ok=True)
        raise
    except Exception:
        path.unlink(missing_ok=True)
        raise DemoPinError("That file is not a usable PNG or JPEG.") from None
    return path.resolve()


def write_sample_png(path: Path, title: str) -> None:
    image = Image.new("RGB", (1000, 1500), (32, 24, 22))
    draw = ImageDraw.Draw(image)
    draw.rectangle((48, 48, 952, 1452), outline=(230, 0, 35), width=10)
    draw.rectangle((48, 48, 952, 210), fill=(230, 0, 35))
    small = load_font("DejaVuSans.ttf", 36)
    large = load_font("DejaVuSans-Bold.ttf", 64)
    draw.text((80, 78), "WEBFILMBOOKS", fill=(255, 255, 255), font=small)
    label = (title or "Pinterest demo").strip()
    if len(label) > 42:
        label = label[:39] + "..."
    draw.text((80, 700), label, fill=(255, 248, 244), font=large)
    image.save(path, "PNG")


def format_local(when: dt.datetime) -> str:
    try:
        zone = ZoneInfo(app_config.settings.scheduler_timezone)
    except (ZoneInfoNotFoundError, ValueError):
        zone = dt.timezone.utc
    return _as_utc(when).astimezone(zone).strftime("%Y-%m-%d %H:%M %Z")


def _validate_fields(*, board_id: str, title: str, description: str, link: str) -> dict:
    board_id = (board_id or "").strip()
    if not _BOARD_ID.fullmatch(board_id):
        raise DemoPinError("Choose a board from this account. Nothing was sent to Pinterest.")
    title = (title or "").strip()
    if not title:
        raise DemoPinError("Enter a pin title. Nothing was sent to Pinterest.")
    if len(title) > 100:
        raise DemoPinError("Title must be 100 characters or fewer. Nothing was sent to Pinterest.")
    description = (description or "").strip()
    if len(description) > 800:
        raise DemoPinError("Description must be 800 characters or fewer. Nothing was sent to Pinterest.")
    return {
        "board_id": board_id,
        "title": title,
        "description": description,
        "link": _validate_link(link),
    }


def _validate_link(link: str) -> str:
    link = (link or "").strip()
    parsed = urlparse(link)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc or parsed.username or parsed.password:
        raise DemoPinError("Enter a full http or https destination link. Nothing was sent to Pinterest.")
    if len(link) > 1000:
        raise DemoPinError("The destination link is too long. Nothing was sent to Pinterest.")
    return link


def _matching_board(client: PinterestClient, board_id: str) -> dict:
    try:
        boards = client.list_boards()
    except PinterestAPIError:
        logger.warning("Could not list Pinterest boards for the demo")
        raise DemoPinError("Could not read boards for this account. Nothing was sent to Pinterest.") from None
    for board in boards:
        if str(board.get("id") or "") == board_id:
            name = str(board.get("name") or board_id).strip() or board_id
            return {"id": board_id, "name": name}
    raise DemoPinError("Choose a board from this account. Nothing was sent to Pinterest.")


def _assert_image_in_assets(path: Path) -> Path:
    root = (app_config.ASSETS_DIR / "generated").resolve()
    resolved = path.resolve()
    if not resolved.is_relative_to(root) or not resolved.is_file():
        raise DemoPinError("Pin image must be a file saved by this demo. Nothing was sent to Pinterest.")
    return resolved


def _demo_campaign(session) -> Campaign:
    campaign = session.scalar(select(Campaign).where(Campaign.name == MANUAL_DEMO_CAMPAIGN))
    if campaign is None:
        campaign = Campaign(
            name=MANUAL_DEMO_CAMPAIGN,
            site="manual-demo",
            landing_url="https://localhost/pinterest-demo",
            category="manual-demo",
            objective="Explicit one-pin demo. The scheduler does not publish these pins.",
            status="paused",
        )
        session.add(campaign)
        session.flush()
    campaign.status = "paused"
    return campaign


def _insert_pin(
    spec: dict,
    *,
    image_path: Path,
    board_name: str,
    status: str,
    scheduled_at: dt.datetime | None,
    remote_id: str,
) -> int:
    with get_session() as session:
        campaign = _demo_campaign(session)
        concept = PinConcept(
            campaign_id=campaign.id,
            headline=spec["title"],
            description=spec["description"],
            landing_url=spec["link"],
            board_id=board_name,
            status="ready",
        )
        session.add(concept)
        session.flush()
        pin = Pin(
            concept_id=concept.id,
            pinterest_pin_id=remote_id,
            image_path=str(image_path),
            board_id=spec["board_id"],
            destination_url=spec["link"],
            scheduled_at=scheduled_at,
            published_at=dt.datetime.now(dt.timezone.utc) if status == "published" else None,
            status=status,
        )
        session.add(pin)
        session.commit()
        return pin.id


def _restore_hold(local_id: int) -> None:
    with get_session() as session:
        session.execute(
            update(Pin)
            .where(Pin.id == local_id, Pin.status == MANUAL_PUBLISHING_STATUS)
            .values(status=MANUAL_HOLD_STATUS)
        )
        session.commit()


def _pin_url(remote_id: str) -> str:
    if _REMOTE_PIN_ID.fullmatch(remote_id):
        return f"https://www.pinterest.com/pin/{remote_id}/"
    return ""


@single_publisher
def _publish_new_pin(spec: dict, image_path: Path, client: PinterestClient | None) -> dict:
    api = client or PinterestClient()
    board = _matching_board(api, spec["board_id"])
    safe_image = _assert_image_in_assets(image_path)
    try:
        response = api.create_pin(
            board_id=spec["board_id"],
            title=spec["title"],
            description=spec["description"],
            link=spec["link"],
            image_path=safe_image,
            alt_text=spec["title"],
        )
    except PinterestAPIError:
        logger.warning("Pinterest rejected a manual demo pin")
        raise DemoPinError("Pinterest rejected the pin. Nothing else was published.") from None
    remote_id = str(response.get("id") or "")
    if not remote_id:
        raise DemoPinError("Pinterest did not return a pin id. Check the board before trying again.")
    try:
        local_id = _insert_pin(
            spec,
            image_path=safe_image,
            board_name=board["name"],
            status="published",
            scheduled_at=None,
            remote_id=remote_id,
        )
    except Exception:
        logger.error("Pinterest pin %s was created but the local record failed", remote_id)
        local_id = None
    logger.info("Created one Pinterest pin %s", remote_id)
    return {
        "kind": "created",
        "pin_id": remote_id,
        "board_name": board["name"],
        "pin_url": _pin_url(remote_id),
        "local_id": local_id,
        "sent_to_pinterest": True,
    }


@single_publisher
def _publish_held_locked(local_id: int, client: PinterestClient | None) -> dict:
    with get_session() as session:
        pin = session.get(Pin, local_id)
        concept = session.get(PinConcept, pin.concept_id) if pin is not None else None
        campaign = session.get(Campaign, concept.campaign_id) if concept is not None else None
        if (
            pin is None
            or concept is None
            or campaign is None
            or campaign.name != MANUAL_DEMO_CAMPAIGN
            or pin.status != MANUAL_HOLD_STATUS
        ):
            raise DemoPinError("That scheduled pin is not waiting for a manual publish. Nothing was sent.")
        image_path = _assert_image_in_assets(Path(pin.image_path))
        spec = {
            "board_id": pin.board_id,
            "title": concept.headline,
            "description": concept.description,
            "link": pin.destination_url,
        }
        board_name = concept.board_id
        claimed = session.execute(
            update(Pin)
            .where(Pin.id == pin.id, Pin.status == MANUAL_HOLD_STATUS)
            .values(status=MANUAL_PUBLISHING_STATUS)
        )
        session.commit()
        if claimed.rowcount != 1:
            raise DemoPinError("That scheduled pin is not waiting for a manual publish. Nothing was sent.")
    api = client or PinterestClient()
    try:
        response = api.create_pin(
            board_id=spec["board_id"],
            title=spec["title"],
            description=spec["description"],
            link=spec["link"],
            image_path=image_path,
            alt_text=spec["title"],
        )
    except PinterestAPIError:
        _restore_hold(local_id)
        logger.warning("Pinterest rejected a manually published scheduled pin")
        raise DemoPinError(
            "Pinterest rejected the pin. It is still scheduled locally and was not published."
        ) from None
    remote_id = str(response.get("id") or "")
    if not remote_id:
        _restore_hold(local_id)
        raise DemoPinError("Pinterest did not return a pin id. The pin is still scheduled locally.")
    with get_session() as session:
        pin = session.get(Pin, local_id)
        pin.pinterest_pin_id = remote_id
        pin.status = "published"
        pin.published_at = dt.datetime.now(dt.timezone.utc)
        pin.last_error = ""
        session.commit()
    logger.info("Published one scheduled demo pin %s", remote_id)
    return {
        "kind": "published_held",
        "pin_id": remote_id,
        "board_name": board_name,
        "pin_url": _pin_url(remote_id),
        "local_id": local_id,
        "sent_to_pinterest": True,
    }


def _as_utc(value: dt.datetime) -> dt.datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=dt.timezone.utc)
    return value.astimezone(dt.timezone.utc)
