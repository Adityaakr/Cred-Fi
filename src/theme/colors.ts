// FLEX Mobile - Light & Airy Design
// Inspired by modern fintech with soft blues and clean aesthetics

export const COLORS = {
  // Primary - Vibrant Teal/Cyan
  primary: '#0BA5C7',
  primaryDark: '#0891B2',
  primaryLight: '#22D3EE',
  primaryGlow: 'rgba(11, 165, 199, 0.3)',
  
  // Accent - Soft Blue
  accent: '#67C3D4',
  accentBright: '#7DD3F8',
  accentDark: '#0891B2',
  
  // Background - Light & Airy
  background: '#F0F9FC',
  backgroundSecondary: '#E0F2F7',
  backgroundTertiary: '#C8E6F0',
  backgroundOverlay: 'rgba(240, 249, 252, 0.95)',
  
  // Cards - Clean white with subtle shadows
  card: '#FFFFFF',
  cardSecondary: '#F8FCFD',
  cardTertiary: '#EBF8FB',
  cardBorder: 'rgba(11, 165, 199, 0.15)',
  cardGlow: 'rgba(11, 165, 199, 0.08)',
  
  // Text - Dark on light
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  textAccent: '#0BA5C7',
  textDark: '#0F172A',
  
  // Status - Refined vibrancy
  success: '#10D97D',
  successDark: '#0DB56A',
  successGlow: 'rgba(16, 217, 125, 0.2)',
  
  error: '#FF4757',
  errorDark: '#E63946',
  errorGlow: 'rgba(255, 71, 87, 0.2)',
  
  warning: '#FFA726',
  warningDark: '#F57C00',
  warningGlow: 'rgba(255, 167, 38, 0.2)',
  
  // UI Elements - Light theme
  border: 'rgba(15, 23, 42, 0.1)',
  borderBright: 'rgba(11, 165, 199, 0.3)',
  borderGlow: 'rgba(11, 165, 199, 0.5)',
  
  // Grid pattern - Light
  gridLine: 'rgba(11, 165, 199, 0.08)',
  gridDot: 'rgba(11, 165, 199, 0.12)',
  
  // Chart colors - Light theme palette
  chart1: '#0BA5C7',
  chart2: '#10D97D',
  chart3: '#FFA726',
  chart4: '#FF4757',
  chartGrid: 'rgba(15, 23, 42, 0.08)',
  
  // Transaction colors
  inflow: '#10D97D',
  inflowBg: 'rgba(16, 217, 125, 0.15)',
  outflow: '#FF4757',
  outflowBg: 'rgba(255, 71, 87, 0.15)',
  
  // Special effects - Light theme
  glow: 'rgba(11, 165, 199, 0.25)',
  shimmer: 'rgba(11, 165, 199, 0.1)',
  glass: 'rgba(255, 255, 255, 0.6)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const BORDER_RADIUS = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
};

export const FONT_SIZES = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  massive: 64,
};

// Typography - Distinctive choices
export const FONTS = {
  // Monospace for data/numbers - JetBrains Mono
  mono: 'JetBrains Mono',
  monoWeight: {
    regular: '400',
    medium: '500',
    bold: '700',
  },
  
  // Display for headings - Syne (geometric, distinctive)
  display: 'Syne',
  displayWeight: {
    regular: '400',
    medium: '600',
    bold: '800',
  },
  
  // Body text - Space Grotesk (but we'll use it sparingly)
  body: 'Space Grotesk',
  bodyWeight: {
    regular: '400',
    medium: '500',
    bold: '700',
  },
};

export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#0BA5C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#0BA5C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0BA5C7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: '#0BA5C7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  glowStrong: {
    shadowColor: '#0BA5C7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
};

// Animation timings
export const ANIMATION = {
  fast: 150,
  normal: 250,
  slow: 400,
  verySlow: 600,
  
  // Easing
  easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeIn: 'cubic-bezier(0.7, 0, 0.84, 0)',
  easeInOut: 'cubic-bezier(0.87, 0, 0.13, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

// Gradients - Light & Airy
export const GRADIENTS = {
  primary: ['#0BA5C7', '#22D3EE'] as const,
  primaryReverse: ['#22D3EE', '#0BA5C7'] as const,
  light: ['#F0F9FC', '#E0F2F7'] as const,
  lightReverse: ['#E0F2F7', '#F0F9FC'] as const,
  success: ['#10D97D', '#0DB56A'] as const,
  error: ['#FF4757', '#E63946'] as const,
  card: ['#FFFFFF', '#F8FCFD'] as const,
  glow: ['rgba(11, 165, 199, 0.2)', 'rgba(11, 165, 199, 0)'] as const,
};
