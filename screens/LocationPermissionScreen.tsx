import React, { useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStyles } from '../hooks/useStyles';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { requestLocationPermission, getCurrentPosition, saveUserLocation } from '../lib/location';
import { searchAddress, reverseGeocode, type GeocodeResult } from '../lib/geocoding';
import type { ThemeColors } from '../constants/colors';

export const LOCATION_PROMPT_SHOWN_KEY = 'readify:locationPromptShown';

export default function LocationPermissionScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const { session } = useAuth();

  const [isLocating, setIsLocating] = useState(false);
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const finish = async () => {
    await AsyncStorage.setItem(LOCATION_PROMPT_SHOWN_KEY, 'true');
    navigation.replace('Home');
  };

  const handleUseCurrentLocation = async () => {
    if (!session) {
      return;
    }
    setErrorMessage(null);
    setIsLocating(true);
    try {
      const status = await requestLocationPermission();
      if (status !== 'granted') {
        setErrorMessage('Location permission was denied. You can set your location manually instead.');
        setShowManualSearch(true);
        return;
      }

      const position = await getCurrentPosition();
      const address = await reverseGeocode(position.latitude, position.longitude).catch(() => null);

      await saveUserLocation(session.user.id, {
        ...position,
        address,
        source: 'gps',
        permissionStatus: 'granted',
      });

      await finish();
    } catch {
      setErrorMessage('Could not get your current location. Please try again or set it manually.');
      setShowManualSearch(true);
    } finally {
      setIsLocating(false);
    }
  };

  const handleQueryChange = async (value: string) => {
    setQuery(value);
    if (value.trim().length < 3) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    try {
      setResults(await searchAddress(value));
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = async (result: GeocodeResult) => {
    if (!session) {
      return;
    }
    try {
      await saveUserLocation(session.user.id, {
        latitude: result.latitude,
        longitude: result.longitude,
        address: result.label,
        source: 'manual',
        permissionStatus: 'undetermined',
      });
      await finish();
    } catch {
      setErrorMessage('Could not save that location. Please try again.');
    }
  };

  const handleSkip = async () => {
    await finish();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Icon name="location" size={36} color={colors.onPrimary} />
        </View>

        <Text style={styles.title}>Find spaces near you</Text>
        <Text style={styles.subtitle}>
          Readify uses your location to show nearby libraries, gyms, exam hubs and study cafes,
          along with distance from where you are.
        </Text>

        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.85}
          onPress={handleUseCurrentLocation}
          disabled={isLocating}
        >
          {isLocating ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <>
              <Icon name="locate" size={18} color={colors.onPrimary} />
              <Text style={styles.primaryButtonText}>Use my current location</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.85}
          onPress={() => setShowManualSearch(v => !v)}
        >
          <Text style={styles.secondaryButtonText}>Enter location manually</Text>
        </TouchableOpacity>

        {showManualSearch && (
          <View style={styles.searchSection}>
            <View style={styles.searchInputRow}>
              <Icon name="search" size={18} color={colors.subText} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={handleQueryChange}
                placeholder="Search for your city or area"
                placeholderTextColor={colors.placeholder}
              />
              {isSearching && <ActivityIndicator size="small" color={colors.primary} />}
            </View>

            {results.map((result, index) => (
              <TouchableOpacity
                key={index}
                style={styles.resultRow}
                activeOpacity={0.7}
                onPress={() => handleSelectResult(result)}
              >
                <Icon name="location-outline" size={16} color={colors.subText} />
                <Text style={styles.resultText} numberOfLines={2}>
                  {result.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.skipButton} activeOpacity={0.7} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1, paddingHorizontal: 24, paddingTop: 48, alignItems: 'center' },
    iconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: { fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center' },
    subtitle: {
      marginTop: 12,
      fontSize: 14,
      lineHeight: 21,
      color: colors.subText,
      textAlign: 'center',
    },
    errorText: {
      marginTop: 16,
      fontSize: 12,
      lineHeight: 18,
      color: colors.danger,
      textAlign: 'center',
    },
    primaryButton: {
      width: '100%',
      minHeight: 52,
      marginTop: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    primaryButtonText: { fontSize: 15, fontWeight: '700', color: colors.onPrimary },
    secondaryButton: {
      width: '100%',
      minHeight: 48,
      marginTop: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    secondaryButtonText: { fontSize: 14, fontWeight: '700', color: colors.text },
    searchSection: { width: '100%', marginTop: 16 },
    searchInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 48,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 14, color: colors.text },
    resultRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    resultText: { flex: 1, fontSize: 13, lineHeight: 18, color: colors.text },
    skipButton: { marginTop: 20, paddingVertical: 10 },
    skipButtonText: { fontSize: 13, fontWeight: '600', color: colors.subText },
  });
