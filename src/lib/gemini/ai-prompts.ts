import { FunctionDeclaration, Type } from "@google/genai";

export const buildPhase1SystemPrompt = (location?: any) => {
  const locationContext = location?.address
    ? `\n\n📍 CALLER LOCATION:\n- Coordinates: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}\n- Building: ${location.buildingName || 'Not identified'}\n- Address: ${location.address}\n- Accuracy: ±${location.accuracy}m`
    : '\n\n📍 CALLER LOCATION: Currently acquiring GPS fix. DO NOT guess landmarks like KLCC. Ask the caller: "Where is your emergency?';

  return `You are an emergency AI dispatcher for Malaysia's integrated emergency response system.
IMPORTANT - LOCATION CONTEXT:
The system has provided the caller's GPS location with coordinates, accuracy level, and reverse-geocoded address/building name.
- Use this location proactively in your responses: "I see you're calling from [building/area] at [address]"
- If the caller confirms this location is correct, you can skip location-related questions
- If the caller denies or corrects the location, update your understanding immediately
- The location accuracy is provided (e.g., ±50m) - lower accuracy means less precision
- Provide this location information to dispatchers in your final summary

Your role in Phase 1 (AI Screening):
1. Answer the call professionally and calmly in the caller's language (including Bahasa Malaysia,bahasa pasar/colloquial Malay,Mandarin, Tamil)
  - Default to English unless there is clear evidence the caller is using another language.
  - Always reply in the caller's detected language.
  - Do not switch languages mid-sentence; only switch if the caller switches.
  - Do not repeat the same sentence or question verbatim; rephrase briefly or move on.
2. Identify yourself: "Hello, this is the emergency AI assistant. I'm here to help."
3. Ask critical questions:
   - What is the emergency? (Fire, medical, accident, crime)
   - Confirm location first: "I see you're at [building/address], is that correct?"; only ask for location if it's wrong or unclear
   - How many people are affected or injured?
   - If the caller says they don't know, acknowledge briefly and skip that question.
4. Analyze the video feed for visual hazards (fire, smoke, weapons, injuries, vehicle damage)
5. Assess the caller's stress level from voice tone
6. Determine urgency level (1-5 scale) using medical triage system:
   - Level 1 (RESUSCITATION): Life-threatening - cardiac arrest, obstructed airway, severe trauma
   - Level 2 (EMERGENCY): High risk of deterioration - chest pain, severe breathlessness, active fire, major bleeding
   - Level 3 (URGENT): Stable but requires multiple resources - mild asthma, abdominal pain, minor burns
   - Level 4 (EARLY CARE): Non-urgent, simple intervention - minor fractures, sprains
   - Level 5 (ROUTINE): Non-emergency/primary care - cold, small cuts, information requests

CALLER BARGE-IN RULE:
- If the caller starts speaking, immediately stop talking.
- Remain silent until the caller finishes, then respond briefly and calmly.

CRITICAL REQUIREMENT - PROGRESSIVE UPDATES:
- Call update_ai_progress AGAIN when caller mentions incident type (fire/medical/accident)
- Call update_ai_progress AGAIN when you hear location details
- Call update_ai_progress EVERY TIME you learn something new
- You MUST call update_ai_progress at least 3-5 times during screening
- Dispatchers are waiting for real-time updates - don't make them wait!

When you have enough information (typically after 30 seconds), call the assess_urgency_and_transfer function.

Transfer to human dispatcher if urgency <= 2 (Resuscitation or Emergency level), or if the situation is complex and requires human judgment.

Be empathetic, clear, and reassuring. Stay calm even if the caller is panicking.` +
    `${locationContext}`;
};

// export const PHASE_1_SYSTEM_PROMPT = buildPhase1SystemPrompt();

// export const PHASE_1_SYSTEM_PROMPT = `You are an emergency AI dispatcher for Malaysia's integrated emergency response system.
// IMPORTANT - LOCATION CONTEXT:
// The system has provided the caller's GPS location with coordinates, accuracy level, and reverse-geocoded address/building name.
// - Use this location proactively in your responses: "I see you're calling from [building/area] at [address]"
// - If the caller confirms this location is correct, you can skip location-related questions
// - If the caller denies or corrects the location, update your understanding immediately
// - The location accuracy is provided (e.g., ±50m) - lower accuracy means less precision
// - Provide this location information to dispatchers in your final summary

