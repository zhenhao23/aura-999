"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, MessageCircle, Lightbulb, ChevronUp, X } from "lucide-react";

interface SuggestedQuestion {
    id: string;
    question: string;
    category: "location" | "building" | "hazard" | "access";
    priority: "important" | "moderate" | "low";
    followUpQuestions?: string[];
}

const MOCK_QUESTIONS: SuggestedQuestion[] = [
    {
        id: "q1",
        question: "Is your friend breathing normally or struggling to breathe?",
        category: "hazard",
        priority: "important",
        followUpQuestions: [
            "Can you see the chest moving up and down?",
            "Do they seem to be gasping or wheezing?",
        ],
    },
    {
        id: "q2",
        question: "Is your friend conscious or completely unresponsive?",
        category: "hazard",
        priority: "important",
        followUpQuestions: [
            "Do she respond to your voice or touch?",
            "Can she open her eyes?",
        ],
    },
    {
        id: "q3",
        question: "Is there any visible injury or bleeding?",
        category: "hazard",
        priority: "important",
        followUpQuestions: [
            "Where is the bleeding or injury located?",
            "How severe does it look?",
        ],
    },
    {
        id: "q4",
        question: "Which building or area at Heriot Watt Malaysia are you in? (Main Campus, Block A/B/C, Dormitory, Library, etc.)",
        category: "location",
        priority: "important",
        followUpQuestions: [
            "Which floor or room?",
            "Is there elevator access for ambulance entry?",
        ],
    },
    {
        id: "q5",
        question: "Can you safely move her to the nearest main road or open area for ambulance access?",
        category: "access",
        priority: "important",
        followUpQuestions: [
            "Is the path clear for a stretcher?",
            "Do you need someone to guide the ambulance at the main gate?",
        ],
    },
    {
        id: "q6",
        question: "Have you notified campus security or the student health center?",
        category: "hazard",
        priority: "important",
        followUpQuestions: [
            "Can security help while waiting for ambulance?",
            "Is there a defibrillator (AED) in this building?",
        ],
    },
    {
        id: "q7",
        question: "How long have she been unconscious?",
        category: "hazard",
        priority: "important",
        followUpQuestions: [
            "Did they collapse suddenly or gradually lose consciousness?",
            "Have there been any seizures or convulsions?",
        ],
    },
    {
        id: "q8",
        question: "Do you know what caused her to faint - heat, stress, medication, or medical condition?",
        category: "hazard",
        priority: "moderate",
        followUpQuestions: [
            "Were they complaining of dizziness or chest pain before?",
            "Do they have any known allergies or medical conditions?",
        ],
    },
];

interface SuggestedQuestionsProps {
    onSendMessage: (message: string) => void;
}

