"use client";

import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
} from "@vis.gl/react-google-maps";
import { Incident, ResourceAllocationSuggestion } from "@/types";
import { STATIONS } from "@/data/stations";

// Dark mode map styles
const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "administrative.country",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  {
    featureType: "administrative.land_parcel",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#bdbdbd" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#181818" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#1b1b1b" }],
  },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: "#2c2c2c" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8a8a8a" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#373737" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#3c3c3c" }],
  },
  {
    featureType: "road.highway.controlled_access",
    elementType: "geometry",
    stylers: [{ color: "#4e4e4e" }],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "transit",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#000000" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3d3d3d" }],
  },
];

interface TacticalMapProps {
  incident: Incident;
  dispatchedResources: string[];
  suggestions: ResourceAllocationSuggestion[];
}

export function TacticalMap({
  incident,
  dispatchedResources,
  suggestions,
}: TacticalMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  // Sunway Pyramid Shopping Mall coordinates
  const center = { lat: 3.073539067953962, lng: 101.60760614362562 };

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        mapId="5922251663d14fbc4edaf242"
        defaultCenter={center}
        defaultZoom={14}
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
        {/* Incident Location Marker */}
        <AdvancedMarker position={center}>
          <Pin
            background="#DC2626"
            borderColor="#991B1B"
            glyphColor="#FEF2F2"
            scale={1.2}
          />
        </AdvancedMarker>

        {/* Station Markers */}
        {STATIONS.map((station) => (
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
        ))}
      </Map>
    </APIProvider>
  );
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
