import type { Lang } from '../i18n/translations';
import type { BatteryTelemetry, GridSession, HistoryPoint, TariffPreset, UserSettings } from '../types/solar';

/**
 * Official New Electricity Tariffs in Syria (effective late 2025 / 2026)
 * All base numbers are in Old SYP; New SYP = Old SYP / 100.
 * - Residential (2-month / 60-day billing cycle):
 *   Tier 1: 0–300 kWh -> 600 SYP (6 New SYP) / kWh
 *   Tier 2: >300 kWh  -> 1,400 SYP (14 New SYP) / kWh
 * - Commercial / Industrial / Agricultural: 1,400 SYP (14 New SYP) / kWh
 * - Exempt / No-Rationing Entities:         1,700 SYP (17 New SYP) / kWh
 * - Heavy Industry / Billboards:            1,800 SYP (18 New SYP) / kWh
 */
export const SYRIA_TARIFF = {
  RESIDENTIAL_TIER1_LIMIT_KWH: 300, // per 2-month cycle (60 days)
  RESIDENTIAL_TIER1_OLD_SYP: 600,
  RESIDENTIAL_TIER2_OLD_SYP: 1400,
  COMMERCIAL_OLD_SYP: 1400,
  EXEMPT_OLD_SYP: 1700,
  HEAVY_OLD_SYP: 1800,
  CYCLE_DAYS: 60,
} as const;

export const DEFAULT_SETTINGS: UserSettings = {
  batteryCapacityAh: 200,
  batteryNominalV: 25.6,
  reserveSocPct: 20,
  tariffPreset: 'syria_residential',
  syriaCurrencyMode: 'old',
  electricityRatePerKwh: 0.15,
  currencySymbol: '$',
  inverterEfficiency: 0.92,
};

