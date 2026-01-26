"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { IntelligentSummary } from "@/components/dashboard/IntelligentSummary";
import { ResourceAllocation } from "@/components/dashboard/ResourceAllocation";
import { LiveFeed } from "@/components/dashboard/LiveFeed";
import { UniversalComms } from "@/components/dashboard/UniversalComms";
import { IncomingCallAlert } from "@/components/dashboard/IncomingCallAlert";
import { TacticalMap } from "@/components/map/TacticalMap";
import { MOCK_INCIDENTS } from "@/data/mock-incidents";
import { generateResourceSuggestions } from "@/lib/resource-optimizer";
import { Message, ResourceAllocationSuggestion } from "@/types";
import {
  listenForIncomingCalls,
  listenForLocationUpdates,
  listenForAIAssessment,
  updateCallPhase,
  endCall,
  CallerLocation,
} from "@/lib/firebase/signaling";
import { AIAssessment, CallPhase } from "@/types/ai-agent";

export default function DashboardPage() {
  // Use the first mock incident as the active incident
  const [activeIncident] = useState(MOCK_INCIDENTS[0]);
  const [suggestions] = useState<ResourceAllocationSuggestion[]>(
    generateResourceSuggestions(activeIncident),
  );
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-1",
      sender: "caller",
      content: "Ya Allah! Ada api besar! Tolong!",
      translatedContent: "Oh God! There is a big fire! Help!",
      originalLanguage: "Malay",
      timestamp: new Date(),
    },
  ]);
  const [dispatchedResources, setDispatchedResources] = useState<string[]>([]);
  const [deniedResources, setDeniedResources] = useState<string[]>([]);
  const [callerLocation, setCallerLocation] = useState<CallerLocation | null>(
    null,
  );
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [aiAssessment, setAIAssessment] = useState<AIAssessment | null>(null);
  const [callPhase, setCallPhase] = useState<CallPhase>("ai-screening");
  const [showIncomingAlert, setShowIncomingAlert] = useState(false);

  // Listen for incoming calls and location updates
  useEffect(() => {
    const unsubscribeCalls = listenForIncomingCalls((callId, callData) => {
      setActiveCallId(callId);

      // Show alert immediately for demo purposes
      setShowIncomingAlert(true);
      playNotificationSound();

      // If call already has location, set it
      if (callData.currentLocation) {
        setCallerLocation(callData.currentLocation);
      }
    });

    return () => {
      unsubscribeCalls();
    };
  }, []);

  // Listen for AI assessment on active call
  useEffect(() => {
    if (!activeCallId) return;

    const unsubscribe = listenForAIAssessment(
      activeCallId,
      (assessment, phase) => {
        setAIAssessment(assessment);
        setCallPhase(phase);
      },
    );

    return () => unsubscribe();
  }, [activeCallId]);

  // Listen for location updates on active call
  useEffect(() => {
    if (!activeCallId) return;

    const unsubscribeLocation = listenForLocationUpdates(
      activeCallId,
      (location) => {
        setCallerLocation(location);
      },
    );

    return () => {
      unsubscribeLocation();
    };
  }, [activeCallId]);

  const handleApprove = (resourceId: string) => {
    console.log("Approved resource:", resourceId);
    setDispatchedResources((prev) => [...prev, resourceId]);
  };

  const handleDeny = (resourceId: string) => {
    console.log("Denied resource:", resourceId);
    setDeniedResources((prev) => [...prev, resourceId]);
  };

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: "dispatcher",
      content,
      translatedContent: translateToMalay(content), // Mock translation
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  // Accept incoming call
  const handleAcceptCall = async () => {
    if (!activeCallId) return;

    try {
      // Update call phase to dispatcher-active
      await updateCallPhase(activeCallId, "dispatcher-active");

      // Hide alert
      setShowIncomingAlert(false);
    } catch (error) {
      console.error("Error accepting call:", error);
    }
  };

  // Reject incoming call
  const handleRejectCall = async () => {
    if (!activeCallId) return;

    try {
      // End the call
      await endCall(activeCallId);

      // Hide alert and reset state
      setShowIncomingAlert(false);
      setActiveCallId(null);
      setAIAssessment(null);
      setCallerLocation(null);
    } catch (error) {
      console.error("Error rejecting call:", error);
    }
  };

  // Handle call end from LiveFeed
  const handleCallEnd = async () => {
    if (!activeCallId) return;

    try {
      await endCall(activeCallId);
      setActiveCallId(null);
      setAIAssessment(null);
      setCallerLocation(null);
      setCallPhase("ai-screening");
    } catch (error) {
      console.error("Error ending call:", error);
    }
  };

  // Play notification sound
  const playNotificationSound = () => {
    // Create an audio context and play a simple beep
    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5,
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log("Could not play notification sound:", error);
    }
  };

  // Filter out dispatched and denied resources from suggestions
  const availableSuggestions = suggestions.filter(
    (s) =>
      !dispatchedResources.includes(s.resource.id) &&
      !deniedResources.includes(s.resource.id),
  );

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Background Map */}
      <div className="absolute inset-0 z-0">
        <TacticalMap
          incident={activeIncident}
          dispatchedResources={dispatchedResources}
          suggestions={suggestions}
          callerLocation={callerLocation}
        />
      </div>

      {/* Incoming Call Alert Overlay */}
      {showIncomingAlert && activeCallId && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="max-w-2xl w-full mx-4">
            <IncomingCallAlert
              callId={activeCallId}
              assessment={aiAssessment}
              location={
                callerLocation
                  ? {
                      address: callerLocation.address,
                      coords: {
                        latitude: callerLocation.coords.latitude,
                        longitude: callerLocation.coords.longitude,
                      },
                    }
                  : undefined
              }
              onAccept={handleAcceptCall}
              onReject={handleRejectCall}
            />
          </div>
        </div>
      )}

      {/* Quadrant Grid Overlay */}
      <div className="absolute inset-0 z-10 grid grid-cols-8 grid-rows-2 gap-4 p-4 pointer-events-none">
        <div className="col-span-2 overflow-auto pointer-events-auto">
          <IntelligentSummary
            incident={activeIncident}
            callerLocation={callerLocation}
          />
        </div>

        <div className="col-span-3 pointer-events-none"></div>

        <div
          className={`col-span-3 overflow-auto pointer-events-auto ${availableSuggestions.length === 0 ? "invisible" : ""}`}
        >
          <ResourceAllocation
            suggestions={availableSuggestions}
            onApprove={handleApprove}
            onDeny={handleDeny}
          />
        </div>

        <div className="col-span-2 overflow-auto pointer-events-auto">
          <LiveFeed
            videoUrl={activeIncident.videoUrl}
            transcript={activeIncident.transcript}
            activeCallId={
              callPhase === "dispatcher-active" ? activeCallId : null
            }
            onCallEnd={handleCallEnd}
          />
        </div>

        <div className="col-span-4 pointer-events-none"></div>

        <div className="col-span-2 overflow-auto pointer-events-auto">
          <UniversalComms
            messages={messages}
            onSendMessage={handleSendMessage}
            callerLanguage={activeIncident.callerInfo?.language}
          />
        </div>
      </div>
    </div>
  );
}

// Mock translation function
function translateToMalay(text: string): string {
  const translations: Record<string, string> = {
    "Help is on the way": "Bantuan sedang dalam perjalanan",
    "Stay calm": "Tetap tenang",
    "What is your location?": "Di mana lokasi anda?",
    "Are you safe?": "Adakah anda selamat?",
  };
  return translations[text] || `[BM: ${text}]`;
}
