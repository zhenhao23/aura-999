"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { WebRTCPeerConnection } from "@/lib/webrtc/peer-connection";
import {
  createCall,
  addCallerCandidate,
  listenForAnswer,
  listenForDispatcherCandidates,
  endCall,
} from "@/lib/firebase/signaling";
import { Badge } from "@/components/ui/badge";
import {
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  PhoneOff,
  MessageSquare,
  SwitchCamera,
} from "lucide-react";

export default function CallerPage() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [callId, setCallId] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<string>("new");
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<WebRTCPeerConnection | null>(null);
  const unsubscribersRef = useRef<Array<() => void>>([]);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const callIdRef = useRef<string | null>(null);

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

      // Create peer connection
      const pc = new WebRTCPeerConnection({
        onIceCandidate: (candidate) => {
          console.log("Caller ICE candidate:", candidate);
          // Store candidate if callId not yet available
          if (callIdRef.current) {
            addCallerCandidate(callIdRef.current, candidate.toJSON());
          } else {
            pendingCandidatesRef.current.push(candidate.toJSON());
          }
        },
        onConnectionStateChange: (state) => {
          setConnectionState(state);
          console.log("Caller connection state:", state);
          if (state === "failed" || state === "disconnected") {
            setError("Connection failed. Please try again.");
          }
        },
      });

      peerConnectionRef.current = pc;

      // Add local stream to peer connection
      pc.addStream(stream);

      // Create offer
      const offer = await pc.createOffer();

      // Save offer to Firebase and get callId
      const newCallId = await createCall(offer);
      setCallId(newCallId);
      callIdRef.current = newCallId;
      setIsCallActive(true);

      // Send any pending ICE candidates
      pendingCandidatesRef.current.forEach((candidate) => {
        addCallerCandidate(newCallId, candidate);
      });
      pendingCandidatesRef.current = [];

      // Listen for answer from dispatcher
      const unsubAnswer = listenForAnswer(newCallId, async (answer) => {
        console.log("Received answer from dispatcher");
        try {
          await pc.setRemoteDescription(answer);
        } catch (err) {
          console.error("Error setting remote description:", err);
        }
      });

      // Listen for dispatcher ICE candidates
      const unsubCandidates = listenForDispatcherCandidates(
        newCallId,
        async (candidate) => {
          console.log("Received dispatcher ICE candidate");
          try {
            await pc.addIceCandidate(candidate);
          } catch (err) {
            console.error("Error adding ICE candidate:", err);
          }
        },
      );

      // Store unsubscribers
      unsubscribersRef.current = [unsubAnswer, unsubCandidates];
    } catch (err) {
      console.error("Error starting call:", err);
      setError(err instanceof Error ? err.message : "Failed to start call");
    }
  };

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

  // End call
  const handleEndCall = async () => {
    try {
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
    } catch (err) {
      console.error("Error ending call:", err);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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
    switch (connectionState) {
      case "connected":
        return <Badge className="bg-green-600">Connected</Badge>;
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
              onClick={() => alert("Chat feature coming soon!")}
              className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all text-white"
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
    </div>
  );
}
