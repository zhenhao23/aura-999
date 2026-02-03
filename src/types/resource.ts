import { Location } from "./incident";

export type AgencyType = "PDRM" | "JBPM" | "KKM" | "APM" | "MMEA";

export type ResourceStatus = "available" | "dispatched" | "busy" | "offline";

export type ResourceType =
  | "patrol-car"
  | "fire-engine"
  | "ambulance"
  | "rescue-vehicle"
  | "boat"
  | "helicopter";

export interface Station {
  id: string;
  name: string;
  location: Location;
  agency: AgencyType;
}

export interface Resource {
  id: string;
  agency: AgencyType;
  type: ResourceType;
  vehicleNumber?: string;
  station: Station;
  status: ResourceStatus;
  eta?: number; // in minutes
  currentLocation?: Location;
  crew?: number; // number of personnel
}

export interface ResourceAllocationSuggestion {
  resource: Resource;
  priority: number; // 1-5, 1 being highest
  reasoning: string;
  estimatedETA: number;
  routeDistance?: number; // in kilometers
}

export interface GooglePlaceResult {
  place_id?: string;
  name?: string;
  vicinity?: string;
  geometry?: {
    location?: {
      lat?: number;
      lng?: number;
    };
  };
};
