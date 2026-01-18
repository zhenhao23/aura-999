import { Incident } from "@/types/incident";

// Mock incident data for demo purposes
export const MOCK_INCIDENTS: Incident[] = [
  {
    id: "inc-001",
    timestamp: new Date(),
    location: {
      lat: 3.1095,
      lng: 101.618,
      address: "Section 13, Petaling Jaya, Selangor",
    },
    urgency: "very-urgent",
    category: "accident",
    summary: "Multi-vehicle accident at Section 13 intersection",
    aiAnalysis: {
      detectedHazards: [
        "Vehicle damage",
        "Road blockage",
        "Fuel leak detected",
        "Multiple people injured",
      ],
      victimCount: 3,
      confidence: 0.94,
      reasoning:
        "AI detected multiple vehicle collision with visible damage, fuel leak signatures, and audio analysis shows 3 distinct voices calling for help with elevated stress markers (85/100)",
      videoTimestamp: 15,
      thermalSignatures: false,
      audioStressLevel: 85,
    },
    callerInfo: {
      name: "Ahmad bin Abdullah",
      phone: "+60123456789",
      language: "Malay",
    },
    status: "pending",
    videoUrl: "/demo-video.mp4",
    transcript:
      "Ya Allah! Kemalangan teruk! Tolong! Ada orang cedera dalam kereta!",
  },
  {
    id: "inc-002",
    timestamp: new Date(Date.now() - 300000), // 5 minutes ago
    location: {
      lat: 3.1456,
      lng: 101.5926,
      address: "Subang Jaya, Selangor",
    },
    urgency: "urgent",
    category: "medical",
    summary: "Cardiac arrest - Male, 55 years old",
    aiAnalysis: {
      detectedHazards: [
        "Unconscious person",
        "No pulse detected via caller description",
      ],
      victimCount: 1,
      confidence: 0.87,
      reasoning:
        "Caller reports victim unresponsive with symptoms matching cardiac arrest. Audio stress level: 72/100",
      audioStressLevel: 72,
    },
    callerInfo: {
      name: "Sarah Tan",
      phone: "+60198765432",
      language: "English",
    },
    status: "dispatched",
    transcript: "Please help! My father collapsed! He's not breathing!",
  },
  {
    id: "inc-003",
    timestamp: new Date(Date.now() - 600000), // 10 minutes ago
    location: {
      lat: 3.1012,
      lng: 101.6434,
      address: "Federal Highway, Petaling Jaya",
    },
    urgency: "urgent",
    category: "accident",
    summary: "Multi-vehicle accident blocking Federal Highway",
    aiAnalysis: {
      detectedHazards: [
        "Vehicle damage",
        "Road blockage",
        "Fuel leak detected",
      ],
      victimCount: 2,
      confidence: 0.91,
      reasoning:
        "Video shows 3-vehicle collision with visible fuel leak. Two individuals showing signs of injury. Traffic completely blocked.",
      videoTimestamp: 8,
      audioStressLevel: 68,
    },
    callerInfo: {
      language: "Malay",
    },
    status: "dispatched",
    transcript: "Kemalangan teruk! Tiga kereta langgar! Jalan tersumbat!",
  },
];

// Function to get active incidents
export function getActiveIncidents(): Incident[] {
  return MOCK_INCIDENTS.filter(
    (incident) =>
      incident.status === "pending" || incident.status === "dispatched",
  );
}

// Function to get incident by urgency
export function getIncidentsByUrgency(
  urgency: Incident["urgency"],
): Incident[] {
  return MOCK_INCIDENTS.filter((incident) => incident.urgency === urgency);
}
