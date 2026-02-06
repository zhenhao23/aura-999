"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Incident {
  id: string;
  caseId: string;
  eventType: string;
  language: string;
  phoneNumber: string;
  priority: "P1" | "P2" | "P3";
  status: "active" | "dispatched" | "closed";
  location: string;
  keywords: string[];
  receivedAt: Date;
}

interface IncidentTableProps {
  selectedId: string | null;
  onSelectIncident: (id: string) => void;
}

// Mock data - replace with real data from your backend
const MOCK_INCIDENTS: Incident[] = [
  {
    id: "inc-001",
    caseId: "MERS-2026-001234",
    eventType: "Medical: Cardiac",
    language: "Malay",
    phoneNumber: "+60123456789",
    priority: "P1",
    status: "active",
    location: "Bukit Bintang",
    keywords: ["chest pain", "breathing", "sweating"],
    receivedAt: new Date(Date.now() - 5 * 60000), // 5 mins ago
  },
  {
    id: "inc-002",
    caseId: "MERS-2026-001235",
    eventType: "Fire: Building",
    language: "English",
    phoneNumber: "+60198765432",
    priority: "P1",
    status: "dispatched",
    location: "Kampung Baru",
    keywords: ["fire", "smoke", "trapped"],
    receivedAt: new Date(Date.now() - 12 * 60000), // 12 mins ago
  },
  {
    id: "inc-003",
    caseId: "MERS-2026-001236",
    eventType: "Crime: Robbery",
    language: "Mandarin",
    phoneNumber: "+60167891234",
    priority: "P2",
    status: "active",
    location: "KLCC",
    keywords: ["gun", "robbery", "threatened"],
    receivedAt: new Date(Date.now() - 18 * 60000), // 18 mins ago
  },
  {
    id: "inc-004",
    caseId: "MERS-2026-001237",
    eventType: "Medical: Accident",
    language: "Tamil",
    phoneNumber: "+60145678901",
    priority: "P2",
    status: "dispatched",
    location: "Jalan Sultan Ismail",
    keywords: ["accident", "bleeding", "unconscious"],
    receivedAt: new Date(Date.now() - 25 * 60000), // 25 mins ago
  },
  {
    id: "inc-005",
    caseId: "MERS-2026-001238",
    eventType: "Medical: Fall",
    language: "Malay",
    phoneNumber: "+60132456789",
    priority: "P3",
    status: "closed",
    location: "Bangsar",
    keywords: ["fall", "elderly", "hip pain"],
    receivedAt: new Date(Date.now() - 45 * 60000), // 45 mins ago
  },
];

export function IncidentTable({
  selectedId,
  onSelectIncident,
}: IncidentTableProps) {
  const [incidents] = useState<Incident[]>(MOCK_INCIDENTS);

  return (
    <div className="h-full flex flex-col">
      {/* Table Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="flex items-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <div className="flex-1">Incident</div>
          <div className="w-42">Location</div>
          <div className="w-52">Trigger</div>
          <div className="w-44">Created At</div>
        </div>
      </div>

      {/* Table Rows */}
      <div className="flex-1 overflow-auto">
        {incidents.map((incident) => (
          <div
            key={incident.id}
            onClick={() => onSelectIncident(incident.id)}
            className={cn(
              "flex items-center px-4 py-4 border-b border-border cursor-pointer transition-colors hover:bg-accent",
              selectedId === incident.id && "bg-accent",
            )}
          >
            {/* Incident */}
            <div className="flex-1">
              <p className="text-sm font-medium">
                {incident.eventType} - {incident.language}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {incident.phoneNumber}
              </p>
            </div>

            {/* Location */}
            <div className="w-42">
              <p className="text-sm truncate">{incident.location}</p>
            </div>

            {/* Trigger (Keywords) */}
            <div className="w-52">
              <div className="flex flex-wrap gap-1">
                {incident.keywords.slice(0, 3).map((keyword, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="text-xs px-2 py-0"
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Created At */}
            <div className="w-44">
              <p className="text-sm font-medium">
                {incident.receivedAt.toLocaleDateString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {incident.receivedAt.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
