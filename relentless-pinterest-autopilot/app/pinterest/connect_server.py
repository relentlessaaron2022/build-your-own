"""Local web page for the Pinterest OAuth demo.

Run with `pinterest connect`. The process binds to 127.0.0.1 only.
Signing in does not publish a pin.
"""
from __future__ import annotations

import hmac
import json
import logging
import re
import secrets
import time
import webbrowser
from pathlib import Path
from urllib.parse import urlparse

import click
from flask import Flask, redirect, render_template, request
from werkzeug.exceptions import HTTPException

from app.config import DATA_DIR, settings
from app.db import init_db
from app.logging_config import get_logger
from app.pinterest.client import PinterestAPIError, PinterestClient
from app.pinterest.demo_pin import (
    DemoPinError,
    create_demo_pin,
    list_held_pins,
    parse_schedule_time,
    publish_held_pin,
    schedule_demo_pin,
)
from app.pinterest.oauth import (
    OAUTH_SCOPES,
    OAuthError,
    begin_authorization,
    complete_authorization,
    missing_app_settings,
    redact_secrets,
    require_local_redirect_uri,
    validate_redirect_uri,
    write_private_text,
)

logger = get_logger(__name__)

_BOARD_ID = re.compile(r"[A-Za-z0-9_-]{1,64}")
_FORM_TTL_SECONDS = 3600


class RedactOAuthLogFilter(logging.Filter):
    """Strip authorization codes and token values from log lines."""

    def filter(self, record: logging.LogRecord) -> bool:
        message = record.getMessage()
        redacted = redact_secrets(message)
        if redacted != message:
            record.msg = redacted
            record.args = ()
        return True


def install_log_filter() -> None:
    redactor = RedactOAuthLogFilter()
    for name in (
        "werkzeug",
        "app.pinterest",
        "app.pinterest.oauth",
        "app.pinterest.connect_server",
        "app.pinterest.demo_pin",
    ):
        target = logging.getLogger(name)
        if not any(isinstance(existing, RedactOAuthLogFilter) for existing in target.filters):
            target.addFilter(redactor)


def form_token_file() -> Path:
    return DATA_DIR / "connect-form-tokens.json"


def listen_address(redirect_uri: str) -> tuple[str, int]:
    """Bind the demo on loopback even when the redirect host is `localhost`."""
    parsed = validate_redirect_uri(redirect_uri)
    return "127.0.0.1", int(parsed.port)


def issue_form_token() -> str:
    token = secrets.token_urlsafe(32)
    now = time.time()
    tokens = [item for item in _read_form_tokens() if _expires(item) > now]
    tokens.append({"token": token, "expires": now + _FORM_TTL_SECONDS})
    _write_form_tokens(tokens[-40:])
    return token


def consume_form_token(token: str) -> bool:
    if not token or len(token) > 256:
        return False
    now = time.time()
    keep = []
    found = False
    for item in _read_form_tokens():
        stored = str(item.get("token") or "")
        if _expires(item) <= now:
            continue
        if not found and len(stored) == len(token) and hmac.compare_digest(stored, token):
            found = True
            continue
        keep.append({"token": stored, "expires": _expires(item)})
    _write_form_tokens(keep)
    return found


def public_account(raw: dict) -> dict:
    website = str(raw.get("website_url") or "")
    parsed = urlparse(website)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        website = ""
    return {
        "username": str(raw.get("username") or "").strip(),
        "account_type": str(raw.get("account_type") or "").strip(),
        "profile_image": _https_url(str(raw.get("profile_image") or "")),
        "website_url": website,
    }


def public_boards(raw_boards: list) -> list[dict]:
    choices = []
    for board in raw_boards or []:
        board_id = str(board.get("id") or "")
        if not _BOARD_ID.fullmatch(board_id):
            continue
        name = str(board.get("name") or board_id).strip() or board_id
        choices.append({"id": board_id, "name": name})
    return choices


