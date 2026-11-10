import React, { useState } from 'react';
import { BarChart3, Flame, Clock, CheckCircle2, Calendar, Trash2, Filter, TrendingUp, Award, Plus } from 'lucide-react';
import { FocusSession } from '../types';

interface DashboardProps {
  sessions: FocusSession[];
  dailyGoalMinutes: number;
  dailyGoalPomodoros: number;
  onDeleteSession: (id: string) => void;
  onAddManualSession: (duration: number, category: string, title: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  sessions,
  dailyGoalMinutes,
  dailyGoalPomodoros,
  onDeleteSession,
  onAddManualSession,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualDuration, setManualDuration] = useState(25);
  const [manualCategory, setManualCategory] = useState('Deep Work');
  const [manualTitle, setManualTitle] = useState('');

  // 1. Calculate today's metrics
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const todaySessions = sessions.filter(
    (s) => s.timestamp >= startOfToday && s.mode === 'focus' && s.completed
  );

  const todayFocusMinutes = todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const todayPomodoros = todaySessions.length;

  const todayHours = Math.floor(todayFocusMinutes / 60);
  const todayMinsRemaining = todayFocusMinutes % 60;
  const todayFormatted = todayHours > 0 ? `${todayHours}h ${todayMinsRemaining}m` : `${todayMinsRemaining}m`;

  const dailyProgressPercent = Math.min(100, Math.round((todayFocusMinutes / (dailyGoalMinutes || 120)) * 100));

  // 2. Calculate daily streak
  const calculateStreak = (): number => {
    let streak = 0;
    const dayMs = 86400000;
    const checkDate = new Date(startOfToday);

    // If active today, count today
    if (todaySessions.length > 0) {
      streak = 1;
    }

    // Check past consecutive days
    for (let i = 1; i <= 60; i++) {
      const pastStart = checkDate.getTime() - i * dayMs;
      const pastEnd = pastStart + dayMs;
      const hasSessions = sessions.some(
        (s) => s.timestamp >= pastStart && s.timestamp < pastEnd && s.mode === 'focus' && s.completed
      );

      if (hasSessions) {
        if (streak === 0 && i === 1) {
          // If no sessions today yet, but had sessions yesterday, streak is still alive
          streak = 1;
        } else {
          streak++;
        }
      } else {
        if (streak > 0 || i > 1) break;
      }
    }
    return streak;
  };

  const streakDays = calculateStreak();

