"""Queue depth tracking. The spec's rule: never let the publish queue run
dry. MIN_QUEUE_DAYS/TARGET_QUEUE_DAYS come from settings (env-configurable);
queue depth in "days" is simply queued pins divided by the daily target."""
from __future__ import annotations

from sqlalchemy import func, select

from app.config import settings
from app.db import Pin, get_session


def queued_pin_count() -> int:
    with get_session() as session:
        return session.execute(
            select(func.count(Pin.id)).where(Pin.status.in_(["queued", "scheduled"]))
        ).scalar_one()


def queue_days_remaining(daily_target: int | None = None) -> float:
    daily_target = daily_target or settings.daily_pin_target
    if daily_target <= 0:
        return float("inf")
    return queued_pin_count() / daily_target


def needs_generation() -> bool:
    return queue_days_remaining() < settings.min_queue_days


def queue_status() -> dict:
    days = queue_days_remaining()
    return {
        "queued_pins": queued_pin_count(),
        "queue_days_remaining": round(days, 1) if days != float("inf") else None,
        "min_queue_days": settings.min_queue_days,
        "target_queue_days": settings.target_queue_days,
        "needs_generation": needs_generation(),
        "daily_pin_target": settings.daily_pin_target,
    }
