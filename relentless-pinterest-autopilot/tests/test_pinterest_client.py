import pytest

from app.pinterest.client import CredentialsMissingError, PinterestClient


def test_client_raises_clear_error_without_credentials():
    client = PinterestClient()
    with pytest.raises(CredentialsMissingError):
        client.list_boards()


def test_publish_one_test_pin_reports_missing_credentials():
    from app.scheduler.jobs import publish_one_test_pin

    result = publish_one_test_pin()
    assert result["success"] is False
    assert result["reason"] == "missing_credentials"
    assert "PINTEREST_CLIENT_ID" in result["required_env"]
