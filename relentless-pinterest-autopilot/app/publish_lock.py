"""Serialize all local publishers sharing AUTOPILOT_HOME (Linux and macOS)."""
from functools import wraps
import fcntl

from app.config import DATA_DIR


def single_publisher(function):
    @wraps(function)
    def wrapped(*args, **kwargs):
        with (DATA_DIR / "publisher.lock").open("a") as handle:
            try:
                fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError:
                return {"skipped": True, "success": False, "reason": "publisher_busy"}
            try:
                return function(*args, **kwargs)
            finally:
                fcntl.flock(handle, fcntl.LOCK_UN)
    return wrapped
