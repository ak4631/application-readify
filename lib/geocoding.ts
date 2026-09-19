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

export async function searchAddress(query: string): Promise<GeocodeResult[]> {
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
  return data.map(place => ({
    label: place.display_name,
    latitude: Number(place.lat),
    longitude: Number(place.lon),
  }));
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
  const data = (await res.json()) as { display_name?: string };
  return data.display_name ?? null;
}
