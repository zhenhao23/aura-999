// Geocoding utilities for Google Maps API

export interface GeocodeResult {
  lat: number;
  lng: number;
  address: string;
}

// This will be implemented after setting up Google Maps API
export async function geocodeAddress(
  address: string,
): Promise<GeocodeResult | null> {
  // Placeholder - will integrate with Google Geocoding API
  console.log("Geocoding address:", address);
  return null;
}

// Reverse geocode coordinates to address
export async function reverseGeocode(
  lat: number,
  lng: number,
  // ): Promise<string | null> {
): Promise<{ buildingName?: string; fullAddress?: string }> {
  // Placeholder - will integrate with Google Geocoding API
  console.log("Reverse geocoding:", lat, lng);
  // return null;
  return {};
}
