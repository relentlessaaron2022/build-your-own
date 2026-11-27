"""Local Pinterest OAuth connect flow and the one-pin demo gate."""
from __future__ import annotations

import datetime as dt
import io
import logging
import re
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from unittest.mock import Mock

import pytest
from click.testing import CliRunner
from PIL import Image

from app import config as app_config
from app.cli import cli
from app.config import Settings, settings
from app.db import Campaign, Pin, PinConcept, get_session
from app.pinterest.connect_server import (
    RedactOAuthLogFilter,
    create_app,
    listen_address,
)
from app.pinterest.demo_pin import (
    MANUAL_HOLD_STATUS,
    DemoPinError,
    create_demo_pin,
    publish_held_pin,
    schedule_demo_pin,
)
from app.pinterest.oauth import (
    DEFAULT_REDIRECT_URI,
    OAUTH_SCOPES,
    OAuthConfigError,
    OAuthExchangeError,
    OAuthStateError,
    begin_authorization,
    build_authorize_url,
    exchange_authorization_code,
    store_tokens,
    validate_redirect_uri,
)
from app.scheduler import jobs


@pytest.fixture(autouse=True)
def oauth_files(monkeypatch, tmp_path):
    env_path = tmp_path / ".env"
    env_path.write_text("# keep\nOPENAI_API_KEY=keep-me\n", encoding="utf-8")
    state_path = tmp_path / "oauth-state.json"
    forms_path = tmp_path / "form-tokens.json"
    assets = tmp_path / "assets"
    monkeypatch.setattr(settings, "pinterest_client_id", "app-id")
    monkeypatch.setattr(settings, "pinterest_client_secret", "app-secret")
    monkeypatch.setattr(settings, "pinterest_access_token", "")
    monkeypatch.setattr(settings, "pinterest_refresh_token", "")
    monkeypatch.setattr(settings, "pinterest_redirect_uri", DEFAULT_REDIRECT_URI)
    monkeypatch.setenv("PINTEREST_ACCESS_TOKEN", "")
    monkeypatch.setenv("PINTEREST_REFRESH_TOKEN", "")
    monkeypatch.setattr(app_config, "ASSETS_DIR", assets)
    monkeypatch.setattr("app.pinterest.oauth.oauth_state_file", lambda: state_path)
    monkeypatch.setattr("app.pinterest.oauth.token_env_path", lambda: env_path)
    monkeypatch.setattr("app.pinterest.connect_server.form_token_file", lambda: forms_path)
    monkeypatch.setattr("app.pinterest.demo_pin.state.publishing_enabled", lambda: True)
    return {"env": env_path, "state": state_path, "forms": forms_path, "assets": assets}


class FakePinterest:
    def __init__(self):
        self.created = []

    def test_connection(self):
        return {
            "username": "webfilmbooks",
            "account_type": "BUSINESS",
            "profile_image": "https://i.pinimg.com/demo.jpg",
            "website_url": "https://example.com",
            "access_token": "should-not-be-copied",
        }

    def list_boards(self):
        return [{"id": "b1", "name": "Books"}, {"id": "../etc", "name": "Ignored"}]

    def create_pin(self, **kwargs):
        self.created.append(kwargs)
        return {"id": "pin123"}


@pytest.fixture
def fake_pinterest():
    return FakePinterest()


@pytest.fixture
def demo(fake_pinterest):
    return create_app(client_factory=lambda: fake_pinterest).test_client()


def _form_token(html: str, action: str) -> str:
    match = re.search(
        rf'action="{re.escape(action)}"[^>]*>\s*<input type="hidden" name="form_token" value="([^"]+)"',
        html,
    )
    assert match, html
    return match.group(1)


def _pin_fields(html: str, **overrides) -> dict:
    data = {
        "form_token": _form_token(html, "/pinterest/pin"),
        "action": "create",
        "board_id": "b1",
        "title": "Demo pin",
        "description": "A single manual pin",
        "link": "https://example.com/books",
        "use_sample": "yes",
    }
    data.update(overrides)
    return data


