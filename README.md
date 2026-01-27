# WhateverClicks 🚨

> **AI-Powered Emergency Dispatch System for Malaysian First Responders**  
> Built for KitaHack 2026 Google Hackathon

WhateverClicks revolutionizes emergency response by combining Google's Gemini 2.0 Flash Live API with WebRTC, Firebase, and intelligent resource optimization. The system provides real-time AI triage, seamless dispatcher handoff, continuous AI observation, and multilingual translation—all designed specifically for Malaysia's diverse emergency response landscape.

---

## 🎯 Problem Statement

Traditional emergency dispatch systems face critical challenges:

- **Language Barriers**: Malaysia's multilingual population (English, Malay, Manglish, Tamil, Mandarin) creates communication gaps
- **Slow Triage**: Dispatchers must manually assess urgency from audio-only calls
- **Limited Context**: No visual information about emergencies leads to suboptimal resource allocation
- **Knowledge Gaps**: Dispatchers may miss critical details during handoff from initial screening

---

## 💡 Our Solution

WhateverClicks uses AI to **screen, triage, and translate** emergency calls before seamlessly transferring to human dispatchers—while continuing to observe and provide real-time intelligence.

### Core Innovation: 4-Phase AI Lifecycle

1. **Phase 1: AI Screening** - Gemini Live API speaks with caller (audio + video), assesses urgency
2. **Phase 2: Dispatcher Handoff** - WebRTC transfers call to human dispatcher when AI completes assessment
3. **Phase 3: Shadow Mode** - AI continues observing, providing live updates and hazard detection
4. **Phase 4: Translation** - Real-time bidirectional translation between dispatcher and caller

---

## ✨ Key Features

### 🤖 AI-Powered Triage (Gemini 2.0 Flash Live API)

- **Multimodal Input**: Processes audio, video, and screen sharing simultaneously
- **Intelligent Assessment**: Uses function calling to evaluate urgency, injuries, location, and required resources
- **Natural Conversation**: Speaks to callers in natural language while gathering critical information
- **Instant Analysis**: Provides structured incident data to dispatchers within seconds

### 🎥 Seamless WebRTC Handoff

- **Zero-Interruption Transfer**: Caller stays on the line as AI hands off to human dispatcher
- **Real-Time Video**: Live video feed continues from caller to dispatcher dashboard
- **Firebase Signaling**: ICE candidate and SDP exchange for reliable peer connections
- **Memory-Safe**: Proper cleanup prevents connection leaks during handoffs

### 👁️ AI Shadow Mode (Post-Handoff Intelligence)

- **Continuous Observation**: AI watches and listens even after dispatcher takes over
- **Live Incident Updates**: Real-time field updates (location changes, injury severity, hazard detection)
- **Visual Hazard Detection**: AI analyzes video for fire, smoke, flooding, structural damage, hazmat
- **Confidence Scoring**: High/Medium/Low confidence indicators for dispatcher decision-making

### 🌍 Multilingual Translation (Gemini 2.0 Flash)

- **Auto Language Detection**: Instantly identifies caller's language (English, Malay, Manglish, Tamil, Mandarin)
- **Bidirectional Translation**:
  - Dispatcher (English) → Caller's language
  - Caller → Dispatcher (English)
- **Manglish Support**: Special handling for Malaysian English code-switching
  - Example: "Where are you?" → "You kat mana?"
- **< 1 Second Latency**: Real-time translation doesn't interrupt conversation flow

### 🗺️ Smart Resource Allocation

- **Multi-Agency Support**: PDRM (Police), JBPM (Fire), KKM (Medical), APM (Civil Defense), MMEA (Maritime)
- **ETA Calculation**: Google Maps Directions API for accurate arrival time estimates
- **Optimal Dispatch**: Recommends closest available units based on incident type and severity
- **Geofencing**: Visual danger zones on tactical map

---

## 🛠️ Technology Stack

### Frontend Framework

- **Next.js 16** - App Router with React Server Components
- **TypeScript** - Strict type safety throughout
- **Tailwind CSS 4** - Modern @theme inline syntax
- **Shadcn UI + Radix UI** - Accessible component library

### AI & Real-Time Communication

- **Google Gemini 2.0 Flash Live API** (`models/gemini-2.0-flash-exp`)
  - WebSocket bidirectional streaming
  - Audio: PCM16 format (16kHz input, 24kHz output)
  - Video: Base64-encoded frames
  - Function calling for structured outputs
- **Google Gemini 2.0 Flash REST API** - Fast text translation
- **WebRTC** - Peer-to-peer video/audio calls
- **@google/genai SDK** (v1.38.0) - Official Gemini client

### Backend & Database

- **Firebase Firestore** - Real-time NoSQL database
  - Collections: `calls/{callId}`
  - Subcollections: `incidentUpdates`, `visualHazards`, `callerCandidates`, `dispatcherCandidates`
- **Firebase Realtime Listeners** - Live updates to UI

### Maps & Location

- **Google Maps JavaScript API** - Tactical map visualization
- **@vis.gl/react-google-maps** - React wrapper for Maps
- **Google Geocoding API** - Address resolution
- **Google Directions API** - Route calculation and ETA

### State Management

- **Zustand** - Lightweight state management
- **React Hooks** - Local component state
- **EventEmitter3** - Event-driven architecture

---

## 📁 Project Structure

