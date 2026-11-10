import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenHeader from '../components/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useStyles } from '../hooks/useStyles';
import {
  detectAndSaveLocation,
  clearUserLocation,
  fetchSavedLocation,
  locationLabel,
  saveUserLocation,
  type SavedLocation,
} from '../lib/location';
import { searchAddress, type GeocodeResult } from '../lib/geocoding';
import { locationPromptKey } from '../hooks/useDiscoveryLocation';
import type { ThemeColors } from '../constants/colors';

export const LOCATION_PROMPT_SHOWN_KEY = 'readify:locationPromptShown';

export default function LocationPermissionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { session } = useAuth();
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const [saved, setSaved] = useState<SavedLocation | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const mounted = useRef(true);
  const locked = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (session)
        fetchSavedLocation(session.user.id)
          .then(value => {
            if (active) setSaved(value);
          })
          .catch(() => {});
      return () => {
        active = false;
      };
    }, [session]),
  );
  useEffect(() => {
    let active = true;
    setResults([]);
    setSearched(false);
    setSearching(false);
    if (query.trim().length < 3 || busy) return;
    setSearching(true);
    const timer = setTimeout(() => {
      searchAddress(query, saved ?? undefined)
        .then(data => {
          if (active) {
            setResults(data);
            setSearched(true);
          }
        })
        .catch(() => {
          if (active)
            setError(
              'Address search is unavailable. Try another search or use your current location.',
            );
        })
        .finally(() => {
          if (active) setSearching(false);
        });
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, busy, saved]);

  async function finish() {
    await AsyncStorage.setItem(LOCATION_PROMPT_SHOWN_KEY, 'true');
    if (session)
      await AsyncStorage.setItem(locationPromptKey(session.user.id), 'true');
    if (!mounted.current) return;
    if (route.params?.returnTo && navigation.canGoBack()) navigation.goBack();
    else navigation.replace('Main', { screen: 'Home' });
  }
  async function useGps() {
    if (!session || locked.current) return;
    locked.current = true;
    setBusy(true);
    setError('');
    setShowSettings(false);
    try {
      await AsyncStorage.setItem(locationPromptKey(session.user.id), 'true');
      const detected = await detectAndSaveLocation(
        session.user.id,
        () => mounted.current,
      );
      if (detected) await finish();
    } catch (failure: any) {
      if (mounted.current) {
        setError(
          failure.message?.startsWith('Location access')
            ? failure.message
            : 'Could not detect your location. Turn on device location, try again, or search manually.',
        );
        setShowSettings(true);
      }
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  async function select(result: GeocodeResult) {
    if (!session || locked.current) return;
    locked.current = true;
    setBusy(true);
    setError('');
    try {
      await saveUserLocation(session.user.id, {
        ...result,
        address: result.label,
        source: 'manual',
        permissionStatus: saved?.permission_status ?? 'undetermined',
      });
      await finish();
    } catch {
      if (mounted.current)
        setError('Could not save this location. Please try again.');
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  async function clearLocation() {
    if (!session || locked.current) return;
    locked.current = true;
    setBusy(true);
    setError('');
    try {
      await clearUserLocation(session.user.id);
      setSaved(null);
      await finish();
    } catch {
      if (mounted.current)
        setError('Could not clear your selected location. Please try again.');
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Choose your location" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <Text style={styles.title}>Where are you looking?</Text>
          <Text style={styles.subtitle}>
            Choose a locality to see the closest spaces first.
          </Text>
          <View style={styles.searchBox}>
            <Icon name="search-outline" size={22} color={colors.subText} />
            <TextInput
              accessibilityLabel="Search locality or address"
              style={styles.input}
              placeholder="Search locality, landmark or city"
              placeholderTextColor={colors.placeholder}
              value={query}
              editable={!busy}
              autoCorrect={false}
              onChangeText={value => {
                setQuery(value);
                setError('');
              }}
            />
            {!!query && (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Clear location search"
                disabled={busy}
                style={styles.clear}
                onPress={() => setQuery('')}
              >
                <Icon name="close-circle" size={22} color={colors.subText} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            disabled={busy}
            style={styles.gps}
            onPress={useGps}
          >
            <Icon name="locate-outline" size={24} color={colors.primary} />
            <View style={styles.copy}>
              <Text style={styles.gpsTitle}>
                {saved?.source === 'manual'
                  ? 'Reset to current location'
                  : 'Use my current location'}
              </Text>
              <Text style={styles.hint}>
                Detect automatically using your phone
              </Text>
            </View>
            {busy ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Icon name="chevron-forward" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            disabled={busy}
            style={styles.mapAction}
            onPress={() =>
              route.params?.returnTo === 'Map' && navigation.canGoBack()
                ? navigation.goBack()
                : navigation.replace('Map', {
                    initialCategory: route.params?.initialCategory ?? 'all',
                  })
            }
          >
            <Icon name="map-outline" size={24} color={colors.primary} />
            <View style={styles.copy}>
              <Text style={styles.gpsTitle}>View map</Text>
              <Text style={styles.hint}>
                Explore spaces around your selected area
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
          {!!error && (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          )}
          {showSettings && (
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.settings}
              onPress={() =>
                Linking.openSettings().catch(() =>
                  setError(
                    'Open your phone settings and enable location for Vriddhora.',
                  ),
                )
              }
            >
              <Text style={styles.gpsTitle}>Open location permissions</Text>
            </TouchableOpacity>
          )}
          {saved && !query && (
            <View style={styles.saved}>
              <Text style={styles.section}>SELECTED LOCATION</Text>
              <Text style={styles.savedTitle}>{locationLabel(saved)}</Text>
              <Text style={styles.subtitle}>
                {saved.address ?? 'Current GPS location'}
              </Text>
              <Text style={styles.hint}>
                {saved.source === 'manual'
                  ? 'Manually selected. Kept until you change or reset it.'
                  : 'Detected from your phone. Use current location to refresh it.'}
              </Text>
            </View>
          )}
          {saved && (
            <TouchableOpacity
              accessibilityRole="button"
              disabled={busy}
              style={styles.clearLocation}
              onPress={clearLocation}
            >
              <Icon
                name="close-circle-outline"
                size={22}
                color={colors.danger}
              />
              <View style={styles.copy}>
                <Text style={styles.clearTitle}>Clear selected location</Text>
                <Text style={styles.hint}>
                  Browse without a location on this device
                </Text>
              </View>
            </TouchableOpacity>
          )}
          {searching && (
            <ActivityIndicator style={styles.loader} color={colors.primary} />
          )}
          {results.length > 0 && (
            <Text style={styles.section}>SUGGESTED LOCALITIES & ADDRESSES</Text>
          )}
          {results.map(result => (
            <TouchableOpacity
              accessibilityRole="button"
              disabled={busy}
              key={`${result.latitude}:${result.longitude}:${result.label}`}
              style={styles.result}
              onPress={() => select(result)}
            >
              <Icon name="location-outline" size={22} color={colors.primary} />
              <Text style={styles.resultText}>{result.label}</Text>
              <Icon name="chevron-forward" size={18} color={colors.subText} />
            </TouchableOpacity>
          ))}
          {searched && !searching && results.length === 0 && (
            <Text style={styles.subtitle}>
              No matching areas found. Try a nearby landmark or city.
            </Text>
          )}
          {!query && !saved && (
            <Text style={styles.subtitle}>
              You can search manually without sharing your device location.
            </Text>
          )}
          <TouchableOpacity
            disabled={busy}
            style={styles.settings}
            onPress={finish}
          >
            <Text style={styles.hint}>
              {saved ? 'Keep selected location' : 'Browse without location'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    mapAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      minHeight: 80,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
    },
    clearLocation: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
      minHeight: 64,
    },
    clearTitle: { color: colors.danger, fontSize: 14, fontWeight: '600' },
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, gap: 16, paddingBottom: 40 },
    title: { fontSize: 28, fontWeight: '700', color: colors.text },
    subtitle: { fontSize: 14, color: colors.subText, lineHeight: 21 },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      paddingLeft: 14,
      minHeight: 56,
      gap: 10,
      backgroundColor: colors.surfaceSubtle,
    },
    input: { flex: 1, color: colors.text, fontSize: 14, minHeight: 56 },
    clear: {
      minWidth: 48,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gps: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 88,
      padding: 16,
      backgroundColor: colors.primaryLight,
      borderRadius: 16,
    },
    copy: { flex: 1, gap: 6 },
    gpsTitle: { fontSize: 15, fontWeight: '700', color: colors.primary },
    hint: { fontSize: 12, color: colors.subText, lineHeight: 18 },
    error: { color: colors.danger, fontSize: 13, lineHeight: 20 },
    settings: { minHeight: 48, justifyContent: 'center' },
    saved: {
      gap: 8,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    savedTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
    section: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.subText,
      letterSpacing: 0.6,
    },
    loader: { paddingVertical: 16 },
    result: {
      minHeight: 72,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderBottomWidth: 1,
      borderColor: colors.border,
      paddingVertical: 16,
    },
    resultText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 21 },
  });
