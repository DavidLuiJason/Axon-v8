import React, { useState } from 'react';
import {
  Sliders,
  Scissors,
  FilePlus,
  AlertCircle,
  RefreshCw,
  Database,
  Layers,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AssetCategory } from '../types';
import { StorageBudgetBar } from '../components/storage/StorageBudgetBar';
import { StorageCategoryBreakdown } from '../components/storage/StorageCategoryBreakdown';
import { AssetManifestTable } from '../components/storage/AssetManifestTable';
import { DownloadablePacksSection } from '../components/storage/DownloadablePacksSection';
import { BudgetSettingModal } from '../components/storage/BudgetSettingModal';
import { TrimOptimizerModal } from '../components/storage/TrimOptimizerModal';
import { RegisterAssetModal } from '../components/storage/RegisterAssetModal';
import { StorageOnboardingModal } from '../components/storage/StorageOnboardingModal';
import { formatBytes } from '../lib/storageManifest';

export const StorageDiagnosticsScreen: React.FC = () => {
  const {
    storageBreakdown,
    assetManifest,
    storageBudget,
    refreshStaleKnowledgeAsset,
    showToast,
    openPanel,
    closePanel,
    isPanelOpen,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'manifest' | 'categories' | 'packs'>('manifest');
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'all'>('all');

  const isBudgetModalOpen = isPanelOpen('storage-budget');
  const isTrimModalOpen = isPanelOpen('storage-trim');
  const isRegisterModalOpen = isPanelOpen('storage-register');
  const isOnboardingModalOpen = isPanelOpen('storage-onboarding');

  const staleItems = assetManifest.filter((a) => a.knowledgeStatus === 'stale');

  const handleRefreshAllStale = () => {
    staleItems.forEach((item) => refreshStaleKnowledgeAsset(item.id));
    showToast(`Refreshed ${staleItems.length} stale knowledge pack(s)`);
  };

  const handleSelectCategoryFromBreakdown = (cat: AssetCategory | 'all') => {
    setSelectedCategory(cat);
    setActiveTab('manifest');
  };

  return (
    <div
      id="storage-diagnostics-screen"
      className="flex-1 min-h-0 overflow-y-auto bg-black text-white p-4 sm:p-6 space-y-5 max-w-5xl mx-auto w-full"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-850">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Storage & Asset Manifest
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Per-item manifest tracking &bull; {formatBytes(storageBudget.budgetBytes, 0)} budget cap
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            id="header-setup-budget-btn"
            type="button"
            onClick={() => openPanel('storage-onboarding')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-300 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-neutral-400" />
            <span>Budget Setup</span>
          </button>

          <button
            id="header-trim-btn"
            type="button"
            onClick={() => openPanel('storage-trim')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-white transition-colors"
          >
            <Scissors className="w-3.5 h-3.5 text-neutral-300" />
            <span>Trim</span>
          </button>

          <button
            id="header-register-asset-btn"
            type="button"
            onClick={() => openPanel('storage-register')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-xs font-semibold text-black transition-colors"
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>Register Asset</span>
          </button>
        </div>
      </div>

      {/* Storage Budget & Progress Telemetry */}
      <StorageBudgetBar
        onOpenBudgetModal={() => openPanel('storage-budget')}
        onOpenTrimModal={() => openPanel('storage-trim')}
      />

      {/* Stale Knowledge Notification Banner if applicable */}
      {staleItems.length > 0 && (
        <div
          id="stale-knowledge-banner"
          className="p-3.5 rounded-2xl bg-neutral-900/90 border border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-start gap-2.5 text-neutral-200">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">
                {staleItems.length} Cached Knowledge Base(s) Stale
              </p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Upstream language references have updated since these items were cached.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRefreshAllStale}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh All Stale</span>
            </button>
          </div>
        </div>
      )}

      {/* Segmented Tab Switcher */}
      <div className="flex items-center gap-1.5 border-b border-neutral-850 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('manifest')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
            activeTab === 'manifest'
              ? 'bg-white text-black font-semibold'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Asset Manifest ({assetManifest.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
            activeTab === 'categories'
              ? 'bg-white text-black font-semibold'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Category Breakdown</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('packs')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
            activeTab === 'packs'
              ? 'bg-white text-black font-semibold'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Offline Packs</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'manifest' && (
        <AssetManifestTable
          categoryFilter={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
        />
      )}

      {activeTab === 'categories' && (
        <StorageCategoryBreakdown
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategoryFromBreakdown}
        />
      )}

      {activeTab === 'packs' && (
        <DownloadablePacksSection />
      )}

      {/* Modals */}
      <BudgetSettingModal
        isOpen={isBudgetModalOpen}
        onClose={() => closePanel()}
      />

      <TrimOptimizerModal
        isOpen={isTrimModalOpen}
        onClose={() => closePanel()}
      />

      <RegisterAssetModal
        isOpen={isRegisterModalOpen}
        onClose={() => closePanel()}
      />

      <StorageOnboardingModal
        isOpen={isOnboardingModalOpen}
        onClose={() => closePanel()}
        canDismiss={true}
      />
    </div>
  );
};
