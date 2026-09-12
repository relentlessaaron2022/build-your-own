"""Regression test: the LLM keyword path only checked truthiness of
"primary"/"secondary", so a syntactically valid but wrong-shaped response
(numbers, dicts, non-string list items) slipped past the fallback
boundary and crashed campaign generation instead."""
from app.keywords.engine import _is_valid_keyword_payload


def test_valid_payload_accepted():
    assert _is_valid_keyword_payload(
        {"primary": "ai prompts", "secondary": ["a", "b", "c"], "long_tail": ["x"], "intent_angles": ["y"]}
    )


def test_non_string_primary_rejected():
    assert not _is_valid_keyword_payload({"primary": 123, "secondary": ["a", "b", "c"]})


def test_non_list_secondary_rejected():
    assert not _is_valid_keyword_payload({"primary": "ai prompts", "secondary": "not a list"})


def test_secondary_with_non_string_items_rejected():
    assert not _is_valid_keyword_payload({"primary": "ai prompts", "secondary": ["a", 2, "c"]})


def test_non_dict_rejected():
    assert not _is_valid_keyword_payload(["primary", "secondary"])


def test_missing_secondary_rejected():
    assert not _is_valid_keyword_payload({"primary": "ai prompts"})
