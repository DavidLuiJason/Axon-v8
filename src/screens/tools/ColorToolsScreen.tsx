import React, { useState } from 'react';
import {
  Pipette,
  Palette,
  Copy,
  Check,
  RefreshCw,
  Plus,
  Trash2,
  Bookmark,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SwipeableTabContainer } from '../../components/SwipeableTabContainer';

export const ColorToolsScreen: React.FC = () => {
  const {
    showToast,
    requestConfirmation,
    setFunctionColor,
    setAccentColor,
    resetThemeToDefault,
  } = useApp();
  const [activeTab, setActiveTab] = useState<'picker' | 'palette'>('picker');
  const [currentColor, setCurrentColor] = useState('#3b82f6');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // User-saved palettes state (demonstrating user-saved content with delete confirmation)
  const [savedPalettes, setSavedPalettes] = useState<Array<{ id: string; name: string; colors: string[] }>>([
    { id: 'pal-1', name: 'AXON Monochrome', colors: ['#000000', '#262626', '#525252', '#a3a3a3', '#ffffff'] },
    { id: 'pal-2', name: 'Neural Pulse', colors: ['#0f172a', '#1e293b', '#3b82f6', '#60a5fa', '#93c5fd'] },
  ]);

  // Active palette generator colors
  const [currentPalette, setCurrentPalette] = useState<string[]>([
    '#0f172a',
    '#1e293b',
    '#3b82f6',
    '#60a5fa',
    '#93c5fd',
  ]);

  // Helper conversions
  const hexToRgb = (hex: string) => {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map((x) => x + x).join('');
    const num = parseInt(c, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h = 0,
      s = 0,
      l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  };

  const rgb = hexToRgb(currentColor);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const handleCopy = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    showToast(`Copied ${val}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Generate harmonic palette
  const generateHarmony = (mode: 'analogous' | 'complementary' | 'monochrome' | 'random') => {
    const baseHsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    let newColors: string[] = [];

    const hslToHex = (h: number, s: number, l: number) => {
      l /= 100;
      const a = (s * Math.min(l, 1 - l)) / 100;
      const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color)
          .toString(16)
          .padStart(2, '0');
      };
      return `#${f(0)}${f(8)}${f(4)}`;
    };

    if (mode === 'monochrome') {
      newColors = [15, 30, 50, 70, 85].map((lum) =>
        hslToHex(baseHsl.h, Math.max(10, baseHsl.s), lum)
      );
    } else if (mode === 'complementary') {
      const compH = (baseHsl.h + 180) % 360;
      newColors = [
        hslToHex(baseHsl.h, baseHsl.s, 25),
        hslToHex(baseHsl.h, baseHsl.s, 50),
        hslToHex(baseHsl.h, Math.max(10, baseHsl.s - 20), 80),
        hslToHex(compH, baseHsl.s, 50),
        hslToHex(compH, baseHsl.s, 30),
      ];
    } else if (mode === 'analogous') {
      newColors = [-40, -20, 0, 20, 40].map((deg) =>
        hslToHex((baseHsl.h + deg + 360) % 360, baseHsl.s, baseHsl.l)
      );
    } else {
      // Random harmonic palette
      const randHue = Math.floor(Math.random() * 360);
      newColors = [20, 40, 60, 80, 95].map((lum, idx) =>
        hslToHex((randHue + idx * 30) % 360, 65, lum)
      );
    }

    setCurrentPalette(newColors);
    showToast('Generated harmonious palette');
  };

  const handleSaveCurrentPalette = () => {
    const newPal = {
      id: `pal-${Date.now()}`,
      name: `Palette #${savedPalettes.length + 1}`,
      colors: [...currentPalette],
    };
    setSavedPalettes((prev) => [newPal, ...prev]);
    showToast('Palette saved to collection');
  };

  const handleDeleteSavedPalette = (id: string) => {
    requestConfirmation({
      title: 'Delete Palette',
      message: 'Are you sure you want to delete this palette?',
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => {
        setSavedPalettes((prev) => prev.filter((p) => p.id !== id));
        showToast('Palette removed');
      },
    });
  };

  return (
    <div
      id="color-tools-screen"
      className="flex-1 min-h-0 overflow-y-auto bg-black text-white p-4 select-none"
    >
      <div className="max-w-md mx-auto space-y-4">
        {/* Navigation Sub-Tabs */}
        <div className="flex bg-neutral-900/90 p-1 rounded-2xl border border-neutral-800">
          <button
            type="button"
            onClick={() => setActiveTab('picker')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'picker'
                ? 'bg-white text-black shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Pipette className="w-3.5 h-3.5" />
            <span>Color Picker</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('palette')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'palette'
                ? 'bg-white text-black shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Palette Generator</span>
          </button>
        </div>

        {/* Swipeable Tabs Container */}
        <SwipeableTabContainer<'picker' | 'palette'>
          tabs={['picker', 'palette']}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        >
          <div>
            {/* TAB 1: COLOR PICKER */}
            {activeTab === 'picker' && (
          <div className="space-y-4">
            {/* Color preview card */}
            <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 space-y-4">
              <div
                className="w-full h-28 rounded-xl shadow-inner border border-white/20 flex items-end justify-between p-3 transition-colors duration-200"
                style={{ backgroundColor: currentColor }}
              >
                <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-black/60 backdrop-blur text-white">
                  {currentColor.toUpperCase()}
                </span>
                <span className="font-mono text-[11px] px-2 py-1 rounded bg-black/60 backdrop-blur text-white">
                  rgb({rgb.r}, {rgb.g}, {rgb.b})
                </span>
              </div>

              {/* Native interactive color input */}
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => setCurrentColor(e.target.value)}
                  className="w-12 h-10 rounded-xl cursor-pointer bg-neutral-950 border border-neutral-700 p-1"
                />
                <input
                  type="text"
                  value={currentColor}
                  onChange={(e) => setCurrentColor(e.target.value)}
                  placeholder="#000000"
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-neutral-600 uppercase"
                />
              </div>

              {/* Format Copy List */}
              <div className="space-y-1.5 pt-2 border-t border-neutral-800/80">
                {[
                  { label: 'HEX', val: currentColor.toUpperCase() },
                  { label: 'RGB', val: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
                  { label: 'HSL', val: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between p-2 rounded-xl bg-neutral-950 border border-neutral-800/80 text-xs"
                  >
                    <span className="text-neutral-400 font-medium">{item.label}</span>
                    <span className="font-mono text-white select-text">{item.val}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.val, item.label)}
                      className="p-1 text-neutral-400 hover:text-white rounded"
                      title="Copy code"
                    >
                      {copiedKey === item.label ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Functional Role Application Controls */}
              <div className="pt-3 border-t border-neutral-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase text-neutral-400">
                    Apply Color to AXON UI
                  </span>
                  <button
                    type="button"
                    onClick={resetThemeToDefault}
                    className="text-[10px] text-neutral-400 hover:text-white"
                  >
                    Reset to Monochrome
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setFunctionColor('userBubbleColor', currentColor)}
                    className="p-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-left text-neutral-300 hover:text-white"
                  >
                    Set as User Bubble
                  </button>
                  <button
                    type="button"
                    onClick={() => setFunctionColor('axonBubbleColor', currentColor)}
                    className="p-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-left text-neutral-300 hover:text-white"
                  >
                    Set as AXON Bubble
                  </button>
                  <button
                    type="button"
                    onClick={() => setFunctionColor('sendButtonColor', currentColor)}
                    className="p-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-left text-neutral-300 hover:text-white"
                  >
                    Set as Send Button
                  </button>
                  <button
                    type="button"
                    onClick={() => setFunctionColor('userMsgBtnColor', currentColor)}
                    className="p-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-left text-neutral-300 hover:text-white"
                  >
                    Set as User Message Buttons
                  </button>
                  <button
                    type="button"
                    onClick={() => setFunctionColor('axonMsgBtnColor', currentColor)}
                    className="p-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-left text-neutral-300 hover:text-white"
                  >
                    Set as AI Message Buttons
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccentColor(currentColor)}
                    className="p-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-left text-neutral-300 hover:text-white"
                  >
                    Set as Accent
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PALETTE GENERATOR */}
        {activeTab === 'palette' && (
          <div className="space-y-4">
            {/* Active Palette Display */}
            <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Harmonic Palette
                </span>
                <button
                  type="button"
                  onClick={handleSaveCurrentPalette}
                  className="flex items-center gap-1 text-xs text-neutral-300 hover:text-white px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Save Palette</span>
                </button>
              </div>

              {/* Swatches Strip */}
              <div className="flex h-20 rounded-xl overflow-hidden border border-neutral-800 shadow-inner">
                {currentPalette.map((color, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setCurrentColor(color);
                      handleCopy(color, `pal-${i}`);
                    }}
                    style={{ backgroundColor: color }}
                    className="flex-1 cursor-pointer flex items-end justify-center pb-1.5 transition-transform hover:scale-105 group relative"
                    title={`Tap to copy ${color}`}
                  >
                    <span className="text-[9px] font-mono text-white bg-black/60 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {color}
                    </span>
                  </div>
                ))}
              </div>

              {/* Generation Presets */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => generateHarmony('monochrome')}
                  className="p-2 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-200 text-center transition-colors"
                >
                  Monochrome
                </button>
                <button
                  type="button"
                  onClick={() => generateHarmony('complementary')}
                  className="p-2 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-200 text-center transition-colors"
                >
                  Complementary
                </button>
                <button
                  type="button"
                  onClick={() => generateHarmony('analogous')}
                  className="p-2 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-200 text-center transition-colors"
                >
                  Analogous
                </button>
                <button
                  type="button"
                  onClick={() => generateHarmony('random')}
                  className="p-2 rounded-xl bg-neutral-850 border border-neutral-700 hover:bg-neutral-800 text-xs text-white text-center flex items-center justify-center gap-1 font-semibold transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Surprise</span>
                </button>
              </div>
            </div>

            {/* Saved Palettes List (Demonstrating delete confirmation for user-saved content) */}
            <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Your Saved Palettes ({savedPalettes.length})
              </h3>
              <div className="space-y-2">
                {savedPalettes.map((pal) => (
                  <div
                    key={pal.id}
                    className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className="text-xs font-medium text-white">{pal.name}</p>
                      <div className="flex h-4 rounded overflow-hidden w-36 border border-neutral-800">
                        {pal.colors.map((c, idx) => (
                          <div key={idx} style={{ backgroundColor: c }} className="flex-1" />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentPalette(pal.colors);
                          showToast(`Loaded ${pal.name}`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-neutral-800 text-xs text-neutral-300 hover:text-white"
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSavedPalette(pal.id)}
                        className="p-1.5 text-neutral-500 hover:text-red-400 rounded transition-colors"
                        title="Delete palette"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
          </div>
        </SwipeableTabContainer>
      </div>
    </div>
  );
};
