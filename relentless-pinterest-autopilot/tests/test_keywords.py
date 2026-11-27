from app.keywords.engine import generate_keywords, slugify


def test_heuristic_keyword_generation_shape():
    result = generate_keywords("ChatGPT prompts for business", seed_keywords=["AI prompts for entrepreneurs"])
    assert result["primary"] == "ChatGPT prompts for business"
    assert 3 <= len(result["secondary"]) <= 8
    assert len(result["long_tail"]) >= 3
    assert len(result["intent_angles"]) >= 3


def test_slugify():
    assert slugify("Prompt Mastery Studio!") == "prompt-mastery-studio"
