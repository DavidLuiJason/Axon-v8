import React, { useState } from 'react';
import { Mic, Activity, Clock, BarChart3 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SpeechRateAnalysisScreen: React.FC = () => {
  const [text, setText] = useState('Type or paste speech transcript here to analyze words per minute, syllable count, and optimal pacing.');

  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const chars = text.length;
  const estimatedSeconds = Math.round((words / 130) * 60);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-black text-white p-4 sm:p-6 space-y-5 max-w-5xl mx-auto w-full">
      <div className="border-b border-neutral-800 pb-3">
        <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          <span>Speech Rate Analysis</span>
        </h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          Evaluate speech pacing, words per minute (WPM), and presentation timing
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-center">
          <div className="text-xs text-neutral-400">Total Words</div>
          <div className="text-xl font-bold text-white mt-1">{words}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-center">
          <div className="text-xs text-neutral-400">Est. Duration</div>
          <div className="text-xl font-bold text-white mt-1">{estimatedSeconds}s</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-center">
          <div className="text-xs text-neutral-400">Target Pacing</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">130 WPM</div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-neutral-300">Speech Script or Transcript</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          className="w-full p-3 text-xs rounded-2xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-neutral-600 resize-y"
        />
      </div>
    </div>
  );
};
