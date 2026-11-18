import { BatteryCharging, Cpu, Home, Sun, UtilityPole } from 'lucide-react';
import type { BatteryTelemetry, InverterTelemetry } from '../types/solar';
import { formatWatts } from '../utils/calculations';

interface PowerFlowCardProps {
  inverter: InverterTelemetry;
  battery: BatteryTelemetry;
}

export function PowerFlowCard({ inverter, battery }: PowerFlowCardProps) {
  const pvActive = inverter.pvPowerW > 20;
  const gridActive = inverter.gridPowerW > 20;
  const loadActive = inverter.loadPowerW > 10;
  const battCharging = battery.powerW > 20;
  const battDischarging = battery.powerW < -20;

  return (
    <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-5 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Live Energy Flow</h2>
          <p className="text-xs text-slate-400">Real-time power distribution across PV, Grid, Battery &amp; Home</p>
        </div>
        <span className="rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-300">
          Load {inverter.loadPercent.toFixed(0)}% of {(inverter.ratedPowerW / 1000).toFixed(0)}kW
        </span>
      </div>

      <div className="relative mx-auto max-w-xl py-2">
        {/* SVG Flow Lines Layer */}
        <svg
          viewBox="0 0 500 300"
          className="h-auto w-full select-none"
          role="img"
          aria-label="Solar inverter energy flow diagram"
        >
          {/* Base inactive tracks */}
          <path d="M 105 68 Q 200 68 232 130" fill="none" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 395 68 Q 300 68 268 130" fill="none" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 232 170 Q 200 232 105 232" fill="none" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 268 170 Q 300 232 395 232" fill="none" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" />

          {/* Solar -> Inverter */}
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

          {/* Grid -> Inverter */}
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

          {/* Inverter <-> Battery */}
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

          {/* Inverter -> Home Load */}
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

          {/* Center Inverter Hub */}
          <g transform="translate(205, 112)">
            <rect
              width="90"
              height="76"
              rx="16"
              fill="#0f172a"
              stroke={inverter.online ? '#f59e0b' : '#ef4444'}
              strokeWidth="2"
            />
            <text x="45" y="49" textAnchor="middle" fill="#f8fafc" fontSize="10" fontWeight="700">
              IVEM4024-II
            </text>
            <text x="45" y="64" textAnchor="middle" fill="#94a3b8" fontSize="9">
              {inverter.tempC}°C • {inverter.acOutputVoltageV.toFixed(0)}V
            </text>
          </g>
        </svg>

        {/* Center icon overlay */}
        <div className="pointer-events-none absolute left-1/2 top-[43%] -translate-x-1/2 -translate-y-1/2">
          <Cpu className="h-5 w-5 text-amber-400" />
        </div>

        {/* 4 Corner Nodes */}
        {/* Top-Left: Solar PV */}
        <div
          className={`absolute left-0 top-1 w-36 rounded-xl border p-2.5 backdrop-blur sm:w-40 ${
            pvActive
              ? 'border-amber-500/40 bg-amber-500/10'
              : 'border-slate-800 bg-slate-950/90'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-300">
            <Sun className="h-3.5 w-3.5" />
            Solar PV
          </div>
          <div className="mt-0.5 text-base font-bold text-white">{formatWatts(inverter.pvPowerW)}</div>
          <div className="text-[11px] text-slate-400">
            {inverter.pvVoltageV}V • {inverter.pvCurrentA}A
          </div>
        </div>

        {/* Top-Right: Grid Utility */}
        <div
          className={`absolute right-0 top-1 w-36 rounded-xl border p-2.5 backdrop-blur sm:w-40 ${
            gridActive
              ? 'border-violet-500/40 bg-violet-500/10'
              : 'border-slate-800 bg-slate-950/90'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium text-violet-300">
            <span className="inline-flex items-center gap-1.5">
              <UtilityPole className="h-3.5 w-3.5" />
              Grid AC
            </span>
            <span className="text-[10px] text-slate-400">{inverter.gridFreqHz > 0 ? `${inverter.gridFreqHz}Hz` : 'Off'}</span>
          </div>
          <div className="mt-0.5 text-base font-bold text-white">{formatWatts(inverter.gridPowerW)}</div>
          <div className="text-[11px] text-slate-400">
            {inverter.gridVoltageV > 0 ? `${inverter.gridVoltageV}V input` : 'Disconnected'}
          </div>
        </div>

        {/* Bottom-Left: Lithium Battery */}
        <div
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
              Lithium
            </span>
            <span className="font-bold text-white">{battery.soc}%</span>
          </div>
          <div className="mt-0.5 text-base font-bold text-white">
            {battery.powerW > 0 ? '+' : ''}
            {formatWatts(battery.powerW)}
          </div>
          <div className="text-[11px] text-slate-400">
            {battery.voltageV}V • {battery.chargingState}
          </div>
        </div>

        {/* Bottom-Right: Home Consumption */}
        <div
          className={`absolute bottom-1 right-0 w-36 rounded-xl border p-2.5 backdrop-blur sm:w-40 ${
            loadActive
              ? 'border-rose-500/40 bg-rose-500/10'
              : 'border-slate-800 bg-slate-950/90'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-medium text-rose-300">
            <Home className="h-3.5 w-3.5" />
            Home Load
          </div>
          <div className="mt-0.5 text-base font-bold text-white">{formatWatts(inverter.loadPowerW)}</div>
          <div className="text-[11px] text-slate-400">
            {inverter.acOutputVoltageV}V • {inverter.acOutputCurrentA}A
          </div>
        </div>
      </div>
    </div>
  );
}
