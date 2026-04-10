import Constants from 'expo-constants';

// Detect the local IP of the dev machine to allow mobile app to connect seamlessly
const getLocalIp = () => {
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:3000`;
  }
  return 'http://10.0.2.2:3000'; // Default Android emulator fallback
};

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || getLocalIp();

export const ENDPOINTS = {
  // Auth — OTP flow (Twilio Verify)
  sendOtp:   `${API_BASE_URL}/api/auth/send-otp`,   // POST { phone }
  verifyOtp: `${API_BASE_URL}/api/auth/verify-otp`, // POST { phone, code } → { user, token }
  profile:   `${API_BASE_URL}/api/me`,

  // Legacy email/password (kept for admin use)
  login:    `${API_BASE_URL}/api/auth/login`,
  register: `${API_BASE_URL}/api/auth/register`,

  // Core
  names:    `${API_BASE_URL}/api/names`,
  progress: `${API_BASE_URL}/api/progress`,
  learn:    `${API_BASE_URL}/api/progress/learn`,

  // Content cards (admin-managed)
  content:       `${API_BASE_URL}/api/content`,          // GET all published cards
  contentAdmin:  `${API_BASE_URL}/api/admin/content`,    // GET/POST/PUT/DELETE (admin)
  appConfig:     `${API_BASE_URL}/api/admin/config`,     // GET/PUT app-wide settings

  // Admin auth
  adminLogin:    `${API_BASE_URL}/api/admin/auth/login`,

  // Playlist — presets, daily, session, favourites, custom, AI
  playlistPresets:    `${API_BASE_URL}/api/playlist/presets`,     // GET → preset playlist definitions
  playlistDaily:      `${API_BASE_URL}/api/playlist/daily`,       // GET → today's personalised playlist
  playlistSession:    `${API_BASE_URL}/api/playlist/session`,     // GET / POST { mood, trackIndex, title }
  playlistFavourites: `${API_BASE_URL}/api/playlist/favourites`,  // GET / POST { nameNumber } / DELETE body { nameNumber }
  playlistCustom:     `${API_BASE_URL}/api/playlist/custom`,      // GET / POST / PUT / DELETE body { id }
  playlistAiRecommend:`${API_BASE_URL}/api/playlist/ai-recommend`,// POST { prompt }
  moodLog:            `${API_BASE_URL}/api/mood-log`,             // POST { mood, timestamp }

  // Insights & analytics
  userInsights:       `${API_BASE_URL}/api/insights`,             // GET → user stats
};