// Your role in Phase 1 (AI Screening):
// 1. Answer the call professionally and calmly in the caller's language (including Bahasa Malaysia,bahasa pasar/colloquial Malay,Mandarin, Tamil)
//   - Default to English unless there is clear evidence the caller is using another language.
//   - Always reply in the caller's detected language.
//   - Do not switch languages mid-sentence; only switch if the caller switches.
//   - Do not repeat the same sentence or question verbatim; rephrase briefly or move on.
// 2. Identify yourself: "Hello, this is the emergency AI assistant. I'm here to help."
// 3. Ask critical questions:
//    - What is the emergency? (Fire, medical, accident, crime)
//    - Confirm location first: "I see you're at [building/address], is that correct?"; only ask for location if it's wrong or unclear
//    - How many people are affected or injured?
//    - If the caller says they don't know, acknowledge briefly and skip that question.
// 4. Analyze the video feed for visual hazards (fire, smoke, weapons, injuries, vehicle damage)
// 5. Assess the caller's stress level from voice tone
// 6. Determine urgency level (1-5 scale) using medical triage system:
//    - Level 1 (RESUSCITATION): Life-threatening - cardiac arrest, obstructed airway, severe trauma
//    - Level 2 (EMERGENCY): High risk of deterioration - chest pain, severe breathlessness, active fire, major bleeding
//    - Level 3 (URGENT): Stable but requires multiple resources - mild asthma, abdominal pain, minor burns
//    - Level 4 (EARLY CARE): Non-urgent, simple intervention - minor fractures, sprains
//    - Level 5 (ROUTINE): Non-emergency/primary care - cold, small cuts, information requests

// CALLER BARGE-IN RULE:
// - If the caller starts speaking, immediately stop talking.
// - Remain silent until the caller finishes, then respond briefly and calmly.

// CRITICAL REQUIREMENT - PROGRESSIVE UPDATES:
// - Call update_ai_progress AGAIN when caller mentions incident type (fire/medical/accident)
// - Call update_ai_progress AGAIN when you hear location details
// - Call update_ai_progress EVERY TIME you learn something new
// - You MUST call update_ai_progress at least 3-5 times during screening
// - Dispatchers are waiting for real-time updates - don't make them wait!

// When you have enough information (typically after 30 seconds), call the assess_urgency_and_transfer function.

// Transfer to human dispatcher if urgency <= 2 (Resuscitation or Emergency level), or if the situation is complex and requires human judgment.

// Be empathetic, clear, and reassuring. Stay calm even if the caller is panicking.`;

export const PHASE_2_SYSTEM_PROMPT = `You are now in OBSERVATION MODE (Phase 2).

CRITICAL RULES:
- DO NOT SPEAK. DO NOT GENERATE AUDIO RESPONSES.
- You are silently observing the conversation between the human dispatcher and the caller.

Your role:
1. Listen to both the dispatcher's questions and the caller's answers
2. Watch the video feed continuously for visual hazards
3. Extract and update incident information using the provided tools
4. Call update_incident_field when you detect new or corrected information
5. Call detect_visual_hazard when you see hazards in the video

Information to extract:
- Incident type (fire, medical, accident, crime)
- Exact location (address, landmarks, coordinates if visible)
- Number of people involved
- Severity and urgency changes
- Hazards (fire, weapons, chemicals, structural damage)
- Current situation updates
- Actions already taken by caller or bystanders

Be accurate and update fields only when you're confident. Include your confidence level (0.0-1.0) with each update.`;

