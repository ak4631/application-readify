import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Map,
  Camera,
  Marker,
  type CameraRef,
} from '@maplibre/maplibre-react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useStyles } from '../hooks/useStyles';
import { useAuth } from '../context/AuthContext';
import ListingImage from '../components/ListingImage';
import CategoryPicker from '../components/CategoryPicker';
import { useServiceCatalog } from '../hooks/useServiceCatalog';
import { type LibraryCategory } from '../constants/categories';
import { fetchSavedLocation, locationLabel } from '../lib/location';
import { fetchNearbyVendors, type NearbyVendor } from '../lib/discovery';
import type { ThemeColors } from '../constants/colors';

// Key-free vector tile style -- no Google Maps key, no second API key beyond
// LocationIQ (matches the "open-source-friendly, no Google Maps" requirement).
const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const DEFAULT_CENTER: [number, number] = [77.209, 28.6139]; // Delhi NCR, [lng, lat]

export default function MapScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const { session } = useAuth();
  const focusVendorId = route.params?.focusVendorId as string | undefined;

  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [selectedLocality, setSelectedLocality] = useState('Delhi NCR');
  const [hasKnownLocation, setHasKnownLocation] = useState(false);
  const cameraRef = useRef<CameraRef>(null);
  // Tracks whether we've already moved the camera once, so the very first
  // center (handled by Camera's own `initialViewState`) doesn't also trigger
  // a redundant imperative jump.
  const hasCenteredOnce = useRef(false);
  const [selectedCategory, setSelectedCategory] = useState<
    LibraryCategory | 'all'
  >(route.params?.initialCategory ?? 'all');
  const services = useServiceCatalog();
  const [vendors, setVendors] = useState<NearbyVendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // useFocusEffect (not a plain effect) so returning from LocationPermission
  // after setting/changing location refreshes this screen immediately,
  // instead of only ever reading the location that existed when Map first
  // mounted.
  useFocusEffect(
    useCallback(() => {
      if (!session) {
        return;
      }
      fetchSavedLocation(session.user.id)
        .then(saved => {
          if (saved) {
            setCenter([saved.longitude, saved.latitude]);
            setHasKnownLocation(true);
            setSelectedLocality(locationLabel(saved));
          } else {
            setCenter(DEFAULT_CENTER);
            setHasKnownLocation(false);
            setSelectedLocality('Delhi NCR');
          }
        })
        .catch(() => {});
    }, [session]),
  );

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchNearbyVendors({
      latitude: center[1],
      longitude: center[0],
      category: selectedCategory === 'all' ? null : selectedCategory,
      radiusKm: 25,
      limit: 30,
    })
      .then(data => {
        if (isMounted) {
          setVendors(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setVendors([]);
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
  }, [center, selectedCategory]);

  const initialViewState = useMemo(
    () => ({ center, zoom: hasKnownLocation ? 13 : 10 }),
    // Intentionally excludes `center` after first render -- re-running this
    // would fight the user's own map pan/zoom every time nearby vendors
    // reload. The Camera only needs a starting point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasKnownLocation],
  );

  // `initialViewState` (above) only applies once, when the Camera first
  // mounts -- MapLibre does not react to it changing afterwards. So once the
  // user sets or changes their location (from Home or from this screen's own
  // "set location" button) and comes back here, the map would otherwise keep
  // showing wherever it started. Move the camera imperatively instead.
  useEffect(() => {
    if (!hasCenteredOnce.current) {
      hasCenteredOnce.current = true;
      return;
    }
    cameraRef.current?.easeTo({ center, duration: 500 });
  }, [center]);

  const openVendor = (vendor: NearbyVendor) =>
    navigation.navigate('LibraryDetails', {
      libraryId: vendor.id,
      libraryName: vendor.name,
      category: vendor.category,
    });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Change map location"
          style={styles.locationHeading}
          onPress={() =>
            navigation.navigate('LocationPermission', {
              returnTo: 'Map',
              initialCategory: selectedCategory,
            })
          }
        >
          <Text style={styles.headerTitle} numberOfLines={1}>
            {selectedLocality}
          </Text>
          <Text style={styles.locationHint}>Change location</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.toggleButton}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate('LocationPermission', {
                returnTo: 'Map',
                initialCategory: selectedCategory,
              })
            }
          >
            <Icon name="location-outline" size={18} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toggleButton}
            activeOpacity={0.7}
            onPress={() =>
              setViewMode(mode => (mode === 'map' ? 'list' : 'map'))
            }
          >
            <Icon
              name={viewMode === 'map' ? 'list-outline' : 'map-outline'}
              size={18}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.categoryContainer}>
        <CategoryPicker
          selected={selectedCategory}
          onSelect={setSelectedCategory}
          enabled={services.enabled}
          loading={services.loading || services.error}
        />
      </View>
      {!hasKnownLocation && (
        <TouchableOpacity
          style={styles.notice}
          activeOpacity={0.7}
          onPress={() =>
            navigation.navigate('LocationPermission', {
              returnTo: 'Map',
              initialCategory: selectedCategory,
            })
          }
        >
          <Icon
            name="information-circle-outline"
            size={14}
            color={colors.subText}
          />
          <Text style={styles.noticeText}>
            Showing Delhi NCR by default. Tap here to set your location for
            results near you.
          </Text>
          <Icon name="chevron-forward" size={14} color={colors.subText} />
        </TouchableOpacity>
      )}

      {services.error ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Could not check service availability.
          </Text>
          <TouchableOpacity
            style={styles.catalogRetry}
            onPress={services.retry}
          >
            <Text style={{ color: colors.primary }}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : services.loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : selectedCategory !== 'all' && !services.enabled(selectedCategory) ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Coming soon. Choose another category to explore available spaces.
          </Text>
        </View>
      ) : viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          <Map style={styles.map} mapStyle={MAP_STYLE_URL}>
            <Camera ref={cameraRef} initialViewState={initialViewState} />
            {vendors.map(vendor => (
              <Marker
                key={vendor.id}
                lngLat={[vendor.longitude, vendor.latitude]}
                onPress={() => openVendor(vendor)}
              >
                <View
                  style={[
                    styles.markerPin,
                    focusVendorId === vendor.id && styles.markerPinFocused,
                  ]}
                >
                  <Icon name="location" size={20} color={colors.onPrimary} />
                </View>
              </Marker>
            ))}
          </Map>
          {isLoading && (
            <View style={styles.mapLoadingOverlay}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )}
        </View>
      ) : (
        <FlatList
          data={vendors}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyState}>
                <Icon name="search-outline" size={28} color={colors.subText} />
                <Text style={styles.emptyStateText}>
                  No spaces found nearby. Try changing your location.
                </Text>
              </View>
            ) : undefined
          }
          ListFooterComponent={
            isLoading ? (
              <ActivityIndicator
                color={colors.primary}
                style={styles.listLoader}
              />
            ) : undefined
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.listCard}
              activeOpacity={0.85}
              onPress={() => openVendor(item)}
            >
              <ListingImage
                uri={item.image_url}
                category={item.category}
                style={styles.listImage}
              />
              <View style={styles.listInfo}>
                <Text style={styles.listName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.listDistance}>
                  {item.distance_km.toFixed(1)} km away
                </Text>
                <Text style={styles.listAddress} numberOfLines={1}>
                  {[item.city, item.state].filter(Boolean).join(', ')}
                </Text>
              </View>
              <Icon name="chevron-forward" size={20} color={colors.subText} />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    categoryContainer: { paddingHorizontal: 16 },
    catalogRetry: { minHeight: 48, justifyContent: 'center' },
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    locationHeading: {
      flex: 1,
      marginHorizontal: 12,
      minHeight: 48,
      justifyContent: 'center',
    },
    locationHint: { color: colors.primary, fontSize: 11, marginTop: 4 },
    headerTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    toggleButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 4,
    },
    categoryChip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    categoryChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    categoryChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.subText,
    },
    categoryChipTextActive: { color: colors.onPrimary },
    notice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginHorizontal: 16,
      marginTop: 8,
      padding: 10,
      borderRadius: 10,
      backgroundColor: colors.surfaceSubtle,
    },
    noticeText: {
      flex: 1,
      fontSize: 11,
      lineHeight: 16,
      color: colors.subText,
    },
    mapContainer: { flex: 1, marginTop: 10 },
    map: { flex: 1 },
    mapLoadingOverlay: {
      position: 'absolute',
      top: 12,
      right: 12,
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 8,
    },
    markerPin: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.onPrimary,
    },
    markerPinFocused: { backgroundColor: colors.danger },
    listContent: { padding: 16, gap: 10 },
    listCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    listImage: {
      width: 64,
      height: 64,
      borderRadius: 10,
      backgroundColor: colors.surfaceAlt,
    },
    listInfo: { flex: 1 },
    listName: { fontSize: 14, fontWeight: '700', color: colors.text },
    listDistance: {
      marginTop: 3,
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },
    listAddress: { marginTop: 2, fontSize: 11, color: colors.subText },
    listLoader: { marginTop: 16 },
    emptyState: { alignItems: 'center', paddingVertical: 48, gap: 10 },
    emptyStateText: {
      fontSize: 13,
      color: colors.subText,
      textAlign: 'center',
      paddingHorizontal: 32,
    },
  });
