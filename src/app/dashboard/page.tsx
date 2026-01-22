"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { IntelligentSummary } from "@/components/dashboard/IntelligentSummary";
import { ResourceAllocation } from "@/components/dashboard/ResourceAllocation";
import { LiveFeed } from "@/components/dashboard/LiveFeed";
import { UniversalComms } from "@/components/dashboard/UniversalComms";
import { TacticalMap } from "@/components/map/TacticalMap";
import { MOCK_INCIDENTS } from "@/data/mock-incidents";
import { generateResourceSuggestions } from "@/lib/resource-optimizer";
import { Message, ResourceAllocationSuggestion } from "@/types";
import {
  listenForIncomingCalls,
  listenForLocationUpdates,
  CallerLocation,
} from "@/lib/firebase/signaling";

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

  // Listen for incoming calls and location updates
  useEffect(() => {
    const unsubscribeCalls = listenForIncomingCalls((callId, callData) => {
      console.log("Incoming call:", callId, callData);
      setActiveCallId(callId);

      // If call already has location, set it
      if (callData.currentLocation) {
        setCallerLocation(callData.currentLocation);
      }
    });

    return () => {
      unsubscribeCalls();
    };
  }, []);

  // Listen for location updates on active call
  useEffect(() => {
    if (!activeCallId) return;

    const unsubscribeLocation = listenForLocationUpdates(
      activeCallId,
      (location) => {
        console.log("Location update:", location);
        setCallerLocation(location);

        // Optionally update incident location
        // This would require updating the incident state
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