def _token_response():
    class Response:
        status_code = 200
        text = "pina_should_not_leak"

        def json(self):
            return {
                "access_token": "pina_should_not_leak",
                "refresh_token": "pinr_should_not_leak",
                "expires_in": 3600,
            }

    return Response()


def _connect(demo, monkeypatch):
    monkeypatch.setattr("app.pinterest.oauth.requests.post", lambda *args, **kwargs: _token_response())
    home = demo.get("/")
    token = _form_token(home.get_data(as_text=True), "/pinterest/login")
    started = demo.post("/pinterest/login", data={"form_token": token})
    assert started.status_code == 302
    query = parse_qs(urlparse(started.headers["Location"]).query)
    done = demo.get(
        "/pinterest/callback",
        query_string={"code": "auth-code-value", "state": query["state"][0]},
    )
    assert done.status_code == 303
    assert "pina_should_not_leak" not in done.headers["Location"]
    assert "auth-code-value" not in done.headers["Location"]
    followed = demo.get(done.headers["Location"])
    body = followed.get_data(as_text=True)
    assert "pina_should_not_leak" not in body
    assert "pinr_should_not_leak" not in body
    assert "should-not-be-copied" not in body
    assert "app-secret" not in body
    assert "webfilmbooks" in body
    return followed


def test_default_redirect_uri_is_exact():
    assert DEFAULT_REDIRECT_URI == "http://localhost:8085/pinterest/callback"
    assert OAUTH_SCOPES == (
        "boards:read",
        "boards:write",
        "pins:read",
        "pins:write",
        "user_accounts:read",
    )


def test_settings_use_exact_default_and_env_override(monkeypatch):
    monkeypatch.setenv("PINTEREST_REDIRECT_URI", "")
    assert Settings().pinterest_redirect_uri == "http://localhost:8085/pinterest/callback"
    monkeypatch.setenv("PINTEREST_REDIRECT_URI", "http://127.0.0.1:9090/oauth/callback")
    assert Settings().pinterest_redirect_uri == "http://127.0.0.1:9090/oauth/callback"


def test_app_id_is_preferred_and_client_id_is_alias(monkeypatch):
    monkeypatch.setenv("PINTEREST_APP_ID", "1611009")
    monkeypatch.setenv("PINTEREST_CLIENT_ID", "other")
    monkeypatch.setenv("PINTEREST_APP_SECRET", "from-app-secret")
    monkeypatch.setenv("PINTEREST_CLIENT_SECRET", "from-client-secret")
    fresh = Settings()
    assert fresh.pinterest_client_id == "1611009"
    assert fresh.pinterest_client_secret == "from-app-secret"

    monkeypatch.setenv("PINTEREST_APP_ID", "")
    monkeypatch.setenv("PINTEREST_APP_SECRET", "")
    monkeypatch.setenv("PINTEREST_CLIENT_ID", "legacy-id")
    monkeypatch.setenv("PINTEREST_CLIENT_SECRET", "legacy-secret")
    fallback = Settings()
    assert fallback.pinterest_client_id == "legacy-id"
    assert fallback.pinterest_client_secret == "legacy-secret"


def test_redirect_uri_must_stay_on_localhost():
    validate_redirect_uri(DEFAULT_REDIRECT_URI)
    for uri in (
        "https://localhost:8085/pinterest/callback",
        "http://evil.example:8085/pinterest/callback",
        "http://0.0.0.0:8085/pinterest/callback",
        "http://localhost/pinterest/callback",
        "http://localhost:8085/pinterest/callback?next=1",
    ):
        with pytest.raises(OAuthConfigError):
            validate_redirect_uri(uri)
    assert listen_address(DEFAULT_REDIRECT_URI) == ("127.0.0.1", 8085)
    assert listen_address("http://localhost:9090/oauth/callback") == ("127.0.0.1", 9090)


