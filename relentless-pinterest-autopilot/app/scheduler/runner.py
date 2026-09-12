"""Continuous scheduler process. Run with `python scripts/run_scheduler.py`
or `pinterest run`. Job cadence follows the spec exactly:

    discovery_job         every 6 hours
    generation_job        every 6 hours
    publish_job           spaced through the day (8/11/14/17/20) instead of
                           a blind hourly loop, so publishing never bursts
    analytics_job         once daily
    optimization_job      once daily
    weekly_strategy_job   once weekly

The scheduler never exits because it "ran out of content" -- generation_job
always tops the queue back up (queue_manager.needs_generation) before
publish_job can drain it below MIN_QUEUE_DAYS.
"""
from __future__ import annotations

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from app.db import init_db
from app.logging_config import get_logger
from app.scheduler.jobs import (
    analytics_job,
    discovery_job,
    generation_job,
    optimization_job,
    publish_job,
    weekly_strategy_job,
)

logger = get_logger(__name__)

PUBLISH_HOURS = "8,11,14,17,20"


def _wrap(job_fn):
    def _run():
        try:
            result = job_fn()
            logger.info("%s completed: %s", job_fn.__name__, result)
        except Exception:  # noqa: BLE001 - a single bad job must never kill the scheduler
            logger.exception("%s raised an unhandled exception", job_fn.__name__)

    _run.__name__ = job_fn.__name__
    return _run


def build_scheduler() -> BlockingScheduler:
    init_db()
    scheduler = BlockingScheduler(timezone="UTC")

    scheduler.add_job(_wrap(discovery_job), IntervalTrigger(hours=6), id="discovery_job")
    scheduler.add_job(_wrap(generation_job), IntervalTrigger(hours=6), id="generation_job")
    scheduler.add_job(_wrap(publish_job), CronTrigger(hour=PUBLISH_HOURS, minute=0), id="publish_job")
    scheduler.add_job(_wrap(analytics_job), CronTrigger(hour=6, minute=30), id="analytics_job")
    scheduler.add_job(_wrap(optimization_job), CronTrigger(hour=7, minute=0), id="optimization_job")
    scheduler.add_job(_wrap(weekly_strategy_job), CronTrigger(day_of_week="mon", hour=7, minute=30), id="weekly_strategy_job")

    return scheduler


def run_forever() -> None:
    scheduler = build_scheduler()
    logger.info("Relentless Pinterest Autopilot scheduler starting. Jobs: %s", [j.id for j in scheduler.get_jobs()])
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Scheduler stopped.")
