"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMap,
} from "@vis.gl/react-google-maps";
import { Incident, ResourceAllocationSuggestion, Station } from "@/types";
// import { STATIONS } from "@/data/stations";
import { CallerLocation } from "@/lib/firebase/signaling";

interface MovingResource {
  id: string;
  suggestion: ResourceAllocationSuggestion;
  currentPosition: google.maps.LatLng;
  path: google.maps.LatLng[];
  pathIndex: number;
  startTime: number;
  eta: number; // animation duration in seconds (30s for demo)
  realEtaMinutes: number; // actual ETA in minutes from API
  distanceRemaining: number; // km
  breadcrumb: google.maps.LatLng[]; // breadcrumb to target
  returnBreadcrumb: google.maps.LatLng[]; // breadcrumb on return journey
  isReturning: boolean; // whether vehicle is returning to hospital
  arrivedAt: number | null; // timestamp when arrived at destination
  returnPath: google.maps.LatLng[]; // path back to hospital
}

interface TacticalMapProps {
  incident: Incident;
  dispatchedResources: string[];
  suggestions: ResourceAllocationSuggestion[];
  callerLocation?: CallerLocation | null;
  availableStations?: Station[];
}

export function TacticalMap({
  incident,
  dispatchedResources,
  suggestions,
  callerLocation,
  availableStations,
}: TacticalMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  // Use caller location if available, otherwise use incident location (Heriot-Watt University Malaysia)
  const center = callerLocation
    ? {
      lat: callerLocation.coords.latitude,
      lng: callerLocation.coords.longitude,
    }
    : { lat: 2.8994930048635545, lng: 101.6725950816638 };

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        mapId="5922251663d14fbc4edaf242"
        defaultCenter={center}
        defaultZoom={callerLocation ? 16 : 14}
        minZoom={3}
        maxZoom={22}
        gestureHandling="greedy"
        disableDefaultUI={false}
        className="w-full h-full"
        colorScheme="DARK"
        clickableIcons={true}
        keyboardShortcuts={true}
        zoomControl={true}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={false}
      >
        <MapContent
          incident={incident}
          dispatchedResources={dispatchedResources}
          suggestions={suggestions}
          callerLocation={callerLocation}
          availableStations={availableStations}
        />
      </Map>
    </APIProvider>
  );
}

