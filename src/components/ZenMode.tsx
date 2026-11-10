import React, { useEffect } from 'react';
import { Minimize2, Play, Pause, RotateCcw, SkipForward, Music } from 'lucide-react';
import { TimerMode, TaskItem } from '../types';

interface ZenModeProps {
  mode: TimerMode;
  timeLeft: number;
  totalDuration: number;
  isRunning: boolean;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onSkipTimer: () => void;
  onCloseZen: () => void;
  activeTask: TaskItem | null;
  selectedCategory: string;
}

export const ZenMode: React.FC<ZenModeProps> = ({
  mode,
  timeLeft,
  totalDuration,
  isRunning,
  onToggleTimer,
  onResetTimer,
  onSkipTimer,
  onCloseZen,
  activeTask,
  selectedCategory,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'f' || e.key === 'F') {
        onCloseZen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCloseZen]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const radius = 160;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = totalDuration > 0 ? (totalDuration - timeLeft) / totalDuration : 0;
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col items-center justify-between p-4 sm:p-8 select-none animate-fadeIn cursor-default overflow-y-auto">
      {/* Top Bar with Exit Zen */}
      <div className="w-full max-w-4xl flex items-center justify-between text-neutral-500 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="tracking-wider">ZENITH FOCUS</span>
        </div>

        <button
          onClick={onCloseZen}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer active:scale-95 min-h-[40px]"
          title="Exit Zen Mode (Esc or F)"
          aria-label="Exit Zen Mode"
        >
          <Minimize2 className="w-4 h-4" />
          <span className="font-sans font-medium text-xs">Exit Zen</span>
        </button>
      </div>

      {/* Main Focus Ring */}
      <div className="flex flex-col items-center justify-center my-auto py-4">
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 flex items-center justify-center mb-8">
          {/* Subtle breathing glow when running */}
          {isRunning && (
            <div
              className={`absolute inset-4 rounded-full blur-2xl opacity-20 pointer-events-none transition-opacity duration-1000 ${
                mode === 'focus' ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
          )}

          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 360 360">
            <circle
              cx="180"
              cy="180"
              r={radius}
              className="stroke-neutral-900"
              strokeWidth="4"
              fill="transparent"
            />
            <circle
              cx="180"
              cy="180"
              r={radius}
              className={`transition-[stroke-dashoffset] duration-700 ease-linear ${
                mode === 'focus' ? 'stroke-amber-500' : 'stroke-emerald-400'
              }`}
              strokeWidth="5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xs uppercase font-mono tracking-widest text-neutral-500 mb-2">
              {mode === 'focus' ? 'Deep Focus' : 'Mindful Rest'}
            </span>
            <div className="text-6xl sm:text-7xl md:text-8xl font-mono font-bold tracking-tight text-white tabular-nums">
              {formattedTime}
            </div>
            <div className="text-xs text-neutral-400 mt-3 max-w-[200px] truncate">
              {activeTask ? activeTask.title : selectedCategory}
            </div>
          </div>
        </div>

        {/* Action Controls: Phone touch-friendly */}
        <div className="flex items-center gap-3 sm:gap-6">
          <button
            onClick={onResetTimer}
            className="flex items-center gap-1.5 px-4 py-3 rounded-full text-neutral-400 hover:text-white bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 transition-colors cursor-pointer active:scale-95 text-xs font-medium min-h-[46px]"
            title="Reset timer"
            aria-label="Reset Timer"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            onClick={onToggleTimer}
            className={`px-7 sm:px-8 py-3.5 rounded-full text-sm font-semibold transition-transform active:scale-95 flex items-center gap-2 cursor-pointer min-h-[46px] shadow-lg ${
              isRunning
                ? 'bg-neutral-800 text-white hover:bg-neutral-700 border border-neutral-700'
                : 'bg-amber-500 text-black hover:bg-amber-400'
            }`}
            aria-label={isRunning ? 'Pause' : 'Start Focus'}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current translate-x-0.5" />
                <span>{mode === 'focus' ? 'Start Focus' : 'Start Rest'}</span>
              </>
            )}
          </button>

          <button
            onClick={onSkipTimer}
            className="flex items-center gap-1.5 px-4 py-3 rounded-full text-neutral-400 hover:text-white bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 transition-colors cursor-pointer active:scale-95 text-xs font-medium min-h-[46px]"
            title="Skip session"
            aria-label="Skip Session"
          >
            <SkipForward className="w-4 h-4" />
            <span className="hidden sm:inline">Skip</span>
          </button>
        </div>
      </div>

      {/* Bottom info */}
      <div className="text-neutral-500 text-[11px] font-mono text-center">
        <span>Tap buttons to control</span>
        <span className="hidden sm:inline"> · Space to toggle · Esc to exit</span>
      </div>
    </div>
  );
};
