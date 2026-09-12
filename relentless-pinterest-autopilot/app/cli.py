"""Manual CLI commands, per the spec: pause, resume, status, queue,
generate, publish-test, report. A few operational extras (init-db,
discover, sync-boards, run, dashboard) are included since they're needed
to actually operate the system end-to-end.

Entry point: `pinterest <command>` once the package is installed
(`pip install -e .`), or `python -m app.cli <command>` otherwise.
"""
from __future__ import annotations

import json

import click

from app import state
from app.config import settings


@click.group()
def cli():
    """Relentless Pinterest Autopilot control CLI."""


@cli.command()
def init_db():
    """Create database tables if they don't exist yet."""
    from app.db import init_db as _init_db

    _init_db()
    click.echo("Database initialized.")


@cli.command()
def pause():
    """Stop publishing immediately (generation and analytics keep running)."""
    state.pause_publishing()
    click.echo("Publishing paused. Generation and analytics continue.")


@cli.command()
def resume():
    """Resume publishing."""
    state.resume_publishing()
    click.echo("Publishing resumed.")


@cli.command()
def status():
    """Show kill-switch state, Pinterest connectivity, and queue depth."""
    from app.queue_manager import queue_status

    click.echo("== Kill switches ==")
    click.echo(json.dumps(state.get_state(), indent=2))

    click.echo("\n== Queue ==")
    click.echo(json.dumps(queue_status(), indent=2))

    click.echo("\n== Pinterest credentials ==")
    if not settings.pinterest_credentials_present:
        click.echo("NOT CONFIGURED. Set PINTEREST_CLIENT_ID, PINTEREST_CLIENT_SECRET, "
                    "and PINTEREST_REFRESH_TOKEN in .env.")
    else:
        from app.pinterest.client import PinterestAPIError, PinterestClient

        try:
            account = PinterestClient().test_connection()
            click.echo(f"Connected as: {account.get('username', '(unknown)')}")
        except PinterestAPIError as exc:
            click.echo(f"Credentials present but connection failed: {exc}")


@cli.command()
def queue():
    """List queue depth and the next few queued pins."""
    from sqlalchemy import select

    from app.db import Pin, PinConcept, get_session
    from app.queue_manager import queue_status

    click.echo(json.dumps(queue_status(), indent=2))

    with get_session() as session:
        rows = session.execute(
            select(Pin.id, PinConcept.headline, Pin.status, Pin.scheduled_at)
            .join(PinConcept, Pin.concept_id == PinConcept.id)
            .where(Pin.status.in_(["queued", "scheduled"]))
            .order_by(Pin.created_at.asc())
            .limit(20)
        ).all()

    click.echo("\nNext queued pins:")
    for pin_id, headline, pin_status, scheduled_at in rows:
        click.echo(f"  #{pin_id} [{pin_status}] {headline} (scheduled_at={scheduled_at})")


@cli.command()
@click.option("--force", is_flag=True, help="Generate even if GENERATION_ENABLED=false.")
def generate(force: bool):
    """Manually trigger a generation cycle (5x5 campaigns -> queued pins)."""
    from app.scheduler.jobs import generation_job

    result = generation_job(force=force)
    click.echo(json.dumps(result, indent=2, default=str))


@cli.command()
@click.option("--concept-id", type=int, default=None, help="Publish a specific concept's queued pin.")
def publish_test(concept_id: int | None):
    """Publish exactly ONE queued pin right now through the official
    Pinterest API. This is Phase 1's success milestone."""
    from app.scheduler.jobs import publish_one_test_pin

    result = publish_one_test_pin(concept_id=concept_id)
    click.echo(json.dumps(result, indent=2, default=str))
    if not result.get("success"):
        raise SystemExit(1)


@cli.command()
def publish():
    """Run one full publish_job pass (normally invoked by the scheduler)."""
    from app.scheduler.jobs import publish_job

    click.echo(json.dumps(publish_job(), indent=2, default=str))


@cli.command()
@click.option("--days", default=7, help="Lookback window in days.")
def report(days: int):
    """Print (and save) the weekly performance report."""
    from app.reporting.weekly import format_report_markdown, generate_weekly_report, save_weekly_report

    data = generate_weekly_report(days=days)
    click.echo(format_report_markdown(data))
    path = save_weekly_report(data)
    click.echo(f"Saved to {path}")


@cli.command()
def discover():
    """Run content discovery across all configured sites."""
    from app.scheduler.jobs import discovery_job

    click.echo(json.dumps(discovery_job(), indent=2, default=str))


@cli.command()
@click.option("--create-missing", is_flag=True, help="Create boards on Pinterest that don't already exist.")
def sync_boards(create_missing: bool):
    """Match config/boards.json against live Pinterest boards."""
    from app.pinterest.boards import sync_boards as _sync
    from app.pinterest.client import CredentialsMissingError, PinterestAPIError

    try:
        boards = _sync(create_missing=create_missing)
    except CredentialsMissingError as exc:
        click.echo(json.dumps({"success": False, "reason": "missing_credentials", "detail": str(exc)}, indent=2))
        raise SystemExit(1)
    except PinterestAPIError as exc:
        click.echo(json.dumps({"success": False, "reason": "api_error", "detail": str(exc)}, indent=2))
        raise SystemExit(1)

    click.echo(json.dumps(boards, indent=2))


@cli.command()
def analytics():
    """Run one analytics_job pass (ingest + winner/loser evaluation)."""
    from app.scheduler.jobs import analytics_job

    click.echo(json.dumps(analytics_job(), indent=2, default=str))


@cli.command()
def optimize():
    """Run one optimization_job pass (winner recycling)."""
    from app.scheduler.jobs import optimization_job

    click.echo(json.dumps(optimization_job(), indent=2, default=str))


@cli.command()
def run():
    """Start the continuous scheduler (discovery/generation/publish/
    analytics/optimization/weekly jobs). Runs until interrupted."""
    from app.scheduler.runner import run_forever

    run_forever()


@cli.command()
@click.option("--port", default=5151)
def dashboard(port: int):
    """Start the local dashboard web server."""
    from app.reporting.dashboard import run_dashboard

    run_dashboard(port=port)


if __name__ == "__main__":
    cli()
