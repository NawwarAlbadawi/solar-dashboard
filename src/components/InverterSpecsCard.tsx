import { useState } from 'react';
import { ChevronDown, ChevronUp, Code2, Cpu, AlertCircle } from 'lucide-react';
import { translations, type Lang } from '../i18n/translations';
import type { InverterTelemetry } from '../types/solar';
import { detectSystemVoltage } from '../utils/calculations';

interface InverterSpecsCardProps {
  inverter: InverterTelemetry;
  lang: Lang;
}

export function InverterSpecsCard({ inverter, lang }: InverterSpecsCardProps) {
  const t = translations[lang];
  const [showRaw, setShowRaw] = useState(false);
  const sysV = detectSystemVoltage(inverter.batteryVoltageV);

  const rows = [
    { label: t.inverterModel, value: inverter.model },
    { label: t.serialNumber, value: inverter.serialNumber },
    { label: t.ratedPower, value: `${inverter.ratedPowerW} W (${sysV}V DC)` },
    { label: t.operatingMode, value: inverter.workMode },
    { label: t.pvVoltCurr, value: `${inverter.pvVoltageV} V / ${inverter.pvCurrentA} A` },
    {
      label: t.acOutput,
      value: `${inverter.acOutputVoltageV} V • ${inverter.acOutputCurrentA} A • ${inverter.acOutputFreqHz} Hz`,
    },
    {
      label: t.gridAcInput,
      value: `${inverter.gridVoltageV} V • ${inverter.gridFreqHz} Hz • ${inverter.gridPowerW} W`,
    },
    { label: t.loadUtilization, value: `${inverter.loadPercent}% (${inverter.loadPowerW} W)` },
    { label: t.inverterTemp, value: `${inverter.tempC} °C` },
    { label: t.bmsLink, value: inverter.bmsConnected ? t.connected : t.voltageMode },
    {
      label: t.lifetimeSolar,
      value:
        inverter.energyPvTotalKwh !== null
          ? `${inverter.energyPvTotalKwh.toLocaleString()} ${t.unitKwh}`
          : '—',
    },
    {
      label: t.lifetimeLoad,
      value:
        inverter.energyLoadTotalKwh !== null
          ? `${inverter.energyLoadTotalKwh.toLocaleString()} ${t.unitKwh}`
          : '—',
    },
    { label: t.firmware, value: inverter.firmwareVersion || 'N/A' },
    {
      label: t.wifiSignal,
      value: inverter.wifiSignalDbm !== null ? `${inverter.wifiSignalDbm} dBm` : t.connected,
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-4 shadow-xl sm:p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">
            {inverter.model} — {t.fullTelemetry}
          </h2>
          <p className="text-xs text-slate-400">{t.fullTelemetrySub}</p>
        </div>
        <Cpu className="h-4 w-4 text-amber-400" />
      </div>

      {inverter.warnCount > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>
            {inverter.warnCount} {t.activeWarnings}: {inverter.lastWarnMsg || t.checkInverterDisplay}
          </span>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between gap-2 border-b border-slate-800/70 py-1.5 text-xs"
          >
            <span className="text-slate-400">{r.label}</span>
            <span className="font-medium text-slate-100" dir="ltr">
              {r.value}
            </span>
          </div>
        ))}
      </div>

      {inverter.rawSnapshot && Object.keys(inverter.rawSnapshot).length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowRaw((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-amber-300"
          >
            <Code2 className="h-3.5 w-3.5" />
            {showRaw ? t.hideRaw : t.inspectRaw} {t.rawApiSnapshot}
            {showRaw ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showRaw && (
            <pre
              dir="ltr"
              className="mt-2 max-h-60 overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-emerald-300"
            >
              {JSON.stringify(inverter.rawSnapshot, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
