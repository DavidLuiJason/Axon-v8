import {
  AssetCategory,
  AssetManifestItem,
  SaveMode,
  StorageBudgetConfig,
  TrimCategoryPriority,
} from '../types';

export interface StorageBreakdown {
  totalOriginalBytes: number;
  totalStoredBytes: number;
  totalSavingsBytes: number;
  categoryTotals: Record<AssetCategory, number>;
  itemCounts: Record<AssetCategory, number>;
}

export interface DownloadablePack {
  id: string;
  name: string;
  sizeBytes: number;
  category: AssetCategory;
  description: string;
}

export const DEFAULT_STORAGE_BUDGET_CONFIG: StorageBudgetConfig = {
  budgetBytes: 15 * 1024 * 1024 * 1024, // 15 GB
  warningThresholdPercent: 85,
  hasCompletedOnboarding: false,
  trimPriority: ['cache', 'chat_history', 'user_file', 'knowledge_pack', 'model'],
  autoTrimEnabled: false,
};

export const DEFAULT_ASSET_MANIFEST: AssetManifestItem[] = [
  {
    id: 'asset-sys-wasm',
    name: 'AXON Micro-Kernel & WASM Engine',
    category: 'system',
    storageLocation: '/sys/bin/axon-core.wasm',
    mimeType: 'application/wasm',
    originalSizeBytes: 48 * 1024 * 1024,
    storedSizeBytes: 48 * 1024 * 1024,
    saveMode: 'archive',
    isOriginalPreserved: true,
    qualityState: 'lossless',
    knowledgeStatus: 'not_applicable',
    isCore: true,
    isEnabled: true,
    description: 'Core offline runtime compilation environment and isolated execution engine.',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'asset-model-offline',
    name: 'AXON 0.5B Offline Weights',
    category: 'model',
    storageLocation: '/models/axon-mobile-0.5b.q4',
    mimeType: 'application/octet-stream',
    originalSizeBytes: 1200 * 1024 * 1024,
    storedSizeBytes: 480 * 1024 * 1024,
    saveMode: 'space_saver',
    isOriginalPreserved: false,
    qualityState: 'downsampled',
    knowledgeStatus: 'not_applicable',
    isCore: false,
    isEnabled: true,
    description: '4-bit quantized local neural model for offline responses on 4GB RAM devices.',
    createdAt: '2026-09-02T00:00:00.000Z',
    updatedAt: '2026-09-02T00:00:00.000Z',
  },
  {
    id: 'asset-knowledge-bible',
    name: 'Offline World Bible & Concordance',
    category: 'knowledge_pack',
    storageLocation: '/knowledge/bible-concordance.db',
    mimeType: 'application/x-sqlite3',
    originalSizeBytes: 65 * 1024 * 1024,
    storedSizeBytes: 65 * 1024 * 1024,
    saveMode: 'archive',
    isOriginalPreserved: true,
    qualityState: 'lossless',
    knowledgeStatus: 'current',
    isCore: false,
    isEnabled: true,
    description: 'Complete cross-reference scripture database with Greek/Hebrew strongs lexicon.',
    createdAt: '2026-09-03T00:00:00.000Z',
    updatedAt: '2026-09-03T00:00:00.000Z',
  },
  {
    id: 'asset-knowledge-stale-docs',
    name: 'Android SDK 34 Reference Index',
    category: 'knowledge_pack',
    storageLocation: '/knowledge/android-sdk-34.pack',
    mimeType: 'application/octet-stream',
    originalSizeBytes: 85 * 1024 * 1024,
    storedSizeBytes: 85 * 1024 * 1024,
    saveMode: 'archive',
    isOriginalPreserved: true,
    qualityState: 'lossless',
    knowledgeStatus: 'stale',
    isCore: false,
    isEnabled: true,
    description: 'Documentation offline pack needing periodic schema revision checks.',
    createdAt: '2026-08-15T00:00:00.000Z',
    updatedAt: '2026-08-15T00:00:00.000Z',
  },
  {
    id: 'asset-user-diagram',
    name: 'System Architecture Diagram.png',
    category: 'user_file',
    storageLocation: '/user/files/System Architecture Diagram.png',
    mimeType: 'image/png',
    originalSizeBytes: 14 * 1024 * 1024,
    storedSizeBytes: 14 * 1024 * 1024,
    saveMode: 'archive',
    isOriginalPreserved: true,
    qualityState: 'lossless',
    knowledgeStatus: 'not_applicable',
    isCore: false,
    isEnabled: true,
    description: 'High-resolution diagram uploaded for application development.',
    createdAt: '2026-09-04T00:00:00.000Z',
    updatedAt: '2026-09-04T00:00:00.000Z',
  },
  {
    id: 'asset-chat-archive',
    name: 'Session Logs 2026 Q3 Archive',
    category: 'chat_history',
    storageLocation: '/history/sessions-q3-2026.jsonl',
    mimeType: 'application/json',
    originalSizeBytes: 8 * 1024 * 1024,
    storedSizeBytes: 8 * 1024 * 1024,
    saveMode: 'archive',
    isOriginalPreserved: true,
    qualityState: 'lossless',
    knowledgeStatus: 'not_applicable',
    isCore: false,
    isEnabled: true,
    description: 'Consolidated message archive of past discussions and code generations.',
    createdAt: '2026-09-05T00:00:00.000Z',
    updatedAt: '2026-09-05T00:00:00.000Z',
  },
  {
    id: 'asset-cache-preview',
    name: 'Compiler Render Buffer & Thumbnails',
    category: 'cache',
    storageLocation: '/cache/build-previews/',
    mimeType: 'application/octet-stream',
    originalSizeBytes: 120 * 1024 * 1024,
    storedSizeBytes: 42 * 1024 * 1024,
    saveMode: 'space_saver',
    isOriginalPreserved: false,
    qualityState: 'downsampled',
    knowledgeStatus: 'not_applicable',
    isCore: false,
    isEnabled: true,
    description: 'Temporary compilation intermediates and live visual preview thumbnails.',
    createdAt: '2026-09-06T00:00:00.000Z',
    updatedAt: '2026-09-06T00:00:00.000Z',
  },
];

