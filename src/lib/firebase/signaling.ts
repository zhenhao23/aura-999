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

export interface CallerLocation {
  coords: GeoPoint;
  address?: string;
  accuracy: number; // in meters
  timestamp: Timestamp;
  source: "gps" | "network" | "manual";
  heading?: number; // direction of movement
  speed?: number; // speed in m/s
}

export interface CallData {
  id?: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  status: "waiting" | "connected" | "ended";
  timestamp: Timestamp;
  currentLocation?: CallerLocation;
  locationPermissionGranted?: boolean;
  lastLocationUpdate?: Timestamp;
  metadata?: {
    location?: string;
    callerInfo?: string;
  };
}

export interface IceCandidate {
  candidate: RTCIceCandidateInit;
  timestamp: Timestamp;
}

// Create a new call session
export async function createCall(
  offer: RTCSessionDescriptionInit,
): Promise<string> {
  const callData: Omit<CallData, "id"> = {
    offer,
    status: "waiting",
    timestamp: serverTimestamp() as Timestamp,
  };

  const callRef = await addDoc(collection(db, "calls"), callData);
  console.log("Call created with ID:", callRef.id);
  return callRef.id;
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

// Update caller's location
export async function updateCallerLocation(
  callId: string,
  location: CallerLocation,
): Promise<void> {
  const callRef = doc(db, "calls", callId);
  await setDoc(
    callRef,
    {
      currentLocation: location,
      lastLocationUpdate: serverTimestamp(),
    },
    { merge: true },
  );
}

// Add location to history
export async function addLocationToHistory(
  callId: string,
  location: CallerLocation,
): Promise<void> {
  const locationRef = collection(db, "calls", callId, "locationHistory");
  await addDoc(locationRef, location);
}

// Listen for location updates (dispatcher side)
export function listenForLocationUpdates(
  callId: string,
  callback: (location: CallerLocation) => void,
): () => void {
  const callRef = doc(db, "calls", callId);

  const unsubscribe = onSnapshot(callRef, (snapshot) => {
    const data = snapshot.data() as CallData;
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