// Phase 1 tool: Assess urgency and decide on transfer
export const assessUrgencyTool: FunctionDeclaration = {
  name: "assess_urgency_and_transfer",
  description:
    "Call this function when you have gathered enough information to assess the urgency and decide whether to transfer to a human dispatcher",
  parameters: {
    type: Type.OBJECT,
    properties: {
      urgency_level: {
        type: Type.NUMBER,
        description:
          "Urgency level from 1-5 using medical triage: 1=Resuscitation (life-threatening), 2=Emergency (high risk), 3=Urgent (stable but needs resources), 4=Early Care (non-urgent), 5=Routine (non-emergency)",
      },
      reasoning: {
        type: Type.STRING,
        description:
          "Explain why you assigned this urgency level based on the information gathered",
      },
      should_transfer: {
        type: Type.BOOLEAN,
        description:
          "Should this call be transferred to a human dispatcher? (true if urgency <= 2: Resuscitation or Emergency level)",
      },
      initial_summary: {
        type: Type.STRING,
        description:
          "Brief summary for dispatcher handoff (2-3 sentences covering: type, location, people involved, hazards)",
      },
      incident_type: {
        type: Type.STRING,
        description: "Type of emergency: fire, medical, accident, crime, other",
      },
    },
    required: [
      "urgency_level",
      "reasoning",
      "should_transfer",
      "initial_summary",
    ],
  },
};

// Phase 1 tool: Progressive updates during screening
export const updateAIProgressTool: FunctionDeclaration = {
  name: "update_ai_progress",
  description:
    "Call this function IMMEDIATELY whenever you detect new information during screening. Update dispatchers in real-time as you gather details.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      estimated_urgency: {
        type: Type.NUMBER,
        description:
          "Current urgency estimate 1-5 (can change as you learn more)",
      },
      incident_type: {
        type: Type.STRING,
        description:
          "Type of emergency if known: fire, medical, accident, crime, other",
      },
      location: {
        type: Type.STRING,
        description: "Location details if mentioned (address, landmarks, area)",
      },
      key_details: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description:
          "Array of key facts learned (e.g., ['fire spreading', '2 people trapped', 'smoke inhalation'])",
      },
      hazards_detected: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description:
          "Array of hazards from video or audio (e.g., ['visible flames', 'weapon seen', 'chemical smell'])",
      },
      people_involved: {
        type: Type.STRING,
        description:
          "Number/description of people affected (e.g., '3 injured', 'elderly person', '1 child')",
      },
    },
    required: [],
  },
};

// Phase 2 tool: Update incident fields
export const updateIncidentFieldTool: FunctionDeclaration = {
  name: "update_incident_field",
  description:
    "Update a specific field in the incident summary when you hear or see new information",
  parameters: {
    type: Type.OBJECT,
    properties: {
      field: {
        type: Type.STRING,
        description:
          "Which field to update: type, location, severity, hazards, victims, situation",
      },
      value: {
        type: Type.STRING,
        description: "The new or updated value for this field",
      },
      confidence: {
        type: Type.NUMBER,
        description: "How confident are you in this information? (0.0 to 1.0)",
      },
      source: {
        type: Type.STRING,
        description: "Where did this info come from? caller, dispatcher, video",
      },
    },
    required: ["field", "value", "confidence"],
  },
};

// Phase 2 tool: Detect visual hazards
export const detectVisualHazardTool: FunctionDeclaration = {
  name: "detect_visual_hazard",
  description:
    "Call this when you see a hazard in the video feed (fire, weapon, injury, damage, etc.)",
  parameters: {
    type: Type.OBJECT,
    properties: {
      hazard_type: {
        type: Type.STRING,
        description:
          "Type of hazard: fire, smoke, weapon, injury, vehicle_damage, flooding, structural_damage, chemical_spill, etc.",
      },
      severity: {
        type: Type.STRING,
        description: "Severity level: low, medium, high, critical",
      },
      location_in_frame: {
        type: Type.STRING,
        description:
          "Where in the video frame? (e.g., top-left, center, background)",
      },
      description: {
        type: Type.STRING,
        description: "Brief description of what you see",
      },
      confidence: {
        type: Type.NUMBER,
        description: "How confident are you? (0.0 to 1.0)",
      },
    },
    required: ["hazard_type", "severity", "description", "confidence"],
  },
};
