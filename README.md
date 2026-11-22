# FleetOps Lite – Infrastructure Monitoring & Automation Lab

**Personal learning project. No affiliation with Amazon or any employer. Not a production deployment.**

Offline-first Python 3.10+ lab for mini fleet inventory, host-health monitoring, incident detection, CSV/JSON reports, and operational documentation. Uses Python standard library and Bash; no paid APIs, credentials, or cloud account.

## Run on macOS or Linux

1. Clone this branch, or download the source files.
2. In the repository directory, run: `bash run_demo.sh`
3. To run tests: `python3 -m unittest discover -s tests -v`
4. Inspect the generated `demo_data/reports/` folder.

## Capabilities

- Four **fictional** fleet devices are generated in the demo, three active and one retired.
- Reports disk-usage, memory, patch metadata, stale telemetry, missing ownership, and recorded down services.
- Seven synthetic alerts are generated in the standard demonstration.
- Local machine collection: `python3 fleetops.py collect --data-dir ./local_data --asset-id my-machine`
- Generate a local report: `python3 fleetops.py report --data-dir ./local_data`
- Local collection is read-only. On macOS memory/uptime remain unknown; CPU load pressure is not CPU utilization.
- Includes seven unit tests for threshold alerts, stale data, retired assets, latest snapshot and safe demo behavior.

## Important limitations

- Fleet inventory and remote-device data in the demo are synthetic; no remote agents or real production systems.
- Patch age and service status are manually recorded demonstration fields.
- Does not use AWS EC2, Lambda, CloudWatch, S3 or Systems Manager. These are possible future integrations only.
- Not evidence of multi-year Linux or systems engineering employment.

## Interview explanation

"I built FleetOps Lite as a personal infrastructure operations lab. It tracks a small sample asset fleet, processes local/synthetic health observations, checks thresholds, and generates incident reports. I wrote Python and Bash scripts and included tests and a runbook. It is a lab prototype, not production deployment."

Project source prepared for technical learning and interview demonstration. Please evaluate code and limitations together.
