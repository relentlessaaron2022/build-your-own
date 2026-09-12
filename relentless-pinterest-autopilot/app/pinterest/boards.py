"""Board discovery/sync: reconcile config/boards.json (the human-editable
source of truth for which boards should exist) against the boards that
actually exist on the connected Pinterest account."""
from __future__ import annotations

from app.config import load_boards, save_boards
from app.logging_config import get_logger
from app.pinterest.client import PinterestClient

logger = get_logger(__name__)


def sync_boards(create_missing: bool = False) -> list[dict]:
    """Match configured boards to live Pinterest boards by name (case
    insensitive) and fill in pinterest_board_id. If create_missing is
    True, boards with no match are created via the API ("board creation
    if allowed" per the spec) -- off by default to avoid surprise writes.
    """
    client = PinterestClient()
    live_boards = client.list_boards()
    live_by_name = {b["name"].strip().lower(): b for b in live_boards}

    configured = load_boards()
    for board in configured:
        match = live_by_name.get(board["name"].strip().lower())
        if match:
            board["pinterest_board_id"] = match["id"]
        elif create_missing:
            created = client.create_board(board["name"], description=board.get("category", ""))
            board["pinterest_board_id"] = created["id"]
            logger.info("Created missing Pinterest board: %s", board["name"])
        else:
            logger.warning("No matching Pinterest board found for '%s' (not created)", board["name"])

    save_boards(configured)
    return configured
