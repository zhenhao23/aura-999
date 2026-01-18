import { Station } from "@/types/resource";

// Sample stations in Petaling Jaya / Selangor area
export const STATIONS: Station[] = [
  // JBPM Fire Stations
  {
    id: "jbpm-subang-01",
    name: "Subang Jaya Fire and Rescue Station",
    location: {
      lat: 3.073777673006374,
      lng: 101.5848215012202,
      address: "Subang Jaya, Selangor",
    },
    agency: "JBPM",
  },

  // PDRM Police Stations
  {
    id: "pdrm-subang-01",
    name: "Balai Polis Subang Jaya",
    location: {
      lat: 3.074115972110228,
      lng: 101.58538309337122,
      address: "Subang Jaya, Selangor",
    },
    agency: "PDRM",
  },

  // KKM Medical Centers
  {
    id: "kkm-subang-01",
    name: "Subang Jaya Medical Centre",
    location: {
      lat: 3.0797308956890954,
      lng: 101.59403819529611,
      address: "Subang Jaya, Selangor",
    },
    agency: "KKM",
  },
];

// Helper function to get stations by agency
export function getStationsByAgency(agency: Station["agency"]): Station[] {
  return STATIONS.filter((station) => station.agency === agency);
}

// Helper function to get nearest station
export function getNearestStation(
  lat: number,
  lng: number,
  agency?: Station["agency"],
): Station | null {
  const stations = agency ? getStationsByAgency(agency) : STATIONS;

  if (stations.length === 0) return null;

  let nearest = stations[0];
  let minDistance = calculateDistance(
    lat,
    lng,
    nearest.location.lat,
    nearest.location.lng,
  );

  for (const station of stations) {
    const distance = calculateDistance(
      lat,
      lng,
      station.location.lat,
      station.location.lng,
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearest = station;
    }
  }

  return nearest;
}

// Simple Haversine distance calculation
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
