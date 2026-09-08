import React from 'react';
import { Trash2, RefreshCw, Wand2, Shield, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AssetCategory } from '../../types';
import { formatBytes } from '../../lib/storageManifest';

interface AssetManifestTableProps {
  categoryFilter: AssetCategory | 'all';
  onSelectCategory: (category: AssetCategory | 'all') => void;
  onOpenRegisterModal: () => void;
}

export const AssetManifestTable: React.FC<AssetManifestTableProps> = ({
  categoryFilter,
  onSelectCategory,
  onOpenRegisterModal,
}) => {
  const {
    assetManifest,
    setAssetSaveMode,
    revertOrEnhanceAssetItem,
    deleteAssetFromManifest,
    toggleAssetEnabled,
  } = useApp();

  const filteredItems = assetManifest.filter(
    (item) => categoryFilter === 'all' || item.category === categoryFilter
  );

  return (
    <div className="space-y-3">
      {/* Category Pill Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {(['all', 'model', 'knowledge_pack', 'user_file', 'chat_history', 'cache', 'system'] as const).map(
          (cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-neutral-800 text-white font-semibold border border-neutral-700'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              {cat === 'all' ? 'All Assets' : cat.replace('_', ' ')}
            </button>
          )
        )}
      </div>

      {filteredItems.length === 0 ? (
        <div className="p-8 rounded-2xl bg-neutral-900/40 border border-neutral-800 text-center text-neutral-400 space-y-2">
          <p className="text-xs">No assets registered in this category.</p>
          <button
            type="button"
            onClick={onOpenRegisterModal}
            className="px-3 py-1.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-colors"
          >
            Register New Asset
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-white">{item.name}</span>
                  {item.isCore && (
                    <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                      <Shield className="w-2.5 h-2.5" /> Core
                    </span>
                  )}
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border ${
                      item.saveMode === 'archive'
                        ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800'
                        : 'bg-amber-950/70 text-amber-300 border-amber-800'
                    }`}
                  >
                    {item.saveMode === 'archive' ? 'Archive (Lossless)' : 'Space-Saver (Lossy)'}
                  </span>
                  {item.knowledgeStatus === 'stale' && (
                    <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                      <AlertCircle className="w-2.5 h-2.5" /> Stale Knowledge
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-neutral-400 flex items-center gap-2">
                  <span>{item.storageLocation}</span>
                  <span>&bull;</span>
                  <span className="font-mono text-white">{formatBytes(item.storedSizeBytes)}</span>
                  {item.originalSizeBytes > item.storedSizeBytes && (
                    <span className="text-neutral-500 line-through">
                      {formatBytes(item.originalSizeBytes)}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setAssetSaveMode(
                      item.id,
                      item.saveMode === 'archive' ? 'space_saver' : 'archive'
                    )
                  }
                  title="Toggle Save Mode"
                  className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[11px] text-neutral-300 transition-colors"
                >
                  {item.saveMode === 'archive' ? 'Make Space-Saver' : 'Make Archive'}
                </button>

                <button
                  type="button"
                  onClick={() => revertOrEnhanceAssetItem(item.id)}
                  title="Enhance approximation or restore lossless"
                  className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                </button>

                {!item.isCore && (
                  <button
                    type="button"
                    onClick={() => deleteAssetFromManifest(item.id)}
                    title="Delete Asset"
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-rose-900/60 text-neutral-400 hover:text-rose-300 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
