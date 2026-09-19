import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useStyles } from '../hooks/useStyles';
import { Radius } from '../constants/radius';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { getLibraryImage } from '../constants/dummyImages';
import { fetchPlans, type Plan } from '../lib/plans';
import { fetchReviews, submitReview, type Review } from '../lib/reviews';
import type { ThemeColors } from '../constants/colors';

type Library = {
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
  average_rating: number | null;
  review_count: number;
};

function StarPicker({
  value,
  onChange,
  colors,
  styles,
}: {
  value: number;
  onChange: (rating: number) => void;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map(star => (
        <TouchableOpacity key={star} activeOpacity={0.7} onPress={() => onChange(star)}>
          <Icon
            name={star <= value ? 'star' : 'star-outline'}
            size={26}
            color={colors.warning}
            style={styles.starIcon}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function LibraryDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const { session } = useAuth();
  const { libraryId, libraryName } = route.params;

  const [library, setLibrary] = useState<Library | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const scrollViewRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const reviewFormY = useRef(0);

  const scrollToReviewForm = () => {
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({ y: Math.max(reviewFormY.current - 16, 0), animated: true });
    });
  };

  useEffect(() => {
    let isMounted = true;

    supabase
      .from('published_listings')
      .select(
        'id, name, description, address_line_1, address_line_2, locality, city, state, postal_code, image_url, average_rating, review_count',
      )
      .eq('id', libraryId)
      .single()
      .then(({ data }) => {
        if (isMounted) {
          setLibrary((data as Library) ?? null);
          setIsLoading(false);
        }
      });

    fetchPlans(libraryId)
      .then(data => {
        if (isMounted) {
          setPlans(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPlans([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [libraryId]);

  const loadReviews = useCallback(() => {
    setIsLoadingReviews(true);
    fetchReviews(libraryId)
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setIsLoadingReviews(false));
  }, [libraryId]);

  useFocusEffect(
    useCallback(() => {
      loadReviews();
    }, [loadReviews]),
  );

  const location = library
    ? [library.locality, library.city, library.state].filter(Boolean).join(', ')
    : '';

  const address = library
    ? [
        library.address_line_1,
        library.address_line_2,
        library.locality,
        library.city,
        library.state,
        library.postal_code,
      ]
        .filter(Boolean)
        .join(', ')
    : '';

  const cheapestPlan = plans.length > 0 ? plans[0] : null;
  const ratingDisplay = library?.average_rating != null ? library.average_rating.toFixed(1) : 'New';

  const handleSubmitReview = async () => {
    if (!session) {
      Alert.alert('Login required', 'Please log in to leave a review.');
      return;
    }
    if (reviewRating === 0) {
      Alert.alert('Add a rating', 'Please select a star rating before submitting.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      await submitReview({ vendorId: libraryId, rating: reviewRating, reviewText });
      setReviewRating(0);
      setReviewText('');
      loadReviews();
      Alert.alert('Thank you', 'Your review has been posted.');
    } catch (error: any) {
      Alert.alert('Could not post review', error.message ?? 'Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'android' ? 24 : 0}
      >
      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={{ uri: library?.image_url ?? getLibraryImage(libraryId) }}
          style={styles.imagePlaceholder}
          resizeMode="cover"
        />

        <View style={styles.headerSection}>
          <Text style={styles.title}>{libraryName}</Text>
          <View style={styles.ratingRow}>
            <Icon name="star" size={14} color={colors.warning} />
            <Text style={styles.rating}>
              {ratingDisplay} · {library?.review_count ?? 0} review{library?.review_count === 1 ? '' : 's'}
            </Text>
          </View>
          {isLoading ? (
            <ActivityIndicator style={styles.locationLoader} color={colors.primary} />
          ) : (
            location.length > 0 && <Text style={styles.location}>{location}</Text>
          )}
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <Text style={styles.infoValue}>{cheapestPlan ? `₹${cheapestPlan.price}` : '—'}</Text>
            <Text style={styles.infoLabel}>{cheapestPlan ? 'Starting price' : 'No plans yet'}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoValue}>24/7</Text>
            <Text style={styles.infoLabel}>Open</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoValue}>{ratingDisplay}</Text>
            <Text style={styles.infoLabel}>Rating</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Amenities</Text>
        <View style={styles.amenitiesGrid}>
          <View style={styles.amenity}>
            <Icon name="snow-outline" size={18} color={colors.primary} style={styles.amenityIcon} />
            <Text style={styles.amenityText}>AC</Text>
          </View>
          <View style={styles.amenity}>
            <Icon name="wifi-outline" size={18} color={colors.primary} style={styles.amenityIcon} />
            <Text style={styles.amenityText}>Wi-Fi</Text>
          </View>
          <View style={styles.amenity}>
            <Icon name="flash-outline" size={18} color={colors.primary} style={styles.amenityIcon} />
            <Text style={styles.amenityText}>Power Backup</Text>
          </View>
          <View style={styles.amenity}>
            <Icon name="time-outline" size={18} color={colors.primary} style={styles.amenityIcon} />
            <Text style={styles.amenityText}>24/7</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>About this library</Text>
        <Text style={styles.description}>
          {library?.description ||
            'A comfortable study space designed for students and professionals looking for a focused reading environment.'}
        </Text>

        <Text style={styles.sectionTitle}>Address</Text>
        <View style={styles.addressCard}>
          <Text style={styles.addressTitle}>{libraryName}</Text>
          <Text style={styles.addressText}>{address || 'Address not available'}</Text>
        </View>

        <Text style={styles.sectionTitle}>Reviews</Text>

        <View
          style={styles.reviewFormCard}
          onLayout={event => {
            reviewFormY.current = event.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.reviewFormTitle}>Write a review</Text>
          <StarPicker value={reviewRating} onChange={setReviewRating} colors={colors} styles={styles} />
          <TextInput
            style={styles.reviewInput}
            placeholder="Share your experience (optional)"
            placeholderTextColor={colors.placeholder}
            value={reviewText}
            onChangeText={setReviewText}
            onFocus={scrollToReviewForm}
            multiline
            editable={!isSubmittingReview}
          />
          <TouchableOpacity
            style={[styles.reviewSubmitButton, isSubmittingReview && styles.reviewSubmitButtonDisabled]}
            activeOpacity={0.8}
            onPress={handleSubmitReview}
            disabled={isSubmittingReview}
          >
            {isSubmittingReview ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.reviewSubmitText}>Post Review</Text>
            )}
          </TouchableOpacity>
        </View>

        {isLoadingReviews ? (
          <ActivityIndicator color={colors.primary} style={styles.reviewsLoader} />
        ) : reviews.length > 0 ? (
          reviews.map(review => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewCardHeader}>
                <Text style={styles.reviewAuthor}>{review.user_name ?? 'Reader'}</Text>
                <View style={styles.reviewStars}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Icon
                      key={star}
                      name={star <= review.rating ? 'star' : 'star-outline'}
                      size={12}
                      color={colors.warning}
                    />
                  ))}
                </View>
              </View>
              {review.review_text && <Text style={styles.reviewText}>{review.review_text}</Text>}
            </View>
          ))
        ) : (
          <Text style={styles.noReviewsText}>No reviews yet. Be the first to share your experience.</Text>
        )}

        <TouchableOpacity
          style={styles.bookButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Booking', { libraryId, libraryName })}
        >
          <Icon name="calendar-outline" size={18} color={colors.onPrimary} style={styles.bookButtonIcon} />
          <Text style={styles.bookButtonText}>Book a Session</Text>
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1 },
    contentContainer: { paddingBottom: 32 },
    imagePlaceholder: { height: 220, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
    headerSection: { paddingHorizontal: 20, paddingTop: 20 },
    title: { fontSize: 28, lineHeight: 34, fontWeight: '700', color: colors.text },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
    rating: { fontSize: 14, fontWeight: '600', color: colors.text },
    location: { marginTop: 5, fontSize: 14, color: colors.subText },
    locationLoader: { marginTop: 8, alignSelf: 'flex-start' },
    infoRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 20 },
    infoCard: {
      flex: 1,
      minHeight: 76,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    infoValue: { fontSize: 17, fontWeight: '700', color: colors.primary },
    infoLabel: { marginTop: 4, fontSize: 11, color: colors.subText },
    sectionTitle: { marginTop: 28, marginBottom: 12, paddingHorizontal: 20, fontSize: 19, fontWeight: '700', color: colors.text },
    amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20 },
    amenity: {
      width: '48%',
      minHeight: 54,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      borderRadius: 13,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    amenityIcon: { width: 28, textAlign: 'center' },
    amenityText: { marginLeft: 8, fontSize: 13, fontWeight: '600', color: colors.text },
    description: { paddingHorizontal: 20, fontSize: 14, lineHeight: 21, color: colors.subText },
    addressCard: {
      marginHorizontal: 20,
      padding: 16,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    addressTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
    addressText: { marginTop: 5, fontSize: 13, color: colors.subText },
    reviewFormCard: {
      marginHorizontal: 20,
      padding: 16,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    reviewFormTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
    starRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
    starIcon: { marginRight: 2 },
    reviewInput: {
      marginTop: 12,
      minHeight: 64,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSubtle,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 13,
      color: colors.text,
      textAlignVertical: 'top',
    },
    reviewSubmitButton: {
      height: 44,
      marginTop: 12,
      borderRadius: 10,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    reviewSubmitButtonDisabled: { opacity: 0.6 },
    reviewSubmitText: { fontSize: 14, fontWeight: '700', color: colors.onPrimary },
    reviewsLoader: { marginTop: 16 },
    reviewCard: {
      marginHorizontal: 20,
      marginTop: 12,
      padding: 14,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    reviewCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    reviewAuthor: { fontSize: 13, fontWeight: '700', color: colors.text },
    reviewStars: { flexDirection: 'row', gap: 2 },
    reviewText: { marginTop: 8, fontSize: 13, lineHeight: 19, color: colors.subText },
    noReviewsText: {
      marginHorizontal: 20,
      marginTop: 4,
      fontSize: 13,
      lineHeight: 19,
      color: colors.subText,
    },
    bookButton: {
      height: 52,
      marginHorizontal: 20,
      marginTop: 24,
      borderRadius: Radius.md,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    bookButtonIcon: { marginRight: 8 },
    bookButtonText: { fontSize: 16, fontWeight: '700', color: colors.onPrimary },
  });
