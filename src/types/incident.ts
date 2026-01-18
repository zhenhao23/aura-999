export type UrgencyLevel = "very-urgent" | "urgent" | "not-urgent";

export type IncidentCategory =
  | "fire"
  | "medical"
  | "crime"
  | "accident"
  | "natural-disaster"
  | "other";

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface AIAnalysis {
  detectedHazards: string[];
  victimCount?: number;
  confidence: number;
  reasoning: string;
  videoTimestamp?: number; // Timestamp in seconds where hazard was detected
  thermalSignatures?: boolean;
  audioStressLevel?: number; // 0-100
}

export interface Incident {
  id: string;
  timestamp: Date;
  location: Location;
  urgency: UrgencyLevel;
  category: IncidentCategory;
  summary: string;
  aiAnalysis: AIAnalysis;
  callerInfo?: {
    name?: string;
    phone?: string;
    language: string;
  };
  status: "pending" | "dispatched" | "resolved" | "cancelled";
  videoUrl?: string;
  audioUrl?: string;
  transcript?: string;
}
