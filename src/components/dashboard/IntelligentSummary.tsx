import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Incident } from "@/types";

interface IntelligentSummaryProps {
  incident: Incident | null;
}

export function IntelligentSummary({ incident }: IntelligentSummaryProps) {
  if (!incident) {
    return (
      <Card className="pointer-events-auto">
        <CardHeader>
          <CardTitle>Intelligent Summary</CardTitle>
          <CardDescription>No active incident</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const urgencyColor = {
    "very-urgent": "destructive",
    urgent: "default",
    "not-urgent": "secondary",
  } as const;

  return (
    <Card className="pointer-events-auto pt-3">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs">Intelligent Summary</CardTitle>
          <Badge variant={urgencyColor[incident.urgency]}>
            {incident.urgency.toUpperCase().replace("-", " ")}
          </Badge>
        </div>
        <CardDescription>{incident.location.address}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Summary */}
        <div>
          <h4 className="font-semibold text-xs mb-1">Situation</h4>
          <p className="text-xs text-muted-foreground">{incident.summary}</p>
        </div>

        {/* AI Detected Hazards */}
        <div>
          <h4 className="font-semibold text-xs mb-1">AI Detected Hazards</h4>
          <ul className="space-y-1">
            {incident.aiAnalysis.detectedHazards.map((hazard, index) => (
              <li
                key={index}
                className="text-xs text-muted-foreground flex items-start"
              >
                <span className="mr-2">•</span>
                {hazard}
              </li>
            ))}
          </ul>
        </div>

        {/* Victims */}
        {incident.aiAnalysis.victimCount && (
          <div>
            <h4 className="font-semibold text-xs mb-1">Estimated Victims</h4>
            <p className="text-xs text-muted-foreground">
              {incident.aiAnalysis.victimCount} person(s)
            </p>
          </div>
        )}

        {/* AI Confidence */}
        <div>
          <h4 className="font-semibold text-xs mb-1">AI Confidence</h4>
          <p className="text-xs text-muted-foreground">
            {Math.round(incident.aiAnalysis.confidence * 100)}%
          </p>
        </div>

        {/* Reasoning */}
        <div>
          <h4 className="font-semibold text-xs mb-1">Analysis Reasoning</h4>
          <p className="text-xs text-muted-foreground italic">
            {incident.aiAnalysis.reasoning}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
