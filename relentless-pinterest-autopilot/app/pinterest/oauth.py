"""Local Pinterest OAuth (authorization code) for the connect demo.

The redirect URI registered on the Pinterest app must be exactly
http://localhost:8085/pinterest/callback unless PINTEREST_REDIRECT_URI
overrides it. Only http://localhost and http://127.0.0.1 are accepted.

Tokens are written into the gitignored .env file, which is how this app
already stores PINTEREST_ACCESS_TOKEN and PINTEREST_REFRESH_TOKEN. Token
values are never logged.
"""
from __future__ import annotations

import base64
import hmac
import json
import os
import re
import secrets
import time
from pathlib import Path
from urllib.parse import urlencode, urlparse

import requests

from app.config import DATA_DIR, PROJECT_ROOT, settings
from app.logging_config import get_logger

logger = get_logger(__name__)

DEFAULT_REDIRECT_URI = "http://localhost:8085/pinterest/callback"
AUTHORIZE_URL = "https://www.pinterest.com/oauth/"
TOKEN_URL = "https://api.pinterest.com/v5/oauth/token"
OAUTH_SCOPES = (
    "boards:read",
    "boards:write",
    "pins:read",
    "pins:write",
    "user_accounts:read",
)
_STATE_TTL_SECONDS = 600
_SAFE_ENV_VALUE = re.compile(r"[A-Za-z0-9_./+=:@-]+")
_CODE_IN_TEXT = re.compile(r"(code=)[^&\s\"']+")
_TOKEN_IN_TEXT = re.compile(r"((?:access_token|refresh_token|client_secret)=)[^&\s\"']+", re.IGNORECASE)
_PIN_TOKEN = re.compile(r"(pina_|pinr_|pinc_)[A-Za-z0-9._\-]+")
_ASSIGNMENT = re.compile(r"^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=")


class OAuthError(Exception):
    """Operator-facing OAuth failure. The message must not contain secrets."""


class OAuthConfigError(OAuthError):
    pass


class OAuthStateError(OAuthError):
    pass


class OAuthExchangeError(OAuthError):
    pass


def redact_secrets(text: str) -> str:
    text = _CODE_IN_TEXT.sub(r"\1[redacted]", text)
    text = _TOKEN_IN_TEXT.sub(r"\1[redacted]", text)
    return _PIN_TOKEN.sub("[redacted]", text)


def oauth_state_file() -> Path:
    return DATA_DIR / "oauth-state.json"


def token_env_path() -> Path:
    return PROJECT_ROOT / ".env"


def missing_app_settings() -> list[str]:
    missing = []
    if not settings.pinterest_client_id:
        missing.append("PINTEREST_APP_ID")
    if not settings.pinterest_client_secret:
        missing.append("PINTEREST_APP_SECRET")
    return missing


def require_app_credentials() -> None:
    missing = missing_app_settings()
    if not missing:
        return
    names = []
    if "PINTEREST_APP_ID" in missing:
        names.append("PINTEREST_APP_ID (or PINTEREST_CLIENT_ID)")
    if "PINTEREST_APP_SECRET" in missing:
        names.append("PINTEREST_APP_SECRET (or PINTEREST_CLIENT_SECRET)")
    raise OAuthConfigError(
        "Add " + " and ".join(names) + " to .env before connecting. The secret is never shown or committed."
    )


def validate_redirect_uri(uri: str):
    parsed = urlparse(uri)
    host = (parsed.hostname or "").lower()
    if parsed.scheme != "http" or host not in {"localhost", "127.0.0.1"}:
        raise OAuthConfigError(
            "PINTEREST_REDIRECT_URI must be an http://localhost or http://127.0.0.1 URL. "
            f"The default is {DEFAULT_REDIRECT_URI}."
        )
    if parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise OAuthConfigError("The redirect URI cannot include a user, query, or fragment.")
    if parsed.port is None:
        raise OAuthConfigError("The redirect URI must include a port, for example :8085.")
    path = parsed.path or ""
    if path in {"", "/"} or path in {"/pinterest/login", "/pinterest/pin"}:
        raise OAuthConfigError("The redirect URI needs its own callback path.")
    return parsed


def require_local_redirect_uri() -> str:
    uri = (settings.pinterest_redirect_uri or DEFAULT_REDIRECT_URI).strip()
    validate_redirect_uri(uri)
    return uri


def build_authorize_url(*, client_id: str, redirect_uri: str, state: str) -> str:
    query = urlencode(
        {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": ",".join(OAUTH_SCOPES),
            "state": state,
        }
    )
    return f"{AUTHORIZE_URL}?{query}"


def begin_authorization() -> str:
    """Persist a one-time state value and return Pinterest's authorize URL."""
    require_app_credentials()
    redirect_uri = require_local_redirect_uri()
    state = secrets.token_urlsafe(32)
    _write_json(oauth_state_file(), {"state": state, "expires": time.time() + _STATE_TTL_SECONDS})
    return build_authorize_url(
        client_id=settings.pinterest_client_id,
        redirect_uri=redirect_uri,
        state=state,
    )


