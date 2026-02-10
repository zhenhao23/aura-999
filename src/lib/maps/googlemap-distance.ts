// Initialize Google Distance Matrix Service
let distanceMatrixService: google.maps.DistanceMatrixService | null = null;
// let directionsService: google.maps.DirectionsService | null = null;

export async function reverseGeocode(
    lat: number,
    lng: number,
): Promise<string | null> {
    if (typeof window === "undefined" || !window.google?.maps) {
        console.warn("Google Maps not loaded");
        return null;
    }

    const geocoder = new window.google.maps.Geocoder();

    return new Promise((resolve) => {
        geocoder.geocode(
            { location: new window.google.maps.LatLng(lat, lng) },
            (results, status) => {
                if (status === "OK" && results?.[0]) {
                    resolve(results[0].formatted_address);
                } else {
                    console.error("Reverse geocode failed:", status);
                    resolve(null);
                }
            },
        );
    });
}

export function initializeDistanceMatrixService() {
    if (typeof window === "undefined") return;

    // Wait for Google Maps to fully load
    const checkGoogleMaps = () => {
        if (window.google?.maps?.DistanceMatrixService) {
            distanceMatrixService = new window.google.maps.DistanceMatrixService();
            // directionsService = new window.google.maps.DirectionsService();
            console.log("✅ Distance Matrix Service initialized");
            return true;
        }
        return false;
    };

    // Try immediately
    if (checkGoogleMaps()) return;

    // If not ready, wait and retry
    const retryInterval = setInterval(() => {
        if (checkGoogleMaps()) {
            clearInterval(retryInterval);
        }
    }, 100);

    // Stop retrying after 10 seconds
    setTimeout(() => clearInterval(retryInterval), 10000);
}

// Get distance and ETA from Google Maps
export async function getGoogleMapsDistance(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    travelMode: google.maps.TravelMode = google.maps.TravelMode.DRIVING,
): Promise<{ distanceKm: number; etaMinutes: number } | null> {
    if (!distanceMatrixService) {
        console.warn("Distance Matrix Service not initialized");
        return null;
    }

    try {
        const response = await distanceMatrixService.getDistanceMatrix({
            origins: [new google.maps.LatLng(origin.lat, origin.lng)],
            destinations: [new google.maps.LatLng(destination.lat, destination.lng)],
            travelMode,
        });

        if (response.rows[0].elements[0].status === "OK") {
            const element = response.rows[0].elements[0];
            const distanceKm = element.distance.value / 1000; // Convert to km
            const etaMinutes = Math.ceil(element.duration.value / 60); // Convert to minutes

            // Reverse geocode origin and destination
            const originAddress =
                await reverseGeocode(origin.lat, origin.lng) ||
                `${origin.lat.toFixed(4)}, ${origin.lng.toFixed(4)}`;

            const destinationAddress =
                await reverseGeocode(destination.lat, destination.lng) ||
                `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`;

            console.log(`📍 Route: ${originAddress} → ${destinationAddress}`);
            console.log(`📊 Distance: ${distanceKm.toFixed(2)}km, ETA: ${etaMinutes} mins`);

            return { distanceKm, etaMinutes };
        }
    } catch (error) {
        console.error("Google Maps Distance Matrix error:", error);
    }

    return null;
}