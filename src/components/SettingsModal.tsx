import React from 'react';
import { X, Volume2, Bell, Sliders, Sparkles, Target, RotateCcw } from 'lucide-react';
import { TimerSettings } from '../types';
import { playAlertSound, ambientEngine } from '../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TimerSettings;
  onUpdateSettings: (newSettings: TimerSettings) => void;
  dailyGoalMinutes: number;
  onUpdateDailyGoalMinutes: (mins: number) => void;
  dailyGoalPomodoros: number;
  onUpdateDailyGoalPomodoros: (count: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  dailyGoalMinutes,
  onUpdateDailyGoalMinutes,
  dailyGoalPomodoros,
  onUpdateDailyGoalPomodoros,
}) => {
  if (!isOpen) return null;

  const handleChange = <K extends keyof TimerSettings>(key: K, value: TimerSettings[K]) => {
    const updated = { ...settings, [key]: value };
    onUpdateSettings(updated);

    // If changing ambient sound or ambient volume in settings, preview
    if (key === 'ambientSound' || key === 'ambientVolume') {
      ambientEngine.play(
        key === 'ambientSound' ? (value as any) : settings.ambientSound,
        key === 'ambientVolume' ? (value as number) : settings.ambientVolume
      );
    }
  };

  const handleTestChime = () => {
    playAlertSound(settings.soundAlert, settings.volume);
  };

  const handleResetDefaults = () => {
    onUpdateSettings({
      focusDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      longBreakInterval: 4,
      autoStartBreaks: false,
      autoStartPomodoros: false,
      soundAlert: 'singingBowl',
      volume: 0.8,
      ambientSound: 'none',
      ambientVolume: 0.3,
    });
    ambientEngine.stop();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="mb-6">
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-500" />
            <span>Customizable Timers & Settings</span>
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Personalize your session intervals, auto-transition behavior, and audio acoustics.
          </p>
        </div>

        <div className="flex flex-col gap-6 text-sm">
          {/* 1. Timer Durations */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3 font-mono">
              Timer Durations (Minutes)
            </h4>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-neutral-50 dark:bg-neutral-950 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <label className="text-xs text-neutral-600 dark:text-neutral-400 block mb-1.5 font-medium">
                  Focus
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={settings.focusDuration}
                    onChange={(e) => handleChange('focusDuration', Math.max(1, Number(e.target.value)))}
                    className="w-full text-base font-mono font-bold text-neutral-900 dark:text-neutral-100 bg-transparent focus:outline-none tabular-nums"
                  />
                  <span className="text-xs text-neutral-400">m</span>
                </div>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-950 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <label className="text-xs text-neutral-600 dark:text-neutral-400 block mb-1.5 font-medium">
                  Short Break
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.shortBreakDuration}
                    onChange={(e) => handleChange('shortBreakDuration', Math.max(1, Number(e.target.value)))}
                    className="w-full text-base font-mono font-bold text-neutral-900 dark:text-neutral-100 bg-transparent focus:outline-none tabular-nums"
                  />
                  <span className="text-xs text-neutral-400">m</span>
                </div>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-950 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <label className="text-xs text-neutral-600 dark:text-neutral-400 block mb-1.5 font-medium">
                  Long Break
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.longBreakDuration}
                    onChange={(e) => handleChange('longBreakDuration', Math.max(1, Number(e.target.value)))}
                    className="w-full text-base font-mono font-bold text-neutral-900 dark:text-neutral-100 bg-transparent focus:outline-none tabular-nums"
                  />
                  <span className="text-xs text-neutral-400">m</span>
                </div>
              </div>
            </div>

            {/* Long break interval */}
            <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
              <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                Long Break Interval
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500">Every</span>
                <select
                  value={settings.longBreakInterval}
                  onChange={(e) => handleChange('longBreakInterval', Number(e.target.value))}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100"
                >
                  <option value={2}>2 sessions</option>
                  <option value={3}>3 sessions</option>
                  <option value={4}>4 sessions (standard)</option>
                  <option value={5}>5 sessions</option>
                  <option value={6}>6 sessions</option>
                  <option value={8}>8 sessions</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. Automation Behavior */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3 font-mono">
              Automation & Transitions
            </h4>

            <div className="flex flex-col gap-2.5">
              <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 cursor-pointer">
                <div>
                  <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block">
                    Auto-start Breaks
                  </span>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Immediately begin countdown for breaks when focus session ends
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoStartBreaks}
                  onChange={(e) => handleChange('autoStartBreaks', e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 cursor-pointer">
                <div>
                  <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block">
                    Auto-start Next Focus Session
                  </span>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Automatically commence the next focus block after a break completes
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoStartPomodoros}
                  onChange={(e) => handleChange('autoStartPomodoros', e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* 3. Audio & Bells */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3 font-mono">
              Alert Chimes & Ambient Background
            </h4>

            <div className="flex flex-col gap-3">
              {/* Alert chime */}
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                      Session Completion Chime
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestChime}
                    className="text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    Test Chime
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {(['singingBowl', 'chime', 'marimba', 'digital', 'none'] as const).map((sound) => (
                    <button
                      key={sound}
                      type="button"
                      onClick={() => handleChange('soundAlert', sound)}
                      className={`px-2 py-1.5 text-xs rounded-lg border transition-all text-center capitalize ${
                        settings.soundAlert === sound
                          ? 'border-neutral-900 dark:border-neutral-100 bg-white dark:bg-neutral-800 font-semibold text-neutral-900 dark:text-neutral-100'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {sound === 'singingBowl' ? 'Singing Bowl' : sound}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-neutral-500">Volume</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.volume}
                    onChange={(e) => handleChange('volume', Number(e.target.value))}
                    className="flex-1 accent-amber-500"
                  />
                  <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
                    {Math.round(settings.volume * 100)}%
                  </span>
                </div>
              </div>

              {/* Ambient Noise */}
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                      Ambient Synthesized Noise
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-400">Continuous soundscape</span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {(['none', 'rain', 'whitenoise', 'forest', 'waves'] as const).map((amb) => (
                    <button
                      key={amb}
                      type="button"
                      onClick={() => handleChange('ambientSound', amb)}
                      className={`px-2 py-1.5 text-xs rounded-lg border transition-all text-center capitalize ${
                        settings.ambientSound === amb
                          ? 'border-neutral-900 dark:border-neutral-100 bg-white dark:bg-neutral-800 font-semibold text-neutral-900 dark:text-neutral-100'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {amb === 'whitenoise' ? 'White Noise' : amb}
                    </button>
                  ))}
                </div>

                {settings.ambientSound !== 'none' && (
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-neutral-500">Noise Vol</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={settings.ambientVolume}
                      onChange={(e) => handleChange('ambientVolume', Number(e.target.value))}
                      className="flex-1 accent-blue-500"
                    />
                    <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
                      {Math.round(settings.ambientVolume * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. Daily Goals */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3 font-mono">
              Daily Focus Targets
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-neutral-50 dark:bg-neutral-950 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <label className="text-xs text-neutral-600 dark:text-neutral-400 block mb-1">
                  Daily Focus Goal
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="30"
                    max="720"
                    step="15"
                    value={dailyGoalMinutes}
                    onChange={(e) => onUpdateDailyGoalMinutes(Number(e.target.value))}
                    className="w-full text-base font-mono font-bold text-neutral-900 dark:text-neutral-100 bg-transparent focus:outline-none tabular-nums"
                  />
                  <span className="text-xs text-neutral-400">mins</span>
                </div>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-950 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <label className="text-xs text-neutral-600 dark:text-neutral-400 block mb-1">
                  Target Pomodoros
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={dailyGoalPomodoros}
                    onChange={(e) => onUpdateDailyGoalPomodoros(Number(e.target.value))}
                    className="w-full text-base font-mono font-bold text-neutral-900 dark:text-neutral-100 bg-transparent focus:outline-none tabular-nums"
                  />
                  <span className="text-xs text-neutral-400">sessions</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-neutral-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-semibold text-xs hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-xs"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
