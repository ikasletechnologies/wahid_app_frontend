import React, {
  createContext, useContext, useState, useEffect, useCallback, useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import http from '../config/http';
import { ENDPOINTS } from '../config/api';
import { useAuth } from './AuthContext';
import { useNames } from './NamesContext';

export const CLIENT_PRESETS = [
  { id: 'calm-journey', title: 'Calm Journey', subtitle: 'Peace & Tranquility', emoji: '🕊️', colors: ['#002E2E', '#004040', '#001818'], accent: '#2DD4BF', moods: ['seeking peace', 'peaceful', 'anxious', 'worried'], description: 'A guided journey through the names of peace and protection.' },
  { id: 'strength-courage', title: 'Strength & Courage', subtitle: 'Rise Through His Power', emoji: '⚡', colors: ['#1A0A2E', '#220D3B', '#100618'], accent: '#A78BFA', moods: ['powerless', 'fearful', 'overwhelmed', 'defeated', 'weak'], description: 'Draw strength from His names of power and might.' },
  { id: 'healing-forgiveness', title: 'Healing & Forgiveness', subtitle: 'Let Go & Be Free', emoji: '💚', colors: ['#0D1F0A', '#122614', '#081208'], accent: '#86EFAC', moods: ['seeking forgiveness', 'guilty', 'broken', 'grieving', 'sad'], description: 'His mercy is infinite. Return to Him with an open heart.' },
];

const CACHE_FAV     = 'playlist_favourites_v1';
const CACHE_SESSION = 'playlist_session_v1';
const CACHE_MOODS   = 'playlist_mood_history_v1';
const CACHE_DAILY   = 'playlist_daily_v1';
const CACHE_RECENT  = 'playlist_recent_v1';

const PlaylistContext = createContext(null);

export const PlaylistProvider = ({ children }) => {
  const { token } = useAuth();
  const { getMoodPlaylist, getDailyPlaylist } = useNames();

  const [favouriteIds, setFavouriteIds] = useState(new Set());
  const [resumeSession, setResumeSession] = useState(null);
  const [moodHistory, setMoodHistory] = useState([]);
  const [presets, setPresets] = useState(CLIENT_PRESETS);
  const [dailyPlaylist, setDailyPlaylist] = useState([]);
  const [customPlaylists, setCustomPlaylists] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [shuffleMode, setShuffleMode] = useState(false);

  // ── Global Player State ──
  const [activeQueue, setActiveQueue] = useState([]);
  const [queueTitle, setQueueTitle] = useState('');
  const [playingId, setPlayingId] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loopMode, setLoopMode] = useState('none'); // 'none' | 'playlist' | 'track'
  const [playMode, setPlayMode] = useState('normal');

  // Progress tracking
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);

  const sessionDebounce = useRef(null);
  const autoNextTimer  = useRef(null);
  const progressInterval = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => { loadFromCache(); }, []);

  useEffect(() => {
    if (token) {
      syncFavourites();
      syncSession();
      syncPresets();
      fetchCustomPlaylists();
    }
  }, [token]);

  useEffect(() => { loadDailyPlaylist(); }, [getDailyPlaylist]);

  const loadFromCache = async () => {
    try {
      const [favRaw, sessionRaw, moodRaw, recentRaw] = await Promise.all([
        AsyncStorage.getItem(CACHE_FAV),
        AsyncStorage.getItem(CACHE_SESSION),
        AsyncStorage.getItem(CACHE_MOODS),
        AsyncStorage.getItem(CACHE_RECENT),
      ]);
      if (favRaw)    setFavouriteIds(new Set(JSON.parse(favRaw).map(Number)));
      if (sessionRaw) setResumeSession(JSON.parse(sessionRaw));
      if (moodRaw)   setMoodHistory(JSON.parse(moodRaw));
      if (recentRaw) setRecentlyPlayed(JSON.parse(recentRaw));
    } catch (_) {}
  };

  const loadDailyPlaylist = useCallback(async () => {
    const todayKey = new Date().toISOString().slice(0, 10);
    try {
      const cached = await AsyncStorage.getItem(CACHE_DAILY);
      if (cached) {
        const { date, names } = JSON.parse(cached);
        if (date === todayKey && names?.length > 0) { setDailyPlaylist(names); return; }
      }
    } catch (_) {}

    if (token) {
      try {
        const res = await http.get(ENDPOINTS.playlistDaily);
        // Backend returns { success, names: [...] }
        if (res.data?.success && res.data.names?.length > 0) {
          setDailyPlaylist(res.data.names);
          AsyncStorage.setItem(CACHE_DAILY, JSON.stringify({ date: todayKey, names: res.data.names }));
          return;
        }
      } catch (_) {}
    }

    const clientDaily = getDailyPlaylist();
    if (clientDaily.length > 0) {
      setDailyPlaylist(clientDaily);
      AsyncStorage.setItem(CACHE_DAILY, JSON.stringify({ date: todayKey, names: clientDaily }));
    }
  }, [token, getDailyPlaylist]);

  const syncPresets = async () => {
    try {
      const res = await http.get(ENDPOINTS.playlistPresets);
      if (res.data?.success && res.data.data?.length > 0) setPresets(res.data.data);
    } catch (_) {}
  };

  const fetchCustomPlaylists = async () => {
    try {
      const res = await http.get('/api/playlist/custom');
      if (res.data?.success) setCustomPlaylists(res.data.playlists || []);
    } catch (_) {}
  };

  const createPlaylist = async (name) => {
    if (!token || !name.trim()) return;
    try {
      // Backend requires both name and nameNumbers (starts empty)
      const res = await http.post('/api/playlist/custom', { name, nameNumbers: [] });
      if (res.data?.success) {
        const p = res.data.playlist;
        setCustomPlaylists(prev => [...prev, p]);
        return p;
      }
    } catch (_) {}
  };

  const deletePlaylist = async (id) => {
    if (!token) return;
    // Optimistic update
    setCustomPlaylists(prev => prev.filter(p => p.id !== id));
    try {
      // Backend expects DELETE /api/playlist/custom with body { id }
      await http.delete('/api/playlist/custom', { data: { id } });
    } catch (_) {
      // Re-fetch on failure
      fetchCustomPlaylists();
    }
  };

  const addToPlaylist = async (playlistId, nameNumber) => {
    if (!token) return;
    const num = Number(nameNumber);
    const playlist = customPlaylists.find(p => p.id === playlistId);
    const currentNums = playlist?.nameNumbers || [];
    if (currentNums.includes(num)) return;
    const updatedNums = [...currentNums, num];
    // Optimistic update
    setCustomPlaylists(prev => prev.map(p =>
      p.id === playlistId ? { ...p, nameNumbers: updatedNums } : p
    ));
    try {
      // Backend: PUT /api/playlist/custom replaces entire nameNumbers array
      await http.put('/api/playlist/custom', { id: playlistId, nameNumbers: updatedNums });
    } catch (_) {
      // Revert on failure
      setCustomPlaylists(prev => prev.map(p =>
        p.id === playlistId ? { ...p, nameNumbers: currentNums } : p
      ));
    }
  };

  const removeFromPlaylist = async (playlistId, nameNumber) => {
    if (!token) return;
    const playlist = customPlaylists.find(p => p.id === playlistId);
    const currentNums = playlist?.nameNumbers || [];
    const updatedNums = currentNums.filter(n => n !== nameNumber);
    // Optimistic update
    setCustomPlaylists(prev => prev.map(p =>
      p.id === playlistId ? { ...p, nameNumbers: updatedNums } : p
    ));
    try {
      await http.put('/api/playlist/custom', { id: playlistId, nameNumbers: updatedNums });
    } catch (_) {
      setCustomPlaylists(prev => prev.map(p =>
        p.id === playlistId ? { ...p, nameNumbers: currentNums } : p
      ));
    }
  };

  const syncFavourites = async () => {
    try {
      const res = await http.get(ENDPOINTS.playlistFavourites);
      // Backend returns { success, favourites: [1, 2, 3, ...] }
      if (res.data?.success && Array.isArray(res.data.favourites)) {
        const ids = new Set(res.data.favourites.map(Number));
        setFavouriteIds(ids);
        AsyncStorage.setItem(CACHE_FAV, JSON.stringify([...ids]));
      }
    } catch (_) {}
  };

  const toggleFavourite = useCallback(async (nameNumber) => {
    const num = Number(nameNumber);
    const isFav = favouriteIds.has(num);
    const next = new Set(favouriteIds);
    if (isFav) next.delete(num); else next.add(num);
    setFavouriteIds(next);
    AsyncStorage.setItem(CACHE_FAV, JSON.stringify([...next]));

    if (!token) return;
    try {
      if (isFav) {
        // Backend: DELETE /api/playlist/favourites with body { nameNumber }
        await http.delete(ENDPOINTS.playlistFavourites, { data: { nameNumber: num } });
      } else {
        await http.post(ENDPOINTS.playlistFavourites, { nameNumber: num });
      }
    } catch (_) {
      // Revert on failure
      setFavouriteIds(new Set(favouriteIds));
    }
  }, [favouriteIds, token]);

  const syncSession = async () => {
    try {
      const res = await http.get(ENDPOINTS.playlistSession);
      if (res.data?.success && res.data.session) setResumeSession(res.data.session);
    } catch (_) {}
  };

  const saveSession = useCallback((mood, trackIndex, title) => {
    const session = { mood, trackIndex, title: title || mood, savedAt: Date.now() };
    setResumeSession(session);
    clearTimeout(sessionDebounce.current);
    sessionDebounce.current = setTimeout(async () => {
      if (!token) return;
      try { await http.post(ENDPOINTS.playlistSession, { mood, trackIndex, title }); } catch (_) {}
    }, 2000);
  }, [token]);

  const clearResumeSession = useCallback(() => setResumeSession(null), []);

  // Add a track to recently played (max 25, no duplicates)
  const addToRecent = useCallback((item) => {
    if (!item) return;
    setRecentlyPlayed(prev => {
      const filtered = prev.filter(n => n.number !== item.number);
      const updated = [item, ...filtered].slice(0, 25);
      AsyncStorage.setItem(CACHE_RECENT, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const toggleShuffle = useCallback(() => setShuffleMode(s => !s), []);

  const buildText = useCallback((item) => {
    const parts = [`${item.transliteration} — ${item.meaning}.`];
    const benefits = Array.isArray(item.benefits)
      ? item.benefits.join('. ')
      : (item.benefits_of_learning || item.benefits || '');
    if (benefits?.trim()) parts.push(`Benefits: ${benefits}`);
    if (item.reflection)  parts.push(`Reflection: ${item.reflection}`);
    if (playMode === 'guided') parts.push('Take a moment to reflect on this name.');
    return parts.join(' ');
  }, [playMode]);

  const estimateDurationMs = (text, rate = 0.88) => {
    const words = text.trim().split(/\s+/).length;
    const wordsPerSec = (rate * 150) / 60; // rough wpm estimation
    return Math.max(6000, (words / wordsPerSec) * 1000);
  };

  // Refs to avoid stale closures in callbacks
  const activeQueueRef = useRef(activeQueue);
  useEffect(() => { activeQueueRef.current = activeQueue; }, [activeQueue]);

  const speakAtIdx = useCallback((idx) => {
    const pl = activeQueueRef.current;
    const item = pl[idx];
    if (!item) return;

    clearTimeout(autoNextTimer.current);
    clearInterval(progressInterval.current);
    Speech.stop();

    const text = buildText(item);
    const estDur = estimateDurationMs(text, playMode === 'guided' ? 0.80 : 0.88);

    setCurrentIdx(idx);
    setPlayingId(item.number);
    setElapsed(0);
    setDuration(estDur);
    startTimeRef.current = Date.now();

    saveSession('session', idx, queueTitle);
    addToRecent(item);

    // Start progress interval
    progressInterval.current = setInterval(() => {
      const e = Date.now() - startTimeRef.current;
      setElapsed(prev => Math.min(e, estDur));
    }, 250);

    Speech.speak(text, {
      language: 'en-US',
      rate: playMode === 'guided' ? 0.80 : 0.88,
      onDone: () => {
        clearInterval(progressInterval.current);
        setPlayingId(null);
        setElapsed(estDur);

        const pauseMs = playMode === 'guided' ? 3000 : 1500;
        autoNextTimer.current = setTimeout(() => {
          const pl2 = activeQueueRef.current;
          let nextIdx;

          // Loop Mode Logic
          if (loopMode === 'track') {
            nextIdx = idx;
          } else if (shuffleMode && pl2.length > 1) {
            do { nextIdx = Math.floor(Math.random() * pl2.length); } while (nextIdx === idx);
          } else {
            nextIdx = idx + 1 < pl2.length ? idx + 1 : loopMode === 'playlist' ? 0 : -1;
          }

          if (nextIdx >= 0) speakAtIdx(nextIdx);
        }, pauseMs);
      },
      onStopped: () => {
        clearInterval(progressInterval.current);
        setPlayingId(null);
        clearTimeout(autoNextTimer.current);
      },
      onError: () => {
        clearInterval(progressInterval.current);
        setPlayingId(null);
        clearTimeout(autoNextTimer.current);
      },
    });
  }, [buildText, saveSession, addToRecent, loopMode, shuffleMode, playMode, queueTitle]);

  const playQueue = useCallback((newQueue, title, startIdx = 0, mode = 'normal') => {
    Speech.stop();
    clearTimeout(autoNextTimer.current);
    setActiveQueue(newQueue);
    setQueueTitle(title);
    setCurrentIdx(startIdx);
    setPlayMode(mode);
    // Small timeout ensures activeQueueRef is updated before speak
    setTimeout(() => { speakAtIdx(startIdx); }, 80);
  }, [speakAtIdx]);

  const playPreset = useCallback((preset) => {
    let tracks = preset.tracks || [];
    if (tracks.length === 0 && preset.moods) {
      const seen = new Set();
      preset.moods.forEach(m => {
        getMoodPlaylist(m).forEach(t => {
          if (!seen.has(t.number)) { seen.add(t.number); tracks.push(t); }
        });
      });
      tracks = tracks.slice(0, 15);
    }
    if (tracks.length > 0) playQueue(tracks, preset.title, 0, 'guided');
  }, [getMoodPlaylist, playQueue]);

  const togglePlay = useCallback(() => {
    if (playingId !== null) {
      Speech.stop();
      clearInterval(progressInterval.current);
      clearTimeout(autoNextTimer.current);
      setPlayingId(null);
    } else if (activeQueue.length > 0) {
      // Resume from currentIdx
      speakAtIdx(currentIdx);
    }
  }, [playingId, activeQueue, currentIdx, speakAtIdx]);

  const nextTrack = useCallback(() => {
    if (loopMode === 'track') {
      speakAtIdx(currentIdx);
      return;
    }
    if (shuffleMode && activeQueue.length > 1) {
      let r;
      do { r = Math.floor(Math.random() * activeQueue.length); } while (r === currentIdx);
      speakAtIdx(r);
      return;
    }
    const nextIdx = currentIdx + 1 < activeQueue.length ? currentIdx + 1 : loopMode === 'playlist' ? 0 : -1;
    if (nextIdx >= 0) speakAtIdx(nextIdx);
  }, [currentIdx, activeQueue, loopMode, shuffleMode, speakAtIdx]);

  const prevTrack = useCallback(() => {
    const pdx = currentIdx > 0 ? currentIdx - 1 : loopMode === 'playlist' ? activeQueue.length - 1 : 0;
    speakAtIdx(pdx);
  }, [currentIdx, activeQueue, loopMode, speakAtIdx]);

  const activeTrack = activeQueue[currentIdx] || null;

  return (
    <PlaylistContext.Provider value={{
      presets,
      dailyPlaylist,
      customPlaylists,
      fetchCustomPlaylists,
      favouriteIds,
      toggleFavourite,
      saveSession,
      resumeSession,
      clearResumeSession,
      recentlyPlayed,
      addToRecent,
      shuffleMode,
      toggleShuffle,
      // Global Player
      activeQueue,
      queueTitle,
      playingId,
      currentIdx,
      loopMode,
      setLoopMode,
      elapsed,
      duration,
      progress: duration > 0 ? elapsed / duration : 0,
      playMode,
      setPlayMode,
      playQueue,
      playPreset,
      togglePlay,
      nextTrack,
      prevTrack,
      createPlaylist,
      deletePlaylist,
      addToPlaylist,
      removeFromPlaylist,
      activeTrack,
      isPlaying: playingId !== null,
      currentTrackText: activeTrack ? buildText(activeTrack) : '',
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
