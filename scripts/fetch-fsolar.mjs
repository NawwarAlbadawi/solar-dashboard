#!/usr/bin/env node
/**
 * Felicity Solar (FSolar / Shine) Cloud API Collector
 * Zero external dependencies — runs in Node 20+ and GitHub Actions in ~5 seconds.
 *
 * Usage:
 *   FSOLAR_EMAIL=... FSOLAR_PASSWORD=... node scripts/fetch-fsolar.mjs [--out-dir public/data]
 * Or create a local .env file and run:
 *   npm run sync
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';

const API_HOST = 'shine-api.felicitysolar.com';
const LOGIN_HOST = 'shine.felicitysolar.com';

// Verified fallback RSA public key from Felicity Solar web portal
const FALLBACK_RSA_PUB = Buffer.from(
  'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFuQUpFNjhwaldabXRTZzZaSnM5RgpadWdKWEM2YkJTbHVUVzZtSnR0T0xPYWxqcmRFclZuTTVETk4rWUZ6cEI5cEF5c1RFcmpZMWJuU1Z1RXdRU3dwCnRucVVqaTdDaDJxTWoybiswZUNwOHA2dnRTaDcvdEZyMnVsOG5EUnRrb3N3TEFOQUl3dFVrL0c4NWlwTXBtWTEKVzY0MkxJbW5FSm1Ha2tkZGxiamJqeEpUWldSNWhjL2Q5Y1BXYitBUjc3THhGRnJNaWszYys0NHYxa1FsSVBGUAo2RWpJYk92dC9MdjdmSFdEOUpJL1l6TjR5MWdLN0MvVlFkTkd1aWtReU5nKzVXM3JnOWVjWWY5STV1TEFRd1kKL2h4ZUkzbGJOc0VyZWJxS2UyRWJKOEF3Y05JQzBsREJ6NTNTcTBNTDg5UWFwRXV5M2ZCK3VwdWN0eExVTFZEQwpiTndJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0t',
  'base64'
).toString('utf8');

const WORK_MODE_MAP = {
  0: 'Power On',
  1: 'Standby',
  2: 'Line / Grid',
  3: 'Battery',
  4: 'Fault',
  5: 'Hybrid',
  6: 'Charge',
  7: 'Bypass',
};

// Felicity servers omit intermediate CA certs — disable verification ONLY for their hosts.
const felicityAgent = new https.Agent({ rejectUnauthorized: false });

function loadDotEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!(key in process.env)) {
      process.env[key] = val;
    }
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  let outDir = 'public/data';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out-dir' && args[i + 1]) {
      outDir = args[i + 1];
      i++;
    }
  }
  return { outDir: path.resolve(process.cwd(), outDir) };
}

function httpsRequest(hostname, urlPath, { method = 'GET', headers = {}, body = null, timeoutMs = 15000 } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body !== null ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const reqHeaders = { ...headers };
    if (payload !== null) {
      reqHeaders['Content-Type'] = reqHeaders['Content-Type'] || 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = https.request(
      {
        hostname,
        port: 443,
        path: urlPath,
        method,
        headers: reqHeaders,
        agent: felicityAgent,
        timeout: timeoutMs,
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          resolve({ status: res.statusCode || 0, text });
        });
      }
    );

    req.on('timeout', () => {
      req.destroy(new Error(`Request timeout (${timeoutMs}ms): https://${hostname}${urlPath}`));
    });
    req.on('error', reject);

    if (payload !== null) req.write(payload);
    req.end();
  });
}

async function apiPost(urlPath, body, token = null) {
  const headers = {
    Accept: 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = token.startsWith('Bearer_') ? token : `Bearer_${token}`;
  }
  const { status, text } = await httpsRequest(API_HOST, urlPath, {
    method: 'POST',
    headers,
    body,
  });
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Felicity API ${urlPath} returned non-JSON (HTTP ${status}): ${text.slice(0, 160)}`);
  }
  if (status >= 400) {
    throw new Error(`Felicity API ${urlPath} HTTP ${status}: ${json.message || text.slice(0, 160)}`);
  }
  return json;
}

async function extractPublicKey() {
  try {
    const loginHtml = await httpsRequest(LOGIN_HOST, '/login', { timeoutMs: 8000 });
    let combined = loginHtml.text;
    const headMatch = combined.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    const head = headMatch ? headMatch[1] : '';
    const idxMatch = head.match(/(?:href|src)=["']([^"']*\/index\.[^"']*\.js)["']/i);
    const scriptPaths = [];

    if (idxMatch) {
      const idxPath = idxMatch[1].startsWith('/') ? idxMatch[1] : `/${idxMatch[1]}`;
      const idxRes = await httpsRequest(LOGIN_HOST, idxPath, { timeoutMs: 8000 });
      combined += '\n' + idxRes.text;
      const loginRoute = idxRes.text.match(/path:\s*["']\/login["'][\s\S]*?component:\s*\(\)\s*=>[\s\S]*?\[(.*?)\]/);
      if (loginRoute) {
        const matches = [...loginRoute[1].matchAll(/["']([^"']*\/index\.[^"']*\.js)["']/g)];
        for (const m of matches) {
          scriptPaths.push(m[1].startsWith('/') ? m[1] : `/${m[1]}`);
        }
      }
    }

    for (const sp of scriptPaths.slice(0, 4)) {
      const res = await httpsRequest(LOGIN_HOST, sp, { timeoutMs: 8000 });
      combined += '\n' + res.text;
    }

    const pkCall = combined.match(/setPublicKey\s*\(\s*([a-zA-Z0-9_$]+)\s*\)/);
    if (pkCall) {
      const varName = pkCall[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const assignRegex = new RegExp(`${varName}\\s*=\\s*(['"\`])(.*?)\\1`, 'g');
      const candidates = [...combined.matchAll(assignRegex)].map((m) => m[2]);
      if (candidates.length > 0) {
        const best = candidates.sort((a, b) => b.length - a.length)[0];
        if (best.length > 100) {
          return `-----BEGIN PUBLIC KEY-----\n${best}\n-----END PUBLIC KEY-----`;
        }
      }
    }
  } catch (err) {
    console.warn(`[FSolar] Dynamic key lookup skipped (${err.message}); using fallback key.`);
  }
  return FALLBACK_RSA_PUB;
}

async function login(email, password) {
  const pubKey = await extractPublicKey();
  const encryptedPassword = crypto
    .publicEncrypt(
      { key: pubKey, padding: crypto.constants.RSA_PKCS1_PADDING },
      Buffer.from(password, 'utf8')
    )
    .toString('base64');

  const resp = await apiPost('/userlogin', {
    userName: email,
    password: encryptedPassword,
    version: '1.0',
  });

  const rawToken = resp?.data?.token ?? resp?.data?.data?.token;
  if (!rawToken) {
    throw new Error(`FSolar login failed: ${resp?.message || JSON.stringify(resp).slice(0, 200)}`);
  }
  return String(rawToken);
}

function num(val, fallback = 0) {
  if (val === null || val === undefined || val === '') return fallback;
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

function maybeNum(val) {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function parseCellVoltages(snap) {
  const cells = [];
  const listKeys = ['bmsVoltageList', 'cellVoltList', 'cellVoltageList', 'voltageList', 'cellVoltages'];
  let list = [];
  for (const k of listKeys) {
    const v = snap[k];
    if (Array.isArray(v) && v.length) {
      list = v;
      break;
    }
    if (typeof v === 'string' && v.trim()) {
      try {
        const parsed = JSON.parse(v);
        if (Array.isArray(parsed)) {
          list = parsed;
          break;
        }
      } catch {
        const parts = v.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
        if (parts.length > 1) {
          list = parts;
          break;
        }
      }
    }
  }

  for (let i = 1; i <= 16; i++) {
    const pad = String(i).padStart(2, '0');
    const raw =
      snap[`cellVolt${i}`] ??
      snap[`cellVolt${pad}`] ??
      snap[`cellVoltage${i}`] ??
      snap[`bmsVolt${i}`] ??
      list[i - 1];
    if (raw === undefined || raw === null || raw === '' || raw === 0 || raw === '0') continue;
    const cleaned = typeof raw === 'string' ? raw.replace(/mv|v|\s/gi, '').replace(',', '.') : raw;
    const v = Number(cleaned);
    if (!Number.isFinite(v) || v <= 0) continue;
    const mv = v < 100 ? Math.round(v * 1000) : Math.round(v);
    cells.push({ index: i, mv });
  }
  return cells;
}

function formatDateKey(date, timeZone) {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    return `${map.year}-${map.month}-${map.day}`;
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function formatLocalTimestamp(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function readJsonSafe(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function parseInverterSnapshot(sn, meta, snap) {
  const pvPower = num(snap.pvTotalPower ?? snap.pvPower ?? (num(snap.pv1Power) + num(snap.pv2Power)));
  const loadPower = num(
    snap.acTotalOutActPower ?? snap.acBackupPowerL1 ?? snap.totalConsumptionPower ?? snap.meterPower
  );
  const gridPower = num(snap.acRInPower ?? snap.acTotalGridPower ?? snap.acGridPowerL1);
  const batteryVoltage = num(snap.emsVoltage ?? snap.battVolt);
  const batteryCurrent = num(snap.emsCurrent ?? snap.battCurr);
  const rawBattPower = maybeNum(snap.emsPower ?? snap.bmsPower);
  const batteryChargingPower = num(snap.batteryChargingPower ?? snap.batCharPower);
  const batteryDischargingPower = num(snap.batteryDischargingPower ?? snap.batDischarPower);
  let batteryPower = rawBattPower !== null ? rawBattPower : Math.round(batteryVoltage * batteryCurrent);
  if (batteryPower === 0 && (batteryChargingPower > 0 || batteryDischargingPower > 0)) {
    batteryPower = batteryChargingPower > 0 ? batteryChargingPower : -batteryDischargingPower;
  }

  const workModeCode = maybeNum(snap.workMode ?? snap.workModel);
  const workMode =
    snap.workModeStr ||
    snap.operMStr ||
    (workModeCode !== null && WORK_MODE_MAP[workModeCode]) ||
    (pvPower > 40 && gridPower < 40 ? 'Solar Priority' : gridPower > 40 ? 'Grid / Line' : 'Battery');

  return {
    serialNumber: sn,
    model: meta?.deviceModel || snap.modelName || snap.deviceModel || 'IVEM4024-II',
    deviceName: meta?.deviceName || snap.deviceName || 'Felicity Solar Inverter',
    productType: snap.productTypeEnum || meta?.productTypeEnum || 'HIGH_FREQUENCY_INVERTER',
    online: meta?.status !== '0' && meta?.status !== 0 && meta?.online !== false,
    firmwareVersion: snap.firmwareVersion || meta?.firmwareVersion || null,
    ratedPowerW: num(snap.ratedPower, 4) > 100 ? num(snap.ratedPower) : num(snap.ratedPower, 4) * 1000,
    workMode,
    pvPowerW: Math.round(pvPower),
    pvVoltageV: Number(num(snap.pvVolt ?? snap.pv1Volt).toFixed(1)),
    pvCurrentA: Number(num(snap.pvInCurr ?? snap.pv1Curr).toFixed(2)),
    loadPowerW: Math.round(loadPower),
    loadPercent: Number(num(snap.loadPercent, Math.min(100, (loadPower / 4000) * 100)).toFixed(1)),
    acOutputVoltageV: Number(num(snap.acROutVolt, 230).toFixed(1)),
    acOutputCurrentA: Number(num(snap.acROutCurr).toFixed(2)),
    acOutputFreqHz: Number(num(snap.acROutFreq, 50).toFixed(1)),
    gridPowerW: Math.round(gridPower),
    gridVoltageV: Number(num(snap.acRInVolt).toFixed(1)),
    gridFreqHz: Number(num(snap.acRInFreq).toFixed(1)),
    batterySoc: Math.round(num(snap.emsSoc ?? snap.battSoc)),
    batteryVoltageV: Number(batteryVoltage.toFixed(2)),
    batteryCurrentA: Number(batteryCurrent.toFixed(2)),
    batteryPowerW: Math.round(batteryPower),
    tempC: Number(num(snap.tempMax ?? snap.devTempMax).toFixed(1)),
    energyPvTodayKwh: maybeNum(snap.ePvToday ?? snap.epvToday),
    energyPvTotalKwh: maybeNum(snap.ePvTotal ?? snap.totalEnergy),
    energyLoadTodayKwh: maybeNum(snap.eLoadToday ?? snap.eloadToday),
    energyLoadTotalKwh: maybeNum(snap.eLoadTotal),
    energyGridImportTodayKwh: maybeNum(snap.eToday ?? snap.eGridImportToday),
    energyBatteryChargeTodayKwh: maybeNum(snap.eBatCharToday ?? snap.ebatCharToday),
    energyBatteryDischargeTodayKwh: maybeNum(snap.eBatDisCharToday ?? snap.ebatDischarToday),
    warnCount: num(snap.warnCount),
    lastWarnMsg: snap.lastWarnMsg || snap.warnMsg || null,
    bmsConnected: Boolean(snap.bmsCommunicationStatus || snap.emsSoc !== undefined),
    wifiSignalDbm: maybeNum(snap.wifiSignal),
    rawSnapshot: snap,
  };
}

function parseBatterySnapshot(sn, meta, snap) {
  const voltageV = Number(num(snap.battVolt ?? snap.voltage).toFixed(2));
  const currentA = Number(num(snap.battCurr ?? snap.current).toFixed(2));
  const powerW = Math.round(num(snap.bmsPower ?? snap.power, voltageV * currentA));
  const soc = Math.round(num(snap.battSoc ?? snap.soc ?? snap.emsSocAvg));
  const soh = Math.round(num(snap.battSoh ?? snap.soh, 100));
  const capacityAh = maybeNum(snap.battCapacity ?? snap.capacity);
  const ratedEnergyKwh = maybeNum(snap.ratedEnergy) ?? (capacityAh ? Number(((capacityAh * 25.6) / 1000).toFixed(2)) : null);
  const remainingEnergyKwh =
    maybeNum(snap.remainingBatteryEnergy1 ?? snap.remainingBatteryEnergy ?? snap.remainEnergy) ??
    (ratedEnergyKwh !== null ? Number(((ratedEnergyKwh * soc) / 100).toFixed(2)) : null);

  const cells = parseCellVoltages(snap);
  const maxCellMv =
    maybeNum(snap.maxVoltage2bms ?? snap.maxCellVoltage) ??
    (cells.length ? Math.max(...cells.map((c) => c.mv)) : null);
  const minCellMv =
    maybeNum(snap.minVoltage2bms ?? snap.minCellVoltage) ??
    (cells.length ? Math.min(...cells.map((c) => c.mv)) : null);
  const deltaMv = maxCellMv !== null && minCellMv !== null ? Math.round(maxCellMv - minCellMv) : null;

  const stateRaw = snap.bmsChargingState;
  const chargingState =
    stateRaw === 1 || powerW > 25
      ? 'Charging'
      : stateRaw === 2 || powerW < -25
        ? 'Discharging'
        : 'Idle';

  return {
    serialNumber: sn,
    model: meta?.deviceModel || snap.batteryType || '24V Lithium Pack (LiFePO4)',
    online: meta?.status !== '0' && meta?.status !== 0,
    soc,
    soh,
    voltageV,
    currentA,
    powerW,
    chargingState,
    tempMaxC: maybeNum(snap.tempMax),
    tempMinC: maybeNum(snap.tempMin),
    capacityAh,
    ratedEnergyKwh,
    remainingEnergyKwh,
    chargeLimitVoltageV: maybeNum(snap.BMSLCVolt ?? snap.chargeLimitVoltage),
    dischargeLimitVoltageV: maybeNum(snap.BMSLDVolt ?? snap.dischargeLimitVoltage),
    maxCellMv: maxCellMv !== null && maxCellMv < 100 ? Math.round(maxCellMv * 1000) : maxCellMv,
    minCellMv: minCellMv !== null && minCellMv < 100 ? Math.round(minCellMv * 1000) : minCellMv,
    deltaMv,
    cells,
    cellTempsC: [snap.cellTemp1, snap.cellTemp2, snap.cellTemp3, snap.cellTemp4]
      .map(maybeNum)
      .filter((t) => t !== null),
    warnCount: num(snap.warnCount),
    warnMsg: snap.warnMsg || null,
  };
}

function buildSynthesizedBattery(inv, defaultCapacityAh, defaultNominalV) {
  const ratedEnergyKwh = Number(((defaultCapacityAh * defaultNominalV) / 1000).toFixed(2));
  const remainingEnergyKwh = Number(((ratedEnergyKwh * inv.batterySoc) / 100).toFixed(2));
  const chargingState =
    inv.batteryPowerW > 25 ? 'Charging' : inv.batteryPowerW < -25 ? 'Discharging' : 'Idle';

  return {
    serialNumber: `${inv.serialNumber}-BMS`,
    model: '24V Lithium Battery (via Inverter BMS)',
    online: inv.online,
    soc: inv.batterySoc,
    soh: 100,
    voltageV: inv.batteryVoltageV || defaultNominalV,
    currentA: inv.batteryCurrentA,
    powerW: inv.batteryPowerW,
    chargingState,
    tempMaxC: inv.tempC || null,
    tempMinC: null,
    capacityAh: defaultCapacityAh,
    ratedEnergyKwh,
    remainingEnergyKwh,
    chargeLimitVoltageV: 28.8,
    dischargeLimitVoltageV: 22.4,
    maxCellMv: null,
    minCellMv: null,
    deltaMv: null,
    cells: [],
    cellTempsC: [],
    warnCount: inv.warnCount,
    warnMsg: inv.lastWarnMsg,
  };
}

function recomputeDailySummary(dateKey, dayPoints, latestInverter) {
  let pvKwhInt = 0;
  let loadKwhInt = 0;
  let gridKwhInt = 0;
  let battChargeKwhInt = 0;
  let battDischargeKwhInt = 0;
  let solarActiveHours = 0;
  let solarPoweredHours = 0;
  let batteryPowerHours = 0;
  let gridPowerHours = 0;
  let peakLoadW = 0;
  let peakPvW = 0;
  let minSoc = 100;
  let maxSoc = 0;

  for (let i = 0; i < dayPoints.length; i++) {
    const p = dayPoints[i];
    const prev = i > 0 ? dayPoints[i - 1] : null;
    let dtHours = 10 / 60; // default 10 min interval for first sample
    if (prev) {
      const diffH = (new Date(p.ts).getTime() - new Date(prev.ts).getTime()) / 3600000;
      dtHours = Math.max(0.01, Math.min(0.75, diffH));
    }

    pvKwhInt += (Math.max(0, p.pvW) * dtHours) / 1000;
    loadKwhInt += (Math.max(0, p.loadW) * dtHours) / 1000;
    gridKwhInt += (Math.max(0, p.gridW) * dtHours) / 1000;
    if (p.battW > 0) battChargeKwhInt += (p.battW * dtHours) / 1000;
    if (p.battW < 0) battDischargeKwhInt += (Math.abs(p.battW) * dtHours) / 1000;

    if (p.pvW >= 30) solarActiveHours += dtHours;
    if (p.pvW >= p.loadW * 0.6 && p.pvW >= 30) {
      solarPoweredHours += dtHours;
    } else if (p.gridW >= 40) {
      gridPowerHours += dtHours;
    } else if (p.loadW > 0) {
      batteryPowerHours += dtHours;
    }

    if (p.loadW > peakLoadW) peakLoadW = p.loadW;
    if (p.pvW > peakPvW) peakPvW = p.pvW;
    if (p.soc < minSoc) minSoc = p.soc;
    if (p.soc > maxSoc) maxSoc = p.soc;
  }

  const pvKwh = Math.max(pvKwhInt, latestInverter?.energyPvTodayKwh ?? 0);
  const loadKwh = Math.max(loadKwhInt, latestInverter?.energyLoadTodayKwh ?? 0);
  const gridKwh = Math.max(gridKwhInt, latestInverter?.energyGridImportTodayKwh ?? 0);
  const battChargeKwh = Math.max(battChargeKwhInt, latestInverter?.energyBatteryChargeTodayKwh ?? 0);
  const battDischargeKwh = Math.max(battDischargeKwhInt, latestInverter?.energyBatteryDischargeTodayKwh ?? 0);
  const peakSunHours = peakPvW > 200 ? pvKwh / (peakPvW / 1000) : solarActiveHours;
  const selfSufficiencyPct =
    loadKwh > 0.05 ? Math.max(0, Math.min(100, Math.round(((loadKwh - gridKwh) / loadKwh) * 100))) : 100;

  return {
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
    peakLoadW: Math.round(peakLoadW),
    peakPvW: Math.round(peakPvW),
    minSoc: dayPoints.length ? minSoc : 0,
    maxSoc: dayPoints.length ? maxSoc : 0,
    selfSufficiencyPct,
    samples: dayPoints.length,
  };
}

async function main() {
  loadDotEnv();
  const { outDir } = parseArgs();

  const email = process.env.FSOLAR_EMAIL?.trim();
  const password = process.env.FSOLAR_PASSWORD?.trim();
  const timeZone = process.env.SOLAR_TIMEZONE?.trim() || 'UTC';
  const defaultCapAh = num(process.env.BATTERY_CAPACITY_AH, 200);
  const defaultNomV = num(process.env.BATTERY_NOMINAL_VOLTAGE, 25.6);

  if (!email || !password) {
    console.error('❌ Missing FSOLAR_EMAIL or FSOLAR_PASSWORD environment variables.');
    console.error('   Add them to .env locally, or to GitHub Repository Secrets for Actions.');
    process.exit(1);
  }

  console.log(`[FSolar] Authenticating as ${email.replace(/(.{2}).+(@.+)/, '$1***$2')}...`);
  const token = await login(email, password);
  console.log('[FSolar] Login successful. Discovering devices...');

  const listResp = await apiPost(
    '/device/list_device_all_type',
    { pageNum: 1, pageSize: 50, deviceSn: '', status: '', sampleFlag: '', oscFlag: '' },
    token
  );
  const deviceList = listResp?.data?.dataList || [];
  if (!deviceList.length) {
    throw new Error('No devices found on this FSolar account.');
  }
  console.log(`[FSolar] Found ${deviceList.length} device(s): ${deviceList.map((d) => d.deviceSn).join(', ')}`);

  const now = new Date();
  const dateStr = formatLocalTimestamp(now);
  let inverter = null;
  let battery = null;
  const discoveredDevices = [];

  for (const dev of deviceList) {
    const sn = dev.deviceSn;
    try {
      const snapResp = await apiPost(
        '/device/get_device_snapshot',
        { deviceSn: sn, deviceType: 'BP', dateStr },
        token
      );
      const snap = snapResp?.data;
      if (!snap) continue;

      const pType = snap.productTypeEnum || dev.productTypeEnum || 'UNKNOWN';
      discoveredDevices.push({
        serialNumber: sn,
        type: pType,
        model: dev.deviceModel || snap.modelName || pType,
        online: dev.status !== '0' && dev.status !== 0,
      });

      if (pType === 'LITHIUM_BATTERY_PACK') {
        battery = parseBatterySnapshot(sn, dev, snap);
      } else if (
        !inverter &&
        (pType.includes('INVERTER') || snap.acTotalOutActPower !== undefined || snap.pvTotalPower !== undefined)
      ) {
        inverter = parseInverterSnapshot(sn, dev, snap);
      }
    } catch (err) {
      console.warn(`[FSolar] Failed snapshot for ${sn}: ${err.message}`);
    }
  }

  if (!inverter && !battery) {
    throw new Error('Could not read snapshot from any device on your FSolar account.');
  }

  if (!inverter && battery) {
    inverter = {
      serialNumber: battery.serialNumber,
      model: 'IVEM4024-II (Battery Telemetry Only)',
      deviceName: 'Felicity Solar System',
      productType: 'LITHIUM_BATTERY_PACK',
      online: battery.online,
      firmwareVersion: null,
      ratedPowerW: 4000,
      workMode: battery.chargingState,
      pvPowerW: 0,
      pvVoltageV: 0,
      pvCurrentA: 0,
      loadPowerW: battery.powerW < 0 ? Math.abs(battery.powerW) : 0,
      loadPercent: 0,
      acOutputVoltageV: 230,
      acOutputCurrentA: 0,
      acOutputFreqHz: 50,
      gridPowerW: 0,
      gridVoltageV: 0,
      gridFreqHz: 0,
      batterySoc: battery.soc,
      batteryVoltageV: battery.voltageV,
      batteryCurrentA: battery.currentA,
      batteryPowerW: battery.powerW,
      tempC: battery.tempMaxC || 25,
      energyPvTodayKwh: null,
      energyPvTotalKwh: null,
      energyLoadTodayKwh: null,
      energyLoadTotalKwh: null,
      energyGridImportTodayKwh: null,
      energyBatteryChargeTodayKwh: null,
      energyBatteryDischargeTodayKwh: null,
      warnCount: battery.warnCount,
      lastWarnMsg: battery.warnMsg,
      bmsConnected: true,
      wifiSignalDbm: null,
      rawSnapshot: {},
    };
  }

  if (!battery && inverter) {
    battery = buildSynthesizedBattery(inverter, defaultCapAh, defaultNomV);
  }

  // Merge battery BMS values into inverter if inverter didn't report voltage/current/SOC
  if (battery && inverter) {
    if (!inverter.batterySoc && battery.soc) inverter.batterySoc = battery.soc;
    if (!inverter.batteryVoltageV && battery.voltageV) inverter.batteryVoltageV = battery.voltageV;
    if (!inverter.batteryPowerW && battery.powerW) inverter.batteryPowerW = battery.powerW;
  }

  fs.mkdirSync(outDir, { recursive: true });
  const latestPath = path.join(outDir, 'latest.json');
  const historyPath = path.join(outDir, 'history.json');
  const dailyPath = path.join(outDir, 'daily.json');

  // If existing data was demo data, reset history/daily cleanly for live data
  const prevLatest = readJsonSafe(latestPath, null);
  const wasDemo = prevLatest?.mode === 'demo';
  const existingHistory = wasDemo ? [] : readJsonSafe(historyPath, []);
  const existingDaily = wasDemo ? [] : readJsonSafe(dailyPath, []);

  const tsIso = now.toISOString();
  const newPoint = {
    ts: tsIso,
    pvW: inverter.pvPowerW,
    loadW: inverter.loadPowerW,
    gridW: inverter.gridPowerW,
    battW: battery.powerW,
    soc: battery.soc,
    battV: battery.voltageV,
    pvV: inverter.pvVoltageV,
    tempC: inverter.tempC,
  };

  // Deduplicate if last point was < 30s ago; retain rolling 7 days
  const cutoffMs = now.getTime() - 7 * 24 * 3600 * 1000;
  const filteredHistory = existingHistory.filter((p) => {
    const t = new Date(p.ts).getTime();
    return Number.isFinite(t) && t >= cutoffMs;
  });
  const lastPt = filteredHistory[filteredHistory.length - 1];
  if (!lastPt || now.getTime() - new Date(lastPt.ts).getTime() >= 30_000) {
    filteredHistory.push(newPoint);
  } else {
    filteredHistory[filteredHistory.length - 1] = newPoint;
  }

  // Recompute today's daily summary
  const todayKey = formatDateKey(now, timeZone);
  const todayPoints = filteredHistory.filter((p) => formatDateKey(new Date(p.ts), timeZone) === todayKey);
  const todaySummary = recomputeDailySummary(todayKey, todayPoints, inverter);

  const dailyMap = new Map(existingDaily.map((d) => [d.date, d]));
  dailyMap.set(todayKey, todaySummary);
  const updatedDaily = [...dailyMap.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-60);

  const latestPayload = {
    mode: 'live',
    updatedAt: tsIso,
    timeZone,
    devices: discoveredDevices,
    inverter,
    battery,
    today: todaySummary,
  };

  fs.writeFileSync(latestPath, JSON.stringify(latestPayload, null, 2));
  fs.writeFileSync(historyPath, JSON.stringify(filteredHistory));
  fs.writeFileSync(dailyPath, JSON.stringify(updatedDaily, null, 2));

  console.log(
    `✅ Synced FSolar live data → PV: ${inverter.pvPowerW}W | Load: ${inverter.loadPowerW}W | Grid: ${inverter.gridPowerW}W | Battery: ${battery.soc}% (${battery.voltageV}V)`
  );
}

main().catch((err) => {
  console.error('❌ FSolar sync failed:', err.message);
  process.exit(1);
});
