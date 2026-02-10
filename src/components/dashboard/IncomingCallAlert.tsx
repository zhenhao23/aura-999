"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AIAssessment, AIProgress } from "@/types/ai-agent";
import {
  Phone,
  PhoneOff,
  MapPin,
  AlertTriangle,
  Clock,
  Loader2,
} from "lucide-react";

interface IncomingCallAlertProps {
  callId: string;
  assessment: AIAssessment | null;
  progress?: AIProgress | null;
  location?: {
    address?: string;
    coords?: { latitude: number; longitude: number };
  };
  onAccept: () => void;
  onReject: () => void;
}

export function IncomingCallAlert({
  callId,
  assessment,
  progress,
  location,
  onAccept,
  onReject,
}: IncomingCallAlertProps) {
  const getUrgencyColor = (level: number) => {
    if (level <= 1) return "bg-red-600";
    if (level <= 2) return "bg-orange-600";
    if (level <= 3) return "bg-yellow-600";
    return "bg-green-600";
  };

  const getUrgencyLabel = (level: number) => {
    if (level <= 1) return "RESUSCITATION";
    if (level <= 2) return "EMERGENCY";
    if (level <= 3) return "URGENT";
    if (level <= 4) return "EARLY CARE";
    return "ROUTINE";
  };

  // Use assessment data if available, otherwise use progress data or defaults
  const urgencyLevel =
    assessment?.urgencyLevel || progress?.estimatedUrgency || 3;
  const summary = assessment?.initialSummary || generateProgressSummary();
  const reasoning = assessment?.reasoning;

  function generateProgressSummary(): string {
    if (!progress)
      return "Emergency call in progress. AI assessment pending...";

    const parts: string[] = [];
    if (progress.incidentType) parts.push(`Type: ${progress.incidentType}`);
    if (progress.location) parts.push(`Location: ${progress.location}`);
    if (progress.peopleInvolved) parts.push(progress.peopleInvolved);

    if (parts.length === 0) return "🤖 AI gathering information...";
    return parts.join(" • ");
  }

  return (
    <Card className="bg-gradient-to-br from-red-950/95 to-red-900/95 border-red-500 border-2 p-6 shadow-2xl animate-pulse-slow backdrop-blur-md">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center animate-ping-slow">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                🚨 INCOMING EMERGENCY CALL
              </h3>
              <p className="text-sm text-red-200">
                {assessment
                  ? "AI Assessment Complete"
                  : "🤖 AI Screening in Progress"}{" "}
                • Call ID: {callId.substring(0, 8)}
              </p>
            </div>
          </div>
          <Badge
            className={`${getUrgencyColor(urgencyLevel)} text-white px-4 py-2 text-lg`}
          >
            <AlertTriangle className="w-4 h-4 mr-1" />
            {getUrgencyLabel(urgencyLevel)} (Level {urgencyLevel})
          </Badge>
        </div>

        {/* AI Summary */}
        <div className="bg-black/30 rounded-lg p-4 border border-red-500/30">
          <div className="flex items-start gap-2 mb-2">
            <span className="text-2xl">🤖</span>
            <div className="flex-1">
              <p className="text-xs text-red-300 font-semibold mb-1 flex items-center gap-2">
                {assessment
                  ? "AI ASSESSMENT COMPLETE"
                  : "AI SCREENING IN PROGRESS"}
                {!assessment && <Loader2 className="w-3 h-3 animate-spin" />}
              </p>
              <p className="text-white font-medium leading-relaxed">
                {summary}
              </p>
            </div>
          </div>

          {/* Progressive Updates Display */}
          {progress && !assessment && (
            <div className="mt-3 space-y-2 border-t border-red-500/20 pt-3">
              <p className="text-xs text-red-300/80 font-semibold">
                LIVE UPDATES:
              </p>

              {progress.keyDetails && progress.keyDetails.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {progress.keyDetails.map((detail, idx) => (
                    <Badge key={idx} className="bg-blue-600/50 text-xs">
                      {detail}
                    </Badge>
                  ))}
                </div>
              )}

              {progress.hazardsDetected &&
                progress.hazardsDetected.length > 0 && (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3 h-3 text-orange-400 mt-0.5" />
                    <div className="flex flex-wrap gap-1">
                      {progress.hazardsDetected.map((hazard, idx) => (
                        <Badge key={idx} className="bg-orange-600/50 text-xs">
                          {hazard}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Reasoning */}
        {reasoning && (
          <div className="bg-black/30 rounded-lg p-4 border border-red-500/30">
            <p className="text-xs text-red-300 font-semibold mb-1">
              AI REASONING
            </p>
            <p className="text-sm text-red-100 italic">"{reasoning}"</p>
          </div>
        )}

        {/* Location */}
        {location && (
          <div className="flex items-center gap-2 text-white">
            <MapPin className="w-4 h-4 text-red-300" />
            <span className="text-sm">
              {location.address ||
                `${location.coords?.latitude.toFixed(4)}, ${location.coords?.longitude.toFixed(4)}`}
            </span>
          </div>
        )}

        {/* Timestamp */}
        <div className="flex items-center gap-2 text-red-200 text-xs">
          <Clock className="w-3 h-3" />
          <span>
            {assessment?.completedAt
              ? new Date(assessment.completedAt).toLocaleTimeString()
              : "Just now"}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={onAccept}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-6 text-lg shadow-lg"
          >
            <Phone className="w-5 h-5 mr-2" />
            ACCEPT CALL
          </Button>
          <Button
            onClick={onReject}
            variant="outline"
            className="px-6 border-red-500 text-red-300 hover:bg-red-900/50 py-6"
          >
            <PhoneOff className="w-5 h-5" />
          </Button>
        </div>

        {/* Warning Message */}
        {urgencyLevel >= 4 && (
          <div className="bg-red-600/30 border border-red-400 rounded-lg p-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-300" />
            <p className="text-sm text-red-100 font-semibold">
              CRITICAL EMERGENCY - Immediate response required
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
