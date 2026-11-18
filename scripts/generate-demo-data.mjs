#!/usr/bin/env node
/**
 * Generates realistic 7-day demo telemetry for a Felicity Solar IVEM4024-II (4kW 24V)
 * paired with a 24V 200Ah (5.12 kWh) LiFePO4 Lithium Battery pack.
 * Replaced automatically with live data once FSOLAR_EMAIL & FSOLAR_PASSWORD secrets are set.
 */

import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve(process.cwd(), 'public/data');
fs.mkdirSync(outDir, { recursive: true });

const now = new Date();
const INTERVAL_MIN = 10;
const DAYS = 7;
const TOTAL_POINTS = Math.floor((DAYS * 24 * 60) / INTERVAL_MIN);

const BATTERY_WH = 5120; // 25.6V * 200Ah LiFePO4
let soc = 68;

const history = [];
const dailyBuckets = new Map();

// Deterministic pseudo-noise for realistic cloud passing & appliance cycles
function hash(n) {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

for (let i = TOTAL_POINTS; i >= 0; i--) {
  const ts = new Date(now.getTime() - i * INTERVAL_MIN * 60 * 1000);
  const hour = ts.getHours() + ts.getMinutes() / 60;
  const dayIndex = Math.floor(ts.getTime() / (24 * 3600 * 1000));
  const cloudFactor = 0.78 + 0.22 * hash(dayIndex * 13 + Math.floor(hour * 2));

  // Solar curve (6:00 -> 18:15, peak ~3150W on 4kW IVEM4024-II)
  let pvW = 0;
  if (hour >= 6.0 && hour <= 18.2) {
    const norm = Math.sin(((hour - 6.0) / 12.2) * Math.PI);
    pvW = Math.round(Math.max(0, 3200 * Math.pow(norm, 1.35) * cloudFactor));
  }

  // Realistic home load (fridge + WiFi + lights + midday AC + evening TV/cooking)
  let baseLoad = 280;
  if (hour >= 7 && hour < 10) baseLoad = 620;
  else if (hour >= 10 && hour < 16) baseLoad = 1280; // midday AC / washing machine
  else if (hour >= 16 && hour < 22) baseLoad = 1050; // evening family load
  else if (hour >= 22 || hour < 6) baseLoad = 360; // night load

  const spike = hash(i * 3.7) > 0.86 ? 480 : 0;
  const loadW = Math.round(baseLoad + spike + (hash(i * 1.9) - 0.5) * 140);

  // Energy balance & grid fallback when battery drops low (<26%)
  let gridW = 0;
  let battW = pvW - loadW; // positive = charging, negative = discharging

  if (battW > 0 && soc >= 99) {
    // Battery full: PV throttles down to match load
    pvW = Math.min(pvW, loadW + 40);
    battW = pvW - loadW;
  } else if (battW > 2400) {
    // Cap charge power around ~90A at 26.8V
    battW = 2400;
  }

  if (battW < 0 && soc <= 25) {
    // Grid kicks in to support load + gentle 500W top-up
    gridW = loadW + 450;
    battW = 450;
  }

  const dtH = INTERVAL_MIN / 60;
  soc = Math.max(20, Math.min(100, soc + ((battW * dtH) / BATTERY_WH) * 100));

  // Realistic 8S LiFePO4 voltage curve (24.0V - 27.6V)
  const battV = Number((24.6 + (soc / 100) * 2.5 + (battW / 2500) * 0.45).toFixed(2));
  const pvV = pvW > 20 ? Number((265 + (pvW / 3200) * 95).toFixed(1)) : 0;
  const tempC = Number((29 + (loadW / 4000) * 14 + (pvW / 3200) * 6).toFixed(1));

  const pt = {
    ts: ts.toISOString(),
    pvW,
    loadW,
    gridW,
    battW: Math.round(battW),
    soc: Math.round(soc),
    battV,
    pvV,
    tempC,
  };
  history.push(pt);

  const dateKey = ts.toISOString().slice(0, 10);
  if (!dailyBuckets.has(dateKey)) dailyBuckets.set(dateKey, []);
  dailyBuckets.get(dateKey).push(pt);
}

const daily = [];
for (const [dateKey, pts] of dailyBuckets.entries()) {
  let pvKwh = 0;
  let loadKwh = 0;
  let gridKwh = 0;
  let battChargeKwh = 0;
  let battDischargeKwh = 0;
  let solarActiveHours = 0;
  let solarPoweredHours = 0;
  let batteryPowerHours = 0;
  let gridPowerHours = 0;
  let peakLoadW = 0;
  let peakPvW = 0;
  let minSoc = 100;
  let maxSoc = 0;

  const dtH = INTERVAL_MIN / 60;
  for (const p of pts) {
    pvKwh += (p.pvW * dtH) / 1000;
    loadKwh += (p.loadW * dtH) / 1000;
    gridKwh += (p.gridW * dtH) / 1000;
    if (p.battW > 0) battChargeKwh += (p.battW * dtH) / 1000;
    if (p.battW < 0) battDischargeKwh += (Math.abs(p.battW) * dtH) / 1000;

    if (p.pvW >= 30) solarActiveHours += dtH;
    if (p.pvW >= p.loadW * 0.6 && p.pvW >= 30) solarPoweredHours += dtH;
    else if (p.gridW >= 40) gridPowerHours += dtH;
    else batteryPowerHours += dtH;

    if (p.loadW > peakLoadW) peakLoadW = p.loadW;
    if (p.pvW > peakPvW) peakPvW = p.pvW;
    if (p.soc < minSoc) minSoc = p.soc;
    if (p.soc > maxSoc) maxSoc = p.soc;
  }

  const peakSunHours = peakPvW > 200 ? pvKwh / (peakPvW / 1000) : 0;
  const selfSufficiencyPct =
    loadKwh > 0.05 ? Math.max(0, Math.min(100, Math.round(((loadKwh - gridKwh) / loadKwh) * 100))) : 100;

  daily.push({
    date: dateKey,
    pvKwh: Number(pvKwh.toFixed(2)),
    loadKwh: Number(loadKwh.toFixed(2)),
    gridKwh: Number(gridKwh.toFixed(2)),
    battChargeKwh: Number(battChargeKwh.toFixed(2)),
    battDischargeKwh: Number(battDischargeKwh.toFixed(2)),
    solarActiveHours: Number(solarActiveHours.toFixed(2)),
    solarPoweredHours: Number(solarPoweredHours.toFixed(2)),
    batteryPowerHours: Number(batteryPowerHours.toFixed(2)),
    gridPowerHours: Number(gridPowerHours.toFixed(2)),
    peakSunHours: Number(peakSunHours.toFixed(2)),
    peakLoadW,
    peakPvW,
    minSoc,
    maxSoc,
    selfSufficiencyPct,
    samples: pts.length,
  });
}

// Pick a lively midday-ish latest snapshot if current hour is night, OR keep actual latest point
const last = history[history.length - 1];
const today = daily[daily.length - 1];
const avgCellMv = Math.round((last.battV / 8) * 1000);
const cells = Array.from({ length: 8 }, (_, idx) => ({
  index: idx + 1,
  mv: avgCellMv + ((idx % 3) - 1) * 4,
}));

const latest = {
  mode: 'demo',
  updatedAt: last.ts,
  timeZone: 'UTC',
  devices: [
    { serialNumber: 'IVEM4024-DEMO-01', type: 'HIGH_FREQUENCY_INVERTER', model: 'IVEM4024-II', online: true },
    { serialNumber: 'LPBA24200-DEMO-01', type: 'LITHIUM_BATTERY_PACK', model: '24V 200Ah LiFePO4', online: true },
  ],
  inverter: {
    serialNumber: 'IVEM4024-DEMO-01',
    model: 'IVEM4024-II',
    deviceName: 'Home Solar IVEM4024-II',
    productType: 'HIGH_FREQUENCY_INVERTER',
    online: true,
    firmwareVersion: 'v2.4.18',
    ratedPowerW: 4000,
    workMode: last.pvW > 40 ? 'Solar Priority (SBU)' : last.gridW > 40 ? 'Utility / Grid' : 'Battery Backup',
    pvPowerW: last.pvW,
    pvVoltageV: last.pvV,
    pvCurrentA: last.pvV > 0 ? Number((last.pvW / last.pvV).toFixed(2)) : 0,
    loadPowerW: last.loadW,
    loadPercent: Number(((last.loadW / 4000) * 100).toFixed(1)),
    acOutputVoltageV: 230.2,
    acOutputCurrentA: Number((last.loadW / 230.2).toFixed(2)),
    acOutputFreqHz: 50.0,
    gridPowerW: last.gridW,
    gridVoltageV: last.gridW > 0 ? 228.4 : 229.1,
    gridFreqHz: 50.0,
    batterySoc: last.soc,
    batteryVoltageV: last.battV,
    batteryCurrentA: Number((last.battW / last.battV).toFixed(2)),
    batteryPowerW: last.battW,
    tempC: last.tempC,
    energyPvTodayKwh: today.pvKwh,
    energyPvTotalKwh: Number((1428.5 + today.pvKwh).toFixed(1)),
    energyLoadTodayKwh: today.loadKwh,
    energyLoadTotalKwh: Number((1312.4 + today.loadKwh).toFixed(1)),
    energyGridImportTodayKwh: today.gridKwh,
    energyBatteryChargeTodayKwh: today.battChargeKwh,
    energyBatteryDischargeTodayKwh: today.battDischargeKwh,
    warnCount: 0,
    lastWarnMsg: null,
    bmsConnected: true,
    wifiSignalDbm: -56,
    rawSnapshot: {
      productTypeEnum: 'HIGH_FREQUENCY_INVERTER',
      modelName: 'IVEM4024-II',
      pvTotalPower: last.pvW,
      pvVolt: last.pvV,
      acTotalOutActPower: last.loadW,
      acROutVolt: 230.2,
      acROutFreq: 50.0,
      acRInVolt: 229.1,
      acRInPower: last.gridW,
      emsSoc: last.soc,
      emsVoltage: last.battV,
      emsPower: last.battW,
      tempMax: last.tempC,
      ePvToday: today.pvKwh,
      eLoadToday: today.loadKwh,
    },
  },
  battery: {
    serialNumber: 'LPBA24200-DEMO-01',
    model: '24V 200Ah LiFePO4 (8S)',
    online: true,
    soc: last.soc,
    soh: 99,
    voltageV: last.battV,
    currentA: Number((last.battW / last.battV).toFixed(2)),
    powerW: last.battW,
    chargingState: last.battW > 25 ? 'Charging' : last.battW < -25 ? 'Discharging' : 'Idle',
    tempMaxC: 27.4,
    tempMinC: 25.8,
    capacityAh: 200,
    ratedEnergyKwh: 5.12,
    remainingEnergyKwh: Number(((5.12 * last.soc) / 100).toFixed(2)),
    chargeLimitVoltageV: 28.8,
    dischargeLimitVoltageV: 22.4,
    maxCellMv: Math.max(...cells.map((c) => c.mv)),
    minCellMv: Math.min(...cells.map((c) => c.mv)),
    deltaMv: Math.max(...cells.map((c) => c.mv)) - Math.min(...cells.map((c) => c.mv)),
    cells,
    cellTempsC: [26.2, 26.8, 27.4, 25.8],
    warnCount: 0,
    warnMsg: null,
  },
  today,
};

fs.writeFileSync(path.join(outDir, 'latest.json'), JSON.stringify(latest, null, 2));
fs.writeFileSync(path.join(outDir, 'history.json'), JSON.stringify(history));
fs.writeFileSync(path.join(outDir, 'daily.json'), JSON.stringify(daily, null, 2));

console.log(`✅ Generated 7-day IVEM4024-II demo data (${history.length} samples) in ${outDir}`);
