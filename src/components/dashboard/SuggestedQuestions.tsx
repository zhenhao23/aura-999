"use client";

import { useState, useEffect } from "react";
import { Lightbulb, X } from "lucide-react";

interface SuggestedQuestionsProps {
  onSendMessage: (message: string) => void;
  activeCallId?: string | null;
}

export function SuggestedQuestions({
  onSendMessage,
  activeCallId,
}: SuggestedQuestionsProps) {
  const [showPopup, setShowPopup] = useState(true);

  // Reset popup whenever activeCallId changes (new call)
  useEffect(() => {
    setShowPopup(true);
  }, [activeCallId]);

  // Static question to display
  const staticQuestion = "Is the patient breathing?";

  return (
    <>
      {/* Top Center Popup - Static Question */}
      {showPopup && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="px-6 py-4 rounded-xl border shadow-xl bg-red-950/40 text-red-300 border-red-500/30 max-w-sm backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-m font-medium mb-3">{staticQuestion}</p>
              </div>
              <button
                onClick={() => setShowPopup(false)}
                className="shrink-0 p-1 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 opacity-60 hover:opacity-100" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
