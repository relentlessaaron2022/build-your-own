"""Read-only readiness reporting and a scheduler-owned heartbeat. No secrets in output."""
from __future__ import annotations

import datetime as dt
import json
import os
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlalchemy import func, select

from app.config import DATA_DIR, load_boards, load_offers, load_social_accounts, settings
from app.db import Campaign, Pin, PinConcept, get_session, init_db

HEARTBEAT_PATH = DATA_DIR / "scheduler-heartbeat.json"


def record_job_result(name: str, result: dict | None = None, *, failed: bool = False) -> None:
    path = DATA_DIR / f"job-{name}.json"
    temp = path.with_suffix(f".{os.getpid()}.tmp")
    temp.write_text(json.dumps({
        "finished_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "status": "error" if failed or (result or {}).get("errors") else ("skipped" if (result or {}).get("skipped") else "completed"),
        "reason": (result or {}).get("reason"),
        "counts": {key: (result or {})[key] for key in ("published", "failed", "retried", "skipped_no_board", "errors") if key in (result or {})},
    }))
    temp.replace(path)


def record_heartbeat() -> None:
    temporary = HEARTBEAT_PATH.with_suffix(f".{os.getpid()}.tmp")
    temporary.write_text(json.dumps({"at": dt.datetime.now(dt.timezone.utc).isoformat(), "pid": os.getpid()}))
    temporary.replace(HEARTBEAT_PATH)


def health_report() -> dict:
    init_db()
    blockers = []
    if not settings.pinterest_credentials_present:
        blockers.append("Pinterest credentials are missing")
    offers = [o for o in load_offers() if o.get("active", True)]
    if not offers:
        blockers.append("No active offers are configured")
    boards = load_boards()
    for offer in offers:
        matching = [b for b in boards if b.get("category") == offer.get("category")]
        if not matching or any(not b.get("pinterest_board_id") for b in matching):
            blockers.append(f"Offer {offer['id']} needs synced boards in its category")
    if settings.daily_pin_target <= 0:
        blockers.append("DAILY_PIN_TARGET must be positive to publish")
    try:
        ZoneInfo(settings.scheduler_timezone)
    except (ZoneInfoNotFoundError, ValueError):
        blockers.append("SCHEDULER_TIMEZONE is invalid")
    heartbeat = None
    try:
        heartbeat = json.loads(HEARTBEAT_PATH.read_text())
        age = (dt.datetime.now(dt.timezone.utc) - dt.datetime.fromisoformat(heartbeat["at"])).total_seconds()
        fresh = 0 <= age <= 120
    except (OSError, ValueError, TypeError, KeyError):
        fresh = False
    with get_session() as session:
        in_flight = session.scalar(select(func.count(Pin.id)).where(Pin.status == "publishing"))
        failed = session.scalar(select(func.count(Pin.id)).where(Pin.status == "failed"))
        queued_boards = set(session.scalars(select(Pin.board_id).join(PinConcept).join(Campaign)
                                           .where(Pin.status.in_(["queued", "scheduled"]), Campaign.status == "active")))
    # Disabled product pins are retained as history but cannot block readiness.
    from app.promotion import active_pin_query
    with get_session() as session:
        queued_boards = set(session.scalars(select(Pin.board_id).where(Pin.id.in_(active_pin_query()))))
    for name in sorted(queued_boards):
        if not any(b.get("name") == name and b.get("pinterest_board_id") for b in boards):
            blockers.append(f"Queued pins need board mapping: {name}")
    job_results = {}
    for path in DATA_DIR.glob("job-*.json"):
        try:
            job_results[path.stem.removeprefix("job-")] = json.loads(path.read_text())
        except (OSError, ValueError):
            job_results[path.stem] = {"status": "unreadable"}
    return {
        "ready": not blockers,
        "blockers": blockers,
        "scheduler_heartbeat_fresh": fresh,
        "scheduler_heartbeat": heartbeat,
        "in_flight_pins": in_flight,
        "failed_pins": failed,
        "last_job_results": job_results,
        "social_connections": [{"account": account["id"], "platform": account["platform"],
                                "enabled": account.get("enabled", False),
                                "account_id_configured": bool(account.get("account_id")),
                                "token_configured": bool(os.getenv(account.get("token_env") or "")) if account["platform"] != "youtube" else None}
                               for account in load_social_accounts()],
        "active_offers": [o["id"] for o in offers],
        "timezone": settings.scheduler_timezone,
        "note": "A fresh heartbeat proves scheduler liveness only. Confirm write authorization and a real pin ID separately. Inspect in-flight pins after a crash before requeueing.",
    }
