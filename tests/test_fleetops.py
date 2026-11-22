import datetime as dt
import json
import tempfile
import unittest
from pathlib import Path

import fleetops


class FleetOpsTests(unittest.TestCase):
    def setUp(self):
        self.now = dt.datetime(2026, 11, 22, 12, tzinfo=dt.timezone.utc)
        self.asset = {"asset_id": "host-1", "hostname": "host-1", "owner": "Ops", "site": "BLR", "lifecycle": "active", "patch_age_days": 2}
        self.base = {"asset_id": "host-1", "observed_at": fleetops.iso(self.now), "disk_pct": 40, "memory_pct": 50, "service_status": "up"}

    def test_healthy_asset_has_no_alerts(self):
        self.assertEqual([], fleetops.assess_asset(self.asset, self.base, self.now, fleetops.DEFAULT_THRESHOLDS))

    def test_alerts_on_disk_memory_and_patch(self):
        asset = dict(self.asset, patch_age_days=70)
        snap = dict(self.base, disk_pct=95, memory_pct=92)
        codes = {a["code"] for a in fleetops.assess_asset(asset, snap, self.now, fleetops.DEFAULT_THRESHOLDS)}
        self.assertEqual({"PATCH_OVERDUE", "DISK_HIGH", "MEMORY_HIGH"}, codes)

    def test_stale_and_down(self):
        snap = dict(self.base, observed_at=fleetops.iso(self.now - dt.timedelta(hours=27)), service_status="down")
        codes = {a["code"] for a in fleetops.assess_asset(self.asset, snap, self.now, fleetops.DEFAULT_THRESHOLDS)}
        self.assertEqual({"STALE_TELEMETRY", "SERVICE_DOWN"}, codes)

    def test_retired_excluded(self):
        asset = dict(self.asset, lifecycle="retired", patch_age_days=1000)
        self.assertEqual([], fleetops.assess_asset(asset, None, self.now, fleetops.DEFAULT_THRESHOLDS))

    def test_latest_snapshot_is_selected(self):
        old = dict(self.base, observed_at="2026-11-21T00:00:00Z", disk_pct=97)
        new = dict(self.base, observed_at="2026-11-22T11:59:00Z", disk_pct=27)
        self.assertEqual(27, fleetops.latest_snapshots([new, old])["host-1"]["disk_pct"])

    def test_demo_and_report_generate_artifacts(self):
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            fleetops.make_demo(directory)
            fleetops.do_report(directory)
            summary = json.loads((directory / "reports/summary.json").read_text())
            self.assertEqual(3, summary["summary"]["active_devices"])
            self.assertGreaterEqual(summary["summary"]["open_alerts"], 5)
            self.assertTrue((directory / "reports/alerts.csv").exists())

    def test_demo_refuses_to_overwrite(self):
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            fleetops.make_demo(directory)
            with self.assertRaises(FileExistsError):
                fleetops.make_demo(directory)


if __name__ == "__main__":
    unittest.main()
