from app.config import brand_for_key
from app.creative.templates import CANVAS_SIZE, VISUAL_STYLES, render_template


def test_every_visual_style_renders_at_correct_size():
    brand = brand_for_key("prompt_mastery")
    assert len(VISUAL_STYLES) == 5  # spec's minimum of 5 templates
    for style in VISUAL_STYLES:
        img = render_template(style, "A Reasonably Long Test Headline For Wrapping", "Subheadline text", brand)
        assert img.size == CANVAS_SIZE
