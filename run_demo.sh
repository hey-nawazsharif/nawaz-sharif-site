#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
python3 fleetops.py demo --data-dir ./demo_data --force
python3 fleetops.py report --data-dir ./demo_data
echo "See demo_data/reports/report.md and alerts.csv"
