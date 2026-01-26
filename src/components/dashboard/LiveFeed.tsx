"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WebRTCPeerConnection } from "@/lib/webrtc/peer-connection";
import {
  getCall,
  setCallAnswer,
  addDispatcherCandidate,
  listenForCallerCandidates,
  type CallData,
} from "@/lib/firebase/signaling";

interface LiveFeedProps {
  videoUrl?: string;
  transcript?: string;
  activeCallId?: string | null;
  onCallEnd?: () => void;
}

export function LiveFeed({
  videoUrl,
  transcript,
  activeCallId: externalCallId,
  onCallEnd,
}: LiveFeedProps) {
  const [connectionState, setConnectionState] = useState<string>("new");
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<WebRTCPeerConnection | null>(null);
  const unsubscribersRef = useRef<Array<() => void>>([]);
  const isAnsweringRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Answer call when activeCallId is provided from parent
  useEffect(() => {
    if (!externalCallId) {
      // Clean up if call ended
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      isAnsweringRef.current = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      setRetryCount(0);
      return;
    }

    // Don't create multiple connections for the same call
    if (isAnsweringRef.current || peerConnectionRef.current) return;

    const answerCall = async () => {
      isAnsweringRef.current = true;

      try {
        // Get the call data
        const callData = await getCall(externalCallId);
        if (!callData?.offer) {
          // Wait for caller to create WebRTC offer and retry
          console.log("No offer yet, retrying in 1 second...");
          isAnsweringRef.current = false;
          retryTimeoutRef.current = setTimeout(() => {
            setRetryCount((prev) => prev + 1); // Trigger re-run
          }, 1000);
          return;
        }

        console.log("Offer received, creating answer...");

        // Create peer connection
        const pc = new WebRTCPeerConnection({
          onIceCandidate: (candidate) => {
            addDispatcherCandidate(externalCallId, candidate.toJSON());
          },
          onTrack: (event) => {
            if (videoRef.current && event.streams[0]) {
              videoRef.current.srcObject = event.streams[0];
              setHasRemoteStream(true);
            }
          },
          onConnectionStateChange: (state) => {
            setConnectionState(state);
          },
        });

        peerConnectionRef.current = pc;

        // Set remote description (offer from caller)
        await pc.setRemoteDescription(callData.offer);

        // Create answer
        const answer = await pc.createAnswer();

        // Save answer to Firebase
        await setCallAnswer(externalCallId, answer);

        // Listen for caller ICE candidates
        const unsubCandidates = listenForCallerCandidates(
          externalCallId,
          async (candidate) => {
            try {
              await pc.addIceCandidate(candidate);
            } catch (err) {
              console.error("Error adding caller ICE candidate:", err);
            }
          },
        );

        // Store unsubscriber
        unsubscribersRef.current.push(unsubCandidates);
      } catch (err) {
        console.error("Error answering call:", err);
        isAnsweringRef.current = false;
      }
    };

    answerCall();

    // Cleanup when call changes or component unmounts
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      isAnsweringRef.current = false;
    };
  }, [externalCallId, retryCount]);

  // End active call
  const handleEndCall = () => {
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

    setConnectionState("new");
    setHasRemoteStream(false);
    isAnsweringRef.current = false;

    // Notify parent
    if (onCallEnd) {
      onCallEnd();
    }
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
          {externalCallId && getConnectionBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-3">
        {/* Video Player */}
        <div className="w-3/4 mx-auto aspect-[9/16] bg-black rounded-lg overflow-hidden relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {!externalCallId && !videoUrl && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <p className="text-sm text-center px-4">
                Waiting for emergency calls...
              </p>
            </div>
          )}
          {externalCallId && !hasRemoteStream && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <p className="text-sm">Connecting to caller...</p>
            </div>
          )}
        </div>

        {/* Active Call Controls */}
        {externalCallId && (
          <div className="space-y-2">
            <div className="text-sm text-zinc-600">
              <p>📞 Call ID: {externalCallId}</p>
              {connectionState === "connected" && (
                <p className="text-green-600 font-semibold">
                  ✓ Connected to caller
                </p>
              )}
            </div>
            <Button
              onClick={handleEndCall}
              variant="destructive"
              className="w-full"
            >
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
