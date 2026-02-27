"use client";

import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ResourceAllocation } from "@/components/dashboard/ResourceAllocation";
import { LiveFeed } from "@/components/dashboard/LiveFeed";
import { LiveIncidentSummary } from "@/components/dashboard/LiveIncidentSummary";
import { UniversalComms } from "@/components/dashboard/UniversalComms";
import { SuggestedQuestions } from "@/components/dashboard/SuggestedQuestions";
import { SuggestedQuestionsMock } from "@/components/dashboard/SuggestedQuestionsMock";
import { IncomingCallAlert } from "@/components/dashboard/IncomingCallAlert";
import { TacticalMap } from "@/components/map/TacticalMap";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import Link from "next/link";
import {
  translateDispatcherMessage,
  type SupportedLanguage,
} from "@/lib/gemini/translator";
import { MOCK_INCIDENTS } from "@/data/mock-incidents";
import { generateResourceSuggestions } from "@/lib/resource-optimizer";
import { initializeDistanceMatrixService } from "@/lib/maps/googlemap-distance";
import { Message, ResourceAllocationSuggestion, Station } from "@/types";
import {
  listenForIncomingCalls,
  listenForLocationUpdates,
  listenForAIAssessment,
  updateCallPhase,
  endCall,
  CallerLocation,
  listenToLiveInterim,
} from "@/lib/firebase/signaling";
import { AIAssessment, AIProgress, CallPhase } from "@/types/ai-agent";
import { getEmergencyServices } from "@/lib/maps/emergency-resource";
import {
  doc,
  onSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export default function DashboardPage() {
  // Use the first mock incident as the active incident
  const [activeIncident] = useState(MOCK_INCIDENTS[0]);
  const [emergencyServices, setEmergencyServices] = useState<Station[]>([]);
  const [suggestions, setSuggestions] = useState<
    ResourceAllocationSuggestion[]
  >([]);
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
  const [aiProgress, setAIProgress] = useState<AIProgress | null>(null);
  const [callPhase, setCallPhase] = useState<CallPhase>("ai-screening");
  const [showIncomingAlert, setShowIncomingAlert] = useState(false);
  const [closeAllTabs, setCloseAllTabs] = useState(false);
  const [callerLanguage, setCallerLanguage] = useState<SupportedLanguage>("Malay");
  const [liveCallerText, setLiveCallerText] = useState("");
  const [liveSpeech, setLiveSpeech] = useState<string>("");

  useEffect(() => {
    if (!activeCallId) return;

    // Start listening to the live field
    const unsubscribe = listenToLiveInterim(activeCallId, (text) => {
      setLiveSpeech(text);
    });

    // Cleanup: Stop listening when the user leaves the dashboard
    return () => unsubscribe();
  }, [activeCallId]);

  // Initialize Google Maps Distance Matrix once when component mounts
  useEffect(() => {
    initializeDistanceMatrixService();
  }, []);

  // Generate suggestions when incident changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!activeIncident || !emergencyServices || !callerLocation) return; // Will not suggest resources without caller location
      const result = await generateResourceSuggestions(
        activeIncident,
        emergencyServices,
        callerLocation ?? null,
      );
      setSuggestions(result);
    };

    fetchSuggestions();
  }, [activeIncident, emergencyServices, callerLocation]);

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

  useEffect(() => {
    let isActive = true;
    const center = callerLocation
      ? {
        lat: callerLocation.coords.latitude,
        lng: callerLocation.coords.longitude,
      }
      : { lat: 2.8994930048635545, lng: 101.6725950816638 };

    getEmergencyServices(center.lat, center.lng)
      .then((services) => {
        if (isActive) {
          setEmergencyServices(services);
        }
      })
      .catch((error) => {
        console.error("Emergency services fetch failed:", error);
      });

    return () => {
      isActive = false;
    };
  }, [callerLocation]);

  // Listen for incoming calls
  useEffect(() => {
    const unsubscribeCalls = listenForIncomingCalls((callId) => {
      setActiveCallId(callId);

      // Show alert immediately for demo purposes
      setShowIncomingAlert(true);
      playNotificationSound();
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
      (assessment, phase, progress) => {
        setAIAssessment(assessment);
        setCallPhase(phase);
        setAIProgress(progress || null);
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

  const handleSendMessage = async (content: string) => {
    // Translate dispatcher's English message to caller's language
    const translation = await translateDispatcherMessage(
      content,
      callerLanguage,
    );

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: "dispatcher",
      content,
      translatedContent: translation.translatedText,
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
          availableStations={emergencyServices}
        />
      </div>

      {/* Floating Incident Log Button */}
      {!closeAllTabs && (
        <div className="absolute top-4 right-4 z-20">
          <Link href="/incident-log">
            <Button className="shadow-lg backdrop-blur-sm bg-primary/90 hover:bg-primary">
              <FileText className="w-4 h-4 mr-2" />
              Incident Log
            </Button>
          </Link>
        </div>
      )}

      {/* Incoming Call Alert Overlay */}
      {showIncomingAlert && activeCallId && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="max-w-2xl w-full mx-4">
            <IncomingCallAlert
              callId={activeCallId}
              assessment={aiAssessment}
              progress={aiProgress}
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

      {/* Floating Mode Badge - Subtle Corner */}
      <div className="absolute top-1 left-4 z-20">
        <button
          onClick={() => setCloseAllTabs(!closeAllTabs)}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-slate-900/40 text-slate-400 hover:bg-slate-900/60 hover:text-slate-200 backdrop-blur-sm border border-slate-800/50 transition-all duration-200"
        >
          {closeAllTabs ? "📞" : "📡"}
          <span className="hidden sm:inline">
            {closeAllTabs ? "Caller" : "Dispatcher"}
          </span>
        </button>
      </div>

      {/* Quadrant Grid Overlay */}
      {!closeAllTabs && (
        <div className="absolute inset-0 z-10 grid grid-cols-8 grid-rows-2 gap-4 p-4 pointer-events-none">
          {/* AI Shadow Mode - Live Incident Summary */}
          <div className="col-span-2 overflow-auto pointer-events-auto">
            <LiveIncidentSummary
              callId={callPhase === "dispatcher-active" ? activeCallId : null}
              callerLocation={callerLocation}
            />
          </div>

          <div className="col-span-4 pointer-events-none"></div>

          <div className="col-span-2 overflow-auto pointer-events-auto">
            <div
              className={`${availableSuggestions.length === 0 ? "invisible" : ""}`}
            >
              <ResourceAllocation
                suggestions={availableSuggestions}
                onApprove={handleApprove}
                onDeny={handleDeny}
              />
            </div>
          </div>

          <div className="col-span-2 overflow-auto pointer-events-auto">
            <LiveFeed
              videoUrl={activeIncident.videoUrl}
              transcript={liveSpeech}
              activeCallId={
                callPhase === "dispatcher-active" ? activeCallId : null
              }
              onCallEnd={handleCallEnd}
            />
          </div>

          {activeCallId && (
            <>
              <div className="col-span-1 pointer-events-none"></div>
              <div className="col-span-2 overflow-auto pointer-events-auto">
                <SuggestedQuestionsMock onSendMessage={handleSendMessage} />
                {/* <SuggestedQuestions onSendMessage={handleSendMessage} /> */}
              </div>
              <div className="col-span-1 pointer-events-none"></div>
            </>
          )}

          {!activeCallId && <div className="col-span-4 pointer-events-none"></div>}

          <div className="col-span-2 overflow-auto pointer-events-auto">
            <UniversalComms
              messages={messages}
              onSendMessage={handleSendMessage}
              callerLanguage={callerLanguage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
