import React, { useState } from 'react';
import {
  X,
  Check,
  Sparkles,
  Key,
  Clock,
  AlertTriangle,
  ChevronRight,
  Shield,
  Layers,
  ArrowRightLeft,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { isAccountInCooldown, getRemainingCooldownString } from '../lib/aiConfig';
import { AIProvider } from '../types';

interface ModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModelSelectorModal: React.FC<ModelSelectorModalProps> = ({ isOpen, onClose }) => {
  const {
    availableModels,
    activeModelId,
    setActiveModelId,
    aiAccounts,
    switchAccount,
    clearCooldown,
    navigateTo,
    showToast,
  } = useApp();

  const [selectedProviderTab, setSelectedProviderTab] = useState<AIProvider | 'all'>('all');

  if (!isOpen) return null;

  const currentModel = availableModels.find((m) => m.id === activeModelId) || availableModels[0];

  const filteredModels =
    selectedProviderTab === 'all'
      ? availableModels
      : availableModels.filter((m) => m.provider === selectedProviderTab);

  const providerAccounts = aiAccounts.filter((a) => a.provider === currentModel.provider);

  const handleSelectModel = (modelId: string) => {
    setActiveModelId(modelId);
    showToast('Model switched');
  };

  const handleManualSwitch = async (accountLabel: string) => {
    const result = await switchAccount(accountLabel, currentModel.provider);
    if (result.success) {
      onClose();
    }
  };

  return (
    <div
      id="model-selector-modal"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-white" />
            <div>
              <h3 className="text-sm font-bold text-white">AI Model & Account Engine</h3>
              <p className="text-[11px] text-neutral-400">Official API connections & session routing</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Provider Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800 shrink-0">
          {(
            [
              { id: 'all', label: 'All Models' },
              { id: 'gemini', label: 'Gemini' },
              { id: 'claude', label: 'Claude' },
              { id: 'chatgpt', label: 'ChatGPT' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedProviderTab(tab.id)}
              className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-all text-center ${
                selectedProviderTab === tab.id
                  ? 'bg-neutral-800 text-white font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto space-y-4 pr-1 flex-1">
          {/* Models List */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Select Active Intelligence Model
            </p>

            <div className="space-y-1.5">
              {filteredModels.map((model) => {
                const isSelected = model.id === activeModelId;
                const activeAccountForModel = aiAccounts.find(
                  (a) => a.provider === model.provider && a.isActive
                );
                const hasKey =
                  Boolean(activeAccountForModel?.apiKey) || model.provider === 'gemini';
                const inCooldown = isAccountInCooldown(activeAccountForModel);

                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => handleSelectModel(model.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-neutral-800/90 border-neutral-600 shadow-md ring-1 ring-neutral-500/30'
                        : 'bg-neutral-950/60 border-neutral-800/80 hover:bg-neutral-800/40 hover:border-neutral-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{model.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                          {model.badge}
                        </span>
                        {inCooldown && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" />
                            {getRemainingCooldownString(activeAccountForModel) || 'Cooldown'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 line-clamp-1">{model.description}</p>
                      <div className="flex items-center gap-3 text-[10px] text-neutral-500 pt-0.5">
                        <span>Provider: {model.providerName}</span>
                        <span>•</span>
                        <span>
                          Account: {activeAccountForModel?.label || 'Account A'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-0.5">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-neutral-700" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accounts for Active Provider */}
          <div className="pt-2 border-t border-neutral-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                  Stored Accounts for {currentModel.providerName}
                </p>
                <p className="text-[10px] text-neutral-400">
                  Manual account switching summarizes context and hands off to new session
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigateTo('settings');
                }}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Manage Keys</span>
              </button>
            </div>

            <div className="space-y-2">
              {providerAccounts.map((account) => {
                const inCooldown = isAccountInCooldown(account);
                const cooldownStr = getRemainingCooldownString(account);

                return (
                  <div
                    key={account.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                      account.isActive
                        ? 'bg-neutral-800/80 border-neutral-700'
                        : 'bg-neutral-950/60 border-neutral-800/80'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-white">{account.label}</span>
                        {account.isActive && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Active
                          </span>
                        )}
                        {account.apiKey ? (
                          <span className="text-[10px] text-neutral-500 font-mono">
                            {account.apiKey.length > 8
                              ? `••••${account.apiKey.slice(-4)}`
                              : '••••••••'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-neutral-500">
                            {account.provider === 'gemini' ? 'Workspace Key' : 'No Key Set'}
                          </span>
                        )}
                      </div>

                      {inCooldown && (
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-400">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Limit reached ({cooldownStr})</span>
                          <button
                            type="button"
                            onClick={() => clearCooldown(account.id)}
                            className="underline ml-1 text-neutral-400 hover:text-white"
                          >
                            Reset
                          </button>
                        </div>
                      )}
                    </div>

                    {!account.isActive && (
                      <button
                        type="button"
                        onClick={() => handleManualSwitch(account.label)}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 transition-colors flex items-center gap-1 shrink-0"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        <span>Switch</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-[10px] text-neutral-500 italic pt-1">
              Tip: You can also switch accounts naturally by typing e.g. "log into account B" directly into chat.
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
          <span>Official API routing • Zero website automation</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
