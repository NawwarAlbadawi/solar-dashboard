import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { translations, type Lang } from '../i18n/translations';
import type { DailySummary, UserSettings } from '../types/solar';
import { calculateDailyCost, formatMoney } from '../utils/calculations';

interface DailyConsumptionChartProps {
  daily: DailySummary[];
  settings: UserSettings;
  lang: Lang;
}

export function DailyConsumptionChart({ daily, settings, lang }: DailyConsumptionChartProps) {
  const t = translations[lang];
  const locale = lang === 'ar' ? 'ar-SY' : undefined;

  const recent = daily.slice(-14).map((d) => ({
    ...d,
    shortDate: new Date(`${d.date}T12:00:00`).toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
    }),
    loadCost: calculateDailyCost(d.loadKwh, settings),
  }));

  const totals = recent.reduce(
    (acc, d) => ({
      pv: acc.pv + d.pvKwh,
      load: acc.load + d.loadKwh,
      grid: acc.grid + d.gridKwh,
      sunHrs: acc.sunHrs + d.solarActiveHours,
    }),
    { pv: 0, load: 0, grid: 0, sunHrs: 0 }
  );

  return (
    <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-5 shadow-xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">{t.dailyTitle}</h2>
          <p className="text-xs text-slate-400">
            {t.lastDays} {recent.length} {t.days} • {t.totalPv}:{' '}
            <strong className="text-amber-300">
              {totals.pv.toFixed(1)} {t.unitKwh}
            </strong>{' '}
            • {t.homeLoad}:{' '}
            <strong className="text-rose-300">
              {totals.load.toFixed(1)} {t.unitKwh}
            </strong>{' '}
            • {t.grid}:{' '}
            <strong className="text-violet-300">
              {totals.grid.toFixed(1)} {t.unitKwh}
            </strong>
          </p>
        </div>
        <span className="rounded-full border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-300">
          {t.avgSun}: {(totals.sunHrs / Math.max(1, recent.length)).toFixed(1)}h{t.perDay}
        </span>
      </div>

      <div className="h-64 w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={recent} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="shortDate"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#1e293b' }}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              unit=" kWh"
            />
            <Tooltip
              cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
              contentStyle={{
                backgroundColor: '#0b1220',
                border: '1px solid #334155',
                borderRadius: '0.75rem',
                fontSize: '12px',
              }}
              formatter={(value: number, name: string) => [`${value.toFixed(2)} ${t.unitKwh}`, name]}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '6px' }} />
            <Bar dataKey="pvKwh" name={t.solarProduction} fill="#fbbf24" radius={[4, 4, 0, 0]} />
            <Bar dataKey="loadKwh" name={t.homeConsumption} fill="#fb7185" radius={[4, 4, 0, 0]} />
            <Bar dataKey="gridKwh" name={t.gridImport} fill="#a78bfa" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Compact Daily Power Hours + Cost Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-start text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="py-2 pe-3 text-start font-medium">{t.date}</th>
              <th className="py-2 pe-3 text-start font-medium">{t.pvKwh}</th>
              <th className="py-2 pe-3 text-start font-medium">{t.loadKwh}</th>
              <th className="py-2 pe-3 text-start font-medium">{t.cost}</th>
              <th className="py-2 pe-3 text-start font-medium">{t.sunHrs}</th>
              <th className="py-2 pe-3 text-start font-medium">{t.battHrs}</th>
              <th className="py-2 text-end font-medium">{t.solarPct}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {recent
              .slice(-7)
              .reverse()
              .map((d) => (
                <tr key={d.date} className="text-slate-300 hover:bg-slate-800/30">
                  <td className="py-2 pe-3 font-medium text-white">{d.shortDate}</td>
                  <td className="py-2 pe-3 text-amber-300">{d.pvKwh.toFixed(2)}</td>
                  <td className="py-2 pe-3 text-rose-300">{d.loadKwh.toFixed(2)}</td>
                  <td className="py-2 pe-3 font-medium text-teal-300">
                    {formatMoney(d.loadCost, settings, lang)}
                  </td>
                  <td className="py-2 pe-3">{d.solarActiveHours.toFixed(1)}h</td>
                  <td className="py-2 pe-3 text-emerald-300">{d.batteryPowerHours.toFixed(1)}h</td>
                  <td className="py-2 text-end font-semibold text-emerald-400">
                    {d.selfSufficiencyPct}%
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
