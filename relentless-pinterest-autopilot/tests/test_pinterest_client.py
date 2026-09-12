import pytest

from app.pinterest.client import CredentialsMissingError, PinterestClient


def test_client_raises_clear_error_without_credentials():
    client = PinterestClient()
    with pytest.raises(CredentialsMissingError):
        client.list_boards()


def test_standalone_access_token_needs_no_app_credentials(monkeypatch):
    """Regression test: Pinterest's developer portal can hand out a
    scope-limited access token via its "Generate Access Tokens" button
    before an app has been granted a client secret at all ("trial access
    pending" -- the secret field is literally unavailable). That token is
    real and every /v5 call is plain Bearer auth, so PinterestClient must
    not refuse to use it just because PINTEREST_CLIENT_ID/SECRET are
    empty -- those are only needed to refresh a token later, not to use
    one that's already in hand."""
    import app.config as config_module

    settings = config_module.settings  # app.pinterest.client imports this same instance
    monkeypatch.setattr(settings, "pinterest_client_id", "")
    monkeypatch.setattr(settings, "pinterest_client_secret", "")
    monkeypatch.setattr(settings, "pinterest_refresh_token", "")
    monkeypatch.setattr(settings, "pinterest_access_token", "trial-access-token")

    assert settings.pinterest_credentials_present is True

    client = PinterestClient()
    client._ensure_credentials()  # must not raise despite no client id/secret/refresh token

    def fake_request(method, path, **kwargs):
        return {"items": []}

    monkeypatch.setattr(client, "_request", fake_request)
    client.list_boards()  # must not raise CredentialsMissingError


def test_publish_one_test_pin_reports_missing_credentials():
    from app.scheduler.jobs import publish_one_test_pin

    result = publish_one_test_pin()
    assert result["success"] is False
    assert result["reason"] == "missing_credentials"
    assert "PINTEREST_CLIENT_ID" in result["required_env"]
