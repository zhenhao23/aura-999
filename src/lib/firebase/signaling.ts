import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
  GeoPoint,
} from "firebase/firestore";
import { db } from "./config";
import {
  AIAssessment,
  AIProgress,
  CallPhase,
  VisualHazard,
} from "@/types/ai-agent";

export interface CallerLocation {
  coords: GeoPoint;
  address?: string;
  accuracy: number; // in meters
  timestamp: Timestamp;
  source: "gps" | "network" | "manual";
  heading?: number; // direction of movement
  speed?: number; // speed in m/s
}

// Separate collection interfaces
export interface CallData {
  id?: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  status: "waiting" | "connected" | "ended";
  timestamp: Timestamp;
}

export interface AISessionData {
  callPhase: CallPhase;
  aiAssessment?: AIAssessment;
  aiProgress?: AIProgress;
  transferTime?: Timestamp;
  createdAt: Timestamp;
}

export interface LocationData {
  currentLocation?: CallerLocation;
  locationPermissionGranted: boolean;
  lastLocationUpdate?: Timestamp;
}

export interface IceCandidate {
  candidate: RTCIceCandidateInit;
  timestamp: Timestamp;
}

// ==================== WebRTC Functions ====================

// Create a new call session
export async function createCall(
  offer?: RTCSessionDescriptionInit,
): Promise<string> {
  const callData: any = {
    status: "waiting",
    timestamp: serverTimestamp() as Timestamp,
  };

  // Only include offer if provided (Firestore doesn't accept undefined)
  if (offer) {
    callData.offer = offer;
  }

  const callRef = await addDoc(collection(db, "calls"), callData);
  const callId = callRef.id;

  // Initialize AI session
  await setDoc(doc(db, "aiSessions", callId), {
    callPhase: "ai-screening",
    createdAt: serverTimestamp(),
  });

  // Initialize location tracking
  await setDoc(doc(db, "callerLocations", callId), {
    locationPermissionGranted: false,
  });

  return callId;
}

// Set offer for a call (used when WebRTC handoff starts)
export async function setCallOffer(
  callId: string,
  offer: RTCSessionDescriptionInit,
): Promise<void> {
  const callRef = doc(db, "calls", callId);
  await setDoc(
    callRef,
    {
      offer,
    },
    { merge: true },
  );
}

// Set answer for a call
export async function setCallAnswer(
  callId: string,
  answer: RTCSessionDescriptionInit,
): Promise<void> {
  const callRef = doc(db, "calls", callId);
  await setDoc(
    callRef,
    {
      answer,
      status: "connected",
    },
    { merge: true },
  );
}

// Add ICE candidate (caller side)
export async function addCallerCandidate(
  callId: string,
  candidate: RTCIceCandidateInit,
): Promise<void> {
  const candidatesRef = collection(db, "calls", callId, "callerCandidates");
  await addDoc(candidatesRef, {
    candidate,
    timestamp: serverTimestamp(),
  });
}

// Add ICE candidate (dispatcher side)
export async function addDispatcherCandidate(
  callId: string,
  candidate: RTCIceCandidateInit,
): Promise<void> {
  const candidatesRef = collection(db, "calls", callId, "dispatcherCandidates");
  await addDoc(candidatesRef, {
    candidate,
    timestamp: serverTimestamp(),
  });
}

// Listen for answer (caller side)
export function listenForAnswer(
  callId: string,
  callback: (answer: RTCSessionDescriptionInit) => void,
): () => void {
  const callRef = doc(db, "calls", callId);

  const unsubscribe = onSnapshot(callRef, (snapshot) => {
    const data = snapshot.data() as CallData;
    if (data?.answer) {
      callback(data.answer);
    }
  });

  return unsubscribe;
}

