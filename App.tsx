/**
 * Readify India
 * @format
 */

import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { DialogProvider } from './context/DialogContext';
import AppNavigator from './navigation/AppNavigator';

function AppContent() {
  const { mode } = useTheme();

  return (
    <>
      <StatusBar
        barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
      />
      <DialogProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </DialogProvider>
    </>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
