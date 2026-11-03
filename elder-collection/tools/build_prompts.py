#!/usr/bin/env python3
"""Build the 250-image shot list for every edition.

Reads style/cast.json + editions/*.json and writes, per edition:
  output/<NN-slug>/prompts.jsonl   one record per image (used by generate_images.py and build_books.py)
  output/<NN-slug>/prompts.csv     the same list, for reading in a spreadsheet
plus output/cast_reference_prompts.jsonl and output/all_prompts.csv (all 2,500).

The image mix per edition (always 250):
  120 solo elders   (24 theme actions x 5 cast members each)
   50 pairs         (couples, two elders, or elder + grandchild)
   20 groups        (3-4 elders together)
   40 props         (standalone objects for the theme)
   20 word art      (hand-lettered phrases)

Usage:  python tools/build_prompts.py            (all editions)
        python tools/build_prompts.py 1 4        (just editions 1 and 4)
"""
import csv
import json
import random
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "output"

STYLE_COLOR = (
    "Whimsical storybook caricature illustration, hand-painted watercolor and gouache texture "
    "with soft colored-pencil outlines. Oversized heads, big expressive eyes, exaggerated round "
    "noses, small hands and feet, warm and gentle humor. Muted earthy palette: mustard yellow, deep "
    "teal, olive green, rust orange, warm cream, cocoa brown. Full body, centered. Isolated on a "
    "fully transparent background, no ground shadow, no scenery, no border, no text unless asked. "
    "Respectful and dignified, never mocking: these elders are loved."
)
STYLE_PROP = (
    "Whimsical storybook illustration of a single object, hand-painted watercolor and gouache "
    "texture with soft colored-pencil outlines, slightly exaggerated cozy proportions. Muted earthy "
    "palette: mustard yellow, deep teal, olive green, rust orange, warm cream, cocoa brown. Centered, "
    "isolated on a fully transparent background, no shadow, no scenery, no border, no text."
)
STYLE_WORDART = (
    "Hand-lettered word art, warm cocoa-brown and mustard brush lettering with a slight watercolor "
    "texture, decorated with a few small hand-painted hearts, leaves or flowers in teal, olive and "
    "rust. Centered, isolated on a fully transparent background, no border. Spell the words exactly "
    "as given."
)
STYLE_LINEART = (
    "Convert this exact illustration into a clean coloring-book page. Same character(s), same pose, "
    "same clothing details, same proportions. Pure black outlines on pure white, uniform "
    "medium-thick strokes, closed shapes that are easy to color, no shading, no gray, no hatching, "
    "no color, no background."
)
STYLE_REFSHEET = (
    "Character reference sheet: the same character shown three times side by side, front view, "
    "three-quarter view and back view, standing in a relaxed neutral pose with a gentle smile. "
)

GRANDKIDS = [
    "a Black grandchild about 7 years old with two puffball ponytails, mustard sweater and teal skirt",
    "a Black grandchild about 9 years old with a short fade, olive hoodie and cream sneakers",
    "a Black teenage grandchild about 15 with box braids, rust jacket and jeans",
    "a Black young-adult grandchild about 22 with short locs, cream shirt and teal blazer",
]

# Actions that only make sense for women in this cast's world. Everything else is open to anyone.
WOMAN_ONLY = ("skirt", "lipstick", "earrings", "brooch", "headwrap", "flowing dress", "spinning in a")


def load_cast():
    data = json.loads((ROOT / "style" / "cast.json").read_text())
    return data["cast"], data["couples"]


def load_editions(only=None):
    eds = []
    for p in sorted((ROOT / "editions").glob("*.json")):
        e = json.loads(p.read_text())
        if only and e["number"] not in only:
            continue
        e["_dir"] = p.stem
        eds.append(e)
    return eds


def person(c):
    return f"{c['name']}: {c['lock']}"


