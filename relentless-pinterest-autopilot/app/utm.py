"""UTM parameter injection, applied automatically to every destination URL
before it's stored on a Pin, per the spec."""
from __future__ import annotations

from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse


def add_utm_params(url: str, utm_campaign: str, pin_id: int | str | None = None) -> str:
    parsed = urlparse(url)
    query = dict(parse_qsl(parsed.query))
    query.update(
        {
            "utm_source": "pinterest",
            "utm_medium": "organic",
            "utm_campaign": utm_campaign,
        }
    )
    if pin_id is not None:
        query["utm_content"] = f"pin_{pin_id}"
    new_query = urlencode(query)
    return urlunparse(parsed._replace(query=new_query))
