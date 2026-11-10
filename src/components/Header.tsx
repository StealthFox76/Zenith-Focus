import React from 'react';
import { Sliders, RefreshCw, Sun, Moon, Maximize2 } from 'lucide-react';
import { format7DigitCode } from '../utils/sync';

interface HeaderProps {
  activeTab: 'timer' | 'dashboard' | 'playlist' | 'tasks';
  setActiveTab: (tab: 'timer' | 'dashboard' | 'playlist' | 'tasks') => void;
  syncCode: string;
  isSyncing: boolean;
  onOpenSync: () => void;
  onOpenSettings: () => void;
  onToggleZen: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  syncCode,
  isSyncing,
  onOpenSync,
  onOpenSettings,
  onToggleZen,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="flex items-center justify-between gap-4 md:gap-8 px-4 md:px-8 py-3.5 border-b border-neutral-200 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-md sticky top-0 z-30 transition-colors">
      {/* Zone 1: Single text wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('timer');
          }}
          className="text-base md:text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100 whitespace-nowrap shrink-0 flex items-center gap-2 group"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-600 dark:bg-amber-400 group-hover:scale-125 transition-transform" />
          <span>Zenith</span>
          <span className="text-xs font-normal text-neutral-400 dark:text-neutral-500 hidden sm:inline">Focus</span>
        </a>
      </div>

      {/* Zone 2: Navigation links */}
      <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium">
        <button
          onClick={() => setActiveTab('timer')}
          className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'timer'
              ? 'text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800 font-semibold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          Timer
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'dashboard'
              ? 'text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800 font-semibold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('playlist')}
          className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'playlist'
              ? 'text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800 font-semibold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          Song List
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'tasks'
              ? 'text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800 font-semibold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          Tasks
        </button>
      </nav>

      {/* Zone 3: Primary Action & Utilities */}
      <div className="flex items-center gap-2 shrink-0">
        {/* 7-digit sync button */}
        <button
          onClick={onOpenSync}
          title="Cross-device 7-digit sync"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-mono font-medium rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-white dark:hover:bg-neutral-800 transition-all whitespace-nowrap shrink-0 shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-500' : 'text-neutral-500'}`} />
          <span className="hidden sm:inline text-neutral-500 dark:text-neutral-400">Sync:</span>
          <span className="tabular-nums font-semibold">{format7DigitCode(syncCode)}</span>
        </button>

        {/* Zen Mode Button */}
        <button
          onClick={onToggleZen}
          title="Fullscreen Zen Mode (F)"
          className="p-1.5 sm:p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Zen Mode"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-1.5 sm:p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          title="Timer Settings"
          className="p-1.5 sm:p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Settings"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
