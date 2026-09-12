import os
import sys
import tempfile
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Must happen before ANY `app.*` module is imported anywhere in the test
# session: app.config.Settings() reads DATABASE_URL once at import time,
# and app.db creates its engine from that value at import time too.
_TMP_DB_DIR = tempfile.mkdtemp(prefix="pinterest_autopilot_test_")
os.environ["DATABASE_URL"] = f"sqlite:///{_TMP_DB_DIR}/test.db"
os.environ["PINTEREST_CLIENT_ID"] = ""
os.environ["PINTEREST_CLIENT_SECRET"] = ""
os.environ["PINTEREST_REFRESH_TOKEN"] = ""
os.environ["PINTEREST_ACCESS_TOKEN"] = ""
os.environ["OPENAI_API_KEY"] = ""

import pytest  # noqa: E402

from app.db import Base, engine, init_db  # noqa: E402


@pytest.fixture(autouse=True)
def _reset_db():
    Base.metadata.drop_all(engine)
    init_db()
    yield
