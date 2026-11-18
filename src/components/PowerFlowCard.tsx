import { BatteryCharging, Cpu, Home, Sun, UtilityPole } from 'lucide-react';
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
    <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-5 shadow-xl">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-white">{t.liveEnergyFlow}</h2>
          <p className="text-xs text-slate-400">{t.liveEnergyFlowSub}</p>
        </div>
        <span className="rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-300">
          {t.loadOf} {inverter.loadPercent.toFixed(0)}% {t.of} {(inverter.ratedPowerW / 1000).toFixed(0)}kW
        </span>
      </div>

      {/* Keep SVG diagram coordinates LTR so corner cards align cleanly in both EN & AR */}
      <div className="relative mx-auto max-w-xl py-2" dir="ltr">
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
          className={`absolute left-0 top-1 w-36 rounded-xl border p-2.5 backdrop-blur sm:w-40 ${
            pvActive ? 'border-amber-500/40 bg-amber-500/10' : 'border-slate-800 bg-slate-950/90'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-300">
            <Sun className="h-3.5 w-3.5" />
            {t.solarPv}
          </div>
          <div className="mt-0.5 text-base font-bold text-white" dir="ltr">{formatWatts(inverter.pvPowerW)}</div>
          <div className="text-[11px] text-slate-400" dir="ltr">
            {inverter.pvVoltageV}V • {inverter.pvCurrentA}A
          </div>
        </div>

        {/* Top-Right: Grid Utility */}
        <div
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          className={`absolute right-0 top-1 w-36 rounded-xl border p-2.5 backdrop-blur sm:w-40 ${
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
          <div className="mt-0.5 text-base font-bold text-white" dir="ltr">{formatWatts(inverter.gridPowerW)}</div>
          <div className="text-[11px] text-slate-400">
            {inverter.gridVoltageV > 0 ? `${inverter.gridVoltageV}V ${t.input}` : t.disconnected}
          </div>
        </div>

        {/* Bottom-Left: Lithium Battery */}
        <div
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          className={`absolute bottom-1 left-0 w-36 rounded-xl border p-2.5 backdrop-blur sm:w-40 ${
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
          className={`absolute bottom-1 right-0 w-36 rounded-xl border p-2.5 backdrop-blur sm:w-40 ${
            loadActive ? 'border-rose-500/40 bg-rose-500/10' : 'border-slate-800 bg-slate-950/90'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-medium text-rose-300">
            <Home className="h-3.5 w-3.5" />
            {t.homeLoad}
          </div>
          <div className="mt-0.5 text-base font-bold text-white" dir="ltr">{formatWatts(inverter.loadPowerW)}</div>
          <div className="text-[11px] text-slate-400" dir="ltr">
            {inverter.acOutputVoltageV}V • {inverter.acOutputCurrentA}A
          </div>
        </div>
      </div>
    </div>
  );
}
