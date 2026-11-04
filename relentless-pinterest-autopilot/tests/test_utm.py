from urllib.parse import parse_qs, urlparse

from app.utm import add_utm_params


def test_add_utm_params_injects_required_fields():
    url = add_utm_params("https://relentlessaaron.net/page", "prompt_mastery", pin_id=42)
    query = parse_qs(urlparse(url).query)
    assert query["utm_source"] == ["pinterest"]
    assert query["utm_medium"] == ["organic"]
    assert query["utm_campaign"] == ["prompt_mastery"]
    assert query["utm_content"] == ["pin_42"]


def test_add_utm_params_preserves_existing_query_params():
    url = add_utm_params("https://relentlessaaron.net/page?ref=newsletter", "prompt_mastery")
    query = parse_qs(urlparse(url).query)
    assert query["ref"] == ["newsletter"]
    assert query["utm_source"] == ["pinterest"]
