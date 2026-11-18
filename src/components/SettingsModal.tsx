import { useState } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { translations, type Lang } from '../i18n/translations';
import type { SyriaCurrencyMode, TariffPreset, UserSettings } from '../types/solar';
import { DEFAULT_SETTINGS, isSyriaPreset } from '../utils/calculations';

interface SettingsModalProps {
  settings: UserSettings;
  lang: Lang;
  onSave: (next: UserSettings) => void;
  onClose: () => void;
}

export function SettingsModal({ settings, lang, onSave, onClose }: SettingsModalProps) {
  const t = translations[lang];
  const [draft, setDraft] = useState<UserSettings>(settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(draft);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-semibold text-white">{t.settingsTitle}</h3>
            <p className="text-xs text-slate-400">{t.settingsSub}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-slate-300">{t.batteryCapAh}</span>
              <input
                type="number"
                min={20}
                max={2000}
                step={10}
                value={draft.batteryCapacityAh}
                onChange={(e) => setDraft({ ...draft, batteryCapacityAh: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-slate-300">{t.nominalVoltage}</span>
              <input
                type="number"
                min={12}
                max={60}
                step={0.1}
                value={draft.batteryNominalV}
                onChange={(e) => setDraft({ ...draft, batteryNominalV: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
              />
            </label>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-slate-300">
            {t.totalBatteryBank}:{' '}
            <strong className="text-emerald-300">
              {((draft.batteryCapacityAh * draft.batteryNominalV) / 1000).toFixed(2)} {t.unitKwh}
            </strong>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-slate-300">{t.reserveSoc}</span>
              <input
                type="number"
                min={0}
                max={50}
                value={draft.reserveSocPct}
                onChange={(e) => setDraft({ ...draft, reserveSocPct: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-slate-300">{t.inverterEff}</span>
              <input
                type="number"
                min={0.7}
                max={0.99}
                step={0.01}
                value={draft.inverterEfficiency}
                onChange={(e) => setDraft({ ...draft, inverterEfficiency: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
              />
            </label>
          </div>

          {/* Tariff Preset Selector */}
          <label className="block">
            <span className="text-slate-300">{t.tariffPreset}</span>
            <select
              value={draft.tariffPreset}
              onChange={(e) => setDraft({ ...draft, tariffPreset: e.target.value as TariffPreset })}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
            >
              <option value="syria_residential">{t.tariffSyriaRes}</option>
              <option value="syria_commercial">{t.tariffSyriaCom}</option>
              <option value="syria_exempt">{t.tariffSyriaExempt}</option>
              <option value="syria_heavy">{t.tariffSyriaHeavy}</option>
              <option value="custom">{t.tariffCustom}</option>
            </select>
          </label>

          {isSyriaPreset(draft.tariffPreset) ? (
            <label className="block">
              <span className="text-slate-300">{t.syriaCurrencyLabel}</span>
              <select
                value={draft.syriaCurrencyMode}
                onChange={(e) =>
                  setDraft({ ...draft, syriaCurrencyMode: e.target.value as SyriaCurrencyMode })
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
              >
                <option value="old">{t.oldSyp} (600 / 1,400)</option>
                <option value="new">{t.newSyp} (6 / 14)</option>
              </select>
            </label>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-slate-300">{t.customRateLabel}</span>
                <input
                  type="number"
                  min={0}
                  max={100000}
                  step={0.01}
                  value={draft.electricityRatePerKwh}
                  onChange={(e) =>
                    setDraft({ ...draft, electricityRatePerKwh: Number(e.target.value) })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-slate-300">{t.currencySymbolLabel}</span>
                <input
                  type="text"
                  maxLength={6}
                  value={draft.currencySymbol}
                  onChange={(e) => setDraft({ ...draft, currencySymbol: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </label>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setDraft(DEFAULT_SETTINGS)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-slate-300 hover:bg-slate-800"
            >
              <RotateCcw className="h-3.5 w-3.5" /> {t.reset}
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-700 px-3.5 py-1.5 text-slate-300 hover:bg-slate-800"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="rounded-lg bg-amber-500 px-4 py-1.5 font-semibold text-slate-950 hover:bg-amber-400"
              >
                {t.saveChanges}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
