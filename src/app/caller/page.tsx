"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { WebRTCPeerConnection } from "@/lib/webrtc/peer-connection";
import {
  createCall,
  setCallOffer,
  addCallerCandidate,
  listenForAnswer,
  listenForDispatcherCandidates,
  endCall,
  updateCallerLocation,
  addLocationToHistory,
  listenForCallPhase,
  updateLocationPermission,
} from "@/lib/firebase/signaling";
import { GeoPoint } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import {
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  PhoneOff,
  MessageSquare,
  SwitchCamera,
  X,
  Send,
} from "lucide-react";
import { useGeminiAIAgent } from "@/hooks/use-gemini-ai-agent";
import { SimpleAudioRecorder } from "@/lib/audio/simple-recorder";
import { CallPhase } from "@/types/ai-agent";

export default function CallerPage() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [callId, setCallId] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<string>("new");
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      content: string;
      sender: "caller" | "dispatcher";
      timestamp: Date;
    }>
  >([]);
  const [inputValue, setInputValue] = useState("");
  const [locationPermission, setLocationPermission] = useState<
    "prompt" | "granted" | "denied"
  >("prompt");
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);
  const [currentPhase, setCurrentPhase] = useState<CallPhase>("ai-screening");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<WebRTCPeerConnection | null>(null);
  const unsubscribersRef = useRef<Array<() => void>>([]);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const callIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastLocationUpdateRef = useRef<number>(0);
  const hasSetRemoteDescriptionRef = useRef<boolean>(false);
  const hasInitiatedWebRTCRef = useRef<boolean>(false);
  const audioRecorderRef = useRef<SimpleAudioRecorder | null>(null);
  const videoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // AI Agent hook
  const {
    isConnected: aiConnected,
    connect: connectAI,
    disconnect: disconnectAI,
    enterShadowMode,
    sendAudio: sendAudioToAI,
    sendVideo: sendVideoToAI,
  } = useGeminiAIAgent({
    callId,
    onTransferRequested: handleDispatcherHandoff,
    enabled: currentPhase === "ai-screening",
  });

  // Handler for when AI requests transfer to dispatcher
  async function handleDispatcherHandoff() {
    setCurrentPhase("transferring");
  }

  // Reverse geocode coordinates to address
  const reverseGeocode = async (
    lat: number,
    lng: number,
  ): Promise<string | undefined> => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`,
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
    } catch (err) {
      console.error("Geocoding error:", err);
    }
    return undefined;
  };

  // Start tracking caller's location
  const startLocationTracking = (callId: string) => {
    if (!navigator.geolocation) {
      console.error("Geolocation not supported");
      setLocationPermission("denied");
      updateLocationPermission(callId, false).catch(console.error);
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true, // Use GPS
      timeout: 30000, // 30 seconds - GPS can take time to get first fix
      maximumAge: 5000, // Allow cached position up to 5 seconds old
    };

    const handleSuccess = async (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy, heading, speed } = position.coords;
      const now = Date.now();

      // Update local state
      setCurrentLocation({ lat: latitude, lng: longitude, accuracy });

      // Throttle Firebase updates: only if moved >10m OR 10 seconds passed
      const timeSinceLastUpdate = now - lastLocationUpdateRef.current;
      const shouldUpdate =
        timeSinceLastUpdate > 10000 || // 10 seconds
        !lastLocationUpdateRef.current; // First update

      if (shouldUpdate) {
        lastLocationUpdateRef.current = now;

        // Get address (cached for similar coords)
        const address = await reverseGeocode(latitude, longitude);

        // Update Firebase - only include heading/speed if they exist
        try {
          const locationData: any = {
            coords: new GeoPoint(latitude, longitude),
            address,
            accuracy,
            timestamp: new Date() as any,
            source: "gps" as const,
          };

          // Only add heading and speed if they have valid values
          if (heading !== null && heading !== undefined) {
            locationData.heading = heading;
          }
          if (speed !== null && speed !== undefined) {
            locationData.speed = speed;
          }

          await updateCallerLocation(callId, locationData);
          await addLocationToHistory(callId, locationData);
        } catch (err) {
          console.error("Failed to update location:", err);
        }
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      console.error("Geolocation error:", error);

      // Don't set permission to denied for timeout errors - GPS might work later
      if (error.code === GeolocationPositionError.PERMISSION_DENIED) {
        setLocationPermission("denied");
        updateLocationPermission(callId, false).catch(console.error);
        setError(
          "Location permission denied. Emergency responders cannot track your location.",
        );
      } else if (error.code === GeolocationPositionError.TIMEOUT) {
        setError(
          "Getting GPS location is taking longer than usual. Please ensure you're outdoors with clear sky view.",
        );
      } else {
        setError("Location temporarily unavailable. Trying to reconnect...");
      }
    };

    // Start watching position
    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options,
    );

    watchIdRef.current = watchId;
    setLocationPermission("granted");
  };

  // Stop location tracking
  const stopLocationTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // Start emergency call
  const startCall = async () => {
    try {
      setError(null);

      // Get user media (camera + mic)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 1280, height: 720 },
        audio: true,
      });

      streamRef.current = stream;

      // Display local video
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Create call in Firebase WITHOUT WebRTC offer (AI phase only)
      const newCallId = await createCall();
      setCallId(newCallId);
      callIdRef.current = newCallId;
      setIsCallActive(true);
      setCurrentPhase("ai-screening");

      // Start location tracking
      startLocationTracking(newCallId);

      // Connect to AI agent
      await connectAI(newCallId);

      // Start audio recording and send to AI
      const recorder = new SimpleAudioRecorder();
      await recorder.start((base64Audio) => {
        sendAudioToAI(base64Audio);
      });
      audioRecorderRef.current = recorder;

      // Send video frames every 2 seconds
      const interval = setInterval(() => {
        captureAndSendVideoFrame();
      }, 2000);
      videoIntervalRef.current = interval;
    } catch (err) {
      console.error("Error starting call:", err);
      setError(err instanceof Error ? err.message : "Failed to start call");
    }
  };

  // Capture video frame and send to AI
  const captureAndSendVideoFrame = () => {
    if (!videoRef.current || !callId) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          sendVideoToAI(base64);
        };
        reader.readAsDataURL(blob);
      },
      "image/jpeg",
      0.8,
    );
  };

  // Start WebRTC connection to dispatcher (called when dispatcher accepts)
  const startWebRTCConnection = async () => {
    if (!streamRef.current || !callId) return;

    // Don't create multiple connections
    if (hasInitiatedWebRTCRef.current || peerConnectionRef.current) {
      console.log("⚠️ WebRTC connection already initiated, skipping");
      return;
    }
    hasInitiatedWebRTCRef.current = true;
    console.log("✅ Creating WebRTC peer connection...");

    try {
      // Create peer connection
      const pc = new WebRTCPeerConnection({
        onIceCandidate: (candidate) => {
          if (callIdRef.current) {
            addCallerCandidate(callIdRef.current, candidate.toJSON());
          } else {
            pendingCandidatesRef.current.push(candidate.toJSON());
          }
        },
        onConnectionStateChange: (state) => {
          setConnectionState(state);
          if (state === "failed" || state === "disconnected") {
            setError("Connection failed. Please try again.");
          }
        },
      });

      peerConnectionRef.current = pc;

      // Add local stream to peer connection
      pc.addStream(streamRef.current);

      // Create offer
      console.log("📝 Creating WebRTC offer...");
      const offer = await pc.createOffer();

      // Save offer to Firebase
      console.log("💾 Saving offer to Firebase...");
      await setCallOffer(callId, offer);
      console.log("✅ Offer saved successfully");

      // Send any pending ICE candidates
      pendingCandidatesRef.current.forEach((candidate) => {
        addCallerCandidate(callId, candidate);
      });
      pendingCandidatesRef.current = [];

      // Listen for answer from dispatcher
      const unsubAnswer = listenForAnswer(callId, async (answer) => {
        if (hasSetRemoteDescriptionRef.current) return;

        try {
          await pc.setRemoteDescription(answer);
          hasSetRemoteDescriptionRef.current = true;
        } catch (err) {
          console.error("Error setting remote description:", err);
        }
      });

      // Listen for dispatcher ICE candidates
      const unsubCandidates = listenForDispatcherCandidates(
        callId,
        async (candidate) => {
          console.log("📥 Received dispatcher ICE candidate");
          try {
            await pc.addIceCandidate(candidate);
          } catch (err) {
            console.error("Error adding ICE candidate:", err);
          }
        },
      );

      // Store unsubscribers
      unsubscribersRef.current = [
        ...unsubscribersRef.current,
        unsubAnswer,
        unsubCandidates,
      ];
    } catch (err) {
      console.error("Error starting WebRTC:", err);
      setError("Failed to establish connection with dispatcher");
      hasInitiatedWebRTCRef.current = false;
    }
  };

  // Listen for phase changes from Firebase
  useEffect(() => {
    if (!callId) return;

    const unsubscribe = listenForCallPhase(callId, (phase) => {
      console.log("📞 Call phase changed to:", phase);
      setCurrentPhase(phase);

      if (phase === "dispatcher-active") {
        // Dispatcher accepted - start WebRTC connection
        console.log("🚀 Starting WebRTC connection to dispatcher...");
        startWebRTCConnection();

        // Enter AI shadow mode - AI continues observing silently
        console.log("🕵️ AI entering shadow mode...");
        enterShadowMode();
      }
    });

    return () => unsubscribe();
  }, [callId]);

  // Toggle microphone
  const toggleMute = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle speaker (note: speaker control is limited in browsers)
  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    // In a real app, you'd need to use setSinkId on the video element
    // This is mostly for UI feedback
  };

  // Switch camera between front and back
  const switchCamera = async () => {
    if (!streamRef.current || !isCallActive) return;

    try {
      const newFacingMode = facingMode === "user" ? "environment" : "user";

      // Get new stream with different camera
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode, width: 1280, height: 720 },
        audio: true,
      });

      // Stop old video track
      const oldVideoTrack = streamRef.current.getVideoTracks()[0];
      if (oldVideoTrack) {
        oldVideoTrack.stop();
      }

      // Replace video track in peer connection
      if (peerConnectionRef.current) {
        const newVideoTrack = newStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current
          .getSenders()
          .find((s) => s.track?.kind === "video");
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        }
      }

      // Update stream ref (keep audio track, replace video)
      const audioTrack = streamRef.current.getAudioTracks()[0];
      const newVideoTrack = newStream.getVideoTracks()[0];
      streamRef.current = new MediaStream([audioTrack, newVideoTrack]);

      // Update video element
      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }

      setFacingMode(newFacingMode);
    } catch (err) {
      console.error("Error switching camera:", err);
      setError("Failed to switch camera");
    }
  };

  // Toggle chat panel
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  // Send message
  const handleSendMessage = () => {
    if (inputValue.trim() && callId) {
      const newMessage = {
        id: Date.now().toString(),
        content: inputValue,
        sender: "caller" as const,
        timestamp: new Date(),
      };
      setMessages([...messages, newMessage]);
      setInputValue("");
      // TODO: Send message to Firebase/dispatcher
    }
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // End call
  const handleEndCall = async () => {
    try {
      // Stop video frame capture
      if (videoIntervalRef.current) {
        clearInterval(videoIntervalRef.current);
        videoIntervalRef.current = null;
      }

      // Stop audio recorder
      if (audioRecorderRef.current) {
        audioRecorderRef.current.stop();
        audioRecorderRef.current = null;
      }

      // Disconnect AI
      disconnectAI();

      // Stop location tracking
      stopLocationTracking();

      // Unsubscribe from Firebase listeners first
      unsubscribersRef.current.forEach((unsub) => unsub());
      unsubscribersRef.current = [];

      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      // Update Firebase
      if (callId) {
        await endCall(callId);
      }

      // Reset state
      setIsCallActive(false);
      setCallId(null);
      setConnectionState("new");
      setIsMuted(false);
      setCurrentPhase("ai-screening");
      hasSetRemoteDescriptionRef.current = false;
      hasInitiatedWebRTCRef.current = false;
    } catch (err) {
      console.error("Error ending call:", err);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop video frame capture
      if (videoIntervalRef.current) {
        clearInterval(videoIntervalRef.current);
      }

      // Stop audio recorder
      if (audioRecorderRef.current) {
        audioRecorderRef.current.stop();
      }

      // Disconnect AI
      disconnectAI();

      // Stop location tracking
      stopLocationTracking();

      // Unsubscribe from Firebase listeners
      unsubscribersRef.current.forEach((unsub) => unsub());

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  const getConnectionBadge = () => {
    if (currentPhase === "ai-screening" && aiConnected) {
      return <Badge className="bg-purple-600">🤖 AI Assistant</Badge>;
    }
    if (currentPhase === "transferring") {
      return <Badge className="bg-yellow-600">⏳ Transferring...</Badge>;
    }

    switch (connectionState) {
      case "connected":
        return <Badge className="bg-green-600">👨‍🚒 Dispatcher Connected</Badge>;
      case "connecting":
        return <Badge className="bg-yellow-600">Connecting...</Badge>;
      case "disconnected":
      case "failed":
        return <Badge className="bg-red-600">Disconnected</Badge>;
      default:
        return <Badge className="bg-gray-600">Idle</Badge>;
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Fullscreen Video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay for non-active call state */}
      {!isCallActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center space-y-6 p-8">
            <div className="inline-block px-4 py-2 bg-red-600/20 border border-red-500 rounded-full text-red-400 text-sm font-semibold mb-2">
              📱 Emergency Caller
            </div>
            <h1 className="text-4xl font-bold text-white">
              Emergency Video Call
            </h1>
            <p className="text-lg text-gray-300 max-w-md">
              Connect with emergency dispatcher
            </p>
            <Button
              onClick={startCall}
              className="bg-red-600 hover:bg-red-700 text-white text-lg px-8 py-6 rounded-full"
            >
              🚨 Start Emergency Call
            </Button>
            {error && (
              <div className="mt-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-300 text-sm max-w-md">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Status Bar */}
      {isCallActive && (
        <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex justify-between items-center">
            <div className="text-white">
              <p className="text-sm font-semibold">Emergency Call</p>
              <p className="text-xs text-gray-300">
                ID: {callId?.substring(0, 8)}
              </p>
              {/* Location status */}
              {locationPermission === "granted" && currentLocation && (
                <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                  📍 Location shared (±{Math.round(currentLocation.accuracy)}m)
                </p>
              )}
              {locationPermission === "denied" && (
                <p className="text-xs text-red-400 mt-1">
                  ⚠️ Location unavailable
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {getConnectionBadge()}
              <button
                onClick={switchCamera}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all text-white"
                title="Switch Camera"
              >
                <SwitchCamera size={20} />
              </button>
            </div>
          </div>
          {connectionState === "connecting" && (
            <p className="text-sm text-gray-300 mt-2">
              Connecting to dispatcher...
            </p>
          )}
        </div>
      )}

      {/* Bottom Control Bar */}
      {isCallActive && (
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
          <div className="flex justify-center items-center gap-6">
            {/* Speaker Button */}
            <button
              onClick={toggleSpeaker}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                isSpeakerOn
                  ? "bg-white/20 hover:bg-white/30 text-white"
                  : "bg-white hover:bg-white/90 text-gray-900"
              }`}
              title={isSpeakerOn ? "Speaker On" : "Speaker Off"}
            >
              {isSpeakerOn ? <Volume2 size={24} /> : <VolumeX size={24} />}
            </button>

            {/* Mic Mute Button */}
            <button
              onClick={toggleMute}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                isMuted
                  ? "bg-white hover:bg-white/90 text-gray-900"
                  : "bg-white/20 hover:bg-white/30 text-white"
              }`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>

            {/* End Call Button */}
            <button
              onClick={handleEndCall}
              className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all shadow-lg text-white"
              title="End Call"
            >
              <PhoneOff size={28} />
            </button>

            {/* Chat Button */}
            <button
              onClick={toggleChat}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                isChatOpen
                  ? "bg-white hover:bg-white/90 text-gray-900"
                  : "bg-white/20 hover:bg-white/30 text-white"
              }`}
              title="Open Chat"
            >
              <MessageSquare size={24} />
            </button>
          </div>

          {/* Connection Status Text */}
          {connectionState === "connected" && (
            <p className="text-center text-green-400 text-sm font-semibold mt-4">
              ✓ Connected to dispatcher
            </p>
          )}
        </div>
      )}

      {/* Error Message Overlay */}
      {error && isCallActive && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 p-4 bg-red-900/90 border border-red-500 rounded-lg text-red-200 text-sm max-w-md shadow-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Chat Panel */}
      {isChatOpen && isCallActive && (
        <div className="absolute right-4 bottom-32 w-80 h-96 bg-black/90 backdrop-blur-md rounded-lg shadow-2xl border border-white/20 flex flex-col">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/20">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-white" />
              <h3 className="text-white font-semibold text-sm">Chat</h3>
            </div>
            <button
              onClick={toggleChat}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all text-white"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No messages yet
              </p>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === "caller"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`rounded-lg px-3 py-2 max-w-[80%] ${
                        message.sender === "caller"
                          ? "bg-blue-600 text-white"
                          : "bg-white/20 text-white"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/20">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/40 text-white placeholder-gray-400"
              />
              <button
                onClick={handleSendMessage}
                className="w-10 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-all text-white"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
