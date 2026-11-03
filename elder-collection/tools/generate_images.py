#!/usr/bin/env python3
"""Generate the art with the OpenAI Images API.

Order of operations:
  1. python tools/build_prompts.py                 (writes the shot lists)
  2. python tools/generate_images.py --refs        (16 cast reference sheets -> style/refs/)
     Look at every sheet. Re-roll any you don't love (delete the PNG, run again).
  3. python tools/generate_images.py --edition 1 --limit 10   (test batch, check it)
  4. python tools/generate_images.py --edition 1              (the full 250 color images)
  5. python tools/generate_images.py --edition 1 --lineart    (250 coloring pages made from the color art)

It never redoes a file that already exists, so you can stop and restart any time.
Delete a PNG to re-roll that one image.

Needs:  pip install openai pillow
        export OPENAI_API_KEY=sk-...
Optional env:
        OPENAI_IMAGE_MODEL   (default gpt-image-1; set to the newest image model on your account)
        OPENAI_IMAGE_QUALITY (default high; use medium for cheaper test runs)
"""
import argparse
import base64
import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "output"
MODEL = os.environ.get("OPENAI_IMAGE_MODEL", "gpt-image-1")
QUALITY = os.environ.get("OPENAI_IMAGE_QUALITY", "high")
SIZES = {"solo": "1024x1536", "pair": "1536x1024", "group": "1536x1024",
         "prop": "1024x1024", "wordart": "1536x1024", "ref": "1536x1024"}


def client():
    try:
        from openai import OpenAI
    except ImportError:
        sys.exit("Install the SDK first:  pip install openai pillow")
    if not os.environ.get("OPENAI_API_KEY"):
        sys.exit("Set OPENAI_API_KEY first.")
    return OpenAI()


def save(b64, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(base64.b64decode(b64))


def call(fn, tries=5, **kw):
    for t in range(tries):
        try:
            return fn(**kw).data[0].b64_json
        except Exception as ex:  # rate limits, timeouts
            wait = 2 ** (t + 1)
            print(f"   retry in {wait}s: {str(ex)[:120]}")
            time.sleep(wait)
    raise RuntimeError("gave up after retries")


def make_ref(cl, rec):
    path = ROOT / rec["file"]
    if path.exists():
        return f"skip {rec['id']}"
    save(call(cl.images.generate, model=MODEL, prompt=rec["prompt"], size=SIZES["ref"],
              quality=QUALITY, background="transparent"), path)
    return f"ref  {rec['name']}"


def make_color(cl, ed_dir, it):
    path = ed_dir / it["color_file"]
    if path.exists():
        return f"skip {it['id']}"
    refs = [ROOT / "style" / "refs" / f"{c}.png" for c in it["cast"]]
    refs = [r for r in refs if r.exists()]
    size = SIZES[it["category"]]
    if refs:
        # Edit mode: the reference sheets keep each elder looking like themselves.
        files = [open(r, "rb") for r in refs]
        try:
            prompt = ("Use the attached character reference sheet(s) for exact faces, hair, glasses, "
                      "skin tone and clothing. Draw a NEW single illustration (not a sheet).\n\n" + it["prompt_color"])
            b64 = call(cl.images.edit, model=MODEL, image=files, prompt=prompt, size=size,
                       quality=QUALITY, background="transparent")
        finally:
            for f in files:
                f.close()
    else:
        b64 = call(cl.images.generate, model=MODEL, prompt=it["prompt_color"], size=size,
                   quality=QUALITY, background="transparent")
    save(b64, path)
    return f"done {it['id']}"


def make_lineart(cl, ed_dir, it):
    src = ed_dir / it["color_file"]
    path = ed_dir / it["lineart_file"]
    if path.exists():
        return f"skip {it['id']}"
    if not src.exists():
        return f"wait {it['id']} (no color image yet)"
    with open(src, "rb") as f:
        b64 = call(cl.images.edit, model=MODEL, image=[f], prompt=it["prompt_lineart"],
                   size=SIZES[it["category"]], quality=QUALITY, background="opaque")
    save(b64, path)
    return f"line {it['id']}"


def edition_dir(n):
    hits = sorted(OUT.glob(f"{n:02d}-*"))
    if not hits:
        sys.exit(f"No shot list for edition {n}. Run tools/build_prompts.py first.")
    return hits[0]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--refs", action="store_true", help="make the 16 cast reference sheets")
    ap.add_argument("--edition", type=int, help="edition number 1-10")
    ap.add_argument("--lineart", action="store_true", help="make coloring-page versions of existing color art")
    ap.add_argument("--only", help="comma list of ids, e.g. E01-004,E01-120")
    ap.add_argument("--limit", type=int, help="stop after this many images (test runs)")
    ap.add_argument("--workers", type=int, default=4)
    a = ap.parse_args()
    cl = client()

    if a.refs:
        recs = [json.loads(l) for l in open(OUT / "cast_reference_prompts.jsonl")]
        jobs = [(make_ref, (cl, r)) for r in recs]
    elif a.edition:
        d = edition_dir(a.edition)
        items = [json.loads(l) for l in open(d / "prompts.jsonl")]
        if a.only:
            keep = set(a.only.split(","))
            items = [i for i in items if i["id"] in keep]
        if a.limit:
            items = items[: a.limit]
        fn = make_lineart if a.lineart else make_color
        jobs = [(fn, (cl, d, i)) for i in items]
    else:
        ap.error("use --refs or --edition N")

    with ThreadPoolExecutor(a.workers) as ex:
        futs = [ex.submit(f, *args) for f, args in jobs]
        for k, fu in enumerate(as_completed(futs), 1):
            try:
                print(f"[{k}/{len(futs)}] {fu.result()}")
            except Exception as err:
                print(f"[{k}/{len(futs)}] FAILED: {err}")


if __name__ == "__main__":
    main()
