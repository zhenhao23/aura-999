# WhateverClicks — AI-Powered Emergency Dispatch System for Malaysian First Responders 🚨

> Built for KitaHack 2026 Hackathon

In Malaysia, 95% of 999 calls (3,500–4,000 daily) are non-emergencies—pranks, misdials, and information requests—forcing dispatchers to manually screen 70,000 calls across multiple dialects while genuine emergencies wait. This noise drowns out life-threatening situations: cardiac arrests, active fires, and severe trauma. The result? More than half of Priority 1 cases fail to receive timely care because the system can't instantly separate crises from chaos.

WhateverClicks is Malaysia's first AI-powered Emergency Dispatch Layer. We deploy multimodal AI to answer 999 calls in real-time, conducting triage in the caller's native language (Bahasa Malaysia, Manglish, Tamil, Mandarin), filtering 95% of non-emergencies within 2 minutes, and escalating critical cases immediately. After handoff, AI enters "shadow mode"—silently extracting details, detecting visual hazards, and updating dispatchers with timestamped evidence while Google Maps optimizes resource routing and ETAs.

Our end-to-end workflow transforms emergency response: intelligent triage eliminates noise, real-time resource tracking cuts response times, multilingual communication removes language barriers, and automated incident logs streamline post-incident reporting. When every second counts, WhateverClicks ensures dispatchers focus on what matters—saving lives.

## Google/Gemini Technologies Used

### 🤖 Gemini AI

| Technology                               | Use Case                                                                                                     |
| :--------------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| **Gemini 2.5 Flash Multimodal Live API** | Real-time audio/video streaming for AI emergency dispatcher                                                  |
| **Gemini 2.5 Flash (REST API)**          | Language detection and translation between 5 Malaysian languages (English, Malay, Manglish, Tamil, Mandarin) |

### 🗺️ Google Maps Platform

| Technology              | Use Case                                                                                                      |
| :---------------------- | :------------------------------------------------------------------------------------------------------------ |
| **Maps JavaScript API** | Interactive dark-mode tactical map with real-time vehicle tracking and animation                              |
| **Places API**          | Auto-discover nearest relevant emergency services (hospitals, police, fire stations, civil defense, maritime) |
| **Directions API**      | Calculate optimal routes for emergency vehicles with waypoint optimization                                    |
| **Distance Matrix API** | Real-world drive time and ETA calculation for resource dispatch                                               |
| **Geocoding API**       | Convert GPS coordinates to human-readable addresses and reverse geocoding                                     |

### 🔥 Firebase Platform

| Technology             | Use Case                                                                |
| :--------------------- | :---------------------------------------------------------------------- |
| **Firestore Database** | WebRTC signaling, AI session state, location tracking, incident updates |

## Table of Contents

