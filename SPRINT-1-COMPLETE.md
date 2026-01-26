# Sprint 1: AI Screening Agent - COMPLETE ✅

## What We Built

### Core AI Integration

✅ **Gemini Live API Client** (`src/lib/gemini/live-client.ts`)

- Real-time WebSocket connection to Gemini 2.0 Flash
- Bidirectional audio/video streaming
- Tool calling (function declarations) support
- Event-driven architecture

✅ **AI Agent Hook** (`src/hooks/use-gemini-ai-agent.ts`)

- Manages AI agent lifecycle
- Handles Phase 1 (AI Screening)
- Audio streaming to/from AI
- Video frame capture and sending (every 2 seconds)
- Tool call handling for urgency assessment

✅ **Audio Recorder** (`src/lib/audio/simple-recorder.ts`)

- Captures microphone input
- Converts to PCM16 format
- Base64 encoding for API transmission
- 16kHz sample rate for optimal AI processing

✅ **AI Prompts & Tools** (`src/lib/gemini/ai-prompts.ts`)

- Phase 1 system prompt (AI as emergency dispatcher)
- `assess_urgency_and_transfer` function declaration
- Urgency scoring (1-5 scale)
- Language detection (English, Malay, Manglish, Tamil, Mandarin)

### UI Components

✅ **AI Caller Interface** (`src/components/caller/AICallerInterface.tsx`)

- Video preview with AI status overlay
- Real-time AI transcript display
- Location sharing indicator
- Mute/Video toggle controls
- Phase indicators (AI → Transferring → Dispatcher)

### Firebase Integration

✅ **Enhanced Signaling** (`src/lib/firebase/signaling.ts`)

- `CallPhase` tracking (ai-screening, transferring, dispatcher-active)
- `saveAIAssessment()` - stores AI's urgency decision
- `updateCallPhase()` - manages handoff state
- `listenForAIAssessment()` - real-time assessment updates

### Type Definitions

✅ **AI Agent Types** (`src/types/ai-agent.ts`)

- `AIAssessment` interface
- `CallPhase` type
- `IncidentField` interface
- `VisualHazard` interface

## How It Works (Phase 1 Flow)

1. **Caller starts emergency call**

   ```
   User clicks "Start Emergency Call"
   ↓
   Camera/mic permissions requested
   ↓
   Call created in Firebase
   ```

2. **Gemini AI connects**

   ```
   useGeminiAIAgent hook initializes
   ↓
   Connects to Gemini Live API
   ↓
   Loads Phase 1 system prompt
   ```

3. **Real-time streaming**

   ```
   Microphone audio → PCM16 → Base64 → Gemini
   Video frames (every 2s) → JPEG → Base64 → Gemini
   Gemini audio response → Browser speakers
   ```

4. **AI Assessment**

   ```
   AI asks questions
   ↓
   Analyzes video for hazards
   ↓
   Determines urgency (1-5)
   ↓
   Calls assess_urgency_and_transfer tool
   ↓
   Saves assessment to Firestore
   ```

5. **Transfer decision**
   ```
   If urgency >= 4:
     callPhase → "transferring"
     Triggers onTransferRequested callback
   ```

## Testing Instructions

### 1. Access the AI Caller Page

```
http://localhost:3000/caller-ai
```

### 2. Grant Permissions

- Click "Start Emergency Call"
- Allow camera access
- Allow microphone access
- Allow location access (automatic)

### 3. Observe AI Interaction

- AI will greet you in your language
- Speak about an emergency (try: "There's a fire in my house!")
- Watch the AI transcript appear
- See location sharing indicator

### 4. Check Firebase Console

```
Collections > calls > [callId]

Fields to verify:
- callPhase: "ai-screening"
- aiAssessment: (appears when AI decides to transfer)
  - urgencyLevel: 1-5
  - reasoning: "..."
  - shouldTransfer: true/false
  - initialSummary: "..."
```

## Environment Variables Required

```bash
# .env.local
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc
```

## Known Limitations (Sprint 1)

⚠️ **Phase 2 not implemented yet**

- AI doesn't enter shadow mode
- Dispatcher handoff UI pending
- No dispatcher audio routing

⚠️ **Video analysis basic**

- Frames sent every 2 seconds
- No streaming video analysis
- Need to test hazard detection accuracy

⚠️ **Audio quality**

- Using ScriptProcessorNode (deprecated but stable)
- Should migrate to AudioWorklet for production

## Next Steps (Sprint 2)

1. **Dispatcher Alert System**
   - IncomingCallAlert component
   - Show AI assessment summary
   - Accept/reject call buttons

2. **Phase Switching**
   - Transition AI to shadow mode
   - Mute AI audio output
   - Route dispatcher audio to caller

3. **WebRTC Integration**
   - Establish dispatcher-caller WebRTC
   - Send dispatcher audio to Gemini (for observation)

4. **Dashboard Enhancement**
   - Display AI assessment in Intelligent Summary
   - Show call phase indicator
   - Real-time transcript from AI

## Files Created

```
src/
├── lib/
│   ├── gemini/
│   │   ├── live-client.ts        (Gemini WebSocket client)
│   │   └── ai-prompts.ts         (System prompts & tools)
│   └── audio/
│       └── simple-recorder.ts    (Microphone recorder)
├── hooks/
│   └── use-gemini-ai-agent.ts    (AI agent state management)
├── components/
│   └── caller/
│       └── AICallerInterface.tsx (UI for AI-powered calls)
├── app/
│   └── caller-ai/
│       └── page.tsx              (Route for AI caller)
└── types/
    └── ai-agent.ts               (TypeScript types)
```

## Dependencies Added

```json
{
  "@google/genai": "^0.14.0",
  "eventemitter3": "^5.0.1"
}
```

---

**Status:** Sprint 1 COMPLETE ✅  
**Build:** Passing ✅  
**Server:** Running at http://localhost:3000  
**Ready for:** Sprint 2 (Dispatcher Handoff)
