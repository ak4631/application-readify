import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, type ThemeColors } from '../constants/colors';

type ThemeMode = 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
};

const THEME_KEY = 'readify:themeMode';

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  colors: lightColors,
  toggleTheme: () => {},
  setMode: () => {},
});

export function ThemeProvider({ children }: PropsWithChildren) {
  // Defaults to light regardless of system theme; only switches once the
  // user explicitly opts in (persisted so it survives app restarts).
  const [mode, setModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(value => {
      if (value === 'dark' || value === 'light') {
        setModeState(value);
      }
    });
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(THEME_KEY, newMode);
  };

  const toggleTheme = () => setMode(mode === 'light' ? 'dark' : 'light');

  const colors = mode === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ mode, colors, toggleTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