def build_edition(e, cast, couples):
    by_id = {c["id"]: c for c in cast}
    women = [c for c in cast if c["sex"] == "woman"]
    n = e["number"]
    rng = random.Random(1000 + n)  # same list every time you run it
    items = []

    def add(cat, title, prompt, cast_ids, style, words=None):
        items.append({
            "category": cat,
            "title": title,
            "cast": cast_ids,
            "words": words,
            "prompt_color": f"{style}\n\nSubject: {prompt}",
            "prompt_lineart": STYLE_LINEART,
        })

    # 120 solo: each action drawn by 5 different cast members, rotated per edition.
    for i, action in enumerate(e["solo_actions"]):
        pool = women if any(w in action for w in WOMAN_ONLY) else cast
        for k in range(5):
            c = pool[(i * 5 + k + n * 3) % len(pool)]
            add("solo", f"{c['name']}, {action}", f"{person(c)}, {action}.", [c["id"]], STYLE_COLOR)

    # 50 pairs
    pa = e["pair_actions"]
    n_couple = n_kid = 0
    for j in range(50):
        action = pa[j % len(pa)]
        rot = j // len(pa)
        if "couple" in action or "man" in action and "woman" in action:
            a, b = couples[(n_couple + n) % len(couples)]
            n_couple += 1
            ppl = [by_id[a], by_id[b]]
            subj = f"{action}. The couple: {person(ppl[0])}; and {person(ppl[1])}."
        elif "grandchild" in action or "child" in action or "teen" in action or "toddler" in action \
                or "young" in action or "graduate" in action:
            c = cast[(n_kid * 7 + n) % len(cast)]
            kid = GRANDKIDS[(n_kid + rot) % len(GRANDKIDS)]
            n_kid += 1
            if "teen" in action:
                kid = GRANDKIDS[2]
            elif "young" in action or "graduate" in action:
                kid = GRANDKIDS[3]
            elif "toddler" in action:
                kid = "a Black toddler about 2 years old in a mustard onesie"
            ppl = [c]
            subj = f"{action}. The elder: {person(c)}. The young one: {kid}."
        else:
            a = cast[(j * 5 + n) % len(cast)]
            b = cast[(j * 5 + n + 7) % len(cast)]
            ppl = [a, b]
            subj = f"{action}. The two elders: {person(a)}; and {person(b)}."
        add("pair", f"{' & '.join(p['name'] for p in ppl)}: {action}", subj, [p["id"] for p in ppl], STYLE_COLOR)

    # 20 groups
    for j in range(20):
        scene = e["group_scenes"][j % len(e["group_scenes"])]
        size = 4 if scene.startswith("four") else 3
        if "couple" in scene:
            npairs = 2 if scene.startswith("two") else 3 if scene.startswith("three") else 1
            pairs = rng.sample(couples, npairs)
            ids = [x for pr in pairs for x in pr]
        else:
            ids = [c["id"] for c in rng.sample(cast, size)]
        ppl = [by_id[i] for i in ids]
        subj = f"{scene}. Wide group composition, everyone full body. The people: " + "; ".join(person(p) for p in ppl) + "."
        if "grandkid" in scene or "generations" in scene:
            subj += " Grandchildren: " + "; ".join(GRANDKIDS[:3]) + "."
        add("group", f"Group: {scene}", subj, ids, STYLE_COLOR)

    # 40 props
    for prop in e["props"]:
        add("prop", prop[0].upper() + prop[1:], f"{prop}.", [], STYLE_PROP)

    # 20 word art
    for phrase in e["word_art"]:
        add("wordart", f'Word art: "{phrase}"', f'the phrase "{phrase}"', [], STYLE_WORDART, words=phrase)

    assert len(items) == 250, (e["slug"], len(items))

    # Number the images and spread every category evenly across the 10 story chapters.
    order = list(range(250))
    rng.shuffle(order)
    chapter_of = {idx: (pos % 10) + 1 for pos, idx in enumerate(order)}
    for i, it in enumerate(items, start=1):
        it["id"] = f"E{n:02d}-{i:03d}"
        it["edition"] = n
        it["chapter"] = chapter_of[i - 1]
        it["color_file"] = f"images/color/{it['id']}.png"
        it["lineart_file"] = f"images/lineart/{it['id']}.png"
    return items


def main():
    only = {int(a) for a in sys.argv[1:]} or None
    cast, couples = load_cast()
    OUT.mkdir(exist_ok=True)

    with open(OUT / "cast_reference_prompts.jsonl", "w") as f:
        for c in cast:
            f.write(json.dumps({
                "id": c["id"], "name": c["name"], "file": f"style/refs/{c['id']}.png",
                "prompt": f"{STYLE_REFSHEET}{STYLE_COLOR}\n\nCharacter: {person(c)}.",
            }) + "\n")

    all_rows = []
    for e in load_editions(only):
        items = build_edition(e, cast, couples)
        d = OUT / e["_dir"]
        (d / "images" / "color").mkdir(parents=True, exist_ok=True)
        (d / "images" / "lineart").mkdir(parents=True, exist_ok=True)
        with open(d / "prompts.jsonl", "w") as f:
            for it in items:
                f.write(json.dumps(it) + "\n")
        cols = ["id", "category", "chapter", "title", "cast", "prompt_color"]
        with open(d / "prompts.csv", "w", newline="") as f:
            w = csv.writer(f)
            w.writerow(cols)
            for it in items:
                w.writerow([it["id"], it["category"], it["chapter"], it["title"], " ".join(it["cast"]), it["prompt_color"]])
        all_rows += items
        cats = {}
        for it in items:
            cats[it["category"]] = cats.get(it["category"], 0) + 1
        print(f"Edition {e['number']:>2} {e['theme']:<45} {len(items)} images {cats}")

    if not only:
        with open(OUT / "all_prompts.csv", "w", newline="") as f:
            w = csv.writer(f)
            w.writerow(["id", "edition", "category", "chapter", "title", "prompt_color"])
            for it in all_rows:
                w.writerow([it["id"], it["edition"], it["category"], it["chapter"], it["title"], it["prompt_color"]])
        print(f"Total: {len(all_rows)} images across {len(all_rows) // 250} editions")


if __name__ == "__main__":
    main()
