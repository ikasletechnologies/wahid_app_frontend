/**
 * ContentContext — manages Did You Know, Media, and Advertisement cards
 * fetched from the admin backend. Falls back to mock data if unavailable.
 *
 * Card types:
 *   did_you_know  { id, type, title, content, order }
 *   media         { id, type, title, content, imageUrl, videoUrl, tags, order }
 *   advertisement { id, type, title, content, imageUrl, videoUrl, ctaText, ctaUrl, order }
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import http from '../config/http';
import { ENDPOINTS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CONTENT_CACHE_KEY = 'content_cards_cache';

// Backend Content ────────────────────────────────────────────────────────────
// ── Context ─────────────────────────────────────────────────────────────────
const ContentContext = createContext(null);

export const ContentProvider = ({ children }) => {
  const [contentItems, setContentItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadContent = useCallback(async () => {
    // 1. Try to serve from cache immediately
    try {
      const cached = await AsyncStorage.getItem(CONTENT_CACHE_KEY);
      if (cached) {
        setContentItems(JSON.parse(cached));
      }
    } catch (_) {}

    // 2. Fetch from backend
    setLoading(true);
    try {
      const res = await http.get(ENDPOINTS.content);
      if (res.data?.success && Array.isArray(res.data.data)) {
        const items = res.data.data;
        setContentItems(items);
        AsyncStorage.setItem(CONTENT_CACHE_KEY, JSON.stringify(items));
        return;
      }
    } catch (_) {
      // Backend not yet implemented — fall back to mock data silently
    } finally {
      setLoading(false);
    }

    // 3. Fallback: empty array if backend fails
    if (!contentItems.length) {
      setContentItems([]);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  return (
    <ContentContext.Provider value={{ contentItems, loading, reload: loadContent }}>
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('useContent must be used inside ContentProvider');
  return ctx;
};
