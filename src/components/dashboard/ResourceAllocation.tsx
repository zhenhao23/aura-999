import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResourceAllocationSuggestion } from "@/types";
import { useState } from "react";
import { Truck, AlertCircle, TrendingUp, X } from "lucide-react";

interface ResourceAllocationProps {
  suggestions: ResourceAllocationSuggestion[];
  onApprove: (resourceId: string) => void;
  onDeny: (resourceId: string) => void;
}

export function ResourceAllocation({
  suggestions,
  onApprove,
  onDeny,
}: ResourceAllocationProps) {
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const selectedResource = suggestions.find(s => s.resource.id === selectedResourceId);

  return (
    <Card className="pointer-events-auto pt-3 max-h-96 overflow-y-auto flex flex-col">
      <CardHeader className="pb-0 flex-shrink-0">
        <CardTitle className="text-xs">Resource Allocation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 flex-1 overflow-y-auto min-h-0">
        {suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No resource suggestions available
          </p>
        ) : (
          suggestions.map((suggestion) => (
            <div key={suggestion.resource.id}>
              {/* Resource Card */}
              <div
                className="border rounded-lg p-3 space-y-2 cursor-pointer transition-all duration-200 hover:bg-slate-900/50 hover:shadow-lg"
                style={{
                  borderColor: getAgencyColor(suggestion.resource.agency),
                }}
                onClick={() =>
                  setSelectedResourceId(
                    selectedResourceId === suggestion.resource.id
                      ? null
                      : suggestion.resource.id
                  )
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                      style={{
                        backgroundColor: getAgencyColor(
                          suggestion.resource.agency,
                        ),
                      }}
                    >
                      {suggestion.resource.agency}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {suggestion.resource.type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {suggestion.resource.station.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">ETA</p>
                      <p className="font-bold text-sm">
                        {suggestion.estimatedETA} min
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onApprove(suggestion.resource.id);
                        }}
                      >
                        ✓
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeny(suggestion.resource.id);
                        }}
                      >
                        ✗
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedResourceId === suggestion.resource.id && (
                <div className="mt-2 bg-slate-800/30 rounded-lg p-3 border border-slate-700 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Available Vehicles */}
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      <div className="flex items-center gap-2 mb-1">
                        <Truck className="w-4 h-4 text-blue-400" />
                        <p className="text-xs font-semibold text-slate-300">
                          Available
                        </p>
                      </div>
                      <p className="text-lg font-bold text-blue-300">
                        {3}
                      </p>
                      <p className="text-xs text-slate-500">
                        vehicles ready
                      </p>
                    </div>

                    {/* Maintenance Required */}
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="w-4 h-4 text-yellow-400" />
                        <p className="text-xs font-semibold text-slate-300">
                          Maintenance
                        </p>
                      </div>
                      <p className="text-lg font-bold text-yellow-300">
                        {1}
                      </p>
                      <p className="text-xs text-slate-500">in service</p>
                    </div>

                    {/* Outstations */}
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-red-500" />
                        <p className="text-xs font-semibold text-slate-300">
                          Outstations
                        </p>
                      </div>
                      <p className="text-lg font-bold text-red-400">
                        {2}
                      </p>
                      <p className="text-xs text-slate-500">deployed</p>
                    </div>

                    {/* Status */}
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      <p className="text-xs font-semibold text-slate-300 mb-1">
                        Status
                      </p>
                      <p className="text-lg font-bold text-emerald-300">
                        {suggestion.resource.status || "Ready"}
                      </p>
                      <p className="text-xs text-slate-500">current</p>
                    </div>

                    {/* ETA */}
                    {/* <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      <p className="text-xs font-semibold text-slate-300 mb-1">
                        ETA
                      </p>
                      <p className="text-lg font-bold text-slate-100">
                        {suggestion.estimatedETA} min
                      </p>
                      <p className="text-xs text-slate-500">arrival</p>
                    </div> */}

                    {/* Utilization */}
                    {/* <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      <p className="text-xs font-semibold text-slate-300 mb-1">
                        Utilization
                      </p>
                      <p className="text-lg font-bold text-slate-100">
                        {suggestion.resource.utilization || 75}%
                      </p>
                      <p className="text-xs text-slate-500">usage</p>
                    </div> */}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1 h-8 bg-emerald-600 hover:bg-emerald-700 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onApprove(suggestion.resource.id);
                        setSelectedResourceId(null);
                      }}
                    >
                      ✓ Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeny(suggestion.resource.id);
                        setSelectedResourceId(null);
                      }}
                    >
                      ✗ Deny
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function getAgencyColor(agency: string): string {
  const colors: Record<string, string> = {
    PDRM: "#1E40AF",
    JBPM: "#DC2626",
    KKM: "#059669",
    APM: "#EA580C",
    MMEA: "#0891B2",
  };
  return colors[agency] || "#6B7280";
}
