"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  listenForIncidentUpdates,
  listenForVisualHazards,
  listenForAIAssessment,
  type IncidentUpdate,
  type CallerLocation,
} from "@/lib/firebase/signaling";
import { VisualHazard, AIAssessment, AIProgress } from "@/types/ai-agent";
import { AlertTriangle, Eye, MapPin, Users, Info, Shield, AlertCircle } from "lucide-react";
import { AssessmentValueLogging } from "@/components/dashboard/AiSummaryLogging";

interface LiveIncidentSummaryProps {
  callId: string | null;
  callerLocation?: CallerLocation | null;
}

export function LiveIncidentSummary({
  callId,
  callerLocation,
}: LiveIncidentSummaryProps) {
  const [updates, setUpdates] = useState<IncidentUpdate[]>([]);
  const [hazards, setHazards] = useState<VisualHazard[]>([]);
  const [aiAssessment, setAIAssessment] = useState<AIAssessment | null>(null);
  const [aiProgress, setAIProgress] = useState<AIProgress | null>(null);
  const [callerDetails, setCallerDetails] = useState({
    phone: "+6016-1234567",
    language: "English",
    trustLevel: "High", // e.g., High, Medium, Low
  })
  const [incidentData, setIncidentData] = useState({
    type: "Unknown",
    location: "Determining...",
    severity: "Unknown",
    victims: "Unknown",
    situation: "AI is observing...",
  });

  // Listen for AI assessment and progress (baseline data)
  useEffect(() => {
    if (!callId) {
      setAIAssessment(null);
      setAIProgress(null);
      return;
    }

    const unsubscribe = listenForAIAssessment(
      callId,
      (assessment, phase, progress) => {
        setAIAssessment(assessment);
        setAIProgress(progress ?? null);

        // Initialize incident data from AI assessment/progress
        if (assessment || progress) {
          setIncidentData({
            type:
              progress?.incidentType ||
              assessment?.initialSummary?.split(" ")[0] ||
              "Unknown",
            location: progress?.location || "Determining...",
            severity: assessment?.urgencyLevel
              ? `Level ${assessment.urgencyLevel}`
              : "Unknown",
            victims: progress?.peopleInvolved || "Unknown",
            situation:
              assessment?.initialSummary ||
              progress?.keyDetails?.join(", ") ||
              "AI is observing...",
          });
        }
      },
    );

    return () => unsubscribe();
  }, [callId]);

  // Listen for incident field updates
  useEffect(() => {
    if (!callId) {
      setUpdates([]);
      return;
    }

    const unsubscribe = listenForIncidentUpdates(callId, (update) => {
      // Add to updates list
      setUpdates((prev) => [update, ...prev].slice(0, 20)); // Keep last 20

      // Update main incident data
      setIncidentData((prev) => ({
        ...prev,
        [update.field]: update.value,
      }));
    });

    return () => unsubscribe();
  }, [callId]);

  // Listen for visual hazards
  useEffect(() => {
    if (!callId) {
      setHazards([]);
      return;
    }

    const unsubscribe = listenForVisualHazards(callId, (hazard) => {
      setHazards((prev) => [hazard, ...prev].slice(0, 10)); // Keep last 10
    });

    return () => unsubscribe();
  }, [callId]);

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-red-600";
      case "high":
        return "bg-orange-600";
      case "medium":
        return "bg-yellow-600";
      case "low":
        return "bg-blue-600";
      default:
        return "bg-gray-600";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-400";
    if (confidence >= 0.6) return "text-yellow-400";
    return "text-orange-400";
  };

  const isActive = callId !== null;

  const getTrustBadge = () => {
    switch (callerDetails?.trustLevel.toLowerCase()) {
      case "high":
        return (
          <Badge className="bg-green-600 flex items-center gap-1">
            {/* High Trust or Genuine */}
            <Shield className="w-3 h-3" />
            High Trust
          </Badge>
        );
      case "low":
        return (
          <Badge className="bg-red-600 animate-pulse flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Suspicious
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-600 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Neutral
          </Badge>
        );
    }
  };

  return (
    <Card className={isActive ? "border-purple-500/30" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className={`w-4 h-4 ${isActive ? "text-purple-400" : ""}`} />
            {isActive
              ? "🤖 AI Shadow Mode - Live Updates"
              : "AI Shadow Mode - Inactive"}
          </CardTitle>
          {isActive && (
            <Badge className="bg-purple-600 animate-pulse">Observing</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current Caller Details */}
        <div className="space-y-2 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-purple-300 uppercase">
              Caller Information
            </h4>
            {isActive && getTrustBadge()}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Phone:</span>
              <p className="font-semibold">
                {isActive ? (
                  callerDetails?.phone
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Language:</span>
              <p className="font-semibold">
                {isActive ? (
                  callerDetails?.language
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Current Incident Summary */}
        <div className="space-y-2 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
          <h4 className="text-xs font-semibold text-purple-300 uppercase">
            Current Assessment
          </h4>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Type:</span>
              <div className="col-span-2 flex items-center gap-2">
                <p className="font-semibold">
                  {isActive ? (
                    incidentData.type
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </p>
                <AssessmentValueLogging
                  value={incidentData.type}
                  isActive={isActive}
                  reasoning="Detected fire-like textures and smoke patterns in the video stream."
                />
              </div>
            </div>

            <div>
              <span className="text-muted-foreground">Severity:</span>
              <div className="col-span-2 flex items-center gap-2">
                <p className="font-semibold">
                  {isActive ? (
                    incidentData.severity
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </p>
                <AssessmentValueLogging
                  value={incidentData.severity}
                  isActive={isActive}
                  reasoning="High probability of structural damage and immediate threat to life."
                />
              </div>
            </div>

            <div className="col-span-2">
              <span className="text-muted-foreground">Location:</span>
              <div className="col-span-2 flex items-center gap-2">
                <p className="font-semibold flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {isActive ? (
                    incidentData.location
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </p>
                <AssessmentValueLogging
                  value={incidentData.location}
                  isActive={isActive}
                  reasoning="GPS coordinates cross-referenced with local landmark recognition."
                />
              </div>
            </div>

            <div className="col-span-2">
              <span className="text-muted-foreground">Victims:</span>
              <div className="col-span-2 flex items-center gap-2">
                <p className="font-semibold flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {isActive ? (
                    incidentData.victims
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </p>
                <AssessmentValueLogging
                  value={incidentData.victims}
                  isActive={isActive}
                  reasoning="Human posture detection identifies 2 individuals on the ground."
                />
              </div>
            </div>

            <div className="col-span-2">
              <span className="text-muted-foreground">Situation:</span>
              <div className="col-span-2 flex items-center gap-2">
                <p className="text-sm">
                  {isActive ? (
                    incidentData.situation
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </p>
                <AssessmentValueLogging
                  value={incidentData.situation}
                  isActive={isActive}
                  reasoning="Human posture detection identifies 2 individuals on the ground."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Visual Hazards */}
        {hazards.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-red-300 uppercase flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Visual Hazards Detected
            </h4>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {hazards.map((hazard, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-red-950/30 border border-red-900/50 rounded text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge className={getSeverityColor(hazard.severity)}>
                        {hazard.hazardType.replace("_", " ").toUpperCase()}
                      </Badge>
                      <span className={getConfidenceColor(hazard.confidence)}>
                        {Math.round(hazard.confidence * 100)}%
                      </span>
                    </div>
                    <p className="text-muted-foreground">
                      {hazard.description}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {hazard.locationInFrame}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Live Update Feed */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-blue-300 uppercase flex items-center gap-1">
            <Info className="w-3 h-3" />
            Live AI Updates
          </h4>
          <ScrollArea className="h-40">
            <div className="space-y-2">
              {updates.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  Waiting for AI observations...
                </p>
              ) : (
                updates.map((update, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-slate-900/50 border border-slate-700 rounded text-xs animate-in fade-in slide-in-from-top-2"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-blue-300">
                        {update.field.toUpperCase()}
                      </span>
                      <span className={getConfidenceColor(update.confidence)}>
                        {Math.round(update.confidence * 100)}% confident
                      </span>
                    </div>
                    <p className="text-white">{update.value}</p>
                    <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
                      <span>Source: {update.source}</span>
                      <span>
                        {new Date(update.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Live Caller Location */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-blue-300 uppercase flex items-center gap-1">
            📍 Live Caller Location
          </h4>
          {callerLocation ? (
            <div className="bg-blue-950/30 border border-blue-500/50 rounded p-2">
              <p className="text-xs text-gray-300">
                {callerLocation.coords.latitude.toFixed(6)},{" "}
                {callerLocation.coords.longitude.toFixed(6)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Accuracy: ±{Math.round(callerLocation.accuracy)}m
              </p>
              {callerLocation.address && (
                <p className="text-xs text-gray-300 mt-1">
                  {callerLocation.address}
                </p>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/50 border border-slate-700 rounded p-2">
              <p className="text-xs text-muted-foreground">-</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card >
  );
}
