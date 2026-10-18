export type PaymentParams = {
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
  bookingCode: string;
  planName: string;
  seatNumber: string | null;
  libraryName: string;
  selectedDateLabel: string;
  selectedTimeLabel: string;
  totalAmount: number;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  OtpVerification: { email: string };
  Home: undefined;
  Explore: { initialCategory?: string } | undefined;
  // A Home category tile navigates straight here (one category, pre-filtered)
  // rather than to Explore -- Explore itself is untouched by this and stays
  // reachable via search/bottom nav/"See all".
  CategoryListing: { categoryId: string; categoryName: string };
  Map: { focusVendorId?: string } | undefined;
  // returnTo: when set, "done" (or skip) goes back to that screen instead of
  // replacing the stack with Home -- used when this is opened to change an
  // already-set location (e.g. from Map), not during first-run onboarding.
  LocationPermission: { returnTo?: string } | undefined;
  Bookings: undefined;
  Subscribe: { libraryId: string; libraryName: string };
  MySubscriptions: undefined;
  Profile: undefined;
  Notifications: undefined;
  LibraryDetails: { libraryId: string; libraryName: string };
  Booking: { libraryId: string; libraryName: string };
  Extension: { targetId: string; vendorId: string; libraryName: string };
  Payment: PaymentParams;
  BookingConfirmation: BookingConfirmationParams;
};
