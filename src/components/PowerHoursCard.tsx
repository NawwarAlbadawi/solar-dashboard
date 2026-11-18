import { useState } from 'react';
import { Clock, BatteryCharging, Sun, UtilityPole, Gauge } from 'lucide-react';
import { translations, type Lang } from '../i18n/translations';
import type { BatteryTelemetry, DailySummary, InverterTelemetry, UserSettings } from '../types/solar';
import {
  estimateBackupHours,
  formatDurationHours,
  formatWatts,
  getBatteryCapacityKwh,
  getUsableRemainingWh,
} from '../utils/calculations';

interface PowerHoursCardProps {
  today: DailySummary;
  inverter: InverterTelemetry;
  battery: BatteryTelemetry;
  settings: UserSettings;
  lang: Lang;
}

export function PowerHoursCard({ today, inverter, battery, settings, lang }: PowerHoursCardProps) {
  const t = translations[lang];
  const maxWatts = Math.max(4000, inverter.ratedPowerW);
  const [simulatedLoadW, setSimulatedLoadW] = useState<number>(
    Math.max(150, Math.min(maxWatts, inverter.loadPowerW || 600))
  );

  const loadPresets = [
    { label: t.presetNight, watts: 250 },
    { label: t.presetNormal, watts: 650 },
    { label: t.presetAc, watts: 1500 },
    { label: t.presetHeavy, watts: 2800 },
  ];

  const capacityKwh = getBatteryCapacityKwh(battery, settings);
  const usableWh = getUsableRemainingWh(battery.soc, capacityKwh, settings.reserveSocPct);
  const simulatedHours = estimateBackupHours(
    battery.soc,
    simulatedLoadW,
    capacityKwh,
    settings.reserveSocPct,
    settings.inverterEfficiency
  );

  const totalTrackedH = Math.max(
    0.1,
    today.solarPoweredHours + today.batteryPowerHours + today.gridPowerHours
  );
  const solarPct = (today.solarPoweredHours / totalTrackedH) * 100;
  const battPct = (today.batteryPowerHours / totalTrackedH) * 100;
  const gridPct = (today.gridPowerHours / totalTrackedH) * 100;

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-slate-900/60 p-5 shadow-xl">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">{t.powerHoursTitle}</h2>
            <p className="text-xs text-slate-400">{t.powerHoursSub}</p>
          </div>
          <Clock className="h-4 w-4 text-sky-400" />
        </div>

        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-slate-400">{t.todayPowerSplit}</span>
            <span className="font-medium text-slate-200">
              {totalTrackedH.toFixed(1)}h {t.logged}
            </span>
          </div>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-800">
            <div style={{ width: `${solarPct}%` }} className="bg-amber-400 transition-all" />
            <div style={{ width: `${battPct}%` }} className="bg-emerald-400 transition-all" />
            <div style={{ width: `${gridPct}%` }} className="bg-violet-400 transition-all" />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5">
              <div className="flex items-center gap-1 text-[11px] text-amber-300">
                <Sun className="h-3 w-3" /> {t.solar}
              </div>
              <div className="mt-0.5 text-sm font-bold text-white">
                {today.solarPoweredHours.toFixed(1)}h
              </div>
              <div className="text-[10px] text-slate-500">
                {t.peakSun}: {today.peakSunHours.toFixed(1)}h
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5">
              <div className="flex items-center gap-1 text-[11px] text-emerald-300">
                <BatteryCharging className="h-3 w-3" /> {t.battery}
              </div>
              <div className="mt-0.5 text-sm font-bold text-white">
                {today.batteryPowerHours.toFixed(1)}h
              </div>
              <div className="text-[10px] text-slate-500">
                SOC {today.minSoc}%–{today.maxSoc}%
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5">
              <div className="flex items-center gap-1 text-[11px] text-violet-300">
                <UtilityPole className="h-3 w-3" /> {t.grid}
              </div>
              <div className="mt-0.5 text-sm font-bold text-white">
                {today.gridPowerHours.toFixed(1)}h
              </div>
              <div className="text-[10px] text-slate-500">
                {today.gridKwh.toFixed(1)} {t.unitKwh} {t.importLabel}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Battery Backup Hours Simulator */}
      <div className="mt-5 rounded-xl border border-sky-500/20 bg-slate-950/80 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-sky-300">
            <Gauge className="h-3.5 w-3.5" />
            {t.backupEstimator}
          </div>
          <span className="text-[11px] text-slate-400">
            {t.usable}: {(usableWh / 1000).toFixed(2)} / {capacityKwh.toFixed(2)} {t.unitKwh}
          </span>
        </div>

        <div className="mt-2 flex items-baseline justify-between gap-2">
          <div>
            <span className="text-2xl font-bold text-white">
              {formatDurationHours(simulatedHours, lang)}
            </span>
            <span className="mx-1.5 text-xs text-slate-400">
              {t.atLoad} {formatWatts(simulatedLoadW)} {t.loadWord}
            </span>
          </div>
          <button
            onClick={() => setSimulatedLoadW(Math.max(100, inverter.loadPowerW))}
            className="text-[11px] font-medium text-amber-400 hover:text-amber-300"
          >
            {t.useLive} ({formatWatts(inverter.loadPowerW)})
          </button>
        </div>

        <input
          type="range"
          min={100}
          max={maxWatts}
          step={50}
          value={Math.min(simulatedLoadW, maxWatts)}
          onChange={(e) => setSimulatedLoadW(Number(e.target.value))}
          className="mt-2.5 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-sky-400"
        />

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {loadPresets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => setSimulatedLoadW(preset.watts)}
              className={`rounded-md border px-2 py-0.5 text-[11px] transition ${
                simulatedLoadW === preset.watts
                  ? 'border-sky-400/60 bg-sky-500/20 text-sky-200'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
