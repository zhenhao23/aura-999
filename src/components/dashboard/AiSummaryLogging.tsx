"use client";

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { HelpCircle, PlayCircle } from "lucide-react";


interface EvidenceProps {
    // videoClip: string;
    reasoning?: string;
    value?: string;
    isActive: boolean;
}

export function AssessmentValueLogging({
    // videoClip,
    reasoning,
    value,
    isActive }: EvidenceProps) {
    return (
        <div className="col-span-1">
            {/* <span className="text-muted-foreground text-xs">{label}:</span> */}
            <div className="flex items-center justify-between group">
                {/* <p className="font-semibold">{isActive ? value : "-"}</p> */}

                {isActive && (
                    <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                        {/* Reasoning Tooltip */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-purple-400 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="bg-slate-800 border-slate-700 text-xs max-w-40 text-slate-300 text-justify">
                                    <p>{reasoning || "AI analyzed visual and audio context to determine this."}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {/* Video Evidence Dialog */}
                        <Dialog>
                            <DialogTrigger asChild>
                                <PlayCircle className="w-3.5 h-3.5 text-slate-400 hover:text-red-400 cursor-pointer" />
                            </DialogTrigger>
                            <DialogContent className="bg-slate-950 border-slate-800">
                                <DialogHeader>
                                    <DialogTitle className="text-sm">Video Evidence: </DialogTitle>
                                </DialogHeader>
                                <div className="aspect-video bg-black rounded border border-slate-800 flex items-center justify-center">
                                    {/* Replace with your actual stream/video logic */}
                                    <p className="text-xs text-slate-300 italic">Streaming evidence for {value}...</p>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>
        </div>
    );
}
