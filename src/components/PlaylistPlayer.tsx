import React, { useState } from 'react';
import {
  Music,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Repeat,
  Sparkles,
  ExternalLink,
  Check,
  ListMusic,
  Radio,
} from 'lucide-react';
import { PlaylistState, SongItem } from '../types';
import { extractVideoId, CURATED_FOCUS_SONGS } from '../utils/youtube';

interface PlaylistPlayerProps {
  playlist: PlaylistState;
  onUpdatePlaylist: (newPlaylist: Partial<PlaylistState>) => void;
  isFocusRunning: boolean;
  onPlaySongAtIndex: (index: number) => void;
  onNextSong: () => void;
  onPrevSong: () => void;
  onManualPlay: () => void;
  onManualPause: () => void;
  playerNode: React.ReactNode;
}

export const PlaylistPlayer: React.FC<PlaylistPlayerProps> = ({
  playlist,
  onUpdatePlaylist,
  isFocusRunning,
  onPlaySongAtIndex,
  onNextSong,
  onPrevSong,
  onManualPlay,
  onManualPause,
  playerNode,
}) => {
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const songs = playlist.songs || [];
  const currentIndex = Math.min(Math.max(0, playlist.currentIndex || 0), Math.max(0, songs.length - 1));
  const currentSong = songs[currentIndex] || null;

  const showFeedback = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddSong = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newUrl.trim()) return;

    const trimmedUrl = newUrl.trim();
    const videoId = extractVideoId(trimmedUrl);

    const titleToUse = newTitle.trim() || (videoId ? `Focus Video (${videoId})` : 'Custom Audio Track');

    const newSong: SongItem = {
      id: `song-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      url: trimmedUrl,
      title: titleToUse,
      videoId: videoId || undefined,
      addedAt: Date.now(),
    };

    const updatedSongs = [...songs, newSong];
    onUpdatePlaylist({
      songs: updatedSongs,
    });

    setNewUrl('');
    setNewTitle('');
    showFeedback(`Added "${titleToUse}" to your Song List!`);
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setNewUrl(text);
        showFeedback('URL pasted from clipboard');
      }
    } catch {
      // clipboard access restricted
    }
  };

  const handleRemoveSong = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (songs.length <= 1) {
      showFeedback('Keep at least one song in your list');
      return;
    }

    const removeIndex = songs.findIndex((s) => s.id === id);
    const updatedSongs = songs.filter((s) => s.id !== id);

    let nextIndex = currentIndex;
    if (removeIndex < currentIndex) {
      nextIndex = Math.max(0, currentIndex - 1);
    } else if (removeIndex === currentIndex) {
      nextIndex = Math.min(currentIndex, updatedSongs.length - 1);
    }

    onUpdatePlaylist({
      songs: updatedSongs,
      currentIndex: nextIndex,
    });
    showFeedback('Removed song from list');
  };

  const handleMoveSong = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= songs.length) return;

    const updatedSongs = [...songs];
    const temp = updatedSongs[index];
    updatedSongs[index] = updatedSongs[targetIndex];
    updatedSongs[targetIndex] = temp;

    // Track active song index reposition
    let nextCurrent = currentIndex;
    if (currentIndex === index) {
      nextCurrent = targetIndex;
    } else if (currentIndex === targetIndex) {
      nextCurrent = index;
    }

    onUpdatePlaylist({
      songs: updatedSongs,
      currentIndex: nextCurrent,
    });
  };

  const handleAddCurated = (curated: typeof CURATED_FOCUS_SONGS[0]) => {
    const videoId = extractVideoId(curated.url);
    const newSong: SongItem = {
      id: `song-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      url: curated.url,
      title: curated.title,
      videoId: videoId || undefined,
      addedAt: Date.now(),
    };

    onUpdatePlaylist({
      songs: [...songs, newSong],
    });
    showFeedback(`Added "${curated.title}" to Song List!`);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <ListMusic className="w-6 h-6 text-amber-500" />
            <span>Zenith Song List & Playlist Queue</span>
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Build your own focus playlist with individual video links. When one song ends, the next plays automatically, looping back to the beginning when finished.
          </p>
        </div>

        {/* Global Loop & Auto-Play Badges */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const nextLoop = !playlist.loop;
              onUpdatePlaylist({ loop: nextLoop });
              showFeedback(nextLoop ? 'Continuous playlist looping enabled' : 'Playlist loop disabled');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              playlist.loop
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500'
            }`}
            title="Automatically loop back to the first song when the list finishes"
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Loop Playlist: {playlist.loop ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Embedded Video Display & Now Playing Controller */}
      <div className="bg-neutral-900 dark:bg-black rounded-3xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-xl mb-6">
        {/* Top bar of player */}
        <div className="px-4 py-3 bg-neutral-800/90 dark:bg-neutral-900/90 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-300 border-b border-neutral-700/60 dark:border-neutral-800">
          <div className="flex items-center gap-2.5 truncate max-w-md">
            <Radio className={`w-3.5 h-3.5 shrink-0 ${isFocusRunning ? 'text-amber-500 animate-pulse' : 'text-neutral-400'}`} />
            <span className="text-[11px] font-mono text-neutral-400 uppercase">
              Track {currentIndex + 1} of {songs.length}
            </span>
            <span className="text-neutral-400">·</span>
            <span className="font-semibold text-neutral-100 truncate">
              {currentSong ? currentSong.title : 'No song selected'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {currentSong && (
              <a
                href={currentSong.url}
                target="_blank"
                rel="noreferrer"
                className="text-neutral-400 hover:text-white flex items-center gap-1 transition-colors text-[11px]"
                title="Open this song directly in YouTube"
              >
                <span>Watch on YouTube</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Video Screen Slot */}
        <div className="w-full h-64 sm:h-80 bg-black flex items-center justify-center relative">
          {playerNode}
        </div>

        {/* Playback Transport Controls */}
        <div className="px-4 sm:px-6 py-3.5 bg-neutral-950 flex flex-wrap items-center justify-between gap-4 border-t border-neutral-800">
          <div className="flex items-center gap-2">
            <button
              onClick={onPrevSong}
              disabled={songs.length <= 1}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors disabled:opacity-40"
              title="Previous song"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={onManualPlay}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-neutral-950 font-semibold text-xs hover:bg-amber-400 transition-all shadow-sm active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play</span>
            </button>

            <button
              onClick={onManualPause}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-800 text-neutral-200 font-semibold text-xs hover:bg-neutral-700 transition-all shadow-sm active:scale-95"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </button>

            <button
              onClick={onNextSong}
              disabled={songs.length <= 1}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors disabled:opacity-40"
              title="Next song"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Auto-Play on Focus Setting */}
          <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
            <input
              type="checkbox"
              checked={playlist.autoPlayOnFocus}
              onChange={(e) => onUpdatePlaylist({ autoPlayOnFocus: e.target.checked })}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-neutral-700 bg-neutral-900 cursor-pointer"
            />
            <span>Auto-play when focus timer starts · Auto-pause on break</span>
          </label>
        </div>
      </div>

      {/* Add New Song URL Form */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-5 mb-8 shadow-xs">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1 flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-amber-500" />
          <span>Add Song to Playlist</span>
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
          Paste any YouTube video link (e.g. <code className="font-mono text-neutral-700 dark:text-neutral-300">youtube.com/watch?v=...</code> or <code className="font-mono text-neutral-700 dark:text-neutral-300">youtu.be/...</code>).
        </p>

        <form onSubmit={handleAddSong} className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              required
              placeholder="Paste YouTube Video URL (e.g. https://youtu.be/...)"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
            />

            <input
              type="text"
              placeholder="Song title (optional)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="sm:w-56 px-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
            />

            <button
              type="button"
              onClick={handlePasteClipboard}
              className="px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
              title="Paste from clipboard"
            >
              Paste
            </button>

            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-xs whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Song</span>
            </button>
          </div>

          {notification && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-fadeIn">
              <Check className="w-3.5 h-3.5" />
              <span>{notification}</span>
            </div>
          )}
        </form>
      </div>

      {/* The Song List Queue */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 mb-8 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span>Your Song Queue</span>
              <span className="text-xs font-normal text-neutral-500">
                ({songs.length} {songs.length === 1 ? 'song' : 'songs'})
              </span>
            </h3>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Click any song to jump to it. Automatically progresses to the next song when one ends.
            </span>
          </div>

          <div className="text-xs font-mono text-neutral-400">
            {playlist.loop ? 'Auto-looping at end' : 'Plays to end'}
          </div>
        </div>

        <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80 max-h-96 overflow-y-auto">
          {songs.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              No songs in your list yet. Add one above or choose from curated focus tracks below!
            </div>
          ) : (
            songs.map((song, idx) => {
              const isPlayingThis = idx === currentIndex;
              return (
                <div
                  key={song.id}
                  onClick={() => onPlaySongAtIndex(idx)}
                  className={`py-3 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 group my-1 ${
                    isPlayingThis
                      ? 'bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-800/80'
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate pr-2">
                    {/* Index or Playing indicator */}
                    <div className="w-6 text-center shrink-0">
                      {isPlayingThis ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block animate-pulse" />
                      ) : (
                        <span className="text-xs font-mono text-neutral-400">{idx + 1}</span>
                      )}
                    </div>

                    <div className="truncate">
                      <span className={`text-xs sm:text-sm block truncate ${isPlayingThis ? 'font-bold text-amber-900 dark:text-amber-200' : 'font-medium text-neutral-800 dark:text-neutral-200'}`}>
                        {song.title}
                      </span>
                      <span className="text-[11px] font-mono text-neutral-400 block truncate">
                        {song.videoId ? `YouTube ID: ${song.videoId}` : song.url}
                      </span>
                    </div>
                  </div>

                  {/* Actions: Move Up / Down, Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isPlayingThis && (
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-semibold mr-1">
                        Now Playing
                      </span>
                    )}

                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={(e) => handleMoveSong(idx, 'up', e)}
                      className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors disabled:opacity-20"
                      title="Move up in queue"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      disabled={idx === songs.length - 1}
                      onClick={(e) => handleMoveSong(idx, 'down', e)}
                      className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors disabled:opacity-20"
                      title="Move down in queue"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleRemoveSong(song.id, e)}
                      className="p-1 text-neutral-400 hover:text-rose-500 transition-colors ml-1"
                      title="Remove from song list"
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

      {/* Curated Individual Focus Songs (1-Click Add) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Curated Focus Tracks (1-Click Add to List)</span>
          </h3>
          <span className="text-xs text-neutral-400 dark:text-neutral-500">Add individual songs to build your mix</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {CURATED_FOCUS_SONGS.map((curated) => {
            const alreadyInList = songs.some((s) => s.url === curated.url);
            return (
              <div
                key={curated.title}
                className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 flex flex-col justify-between gap-2.5 text-left"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {curated.title}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400 uppercase shrink-0">
                      {curated.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-2">
                    {curated.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddCurated(curated)}
                  className={`flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
                    alreadyInList
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      : 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-white'
                  }`}
                >
                  <Plus className="w-3 h-3" />
                  <span>{alreadyInList ? 'Add Again' : 'Add to List'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
