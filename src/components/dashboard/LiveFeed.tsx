import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LiveFeedProps {
  videoUrl?: string;
  transcript?: string;
}

export function LiveFeed({ videoUrl, transcript }: LiveFeedProps) {
  return (
    <Card className="pointer-events-auto pt-3">
      <CardHeader className="pb-0">
        <CardTitle className="text-xs">Live Feed</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Video Player */}
        <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden">
          {videoUrl ? (
            <video
              src={videoUrl}
              controls
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <p className="text-sm">No video feed available</p>
            </div>
          )}
        </div>

        {/* Live Transcript */}
        {transcript && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Live Transcript</h4>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm">{transcript}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
