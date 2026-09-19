export type PaymentParams = {
  libraryId: string;
  libraryName: string;
  selectedDate: string;
  selectedDateLabel: string;
  selectedTime: string;
  selectedTimeLabel: string;
  selectedSeat: string;
  selectedSeatLabel: string;
  totalAmount: number;
};

export type BookingConfirmationParams = {
  libraryName: string;
  bookingCode: string;
  selectedDateLabel: string;
  selectedTimeLabel: string;
  selectedSeatLabel: string;
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
  Map: { focusVendorId?: string } | undefined;
  LocationPermission: undefined;
  Bookings: undefined;
  Membership: undefined;
  Profile: undefined;
  Notifications: undefined;
  LibraryDetails: { libraryId: string; libraryName: string };
  Booking: { libraryId: string; libraryName: string };
  Payment: PaymentParams;
  BookingConfirmation: BookingConfirmationParams;
};