def test_authorize_url_carries_scopes_redirect_and_state():
    url = build_authorize_url(
        client_id="1611009",
        redirect_uri=DEFAULT_REDIRECT_URI,
        state="state-value",
    )
    parsed = urlparse(url)
    assert parsed.scheme == "https"
    assert parsed.netloc == "www.pinterest.com"
    assert parsed.path == "/oauth/"
    query = parse_qs(parsed.query)
    assert query["client_id"] == ["1611009"]
    assert query["redirect_uri"] == [DEFAULT_REDIRECT_URI]
    assert query["response_type"] == ["code"]
    assert query["state"] == ["state-value"]
    assert query["scope"] == ["boards:read,boards:write,pins:read,pins:write,user_accounts:read"]


def test_token_exchange_uses_basic_auth_and_hides_errors(monkeypatch):
    captured = {}

    def fake_post(url, headers=None, data=None, timeout=None):
        captured["url"] = url
        captured["headers"] = headers
        captured["data"] = data
        return _token_response()

    monkeypatch.setattr("app.pinterest.oauth.requests.post", fake_post)
    payload = exchange_authorization_code("auth-code")
    assert payload["access_token"] == "pina_should_not_leak"
    assert captured["url"] == "https://api.pinterest.com/v5/oauth/token"
    assert captured["headers"]["Authorization"].startswith("Basic ")
    assert captured["data"] == {
        "grant_type": "authorization_code",
        "code": "auth-code",
        "redirect_uri": DEFAULT_REDIRECT_URI,
    }
    assert "app-secret" not in captured["data"].values()
    assert "continuous_refresh" not in captured["data"]

    class Denied:
        status_code = 401
        text = "pina_leaked_in_body"

        def json(self):
            return {"message": "pina_leaked_in_body"}

    monkeypatch.setattr("app.pinterest.oauth.requests.post", lambda *args, **kwargs: Denied())
    with pytest.raises(OAuthExchangeError) as caught:
        exchange_authorization_code("auth-code")
    assert "pina_leaked_in_body" not in str(caught.value)
    assert "401" in str(caught.value)


def test_mismatched_state_does_not_exchange(monkeypatch):
    begin_authorization()

    def fail_if_called(*args, **kwargs):
        raise AssertionError("token endpoint should not be called")

    monkeypatch.setattr("app.pinterest.oauth.requests.post", fail_if_called)
    with pytest.raises(OAuthStateError):
        from app.pinterest.oauth import complete_authorization

        complete_authorization("auth-code", "wrong-state")


def test_store_tokens_updates_env_without_logging_them(oauth_files, caplog):
    caplog.set_level(logging.INFO)
    store_tokens({"access_token": "pina_secretvalue", "refresh_token": "pinr_secretvalue"})
    text = oauth_files["env"].read_text(encoding="utf-8")
    assert "OPENAI_API_KEY=keep-me" in text
    assert "# keep" in text
    assert "PINTEREST_ACCESS_TOKEN=pina_secretvalue" in text
    assert "PINTEREST_REFRESH_TOKEN=pinr_secretvalue" in text
    assert "app-secret" not in text
    assert (oauth_files["env"].stat().st_mode & 0o777) == 0o600
    assert settings.pinterest_access_token == "pina_secretvalue"
    assert "pina_secretvalue" not in caplog.text
    assert "pinr_secretvalue" not in caplog.text

    with pytest.raises(OAuthExchangeError):
        store_tokens({"access_token": "pina_bad\nvalue", "refresh_token": "pinr_other"})
    assert "pina_bad" not in oauth_files["env"].read_text(encoding="utf-8")
    with pytest.raises(OAuthConfigError):
        store_tokens({"access_token": "pina_ok"}, env_path=oauth_files["env"].parent / "tokens.txt")


