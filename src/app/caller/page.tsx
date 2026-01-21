"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WebRTCPeerConnection } from "@/lib/webrtc/peer-connection";
import {
  createCall,
  addCallerCandidate,
  listenForAnswer,
  listenForDispatcherCandidates,
  endCall,
} from "@/lib/firebase/signaling";
import { Badge } from "@/components/ui/badge";

export default function CallerPage() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [callId, setCallId] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<string>("new");
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<WebRTCPeerConnection | null>(null);
  const unsubscribersRef = useRef<Array<() => void>>([]);

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
          if (callId) {
            addCallerCandidate(callId, candidate.toJSON());
          }
        },
        onConnectionStateChange: (state) => {
          setConnectionState(state);
          console.log("Caller connection state:", state);
        },
      });

      peerConnectionRef.current = pc;

      // Add local stream to peer connection
      pc.addStream(stream);

      // Create offer
      const offer = await pc.createOffer();

      // Save offer to Firebase
      const newCallId = await createCall(offer);
      setCallId(newCallId);
      setIsCallActive(true);

      // Listen for answer from dispatcher
      const unsubAnswer = listenForAnswer(newCallId, async (answer) => {
        console.log("Received answer from dispatcher");
        await pc.setRemoteDescription(answer);
      });

      // Listen for dispatcher ICE candidates
      const unsubCandidates = listenForDispatcherCandidates(
        newCallId,
        async (candidate) => {
          console.log("Received dispatcher ICE candidate");
          await pc.addIceCandidate(candidate);
        },
      );

      // Store unsubscribers
      unsubscribersRef.current = [unsubAnswer, unsubCandidates];
    } catch (err) {
      console.error("Error starting call:", err);
      setError(err instanceof Error ? err.message : "Failed to start call");
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-red-50 font-sans p-8">
      <main className="flex flex-col items-center gap-8 max-w-4xl w-full">
        <div className="text-center space-y-4">
          <div className="inline-block px-4 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold mb-2">
            📱 Emergency Caller
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900">
            Emergency Video Call
          </h1>
          <p className="text-xl text-zinc-600 max-w-2xl mx-auto">
            Connect with emergency dispatcher
          </p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Video Call Interface</CardTitle>
                <CardDescription>
                  {isCallActive
                    ? `Call ID: ${callId}`
                    : "Start a call to connect with dispatcher"}
                </CardDescription>
              </div>
              {getConnectionBadge()}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Video Preview */}
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!isCallActive && (
                <div className="absolute inset-0 flex items-center justify-center text-white text-lg">
                  Camera preview will appear here
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Call Controls */}
            <div className="flex gap-4">
              {!isCallActive ? (
                <Button
                  onClick={startCall}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-lg py-6"
                >
                  🚨 Start Emergency Call
                </Button>
              ) : (
                <Button
                  onClick={handleEndCall}
                  variant="destructive"
                  className="flex-1 text-lg py-6"
                >
                  End Call
                </Button>
              )}
            </div>

            {/* Connection Info */}
            {isCallActive && (
              <div className="text-sm text-zinc-600 space-y-1">
                <p>✓ Camera and microphone active</p>
                <p>✓ Waiting for dispatcher to join...</p>
                {connectionState === "connected" && (
                  <p className="text-green-600 font-semibold">
                    ✓ Connected to dispatcher!
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
