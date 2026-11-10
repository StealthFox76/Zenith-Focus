export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

export interface TimerSettings {
  focusDuration: number; // in minutes (e.g. 25)
  shortBreakDuration: number; // in minutes (e.g. 5)
  longBreakDuration: number; // in minutes (e.g. 15)
  longBreakInterval: number; // sessions before long break (e.g. 4)
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  soundAlert: 'singingBowl' | 'chime' | 'marimba' | 'digital' | 'none';
  volume: number; // 0 to 1
  ambientSound: 'none' | 'rain' | 'whitenoise' | 'forest' | 'waves';
  ambientVolume: number; // 0 to 1
}

export interface FocusSession {
  id: string;
  timestamp: number; // unix ms
  durationMinutes: number;
  mode: TimerMode;
  category: string;
  taskTitle?: string;
  completed: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  category: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
  isCompleted: boolean;
  createdAt: number;
}

export interface SongItem {
  id: string;
  url: string;
  title: string;
  videoId?: string;
  addedAt: number;
}

export interface PlaylistState {
  songs: SongItem[];
  currentIndex: number;
  autoPlayOnFocus: boolean;
  loop: boolean;
  isPlaying: boolean;
  volume: number; // 0 - 100
  url?: string;
  customTitle?: string;
}

export interface SyncDataPayload {
  settings: TimerSettings;
  sessions: FocusSession[];
  tasks: TaskItem[];
  playlist: PlaylistState;
  dailyGoalMinutes: number;
  dailyGoalPomodoros: number;
  theme: 'dark' | 'light';
  updatedAt: number;
}
