import React from 'react';
import { Bell, Volume2, Vibrate, Check, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const NotificationsScreen: React.FC = () => {
  const {
    notificationsEnabled,
    setNotificationsEnabled,
    soundEnabled,
    setSoundEnabled,
    showToast,
  } = useApp();

  return (
    <div
      id="notifications-screen"
      className="flex-1 min-h-0 overflow-y-auto bg-black text-white p-4 select-none"
    >
      <div className="max-w-md mx-auto space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Notifications</h2>
          <p className="text-xs text-neutral-400">
            System prompts, background task alerts, and audio cues
          </p>
        </div>

        <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-2 space-y-1">
          {/* Push alerts toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-neutral-800 text-neutral-300">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Workspace Alerts</p>
                <p className="text-[11px] text-neutral-400">Receive alerts when long tasks complete</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => {
                  setNotificationsEnabled(e.target.checked);
                  showToast(e.target.checked ? 'Alerts enabled' : 'Alerts muted');
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-white"></div>
            </label>
          </div>

          {/* Sound cues toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl border-t border-neutral-800/60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-neutral-800 text-neutral-300">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Sound Effects</p>
                <p className="text-[11px] text-neutral-400">Subtle click & completion chimes</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => {
                  setSoundEnabled(e.target.checked);
                  showToast(e.target.checked ? 'Sound effects enabled' : 'Sound effects muted');
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-white"></div>
            </label>
          </div>
        </div>

        {/* Placeholder info */}
        <div className="p-3.5 rounded-2xl bg-neutral-900/50 border border-neutral-800/80 text-xs text-neutral-400 leading-relaxed">
          <p className="font-semibold text-neutral-200 mb-1">Notification Dispatcher</p>
          <p>
            Notification channels are pre-configured with low background power consumption for mobile devices.
          </p>
        </div>
      </div>
    </div>
  );
};
