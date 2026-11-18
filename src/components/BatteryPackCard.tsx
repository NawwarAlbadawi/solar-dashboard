import { BatteryCharging, HeartPulse, ShieldCheck, Thermometer } from 'lucide-react';
import { translations, type Lang } from '../i18n/translations';
import type { BatteryTelemetry, UserSettings } from '../types/solar';
import { detectSystemVoltage, formatWatts, getBatteryCapacityKwh } from '../utils/calculations';

interface BatteryPackCardProps {
  battery: BatteryTelemetry;
  settings: UserSettings;
  lang: Lang;
}

export function BatteryPackCard({ battery, settings, lang }: BatteryPackCardProps) {
  const t = translations[lang];
  const sysV = detectSystemVoltage(battery.voltageV, settings.batteryNominalV);
  const capacityKwh = getBatteryCapacityKwh(battery, settings);
  const remainingKwh =
    battery.remainingEnergyKwh ?? Number(((capacityKwh * battery.soc) / 100).toFixed(2));
  const socBarColor =
    battery.soc >= 50 ? 'bg-emerald-400' : battery.soc >= 25 ? 'bg-amber-400' : 'bg-rose-500';

  const chargeLabel =
    battery.chargingState === 'Charging'
      ? t.charging
      : battery.chargingState === 'Discharging'
        ? t.discharging
        : t.idle;

  return (
    <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-4 shadow-xl sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-white">
            {sysV}V {t.lithiumPackTitle}
          </h2>
          <p className="text-xs text-slate-400">
            {battery.model} • SN: <span className="font-mono text-slate-300">{battery.serialNumber}</span>
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
            battery.chargingState === 'Charging'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              : battery.chargingState === 'Discharging'
                ? 'border-sky-500/40 bg-sky-500/10 text-sky-300'
                : 'border-slate-700 bg-slate-950 text-slate-300'
          }`}
        >
          <BatteryCharging className="h-3.5 w-3.5" />
          {chargeLabel}
        </span>
      </div>

      {/* SOC Bar */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{battery.soc}%</span>
            <span className="text-xs text-slate-400">
              {remainingKwh.toFixed(2)} / {capacityKwh.toFixed(2)} {t.unitKwh} {t.stored}
            </span>
          </div>
          <span className="text-xs font-medium text-emerald-300">SOH {battery.soh}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            style={{ width: `${Math.max(2, Math.min(100, battery.soc))}%` }}
            className={`h-full rounded-full transition-all duration-500 ${socBarColor}`}
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5">
          <div className="text-[11px] text-slate-400">{t.packVoltage}</div>
          <div className="mt-0.5 text-sm font-bold text-white" dir="ltr">{battery.voltageV} V</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5">
          <div className="text-[11px] text-slate-400">{t.current}</div>
          <div className="mt-0.5 text-sm font-bold text-white" dir="ltr">
            {battery.currentA > 0 ? '+' : ''}
            {battery.currentA} A
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5">
          <div className="text-[11px] text-slate-400">{t.batteryPower}</div>
          <div className="mt-0.5 text-sm font-bold text-white" dir="ltr">
            {battery.powerW > 0 ? '+' : ''}
            {formatWatts(battery.powerW)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5">
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <Thermometer className="h-3 w-3 text-amber-400" /> {t.temp}
          </div>
          <div className="mt-0.5 text-sm font-bold text-white" dir="ltr">
            {battery.tempMaxC !== null ? `${battery.tempMaxC}°C` : '—'}
          </div>
        </div>
      </div>

      {/* Per-cell voltages */}
      {battery.cells.length > 0 && (
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-200">
              <HeartPulse className="h-3.5 w-3.5 text-emerald-400" />
              {t.cellVoltages} ({battery.cells.length}S LiFePO4)
            </span>
            {battery.deltaMv !== null && (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  battery.deltaMv <= 30
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : battery.deltaMv <= 80
                      ? 'bg-amber-500/15 text-amber-300'
                      : 'bg-rose-500/15 text-rose-300'
                }`}
              >
                Δ {battery.deltaMv} mV ({battery.deltaMv <= 30 ? t.balanced : t.checkBalance})
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8" dir="ltr">
            {battery.cells.map((cell) => {
              const pct = Math.max(5, Math.min(100, ((cell.mv - 2800) / (3650 - 2800)) * 100));
              return (
                <div
                  key={cell.index}
                  className="rounded-lg border border-slate-800/80 bg-slate-900/90 p-1.5 text-center"
                >
                  <div className="text-[10px] text-slate-500">C{cell.index}</div>
                  <div className="mt-0.5 text-xs font-semibold text-white">
                    {(cell.mv / 1000).toFixed(3)}V
                  </div>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-800">
                    <div style={{ width: `${pct}%` }} className="h-full bg-emerald-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BMS Limits */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          {t.chargeLimit}: {battery.chargeLimitVoltageV ? `${battery.chargeLimitVoltageV}V` : '28.8V'} •{' '}
          {t.cutoff}: {battery.dischargeLimitVoltageV ? `${battery.dischargeLimitVoltageV}V` : '22.4V'}
        </span>
        <span>
          {t.warnings}: {battery.warnCount}
        </span>
      </div>
    </div>
  );
}