// Separate component that has access to the map
function MapContent({
  incident,
  dispatchedResources,
  suggestions,
  callerLocation,
  availableStations,
}: TacticalMapProps) {
  const map = useMap();
  const [isPulsing, setIsPulsing] = useState(false);
  const [movingResources, setMovingResources] = useState<MovingResource[]>([]);
  const [showTrafficLights, setShowTrafficLights] = useState(false);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(
    null,
  );
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Pulsing animation for caller marker
  useEffect(() => {
    const interval = setInterval(() => {
      setIsPulsing((prev) => !prev);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize Directions Service when map is ready
  useEffect(() => {
    if (map && !directionsServiceRef.current) {
      directionsServiceRef.current = new google.maps.DirectionsService();
    }
  }, [map]);

  // Handle newly dispatched resources
  useEffect(() => {
    if (!directionsServiceRef.current || !map) return;

    const newlyDispatched = dispatchedResources.filter(
      (id) => !movingResources.some((mr) => mr.id === id),
    );

    console.log("🚨 Dispatch check:", {
      newlyDispatched,
      hasDirectionsService: !!directionsServiceRef.current,
      callerLocation,
      mapReady: !!map,
    });

    if (newlyDispatched.length === 0) return;

    newlyDispatched.forEach((resourceId) => {
      const suggestion = suggestions.find((s) => s.resource.id === resourceId);
      if (!suggestion || !directionsServiceRef.current) {
        console.log("❌ Missing requirements:", {
          suggestion: !!suggestion,
          directionsService: !!directionsServiceRef.current,
        });
        return;
      }

      const origin = new google.maps.LatLng(
        suggestion.resource.station.location.lat,
        suggestion.resource.station.location.lng,
      );

      // Use caller location if available, otherwise use default target (Heriot-Watt)
      const targetLat = callerLocation
        ? callerLocation.coords.latitude
        : 2.8994930048635545;
      const targetLng = callerLocation
        ? callerLocation.coords.longitude
        : 101.6725950816638;

      const destination = new google.maps.LatLng(targetLat, targetLng);

      console.log("🚀 Requesting route:", {
        from: { lat: origin.lat(), lng: origin.lng() },
        to: { lat: destination.lat(), lng: destination.lng() },
      });

      directionsServiceRef.current.route(
        {
          origin,
          destination,
          travelMode: google.maps.TravelMode.DRIVING,
          optimizeWaypoints: true,
        },
        (result, status) => {
          console.log("📍 Directions result:", status, result);

          if (status === google.maps.DirectionsStatus.OK && result) {
            const route = result.routes[0];
            const path: google.maps.LatLng[] = [];

            // Extract all coordinates from the route
            route.legs.forEach((leg) => {
              leg.steps.forEach((step) => {
                const stepPath = step.path;
                path.push(...stepPath);
              });
            });

            console.log("✅ Path created with", path.length, "points");

            const realEtaMinutes = route.legs[0].duration?.value
              ? Math.ceil(route.legs[0].duration.value / 60)
              : suggestion.estimatedETA;

            const newMovingResource: MovingResource = {
              id: resourceId,
              suggestion,
              currentPosition: origin,
              path,
              pathIndex: 0,
              startTime: Date.now(),
              eta: 30, // 30 seconds for demo animation
              realEtaMinutes, // real ETA in minutes
              distanceRemaining: route.legs[0].distance?.value
                ? route.legs[0].distance.value / 1000
                : 0,
              breadcrumb: [origin],
              returnBreadcrumb: [],
              isReturning: false,
              arrivedAt: null,
              returnPath: [], // will be set when starting return journey
            };

            setMovingResources((prev) => {
              // Double-check we're not adding duplicates
              if (prev.some((mr) => mr.id === resourceId)) {
                console.log(
                  "⚠️ Resource already exists, skipping:",
                  resourceId,
                );
                return prev;
              }
              return [...prev, newMovingResource];
            });
          } else {
            console.error("❌ Directions request failed:", status);
          }
        },
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatchedResources, suggestions, callerLocation, map]);

  // Animation loop
  useEffect(() => {
    if (movingResources.length === 0) return;

    const animate = () => {
      const now = Date.now();

      setMovingResources((prev) => {
        return prev
          .map((resource) => {
            // Check if arrived and waiting
            if (resource.arrivedAt && !resource.isReturning) {
              const waitTime = (now - resource.arrivedAt) / 1000;
              const isAmbulance = resource.suggestion.resource.agency === "KKM";

              // Non-ambulances: remove after 5 seconds
              if (!isAmbulance && waitTime >= 5) {
                console.log("🗑️ Removing non-ambulance vehicle:", resource.id);
                return null; // Mark for removal
              }

              // Ambulances: start return journey after 10 seconds
              if (isAmbulance && waitTime >= 10) {
                console.log(
                  "🔄 Starting return journey for ambulance",
                  resource.id,
                );

                // Show traffic lights on first ambulance return
                setShowTrafficLights(true);

                // Reverse the path for return journey
                const returnPath = [...resource.path].reverse();

                return {
                  ...resource,
                  isReturning: true,
                  returnPath,
                  path: returnPath,
                  pathIndex: 0,
                  startTime: now,
                  returnBreadcrumb: [returnPath[0]], // Start new breadcrumb for return
                  currentPosition: returnPath[0],
                };
              }

              // Still waiting at destination
              return resource;
            }

            const elapsed = (now - resource.startTime) / 1000;
            const currentPath = resource.isReturning
              ? resource.returnPath
              : resource.path;
            const progress = Math.min(elapsed / resource.eta, 1);

            if (progress >= 1 && !resource.arrivedAt) {
              // Just arrived at destination
              console.log("🎯 Vehicle arrived at destination:", resource.id);
              return {
                ...resource,
                currentPosition: currentPath[currentPath.length - 1],
                pathIndex: currentPath.length - 1,
                distanceRemaining: 0,
                arrivedAt: now,
              };
            }

            // Calculate new position
            const targetIndex = Math.floor(progress * currentPath.length);
            const newPosition =
              currentPath[targetIndex] || resource.currentPosition;

            // Update appropriate breadcrumb based on journey direction
            const newBreadcrumb = resource.isReturning
              ? resource.breadcrumb // Keep original breadcrumb
              : resource.path.slice(0, targetIndex + 1);

            const newReturnBreadcrumb = resource.isReturning
              ? currentPath.slice(0, targetIndex + 1) // Build return breadcrumb
              : resource.returnBreadcrumb;

            // Calculate remaining distance
            const remainingProgress = 1 - progress;
            const totalDistance =
              currentPath.length > 0
                ? resource.suggestion.routeDistance || 0
                : 0;
            const distanceRemaining = totalDistance * remainingProgress;

            return {
              ...resource,
              currentPosition: newPosition,
              pathIndex: targetIndex,
              breadcrumb: newBreadcrumb,
              returnBreadcrumb: newReturnBreadcrumb,
              distanceRemaining,
            };
          })
          .filter((resource): resource is MovingResource => resource !== null); // Remove null entries
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [movingResources.length]);

  // Use caller location if available, otherwise use incident location (Heriot-Watt University Malaysia)
  const center = callerLocation
    ? {
      lat: callerLocation.coords.latitude,
      lng: callerLocation.coords.longitude,
    }
    : { lat: 2.8994930048635545, lng: 101.6725950816638 };

  return (
    <>
      {/* Caller Location Marker with Pulsing Effect */}
      {callerLocation && (
        <>
          {/* Accuracy Circle */}
          <AdvancedMarker
            position={{
              lat: callerLocation.coords.latitude,
              lng: callerLocation.coords.longitude,
            }}
          >
            <div className="relative flex items-center justify-center">
              {/* Pulsing outer ring */}
              <div
                className={`absolute rounded-full bg-blue-500/30 border-2 border-blue-400 transition-all duration-1000 ${isPulsing ? "scale-150 opacity-0" : "scale-100 opacity-100"
                  }`}
                style={{
                  width: "48px",
                  height: "48px",
                }}
              />
              {/* Inner marker */}
              <div className="relative w-6 h-6 bg-blue-500 border-4 border-white rounded-full shadow-lg flex items-center justify-center z-10">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
              {/* Accuracy text */}
              <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                ±{Math.round(callerLocation.accuracy)}m
              </div>
            </div>
          </AdvancedMarker>
        </>
      )}

      {/* Incident Location Marker (if different from caller location) */}
      {!callerLocation && (
        <AdvancedMarker position={center}>
          <Pin
            background="#DC2626"
            borderColor="#991B1B"
            glyphColor="#FEF2F2"
            scale={1.2}
          />
        </AdvancedMarker>
      )}

      {/* Station Markers */}
      {/* {STATIONS.map((station) => (
        <AdvancedMarker
          key={station.id}
          position={{ lat: station.location.lat, lng: station.location.lng }}
        >
          <Pin
            background={getAgencyColor(station.agency)}
            borderColor="#fff"
            glyphColor="#fff"
            scale={0.8}
          />
        </AdvancedMarker>
      ))} */}

      {/* Emergency Station Markers */}
      {/* {availableStations?.map((station) => (
        <AdvancedMarker
          key={station.id}
          position={{ lat: station.location.lat, lng: station.location.lng }}
        >
          <Pin
            background={getAgencyColor(station.agency)}
            borderColor="#fff"
            glyphColor="#fff"
            scale={0.8}
          />
        </AdvancedMarker>
      ))} */}

      {/* Suggested Station Markers */}
      {suggestions.map((sug) => {
        const { station } = sug.resource;
        return (
          <AdvancedMarker
            key={station.id}
            position={{ lat: station.location.lat, lng: station.location.lng }}
          >
            <Pin
              background={getAgencyColor(station.agency)}
              borderColor="#fff"
              glyphColor="#fff"
              scale={0.8}
            />
          </AdvancedMarker>
        );
      })}

      {/* Traffic Lights - Only show after first vehicle arrives */}
      {showTrafficLights &&
        [
          { lat: 2.927496920912655, lng: 101.6661857078483 },
          { lat: 2.9109146473876546, lng: 101.66054093459915 },
          { lat: 2.8947281350902725, lng: 101.6738008155135 },
        ].map((position, index) => {
          // Check if any vehicle is near this traffic light (200m radius for early green)
          const isNearby = movingResources.some((resource) => {
            const distance = calculateDistance(
              resource.currentPosition.lat(),
              resource.currentPosition.lng(),
              position.lat,
              position.lng,
            );
            return distance < 0.4; // within 400 meters for advance green signal
          });

          return (
            <AdvancedMarker key={`traffic-light-${index}`} position={position}>
              <div
                className={`bg-black/80 border rounded p-0.5 shadow-md ${isNearby ? "border-green-500" : "border-red-500"}`}
              >
                <div className="text-sm">🚦</div>
              </div>
            </AdvancedMarker>
          );
        })
      }

      {/* Moving Resources */}
      {movingResources.map((resource) => (
        <AdvancedMarker
          key={resource.id}
          position={{
            lat: resource.currentPosition.lat(),
            lng: resource.currentPosition.lng(),
          }}
        >
          <div className="relative flex items-center justify-center">
            {/* Vehicle Icon */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-white"
              style={{
                backgroundColor: getAgencyColor(
                  resource.suggestion.resource.agency,
                ),
              }}
            >
              {getVehicleEmoji(resource.suggestion.resource.agency)}
            </div>
            {/* ETA Badge */}
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              ETA:{" "}
              {Math.max(
                0,
                Math.ceil(
                  resource.realEtaMinutes *
                  (1 -
                    (Date.now() - resource.startTime) / (resource.eta * 1000)),
                ))}
              min
              <br />
              {resource.distanceRemaining.toFixed(1)}km
            </div>
          </div>
        </AdvancedMarker>
      ))}

      {/* Routes and Breadcrumbs */}
      <RouteRenderer movingResources={movingResources} />
    </>
  );
}

// Component to render routes using native google.maps.Polyline
function RouteRenderer({
  movingResources,
}: {
  movingResources: MovingResource[];
}) {
  const map = useMap();
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!map) return;

    // Clear existing polylines
    polylinesRef.current.forEach((polyline) => polyline.setMap(null));
    polylinesRef.current = [];

    // Draw new polylines for each moving resource
    movingResources.forEach((resource) => {
      const agencyColor = getAgencyColor(resource.suggestion.resource.agency);
      const lightAgencyColor = getLightAgencyColor(
        resource.suggestion.resource.agency,
      );

      // Light colored polyline for full route (more visible)
      const fullRouteLine = new google.maps.Polyline({
        path: resource.isReturning ? resource.returnPath : resource.path,
        geodesic: true,
        strokeColor: lightAgencyColor,
        strokeOpacity: 0.6,
        strokeWeight: 4,
        map,
      });

      polylinesRef.current.push(fullRouteLine);

      // Outbound breadcrumb (only show when going to target, not returning)
      if (!resource.isReturning && resource.breadcrumb.length > 0) {
        const outboundBreadcrumb = new google.maps.Polyline({
          path: resource.breadcrumb,
          geodesic: true,
          strokeColor: agencyColor,
          strokeOpacity: 1,
          strokeWeight: 6,
          map,
        });
        polylinesRef.current.push(outboundBreadcrumb);
      }

      // Return breadcrumb (show when returning)
      if (resource.isReturning && resource.returnBreadcrumb.length > 0) {
        const returnBreadcrumbLine = new google.maps.Polyline({
          path: resource.returnBreadcrumb,
          geodesic: true,
          strokeColor: agencyColor,
          strokeOpacity: 1,
          strokeWeight: 6,
          map,
        });
        polylinesRef.current.push(returnBreadcrumbLine);
      }
    });

    return () => {
      polylinesRef.current.forEach((polyline) => polyline.setMap(null));
      polylinesRef.current = [];
    };
  }, [map, movingResources]);

  return null;
}

function getAgencyColor(agency: string): string {
  const colors: Record<string, string> = {
    PDRM: "#1E40AF",
    JBPM: "#DC2626",
    KKM: "#059669",
    APM: "#EA580C",
    MMEA: "#0891B2",
  };
  return colors[agency] || "#6B7280";
}

function getLightAgencyColor(agency: string): string {
  const colors: Record<string, string> = {
    PDRM: "#93C5FD", // light blue
    JBPM: "#FCA5A5", // light red
    KKM: "#6EE7B7", // light green
    APM: "#FDBA74", // light orange
    MMEA: "#67E8F9", // light cyan
  };
  return colors[agency] || "#D1D5DB";
}

function getVehicleEmoji(agency: string): string {
  const emojis: Record<string, string> = {
    PDRM: "🚓", // police car
    JBPM: "🚒", // fire truck
    KKM: "🚑", // ambulance
    APM: "🚐", // rescue vehicle
    MMEA: "🚤", // boat
  };
  return emojis[agency] || "🚗";
}

// Helper function to calculate distance between two coordinates
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
