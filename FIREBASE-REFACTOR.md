# Firebase Refactor - Separate Collections

## ✅ What Changed

Refactored Firebase structure from **single collection** (`calls`) to **three separate collections**:

### **Before:**

```
calls/{callId}/
  ├── offer, answer, status (WebRTC)
  ├── callPhase, aiAssessment, aiProgress (AI)
  ├── currentLocation, locationPermissionGranted (Location)
  ├── callerCandidates/
  ├── dispatcherCandidates/
  ├── incidentUpdates/
  ├── visualHazards/
  └── locationHistory/
```

### **After:**

```
calls/{callId}/                         // WebRTC signaling only
  ├── offer
  ├── answer
  ├── status
  ├── timestamp
  ├── callerCandidates/
  └── dispatcherCandidates/

aiSessions/{callId}/                    // AI assessment & analysis
  ├── callPhase
  ├── aiAssessment
  ├── aiProgress
  ├── detectedLanguage
  ├── transferTime
  ├── createdAt
  ├── incidentUpdates/
  └── visualHazards/

callerLocations/{callId}/               // Location tracking
  ├── currentLocation
  ├── lastLocationUpdate
  ├── locationPermissionGranted
  └── locationHistory/
```

---

## 🎯 Benefits

### **1. Clean Separation of Concerns**

- WebRTC issues? Check `calls` collection only
- AI not working? Check `aiSessions` collection only
- Location problems? Check `callerLocations` collection only

### **2. Better Debugging**

- Firestore console is much cleaner
- Each collection has focused, relevant data
- Easier to understand what's happening

### **3. Better Performance**

- No more merging unrelated updates into one document
- Reduced risk of document conflicts
- Won't hit 1MB document size limit

### **4. Better Security**

- Can set different permissions per collection
- Example: Only AI service can write to `aiSessions`

### **5. Better Queries**

- Can query all AI sessions across calls
- Can query all location data for analytics
- Can filter by specific collection fields

---

## 📝 Updated Functions

### **Location Functions** (now use `callerLocations` collection)

- `updateCallerLocation(callId, location)`
- `addLocationToHistory(callId, location)`
- `updateLocationPermission(callId, granted)`
- `listenForLocationUpdates(callId, callback)`

### **AI Functions** (now use `aiSessions` collection)

- `updateCallPhase(callId, phase)`
- `saveAIAssessment(callId, assessment)`
- `updateAIProgress(callId, progress)`
- `addVisualHazard(callId, hazard)`
- `listenForAIAssessment(callId, callback)`
- `listenForCallPhase(callId, callback)`
- `updateIncidentField(callId, update)`
- `listenForIncidentUpdates(callId, callback)`
- `listenForVisualHazards(callId, callback)`

### **WebRTC Functions** (still use `calls` collection - unchanged)

- `createCall(offer)` - Now also initializes `aiSessions` and `callerLocations`
- `setCallOffer(callId, offer)`
- `setCallAnswer(callId, answer)`
- `addCallerCandidate(callId, candidate)`
- `addDispatcherCandidate(callId, candidate)`
- `listenForAnswer(callId, callback)`
- `listenForCallerCandidates(callId, callback)`
- `listenForDispatcherCandidates(callId, callback)`
- `listenForIncomingCalls(callback)`
- `getCall(callId)`
- `endCall(callId)`

---

## 🔥 Important: `createCall()` Changes

The `createCall()` function now initializes **all three collections**:

```typescript
const callId = await createCall();
// This creates:
// 1. calls/{callId} - WebRTC document
// 2. aiSessions/{callId} - AI session document
// 3. callerLocations/{callId} - Location document
```

**Old behavior:**

```typescript
createCall() → {
  status: "waiting",
  timestamp: ...,
  callPhase: "ai-screening",      // AI field
  locationPermissionGranted: false // Location field
}
```

**New behavior:**

```typescript
createCall() → {
  // calls/{callId}
  status: "waiting",
  timestamp: ...
}

// PLUS creates:

// aiSessions/{callId}
{
  callPhase: "ai-screening",
  createdAt: ...
}

// callerLocations/{callId}
{
  locationPermissionGranted: false
}
```

---

## 🧪 Testing

### **1. Test WebRTC (calls collection)**

1. Start emergency call from caller page
2. Check Firebase Console → `calls` collection
3. Should see: `offer`, `answer`, `status`, `timestamp`
4. Should see subcollections: `callerCandidates`, `dispatcherCandidates`

### **2. Test AI (aiSessions collection)**

1. AI starts screening
2. Check Firebase Console → `aiSessions` collection
3. Should see:
   - `callPhase: "ai-screening"`
   - `aiProgress` updates in real-time
   - `aiAssessment` after screening complete
4. Should see subcollections: `incidentUpdates`, `visualHazards`

### **3. Test Location (callerLocations collection)**

1. Grant location permission on caller page
2. Check Firebase Console → `callerLocations` collection
3. Should see:
   - `locationPermissionGranted: true`
   - `currentLocation` with GeoPoint
   - `lastLocationUpdate` timestamp
4. Should see subcollection: `locationHistory`

---

## 🔍 Debugging Guide

### **WebRTC connection issues:**

```
Check: calls/{callId}
Look for:
  - offer present?
  - answer present?
  - status: "connected"?
  - ICE candidates being added?
```

### **AI not working:**

```
Check: aiSessions/{callId}
Look for:
  - callPhase correct?
  - aiProgress updating?
  - aiAssessment saved?
  - Tool calls in incidentUpdates?
```

### **Location not tracking:**

```
Check: callerLocations/{callId}
Look for:
  - locationPermissionGranted: true?
  - currentLocation with GeoPoint?
  - lastLocationUpdate timestamp?
  - locationHistory growing?
```

---

## 🚀 No Code Changes Needed

All your existing code still works! The refactor only changed:

- **Internal Firebase collection names**
- **Function implementations**

Your components and hooks use the **same function signatures**, so no changes needed in:

- `dashboard/page.tsx` ✅
- `caller/page.tsx` ✅
- `use-gemini-ai-agent.ts` ✅
- `IncomingCallAlert.tsx` ✅
- `LiveFeed.tsx` ✅
- All other components ✅

---

## 📊 Firebase Security Rules (Optional)

For production, you can now set collection-specific rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // WebRTC - anyone can read/write for hackathon
    match /calls/{callId} {
      allow read, write: if true;
      match /callerCandidates/{candidate} {
        allow read, write: if true;
      }
      match /dispatcherCandidates/{candidate} {
        allow read, write: if true;
      }
    }

    // AI Sessions - only AI service should write (but allow all for hackathon)
    match /aiSessions/{callId} {
      allow read, write: if true;
      match /incidentUpdates/{update} {
        allow read, write: if true;
      }
      match /visualHazards/{hazard} {
        allow read, write: if true;
      }
    }

    // Caller Locations - only caller should write (but allow all for hackathon)
    match /callerLocations/{callId} {
      allow read, write: if true;
      match /locationHistory/{location} {
        allow read, write: if true;
      }
    }
  }
}
```

---

## ✅ Summary

**Old structure:** Everything in `calls` → Hard to debug
**New structure:** Separated by purpose → Easy to debug

All your existing code works without changes! Just cleaner data organization in Firebase.
