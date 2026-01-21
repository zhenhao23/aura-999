// WebRTC configuration with STUN server
export const rtcConfig: RTCConfiguration = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

export interface PeerConnectionCallbacks {
  onIceCandidate?: (candidate: RTCIceCandidate) => void;
  onTrack?: (event: RTCTrackEvent) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
}

export class WebRTCPeerConnection {
  private pc: RTCPeerConnection;
  private callbacks: PeerConnectionCallbacks;

  constructor(callbacks: PeerConnectionCallbacks = {}) {
    this.pc = new RTCPeerConnection(rtcConfig);
    this.callbacks = callbacks;
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Handle ICE candidates
    this.pc.onicecandidate = (event) => {
      if (event.candidate && this.callbacks.onIceCandidate) {
        this.callbacks.onIceCandidate(event.candidate);
      }
    };

    // Handle incoming tracks (video/audio)
    this.pc.ontrack = (event) => {
      if (this.callbacks.onTrack) {
        this.callbacks.onTrack(event);
      }
    };

    // Handle connection state changes
    this.pc.onconnectionstatechange = () => {
      if (this.callbacks.onConnectionStateChange) {
        this.callbacks.onConnectionStateChange(this.pc.connectionState);
      }
      console.log("Connection state:", this.pc.connectionState);
    };
  }

  // Add local media stream
  addStream(stream: MediaStream) {
    stream.getTracks().forEach((track) => {
      this.pc.addTrack(track, stream);
    });
  }

  // Create offer (caller side)
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  // Create answer (receiver side)
  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer;
  }

  // Set remote description
  async setRemoteDescription(description: RTCSessionDescriptionInit) {
    await this.pc.setRemoteDescription(new RTCSessionDescription(description));
  }

  // Add ICE candidate
  async addIceCandidate(candidate: RTCIceCandidateInit) {
    await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
  }

  // Close connection
  close() {
    this.pc.close();
  }

  // Get connection state
  getConnectionState(): RTCPeerConnectionState {
    return this.pc.connectionState;
  }
}
