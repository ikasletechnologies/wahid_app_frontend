import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import http from '../config/http';
import { ENDPOINTS } from '../config/api';
import { useAuth } from './AuthContext';

const NamesContext = createContext();

export const CATEGORIES = {
  mercy:    { id: 'mercy',    name: "Mercy & Compassion",    icon: "water-outline",   color: "#2d9c96" },
  majesty:  { id: 'majesty',  name: "Majesty & Power",       icon: "flash-outline",   color: "#8b5cf6" },
  wisdom:   { id: 'wisdom',   name: "Wisdom & Knowledge",    icon: "bulb-outline",    color: "#3b82f6" },
  kindness: { id: 'kindness', name: "Kindness & Gentleness", icon: "heart-outline",   color: "#c9a84c" },
  creator:  { id: 'creator',  name: "Creator & Provider",    icon: "leaf-outline",    color: "#f59e0b" },
  guardian: { id: 'guardian', name: "Guardian & Protector",  icon: "shield-outline",  color: "#2d9c96" },
  forgiver: { id: 'forgiver', name: "Forgiver & Pardoner",   icon: "refresh-outline", color: "#94a3b8" },
  exalted:  { id: 'exalted',  name: "The Exalted & Supreme", icon: "star-outline",    color: "#c9a84c" },
};

// Client-side category lookup — maps name number → category key.
// Source: WAHID_ENHANCED.html data. Fixes filter without any backend changes.
export const NUMBER_TO_CATEGORY = {
  // Mercy & Compassion
  1:'mercy', 2:'mercy', 32:'mercy', 45:'mercy', 47:'mercy', 83:'mercy', 99:'mercy',
  // Majesty & Power
  3:'majesty', 8:'majesty', 9:'majesty', 15:'majesty', 22:'majesty', 23:'majesty',
  24:'majesty', 25:'majesty', 49:'majesty', 53:'majesty', 54:'majesty', 61:'majesty',
  69:'majesty', 70:'majesty', 81:'majesty', 84:'majesty', 87:'majesty', 91:'majesty',
  // Wisdom & Knowledge
  19:'wisdom', 20:'wisdom', 26:'wisdom', 27:'wisdom', 28:'wisdom', 29:'wisdom',
  31:'wisdom', 40:'wisdom', 46:'wisdom', 50:'wisdom', 57:'wisdom', 71:'wisdom',
  72:'wisdom', 86:'wisdom', 90:'wisdom', 94:'wisdom', 98:'wisdom',
  // Kindness & Gentleness
  5:'kindness', 16:'kindness', 18:'kindness', 21:'kindness', 30:'kindness',
  35:'kindness', 42:'kindness', 44:'kindness', 79:'kindness', 92:'kindness',
  // Creator & Provider
  11:'creator', 12:'creator', 13:'creator', 17:'creator', 39:'creator',
  58:'creator', 59:'creator', 60:'creator', 89:'creator', 95:'creator',
  // Guardian & Protector
  6:'guardian', 7:'guardian', 38:'guardian', 43:'guardian', 52:'guardian',
  55:'guardian', 77:'guardian',
  // Forgiver & Pardoner
  14:'forgiver', 34:'forgiver', 80:'forgiver', 82:'forgiver',
  // The Exalted & Supreme
  4:'exalted', 10:'exalted', 33:'exalted', 36:'exalted', 37:'exalted', 41:'exalted',
  48:'exalted', 51:'exalted', 56:'exalted', 62:'exalted', 63:'exalted', 64:'exalted',
  65:'exalted', 66:'exalted', 67:'exalted', 68:'exalted', 73:'exalted', 74:'exalted',
  75:'exalted', 76:'exalted', 78:'exalted', 85:'exalted', 88:'exalted', 93:'exalted',
  96:'exalted', 97:'exalted',
};

// Helper: inject category into a name object from the API
const withCategory = (name) => ({
  ...name,
  category: name.category || NUMBER_TO_CATEGORY[name.number] || 'mercy',
});

