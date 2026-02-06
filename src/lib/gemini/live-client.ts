import { GoogleGenAI, LiveConnectConfig, Session } from "@google/genai";
import { EventEmitter } from "eventemitter3";

export interface GeminiLiveClientEvents {
  open: () => void;
  close: () => void;
  error: (error: Error) => void;
  audio: (data: ArrayBuffer, sampleRate?: number) => void;
  transcript: (text: string, isFinal: boolean) => void;
  toolCall: (toolCall: any) => void;
  interrupted: () => void;
}

export class GeminiLiveClient extends EventEmitter<GeminiLiveClientEvents> {
  private client: GoogleGenAI;
  private session: Session | null = null;
  private model: string;
  private config: LiveConnectConfig;
  private isSocketOpen = false;

  constructor(apiKey: string) {
    super();
    this.client = new GoogleGenAI({ apiKey });
    this.model = "models/gemini-2.5-flash-native-audio-preview-12-2025";
    this.config = {};
  }

  async connect(config: LiveConnectConfig): Promise<boolean> {
    try {
      console.log("🔌 [GeminiLiveClient] Starting connection...");
      console.log("🔌 [GeminiLiveClient] Model:", this.model);
      console.log("🔌 [GeminiLiveClient] Config:", config);

      this.config = config;

      this.session = await this.client.live.connect({
        model: this.model,
        config: this.config,
        callbacks: {
          onopen: () => {
            console.log("✅ [GeminiLiveClient] WebSocket opened!");
            this.isSocketOpen = true;
            this.emit("open");
          },
          onclose: (event: any) => {
            console.log("❌ [GeminiLiveClient] WebSocket closed", {
              code: event?.code,
              reason: event?.reason,
              wasClean: event?.wasClean,
            });
            this.session = null;
            this.isSocketOpen = false;
            this.emit("close");
          },
          onerror: (error: ErrorEvent) => {
            console.error("❌ [GeminiLiveClient] WebSocket error:", error);
            const err = new Error(error.message || "Gemini Live error");
            this.session = null;
            this.isSocketOpen = false;
            this.emit("error", err);
          },
          onmessage: (message: any) => {
            console.log("📨 [GeminiLiveClient] Message received:", message);
            this.handleMessage(message);
          },
        },
      });

      console.log("✅ [GeminiLiveClient] Session created successfully!");
      return true;
    } catch (error) {
      console.error("❌ [GeminiLiveClient] Failed to connect:", error);
      this.emit("error", error as Error);
      return false;
    }
  }

  private handleMessage(message: any) {
    // Handle server content (transcripts, audio, tool calls)
    if (message.serverContent) {
      const content = message.serverContent;

      // Handle audio
      if (content.modelTurn?.parts) {
        for (const part of content.modelTurn.parts) {
          if (part.inlineData?.mimeType?.includes("audio")) {
            const audioData = this.base64ToArrayBuffer(part.inlineData.data);
            const mimeType = part.inlineData.mimeType || "";
            const rateMatch = mimeType.match(/rate=(\d+)/);
            const sampleRate = rateMatch ? Number(rateMatch[1]) : undefined;
            this.emit("audio", audioData, sampleRate);
          }
          if (part.text) {
            this.emit("transcript", part.text, content.turnComplete || false);
          }
        }
      }
    }

    // Handle tool calls
    if (message.toolCall) {
      this.emit("toolCall", message.toolCall);
    }

    // Handle interruptions
    if (message.serverContent?.interrupted) {
      this.emit("interrupted");
    }
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Send audio from microphone
  sendAudio(audioData: string) {
    if (!this.session || !this.isSocketOpen) return;
    try {
      this.session.sendRealtimeInput({
        audio: {
          mimeType: "audio/pcm;rate=16000",
          data: audioData,
        },
      });
    } catch (error) {
      console.error("❌ [GeminiLiveClient] sendAudio failed:", error);
    }
  }

  // Send video frame
  sendVideo(videoData: string) {
    if (!this.session || !this.isSocketOpen) return;
    try {
      this.session.sendRealtimeInput({
        media: {
          mimeType: "image/jpeg",
          data: videoData,
        },
      });
    } catch (error) {
      console.error("❌ [GeminiLiveClient] sendVideo failed:", error);
    }
  }

  // Send text message (for Phase 2 when dispatcher talks)
  sendText(text: string) {
    if (!this.session || !this.isSocketOpen) return;
    try {
      this.session.sendClientContent({
        turns: [{ role: "user", parts: [{ text }] }],
        turnComplete: false,
      });
    } catch (error) {
      console.error("❌ [GeminiLiveClient] sendText failed:", error);
    }
  }

  // Send tool response
  sendToolResponse(response: any) {
    if (!this.session || !this.isSocketOpen) return;
    try {
      this.session.sendToolResponse(response);
    } catch (error) {
      console.error("❌ [GeminiLiveClient] sendToolResponse failed:", error);
    }
  }

  // Update configuration (for phase switching)
  async updateConfig(newConfig: Partial<LiveConnectConfig>) {
    this.config = { ...this.config, ...newConfig };
    // Note: Gemini Live API may require reconnection for some config changes
    // For now, we'll handle phase switching by reconnecting
  }

  disconnect() {
    if (this.session) {
      this.session.close();
      this.session = null;
    }
    this.isSocketOpen = false;
  }

  isConnected(): boolean {
    return this.session !== null && this.isSocketOpen;
  }
}
