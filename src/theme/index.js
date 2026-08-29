export const COLORS = {
  // Brand
  primary: '#06b6d4', // Blue/Cyan
  primaryDark: '#0891b2', // Darker blue/cyan for contrast
  neon: '#00FF88', // Legacy neon green if needed
  
  // Base
  black: '#000000',
  white: '#FFFFFF',
  
  // Backgrounds
  darkBg: '#050505',
  darkSurface: '#111111',
  darkCard: '#1A1A1A',
  
  lightBg: '#F8F9FA',
  lightSurface: '#F0F0F0',
  lightCard: '#FFFFFF',
  
  // Semantic
  error: '#FF4444',
  success: '#00FF88',
  
  // Overlays
  overlayDark: 'rgba(0, 0, 0, 0.75)',
  overlayLight: 'rgba(255, 255, 255, 0.75)',
};

// Unified Light/Dark Palette
export const PALETTE = {
  dark: {
    background: COLORS.darkBg,
    surface: COLORS.darkSurface,
    card: COLORS.darkCard,

    text: COLORS.white,
    textMuted: '#71717A',
    textDimmed: '#3F3F46',

    border: 'rgba(255, 255, 255, 0.08)',
    borderStrong: 'rgba(255, 255, 255, 0.15)',

    glass: 'rgba(255, 255, 255, 0.03)',
    overlay: COLORS.overlayDark,

    primary: '#06b6d4',               // blue/cyan
    playerBg: ['#06b6d4', '#0891b2'], // cyan player gradient
  },
  light: {
    // ── Premium Pastel Lavender-Blue Theme ──────────────────────────────────
    background: '#EDF1FD',            // premium soft lavender-blue
    surface: '#FFFFFF',
    card: '#FFFFFF',

    text: '#0F172A',                  // slate dark
    textMuted: '#64748B',             // slate-500
    textDimmed: '#94A3B8',            // slate-400

    border: 'rgba(15, 23, 42, 0.06)',
    borderStrong: 'rgba(6, 182, 212, 0.15)', // cyan accent border

    glass: 'rgba(6, 182, 212, 0.05)',
    overlay: 'rgba(237, 241, 253, 0.85)',

    primary: '#06b6d4',               // vibrant premium cyan
    playerBg: ['#06b6d4', '#0891b2'], // cyan player gradient
  },
  paper: {
    // ── Warm Quran Sepia/Paper Reading Theme ───────────────────────────────
    background: '#FAF6ED',            // warm cream/sepia reading background
    surface: '#F4ECD8',               // sepia warm surface
    card: '#FFFDF9',                  // soft cream card background

    text: '#2C221E',                  // warm dark charcoal brown text
    textMuted: '#6B5E53',             // warm muted sepia-500
    textDimmed: '#9C8E80',            // warm dimmed sepia-400

    border: 'rgba(44, 34, 30, 0.08)',
    borderStrong: 'rgba(5, 150, 105, 0.25)', // emerald accent border

    glass: 'rgba(5, 150, 105, 0.05)',
    overlay: 'rgba(250, 246, 237, 0.88)',

    primary: '#059669',               // emerald green
    playerBg: ['#059669', '#047857'], // emerald green player gradient
  },
};

export const FONTS = {
  regular:    'Inter-Regular',
  medium:     'Inter-Medium',
  bold:       'Inter-Bold',
  arabic:     'NotoNaskhArabic-Regular',
  arabicBold: 'NotoNaskhArabic-Bold',
};

export const SIZES = {
  xs:   12,
  sm:   14,
  base: 16,
  md:   18,
  lg:   20,
  xl:   24,
  xxl:  28,
  h2:   32,
  h1:   42,
  arabic: {
    sm: 22,
    md: 30,
    lg: 38,
    xl: 48,
  },
};

export const SPACE = {
  xxs: 2,
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

export const RADIUS = {
  xs:   6,
  sm:   10,
  md:   14,
  lg:   20,
  xl:   28,
  xxl:  36,
  full: 999,
};

// Keeping static shadows for ease, you can tweak these later dynamically if needed
export const SHADOW = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1, // Reduced for light mode logic later
    shadowRadius: 20,
    elevation: 8,
  },
};