// Listen for dispatcher candidates (caller side)
export function listenForDispatcherCandidates(
  callId: string,
  callback: (candidate: RTCIceCandidateInit) => void,
): () => void {
  const candidatesRef = collection(db, "calls", callId, "dispatcherCandidates");

  const unsubscribe = onSnapshot(candidatesRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const data = change.doc.data() as IceCandidate;
        callback(data.candidate);
      }
    });
  });

  return unsubscribe;
}

// Listen for caller candidates (dispatcher side)
export function listenForCallerCandidates(
  callId: string,
  callback: (candidate: RTCIceCandidateInit) => void,
): () => void {
  const candidatesRef = collection(db, "calls", callId, "callerCandidates");

  const unsubscribe = onSnapshot(candidatesRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const data = change.doc.data() as IceCandidate;
        callback(data.candidate);
      }
    });
  });

  return unsubscribe;
}

// Listen for new incoming calls (dispatcher side)
export function listenForIncomingCalls(
  callback: (callId: string, callData: CallData) => void,
): () => void {
  const callsRef = collection(db, "calls");

  const unsubscribe = onSnapshot(callsRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const data = change.doc.data() as CallData;
        if (data.status === "waiting") {
          callback(change.doc.id, data);
        }
      }
    });
  });

  return unsubscribe;
}

// Get call data
export async function getCall(callId: string): Promise<CallData | null> {
  const callRef = doc(db, "calls", callId);
  const snapshot = await getDoc(callRef);

  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as CallData;
  }

  return null;
}

// ==================== Location Functions ====================

// Update caller's location
export async function updateCallerLocation(
  callId: string,
  location: CallerLocation,
): Promise<void> {
  const locationRef = doc(db, "callerLocations", callId);
  await setDoc(
    locationRef,
    {
      currentLocation: location,
      lastLocationUpdate: serverTimestamp(),
      locationPermissionGranted: true,
    },
    { merge: true },
  );
}

// Add location to history
export async function addLocationToHistory(
  callId: string,
  location: CallerLocation,
): Promise<void> {
  const locationRef = collection(
    db,
    "callerLocations",
    callId,
    "locationHistory",
  );
  await addDoc(locationRef, location);
}

// Update location permission status
export async function updateLocationPermission(
  callId: string,
  granted: boolean,
): Promise<void> {
  const locationRef = doc(db, "callerLocations", callId);
  await setDoc(
    locationRef,
    {
      locationPermissionGranted: granted,
    },
    { merge: true },
  );
}

// Listen for location updates (dispatcher side)
export function listenForLocationUpdates(
  callId: string,
  callback: (location: CallerLocation) => void,
): () => void {
  const locationRef = doc(db, "callerLocations", callId);

  const unsubscribe = onSnapshot(locationRef, (snapshot) => {
    const data = snapshot.data() as LocationData;
    if (data?.currentLocation) {
      callback(data.currentLocation);
    }
  });

  return unsubscribe;
}

// End call
export async function endCall(callId: string): Promise<void> {
  const callRef = doc(db, "calls", callId);
  await setDoc(
    callRef,
    {
      status: "ended",
    },
    { merge: true },
  );
}

// ==================== AI Functions ====================

// Update call phase (AI screening -> dispatcher active)
export async function updateCallPhase(
  callId: string,
  phase: CallPhase,
): Promise<void> {
  const aiSessionRef = doc(db, "aiSessions", callId);
  const updates: any = { callPhase: phase };

  if (phase === "dispatcher-active") {
    updates.transferTime = serverTimestamp();
  }

  await setDoc(aiSessionRef, updates, { merge: true });
}

// Save AI assessment (Phase 1 completion)
export async function saveAIAssessment(
  callId: string,
  assessment: Omit<AIAssessment, "completedAt">,
): Promise<void> {
  const aiSessionRef = doc(db, "aiSessions", callId);
  await setDoc(
    aiSessionRef,
    {
      aiAssessment: {
        ...assessment,
        completedAt: serverTimestamp(),
      },
    },
    { merge: true },
  );
}