  // 3. 7-Day Chart Data
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfToday - (6 - i) * 86400000);
    const dayStart = d.getTime();
    const dayEnd = dayStart + 86400000;
    const daySessions = sessions.filter(
      (s) => s.timestamp >= dayStart && s.timestamp < dayEnd && s.mode === 'focus' && s.completed
    );
    const totalMins = daySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const isToday = i === 6;

    return {
      dayName,
      totalMins,
      sessionCount: daySessions.length,
      isToday,
      dateFormatted: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
  });

  const maxMinutesInWeek = Math.max(...last7Days.map((d) => d.totalMins), dailyGoalMinutes, 120);
  const weekTotalMinutes = last7Days.reduce((acc, d) => acc + d.totalMins, 0);
  const weekHours = Math.floor(weekTotalMinutes / 60);
  const weekMins = weekTotalMinutes % 60;

  // 4. Category breakdown
  const categoryMap: Record<string, number> = {};
  sessions
    .filter((s) => s.mode === 'focus' && s.completed)
    .forEach((s) => {
      const cat = s.category || 'General';
      categoryMap[cat] = (categoryMap[cat] || 0) + s.durationMinutes;
    });

  const totalAllMinutes = Object.values(categoryMap).reduce((a, b) => a + b, 0) || 1;
  const categoriesList = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

  // 5. Filtered Session History
  const filteredSessions = sessions
    .filter((s) => {
      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'today') return s.timestamp >= startOfToday;
      return s.category === selectedFilter;
    })
    .sort((a, b) => b.timestamp - a.timestamp);

  const handleCreateManual = (e: React.FormEvent) => {
    e.preventDefault();
    onAddManualSession(Number(manualDuration) || 25, manualCategory, manualTitle || 'Focus Session');
    setShowManualModal(false);
    setManualTitle('');
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-500" />
            <span>Daily Focus Dashboard</span>
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Track daily momentum, continuous study streaks, and categorized focus allocation.
          </p>
        </div>

        <button
          onClick={() => setShowManualModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/80 transition-colors shrink-0 shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log Past Session</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {/* Today's Focus */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-medium">Today's Focus</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
            {todayFormatted}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${dailyProgressPercent}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500 shrink-0">
              {dailyProgressPercent}%
            </span>
          </div>
        </div>

        {/* Pomodoros Completed */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-medium">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
            {todayPomodoros} <span className="text-xs font-normal text-neutral-400">/ {dailyGoalPomodoros}</span>
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-2">
            {todayPomodoros >= dailyGoalPomodoros ? 'Daily target reached!' : `${dailyGoalPomodoros - todayPomodoros} sessions to goal`}
          </p>
        </div>

        {/* Streak */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-medium">Daily Streak</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
            {streakDays} <span className="text-xs font-normal text-neutral-400">{streakDays === 1 ? 'day' : 'days'}</span>
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-2">
            {streakDays > 0 ? 'Consistency unlocked' : 'Start a session today'}
          </p>
        </div>

        {/* Weekly Total */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-medium">7-Day Total</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
            {weekHours}h {weekMins}m
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-2">
            Across past 7 calendar days
          </p>
        </div>
      </div>

      {/* 7-Day Visual Bar Chart */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 mb-8 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Weekly Focus Distribution
            </h3>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Minutes completed per day
            </span>
          </div>
          <span className="text-xs font-mono text-neutral-400 dark:text-neutral-500">
            Target: {dailyGoalMinutes} min/day
          </span>
        </div>

        {/* Chart Bars */}
        <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 pt-6 border-b border-neutral-100 dark:border-neutral-800/80 pb-2">
          {last7Days.map((day, idx) => {
            const heightPercent = Math.max(8, Math.round((day.totalMins / maxMinutesInWeek) * 100));
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <span className="text-[10px] font-mono text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                  {day.totalMins}m
                </span>
                <div className="w-full max-w-[42px] bg-neutral-100 dark:bg-neutral-800/80 rounded-t-lg h-full flex items-end p-0.5 overflow-hidden">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-md transition-all duration-500 ${
                      day.isToday
                        ? 'bg-amber-500 dark:bg-amber-400'
                        : day.totalMins >= dailyGoalMinutes
                        ? 'bg-emerald-500 dark:bg-emerald-400'
                        : 'bg-neutral-300 dark:bg-neutral-700'
                    }`}
                  />
                </div>
                <div className="text-center">
                  <span className={`text-xs block font-medium ${day.isToday ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-neutral-600 dark:text-neutral-400'}`}>
                    {day.dayName}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400 block tabular-nums">
                    {day.dateFormatted}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Breakdown & Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
            Focus by Category
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
            Allocation of completed sessions
          </p>

          <div className="flex flex-col gap-3">
            {categoriesList.length === 0 ? (
              <p className="text-xs text-neutral-400 italic">No categorized sessions recorded yet.</p>
            ) : (
              categoriesList.map(([cat, mins]) => {
                const percentage = Math.round((mins / totalAllMinutes) * 100);
                return (
                  <div key={cat} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">{cat}</span>
                      <span className="font-mono text-neutral-500 tabular-nums">
                        {mins}m ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-neutral-800 dark:bg-neutral-200 h-full rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Session History Log */}
        <div className="md:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Session History
              </h3>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Recent completed focus blocks
              </span>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-neutral-400" />
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md px-2 py-1 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none"
              >
                <option value="all">All Sessions</option>
                <option value="today">Today Only</option>
                {Array.from(new Set(sessions.map((s) => s.category).filter(Boolean))).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80 max-h-72 overflow-y-auto">
            {filteredSessions.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
                No sessions match this filter. Start a focus timer to log your first session!
              </div>
            ) : (
              filteredSessions.map((session) => {
                const date = new Date(session.timestamp);
                const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                return (
                  <div key={session.id} className="py-2.5 flex items-center justify-between gap-3 text-xs group">
                    <div className="truncate pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                          {session.taskTitle || 'Focus Session'}
                        </span>
                        <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                          · {session.category}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500">
                        {dateStr} at {timeStr}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono font-medium text-neutral-800 dark:text-neutral-200 tabular-nums">
                        {session.durationMinutes} min
                      </span>
                      <button
                        onClick={() => onDeleteSession(session.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-500 transition-all"
                        title="Delete log entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-3">
              Log Past Focus Session
            </h3>

            <form onSubmit={handleCreateManual} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-neutral-600 dark:text-neutral-400 mb-1 block">What did you focus on?</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Read research paper"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-neutral-600 dark:text-neutral-400 mb-1 block">Duration (minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={manualDuration}
                  onChange={(e) => setManualDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-neutral-600 dark:text-neutral-400 mb-1 block">Category</label>
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none"
                >
                  <option value="Deep Work">Deep Work</option>
                  <option value="Coding">Coding</option>
                  <option value="Reading">Reading</option>
                  <option value="Writing">Writing</option>
                  <option value="Study">Study</option>
                  <option value="Design">Design</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-3 py-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
