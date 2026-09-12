"""Official Pinterest API (v5) client.

Deliberately does NOT do browser automation -- per the spec, publishing
must go through the official API only. Every write path (create_pin,
create_board) is idempotent-safe from the *caller's* side: the caller is
expected to track pinterest_pin_id in the Pin row and never re-call
create_pin for a pin that already has one.

Retry/backoff: transient failures (timeouts, 5xx) should be retried on the
schedule [1 min, 5 min, 30 min, 2 hours] and then flagged, per the spec.
Because this client is called from a scheduled job rather than a
long-lived script, the *scheduling* of those retries lives in
app.scheduler.jobs (it sets Pin.scheduled_at into the future and bumps
retry_count) -- this module just tells the caller how long to wait via
RETRY_SCHEDULE_SECONDS and raises typed exceptions so the caller can tell
"retry me" apart from "this will never work."
"""
from __future__ import annotations

import base64
import datetime as dt
import time
from pathlib import Path
from typing import Any

import requests

from app.config import settings
from app.logging_config import get_logger

logger = get_logger(__name__)

BASE_URL = "https://api.pinterest.com/v5"
TOKEN_URL = "https://api.pinterest.com/v5/oauth/token"

# 1 minute, 5 minutes, 30 minutes, 2 hours -- then flag the pin.
RETRY_SCHEDULE_SECONDS = [60, 300, 1800, 7200]

DEFAULT_TIMEOUT = 30


class PinterestAPIError(Exception):
    """Raised for a Pinterest API failure that should NOT be silently
    retried forever (e.g. 400 validation error, 404, exhausted retries)."""


class CredentialsMissingError(PinterestAPIError):
    """Raised when Pinterest OAuth credentials are not configured. Callers
    should treat this as 'blocked pending setup', not a crash."""


class RateLimitError(PinterestAPIError):
    def __init__(self, retry_after: int, message: str = "Pinterest API rate limit hit"):
        super().__init__(message)
        self.retry_after = retry_after


class TransientAPIError(PinterestAPIError):
    """Network hiccup / 5xx -- safe to retry per RETRY_SCHEDULE_SECONDS."""


