export const COLORS = {
  // Brand
  primary: '#c9a84c', // Gold
  primaryDark: '#B8963D', // Slightly darker gold for light mode text contrast
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

    primary: COLORS.primary,          // gold
    playerBg: ['#0A1F14', '#0D2B1A'], // dark-mode player header
  },
  light: {
    // ── Islamic sage-green light theme ──────────────────────────────────────
    background: '#F2F7F4',            // very light sage
    surface: '#FFFFFF',
    card: '#FFFFFF',

    text: '#1A2E22',                  // dark green-tinted text
    textMuted: '#4D6B5A',             // muted sage
    textDimmed: '#A0B8A8',            // very muted sage

    border: 'rgba(45, 106, 79, 0.14)',
    borderStrong: 'rgba(45, 106, 79, 0.26)',

    glass: 'rgba(45, 106, 79, 0.05)',
    overlay: 'rgba(242, 247, 244, 0.85)',

    primary: '#2D6A4F',               // forest green (replaces gold in light)
    playerBg: ['#2D6A4F', '#1B4332'], // light-mode player header gradient
  },
};

export const FONTS = {
  regular:    'Inter-Regular',
  medium:     'Inter-Medium',
  bold:       'Inter-Bold',
  arabic:     'Amiri-Regular',
  arabicBold: 'Amiri-Bold',
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
