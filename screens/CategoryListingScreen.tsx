import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import { useTheme } from '../context/ThemeContext';
import { useStyles } from '../hooks/useStyles';
import { Radius } from '../constants/radius';
import { supabase } from '../lib/supabase';
import { getLibraryImage } from '../constants/dummyImages';
import type { ThemeColors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { fetchSavedLocation } from '../lib/location';
import { fetchNearbyVendors } from '../lib/discovery';

type Listing = {
  id: string;
  name: string;
  description: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  locality: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  image_url: string | null;
  distance_km?: number;
};

// A category tile on Home lands here: one category, already filtered, no
// search bar and no category-switcher chips -- unlike Explore, which stays
// exactly as it was (still reachable via search/bottom nav/"See all") and is
// not touched by this screen at all.
export default function CategoryListingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const { session } = useAuth();
  const { categoryId, categoryName } = route.params;

  const [listings, setListings] = useState<Listing[]>([]);
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

  // Fallback: directory listing for this category only, used until a saved
  // location is known -- the nearby-aware effect below takes over once it is.
  useEffect(() => {
    if (userLocation) {
      return;
    }
    let isMounted = true;

    (async () => {
      setIsLoading(true);
      setErrorMessage(null);

      const { data, error } = await supabase
        .from('published_listings')
        .select(
          'id, name, description, address_line_1, address_line_2, locality, city, state, postal_code, image_url',
        )
        .eq('is_active', true)
        .eq('category', categoryId)
        .order('name', { ascending: true });

      if (!isMounted) {
        return;
      }
      if (error) {
        setListings([]);
        setErrorMessage(error.message || 'Could not load listings.');
      } else {
        setListings((data ?? []) as Listing[]);
      }
      setIsLoading(false);
    })();

    return () => {
      isMounted = false;
    };
  }, [userLocation, categoryId]);

  // Nearby-aware listing, once a saved location is known.
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
      category: categoryId,
      radiusKm: 50,
      limit: 50,
    })
      .then(nearby => {
        if (!isMounted) {
          return;
        }
        setListings(
          nearby.map(v => ({
            id: v.id,
            name: v.name,
            description: v.description,
            address_line_1: v.address_line_1,
            address_line_2: v.address_line_2,
            locality: null,
            city: v.city,
            state: v.state,
            postal_code: v.postal_code,
            image_url: v.image_url,
            distance_km: v.distance_km,
          })),
        );
      })
      .catch((error: any) => {
        if (isMounted) {
          setListings([]);
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
  }, [userLocation, categoryId]);

  const openLibrary = (listing: Listing) =>
    navigation.navigate('LibraryDetails', { libraryId: listing.id, libraryName: listing.name });

  const getLocation = (listing: Listing) =>
    listing.distance_km != null
      ? `${listing.distance_km.toFixed(1)} km away`
      : [listing.locality, listing.city, listing.state].filter(Boolean).join(', ');

  const getAddress = (listing: Listing) =>
    [listing.address_line_1, listing.address_line_2, listing.locality, listing.city, listing.state, listing.postal_code]
      .filter(Boolean)
      .join(', ');

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={categoryName} />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.stateTitle}>Finding {categoryName.toLowerCase()}</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.stateCard}>
            <Icon name="alert-circle-outline" size={30} color={colors.primary} />
            <Text style={styles.stateTitle}>Something went wrong</Text>
            <Text style={styles.stateText}>{errorMessage}</Text>
          </View>
        ) : listings.length > 0 ? (
          listings.map(listing => {
            const location = getLocation(listing);
            const address = getAddress(listing);

            return (
              <TouchableOpacity
                key={listing.id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => openLibrary(listing)}
              >
                <Image
                  source={{ uri: listing.image_url ?? getLibraryImage(listing.id) }}
                  style={styles.imagePlaceholder}
                  resizeMode="cover"
                />
                <View style={styles.info}>
                  <View style={styles.topRow}>
                    <Text style={styles.name} numberOfLines={2}>
                      {listing.name}
                    </Text>
                    <Icon name="chevron-forward" size={22} color={colors.primary} />
                  </View>
                  {location.length > 0 && (
                    <View style={styles.locationRow}>
                      <Icon name="location-outline" size={14} color={colors.subText} />
                      <Text style={styles.location} numberOfLines={2}>
                        {location}
                      </Text>
                    </View>
                  )}
                  {address.length > 0 && (
                    <Text style={styles.address} numberOfLines={2}>
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
          <View style={styles.stateCard}>
            <Icon name="search" size={28} color={colors.primary} />
            <Text style={styles.stateTitle}>No {categoryName.toLowerCase()} found</Text>
            <Text style={styles.stateText}>Check back soon, or explore another category.</Text>
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
    card: {
      marginBottom: 16,
      overflow: 'hidden',
      borderRadius: Radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    imagePlaceholder: { height: 130, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
    info: { padding: 16 },
    topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
    name: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text },
    locationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginTop: 12 },
    location: { flex: 1, fontSize: 14, lineHeight: 20, color: colors.text },
    address: { marginTop: 6, fontSize: 13, lineHeight: 19, color: colors.subText },
    viewDetailsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
    viewDetailsText: { fontSize: 14, fontWeight: '700', color: colors.primary },
    stateCard: {
      marginTop: 24,
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
  });
