import React, { useState } from 'react';
import {
  FileText,
  Calculator,
  Palette,
  Image as ImageIcon,
  FileCode,
  ArrowRightLeft,
  Sparkles,
  Search,
  ChevronRight,
  AlignLeft,
  Pipette,
  FileArchive,
  Grid,
  FileUp,
  Cpu,
  Bookmark,
  Type,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ScreenId } from '../types';
import { SwipeableTabContainer } from '../components/SwipeableTabContainer';

export const ToolsMenuScreen: React.FC = () => {
  const { navigateTo } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const toolCategories = [
    {
      id: 'text',
      name: 'Text Tools',
      description: 'Counter, stylish typography, deduplication & case formatting',
      icon: Type,
      screen: 'tool_text' as ScreenId,
      badge: '4 Utilities',
      items: [
        'Word & Character Counter',
        'Stylish / Decorative Fonts',
        'Duplicate Line/Word Remover',
        'Case Converters (Upper/Title/Camel)',
      ],
    },
    {
      id: 'calc',
      name: 'Calculation & Units',
      description: 'Standard keypad calculator and common mobile unit conversions',
      icon: Calculator,
      screen: 'tool_calc' as ScreenId,
      badge: '2 Utilities',
      items: [
        'Standard Calculator & History',
        'Length, Weight, Temp & Speed Converters',
      ],
    },
    {
      id: 'color',
      name: 'Color Tools',
      description: 'Interactive HEX/RGB/HSL picker and harmonic palette generator',
      icon: Palette,
      screen: 'tool_colors' as ScreenId,
      badge: '2 Utilities',
      items: [
        'Color Spectrum & Code Inspection',
        'Palette Generator & Saved Library',
      ],
    },
    {
      id: 'image',
      name: 'Image Utilities',
      description: 'Offline format conversion, compression, blur & collage grid maker',
      icon: ImageIcon,
      screen: 'tool_images' as ScreenId,
      badge: '4 Utilities',
      items: [
        'PNG ⇄ JPG ⇄ WEBP Converter',
        'Image Compressor & Space Saver',
        'Privacy Blur Filter',
        'Collage Grid Combiner',
      ],
    },
    {
      id: 'file',
      name: 'File Conversions',
      description: 'Client-side PDF compilation, text stream extraction & format translators',
      icon: FileUp,
      screen: 'tool_files' as ScreenId,
      badge: '4 Utilities',
      items: [
        'PNG / Image to PDF Document',
        'PDF to Text Extractor',
        'CSV ⇄ JSON Bidirectional Formatter',
        'Plain Text Note to PDF Export',
      ],
    },
    {
      id: 'code',
      name: 'AXON Code',
      description: 'Beginner-friendly coding assistant, runner & command translator',
      icon: FileCode,
      screen: 'code' as ScreenId,
      badge: '4 Skill Modes',
      items: [
        'Guided, Assisted, Developer & Expert Modes',
        'Command Translator (Plain English to Code)',
        'Shorthand to Code Live Converter',
        'Phone-Optimized Offline Sandbox Runner',
      ],
    },
    {
      id: 'automation',
      name: 'Automation & Run Code',
      description: 'Conditional triggers ("if this, do that") & live behavioral extension layer',
      icon: Zap,
      screen: 'automation' as ScreenId,
      badge: 'Rules & Scripts',
      items: [
        'Plain Language & Guided Rule Creator',
        'Automatic Retries on Connection/Login Drops',
        'Live Run Code Layer (No App Rebuilding)',
        'Interactive Event & Diagnostics Simulator',
      ],
    },
    {
      id: 'speech_rate',
      name: 'Speech-Rate Analysis',
      description: 'Audio tempo & cadence analysis with WPM calculation and pacing benchmarks',
      icon: Pipette,
      screen: 'tool_speech_rate' as ScreenId,
      badge: 'Acoustic Analyzer',
      items: [
        'Microphone or Audio File Input',
        'Words Per Minute (WPM) Meter',
        'Syllables per Second Velocity',
        'Pacing Diagnosis & Library Export',
      ],
    },
    {
      id: 'bible',
      name: 'Offline Bible & Scriptures',
      description: 'Local canonical reader, instant offline search & verse study bookmarks',
      icon: Bookmark,
      screen: 'tool_bible' as ScreenId,
      badge: '100% Offline',
      items: [
        'Old & New Testament Chapters',
        'Zero-Network Full-Text Search',
        'Saved Verses & Study Bookmarks',
        'Adaptive Font Sizes & Dark Mode',
      ],
    },
  ];

  const filteredCategories = toolCategories.filter((cat) => {
    const matchesCategory = selectedCategory === 'all' || cat.id === selectedCategory;
    const matchesSearch =
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.items.some((item) => item.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div
      id="tools-menu-screen"
      className="flex-1 min-h-0 overflow-y-auto p-4 bg-black text-white select-none"
    >
      <div className="max-w-md mx-auto space-y-4">
        {/* Header Title */}
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Tools & Utilities</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Offline utility suites running locally on your device
          </p>
        </div>

        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search text, calculation, image, or file tools..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
          />
        </div>

        {/* Category Filter Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: 'All Tools' },
            { id: 'text', label: 'Text' },
            { id: 'calc', label: 'Calculations' },
            { id: 'color', label: 'Colors' },
            { id: 'image', label: 'Images' },
            { id: 'file', label: 'Files' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Categories Tool Cards with swipe support */}
        <SwipeableTabContainer<string>
          tabs={['all', 'text', 'calc', 'color', 'image', 'file']}
          activeTab={selectedCategory}
          onTabChange={setSelectedCategory}
        >
          <div className="space-y-3">
            {filteredCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.id}
                  id={`tool-suite-${cat.id}`}
                  onClick={() => navigateTo(cat.screen)}
                  className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850 active:scale-[0.99] cursor-pointer transition-all space-y-3 group"
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-300 group-hover:text-white group-hover:bg-neutral-700 transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{cat.name}</span>
                          <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono">
                            {cat.badge}
                          </span>
                        </h3>
                        <p className="text-xs text-neutral-400 mt-0.5 leading-snug">
                          {cat.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </div>

                  {/* Sub-item pills list */}
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-neutral-800/60">
                    {cat.items.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded-lg bg-neutral-950/80 border border-neutral-800/80 text-[11px] text-neutral-300"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}

            {filteredCategories.length === 0 && (
              <div className="text-center py-10 rounded-2xl bg-neutral-900/50 border border-neutral-800">
                <p className="text-xs text-neutral-400">No tools found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        </SwipeableTabContainer>

        {/* Target Device Note Callout */}
        <div className="p-3.5 rounded-2xl bg-neutral-900/50 border border-neutral-800/80 flex items-start gap-3">
          <Cpu className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
          <div className="text-xs text-neutral-400 leading-relaxed">
            <p className="font-semibold text-neutral-200">100% Offline Utilities</p>
            <p className="mt-0.5">
              All text, image, color, calculation, and document converters run locally in browser memory without sending data to external servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