export const AVAILABLE_DOWNLOADABLE_PACKS: DownloadablePack[] = [
  {
    id: 'pack-bible-lexicon',
    name: 'Complete Scripture & Lexicon Bundle',
    sizeBytes: 110 * 1024 * 1024,
    category: 'knowledge_pack',
    description: 'High-speed offline concordance, cross-references, and morphology dictionaries.',
  },
  {
    id: 'pack-code-snippets',
    name: 'Full-Stack Developer Knowledge Pack',
    sizeBytes: 45 * 1024 * 1024,
    category: 'knowledge_pack',
    description: 'Essential offline patterns for React, Tailwind, TypeScript, Node.js, and Algorithms.',
  },
  {
    id: 'pack-voice-synthesis',
    name: 'Neural Speech Synthesizer Voice Pack',
    sizeBytes: 85 * 1024 * 1024,
    category: 'model',
    description: 'Natural voice synthesis models for offline speech rate testing and auditory playback.',
  },
  {
    id: 'pack-color-math',
    name: 'WCAG 2.2 Palette & Contrast Library',
    sizeBytes: 15 * 1024 * 1024,
    category: 'knowledge_pack',
    description: 'Exhaustive color space lookup tables (APCA, CIE-L*a*b*, OKLCH) for design verification.',
  },
];

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
  return `${val} ${sizes[i] || 'B'}`;
}

