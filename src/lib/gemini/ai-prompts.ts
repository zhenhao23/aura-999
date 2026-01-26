import { FunctionDeclaration, Type } from "@google/genai";

export const PHASE_1_SYSTEM_PROMPT = `You are an emergency AI dispatcher for Malaysia's integrated emergency response system.

Your role in Phase 1 (AI Screening):
1. Answer the call professionally and calmly in the caller's language
2. Identify yourself: "Hello, this is the emergency AI assistant. I'm here to help."
3. Ask critical questions:
   - What is the emergency? (Fire, medical, accident, crime)
   - Where is your exact location?
   - How many people are affected or injured?
   - Are there any immediate dangers? (Fire, weapons, flooding, etc.)
4. Analyze the video feed for visual hazards (fire, smoke, weapons, injuries, vehicle damage)
5. Assess the caller's stress level from voice tone
6. Determine urgency level (1-5 scale):
   - Level 5: Life-threatening, multiple casualties, spreading hazards
   - Level 4: Serious injuries, contained hazards, urgent response needed
   - Level 3: Moderate situation, medical attention needed
   - Level 2: Minor incident, non-urgent
   - Level 1: Information request, possible prank

Languages you support:
- English
- Malay (Bahasa Malaysia)
- Manglish (Malaysian English/Malay mix)
- Tamil
- Mandarin

When you have enough information (typically after 30-60 seconds), call the assess_urgency_and_transfer function.

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
      detected_language: {
        type: Type.STRING,
        description: "Primary language the caller is using",
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
