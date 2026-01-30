export class SimpleAudioRecorder {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private isRecording = false;
  private onDataCallback: ((data: string) => void) | null = null;

  async start(onData: (data: string) => void) {
    this.onDataCallback = onData;

    // Request microphone access
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true, // Better voice clarity
      },
    });

    // Create audio context
    this.audioContext = new AudioContext({ sampleRate: 16000 });

    // Try to use AudioWorklet (modern, low-latency)
    // Fallback to ScriptProcessor if AudioWorklet not supported
    try {
      await this.startWithAudioWorklet();
    } catch (error) {
      console.warn("AudioWorklet not supported, using fallback:", error);
      this.startWithScriptProcessor();
    }
  }

  private async startWithAudioWorklet() {
    if (!this.audioContext || !this.mediaStream) return;

    // Load audio worklet processor
    const workletCode = `
      class AudioCaptureProcessor extends AudioWorkletProcessor {
        process(inputs, outputs) {
          const input = inputs[0];
          if (input.length > 0) {
            const channelData = input[0];
            this.port.postMessage(channelData);
          }
          return true;
        }
      }
      registerProcessor('audio-capture-processor', AudioCaptureProcessor);
    `;
    const blob = new Blob([workletCode], { type: "application/javascript" });
    const workletUrl = URL.createObjectURL(blob);

    await this.audioContext.audioWorklet.addModule(workletUrl);
    URL.revokeObjectURL(workletUrl);

    this.sourceNode = this.audioContext.createMediaStreamSource(
      this.mediaStream,
    );
    this.workletNode = new AudioWorkletNode(
      this.audioContext,
      "audio-capture-processor",
    );

    this.workletNode.port.onmessage = (event) => {
      if (!this.isRecording) return;

      const float32Data = event.data;
      const pcm16 = this.floatTo16BitPCM(float32Data);
      const base64 = this.arrayBufferToBase64(pcm16);

      if (this.onDataCallback) {
        this.onDataCallback(base64);
      }
    };

    this.sourceNode.connect(this.workletNode);
    this.workletNode.connect(this.audioContext.destination);
    this.isRecording = true;
  }

  private startWithScriptProcessor() {
    if (!this.audioContext || !this.mediaStream) return;

    this.sourceNode = this.audioContext.createMediaStreamSource(
      this.mediaStream,
    );

    // Use smaller buffer for lower latency (256 samples = ~16ms at 16kHz)
    const bufferSize = 2048; // Reduced from 4096
    const processorNode = this.audioContext.createScriptProcessor(
      bufferSize,
      1,
      1,
    );

    processorNode.onaudioprocess = (e) => {
      if (!this.isRecording) return;

      const inputData = e.inputBuffer.getChannelData(0);
      const pcm16 = this.floatTo16BitPCM(inputData);
      const base64 = this.arrayBufferToBase64(pcm16);

      if (this.onDataCallback) {
        this.onDataCallback(base64);
      }
    };

    this.sourceNode.connect(processorNode);
    processorNode.connect(this.audioContext.destination);
    this.isRecording = true;
  }

  stop() {
    this.isRecording = false;

    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  private floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);

    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    return buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    // Optimized base64 encoding using Uint8Array chunks
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000; // 32KB chunks
    const chunks: string[] = [];

    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      chunks.push(String.fromCharCode.apply(null, Array.from(chunk)));
    }

    return btoa(chunks.join(""));
  }
}
