/**
 * PlaylistContext — Complete backend-integrated playlist state for WAHID
 *
 * Backend endpoints (all gracefully fall back if not yet deployed):
 *   GET  /api/playlist?mood=X          → weighted name list
 *   GET  /api/playlist/presets         → preset playlist definitions
 *   GET  /api/playlist/daily           → today's personalised playlist
 *   GET  /api/playlist/session         → saved session for resume
 *   POST /api/playlist/session         → { mood, trackIndex, title }
 *   GET  /api/playlist/favourites      → [nameNumber, ...]
 *   POST /api/playlist/favourites      → { nameNumber }
 *   DELETE /api/playlist/favourites/:n → remove favourite
 *   POST /api/mood-log                 → { mood, timestamp }
 *   GET  /api/insights                 → mood patterns + suggestions
 *
 * Provides:
 *   fetchPlaylist(mood)         async → name[]  (backend → weighted client fallback)
 *   presets                     PresetPlaylist[]
 *   fetchPresetPlaylist(id)     async → name[]
 *   dailyPlaylist               name[]  (loaded on mount)
 *   insights                    { topMood, suggestion, streakMood } | null
 *   favouriteIds                Set<number>
 *   toggleFavourite(num)        optimistic, backend-synced
 *   saveSession(mood,idx,title) AsyncStorage immediate + debounced backend
 *   resumeSession               { mood, trackIndex, title } | null
 *   clearResumeSession()
 *   logMood(mood)               fire-and-forget analytics
 *   moodHistory                 string[]  (last 10, most-recent first)
 *   activeQueue                 name[]    current playing queue
 *   setActiveQueue(names)       update queue
 */
