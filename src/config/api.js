// Set EXPO_PUBLIC_API_URL in .env — see comments below for each scenario:
//   Physical device (same Wi-Fi):  http://<your-PC-LAN-IP>:3000
//   Android emulator:              http://10.0.2.2:3000
//   Production:                    https://wahid-mobile-backend.vercel.app
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3000';

export const ENDPOINTS = {
  // Auth — OTP flow (Twilio Verify)
  checkPhone: `${API_BASE_URL}/api/auth/check-phone`, // POST { phone } → { exists: bool }
  sendOtp:   `${API_BASE_URL}/api/auth/send-otp`,   // POST { phone }
  verifyOtp: `${API_BASE_URL}/api/auth/verify-otp`, // POST { phone, code } → { verificationToken }
  signup:          `${API_BASE_URL}/api/auth/signup`,           // POST { verificationToken, username, password }
  checkUsername:   `${API_BASE_URL}/api/auth/check-username`,  // GET ?username=xxx → { available: bool }
  refresh:         `${API_BASE_URL}/api/auth/refresh`,         // POST { refreshToken }
  logout:    `${API_BASE_URL}/api/auth/logout`,    // POST { refreshToken }
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
