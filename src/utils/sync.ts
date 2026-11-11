import { SyncDataPayload, TimerSettings, FocusSession, TaskItem, PlaylistState } from '../types';

const STORAGE_KEY_CODE = 'zenith_sync_code';
const STORAGE_KEY_DATA = 'zenith_local_data';

export const DEFAULT_SETTINGS: TimerSettings = {
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
};

export const DEFAULT_SONGS = [
  {
    id: 'song-1',
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    title: 'Lofi Girl - Chill Beats to Study/Relax',
    videoId: 'jfKfPfyJRdk',
    addedAt: 1,
  },
  {
    id: 'song-2',
    url: 'https://www.youtube.com/watch?v=WPni755-Krg',
    title: 'Deep Focus Ambient & Electronic Synthesizer',
    videoId: 'WPni755-Krg',
    addedAt: 2,
  },
  {
    id: 'song-3',
    url: 'https://www.youtube.com/watch?v=4xDzrJKXOOY',
    title: 'Peaceful Classical Concentration Piano',
    videoId: '4xDzrJKXOOY',
    addedAt: 3,
  },
  {
    id: 'song-4',
    url: 'https://www.youtube.com/watch?v=mPZkdNFkNps',
    title: 'Rain & Campfire Night Study Focus',
    videoId: 'mPZkdNFkNps',
    addedAt: 4,
  },
];

export const DEFAULT_PLAYLIST: PlaylistState = {
  songs: DEFAULT_SONGS,
  currentIndex: 0,
  autoPlayOnFocus: true,
  loop: true,
  isPlaying: false,
  volume: 80,
  url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
  customTitle: 'Lofi Girl - Chill Beats to Study/Relax',
};

export function generateLocal7DigitCode(): string {
  return Math.floor(1000000 + Math.random() * 9000000).toString();
}

export function format7DigitCode(code: string): string {
  const clean = code.replace(/\D/g, '');
  if (clean.length === 7) {
    return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  }
  return code;
}

export const format7CharCode = format7DigitCode;

export function getStoredSyncCode(): string {
  let code = localStorage.getItem(STORAGE_KEY_CODE) || localStorage.getItem('komorebi_sync_code');
  if (!code || code.replace(/\D/g, '').length !== 7) {
    code = generateLocal7DigitCode();
    localStorage.setItem(STORAGE_KEY_CODE, code);
  }
  return code.replace(/\D/g, '');
}

export function setStoredSyncCode(code: string) {
  const clean = code.replace(/\D/g, '');
  localStorage.setItem(STORAGE_KEY_CODE, clean);
}

