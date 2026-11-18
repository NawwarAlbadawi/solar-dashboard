import { Battery, Clock, Coins, Flame, Sun, Zap } from 'lucide-react';
import { translations, type Lang } from '../i18n/translations';
import type { LatestData, UserSettings } from '../types/solar';
import {
  calculateDailyCost,
  estimateBackupHours,
  estimateTimeToFullHours,
  formatDurationHours,
  formatMoney,
  formatWatts,
  getBatteryCapacityKwh,
} from '../utils/calculations';

interface KpiGridProps {
  data: LatestData;
  settings: UserSettings;
  lang: Lang;
}

export function KpiGrid({ data, settings, lang }: KpiGridProps) {
  const t = translations[lang];
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

  const todayConsumptionCost = calculateDailyCost(today.loadKwh, settings);
  const todayGridCost = calculateDailyCost(today.gridKwh, settings);
  const todaySavings = Math.max(0, todayConsumptionCost - todayGridCost);

  const cards = [
    {
      label: t.solarGeneration,
      value: formatWatts(inverter.pvPowerW),
      sub: `${t.today}: ${today.pvKwh.toFixed(2)} ${t.unitKwh} • ${t.peak}: ${formatWatts(today.peakPvW)}`,
      icon: Sun,
      accent: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      label: t.homeConsumption,
      value: formatWatts(inverter.loadPowerW),
      sub: `${t.today}: ${today.loadKwh.toFixed(2)} ${t.unitKwh} • ${t.peak}: ${formatWatts(today.peakLoadW)}`,
      icon: Flame,
      accent: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
    },
    {
      label: t.lithiumBattery,
      value: `${battery.soc}%`,
      sub:
        timeToFull !== null
          ? `${t.chargingFullIn} ~${formatDurationHours(timeToFull, lang)}`
          : `${t.estLeftAt} ${formatDurationHours(backupHours, lang)} ${t.leftAt} ${formatWatts(inverter.loadPowerW)}`,
      icon: Battery,
      accent: battery.soc > 40 ? 'text-emerald-400' : battery.soc > 20 ? 'text-amber-400' : 'text-rose-400',
      bg:
        battery.soc > 40
          ? 'bg-emerald-500/10 border-emerald-500/20'
          : 'bg-amber-500/10 border-amber-500/20',
    },
    {
      label: t.powerHoursToday,
      value: `${today.solarActiveHours.toFixed(1)}h ${t.sun}`,
      sub: `${t.peakSun}: ${today.peakSunHours.toFixed(1)}h • ${t.battery}: ${today.batteryPowerHours.toFixed(1)}h`,
      icon: Clock,
      accent: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20',
    },
    {
      label: t.gridSelfSufficiency,
      value: `${today.selfSufficiencyPct}% ${t.solar}`,
      sub: `${t.gridToday}: ${today.gridKwh.toFixed(2)} ${t.unitKwh} (${today.gridPowerHours.toFixed(1)}h)`,
      icon: Zap,
      accent: 'text-violet-400',
      bg: 'bg-violet-500/10 border-violet-500/20',
    },
    {
      label: t.consumptionCostToday,
      value: formatMoney(todayConsumptionCost, settings, lang),
      sub: `${t.gridBill}: ${formatMoney(todayGridCost, settings, lang)} • ${t.savedBySolar}: ${formatMoney(todaySavings, settings, lang)}`,
      icon: Coins,
      accent: 'text-teal-400',
      bg: 'bg-teal-500/10 border-teal-500/20',
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-2.5 sm:gap-3.5 md:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-slate-900/60 p-3 shadow-lg transition hover:border-slate-700 sm:p-4"
          >
            <div className="flex items-start justify-between gap-1.5 sm:gap-2">
              <div className="min-w-0">
                <p className="truncate text-[11px] font-medium text-slate-400 sm:text-xs">
                  {card.label}
                </p>
                <p className="mt-1 break-words text-lg font-bold tracking-tight text-white sm:text-2xl">
                  {card.value}
                </p>
              </div>
              <div className={`shrink-0 rounded-xl border p-1.5 sm:p-2 ${card.bg}`}>
                <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${card.accent}`} />
              </div>
            </div>
            <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-slate-400 sm:mt-2.5 sm:text-xs">
              {card.sub}
            </p>
          </div>
        );
      })}
    </section>
  );
}
