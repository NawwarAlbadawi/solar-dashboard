import { Languages, RefreshCw, Settings, Sun, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { translations, type Lang } from '../i18n/translations';
import type { LatestData } from '../types/solar';
import { detectSystemVoltage, formatRelativeTime } from '../utils/calculations';

interface HeaderProps {
  data: LatestData;
  lang: Lang;
  isRefreshing: boolean;
  onRefresh: () => void;
  onToggleLang: () => void;
  onOpenSettings: () => void;
}

export function Header({
  data,
  lang,
  isRefreshing,
  onRefresh,
  onToggleLang,
  onOpenSettings,
}: HeaderProps) {
  const t = translations[lang];
  const { inverter, battery, mode, updatedAt } = data;
  const isDemo = mode === 'demo';
  const sysV = detectSystemVoltage(battery.voltageV || inverter.batteryVoltageV);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-2.5 px-3 py-2.5 sm:px-6 sm:py-3 md:flex-row md:items-center md:justify-between">
        {/* Top Row: Brand + Quick Actions on Mobile */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/20 sm:h-10 sm:w-10">
              <Sun className="h-4.5 w-4.5 sm:h-5 sm:w-5" strokeWidth={2.4} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h1 className="truncate text-sm font-semibold tracking-tight text-white sm:text-lg">
                  {t.appTitle}
                </h1>
                <span
                  className="hidden rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] font-medium text-amber-300 sm:inline-block sm:text-xs"
                  dir="ltr"
                >
                  {inverter.model} • {(inverter.ratedPowerW / 1000).toFixed(1).replace(/\.0$/, '')}kW {sysV}V
                </span>
                {isDemo ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300 sm:px-2.5 sm:text-xs">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    {t.demoData}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300 sm:px-2.5 sm:text-xs">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    {t.liveCloud}
                  </span>
                )}
              </div>

              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-400 sm:gap-x-3 sm:text-xs">
                <span className="inline-flex items-center gap-1">
                  {inverter.online ? (
                    <Wifi className="h-3 w-3 text-emerald-400 sm:h-3.5 sm:w-3.5" />
                  ) : (
                    <WifiOff className="h-3 w-3 text-rose-400 sm:h-3.5 sm:w-3.5" />
                  )}
                  <span className="hidden xs:inline">
                    {inverter.online ? t.inverterOnline : t.inverterOffline}
                  </span>
                </span>
                <span className="sm:hidden" dir="ltr">
                  {inverter.model} • {sysV}V
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">
                  {t.mode}: <strong className="font-medium text-slate-200">{inverter.workMode}</strong>
                </span>
                <span>•</span>
                <span title={new Date(updatedAt).toLocaleString()}>
                  {formatRelativeTime(updatedAt, lang)}
                </span>
              </div>
            </div>
          </div>

          {/* Mobile compact icon buttons */}
          <div className="flex shrink-0 items-center gap-1.5 md:hidden">
            <button
              onClick={onToggleLang}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 text-xs font-semibold text-amber-300 active:scale-95"
              aria-label="Switch Language"
            >
              <Languages className="h-3.5 w-3.5" />
              <span>{lang === 'en' ? 'عربي' : 'EN'}</span>
            </button>
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/80 bg-slate-900 text-slate-200 active:scale-95 disabled:opacity-50"
              aria-label={t.refresh}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <button
              onClick={onOpenSettings}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/80 bg-slate-900 text-slate-200 active:scale-95"
              aria-label={t.systemConfig}
            >
              <Settings className="h-4 w-4 text-slate-300" />
            </button>
          </div>
        </div>

        {/* Tablet & Desktop Action Buttons */}
        <div className="hidden items-center gap-2 md:flex">
          <button
            onClick={onToggleLang}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20"
            title="Switch Language / تبديل اللغة"
          >
            <Languages className="h-3.5 w-3.5" />
            {lang === 'en' ? 'العربية' : 'EN'}
          </button>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            {t.refresh}
          </button>
          <button
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-amber-500/50 hover:bg-slate-800"
          >
            <Settings className="h-3.5 w-3.5 text-slate-300" />
            {t.systemConfig}
          </button>
        </div>
      </div>

      {isDemo && (
        <div className="border-t border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-center text-[11px] leading-relaxed text-amber-200/90 sm:px-4 sm:text-xs">
          {t.demoBannerPrefix}{' '}
          <code className="rounded bg-slate-900 px-1 py-0.5 text-amber-300" dir="ltr">FSOLAR_EMAIL</code>{' '}
          {t.demoBannerMiddle}{' '}
          <code className="rounded bg-slate-900 px-1 py-0.5 text-amber-300" dir="ltr">FSOLAR_PASSWORD</code>{' '}
          {t.demoBannerSuffix}
        </div>
      )}
    </header>
  );
}
