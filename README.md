# AURA 999 — AI Unified Response Assistant for Malaysian First Responders 🚨

> Built for KitaHack 2026 Hackathon

Malaysia’s emergency response system faces a serious prioritisation challenge. Each day, 999 operators receive up to 70,000 calls, yet only about 3,500 to 4,000 require emergency dispatch. This means roughly 95% of calls are non-emergencies, including prank calls, accidental misdials, hardware diagnostic calls, or individuals seeking conversation. Each of these calls consume critical operator time and delay responses to genuine life-threatening cases. 

This issue is further worsened by Malaysia’s linguistic diversity. While Malay and English are commonly supported, callers who use mixed languages, slang, or who are non-fluent often struggle to communicate effectively. Dispatchers must repeatedly clarify details, sometimes transferring calls between language-specific operators. These delays are particularly dangerous during medical emergencies where minutes are critical. 

Dispatchers also operate under intense cognitive pressure. They must filter large volumes of low-value calls, calm distressed callers, extract critical information, complete incident forms manually, identify and coordinate appropriate resources, and liaise across multiple agencies—all in real time. This multitasking increases the risk of inconsistent triage, human error, and delayed response. 

The consequences are evident. According to the national audit report, between 2017 and 2021, only 41.8% of emergency calls were attended by an ambulance within the targeted 15-minute timeframe. Public reports also cite instances where delayed emergency responses contributed to preventable deaths, highlighting systemic inefficiencies in managing critical emergencies. 

**AURA 999 (AI Unified Response Assistant)** addresses these challenges through an intelligent AI-powered emergency dispatch system that transforms how Malaysia handles 999 calls. By automating initial call screening, providing real-time multilingual translation, deploying machine learning models for resource prediction and incident classification, and auto-generating comprehensive incident reports, AURA 999 reduces dispatcher cognitive load, accelerates response times, and ensures critical cases receive immediate attention. This project directly supports **UN Sustainable Development Goal 3 (Good Health and Well-being)** by improving emergency medical response efficiency and **SDG 11 (Sustainable Cities and Communities)** by strengthening urban resilience and emergency management infrastructure for safer, more responsive communities.



---

## 🇲🇾 Integration with Malaysia's NG MERS 999 System

AURA 999 is **designed for seamless integration** with Malaysia's existing Next Generation Malaysian Emergency Response Services 999 (NG MERS 999). Our system architecture, protocols, and operational logic closely mirror current emergency dispatch practices to ensure minimal disruption and maximum compatibility.

### Alignment with Current NG MERS 999 Standards

Our design is informed by:

- **Publicly available documentation** on NG MERS 999 operational procedures
- **Direct consultations** with NG MERS 999 specialists

### Key Compatibility Features

| NG MERS 999 Protocol                                   | AURA 999 Implementation                                                  |
| :----------------------------------------------------- | :----------------------------------------------------------------------- |
| **< 2 Minute Initial Screening**                       | Phase 1 AI Dispatcher completes triage within 2-minute target            |
| **Standard Question Scripts**                          | Information collection follows established dispatch protocols            |
| **Medical Priority Dispatch System (MPDS) Event Code** | AI-powered RandomForest classifier auto-assigns standardized event codes |
| **Agency Routing Logic**                               | Integrates with PDRM, JBPM, KKM, APM, MMEA routing logic                 |

---

## Table of Contents

