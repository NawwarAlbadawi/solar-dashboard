import { Battery, Clock, Coins, Flame, Sun, Zap } from 'lucide-react';
import type { LatestData, UserSettings } from '../types/solar';
import {
  estimateBackupHours,
  estimateTimeToFullHours,
  formatDurationHours,
  formatWatts,
  getBatteryCapacityKwh,
} from '../utils/calculations';

interface KpiGridProps {
  data: LatestData;
  settings: UserSettings;
}

export function KpiGrid({ data, settings }: KpiGridProps) {
  const { inverter, battery, today } = data;
  const capacityKwh = getBatteryCapacityKwh(battery, settings);
  const backupHours = estimateBackupHours(
    battery.soc,
    Math.max(inverter.loadPowerW, 120),
    capacityKwh,
    settings.reserveSocPct,
    settings.inverterEfficiency
  );
  const timeToFull = estimateTimeToFullHours(battery.soc, battery.powerW, capacityKwh);
  const solarSavings = (today.pvKwh * settings.electricityRatePerKwh).toFixed(2);
  const gridCost = (today.gridKwh * settings.electricityRatePerKwh).toFixed(2);

  const cards = [
    {
      label: 'Solar Generation',
      value: formatWatts(inverter.pvPowerW),
      sub: `Today: ${today.pvKwh.toFixed(2)} kWh • Peak: ${formatWatts(today.peakPvW)}`,
      icon: Sun,
      accent: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      label: 'Home Consumption',
      value: formatWatts(inverter.loadPowerW),
      sub: `Today: ${today.loadKwh.toFixed(2)} kWh • Peak: ${formatWatts(today.peakLoadW)}`,
      icon: Flame,
      accent: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
    },
    {
      label: 'Lithium Battery',
      value: `${battery.soc}%`,
      sub:
        timeToFull !== null
          ? `Charging • Full in ~${formatDurationHours(timeToFull)}`
          : `Est. ${formatDurationHours(backupHours)} left at ${formatWatts(inverter.loadPowerW)}`,
      icon: Battery,
      accent: battery.soc > 40 ? 'text-emerald-400' : battery.soc > 20 ? 'text-amber-400' : 'text-rose-400',
      bg:
        battery.soc > 40
          ? 'bg-emerald-500/10 border-emerald-500/20'
          : 'bg-amber-500/10 border-amber-500/20',
    },
    {
      label: 'Power Hours Today',
      value: `${today.solarActiveHours.toFixed(1)}h Sun`,
      sub: `Peak Sun: ${today.peakSunHours.toFixed(1)}h • Battery: ${today.batteryPowerHours.toFixed(1)}h`,
      icon: Clock,
      accent: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20',
    },
    {
      label: 'Grid & Self-Sufficiency',
      value: `${today.selfSufficiencyPct}% Solar`,
      sub: `Grid Today: ${today.gridKwh.toFixed(2)} kWh (${today.gridPowerHours.toFixed(1)}h)`,
      icon: Zap,
      accent: 'text-violet-400',
      bg: 'bg-violet-500/10 border-violet-500/20',
    },
    {
      label: 'Est. Solar Value Today',
      value: `${settings.currencySymbol}${solarSavings}`,
      sub: `Grid cost: ${settings.currencySymbol}${gridCost} @ ${settings.currencySymbol}${settings.electricityRatePerKwh}/kWh`,
      icon: Coins,
      accent: 'text-teal-400',
      bg: 'bg-teal-500/10 border-teal-500/20',
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-4 shadow-lg transition hover:border-slate-700"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-slate-400">{card.label}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-white">{card.value}</p>
              </div>
              <div className={`rounded-xl border p-2 ${card.bg}`}>
                <Icon className={`h-4 w-4 ${card.accent}`} />
              </div>
            </div>
            <p className="mt-2.5 text-xs text-slate-400">{card.sub}</p>
          </div>
        );
      })}
    </section>
  );
}
