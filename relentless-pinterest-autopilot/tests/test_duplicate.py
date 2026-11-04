from pathlib import Path

from app.config import brand_for_key
from app.creative.templates import render_template, save_pin_image
from app.duplicate import (
    concept_fingerprint,
    image_similarity,
    is_duplicate_against,
    normalized_copy_hash,
    perceptual_image_hash,
    text_similarity,
)


def _render(tmp_path, headline, style="bold_headline"):
    brand = brand_for_key("prompt_mastery")
    img = render_template(style, headline, "Save this for later.", brand)
    path = tmp_path / f"{abs(hash(headline))}.png"
    save_pin_image(img, path)
    return path


def test_identical_renders_hash_to_full_similarity(tmp_path):
    p1 = _render(tmp_path, "5 ChatGPT Prompts Every Entrepreneur Should Know")
    p2 = _render(tmp_path / "b", "5 ChatGPT Prompts Every Entrepreneur Should Know")
    h1, h2 = perceptual_image_hash(p1), perceptual_image_hash(p2)
    assert image_similarity(h1, h2) == 1.0


def test_different_headlines_same_template_are_not_flagged_as_duplicate(tmp_path):
    """Regression test for the average-hash false-positive bug: two
    genuinely different headlines rendered in the same template must NOT
    exceed the 90% image-similarity duplicate threshold."""
    p1 = _render(tmp_path, "9 AI productivity prompts You Should Save Right Now", style="authority")
    p2 = _render(tmp_path, "AI marketing prompts: Stop Making It Harder Than It Needs to Be", style="authority")
    h1, h2 = perceptual_image_hash(p1), perceptual_image_hash(p2)
    assert image_similarity(h1, h2) < 0.90


def test_trivial_headline_tweak_is_flagged_as_duplicate(tmp_path):
    """A one-word tweak of the same idea (e.g. winner recycling gone
    lazy) should still be caught -- the spec explicitly forbids just
    swapping a number and republishing."""
    p1 = _render(tmp_path, "5 ChatGPT Prompts Every Entrepreneur Should Know")
    p2 = _render(tmp_path, "7 ChatGPT Prompts Every Entrepreneur Should Know")
    h1, h2 = perceptual_image_hash(p1), perceptual_image_hash(p2)
    assert image_similarity(h1, h2) > 0.90


def test_text_similarity_and_normalized_hash():
    a = "5 ChatGPT Prompts Every Entrepreneur Should Know"
    b = "5 chatgpt prompts every entrepreneur should know!!"
    assert text_similarity(a, b) > 0.95
    assert normalized_copy_hash(a) == normalized_copy_hash(b)


def test_concept_fingerprint_is_stable_and_sensitive():
    fp1 = concept_fingerprint("Headline A", "bold_headline", "keyword", "https://x.com", "Learn More")
    fp2 = concept_fingerprint("Headline A", "bold_headline", "keyword", "https://x.com", "Learn More")
    fp3 = concept_fingerprint("Headline B", "bold_headline", "keyword", "https://x.com", "Learn More")
    assert fp1 == fp2
    assert fp1 != fp3


def test_is_duplicate_against_existing_pins():
    existing = [{"image_hash": "f" * 8, "text": "hello world this is a pin"}]
    is_dup, reason = is_duplicate_against(
        image_hash="f" * 8, text="totally unrelated text here", existing=existing
    )
    assert is_dup
    assert "image similarity" in reason