export const MOODS = [
  "anxious", "sad", "seeking peace", "lonely", "seeking forgiveness", "overwhelmed", "powerless",
  "seeking purity", "spiritually low", "distracted", "fearful", "worried", "feeling unseen",
  "burdened", "weak", "defeated", "broken", "hopeless", "grieving", "oppressed", "proud",
  "arrogant", "spiritually disconnected", "purposeless", "wondering", "curious", "questioning",
  "self-doubt", "guilty", "grateful", "hopeful", "seeking blessings", "financial stress",
  "stuck", "seeking breakthrough", "frustrated", "confused about fate", "misunderstood",
  "seeking accountability", "disrespected", "unloved", "seeking validation", "disconnected",
  "detached", "impatient", "angry", "vulnerable"
];

// Keyword map for mood-based playlist matching
const MOOD_KEYWORDS = {
  'anxious':                ['peace', 'calm', 'protect', 'guard', 'safe', 'tranquil', 'merciful'],
  'sad':                    ['mercy', 'compassion', 'gentle', 'kind', 'loving', 'love'],
  'seeking peace':          ['peace', 'calm', 'tranquil', 'serene', 'harmony'],
  'lonely':                 ['close', 'near', 'love', 'companion', 'aware', 'responsive'],
  'seeking forgiveness':    ['forgiv', 'pardon', 'relent', 'repent', 'accept'],
  'overwhelmed':            ['strong', 'power', 'mighty', 'able', 'capable', 'sufficient'],
  'powerless':              ['powerful', 'mighty', 'strong', 'able', 'support'],
  'seeking purity':         ['pure', 'holy', 'clean', 'sanctif', 'righteous'],
  'spiritually low':        ['guide', 'light', 'truth', 'right', 'path'],
  'distracted':             ['aware', 'knowing', 'watchful', 'witness'],
  'fearful':                ['protect', 'guard', 'safe', 'peace', 'trust'],
  'worried':                ['trust', 'rely', 'depend', 'sufficient', 'guardian'],
  'feeling unseen':         ['knowing', 'aware', 'sees', 'witness', 'near'],
  'burdened':               ['ease', 'gentle', 'relief', 'compassion', 'mercy'],
  'weak':                   ['strong', 'power', 'mighty', 'support', 'help'],
  'defeated':               ['victor', 'triumph', 'conquer', 'power', 'strong'],
  'broken':                 ['heal', 'restore', 'mend', 'mercy', 'compassion'],
  'hopeless':               ['hope', 'grace', 'mercy', 'generous', 'kind'],
  'grieving':               ['compassion', 'mercy', 'gentle', 'patient', 'kind'],
  'oppressed':              ['justice', 'protect', 'avenge', 'mighty', 'strong'],
  'proud':                  ['humble', 'great', 'supreme', 'majesty', 'exalted'],
  'arrogant':               ['humble', 'great', 'supreme', 'majesty'],
  'spiritually disconnected': ['guide', 'light', 'near', 'truth', 'path'],
  'purposeless':            ['guide', 'direction', 'wisdom', 'truth', 'purpose'],
  'wondering':              ['knowing', 'wisdom', 'aware', 'truth', 'all-knowing'],
  'curious':                ['knowing', 'wisdom', 'knower', 'all-knowing'],
  'questioning':            ['truth', 'wise', 'knowing', 'aware'],
  'self-doubt':             ['worthy', 'sufficient', 'support', 'capable', 'strong'],
  'guilty':                 ['forgiv', 'pardon', 'mercy', 'accept', 'relent'],
  'grateful':               ['grateful', 'thankful', 'bless', 'generous'],
  'hopeful':                ['hope', 'grace', 'generous', 'merciful', 'kind'],
  'seeking blessings':      ['bless', 'generous', 'grace', 'bounty', 'sustain'],
  'financial stress':       ['provide', 'sustain', 'abundance', 'generous', 'sustainer'],
  'stuck':                  ['open', 'expand', 'help', 'guide', 'way'],
  'seeking breakthrough':   ['powerful', 'open', 'expand', 'mighty', 'way'],
  'frustrated':             ['patient', 'peace', 'calm', 'gentle', 'forbear'],
  'confused about fate':    ['wise', 'knowing', 'plan', 'aware', 'all-knowing'],
  'misunderstood':          ['aware', 'knowing', 'witness', 'sees', 'near'],
  'seeking accountability': ['justice', 'aware', 'witness', 'account'],
  'disrespected':           ['dignity', 'honor', 'mighty', 'exalted', 'supreme'],
  'unloved':                ['love', 'loving', 'mercy', 'compassion', 'kind'],
  'seeking validation':     ['sufficient', 'knowing', 'witness', 'sees'],
  'disconnected':           ['near', 'aware', 'guide', 'light', 'close'],
  'detached':               ['near', 'aware', 'guide', 'light', 'close'],
  'impatient':              ['patient', 'forbear', 'gentle', 'wise'],
  'angry':                  ['gentle', 'patient', 'forbear', 'peace', 'calm'],
  'vulnerable':             ['protect', 'guard', 'safe', 'strong', 'mighty'],
};

