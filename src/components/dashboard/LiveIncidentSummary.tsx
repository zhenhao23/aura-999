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
} from "@/lib/firebase/signaling";
import { VisualHazard, AIAssessment, AIProgress } from "@/types/ai-agent";
import { AlertTriangle, Eye, MapPin, Users, Info } from "lucide-react";

interface LiveIncidentSummaryProps {
  callId: string | null;
}

export function LiveIncidentSummary({ callId }: LiveIncidentSummaryProps) {
  const [updates, setUpdates] = useState<IncidentUpdate[]>([]);
  const [hazards, setHazards] = useState<VisualHazard[]>([]);
  const [aiAssessment, setAIAssessment] = useState<AIAssessment | null>(null);
  const [aiProgress, setAIProgress] = useState<AIProgress | null>(null);
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
        setAIProgress(progress);

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

  if (!callId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="w-4 h-4" />
            AI Shadow Mode - Inactive
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Waiting for active call...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="w-4 h-4 text-purple-400" />
            🤖 AI Shadow Mode - Live Updates
          </CardTitle>
          <Badge className="bg-purple-600 animate-pulse">Observing</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Incident Summary */}
        <div className="space-y-2 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
          <h4 className="text-xs font-semibold text-purple-300 uppercase">
            Current Assessment
          </h4>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Type:</span>
              <p className="font-semibold">{incidentData.type}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Severity:</span>
              <p className="font-semibold">{incidentData.severity}</p>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Location:</span>
              <p className="font-semibold flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {incidentData.location}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Victims:</span>
              <p className="font-semibold flex items-center gap-1">
                <Users className="w-3 h-3" />
                {incidentData.victims}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Situation:</span>
              <p className="text-sm">{incidentData.situation}</p>
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
      </CardContent>
    </Card>
  );
}
