import { Resource, ResourceAllocationSuggestion, Station } from "@/types/resource";
import { Incident } from "@/types/incident";
import { STATIONS, getNearestStation } from "@/data/stations";
import { getGoogleMapsDistance } from "./maps/googlemap-distance";
import { CallerLocation } from "@/lib/firebase/signaling";

// Calculate estimated time of arrival based on distance
export function calculateETA(distanceKm: number): number {
  // Assuming average speed of 40 km/h in urban areas
  const averageSpeed = 40;
  const timeInHours = distanceKm / averageSpeed;
  const timeInMinutes = Math.ceil(timeInHours * 60);
  return timeInMinutes;
}

// Simple Haversine distance calculation
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Generate resource suggestions based on incident
export async function generateResourceSuggestions(
  incident: Incident,
  availableStations: Station[],
  callerLocation: CallerLocation,
  // ): ResourceAllocationSuggestion[] {
): Promise<ResourceAllocationSuggestion[]> {
  const suggestions: ResourceAllocationSuggestion[] = [];

  // Determine which agencies to involve based on incident category
  const agencyMap: Record<
    string,
    Array<{ agency: "PDRM" | "JBPM" | "KKM" | "APM" | "MMEA"; type: string }>
  > = {
    fire: [
      { agency: "JBPM", type: "fire-engine" },
      { agency: "JBPM", type: "rescue-vehicle" },
      { agency: "KKM", type: "ambulance" },
    ],
    medical: [{ agency: "KKM", type: "ambulance" }],
    accident: [
      { agency: "PDRM", type: "patrol-car" },
      { agency: "KKM", type: "ambulance" },
      { agency: "JBPM", type: "rescue-vehicle" },
    ],
    crime: [{ agency: "PDRM", type: "patrol-car" }],
    "natural-disaster": [
      { agency: "APM", type: "rescue-vehicle" },
      { agency: "JBPM", type: "rescue-vehicle" },
    ],
  };

  const requiredResources = agencyMap[incident.category] || [];

  // requiredResources.forEach((req, index) => {
  for (const [index, req] of requiredResources.entries()) {
    const station = getNearestStation(
      callerLocation?.coords.latitude ?? incident.location.lat,
      callerLocation?.coords.longitude ?? incident.location.lng,
      req.agency,
      availableStations,
    );

    if (station) {
      // Get real ETA from Google Maps at allocation time
      const googleResult = await getGoogleMapsDistance(
        { lat: station.location.lat, lng: station.location.lng },
        { lat: callerLocation.coords.latitude ?? incident.location.lat, lng: callerLocation.coords.longitude ?? incident.location.lng },
      );

      if (googleResult) {
        console.log(`${googleResult.distanceKm}km, ${googleResult.etaMinutes} mins`);
      }

      const distance = googleResult?.distanceKm ?? calculateDistance(
        callerLocation?.coords.latitude ?? incident.location.lat,
        callerLocation?.coords.longitude ?? incident.location.lng,
        station.location.lat,
        station.location.lng,
      );

      const eta = googleResult?.etaMinutes ?? calculateETA(distance);

      const resource: Resource = {
        id: `res-${req.agency}-${index}`,
        agency: req.agency,
        type: req.type as any,
        station,
        status: "available",
        crew: req.type.includes("engine")
          ? 6
          : req.type.includes("ambulance")
            ? 2
            : 4,
      };

      suggestions.push({
        resource,
        priority: index + 1,
        reasoning: `Nearest ${req.agency} ${req.type} from ${station.name}`,
        estimatedETA: eta,
        routeDistance: distance,
      });
    }
  }
  // );

  return suggestions;
}
