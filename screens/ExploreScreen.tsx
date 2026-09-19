import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useStyles } from '../hooks/useStyles';
import { Radius } from '../constants/radius';
import { supabase } from '../lib/supabase';
import { getLibraryImage } from '../constants/dummyImages';
import type { ThemeColors } from '../constants/colors';
import { CATEGORIES } from '../constants/categories';
import type { LibraryCategory } from '../constants/categories';
import { useAuth } from '../context/AuthContext';
import { fetchSavedLocation } from '../lib/location';
import { fetchNearbyVendors } from '../lib/discovery';

export type { LibraryCategory };

type Library = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  locality: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  website_url: string | null;
  status: string | null;
  category: LibraryCategory;
  is_active: boolean;
  image_url: string | null;
  distance_km?: number;
};

export default function ExploreScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const { session } = useAuth();
  const initialCategory = route.params?.initialCategory as LibraryCategory | undefined;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<LibraryCategory | 'all'>(
    initialCategory ?? 'all',
  );
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null,
  );

  useEffect(() => {
    if (!session) {
      return;
    }
    fetchSavedLocation(session.user.id)
      .then(saved => {
        if (saved) {
          setUserLocation({ latitude: saved.latitude, longitude: saved.longitude });
        }
      })
      .catch(() => {});
  }, [session]);

  // Fallback: full directory listing, used until a saved location is known.
  // The nearby-aware effect below takes over (and this one stops re-running
  // real work) once userLocation is set.
  useEffect(() => {
    if (userLocation) {
      return;
    }
    let isMounted = true;

    const loadLibraries = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      const { data, error } = await supabase
        .from('published_listings')
        .select(
          `
            id,
            name,
            slug,
            description,
            address_line_1,
            address_line_2,
            locality,
            city,
            state,
            postal_code,
            website_url,
            status,
            category,
            is_active,
            image_url
          `,
        )
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error(
          `ExploreScreen: failed to load libraries | message=${error.message} | code=${error.code} | details=${error.details} | hint=${error.hint}`,
        );
        setLibraries([]);
        setErrorMessage(
          `Supabase Error\n\nMessage: ${error.message || 'Unknown error'}\n\nCode: ${error.code || 'N/A'}\n\nDetails: ${error.details || 'N/A'}\n\nHint: ${error.hint || 'N/A'}`,
        );
      } else {
        setLibraries((data ?? []) as Library[]);
      }

      setIsLoading(false);
    };

    loadLibraries();

    return () => {
      isMounted = false;
    };
  }, [userLocation]);

  // Nearby-aware listing, server-side category filter + distance, once a
  // saved location is known.
  useEffect(() => {
    if (!userLocation) {
      return;
    }
    let isMounted = true;

    setIsLoading(true);
    setErrorMessage(null);

    fetchNearbyVendors({
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      category: selectedCategory === 'all' ? null : selectedCategory,
      radiusKm: 50,
      limit: 50,
    })
      .then(nearby => {
        if (!isMounted) {
          return;
        }
        setLibraries(
          nearby.map(v => ({
            id: v.id,
            name: v.name,
            slug: v.slug,
            description: v.description,
            address_line_1: v.address_line_1,
            address_line_2: v.address_line_2,
            locality: null,
            city: v.city,
            state: v.state,
            postal_code: v.postal_code,
            website_url: v.website_url,
            status: 'published',
            category: v.category,
            is_active: true,
            image_url: v.image_url,
            distance_km: v.distance_km,
          })),
        );
      })
      .catch((error: any) => {
        if (isMounted) {
          setLibraries([]);
          setErrorMessage(error?.message ?? 'Could not load nearby listings.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [userLocation, selectedCategory]);

  const filteredLibraries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return libraries.filter(library => {
      const searchableText = [
        library.name,
        library.slug,
        library.description,
        library.address_line_1,
        library.address_line_2,
        library.locality,
        library.city,
        library.state,
        library.postal_code,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = query.length === 0 || searchableText.includes(query);
      const matchesCategory = selectedCategory === 'all' || library.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [libraries, searchQuery, selectedCategory]);

  const handleCategoryPress = (category: LibraryCategory) => {
    setSelectedCategory(current => (current === category ? 'all' : category));
  };

  const openLibrary = (library: Library) => {
    navigation.navigate('LibraryDetails', {
      libraryId: library.id,
      libraryName: library.name,
    });
  };

  const getLocation = (library: Library) =>
    library.distance_km != null
      ? `${library.distance_km.toFixed(1)} km away`
      : [library.locality, library.city, library.state].filter(Boolean).join(', ');

  const getAddress = (library: Library) =>
    [
      library.address_line_1,
      library.address_line_2,
      library.locality,
      library.city,
      library.state,
      library.postal_code,
    ]
      .filter(Boolean)
      .join(', ');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Explore</Text>
          <Text style={styles.subtitle}>Discover libraries and reading spaces around you.</Text>
        </View>

        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color={colors.subText} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search libraries, areas or cities"
            placeholderTextColor={colors.placeholder}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              activeOpacity={0.7}
              style={styles.clearButton}
            >
              <Icon name="close" size={16} color={colors.subText} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionTitle}>Explore by Type</Text>

        <View style={styles.categoryGrid}>
          {CATEGORIES.map(category => {
            const isSelected = selectedCategory === category.id;

            return (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryCard, isSelected && styles.selectedCategoryCard]}
                activeOpacity={0.7}
                onPress={() => handleCategoryPress(category.id)}
              >
                <Icon
                  name={category.icon}
                  size={26}
                  color={isSelected ? colors.primary : colors.subText}
                  style={styles.categoryIcon}
                />
                <Text style={[styles.categoryText, isSelected && styles.selectedCategoryText]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.resultsHeader}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'all'
              ? 'Popular Near You'
              : CATEGORIES.find(c => c.id === selectedCategory)?.name}
          </Text>
          {selectedCategory !== 'all' && (
            <TouchableOpacity activeOpacity={0.7} onPress={() => setSelectedCategory('all')}>
              <Text style={styles.clearFilterText}>Clear filter</Text>
            </TouchableOpacity>
          )}
        </View>

        {isLoading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.stateTitle}>Finding libraries</Text>
            <Text style={styles.stateText}>Please wait while we load available libraries.</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.stateCard}>
            <View style={styles.noResultsIconCircle}>
              <Icon name="alert-circle-outline" size={30} color={colors.primary} />
            </View>
            <Text style={styles.stateTitle}>Something went wrong</Text>
            <Text style={styles.stateText}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.resetButton}
              activeOpacity={0.8}
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
            >
              <Text style={styles.resetButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredLibraries.length > 0 ? (
          filteredLibraries.map(library => {
            const location = getLocation(library);
            const address = getAddress(library);

            return (
              <TouchableOpacity
                key={library.id}
                style={styles.libraryCard}
                activeOpacity={0.85}
                onPress={() => openLibrary(library)}
              >
                <Image
                  source={{ uri: library.image_url ?? getLibraryImage(library.id) }}
                  style={styles.imagePlaceholder}
                  resizeMode="cover"
                />

                <View style={styles.libraryInfo}>
                  <View style={styles.libraryTopRow}>
                    <View style={styles.libraryNameContainer}>
                      <Text style={styles.libraryName} numberOfLines={2}>
                        {library.name}
                      </Text>
                      <Text style={styles.libraryCategory}>
                        {CATEGORIES.find(c => c.id === library.category)?.name ?? 'Library'}
                      </Text>
                    </View>
                    <Icon name="chevron-forward" size={22} color={colors.primary} />
                  </View>

                  {location.length > 0 && (
                    <View style={styles.libraryLocationRow}>
                      <Icon name="location-outline" size={14} color={colors.subText} />
                      <Text style={styles.libraryLocation} numberOfLines={2}>
                        {location}
                      </Text>
                    </View>
                  )}

                  {address.length > 0 && (
                    <Text style={styles.libraryAddress} numberOfLines={2}>
                      {address}
                    </Text>
                  )}

                  <View style={styles.viewDetailsRow}>
                    <Text style={styles.viewDetailsText}>View library details</Text>
                    <Icon name="arrow-forward" size={14} color={colors.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.noResultsCard}>
            <View style={styles.noResultsIconCircle}>
              <Icon name="search" size={28} color={colors.primary} />
            </View>
            <Text style={styles.noResultsTitle}>No libraries found</Text>
            <Text style={styles.noResultsText}>
              Try a different search or explore another category.
            </Text>
            <TouchableOpacity
              style={styles.resetButton}
              activeOpacity={0.8}
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
            >
              <Text style={styles.resetButtonText}>Reset Search</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1 },
    contentContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
    header: { marginTop: 8 },
    title: { fontSize: 30, lineHeight: 36, fontWeight: '700', color: colors.text },
    subtitle: { marginTop: 8, fontSize: 16, lineHeight: 24, color: colors.subText },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 54,
      marginTop: 24,
      paddingHorizontal: 16,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Radius.lg,
    },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 15, color: colors.text, paddingVertical: 0 },
    clearButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.border,
    },
    sectionTitle: { marginTop: 28, marginBottom: 14, fontSize: 20, lineHeight: 26, fontWeight: '700', color: colors.text },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
    categoryCard: {
      width: '48%',
      minHeight: 92,
      borderRadius: Radius.lg,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 16,
    },
    selectedCategoryCard: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
    categoryIcon: { marginBottom: 8 },
    categoryText: { fontSize: 13, fontWeight: '600', color: colors.subText, textAlign: 'center' },
    selectedCategoryText: { color: colors.primary, fontWeight: '700' },
    resultsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    clearFilterText: { marginTop: 28, marginBottom: 14, fontSize: 13, fontWeight: '600', color: colors.primary },
    libraryCard: {
      marginBottom: 16,
      overflow: 'hidden',
      borderRadius: Radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    imagePlaceholder: { height: 130, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
    libraryInfo: { padding: 16 },
    libraryTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    libraryNameContainer: { flex: 1, paddingRight: 12 },
    libraryName: { fontSize: 18, fontWeight: '700', color: colors.text },
    libraryCategory: { marginTop: 4, fontSize: 12, fontWeight: '600', color: colors.subText },
    libraryLocationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginTop: 12 },
    libraryLocation: { flex: 1, fontSize: 14, lineHeight: 20, color: colors.text },
    libraryAddress: { marginTop: 6, fontSize: 13, lineHeight: 19, color: colors.subText },
    viewDetailsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
    viewDetailsText: { fontSize: 14, fontWeight: '700', color: colors.primary },
    stateCard: {
      marginTop: 4,
      paddingHorizontal: 24,
      paddingVertical: 36,
      borderRadius: Radius.xl,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    stateTitle: { marginTop: 16, fontSize: 19, fontWeight: '700', color: colors.text, textAlign: 'center' },
    stateText: { marginTop: 8, fontSize: 14, lineHeight: 21, color: colors.subText, textAlign: 'center' },
    noResultsCard: {
      marginTop: 4,
      paddingHorizontal: 24,
      paddingVertical: 36,
      borderRadius: Radius.xl,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    noResultsIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    noResultsTitle: { fontSize: 19, fontWeight: '700', color: colors.text, textAlign: 'center' },
    noResultsText: { marginTop: 8, fontSize: 14, lineHeight: 21, color: colors.subText, textAlign: 'center' },
    resetButton: {
      marginTop: 22,
      minHeight: 46,
      paddingHorizontal: 20,
      borderRadius: Radius.md,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    resetButtonText: { fontSize: 14, fontWeight: '700', color: colors.onPrimary },
  });
