import React, { useState } from 'react';
import {
  FileCode2,
  Play,
  Copy,
  Check,
  Eye,
  Terminal,
  Maximize2,
  Sparkles,
  Layers,
  Code,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const WorkspacePane: React.FC = () => {
  const { navigateTo, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'code' | 'preview' | 'terminal'>('code');
  const [isCopied, setIsCopied] = useState(false);

  const sampleCode = `// AXON Neural Workspace
import { initializeKernel } from '@axon/core';
import { runtimeConfig } from './runtime.config';

export async function bootAxonSession() {
  const kernel = await initializeKernel({
    targetDevice: 'mobile-lowspec',
    ramLimitMb: 4096,
    storageOptimized: true,
  });

  return {
    status: 'online',
    dualPaneActive: true,
    latencyMs: 12,
  };
}

// Ready for Part 2 integrations`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sampleCode);
    setIsCopied(true);
    showToast('Code copied to clipboard');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleRunCode = () => {
    showToast('Workspace build executed: 0 errors');
    setActiveTab('preview');
  };

  return (
    <div
      id="workspace-pane"
      style={{ touchAction: 'pan-y' }}
      className="flex flex-col h-full min-h-0 w-full bg-neutral-950 text-white select-text border-l border-neutral-900 overflow-hidden"
    >
      {/* Workspace Sub-header */}
      <div className="h-11 bg-neutral-900/90 border-b border-neutral-800 px-3 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-1">
          <button
            id="workspace-tab-code"
            type="button"
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'code'
                ? 'bg-neutral-800 text-white border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>code.js</span>
          </button>

          <button
            id="workspace-tab-preview"
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'preview'
                ? 'bg-neutral-800 text-white border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>

          <button
            id="workspace-tab-terminal"
            type="button"
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'terminal'
                ? 'bg-neutral-800 text-white border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Console</span>
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <button
            id="workspace-copy-btn"
            type="button"
            onClick={handleCopyCode}
            aria-label="Copy snippet"
            title="Copy code"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            id="workspace-run-btn"
            type="button"
            onClick={handleRunCode}
            aria-label="Run code"
            title="Build & Run"
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-medium active:scale-95 transition-all"
          >
            <Play className="w-3 h-3 fill-black" />
            <span className="hidden sm:inline">Run</span>
          </button>

          <button
            id="workspace-fullscreen-btn"
            type="button"
            onClick={() => navigateTo('code')}
            aria-label="Expand code workspace"
            title="Open AXON Code Studio"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 bg-black">
        {activeTab === 'code' && (
          <div className="rounded-xl bg-neutral-950 border border-neutral-800/80 p-3 font-mono text-xs text-neutral-300 leading-relaxed overflow-x-auto">
            <div className="flex select-none text-neutral-600 mb-2 pb-2 border-b border-neutral-900 justify-between items-center text-[10px]">
              <span>UTF-8 • JavaScript (ESM)</span>
              <span>18 lines • 412 B</span>
            </div>
            <pre className="text-neutral-200 font-mono text-[11px] sm:text-xs">
              <code>
                {sampleCode.split('\n').map((line, idx) => (
                  <div key={idx} className="flex gap-3 hover:bg-neutral-900/60 py-0.5 px-1 rounded">
                    <span className="w-6 text-right text-neutral-600 select-none text-[11px]">
                      {idx + 1}
                    </span>
                    <span className="flex-1 whitespace-pre-wrap">{line}</span>
                  </div>
                ))}
              </code>
            </pre>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="h-full flex flex-col items-center justify-center p-4 text-center rounded-xl bg-neutral-950 border border-neutral-800">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-neutral-200" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">AXON Preview Canvas</h3>
            <p className="text-xs text-neutral-400 max-w-xs mb-4">
              Live workspace preview shell. Generated apps, UI components, and artifacts will render here.
            </p>
            <div className="p-3 w-full max-w-xs rounded-xl bg-neutral-900/80 border border-neutral-800 text-left text-xs text-neutral-300">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-white">Kernel Status</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Active</span>
              </div>
              <p className="text-[11px] text-neutral-400">Target: Low-spec mobile (4GB RAM) optimized runtime container.</p>
            </div>
          </div>
        )}

        {activeTab === 'terminal' && (
          <div className="h-full rounded-xl bg-neutral-950 border border-neutral-800 p-3 font-mono text-xs text-neutral-300">
            <div className="text-[11px] text-neutral-500 mb-2 select-none flex items-center justify-between">
              <span>AXON Shell Terminal v0.1</span>
              <span>tty1</span>
            </div>
            <div className="space-y-1 text-emerald-400 text-[11px]">
              <p className="text-neutral-400">$ axon --version</p>
              <p>axon-core 0.1.0-alpha (arm64-linux)</p>
              <p className="text-neutral-400">$ axon kernel:check</p>
              <p>✔ Dual-pane orchestrator mounted</p>
              <p>✔ Memory cache pinned: 4.2 MB / 4096 MB</p>
              <p>✔ Zero unnecessary background daemons</p>
              <p className="text-white mt-3 animate-pulse">_</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info bar */}
      <div className="h-7 bg-neutral-950 border-t border-neutral-900 px-3 flex items-center justify-between text-[10px] text-neutral-500 select-none shrink-0">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Workspace Pane (Right)</span>
        </span>
        <button
          type="button"
          onClick={() => navigateTo('tools')}
          className="hover:text-neutral-300 underline underline-offset-2"
        >
          Tools Menu &gt;
        </button>
      </div>
    </div>
  );
};
