"""Headline engine -- five headline families per the spec: LIST, CURIOSITY,
TRANSFORMATION, PROBLEM/SOLUTION, BEGINNER.

Every family has several template phrasings so that generating headlines
for the same keyword repeatedly (e.g. across winner-recycling variants)
doesn't produce the exact same string -- `variant_seed` selects which
template and which "lucky number" gets used.
"""
from __future__ import annotations

HEADLINE_FAMILIES = ["list", "curiosity", "transformation", "problem_solution", "beginner"]

_NUMBERS = [3, 5, 7, 9, 10, 12]

_LIST_TEMPLATES = [
    "{n} {topic} Every Entrepreneur Should Know",
    "{n} {topic} You Should Save Right Now",
    "{n} {topic} That Actually Work",
    "{n} {topic} Worth Bookmarking Today",
]

_CURIOSITY_TEMPLATES = [
    "Most People Are Using {topic} Wrong",
    "The {topic} Nobody Talks About",
    "What No One Tells You About {topic}",
    "This Changes How You Think About {topic}",
]

_TRANSFORMATION_TEMPLATES = [
    "Turn {topic} Into Your 24/7 Business Assistant",
    "How {topic} Can Transform Your Workday",
    "From Overwhelmed to Organized With {topic}",
    "{topic}: The Shift That Changes Everything",
]

_PROBLEM_SOLUTION_TEMPLATES = [
    "Stop Doing {topic} the Hard Way",
    "Tired of Struggling With {topic}? Try This",
    "The Fix for {topic} You've Been Missing",
    "{topic}: Stop Making It Harder Than It Needs to Be",
]

_BEGINNER_TEMPLATES = [
    "The Beginner's Guide to {topic}",
    "{topic} 101: Where to Start",
    "New to {topic}? Start Here",
    "A Simple Introduction to {topic}",
]

_SUBHEADLINES = [
    "Save this before it disappears from your feed.",
    "Bookmark it -- you'll want this later.",
    "The kind of thing you wish you'd found sooner.",
    "Worth five minutes of your time.",
]


def generate_headline(topic: str, family: str, variant_seed: int = 0) -> dict:
    if family not in HEADLINE_FAMILIES:
        family = "list"

    n = _NUMBERS[variant_seed % len(_NUMBERS)]
    subheadline = _SUBHEADLINES[variant_seed % len(_SUBHEADLINES)]

    if family == "list":
        template = _LIST_TEMPLATES[variant_seed % len(_LIST_TEMPLATES)]
        headline = template.format(n=n, topic=topic)
    elif family == "curiosity":
        template = _CURIOSITY_TEMPLATES[variant_seed % len(_CURIOSITY_TEMPLATES)]
        headline = template.format(topic=topic)
    elif family == "transformation":
        template = _TRANSFORMATION_TEMPLATES[variant_seed % len(_TRANSFORMATION_TEMPLATES)]
        headline = template.format(topic=topic)
    elif family == "problem_solution":
        template = _PROBLEM_SOLUTION_TEMPLATES[variant_seed % len(_PROBLEM_SOLUTION_TEMPLATES)]
        headline = template.format(topic=topic)
    else:  # beginner
        template = _BEGINNER_TEMPLATES[variant_seed % len(_BEGINNER_TEMPLATES)]
        headline = template.format(topic=topic)

    return {"headline": headline, "subheadline": subheadline, "family": family}


def generate_headline_set(topic: str, count: int = 5) -> list[dict]:
    """Generate `count` headlines cycling through the 5 families, each with
    a distinct variant seed so repeated calls for the same topic differ."""
    results = []
    for i in range(count):
        family = HEADLINE_FAMILIES[i % len(HEADLINE_FAMILIES)]
        results.append(generate_headline(topic, family, variant_seed=i))
    return results