export function calculateStorageBreakdown(manifest: AssetManifestItem[]): StorageBreakdown {
  const categories: AssetCategory[] = [
    'model',
    'knowledge_pack',
    'user_file',
    'chat_history',
    'cache',
    'system',
  ];

  const categoryTotals: Record<AssetCategory, number> = {
    model: 0,
    knowledge_pack: 0,
    user_file: 0,
    chat_history: 0,
    cache: 0,
    system: 0,
  };

  const itemCounts: Record<AssetCategory, number> = {
    model: 0,
    knowledge_pack: 0,
    user_file: 0,
    chat_history: 0,
    cache: 0,
    system: 0,
  };

  let totalOriginalBytes = 0;
  let totalStoredBytes = 0;

  for (const item of manifest) {
    totalOriginalBytes += item.originalSizeBytes || 0;
    totalStoredBytes += item.storedSizeBytes || 0;

    const cat = categories.includes(item.category) ? item.category : 'system';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (item.storedSizeBytes || 0);
    itemCounts[cat] = (itemCounts[cat] || 0) + 1;
  }

  const totalSavingsBytes = Math.max(0, totalOriginalBytes - totalStoredBytes);

  return {
    totalOriginalBytes,
    totalStoredBytes,
    totalSavingsBytes,
    categoryTotals,
    itemCounts,
  };
}

export function changeAssetSaveMode(item: AssetManifestItem, mode: SaveMode): AssetManifestItem {
  if (mode === 'space_saver') {
    return {
      ...item,
      saveMode: 'space_saver',
      isOriginalPreserved: false,
      qualityState: 'downsampled',
      storedSizeBytes: Math.round(item.originalSizeBytes * 0.35),
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    ...item,
    saveMode: 'archive',
    isOriginalPreserved: true,
    qualityState: 'lossless',
    storedSizeBytes: item.originalSizeBytes,
    updatedAt: new Date().toISOString(),
  };
}

export function performEnhanceOrRevert(item: AssetManifestItem): {
  updatedItem: AssetManifestItem;
  resultType: string;
  message: string;
} {
  if (item.saveMode === 'space_saver') {
    const updated: AssetManifestItem = {
      ...item,
      qualityState: item.isOriginalPreserved ? 'lossless' : 'enhanced',
      storedSizeBytes: item.originalSizeBytes,
      saveMode: item.isOriginalPreserved ? 'archive' : 'space_saver',
      updatedAt: new Date().toISOString(),
    };
    return {
      updatedItem: updated,
      resultType: 'enhanced',
      message: item.isOriginalPreserved
        ? `Reverted "${item.name}" to lossless original archive.`
        : `Neural enhancement applied to "${item.name}" (approximated fidelity restored).`,
    };
  }

  return {
    updatedItem: item,
    resultType: 'already_optimal',
    message: `"${item.name}" is already preserved at full lossless archive quality.`,
  };
}

export function simulateTrimPlan(
  manifest: AssetManifestItem[],
  targetBytesToFree: number,
  priority: TrimCategoryPriority[]
): {
  itemsToPrune: Array<{ item: AssetManifestItem; savingsBytes: number }>;
  totalSimulatedSavingsBytes: number;
} {
  const itemsToPrune: Array<{ item: AssetManifestItem; savingsBytes: number }> = [];
  let totalSimulatedSavingsBytes = 0;

  // Filter out core/system protected assets
  const pruneCandidates = manifest.filter((item) => !item.isCore && item.category !== 'system');

  // Sort candidates by the priority list order
  pruneCandidates.sort((a, b) => {
    const pA = priority.indexOf(a.category as TrimCategoryPriority);
    const pB = priority.indexOf(b.category as TrimCategoryPriority);
    const orderA = pA === -1 ? 999 : pA;
    const orderB = pB === -1 ? 999 : pB;
    if (orderA !== orderB) return orderA - orderB;
    // Secondary sort: larger items first
    return b.storedSizeBytes - a.storedSizeBytes;
  });

  for (const candidate of pruneCandidates) {
    if (targetBytesToFree > 0 && totalSimulatedSavingsBytes >= targetBytesToFree) {
      break;
    }
    const savings = candidate.storedSizeBytes;
    itemsToPrune.push({ item: candidate, savingsBytes: savings });
    totalSimulatedSavingsBytes += savings;
  }

  return {
    itemsToPrune,
    totalSimulatedSavingsBytes,
  };
}