def test_secret_files_are_gitignored():
    text = Path(__file__).resolve().parents[1].joinpath(".gitignore").read_text(encoding="utf-8")
    for name in (".env", "data/oauth-state.json", "data/connect-form-tokens.json"):
        assert name in text.splitlines()


def test_home_shows_redirect_and_does_not_publish(demo, fake_pinterest):
    response = demo.get("/")
    body = response.get_data(as_text=True)
    assert response.status_code == 200
    assert "http://localhost:8085/pinterest/callback" in body
    assert "boards:write" in body
    assert 'action="/pinterest/login"' in body
    assert "Connect Pinterest account" in body
    assert 'action="/pinterest/pin"' not in body
    assert fake_pinterest.created == []
    assert "no-store" in response.headers["Cache-Control"]


def test_missing_credentials_do_not_start_oauth(demo, monkeypatch):
    monkeypatch.setattr(settings, "pinterest_client_id", "")
    monkeypatch.setattr(settings, "pinterest_client_secret", "super-secret-value")
    response = demo.get("/")
    body = response.get_data(as_text=True)
    assert "PINTEREST_APP_ID" in body
    assert "super-secret-value" not in body
    assert 'action="/pinterest/login"' not in body
    reflected = demo.get("/?connected=1&next=http://evil.example/phish")
    reflected_body = reflected.get_data(as_text=True)
    assert "evil.example" not in reflected_body
    assert "No pin was published" in reflected_body


def test_connect_callback_shows_account_without_tokens(demo, monkeypatch, fake_pinterest):
    followed = _connect(demo, monkeypatch)
    body = followed.get_data(as_text=True)
    assert "No pin was published" in body
    assert "app-secret" not in body
    assert fake_pinterest.created == []
    denied = demo.get("/pinterest/callback?error=access_denied&error_description=nope")
    assert denied.status_code == 400
    assert fake_pinterest.created == []


def test_create_pin_requires_the_button(demo, monkeypatch, fake_pinterest):
    page = _connect(demo, monkeypatch)
    html = page.get_data(as_text=True)
    missing = demo.post("/pinterest/pin", data=_pin_fields(html, action=""))
    assert missing.status_code == 400
    assert "Nothing was sent to Pinterest" in missing.get_data(as_text=True)
    assert fake_pinterest.created == []

    fresh = demo.get("/").get_data(as_text=True)
    created = demo.post("/pinterest/pin", data=_pin_fields(fresh))
    assert created.status_code == 200
    assert "Pin created" in created.get_data(as_text=True)
    assert "pin123" in created.get_data(as_text=True)
    assert len(fake_pinterest.created) == 1
    sent = fake_pinterest.created[0]
    assert sent["board_id"] == "b1"
    assert sent["title"] == "Demo pin"
    with Image.open(sent["image_path"]) as image:
        assert image.size == (1000, 1500)
        assert image.format == "PNG"

    replay = demo.post("/pinterest/pin", data=_pin_fields(fresh))
    assert replay.status_code == 400
    assert len(fake_pinterest.created) == 1
    assert demo.get("/pinterest/pin").status_code == 405


