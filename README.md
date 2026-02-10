# WhateverClicks — AI-Powered Emergency Dispatch System for Malaysian First Responders 🚨

> Built for KitaHack 2026 Hackathon

In Malaysia, emergency response is overwhelmed by noise: 95% (3,500–4,000) of 999 calls are non-emergencies, leaving dispatchers to manually filter 70,000 daily calls across a chaotic mix of dialects and distress. Because the system can’t instantly separate life-threatening crises from pranks, more than half of Priority 1 cases fail to receive timely care.

That’s why we are building WhateverClicks. We provide the intelligent filter that 999 operators lack—using AI to automate triage, bridge language barriers, and create a seamless workflow from end-to-end: intelligent triage → real-time resource tracking → automated post-incident reporting.

We are developing the first AI-driven Emergency Dispatch Layer: an agentic system that instantly identifies genuine emergencies, calms callers in their native tongue, and optimizes resource dispatch—ensuring that in a life-or-death moment, every second counts.

## Google/Gemini Technologies Used

### 🤖 Gemini AI

| Technology                               | Use Case                                                                                                     |
| :--------------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| **Gemini 2.5 Flash Multimodal Live API** | Real-time audio/video streaming for AI emergency dispatcher                                                  |
| **Gemini 2.5 Flash (REST API)**          | Language detection and translation between 5 Malaysian languages (English, Malay, Manglish, Tamil, Mandarin) |

### 🗺️ Google Maps Platform

| Technology              | Use Case                                                                                                |
| :---------------------- | :------------------------------------------------------------------------------------------------------ |
| **Maps JavaScript API** | Interactive dark-mode tactical map with real-time vehicle tracking and animation                        |
| **Places API**          | Auto-discover emergency services within 5km (hospitals, police, fire stations, civil defense, maritime) |
| **Directions API**      | Calculate optimal routes for emergency vehicles with waypoint optimization                              |
| **Distance Matrix API** | Real-world drive time and ETA calculation for resource dispatch                                         |
| **Geocoding API**       | Convert GPS coordinates to human-readable addresses and reverse geocoding                               |

### 🔥 Firebase Platform

| Technology             | Use Case                                                                |
| :--------------------- | :---------------------------------------------------------------------- |
| **Firestore Database** | WebRTC signaling, AI session state, location tracking, incident updates |

## Table of Contents

- [Part 1: AI Dispatcher]
- [Part 2: Dialect Handling]
- [Part 3: End-to-end workflow]
- [Tech Stack]
- [Getting Started]

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
