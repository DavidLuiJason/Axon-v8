import React from 'react';
import { User, Shield, Key } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AIAccountsSettings } from '../components/AIAccountsSettings';

export const AccountScreen: React.FC = () => {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-black text-white p-4 sm:p-6 space-y-5 max-w-5xl mx-auto w-full">
      <div className="border-b border-neutral-800 pb-3">
        <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <User className="w-5 h-5 text-neutral-300" />
          <span>Account & Identity</span>
        </h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          Manage local device identity, credentials, and multi-model accounts
        </p>
      </div>

      <div className="space-y-4">
        <AIAccountsSettings />
      </div>
    </div>
  );
};