export function loadUserSettings(): UserSettings {
  try {
    const raw = localStorage.getItem('felicity_solar_settings_v1');
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveUserSettings(settings: UserSettings): void {
  try {
    localStorage.setItem('felicity_solar_settings_v1', JSON.stringify(settings));
  } catch {
    // ignore storage quota errors
  }
}

export function isSyriaPreset(preset: TariffPreset): boolean {
  return preset !== 'custom';
}

/**
 * Returns the multiplier to convert Old SYP into displayed currency (1 for old SYP, 0.01 for new SYP).
 */
export function getSyriaScale(settings: UserSettings): number {
  return settings.syriaCurrencyMode === 'new' ? 0.01 : 1;
}

export interface CycleBillBreakdown {
  totalCost: number;
  tier1Kwh: number;
  tier1Cost: number;
  tier2Kwh: number;
  tier2Cost: number;
  effectiveUnitPrice: number;
}

/**
 * Computes exact electricity bill for a 2-month (60-day) billing cycle kWh total.
 */
export function calculateCycleBill(cycleKwh: number, settings: UserSettings): CycleBillBreakdown {
  const kwh = Math.max(0, cycleKwh);

  if (settings.tariffPreset === 'custom') {
    const totalCost = kwh * settings.electricityRatePerKwh;
    return {
      totalCost,
      tier1Kwh: kwh,
      tier1Cost: totalCost,
      tier2Kwh: 0,
      tier2Cost: 0,
      effectiveUnitPrice: settings.electricityRatePerKwh,
    };
  }

  const scale = getSyriaScale(settings);

  if (settings.tariffPreset === 'syria_residential') {
    const tier1Kwh = Math.min(kwh, SYRIA_TARIFF.RESIDENTIAL_TIER1_LIMIT_KWH);
    const tier2Kwh = Math.max(0, kwh - SYRIA_TARIFF.RESIDENTIAL_TIER1_LIMIT_KWH);
    const tier1Cost = tier1Kwh * SYRIA_TARIFF.RESIDENTIAL_TIER1_OLD_SYP * scale;
    const tier2Cost = tier2Kwh * SYRIA_TARIFF.RESIDENTIAL_TIER2_OLD_SYP * scale;
    const totalCost = tier1Cost + tier2Cost;
    return {
      totalCost,
      tier1Kwh,
      tier1Cost,
      tier2Kwh,
      tier2Cost,
      effectiveUnitPrice: kwh > 0 ? totalCost / kwh : SYRIA_TARIFF.RESIDENTIAL_TIER1_OLD_SYP * scale,
    };
  }

  const flatOldSyp =
    settings.tariffPreset === 'syria_commercial'
      ? SYRIA_TARIFF.COMMERCIAL_OLD_SYP
      : settings.tariffPreset === 'syria_exempt'
        ? SYRIA_TARIFF.EXEMPT_OLD_SYP
        : SYRIA_TARIFF.HEAVY_OLD_SYP;
  const unitPrice = flatOldSyp * scale;
  const totalCost = kwh * unitPrice;

  return {
    totalCost,
    tier1Kwh: kwh,
    tier1Cost: totalCost,
    tier2Kwh: 0,
    tier2Cost: 0,
    effectiveUnitPrice: unitPrice,
  };
}

/**
 * Computes daily cost for a given day's kWh using the active tariff.
 * For Syria residential progressive tiers, pro-rates the 300 kWh / 60-day allowance (= 5 kWh/day)
 * so daily estimates reflect realistic Tier 1 vs Tier 2 cost accurately.
 */
export function calculateDailyCost(dailyKwh: number, settings: UserSettings): number {
  const kwh = Math.max(0, dailyKwh);
  if (settings.tariffPreset === 'custom') {
    return kwh * settings.electricityRatePerKwh;
  }
  const scale = getSyriaScale(settings);
  if (settings.tariffPreset === 'syria_residential') {
    const dailyTier1Allowance = SYRIA_TARIFF.RESIDENTIAL_TIER1_LIMIT_KWH / SYRIA_TARIFF.CYCLE_DAYS; // 5 kWh/day
    const t1 = Math.min(kwh, dailyTier1Allowance);
    const t2 = Math.max(0, kwh - dailyTier1Allowance);
    return (t1 * SYRIA_TARIFF.RESIDENTIAL_TIER1_OLD_SYP + t2 * SYRIA_TARIFF.RESIDENTIAL_TIER2_OLD_SYP) * scale;
  }
  const flatOldSyp =
    settings.tariffPreset === 'syria_commercial'
      ? SYRIA_TARIFF.COMMERCIAL_OLD_SYP
      : settings.tariffPreset === 'syria_exempt'
        ? SYRIA_TARIFF.EXEMPT_OLD_SYP
        : SYRIA_TARIFF.HEAVY_OLD_SYP;
  return kwh * flatOldSyp * scale;
}

export function formatMoney(amount: number, settings: UserSettings, lang: Lang): string {
  if (settings.tariffPreset === 'custom') {
    const formatted = amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${settings.currencySymbol}${formatted}`;
  }

  if (settings.syriaCurrencyMode === 'new') {
    const unit = lang === 'ar' ? 'ل.س جديدة' : 'New SYP';
    const formatted = amount.toLocaleString(undefined, {
      minimumFractionDigits: amount < 100 ? 1 : 0,
      maximumFractionDigits: amount < 100 ? 1 : 0,
    });
    return `${formatted} ${unit}`;
  }

  const unit = lang === 'ar' ? 'ل.س' : 'SYP';
  const formatted = Math.round(amount).toLocaleString(undefined);
  return `${formatted} ${unit}`;
}

export function detectSystemVoltage(voltageV: number, fallbackNominalV = 25.6): number {
  const v = voltageV > 5 ? voltageV : fallbackNominalV;
  if (v >= 36) return 48;
  if (v >= 18) return 24;
  return 12;
}

export function getBatteryCapacityKwh(battery: BatteryTelemetry, settings: UserSettings): number {
  if (battery.ratedEnergyKwh && battery.ratedEnergyKwh > 0.5) {
    return battery.ratedEnergyKwh;
  }
  const ah = battery.capacityAh && battery.capacityAh > 10 ? battery.capacityAh : settings.batteryCapacityAh;
  return Number(((ah * settings.batteryNominalV) / 1000).toFixed(2));
}

export function getUsableRemainingWh(soc: number, capacityKwh: number, reserveSocPct: number): number {
  const usablePct = Math.max(0, soc - reserveSocPct) / 100;
  return capacityKwh * 1000 * usablePct;
}

export function estimateBackupHours(
  soc: number,
  loadW: number,
  capacityKwh: number,
  reserveSocPct: number,
  inverterEfficiency = 0.92
): number {
  if (loadW <= 5) return 99;
  const usableWh = getUsableRemainingWh(soc, capacityKwh, reserveSocPct);
  if (usableWh <= 0) return 0;
  const effectiveAcWh = usableWh * inverterEfficiency;
  return effectiveAcWh / loadW;
}

export function estimateTimeToFullHours(soc: number, chargeW: number, capacityKwh: number): number | null {
  if (chargeW <= 25 || soc >= 99) return null;
  const missingWh = ((100 - soc) / 100) * capacityKwh * 1000;
  return missingWh / chargeW;
}

export function formatWatts(watts: number): string {
  const abs = Math.abs(watts);
  if (abs >= 1000) {
    return `${(watts / 1000).toFixed(2)} kW`;
  }
  return `${Math.round(watts)} W`;
}

export function formatDurationHours(hours: number, lang: Lang = 'en'): string {
  if (!Number.isFinite(hours) || hours <= 0) return lang === 'ar' ? '0 د' : '0m';
  const hUnit = lang === 'ar' ? 'س' : 'h';
  const mUnit = lang === 'ar' ? 'د' : 'm';
  if (hours >= 48) return `${Math.round(hours)}${hUnit}+`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}${mUnit}`;
  if (m === 0) return `${h}${hUnit}`;
  return `${h}${hUnit} ${m}${mUnit}`;
}

export function formatRelativeTime(isoString: string, lang: Lang = 'en'): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / 1000));
  if (lang === 'ar') {
    if (diffSec < 60) return `منذ ${diffSec} ثانية`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `منذ ${diffHr} س ${diffMin % 60} د`;
    return `منذ ${Math.floor(diffHr / 24)} يوم`;
  }
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ${diffMin % 60}m ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

export function isPointGridOn(p: HistoryPoint): boolean {
  if (typeof p.gridOn === 'boolean') return p.gridOn;
  if (typeof p.gridV === 'number') return p.gridV >= 130 || p.gridW >= 25;
  return p.gridW >= 25;
}

export interface GridAnalysis {
  currentlyOn: boolean;
  currentVoltageV: number;
  currentStateDurationHours: number;
  arrivals24h: number;
  onHours24h: number;
  offHours24h: number;
  avgSessionHours24h: number;
  arrivals7d: number;
  onHours7d: number;
  sessions24h: GridSession[];
  sessions7d: GridSession[];
  timeline24h: { ts: string; gridOn: boolean; gridV: number; gridW: number }[];
}

export function analyzeGridHistory(
  history: HistoryPoint[],
  liveGridVoltageV: number,
  liveGridPowerW: number
): GridAnalysis {
  const currentlyOn = liveGridVoltageV >= 130 || liveGridPowerW >= 25;

  if (!history.length) {
    return {
      currentlyOn,
      currentVoltageV: liveGridVoltageV,
      currentStateDurationHours: 0,
      arrivals24h: currentlyOn ? 1 : 0,
      onHours24h: 0,
      offHours24h: 0,
      avgSessionHours24h: 0,
      arrivals7d: currentlyOn ? 1 : 0,
      onHours7d: 0,
      sessions24h: [],
      sessions7d: [],
      timeline24h: [],
    };
  }

  const lastTsMs = new Date(history[history.length - 1].ts).getTime();
  const cutoff24h = lastTsMs - 24 * 3600 * 1000;

  const extractSessions = (points: HistoryPoint[]): { sessions: GridSession[]; onHours: number; offHours: number } => {
    const sessions: GridSession[] = [];
    let onHours = 0;
    let offHours = 0;

    let active: {
      startTs: string;
      endTs: string;
      durationHours: number;
      voltSum: number;
      voltCount: number;
      minV: number;
      maxV: number;
      kwhDrawn: number;
    } | null = null;

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const prev = i > 0 ? points[i - 1] : null;
      let dtH = 10 / 60;
      if (prev) {
        const diffH = (new Date(p.ts).getTime() - new Date(prev.ts).getTime()) / 3600000;
        dtH = Math.max(0.01, Math.min(0.75, diffH));
      }

      const on = isPointGridOn(p);
      const v = p.gridV ?? 0;

      if (on) {
        onHours += dtH;
        if (!active) {
          active = {
            startTs: p.ts,
            endTs: p.ts,
            durationHours: dtH,
            voltSum: v > 0 ? v : 0,
            voltCount: v > 0 ? 1 : 0,
            minV: v > 0 ? v : 999,
            maxV: v > 0 ? v : 0,
            kwhDrawn: (Math.max(0, p.gridW) * dtH) / 1000,
          };
        } else {
          active.endTs = p.ts;
          active.durationHours += dtH;
          if (v > 0) {
            active.voltSum += v;
            active.voltCount += 1;
            active.minV = Math.min(active.minV, v);
            active.maxV = Math.max(active.maxV, v);
          }
          active.kwhDrawn += (Math.max(0, p.gridW) * dtH) / 1000;
        }
      } else {
        offHours += dtH;
        if (active) {
          sessions.push({
            startTs: active.startTs,
            endTs: active.endTs,
            durationHours: active.durationHours,
            avgVoltageV: active.voltCount > 0 ? Math.round(active.voltSum / active.voltCount) : 0,
            minVoltageV: active.minV === 999 ? 0 : Math.round(active.minV),
            maxVoltageV: Math.round(active.maxV),
            kwhDrawn: Number(active.kwhDrawn.toFixed(2)),
            isOngoing: false,
          });
          active = null;
        }
      }
    }

    if (active) {
      sessions.push({
        startTs: active.startTs,
        endTs: active.endTs,
        durationHours: active.durationHours,
        avgVoltageV: active.voltCount > 0 ? Math.round(active.voltSum / active.voltCount) : 0,
        minVoltageV: active.minV === 999 ? 0 : Math.round(active.minV),
        maxVoltageV: Math.round(active.maxV),
        kwhDrawn: Number(active.kwhDrawn.toFixed(2)),
        isOngoing: true,
      });
    }

    return { sessions, onHours, offHours };
  };

  const points24h = history.filter((p) => new Date(p.ts).getTime() >= cutoff24h);
  const res24h = extractSessions(points24h);
  const res7d = extractSessions(history);

  // Measure duration of current continuous ON or OFF streak from end of history
  let currentStateDurationHours = 0;
  const latestState = isPointGridOn(history[history.length - 1]);
  for (let i = history.length - 1; i >= 0; i--) {
    if (isPointGridOn(history[i]) !== latestState) break;
    const prev = i > 0 ? history[i - 1] : null;
    const dtH = prev
      ? Math.max(0.01, Math.min(0.75, (new Date(history[i].ts).getTime() - new Date(prev.ts).getTime()) / 3600000))
      : 10 / 60;
    currentStateDurationHours += dtH;
  }

  return {
    currentlyOn,
    currentVoltageV: liveGridVoltageV,
    currentStateDurationHours,
    arrivals24h: res24h.sessions.length,
    onHours24h: Number(res24h.onHours.toFixed(2)),
    offHours24h: Number(res24h.offHours.toFixed(2)),
    avgSessionHours24h:
      res24h.sessions.length > 0 ? Number((res24h.onHours / res24h.sessions.length).toFixed(2)) : 0,
    arrivals7d: res7d.sessions.length,
    onHours7d: Number(res7d.onHours.toFixed(2)),
    sessions24h: res24h.sessions.reverse(),
    sessions7d: res7d.sessions.reverse(),
    timeline24h: points24h.map((p) => ({
      ts: p.ts,
      gridOn: isPointGridOn(p),
      gridV: p.gridV ?? 0,
      gridW: p.gridW,
    })),
  };
}
