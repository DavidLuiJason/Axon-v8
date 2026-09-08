import React, { useState } from 'react';
import { X, HardDrive } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatBytes } from '../../lib/storageManifest';

interface BudgetSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BUDGET_PRESETS = [
  { label: '5 GB', bytes: 5 * 1024 * 1024 * 1024 },
  { label: '10 GB', bytes: 10 * 1024 * 1024 * 1024 },
  { label: '15 GB (Recommended)', bytes: 15 * 1024 * 1024 * 1024 },
  { label: '25 GB', bytes: 25 * 1024 * 1024 * 1024 },
];

export const BudgetSettingModal: React.FC<BudgetSettingModalProps> = ({ isOpen, onClose }) => {
  const { storageBudget, setStorageBudgetBytes, updateStorageBudget } = useApp();
  const [threshold, setThreshold] = useState(storageBudget.warningThresholdPercent || 85);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 p-5 space-y-4 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-neutral-300" />
            <h2 className="text-sm font-bold">Storage Budget Configuration</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-semibold text-neutral-300">Device Quota Presets</label>
          <div className="grid grid-cols-2 gap-2">
            {BUDGET_PRESETS.map((preset) => {
              const isActive = storageBudget.budgetBytes === preset.bytes;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setStorageBudgetBytes(preset.bytes)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                    isActive
                      ? 'bg-white text-black border-white'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700 hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-neutral-800">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-400">Warning Threshold</span>
            <span className="font-semibold text-white">{threshold}%</span>
          </div>
          <input
            type="range"
            min={50}
            max={95}
            step={5}
            value={threshold}
            onChange={(e) => {
              const val = Number(e.target.value);
              setThreshold(val);
              updateStorageBudget({ warningThresholdPercent: val });
            }}
            className="w-full accent-white"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
