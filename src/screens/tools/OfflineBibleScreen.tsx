import React, { useState } from 'react';
import { BookOpen, Search, Bookmark, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ScriptureVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

const SAMPLE_VERSES: ScriptureVerse[] = [
  { book: 'Genesis', chapter: 1, verse: 1, text: 'In the beginning God created the heaven and the earth.' },
  { book: 'Psalm', chapter: 23, verse: 1, text: 'The LORD is my shepherd; I shall not want.' },
  { book: 'Proverbs', chapter: 3, verse: 5, text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.' },
  { book: 'John', chapter: 1, verse: 1, text: 'In the beginning was the Word, and the Word was with God, and the Word was God.' },
  { book: 'Romans', chapter: 8, verse: 28, text: 'And we know that all things work together for good to them that love God.' },
];

export const OfflineBibleScreen: React.FC = () => {
  const [search, setSearch] = useState('');

  const filtered = SAMPLE_VERSES.filter(
    (v) =>
      v.text.toLowerCase().includes(search.toLowerCase()) ||
      v.book.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-black text-white p-4 sm:p-6 space-y-5 max-w-5xl mx-auto w-full">
      <div className="border-b border-neutral-800 pb-3">
        <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-400" />
          <span>Offline Scripture Reference</span>
        </h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          Local indexed scripture database for instant offline study
        </p>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="Search book, chapter, or keyword..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-white"
        />
      </div>

      <div className="space-y-2.5">
        {filtered.map((v, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-1.5"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <span>
                {v.book} {v.chapter}:{v.verse}
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">KJV Offline</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed font-serif">{v.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
