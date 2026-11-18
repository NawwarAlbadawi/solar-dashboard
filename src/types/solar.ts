export interface DiscoveredDevice {
  serialNumber: string;
  type: string;
  model: string;
  online: boolean;
}

export interface InverterTelemetry {
  serialNumber: string;
  model: string;
  deviceName: string;
  productType: string;
  online: boolean;
  firmwareVersion: string | null;
  ratedPowerW: number;
  workMode: string;
  pvPowerW: number;
  pvVoltageV: number;
  pvCurrentA: number;
  loadPowerW: number;
  loadPercent: number;
  acOutputVoltageV: number;
  acOutputCurrentA: number;
  acOutputFreqHz: number;
  gridPowerW: number;
  gridVoltageV: number;
  gridFreqHz: number;
  batterySoc: number;
  batteryVoltageV: number;
  batteryCurrentA: number;
  batteryPowerW: number;
  tempC: number;
  energyPvTodayKwh: number | null;
  energyPvTotalKwh: number | null;
  energyLoadTodayKwh: number | null;
  energyLoadTotalKwh: number | null;
  energyGridImportTodayKwh: number | null;
  energyBatteryChargeTodayKwh: number | null;
  energyBatteryDischargeTodayKwh: number | null;
  warnCount: number;
  lastWarnMsg: string | null;
  bmsConnected: boolean;
  wifiSignalDbm: number | null;
  rawSnapshot?: Record<string, unknown>;
}

export interface BatteryCell {
  index: number;
  mv: number;
}

export interface BatteryTelemetry {
  serialNumber: string;
  model: string;
  online: boolean;
  soc: number;
  soh: number;
  voltageV: number;
  currentA: number;
  powerW: number;
  chargingState: 'Charging' | 'Discharging' | 'Idle' | string;
  tempMaxC: number | null;
  tempMinC: number | null;
  capacityAh: number | null;
  ratedEnergyKwh: number | null;
  remainingEnergyKwh: number | null;
  chargeLimitVoltageV: number | null;
  dischargeLimitVoltageV: number | null;
  maxCellMv: number | null;
  minCellMv: number | null;
  deltaMv: number | null;
  cells: BatteryCell[];
  cellTempsC: number[];
  warnCount: number;
  warnMsg: string | null;
}

export interface DailySummary {
  date: string;
  pvKwh: number;
  loadKwh: number;
  gridKwh: number;
  battChargeKwh: number;
  battDischargeKwh: number;
  solarActiveHours: number;
  solarPoweredHours: number;
  batteryPowerHours: number;
  gridPowerHours: number;
  peakSunHours: number;
  peakLoadW: number;
  peakPvW: number;
  minSoc: number;
  maxSoc: number;
  selfSufficiencyPct: number;
  samples: number;
}

export interface LatestData {
  mode: 'live' | 'demo';
  updatedAt: string;
  timeZone: string;
  devices: DiscoveredDevice[];
  inverter: InverterTelemetry;
  battery: BatteryTelemetry;
  today: DailySummary;
}

export interface HistoryPoint {
  ts: string;
  pvW: number;
  loadW: number;
  gridW: number;
  battW: number;
  soc: number;
  battV: number;
  pvV: number;
  tempC: number;
}

export interface UserSettings {
  batteryCapacityAh: number; // e.g., 200 Ah
  batteryNominalV: number; // e.g., 25.6 V (8S LiFePO4)
  reserveSocPct: number; // e.g., 20% minimum usable SOC
  electricityRatePerKwh: number; // e.g., 0.18 $/kWh
  currencySymbol: string; // e.g., '$'
  inverterEfficiency: number; // e.g., 0.92
}
