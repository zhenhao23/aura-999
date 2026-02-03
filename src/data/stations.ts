import { Station } from "@/types/resource";

// Sample stations in Cyberjaya / Putrajaya area
export const STATIONS: Station[] = [
  // JBPM Fire Stations
  {
    id: "jbpm-cyberjaya-01",
    name: "Cyberjaya Fire and Rescue Station",
    location: {
      lat: 2.9131493612295953,
      lng: 101.6567638644686,
      address: "Cyberjaya, Selangor",
    },
    agency: "JBPM",
  },

  // PDRM Police Stations
  {
    id: "pdrm-putrajaya-01",
    name: "Putrajaya District Police Headquarters",
    location: {
      lat: 2.9316733849006855,
      lng: 101.67553132584459,
      address: "Putrajaya, Federal Territory",
    },
    agency: "PDRM",
  },

  // KKM Medical Centers
  {
    id: "kkm-putrajaya-01",
    name: "Putrajaya Hospital",
    location: {
      lat: 2.929352911961223,
      lng: 101.67429215468071,
      address: "Putrajaya, Federal Territory",
    },
    agency: "KKM",
  },
];

// Helper function to get stations by agency
export function getStationsByAgency(agency: Station["agency"], availableStations?: Station[]): Station[] {
  const stations = availableStations || STATIONS;
  return stations.filter((station) => station.agency === agency);
}

// Helper function to get nearest station
export function getNearestStation(
  lat: number,
  lng: number,
  agency?: Station["agency"],
  availableStations?: Station[],
): Station | null {
  const stations = agency ? getStationsByAgency(agency, availableStations) : (availableStations || STATIONS);

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
