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
  private isSocketClosing = false;
  private isConnecting = false;
  private shouldReconnect = true;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingAudioQueue: string[] = [];
  private maxQueuedAudioChunks = 50;
  private didWarmup = false;

  constructor(apiKey: string) {
    super();
    this.client = new GoogleGenAI({ apiKey });
    this.model = "models/gemini-2.5-flash-native-audio-preview-12-2025";
    this.config = {};
  }

  async connect(config: LiveConnectConfig): Promise<boolean> {
    try {
      if (this.isConnecting) {
        return false;
      }
      this.isConnecting = true;
      this.shouldReconnect = true;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      if (this.session && this.isSocketOpen) {
        this.isConnecting = false;
        return true;
      }
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
            this.isSocketClosing = false;
            this.isConnecting = false;
            this.reconnectAttempts = 0;
            this.flushQueuedAudio();
            this.sendWarmupFrame();
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
            this.isSocketClosing = false;
            this.isConnecting = false;
            this.didWarmup = false;
            this.emit("close");
            if (this.shouldReconnect) {
              this.scheduleReconnect();
            }
          },
          onerror: (error: ErrorEvent) => {
            console.error("❌ [GeminiLiveClient] WebSocket error:", error);
            const err = new Error(error.message || "Gemini Live error");
            this.session = null;
            this.isSocketOpen = false;
            this.isSocketClosing = false;
            this.isConnecting = false;
            this.didWarmup = false;
            this.emit("error", err);
          },
          onmessage: (message: any) => {
            console.log("📨 [GeminiLiveClient] Message received:", message);
            this.handleMessage(message);
          },
        },
      });

      console.log("✅ [GeminiLiveClient] Session created successfully!");
      this.isConnecting = false;
      return true;
    } catch (error) {
      console.error("❌ [GeminiLiveClient] Failed to connect:", error);
      this.isConnecting = false;
      this.emit("error", error as Error);
      return false;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer || this.isConnecting || this.isSocketOpen) {
      return;
    }
    const attempt = this.reconnectAttempts;
    const delayMs = Math.min(1000 * 2 ** attempt, 10000);
    this.reconnectAttempts += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.shouldReconnect || this.isSocketOpen || this.isConnecting) {
        return;
      }
      void this.connect(this.config);
    }, delayMs);
  }

  private handleMessage(message: any) {
    // Handle server content (transcripts, audio, tool calls)
    if (message.serverContent) {
      const content = message.serverContent;

      if (content?.inputTranscription) {
        const text = content.inputTranscription.text;
        const isFinal = content.inputTranscription.isFinal;
        if (!content.modelTurn?.parts) {
          this.emit("transcript", text || "", isFinal || false);
        }
      }

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

  private enqueueAudio(audioData: string) {
    if (this.pendingAudioQueue.length >= this.maxQueuedAudioChunks) {
      this.pendingAudioQueue.shift();
    }
    this.pendingAudioQueue.push(audioData);
  }

  private flushQueuedAudio() {
    if (
      !this.isSocketOpen ||
      !this.session ||
      this.pendingAudioQueue.length === 0
    ) {
      return;
    }
    const queued = this.pendingAudioQueue;
    this.pendingAudioQueue = [];
    for (const audioData of queued) {
      this.sendAudioInternal(audioData);
    }
  }

  private sendAudioInternal(audioData: string) {
    if (!this.session || !this.isSocketOpen) return;
    this.session.sendRealtimeInput({
      audio: {
        mimeType: "audio/pcm;rate=16000",
        data: audioData,
      },
    });
  }

  private sendWarmupFrame() {
    if (this.didWarmup || !this.isSocketOpen) return;
    const silentFrame = new ArrayBuffer(320);
    const base64Silent = btoa(
      String.fromCharCode(...new Uint8Array(silentFrame)),
    );
    this.sendAudioInternal(base64Silent);
    this.didWarmup = true;
  }

  // Send audio from microphone
  sendAudio(audioData: string) {
    if (!this.session || !this.isSocketOpen) {
      if (this.shouldReconnect && !this.isSocketClosing) {
        this.enqueueAudio(audioData);
      }
      return;
    }
    try {
      this.sendAudioInternal(audioData);
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
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.pendingAudioQueue = [];
    if (!this.session || this.isSocketClosing || !this.isSocketOpen) {
      this.isSocketOpen = false;
      return;
    }
    try {
      this.isSocketClosing = true;
      this.session.close();
    } finally {
      this.session = null;
      this.isSocketOpen = false;
      this.isSocketClosing = false;
    }
  }

  isConnected(): boolean {
    return this.session !== null && this.isSocketOpen;
  }
}
