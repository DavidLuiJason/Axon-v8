import React, { useState } from 'react';
import {
  Key,
  Plus,
  Trash2,
  Check,
  Eye,
  EyeOff,
  AlertTriangle,
  Clock,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  RefreshCw,
  Copy,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { isAccountInCooldown, getRemainingCooldownString } from '../lib/aiConfig';
import { AIAccount, AIProvider } from '../types';

export const AIAccountsSettings: React.FC = () => {
  const {
    aiAccounts,
    addAIAccount,
    updateAIAccount,
    deleteAIAccount,
    clearCooldown,
    switchAccount,
    showToast,
  } = useApp();

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newProvider, setNewProvider] = useState<AIProvider>('gemini');
  const [newLabel, setNewLabel] = useState('');
  const [newApiKey, setNewApiKey] = useState('');

  // Track password visibility for each account
  const [visibleKeyIds, setVisibleKeyIds] = useState<Record<string, boolean>>({});

  // Editing state for existing keys
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const [tempKeyValue, setTempKeyValue] = useState('');
  const [isTempKeyVisible, setIsTempKeyVisible] = useState(false);
  const [isNewApiKeyVisible, setIsNewApiKeyVisible] = useState(false);

  const toggleVisibility = (id: string) => {
    setVisibleKeyIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStartEditKey = (account: AIAccount) => {
    setEditingKeyId(account.id);
    setTempKeyValue(account.apiKey);
    setIsTempKeyVisible(false);
  };

  const handleSaveKey = (id: string) => {
    updateAIAccount(id, { apiKey: tempKeyValue.trim() });
    setEditingKeyId(null);
    showToast('API key updated');
  };

  const handleAddNewAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) {
      showToast('Please enter an account label');
      return;
    }

    addAIAccount({
      provider: newProvider,
      label: newLabel.trim(),
      apiKey: newApiKey.trim(),
      isActive: false,
      isRateLimited: false,
    });

    setIsAddingNew(false);
    setNewLabel('');
    setNewApiKey('');
  };

  const providers: Array<{ id: AIProvider; name: string; tag: string; defaultPlaceholder: string }> = [
    {
      id: 'gemini',
      name: 'Google Gemini',
      tag: 'Official Generative AI API',
      defaultPlaceholder: 'AIzaSy...',
    },
    {
      id: 'claude',
      name: 'Anthropic Claude',
      tag: 'Official Anthropic API',
      defaultPlaceholder: 'sk-ant-api...',
    },
    {
      id: 'chatgpt',
      name: 'OpenAI ChatGPT',
      tag: 'Official OpenAI API',
      defaultPlaceholder: 'sk-proj-...',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Overview Card */}
      <div className="p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-semibold text-white">Official API Key Management</h4>
        </div>
        <p className="text-[11px] text-neutral-300 leading-relaxed">
          AXON communicates exclusively with official intelligence provider APIs (Gemini, Claude,
          ChatGPT). User keys are stored securely in local device storage and used only to authenticate API requests.
        </p>
        <div className="pt-1 flex items-center gap-2 text-[11px] text-neutral-400">
          <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span>
            Strict Protocol: When an account hits its rate limit, AXON pauses usage for up to 24h and
            never switches accounts automatically.
          </span>
        </div>
      </div>

      {/* Provider Sections */}
      {providers.map((p) => {
        const providerAccounts = aiAccounts.filter((a) => a.provider === p.id);

        return (
          <div
            key={p.id}
            className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-4 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2.5">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">{p.name}</h4>
                <p className="text-[10px] text-neutral-400">{p.tag}</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                {providerAccounts.length} {providerAccounts.length === 1 ? 'account' : 'accounts'}
              </span>
            </div>

            <div className="space-y-2.5">
              {providerAccounts.map((account) => {
                const inCooldown = isAccountInCooldown(account);
                const cooldownStr = getRemainingCooldownString(account);
                const isKeyVisible = visibleKeyIds[account.id] || false;
                const isEditing = editingKeyId === account.id;

                return (
                  <div
                    key={account.id}
                    className={`p-3 rounded-xl border transition-all space-y-2.5 ${
                      account.isActive
                        ? 'bg-neutral-800/70 border-neutral-700 shadow-sm'
                        : 'bg-neutral-950/60 border-neutral-800/80'
                    }`}
                  >
                    {/* Header: Label & Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{account.label}</span>
                        {account.isActive ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-medium">
                            <Check className="w-2.5 h-2.5" />
                            Active
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => switchAccount(account.label, account.provider)}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 border border-neutral-700 transition-colors"
                          >
                            Set Active
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => deleteAIAccount(account.id)}
                          title="Delete account"
                          className="p-1 rounded text-neutral-500 hover:text-red-400 hover:bg-neutral-800/60 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Cooldown Alert Banner if active */}
                    {inCooldown && (
                      <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Usage limit cooldown active: {cooldownStr}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => clearCooldown(account.id)}
                          className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 text-[10px] font-medium transition-colors"
                        >
                          Reset Timer
                        </button>
                      </div>
                    )}

                    {/* API Key Input / Display */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-neutral-400">
                        <span>API Key</span>
                        {!isEditing && (
                          <button
                            type="button"
                            onClick={() => handleStartEditKey(account)}
                            className="text-neutral-400 hover:text-white underline text-[10px]"
                          >
                            {account.apiKey ? 'Change Key' : 'Add Key'}
                          </button>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1 flex items-center">
                            <input
                              type={isTempKeyVisible ? 'text' : 'password'}
                              value={tempKeyValue}
                              onChange={(e) => setTempKeyValue(e.target.value)}
                              placeholder={p.defaultPlaceholder}
                              className="w-full pl-2.5 pr-8 py-1.5 rounded-lg bg-neutral-950 border border-neutral-700 text-white text-xs font-mono focus:border-white focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => setIsTempKeyVisible(!isTempKeyVisible)}
                              title={isTempKeyVisible ? 'Hide key' : 'Show key'}
                              className="absolute right-2 text-neutral-400 hover:text-white p-0.5"
                            >
                              {isTempKeyVisible ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSaveKey(account.id)}
                            className="px-2.5 py-1.5 bg-white text-black text-xs font-semibold rounded-lg hover:bg-neutral-200"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingKeyId(null)}
                            className="px-2 py-1.5 text-neutral-400 hover:text-white text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800/80 font-mono text-xs">
                          <span className="text-neutral-300 truncate mr-2 select-all">
                            {account.apiKey ? (
                              isKeyVisible ? (
                                account.apiKey
                              ) : account.apiKey.length > 8 ? (
                                `••••••••••••••••${account.apiKey.slice(-4)}`
                              ) : (
                                '••••••••'
                              )
                            ) : p.id === 'gemini' ? (
                              <span className="text-neutral-400 font-sans italic text-[11px]">
                                Pre-connected via server environment
                              </span>
                            ) : (
                              <span className="text-neutral-400 font-sans italic text-[11px]">
                                No key configured
                              </span>
                            )}
                          </span>

                          {account.apiKey && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(account.apiKey);
                                  showToast('API key copied');
                                }}
                                title="Copy API key"
                                className="p-1 text-neutral-400 hover:text-white rounded"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleVisibility(account.id)}
                                title={isKeyVisible ? 'Hide key' : 'Show key'}
                                className="p-1 text-neutral-400 hover:text-white rounded"
                              >
                                {isKeyVisible ? (
                                  <EyeOff className="w-3.5 h-3.5" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Add Account Modal / Form Toggle */}
      {isAddingNew ? (
        <form
          onSubmit={handleAddNewAccount}
          className="rounded-2xl bg-neutral-900/95 border border-neutral-700 p-4 space-y-3"
        >
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Add New AI Account
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="text-xs text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-neutral-300 mb-1">Service Provider</label>
              <select
                value={newProvider}
                onChange={(e) => setNewProvider(e.target.value as AIProvider)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none"
              >
                <option value="gemini">Google Gemini</option>
                <option value="claude">Anthropic Claude</option>
                <option value="chatgpt">OpenAI ChatGPT</option>
              </select>
            </div>

            <div>
              <label className="block text-neutral-300 mb-1">Account Label</label>
              <input
                type="text"
                placeholder="e.g. Account B (Secondary), Work Account"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-neutral-300 mb-1">Official API Key</label>
              <div className="relative flex items-center">
                <input
                  type={isNewApiKeyVisible ? 'text' : 'password'}
                  placeholder="Paste API key here"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setIsNewApiKeyVisible(!isNewApiKeyVisible)}
                  title={isNewApiKeyVisible ? 'Hide key' : 'Show key'}
                  className="absolute right-3 text-neutral-400 hover:text-white p-1"
                >
                  {isNewApiKeyVisible ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-white text-black font-semibold rounded-xl hover:bg-neutral-200 transition-colors"
            >
              Save Account
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsAddingNew(true)}
          className="w-full py-3 rounded-2xl border border-dashed border-neutral-700 bg-neutral-950 hover:bg-neutral-900 text-neutral-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Another AI Account</span>
        </button>
      )}

      {/* In-Chat Command Guide */}
      <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-1.5 text-xs">
        <p className="font-semibold text-neutral-300 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
          <span>In-Chat Account Switching Commands</span>
        </p>
        <p className="text-neutral-400 text-[11px] leading-relaxed">
          You can switch stored accounts at any time during chat by typing or speaking natural phrases like:
        </p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {['"log into account B"', '"switch to account B"', '"switch account to Account A"'].map((cmd) => (
            <span
              key={cmd}
              className="px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono text-[10px]"
            >
              {cmd}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-neutral-500 pt-1">
          When you execute an account switch, AXON automatically creates a concise summary of the conversation so your context transfers smoothly without data loss.
        </p>
      </div>
    </div>
  );
};