export function getStoredData(): SyncDataPayload {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DATA) || localStorage.getItem('komorebi_local_data');
    if (raw) {
      const parsed = JSON.parse(raw);
      const parsedPlaylist = parsed.playlist || {};
      
      // Ensure songs array exists and has at least default songs if empty
      let songs = Array.isArray(parsedPlaylist.songs) && parsedPlaylist.songs.length > 0
        ? parsedPlaylist.songs
        : DEFAULT_SONGS;

      // If user had single legacy url, prepend it
      if (parsedPlaylist.url && !songs.some((s: any) => s.url === parsedPlaylist.url)) {
        songs = [
          {
            id: `song-legacy`,
            url: parsedPlaylist.url,
            title: parsedPlaylist.customTitle || 'Custom Track',
            addedAt: Date.now(),
          },
          ...songs,
        ];
      }

      return {
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
        playlist: {
          ...DEFAULT_PLAYLIST,
          ...parsedPlaylist,
          songs,
          currentIndex: typeof parsedPlaylist.currentIndex === 'number' ? parsedPlaylist.currentIndex : 0,
          loop: parsedPlaylist.loop ?? true,
        },
        dailyGoalMinutes: parsed.dailyGoalMinutes ?? 120,
        dailyGoalPomodoros: parsed.dailyGoalPomodoros ?? 6,
        theme: parsed.theme === 'light' ? 'light' : 'dark',
        updatedAt: parsed.updatedAt || Date.now(),
      };
    }
  } catch (err) {
    console.warn('Error reading local sync data:', err);
  }

  // Sample initial session data so the progress dashboard looks alive immediately
  const now = Date.now();
  const dayMs = 86400000;
  const initialSessions: FocusSession[] = [
    {
      id: 'demo-1',
      timestamp: now - 3600000 * 2,
      durationMinutes: 25,
      mode: 'focus',
      category: 'Deep Work',
      taskTitle: 'Project Architecture & Spec',
      completed: true,
    },
    {
      id: 'demo-2',
      timestamp: now - 3600000 * 4,
      durationMinutes: 25,
      mode: 'focus',
      category: 'Coding',
      taskTitle: 'Frontend Component Layout',
      completed: true,
    },
    {
      id: 'demo-3',
      timestamp: now - dayMs - 3600000 * 3,
      durationMinutes: 25,
      mode: 'focus',
      category: 'Coding',
      taskTitle: 'Database Schema & Server Sync',
      completed: true,
    },
    {
      id: 'demo-4',
      timestamp: now - dayMs - 3600000 * 5,
      durationMinutes: 25,
      mode: 'focus',
      category: 'Reading',
      taskTitle: 'Performance Optimizations',
      completed: true,
    },
    {
      id: 'demo-5',
      timestamp: now - dayMs * 2 - 3600000 * 2,
      durationMinutes: 50,
      mode: 'focus',
      category: 'Deep Work',
      taskTitle: 'Continuous Integration Flow',
      completed: true,
    },
    {
      id: 'demo-6',
      timestamp: now - dayMs * 3 - 3600000 * 4,
      durationMinutes: 25,
      mode: 'focus',
      category: 'Writing',
      taskTitle: 'Release Documentation',
      completed: true,
    },
    {
      id: 'demo-7',
      timestamp: now - dayMs * 4 - 3600000 * 3,
      durationMinutes: 25,
      mode: 'focus',
      category: 'Coding',
      taskTitle: 'Unit Test Coverage',
      completed: true,
    }
  ];

  const initialTasks: TaskItem[] = [
    {
      id: 'task-1',
      title: 'Finish daily focus milestones',
      category: 'Deep Work',
      estimatedPomodoros: 4,
      completedPomodoros: 2,
      isCompleted: false,
      createdAt: now - 3600000 * 5,
    },
    {
      id: 'task-2',
      title: 'Review pull requests and documentation',
      category: 'Reading',
      estimatedPomodoros: 2,
      completedPomodoros: 1,
      isCompleted: false,
      createdAt: now - 3600000 * 3,
    }
  ];

  return {
    settings: DEFAULT_SETTINGS,
    sessions: initialSessions,
    tasks: initialTasks,
    playlist: DEFAULT_PLAYLIST,
    dailyGoalMinutes: 120,
    dailyGoalPomodoros: 6,
    theme: 'dark',
    updatedAt: Date.now(),
  };
}

export function saveLocalData(data: SyncDataPayload) {
  try {
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save to localStorage:', err);
  }
}

// Remote API Sync Functions
export async function fetchRemoteSyncData(code: string): Promise<SyncDataPayload | null> {
  const clean = code.replace(/\D/g, '');
  if (clean.length !== 7) {
    return null;
  }

  try {
    const res = await fetch(`/api/sync/${clean}`);
    if (!res.ok) {
      return null;
    }

    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return null;
    }

    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('[Sync] Remote sync unavailable (e.g. static hosting like GitHub Pages):', err);
    return null;
  }
}

export async function pushRemoteSyncData(code: string, data: SyncDataPayload): Promise<boolean> {
  const clean = code.replace(/\D/g, '');
  if (clean.length !== 7) return false;

  try {
    const res = await fetch(`/api/sync/${clean}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data,
        updatedAt: Date.now(),
      }),
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to push remote sync data:', err);
    return false;
  }
}
