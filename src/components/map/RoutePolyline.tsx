// Placeholder for route polyline component

interface RoutePolylineProps {
  path: Array<{ lat: number; lng: number }>;
  color?: string;
}

export function RoutePolyline({ path, color = "#4285F4" }: RoutePolylineProps) {
  return null; // Will be implemented with Google Maps
}
