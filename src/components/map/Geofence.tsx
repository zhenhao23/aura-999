// Placeholder for geofence component

interface GeofenceProps {
  center: { lat: number; lng: number };
  radius: number; // in meters
  fillColor?: string;
  strokeColor?: string;
}

export function Geofence({
  center,
  radius,
  fillColor = "rgba(220, 38, 38, 0.2)",
  strokeColor = "#DC2626",
}: GeofenceProps) {
  return null; // Will be implemented with Google Maps
}
