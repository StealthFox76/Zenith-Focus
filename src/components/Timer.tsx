import React from 'react';
import { Play, Pause, RotateCcw, SkipForward, Music, Volume2, VolumeX, Maximize2, Tag } from 'lucide-react';
import { TimerMode, TimerSettings, PlaylistState, TaskItem } from '../types';

interface TimerProps {
  mode: TimerMode;
  timeLeft: number;
  totalDuration: number;
  isRunning: boolean;
  pomodoroCount: number;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onSkipTimer: () => void;
  onSelectMode: (mode: TimerMode) => void;
  settings: TimerSettings;
  playlist: PlaylistState;
  activeTask: TaskItem | null;
  onOpenTaskModal: () => void;
  onToggleZen: () => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onOpenMusicPopup?: () => void;
}

const CATEGORIES = ['Deep Work', 'Coding', 'Reading', 'Writing', 'Study', 'Design'];

export const Timer: React.FC<TimerProps> = ({
  mode,
  timeLeft,
  totalDuration,
  isRunning,
  pomodoroCount,
  onToggleTimer,
  onResetTimer,
  onSkipTimer,
  onSelectMode,
  settings,
  playlist,
  activeTask,
  onOpenTaskModal,
  onToggleZen,
  selectedCategory,
  onSelectCategory,
  onOpenMusicPopup,
}) => {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // SVG circular progress calculation
  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = totalDuration > 0 ? (totalDuration - timeLeft) / totalDuration : 0;
  const strokeDashoffset = circumference - progressRatio * circumference;

  // Cycle dots
  const interval = settings.longBreakInterval || 4;
  const currentCycleIndex = pomodoroCount % interval;

  return (
    <div className="flex flex-col items-center justify-center max-w-xl mx-auto py-2 sm:py-4 px-4 text-center">
      {/* Segmented Mode Selector Buttons */}
      <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 mb-6 sm:mb-8 shadow-xs w-full sm:w-auto justify-center overflow-x-auto">
        <button
          onClick={() => onSelectMode('focus')}
          className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
            mode === 'focus'
              ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs font-semibold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          Focus ({settings.focusDuration}m)
        </button>
        <button
          onClick={() => onSelectMode('shortBreak')}
          className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
            mode === 'shortBreak'
              ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs font-semibold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          Short Rest ({settings.shortBreakDuration}m)
        </button>
        <button
          onClick={() => onSelectMode('longBreak')}
          className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
            mode === 'longBreak'
              ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs font-semibold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          Long Rest ({settings.longBreakDuration}m)
        </button>
      </div>

      {/* Circular Progress Ring */}
      <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center mb-6">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 300 300">
          {/* Background Track */}
          <circle
            cx="150"
            cy="150"
            r={radius}
            className="stroke-neutral-200 dark:stroke-neutral-800/80"
            strokeWidth="5"
            fill="transparent"
          />
          {/* Active Progress Stroke */}
          <circle
            cx="150"
            cy="150"
            r={radius}
            className={`transition-[stroke-dashoffset] duration-700 ease-linear ${
              mode === 'focus'
                ? 'stroke-amber-600 dark:stroke-amber-400'
                : 'stroke-emerald-600 dark:stroke-emerald-400'
            }`}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Center Timer Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Mode label & cycle */}
          <div className="text-xs uppercase tracking-widest font-mono text-neutral-500 dark:text-neutral-400 mb-1">
            {mode === 'focus' ? 'Focus Session' : mode === 'shortBreak' ? 'Short Rest' : 'Long Rest'}
          </div>

          {/* Big Digital Clock */}
          <div className="text-6xl sm:text-7xl font-mono font-bold tracking-tight text-neutral-900 dark:text-neutral-100 tabular-nums">
            {formattedTime}
          </div>

          {/* Pomodoro Round Dots */}
          <div className="flex items-center gap-1.5 mt-3" title={`Session ${currentCycleIndex + 1} of ${interval}`}>
            {Array.from({ length: interval }).map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i < currentCycleIndex
                    ? 'bg-amber-600 dark:bg-amber-400'
                    : i === currentCycleIndex && isRunning && mode === 'focus'
                    ? 'bg-amber-600 dark:bg-amber-400 opacity-60'
                    : 'bg-neutral-200 dark:bg-neutral-800'
                }`}
              />
            ))}
            <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500 ml-1">
              #{pomodoroCount + 1}
            </span>
          </div>
        </div>
      </div>

      {/* Current Task / Category Bar */}
      <div className="w-full max-w-sm mb-6 flex flex-col items-center gap-2">
        {activeTask ? (
          <div
            onClick={onOpenTaskModal}
            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors cursor-pointer flex items-center justify-between text-left shadow-xs"
          >
            <div className="truncate pr-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
                Current Goal
              </span>
              <span className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate block">
                {activeTask.title}
              </span>
            </div>
            <span className="text-xs font-mono text-neutral-500 shrink-0">
              {activeTask.completedPomodoros}/{activeTask.estimatedPomodoros} 🍅
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1 flex-wrap justify-center">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                  selectedCategory === cat
                    ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 font-medium'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile-Friendly Action Controls: Start/Pause, Reset, Skip, Zen */}
      <div className="flex flex-col items-center gap-3 w-full max-w-sm mb-6">
        {/* Main Action Row: Reset, Play/Pause, Skip */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 w-full">
          {/* Clickable Reset Button */}
          <button
            onClick={onResetTimer}
            title="Reset timer (R)"
            aria-label="Reset Timer"
            className="flex-1 flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700/80 active:scale-95 transition-all text-xs sm:text-sm font-medium border border-neutral-200/80 dark:border-neutral-700/80 min-h-[46px] shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 shrink-0 text-neutral-500" />
            <span>Reset</span>
          </button>

          {/* Primary Start / Pause Hero Button */}
          <button
            onClick={onToggleTimer}
            aria-label={isRunning ? 'Pause Timer' : 'Start Focus'}
            className={`flex-[1.6] flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-semibold text-sm sm:text-base transition-all active:scale-95 shadow-md min-h-[46px] cursor-pointer ${
              isRunning
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-100'
                : 'bg-amber-600 dark:bg-amber-500 text-white hover:bg-amber-700 dark:hover:bg-amber-400'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current translate-x-0.5" />
                <span>Start</span>
              </>
            )}
          </button>

          {/* Clickable Skip Button */}
          <button
            onClick={onSkipTimer}
            title="Skip session (S)"
            aria-label="Skip Session"
            className="flex-1 flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700/80 active:scale-95 transition-all text-xs sm:text-sm font-medium border border-neutral-200/80 dark:border-neutral-700/80 min-h-[46px] shadow-xs cursor-pointer"
          >
            <SkipForward className="w-4 h-4 shrink-0 text-neutral-500" />
            <span>Skip</span>
          </button>
        </div>

        {/* Dedicated Clickable Zen Mode Button (Easy tap for phone users) */}
        <button
          onClick={onToggleZen}
          title="Fullscreen Zen Mode (F)"
          aria-label="Enter Fullscreen Zen Mode"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-100/70 dark:bg-neutral-900/70 hover:bg-neutral-200/80 dark:hover:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-800 transition-all active:scale-95 min-h-[42px] cursor-pointer"
        >
          <Maximize2 className="w-4 h-4 text-amber-500" />
          <span>Zen Mode (Fullscreen)</span>
        </button>
      </div>

      {/* Playlist Sync Status Banner (Clickable to reopen the music popup) */}
      <div
        onClick={onOpenMusicPopup}
        role="button"
        tabIndex={0}
        title="Tap to open music player"
        className="w-full max-w-sm flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-900/50 hover:bg-neutral-200/70 dark:hover:bg-neutral-800/70 border border-neutral-200/80 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 mb-6 cursor-pointer transition-all active:scale-[0.98] group"
      >
        <div className="flex items-center gap-2 truncate pr-2">
          <Music className={`w-3.5 h-3.5 shrink-0 ${isRunning && mode === 'focus' ? 'text-amber-500 animate-pulse' : 'text-neutral-400 group-hover:text-amber-500 transition-colors'}`} />
          <span className="truncate">
            {isRunning && mode === 'focus'
              ? `Playing: ${playlist.songs?.[playlist.currentIndex || 0]?.title || 'Focus Track'}`
              : mode !== 'focus'
              ? 'Song paused during break'
              : `Next: ${playlist.songs?.[playlist.currentIndex || 0]?.title || 'Song Queue'}`}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
            {playlist.songs?.length ? `Track ${(playlist.currentIndex || 0) + 1}/${playlist.songs.length}` : 'Queue'}
          </span>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium group-hover:underline">
            Player ↗
          </span>
        </div>
      </div>

      {/* Keyboard Shortcuts Hint (Desktop convenience, secondary to touch buttons) */}
      <div className="text-[11px] text-neutral-400 dark:text-neutral-500 hidden sm:flex items-center gap-3">
        <span><kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono text-[10px]">Space</kbd> Start/Stop</span>
        <span>·</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono text-[10px]">R</kbd> Reset</span>
        <span>·</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono text-[10px]">S</kbd> Skip</span>
        <span>·</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono text-[10px]">F</kbd> Zen</span>
      </div>
    </div>
  );
};
