import React, { useState } from 'react';
import { Zap, Plus, Sliders, CheckCircle2, Play, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AutomationSimulatorView } from '../components/automation/AutomationSimulatorView';
import { RuleEditorModal } from '../components/automation/RuleEditorModal';
import { AutomationRule } from '../types';

export const AutomationScreen: React.FC = () => {
  const {
    automationRules,
    saveRule,
    deleteRule,
    toggleRule,
    testRule,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'rules' | 'simulator'>('rules');
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenCreate = () => {
    setEditingRule(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule: AutomationRule) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-black text-white p-4 sm:p-6 space-y-5 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>Conditional Rules Engine</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Automate actions based on errors, rate limits, and keyword triggers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Rule</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'rules'
              ? 'bg-white text-black'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          Active Rules ({automationRules.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('simulator')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'simulator'
              ? 'bg-white text-black'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          Interactive Simulator
        </button>
      </div>

      {activeTab === 'simulator' ? (
        <AutomationSimulatorView />
      ) : (
        <div className="space-y-3">
          {automationRules.length === 0 ? (
            <div className="p-8 text-center text-neutral-400 rounded-2xl bg-neutral-900/40 border border-neutral-800 text-xs">
              No automation rules created yet.
            </div>
          ) : (
            automationRules.map((rule) => (
              <div
                key={rule.id}
                className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleRule(rule.id)}
                      className={`w-3.5 h-3.5 rounded-full border transition-all ${
                        rule.enabled ? 'bg-emerald-400 border-emerald-400' : 'border-neutral-600'
                      }`}
                    />
                    <span className="font-semibold text-white">{rule.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => testRule(rule.id)}
                      title="Test Trigger Rule"
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(rule)}
                      title="Edit Rule"
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteRule(rule.id)}
                      title="Delete Rule"
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-rose-900/60 text-neutral-400 hover:text-rose-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-neutral-400 text-[11px]">{rule.description}</p>
                <div className="flex items-center gap-2 text-[10px] text-neutral-500 pt-1">
                  <span>Trigger: {rule.triggerLabel}</span>
                  <span>&bull;</span>
                  <span>Action: {rule.actionLabel}</span>
                  <span>&bull;</span>
                  <span>Fired {rule.triggerCount} times</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <RuleEditorModal
        isOpen={isModalOpen}
        initialRule={editingRule}
        onClose={() => setIsModalOpen(false)}
        onSave={(ruleData) => {
          saveRule(ruleData);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};
