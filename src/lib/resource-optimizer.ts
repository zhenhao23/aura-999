import { Resource, ResourceAllocationSuggestion, Station } from "@/types/resource";
import { Incident } from "@/types/incident";
import { STATIONS, getNearestStation } from "@/data/stations";

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
export function generateResourceSuggestions(
  incident: Incident,
  availableStations: Station[],
): ResourceAllocationSuggestion[] {
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

  requiredResources.forEach((req, index) => {
    const station = getNearestStation(
      incident.location.lat,
      incident.location.lng,
      req.agency,
      availableStations,
    );

    if (station) {
      const distance = calculateDistance(
        incident.location.lat,
        incident.location.lng,
        station.location.lat,
        station.location.lng,
      );

      // Mock ETA data for demo
      const mockETA: Record<string, number> = {
        PDRM: 14, // Police
        KKM: 13, // Hospital/Medical
        JBPM: 9, // Fire
        APM: 12,
        MMEA: 15,
      };
      const eta = mockETA[req.agency] || calculateETA(distance);

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
  });

  return suggestions;
}
