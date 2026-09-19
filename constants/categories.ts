// Single source of truth for the four vendor categories, matching the slugs
// seeded in admin.vendor_categories (readify-india-multitenant/prisma/seed.ts)
// after the '-' -> '_' transform applied by public.published_listings /
// public.nearby_vendors. Previously HomeScreen and ExploreScreen each
// hardcoded a near-identical list that used 'reading_room' instead of 'gym'
// -- a category that has never existed in the admin schema, so "Gym" was
// unreachable and "Reading Rooms" always returned zero results.
export type LibraryCategory = 'library' | 'gym' | 'study_cafe' | 'exam_hub';

export const CATEGORIES: { id: LibraryCategory; name: string; icon: string }[] = [
  { id: 'library', name: 'Libraries', icon: 'library-outline' },
  { id: 'gym', name: 'Gyms', icon: 'barbell-outline' },
  { id: 'study_cafe', name: 'Study Cafes', icon: 'cafe-outline' },
  { id: 'exam_hub', name: 'Exam Hubs', icon: 'school-outline' },
];