import React, {
  createContext, useContext, useState, useEffect, useCallback, useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import http from '../config/http';
import { ENDPOINTS } from '../config/api';
import { useAuth } from './AuthContext';
import { useNames } from './NamesContext';

// ─── Preset playlist definitions (client-side, overridden by backend if available) ─
export const CLIENT_PRESETS = [
  {
    id: 'calm-journey',
    title: 'Calm Journey',
    subtitle: 'Peace & Tranquility',
    emoji: '🕊️',
    colors: ['#002E2E', '#004040', '#001818'],
    accent: '#2DD4BF',
    moods: ['seeking peace', 'peaceful', 'anxious', 'worried'],
    description: 'A guided journey through the names of peace and protection.',
  },
  {
    id: 'strength-courage',
    title: 'Strength & Courage',
    subtitle: 'Rise Through His Power',
    emoji: '⚡',
    colors: ['#1A0A2E', '#220D3B', '#100618'],
    accent: '#A78BFA',
    moods: ['powerless', 'fearful', 'overwhelmed', 'defeated', 'weak'],
    description: 'Draw strength from His names of power and might.',
  },
  {
    id: 'healing-forgiveness',
    title: 'Healing & Forgiveness',
    subtitle: 'Let Go & Be Free',
    emoji: '💚',
    colors: ['#0D1F0A', '#122614', '#081208'],
    accent: '#86EFAC',
    moods: ['seeking forgiveness', 'guilty', 'broken', 'grieving', 'sad'],
    description: 'His mercy is infinite. Return to Him with an open heart.',
  },
  {
    id: 'gratitude-practice',
    title: 'Gratitude Practice',
    subtitle: 'Count Your Blessings',
    emoji: '🌟',
    colors: ['#2D1E00', '#3D2A00', '#1A1100'],
    accent: '#FBBF24',
    moods: ['grateful', 'hopeful', 'seeking blessings'],
    description: 'Deepen your gratitude through the names of abundance.',
  },
  {
    id: 'morning-awakening',
    title: 'Morning Awakening',
    subtitle: 'Start With His Names',
    emoji: '🌅',
    colors: ['#0A1430', '#0D1A3D', '#060A1A'],
    accent: '#93C5FD',
    moods: ['hopeful', 'seeking blessings', 'distracted', 'purposeless'],
    description: 'Begin every day by connecting with His light.',
  },
  {
    id: 'night-dhikr',
    title: 'Night Dhikr',
    subtitle: 'Surrender Before Sleep',
    emoji: '🌙',
    colors: ['#0A0A14', '#141420', '#06060A'],
    accent: '#C4B5FD',
    moods: ['peaceful', 'seeking peace', 'grateful', 'hopeful'],
    description: 'A soothing evening reflection to close your day.',
  },
];

// ─── Insights suggestions ──────────────────────────────────────────────────────
const MOOD_SUGGESTIONS = {
  anxious:               { text: "You've been feeling anxious. Let His names bring calm.", presetId: 'calm-journey' },
  worried:               { text: 'His plan is perfect. Try the Calm Journey.', presetId: 'calm-journey' },
  'seeking peace':       { text: 'Continue your journey toward stillness.', presetId: 'calm-journey' },
  sad:                   { text: 'You are not alone. Try Healing & Forgiveness.', presetId: 'healing-forgiveness' },
  broken:                { text: 'He mends every broken heart. Try Healing.', presetId: 'healing-forgiveness' },
  grieving:              { text: 'His mercy surrounds you. Try Healing.', presetId: 'healing-forgiveness' },
  'seeking forgiveness': { text: 'His door is always open. Return to Him.', presetId: 'healing-forgiveness' },
  guilty:                { text: 'He forgives all sins. Seek His mercy.', presetId: 'healing-forgiveness' },
  grateful:              { text: 'Your gratitude is powerful. Keep practising.', presetId: 'gratitude-practice' },
  hopeful:               { text: 'Your hope is well-placed. Build your practice.', presetId: 'gratitude-practice' },
  powerless:             { text: 'His strength is yours to draw from.', presetId: 'strength-courage' },
  fearful:               { text: 'He is your protector. Find courage in His names.', presetId: 'strength-courage' },
  overwhelmed:           { text: 'He carries what you cannot. Try Strength & Courage.', presetId: 'strength-courage' },
};

// ─── Cache keys ────────────────────────────────────────────────────────────────
const CACHE_FAV     = 'playlist_favourites_v1';
const CACHE_SESSION = 'playlist_session_v1';
const CACHE_MOODS   = 'playlist_mood_history_v1';
const CACHE_DAILY   = 'playlist_daily_v1';       // { date, names[] }
const CACHE_PRESETS = 'playlist_presets_v1';

const PlaylistContext = createContext(null);

export const PlaylistProvider = ({ children }) => {
  const { token } = useAuth();
  const { getMoodPlaylist, getDailyPlaylist } = useNames();

  const [favouriteIds,  setFavouriteIds]  = useState(new Set());
  const [resumeSession, setResumeSession] = useState(null);
  const [moodHistory,   setMoodHistory]   = useState([]);
  const [presets,       setPresets]       = useState(CLIENT_PRESETS);
  const [dailyPlaylist, setDailyPlaylist] = useState([]);
  const [insights,      setInsights]      = useState(null);
  const [activeQueue,   setActiveQueue]   = useState([]);

  const sessionDebounce = useRef(null);

  // ── Bootstrap: load cache → sync backend ──────────────────────────────────
  useEffect(() => {
    loadFromCache();
  }, []);

  useEffect(() => {
    if (token) {
      syncFavourites();
      syncSession();
      syncPresets();
      syncInsights();
    }
  }, [token]);

  // Compute daily playlist once names are available (NamesContext loads async)
  useEffect(() => {
    loadDailyPlaylist();
  }, [getDailyPlaylist]);

  // Re-compute insights whenever mood history changes
  useEffect(() => {
    setInsights(computeInsights(moodHistory));
  }, [moodHistory]);

  // ── Cache loader ───────────────────────────────────────────────────────────
  const loadFromCache = async () => {
    try {
      const [favRaw, sessionRaw, moodRaw] = await Promise.all([
        AsyncStorage.getItem(CACHE_FAV),
        AsyncStorage.getItem(CACHE_SESSION),
        AsyncStorage.getItem(CACHE_MOODS),
      ]);
      if (favRaw)     setFavouriteIds(new Set(JSON.parse(favRaw).map(Number)));
      if (sessionRaw) setResumeSession(JSON.parse(sessionRaw));
      if (moodRaw)    setMoodHistory(JSON.parse(moodRaw));
    } catch (_) {}
  };

  // ── Daily playlist: backend → NamesContext fallback ───────────────────────
  const loadDailyPlaylist = useCallback(async () => {
    const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // 1. Try cache (only valid for today)
    try {
      const cached = await AsyncStorage.getItem(CACHE_DAILY);
      if (cached) {
        const { date, names } = JSON.parse(cached);
        if (date === todayKey && names?.length > 0) {
          setDailyPlaylist(names);
          return;
        }
      }
    } catch (_) {}

    // 2. Try backend
    if (token) {
      try {
        const res = await http.get(ENDPOINTS.playlistDaily);
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setDailyPlaylist(res.data.data);
          AsyncStorage.setItem(CACHE_DAILY, JSON.stringify({ date: todayKey, names: res.data.data }));
          return;
        }
      } catch (_) {}
    }

    // 3. Client-side fallback: NamesContext weighted daily generator
    const clientDaily = getDailyPlaylist();
    if (clientDaily.length > 0) {
      setDailyPlaylist(clientDaily);
      AsyncStorage.setItem(CACHE_DAILY, JSON.stringify({ date: todayKey, names: clientDaily }));
    }
  }, [token, getDailyPlaylist]);

  // ── Presets: backend → CLIENT_PRESETS fallback ────────────────────────────
  const syncPresets = async () => {
    try {
      const res = await http.get(ENDPOINTS.playlistPresets);
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setPresets(res.data.data);
        AsyncStorage.setItem(CACHE_PRESETS, JSON.stringify(res.data.data));
      }
    } catch (_) {
      // Use CLIENT_PRESETS (already set as default state)
      try {
        const cached = await AsyncStorage.getItem(CACHE_PRESETS);
        if (cached) setPresets(JSON.parse(cached));
      } catch (_2) {}
    }
  };

  // ── Favourites ─────────────────────────────────────────────────────────────
  const syncFavourites = async () => {
    try {
      const res = await http.get(ENDPOINTS.playlistFavourites);
      if (res.data?.success && Array.isArray(res.data.data)) {
        const ids = new Set(res.data.data.map(Number));
        setFavouriteIds(ids);
        AsyncStorage.setItem(CACHE_FAV, JSON.stringify([...ids]));
      }
    } catch (_) {}
  };

  const toggleFavourite = useCallback(async (nameNumber) => {
    const num   = Number(nameNumber);
    const isFav = favouriteIds.has(num);
    // Optimistic UI update immediately
    const next = new Set(favouriteIds);
    if (isFav) next.delete(num); else next.add(num);
    setFavouriteIds(next);
    AsyncStorage.setItem(CACHE_FAV, JSON.stringify([...next]));

    if (!token) return;
    try {
      if (isFav) {
        await http.delete(`${ENDPOINTS.playlistFavourites}/${num}`);
      } else {
        await http.post(ENDPOINTS.playlistFavourites, { nameNumber: num });
      }
    } catch (_) {
      // Revert on backend failure
      setFavouriteIds(new Set(favouriteIds));
      AsyncStorage.setItem(CACHE_FAV, JSON.stringify([...favouriteIds]));
    }
  }, [favouriteIds, token]);

  // ── Session persistence ────────────────────────────────────────────────────
  const syncSession = async () => {
    try {
      const res = await http.get(ENDPOINTS.playlistSession);
      if (res.data?.success && res.data.data) {
        const { mood, trackIndex, title } = res.data.data;
        const session = { mood, trackIndex, title: title || mood, savedAt: Date.now() };
        setResumeSession(session);
        AsyncStorage.setItem(CACHE_SESSION, JSON.stringify(session));
      }
    } catch (_) {}
  };

  const saveSession = useCallback((mood, trackIndex, title) => {
    const session = { mood, trackIndex, title: title || mood, savedAt: Date.now() };
    AsyncStorage.setItem(CACHE_SESSION, JSON.stringify(session)); // immediate
    clearTimeout(sessionDebounce.current);
    sessionDebounce.current = setTimeout(async () => {
      if (!token) return;
      try { await http.post(ENDPOINTS.playlistSession, { mood, trackIndex, title }); } catch (_) {}
    }, 2000);
  }, [token]);

  const clearResumeSession = useCallback(() => {
    setResumeSession(null);
    AsyncStorage.removeItem(CACHE_SESSION);
  }, []);

  // ── Mood logging ───────────────────────────────────────────────────────────
  const logMood = useCallback(async (mood) => {
    const updated = [mood, ...moodHistory.filter(m => m !== mood)].slice(0, 10);
    setMoodHistory(updated);
    AsyncStorage.setItem(CACHE_MOODS, JSON.stringify(updated));
    if (!token) return;
    try {
      await http.post(ENDPOINTS.moodLog, { mood, timestamp: new Date().toISOString() });
    } catch (_) {}
  }, [moodHistory, token]);

  // ── Insights ───────────────────────────────────────────────────────────────
  const syncInsights = async () => {
    try {
      const res = await http.get(ENDPOINTS.userInsights);
      if (res.data?.success && res.data.data) {
        setInsights(res.data.data);
      }
    } catch (_) {
      // computeInsights from local moodHistory already runs via useEffect above
    }
  };

  // ── Playlist generation ────────────────────────────────────────────────────
  // 1. Try backend (server-side weighted ranking)
  // 2. Client-side weighted fallback (NamesContext getMoodPlaylist)
  // 3. Apply favourites boost (raise favourited names to top)
  const fetchPlaylist = useCallback(async (mood) => {
    let items = [];

    if (token) {
      try {
        const res = await http.get(ENDPOINTS.playlist, { params: { mood } });
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          items = res.data.data;
        }
      } catch (_) {}
    }

    if (items.length === 0) {
      items = getMoodPlaylist(mood); // already weighted by learnedIds + masteredIds
    }

    // Apply favourites boost: push favourited names to the front
    if (favouriteIds.size > 0) {
      const favs   = items.filter(n => favouriteIds.has(Number(n.number)));
      const others = items.filter(n => !favouriteIds.has(Number(n.number)));
      items = [...favs, ...others];
    }

    return items;
  }, [token, getMoodPlaylist, favouriteIds]);

  // ── Preset playlist ────────────────────────────────────────────────────────
  const fetchPresetPlaylist = useCallback(async (presetId) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return [];

    // Union of all mood playlists for this preset's moods
    const seen  = new Set();
    const items = [];
    for (const mood of preset.moods) {
      const moodItems = getMoodPlaylist(mood);
      moodItems.forEach(n => {
        if (!seen.has(n.number)) { seen.add(n.number); items.push(n); }
      });
    }
    return items;
  }, [presets, getMoodPlaylist]);

  return (
    <PlaylistContext.Provider value={{
      // Playlist generation
      fetchPlaylist,
      fetchPresetPlaylist,
      // Presets
      presets,
      // Daily playlist
      dailyPlaylist,
      refreshDailyPlaylist: loadDailyPlaylist,
      // Favourites
      favouriteIds,
      toggleFavourite,
      // Session
      saveSession,
      resumeSession,
      clearResumeSession,
      // Mood logging + personalization
      logMood,
      moodHistory,
      insights,
      // Queue
      activeQueue,
      setActiveQueue,
    }}>
      {children}
    </PlaylistContext.Provider>
  );
};

export const usePlaylist = () => {
  const ctx = useContext(PlaylistContext);
  if (!ctx) throw new Error('usePlaylist must be inside PlaylistProvider');
  return ctx;
};

// ── Pure helper: compute insights from local mood history ────────────────────
function computeInsights(moodHistory) {
  if (!moodHistory || moodHistory.length === 0) return null;

  const counts = moodHistory.reduce((acc, m) => ({ ...acc, [m]: (acc[m] || 0) + 1 }), {});
  const streakMood = Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0];
  const topMood    = moodHistory[0];
  const suggestion = MOOD_SUGGESTIONS[streakMood] || MOOD_SUGGESTIONS[topMood] || null;

  return { topMood, streakMood, suggestion };
}
