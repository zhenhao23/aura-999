// Placeholder for map marker components

interface MarkerProps {
  lat: number;
  lng: number;
  label?: string;
}

export function ResourceMarker({ lat, lng, label }: MarkerProps) {
  return null; // Will be implemented with Google Maps
}

export function IncidentMarker({ lat, lng, label }: MarkerProps) {
  return null; // Will be implemented with Google Maps
}
