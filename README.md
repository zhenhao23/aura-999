# WhateverClicks — AI-Powered Emergency Dispatch System for Malaysian First Responders 🚨

> Built for KitaHack 2026 Hackathon

In Malaysia, 95% of 999 calls (3,500–4,000 daily) are non-emergencies—pranks, misdials, and information requests—forcing dispatchers to manually screen 70,000 calls across multiple dialects while genuine emergencies wait. This noise drowns out life-threatening situations: cardiac arrests, active fires, and severe trauma. The result? More than half of Priority 1 cases fail to receive timely care because the system can't instantly separate crises from chaos.

WhateverClicks is Malaysia's first AI-powered Emergency Dispatch Layer. We deploy multimodal AI to answer 999 calls in real-time, conducting triage in the caller's native language (Bahasa Malaysia, Manglish, Tamil, Mandarin), filtering 95% of non-emergencies within 2 minutes, and escalating critical cases immediately. After handoff, AI enters "shadow mode"—silently extracting details, detecting visual hazards, and updating dispatchers with timestamped evidence while Google Maps optimizes resource routing and ETAs.

Our end-to-end workflow transforms emergency response: intelligent triage eliminates noise, real-time resource tracking cuts response times, multilingual communication removes language barriers, and automated incident logs streamline post-incident reporting. When every second counts, WhateverClicks ensures dispatchers focus on what matters—saving lives.

---

## 🇲🇾 Integration with Malaysia's NG 999 System

WhateverClicks is **designed for seamless integration** with Malaysia's existing National Next Generation 999 Command Centre (NG 999). Our system architecture, protocols, and operational logic closely mirror current emergency dispatch practices to ensure minimal disruption and maximum compatibility.

### Alignment with Current NG 999 Standards

Our design is informed by:

- **Publicly available documentation** on NG 999 operational procedures
- **Research findings** from emergency services studies
- **Direct consultations** with NG 999 specialists and stakeholders

### Key Compatibility Features

| NG 999 Protocol                  | WhateverClicks Implementation                                      |
| :------------------------------- | :----------------------------------------------------------------- |
| **Priority Queueing System**     | Uses same 5-level urgency classification (Resuscitation → Routine) |
| **< 2 Minute Initial Screening** | Phase 1 AI completes triage within 2-minute target                 |
| **Standard Question Scripts**    | Information collection follows established dispatch protocols      |
| **Multi-Agency Coordination**    | Integrates with PDRM, JBPM, KKM, APM, MMEA routing logic           |

### Implementation Approach

WhateverClicks operates as an **intelligent pre-screening layer** that sits before human dispatchers, not a replacement system. This allows:

- **Gradual rollout**: Pilot testing in selected zones before nationwide deployment
- **Fallback capability**: Instant human takeover if AI encounters edge cases
- **Zero infrastructure overhaul**: Works with existing call management systems
- **Training efficiency**: Dispatchers already familiar with protocols and priority levels

By adhering to established NG 999 standards, WhateverClicks ensures a smooth transition path while delivering immediate operational benefits through AI-powered efficiency gains.

---

## Google/Gemini Technologies Used

### 🤖 Gemini AI

| Technology                                                                               | Use Case                                                                                                     |
| :--------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| **Gemini 2.5 Flash Multimodal Live API** `gemini-2.5-flash-native-audio-preview-12-2025` | Real-time audio/video streaming for AI emergency dispatcher                                                  |
| **Gemini 2.5 Flash (REST API)** `gemini-2.5-flash`                                       | Language detection and translation between 5 Malaysian languages (English, Malay, Manglish, Tamil, Mandarin) |

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

**Main Process Flow (Voice Call):**

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

**Alternative Flow (Silent Call Protocol):**

When caller cannot speak (hostage, domestic violence, medical incapacity):

1. **Silent Call Detection**
   - AI detects no voice response after initial greeting
   - Call is terminated following NG 999 protocol

