"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { IntelligentSummary } from "@/components/dashboard/IntelligentSummary";
import { ResourceAllocation } from "@/components/dashboard/ResourceAllocation";
import { LiveFeed } from "@/components/dashboard/LiveFeed";
import { UniversalComms } from "@/components/dashboard/UniversalComms";
import { TacticalMap } from "@/components/map/TacticalMap";
import { MOCK_INCIDENTS } from "@/data/mock-incidents";
import { generateResourceSuggestions } from "@/lib/resource-optimizer";
import { Message, ResourceAllocationSuggestion } from "@/types";

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

  const handleApprove = (resourceId: string) => {
    console.log("Approved resource:", resourceId);
    setDispatchedResources((prev) => [...prev, resourceId]);
  };

  const handleDeny = (resourceId: string) => {
    console.log("Denied resource:", resourceId);
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

  // Filter out dispatched resources from suggestions
  const availableSuggestions = suggestions.filter(
    (s) => !dispatchedResources.includes(s.resource.id),
  );

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Background Map */}
      <div className="absolute inset-0 z-0">
        <TacticalMap
          incident={activeIncident}
          dispatchedResources={dispatchedResources}
          suggestions={suggestions}
        />
      </div>

      {/* Quadrant Grid Overlay */}
      <div className="absolute inset-0 z-10 grid grid-cols-8 grid-rows-2 gap-4 p-4 pointer-events-none">
        <div className="col-span-2 overflow-auto pointer-events-auto">
          <IntelligentSummary incident={activeIncident} />
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
