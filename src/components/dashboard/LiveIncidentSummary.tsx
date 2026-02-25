"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listenForIncidentUpdates,
  listenForVisualHazards,
  listenForAIAssessment,
  type IncidentUpdate,
  type CallerLocation,
} from "@/lib/firebase/signaling";
import { VisualHazard, AIAssessment, AIProgress } from "@/types/ai-agent";
import { AlertTriangle, Eye, MapPin, Users, Info, Shield, AlertCircle, Edit } from "lucide-react";
import { AssessmentValueLogging } from "@/components/dashboard/AiSummaryLogging";
import { EditableAssessmentField } from "@/components/dashboard/EditableAssessmentField";

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
  const [eventCode, setEventCode] = useState<string | null>("32-B-2");
  const [showEventCodeDialog, setShowEventCodeDialog] = useState(false);
  const [tempEventCode, setTempEventCode] = useState({
    agency: "",
    level: "",
    priority: "",
  });
  const [incidentData, setIncidentData] = useState({
    type: "Unknown",
    location: "Determining...",
    severity: "Unknown",
    victims: "Unknown",
    situation: "AI is observing...",
  });
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

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

  const isActive = callId !== null;

  const agencyMap: Record<string, string> = {
    "30": "Fire",
    "31": "Police",
    "32": "Medical",
    "33": "Marine",
    "34": "Civil Defence",
  };

  const handleEventCodeClick = () => {
    const [agencyCode, level, priority] = eventCode?.split("-") || ["32", "B", "2"];
    setTempEventCode({
      agency: agencyCode,
      level,
      priority,
    });
    setShowEventCodeDialog(true);
  };

  const handleSaveEventCode = () => {
    const newEventCode = `${tempEventCode.agency}-${tempEventCode.level}-${tempEventCode.priority}`;
    setEventCode(newEventCode);
    setShowEventCodeDialog(false);
  };

  const startEditField = (fieldName: string, currentValue: string) => {
    setEditingField(fieldName);
    setEditValue(currentValue);
  };

  const saveEditField = (fieldName: string) => {
    setIncidentData((prev) => ({
      ...prev,
      [fieldName]: editValue,
    }));
    setEditingField(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "success" });
    }, 3000);
  };

  const handleApproveAssessment = () => {
    // Mock: Convert to PDF and show notification
    console.log("Assessment approved:", incidentData);
    showNotification("✓ Assessment approved and saved to incident log");
    // In real app: Generate PDF, push to database, etc.
  };

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

  // const isActive = callId !== null;

  const getTrustBadge = () => {
    switch (callerDetails?.trustLevel.toLowerCase()) {
      case "high":
        return (
          <Badge className="bg-green-600 flex items-center gap-1 text-[11px] font-semibold">
            {/* Genuine */}
            <Shield className="w-3 h-3" />
            Genuine Caller
          </Badge>
        );
      case "low":
        return (
          <Badge className="bg-red-600 animate-pulse flex items-center gap-1 text-[11px] font-semibold">
            <AlertCircle className="w-3 h-3" />
            Previous Prank Caller
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500 flex items-center gap-1 text-[11px] font-semibold">
            <Info className="w-3 h-3" />
            Suspicious Caller
          </Badge>
        );
    }
  };

  const getEventCodeBadge = () => {
    return (
      <Badge
        className="bg-purple-400 flex items-center gap-1 text-[11px] font-semibold cursor-pointer hover:bg-purple-500 transition-colors"
        onClick={handleEventCodeClick}
      >
        Event Code: {eventCode}
        <Edit className="w-2 h-2" />
      </Badge>
    );
  };

  return (
    <>
      {/* Notification Toast */}
      {notification.show && (
        <div
          className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300 ${notification.type === "success"
            ? "bg-green-600 text-white"
            : "bg-red-600 text-white"
            }`}
        >
          <p className="text-sm font-medium">{notification.message}</p>
        </div>
      )}

      {/* <Card className={isActive ? "border-purple-500/30" : ""}> */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className={`w-4 h-4 ${isActive ? "text-purple-400" : ""}`} />
              {isActive
                ? "🤖 AI Shadow Mode - Live Updates"
                : "AI Shadow Mode - Inactive"}
            </CardTitle>
            {isActive && (
              <Badge className="bg-purple-600 animate-pulse text-[11px] font-semibold">Observing</Badge>
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

            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-purple-300 uppercase">
                Current Assessment
              </h4>
              {isActive && getEventCodeBadge()}
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              {/* Type - Editable */}
              <EditableAssessmentField
                fieldName="type"
                label="Type"
                value={incidentData.type}
                isActive={isActive}
                isEditing={editingField === "type"}
                editValue={editValue}
                reasoning="Detected fire-like textures and smoke patterns in the video stream."
                onStartEdit={startEditField}
                onSave={saveEditField}
                onCancel={cancelEdit}
                onEditValueChange={setEditValue}
                placeholder="Enter incident type"
              />

              {/* Severity - Editable */}
              <EditableAssessmentField
                fieldName="severity"
                label="Severity"
                value={incidentData.severity}
                isActive={isActive}
                isEditing={editingField === "severity"}
                editValue={editValue}
                reasoning="High probability of structural damage and immediate threat to life."
                onStartEdit={startEditField}
                onSave={saveEditField}
                onCancel={cancelEdit}
                onEditValueChange={setEditValue}
                placeholder="e.g. Critical, High"
              />

              {/* Location - Editable */}
              <EditableAssessmentField
                fieldName="location"
                label="Location"
                value={incidentData.location}
                isActive={isActive}
                isEditing={editingField === "location"}
                editValue={editValue}
                reasoning="GPS coordinates cross-referenced with local landmark recognition."
                onStartEdit={startEditField}
                onSave={saveEditField}
                onCancel={cancelEdit}
                onEditValueChange={setEditValue}
                icon={<MapPin className="w-3 h-3" />}
                fullWidth
                placeholder="Enter location"
              />

              {/* Victims - Editable */}
              <EditableAssessmentField
                fieldName="victims"
                label="Victims"
                value={incidentData.victims}
                isActive={isActive}
                isEditing={editingField === "victims"}
                editValue={editValue}
                reasoning="Human posture detection identifies individuals on the ground."
                onStartEdit={startEditField}
                onSave={saveEditField}
                onCancel={cancelEdit}
                onEditValueChange={setEditValue}
                icon={<Users className="w-3 h-3" />}
                fullWidth
                placeholder="Enter victim count/details"
              />

              {/* Situation - Editable */}
              <EditableAssessmentField
                fieldName="situation"
                label="Situation"
                value={incidentData.situation}
                isActive={isActive}
                isEditing={editingField === "situation"}
                editValue={editValue}
                reasoning="Detailed situation assessment from AI analysis."
                onStartEdit={startEditField}
                onSave={saveEditField}
                onCancel={cancelEdit}
                onEditValueChange={setEditValue}
                isTextarea
                fullWidth
                placeholder="Enter situation details"
              />
            </div>

            {/* Approve Button */}
            {isActive && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700">
                <Button
                  onClick={handleApproveAssessment}
                  className="flex-1 bg-purple-400 hover:bg-purple-500 "
                  size="sm"
                >
                  ✓ Approve & Save Assessment
                </Button>
              </div>
            )}
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
                {callerLocation.buildingName && !callerLocation.address && (
                  <>
                    {/* Extract building/landmark name (first part before comma) */}
                    <p className="text-xs text-gray-300 mt-1 font-semibold">
                      {callerLocation.buildingName}
                    </p>
                  </>
                )}
                {callerLocation.address && !callerLocation.buildingName && (
                  <>
                    {/* Show full address as secondary info */}
                    <p className="text-xs text-gray-300 mt-1">
                      {callerLocation.address}
                    </p>
                  </>
                )}

                {callerLocation.address && callerLocation.buildingName && (
                  <>
                    {/* Extract building/landmark name (first part before comma) */}
                    <p className="text-xs text-gray-300 mt-1 font-semibold">
                      {callerLocation.buildingName}
                    </p>
                    {/* Show full address as secondary info */}
                    <p className="text-xs text-gray-500 mt-1">
                      {callerLocation.address}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-slate-900/50 border border-slate-700 rounded p-2">
                <p className="text-xs text-muted-foreground">-</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Event Code Editor Dialog */}
      {isActive && (
        <Dialog open={showEventCodeDialog} onOpenChange={setShowEventCodeDialog}>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle>Edit Event Code</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Agency Selection */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">
                  Agency (30-34)
                </label>
                <Select value={tempEventCode.agency} onValueChange={(value) => {
                  setTempEventCode({ ...tempEventCode, agency: value });
                }}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="30">30 - Fire</SelectItem>
                    <SelectItem value="31">31 - Police</SelectItem>
                    <SelectItem value="32">32 - Medical</SelectItem>
                    <SelectItem value="33">33 - Marine</SelectItem>
                    <SelectItem value="34">34 - Civil Defence</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Level Selection */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">
                  Level
                </label>
                <Select value={tempEventCode.level} onValueChange={(value) => {
                  setTempEventCode({ ...tempEventCode, level: value });
                }}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="B">B - Building Level</SelectItem>
                    <SelectItem value="D">D - District Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority Selection */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">
                  Priority (1-5)
                </label>
                <Select value={tempEventCode.priority} onValueChange={(value) => {
                  setTempEventCode({ ...tempEventCode, priority: value });
                }}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="1">1 - Critical</SelectItem>
                    <SelectItem value="2">2 - High</SelectItem>
                    <SelectItem value="3">3 - Medium</SelectItem>
                    <SelectItem value="4">4 - Low</SelectItem>
                    <SelectItem value="5">5 - Minimal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Preview */}
              <div className="p-3 bg-slate-800/50 border border-slate-700 rounded">
                <p className="text-xs text-slate-400 mb-1">Preview:</p>
                <p className="text-lg font-bold text-purple-300">
                  {tempEventCode.agency}-{tempEventCode.level}-{tempEventCode.priority}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {agencyMap[tempEventCode.agency]}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEventCodeDialog(false)}
                className="border-slate-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEventCode}
                className="bg-purple-400 hover:bg-purple-500"
              >
                Save Event Code
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
