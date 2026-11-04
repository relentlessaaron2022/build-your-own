from app.config import brand_for_key
from app.creative.templates import render_template, save_pin_image
from app.duplicate import perceptual_image_hash
from app.quality import run_quality_checks


def _make_pin_image(tmp_path, headline="A Valid Headline"):
    brand = brand_for_key("prompt_mastery")
    img = render_template("bold_headline", headline, "sub", brand)
    path = tmp_path / "pin.png"
    save_pin_image(img, path)
    return path


def test_valid_pin_passes_quality_checks(tmp_path):
    image_path = _make_pin_image(tmp_path)
    result = run_quality_checks(
        headline="A Valid Headline",
        description="A useful description of the pin.",
        destination_url="https://relentlessaaron.net/some-page?utm_source=pinterest",
        landing_url="https://relentlessaaron.net",
        board_name="AI Prompts & ChatGPT",
        campaign_active=True,
        image_path=str(image_path),
        image_hash=perceptual_image_hash(image_path),
        text_for_dupe_check="A Valid Headline A useful description of the pin.",
        existing_pins=[],
        check_network=False,
    )
    assert result.passed
    assert result.failures == []


def test_missing_image_fails():
    result = run_quality_checks(
        headline="Headline",
        description="Description",
        destination_url="https://relentlessaaron.net/page",
        landing_url="https://relentlessaaron.net",
        board_name="AI Prompts & ChatGPT",
        campaign_active=True,
        image_path="/nonexistent/path.png",
        image_hash="",
        text_for_dupe_check="Headline Description",
        existing_pins=[],
        check_network=False,
    )
    assert not result.passed
    assert any("image" in f for f in result.failures)


def test_unknown_board_fails(tmp_path):
    image_path = _make_pin_image(tmp_path)
    result = run_quality_checks(
        headline="Headline",
        description="Description",
        destination_url="https://relentlessaaron.net/page",
        landing_url="https://relentlessaaron.net",
        board_name="Some Made Up Board",
        campaign_active=True,
        image_path=str(image_path),
        image_hash=perceptual_image_hash(image_path),
        text_for_dupe_check="Headline Description",
        existing_pins=[],
        check_network=False,
    )
    assert not result.passed
    assert any("board" in f for f in result.failures)


def test_inactive_campaign_fails(tmp_path):
    image_path = _make_pin_image(tmp_path)
    result = run_quality_checks(
        headline="Headline",
        description="Description",
        destination_url="https://relentlessaaron.net/page",
        landing_url="https://relentlessaaron.net",
        board_name="AI Prompts & ChatGPT",
        campaign_active=False,
        image_path=str(image_path),
        image_hash=perceptual_image_hash(image_path),
        text_for_dupe_check="Headline Description",
        existing_pins=[],
        check_network=False,
    )
    assert not result.passed
    assert any("campaign" in f for f in result.failures)


def test_duplicate_text_fails(tmp_path):
    image_path = _make_pin_image(tmp_path)
    existing = [{"image_hash": "", "text": "Headline Description"}]
    result = run_quality_checks(
        headline="Headline",
        description="Description",
        destination_url="https://relentlessaaron.net/page",
        landing_url="https://relentlessaaron.net",
        board_name="AI Prompts & ChatGPT",
        campaign_active=True,
        image_path=str(image_path),
        image_hash=perceptual_image_hash(image_path),
        text_for_dupe_check="Headline Description",
        existing_pins=existing,
        check_network=False,
    )
    assert not result.passed
    assert any("duplicate" in f for f in result.failures)
