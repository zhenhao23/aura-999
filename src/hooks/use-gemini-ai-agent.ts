import { useEffect, useRef, useState, useCallback } from "react";
import { GeminiLiveClient } from "@/lib/gemini/live-client";
import {
  PHASE_1_SYSTEM_PROMPT,
  PHASE_2_SYSTEM_PROMPT,
  assessUrgencyTool,
  updateIncidentFieldTool,
  detectVisualHazardTool,
} from "@/lib/gemini/ai-prompts";
import {
  saveAIAssessment,
  updateCallPhase,
  updateIncidentField,
  addVisualHazard,
} from "@/lib/firebase/signaling";
import { CallPhase } from "@/types/ai-agent";
import { Modality } from "@google/genai";

interface UseGeminiAIAgentProps {
  callId: string | null;
  onTransferRequested: () => void;
  enabled: boolean;
}

export function useGeminiAIAgent({
  callId,
  onTransferRequested,
  enabled,
}: UseGeminiAIAgentProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<CallPhase>("ai-screening");
  const [aiTranscript, setAITranscript] = useState<string>("");
  const clientRef = useRef<GeminiLiveClient | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);

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
    });

    client.on("error", (error) => {
      console.error("AI Agent error:", error);
    });

    client.on("audio", (audioData) => {
      // Only play AI audio in Phase 1 (screening), muted in shadow mode
      if (currentPhase === "ai-screening") {
        playAudio(audioData);
      }
      // In shadow mode (dispatcher-active), AI output is muted
    });

    client.on("transcript", (text, isFinal) => {
      if (isFinal) {
        setAITranscript((prev) => prev + " " + text);
      }
    });

    client.on("toolCall", async (toolCall) => {
      await handleToolCall(toolCall);
    });

    return () => {
      client.disconnect();
    };
  }, []); // Remove 'enabled' dependency

  // Connect to Gemini Live API when call starts
  const connect = useCallback(
    async (activeCallId?: string) => {
      const targetCallId = activeCallId || callId;

      if (!clientRef.current || !targetCallId) {
        return false;
      }
      const config = {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
        },
        systemInstruction: {
          parts: [{ text: PHASE_1_SYSTEM_PROMPT }],
        },
        tools: [{ functionDeclarations: [assessUrgencyTool] }],
      };

      const success = await clientRef.current.connect(config);
      if (success && targetCallId) {
        await updateCallPhase(targetCallId, "ai-screening");
        setCurrentPhase("ai-screening");
      }
      return success;
    },
    [callId],
  );

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
    if (clientRef.current) {
      clientRef.current.disconnect();
    }
  }, []);

  // Send audio to AI
  const sendAudio = useCallback((audioData: string) => {
    if (clientRef.current?.isConnected()) {
      clientRef.current.sendAudio(audioData);
    }
  }, []);

  // Send video frame to AI
  const sendVideo = useCallback((videoData: string) => {
    if (clientRef.current?.isConnected()) {
      clientRef.current.sendVideo(videoData);
    }
  }, []);

  // Handle tool calls from AI
  const handleToolCall = async (toolCall: any) => {
    if (!callId) return;

    const functionCalls = toolCall.functionCalls || [];

    for (const fc of functionCalls) {
      // Phase 1: Urgency assessment and transfer decision
      if (fc.name === "assess_urgency_and_transfer") {
        const args = fc.args as any;

        // Save AI assessment to Firestore
        await saveAIAssessment(callId, {
          urgencyLevel: args.urgency_level,
          reasoning: args.reasoning,
          shouldTransfer: args.should_transfer,
          initialSummary: args.initial_summary,
          detectedLanguage: args.detected_language,
        });

        // If should transfer, trigger handoff
        if (args.should_transfer) {
          await updateCallPhase(callId, "transferring");
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

        await updateIncidentField(callId, {
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

        await addVisualHazard(callId, {
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
  const playAudio = async (audioData: ArrayBuffer) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      }

      const audioCtx = audioContextRef.current;

      // Gemini sends PCM16 audio, we need to convert it to Float32
      const pcm16Data = new Int16Array(audioData);
      const float32Data = new Float32Array(pcm16Data.length);

      // Convert PCM16 to Float32 (-1.0 to 1.0 range)
      for (let i = 0; i < pcm16Data.length; i++) {
        float32Data[i] = pcm16Data[i] / 32768.0;
      }

      // Create audio buffer
      const audioBuffer = audioCtx.createBuffer(
        1, // mono
        float32Data.length,
        24000, // sample rate
      );

      // Copy data to buffer
      audioBuffer.getChannelData(0).set(float32Data);

      audioQueueRef.current.push(audioBuffer);

      if (!isPlayingRef.current) {
        playNextInQueue();
      }
    } catch (error) {
      console.error("❌ Error playing audio:", error);
    }
  };

  const playNextInQueue = () => {
    if (!audioContextRef.current || audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const audioBuffer = audioQueueRef.current.shift()!;
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);

    source.onended = () => {
      playNextInQueue();
    };

    source.start();
  };

  return {
    isConnected,
    currentPhase,
    aiTranscript,
    connect,
    disconnect,
    enterShadowMode,
    sendAudio,
    sendVideo,
  };
}
