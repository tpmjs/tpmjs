/**
 * TPMJS Design Tokens
 * Extracted from the official design system
 */

// Color Palette - Dark Mode (Primary)
export const colors = {
  // Backgrounds (warm dark with copper undertones)
  bg: {
    base: '#0F0E0D', // hsl(25 10% 6%)
    surface: '#171514', // hsl(25 10% 9%)
    surface2: '#1F1D1B', // hsl(25 10% 12%)
    surface3: '#2A2725', // hsl(25 10% 16%)
    elevated: '#363230', // hsl(25 8% 20%)
  },

  // Text
  text: {
    primary: '#E8E5E2', // hsl(30 10% 90%)
    secondary: '#9A9592', // hsl(25 6% 60%)
    tertiary: '#757270', // hsl(25 5% 45%)
    muted: '#5A5856', // hsl(25 4% 35%)
  },

  // Primary - Copper Accent
  copper: {
    default: '#C96A38', // hsl(22 57% 50%)
    hover: '#D47942', // hsl(22 57% 55%)
    active: '#B55E2E', // hsl(22 57% 45%)
    muted: '#A6592D', // hsl(22 57% 41%)
    glow: 'rgba(201, 106, 56, 0.4)',
  },

  // Status Colors (brighter for dark mode)
  status: {
    success: '#4ADE80', // hsl(145 50% 45%)
    successMuted: 'rgba(74, 222, 128, 0.2)',
    warning: '#FBBF24', // hsl(38 80% 55%)
    warningMuted: 'rgba(251, 191, 36, 0.2)',
    error: '#F87171', // hsl(0 60% 55%)
    errorMuted: 'rgba(248, 113, 113, 0.2)',
    info: '#60A5FA', // hsl(210 70% 55%)
    infoMuted: 'rgba(96, 165, 250, 0.2)',
  },

  // Borders
  border: {
    default: '#363230',
    strong: '#5C5854',
    subtle: '#252321',
  },

  // Special
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

// Typography
export const typography = {
  fontFamily: {
    sans: 'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'Geist Mono, "SF Mono", Monaco, Consolas, monospace',
  },

  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
    '6xl': 64,
    '7xl': 72,
    '8xl': 96,
    '9xl': 128,
  },

  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
};

// Remotion Spring Configs
export const springConfigs = {
  smooth: { damping: 200 },
  snappy: { damping: 20, stiffness: 200 },
  bouncy: { damping: 8 },
  heavy: { damping: 15, stiffness: 80, mass: 2 },
  default: { damping: 15, stiffness: 100 },
};