def complete_authorization(code: str, state: str) -> None:
    """Validate state, exchange the code, and store tokens in .env."""
    _consume_state(state)
    store_tokens(exchange_authorization_code(code))
    logger.info("Pinterest account connected. Tokens stored in .env.")


def exchange_authorization_code(code: str) -> dict:
    require_app_credentials()
    redirect_uri = require_local_redirect_uri()
    if not code or len(code) > 2048 or "\n" in code or "\r" in code:
        raise OAuthExchangeError("Pinterest did not return a usable authorization code.")
    basic = base64.b64encode(
        f"{settings.pinterest_client_id}:{settings.pinterest_client_secret}".encode()
    ).decode()
    try:
        response = requests.post(
            TOKEN_URL,
            headers={
                "Authorization": f"Basic {basic}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri,
            },
            timeout=30,
        )
    except requests.RequestException:
        logger.warning("Pinterest token endpoint was unreachable")
        raise OAuthExchangeError("Could not reach Pinterest to finish sign-in.") from None
    if response.status_code >= 400:
        logger.warning("Pinterest token exchange failed with status %s", response.status_code)
        raise OAuthExchangeError(f"Pinterest token exchange failed ({response.status_code}).")
    try:
        payload = response.json()
    except ValueError:
        raise OAuthExchangeError("Pinterest token exchange returned an unreadable response.") from None
    if not isinstance(payload, dict) or not str(payload.get("access_token") or "").strip():
        raise OAuthExchangeError("Pinterest did not return an access token.")
    return payload


def store_tokens(payload: dict, *, env_path: Path | None = None) -> None:
    access = str(payload.get("access_token") or "").strip()
    refresh = str(payload.get("refresh_token") or "").strip()
    if not access:
        raise OAuthExchangeError("Pinterest did not return an access token.")
    _reject_unsafe_token(access)
    if refresh:
        _reject_unsafe_token(refresh)
    path = (env_path or token_env_path()).expanduser().resolve()
    if path.name != ".env":
        raise OAuthConfigError("Refusing to store Pinterest tokens outside a .env file.")
    updates = {"PINTEREST_ACCESS_TOKEN": access}
    if refresh:
        updates["PINTEREST_REFRESH_TOKEN"] = refresh
    _upsert_env(path, updates)
    settings.pinterest_access_token = access
    os.environ["PINTEREST_ACCESS_TOKEN"] = access
    if refresh:
        settings.pinterest_refresh_token = refresh
        os.environ["PINTEREST_REFRESH_TOKEN"] = refresh
    logger.info("Stored Pinterest OAuth tokens in .env")


def write_private_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            handle.write(text)
            handle.flush()
            os.fsync(handle.fileno())
    except Exception:
        temporary.unlink(missing_ok=True)
        raise
    os.chmod(temporary, 0o600)
    os.replace(temporary, path)
    os.chmod(path, 0o600)


def _write_json(path: Path, payload: dict) -> None:
    write_private_text(path, json.dumps(payload))


def _consume_state(state: str) -> None:
    path = oauth_state_file()
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        raise OAuthStateError("This sign-in session expired. Click Connect Pinterest account again.") from None
    expected = str(payload.get("state") or "")
    try:
        expires = float(payload.get("expires") or 0)
    except (TypeError, ValueError):
        expires = 0
    mismatch = (
        not state
        or not expected
        or len(state) > 256
        or len(state) != len(expected)
        or not hmac.compare_digest(state, expected)
        or expires < time.time()
    )
    if mismatch:
        raise OAuthStateError(
            "Pinterest returned a sign-in check that does not match. Click Connect Pinterest account again."
        )
    path.unlink(missing_ok=True)


def _reject_unsafe_token(value: str) -> None:
    if any(character in value for character in "\n\r\x00"):
        raise OAuthExchangeError("Pinterest returned a token that cannot be stored safely.")


def _format_env_value(value: str) -> str:
    if _SAFE_ENV_VALUE.fullmatch(value):
        return value
    escaped = value.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"'


def _upsert_env(path: Path, updates: dict[str, str]) -> None:
    existing = path.read_text(encoding="utf-8") if path.exists() else ""
    lines = existing.splitlines()
    seen: set[str] = set()
    rewritten: list[str] = []
    for line in lines:
        match = _ASSIGNMENT.match(line)
        key = match.group(1) if match else ""
        if key in updates:
            rewritten.append(f"{key}={_format_env_value(updates[key])}")
            seen.add(key)
        else:
            rewritten.append(line)
    for key, value in updates.items():
        if key not in seen:
            rewritten.append(f"{key}={_format_env_value(value)}")
    text = "\n".join(rewritten)
    if text and not text.endswith("\n"):
        text += "\n"
    write_private_text(path, text)
