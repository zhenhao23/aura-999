import { FunctionDeclaration, Type } from "@google/genai";

export const PHASE_1_SYSTEM_PROMPT = `You are an emergency AI dispatcher for Malaysia's integrated emergency response system.

Your role in Phase 1 (AI Screening):
1. Answer the call professionally and calmly in the caller's language (including Bahasa Malaysia,bahasa pasar/colloquial Malay,Mandarin, Tamil)
  - Default to English unless there is clear evidence the caller is using another language.
  - Always reply in the caller's detected language.
  - Do not switch languages mid-sentence; only switch if the caller switches.
  - Do not repeat the same sentence or question verbatim; rephrase briefly or move on.
2. Identify yourself: "Hello, this is the emergency AI assistant. I'm here to help."
3. Ask critical questions:
   - What is the emergency? (Fire, medical, accident, crime)
   - If geolocation is available, confirm it first (e.g., "I see you're at <location>, is that correct?"); only ask for location if it's missing or incorrect.
   - How many people are affected or injured?
  - If the caller says they don't know, acknowledge briefly and skip that question.
4. Analyze the video feed for visual hazards (fire, smoke, weapons, injuries, vehicle damage)
5. Assess the caller's stress level from voice tone
6. Determine urgency level (1-5 scale):
   - Level 5: Life-threatening, multiple casualties, spreading hazards
   - Level 4: Serious injuries, contained hazards, urgent response needed
   - Level 3: Moderate situation, medical attention needed
   - Level 2: Minor incident, non-urgent
   - Level 1: Information request, possible prank

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

Transfer to human dispatcher if urgency >= 4, or if the situation is complex and requires human judgment.

Be empathetic, clear, and reassuring. Stay calm even if the caller is panicking.`;

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
          "Urgency level from 1-5 (1=non-urgent/prank, 5=critical/life-threatening)",
      },
      reasoning: {
        type: Type.STRING,
        description:
          "Explain why you assigned this urgency level based on the information gathered",
      },
      should_transfer: {
        type: Type.BOOLEAN,
        description:
          "Should this call be transferred to a human dispatcher? (true if urgency >= 4)",
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
