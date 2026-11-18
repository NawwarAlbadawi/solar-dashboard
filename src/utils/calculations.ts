import type { BatteryTelemetry, UserSettings } from '../types/solar';

export const DEFAULT_SETTINGS: UserSettings = {
  batteryCapacityAh: 200,
  batteryNominalV: 25.6,
  reserveSocPct: 20,
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

/**
 * Estimates remaining backup hours at a given AC load (in Watts),
 * accounting for reserve SOC and inverter conversion efficiency.
 */
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

/**
 * Estimates hours until battery reaches 100% when charging.
 */
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

export function formatDurationHours(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return '0m';
  if (hours >= 48) return `${Math.round(hours)}h+`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatRelativeTime(isoString: string): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ${diffMin % 60}m ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}
