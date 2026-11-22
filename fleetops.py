#!/usr/bin/env python3
"""FleetOps Lite: local fleet inventory, host health and incident reporting lab.

Educational demonstration. No remote management, cloud calls, or privileged actions.
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import os
import platform
import shutil
import socket
import subprocess
import sys
from pathlib import Path
from typing import Any

DEFAULT_THRESHOLDS = {"disk_pct": 85, "memory_pct": 90, "patch_age_days": 45, "stale_hours": 24}


def utcnow() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


def iso(t: dt.datetime) -> str:
    return t.astimezone(dt.timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def parse_iso(s: str) -> dt.datetime:
    value = dt.datetime.fromisoformat(s.replace("Z", "+00:00"))
    if value.tzinfo is None:
        raise ValueError("Timestamp must include timezone")
    return value


def read_json(path: Path, default: Any) -> Any:
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else default


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def append_jsonl(path: Path, item: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(item, sort_keys=True) + "\n")


def load_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    with path.open(encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def load_thresholds(data_dir: Path) -> dict[str, float]:
    config = read_json(data_dir / "thresholds.json", DEFAULT_THRESHOLDS)
    for key in DEFAULT_THRESHOLDS:
        if key not in config or not isinstance(config[key], (int, float)) or config[key] < 0:
            raise ValueError(f"Invalid or missing threshold: {key}")
    return config


def memory_pct() -> float | None:
    """Read percentage of used memory on Linux; unsupported platforms return None."""
    if platform.system() != "Linux":
        return None
    try:
        fields: dict[str, int] = {}
        for line in Path("/proc/meminfo").read_text().splitlines():
            name, _, value = line.partition(":")
            if name in ("MemTotal", "MemAvailable"):
                fields[name] = int(value.strip().split()[0])
        total, available = fields["MemTotal"], fields["MemAvailable"]
        return round(100 * (total - available) / total, 1) if total else None
    except (OSError, ValueError, KeyError):
        return None


def load_pct() -> float | None:
    """1-minute load average / CPU count; a load-pressure proxy, NOT actual CPU usage."""
    try:
        return round(100 * os.getloadavg()[0] / max(os.cpu_count() or 1, 1), 1)
    except (OSError, AttributeError):
        return None


def uptime_hours() -> float | None:
    """Linux /proc/uptime only; intentionally not guessed for macOS."""
    if platform.system() != "Linux":
        return None
    try:
        return round(float(Path("/proc/uptime").read_text().split()[0]) / 3600, 1)
    except (OSError, ValueError, IndexError):
        return None


def local_snapshot(asset_id: str) -> dict:
    return {
        "asset_id": asset_id,
        "observed_at": iso(utcnow()),
        "disk_pct": round(shutil.disk_usage("/").used * 100 / shutil.disk_usage("/").total, 1),
        "memory_pct": memory_pct(),
        "load_pressure_pct": load_pct(),
        "uptime_hours": uptime_hours(),
        "service_status": "unknown",   # No network probes or service assumptions
        "sample_type": "local_observation"
    }


def latest_snapshots(snapshots: list[dict]) -> dict[str, dict]:
    latest: dict[str, dict] = {}
    for snap in snapshots:
        asset_id = snap["asset_id"]
        if asset_id not in latest or parse_iso(snap["observed_at"]) > parse_iso(latest[asset_id]["observed_at"]):
            latest[asset_id] = snap
    return latest


def make_alert(asset: dict, code: str, severity: str, details: str) -> dict:
    return {"asset_id": asset["asset_id"], "hostname": asset.get("hostname", ""),
            "severity": severity, "code": code, "details": details}


def assess_asset(asset: dict, snap: dict | None, now: dt.datetime,
                 thresholds: dict[str, float]) -> list[dict]:
    """Pure evaluation logic; no side effects or external calls."""
    if asset.get("lifecycle") != "active":
        return []  # Retired assets excluded from health compliance
    alerts: list[dict] = []
    if not asset.get("owner") or not asset.get("site"):
        alerts.append(make_alert(asset, "MISSING_METADATA", "MEDIUM", "Owner or site not recorded"))
    age = asset.get("patch_age_days")
    if isinstance(age, (int, float)) and age > thresholds["patch_age_days"]:
        alerts.append(make_alert(asset, "PATCH_OVERDUE", "MEDIUM", f"Recorded patch age: {age} days"))
    if snap is None:
        alerts.append(make_alert(asset, "NO_TELEMETRY", "HIGH", "No observation available"))
    else:
        last_age = max(0, (now - parse_iso(snap["observed_at"])).total_seconds() / 3600)
        if last_age > thresholds["stale_hours"]:
            alerts.append(make_alert(asset, "STALE_TELEMETRY", "HIGH", f"Last observation {last_age:.1f} hours ago"))
        if snap.get("service_status") == "down":
            alerts.append(make_alert(asset, "SERVICE_DOWN", "HIGH", "Recorded service status is down"))
        for field, label in (("disk_pct", "DISK_HIGH"), ("memory_pct", "MEMORY_HIGH")):
            val = snap.get(field)
            if isinstance(val, (int, float)) and val >= thresholds[field]:
                alerts.append(make_alert(asset, label, "HIGH" if field == "disk_pct" else "MEDIUM",
                                         f"Observed {field}: {val}% (threshold {thresholds[field]}%)"))
    return alerts


def make_demo(data_dir: Path, force: bool = False) -> None:
    data_dir.mkdir(parents=True, exist_ok=True)
    known_paths = [data_dir / p for p in ("inventory.json", "snapshots.jsonl", "thresholds.json")]
    if not force and any(p.exists() for p in known_paths):
        raise FileExistsError("Demo would overwrite existing data. Use a fresh directory or --force.")
    now = utcnow()
    devices = [
        {"asset_id": "dev-001", "hostname": "office-linux-01", "site": "Bengaluru", "owner": "IT Ops", "os_family": "Linux", "lifecycle": "active", "firmware_version": "2.10", "patch_age_days": 7},
        {"asset_id": "dev-002", "hostname": "office-linux-02", "site": "Bengaluru", "owner": "IT Ops", "os_family": "Linux", "lifecycle": "active", "firmware_version": "2.02", "patch_age_days": 71},
        {"asset_id": "dev-003", "hostname": "edge-linux-01", "site": "Hyderabad", "owner": "", "os_family": "Linux", "lifecycle": "active", "firmware_version": "1.07", "patch_age_days": 48},
        {"asset_id": "dev-004", "hostname": "legacy-asset", "site": "Bengaluru", "owner": "IT Ops", "os_family": "Linux", "lifecycle": "retired", "firmware_version": "1.00", "patch_age_days": 300},
    ]
    observations = [
        {"asset_id": "dev-001", "observed_at": iso(now-dt.timedelta(minutes=4)), "disk_pct": 42, "memory_pct": 35, "service_status": "up", "sample_type": "simulated"},
        {"asset_id": "dev-002", "observed_at": iso(now-dt.timedelta(minutes=6)), "disk_pct": 93, "memory_pct": 92, "service_status": "up", "sample_type": "simulated"},
        {"asset_id": "dev-003", "observed_at": iso(now-dt.timedelta(hours=53)), "disk_pct": 68, "memory_pct": 61, "service_status": "down", "sample_type": "simulated"},
    ]
    write_json(data_dir/"inventory.json", devices)
    write_json(data_dir/"thresholds.json", DEFAULT_THRESHOLDS)
    (data_dir/"snapshots.jsonl").write_text("".join(json.dumps(s)+"\n" for s in observations), encoding="utf-8")
    print(f"Demo created: {data_dir} (4 devices, 3 synthetic observations; no real infrastructure affected)")


def do_collect(data_dir: Path, asset_id: str) -> None:
    data_dir.mkdir(parents=True, exist_ok=True)
    inv = read_json(data_dir/"inventory.json", [])
    hostname = socket.gethostname()
    if not any(asset["asset_id"] == asset_id for asset in inv):
        inv.append({"asset_id": asset_id, "hostname": hostname, "site": "local lab", "owner": "local user",
                    "os_family": platform.system(), "lifecycle": "active", "firmware_version": "not-collected", "patch_age_days": None})
        write_json(data_dir/"inventory.json", inv)
    if not (data_dir/"thresholds.json").exists():
        write_json(data_dir/"thresholds.json", DEFAULT_THRESHOLDS)
    snap = local_snapshot(asset_id)
    append_jsonl(data_dir/"snapshots.jsonl", snap)
    print(f"Observed local host '{hostname}' as {asset_id} at {snap['observed_at']}")
    print("Note: memory/uptime supported on Linux; CPU is a load-pressure estimate, not utilization.")


def do_report(data_dir: Path) -> None:
    inventory = read_json(data_dir/"inventory.json", [])
    if not inventory:
        raise ValueError("No inventory found. Run demo or collect first.")
    latest = latest_snapshots(load_jsonl(data_dir/"snapshots.jsonl"))
    thresholds = load_thresholds(data_dir)
    now = utcnow()
    alerts = [alert for asset in inventory
              for alert in assess_asset(asset, latest.get(asset["asset_id"]), now, thresholds)]
    severity_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    alerts.sort(key=lambda a: (severity_order.get(a["severity"], 9), a["asset_id"], a["code"]))
    summary = {"active_devices": sum(a.get("lifecycle") == "active" for a in inventory),
               "retired_devices": sum(a.get("lifecycle") == "retired" for a in inventory),
               "devices_with_alerts": len({a["asset_id"] for a in alerts}), "open_alerts": len(alerts)}
    report_dir = data_dir/"reports"
    report_dir.mkdir(parents=True, exist_ok=True)
    alert_file = report_dir/"alerts.csv"
    with alert_file.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["asset_id", "hostname", "severity", "code", "details"])
        writer.writeheader()
        writer.writerows(alerts)
    summary_file = report_dir/"summary.json"
    write_json(summary_file, {"generated_at": iso(now), "summary": summary, "thresholds": thresholds})
    lines = ["# FleetOps Lite - Fleet Health Report", "", f"Generated (UTC): {iso(now)}", "",
             f"- Active devices: {summary['active_devices']}", f"- Retired devices: {summary['retired_devices']}",
             f"- Devices with alerts: {summary['devices_with_alerts']}", f"- Open alerts: {summary['open_alerts']}", "",
             "## Findings", ""]
    lines += [f"- **{a['severity']}** | `{a['asset_id']}` | {a['code']}: {a['details']}" for a in alerts] or ["- No alerts under current thresholds."]
    lines += ["", "## Operator runbook", "", "1. Verify the affected asset and its recent telemetry.",
              "2. Confirm whether the incident is reproducible; do not rely on synthetic data.",
              "3. Triage disk, memory, service or patching issue with change approval.",
              "4. Record owner, escalation, action taken, and post-fix verification.",
              "5. Re-run collection and report; close only after verification.", "",
              "*Educational lab. Simulated readings are not production evidence.*", ""]
    (report_dir/"report.md").write_text("\n".join(lines), encoding="utf-8")
    print(f"Active devices: {summary['active_devices']} | Alerts: {summary['open_alerts']} | Affected: {summary['devices_with_alerts']}")
    print(f"Reports: {report_dir/'report.md'} | {alert_file} | {summary_file}")
    for a in alerts[:10]:
        print(f"  [{a['severity']}] {a['asset_id']}: {a['code']}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="FleetOps Lite - safe local Linux infrastructure lab")
    subs = parser.add_subparsers(dest="command", required=True)
    for command in ("demo", "collect", "report"):
        p = subs.add_parser(command)
        p.add_argument("--data-dir", default="./fleet_data", type=Path, help="Output directory (default ./fleet_data)")
        if command == "demo":
            p.add_argument("--force", action="store_true", help="Overwrite existing demo data")
        if command == "collect":
            p.add_argument("--asset-id", default="my-workstation")
    args = parser.parse_args(argv)
    try:
        if args.command == "demo":
            make_demo(args.data_dir, force=args.force)
        elif args.command == "collect":
            do_collect(args.data_dir, args.asset_id)
        elif args.command == "report":
            do_report(args.data_dir)
        return 0
    except (OSError, ValueError, KeyError, json.JSONDecodeError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
