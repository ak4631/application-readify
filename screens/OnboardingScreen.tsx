import React, { useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStyles } from '../hooks/useStyles';
import type { ThemeColors } from '../constants/colors';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    image: require('../assets/images/illustrations/discover-library.png'),
    title: 'Discover Libraries Around You',
    subtitle: 'Find public, private and community libraries near your location.',
  },
  {
    image: require('../assets/images/illustrations/rent-books.png'),
    title: 'Rent Books Easily',
    subtitle: 'Borrow books from nearby libraries and return them effortlessly.',
  },
  {
    image: require('../assets/images/illustrations/read-anywhere.png'),
    title: 'Readify India',
    subtitle: 'Building the Future of Libraries',
  },
];

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const navigation = useNavigation<any>();
  const styles = useStyles(createStyles);
  const scrollRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const goToWelcome = () => {
    onDone();
    navigation.replace('Welcome');
  };

  const nextPage = () => {
    if (currentPage < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: width * (currentPage + 1), animated: true });
    } else {
      goToWelcome();
    }
  };

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentPage(page);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
      >
        {SLIDES.map((item, index) => (
          <View key={index} style={styles.page}>
            <Image source={item.image} style={styles.image} resizeMode="contain" />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomContainer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={goToWelcome}>
            <Text style={styles.skipButton}>Skip</Text>
          </TouchableOpacity>

          <View style={styles.indicatorContainer}>
            {SLIDES.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  currentPage === index && styles.activeIndicator,
                ]}
              />
            ))}
          </View>

          <TouchableOpacity style={styles.nextButton} onPress={nextPage}>
            <Text style={styles.nextButtonText}>
              {currentPage === SLIDES.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    page: {
      width,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    image: {
      width: 280,
      height: 280,
      marginBottom: 24,
    },
    title: {
      fontSize: 26,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 14,
    },
    subtitle: {
      fontSize: 16,
      color: colors.subText,
      textAlign: 'center',
      lineHeight: 24,
      paddingHorizontal: 12,
    },
    bottomContainer: {
      paddingHorizontal: 24,
      paddingBottom: 24,
      paddingTop: 12,
    },
    indicatorContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    indicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
      marginHorizontal: 4,
    },
    activeIndicator: {
      width: 24,
      backgroundColor: colors.secondary,
    },
    buttonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    skipButton: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.subText,
    },
    nextButton: {
      backgroundColor: colors.secondary,
      paddingHorizontal: 28,
      paddingVertical: 14,
      borderRadius: 14,
    },
    nextButtonText: {
      color: colors.onPrimary,
      fontSize: 16,
      fontWeight: '700',
    },
  });
