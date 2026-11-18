# FSolar Dashboard — Open-Source Felicity Solar Monitor

A modern, open-source React dashboard that replaces the official **FSolar** app for **any Felicity Solar inverter & lithium battery system** (IVEM, IVGM, T-REX, LPBA/LPBF, 12V / 24V / 48V).

Connects to your existing **FSolar Wi-Fi dongle** via the Felicity Cloud API (`shine-api.felicitysolar.com`) and hosts **100% free on GitHub Pages + GitHub Actions** — no paid server, no Raspberry Pi, and your credentials stay encrypted in GitHub Secrets.

## Supported Hardware
Works automatically with any device connected to your **FSolar / Shine Felicity Solar** account:
- **Inverters:** High-Frequency & Hybrid inverters (e.g. `IVEM4024-II`, `IVEM5048`, `IVGM`, `T-REX`, etc.)
- **Batteries:** 12V, 24V, and 48V Felicity Lithium / LiFePO4 battery packs (both direct Wi-Fi BMS packs and BMS data read through the inverter)

## Features
- **Live Energy Flow Diagram:** Real-time animated power flow between Solar PV, Grid AC, Lithium Battery, and Home Load.
- **Power Hours Analytics:** Tracks daily **Solar Active Hours**, **Peak Sun Hours**, **Battery Backup Hours**, and **Grid Hours**.
- **Interactive Backup Runtime Estimator:** Drag the load slider to instantly see how many hours your battery will last at any wattage.
- **Consumption & Production Charts:** 24h / 48h / 7-day interactive power + SOC timeline and 14-day daily kWh breakdown.
- **Lithium BMS Diagnostics:** Pack voltage, current, SOC/SOH, temperature, charge/discharge limits, and per-cell voltages (mV balance delta when supported).
- **Raw API Inspector:** Inspect every raw field returned by your inverter from FSolar Cloud.

---

## Use It For Your Own Solar System (2-Minute Fork & Deploy)

Anyone with a Felicity Solar system can deploy their own private-credential dashboard for free:

### Step 1: Fork (or Use Template)
Click **Fork** in the top-right corner of this GitHub repository to create your own copy.

### Step 2: Enable GitHub Actions & GitHub Pages
1. In your forked repo, go to **Settings → Actions → General → Workflow permissions** → choose **Read and write permissions** → **Save**.
2. Go to **Actions → Deploy Dashboard to GitHub Pages → Run workflow** (this creates the `gh-pages` branch).
3. Go to **Settings → Pages → Build and deployment → Source** → select **Deploy from a branch** → branch **`gh-pages`** → folder **`/ (root)`** → **Save**.

### Step 3: Add Your FSolar Account as Encrypted Secrets
1. Go to **Settings → Secrets and variables → Actions → Secrets**.
2. Click **New repository secret** and add:
   - `FSOLAR_EMAIL` — your FSolar app email
   - `FSOLAR_PASSWORD` — your FSolar app password
3. *(Optional)* Switch to the **Variables** tab and customize:
   - `BATTERY_CAPACITY_AH` — your battery capacity in Ah (default: `200`)
   - `BATTERY_NOMINAL_VOLTAGE` — nominal battery voltage (auto-detected, e.g. `25.6` for 24V LiFePO4, `51.2` for 48V LiFePO4)
   - `SOLAR_TIMEZONE` — your IANA timezone (e.g. `Asia/Baghdad`, `Africa/Cairo`, `Asia/Beirut`, `Europe/London`, `UTC`)

### Step 4: Trigger Your First Live Sync
Go to **Actions → Sync FSolar Live Data → Run workflow**. Within ~15 seconds, your live inverter telemetry will appear at:
```text
https://<YOUR_GITHUB_USERNAME>.github.io/<YOUR_REPO_NAME>/
```
From then on, GitHub Actions automatically syncs fresh data every **10 minutes** and builds your daily consumption & power-hours history!

> **Privacy Note:** Your `FSOLAR_EMAIL` and `FSOLAR_PASSWORD` are stored in encrypted GitHub Secrets and are **never** committed to the repository or exposed to the browser. Only sanitized power/battery telemetry JSON is published to GitHub Pages.

---

## Local Development & Testing
```bash
npm install

# Preview immediately with built-in demo data
npm run dev

# Or test with your real FSolar account locally:
cp .env.example .env
# Edit .env with your FSOLAR_EMAIL and FSOLAR_PASSWORD
npm run sync
```

## License
MIT — free to fork, modify, and share with the Felicity Solar community.
