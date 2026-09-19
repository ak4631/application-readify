# Readify India — Project Documentation

> India's Library Discovery Platform

Detailed technical documentation generated from a full codebase analysis
(as of commit `a951f63`, single initial commit).

---

## Table of Contents

- [1. Overview](#1-overview)
- [2. Tech Stack](#2-tech-stack)
- [3. Repository Layout](#3-repository-layout)
- [4. Configuration & Environment](#4-configuration--environment)
- [5. Mobile App](#5-mobile-app)
  - [5.1 Entry Point](#51-entry-point)
  - [5.2 Navigation Flow](#52-navigation-flow)
  - [5.3 Screen Reference](#53-screen-reference)
- [6. Web Partner Portal](#6-web-partner-portal)
- [7. Database (Supabase)](#7-database-supabase)
- [8. Business Logic & Flows](#8-business-logic--flows)
  - [8.1 Onboarding Flow](#81-onboarding-flow)
  - [8.2 Authentication](#82-authentication)
  - [8.3 Library Discovery](#83-library-discovery)
  - [8.4 Booking → Payment → Confirmation](#84-booking--payment--confirmation)
  - [8.5 Bookings Management](#85-bookings-management)
  - [8.6 Membership](#86-membership)
  - [8.7 Profile](#87-profile)
  - [8.8 Notifications](#88-notifications)
  - [8.9 Map / Location](#89-map--location)
  - [8.10 Partner Onboarding (Web)](#810-partner-onboarding-web)
- [9. Shared UI & Design Tokens](#9-shared-ui--design-tokens)
- [10. Known Gaps & Issues](#10-known-gaps--issues)
- [11. Suggested Next Steps](#11-suggested-next-steps)

---

## 1. Overview

Readify India is a **library discovery and session-booking platform** for India.
It lets users find libraries/reading spaces, view details, and book study
sessions with seat/time-slot selection and mock payment.

The product consists of **two front-ends**:

1. **Mobile app** — Expo / React Native (SDK 57). The consumer-facing product.
2. **Web app** — Next.js 16. A **Partner Portal** where library owners sign in
   and set up their library (profile, facilities, pricing). Most of this is a
   UI preview; only partner login is wired to the backend.

Backend is **Supabase** (auth + Postgres). The code references only two tables
(`profiles`, `libraries`); all other features (bookings, memberships, payments,
amenities) are **front-end mocks** — no persistence yet.

---

## 2. Tech Stack

### Mobile (`package.json`)
| Area | Technology |
|---|---|
| Framework | Expo `~57.0.9` (React Native `0.86.2`, React `19.2.3`) |
| Language | TypeScript `~6.0.3` (strict) |
| Navigation | `@react-navigation/native-stack` (v7) |
| Backend | `@supabase/supabase-js` `^2.112.3` |
| Local storage | `expo-sqlite` + `@react-native-async-storage/async-storage` (via supabase session persistence) |
| Auth | `@react-native-google-signin/google-signin` `^16.1.4` |
| Maps | `react-native-maps` `1.27.2` |
| Location | `expo-location` `~57.0.15` |
| Other UI | `react-native-pager-view` (onboarding), `react-native-qrcode-svg` (installed, unused), `react-native-safe-area-context`, `react-native-screens` |
| Build | EAS (`eas.json`, projectId `30835b40-6a2c-4c6a-8a80-c17dda148f3b`) |
| Entry | `index.ts` |

### Web partner portal (`web/package.json`)
| Area | Technology |
|---|---|
| Framework | Next.js `16.3.4` (App Router, React 19) |
| Styling | Tailwind CSS v4 (PostCSS) |
| Backend | `@supabase/ssr` + `@supabase/supabase-js` (browser & server clients) |
| Entry | `web/app/layout.tsx`, config `web/proxy.ts` (auth middleware) |

---

## 3. Repository Layout

```
readify-india/
├── App.tsx                     # Root: renders AppNavigator
├── index.ts                    # registerRootComponent(App)
├── app.json                    # Expo config (plugins, icons, bundle ids)
├── eas.json                    # EAS build profiles (dev/preview/prod)
├── tsconfig.json
├── package.json
├── constants/                  # Design tokens
│   ├── colors.ts               #   Colors (primary #1557C0, etc.)
│   ├── radius.ts               #   Radius (sm..full)
│   ├── spacing.ts              #   Spacing (xs..xxl)
│   └── typography.ts           #   Typography scale
├── components/
│   └── Button.tsx              # Single shared button (Pressable)
├── lib/
│   └── supabase.ts             # Supabase client (expo-sqlite localStorage)
├── services/
│   └── googleAuth.ts           # Google Sign-In + profile upsert
├── navigation/
│   └── AppNavigator.tsx        # Native stack with 18 screens
├── screens/                    # 18 screens (see §5.3)
└── web/                        # Next.js partner portal
    ├── proxy.ts                # Middleware (supabase SSR session refresh)
    ├── lib/
    │   ├── supabase-browser.ts
    │   └── supabase-server.ts
    └── app/
        ├── page.tsx            # Default Next.js starter (unfinished)
        └── partner/
            ├── login/page.tsx
            ├── dashboard/page.tsx
            └── library/
                ├── page.tsx               # Library profile form
                ├── facilities/page.tsx    # Amenity picker
                └── pricing/page.tsx       # Membership pricing
```

---

## 4. Configuration & Environment

### Required env vars (mobile)
| Variable | Used in |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | `lib/supabase.ts` (throws if missing) |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `lib/supabase.ts` (throws if missing) |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | `services/googleAuth.ts` (throws if missing) |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` (Android) | `app.json` plugin config — `YOUR_GOOGLE_MAPS_API_KEY` placeholder |

### Required env vars (web)
| Variable | Used in |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | supabase browser/server/proxy |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | supabase browser/server/proxy |

### Expo config (`app.json`) highlights
- Name/slug: `readify-india`, version `1.0.0`, portrait, light UI.
- Owner: `readify-india`, EAS project ID set.
- Plugins: `@react-native-google-signin/google-signin`, `expo-sqlite`,
  `react-native-maps` (Android key placeholder).
- Bundle IDs: `com.readifyindia.app` (iOS & Android).
- `android.googleServicesFile` / iOS reverse-client for Google sign-in is
  **not configured** in app.json (expected in a later step for OAuth to work).

### Supabase client (`lib/supabase.ts`)
- Uses `react-native-url-polyfill/auto` and `expo-sqlite/localStorage/install`
  to supply `localStorage` for session persistence.
- Auth settings: `autoRefreshToken: true`, `persistSession: true`,
  `detectSessionInUrl: false`.

---

## 5. Mobile App

### 5.1 Entry Point
`index.ts` → `registerRootComponent(App)` → `App.tsx` renders
`navigation/AppNavigator.tsx`.

### 5.2 Navigation Flow

```
Splash ─(2.5s)→ Onboarding ─(Next/Skip)→ Welcome ─(Continue)→ Home
                                                                  │
        ┌─────────────────────────────────────────────────────────┘
        ▼
   HomeScreen  (custom bottom tab bar, NOT a tab navigator)
   ├── Explore ──────────► LibraryDetails ──► Booking ──► Payment ──► BookingConfirmation ─(View My Bookings)→ Bookings
   ├── Explore (bottom nav / category cards / "See all")
   ├── Bookings ────────────────────────────────────────────────────────────────────────────────────────────────▲
   ├── Membership
   ├── Profile ──► Bookings / Membership
   ├── Map ("Delhi NCR" chip)
   └── Notifications (bell icon)

Registered-but-unreachable: Login, Register, ForgotPassword, OtpVerification
```

- `initialRouteName = "Splash"`, `headerShown: false` globally.
- The bottom navigation on Home is **hand-rolled** (an absolutely-positioned
  `View`), not `@react-navigation/bottom-tabs`.
- `LibraryDetails`, `Booking`, `Payment`, `BookingConfirmation` are separate
  stack screens reached with `navigation.navigate`.

### 5.3 Screen Reference

| # | File | Route name | Purpose | Data |
|---|---|---|---|---|
| 1 | `SplashScreen.tsx` | `Splash` | Branded splash, auto-navigates after 2.5 s | static |
| 2 | `OnboardingScreen.tsx` | `Onboarding` | 3-slide `PagerView` onboarding w/ dot indicators, Skip/Next | static |
| 3 | `WelcomeScreen.tsx` | `Welcome` | Logo + CTA button | static |
| 4 | `HomeScreen.tsx` | `Home` | App hub: search, chips, categories, nearby/top-rated lists, bottom nav | hardcoded |
| 5 | `ExploreScreen.tsx` | `Explore` | Searchable directory of active libraries | **Supabase `libraries`** |
| 6 | `MapScreen.tsx` | `Map` | Map centered on user location (own marker only) | live location |
| 7 | `LibraryDetailsScreen.tsx` | `LibraryDetails` | Library details + "Book a Session" | hardcoded |
| 8 | `BookingScreen.tsx` | `Booking` | Date/time-slot/seat selection + summary + pricing | client state |
| 9 | `PaymentScreen.tsx` | `Payment` | Payment method picker + amount breakdown | mock |
| 10 | `BookingConfirmationScreen.tsx` | `BookingConfirmation` | Success screen + booking ID + QR placeholder | hardcoded |
| 11 | `BookingsScreen.tsx` | `Bookings` | Tabs Upcoming/Completed/Cancelled (all empty) | mock |
| 12 | `MembershipScreen.tsx` | `Membership` | Daily ₹49 / Monthly ₹999 plans | static |
| 13 | `ProfileScreen.tsx` | `Profile` | Static profile + menu + logout (no-op) | hardcoded |
| 14 | `NotificationsScreen.tsx` | `Notifications` | Mock notifications, read/unread | local state |
| 15 | `LoginScreen.tsx` | `Login` | Email/password + Google button | stub / partially wired |
| 16 | `RegisterScreen.tsx` | `Register` | Sign-up form (no handler) | stub |
| 17 | `ForgotPasswordScreen.tsx` | `ForgotPassword` | Email input → `OtpVerification` | stub |
| 18 | `OtpVerificationScreen.tsx` | `OtpVerification` | 6-digit OTP input → `Home` | stub |

---

## 6. Web Partner Portal

| Route | File | Auth | Functions |
|---|---|---|---|
| `/` | `web/app/page.tsx` | public | Next.js starter page — **unfinished template** |
| `/partner/login` | `web/app/partner/login/page.tsx` | public | Email/password sign-in; verifies `role === 'partner'` and `is_active`; redirects to `/partner/dashboard` |
| `/partner/dashboard` | `web/app/partner/dashboard/page.tsx` | none enforced | Stat placeholders, getting-started checklist; sidebar links to Bookings/Members/Payments/Seats (404 — pages don't exist) |
| `/partner/library` | `web/app/partner/library/page.tsx` | none enforced | Library profile form (basic info, location, contacts) — **local-only UI, no DB write** |
| `/partner/library/facilities` | `web/app/partner/library/facilities/page.tsx` | none enforced | 12-amenity multi-select — **local-only** |
| `/partner/library/pricing` | `web/app/partner/library/pricing/page.tsx` | none enforced | 4 membership plans (Monthly/Quarterly/Half-yearly/Yearly) price editor — **local-only** |

Notes:
- Middleware `web/proxy.ts` refreshes the Supabase session via cookies for all
  routes (matcher excludes static/assets). It does **not** enforce auth/role
  redirects yet.
- Web forms display a "saved locally for this UI preview. Backend submission
  will be connected later." banner.

---

## 7. Database (Supabase)

Only **two tables** are referenced in code. There are **no SQL migrations or
schema files in the repo** — the schema below is inferred from usage.

### `profiles`
One row per app user. Created/updated on sign-in.

**Referenced columns:**
| Column | Type (inferred) | Notes |
|---|---|---|
| `uid` | uuid | Set to `auth.users.id` after Google sign-in; conflict target for upsert |
| `id` | uuid | Used by web partner login (`eq("id", user.id)`) — may equal `uid`. Inferred from usage |
| `full_name` | text | From Google `user_metadata.full_name` / `.name` |
| `avatar_url` | text | From Google `user_metadata.avatar_url` / `.picture` |
| `role` | text | Values include `partner`; used to gate partner access. Inferred |
| `is_active` | boolean | Gates partner access. Inferred |

**Usage sites:**
- `services/googleAuth.ts:63` — `.upsert({ uid, full_name, avatar_url }, { onConflict: 'uid' })`
- `web/app/partner/login/page.tsx:35` — `.select('role, is_active').eq('id', data.user.id).single()`

**Missing:** a trigger to auto-create a `profiles` row on `auth.users` insert is
**not present in the repo** (Google sign-in does the upsert explicitly).

### `libraries`
Library directory, queried by the mobile Explore screen.

**Referenced columns:**
`id`, `name`, `slug`, `description`, `address_line_1`, `address_line_2`,
`locality`, `city`, `state`, `postal_code`, `website_url`, `status`,
`is_active`.

**Usage sites:**
- `screens/ExploreScreen.tsx:83` — `select(12 fields).eq('is_active', true).order('name', { ascending: true })`

**Notable:**
- **No `category` column.** ExploreScreen has a code comment stating this —
  only "Libraries" can be filtered; other categories are marked "Coming soon".
- **No lat/lng column** → the Map cannot plot libraries, and 'nearby/distance'
  features are hardcoded placeholder text (e.g., "2.1 km").

### Tables referenced in UI but NOT yet created/used in code
`bookings`, `payments`, `membership plans`, `seats`, `facilities/amenities`.
The partner "seats" route (`/partner/library/seats`) that would configure seats
is a 404.

---

## 8. Business Logic & Flows

### 8.1 Onboarding Flow
`Splash` shows branding for 2.5 s (`setTimeout`, cleaned up) then
`navigation.replace('Onboarding')`. `Onboarding` pages through 3 slides via
`react-native-pager-view`; button says "Next" until the last slide, where it
becomes "Get Started"; both "Skip" and the final action `replace('Welcome')`.
`Welcome` has a single CTA → `replace('Home')`.

### 8.2 Authentication

**Google sign-in (`services/googleAuth.ts : signInWithGoogle`)**
1. `GoogleSignin.hasPlayServices()` — guard.
2. `GoogleSignin.signIn()`; aborts (returns `{ success: false, cancelled: true, ... }`)
   if the user cancels.
3. Extracts `idToken`; throws if absent.
4. `supabase.auth.signInWithIdToken({ provider: 'google', token: idToken })`.
5. Reads `full_name` / `avatar_url` from `user.user_metadata` (with fallbacks).
6. **Upserts `profiles` on `uid`** with the name/avatar.
7. Throws on any error; caller (`LoginScreen`) only `console.log`s success —
   **it does not navigate anywhere afterwards.**

**Sign-out:** `signOutFromGoogle()` calls `GoogleSignin.signOut()` then
`supabase.auth.signOut()`.

**Email/password login:** Mobile `LoginScreen` has email/password inputs and a
Login button with **no handler**. The web partner login DOES implement it:
`signInWithPassword(email, password)` → fetch `profiles.role`/`is_active` →
kick out non-partners / inactive accounts / missing profile → redirect to
`/partner/dashboard`. On any failure it calls `supabase.auth.signOut()` to
ensure a clean state.

**Password reset (mobile, stub):**
- `ForgotPasswordScreen` → "Send Reset Link" simply navigates to
  `OtpVerificationScreen`.
- `OtpVerificationScreen` → "Verify OTP" simply navigates to `Home`.
- No Supabase `resetPasswordForEmail` / OTP API is called.

### 8.3 Library Discovery
**Source of truth:** `libraries` table where `is_active = true`, ordered by name.

**ExploreScreen state machine:** `isLoading` → `errorMessage` → results / empty.

- On mount, fetches the 12 columns listed in §7.
- Filtering is **client-side**: free-text `searchQuery` is lowercased and
  matched against `name, slug, description, address_line_1, address_line_2,
  locality, city, state, postal_code`.
- Category chip behavior: only `All` and `Libraries` return results
  (`matchesCategory` is `true` only for those). Tapping any of the other three
  still renders results but they are visually marked "Coming soon" and can't
  actually filter DB records.
- Tapping a library navigates to `LibraryDetails` with `{ libraryId, libraryName }`.
- Error state shows a detailed Supabase error card; Retry resets search/category
  but re-runs the fetch. Empty state offers "Reset Search".
- `getLocation()` → "locality, city, state"; `getAddress()` → full street address.

**HomeScreen** shows the same domain but entirely hardcoded: "The Study Hub",
"Scholars Den", "The Intellectuals Hub", "Arid Reading Library", "Knowledge
Corner", "Learn & Grow" with fake ratings/distances/prices. Search, filter
chips ("Within 2 km", "Under ₹50/day", "AC", "Wi-Fi", "24/7", "Girls Friendly"),
and "See all" have **no handlers**.

### 8.4 Booking → Payment → Confirmation
All data is **client-side/local state**; nothing is written to the DB.

**BookingScreen (steps 1–5)**
- **Date** — next 7 calendar days generated in `getBookingDates()`; selected date
  defaults to today; id = ISO date string.
- **Time slot** — fixed list: Morning (6–12), Afternoon (12–5), Evening (5–10),
  Night (10–6); each ₹20.
- **Seat type** — Standard Desk ₹40, Premium Quiet Zone ₹60, Computer Desk ₹70,
  Group Study Room ₹100.
- **Pricing:** `total = seatPrice + slotPrice + taxesAndFees(₹6)`.
- Navigation → `Payment` passes `selectedDate`, `selectedDateLabel`,
  `selectedTime`, `selectedTimeLabel`, `selectedSeat` (id), `selectedSeatLabel`,
  `totalAmount` as params.
- The library card is hardcoded to "The Archive Library · Mukherjee Nagar,
  Delhi" — irrespective of the library the user came from.

**PaymentScreen**
- Reads `selectedDate`, `selectedTime`, `selectedSeat`, `totalAmount` from
  route params (note: the human-readable `*Label` params from Booking are
  ignored; it renders the raw ids, e.g. showing "morning" instead of
  "6:00 AM - 12:00 PM", and "##/##/####" for the date).
- Payment methods: UPI (default), Credit/Debit Card, Net Banking — radio-style
  selection only, no gateway.
- Price rows are **hardcoded** (Session ₹40, Time slot ₹20, Taxes ₹6) rather
  than derived from the params; only the total uses `totalAmount`.
- "Pay ₹X.00" navigates to `BookingConfirmation` with the 4 raw params. No
  payment is actually processed, no server call is made.

**BookingConfirmationScreen**
- Shows success icon, "The Archive Library" details, amount paid, and buyer-
  facing notice to save the booking ID.
- **Booking ID is hardcoded:** `"RI-20260813-001"` (the date is baked in).
- The "Library Entry Pass" section is a **placeholder** — `react-native-qrcode-
  svg` is installed but a QR code is never rendered (there is a dead
  `styles.qrContainer` with no matching view).
- CTA "View My Bookings" → `Bookings`; "Back to Home" → `Home`.

### 8.5 Bookings Management
`BookingsScreen` has three tabs (Upcoming / Completed / Cancelled), each with
its own empty-state copy. There is **no data fetch** — tabs simply swap empty
cards. "Explore Libraries" → `Explore`. The BookingConfirmation "View My
Bookings" lands here.

### 8.6 Membership
`MembershipScreen` shows two static plans:
- **Daily ₹49/day** — library access, flexible booking.
- **Monthly ₹999/month** (badged POPULAR) — library access, priority booking,
  membership benefits.

"Choose <Plan>" buttons have no handlers; no plan/Pricing data is fetched or
saved. (Pricing from the web portal is not surfaced here.)

### 8.7 Profile
`ProfileScreen` is fully hardcoded: avatar initial "V", name "Vikash", email
"vikash@example.com".
Menu:
- My Bookings → `Bookings`
- My Membership → `Membership`
- Saved Libraries → no-op
- Settings → no-op
- Help & Support → no-op
- Log Out → **no-op** (does not call `signOutFromGoogle`)
Footer: "Readify India · Version 1.0.0".

### 8.8 Notifications
`NotificationsScreen` keeps an in-memory `initialNotifications` array (3 mock
items). Tapping a card marks it read (`readNotificationIds`), unread count
drives the header badge, "Mark all as read" flips everything. **Nothing is
persisted** (so unread state resets on every app launch) and nothing is pulled
from the DB.

### 8.9 Map / Location
`MapScreen` flow:
1. Request foreground permission (`expo-location`).
2. On grant → `getCurrentPositionAsync({ accuracy: Balanced })` → set marker at
   user coords, region `Δ0.025`.
3. States: loading spinner, permission-denied card, generic error card — each
   with Retry/Go Back.
4. Renders `MapView` with `showsUserLocation`, my-location button, compass,
   scale, and a single "Your Location" marker.

**Limitations:** no library markers, no proximity query, no region callback, no
use of `libraries` table at all. Header text says "Nearby Libraries" but nothing
populates it. `HomeScreen`'s "Delhi NCR" location label is static text that
merely navigates to this map.

### 8.10 Partner Onboarding (Web)
1. **Login gate** (implemented): password auth + role/active check (§8.2).
2. **Dashboard**: stats placeholder ("No data yet" / "Not configured"),
   onboarding checklist that links to library/facilities/pricing/seats.
3. **Library profile**: form for basic info, location (address, locality, city,
   state, PIN), contacts (phone, email, website). Wired to nothing.
4. **Facilities**: multi-select of 12 amenities (Wi-Fi, AC, power backup,
   parking, CCTV, drinking water, lockers, washroom, charging, newspapers, book
   collection, silent zone). Wired to nothing.
5. **Pricing**: editable price/duration per plan. Wired to nothing.

The dashboard implies future approval workflow ("before your library can be
submitted for Readify India approval") — not implemented.

---

## 9. Shared UI & Design Tokens

- `constants/colors.ts` — `Colors.primary = #1557C0` (most screens use the
  older hardcoded `#2563EB` blue instead of the token — inconsistency).
  Tokens: primary, primaryDark, primaryLight, secondary, cyan, orange,
  background, surface, text, subText, border, white.
- `constants/radius.ts`, `spacing.ts`, `typography.ts` — defined but **not
  imported by any screen** (screens hardcode their own StyleSheet values).
- `components/Button.tsx` — the only shared component; **not used by any
  screen** (they inline `TouchableOpacity` styles).
- Screens largely duplicate inline styles; iconography is emoji/unicode text
  rather than an icon library (e.g. `📍`, `📚`, `›`).
- Hardcoded hex colors (`#2563EB`, `#111827`, etc.) pervade the screens.

---

## 10. Known Gaps & Issues

1. **Orphaned auth screens** — Login/Register/ForgotPassword/OtpVerification are
   registered but unreachable from the current flow.
2. **Google sign-in cannot complete OAuth without config** — no
   `googleServicesFile` / reverse-client-ID in `app.json`; web client ID env var
   required. Even on success, `LoginScreen` doesn't navigate.
3. **`LibraryDetailsScreen` ignores route params** — always shows "The Study
   Hub" regardless of which library was tapped in Explore (breaks deep linking).
4. **Booking flow is fully static** — hardcoded library "The Archive Library",
   raw ids shown in Payment instead of labels, hardcoded price rows, no DB
   write, no payment gateway, no QR code rendered, hardcoded booking ID.
5. **No persistence anywhere** — bookings, memberships, notifications, saved
   libraries, profile edits are all in-memory or absent.
6. **Map is user-location only** — no library pins; `libraries` has no lat/lng
   or category columns.
7. **Explore category filter** — "Reading Rooms"/"Study Cafes"/"Exam Hubs" are
   cosmetic ("Coming soon"); the `All` vs `Libraries` filter is effectively the
   same set.
8. **Partner portal** — beyond login, pages are UI previews; several sidebar
   routes (`/partner/bookings`, `/members`, `/payments`, `/library/seats`) are
   404; middleware does not guard routes.
9. **Home "nearby" & top-rated data** is fake and not tied to the `libraries`
   table; the price/rating/distance in LibraryDetails is inconsistent with
   Explore's data.
10. **Code consistency** — `Colors` token (`#1557C0`) vs hardcoded `#2563EB`;
    `Button` component and design-token files unused.
11. **Booking ID date is stale** (`RI-20260813-001`).
12. **Notifications & Bookings** have no backend integration, so confirmation
    flow ends in an empty list.

---

## 11. Suggested Next Steps

1. **Define the missing schema** (SQL migration): `bookings`, `payments`,
   `membership _plans`, `seats`, `library_facilities`, plus add `category`,
   `latitude`, `longitude` to `libraries`; auto-create `profiles` via trigger.
2. **Wire auth into the flow** — gate Home/Welcome behind a session; make
   successful Google sign-in navigate to Home; implement email/password and
   password-reset with Supabase.
3. **Connect LibraryDetails & Booking to real data** — fetch by `libraryId`,
   derive pricing/facilities from the library record, persist the booking
   (with a generated booking ID) and show it in `Bookings`.
4. **Render a real QR pass** using the installed `react-native-qrcode-svg`.
5. **Add library markers to the map** (needs lat/lng) and replace fake
   distances/prices on Home with real queries (e.g. PostGIS/haversine).
6. **Implement category filtering** once `libraries.category` exists; honor the
   remaining "Coming soon" categories.
7. **Make the partner portal functional** — connect library/facilities/pricing
   forms to Supabase, build the missing seats/bookings/members/payments pages,
   and add route protection in `web/proxy.ts`.
8. **Clean up** — adopt design tokens and shared components, remove dead code
   (unused `Button`, unused params, hardcoded IDs).