import { RefreshCw, Settings, Sun, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import type { LatestData } from '../types/solar';
import { detectSystemVoltage, formatRelativeTime } from '../utils/calculations';

interface HeaderProps {
  data: LatestData;
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenSettings: () => void;
}

export function Header({ data, isRefreshing, onRefresh, onOpenSettings }: HeaderProps) {
  const { inverter, battery, mode, updatedAt } = data;
  const isDemo = mode === 'demo';
  const sysV = detectSystemVoltage(battery.voltageV || inverter.batteryVoltageV);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/20">
            <Sun className="h-5 w-5" strokeWidth={2.4} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base font-semibold tracking-tight text-white sm:text-lg">
                FSolar Dashboard
              </h1>
              <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                {inverter.model} • {(inverter.ratedPowerW / 1000).toFixed(1).replace(/\.0$/, '')}kW {sysV}V
              </span>
              {isDemo ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                  <AlertTriangle className="h-3 w-3" />
                  Demo Data
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  Live FSolar Cloud
                </span>
              )}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1">
                {inverter.online ? (
                  <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5 text-rose-400" />
                )}
                {inverter.online ? 'Inverter Online' : 'Inverter Offline'}
              </span>
              <span>•</span>
              <span>Mode: <strong className="font-medium text-slate-200">{inverter.workMode}</strong></span>
              <span>•</span>
              <span title={new Date(updatedAt).toLocaleString()}>
                Updated {formatRelativeTime(updatedAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            Refresh
          </button>
          <button
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-amber-500/50 hover:bg-slate-800"
          >
            <Settings className="h-3.5 w-3.5 text-slate-300" />
            System Config
          </button>
        </div>
      </div>

      {isDemo && (
        <div className="border-t border-amber-500/20 bg-amber-500/5 px-4 py-1.5 text-center text-xs text-amber-200/90">
          Showing demo solar telemetry. Fork this repo &amp; add{' '}
          <code className="rounded bg-slate-900 px-1.5 py-0.5 text-amber-300">FSOLAR_EMAIL</code> &amp;{' '}
          <code className="rounded bg-slate-900 px-1.5 py-0.5 text-amber-300">FSOLAR_PASSWORD</code> in
          GitHub Repository Secrets to connect your own Felicity Solar inverter automatically.
        </div>
      )}
    </header>
  );
}
