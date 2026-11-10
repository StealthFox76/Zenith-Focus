export interface ParsedMedia {
  type: 'youtube-video' | 'youtube-playlist' | 'spotify' | 'audio-direct' | 'unknown';
  embedUrl: string;
  sourceUrl: string;
  title?: string;
  videoId?: string;
}

export function extractVideoId(rawUrl: string): string | null {
  if (!rawUrl || !rawUrl.trim()) return null;
  const url = rawUrl.trim();

  // If already an 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    
    // 1. URL search param v=
    const vParam = parsed.searchParams.get('v');
    if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) {
      return vParam;
    }

    // 2. youtu.be/ID
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace(/^\//, '').split('/')[0].split('?')[0];
      if (/^[a-zA-Z0-9_-]{11}$/.test(id)) {
        return id;
      }
    }

    // 3. /embed/ID or /live/ID or /shorts/ID or /v/ID
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    const idx = pathParts.findIndex(p => ['embed', 'live', 'shorts', 'v'].includes(p));
    if (idx !== -1 && pathParts[idx + 1]) {
      const id = pathParts[idx + 1].split('?')[0];
      if (/^[a-zA-Z0-9_-]{11}$/.test(id)) {
        return id;
      }
    }
  } catch {
    // regex fallback
  }

  // Regex fallback
  const match = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

export function getVideoEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&playsinline=1&modestbranding=1`;
}

export const CURATED_FOCUS_SONGS = [
  {
    title: 'Lofi Girl - Chill Beats to Study/Relax',
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    category: 'Lofi',
    description: 'Iconic gentle beats for continuous study focus'
  },
  {
    title: 'Deep Focus Ambient & Electronic Synthesizer',
    url: 'https://www.youtube.com/watch?v=WPni755-Krg',
    category: 'Ambient',
    description: 'Binaural synthesizer textures for distraction-free coding'
  },
  {
    title: 'Peaceful Classical Concentration Piano',
    url: 'https://www.youtube.com/watch?v=4xDzrJKXOOY',
    category: 'Classical',
    description: 'Rich relaxing piano melodies composed for cognitive focus'
  },
  {
    title: 'Rain & Campfire Night Study Focus',
    url: 'https://www.youtube.com/watch?v=mPZkdNFkNps',
    category: 'Nature',
    description: 'Gentle raindrops with warm fireplace embers'
  },
  {
    title: 'Zelda & Chill - Relaxing Video Game Lofi',
    url: 'https://www.youtube.com/watch?v=GdzrrWA8e7A',
    category: 'Lofi Game',
    description: 'Nostalgic acoustic game soundtracks in chilled lo-fi'
  },
  {
    title: 'Coffee Shop Acoustic Ambience',
    url: 'https://www.youtube.com/watch?v=h2zkV-l_TbY',
    category: 'Acoustic',
    description: 'Warm cafe acoustics with subtle background rain'
  }
];

export function parsePlaylistUrl(rawUrl: string): ParsedMedia {
  if (!rawUrl || !rawUrl.trim()) {
    return {
      type: 'unknown',
      embedUrl: '',
      sourceUrl: '',
    };
  }

  const videoId = extractVideoId(rawUrl);
  if (videoId) {
    return {
      type: 'youtube-video',
      embedUrl: getVideoEmbedUrl(videoId),
      sourceUrl: rawUrl,
      title: 'YouTube Focus Video',
      videoId,
    };
  }

  // Spotify embed
  if (rawUrl.includes('spotify.com')) {
    try {
      const parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
      const pathParts = parsed.pathname.replace(/^\//, '').split('/');
      if (pathParts.length >= 2) {
        const [type, id] = pathParts;
        return {
          type: 'spotify',
          embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`,
          sourceUrl: rawUrl,
          title: 'Spotify Focus Music',
        };
      }
    } catch {
      // ignore
    }
  }

  // Direct Audio stream (.mp3, .ogg, etc.)
  if (rawUrl.match(/\.(mp3|m4a|ogg|wav)($|\?)/i)) {
    return {
      type: 'audio-direct',
      embedUrl: rawUrl,
      sourceUrl: rawUrl,
      title: 'Direct Audio Stream',
    };
  }

  return {
    type: 'unknown',
    embedUrl: rawUrl,
    sourceUrl: rawUrl,
  };
}

/**
 * Send Play, Pause, or Seek commands to YouTube iframe using postMessage
 */
export function controlYouTubeIframe(
  iframe: HTMLIFrameElement | null,
  action: 'play' | 'pause' | 'setVolume',
  arg?: number
) {
  if (!iframe || !iframe.contentWindow) return;

  try {
    if (action === 'play') {
      iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
      iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":[]}', '*');
    } else if (action === 'pause') {
      iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
      iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":[]}', '*');
    } else if (action === 'setVolume') {
      const vol = arg ?? 100;
      iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [vol] }), '*');
    }
  } catch (err) {
    console.warn('Could not postMessage to iframe:', err);
  }
}
