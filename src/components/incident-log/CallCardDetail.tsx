"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MiniMap } from "./MiniMap";
import {
  MapPin,
  Phone,
  User,
  Clock,
  Ambulance,
  Play,
  FileText,
  Camera,
  AlertCircle,
  Brain,
  MessageSquare,
  Languages,
  Volume2,
  ChevronDown,
} from "lucide-react";

interface CallCardDetailProps {
  incidentId: string;
}

// Mock data - replace with actual data fetching
const INCIDENT_DETAILS: Record<string, any> = {
  "inc-001": {
    eventType: "Medical: Fainted",
    language: "Malay",
    phoneNumber: "+60123454422",
    summary:
      "Medical emergency at Heriot-Watt University Malaysia Campus. Caller reports a person has fainted and is having trouble breathing. The victim is unconscious and not responding. Immediate medical assistance required.",
    keywords: [
      "fainted",
      "breathing",
      "unconscious",
    ],
    caller: {
      name: "Wei Shan",
      phone: "+60123454422",
      profile: "SaveME 999",
      language: "Malay",
    },
    location: {
      address: "Heriot-Watt University Malaysia Campus",
      coords: { lat: 2.8994930048635545, lng: 101.6725950816638 },
      accuracy: "36m (AML)",
    },
    assignedUnits: [
      { type: "Ambulance", id: "KKM-A-001", eta: "15 min", status: "Dispatched" },
      // {
      //   type: "Police",
      //   id: "PDRM-MPV-023",
      //   eta: "9 min",
      //   status: "En Route",
      // },
    ],
    narrative: [
      {
        time: new Date(Date.now() - 7 * 60000), // 7 mins ago
        type: "system",
        content: "Call Received - AI Screening Initiated",
      },
      {
        time: new Date(Date.now() - 6.5 * 60000), // 6.5 mins ago
        type: "caller",
        content: 'Caller: "Tolong! Tolong! Ada orang pengsan"',
        translation: "Help! Help! Someone fainted!",
      },
      {
        time: new Date(Date.now() - 6 * 60000), // 6 mins ago
        type: "ai",
        content:
          "AI Assessment: High probability of fainting/syncope at university campus. Victim unconscious and having breathing difficulties. Immediate medical response required.",
        confidence: "High",
      },
      {
        time: new Date(Date.now() - 5.5 * 60000), // 5.5 mins ago
        type: "dispatcher",
        content:
          "Dispatcher (Sarah): Confirmed - Unconscious student at Heriot-Watt Malaysia. Caller is panicking but providing details.",
      },
      {
        time: new Date(Date.now() - 5 * 60000), // 5 mins ago
        type: "caller",
        content: 'Caller: "Kawan saya sudah pengsan"',
        translation: "My friend has fainted!",
      },
      {
        time: new Date(Date.now() - 4.5 * 60000), // 4.5 mins ago
        type: "ai",
        content:
          "AI Insight: Speech pattern analysis shows extreme panic and distress. Recommend immediate ALS and campus security dispatch for scene safety.",
        confidence: "High",
      },
      {
        time: new Date(Date.now() - 4 * 60000), // 4 mins ago
        type: "dispatcher",
        content: "Ambulance KKM-A-001 dispatched to Heriot-Watt Malaysia Campus.",
      },
    ],
    transcriptMessages: [
      {
        type: "dispatcher",
        sender: "Dispatcher Sarah",
        time: new Date(Date.now() - 7 * 60000), // 7 mins ago
        originalText: "What is your emergency?",
        translatedText: "Apa kecemasan anda?",
        hasAudio: true,
      },
      {
        type: "caller",
        sender: "Wei Shan",
        time: new Date(Date.now() - 6.5 * 60000), // 6.5 mins ago
        originalText: "Kawan saya pengsan! Dia jatuh tiba-tiba!",
        translatedText: "My friend fainted! She fell suddenly!",
        hasAudio: true,
      },
      {
        type: "dispatcher",
        sender: "Dispatcher Sarah",
        time: new Date(Date.now() - 6 * 60000), // 6 mins ago
        originalText: "Stay calm. Where are you right now?",
        translatedText: "Tenang. Di mana anda sekarang?",
        hasAudio: true,
      },
      {
        type: "caller",
        sender: "Wei Shan",
        time: new Date(Date.now() - 5.5 * 60000), // 5.5 mins ago
        originalText: "We are at Heriot-Watt Malaysia! Main campus! Tolong!",
        translatedText: "We are at Heriot-Watt Malaysia! Main campus! Help!",
        hasAudio: true,
      },
      {
        type: "dispatcher",
        sender: "Dispatcher Sarah",
        time: new Date(Date.now() - 5 * 60000), // 5 mins ago
        originalText: "Is she breathing? Is she conscious?",
        translatedText: "Adakah dia bernafas? Adakah dia sedar?",
        hasAudio: true,
      },
      {
        type: "caller",
        sender: "Wei Shan",
        time: new Date(Date.now() - 4.5 * 60000), // 4.5 mins ago
        originalText: "She's not moving! Dia tidak sedar! Tolong bantu kami!",
        translatedText: "She's not moving! She's not conscious! Please help us!",
        hasAudio: true,
      },
      {
        type: "dispatcher",
        sender: "Dispatcher Sarah",
        time: new Date(Date.now() - 4 * 60000), // 4 mins ago
        originalText: "Ambulance is on the way - 15 minutes. Check if she's breathing. Can you turn her on her side?",
        translatedText:
          "Ambulans dalam perjalanan - 15 minit. Periksa sama ada dia bernafas. Boleh anda balikkan dia ke sisi?",
        hasAudio: true,
      },
      {
        type: "caller",
        sender: "Wei Shan",
        time: new Date(Date.now() - 3.5 * 60000), // 3.5 mins ago
        originalText: "Yes! She is breathing! Please hurry!",
        translatedText: "Ya! Dia bernafas! Cepat bodoh!",
        hasAudio: true,
      },
    ],
    videoAvailable: false,
    // sentimentData: [
    //   {
    //     time: "00:00",
    //     sentiment: "panic",
    //     text: "Tolong! Saya perlukan ambulans!",
    //   },
    //   {
    //     time: "00:13",
    //     sentiment: "distress",
    //     text: "Ya! Dia sedar tapi dia berpeluh banyak!",
    //   },
    //   {
    //     time: "00:23",
    //     sentiment: "worried",
    //     text: "65 tahun. Dia ada sakit jantung dulu.",
    //   },
    // ],
  },
  "inc-002": {
    eventType: "Medical: Cardiac",
    language: "Malay",
    phoneNumber: "+60123456789",
    summary:
      "65-year-old male experiencing severe chest pain, shortness of breath, and excessive sweating. Patient is conscious but in severe pain. History of heart disease. High probability of cardiac event requiring immediate ALS unit.",
    keywords: [
      "chest pain",
      "breathing",
      "sweating",
      "cardiac",
      "heart disease",
    ],
    caller: {
      name: "Ahmad bin Abdullah",
      phone: "+60123456789",
      profile: "SaveME 999: History of Asthma",
      language: "Malay",
    },
    location: {
      address: "Jalan Bukit Bintang, 55100 Kuala Lumpur",
      coords: { lat: 3.1478, lng: 101.7065 },
      accuracy: "12m (AML)",
    },
    assignedUnits: [
      { type: "Ambulance", id: "KKM-A-001", eta: "4 min", status: "En Route" },
      {
        type: "Police",
        id: "PDRM-MPV-023",
        eta: "6 min",
        status: "Dispatched",
      },
    ],
    narrative: [
      {
        time: "14:02:15",
        type: "system",
        content: "Call Received - AI Screening Initiated",
      },
      {
        time: "14:02:45",
        type: "ai",
        content:
          "AI Assessment: High probability of cardiac event based on caller description of chest pain, shortness of breath, and sweating.",
        confidence: "High",
      },
      {
        time: "14:03:10",
        type: "dispatcher",
        content:
          "Dispatcher (Sarah): Confirmed victim is 65yo male, conscious but in severe pain.",
      },
      {
        time: "14:03:45",
        type: "caller",
        content: 'Caller: "Dia berpeluh banyak dan nafas tersengal-sengal!"',
        translation: "He is sweating a lot and breathing heavily!",
      },
      {
        time: "14:04:20",
        type: "ai",
        content:
          "AI Insight: Speech pattern analysis suggests high stress. Recommend immediate ALS unit dispatch.",
        confidence: "Medium",
      },
      {
        time: "14:04:55",
        type: "dispatcher",
        content: "Ambulance KKM-A-001 dispatched with ALS capability.",
      },
    ],
    transcriptMessages: [
      {
        type: "dispatcher",
        sender: "Dispatcher Sarah",
        time: "14:02",
        originalText: "What is your emergency?",
        translatedText: "Apa kecemasan anda?",
        hasAudio: true,
      },
      {
        type: "caller",
        sender: "+60123456789",
        time: "14:02",
        originalText: "Bapa saya pegang dada, sakit sangat!",
        translatedText: "My father is holding his chest, very painful!",
        hasAudio: true,
      },
      {
        type: "dispatcher",
        sender: "Dispatcher Sarah",
        time: "14:03",
        originalText: "Is he conscious? Can he speak?",
        translatedText: "Adakah dia sedar? Boleh dia bercakap?",
        hasAudio: true,
      },
      {
        type: "caller",
        sender: "+60123456789",
        time: "14:03",
        originalText: "Ya, dia sedar tapi berpeluh banyak!",
        translatedText: "Yes, he is conscious but sweating a lot!",
        hasAudio: true,
      },
      {
        type: "dispatcher",
        sender: "Dispatcher Sarah",
        time: "14:04",
        originalText: "Help is on the way. Keep him calm and seated.",
        translatedText:
          "Bantuan dalam perjalanan. Pastikan dia tenang dan duduk.",
        hasAudio: true,
      },
    ],
    videoAvailable: true,
    sentimentData: [
      {
        time: "00:00",
        sentiment: "panic",
        text: "Tolong! Saya perlukan ambulans!",
      },
      {
        time: "00:13",
        sentiment: "distress",
        text: "Ya! Dia sedar tapi dia berpeluh banyak!",
      },
      {
        time: "00:23",
        sentiment: "worried",
        text: "65 tahun. Dia ada sakit jantung dulu.",
      },
    ],
  },
  "inc-003": {
    eventType: "Fire: Building",
    language: "English",
    phoneNumber: "+60198765432",
    summary:
      "Building fire reported in Kampung Baru. Smoke visible from multiple floors. Multiple people possibly trapped inside. Fire and rescue units dispatched immediately.",
    keywords: ["fire", "smoke", "trapped", "building", "emergency"],
    location: {
      address: "Jalan Raja Muda, Kampung Baru, 50300 Kuala Lumpur",
      coords: { lat: 3.1694, lng: 101.7025 },
      accuracy: "15m (AML)",
    },
    assignedUnits: [
      {
        type: "Fire Truck",
        id: "JBPM-FT-012",
        eta: "3 min",
        status: "En Route",
      },
      {
        type: "Ambulance",
        id: "KKM-A-005",
        eta: "5 min",
        status: "Dispatched",
      },
    ],
    narrative: [
      {
        time: "13:50:30",
        type: "system",
        content: "Call Received - AI Screening Initiated",
      },
      {
        time: "13:51:00",
        type: "ai",
        content:
          "AI Assessment: Building fire detected. Multiple people possibly trapped.",
        confidence: "High",
      },
    ],
    transcriptMessages: [
      {
        type: "dispatcher",
        sender: "Dispatcher Mike",
        time: "13:50",
        originalText: "What is the location of the fire?",
        translatedText: "What is the location of the fire?",
        hasAudio: true,
      },
      {
        type: "caller",
        sender: "+60198765432",
        time: "13:50",
        originalText: "There's a fire in the building! People are trapped!",
        translatedText: "There's a fire in the building! People are trapped!",
        hasAudio: true,
      },
      {
        type: "dispatcher",
        sender: "Dispatcher Mike",
        time: "13:51",
        originalText:
          "Fire trucks are on the way. Stay calm and evacuate if safe.",
        translatedText:
          "Fire trucks are on the way. Stay calm and evacuate if safe.",
        hasAudio: true,
      },
    ],
    transcript: `[00:00] Caller: Fire! There's a fire in the building!`,
    videoAvailable: false,
    sentimentData: [],
  },
  "inc-004": {
    eventType: "Crime: Robbery",
    language: "Mandarin",
    phoneNumber: "+60167891234",
    summary:
      "Armed robbery in progress at KLCC shopping center. Suspect reported to have a weapon. Immediate police response required. Multiple witnesses on scene.",
    keywords: ["gun", "robbery", "threatened", "armed", "weapon"],
    location: {
      address: "Suria KLCC, Jalan Ampang, 50088 Kuala Lumpur",
      coords: { lat: 3.1578, lng: 101.7117 },
      accuracy: "10m (AML)",
    },
    assignedUnits: [
      { type: "Police", id: "PDRM-MPV-015", eta: "2 min", status: "En Route" },
    ],
    narrative: [
      {
        time: "13:35:15",
        type: "system",
        content: "Call Received - AI Screening Initiated",
      },
      {
        time: "13:35:45",
        type: "ai",
        content: "AI Assessment: Armed robbery in progress. High priority.",
        confidence: "High",
      },
    ],
    transcriptMessages: [
      {
        type: "dispatcher",
        sender: "Dispatcher Lee",
        time: "13:35",
        originalText: "Please describe the suspect.",
        translatedText: "请描述嫌犯。",
        hasAudio: true,
      },
      {
        type: "caller",
        sender: "+60167891234",
        time: "13:35",
        originalText: "有人抢劫！他有枪！",
        translatedText: "Someone is robbing! He has a gun!",
        hasAudio: true,
      },
      {
        type: "dispatcher",
        sender: "Dispatcher Lee",
        time: "13:36",
        originalText: "Police are on the way. Stay hidden and safe.",
        translatedText: "警察在路上。请躲藏好、保持安全。",
        hasAudio: true,
      },
    ],
    transcript: `[00:00] Caller: 有人抢劫! (Someone is robbing!)`,
    videoAvailable: false,
    sentimentData: [],
  },
  "inc-005": {
    eventType: "Medical: Accident",
    language: "Tamil",
    phoneNumber: "+60145678901",
    summary:
      "Multi-vehicle traffic accident on Jalan Sultan Ismail. Multiple injuries reported. At least one person unconscious with visible bleeding. Ambulance en route.",
    keywords: ["accident", "bleeding", "unconscious", "vehicle", "injuries"],
    location: {
      address: "Jalan Sultan Ismail, 50250 Kuala Lumpur",
      coords: { lat: 3.1547, lng: 101.7088 },
      accuracy: "18m (AML)",
    },
    assignedUnits: [
      { type: "Ambulance", id: "KKM-A-008", eta: "4 min", status: "En Route" },
    ],
    narrative: [
      {
        time: "13:20:00",
        type: "system",
        content: "Call Received - AI Screening Initiated",
      },
      {
        time: "13:20:30",
        type: "ai",
        content: "AI Assessment: Traffic accident with injuries.",
        confidence: "Medium",
      },
    ],
    transcriptMessages: [
      {
        type: "dispatcher",
        sender: "Dispatcher Raj",
        time: "13:20",
        originalText: "How many people are injured?",
        translatedText: "எத்தனை பேர் காயமடைந்துள்ளனர்?",
        hasAudio: true,
      },
      {
        type: "caller",
        sender: "+60145678901",
        time: "13:20",
        originalText: "விபத்து நடந்துள்ளது! இரண்டு பேர் காயமடைந்துள்ளனர்!",
        translatedText: "Accident happened! Two people are injured!",
        hasAudio: true,
      },
      {
        type: "dispatcher",
        sender: "Dispatcher Raj",
        time: "13:21",
        originalText: "Ambulance is coming. Don't move the injured.",
        translatedText:
          "ஆம்புலன்ஸ் வருகிறது. காயமடைந்தவர்களை நகர்த்த வேண்டாம்.",
        hasAudio: true,
      },
    ],
    transcript: `[00:00] Caller: விபத்து நடந்துள்ளது! (Accident happened!)`,
    videoAvailable: false,
    sentimentData: [],
  },
  "inc-006": {
    eventType: "Medical: Fall",
    language: "Malay",
    phoneNumber: "+60132456789",
    summary:
      "Elderly female (78 years old) fell at home. Complaining of severe hip pain and unable to stand. Possible hip fracture. Patient is conscious and alert. Ambulance completed transport to hospital.",
    keywords: ["fall", "elderly", "hip pain", "fracture", "home"],
    location: {
      address: "Jalan Telawi, Bangsar, 59100 Kuala Lumpur",
      coords: { lat: 3.1287, lng: 101.6715 },
      accuracy: "8m (AML)",
    },
    assignedUnits: [
      { type: "Ambulance", id: "KKM-A-003", eta: "6 min", status: "Completed" },
    ],
    narrative: [
      {
        time: "12:50:00",
        type: "system",
        content: "Call Received - AI Screening Initiated",
      },
      {
        time: "12:50:25",
        type: "ai",
        content: "AI Assessment: Elderly fall, possible hip fracture.",
        confidence: "Medium",
      },
      {
        time: "12:51:00",
        type: "dispatcher",
        content: "Ambulance dispatched. Patient transported to hospital.",
      },
    ],
    transcriptMessages: [
      {
        type: "dispatcher",
        sender: "Dispatcher Ahmad",
        time: "12:50",
        originalText: "Can you tell me what happened?",
        translatedText: "Boleh beritahu apa yang berlaku?",
        hasAudio: true,
      },
      {
        type: "caller",
        sender: "+60132456789",
        time: "12:50",
        originalText: "Nenek saya terjatuh! Dia tak boleh bangun!",
        translatedText: "My grandmother fell! She can't get up!",
        hasAudio: true,
      },
      {
        type: "dispatcher",
        sender: "Dispatcher Ahmad",
        time: "12:51",
        originalText: "Ambulance is on the way. Don't move her.",
        translatedText: "Ambulans dalam perjalanan. Jangan gerakkan dia.",
        hasAudio: true,
      },
    ],
    transcript: `[00:00] Caller: Nenek saya terjatuh! (My grandmother fell!)`,
    videoAvailable: false,
    sentimentData: [],
  },
};

