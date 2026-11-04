from app.copy.headlines import HEADLINE_FAMILIES, generate_headline, generate_headline_set


def test_generate_headline_for_every_family_includes_topic():
    for family in HEADLINE_FAMILIES:
        result = generate_headline("AI prompts for small business", family, variant_seed=0)
        assert result["family"] == family
        assert "AI prompts for small business" in result["headline"] or "ai prompts for small business" in result["headline"].lower()
        assert result["subheadline"]


def test_generate_headline_set_produces_distinct_headlines():
    headlines = generate_headline_set("AI productivity prompts", count=5)
    texts = [h["headline"] for h in headlines]
    assert len(texts) == 5
    assert len(set(texts)) == 5  # no two headlines identical


def test_problem_solution_headline_differs_per_topic():
    """Regression test: an earlier version of _problem_from_topic bucketed
    every AI/ChatGPT-related keyword into one fixed phrase, so different
    keyword angles produced the literal same PROBLEM_SOLUTION headline --
    exactly the repeated-Pin bug the spec's duplicate rules exist to catch."""
    a = generate_headline("AI prompts for small business", "problem_solution", variant_seed=0)
    b = generate_headline("AI productivity prompts", "problem_solution", variant_seed=0)
    assert a["headline"] != b["headline"]
