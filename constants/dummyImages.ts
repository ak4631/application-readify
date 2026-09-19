// Placeholder library photos (Unsplash) until vendors upload their own images.
export const LIBRARY_IMAGES = [
  'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&q=80',
  'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&q=80',
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80',
  'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&q=80',
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&q=80',
];

export function getLibraryImage(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = Math.abs(hash * 31 + id.charCodeAt(i)) % 2147483647;
  }
  return LIBRARY_IMAGES[hash % LIBRARY_IMAGES.length];
}