export function CallCardDetail({ incidentId }: CallCardDetailProps) {
  const [activeTab, setActiveTab] = useState("narrative");
  const incident = INCIDENT_DETAILS[incidentId];

  if (!incident) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <p className="text-muted-foreground">Incident details not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Metadata Header */}
      <Card className="m-6 mb-4">
        <CardHeader className="pb-4">
          <CardTitle className="flex flex-col gap-1">
            <span className="text-lg font-medium">
              {incident.eventType} - {incident.language}
            </span>
            <span className="text-sm font-mono text-muted-foreground">
              {incident.phoneNumber}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Location */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="w-4 h-4" />
              Exact Location
            </div>
            <div className="pl-6 space-y-1">
              <p className="text-sm">{incident.location.address}</p>
              <p className="text-xs text-muted-foreground font-mono">
                {incident.location.coords.lat}, {incident.location.coords.lng}
              </p>
              {/* Mini Map */}
              <MiniMap
                lat={incident.location.coords.lat}
                lng={incident.location.coords.lng}
                address={incident.location.address}
              />
            </div>
          </div>

          <Separator />

          {/* Summary */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="w-4 h-4" />
              Summary
            </div>
            <div className="pl-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {incident.summary}
              </p>
            </div>
          </div>

          <Separator />

          {/* Trigger (Keywords Detected) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <AlertCircle className="w-4 h-4" />
              Trigger (Keywords Detected)
            </div>
            <div className="pl-6">
              <div className="flex flex-wrap gap-2">
                {incident.keywords.map((keyword: string, idx: number) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="text-xs px-2 py-1"
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Assigned Units */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Ambulance className="w-4 h-4" />
              Assigned Units ({incident.assignedUnits.length})
            </div>
            <div className="grid grid-cols-2 gap-2 pl-6">
              {incident.assignedUnits.map((unit: any) => (
                <div key={unit.id} className="border rounded-lg p-3 space-y-1">
                  <p className="text-sm font-semibold">{unit.type}</p>
                  <p className="text-xs text-muted-foreground">{unit.id}</p>
                  <p className="text-xs font-bold">ETA: {unit.eta}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Narrative Log & Media Tabs */}
      <Card className="mx-6 mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="pb-2">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="narrative">
                <MessageSquare className="w-4 h-4 mr-2" />
                Narrative Log
              </TabsTrigger>
              <TabsTrigger value="transcript">
                <FileText className="w-4 h-4 mr-2" />
                Transcript
              </TabsTrigger>
              <TabsTrigger value="video">
                <Camera className="w-4 h-4 mr-2" />
                Video
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Narrative Log Tab */}
            <TabsContent value="narrative" className="mt-0 space-y-3">
              {incident.narrative.map((entry: any, idx: number) => (
                <div
                  key={idx}
                  className={`flex gap-3 p-3 rounded-lg ${entry.type === "ai"
                    ? "bg-purple-500/10 border border-purple-500/30"
                    : entry.type === "dispatcher"
                      ? "bg-blue-500/10 border border-blue-500/30"
                      : entry.type === "caller"
                        ? "bg-green-500/10 border border-green-500/30"
                        : "bg-muted"
                    }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${entry.type === "ai"
                        ? "bg-purple-600"
                        : entry.type === "dispatcher"
                          ? "bg-blue-600"
                          : entry.type === "caller"
                            ? "bg-green-600"
                            : "bg-gray-600"
                        }`}
                    >
                      {entry.type === "ai" && (
                        <Brain className="w-4 h-4 text-white" />
                      )}
                      {entry.type === "dispatcher" && (
                        <User className="w-4 h-4 text-white" />
                      )}
                      {entry.type === "caller" && (
                        <Phone className="w-4 h-4 text-white" />
                      )}
                      {entry.type === "system" && (
                        <Clock className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {typeof entry.time === 'string' ? entry.time : entry.time?.toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">{entry.content}</p>
                    {entry.translation && (
                      <p className="text-xs text-muted-foreground italic">
                        Translation: {entry.translation}
                      </p>
                    )}
                    {entry.confidence && (
                      <Badge
                        variant="outline"
                        className={`text-xs ${entry.confidence === "High"
                          ? "border-green-500 text-green-600"
                          : entry.confidence === "Medium"
                            ? "border-yellow-500 text-yellow-600"
                            : "border-red-500 text-red-600"
                          }`}
                      >
                        Confidence: {entry.confidence}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Transcript Tab - Call Card Interface */}
            <TabsContent value="transcript" className="mt-0">
              <div className="bg-card border rounded-lg overflow-hidden">
                {/* Header Section */}
                <div className="bg-muted/50 p-4 space-y-3 border-b">
                  {/* Phone Number & Language */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold">
                        {incident.phoneNumber}
                      </span>
                    </div>
                    <Button variant="outline" size="sm" className="h-7">
                      <Languages className="w-3 h-3 mr-1" />
                      {incident.language}
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>

                {/* Translation Overlay */}
                <div className="bg-blue-500/10 border-b border-blue-500/20 px-4 py-2 flex items-center gap-2">
                  <Languages className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-blue-700 dark:text-blue-400">
                    Auto-Translating {incident.language}
                  </span>
                </div>

                {/* Media Player */}
                <div className="px-4 py-3 border-b bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <Play className="w-4 h-4" />
                    </Button>
                    <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full w-1/3 bg-primary"></div>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      2:45 / 8:20
                    </span>
                  </div>
                </div>

                {/* Message Bubbles */}
                <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                  {incident.transcriptMessages?.map((msg: any, idx: number) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${msg.type === "dispatcher" ? "items-end" : "items-start"
                        }`}
                    >
                      {/* Sender & Time */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">
                          {msg.sender}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {typeof msg.time === 'string' ? msg.time : msg.time?.toLocaleTimeString()}
                        </span>
                      </div>

                      {/* Original Message */}
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 ${msg.type === "dispatcher"
                          ? "bg-muted text-foreground"
                          : "bg-primary text-primary-foreground"
                          }`}
                      >
                        <div
                          className={`flex items-start gap-2 ${msg.type === "dispatcher" ? "flex-row-reverse" : ""
                            }`}
                        >
                          {msg.hasAudio && (
                            <Volume2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          )}
                          <p
                            className={`text-sm ${msg.type === "dispatcher"
                              ? "italic"
                              : "font-semibold"
                              }`}
                          >
                            {msg.originalText}
                          </p>
                        </div>
                      </div>

                      {/* Translated Message */}
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 mt-1 ${msg.type === "dispatcher"
                          ? "bg-muted/50 text-muted-foreground"
                          : "bg-primary/50 text-primary-foreground/80"
                          }`}
                      >
                        <div
                          className={`flex items-start gap-2 ${msg.type === "dispatcher" ? "flex-row-reverse" : ""
                            }`}
                        >
                          <Languages className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <p className="text-xs italic">{msg.translatedText}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Video Tab */}
            <TabsContent value="video" className="mt-0 space-y-4">
              {incident.videoAvailable ? (
                <>
                  {/* Video Player */}
                  <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                    <div className="text-center text-white space-y-2">
                      <Camera className="w-12 h-12 mx-auto opacity-50" />
                      <p className="text-sm">[Live Video Stream / Recording]</p>
                      <Button variant="secondary">
                        <Play className="w-4 h-4 mr-2" />
                        Play Video
                      </Button>
                    </div>
                  </div>

                  {/* Snapshot Tool */}
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <Camera className="w-4 h-4 mr-2" />
                      Capture Snapshot
                    </Button>
                    <Button variant="outline">View Gallery (0)</Button>
                  </div>

                  {/* Snapshots Gallery */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-sm font-semibold mb-2">
                      Captured Snapshots
                    </h3>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="aspect-video bg-muted rounded border flex items-center justify-center text-xs text-muted-foreground">
                        No snapshots
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No video available for this incident</p>
                  </div>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
