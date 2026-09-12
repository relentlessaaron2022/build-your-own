"""ImageProvider abstraction (`ImageProvider.generate()`), per the spec.

Multiple backends are supported; for high-volume Pins the spec explicitly
recommends preferring cheap template-generated graphics, so
TemplateProvider is the default and requires no credentials. Generative
backends are opt-in and used only when explicitly selected.
"""
from __future__ import annotations

import base64
import time
from abc import ABC, abstractmethod
from pathlib import Path

import requests

from app.config import ASSETS_DIR, settings
from app.creative.templates import render_template, save_pin_image
from app.logging_config import get_logger

logger = get_logger(__name__)


class ImageProvider(ABC):
    name: str = "base"

    @abstractmethod
    def generate(self, concept: dict, brand: dict) -> Path:
        """Render (or fetch) an image for a pin concept and return its
        saved path. `concept` carries headline/subheadline/visual_style/
        keyword/pin id -- enough to make the output deterministic and
        traceable back to its concept."""
        raise NotImplementedError


class TemplateProvider(ImageProvider):
    """HTML/CSS-free, dependency-light template rendering via Pillow.
    Deterministic, free, and fast -- the default for high-volume output."""

    name = "template"

    def generate(self, concept: dict, brand: dict) -> Path:
        image = render_template(
            style=concept.get("visual_style", "bold_headline"),
            headline=concept["headline"],
            subheadline=concept.get("subheadline", ""),
            brand=brand,
            checklist_items=concept.get("checklist_items"),
        )
        filename = f"concept_{concept.get('id', int(time.time()))}.png"
        output_path = ASSETS_DIR / "generated" / filename
        return save_pin_image(image, output_path)


class OpenAIImageProvider(ImageProvider):
    """Generative creative via OpenAI's image API. Only used when a caller
    explicitly opts in (materially improves the creative) -- the spec
    prefers templates for routine, high-volume output to control cost."""

    name = "openai"

    def generate(self, concept: dict, brand: dict) -> Path:
        if not settings.openai_available:
            raise RuntimeError("OPENAI_API_KEY not configured; cannot use OpenAIImageProvider")

        prompt = (
            f"Pinterest pin graphic, 2:3 portrait, bold clean text overlay reading "
            f"'{concept['headline']}', brand colors {brand.get('colors', {})}, "
            f"minimal modern flat design, no watermark, no logos."
        )
        resp = requests.post(
            "https://api.openai.com/v1/images/generations",
            headers={"Authorization": f"Bearer {settings.openai_api_key}"},
            json={"model": "gpt-image-1", "prompt": prompt, "size": "1024x1536"},
            timeout=60,
        )
        resp.raise_for_status()
        b64 = resp.json()["data"][0]["b64_json"]
        image_bytes = base64.b64decode(b64)

        filename = f"concept_{concept.get('id', int(time.time()))}_ai.png"
        output_path = ASSETS_DIR / "generated" / filename
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(image_bytes)

        from PIL import Image

        img = Image.open(output_path).convert("RGB").resize((1000, 1500))
        img.save(output_path, format="PNG")
        return output_path


class CanvaProvider(ImageProvider):
    """Placeholder for a future Canva Connect API integration. Raises
    until implemented so callers fail loudly instead of silently
    producing a blank image."""

    name = "canva"

    def generate(self, concept: dict, brand: dict) -> Path:
        raise NotImplementedError(
            "Canva image generation is not yet implemented. Use TemplateProvider "
            "or OpenAIImageProvider, or implement Canva Connect API support here."
        )


def get_default_provider() -> ImageProvider:
    return TemplateProvider()


def get_provider(name: str) -> ImageProvider:
    providers = {
        "template": TemplateProvider,
        "openai": OpenAIImageProvider,
        "canva": CanvaProvider,
    }
    cls = providers.get(name)
    if not cls:
        raise ValueError(f"Unknown image provider: {name}")
    return cls()
