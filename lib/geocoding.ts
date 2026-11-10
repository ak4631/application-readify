import { LOCATIONIQ_PUBLIC_KEY } from '@env';

const LOCATIONIQ_BASE_URL = 'https://us1.locationiq.com/v1';

export type GeocodeResult = {
  label: string;
  latitude: number;
  longitude: number;
};

type LocationIqPlace = {
  display_name: string;
  lat: string;
  lon: string;
};

export async function searchAddress(
  query: string,
  near?: { latitude: number; longitude: number },
): Promise<GeocodeResult[]> {
  if (query.trim().length < 3) {
    return [];
  }

  const url = new URL(`${LOCATIONIQ_BASE_URL}/autocomplete`);
  url.searchParams.set('key', LOCATIONIQ_PUBLIC_KEY);
  url.searchParams.set('q', query);
  url.searchParams.set('countrycodes', 'in');
  url.searchParams.set('limit', '5');
  url.searchParams.set('format', 'json');

  const res = await fetch(url.toString());
  if (!res.ok) {
    if (res.status === 404) {
      return [];
    }
    throw new Error(`LocationIQ autocomplete failed: ${res.status}`);
  }
  const data = (await res.json()) as LocationIqPlace[];
  const results = data.map(place => ({
    label: place.display_name,
    latitude: Number(place.lat),
    longitude: Number(place.lon),
  }));
  if (!near) return results;
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const distance = (place: GeocodeResult) => {
    const lat = radians(place.latitude - near.latitude);
    const lon = radians(place.longitude - near.longitude);
    return (
      Math.sin(lat / 2) ** 2 +
      Math.cos(radians(near.latitude)) *
        Math.cos(radians(place.latitude)) *
        Math.sin(lon / 2) ** 2
    );
  };
  return results.sort((a, b) => distance(a) - distance(b));
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  const url = new URL(`${LOCATIONIQ_BASE_URL}/reverse`);
  url.searchParams.set('key', LOCATIONIQ_PUBLIC_KEY);
  url.searchParams.set('lat', String(latitude));
  url.searchParams.set('lon', String(longitude));
  url.searchParams.set('format', 'json');

  const res = await fetch(url.toString());
  if (!res.ok) {
    return null;
  }
  const data = (await res.json()) as {
    display_name?: string;
    address?: Record<string, string | undefined>;
  };
  const parts = data.address;
  if (parts) {
    const locality =
      parts.neighbourhood ||
      parts.suburb ||
      parts.quarter ||
      parts.city_district;
    const city = parts.city || parts.town || parts.village || parts.county;
    const label = [
      ...new Set([locality, city, parts.state].filter(Boolean)),
    ].join(', ');
    if (label) return label;
  }
  return data.display_name ?? null;
}