2. **SMS Verification**
   - Automated SMS sent to caller's number:
     - "999 Emergency: Did you misdial? Reply 'NO' if you're in danger and can't speak."
   - Caller responds via text

3. **Text-Based Information Collection** (Same data, SMS interface, Progressive Updates via `updateAIProgressTool`)
   - AI agent conducts conversation via SMS in caller's language
   - Collects same critical information:
     - Incident type (fire/medical/accident/crime)
     - Location details (address/landmarks/GPS)
     - Number of people affected/injured
     - Special circumstances (can't speak, hidden, etc.)

4. **Urgency Assessment & Transfer**
   - AI classifies urgency using same `assessUrgencyTool`
   - Generates summary for human dispatcher
   - **Transfer to Phase 2**: Dispatcher receives text-based incident brief
   - From this point, flow continues identically to voice call protocol

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
| Kidnapping, break-in    | 💬 Chat (auto-translated)  | Gemini 2.5 Flash (REST API)   |
| Resource tracking       | 🗺️ Live ETA map for caller | Google Maps + Distance Matrix |

---

### Phase 3: Resource Dispatch & Journey Tracking

**Real-Time Monitoring:**

- Both caller and dispatcher see vehicle ETAs
- Google Maps integration with live vehicle positions
- Animated routing with breadcrumb trails

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

**2.2 MPDS Event Code Classifier**
The MPDS Event Code Classifier is a machine learning tool designed to automate the categorization of emergency medical dispatch descriptions into standardized protocols.

#### 2.2.1 Understanding MPDS Event Codes

The Medical Priority Dispatch System (MPDS) is a unified system used by emergency dispatch centers to prioritize 911 calls. It translates a caller’s description of an emergency into a Determinant Code (e.g., 10-D-1).

- **Protocol (e.g., 10)**: The general category (e.g., Chest Pain).
- **Level (e.g.,D)**: Severity, ranging from A (Alpha/Low) to E (Echo/Critical).
- **Sub-Indicator (e.g.,1)**: Specific clinical findings (e.g., "Not Alert").

By classifying these codes automatically, the model reduces the cognitive load on dispatchers and ensures faster response times for high-priority incidents.

#### 2.2.2 Model Architecture & Data Flow

![MPDS Model Architechture](/public/screenshots/MPDS_model.png)

The model follows a structured NLP pipeline that transforms raw text into a numerical representation before performing classification.

The architecture is built using a sequential `scikit-learn` pipeline consisting of two primary stages:

| Component          | Technical Implementation              | Purpose                                                                                                                    |
| :----------------- | :------------------------------------ | :------------------------------------------------------------------------------------------------------------------------- | --- |
| Feature Extraction | `TfidfVectorizer(ngram_range=(1, 2))` | Converts text into numerical weights. It uses bi-grams to capture context (e.g., distinguishing "pain" from "chest pain"). |     |
| Classification     | `RandomForestClassifier `             | An ensemble of 100 Decision Trees that vote on the final code based on the patterns identified in the text.                |

#### 2.2.3 Implementation Logic

The logic follows these steps:

**1. Text Preprocessing**: The `Descriptor` column (raw text) is cleaned and tokenized.

**2. Vectorization**: The TF-IDF (Term Frequency-Inverse Document Frequency) algorithm assigns higher importance to unique keywords that define specific protocols.

**3.Ensemble Learning**: The Random Forest model processes these features. Because it uses multiple trees, it is highly resistant to "noise" in the text and prevents overfitting.

**4. Persistence**: The final trained model is serialized into an `event_code_model.pkl` file using the joblib library, allowing it to be integrated into the system without retraining.

---

**2.3 Resource Allocation Algorithm** _(Placeholder)_

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

## 🚀 Future Improvements

### 1. AI-Handled Non-Emergency Inquiries (Priority 4-5)

For routine calls requiring no resource dispatch, AI can resolve inquiries independently without human dispatcher transfer, saving valuable dispatcher time:

**Information Requests with Location Intelligence:**

- Caller asks: _"Where is the nearest clinic?"_
  - AI performs real-time search using Google Places API
  - Provides clinic name, address, operating hours, phone number
  - Sends SMS with Google Maps link pinpoint for navigation
  - No dispatcher involvement needed

**Professional Safety Guidance via RAG:**

- Caller reports: _"My cooking oil pan caught fire, what do I do?"_
  - AI accesses emergency procedures knowledge base
  - Provides step-by-step instructions: Turn off heat, cover pan with lid/wet towel, DO NOT use water
  - Confirms situation is under control before ending call
  - Escalates to Phase 2 if fire spreads beyond pan

**Automated Station Notification (No Human Dispatcher):**

- Caller reports: _"Minor fender bender at traffic light, no injuries, cars still drivable"_
  - AI classifies as Priority 5 (non-urgent report)
  - Automatically logs incident and notifies nearest police station via internal system
  - Provides caller with report reference number for insurance claims
  - Advises on safe vehicle removal procedures
  - Dispatcher freed to handle genuine emergencies

**Impact**: Reduces dispatcher workload, allowing focus on Priority 1-2 cases.

### 2. Prank Call Mitigation Strategy

**Why We Don't Use Automated Detection:**

While other countries employ technical detection methods, the risk of misclassifying genuine emergencies is still possible:

- 🇮🇱 **Israel**: Background laughter detection, description inconsistency analysis
- 🇺🇸 **United States**: Geolocation mismatch with stated location, caller ID cross-verification for suspicious patterns
- 🇬🇧 **UK/Europe**: Multiple calls about same incident increase credibility scoring

**Problem**: A trauma victim might laugh nervously from shock. A domestic violence caller might hide their real location. GPS can fail indoors. These methods could deny help to those who need it most.

**Our Approach: Behavioral Deterrence + Post-Call Accountability**

Instead of blocking calls, we trust the caller first and deter abuse through consequences:

**Phase 1 AI Deterrence:**

1. **Personalized warning**: "Hello [Caller Name], we've detected you're calling from [Location]. This is 999 Emergency Services. Prank calls are prosecuted under Section 233 of the Communications and Multimedia Act, with penalties up to RM50,000 or 1 year imprisonment. Do you confirm this is a real emergency?"
2. **Psychological effect**: Knowing the system has their identity and location discourages non-serious callers from proceeding
3. **Second chance**: Allows genuine callers to proceed, filters out most prank attempts upfront

**Repeat Offender System:**

- **Caller history database**: Track phone numbers flagged for previous prank calls
- **Risk scoring**: 1 prank = yellow flag, 2+ pranks = red flag
- **Dispatcher contextual alerts**: "Caller has 3 prior prank call incidents. Request additional verification."
- **Enhanced interrogation**: Dispatchers ask detailed questions to probe narrative consistency
  - "What color is the smoke?" "Which direction did the vehicle flee?" "What is the victim wearing?"
- **Legal follow-up**: Confirmed repeat offenders receive police visits and formal warnings

**Trust-First Philosophy**: We accept some prank calls will slip through rather than risk denying help to someone in genuine danger.

### 3. Smart Traffic Integration (STARS)

- Deploy **STARS** (Smart Traffic Analytics & Recognition System) in pilot cities (Ipoh, etc.)
- Implement **"Green wave" coordination** for emergency vehicles with priority traffic light sequencing
- Real-time route optimization based on traffic conditions

### 4. Post-Major Incident Public Alerting

- **Civilian notifications**: Automated alerts to affected/nearby areas via SMS/app push
- **Official information dissemination**: Auto-generate incident reports for government channels and social media
- **Misinformation prevention**: Ensure public receives accurate information faster than third-party sources

---

## Tech Stack

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + Shadcn UI + Radix UI
- **State Management**: Zustand with persistence
- **AI Models**: Google Gemini API (`@google/genai`)

---

## Getting Started

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
