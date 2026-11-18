import { useMemo, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { HistoryPoint } from '../types/solar';

interface PowerTimelineChartProps {
  history: HistoryPoint[];
}

type TimeRange = '24h' | '48h' | '7d';

export function PowerTimelineChart({ history }: PowerTimelineChartProps) {
  const [range, setRange] = useState<TimeRange>('24h');
  const [showSoc, setShowSoc] = useState(true);

  const chartData = useMemo(() => {
    if (!history.length) return [];
    const lastTs = new Date(history[history.length - 1].ts).getTime();
    const hoursMap: Record<TimeRange, number> = { '24h': 24, '48h': 48, '7d': 24 * 7 };
    const cutoff = lastTs - hoursMap[range] * 3600 * 1000;
    const filtered = history.filter((p) => new Date(p.ts).getTime() >= cutoff);

    // Downsample slightly on 7d view for silky-smooth rendering
    const step = range === '7d' && filtered.length > 260 ? Math.ceil(filtered.length / 260) : 1;
    return filtered
      .filter((_, idx) => idx % step === 0 || idx === filtered.length - 1)
      .map((p) => {
        const d = new Date(p.ts);
        const label =
          range === '7d'
            ? d.toLocaleDateString(undefined, { weekday: 'short', hour: '2-digit' })
            : d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        return {
          ...p,
          label,
          fullTime: d.toLocaleString(),
        };
      });
  }, [history, range]);

  return (
    <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-5 shadow-xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Power &amp; Consumption Timeline</h2>
          <p className="text-xs text-slate-400">
            Solar PV generation vs. home consumption, grid usage &amp; battery SOC curve
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={showSoc}
              onChange={(e) => setShowSoc(e.target.checked)}
              className="rounded accent-emerald-400"
            />
            Show SOC %
          </label>

          <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-xs">
            {(['24h', '48h', '7d'] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-md px-2.5 py-1 font-medium transition ${
                  range === r
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-72 w-full sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="pvGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.42} />
                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fb7185" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#fb7185" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gridGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#1e293b' }}
              minTickGap={34}
            />
            <YAxis
              yAxisId="power"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`)}
              unit="W"
            />
            {showSoc && (
              <YAxis
                yAxisId="soc"
                orientation="right"
                domain={[0, 100]}
                tick={{ fill: '#34d399', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                unit="%"
              />
            )}

            <Tooltip
              contentStyle={{
                backgroundColor: '#0b1220',
                border: '1px solid #334155',
                borderRadius: '0.75rem',
                fontSize: '12px',
              }}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.fullTime || ''}
              formatter={(value: number, name: string) => {
                if (name === 'Battery SOC') return [`${value}%`, name];
                return [`${Math.round(value)} W`, name];
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />

            <Area
              yAxisId="power"
              type="monotone"
              dataKey="pvW"
              name="Solar PV"
              stroke="#fbbf24"
              strokeWidth={2}
              fill="url(#pvGrad)"
            />
            <Area
              yAxisId="power"
              type="monotone"
              dataKey="loadW"
              name="Home Load"
              stroke="#fb7185"
              strokeWidth={2}
              fill="url(#loadGrad)"
            />
            <Area
              yAxisId="power"
              type="monotone"
              dataKey="gridW"
              name="Grid Import"
              stroke="#a78bfa"
              strokeWidth={1.8}
              fill="url(#gridGrad)"
            />
            {showSoc && (
              <Line
                yAxisId="soc"
                type="monotone"
                dataKey="soc"
                name="Battery SOC"
                stroke="#34d399"
                strokeWidth={2}
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
