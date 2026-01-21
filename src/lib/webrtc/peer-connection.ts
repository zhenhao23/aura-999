// WebRTC configuration with STUN and TURN servers
export const rtcConfig: RTCConfiguration = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
    },
    {
      // Free TURN server from Metered.ca (works for mobile networks)
      urls: [
        "turn:a.relay.metered.ca:80",
        "turn:a.relay.metered.ca:80?transport=tcp",
        "turn:a.relay.metered.ca:443",
        "turn:a.relay.metered.ca:443?transport=tcp",
      ],
      username: "987654321", // Free public credentials
      credential: "987654321",
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
      } else if (!event.candidate) {
        console.log("ICE gathering complete");
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

    // Handle ICE connection state changes
    this.pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", this.pc.iceConnectionState);
    };

    // Handle ICE gathering state changes
    this.pc.onicegatheringstatechange = () => {
      console.log("ICE gathering state:", this.pc.iceGatheringState);
    };

    // Handle signaling state changes
    this.pc.onsignalingstatechange = () => {
      console.log("Signaling state:", this.pc.signalingState);
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

  // Set local description (for manual control)
  async setLocalDescription(description: RTCSessionDescriptionInit) {
    if (this.pc.signalingState === "closed") {
      console.warn("Cannot set local description - connection is closed");
      return;
    }
    await this.pc.setLocalDescription(description);
  }

  // Set remote description
  async setRemoteDescription(description: RTCSessionDescriptionInit) {
    if (this.pc.signalingState === "closed") {
      console.warn("Cannot set remote description - connection is closed");
      return;
    }
    await this.pc.setRemoteDescription(new RTCSessionDescription(description));
  }

  // Add ICE candidate
  async addIceCandidate(candidate: RTCIceCandidateInit) {
    if (this.pc.signalingState === "closed") {
      console.warn("Cannot add ICE candidate - connection is closed");
      return;
    }
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
