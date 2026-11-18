import { useMemo, useState } from 'react';
import { Activity, Clock, Power, PowerOff, UtilityPole, Zap } from 'lucide-react';
import { translations, type Lang } from '../i18n/translations';
import type { HistoryPoint, InverterTelemetry } from '../types/solar';
import { analyzeGridHistory, formatDurationHours } from '../utils/calculations';

interface GridTrackerCardProps {
  history: HistoryPoint[];
  inverter: InverterTelemetry;
  lang: Lang;
}

export function GridTrackerCard({ history, inverter, lang }: GridTrackerCardProps) {
  const t = translations[lang];
  const [logRange, setLogRange] = useState<'24h' | '7d'>('24h');
  const locale = lang === 'ar' ? 'ar-SY' : undefined;

  const analysis = useMemo(
    () => analyzeGridHistory(history, inverter.gridVoltageV, inverter.gridPowerW),
    [history, inverter.gridVoltageV, inverter.gridPowerW]
  );

  const visibleSessions = (logRange === '24h' ? analysis.sessions24h : analysis.sessions7d).slice(0, 12);

  const formatTime = (iso: string, includeDay: boolean) => {
    const d = new Date(iso);
    if (includeDay) {
      return d.toLocaleString(locale, {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <section className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-4 shadow-xl sm:p-5">
      {/* Header + Live Grid Status Pill */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 shrink-0 rounded-xl border border-violet-500/30 bg-violet-500/10 p-2 text-violet-300">
            <UtilityPole className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">{t.gridTrackerTitle}</h2>
            <p className="text-xs text-slate-400">{t.gridTrackerSub}</p>
          </div>
        </div>

        <div
          className={`inline-flex items-center gap-2 self-start rounded-full border px-3 py-1.5 text-xs font-semibold ${
            analysis.currentlyOn
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-500/40 bg-rose-500/10 text-rose-300'
          }`}
        >
          {analysis.currentlyOn ? (
            <Power className="h-3.5 w-3.5 animate-pulse" />
          ) : (
            <PowerOff className="h-3.5 w-3.5" />
          )}
          <span>
            {analysis.currentlyOn
              ? `${t.gridNowOn}${analysis.currentVoltageV > 0 ? ` • ${analysis.currentVoltageV}V` : ''}`
              : t.gridNowOff}
          </span>
          {analysis.currentStateDurationHours > 0 && (
            <span className="text-[11px] opacity-80">
              ({t.forDuration} {formatDurationHours(analysis.currentStateDurationHours, lang)})
            </span>
          )}
        </div>
      </div>

      {/* 4 Key Stability Metrics */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <div className="rounded-xl border border-violet-500/20 bg-slate-950/75 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-violet-300">
            <Zap className="h-3.5 w-3.5" />
            {t.timesCame24h}
          </div>
          <div className="mt-1 text-xl font-bold text-white sm:text-2xl">
            {analysis.arrivals24h}{' '}
            <span className="text-xs font-normal text-slate-400">{t.timesUnit}</span>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-slate-950/75 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-300">
            <Clock className="h-3.5 w-3.5" />
            {t.gridOnHours24h}
          </div>
          <div className="mt-1 text-xl font-bold text-white sm:text-2xl">
            {formatDurationHours(analysis.onHours24h, lang)}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">
            {t.outageHours}: {formatDurationHours(analysis.offHours24h, lang)}
          </div>
        </div>

        <div className="rounded-xl border border-sky-500/20 bg-slate-950/75 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-sky-300">
            <Activity className="h-3.5 w-3.5" />
            {t.avgSessionLen}
          </div>
          <div className="mt-1 text-xl font-bold text-white sm:text-2xl">
            {analysis.arrivals24h > 0 ? formatDurationHours(analysis.avgSessionHours24h, lang) : '—'}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">{t.perArrival}</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/75 p-3">
          <div className="text-[11px] font-medium text-slate-300">{t.arrivals7d}</div>
          <div className="mt-1 text-xl font-bold text-white sm:text-2xl">
            {analysis.arrivals7d}{' '}
            <span className="text-xs font-normal text-slate-400">{t.timesUnit}</span>
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">
            {t.totalOnHrs}: {formatDurationHours(analysis.onHours7d, lang)}
          </div>
        </div>
      </div>

      {/* 24-Hour Visual ON/OFF Strip */}
      {analysis.timeline24h.length > 0 && (
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <span className="font-medium text-slate-300">{t.gridTimeline24h}</span>
            <div className="flex items-center gap-3 text-slate-400">
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />
                {t.gridOnLegend}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm bg-slate-800" />
                {t.gridOffLegend}
              </span>
            </div>
          </div>

          <div className="flex h-6 w-full gap-px overflow-hidden rounded-lg bg-slate-900 p-0.5" dir="ltr">
            {analysis.timeline24h.map((slot) => (
              <div
                key={slot.ts}
                title={`${new Date(slot.ts).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })} — ${
                  slot.gridOn ? `${t.gridOnLegend} (${slot.gridV}V)` : t.gridOffLegend
                }`}
                className={`h-full flex-1 rounded-[1px] transition ${
                  slot.gridOn ? 'bg-emerald-400/90 hover:bg-emerald-300' : 'bg-slate-800/80 hover:bg-slate-700'
                }`}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-slate-500" dir="ltr">
            <span>{formatTime(analysis.timeline24h[0].ts, false)}</span>
            <span>
              {formatTime(analysis.timeline24h[Math.floor(analysis.timeline24h.length / 2)].ts, false)}
            </span>
            <span>{formatTime(analysis.timeline24h[analysis.timeline24h.length - 1].ts, false)}</span>
          </div>
        </div>
      )}

      {/* Arrival Sessions Log */}
      <div className="mt-4">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-200">
            {logRange === '24h'
              ? `${t.arrivalLog24h} (${analysis.sessions24h.length})`
              : `${t.arrivalLog7d} (${analysis.sessions7d.length})`}
          </span>

          <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setLogRange('24h')}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                logRange === '24h' ? 'bg-violet-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.arrivalLog24h}
            </button>
            <button
              type="button"
              onClick={() => setLogRange('7d')}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                logRange === '7d' ? 'bg-violet-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.arrivalLog7d}
            </button>
          </div>
        </div>

        {visibleSessions.length === 0 ? (
          <div className="rounded-xl border border-slate-800/70 bg-slate-950/60 p-4 text-center text-xs text-slate-400">
            {t.noGridArrivals}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {visibleSessions.map((s) => (
              <div
                key={s.startTs}
                className={`rounded-xl border p-3 text-xs ${
                  s.isOngoing
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : 'border-slate-800/80 bg-slate-950/70'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-white">
                    {formatTime(s.startTs, logRange === '7d')} →{' '}
                    {s.isOngoing ? t.ongoing : formatTime(s.endTs, false)}
                  </span>
                  <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                    {formatDurationHours(s.durationHours, lang)}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    {s.avgVoltageV > 0
                      ? `${t.avgVolt}: ${s.avgVoltageV}V (${s.minVoltageV}–${s.maxVoltageV}V)`
                      : 'AC Input'}
                  </span>
                  <span className="text-violet-300">
                    {s.kwhDrawn.toFixed(2)} {t.unitKwh} {t.drawn}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
