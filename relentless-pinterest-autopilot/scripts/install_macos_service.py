"""Install the scheduler for the current Mac login, after local readiness checks.

Run using the project's venv Python. No credentials are copied into the plist.
"""
import os
from pathlib import Path
import plistlib
import subprocess
import sys

if sys.platform != "darwin":
    raise SystemExit("This installer is for macOS. Use `pinterest run` on Linux.")

root = Path(__file__).resolve().parent.parent
env = dict(os.environ, AUTOPILOT_HOME=str(root))
subprocess.run([sys.executable, "-m", "app.cli", "doctor"], cwd=root, env=env, check=True)
label = "com.relentless.pinterest-autopilot"
path = Path.home() / "Library" / "LaunchAgents" / f"{label}.plist"
if path.exists():
    raise SystemExit(f"Service already exists at {path}. Inspect it before replacing.")
path.parent.mkdir(parents=True, exist_ok=True)
(root / "logs").mkdir(exist_ok=True)
payload = {
    "Label": label,
    "ProgramArguments": [sys.executable, "-m", "app.cli", "run"],
    "WorkingDirectory": str(root),
    "EnvironmentVariables": {"AUTOPILOT_HOME": str(root)},
    "RunAtLoad": True,
    "KeepAlive": True,
    "ThrottleInterval": 30,
    "StandardOutPath": str(root / "logs" / "service.log"),
    "StandardErrorPath": str(root / "logs" / "service-error.log"),
}
with path.open("wb") as handle:
    plistlib.dump(payload, handle)
subprocess.run(["launchctl", "bootstrap", f"gui/{os.getuid()}", str(path)], check=True)
print(f"Installed {path}. Your Mac must remain awake and logged in to run jobs.")
