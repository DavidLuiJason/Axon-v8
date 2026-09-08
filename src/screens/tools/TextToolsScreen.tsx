import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Trash2,
  ListFilter,
  Type,
  AlignLeft,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SwipeableTabContainer } from '../../components/SwipeableTabContainer';

export const TextToolsScreen: React.FC = () => {
  const { showToast, requestConfirmation } = useApp();
  const [inputText, setInputText] = useState(
    'AXON Intelligence in motion.\nSimplify your mobile workflow.\nSimplify your mobile workflow.\nDesigned for fast and offline execution.'
  );
  const [activeSubTab, setActiveSubTab] = useState<'counter' | 'case' | 'stylish' | 'dedup'>('counter');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Text metrics
  const charCount = inputText.length;
  const charNoSpaces = inputText.replace(/\s/g, '').length;
  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const lineCount = inputText ? inputText.split(/\r\n|\r|\n/).length : 0;
  const readTimeSeconds = Math.ceil((wordCount / 200) * 60);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Clear text with confirmation if user input exists
  const handleClearText = () => {
    if (!inputText) return;
    requestConfirmation({
      title: 'Clear Text',
      message: 'Are you sure you want to delete this text?',
      confirmLabel: 'Clear',
      danger: true,
      onConfirm: () => {
        setInputText('');
        showToast('Text cleared');
      },
    });
  };

  // Case conversions
  const toUpperCase = (str: string) => str.toUpperCase();
  const toLowerCase = (str: string) => str.toLowerCase();
  const toTitleCase = (str: string) =>
    str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
    );
  const toSentenceCase = (str: string) =>
    str.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
  const toCamelCase = (str: string) =>
    str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      .replace(/^[A-Z]/, (c) => c.toLowerCase());
  const toSnakeCase = (str: string) =>
    str
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w_]/g, '');

  // Stylish font conversions (Unicode mathematical / stylized alphabets)
  const stylishMaps: Record<string, { name: string; transform: (str: string) => string }> = {
    bold: {
      name: 'Bold Sans',
      transform: (text) => {
        return text.replace(/[a-zA-Z0-9]/g, (c) => {
          const code = c.charCodeAt(0);
          if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d5d4 + (code - 65));
          if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d5ee + (code - 97));
          if (code >= 48 && code <= 57) return String.fromCodePoint(0x1d7ec + (code - 48));
          return c;
        });
      },
    },
    script: {
      name: 'Script Cursive',
      transform: (text) => {
        return text.replace(/[a-zA-Z]/g, (c) => {
          const code = c.charCodeAt(0);
          if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d49c + (code - 65));
          if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d4b6 + (code - 97));
          return c;
        });
      },
    },
    mono: {
      name: 'Monospace',
      transform: (text) => {
        return text.replace(/[a-zA-Z0-9]/g, (c) => {
          const code = c.charCodeAt(0);
          if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d670 + (code - 65));
          if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d68a + (code - 97));
          if (code >= 48 && code <= 57) return String.fromCodePoint(0x1d7f6 + (code - 48));
          return c;
        });
      },
    },
    doubleStruck: {
      name: 'Outline / Blackboard',
      transform: (text) => {
        return text.replace(/[a-zA-Z0-9]/g, (c) => {
          const code = c.charCodeAt(0);
          if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d538 + (code - 65));
          if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d552 + (code - 97));
          if (code >= 48 && code <= 57) return String.fromCodePoint(0x1d7d8 + (code - 48));
          return c;
        });
      },
    },
    circled: {
      name: 'Circled / Bubble',
      transform: (text) => {
        return text.replace(/[a-zA-Z0-9]/g, (c) => {
          const code = c.charCodeAt(0);
          if (code >= 65 && code <= 90) return String.fromCodePoint(0x24b6 + (code - 65));
          if (code >= 97 && code <= 122) return String.fromCodePoint(0x24d0 + (code - 97));
          if (code >= 49 && code <= 57) return String.fromCodePoint(0x2460 + (code - 49));
          if (code === 48) return '⓪';
          return c;
        });
      },
    },
    smallCaps: {
      name: 'Small Caps',
      transform: (text) => {
        const smallMap: Record<string, string> = {
          a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ғ', g: 'ɢ', h: 'ʜ',
          i: 'ɪ', j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ',
          q: 'ǫ', r: 'ʀ', s: 's', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x',
          y: 'ʏ', z: 'ᴢ',
        };
        return text
          .toLowerCase()
          .split('')
          .map((char) => smallMap[char] || char)
          .join('');
      },
    },
  };

  // Duplicate remover
  const removeDuplicateLines = () => {
    const lines = inputText.split(/\r\n|\r|\n/);
    const seen = new Set<string>();
    const uniqueLines = lines.filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true; // keep empty lines
      if (seen.has(trimmed)) return false;
      seen.add(trimmed);
      return true;
    });
    const result = uniqueLines.join('\n');
    setInputText(result);
    showToast(`Removed ${lines.length - uniqueLines.length} duplicate lines`);
  };

  const removeDuplicateWords = () => {
    const words = inputText.split(/\s+/);
    const seen = new Set<string>();
    const uniqueWords = words.filter((w) => {
      const lower = w.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
      if (!lower) return true;
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    });
    const result = uniqueWords.join(' ');
    setInputText(result);
    showToast(`Removed ${words.length - uniqueWords.length} duplicate words`);
  };

  return (
    <div
      id="text-tools-screen"
      className="flex-1 min-h-0 overflow-y-auto bg-black text-white p-4 select-none"
    >
      <div className="max-w-md mx-auto space-y-4">
        {/* Tool Sub-tabs */}
        <div className="flex bg-neutral-900/90 p-1 rounded-2xl border border-neutral-800">
          {[
            { id: 'counter', label: 'Counter', icon: AlignLeft },
            { id: 'case', label: 'Case', icon: Type },
            { id: 'stylish', label: 'Stylish', icon: Sparkles },
            { id: 'dedup', label: 'Deduplicate', icon: ListFilter },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white text-black shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Input Textarea Area */}
        <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400 pb-1 border-b border-neutral-800">
            <span>Input Text</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(inputText, 'input-copy')}
                className="hover:text-white flex items-center gap-1 p-1 rounded"
                title="Copy input text"
              >
                {copiedId === 'input-copy' ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>Copy</span>
              </button>
              {inputText && (
                <button
                  type="button"
                  onClick={handleClearText}
                  className="hover:text-red-400 flex items-center gap-1 p-1 rounded transition-colors"
                  title="Clear text"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          <textarea
            id="text-tools-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type or paste text here to analyze or convert..."
            rows={5}
            className="w-full bg-neutral-950 border border-neutral-800/80 rounded-xl p-3 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 resize-none font-sans leading-relaxed select-text"
          />
        </div>

        {/* Swipeable Tabs Container */}
        <SwipeableTabContainer<'counter' | 'case' | 'stylish' | 'dedup'>
          tabs={['counter', 'case', 'stylish', 'dedup']}
          activeTab={activeSubTab}
          onTabChange={setActiveSubTab}
        >
          <div>
            {/* SUBTAB 1: WORD & CHARACTER COUNTER */}
            {activeSubTab === 'counter' && (
          <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Text Statistics
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
                <p className="text-lg font-bold text-white font-mono">{wordCount}</p>
                <p className="text-[10px] text-neutral-400 uppercase tracking-wider mt-0.5">Words</p>
              </div>
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
                <p className="text-lg font-bold text-white font-mono">{charCount}</p>
                <p className="text-[10px] text-neutral-400 uppercase tracking-wider mt-0.5">Chars</p>
              </div>
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
                <p className="text-lg font-bold text-white font-mono">{charNoSpaces}</p>
                <p className="text-[10px] text-neutral-400 uppercase tracking-wider mt-0.5">No Spaces</p>
              </div>
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
                <p className="text-lg font-bold text-white font-mono">{lineCount}</p>
                <p className="text-[10px] text-neutral-400 uppercase tracking-wider mt-0.5">Lines</p>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
              <span>Estimated Reading Time:</span>
              <span className="font-semibold text-white">~{readTimeSeconds} sec</span>
            </div>
          </div>
        )}

        {/* SUBTAB 2: CASE CONVERTERS */}
        {activeSubTab === 'case' && (
          <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Case Transformations
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'UPPERCASE', fn: toUpperCase },
                { name: 'lowercase', fn: toLowerCase },
                { name: 'Title Case', fn: toTitleCase },
                { name: 'Sentence case', fn: toSentenceCase },
                { name: 'camelCase', fn: toCamelCase },
                { name: 'snake_case', fn: toSnakeCase },
              ].map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    const result = c.fn(inputText);
                    setInputText(result);
                    showToast(`Converted to ${c.name}`);
                  }}
                  className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850 active:scale-[0.98] text-xs font-medium text-neutral-200 transition-all text-left"
                >
                  <p className="text-white font-semibold">{c.name}</p>
                  <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                    {c.fn('Sample text string')}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB 3: STYLISH / DECORATIVE TEXT */}
        {activeSubTab === 'stylish' && (
          <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Decorative Unicode Styles
            </h3>
            <div className="space-y-2">
              {Object.entries(stylishMaps).map(([key, style]) => {
                const preview = style.transform(inputText.slice(0, 40) || 'AXON Intelligence');
                return (
                  <div
                    key={key}
                    className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0 flex-1 select-text">
                      <p className="text-[10px] text-neutral-400 uppercase font-mono">{style.name}</p>
                      <p className="text-sm text-white font-medium truncate mt-0.5">{preview}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(style.transform(inputText), `style-${key}`)}
                      className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-xs text-neutral-200 flex items-center gap-1 shrink-0 transition-colors"
                    >
                      {copiedId === `style-${key}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>Copy</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SUBTAB 4: DUPLICATE REMOVER */}
        {activeSubTab === 'dedup' && (
          <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Duplicate Redundancy Cleaners
            </h3>
            <p className="text-xs text-neutral-400">
              Eliminates repeated words or lines from text or code snippets while preserving order.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={removeDuplicateLines}
                className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850 active:scale-[0.98] text-xs font-medium text-white transition-all text-center"
              >
                <span className="block font-semibold">Remove Duplicate Lines</span>
                <span className="text-[10px] text-neutral-400 mt-0.5 block">Cleans repeated rows</span>
              </button>

              <button
                type="button"
                onClick={removeDuplicateWords}
                className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850 active:scale-[0.98] text-xs font-medium text-white transition-all text-center"
              >
                <span className="block font-semibold">Remove Duplicate Words</span>
                <span className="text-[10px] text-neutral-400 mt-0.5 block">Cleans repeated tokens</span>
              </button>
            </div>
          </div>
        )}
          </div>
        </SwipeableTabContainer>
      </div>
    </div>
  );
};
