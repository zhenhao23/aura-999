"use client";

import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
} from "@vis.gl/react-google-maps";

interface MiniMapProps {
  lat: number;
  lng: number;
  address?: string;
}

export function MiniMap({ lat, lng, address }: MiniMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  return (
    <div className="mt-2 h-48 rounded border overflow-hidden">
      <APIProvider apiKey={apiKey}>
        <Map
          mapId="5922251663d14fbc4edaf242"
          defaultCenter={{ lat, lng }}
          defaultZoom={15}
          gestureHandling="none"
          disableDefaultUI={true}
          className="w-full h-full"
          colorScheme="DARK"
          clickableIcons={false}
          zoomControl={false}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={false}
        >
          <AdvancedMarker position={{ lat, lng }}>
            <Pin
              background="#ef4444"
              borderColor="#dc2626"
              glyphColor="#ffffff"
            />
          </AdvancedMarker>
        </Map>
      </APIProvider>
    </div>
  );
}