```
whateverclicks/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── caller/page.tsx             # Caller interface (AI screening)
│   │   └── dashboard/page.tsx          # Dispatcher control center
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── DashboardLayout.tsx     # 4-quadrant layout
│   │   │   ├── IntelligentSummary.tsx  # AI assessment display
│   │   │   ├── LiveFeed.tsx            # WebRTC video + chat
│   │   │   ├── LiveIncidentSummary.tsx # Shadow mode updates
│   │   │   ├── ResourceAllocation.tsx  # Agency resource cards
│   │   │   └── UniversalComms.tsx      # Chat with translation
│   │   ├── map/
│   │   │   ├── TacticalMap.tsx         # Google Maps component
│   │   │   ├── Markers.tsx             # Incident/station markers
│   │   │   ├── RoutePolyline.tsx       # Dispatch routes
│   │   │   └── Geofence.tsx            # Danger zone circles
│   │   └── ui/                         # Shadcn components
│   ├── lib/
│   │   ├── gemini/
│   │   │   ├── live-client.ts          # Gemini Live API wrapper
│   │   │   └── translator.ts           # Translation service
│   │   ├── firebase/
│   │   │   ├── config.ts               # Firebase initialization
│   │   │   └── signaling.ts            # WebRTC signaling
│   │   ├── webrtc/
│   │   │   └── peer-connection.ts      # RTCPeerConnection utils
│   │   ├── maps/
│   │   │   ├── geocoding.ts            # Address ↔ Coords
│   │   │   └── routing.ts              # Route calculation
│   │   └── resource-optimizer.ts       # Dispatch algorithm
│   ├── hooks/
│   │   └── use-gemini-ai-agent.ts      # AI lifecycle management
│   ├── types/
│   │   ├── incident.ts                 # Incident data models
│   │   ├── resource.ts                 # Agency/vehicle types
│   │   ├── agency.ts                   # Malaysian agencies
│   │   └── ai-agent.ts                 # AI tool schemas
│   └── data/
│       ├── agencies.ts                 # Agency metadata
│       ├── stations.ts                 # Station locations
│       └── mock-incidents.ts           # Demo data
├── FIREBASE-SETUP.md                   # Firebase configuration guide
├── LOCATION-TRACKING.md                # GPS integration docs
├── SETUP-GUIDE.md                      # Development setup
└── SPRINT-4-COMPLETE.md                # Sprint 4 documentation

```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.17 or later
- **Firebase Account** (free tier works)
- **Google Cloud Account** with billing enabled
- **API Keys**:
  - Gemini API Key (from Google AI Studio)
  - Google Maps API Key

### Installation

1. **Clone the repository**:

```bash
git clone https://github.com/yourusername/whateverclicks.git
cd whateverclicks
```

2. **Install dependencies**:

```bash
npm install
```

3. **Set up environment variables**:
   Create `.env.local` in the root directory:

```env
# Gemini AI
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_api_key

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

4. **Configure Firebase**:
   - Follow [FIREBASE-SETUP.md](FIREBASE-SETUP.md) for detailed instructions
   - Enable Firestore in test mode
   - Set up security rules

5. **Enable Google Cloud APIs**:
   - Maps JavaScript API
   - Geocoding API
   - Directions API

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Available Routes**:

- `/` - Landing page
- `/caller` - Caller interface (start here to test AI screening)
- `/dashboard` - Dispatcher control center

### Build for Production

```bash
npm run build
npm run build
npm start
```

---

## 🎮 How It Works

### Complete Call Flow

1. **Caller initiates emergency call** at `/caller`
   - Browser requests camera/microphone permissions
   - AI agent (Gemini Live) connects via WebSocket
   - Caller sees "AI is listening..." status

2. **AI conducts initial screening** (Phase 1)
   - Multimodal analysis: audio, video, screen sharing
   - Asks contextual questions about the emergency
   - Evaluates urgency, injuries, location, required resources
   - Uses `assess_urgency_and_transfer` function call when ready

3. **System triggers dispatcher handoff**
   - Caller's page shows "Transferring to dispatcher..."
   - WebRTC offer created and stored in Firebase
   - Dashboard receives real-time alert with incident summary
   - Dispatcher sees incoming call notification

4. **Dispatcher accepts call** at `/dashboard`
   - WebRTC answer completes peer connection
   - Live video/audio stream established
   - AI transitions to Shadow Mode (Phase 2)
   - Chat interface opens with translation enabled

5. **AI observes in Shadow Mode** (Phase 3)
   - Continues listening/watching in background
   - Detects field changes: `update_incident_field` tool
   - Identifies visual hazards: `detect_visual_hazard` tool
   - Updates appear in real-time on LiveIncidentSummary panel

6. **Dispatcher manages response**
   - Views AI assessment and live updates
   - Sends translated messages to caller
   - Approves/denies resource requests
   - Routes displayed on tactical map
   - Monitors hazard alerts

---

## Adding UI Components

This project uses Shadcn UI. To add new components:

```bash
npx shadcn@latest add [component-name]
```

For example:

```bash
npx shadcn@latest add dialog
npx shadcn@latest add input
npx shadcn@latest add form
```

Browse available components at [ui.shadcn.com](https://ui.shadcn.com)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn UI Documentation](https://ui.shadcn.com)
- [Radix UI Documentation](https://www.radix-ui.com/primitives/docs/overview/introduction)

## Deploy on Vercel

Deploy with one click on [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fwhateverclicks-kitahack)

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
