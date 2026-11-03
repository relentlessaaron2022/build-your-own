"""Validate registry paths and local asset references without installing dependencies."""
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[2]
registry = json.loads((ROOT / "microsites/registry.json").read_text())


class LinkChecker(HTMLParser):
    def __init__(self, document, output):
        super().__init__()
        self.document = document
        self.output = output

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key not in {"href", "src"} or not value:
                continue
            parsed = urlsplit(value)
            if parsed.scheme or parsed.netloc or not parsed.path:
                continue
            relative = unquote(parsed.path)
            target = (self.output / relative.lstrip("/") if relative.startswith("/") else self.document.parent / relative).resolve()
            if not target.is_relative_to(self.output.resolve()):
                raise ValueError(f"Asset escapes output folder: {self.document}: {value}")
            if not target.exists():
                raise ValueError(f"Missing local link/asset: {self.document}: {value}")


ids = set()
for site in registry["sites"]:
    if site["id"] in ids:
        raise ValueError(f"Duplicate site ID: {site['id']}")
    ids.add(site["id"])
    source = (ROOT / site["source_directory"]).resolve()
    if not source.is_relative_to(ROOT / "microsites/sites"):
        raise ValueError("Site source must be inside microsites/sites")
    output = source / site["output_directory"]
    if not (output / "index.html").is_file():
        raise ValueError(f"No output index for {site['id']}")
    for page in site["sales_pages"]:
        if not (output / page).is_file():
            raise ValueError(f"Missing sales page: {page}")
    if site["completed_sales_page_count"] != len(site["sales_pages"]):
        raise ValueError(f"Incorrect completed-page count for {site['id']}")
    for document in output.rglob("*.html"):
        LinkChecker(document, output).feed(document.read_text())
    print(f"{site['id']}: {len(site['sales_pages'])} sales pages; local assets and links resolve")
