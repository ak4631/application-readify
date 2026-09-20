import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useStyles } from '../hooks/useStyles';
import { Radius } from '../constants/radius';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { getLibraryImage } from '../constants/dummyImages';
import type { ThemeColors } from '../constants/colors';
import { CATEGORIES } from '../constants/categories';
import { fetchSavedLocation } from '../lib/location';
import { fetchNearbyVendors } from '../lib/discovery';
import { LOCATION_PROMPT_SHOWN_KEY } from './LocationPermissionScreen';

const SERVICE_CATEGORIES = CATEGORIES.map(c => ({ id: c.id, icon: c.icon, title: c.name }));

type FeaturedLibrary = {
  id: string;
  name: string;
  locality: string | null;
  city: string | null;
  image_url: string | null;
  distanceKm?: number;
};

function AnimatedCategoryIcon({
  icon,
  index,
  colors,
  styles,
}: {
  icon: string;
  index: number;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -5,
            duration: 900,
            delay: index * 120,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1.05,
            duration: 900,
            delay: index * 120,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [index, scale, translateY]);

  return (
    <Animated.View
      style={[
        styles.animatedCategoryIcon,
        { transform: [{ translateY }, { scale }] },
      ]}
    >
      <Icon name={icon} size={30} color={colors.primary} />
    </Animated.View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const { profile, session } = useAuth();
  const [libraries, setLibraries] = useState<FeaturedLibrary[]>([]);
  const [nearbyVendors, setNearbyVendors] = useState<FeaturedLibrary[] | null>(null);
  const [locationLabel, setLocationLabel] = useState('Set your location');

  const firstName =
    profile?.full_name?.trim().split(' ')[0] ||
    session?.user.email?.split('@')[0] ||
    'there';
  const avatarInitial = firstName.charAt(0).toUpperCase();

  useEffect(() => {
    supabase
      .from('published_listings')
      .select('id, name, locality, city, image_url')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => setLibraries((data as FeaturedLibrary[]) ?? []));
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }
    let isMounted = true;

    (async () => {
      const saved = await fetchSavedLocation(session.user.id).catch(() => null);
      if (!isMounted) {
        return;
      }

      if (saved) {
        setLocationLabel(saved.address ?? 'Current location');
        const nearby = await fetchNearbyVendors({
          latitude: saved.latitude,
          longitude: saved.longitude,
          limit: 2,
        }).catch(() => []);
        if (isMounted) {
          setNearbyVendors(
            nearby.map(v => ({
              id: v.id,
              name: v.name,
              locality: null,
              city: v.city,
              image_url: v.image_url,
              distanceKm: v.distance_km,
            })),
          );
        }
      } else {
        const shown = await AsyncStorage.getItem(LOCATION_PROMPT_SHOWN_KEY);
        if (!shown && isMounted) {
          navigation.navigate('LocationPermission');
        }
      }
    })();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const nearby = nearbyVendors ?? libraries.slice(0, 2);
  const topRated = libraries.slice(2, 6);

  const openLibrary = (library: FeaturedLibrary) =>
    navigation.navigate('LibraryDetails', { libraryId: library.id, libraryName: library.name });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.locationContainer}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('Map')}
            >
              <Icon name="location-sharp" size={16} color={colors.onPrimary} />
              <Text style={styles.locationLabel} numberOfLines={1}>
                {locationLabel}
              </Text>
            </TouchableOpacity>

            <View style={styles.topActions}>
              <TouchableOpacity
                style={styles.headerIconButton}
                activeOpacity={0.75}
                onPress={() => navigation.navigate('Notifications')}
              >
                <Icon name="notifications-outline" size={19} color={colors.onPrimary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.profileButton}
                activeOpacity={0.75}
                onPress={() => navigation.navigate('Profile')}
              >
                <Text style={styles.profileText}>{avatarInitial}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.greetingSection}>
            <Text style={styles.greeting}>Hi, {firstName} 👋</Text>
            <Text style={styles.heading}>
              Find your perfect <Text style={styles.headingAccent}>library</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={styles.searchContainer}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Explore')}
          >
            <Icon name="search" size={19} color={colors.subText} style={styles.searchIcon} />
            <Text style={styles.searchPlaceholder}>Search libraries, areas or cities</Text>
          </TouchableOpacity>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterRow}
          >
            {['Within 2 km', 'Under ₹50/day', 'AC', 'Wi-Fi', '24/7', 'Girls Friendly'].map(
              label => (
                <View key={label} style={styles.filterChip}>
                  <Text style={styles.filterChipText}>{label}</Text>
                </View>
              ),
            )}
          </ScrollView>
        </View>

        <View style={styles.categorySection}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categorySectionTitle}>Explore spaces</Text>
            <Text style={styles.categorySectionSubtitle}>Find your perfect place to study</Text>
          </View>

          <View style={styles.categoryGrid}>
            {SERVICE_CATEGORIES.map((category, index) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Explore', { initialCategory: category.id })}
              >
                <AnimatedCategoryIcon icon={category.icon} index={index} colors={colors} styles={styles} />
                <Text style={styles.categoryText} numberOfLines={2}>
                  {category.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {nearby.length > 0 && (
          <View style={styles.nearbySection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Nearby Libraries</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Explore')}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.libraryRow}>
              {nearby.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.libraryCard}
                  activeOpacity={0.85}
                  onPress={() => openLibrary(item)}
                >
                  <Image
                    source={{ uri: item.image_url ?? getLibraryImage(item.id) }}
                    style={styles.libraryImagePlaceholder}
                    resizeMode="cover"
                  />
                  <View style={styles.libraryInfo}>
                    <Text style={styles.libraryName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.libraryRating} numberOfLines={1}>
                      {item.distanceKm != null
                        ? `${item.distanceKm.toFixed(1)} km away`
                        : [item.locality, item.city].filter(Boolean).join(', ') || 'Delhi NCR'}
                    </Text>
                    <View style={styles.libraryBottomRow}>
                      <Text style={styles.libraryPrice}>₹40/day</Text>
                      <View style={styles.bookButton}>
                        <Text style={styles.bookButtonText}>View</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {topRated.length > 0 && (
          <View style={styles.topRatedSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>More to Explore</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Explore')}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.topRatedScroll}
            >
              {topRated.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.topRatedCard}
                  activeOpacity={0.85}
                  onPress={() => openLibrary(item)}
                >
                  <Image
                    source={{ uri: item.image_url ?? getLibraryImage(item.id) }}
                    style={styles.topRatedImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.topRatedName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.topRatedRating} numberOfLines={1}>
                    {[item.locality, item.city].filter(Boolean).join(', ') || 'Delhi NCR'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.bottomNavItem} activeOpacity={0.75}>
          <View style={styles.activeNavIconContainer}>
            <Icon name="home" size={17} color={colors.primary} />
          </View>
          <Text style={styles.bottomNavTextActive}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomNavItem}
          activeOpacity={0.75}
          onPress={() => navigation.navigate('Explore')}
        >
          <Icon name="search-outline" size={19} color={colors.onPrimary} style={styles.bottomNavIcon} />
          <Text style={styles.bottomNavText}>Explore</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomNavItem}
          activeOpacity={0.75}
          onPress={() => navigation.navigate('Bookings')}
        >
          <Icon name="calendar-outline" size={19} color={colors.onPrimary} style={styles.bottomNavIcon} />
          <Text style={styles.bottomNavText}>Bookings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomNavItem}
          activeOpacity={0.75}
          onPress={() => navigation.navigate('MySubscriptions')}
        >
          <Icon name="diamond-outline" size={19} color={colors.onPrimary} style={styles.bottomNavIcon} />
          <Text style={styles.bottomNavText}>Subscriptions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomNavItem}
          activeOpacity={0.75}
          onPress={() => navigation.navigate('Profile')}
        >
          <Icon name="person-outline" size={19} color={colors.onPrimary} style={styles.bottomNavIcon} />
          <Text style={styles.bottomNavText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1 },
    contentContainer: { paddingBottom: 96 },
    headerSection: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 4 : 14,
      paddingBottom: 22,
      borderBottomLeftRadius: Radius.xl,
      borderBottomRightRadius: Radius.xl,
    },
    topRow: {
      width: '100%',
      minHeight: 40,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    locationContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
    locationLabel: { fontSize: 16, lineHeight: 20, fontWeight: '700', color: colors.onPrimary },
    topActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 9 },
    headerIconButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.15)',
    },
    profileButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.onPrimary,
    },
    profileText: { color: colors.primary, fontSize: 15, lineHeight: 18, fontWeight: '800' },
    greetingSection: { marginTop: 20 },
    greeting: { fontSize: 16, lineHeight: 21, color: 'rgba(255,255,255,0.82)', marginBottom: 7 },
    heading: { fontSize: 29, lineHeight: 37, fontWeight: '800', color: colors.onPrimary },
    headingAccent: { color: '#AEEFFF' },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      height: 55,
      marginTop: 18,
      paddingHorizontal: 18,
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
    },
    searchIcon: { marginRight: 10 },
    searchPlaceholder: { flex: 1, fontSize: 16, color: colors.placeholder },
    filterScroll: { marginTop: 12 },
    filterRow: { flexDirection: 'row', alignItems: 'center', paddingRight: 20, gap: 7 },
    filterChip: {
      height: 30,
      paddingHorizontal: 14,
      borderRadius: Radius.full,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.45)',
      backgroundColor: 'rgba(255,255,255,0.13)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterChipText: { fontSize: 13, fontWeight: '600', color: colors.onPrimary },
    categorySection: { marginTop: 24, paddingHorizontal: 16 },
    categoryHeader: { marginBottom: 14 },
    categorySectionTitle: { fontSize: 23, lineHeight: 28, fontWeight: '800', color: colors.text },
    categorySectionSubtitle: { marginTop: 3, fontSize: 13, lineHeight: 18, color: colors.subText },
    categoryGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'stretch',
      paddingHorizontal: 16,
      marginTop: 18,
    },
    categoryCard: {
      position: 'relative',
      width: '23.5%',
      minHeight: 128,
      borderRadius: Radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#1D4ED8',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 3,
    },
    animatedCategoryIcon: {
      height: 54,
      width: 54,
      borderRadius: 27,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoryText: {
      marginTop: 8,
      paddingHorizontal: 4,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    categoryArrow: {
      position: 'absolute',
      right: 7,
      bottom: 7,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    nearbySection: { marginTop: 26, paddingHorizontal: 16 },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    sectionTitle: { fontSize: 23, lineHeight: 28, fontWeight: '800', color: colors.text },
    seeAllText: { fontSize: 15, fontWeight: '700', color: colors.primary },
    libraryRow: { flexDirection: 'row', gap: 8 },
    libraryCard: {
      flex: 1,
      overflow: 'hidden',
      borderRadius: Radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    libraryImagePlaceholder: {
      height: 100,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    libraryInfo: { padding: 12 },
    libraryName: { fontSize: 15, fontWeight: '700', color: colors.text },
    libraryRating: { marginTop: 6, fontSize: 12, color: colors.subText },
    libraryBottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 12,
    },
    libraryPrice: { fontSize: 14, fontWeight: '800', color: colors.text },
    bookButton: {
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 9,
      backgroundColor: colors.primary,
    },
    bookButtonText: { fontSize: 11, fontWeight: '700', color: colors.onPrimary },
    topRatedSection: { marginTop: 28, marginBottom: 24 },
    topRatedScroll: { paddingHorizontal: 16, paddingRight: 8, gap: 8 },
    topRatedCard: {
      width: 150,
      borderRadius: Radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      paddingBottom: 12,
    },
    topRatedImage: {
      width: '100%',
      height: 90,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    topRatedName: { marginTop: 10, paddingHorizontal: 10, fontSize: 13, fontWeight: '700', color: colors.text },
    topRatedRating: { marginTop: 5, paddingHorizontal: 10, fontSize: 11, color: colors.subText },
    bottomNavigation: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 76,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      backgroundColor: colors.primary,
      paddingHorizontal: 4,
      paddingBottom: 6,
      borderTopLeftRadius: Radius.lg,
      borderTopRightRadius: Radius.lg,
    },
    bottomNavItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    activeNavIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.onPrimary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 3,
    },
    bottomNavIcon: { marginBottom: 5 },
    bottomNavText: { fontSize: 10, fontWeight: '600', color: colors.onPrimary, textAlign: 'center' },
    bottomNavTextActive: { fontSize: 10, fontWeight: '800', color: colors.onPrimary, textAlign: 'center' },
  });
