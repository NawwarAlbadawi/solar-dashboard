import { useState } from 'react';
import { Banknote, Calculator, CheckCircle2, AlertTriangle, TrendingDown } from 'lucide-react';
import { translations, type Lang } from '../i18n/translations';
import type { DailySummary, SyriaCurrencyMode, TariffPreset, UserSettings } from '../types/solar';
import {
  SYRIA_TARIFF,
  calculateCycleBill,
  calculateDailyCost,
  formatMoney,
  getSyriaScale,
  isSyriaPreset,
} from '../utils/calculations';

interface BillCalculatorCardProps {
  today: DailySummary;
  daily: DailySummary[];
  settings: UserSettings;
  lang: Lang;
  onUpdateSettings: (next: UserSettings) => void;
}

export function BillCalculatorCard({
  today,
  daily,
  settings,
  lang,
  onUpdateSettings,
}: BillCalculatorCardProps) {
  const t = translations[lang];
  const [quickKwh, setQuickKwh] = useState<number>(400);

  const recent = daily.slice(-14);
  const avgDailyLoadKwh =
    recent.length > 0
      ? recent.reduce((s, d) => s + d.loadKwh, 0) / recent.length
      : today.loadKwh;
  const avgDailyGridKwh =
    recent.length > 0
      ? recent.reduce((s, d) => s + d.gridKwh, 0) / recent.length
      : today.gridKwh;

  // Today's costs
  const todayConsumptionValue = calculateDailyCost(today.loadKwh, settings);
  const todayGridCost = calculateDailyCost(today.gridKwh, settings);
  const todaySolarSavings = Math.max(0, todayConsumptionValue - todayGridCost);

  // 2-Month (60-day) Cycle Projection
  const projectedCycleLoadKwh = avgDailyLoadKwh * SYRIA_TARIFF.CYCLE_DAYS;
  const projectedCycleGridKwh = avgDailyGridKwh * SYRIA_TARIFF.CYCLE_DAYS;
  const cycleGridBill = calculateCycleBill(projectedCycleGridKwh, settings);
  const cycleWithoutSolarBill = calculateCycleBill(projectedCycleLoadKwh, settings);
  const cycleSavings = Math.max(0, cycleWithoutSolarBill.totalCost - cycleGridBill.totalCost);

  // Quick interactive 2-month calculator
  const quickBill = calculateCycleBill(quickKwh, settings);

  const syriaActive = isSyriaPreset(settings.tariffPreset);
  const scale = getSyriaScale(settings);
  const tier1RateDisplay = SYRIA_TARIFF.RESIDENTIAL_TIER1_OLD_SYP * scale;
  const tier2RateDisplay = SYRIA_TARIFF.RESIDENTIAL_TIER2_OLD_SYP * scale;
  const tier1ProgressPct = Math.min(
    100,
    (projectedCycleGridKwh / SYRIA_TARIFF.RESIDENTIAL_TIER1_LIMIT_KWH) * 100
  );
  const overTier1 = projectedCycleGridKwh > SYRIA_TARIFF.RESIDENTIAL_TIER1_LIMIT_KWH;

  const setPreset = (tariffPreset: TariffPreset) =>
    onUpdateSettings({ ...settings, tariffPreset });
  const setCurrencyMode = (syriaCurrencyMode: SyriaCurrencyMode) =>
    onUpdateSettings({ ...settings, syriaCurrencyMode });

  return (
    <section className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-5 shadow-xl">
      {/* Header + Tariff / Currency Switchers */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 rounded-xl border border-teal-500/30 bg-teal-500/10 p-2 text-teal-300">
            <Banknote className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">{t.billCardTitle}</h2>
            <p className="text-xs text-slate-400">{t.billCardSub}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={settings.tariffPreset}
            onChange={(e) => setPreset(e.target.value as TariffPreset)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-slate-100 focus:border-amber-400 focus:outline-none"
          >
            <option value="syria_residential">{t.tariffSyriaRes}</option>
            <option value="syria_commercial">{t.tariffSyriaCom}</option>
            <option value="syria_exempt">{t.tariffSyriaExempt}</option>
            <option value="syria_heavy">{t.tariffSyriaHeavy}</option>
            <option value="custom">{t.tariffCustom}</option>
          </select>

          {syriaActive && (
            <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setCurrencyMode('old')}
                className={`rounded-md px-2.5 py-1 font-medium transition ${
                  settings.syriaCurrencyMode === 'old'
                    ? 'bg-teal-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.oldSyp}
              </button>
              <button
                type="button"
                onClick={() => setCurrencyMode('new')}
                className={`rounded-md px-2.5 py-1 font-medium transition ${
                  settings.syriaCurrencyMode === 'new'
                    ? 'bg-teal-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.newSyp}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Today's 3 Financial Highlights */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-rose-500/20 bg-slate-950/75 p-3.5">
          <div className="text-xs font-medium text-rose-300">{t.todayHomeValue}</div>
          <div className="mt-1 text-xl font-bold text-white">
            {formatMoney(todayConsumptionValue, settings, lang)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {today.loadKwh.toFixed(2)} {t.unitKwh} • {t.todayHomeValueSub}
          </div>
        </div>

        <div className="rounded-xl border border-violet-500/20 bg-slate-950/75 p-3.5">
          <div className="text-xs font-medium text-violet-300">{t.todayGridBill}</div>
          <div className="mt-1 text-xl font-bold text-white">
            {formatMoney(todayGridCost, settings, lang)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {today.gridKwh.toFixed(2)} {t.unitKwh} • {t.todayGridBillSub}
          </div>
        </div>

        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-300">
            <TrendingDown className="h-3.5 w-3.5" />
            {t.todaySolarSavings}
          </div>
          <div className="mt-1 text-xl font-bold text-emerald-300">
            {formatMoney(todaySolarSavings, settings, lang)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">{t.todaySolarSavingsSub}</div>
        </div>
      </div>

      {/* 2-Month Cycle Projection + Quick Syria Tier Calculator */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Left: 60-day Cycle Projection */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-semibold text-white">{t.cycleProjectionTitle}</h3>
            <span className="text-[11px] text-slate-400">
              {t.cycleBasedOn} {avgDailyGridKwh.toFixed(1)} {t.unitKwh}
              {t.perDay} {t.grid} / {avgDailyLoadKwh.toFixed(1)} {t.unitKwh}
              {t.perDay}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-800/80 bg-slate-900/70 p-2.5">
              <div className="text-[11px] text-slate-400">{t.gridBill2Months}</div>
              <div className="mt-0.5 text-sm font-bold text-violet-300">
                {formatMoney(cycleGridBill.totalCost, settings, lang)}
              </div>
              <div className="text-[10px] text-slate-500">
                ~{Math.round(projectedCycleGridKwh)} {t.unitKwh}
              </div>
            </div>
            <div className="rounded-lg border border-slate-800/80 bg-slate-900/70 p-2.5">
              <div className="text-[11px] text-slate-400">{t.withoutSolar2Months}</div>
              <div className="mt-0.5 text-sm font-bold text-rose-300">
                {formatMoney(cycleWithoutSolarBill.totalCost, settings, lang)}
              </div>
              <div className="text-[10px] text-slate-500">
                ~{Math.round(projectedCycleLoadKwh)} {t.unitKwh}
              </div>
            </div>
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5">
              <div className="text-[11px] text-emerald-300">{t.saved2Months}</div>
              <div className="mt-0.5 text-sm font-bold text-emerald-300">
                {formatMoney(cycleSavings, settings, lang)}
              </div>
              <div className="text-[10px] text-emerald-200/70">
                {cycleWithoutSolarBill.totalCost > 0
                  ? `${Math.round((cycleSavings / cycleWithoutSolarBill.totalCost) * 100)}%`
                  : '0%'}
              </div>
            </div>
          </div>

          {/* Syria Residential 300 kWh Tier 1 vs Tier 2 Bar */}
          {settings.tariffPreset === 'syria_residential' && (
            <div className="mt-3.5">
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="text-slate-300">
                  {t.tier1Label}: <strong className="text-teal-300">{tier1RateDisplay.toLocaleString()}</strong>{' '}
                  • {t.tier2Label}: <strong className="text-amber-300">{tier2RateDisplay.toLocaleString()}</strong>
                </span>
                <span className="font-mono text-slate-400">
                  {Math.round(projectedCycleGridKwh)} / 300 {t.unitKwh}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  style={{ width: `${tier1ProgressPct}%` }}
                  className={`h-full rounded-full transition-all ${
                    overTier1 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                />
              </div>
              <div
                className={`mt-1.5 flex items-center gap-1.5 text-[11px] ${
                  overTier1 ? 'text-amber-300' : 'text-emerald-300'
                }`}
              >
                {overTier1 ? (
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>{overTier1 ? t.tierStatusOver : t.tierStatusSafe}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Quick Interactive 2-Month kWh Bill Check */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 lg:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white">
              <Calculator className="h-3.5 w-3.5 text-amber-400" />
              {t.quickBillCheck}
            </span>
            <span className="font-mono text-xs font-bold text-amber-300">
              {quickKwh} {t.unitKwh}
            </span>
          </div>

          <input
            type="range"
            min={50}
            max={1500}
            step={25}
            value={quickKwh}
            onChange={(e) => setQuickKwh(Number(e.target.value))}
            className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-teal-400"
          />

          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-lg font-bold text-white">
              {formatMoney(quickBill.totalCost, settings, lang)}
            </span>
            <span className="text-[11px] text-slate-400">{t.kwhInCycle}</span>
          </div>

          {settings.tariffPreset === 'syria_residential' && (
            <div className="mt-2 space-y-1 border-t border-slate-800 pt-2 text-[11px] text-slate-400">
              <div className="flex justify-between">
                <span>
                  {t.tier1Label} ({quickBill.tier1Kwh} {t.unitKwh})
                </span>
                <span className="text-slate-200">{formatMoney(quickBill.tier1Cost, settings, lang)}</span>
              </div>
              {quickBill.tier2Kwh > 0 && (
                <div className="flex justify-between">
                  <span>
                    {t.tier2Label} ({quickBill.tier2Kwh} {t.unitKwh})
                  </span>
                  <span className="text-amber-300">{formatMoney(quickBill.tier2Cost, settings, lang)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
