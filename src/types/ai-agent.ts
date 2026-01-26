export interface AIAssessment {
  urgencyLevel: 1 | 2 | 3 | 4 | 5;
  reasoning: string;
  shouldTransfer: boolean;
  initialSummary: string;
  detectedLanguage?: string;
  completedAt: Date;
}

export interface IncidentField {
  field: "type" | "location" | "severity" | "hazards" | "victims" | "situation";
  value: string | number | object;
  confidence: number;
  timestamp: Date;
}

export interface VisualHazard {
  hazardType: string;
  severity: "low" | "medium" | "high" | "critical";
  locationInFrame?: string;
  description: string;
  timestamp: string;
  confidence: number;
}

export type CallPhase = "ai-screening" | "transferring" | "dispatcher-active";
