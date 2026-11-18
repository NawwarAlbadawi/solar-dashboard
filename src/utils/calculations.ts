import type { Lang } from '../i18n/translations';
import type { BatteryTelemetry, TariffPreset, UserSettings } from '../types/solar';

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
