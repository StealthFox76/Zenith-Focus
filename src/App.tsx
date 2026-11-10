/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Music, ChevronUp, ChevronDown, Repeat, X } from 'lucide-react';
import { Header } from './components/Header';
import { Timer } from './components/Timer';
import { PlaylistPlayer } from './components/PlaylistPlayer';
import { Dashboard } from './components/Dashboard';
import { TaskPlanner } from './components/TaskPlanner';
import { SettingsModal } from './components/SettingsModal';
import { SyncModal } from './components/SyncModal';
import { ZenMode } from './components/ZenMode';
import {
  TimerMode,
  TimerSettings,
  FocusSession,
  TaskItem,
  PlaylistState,
  SyncDataPayload,
} from './types';
import {
  getStoredSyncCode,
  setStoredSyncCode,
  getStoredData,
  saveLocalData,
  fetchRemoteSyncData,
  pushRemoteSyncData,
  DEFAULT_SETTINGS,
  DEFAULT_PLAYLIST,
  generateLocal7DigitCode,
} from './utils/sync';
import { playAlertSound, ambientEngine } from './utils/audio';
import { controlYouTubeIframe, extractVideoId, getVideoEmbedUrl } from './utils/youtube';

export default function App() {
  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<'timer' | 'dashboard' | 'playlist' | 'tasks'>('timer');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isZenOpen, setIsZenOpen] = useState(false);

  // Sync state
  const [syncCode, setSyncCode] = useState<string>(() => getStoredSyncCode());
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  // Application Data
  const initialData = useRef<SyncDataPayload>(getStoredData());
  const [settings, setSettings] = useState<TimerSettings>(initialData.current.settings);
  const [sessions, setSessions] = useState<FocusSession[]>(initialData.current.sessions);
  const [tasks, setTasks] = useState<TaskItem[]>(initialData.current.tasks);
  const [playlist, setPlaylist] = useState<PlaylistState>(initialData.current.playlist);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(initialData.current.dailyGoalMinutes);
  const [dailyGoalPomodoros, setDailyGoalPomodoros] = useState<number>(initialData.current.dailyGoalPomodoros);
  const [theme, setTheme] = useState<'dark' | 'light'>(initialData.current.theme || 'dark');
  const [isCornerPopupDismissed, setIsCornerPopupDismissed] = useState<boolean>(false);
  const [showSongEndedNotice, setShowSongEndedNotice] = useState<boolean>(false);
  const songEndNoticeTimeoutRef = useRef<number | null>(null);

  // Active Timer State
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(settings.focusDuration * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [pomodoroCount, setPomodoroCount] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('Deep Work');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // Ref to YouTube / Media iframe
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const debounceSyncTimer = useRef<number | null>(null);

  // Active Task reference
  const activeTask = tasks.find((t) => t.id === activeTaskId) || null;

  // Song Queue
  const songs = playlist.songs && playlist.songs.length > 0 ? playlist.songs : DEFAULT_PLAYLIST.songs;
  const currentIndex = Math.min(Math.max(0, playlist.currentIndex || 0), songs.length - 1);
  const currentSong = songs[currentIndex] || songs[0];
  const currentVideoId = currentSong?.videoId || extractVideoId(currentSong?.url || '') || 'jfKfPfyJRdk';

  // Apply Theme to DOM
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Request browser notification permission once
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Update total duration when mode or settings change
  const getTotalDuration = useCallback(
    (m: TimerMode) => {
      if (m === 'focus') return settings.focusDuration * 60;
      if (m === 'shortBreak') return settings.shortBreakDuration * 60;
      return settings.longBreakDuration * 60;
    },
    [settings]
  );

  // Background Initial Remote Sync
  useEffect(() => {
    let isMounted = true;
    async function initSync() {
      if (!syncCode) return;
      setIsSyncing(true);
      try {
        const remote = await fetchRemoteSyncData(syncCode);
        if (!isMounted) return;
        if (remote) {
          setSettings(remote.settings);
          setSessions(remote.sessions);
          setTasks(remote.tasks);
          setPlaylist(remote.playlist);
          setDailyGoalMinutes(remote.dailyGoalMinutes);
          setDailyGoalPomodoros(remote.dailyGoalPomodoros);
          if (remote.theme) setTheme(remote.theme);
          setLastSyncedAt(Date.now());
        } else {
          const payload: SyncDataPayload = {
            settings,
            sessions,
            tasks,
            playlist,
            dailyGoalMinutes,
            dailyGoalPomodoros,
            theme,
            updatedAt: Date.now(),
          };
          await pushRemoteSyncData(syncCode, payload);
          setLastSyncedAt(Date.now());
        }
      } catch (err) {
        console.warn('Initial sync error:', err);
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    }
    initSync();
    return () => {
      isMounted = false;
    };
  }, [syncCode]);

  // Save to LocalStorage and Debounced Cloud Push
  const triggerSync = useCallback(
    (
      newSettings = settings,
      newSessions = sessions,
      newTasks = tasks,
      newPlaylist = playlist,
      newGoalMins = dailyGoalMinutes,
      newGoalPoms = dailyGoalPomodoros,
      newTheme = theme
    ) => {
      const payload: SyncDataPayload = {
        settings: newSettings,
        sessions: newSessions,
        tasks: newTasks,
        playlist: newPlaylist,
        dailyGoalMinutes: newGoalMins,
        dailyGoalPomodoros: newGoalPoms,
        theme: newTheme,
        updatedAt: Date.now(),
      };

      saveLocalData(payload);

      if (debounceSyncTimer.current) {
        window.clearTimeout(debounceSyncTimer.current);
      }

      debounceSyncTimer.current = window.setTimeout(async () => {
        setIsSyncing(true);
        try {
          const success = await pushRemoteSyncData(syncCode, payload);
          if (success) {
            setLastSyncedAt(Date.now());
          }
        } finally {
          setIsSyncing(false);
        }
      }, 1200);
    },
    [syncCode, settings, sessions, tasks, playlist, dailyGoalMinutes, dailyGoalPomodoros, theme]
  );

  // Song Queue Advancement Logic
  const handleSongEnded = useCallback(() => {
    const queue = playlist.songs || [];
    if (queue.length === 0) return;

    const currentIdx = playlist.currentIndex || 0;

    if (currentIdx + 1 < queue.length) {
      // Advance to next song in the list
      const nextIdx = currentIdx + 1;
      const updated = { ...playlist, currentIndex: nextIdx, isPlaying: true };
      setPlaylist(updated);
      triggerSync(settings, sessions, tasks, updated);
    } else if (playlist.loop !== false) {
      // Reached the end of the song list -> Loop back to track 1!
      const updated = { ...playlist, currentIndex: 0, isPlaying: true };
      setPlaylist(updated);
      triggerSync(settings, sessions, tasks, updated);
    } else {
      const updated = { ...playlist, isPlaying: false };
      setPlaylist(updated);
      triggerSync(settings, sessions, tasks, updated);
    }

    // Make the corner notice appear when the song ends
    setShowSongEndedNotice(true);
    setIsCornerPopupDismissed(false);

    if (songEndNoticeTimeoutRef.current) {
      window.clearTimeout(songEndNoticeTimeoutRef.current);
    }
    // Auto-fade notice after 8 seconds if not dismissed manually
    songEndNoticeTimeoutRef.current = window.setTimeout(() => {
      setShowSongEndedNotice(false);
    }, 8000);
  }, [playlist, settings, sessions, tasks, triggerSync]);

  // Listen for YouTube Iframe onStateChange events (info: 0 is YT.PlayerState.ENDED)
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      try {
        let data = e.data;
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch {
            return;
          }
        }
        if (!data) return;

        // When YouTube video ends, info === 0
        if ((data.event === 'onStateChange' && data.info === 0) || data.info === 0) {
          handleSongEnded();
        }
      } catch (err) {
        // ignore
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleSongEnded]);

  // Next / Previous song buttons
  const handleNextSong = () => {
    if (songs.length <= 1) return;
    const nextIdx = (currentIndex + 1) % songs.length;
    const updated = { ...playlist, currentIndex: nextIdx, isPlaying: true };
    setPlaylist(updated);
    triggerSync(settings, sessions, tasks, updated);
  };

  const handlePrevSong = () => {
    if (songs.length <= 1) return;
    const prevIdx = (currentIndex - 1 + songs.length) % songs.length;
    const updated = { ...playlist, currentIndex: prevIdx, isPlaying: true };
    setPlaylist(updated);
    triggerSync(settings, sessions, tasks, updated);
  };

  const handlePlaySongAtIndex = (index: number) => {
    if (!songs[index]) return;
    const updated = { ...playlist, currentIndex: index, isPlaying: true };
    setPlaylist(updated);
    triggerSync(settings, sessions, tasks, updated);
  };

  // Synchronize Playlist Audio with Timer
  useEffect(() => {
    if (isRunning && mode === 'focus') {
      if (playlist.autoPlayOnFocus) {
        controlYouTubeIframe(iframeRef.current, 'play');
        // Small safeguard timeout to ensure iframe receives command after render
        const t = setTimeout(() => {
          controlYouTubeIframe(iframeRef.current, 'play');
        }, 150);
        return () => clearTimeout(t);
      }
      if (settings.ambientSound !== 'none') {
        ambientEngine.play(settings.ambientSound, settings.ambientVolume);
      }
    } else {
      controlYouTubeIframe(iframeRef.current, 'pause');
      ambientEngine.stop();
    }
  }, [isRunning, mode, playlist.autoPlayOnFocus, settings.ambientSound, settings.ambientVolume]);

  // Complete a session
  const handleSessionComplete = useCallback(() => {
    playAlertSound(settings.soundAlert, settings.volume);

    if ('Notification' in window && Notification.permission === 'granted') {
      const title = mode === 'focus' ? 'Focus Session Completed!' : 'Break Completed!';
      const body =
        mode === 'focus'
          ? 'Great work! Take a breath and step away for your break.'
          : 'Ready to dive back into deep focus?';
      try {
        new Notification(title, { body, icon: '/favicon.ico' });
      } catch {
        // ignore
      }
    }

    if (mode === 'focus') {
      const newSession: FocusSession = {
        id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: Date.now(),
        durationMinutes: settings.focusDuration,
        mode: 'focus',
        category: activeTask ? activeTask.category : selectedCategory,
        taskTitle: activeTask ? activeTask.title : undefined,
        completed: true,
      };

      const updatedSessions = [newSession, ...sessions];
      setSessions(updatedSessions);

      let updatedTasks = tasks;
      if (activeTaskId) {
        updatedTasks = tasks.map((t) =>
          t.id === activeTaskId
            ? {
                ...t,
                completedPomodoros: t.completedPomodoros + 1,
                isCompleted: t.completedPomodoros + 1 >= t.estimatedPomodoros ? true : t.isCompleted,
              }
            : t
        );
        setTasks(updatedTasks);
      }

      const nextPomodoroCount = pomodoroCount + 1;
      setPomodoroCount(nextPomodoroCount);

      const isLongBreakTime = nextPomodoroCount % settings.longBreakInterval === 0;
      const nextMode: TimerMode = isLongBreakTime ? 'longBreak' : 'shortBreak';
      const nextDuration = isLongBreakTime
        ? settings.longBreakDuration * 60
        : settings.shortBreakDuration * 60;

      setMode(nextMode);
      setTimeLeft(nextDuration);
      setIsRunning(settings.autoStartBreaks);

      triggerSync(settings, updatedSessions, updatedTasks);
    } else {
      setMode('focus');
      setTimeLeft(settings.focusDuration * 60);
      setIsRunning(settings.autoStartPomodoros);
    }
  }, [
    mode,
    settings,
    sessions,
    tasks,
    activeTask,
    activeTaskId,
    selectedCategory,
    pomodoroCount,
    triggerSync,
  ]);

  // Main Timer Countdown Loop
  useEffect(() => {
    let interval: number | null = null;

    if (isRunning) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, handleSessionComplete]);

  // Toggle / Open Music Popup
  const handleOpenMusicPopup = useCallback(() => {
    setIsCornerPopupDismissed(false);
    setShowSongEndedNotice(true);
  }, []);

  // Keyboard Shortcuts: Space, R, S, F, M
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT');
      if (isInput) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsRunning((prev) => !prev);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setIsRunning(false);
        setTimeLeft(getTotalDuration(mode));
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleSessionComplete();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setIsZenOpen((prev) => !prev);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setIsCornerPopupDismissed((prev) => !prev);
        setShowSongEndedNotice(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, getTotalDuration, handleSessionComplete]);

  // Timer Controls
  const handleToggleTimer = () => {
    setIsRunning((prev) => !prev);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setTimeLeft(getTotalDuration(mode));
  };

  const handleSkipTimer = () => {
    handleSessionComplete();
  };

  const handleSelectMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(getTotalDuration(newMode));
  };

  // Settings Updates
  const handleUpdateSettings = (newSettings: TimerSettings) => {
    setSettings(newSettings);
    if (!isRunning) {
      if (mode === 'focus') setTimeLeft(newSettings.focusDuration * 60);
      else if (mode === 'shortBreak') setTimeLeft(newSettings.shortBreakDuration * 60);
      else setTimeLeft(newSettings.longBreakDuration * 60);
    }
    triggerSync(newSettings);
  };

  // Playlist Updates
  const handleUpdatePlaylist = (newProps: Partial<PlaylistState>) => {
    const updated = { ...playlist, ...newProps };
    setPlaylist(updated);
    triggerSync(settings, sessions, tasks, updated);
  };

  const handleManualPlay = () => {
    controlYouTubeIframe(iframeRef.current, 'play');
  };

  const handleManualPause = () => {
    controlYouTubeIframe(iframeRef.current, 'pause');
  };

  // Task Handlers
  const handleAddTask = (title: string, category: string, estimated: number) => {
    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title,
      category,
      estimatedPomodoros: estimated,
      completedPomodoros: 0,
      isCompleted: false,
      createdAt: Date.now(),
    };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    triggerSync(settings, sessions, updated);
  };

  const handleToggleTaskComplete = (id: string) => {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, isCompleted: !t.isCompleted } : t
    );
    setTasks(updated);
    triggerSync(settings, sessions, updated);
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    if (activeTaskId === id) setActiveTaskId(null);
    setTasks(updated);
    triggerSync(settings, sessions, updated);
  };

  // Dashboard Handlers
  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    triggerSync(settings, updated);
  };

  const handleAddManualSession = (duration: number, category: string, title: string) => {
    const newSession: FocusSession = {
      id: `manual-${Date.now()}`,
      timestamp: Date.now(),
      durationMinutes: duration,
      mode: 'focus',
      category,
      taskTitle: title,
      completed: true,
    };
    const updated = [newSession, ...sessions];
    setSessions(updated);
    triggerSync(settings, updated);
  };

  // Sync Handlers
  const handleConnectCode = async (targetCode: string): Promise<boolean> => {
    setIsSyncing(true);
    try {
      const remote = await fetchRemoteSyncData(targetCode);
      if (remote) {
        setSyncCode(targetCode);
        setStoredSyncCode(targetCode);
        setSettings(remote.settings);
        setSessions(remote.sessions);
        setTasks(remote.tasks);
        setPlaylist(remote.playlist);
        setDailyGoalMinutes(remote.dailyGoalMinutes);
        setDailyGoalPomodoros(remote.dailyGoalPomodoros);
        if (remote.theme) setTheme(remote.theme);
        setLastSyncedAt(Date.now());
        saveLocalData(remote);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGenerateNewCode = () => {
    const fresh = generateLocal7DigitCode();
    setSyncCode(fresh);
    setStoredSyncCode(fresh);
    triggerSync();
  };

  const handleManualSyncNow = async () => {
    setIsSyncing(true);
    try {
      const payload: SyncDataPayload = {
        settings,
        sessions,
        tasks,
        playlist,
        dailyGoalMinutes,
        dailyGoalPomodoros,
        theme,
        updatedAt: Date.now(),
      };
      const ok = await pushRemoteSyncData(syncCode, payload);
      if (ok) setLastSyncedAt(Date.now());
    } finally {
      setIsSyncing(false);
    }
  };

  // Active Video Embed URL for currently queued song (Stable URL, never reloads on pause/play)
  const currentEmbedUrl = getVideoEmbedUrl(currentVideoId);

  const handleIframeLoad = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage('{"event":"listening"}', '*');
      if (isRunning && mode === 'focus' && playlist.autoPlayOnFocus) {
        controlYouTubeIframe(iframeRef.current, 'play');
      }
    }
  };

  // Persistent Player Element (always kept alive in DOM so video never stops on tab switches)
  const persistentPlayerElement = (
    <iframe
      ref={iframeRef}
      id="zenith-persistent-player"
      src={currentEmbedUrl}
      title="Zenith Focus Audio Player"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
      onLoad={handleIframeLoad}
      className="w-full h-full border-0"
    />
  );

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col transition-colors selection:bg-amber-500/20 selection:text-amber-600 dark:selection:text-amber-300">
      {/* Top Navigation Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        syncCode={syncCode}
        isSyncing={isSyncing}
        onOpenSync={() => setIsSyncOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleZen={() => setIsZenOpen(true)}
        theme={theme}
        onToggleTheme={() => {
          const next = theme === 'dark' ? 'light' : 'dark';
          setTheme(next);
          triggerSync(settings, sessions, tasks, playlist, dailyGoalMinutes, dailyGoalPomodoros, next);
        }}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 flex flex-col justify-center max-w-5xl w-full mx-auto p-4 sm:p-6 pb-24">
        {activeTab === 'timer' && (
          <Timer
            mode={mode}
            timeLeft={timeLeft}
            totalDuration={getTotalDuration(mode)}
            isRunning={isRunning}
            pomodoroCount={pomodoroCount}
            onToggleTimer={handleToggleTimer}
            onResetTimer={handleResetTimer}
            onSkipTimer={handleSkipTimer}
            onSelectMode={handleSelectMode}
            settings={settings}
            playlist={playlist}
            activeTask={activeTask}
            onOpenTaskModal={() => setActiveTab('tasks')}
            onToggleZen={() => setIsZenOpen(true)}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onOpenMusicPopup={handleOpenMusicPopup}
          />
        )}

        {activeTab === 'playlist' && (
          <PlaylistPlayer
            playlist={playlist}
            onUpdatePlaylist={handleUpdatePlaylist}
            isFocusRunning={isRunning && mode === 'focus'}
            onPlaySongAtIndex={handlePlaySongAtIndex}
            onNextSong={handleNextSong}
            onPrevSong={handlePrevSong}
            onManualPlay={handleManualPlay}
            onManualPause={handleManualPause}
            playerNode={persistentPlayerElement}
          />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            sessions={sessions}
            dailyGoalMinutes={dailyGoalMinutes}
            dailyGoalPomodoros={dailyGoalPomodoros}
            onDeleteSession={handleDeleteSession}
            onAddManualSession={handleAddManualSession}
          />
        )}

        {activeTab === 'tasks' && (
          <TaskPlanner
            tasks={tasks}
            activeTask={activeTask}
            onSelectActiveTask={(task) => setActiveTaskId(task ? task.id : null)}
            onAddTask={handleAddTask}
            onToggleTaskComplete={handleToggleTaskComplete}
            onDeleteTask={handleDeleteTask}
          />
        )}
      </main>

      {/* Background persistent audio player when outside Song List tab so audio NEVER pauses or resets */}
      {activeTab !== 'playlist' && (
        <div
          className="fixed -bottom-[9999px] -right-[9999px] w-[320px] h-[180px] pointer-events-none opacity-0 overflow-hidden"
          aria-hidden="true"
        >
          {persistentPlayerElement}
        </div>
      )}

      {/* Corner Track Popup: Disappears during focus, appears when song ends, with X button to close */}
      {activeTab !== 'playlist' && currentSong && !isCornerPopupDismissed && (!(isRunning && mode === 'focus') || showSongEndedNotice) && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:right-6 sm:bottom-6 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-3 flex items-center justify-between gap-3 text-xs sm:max-w-sm animate-fadeIn">
          <div className="flex items-center gap-2.5 truncate pr-2">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isRunning && mode === 'focus' ? 'bg-amber-500 animate-pulse' : 'bg-neutral-400'
              }`}
            />
            <div className="truncate">
              <span className="font-semibold text-neutral-900 dark:text-neutral-100 block truncate">
                {currentSong.title}
              </span>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block truncate">
                Track {currentIndex + 1} of {songs.length} · {showSongEndedNotice ? 'Now Playing Next' : isRunning && mode === 'focus' ? 'Focusing' : 'Paused'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handlePrevSong}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors"
              title="Previous track"
              aria-label="Previous track"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleManualPlay}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors"
              title="Play Audio"
              aria-label="Play Audio"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
            <button
              onClick={handleManualPause}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors"
              title="Pause Audio"
              aria-label="Pause Audio"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
            </button>
            <button
              onClick={handleNextSong}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors"
              title="Next track"
              aria-label="Next track"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveTab('playlist')}
              className="px-2 py-1.5 rounded-md text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
            >
              Queue
            </button>

            {/* Explicit X Dismiss Button */}
            <button
              onClick={() => {
                setIsCornerPopupDismissed(true);
                setShowSongEndedNotice(false);
              }}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ml-1 border-l border-neutral-200 dark:border-neutral-800 pl-2 cursor-pointer"
              title="Close popup (X)"
              aria-label="Dismiss popup"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Button at the bottom to make the popup appear again whenever dismissed or hidden */}
      {activeTab !== 'playlist' && currentSong && (isCornerPopupDismissed || (isRunning && mode === 'focus' && !showSongEndedNotice)) && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 animate-fadeIn">
          <button
            onClick={handleOpenMusicPopup}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all text-xs font-semibold border border-neutral-700/60 dark:border-neutral-300/60 group cursor-pointer"
            title="Show Music Player (or press M)"
            aria-label="Show Music Player"
          >
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isRunning && mode === 'focus' ? 'bg-amber-400' : 'bg-neutral-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isRunning && mode === 'focus' ? 'bg-amber-500' : 'bg-neutral-500'}`}></span>
            </span>
            <Music className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-12 transition-transform" />
            <span>{isRunning && mode === 'focus' ? 'Music Playing · Open Player' : 'Open Music Player'}</span>
          </button>
        </div>
      )}

      {/* Minimal Footer */}
      <footer className="py-4 border-t border-neutral-200 dark:border-neutral-800/80 text-center text-xs text-neutral-500 flex flex-col sm:flex-row items-center justify-between px-6 gap-2">
        <div className="flex items-center gap-2">
          <span>Zenith Focus</span>
          <span>·</span>
          <span>7-Digit Sync: {syncCode}</span>
        </div>
        <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
          In-Website Song List & Looping Queue
        </div>
      </footer>

      {/* Modals & Fullscreen Overlays */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        dailyGoalMinutes={dailyGoalMinutes}
        onUpdateDailyGoalMinutes={(mins) => {
          setDailyGoalMinutes(mins);
          triggerSync(settings, sessions, tasks, playlist, mins);
        }}
        dailyGoalPomodoros={dailyGoalPomodoros}
        onUpdateDailyGoalPomodoros={(count) => {
          setDailyGoalPomodoros(count);
          triggerSync(settings, sessions, tasks, playlist, dailyGoalMinutes, count);
        }}
      />

      <SyncModal
        isOpen={isSyncOpen}
        onClose={() => setIsSyncOpen(false)}
        syncCode={syncCode}
        isSyncing={isSyncing}
        lastSyncedAt={lastSyncedAt}
        onConnectCode={handleConnectCode}
        onGenerateNewCode={handleGenerateNewCode}
        onManualSync={handleManualSyncNow}
      />

      {isZenOpen && (
        <ZenMode
          mode={mode}
          timeLeft={timeLeft}
          totalDuration={getTotalDuration(mode)}
          isRunning={isRunning}
          onToggleTimer={handleToggleTimer}
          onResetTimer={handleResetTimer}
          onSkipTimer={handleSkipTimer}
          onCloseZen={() => setIsZenOpen(false)}
          activeTask={activeTask}
          selectedCategory={selectedCategory}
        />
      )}
    </div>
  );
}