def create_app(*, client_factory=None) -> Flask:
    redirect_uri = require_local_redirect_uri()
    callback_path = urlparse(redirect_uri).path
    init_db()
    install_log_filter()
    app = Flask(
        __name__,
        template_folder=str(Path(__file__).resolve().parent / "templates"),
    )
    app.config["MAX_CONTENT_LENGTH"] = 9 * 1024 * 1024

    def make_client():
        if client_factory is not None:
            return client_factory()
        return PinterestClient()

    def build_context() -> dict:
        account = None
        account_error = ""
        boards: list[dict] = []
        boards_error = ""
        if settings.pinterest_credentials_present:
            try:
                client = make_client()
                account = public_account(client.test_connection())
                try:
                    boards = public_boards(client.list_boards())
                except PinterestAPIError:
                    logger.warning("Pinterest board list failed")
                    boards_error = "Could not load boards. Nothing was sent to Pinterest."
            except Exception as exc:
                logger.error("Pinterest account read failed (%s)", type(exc).__name__)
                account = None
                account_error = (
                    "Saved credentials could not read the Pinterest account. "
                    "Reconnect to replace them. Nothing was sent to Pinterest."
                )
        try:
            held = list_held_pins()
        except Exception as exc:
            logger.error("Could not list scheduled demo pins (%s)", type(exc).__name__)
            held = []
        for pin in held:
            pin["form_token"] = issue_form_token()
        missing = missing_app_settings()
        return {
            "redirect_uri": redirect_uri,
            "scopes": list(OAUTH_SCOPES),
            "app_id": settings.pinterest_client_id,
            "missing": missing,
            "app_ready": not missing,
            "account": account,
            "account_error": account_error,
            "boards": boards,
            "boards_error": boards_error,
            "held_pins": held,
            "connect_token": issue_form_token() if not missing else "",
            "pin_token": issue_form_token() if account and boards else "",
            "timezone_name": settings.scheduler_timezone,
            "banner": "",
            "error": "",
            "result": None,
        }

    def page(*, banner: str = "", error: str = "", result: dict | None = None) -> str:
        try:
            context = build_context()
            context["banner"] = banner
            context["error"] = error
            context["result"] = result
            return render_template("connect.html", **context)
        except Exception:
            logger.error("Demo page render failed")
            return "The demo page could not be shown. Nothing was published."

    @app.before_request
    def local_host_only():
        host = (request.host or "").split(":")[0].lower()
        if host not in {"localhost", "127.0.0.1"}:
            return "This demo only accepts localhost.", 403
        return None

    @app.after_request
    def no_store(response):
        response.headers["Cache-Control"] = "no-store"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response

    @app.get("/")
    def home():
        banner = ""
        if request.args.get("connected") == "1":
            banner = "Pinterest account connected. No pin was published."
        return page(banner=banner)

    @app.post("/pinterest/login")
    def login():
        if not consume_form_token(request.form.get("form_token", "")):
            return page(error="This form expired. Reload the page and click Connect Pinterest account again."), 400
        try:
            authorize_url = begin_authorization()
        except OAuthError as exc:
            return page(error=str(exc)), 400
        return redirect(authorize_url)

    @app.get(callback_path)
    def pinterest_callback():
        if request.args.get("error"):
            return page(error="Pinterest did not authorize the connection. No pin was published."), 400
        try:
            complete_authorization(request.args.get("code", ""), request.args.get("state", ""))
        except OAuthError as exc:
            return page(error=str(exc)), 400
        return redirect("/?connected=1", code=303)

    @app.post("/pinterest/pin")
    def pin_action():
        if not consume_form_token(request.form.get("form_token", "")):
            return page(error="This form expired. Reload the page and press the button again. Nothing was sent."), 400
        action = request.form.get("action", "")
        client = make_client()
        try:
            if action == "create":
                result = create_demo_pin(
                    board_id=request.form.get("board_id", ""),
                    title=request.form.get("title", ""),
                    description=request.form.get("description", ""),
                    link=request.form.get("link", ""),
                    image_bytes=_uploaded_image(),
                    use_sample=request.form.get("use_sample") == "yes",
                    client=client,
                )
            elif action == "schedule":
                result = schedule_demo_pin(
                    board_id=request.form.get("board_id", ""),
                    title=request.form.get("title", ""),
                    description=request.form.get("description", ""),
                    link=request.form.get("link", ""),
                    image_bytes=_uploaded_image(),
                    use_sample=request.form.get("use_sample") == "yes",
                    publish_at=parse_schedule_time(request.form.get("publish_at", "")),
                    client=client,
                )
            elif action == "publish_held":
                raw_id = request.form.get("local_id", "")
                if not raw_id.isdigit() or len(raw_id) > 12:
                    raise DemoPinError("That scheduled pin could not be found. Nothing was sent.")
                result = publish_held_pin(int(raw_id), client=client)
            else:
                return page(
                    error="Choose Create this pin now or Schedule this pin. Nothing was sent to Pinterest."
                ), 400
        except DemoPinError as exc:
            return page(error=str(exc)), 400
        return page(result=result)

    @app.get("/favicon.ico")
    def favicon():
        return "", 204

    @app.errorhandler(Exception)
    def on_error(exc: Exception):
        if isinstance(exc, HTTPException):
            return exc
        logger.error("Demo page failed (%s)", type(exc).__name__)
        return page(error="Something went wrong before a pin was sent. Nothing was published."), 500

    return app


def run_connect_server(*, open_browser: bool = True) -> None:
    redirect_uri = require_local_redirect_uri()
    host, port = listen_address(redirect_uri)
    origin = f"http://{urlparse(redirect_uri).hostname}:{port}/"
    click.echo(f"Local demo: {origin}")
    click.echo(f"Redirect URI (register this exact value on the Pinterest app): {redirect_uri}")
    click.echo("Signing in does not publish a pin. Press Ctrl+C to stop.")
    if open_browser:
        try:
            opened = webbrowser.open(origin)
        except Exception:
            opened = False
        if not opened:
            click.echo("Could not open a browser automatically. Open the local demo URL yourself.")
    try:
        create_app().run(host=host, port=port, debug=False, use_reloader=False, threaded=False)
    except OSError as exc:
        raise SystemExit(f"Could not listen on {host}:{port}: {exc}") from exc


def _uploaded_image() -> bytes | None:
    upload = request.files.get("image")
    if upload is None or not upload.filename:
        return None
    return upload.read()


def _https_url(value: str) -> str:
    parsed = urlparse(value)
    if parsed.scheme == "https" and parsed.netloc:
        return value
    return ""


def _read_form_tokens() -> list[dict]:
    path = form_token_file()
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return []
    if not isinstance(payload, list):
        return []
    return [item for item in payload if isinstance(item, dict)]


def _write_form_tokens(tokens: list[dict]) -> None:
    write_private_text(form_token_file(), json.dumps(tokens))


def _expires(item: dict) -> float:
    try:
        return float(item.get("expires") or 0)
    except (TypeError, ValueError):
        return 0


if __name__ == "__main__":
    run_connect_server()
