import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResourceAllocationSuggestion } from "@/types";

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
  return (
    <Card className="pointer-events-auto pt-3">
      <CardHeader className="pb-0">
        <CardTitle className="text-xs">Resource Allocation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No resource suggestions available
          </p>
        ) : (
          suggestions.map((suggestion) => (
            <div
              key={suggestion.resource.id}
              className="border rounded-lg p-3 space-y-2"
              style={{
                borderColor: getAgencyColor(suggestion.resource.agency),
              }}
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
                      onClick={() => onApprove(suggestion.resource.id)}
                    >
                      ✓
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => onDeny(suggestion.resource.id)}
                    >
                      ✗
                    </Button>
                  </div>
                </div>
              </div>
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
