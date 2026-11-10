import type { NavigatorScreenParams } from '@react-navigation/native';
import type { LibraryCategory } from '../constants/categories';
export type PaymentParams = {
  category?: LibraryCategory;
  kind: 'flex' | 'subscription' | 'extension';
  libraryId: string;
  libraryName: string;
  selectedDate?: string;
  selectedDateLabel?: string;
  selectedTime?: string;
  selectedTimeLabel: string;
  startTime?: string;
  days?: number;
  targetId?: string;
  hours?: number;
  planId: string;
  planName: string;
};

export type BookingConfirmationParams = {
  category?: LibraryCategory;
  bookingCode: string;
  planName: string;
  seatNumber: string | null;
  libraryName: string;
  selectedDateLabel: string;
  selectedTimeLabel: string;
  totalAmount: number;
};

export type MainTabParamList = {
  Home: { initialCategory?: string } | undefined;
  Bookings: { section?: 'passes' | 'subscriptions' } | undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Onboarding: undefined;
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  OtpVerification: { email: string };
  Map:
    | { focusVendorId?: string; initialCategory?: LibraryCategory | 'all' }
    | undefined;
  // returnTo: when set, "done" (or skip) goes back to that screen instead of
  // replacing the stack with Home -- used when this is opened to change an
  // already-set location (e.g. from Map), not during first-run onboarding.
  LocationPermission:
    | { returnTo?: string; initialCategory?: LibraryCategory | 'all' }
    | undefined;
  Subscribe: {
    libraryId: string;
    libraryName: string;
    category?: LibraryCategory;
  };
  Notifications: undefined;
  LibraryDetails: {
    libraryId: string;
    libraryName: string;
    category?: LibraryCategory;
  };
  Booking: {
    libraryId: string;
    libraryName: string;
    category?: LibraryCategory;
  };
  Extension: { targetId: string; vendorId: string; libraryName: string };
  Payment: PaymentParams;
  BookingConfirmation: BookingConfirmationParams;
};