def test_schedule_does_not_send_and_worker_skips_it(demo, monkeypatch, fake_pinterest):
    page = _connect(demo, monkeypatch)
    future = (dt.datetime.now(dt.timezone.utc) + dt.timedelta(days=2)).strftime("%Y-%m-%dT%H:%M")
    html = page.get_data(as_text=True)
    scheduled = demo.post(
        "/pinterest/pin",
        data=_pin_fields(html, action="schedule", publish_at=future, title="Later pin"),
    )
    body = scheduled.get_data(as_text=True)
    assert scheduled.status_code == 200
    assert "Nothing was sent to Pinterest" in body
    assert fake_pinterest.created == []
    with get_session() as session:
        pin = session.query(Pin).filter(Pin.status == MANUAL_HOLD_STATUS).one()
        pin.scheduled_at = dt.datetime.now(dt.timezone.utc) - dt.timedelta(hours=3)
        campaign = session.get(Campaign, session.get(PinConcept, pin.concept_id).campaign_id)
        campaign.status = "active"
        session.commit()
        held_id = pin.id

    campaign = Campaign(
        name="Queued",
        site="s",
        landing_url="https://example.com/queued",
        category="test",
        status="active",
    )
    with get_session() as session:
        session.add(campaign)
        session.flush()
        concept = PinConcept(
            campaign_id=campaign.id,
            headline="Queued pin",
            description="Ready",
            landing_url="https://example.com/queued",
            status="ready",
        )
        session.add(concept)
        session.flush()
        session.add(
            Pin(
                concept_id=concept.id,
                board_id="Bedding",
                destination_url="https://example.com/queued?utm_content=pin_1",
                image_path="queued.png",
                status="queued",
            )
        )
        session.commit()

    publisher = Mock()
    publisher.create_pin.return_value = {"id": "remote-pin"}
    publisher.find_pin_by_link.return_value = None
    monkeypatch.setattr(settings, "pinterest_access_token", "test-only")
    monkeypatch.setattr(jobs, "PinterestClient", lambda: publisher)
    monkeypatch.setattr(jobs, "_resolve_pinterest_board_id", lambda name: "board-id")
    result = jobs.publish_job()
    assert result.get("published") == 1
    assert publisher.create_pin.call_count == 1
    assert fake_pinterest.created == []
    with get_session() as session:
        assert session.get(Pin, held_id).status == MANUAL_HOLD_STATUS


def test_explicit_publish_of_scheduled_pin_is_manual(demo, monkeypatch, fake_pinterest):
    page = _connect(demo, monkeypatch)
    future = (dt.datetime.now(dt.timezone.utc) + dt.timedelta(days=2)).strftime("%Y-%m-%dT%H:%M")
    scheduled = demo.post(
        "/pinterest/pin",
        data=_pin_fields(page.get_data(as_text=True), action="schedule", publish_at=future),
    )
    html = scheduled.get_data(as_text=True)
    match = re.search(
        r'name="form_token" value="([^"]+)"[^>]*>\s*<input type="hidden" name="local_id" value="(\d+)"',
        html,
    )
    assert match, html
    published = demo.post(
        "/pinterest/pin",
        data={"form_token": match.group(1), "local_id": match.group(2), "action": "publish_held"},
    )
    assert published.status_code == 200
    assert len(fake_pinterest.created) == 1
    assert "pin123" in published.get_data(as_text=True)


def test_pause_blocks_publish_but_not_schedule(monkeypatch, fake_pinterest):
    monkeypatch.setattr("app.pinterest.demo_pin.state.publishing_enabled", lambda: False)
    when = dt.datetime.now(dt.timezone.utc) + dt.timedelta(days=1)
    with pytest.raises(DemoPinError):
        create_demo_pin(
            board_id="b1",
            title="Paused",
            description="No",
            link="https://example.com/paused",
            image_bytes=None,
            use_sample=True,
            client=fake_pinterest,
        )
    assert fake_pinterest.created == []
    saved = schedule_demo_pin(
        board_id="b1",
        title="Held",
        description="Later",
        link="https://example.com/held",
        image_bytes=None,
        use_sample=True,
        publish_at=when,
        client=fake_pinterest,
    )
    assert saved["sent_to_pinterest"] is False
    with pytest.raises(DemoPinError):
        publish_held_pin(saved["local_id"], client=fake_pinterest)
    assert fake_pinterest.created == []


