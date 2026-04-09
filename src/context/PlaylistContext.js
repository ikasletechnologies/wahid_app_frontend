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

const CACHE_FAV = 'playlist_favourites_v1';
const CACHE_SESSION = 'playlist_session_v1';
const CACHE_MOODS = 'playlist_mood_history_v1';
const CACHE_DAILY = 'playlist_daily_v1';
const CACHE_PRESETS = 'playlist_presets_v1';

const PlaylistContext = createContext(null);

export const PlaylistProvider = ({ children }) => {
  const { token } = useAuth();
  const { getMoodPlaylist, getDailyPlaylist } = useNames();

  const [favouriteIds, setFavouriteIds] = useState(new Set());
  const [resumeSession, setResumeSession] = useState(null);
  const [moodHistory, setMoodHistory] = useState([]);
  const [presets, setPresets] = useState(CLIENT_PRESETS);
  const [dailyPlaylist, setDailyPlaylist] = useState([]);
  const [insights, setInsights] = useState(null);
  const [customPlaylists, setCustomPlaylists] = useState([]);
  
  // ── Global Player State ──
  const [activeQueue, setActiveQueue] = useState([]);
  const [queueTitle, setQueueTitle] = useState("");
  const [playingId, setPlayingId] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isLoop, setIsLoop] = useState(false);
  const [playMode, setPlayMode] = useState('normal');

  const sessionDebounce = useRef(null);
  const autoNextTimer = useRef(null);

  // Sync caches
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
      const [favRaw, sessionRaw, moodRaw] = await Promise.all([
        AsyncStorage.getItem(CACHE_FAV), AsyncStorage.getItem(CACHE_SESSION), AsyncStorage.getItem(CACHE_MOODS)
      ]);
      if (favRaw) setFavouriteIds(new Set(JSON.parse(favRaw).map(Number)));
      if (sessionRaw) setResumeSession(JSON.parse(sessionRaw));
      if (moodRaw) setMoodHistory(JSON.parse(moodRaw));
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
        if (res.data?.success && res.data.data?.length > 0) {
          setDailyPlaylist(res.data.data);
          AsyncStorage.setItem(CACHE_DAILY, JSON.stringify({ date: todayKey, names: res.data.data }));
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
      if (res.data?.success && res.data.data?.length > 0) {
        setPresets(res.data.data);
      }
    } catch (_) {}
  };

  const fetchCustomPlaylists = async () => {
    try {
      const res = await http.get('/api/playlist/custom');
      if (res.data?.success) setCustomPlaylists(res.data.playlists);
    } catch (_) {}
  };

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
    const num = Number(nameNumber);
    const isFav = favouriteIds.has(num);
    const next = new Set(favouriteIds);
    if (isFav) next.delete(num); else next.add(num);
    setFavouriteIds(next);
    AsyncStorage.setItem(CACHE_FAV, JSON.stringify([...next]));

    if (!token) return;
    try {
      if (isFav) await http.delete(`${ENDPOINTS.playlistFavourites}/${num}`);
      else await http.post(ENDPOINTS.playlistFavourites, { nameNumber: num });
    } catch (_) {
      setFavouriteIds(new Set(favouriteIds));
    }
  }, [favouriteIds, token]);

  const syncSession = async () => {
    try {
      const res = await http.get(ENDPOINTS.playlistSession);
      if (res.data?.success && res.data.session) {
        setResumeSession(res.data.session);
      }
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

  const clearResumeSession = useCallback(() => {
    setResumeSession(null);
  }, []);

  const buildText = useCallback((item) => {
    const parts = [`${item.transliteration} — ${item.meaning}.`];
    const benefits = Array.isArray(item.benefits) ? item.benefits.join('. ') : (item.benefits_of_learning || item.benefits || '');
    if (benefits?.trim()) parts.push(`Benefits: ${benefits}`);
    if (item.reflection) parts.push(`Reflection: ${item.reflection}`);
    if (playMode === 'guided') parts.push('Take a moment to reflect on this name.');
    return parts.join(' ');
  }, [playMode]);

  // Player Engine Methods
  const activeQueueRef = useRef(activeQueue);
  useEffect(() => { activeQueueRef.current = activeQueue; }, [activeQueue]);

  const speakAtIdx = useCallback((idx) => {
    const pl = activeQueueRef.current;
    const item = pl[idx];
    if (!item) return;

    clearTimeout(autoNextTimer.current);
    Speech.stop();
    setCurrentIdx(idx);
    setPlayingId(item.number);
    saveSession('session', idx, queueTitle);

    Speech.speak(buildText(item), {
      language: 'en-US',
      rate: playMode === 'guided' ? 0.80 : 0.88,
      onDone: () => {
        setPlayingId(null);
        const pauseMs = playMode === 'guided' ? 3000 : 1500;
        autoNextTimer.current = setTimeout(() => {
          const pl2 = activeQueueRef.current;
          const nextIdx = idx + 1 < pl2.length ? idx + 1 : isLoop ? 0 : -1;
          if (nextIdx >= 0) speakAtIdx(nextIdx);
        }, pauseMs);
      },
      onStopped: () => { setPlayingId(null); clearTimeout(autoNextTimer.current); },
      onError: () => { setPlayingId(null); clearTimeout(autoNextTimer.current); },
    });
  }, [buildText, saveSession, isLoop, playMode, queueTitle]);

  const playQueue = useCallback((newQueue, title, startIdx = 0) => {
    Speech.stop();
    clearTimeout(autoNextTimer.current);
    setActiveQueue(newQueue);
    setQueueTitle(title);
    setCurrentIdx(startIdx);
    setTimeout(() => {
      speakAtIdx(startIdx);
    }, 100);
  }, [speakAtIdx]);

  const togglePlay = useCallback(() => {
    if (playingId !== null) {
      Speech.stop();
      clearTimeout(autoNextTimer.current);
      setPlayingId(null);
    } else if (activeQueue.length > 0) {
      speakAtIdx(currentIdx);
    }
  }, [playingId, activeQueue, currentIdx, speakAtIdx]);

  const nextTrack = useCallback(() => {
    const nextIdx = currentIdx + 1 < activeQueue.length ? currentIdx + 1 : isLoop ? 0 : -1;
    if (nextIdx >= 0) speakAtIdx(nextIdx);
  }, [currentIdx, activeQueue, isLoop, speakAtIdx]);

  const prevTrack = useCallback(() => {
    const pdx = currentIdx > 0 ? currentIdx - 1 : isLoop ? activeQueue.length - 1 : 0;
    speakAtIdx(pdx);
  }, [currentIdx, activeQueue, isLoop, speakAtIdx]);

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
      insights,
      // Global Player
      activeQueue,
      queueTitle,
      playingId,
      currentIdx,
      isLoop,
      setIsLoop,
      playMode,
      setPlayMode,
      playQueue,
      togglePlay,
      nextTrack,
      prevTrack,
      activeTrack: activeQueue[currentIdx] || null,
      isPlaying: playingId !== null,
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
