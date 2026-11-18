import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DailySummary } from '../types/solar';

interface DailyConsumptionChartProps {
  daily: DailySummary[];
}

export function DailyConsumptionChart({ daily }: DailyConsumptionChartProps) {
  const recent = daily.slice(-14).map((d) => ({
    ...d,
    shortDate: new Date(`${d.date}T12:00:00`).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
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
          <h2 className="text-sm font-semibold text-white">Daily Energy &amp; Consumption (kWh)</h2>
          <p className="text-xs text-slate-400">
            Last {recent.length} days • Total PV: <strong className="text-amber-300">{totals.pv.toFixed(1)} kWh</strong> •
            Load: <strong className="text-rose-300">{totals.load.toFixed(1)} kWh</strong> •
            Grid: <strong className="text-violet-300">{totals.grid.toFixed(1)} kWh</strong>
          </p>
        </div>
        <span className="rounded-full border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-300">
          Avg Sun: {(totals.sunHrs / Math.max(1, recent.length)).toFixed(1)}h / day
        </span>
      </div>

      <div className="h-64 w-full">
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
              formatter={(value: number, name: string) => [`${value.toFixed(2)} kWh`, name]}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '6px' }} />
            <Bar dataKey="pvKwh" name="Solar Production" fill="#fbbf24" radius={[4, 4, 0, 0]} />
            <Bar dataKey="loadKwh" name="Home Consumption" fill="#fb7185" radius={[4, 4, 0, 0]} />
            <Bar dataKey="gridKwh" name="Grid Import" fill="#a78bfa" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Compact Daily Power Hours Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="py-2 pr-3 font-medium">Date</th>
              <th className="py-2 pr-3 font-medium">PV kWh</th>
              <th className="py-2 pr-3 font-medium">Load kWh</th>
              <th className="py-2 pr-3 font-medium">Sun Hrs</th>
              <th className="py-2 pr-3 font-medium">Batt Hrs</th>
              <th className="py-2 pr-3 font-medium">Grid Hrs</th>
              <th className="py-2 text-right font-medium">Solar %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {recent
              .slice(-7)
              .reverse()
              .map((d) => (
                <tr key={d.date} className="text-slate-300 hover:bg-slate-800/30">
                  <td className="py-2 pr-3 font-medium text-white">{d.shortDate}</td>
                  <td className="py-2 pr-3 text-amber-300">{d.pvKwh.toFixed(2)}</td>
                  <td className="py-2 pr-3 text-rose-300">{d.loadKwh.toFixed(2)}</td>
                  <td className="py-2 pr-3">{d.solarActiveHours.toFixed(1)}h</td>
                  <td className="py-2 pr-3 text-emerald-300">{d.batteryPowerHours.toFixed(1)}h</td>
                  <td className="py-2 pr-3 text-violet-300">{d.gridPowerHours.toFixed(1)}h</td>
                  <td className="py-2 text-right font-semibold text-emerald-400">
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
