# Felicity Solar IVEM4024-II — Live Energy Dashboard

A clean, dark-mode React dashboard for **Felicity Solar** inverters (tailored for the **IVEM4024-II 4kW 24V** + **24V Lithium Battery**) that pulls live telemetry directly from the **FSolar Cloud API** (`shine-api.felicitysolar.com`) and hosts **100% free on GitHub Pages + GitHub Actions**.

## Features
- **Live Energy Flow Diagram**: Real-time animated power flow between Solar PV, Grid AC, 24V Lithium Battery, and Home Load.
- **Power Hours Breakdown**: Automatically tracks **Solar Active Hours**, **Peak Sun Hours**, **Battery Backup Hours**, and **Grid Hours** every day.
- **Interactive Backup Runtime Simulator**: Slider to calculate exact remaining hours on your 24V lithium battery at any load (250W – 4000W).
- **Consumption & Production Charts**: 24h / 48h / 7-day interactive power & SOC timeline + 14-day kWh bar chart.
- **Lithium BMS Diagnostics**: Pack voltage, current, SOC/SOH, temperature, charge/discharge limits, and 8S per-cell voltage balancing (when reported by BMS).
- **Raw FSolar API Inspector**: Expandable JSON viewer showing every raw field returned by your inverter.
- **Zero-Cost Hosting**: GitHub Actions fetches data every 10 minutes using encrypted Secrets (your password is never exposed in the browser) and publishes directly to GitHub Pages.

---

## Deploy Free on GitHub (3-Minute Setup)

### 1. Push this project to a GitHub repository
```bash
git init
git add .
git commit -m "Initial Felicity Solar dashboard"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
git push -u origin main
```

### 2. Enable GitHub Pages
1. In your GitHub repo, go to **Settings → Pages**.
2. Wait ~1 minute for the **Deploy Dashboard to GitHub Pages** workflow to finish creating the `gh-pages` branch.
3. Under **Build and deployment → Source**, choose **Deploy from a branch** → branch **`gh-pages`** → folder **`/ (root)`** → click **Save**.
4. Your dashboard is now live at `https://<YOUR_USERNAME>.github.io/<YOUR_REPO>/`!

### 3. Connect Your Real FSolar Account (Encrypted Secrets)
1. Go to **Settings → Secrets and variables → Actions → Secrets**.
2. Click **New repository secret** and add:
   - `FSOLAR_EMAIL` — your FSolar app login email
   - `FSOLAR_PASSWORD` — your FSolar app password
3. *(Optional)* Under the **Variables** tab, add:
   - `BATTERY_CAPACITY_AH` (e.g. `200` for a 24V 200Ah lithium battery)
   - `BATTERY_NOMINAL_VOLTAGE` (e.g. `25.6` for 8S LiFePO4)
   - `SOLAR_TIMEZONE` (e.g. `Asia/Baghdad`, `Africa/Cairo`, `Asia/Beirut`, `Europe/London`)
4. Go to **Actions → Sync FSolar Live Data → Run workflow** to pull your first live snapshot immediately! After that, it updates automatically every 10 minutes.

> **Tip:** Make sure **Settings → Actions → General → Workflow permissions** is set to **Read and write permissions** so the sync bot can push updated JSON files to `gh-pages`.

---

## Test Locally on Your PC First
```bash
# 1. Install dependencies
npm install

# 2. (Optional) Test with your real FSolar login locally
cp .env.example .env
# Edit .env with your FSOLAR_EMAIL and FSOLAR_PASSWORD, then run:
npm run sync

# 3. Start the React dashboard
npm run dev
```

To reset back to 7-day IVEM4024-II demo data at any time:
```bash
npm run demo-data
```
