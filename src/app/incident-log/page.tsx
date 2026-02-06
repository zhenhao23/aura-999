"use client";

import { useState } from "react";
import { IncidentTable } from "@/components/incident-log/IncidentTable";
import { CallCardDetail } from "@/components/incident-log/CallCardDetail";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function IncidentLogPage() {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(
    null,
  );

  return (
    <div className="h-screen w-full bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Incident Log</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Export Report
          </Button>
        </div>
      </div>

      {/* Master-Detail Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Incident Table */}
        <div className="w-1/2 border-r border-border overflow-auto">
          <IncidentTable
            selectedId={selectedIncidentId}
            onSelectIncident={setSelectedIncidentId}
          />
        </div>

        {/* Right Panel: Call Card Details */}
        <div className="w-1/2 overflow-auto bg-muted/30">
          {selectedIncidentId ? (
            <CallCardDetail incidentId={selectedIncidentId} />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-lg font-medium">No Incident Selected</p>
                <p className="text-sm mt-2">
                  Select an incident from the table to view details
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
