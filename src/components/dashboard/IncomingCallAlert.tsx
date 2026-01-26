"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AIAssessment } from "@/types/ai-agent";
import { Phone, PhoneOff, MapPin, AlertTriangle, Clock } from "lucide-react";

interface IncomingCallAlertProps {
  callId: string;
  assessment: AIAssessment | null;
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
  location,
  onAccept,
  onReject,
}: IncomingCallAlertProps) {
  const getUrgencyColor = (level: number) => {
    if (level >= 4) return "bg-red-600";
    if (level >= 3) return "bg-orange-600";
    return "bg-yellow-600";
  };

  const getUrgencyLabel = (level: number) => {
    if (level >= 4) return "CRITICAL";
    if (level >= 3) return "HIGH";
    if (level >= 2) return "MEDIUM";
    return "LOW";
  };

  // Use assessment data if available, otherwise show defaults
  const urgencyLevel = assessment?.urgencyLevel || 3;
  const summary =
    assessment?.initialSummary ||
    "Emergency call in progress. AI assessment pending...";
  const reasoning = assessment?.reasoning;

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
              <p className="text-xs text-red-300 font-semibold mb-1">
                {assessment ? "AI ASSESSMENT" : "AI STATUS"}
              </p>
              <p className="text-white font-medium leading-relaxed">
                {summary}
              </p>
            </div>
          </div>
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