export const NamesProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [names, setNames] = useState([]);
  const [learnedIds, setLearnedIds] = useState([]);
  const [masteredIds, setMasteredIds] = useState([]);
  const [streak, setStreak] = useState(0);
  const [revisitCounts, setRevisitCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (token) {
      loadInitialData();
    } else {
      setLoading(false);
      setNames([]);
      setLearnedIds([]);
      setMasteredIds([]);
      setStreak(0);
    }
  }, [token]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [cachedNames, cachedProgress] = await Promise.all([
        AsyncStorage.getItem('names_cache'),
        AsyncStorage.getItem('progress_cache'),
      ]);

      if (cachedNames) {
        const parsed = JSON.parse(cachedNames);
        if (parsed.length > 0) {
          setNames(parsed.map(withCategory));
        }
      }
      if (cachedProgress) {
        const { learned, mastered, streak: s, revisits } = JSON.parse(cachedProgress);
        setLearnedIds(learned || []);
        setMasteredIds(mastered || []);
        setStreak(s || 0);
        if (revisits) setRevisitCounts(revisits);
      }

      await syncWithBackend();
    } catch (error) {
      console.error('[NamesContext] Load Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncWithBackend = async () => {
    if (!token) return;
    try {
      const [namesRes, progressRes] = await Promise.all([
        http.get(`${ENDPOINTS.names}?limit=100`),
        http.get(ENDPOINTS.progress),
      ]);

      if (namesRes.data?.success && Array.isArray(namesRes.data?.data)) {
        const enriched = namesRes.data.data.map(withCategory);
        setNames(enriched);
        AsyncStorage.setItem('names_cache', JSON.stringify(enriched));
      }

      if (progressRes.data?.success && progressRes.data?.data) {
        const { learned, mastered, streak: s, revisits } = progressRes.data.data;
        setLearnedIds(learned || []);
        setMasteredIds(mastered || []);
        setStreak(s || 0);
        if (revisits) setRevisitCounts(revisits);
        AsyncStorage.setItem('progress_cache', JSON.stringify({
          learned: learned || [],
          mastered: mastered || [],
          streak: s || 0,
          revisits: revisits || {},
        }));
      }
    } catch (error) {
      console.error('[NamesContext] Sync Error:', error.message);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      await syncWithBackend();
    } finally {
      setRefreshing(false);
    }
  };

  const markAsLearned = async (nameNumber) => {
    try {
      if (!learnedIds.includes(nameNumber)) {
        setLearnedIds(prev => [...prev, nameNumber]);
      }
      const res = await http.post(ENDPOINTS.learn, { nameNumber });
      if (res.data?.success) {
        if (res.data.data?.streak !== undefined) setStreak(res.data.data.streak);
        if (res.data.data?.mastered && !masteredIds.includes(nameNumber)) {
          setMasteredIds(prev => [...prev, nameNumber]);
        }
        await syncWithBackend();
      }
    } catch (error) {
      console.error('[NamesContext] Mark Learned Error:', error.message);
    }
  };

  const unmarkAsLearned = async (nameNumber) => {
    try {
      setLearnedIds(prev => prev.filter(id => id !== nameNumber));
      setMasteredIds(prev => prev.filter(id => id !== nameNumber));
    } catch (error) {
      console.error('[NamesContext] Unmark Learned Error:', error.message);
    }
  };

  // ── Weighted Recommendation Engine ────────────────────────────────────────
  // Score breakdown:
  //   +10  backend moods[] exact match  (highest trust — set by admin)
  //   +2   per keyword hit in meaning/reflection/benefits
  //   +1   name is unlearned (surface new knowledge)
  //   -1   name already mastered (de-prioritise — user knows it)
  //   (favourites boost is applied in PlaylistContext after this call)
  const getMoodPlaylist = useCallback((mood) => {
    if (!mood || names.length === 0) return [];
    const lowerMood = mood.toLowerCase().trim();
    const keywords  = MOOD_KEYWORDS[lowerMood] || [lowerMood];

    const scored = names.map(name => {
      let score = 0;

      // Highest trust: backend moods[] field
      if (name.moods?.some(m => m.toLowerCase() === lowerMood)) score += 10;

      // Keyword relevance across all text fields
      const benefits = Array.isArray(name.benefits)
        ? name.benefits.join(' ')
        : (name.benefits || '');
      const searchText = [
        name.meaning, name.transliteration, name.description,
        name.reflection, benefits,
      ].filter(Boolean).join(' ').toLowerCase();

      keywords.forEach(kw => { if (searchText.includes(kw)) score += 2; });

      // Learning-state weighting
      if (!learnedIds.includes(name.number))   score += 1;  // favour new names
      if (masteredIds.includes(name.number))   score -= 1;  // soft-deprioritise mastered

      return { name, score };
    });

    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.name);
  }, [names, learnedIds, masteredIds]);

  // ── Daily Playlist ─────────────────────────────────────────────────────────
  // Deterministic for the day (same result on every call within a day).
  // Mix: 4 unlearned + 2 review (learned not mastered) + name-of-day.
  const getDailyPlaylist = useCallback(() => {
    if (names.length === 0) return [];

    const today  = new Date();
    const dayNum = Math.floor(today.getTime() / 86_400_000); // days since epoch

    // Seeded deterministic pick (no external lib needed)
    const seededPick = (arr, count, seed) => {
      const copy = [...arr].sort((a, b) => {
        const ha = ((seed + a.number) * 2654435761) >>> 0;
        const hb = ((seed + b.number) * 2654435761) >>> 0;
        return ha - hb;
      });
      return copy.slice(0, count);
    };

    const unlearned   = names.filter(n => !learnedIds.includes(n.number));
    const reviewing   = names.filter(n =>  learnedIds.includes(n.number) && !masteredIds.includes(n.number));
    const nameOfDay   = names[dayNum % names.length];

    const newNames    = seededPick(unlearned, 4, dayNum);
    const reviewNames = seededPick(reviewing, 2, dayNum + 1000);

    const seen  = new Set();
    const daily = [];
    [...newNames, ...reviewNames, nameOfDay].forEach(n => {
      if (n && !seen.has(n.number)) { seen.add(n.number); daily.push(n); }
    });

    // Pad with random names if we have fewer than 7 (to ensure a full experience)
    if (daily.length < 7 && names.length > 0) {
      const remaining = names.filter(n => !seen.has(n.number));
      const needed = 7 - daily.length;
      const padding = seededPick(remaining, needed, dayNum * 2);
      padding.forEach(n => {
        if (n && !seen.has(n.number)) { seen.add(n.number); daily.push(n); }
      });
    }

    return daily.slice(0, 7);
  }, [names, learnedIds, masteredIds]);

  const getNameOfDay = useCallback(() => {
    if (names.length === 0) return null;
    const today = new Date();
    const index = (today.getFullYear() + today.getMonth() + today.getDate()) % names.length;
    return names[index];
  }, [names]);

  return (
    <NamesContext.Provider value={{
      names,
      learnedIds,
      masteredIds,
      streak,
      revisitCounts,
      loading,
      refreshing,
      syncWithBackend,
      refresh,
      markAsLearned,
      unmarkAsLearned,
      getMoodPlaylist,
      getDailyPlaylist,
      getNameOfDay,
      categories: CATEGORIES,
      moods: MOODS,
    }}>
      {children}
    </NamesContext.Provider>
  );
};

export const useNames = () => useContext(NamesContext);
