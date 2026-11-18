import { useState } from 'react';
import { X, RotateCcw } from 'lucide-react';
import type { UserSettings } from '../types/solar';
import { DEFAULT_SETTINGS } from '../utils/calculations';

interface SettingsModalProps {
  settings: UserSettings;
  onSave: (next: UserSettings) => void;
  onClose: () => void;
}

export function SettingsModal({ settings, onSave, onClose }: SettingsModalProps) {
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
            <h3 className="text-base font-semibold text-white">System Configuration</h3>
            <p className="text-xs text-slate-400">Tune battery &amp; cost settings for accurate backup hours</p>
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
              <span className="text-slate-300">Battery Capacity (Ah)</span>
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
              <span className="text-slate-300">Nominal Voltage (V)</span>
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
            Total Battery Bank:{' '}
            <strong className="text-emerald-300">
              {((draft.batteryCapacityAh * draft.batteryNominalV) / 1000).toFixed(2)} kWh
            </strong>{' '}
            (e.g. 24V LiFePO4: 25.6V × 200Ah = 5.12kWh • 48V LiFePO4: 51.2V × 100Ah = 5.12kWh)
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-slate-300">Reserve Cutoff SOC (%)</span>
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
              <span className="text-slate-300">Inverter Efficiency</span>
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

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-slate-300">Electricity Rate (/kWh)</span>
              <input
                type="number"
                min={0}
                max={1000}
                step={0.01}
                value={draft.electricityRatePerKwh}
                onChange={(e) => setDraft({ ...draft, electricityRatePerKwh: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-slate-300">Currency Symbol</span>
              <input
                type="text"
                maxLength={4}
                value={draft.currencySymbol}
                onChange={(e) => setDraft({ ...draft, currencySymbol: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
              />
            </label>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setDraft(DEFAULT_SETTINGS)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-slate-300 hover:bg-slate-800"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-700 px-3.5 py-1.5 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-amber-500 px-4 py-1.5 font-semibold text-slate-950 hover:bg-amber-400"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
