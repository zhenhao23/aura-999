"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WebRTCPeerConnection } from "@/lib/webrtc/peer-connection";
import {
  listenForIncomingCalls,
  getCall,
  setCallAnswer,
  addDispatcherCandidate,
  listenForCallerCandidates,
  type CallData,
} from "@/lib/firebase/signaling";

interface LiveFeedProps {
  videoUrl?: string;
  transcript?: string;
}

export function LiveFeed({ videoUrl, transcript }: LiveFeedProps) {
  const [incomingCall, setIncomingCall] = useState<{
    callId: string;
    data: CallData;
  } | null>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<string>("new");
  const [hasRemoteStream, setHasRemoteStream] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<WebRTCPeerConnection | null>(null);
  const unsubscribersRef = useRef<Array<() => void>>([]);

  // Listen for incoming calls
  useEffect(() => {
    const unsubscribe = listenForIncomingCalls((callId, callData) => {
      console.log("Incoming call detected:", callId);
      setIncomingCall({ callId, data: callData });
    });

    return () => unsubscribe();
  }, []);

  // Answer incoming call
  const answerCall = async () => {
    if (!incomingCall) return;

    try {
      const { callId, data } = incomingCall;

      // Get the call data
      const callData = await getCall(callId);
      if (!callData?.offer) {
        console.error("No offer found for call");
        return;
      }

      console.log("Answering call:", callId);

      // Create peer connection
      const pc = new WebRTCPeerConnection({
        onIceCandidate: (candidate) => {
          console.log("Dispatcher ICE candidate:", candidate);
          addDispatcherCandidate(callId, candidate.toJSON());
        },
        onTrack: (event) => {
          console.log("Received remote track:", event.track.kind);
          if (videoRef.current && event.streams[0]) {
            videoRef.current.srcObject = event.streams[0];
            setHasRemoteStream(true);
          }
        },
        onConnectionStateChange: (state) => {
          setConnectionState(state);
          console.log("Dispatcher connection state:", state);
        },
      });

      peerConnectionRef.current = pc;

      // Set remote description (offer from caller)
      console.log("Setting remote description (offer)");
      await pc.setRemoteDescription(callData.offer);

      // Create answer
      console.log("Creating answer");
      const answer = await pc.createAnswer();

      // Save answer to Firebase
      console.log("Saving answer to Firebase");
      await setCallAnswer(callId, answer);

      // Listen for caller ICE candidates
      const unsubCandidates = listenForCallerCandidates(
        callId,
        async (candidate) => {
          console.log("Received caller ICE candidate");
          try {
            await pc.addIceCandidate(candidate);
          } catch (err) {
            console.error("Error adding caller ICE candidate:", err);
          }
        },
      );

      // Store unsubscriber
      unsubscribersRef.current.push(unsubCandidates);

      // Update state
      setActiveCallId(callId);
      setIncomingCall(null);

      console.log("Call answered successfully, waiting for connection...");
    } catch (err) {
      console.error("Error answering call:", err);
    }
  };

  // Reject incoming call
  const rejectCall = () => {
    setIncomingCall(null);
  };

  // End active call
  const endCall = () => {
    // Unsubscribe from Firebase listeners first
    unsubscribersRef.current.forEach((unsub) => unsub());
    unsubscribersRef.current = [];

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setActiveCallId(null);
    setConnectionState("new");
    setHasRemoteStream(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Unsubscribe from Firebase listeners
      unsubscribersRef.current.forEach((unsub) => unsub());

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  const getConnectionBadge = () => {
    switch (connectionState) {
      case "connected":
        return <Badge className="bg-green-600">🟢 Live</Badge>;
      case "connecting":
        return <Badge className="bg-yellow-600">🟡 Connecting...</Badge>;
      case "disconnected":
      case "failed":
        return <Badge className="bg-red-600">🔴 Disconnected</Badge>;
      default:
        return <Badge className="bg-gray-600">Idle</Badge>;
    }
  };

  return (
    <Card className="pointer-events-auto pt-3">
      <CardHeader className="pb-0">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xs">Live Video Feed</CardTitle>
          {activeCallId && getConnectionBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-3">
        {/* Incoming Call Alert */}
        {incomingCall && !activeCallId && (
          <div className="bg-red-100 border-2 border-red-600 rounded-lg p-4 space-y-3 animate-pulse">
            <div className="text-center">
              <p className="font-bold text-red-900">
                🚨 INCOMING EMERGENCY CALL
              </p>
              <p className="text-sm text-red-700">
                Call ID: {incomingCall.callId}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={answerCall}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                ✓ Answer
              </Button>
              <Button
                onClick={rejectCall}
                variant="destructive"
                className="flex-1"
              >
                ✗ Reject
              </Button>
            </div>
          </div>
        )}

        {/* Video Player */}
        <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {!activeCallId && !videoUrl && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <p className="text-sm text-center px-4">
                Waiting for emergency calls...
              </p>
            </div>
          )}
          {activeCallId && !hasRemoteStream && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <p className="text-sm">Connecting to caller...</p>
            </div>
          )}
        </div>

        {/* Active Call Controls */}
        {activeCallId && (
          <div className="space-y-2">
            <div className="text-sm text-zinc-600">
              <p>📞 Call ID: {activeCallId}</p>
              {connectionState === "connected" && (
                <p className="text-green-600 font-semibold">
                  ✓ Connected to caller
                </p>
              )}
            </div>
            <Button onClick={endCall} variant="destructive" className="w-full">
              End Call
            </Button>
          </div>
        )}

        {/* Live Transcript (Future) */}
        {transcript && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Live Transcript</h4>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm">{transcript}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
