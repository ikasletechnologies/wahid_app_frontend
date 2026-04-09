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

  // Playlist — mood playlist, presets, daily, session, favourites, mood log
  playlist:           `${API_BASE_URL}/api/playlist`,             // GET ?mood=X → name list
  playlistPresets:    `${API_BASE_URL}/api/playlist/presets`,     // GET → preset playlist definitions
  playlistDaily:      `${API_BASE_URL}/api/playlist/daily`,       // GET → today's personalised playlist
  playlistSession:    `${API_BASE_URL}/api/playlist/session`,     // GET / POST { mood, trackIndex, title }
  playlistFavourites: `${API_BASE_URL}/api/playlist/favourites`,  // GET / POST { nameNumber } / DELETE /:nameNumber
  moodLog:            `${API_BASE_URL}/api/mood-log`,             // POST { mood, timestamp }

  // Insights & analytics
  userInsights:       `${API_BASE_URL}/api/insights`,             // GET → mood patterns + suggestions

  // Audio (TTS stream from backend — ready when audio URLs are added to names)
  audioStream:        (num) => `${API_BASE_URL}/api/audio/${num}`, // GET → audio URL or stream
};