// Update AI progress (Progressive updates during screening)
export async function updateAIProgress(
  callId: string,
  progress: Omit<AIProgress, "lastUpdate">,
): Promise<void> {
  const aiSessionRef = doc(db, "aiSessions", callId);

  // Filter out undefined values - Firebase doesn't accept them
  const cleanProgress: any = {
    lastUpdate: serverTimestamp(),
  };

  if (progress.estimatedUrgency !== undefined)
    cleanProgress.estimatedUrgency = progress.estimatedUrgency;
  if (progress.incidentType !== undefined)
    cleanProgress.incidentType = progress.incidentType;
  if (progress.location !== undefined)
    cleanProgress.location = progress.location;
  if (progress.keyDetails !== undefined)
    cleanProgress.keyDetails = progress.keyDetails;
  if (progress.hazardsDetected !== undefined)
    cleanProgress.hazardsDetected = progress.hazardsDetected;
  if (progress.peopleInvolved !== undefined)
    cleanProgress.peopleInvolved = progress.peopleInvolved;

  await setDoc(
    aiSessionRef,
    {
      aiProgress: cleanProgress,
    },
    { merge: true },
  );
}

// Add visual hazard detection
export async function addVisualHazard(
  callId: string,
  hazard: Omit<VisualHazard, "timestamp">,
): Promise<void> {
  const hazardsRef = collection(db, "aiSessions", callId, "visualHazards");
  await addDoc(hazardsRef, {
    ...hazard,
    timestamp: serverTimestamp(),
  });
}

// Listen for AI assessment updates
export function listenForAIAssessment(
  callId: string,
  callback: (
    assessment: AIAssessment | null,
    phase: CallPhase,
    progress?: AIProgress | null,
  ) => void,
): () => void {
  const aiSessionRef = doc(db, "aiSessions", callId);

  const unsubscribe = onSnapshot(aiSessionRef, (snapshot) => {
    const data = snapshot.data() as AISessionData;
    callback(
      data?.aiAssessment || null,
      data?.callPhase || "ai-screening",
      data?.aiProgress || null,
    );
  });

  return unsubscribe;
}

// Listen for call phase changes (for caller to know when dispatcher accepts)
export function listenForCallPhase(
  callId: string,
  callback: (phase: CallPhase) => void,
): () => void {
  const aiSessionRef = doc(db, "aiSessions", callId);

  const unsubscribe = onSnapshot(aiSessionRef, (snapshot) => {
    const data = snapshot.data() as AISessionData;
    const phase = data?.callPhase || "ai-screening";
    callback(phase);
  });

  return unsubscribe;
}

// ==================== Shadow Mode Functions ====================

export interface IncidentUpdate {
  field: string;
  value: string;
  confidence: number;
  source: string;
  timestamp: string;
}

// Update incident field (Shadow Mode)
export async function updateIncidentField(
  callId: string,
  update: IncidentUpdate,
) {
  const updateRef = collection(db, "aiSessions", callId, "incidentUpdates");
  await addDoc(updateRef, {
    ...update,
    createdAt: serverTimestamp(),
  });
}

// Listen for incident field updates
export function listenForIncidentUpdates(
  callId: string,
  callback: (update: IncidentUpdate) => void,
): () => void {
  const updatesRef = collection(db, "aiSessions", callId, "incidentUpdates");

  const unsubscribe = onSnapshot(updatesRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const data = change.doc.data() as IncidentUpdate;
        callback(data);
      }
    });
  });

  return unsubscribe;
}

// Listen for visual hazards
export function listenForVisualHazards(
  callId: string,
  callback: (hazard: VisualHazard) => void,
): () => void {
  const hazardsRef = collection(db, "aiSessions", callId, "visualHazards");

  const unsubscribe = onSnapshot(hazardsRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const data = change.doc.data() as VisualHazard;
        callback(data);
      }
    });
  });

  return unsubscribe;
}