def test_publish_held_rejects_other_pins_and_outside_images(fake_pinterest):
    with get_session() as session:
        campaign = Campaign(
            name="Other",
            site="s",
            landing_url="https://example.com",
            category="test",
            status="active",
        )
        session.add(campaign)
        session.flush()
        concept = PinConcept(
            campaign_id=campaign.id,
            headline="Queue",
            description="",
            landing_url="https://example.com",
            status="ready",
        )
        session.add(concept)
        session.flush()
        pin = Pin(
            concept_id=concept.id,
            board_id="b1",
            destination_url="https://example.com",
            image_path="x.png",
            status="queued",
        )
        session.add(pin)
        session.commit()
        queued_id = pin.id
    with pytest.raises(DemoPinError):
        publish_held_pin(queued_id, client=fake_pinterest)

    saved = schedule_demo_pin(
        board_id="b1",
        title="Held",
        description="",
        link="https://example.com/held",
        image_bytes=None,
        use_sample=True,
        publish_at=dt.datetime.now(dt.timezone.utc) + dt.timedelta(days=1),
        client=fake_pinterest,
    )
    with get_session() as session:
        session.get(Pin, saved["local_id"]).image_path = "/etc/passwd"
        session.commit()
    with pytest.raises(DemoPinError):
        publish_held_pin(saved["local_id"], client=fake_pinterest)
    assert fake_pinterest.created == []


def test_unknown_board_and_past_schedule_do_not_send(fake_pinterest):
    with pytest.raises(DemoPinError):
        create_demo_pin(
            board_id="missing",
            title="Nope",
            description="",
            link="https://example.com/nope",
            image_bytes=None,
            use_sample=True,
            client=fake_pinterest,
        )
    with pytest.raises(DemoPinError):
        schedule_demo_pin(
            board_id="b1",
            title="Past",
            description="",
            link="https://example.com/past",
            image_bytes=None,
            use_sample=True,
            publish_at=dt.datetime.now(dt.timezone.utc) - dt.timedelta(minutes=5),
            client=fake_pinterest,
        )
    assert fake_pinterest.created == []


def test_uploaded_image_is_sent_as_png(demo, monkeypatch, fake_pinterest):
    page = _connect(demo, monkeypatch)
    buffer = io.BytesIO()
    Image.new("RGB", (40, 60), "blue").save(buffer, "PNG")
    buffer.seek(0)
    data = _pin_fields(page.get_data(as_text=True))
    data.pop("use_sample")
    data["image"] = (buffer, "pic.png")
    response = demo.post("/pinterest/pin", data=data)
    assert response.status_code == 200
    assert len(fake_pinterest.created) == 1
    saved = Path(fake_pinterest.created[0]["image_path"])
    with Image.open(saved) as image:
        assert image.format == "PNG"


def test_custom_redirect_and_foreign_host(monkeypatch, fake_pinterest):
    monkeypatch.setattr(settings, "pinterest_redirect_uri", "http://127.0.0.1:9090/oauth/callback")
    app = create_app(client_factory=lambda: fake_pinterest)
    client = app.test_client()
    home = client.get("/")
    started = client.post(
        "/pinterest/login",
        data={"form_token": _form_token(home.get_data(as_text=True), "/pinterest/login")},
    )
    query = parse_qs(urlparse(started.headers["Location"]).query)
    assert query["redirect_uri"] == ["http://127.0.0.1:9090/oauth/callback"]
    assert client.get("/oauth/callback").status_code == 400
    blocked = client.get("/", headers={"Host": "evil.example"})
    assert blocked.status_code == 403
    monkeypatch.setattr(settings, "pinterest_redirect_uri", "https://example.com/callback")
    with pytest.raises(OAuthConfigError):
        create_app()


def test_log_filter_redacts_authorization_code():
    record = logging.LogRecord(
        "werkzeug",
        logging.INFO,
        __file__,
        1,
        'GET /pinterest/callback?code=abc123&state=xyz HTTP/1.1',
        (),
        None,
    )
    assert RedactOAuthLogFilter().filter(record) is True
    message = record.getMessage()
    assert "abc123" not in message
    assert "code=[redacted]" in message


def test_connect_help_documents_the_redirect_uri():
    result = CliRunner().invoke(cli, ["connect", "--help"])
    assert result.exit_code == 0
    assert "http://localhost:8085/pinterest/callback" in result.output
    assert "does not publish" in result.output
