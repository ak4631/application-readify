import { supabase } from './supabase';
import type { LibraryCategory } from '../constants/categories';

export type NearbyVendor = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  category: LibraryCategory;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  latitude: number;
  longitude: number;
  website_url: string | null;
  image_url: string | null;
  average_rating: number | null;
  review_count: number;
  distance_km: number;
};

export async function fetchNearbyVendors(params: {
  latitude: number;
  longitude: number;
  category?: LibraryCategory | null;
  radiusKm?: number;
  limit?: number;
  offset?: number;
}): Promise<NearbyVendor[]> {
  const { data, error } = await supabase.rpc('nearby_vendors', {
    p_latitude: params.latitude,
    p_longitude: params.longitude,
    p_category: params.category ?? null,
    p_radius_km: params.radiusKm ?? 10,
    p_limit: params.limit ?? 20,
    p_offset: params.offset ?? 0,
  });

  if (error) {
    throw error;
  }

  return ((data ?? []) as any[]).map(row => ({
    ...row,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    distance_km: Number(row.distance_km),
    average_rating: row.average_rating != null ? Number(row.average_rating) : null,
  })) as NearbyVendor[];
}
