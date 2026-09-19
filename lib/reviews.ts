import { supabase } from './supabase';

export type Review = {
  id: string;
  vendor_id: string;
  rating: number;
  review_text: string | null;
  user_name: string | null;
  created_at: string;
};

export async function fetchReviews(vendorId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('listing_reviews')
    .select('id, vendor_id, rating, review_text, user_name, created_at')
    .eq('vendor_id', vendorId);

  if (error) {
    throw error;
  }

  return (data ?? []) as Review[];
}

export async function submitReview(input: {
  vendorId: string;
  rating: number;
  reviewText: string;
  bookingId?: string;
}) {
  const { error } = await supabase.rpc('create_customer_review', {
    p_vendor_id: input.vendorId,
    p_rating: input.rating,
    p_review_text: input.reviewText.trim().length > 0 ? input.reviewText.trim() : null,
    p_booking_id: input.bookingId ?? null,
  });

  if (error) {
    throw error;
  }
}
