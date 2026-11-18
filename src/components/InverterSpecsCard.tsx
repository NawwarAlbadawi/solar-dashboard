import { useState } from 'react';
import { ChevronDown, ChevronUp, Code2, Cpu, AlertCircle } from 'lucide-react';
import type { InverterTelemetry } from '../types/solar';

interface InverterSpecsCardProps {
  inverter: InverterTelemetry;
}

export function InverterSpecsCard({ inverter }: InverterSpecsCardProps) {
  const [showRaw, setShowRaw] = useState(false);

  const rows = [
    { label: 'Inverter Model', value: inverter.model },
    { label: 'Serial Number', value: inverter.serialNumber },
    { label: 'Rated Power', value: `${inverter.ratedPowerW} W (24V DC)` },
    { label: 'Operating Mode', value: inverter.workMode },
    { label: 'PV Voltage / Current', value: `${inverter.pvVoltageV} V / ${inverter.pvCurrentA} A` },
    { label: 'AC Output', value: `${inverter.acOutputVoltageV} V • ${inverter.acOutputCurrentA} A • ${inverter.acOutputFreqHz} Hz` },
    { label: 'Grid AC Input', value: `${inverter.gridVoltageV} V • ${inverter.gridFreqHz} Hz • ${inverter.gridPowerW} W` },
    { label: 'Load Utilization', value: `${inverter.loadPercent}% (${inverter.loadPowerW} W)` },
    { label: 'Inverter Temp', value: `${inverter.tempC} °C` },
    { label: 'BMS Link', value: inverter.bmsConnected ? 'Connected' : 'Voltage Mode' },
    {
      label: 'Lifetime Solar Yield',
      value: inverter.energyPvTotalKwh !== null ? `${inverter.energyPvTotalKwh.toLocaleString()} kWh` : '—',
    },
    {
      label: 'Lifetime Consumption',
      value: inverter.energyLoadTotalKwh !== null ? `${inverter.energyLoadTotalKwh.toLocaleString()} kWh` : '—',
    },
    { label: 'Firmware', value: inverter.firmwareVersion || 'N/A' },
    { label: 'Wi-Fi Signal', value: inverter.wifiSignalDbm !== null ? `${inverter.wifiSignalDbm} dBm` : 'Connected' },
  ];

  return (
    <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-5 shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">IVEM4024-II Full Telemetry</h2>
          <p className="text-xs text-slate-400">Complete electrical diagnostics &amp; lifetime meters</p>
        </div>
        <Cpu className="h-4 w-4 text-amber-400" />
      </div>

      {inverter.warnCount > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>
            {inverter.warnCount} Active Warning(s): {inverter.lastWarnMsg || 'Check inverter display'}
          </span>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between border-b border-slate-800/70 py-1.5 text-xs"
          >
            <span className="text-slate-400">{r.label}</span>
            <span className="font-medium text-slate-100">{r.value}</span>
          </div>
        ))}
      </div>

      {/* Collapsible Raw FSolar JSON Inspector */}
      {inverter.rawSnapshot && Object.keys(inverter.rawSnapshot).length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowRaw((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-amber-300"
          >
            <Code2 className="h-3.5 w-3.5" />
            {showRaw ? 'Hide' : 'Inspect'} Raw FSolar API Snapshot
            {showRaw ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showRaw && (
            <pre className="mt-2 max-h-60 overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-emerald-300">
              {JSON.stringify(inverter.rawSnapshot, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
