"""CLI script for running the archival historical BGP MRT replay and validation engine."""

import json
import sys
from pathlib import Path

# Ensure backend package is on Python import path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from horaq.replay import run_full_historical_validation


def main() -> None:
    print("=" * 70)
    print("HORA-Q Archival Historical BGP MRT Replay & Validation Engine")
    print("=" * 70)

    report = run_full_historical_validation()
    print(json.dumps(report, indent=2))

    audit_dir = Path(__file__).resolve().parent.parent.parent / "audit"
    audit_dir.mkdir(parents=True, exist_ok=True)

    json_file = audit_dir / "historical_attack_validation.json"
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print(f"\n[OK] Replay report written to {json_file}")


if __name__ == "__main__":
    main()
