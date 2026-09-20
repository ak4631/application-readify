import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import OnboardingScreen from '../screens/OnboardingScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import OtpVerificationScreen from '../screens/OtpVerificationScreen';
import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import MapScreen from '../screens/MapScreen';
import LocationPermissionScreen from '../screens/LocationPermissionScreen';
import BookingsScreen from '../screens/BookingsScreen';
import SubscribeScreen from '../screens/SubscribeScreen';
import MySubscriptionsScreen from '../screens/MySubscriptionsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import LibraryDetailsScreen from '../screens/LibraryDetailsScreen';
import BookingScreen from '../screens/BookingScreen';
import PaymentScreen from '../screens/PaymentScreen';
import BookingConfirmationScreen from '../screens/BookingConfirmationScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const HAS_ONBOARDED_KEY = 'readify:hasOnboarded';

export default function AppNavigator() {
  const { session, initializing } = useAuth();
  const { mode, colors } = useTheme();
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(HAS_ONBOARDED_KEY).then(value => {
      setHasOnboarded(value === 'true');
    });
  }, []);

  if (initializing || hasOnboarded === null) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingTitle, { color: colors.secondary }]}>Readify India</Text>
        <ActivityIndicator
          size="large"
          color={colors.secondary}
          style={styles.loadingSpinner}
        />
      </View>
    );
  }

  const completeOnboarding = () => {
    AsyncStorage.setItem(HAS_ONBOARDED_KEY, 'true');
    setHasOnboarded(true);
  };

  const navigationTheme = {
    ...(mode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(mode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Explore" component={ExploreScreen} />
            <Stack.Screen name="Map" component={MapScreen} />
            <Stack.Screen
              name="LocationPermission"
              component={LocationPermissionScreen}
            />
            <Stack.Screen name="Bookings" component={BookingsScreen} />
            <Stack.Screen name="Subscribe" component={SubscribeScreen} />
            <Stack.Screen name="MySubscriptions" component={MySubscriptionsScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
            />
            <Stack.Screen
              name="LibraryDetails"
              component={LibraryDetailsScreen}
            />
            <Stack.Screen name="Booking" component={BookingScreen} />
            <Stack.Screen name="Payment" component={PaymentScreen} />
            <Stack.Screen
              name="BookingConfirmation"
              component={BookingConfirmationScreen}
            />
          </>
        ) : !hasOnboarded ? (
          <>
            <Stack.Screen name="Onboarding">
              {props => (
                <OnboardingScreen {...props} onDone={completeOnboarding} />
              )}
            </Stack.Screen>
            <Stack.Screen name="Welcome">
              {props => (
                <WelcomeScreen {...props} onContinue={completeOnboarding} />
              )}
            </Stack.Screen>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  loadingSpinner: {
    marginTop: 20,
  },
});
