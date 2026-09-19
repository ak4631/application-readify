export type ThemeColors = typeof lightColors;

export const lightColors = {
  primary: '#1557C0',
  primaryDark: '#0F47A1',
  primaryLight: '#EAF2FF',

  secondary: '#2563EB',

  cyan: '#00A9E8',
  cyanLight: '#E8F8FF',

  orange: '#FF9D1E',
  orangeLight: '#FFF4E3',

  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F3F4F6',
  surfaceSubtle: '#F9FAFB',

  text: '#111827',
  subText: '#6B7280',
  placeholder: '#9CA3AF',
  border: '#E5E7EB',

  danger: '#DC2626',
  dangerLight: '#FCA5A5',
  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#F59E0B',

  // Fixed regardless of theme — used for text/icons placed on top of
  // primary-colored surfaces (buttons, headers), which stay the same
  // in both light and dark mode.
  onPrimary: '#FFFFFF',
};

export const darkColors: ThemeColors = {
  primary: '#3B82F6',
  primaryDark: '#1D4ED8',
  primaryLight: 'rgba(59,130,246,0.18)',

  secondary: '#60A5FA',

  cyan: '#22D3EE',
  cyanLight: 'rgba(34,211,238,0.14)',

  orange: '#FBBF24',
  orangeLight: 'rgba(251,191,36,0.14)',

  background: '#0B1220',
  surface: '#151E2E',
  surfaceAlt: '#1E293B',
  surfaceSubtle: '#1A2434',

  text: '#F1F5F9',
  subText: '#94A3B8',
  placeholder: '#64748B',
  border: '#2A3548',

  danger: '#F87171',
  dangerLight: '#7F1D1D',
  success: '#4ADE80',
  successLight: 'rgba(74,222,128,0.16)',
  warning: '#FBBF24',

  onPrimary: '#FFFFFF',
};

// Legacy static export — kept only for any leftover non-themed usage.
// Screens should prefer `useTheme()` from context/ThemeContext instead.
export const Colors = lightColors;