class PinterestClient:
    def __init__(self) -> None:
        self._access_token = settings.pinterest_access_token or None
        self._token_expires_at: dt.datetime | None = None

    # -- auth -----------------------------------------------------------

    def _ensure_credentials(self) -> None:
        if self._access_token:
            # Every /v5 call is plain Bearer-token auth -- a standalone
            # access token (e.g. the one-click token Pinterest's
            # developer portal can generate before an app has a secret,
            # "trial access") is enough on its own. Client id/secret are
            # only needed to exchange a refresh token for a *new* access
            # token once this one expires, which is a later problem, not
            # a reason to refuse to make calls right now.
            return
        if not settings.pinterest_client_id or not settings.pinterest_client_secret:
            raise CredentialsMissingError(
                "No PINTEREST_ACCESS_TOKEN configured, and PINTEREST_CLIENT_ID / "
                "PINTEREST_CLIENT_SECRET are not set (needed to exchange "
                "PINTEREST_REFRESH_TOKEN for one). Create an app at "
                "https://developers.pinterest.com and populate .env."
            )
        if not settings.pinterest_refresh_token:
            raise CredentialsMissingError(
                "No PINTEREST_ACCESS_TOKEN or PINTEREST_REFRESH_TOKEN configured. "
                "Complete the OAuth flow once to obtain a refresh token."
            )

    def _refresh_access_token(self) -> str:
        self._ensure_credentials()
        if not settings.pinterest_refresh_token:
            if self._access_token:
                return self._access_token
            raise CredentialsMissingError("No refresh token available to obtain an access token.")

        basic = base64.b64encode(
            f"{settings.pinterest_client_id}:{settings.pinterest_client_secret}".encode()
        ).decode()
        try:
            resp = requests.post(
                TOKEN_URL,
                headers={
                    "Authorization": f"Basic {basic}",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": settings.pinterest_refresh_token,
                },
                timeout=DEFAULT_TIMEOUT,
            )
        except requests.RequestException as exc:
            # A network failure here must surface as the same typed,
            # retryable error publish_job already knows how to schedule a
            # backoff for -- otherwise it escapes as a raw requests
            # exception, skipping retry_count/scheduled_at bookkeeping
            # entirely and aborting the publish run instead of retrying.
            raise TransientAPIError(f"Network error refreshing Pinterest access token: {exc}") from exc

        if resp.status_code >= 500:
            raise TransientAPIError(f"Pinterest token endpoint returned {resp.status_code}: {resp.text}")
        if resp.status_code >= 400:
            raise PinterestAPIError(f"Failed to refresh Pinterest access token: {resp.status_code} {resp.text}")
        data = resp.json()
        self._access_token = data["access_token"]
        expires_in = data.get("expires_in", 3600)
        self._token_expires_at = dt.datetime.now(dt.timezone.utc) + dt.timedelta(seconds=expires_in - 60)
        logger.info("Refreshed Pinterest access token, expires in %ss", expires_in)
        return self._access_token

    def _get_access_token(self) -> str:
        if self._access_token and (
            self._token_expires_at is None or dt.datetime.now(dt.timezone.utc) < self._token_expires_at
        ):
            return self._access_token
        return self._refresh_access_token()

    # -- low-level request -----------------------------------------------

    def _request(self, method: str, path: str, *, retry_on_auth_failure: bool = True, **kwargs) -> dict[str, Any]:
        self._ensure_credentials()
        token = self._get_access_token()
        headers = kwargs.pop("headers", {})
        headers["Authorization"] = f"Bearer {token}"

        url = f"{BASE_URL}{path}"
        try:
            resp = requests.request(method, url, headers=headers, timeout=DEFAULT_TIMEOUT, **kwargs)
        except requests.RequestException as exc:
            raise TransientAPIError(f"Network error calling Pinterest API {method} {path}: {exc}") from exc

        if resp.status_code == 401 and retry_on_auth_failure:
            logger.info("Pinterest API returned 401, forcing token refresh and retrying once")
            self._access_token = None
            return self._request(method, path, retry_on_auth_failure=False, headers=kwargs.pop("headers", headers), **kwargs)

        if resp.status_code == 429:
            retry_after = int(resp.headers.get("Retry-After", "60"))
            raise RateLimitError(retry_after)

        if resp.status_code >= 500:
            raise TransientAPIError(f"Pinterest API {method} {path} returned {resp.status_code}: {resp.text}")

        if resp.status_code >= 400:
            raise PinterestAPIError(f"Pinterest API {method} {path} returned {resp.status_code}: {resp.text}")

        if resp.status_code == 204 or not resp.content:
            return {}
        return resp.json()

    # -- boards -----------------------------------------------------------

    def list_boards(self, page_size: int = 100) -> list[dict]:
        boards: list[dict] = []
        bookmark = None
        while True:
            params = {"page_size": page_size}
            if bookmark:
                params["bookmark"] = bookmark
            data = self._request("GET", "/boards", params=params)
            boards.extend(data.get("items", []))
            bookmark = data.get("bookmark")
            if not bookmark:
                break
        return boards

    def create_board(self, name: str, description: str = "", privacy: str = "PUBLIC") -> dict:
        return self._request(
            "POST",
            "/boards",
            json={"name": name, "description": description, "privacy": privacy},
        )

    # -- pins ---------------------------------------------------------------

    def create_pin(
        self,
        *,
        board_id: str,
        title: str,
        description: str,
        link: str,
        image_path: str | Path,
        alt_text: str = "",
    ) -> dict:
        image_bytes = Path(image_path).read_bytes()
        b64_data = base64.b64encode(image_bytes).decode()

        payload = {
            "board_id": board_id,
            "title": title[:100],
            "description": description[:800],
            "link": link,
            "alt_text": alt_text[:500] if alt_text else title[:500],
            "media_source": {
                "source_type": "image_base64",
                "content_type": "image/png",
                "data": b64_data,
            },
        }
        return self._request("POST", "/pins", json=payload)

    def get_pin(self, pin_id: str) -> dict:
        return self._request("GET", f"/pins/{pin_id}")

    def list_board_pins(self, board_id: str, page_size: int = 25) -> list[dict]:
        return self._request("GET", f"/boards/{board_id}/pins", params={"page_size": page_size}).get(
            "items", []
        )

    def find_pin_by_link(self, board_id: str, link: str) -> str | None:
        """Reconciliation for ambiguous create_pin outcomes: a timeout or
        5xx doesn't tell us whether Pinterest actually created the pin
        before failing to respond. Every pin's destination link carries a
        `utm_content=pin_<local_id>` tag unique to that one local Pin row
        (see app.utm), so an exact link match here reliably identifies
        "this specific pin already exists" rather than any pin merely
        pointing at a similar URL. Callers should check this before
        retrying create_pin after a transient failure."""
        for p in self.list_board_pins(board_id):
            if p.get("link") == link:
                return p.get("id")
        return None

    def get_pin_analytics(
        self,
        pin_id: str,
        start_date: dt.date,
        end_date: dt.date,
        metric_types: list[str] | None = None,
    ) -> dict:
        metric_types = metric_types or [
            "IMPRESSION",
            "SAVE",
            "PIN_CLICK",
            "OUTBOUND_CLICK",
        ]
        params = {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "metric_types": ",".join(metric_types),
        }
        return self._request("GET", f"/pins/{pin_id}/analytics", params=params)

    # -- convenience --------------------------------------------------------

    def test_connection(self) -> dict:
        """Lightweight credential/connectivity check used by `pinterest status`."""
        return self._request("GET", "/user_account")
