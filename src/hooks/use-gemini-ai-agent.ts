import { useEffect, useRef, useState, useCallback } from "react";
import { GeminiLiveClient } from "@/lib/gemini/live-client";
import {
  // PHASE_1_SYSTEM_PROMPT,
  PHASE_2_SYSTEM_PROMPT,
  buildPhase1SystemPrompt,
  assessUrgencyTool,
  updateAIProgressTool,
  updateIncidentFieldTool,
  detectVisualHazardTool,
} from "@/lib/gemini/ai-prompts";
import {
  saveAIAssessment,
  updateCallPhase,
  updateIncidentField,
  addVisualHazard,
  updateAIProgress,
} from "@/lib/firebase/signaling";
import { CallPhase } from "@/types/ai-agent";
import { Modality } from "@google/genai";
import {
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface UseGeminiAIAgentProps {
  callId: string | null;
  onTransferRequested: () => void;
  enabled: boolean;
  location?: {
    lat: number;
    lng: number;
    accuracy?: number;
    buildingName?: string;
    address?: string;
  } | null;
}

export function useGeminiAIAgent({
  callId,
  onTransferRequested,
  enabled,
  location,
}: UseGeminiAIAgentProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<CallPhase>("ai-screening");
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const clientRef = useRef<GeminiLiveClient | null>(null);
  const callIdRef = useRef<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextPlaybackTimeRef = useRef(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastAudioTimeRef = useRef<number>(0);
  const callSyncedRef = useRef(false);
  const isInitialConnectionRef = useRef(true);
  const lastLocationSentRef = useRef<string>("");
  const locationRef = useRef(location);
  const isAiTalkingRef = useRef(false);
  const currentSentenceRef = useRef("");

  // Keep the internal ref in sync with the prop
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  // Keep callIdRef in sync with callId prop
  useEffect(() => {
    callIdRef.current = callId;
  }, [callId]);

  // Initialize Gemini Live client (always, not dependent on enabled)
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("NEXT_PUBLIC_GEMINI_API_KEY is not set");
      return;
    }

    const client = new GeminiLiveClient(apiKey);
    clientRef.current = client;

    // Set up event listeners
    client.on("open", () => {
      setIsConnected(true);
    });

    client.on("close", () => {
      setIsConnected(false);
      callSyncedRef.current = false;
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    });

    client.on("error", (error) => {
      console.error("AI Agent error:", error);
      callSyncedRef.current = false;
    });

    client.on("audio", (audioData, sampleRate) => {
      // Only play AI audio in Phase 1 (screening), muted in shadow mode
      if (currentPhase === "ai-screening") {
        playAudio(audioData, sampleRate);
      }
      if (!isAiTalkingRef.current && audioData.byteLength > 500) {
        isAiTalkingRef.current = true;
        setInterimTranscript("");
      }
      // In shadow mode (dispatcher-active), AI output is muted
    });

    client.on("transcript", async (text, isFinal) => {

      // isFinal is always False
      isAiTalkingRef.current = false;
      const cleanWord = text.trim();
      if (!cleanWord) return;

      currentSentenceRef.current += (currentSentenceRef.current ? " " : "") + cleanWord;

      const allWords = currentSentenceRef.current.split(" ");
      const allJoined = currentSentenceRef.current;

      // if (isFinal) {
      //   const finalSentence = currentSentenceRef.current.trim();
      //   if (callIdRef.current && finalSentence) {
      //     await saveTranscript(callIdRef.current, finalSentence, 'caller');
      //   }
      //   setAITranscript((prev) => prev + " " + text);
      //   setInterimTranscript("");
      //   currentSentenceRef.current = "";
      // } else {

      const last10 = allWords.slice(-10).join(" ");
      setInterimTranscript(last10);

      if (callIdRef.current) {
        const callRef = doc(db, "aiSessions", callIdRef.current);
        console.log(isFinal, text, "Saving interim transcript to Firebase:", allJoined);
        await updateDoc(callRef, { liveInterim: allJoined });
      }
      // }
    });

    client.on("toolCall", async (toolCall) => {
      console.log("🔧 Tool call received:", toolCall);
      await handleToolCall(toolCall);
    });

    client.on("interrupted", () => {
      stopAllAudio();
    });

    return () => {
      client.disconnect();
    };
  }, []); // Remove 'enabled' dependency

  // Enter shadow mode - AI observes silently
  const enterShadowMode = useCallback(() => {
    if (!clientRef.current?.isConnected()) return;

    console.log("🕵️ AI entering shadow mode - observing silently...");

    // Update system instruction to Phase 2 (observation mode)
    clientRef.current.updateConfig({
      systemInstruction: {
        parts: [{ text: PHASE_2_SYSTEM_PROMPT }],
      },
      tools: [
        {
          functionDeclarations: [
            updateIncidentFieldTool,
            detectVisualHazardTool,
          ],
        },
      ],
    });

    setCurrentPhase("dispatcher-active");
  }, []);


  // Disconnect from Gemini
  const disconnect = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    callSyncedRef.current = false;
    if (clientRef.current) {
      clientRef.current.disconnect();
    }
    currentSentenceRef.current = "";
  }, []);

  // Start heartbeat to prevent websocket timeout
  const startHeartbeat = useCallback(() => {
    // Clear existing heartbeat
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    // Initialize last audio time if not set
    if (lastAudioTimeRef.current === 0) {
      lastAudioTimeRef.current = Date.now();
    }

    // Send silent audio every 5 seconds if no real audio was sent
    heartbeatIntervalRef.current = setInterval(() => {
      const timeSinceLastAudio = Date.now() - lastAudioTimeRef.current;

      // If no audio sent in last 3 seconds, send silent frame (320 bytes = 20ms at 16kHz)
      if (timeSinceLastAudio > 3000 && clientRef.current?.isConnected()) {
        const silentFrame = new ArrayBuffer(320);
        const base64Silent = btoa(
          String.fromCharCode(...new Uint8Array(silentFrame))
        );
        clientRef.current.sendAudio(base64Silent);
        console.log("💓 Heartbeat: sent silent audio frame");
      }
    }, 5000); // Check every 5 seconds

    console.log("💓 Heartbeat started");
  }, []);

  // Connect to Gemini Live API when call starts
  const syncCallIfNeeded = useCallback(
    async (activeCallId?: string) => {
      if (!activeCallId || callSyncedRef.current) return;
      await updateCallPhase(activeCallId, "ai-screening");
      setCurrentPhase("ai-screening");
      callSyncedRef.current = true;
      startHeartbeat();
    },
    [startHeartbeat],
  );

  const connect = useCallback(
    async (activeCallId?: string, options?: { skipCallSync?: boolean }) => {
      const targetCallId = activeCallId || callId;
      const currentLoc = locationRef.current;
      const dynamicPrompt = buildPhase1SystemPrompt(currentLoc);

      if (!clientRef.current || !targetCallId) {
        if (!clientRef.current || !options?.skipCallSync) {
          return false;
        }
      }
      const config = {
        responseModalities: [Modality.AUDIO],
        inputAudioTranscription: {},
        systemInstruction: {
          parts: [{ text: dynamicPrompt }],
        },
        tools: [
          { functionDeclarations: [assessUrgencyTool, updateAIProgressTool] },
        ],
      };

      console.log(
        "🤖 Connecting to Gemini AI with tools:",
        config.tools[0].functionDeclarations.map((t) => t.name),
      );
      if (!clientRef.current) return false;
      const success = await clientRef.current.connect(config);
      if (success) {

        if (currentLoc?.address) {
          lastLocationSentRef.current = currentLoc.address;
        }

        //2 seconds before allowing the useEffect to "update" anything
        setTimeout(() => {
          isInitialConnectionRef.current = false;
        }, 2000);

        if (targetCallId && !options?.skipCallSync) {
          console.log("✅ AI connected successfully for call:", targetCallId);
          await syncCallIfNeeded(targetCallId);
        }

        return true;
      }
      console.error("❌ AI connection failed");
      return false;
    },
    [callId, syncCallIfNeeded],
  );

  const preconnect = useCallback(async () => {
    if (clientRef.current?.isConnected()) return true;
    return connect(undefined, { skipCallSync: true });
  }, [connect]);

  // Send audio to AI
  const sendAudio = useCallback((audioData: string) => {
    if (!clientRef.current) return;
    clientRef.current.sendAudio(audioData);
    if (clientRef.current.isConnected()) {
      lastAudioTimeRef.current = Date.now();
    }
  }, []);

  // Send video frame to AI
  const sendVideo = useCallback((videoData: string) => {
    if (clientRef.current?.isConnected()) {
      clientRef.current.sendVideo(videoData);
    }
  }, []);

  // Update system prompt when location changes - BUT ONLY ONCE
  useEffect(() => {
    if (!isConnected || isInitialConnectionRef.current || !location?.address || currentPhase !== "ai-screening") return;

    const locationKey = `${location.address}`;

    if (lastLocationSentRef.current === locationKey) return;

    console.log("📍 Updating AI with new location:", {
      lat: location.lat,
      lng: location.lng,
      address: location.address,
      buildingName: location.buildingName,
      accuracy: location.accuracy,
    });

    // Update the system prompt with current location
    clientRef.current?.updateConfig({
      systemInstruction: {
        parts: [{ text: buildPhase1SystemPrompt(location) }],
      },
    });

    lastLocationSentRef.current = locationKey;

  }, [location?.address, isConnected, currentPhase]);

  // Handle tool calls from AI
  const handleToolCall = async (toolCall: any) => {
    const currentCallId = callIdRef.current;
    console.log("🎯 handleToolCall called with callId:", currentCallId);

    if (!currentCallId) {
      console.error("❌ No callId available - cannot process tool call");
      return;
    }

    const functionCalls = toolCall.functionCalls || [];
    console.log("🔍 Processing", functionCalls.length, "function calls");

    for (const fc of functionCalls) {
      console.log("🔧 Processing function:", fc.name);

      // Phase 1: Progressive updates during screening
      if (fc.name === "update_ai_progress") {
        const args = fc.args as any;
        console.log("📊 AI progress update:", {
          name: toolCall.name,
          args: toolCall.args,
          currentLocation: location,  // ← Check what's available here
        });

        try {
          // Save progressive update to Firestore
          await updateAIProgress(currentCallId, {
            estimatedUrgency: args.estimated_urgency,
            incidentType: args.incident_type,
            location: args.location,
            keyDetails: args.key_details,
            hazardsDetected: args.hazards_detected,
            peopleInvolved: args.people_involved,
          });
          console.log("✅ Progress saved to Firebase successfully");
        } catch (error) {
          console.error("❌ Failed to save progress to Firebase:", error);
        }

        // Send response back to AI
        if (clientRef.current) {
          clientRef.current.sendToolResponse({
            functionResponses: [
              {
                id: fc.id,
                name: fc.name,
                response: { output: { success: true } },
              },
            ],
          });
        }
      }

      // Phase 1: Urgency assessment and transfer decision
      else if (fc.name === "assess_urgency_and_transfer") {
        const args = fc.args as any;

        // Save AI assessment to Firestore
        await saveAIAssessment(currentCallId, {
          urgencyLevel: args.urgency_level,
          reasoning: args.reasoning,
          shouldTransfer: args.should_transfer,
          initialSummary: args.initial_summary,
        });

        // If should transfer, trigger handoff
        if (args.should_transfer) {
          await updateCallPhase(currentCallId, "transferring");
          setCurrentPhase("transferring");
          onTransferRequested();
        }

        // Send response back to AI
        if (clientRef.current) {
          clientRef.current.sendToolResponse({
            functionResponses: [
              {
                id: fc.id,
                name: fc.name,
                response: { output: { success: true } },
              },
            ],
          });
        }
      }

      // Phase 2 (Shadow Mode): Update incident field
      else if (fc.name === "update_incident_field") {
        const args = fc.args as any;
        console.log(
          `🔄 AI updating ${args.field}: ${args.value} (confidence: ${args.confidence})`,
        );

        await updateIncidentField(currentCallId, {
          field: args.field,
          value: args.value,
          confidence: args.confidence,
          source: args.source || "ai-observation",
          timestamp: new Date().toISOString(),
        });

        // Send response
        if (clientRef.current) {
          clientRef.current.sendToolResponse({
            functionResponses: [
              {
                id: fc.id,
                name: fc.name,
                response: { output: { success: true } },
              },
            ],
          });
        }
      }

      // Phase 2 (Shadow Mode): Visual hazard detection
      else if (fc.name === "detect_visual_hazard") {
        const args = fc.args as any;
        console.log(
          `⚠️ AI detected hazard: ${args.hazard_type} (${args.severity})`,
        );

        await addVisualHazard(currentCallId, {
          hazardType: args.hazard_type,
          severity: args.severity,
          locationInFrame: args.location_in_frame || "unknown",
          description: args.description,
          confidence: args.confidence,
        });

        // Send response
        if (clientRef.current) {
          clientRef.current.sendToolResponse({
            functionResponses: [
              {
                id: fc.id,
                name: fc.name,
                response: { output: { success: true } },
              },
            ],
          });
        }
      }
    }
  };

  // Play audio from AI (Phase 1 only)
  const playAudio = async (audioData: ArrayBuffer, sampleRate?: number) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ latencyHint: "interactive" });
      }

      const audioCtx = audioContextRef.current;
      const inputSampleRate = sampleRate || 24000;
      const outputSampleRate = audioCtx.sampleRate;

      // Gemini sends PCM16 audio, we need to convert it to Float32
      const pcm16Data = new Int16Array(audioData);
      const float32Data = new Float32Array(pcm16Data.length);

      // Convert PCM16 to Float32 (-1.0 to 1.0 range)
      for (let i = 0; i < pcm16Data.length; i++) {
        float32Data[i] = pcm16Data[i] / 32768.0;
      }

      const resampledData =
        inputSampleRate !== outputSampleRate
          ? resampleLinear(float32Data, inputSampleRate, outputSampleRate)
          : float32Data;

      // Create audio buffer
      const audioBuffer = audioCtx.createBuffer(
        1, // mono
        resampledData.length,
        outputSampleRate,
      );

      // Copy data to buffer
      audioBuffer.getChannelData(0).set(resampledData);

      schedulePlayback(audioBuffer);
    } catch (error) {
      console.error("❌ Error playing audio:", error);
    }
  };

  const schedulePlayback = (audioBuffer: AudioBuffer) => {
    if (!audioContextRef.current) return;

    const audioCtx = audioContextRef.current;
    const now = audioCtx.currentTime;
    const minBuffer = 0.01;
    if (nextPlaybackTimeRef.current < now - 0.2) {
      nextPlaybackTimeRef.current = now;
    }
    const startTime = Math.max(nextPlaybackTimeRef.current, now + minBuffer);

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);

    activeSourcesRef.current.push(source);

    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter(
        (node) => node !== source,
      );
    };

    source.start(startTime);
    nextPlaybackTimeRef.current = startTime + audioBuffer.duration;
  };

  const stopAllAudio = () => {
    for (const source of activeSourcesRef.current) {
      try {
        source.stop();
      } catch {
        // ignore
      }
    }
    activeSourcesRef.current = [];
    nextPlaybackTimeRef.current = 0;
  };

  const resampleLinear = (
    input: Float32Array,
    inputRate: number,
    outputRate: number,
  ) => {
    if (inputRate === outputRate) return input;
    const ratio = outputRate / inputRate;
    const outputLength = Math.max(1, Math.round(input.length * ratio));
    const output = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
      const sourceIndex = i / ratio;
      const index0 = Math.floor(sourceIndex);
      const index1 = Math.min(index0 + 1, input.length - 1);
      const frac = sourceIndex - index0;
      output[i] = input[index0] * (1 - frac) + input[index1] * frac;
    }

    return output;
  };

  return {
    isConnected,
    currentPhase,
    interimTranscript,
    connect,
    preconnect,
    disconnect,
    enterShadowMode,
    sendAudio,
    sendVideo,
  };
}
