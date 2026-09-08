import React, { useState } from 'react';
import { Video, Play, Pause, Scissors, Download, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const VideoEditorScreen: React.FC = () => {
  const { showToast } = useApp();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-black text-white p-4 sm:p-6 space-y-5 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-rose-400" />
            <span>Video Editor Studio</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Clip editing, speed control, and smart trim workspace
          </p>
        </div>

        <button
          type="button"
          onClick={() => showToast('Export feature ready')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>

      <div className="aspect-video w-full rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center text-center p-6 text-neutral-400 space-y-2">
        <Video className="w-10 h-10 text-neutral-600" />
        <p className="text-xs">Drag and drop a video clip or load from user assets</p>
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-full bg-white text-black hover:bg-neutral-200"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => showToast('Clip trimmed at current playhead')}
            className="p-2 rounded-full bg-neutral-800 text-neutral-300 hover:text-white"
          >
            <Scissors className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
