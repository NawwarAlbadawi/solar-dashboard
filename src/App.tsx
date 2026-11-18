import { useCallback, useEffect, useState } from 'react';
import { BatteryPackCard } from './components/BatteryPackCard';
import { BillCalculatorCard } from './components/BillCalculatorCard';
import { DailyConsumptionChart } from './components/DailyConsumptionChart';
import { Header } from './components/Header';
import { InverterSpecsCard } from './components/InverterSpecsCard';
import { KpiGrid } from './components/KpiGrid';
import { PowerFlowCard } from './components/PowerFlowCard';
import { PowerHoursCard } from './components/PowerHoursCard';
import { PowerTimelineChart } from './components/PowerTimelineChart';
import { SettingsModal } from './components/SettingsModal';
import { loadLanguage, saveLanguage, translations, type Lang } from './i18n/translations';
import type { DailySummary, HistoryPoint, LatestData, UserSettings } from './types/solar';
import { loadUserSettings, saveUserSettings } from './utils/calculations';

export default function App() {
  const [latest, setLatest] = useState<LatestData | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [daily, setDaily] = useState<DailySummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(() => loadUserSettings());
  const [lang, setLang] = useState<Lang>(() => loadLanguage());

  const t = translations[lang];

  // Sync HTML lang & dir attributes for seamless RTL Arabic / LTR English layout
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title = lang === 'ar' ? 'لوحة الطاقة الشمسية FSolar' : 'FSolar Dashboard — Felicity Solar Monitor';
    saveLanguage(lang);
  }, [lang]);

  const loadTelemetry = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    const cacheBust = `?t=${Date.now()}`;
    try {
      const [latestRes, historyRes, dailyRes] = await Promise.all([
        fetch(`./data/latest.json${cacheBust}`),
        fetch(`./data/history.json${cacheBust}`),
        fetch(`./data/daily.json${cacheBust}`),
      ]);

      if (!latestRes.ok) {
        throw new Error(`Failed to load telemetry (HTTP ${latestRes.status})`);
      }

      const latestJson: LatestData = await latestRes.json();
      const historyJson: HistoryPoint[] = historyRes.ok ? await historyRes.json() : [];
      const dailyJson: DailySummary[] = dailyRes.ok ? await dailyRes.json() : [];

      setLatest(latestJson);
      setHistory(historyJson);
      setDaily(dailyJson);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load solar telemetry');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTelemetry();
    const timer = setInterval(loadTelemetry, 120_000);
    return () => clearInterval(timer);
  }, [loadTelemetry]);

  const handleSaveSettings = (next: UserSettings) => {
    setSettings(next);
    saveUserSettings(next);
  };

  const handleToggleLang = () => {
    setLang((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  if (error && !latest) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-rose-500/30 bg-slate-900 p-6 text-center">
          <h1 className="text-lg font-semibold text-white">{t.unableToLoad}</h1>
          <p className="mt-2 text-sm text-rose-300">{error}</p>
          <button
            onClick={loadTelemetry}
            className="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400"
          >
            {t.retry}
          </button>
        </div>
      </div>
    );
  }

  if (!latest) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          <p className="text-sm">{t.loadingTelemetry}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <Header
        data={latest}
        lang={lang}
        isRefreshing={isRefreshing}
        onRefresh={loadTelemetry}
        onToggleLang={handleToggleLang}
        onOpenSettings={() => setShowSettings(true)}
      />

      <main className="mx-auto max-w-7xl space-y-5 px-4 pt-5 sm:px-6">
        {/* Top KPI Summary Cards */}
        <KpiGrid data={latest} settings={settings} lang={lang} />

        {/* Power Consumption Cost & New Syria Tariff Calculator */}
        <BillCalculatorCard
          today={latest.today}
          daily={daily}
          settings={settings}
          lang={lang}
          onUpdateSettings={handleSaveSettings}
        />

        {/* Live Energy Flow + Power Hours & Backup Estimator */}
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <PowerFlowCard inverter={latest.inverter} battery={latest.battery} lang={lang} />
          <PowerHoursCard
            today={latest.today}
            inverter={latest.inverter}
            battery={latest.battery}
            settings={settings}
            lang={lang}
          />
        </section>

        {/* Interactive Power & Consumption Timeline */}
        <PowerTimelineChart history={history} lang={lang} />

        {/* Daily Energy Consumption + Lithium Battery Pack & Full Telemetry */}
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <DailyConsumptionChart daily={daily} settings={settings} lang={lang} />
          <div className="space-y-5">
            <BatteryPackCard battery={latest.battery} settings={settings} lang={lang} />
            <InverterSpecsCard inverter={latest.inverter} lang={lang} />
          </div>
        </section>
      </main>

      <footer className="mx-auto mt-10 max-w-7xl border-t border-slate-800/70 px-4 pt-5 text-center text-xs text-slate-500 sm:px-6">
        {t.footerText}
      </footer>

      {showSettings && (
        <SettingsModal
          settings={settings}
          lang={lang}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
