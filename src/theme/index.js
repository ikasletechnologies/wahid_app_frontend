export const COLORS = {
  // Pure Dark palette
  dark: {
    black:   '#000000',
    deep:    '#050505',
    mid:     '#111111',
    light:   '#1A1A1A',
    surface: '#222222',
  },
  // Neon Green palette
  neon: {
    DEFAULT: '#00FF88',
    glow:    'rgba(0, 255, 136, 0.4)',
    bright:  '#1AFFC4',
    dark:    '#00A357',
    muted:   'rgba(0, 255, 136, 0.15)',
  },
  // Neutrals
  white:   '#FFFFFF',
  offWhite:'#F0F0F0',
  muted:   '#71717A',
  dimmed:  '#3F3F46',
  // Semantic
  error:   '#FF4444',
  success: '#00FF88',
  // Translucents
  cardBg:  'rgba(17, 17, 17, 0.85)',
  inputBg: 'rgba(255, 255, 255, 0.04)',
  overlay: 'rgba(0, 0, 0, 0.75)',
  glass:   'rgba(255, 255, 255, 0.03)',
  border:  'rgba(255, 255, 255, 0.08)',
};

export const FONTS = {
  regular:    'Inter-Regular',
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
  h1:   42, // Slightly larger for the "premium" look
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

export const SHADOW = {
  neon: {
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 20,
  },
  orb: {
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 25,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
};

// Application theme
export const theme = {
  colors: {
    primary:    COLORS.neon.DEFAULT,
    secondary:  COLORS.dark.mid,
    accent:     COLORS.neon.bright,
    text: {
      light: COLORS.white,
      dark:  '#A1A1AA',
      muted: COLORS.muted,
      neon:  COLORS.neon.DEFAULT,
    },
    background: COLORS.dark.black,
    card:       COLORS.dark.mid,
    surface:    COLORS.dark.light,
    border:     COLORS.border,
    glass:      COLORS.glass,
  },
  typography: {
    fontFamily: FONTS,
    fontSize:   SIZES,
  },
  spacing:   SPACE,
  roundness: RADIUS,
};