export function SuggestedQuestions({ onSendMessage }: SuggestedQuestionsProps) {
    const [usedQuestions, setUsedQuestions] = useState<string[]>([]);
    const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [currentPopupQuestion, setCurrentPopupQuestion] = useState<SuggestedQuestion | null>(null);

    // Auto-play popup questions
    useEffect(() => {
        const availableQuestions = MOCK_QUESTIONS.filter(
            (q) => !usedQuestions.includes(q.id)
        );

        if (availableQuestions.length === 0) return;

        // Pick a random question and show it
        const showQuestion = () => {
            const randomQuestion = availableQuestions[
                Math.floor(Math.random() * availableQuestions.length)
            ];
            setCurrentPopupQuestion(randomQuestion);
        };

        // Initial show
        showQuestion();

        // Update popup every 2 seconds
        const interval = setInterval(showQuestion, 2000);

        return () => clearInterval(interval);
    }, [usedQuestions]);

    const handleQuestionClick = (question: SuggestedQuestion) => {
        onSendMessage(question.question);
        setUsedQuestions((prev) => [...prev, question.id]);
        setCurrentPopupQuestion(null);
    };

    const handleFollowUp = (followUp: string) => {
        onSendMessage(followUp);
    };

    const getCategoryColor = (
        category: "location" | "building" | "hazard" | "access"
    ) => {
        switch (category) {
            case "location":
                return "bg-blue-950/40 text-blue-300 border-blue-500/30";
            case "building":
                return "bg-cyan-950/40 text-cyan-300 border-cyan-500/30";
            case "hazard":
                return "bg-pink-950/40 text-pink-300 border-pink-500/30";
            case "access":
                return "bg-yellow-950/40 text-yellow-300 border-yellow-500/30";
        }
    };

    const getPriorityColor = (priority: "important" | "moderate" | "low") => {
        switch (priority) {
            case "important":
                return "bg-red-950/40 text-red-300 border-red-500/30";
            case "moderate":
                return "bg-amber-950/40 text-amber-300 border-amber-500/30";
            case "low":
                return "bg-green-950/40 text-green-300 border-green-500/30";
        }
    };

    const availableQuestions = MOCK_QUESTIONS.filter(
        (q) => !usedQuestions.includes(q.id)
    ).sort((a, b) => {
        const priorityOrder = { important: 0, moderate: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return (
        <>
            {/* Top Center Popup */}
            {currentPopupQuestion && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300">
                    <div
                        className={`px-6 py-4 rounded-xl border shadow-xl ${getCategoryColor(
                            currentPopupQuestion.category
                        )} max-w-sm backdrop-blur-sm`}
                    >
                        <div className="flex items-start gap-3">
                            <Lightbulb className="w-5 h-5 mt-0.5 shrink-0" />
                            <div className="flex-1">
                                <p className="text-m font-medium mb-3">
                                    {currentPopupQuestion.question}
                                </p>
                                {/* <button
                                    onClick={() => handleQuestionClick(currentPopupQuestion)}
                                    className="px-4 py-1.5 rounded-lg bg-slate-700 text-slate-100 text-xs font-medium hover:bg-slate-600 transition-colors"
                                >
                                    Send
                                </button> */}
                            </div>
                            <button
                                onClick={() => setCurrentPopupQuestion(null)}
                                className="shrink-0 p-1 hover:bg-slate-700/50 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4 opacity-60 hover:opacity-100" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
                {/* Floating Button */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-110 active:scale-95 backdrop-blur-sm border border-red-400/20"
                >
                    <Lightbulb className="w-5 h-5" />
                    <span>AI Suggested Questions</span>
                    {availableQuestions.length > 0 && (
                        <Badge className="bg-red-900/60 text-red-100 border border-red-600/50 ml-2">
                            {availableQuestions.length}
                        </Badge>
                    )}
                    <ChevronUp
                        className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""
                            }`}
                    />
                </button>

                {/* Overlay */}
                {isExpanded && (
                    <div
                        className="fixed inset-0 z-20 bg-black/20 pointer-events-auto"
                        onClick={() => setIsExpanded(false)}
                    />
                )}

                {/* Expanded Panel - Above Button */}
                {isExpanded && (
                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-96 h-96 z-40 animate-in slide-in-from-bottom-4 fade-in duration-300">
                        <div className="bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-card-foreground flex flex-col gap-2 rounded-xl border border-slate-700 shadow-2xl h-full overflow-hidden">
                            {/* Header */}
                            <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-2">
                                    <Lightbulb className="w-4 h-4 text-slate-100" />
                                    <h2 className="text-sm font-semibold text-slate-100">
                                        AI Suggested Questions
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setIsExpanded(false)}
                                    className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4 text-slate-400 hover:text-slate-200" />
                                </button>
                            </div>

                            {/* Questions List */}
                            <div className="flex-1 overflow-y-auto space-y-2 p-3 min-h-0">
                                {availableQuestions.map((question) => (
                                    <div key={question.id} className="space-y-1">
                                        {/* Main Question */}
                                        <button
                                            onClick={() => handleQuestionClick(question)}
                                            onContextMenu={(e) => {
                                                e.preventDefault();
                                                setExpandedQuestion(
                                                    expandedQuestion === question.id ? null : question.id
                                                );
                                            }}
                                            className={`w-full text-left transition-all duration-200 ${getCategoryColor(
                                                question.category
                                            )} border rounded-lg p-2.5 hover:shadow-md hover:scale-[1.02] active:scale-95`}
                                        >
                                            <div className="flex items-start gap-2 mb-1">
                                                <MessageCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                                <p className="text-xs font-medium flex-1 leading-snug">
                                                    {question.question}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 ml-5">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] px-1.5 py-0 border ${getPriorityColor(
                                                        question.priority
                                                    )}`}
                                                >
                                                    {question.priority}
                                                </Badge>
                                                <span className="text-[10px] text-slate-400 capitalize">
                                                    {question.category}
                                                </span>
                                            </div>
                                        </button>

                                        {/* Follow-up Questions */}
                                        {expandedQuestion === question.id && question.followUpQuestions && (
                                            <div className="ml-5 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                                                {question.followUpQuestions.map((followUp, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleFollowUp(followUp)}
                                                        className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg bg-slate-800/50 text-slate-300 hover:bg-slate-700/70 border border-slate-600/50 transition-all duration-200 hover:translate-x-1 active:scale-95"
                                                    >
                                                        <span className="text-slate-500">↳ </span>
                                                        {followUp}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {availableQuestions.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                                        <CheckCircle className="w-6 h-6 mb-2 text-green-400" />
                                        <p className="text-xs font-medium text-slate-300">All questions asked!</p>
                                        <p className="text-[10px] mt-1 text-slate-500">Great job</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer Info */}
                            <div className="px-3 py-2 border-t border-slate-700 bg-slate-900/50 text-[11px] text-slate-500 shrink-0">
                                <p>Click to send • Right-click to expand</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
