import { ArrowDown, ArrowUp, BatteryCharging, Cpu, Home, Sun, UtilityPole } from 'lucide-react';
import { translations, type Lang } from '../i18n/translations';
import type { BatteryTelemetry, InverterTelemetry } from '../types/solar';
import { formatWatts } from '../utils/calculations';

interface PowerFlowCardProps {
  inverter: InverterTelemetry;
  battery: BatteryTelemetry;
  lang: Lang;
}

export function PowerFlowCard({ inverter, battery, lang }: PowerFlowCardProps) {
  const t = translations[lang];
  const pvActive = inverter.pvPowerW > 20;
  const gridActive = inverter.gridPowerW > 20;
  const loadActive = inverter.loadPowerW > 10;
  const battCharging = battery.powerW > 20;
  const battDischarging = battery.powerW < -20;

  const chargeLabel =
    battery.chargingState === 'Charging'
      ? t.charging
      : battery.chargingState === 'Discharging'
        ? t.discharging
        : t.idle;

  return (
    <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-4 shadow-xl sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4">
        <div>
          <h2 className="text-sm font-semibold text-white">{t.liveEnergyFlow}</h2>
          <p className="text-xs text-slate-400">{t.liveEnergyFlowSub}</p>
        </div>
        <span className="rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 text-[11px] font-medium text-slate-300 sm:text-xs">
          {t.loadOf} {inverter.loadPercent.toFixed(0)}% {t.of} {(inverter.ratedPowerW / 1000).toFixed(0)}kW
        </span>
      </div>

      {/* ADAPTIVE MOBILE LAYOUT (< 640px): Zero-overlap vertical hub */}
      <div className="space-y-2.5 sm:hidden">
        {/* Top Sources: Solar PV + Grid AC */}
        <div className="grid grid-cols-2 gap-2.5">
          <div
            className={`rounded-xl border p-3 ${
              pvActive ? 'border-amber-500/40 bg-amber-500/10' : 'border-slate-800 bg-slate-950/90'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-medium text-amber-300">
              <span className="inline-flex items-center gap-1">
                <Sun className="h-3.5 w-3.5 shrink-0" />
                {t.solarPv}
              </span>
              {pvActive && <ArrowDown className="h-3.5 w-3.5 animate-bounce text-amber-400" />}
            </div>
            <div className="mt-1 text-lg font-bold text-white" dir="ltr">
              {formatWatts(inverter.pvPowerW)}
            </div>
            <div className="text-[11px] text-slate-400" dir="ltr">
              {inverter.pvVoltageV}V • {inverter.pvCurrentA}A
            </div>
          </div>

          <div
            className={`rounded-xl border p-3 ${
              gridActive ? 'border-violet-500/40 bg-violet-500/10' : 'border-slate-800 bg-slate-950/90'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-medium text-violet-300">
              <span className="inline-flex items-center gap-1">
                <UtilityPole className="h-3.5 w-3.5 shrink-0" />
                {t.gridAc}
              </span>
              {gridActive && <ArrowDown className="h-3.5 w-3.5 animate-bounce text-violet-400" />}
            </div>
            <div className="mt-1 text-lg font-bold text-white" dir="ltr">
              {formatWatts(inverter.gridPowerW)}
            </div>
            <div className="text-[11px] text-slate-400">
              {inverter.gridVoltageV > 0 ? `${inverter.gridVoltageV}V • ${inverter.gridFreqHz}Hz` : t.disconnected}
            </div>
          </div>
        </div>

        {/* Center Inverter Hub Bar */}
        <div
          className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 ${
            inverter.online
              ? 'border-amber-500/50 bg-slate-950/95 shadow-md shadow-amber-500/10'
              : 'border-rose-500/50 bg-rose-950/30'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white" dir="ltr">
                {inverter.model}
              </div>
              <div className="text-[11px] text-slate-400">{inverter.workMode}</div>
            </div>
          </div>
          <div className="text-end text-[11px] text-slate-300" dir="ltr">
            <div>{inverter.acOutputVoltageV.toFixed(0)}V AC</div>
            <div className="text-slate-400">{inverter.tempC}°C</div>
          </div>
        </div>

        {/* Bottom Outputs: Lithium Battery + Home Load */}
        <div className="grid grid-cols-2 gap-2.5">
          <div
            className={`rounded-xl border p-3 ${
              battCharging
                ? 'border-emerald-500/40 bg-emerald-500/10'
                : battDischarging
                  ? 'border-sky-500/40 bg-sky-500/10'
                  : 'border-slate-800 bg-slate-950/90'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-medium text-emerald-300">
              <span className="inline-flex items-center gap-1">
                <BatteryCharging className="h-3.5 w-3.5 shrink-0" />
                {t.lithium}
              </span>
              {battCharging ? (
                <ArrowDown className="h-3.5 w-3.5 text-emerald-400" />
              ) : battDischarging ? (
                <ArrowUp className="h-3.5 w-3.5 text-sky-400" />
              ) : null}
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-1">
              <span className="text-lg font-bold text-white" dir="ltr">
                {battery.powerW > 0 ? '+' : ''}
                {formatWatts(battery.powerW)}
              </span>
              <span className="text-xs font-bold text-emerald-300">{battery.soc}%</span>
            </div>
            <div className="text-[11px] text-slate-400">
              {battery.voltageV}V • {chargeLabel}
            </div>
          </div>

          <div
            className={`rounded-xl border p-3 ${
              loadActive ? 'border-rose-500/40 bg-rose-500/10' : 'border-slate-800 bg-slate-950/90'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-medium text-rose-300">
              <span className="inline-flex items-center gap-1">
                <Home className="h-3.5 w-3.5 shrink-0" />
                {t.homeLoad}
              </span>
              {loadActive && <ArrowDown className="h-3.5 w-3.5 text-rose-400" />}
            </div>
            <div className="mt-1 text-lg font-bold text-white" dir="ltr">
              {formatWatts(inverter.loadPowerW)}
            </div>
            <div className="text-[11px] text-slate-400" dir="ltr">
              {inverter.acOutputVoltageV}V • {inverter.acOutputCurrentA}A
            </div>
          </div>
        </div>
      </div>

      {/* TABLET & DESKTOP LAYOUT (>= 640px): Animated SVG Energy Flow Diagram */}
      <div className="relative mx-auto hidden max-w-xl py-2 sm:block" dir="ltr">
        <svg
          viewBox="0 0 500 300"
          className="h-auto w-full select-none"
          role="img"
          aria-label="Solar inverter energy flow diagram"
        >
          <path d="M 105 68 Q 200 68 232 130" fill="none" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 395 68 Q 300 68 268 130" fill="none" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 232 170 Q 200 232 105 232" fill="none" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 268 170 Q 300 232 395 232" fill="none" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" />

          {pvActive && (
            <path
              d="M 105 68 Q 200 68 232 130"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="3.5"
              strokeLinecap="round"
              className={inverter.pvPowerW > 1500 ? 'flow-active-fast' : 'flow-active'}
            />
          )}

          {gridActive && (
            <path
              d="M 395 68 Q 300 68 268 130"
              fill="none"
              stroke="#a78bfa"
              strokeWidth="3.5"
              strokeLinecap="round"
              className="flow-active"
            />
          )}

          {battCharging && (
            <path
              d="M 232 170 Q 200 232 105 232"
              fill="none"
              stroke="#34d399"
              strokeWidth="3.5"
              strokeLinecap="round"
              className="flow-active"
            />
          )}
          {battDischarging && (
            <path
              d="M 232 170 Q 200 232 105 232"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="3.5"
              strokeLinecap="round"
              className="flow-active-reverse"
            />
          )}

          {loadActive && (
            <path
              d="M 268 170 Q 300 232 395 232"
              fill="none"
              stroke="#fb7185"
              strokeWidth="3.5"
              strokeLinecap="round"
              className={inverter.loadPowerW > 1800 ? 'flow-active-fast' : 'flow-active'}
            />
          )}

          <g transform="translate(205, 112)">
            <rect
              width="90"
              height="76"
              rx="16"
              fill="#0f172a"
              stroke={inverter.online ? '#f59e0b' : '#ef4444'}
              strokeWidth="2"
            />
            <text x="45" y="49" textAnchor="middle" fill="#f8fafc" fontSize="9.5" fontWeight="700">
              {inverter.model.length > 13 ? `${inverter.model.slice(0, 12)}…` : inverter.model}
            </text>
            <text x="45" y="64" textAnchor="middle" fill="#94a3b8" fontSize="9">
              {inverter.tempC}°C • {inverter.acOutputVoltageV.toFixed(0)}V
            </text>
          </g>
        </svg>

        <div className="pointer-events-none absolute left-1/2 top-[43%] -translate-x-1/2 -translate-y-1/2">
          <Cpu className="h-5 w-5 text-amber-400" />
        </div>

        {/* Top-Left: Solar PV */}
        <div
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          className={`absolute left-0 top-1 w-40 rounded-xl border p-2.5 backdrop-blur ${
            pvActive ? 'border-amber-500/40 bg-amber-500/10' : 'border-slate-800 bg-slate-950/90'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-300">
            <Sun className="h-3.5 w-3.5" />
            {t.solarPv}
          </div>
          <div className="mt-0.5 text-base font-bold text-white" dir="ltr">
            {formatWatts(inverter.pvPowerW)}
          </div>
          <div className="text-[11px] text-slate-400" dir="ltr">
            {inverter.pvVoltageV}V • {inverter.pvCurrentA}A
          </div>
        </div>

        {/* Top-Right: Grid Utility */}
        <div
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          className={`absolute right-0 top-1 w-40 rounded-xl border p-2.5 backdrop-blur ${
            gridActive ? 'border-violet-500/40 bg-violet-500/10' : 'border-slate-800 bg-slate-950/90'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium text-violet-300">
            <span className="inline-flex items-center gap-1.5">
              <UtilityPole className="h-3.5 w-3.5" />
              {t.gridAc}
            </span>
            <span className="text-[10px] text-slate-400">
              {inverter.gridFreqHz > 0 ? `${inverter.gridFreqHz}Hz` : t.off}
            </span>
          </div>
          <div className="mt-0.5 text-base font-bold text-white" dir="ltr">
            {formatWatts(inverter.gridPowerW)}
          </div>
          <div className="text-[11px] text-slate-400">
            {inverter.gridVoltageV > 0 ? `${inverter.gridVoltageV}V ${t.input}` : t.disconnected}
          </div>
        </div>

        {/* Bottom-Left: Lithium Battery */}
        <div
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          className={`absolute bottom-1 left-0 w-40 rounded-xl border p-2.5 backdrop-blur ${
            battCharging
              ? 'border-emerald-500/40 bg-emerald-500/10'
              : battDischarging
                ? 'border-sky-500/40 bg-sky-500/10'
                : 'border-slate-800 bg-slate-950/90'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium text-emerald-300">
            <span className="inline-flex items-center gap-1.5">
              <BatteryCharging className="h-3.5 w-3.5" />
              {t.lithium}
            </span>
            <span className="font-bold text-white">{battery.soc}%</span>
          </div>
          <div className="mt-0.5 text-base font-bold text-white" dir="ltr">
            {battery.powerW > 0 ? '+' : ''}
            {formatWatts(battery.powerW)}
          </div>
          <div className="text-[11px] text-slate-400">
            {battery.voltageV}V • {chargeLabel}
          </div>
        </div>

        {/* Bottom-Right: Home Consumption */}
        <div
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          className={`absolute bottom-1 right-0 w-40 rounded-xl border p-2.5 backdrop-blur ${
            loadActive ? 'border-rose-500/40 bg-rose-500/10' : 'border-slate-800 bg-slate-950/90'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-medium text-rose-300">
            <Home className="h-3.5 w-3.5" />
            {t.homeLoad}
          </div>
          <div className="mt-0.5 text-base font-bold text-white" dir="ltr">
            {formatWatts(inverter.loadPowerW)}
          </div>
          <div className="text-[11px] text-slate-400" dir="ltr">
            {inverter.acOutputVoltageV}V • {inverter.acOutputCurrentA}A
          </div>
        </div>
      </div>
    </div>
  );
}