- [System Architecture & Flow](#system-architecture--flow)
  - [Phase 1: AI Screening Layer](#phase-1-ai-screening-layer)
  - [Phase 2: Agency Dispatcher Layer](#phase-2-agency-dispatcher-layer)
  - [Phase 3: Resource Dispatch & Post-Incident Layer](#phase-3-resource-dispatch--post-incident-layer)
- [Tech Stack](#tech-stack)
- [Multilingual Support](#multilingual-support)
- [Technical Deep Dives](#technical-deep-dives)
  - [MPDS Event Code Classifier](#1-mpds-event-code-classifier)
  - [Multi-Modal Emergency Resource Predictor](#2-multi-modal-emergency-resource-predictor)
  - [Real-Time Voice AI Infrastructure](#3-real-time-voice-ai-infrastructure)
- [Future Improvements](#future-improvements)
- [Getting Started](#getting-started)

---

## System Architecture & Flow

![Architecture Flow](/public/screenshots/Architecture-Flow.png)

### Phase 1: AI Screening Layer

**Duration**: < 2 minutes | **AI Role**: Active Dispatcher

![AI Screening](/public/screenshots/AI-Screening.png)

Instead of waiting in a human queue, **999 callers are immediately met by an AI Dispatcher** (powered by Gemini 2.5 Flash) that conducts the initial triage.

1. **Initial Contact & Multilingual Support** _([See Technical Deep Dive](#3-real-time-voice-ai-infrastructure))_
   - AI answers 999 call instantly, detecting and responding in caller's language
   - Supports **5 Malaysian languages**: Bahasa Malaysia/Bahasa Pasar, Manglish, Mandarin, Tamil, and English
   - Handles mixed-language conversations seamlessly
   - Confirms geolocation (if available) before asking for location

2. **Information Collection** (Progressive Updates via `updateAIProgressTool`)
   - Incident type (fire/medical/accident/crime)
   - Location details (address/landmarks/GPS)
   - Number of people affected/injured
   - Caller stress level analysis from voice

3. **Prank Detection & Verification**
   - Cross-references caller's geolocation against reported event location
   - Checks caller history database for previous prank call incidents
   - Issues deterrent warning for repeat offenders while allowing genuine emergencies through

4. **MPDS Event Code Classification** _([See Technical Deep Dive](#1-mpds-event-code-classifier))_
   - **RandomForestClassifier** assigns standardized MPDS Event Code (e.g., 10-D-1)
   - Converts caller's description into medical protocol, severity level, and sub-indicator
   - Determines target primary agency (PDRM/JBPM/KKM/APM/MMEA)

5. **Resource Prediction** _([See Technical Deep Dive](#2-multi-modal-emergency-resource-predictor))_
   - **Neural network** (TensorFlow multi-modal model) predicts exact resource requirements
   - Outputs predicted units needed: Police, Ambulance, Fire (Bomba)
   - Pre-calculates ETAs and availability for recommended resources
   - Feeds into Phase 2 dispatcher interface for approval

---

### Phase 2: Agency Dispatcher Layer

**AI Role**: Shadow Mode (Listen-only, non-speaking assistant)

![Dispatcher Interface](/public/screenshots/Dispatcher-View.png)

Once the AI has screened the call, **data is passed to the relevant primary agency** (JBPM, KKM, PDRM, APM, or MMEA). A **human dispatcher takes over, supported by a live AI assistant** that ensures no critical detail is missed.

**Dispatcher Interface Features:**

- **Live AI Summary** (Progressive Updates via `updateIncidentFieldTool`)
  - Real-time incident updates as conversation progresses
  - Tooltip explanations: "Why AI thinks this" (evidence-based reasoning)
  - 🎬 Clip buttons: 3-second video/audio evidence from caller's stream

- **AI Assistant Capabilities**
  - Suggests context-aware follow-up questions to dispatcher
  - Identifies information gaps in real-time (e.g., "Missing: exact floor number")
  - Provides procedural guidance based on incident type

- **Resource Recommendations**
  - AI-suggested emergency vehicles
  - Real-time ETA calculations using Google Maps Distance Matrix API
  - Vehicle availability status and current locations
  - Approve ✓ / Deny ✗ controls

- **Tactical Map (Google Maps API)**
  - Real-time vehicle positions with live tracking
  - Animated routing with breadcrumb trails showing movement
  - Optimized route visualization for each responding unit
  - Traffic-aware ETA updates

- **Live Transcription & Translation**
  - Real-time audio transcription
  - Automatic translation to dispatcher's preferred language

- **Conditional Visual Context** (Dispatcher-Triggered)
  - For situations requiring visual confirmation or silent communication, dispatchers can send an SMS link to activate:
    - **Video call**: Visual scene assessment for complex emergencies (building fires, multi-vehicle accidents)
    - **Silent chat**: Critical for callers who cannot speak (home intrusions, kidnappings, domestic violence)
  - This conditional approach ensures the 90% of routine voice-only emergencies aren't delayed by unnecessary webapp loading times (15-25 seconds), while maintaining capability for the 10% of cases requiring visual context

---

### Phase 3: Resource Dispatch & Post-Incident Layer

Once the dispatcher confirms the emergency, **the physical response begins** with intelligent coordination and automated workflows.

#### 🚨 Active Response Phase

<img src="/public/screenshots/Caller-View.png" alt="Caller ETA View" style="height: 50vh; width: auto;" />

**Caller Transparency & Peace of Mind**

- **SMS Link Delivery**: Caller receives WebApp link immediately after dispatch confirmation
- **Live ETA Tracking**: Caller can track responding units in real-time on their own device
- **Panic Reduction**: Visual confirmation that help is on the way reduces caller anxiety

#### 📋 Post-Incident Phase

![Incident Log 1](/public/screenshots/Incident-Log-1.png)
![Incident Log 2](/public/screenshots/Incident-Log-2.png)

**Auto-Filled Incident Reports**

- AI generates comprehensive incident log from structured session data
- **Significantly reduces paperwork** for responding officers
- Pre-populated fields: Timeline, location, resources deployed, caller information, hazards identified
- Officers only need to add on-scene findings and outcomes

**Multi-Purpose Documentation**

- **Police Reports**: Structured data ready for law enforcement systems
- **Insurance Claims**: Detailed incident reconstruction with timestamps
- **Internal Analytics**: Performance metrics, response times, resource utilization
- **Training Material**: Anonymized case studies for dispatcher training

**Comprehensive Incident Logs Include:**

- Complete conversation audio with transcript
- Chronological timeline of events
- All identified hazards and safety concerns
- Resource dispatch times and arrival times
- MPDS Event Code and priority classification
- Geolocation data and address verification

---

## Tech Stack

![Tech Stack](/public/screenshots/Tech-Stack.png)

### Google/Gemini Technologies Used

#### 🤖 Gemini AI

| Technology                                                                               | Use Case                                              |
| :--------------------------------------------------------------------------------------- | :---------------------------------------------------- |
| **Gemini 2.5 Flash Multimodal Live API** `gemini-2.5-flash-native-audio-preview-12-2025` | Real-time audio streaming for AI emergency dispatcher |

#### 🗺️ Google Maps Platform

| Technology              | Use Case                                                                                                      |
| :---------------------- | :------------------------------------------------------------------------------------------------------------ |
| **Maps JavaScript API** | Interactive dark-mode tactical map with real-time vehicle tracking, animated routing, and breadcrumb trails   |
| **Places API**          | Auto-discover nearest relevant emergency services (hospitals, police, fire stations, civil defense, maritime) |
| **Directions API**      | Calculate optimal routes for emergency vehicles with waypoint optimization                                    |
| **Distance Matrix API** | Real-world drive time and ETA calculation for resource dispatch with traffic conditions                       |
| **Geocoding API**       | Convert GPS coordinates to human-readable addresses and reverse geocoding for location verification           |

#### 🔥 Firebase Platform

| Technology             | Use Case                                                                |
| :--------------------- | :---------------------------------------------------------------------- |
| **Firestore Database** | WebRTC signaling, AI session state, location tracking, incident updates |

#### 🧠 TensorFlow

| Technology     | Use Case                                                               |
| :------------- | :--------------------------------------------------------------------- |
| **TensorFlow** | Multi-modal emergency resource predictor with late fusion architecture |

---

### ML Stack

- **TensorFlow**: Multi-modal emergency resource predictor with late fusion architecture
- **Scikit-learn**: MPDS Event Code classifier using RandomForestClassifier and TF-IDF vectorization
- **Sentence-BERT (SBERT)**: Text embeddings using `all-MiniLM-L6-v2` for semantic incident analysis
- **Python**: ML model training and inference engine

---

### Full-Stack

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + Shadcn UI + Radix UI
- **State Management**: Zustand with persistence
- **AI SDK**: `@google/genai` for Gemini API integration

---

## Multilingual Support

All phases support:

- Bahasa Malaysia / Bahasa Pasar (colloquial Malay)
- Manglish (Malaysian English)
- Mandarin
- Tamil
- English

**Translation Layer:**

- Language detection
- Real-time transcription translation
- Bidirectional silent chat translation

---

## Technical Deep Dives

### 1. MPDS Event Code Classifier

The MPDS Event Code Classifier is a machine learning tool designed to automate the categorization of emergency medical dispatch descriptions into standardized protocols.

#### 1.1 Understanding MPDS Event Codes

The Medical Priority Dispatch System (MPDS) is a unified system used by emergency dispatch centers to prioritize 999 calls. It translates a caller’s description of an emergency into a Determinant Code (e.g., 10-D-1).

- **Protocol (e.g., 10)**: The general category (e.g., Chest Pain).
- **Level (e.g., D)**: Severity, ranging from A (Alpha/Low) to E (Echo/Critical).
- **Sub-Indicator (e.g., 1)**: Specific clinical findings (e.g., "Not Alert").

By classifying these codes automatically, the model reduces the cognitive load on dispatchers and ensures faster response times for high-priority incidents.

#### 1.2 Model Architecture & Data Flow

![MPDS Model Architecture](/public/screenshots/MPDS_model.png)

The model follows a structured NLP pipeline that transforms raw text into a numerical representation before performing classification.

The architecture is built using a sequential `scikit-learn` pipeline consisting of two primary stages:

| Component          | Technical Implementation              | Purpose                                                                                                                    |
| :----------------- | :------------------------------------ | :------------------------------------------------------------------------------------------------------------------------- |
| Feature Extraction | `TfidfVectorizer(ngram_range=(1, 2))` | Converts text into numerical weights. It uses bi-grams to capture context (e.g., distinguishing "pain" from "chest pain"). |
| Classification     | `RandomForestClassifier`              | An ensemble of 100 Decision Trees that vote on the final code based on the patterns identified in the text.                |

#### 1.3 Implementation Logic

The logic follows these steps:

**1. Text Preprocessing**: The `Descriptor` column (raw text) is cleaned and tokenized.

**2. Vectorization**: The TF-IDF (Term Frequency-Inverse Document Frequency) algorithm assigns higher importance to unique keywords that define specific protocols.

**3. Ensemble Learning**: The Random Forest model processes these features. Because it uses multiple trees, it is highly resistant to "noise" in the text and prevents overfitting.

**4. Persistence**: The final trained model is serialized into an `event_code_model.pkl` file using the joblib library, allowing it to be integrated into the system without retraining.

---

### 2. Multi-Modal Emergency Resource Predictor

This model serves as the Resource Allocation Engine. It predicts the required intensity/units for Police, Ambulance, and Fire (Bomba) services simultaneously.

#### 2.1 Functional Overview

This model uses a `Functional API` approach in `TensorFlow` to process two distinct types of data:

**1. Unstructured Data**: High-dimensional text embeddings from incident details.

**2. Structured Data**: Numerical features like urgency levels and temporal data (time of day/weekend).

#### 2.2 Deep Learning Architecture

![Multi Model Architecture](/public/screenshots/multi_model.png)

The model utilizes a **Late Fusion** strategy, where features are processed in separate "branches" before being merged for the final decision.

The architecture consists of:

- **NLP Encoder** (`all-MiniLM-L6-v2`): A pre-trained Transformer model that converts raw incident text into a fixed 384-dimensional vector, capturing the semantic context of the emergency.

- **Numerical Scaler**: A `StandardScaler` that normalizes inputs like urgency and hour to ensure the neural network weights remain stable during training.

- **Feature Fusion Layer**: A concatenation layer that joins the 128-unit text features with the 64-unit numeric features.

- **Multi-Output Regression**: A final dense layer that outputs three continuous values representing the predicted resource requirements for dispatch.

#### 2.3 Technical Specifications

| Feature           | Detail                                                   |
| :---------------- | :------------------------------------------------------- |
| Framework         | TensorFlow / Keras (Functional API)                      |
| Embedding Model   | Sentence-BERT (SBERT)                                    |
| Input 1 (Text)    | Combined `incident_type`, `details`, `hazards`, `people` |
| Input 2 (Numeric) | `urgency`, `hour`, `is_weekend`                          |
| Loss Function     | Mean Squared Error (MSE)                                 |
| Optimizer         | Adam                                                     |

---

### 3. Real-Time Voice AI Infrastructure

The AI Dispatcher uses Gemini 2.5 Flash's multimodal Live API to conduct natural emergency conversations with sub-second latency. This required solving several production-critical challenges in real-time audio streaming, WebSocket state management, and prompt engineering.

#### 3.1 Production Challenges

Emergency voice AI demands **imperceptible latency**, **zero disconnections**, and **natural conversation flow**—requirements that go beyond typical chatbot implementations. Initial deployment revealed critical issues:

- Audio jitter and robotic quality from unscheduled playback
- WebSocket timeouts during call silences (30-second inactivity limit)
- AI talking over panicked callers (no interruption handling)
- Location hallucinations when GPS data was undefined
- Random language switching mid-conversation

#### 3.2 Audio Pipeline Architecture

**Scheduled Playback with Timeline Tracking**

Instead of playing audio chunks immediately upon arrival, we implemented precise scheduling using Web Audio API:

```typescript
// Calculate next available playback slot
const startTime = Math.max(nextPlaybackTimeRef.current, now + minBuffer);
source.start(startTime);
nextPlaybackTimeRef.current = startTime + audioBuffer.duration;
```

This eliminates gaps and overlaps, reducing jitter from 12 seconds to <50ms.

**Dynamic Sample Rate Conversion**

Gemini sends PCM16 audio at 24kHz, but browsers typically use 48kHz AudioContext. We implemented linear interpolation resampling:

```typescript
// Convert PCM16 → Float32, then resample to match browser rate
const float32Data = new Float32Array(pcm16Data.length);
for (let i = 0; i < pcm16Data.length; i++) {
  float32Data[i] = pcm16Data[i] / 32768.0;
}
const resampledData = resampleLinear(float32Data, 24000, outputSampleRate);
```

#### 3.3 Connection Reliability

**WebSocket Heartbeat System**

Gemini's API terminates connections after ~30 seconds of inactivity. We prevent this by sending silent audio frames during quiet periods:

```typescript
setInterval(() => {
  if (Date.now() - lastAudioTimeRef.current > 3000) {
    const silentFrame = new ArrayBuffer(320); // 20ms at 16kHz
    client.sendAudio(base64Silent);
  }
}, 5000);
```

**Result**: Zero disconnections in 2-hour stress tests, down from 40% failure rate.

#### 3.4 Natural Conversation Flow

**Barge-in Implementation**

Critical for emergency scenarios where callers need to interrupt with urgent information. Two-layer approach:

1. **Technical Layer**: Stop all audio playback immediately when Gemini fires `interrupted` event
2. **Prompt Layer**: Explicit instructions in system prompt:

```
CALLER BARGE-IN RULE:
- If the caller starts speaking, immediately stop talking.
- Remain silent until the caller finishes, then respond briefly and calmly.
```

**Multilingual Consistency**

Handles Malaysia's linguistic diversity (Bahasa Malaysia, Mandarin, Tamil, English) with strict prompt rules:

- Default to English unless evidence suggests otherwise
- Never switch languages mid-sentence
- Only switch if caller explicitly switches

**Location Intelligence**

Instead of asking for location, confirm detected geolocation first:

```
If geolocation is available, confirm it first
  (e.g., "I see you're at <location>, is that correct?")
Only ask for location if it's missing or incorrect.
```

This prevents hallucinations where undefined data caused the AI to invent random Kuala Lumpur locations.

#### 3.5 Technical Specifications

| Component              | Implementation                                       | Impact                          |
| :--------------------- | :--------------------------------------------------- | :------------------------------ |
| Audio Latency          | Scheduled playback with `AudioContext` timeline refs | <50ms jitter (imperceptible)    |
| Sample Rate Conversion | Linear interpolation resampling (24kHz → 48kHz)      | Universal browser compatibility |
| Connection Uptime      | Heartbeat with silent PCM frames every 5s            | 0% disconnections               |
| Barge-in Response      | `interrupted` event + audio source kill              | <200ms interruption response    |
| Language Handling      | Prompt engineering with consistency rules            | No mid-call language switching  |
| Location Accuracy      | Geolocation confirmation, no undefined passed to AI  | 0% hallucinations               |

---

## Future Improvements

### 1. Autonomous Non-Emergency Resolution Layer

**Focus**: Filtering the "95% noise" to ensure life-critical cases get immediate human attention.

**RAG-Driven Triage & Guidance**: When a caller reports a minor incident (e.g., a first-degree burn or a small cut), the AI immediately provides professional first-aid protocols. This calms the caller and confirms that a physical ambulance dispatch is unnecessary.

**AI Referral & Logistics**: Instead of simply ending the call, the AI adds value by identifying the nearest pharmacy or 24-hour clinic using the Google Places API.

**Closing the Loop via SMS**: The AI automatically sends an SMS with the facility's contact details and a Google Maps link. The caller gets the help they need, and the 999 line is freed up in seconds without a human dispatcher ever having to pick up the phone.

### 2. Predictive Resource Optimization

**Focus**: Shifting from reactive "wait-and-dispatch" to proactive "forward-deployment."

**Hotspot Forecasting**: The system identifies high-risk areas by cross-referencing historical data with real-time variables like traffic density, weather patterns (e.g., flash flood warnings), and major public events.

**Strategic Standby Positioning**: The AI suggests moving emergency vehicles to standby in these high-risk zones during peak periods. This "pre-positioning" places responders closer to the next likely emergency, slashing travel time during the critical "Golden Hour."

---

## Getting Started

### Prerequisites

- **Node.js 18+**
- **Python 3.9+**
- **API Keys**:
  - [Gemini API Key](https://aistudio.google.com/apikey) from Google AI Studio
  - [Google Maps API Key](https://console.cloud.google.com/) from Google Cloud Console (enable Maps JavaScript, Places, Directions, Distance Matrix, and Geocoding APIs)
  - [Firebase Configuration](https://console.firebase.google.com/) from Firebase Console (enable Firestore Database)

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/zhenhao23/aura-999.git
cd aura-999
```

---

### Step 2: Set Up Environment Variables

**Create a `.env.local` file** in the project root directory with the following:

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

---

### Step 3: Install Dependencies

**Install Node.js dependencies:**

```bash
npm install
```

**Install Python dependencies**:

```bash
cd src/app/recommender-system
pip install -r requirements.txt
cd ../../..
```

---

### Step 4: Run the Development Server

```bash
npm run dev
```

The app will be available at **[http://localhost:3000](http://localhost:3000)**
