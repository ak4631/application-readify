export type ThemeColors = typeof lightColors;

export const lightColors = {
  primary: '#23764B',
  primaryDark: '#185B39',
  primaryLight: '#E5F5E9',

  secondary: '#2D8555',

  cyan: '#00A9E8',
  cyanLight: '#E8F8FF',

  orange: '#FF9D1E',
  orangeLight: '#FFF4E3',

  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF5EF',
  surfaceSubtle: '#F7FBF7',

  text: '#162C20',
  subText: '#607267',
  placeholder: '#7C8E82',
  border: '#DDE9DF',

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
  primary: '#2D8555',
  primaryDark: '#23764B',
  primaryLight: 'rgba(143,214,163,0.16)',

  secondary: '#8FD6A3',

  cyan: '#22D3EE',
  cyanLight: 'rgba(34,211,238,0.14)',

  orange: '#FBBF24',
  orangeLight: 'rgba(251,191,36,0.14)',

  background: '#101C15',
  surface: '#17291E',
  surfaceAlt: '#21382A',
  surfaceSubtle: '#1B3023',

  text: '#ECF8EF',
  subText: '#ACC7B3',
  placeholder: '#8DA998',
  border: '#34513D',

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
