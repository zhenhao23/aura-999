import { Station, GooglePlaceResult } from "@/types";

export async function getEmergencyServices(
  lat: number,
  lng: number,
): Promise<Station[]> {
  const radius = 5000;

  const searchConfigs = [
    { type: "hospital", agency: "KKM", idPrefix: "kkm" },
    { type: "police", agency: "PDRM", idPrefix: "pdrm" },
    { type: "fire_station", agency: "JBPM", idPrefix: "jbpm" },
    { agency: "APM", keyword: "Angkatan Pertahanan Awam", idPrefix: "apm" },
    { agency: "MMEA", keyword: "Maritim Malaysia", idPrefix: "mmea" },
  ];

  try {
    const requests = searchConfigs.map((config) => {
      // Use Next.js API route instead of direct Google API call (to avoid CORS)
      let url = `/api/places?lat=${lat}&lng=${lng}&radius=${radius}`;
      if (config.type) url += `&type=${config.type}`;
      if (config.keyword)
        url += `&keyword=${encodeURIComponent(config.keyword)}`;

      return fetch(url)
        .then((res) => res.json())
        .then((data: { results?: GooglePlaceResult[] }) => {
          const rawResults = data.results || [];

          // Format results with distance calculation
          const formattedResults = rawResults
            .map((place) => {
              const latValue = place.geometry?.location?.lat;
              const lngValue = place.geometry?.location?.lng;
              if (typeof latValue !== "number" || typeof lngValue !== "number")
                return null;

              // Calculate straight-line distance (for sorting)
              const dist = Math.sqrt(
                Math.pow(latValue - lat, 2) + Math.pow(lngValue - lng, 2),
              );

              return {
                id: `${config.idPrefix}-${place.place_id ?? `${latValue}-${lngValue}`}`,
                name: place.name,
                location: {
                  lat: latValue,
                  lng: lngValue,
                  address: place.vicinity,
                },
                agency: config.agency,
                _distance: dist, // Temporary field for sorting
              } as Station & { _distance: number };
            })
            .filter(Boolean) as (Station & { _distance: number })[];

          // Sort by distance and return only the first (nearest) one
          return formattedResults
            .sort((a, b) => a._distance - b._distance)
            .slice(0, 2); // Get the nearest 2 stations
        });
    });

    const resultsArray = await Promise.all(requests);
    return resultsArray.flat();
  } catch (error) {
    console.error("Emergency Fetch Error:", error);
    return [];
  }
}