- [System Architecture & Flow](#system-architecture--flow)
  - [Phase 1: AI Screening Layer](#phase-1-ai-screening-layer-first-contact)
  - [Phase 2: Department Dispatcher Layer](#phase-2-department-dispatcher-layer-human-oversight)
  - [Phase 3: Resource Dispatch & Journey Tracking](#phase-3-resource-dispatch--journey-tracking)
- [Technical Deep Dives](#-technical-deep-dives)
  - [Priority Level Logic Matrix](#1-priority-level-logic-matrix)
  - [Transfer & Resource Recommendation System](#2-transfer--resource-recommendation-system)
  - [Tool Calls Reference](#3-tool-calls-reference)
- [Multilingual Support](#-multilingual-support)
- [Tech Stack](#tech-stack)
- [Getting Started](#-getting-started)

---

## System Architecture & Flow

### 🎯 Overview

3-phase intelligent emergency response system with multilingual AI support

### Phase 1: AI Screening Layer (First Contact)

**Duration**: < 2 minutes | **AI Role**: Active Dispatcher

![AI Screening](/public/screenshots/AI-Screening.png)

**Process Flow:**

1. **Initial Contact**
   - AI answers 999 call in caller's detected language
   - Introduces itself as emergency AI assistant
   - Confirms geolocation (if available) before asking for location

2. **Information Collection** (Progressive Updates via `updateAIProgressTool`)
   - Incident type (fire/medical/accident/crime)
   - Location details (address/landmarks/GPS)
   - Number of people affected/injured
   - Caller stress level analysis from voice

3. **Urgency Assessment** (via `assessUrgencyTool`)
   - Classifies urgency level 1-5
   - Determines if transfer needed (Level 1-2 → human dispatcher)
   - Filters non-emergencies and routine calls (Level 4-5)
   - Generates initial summary for handoff

4. **Resource Pre-Classification** _(Placeholder - Details in Section 2.2)_
   - AI recommends initial resource allocation
   - Determines target department (PDRM/JBPM/KKM/APM/MMEA)
   - Output feeds into Phase 2 dispatcher interface

---

### Phase 2: Department Dispatcher Layer (Human Oversight)

**AI Role**: Shadow Mode (Listen-only, non-speaking)

![Dispatcher Interface](/public/screenshots/Dispatcher-Interface.png)

**Dispatcher Interface:**

- **Top Left Panel**: Live AI Summary
  - Real-time incident updates
  - Tooltip explanations: "Why AI thinks this"
  - 🎬 Clip buttons: 3-second video/audio evidence

- **Top Right Panel**: Resource Recommendations
  - AI-suggested emergency vehicles
  - ETA calculations
  - Approve ✓ / Deny ✗ controls

- **Center Panel**: Tactical Map (Google Maps)
  - Live tracking of dispatched resources
  - Real-time vehicle positions and ETAs
  - Animated routing with breadcrumb trails
  - Incident location marker

- **Bottom Left Panel**: Video Call & Live Transcription
  - Real-time video feed from caller (when SMS link activated)
  - Live audio transcription with translation
  - Visual hazard detection overlay

- **Bottom Right Panel**: Chat with Bidirectional Translation
  - Text messaging with caller
  - Auto-translation (Dispatcher ↔ Caller language)
  - Message history with timestamps

**AI Background Functions:**

- Continuous information extraction via `updateIncidentFieldTool`
- Visual hazard monitoring via `detectVisualHazardTool`
- Updates backend database in real-time
- No audio output (muted observation mode)

**SMS Link Features** (Sent to caller when needed):

| Trigger Scenario        | Feature                    | Tool Used                     |
| :---------------------- | :------------------------- | :---------------------------- |
| Fire, medical emergency | 📹 Video call              | `detectVisualHazardTool`      |
| Kidnapping, break-in    | 💬 Chat (auto-translated)  | Gemini translation API        |
| Resource tracking       | 🗺️ Live ETA map for caller | Google Maps + Distance Matrix |

---

### Phase 3: Resource Dispatch & Journey Tracking

**Real-Time Monitoring:**

- Both caller and dispatcher see vehicle ETAs
- Google Maps integration with live vehicle positions
- Animated routing with breadcrumb trails

**Smart Traffic Integration** _(Future Feature)_

- STARS (Smart Traffic Analytics & Recognition System)
- "Green wave" traffic light coordination
- Priority routing for ambulances

**Post-Incident:**

- AI generates comprehensive incident log
- Multi-purpose: Police reports, insurance claims, internal analytics
- Includes: Timeline, transcript, hazards, resource response times

![Incident Log 1](/public/screenshots/Incident-Log-1.png)
![Incident Log 2](/public/screenshots/Incident-Log-2.png)

---

## 📋 Technical Deep Dives

### 1. Priority Level Logic Matrix

| Level | Category Name | Clinical Status                          | Auto-Transfer | Example                                  |
| :---- | :------------ | :--------------------------------------- | :------------ | :--------------------------------------- |
| 1     | Resuscitation | Life-threatening                         | ✅ Yes        | Cardiac arrest, severe trauma            |
| 2     | Emergency     | High risk of deterioration               | ✅ Yes        | Chest pain, severe bleeding, active fire |
| 3     | Urgent        | Stable but requires multiple resources   | ❌ No         | Mild asthma, abdominal pain, minor burns |
| 4     | Early Care    | Non-urgent; requires simple intervention | ❌ No         | Minor fractures, sprains                 |
| 5     | Routine       | Non-emergency/primary care               | ❌ No         | Cold, small cuts, information requests   |

**Decision Factors:**

- Voice stress analysis
- Clinical indicators (breathing, consciousness, bleeding)
- Time-sensitive indicators
- Number of victims

---

### 2. Transfer & Resource Recommendation System

**2.1 Department Routing Logic**

```
IF incident_type = "fire" → JBPM (Fire & Rescue)
IF incident_type = "medical" → KKM (Health Ministry)
IF incident_type = "crime" → PDRM (Police)
IF incident_type = "disaster" → APM (Civil Defense)
IF location = "maritime" → MMEA (Maritime)
```

**2.2 Resource Allocation Algorithm** _(Placeholder)_

- **Input**: Urgency level, incident type, location, hazards
- **Output**: Ranked resource list with reasoning
- **Optimization**: Distance, availability, equipment suitability

---

### 3. Tool Calls Reference

#### Phase 1 Tools (AI Active)

| Tool                   | Trigger        | Purpose           | Data Captured                                                             |
| :--------------------- | :------------- | :---------------- | :------------------------------------------------------------------------ |
| `updateAIProgressTool` | Every new info | Real-time updates | urgency, type, location, hazards, victims                                 |
| `assessUrgencyTool`    | After ~30s     | Final assessment  | urgency_level (1-5: 1=Resuscitation, 5=Routine), should_transfer, summary |

#### Phase 2 Tools (AI Shadow)

| Tool                      | Trigger                 | Purpose         | Data Captured                            |
| :------------------------ | :---------------------- | :-------------- | :--------------------------------------- |
| `updateIncidentFieldTool` | Dispatcher conversation | Precise updates | field, value, confidence, source         |
| `detectVisualHazardTool`  | Video feed              | Hazard tracking | hazard_type, severity, location_in_frame |

**Tool Call Flow Diagram:**

```
Caller → Phase 1 AI
         ↓ updateAIProgress (3-5× during call)
         ↓ assessUrgency
         → Transfer Decision
            ↓ (if urgency ≤ 2: Resuscitation/Emergency)
            Phase 2 Dispatcher + AI Shadow
            ↓ updateIncidentField (continuous)
            ↓ detectVisualHazard (video events)
            → Resource Approval
               ↓
               Phase 3 Dispatch
```

---

## 🌐 Multilingual Support

All phases support:

- Bahasa Malaysia / Bahasa Pasar (colloquial Malay)
- Manglish (Malaysian English)
- Mandarin
- Tamil
- English

**Translation Layer:**

- Language detection
- Real-time transcription translation
- Chat bidirectional translation

---

## Tech Stack

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + Shadcn UI + Radix UI
- **State Management**: Zustand with persistence
- **AI Models**: Google Gemini API (`@google/genai`)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Gemini API Key (from Google AI Studio)
- Google Maps API Key
- Firebase API Key

### Quick Start

```bash
# Clone and install
git clone https://github.com/yourusername/whateverclicks.git
cd whateverclicks
npm install

# Run development server
npm run dev
```

### Set up environment variables

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
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```
