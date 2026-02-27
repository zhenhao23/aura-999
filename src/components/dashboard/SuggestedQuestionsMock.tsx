"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, X } from "lucide-react";

interface SuggestedQuestion {
    id: string;
    question: string;
    category: "location" | "building" | "hazard" | "access";
    priority: "important" | "moderate" | "low";
    followUpQuestions?: string[];
}

const MOCK_QUESTIONS: SuggestedQuestion[] = [
    // {
    //     id: "q1",
    //     question: "Is your friend breathing normally or struggling to breathe?",
    //     category: "hazard",
    //     priority: "important",
    //     followUpQuestions: [
    //         "Can you see the chest moving up and down?",
    //         "Do they seem to be gasping or wheezing?",
    //     ],
    // },
    // {
    //     id: "q2",
    //     question: "Is your friend conscious or completely unresponsive?",
    //     category: "hazard",
    //     priority: "important",
    //     followUpQuestions: [
    //         "Do she respond to your voice or touch?",
    //         "Can she open her eyes?",
    //     ],
    // },
    // {
    //     id: "q3",
    //     question: "Is there any visible injury or bleeding?",
    //     category: "hazard",
    //     priority: "important",
    //     followUpQuestions: [
    //         "Where is the bleeding or injury located?",
    //         "How severe does it look?",
    //     ],
    // },
    {
        id: "q4",
        question: "Which building or area at Heriot Watt Malaysia are you in? (Main Campus, Block A/B/C, Dormitory, Library, etc.)",
        category: "hazard",
        priority: "important",
        followUpQuestions: [
            "Which floor or room?",
            "Is there elevator access for ambulance entry?",
        ],
    },
    // {
    //     id: "q5",
    //     question: "Can you safely move her to the nearest main road or open area for ambulance access?",
    //     category: "access",
    //     priority: "important",
    //     followUpQuestions: [
    //         "Is the path clear for a stretcher?",
    //         "Do you need someone to guide the ambulance at the main gate?",
    //     ],
    // },
    // {
    //     id: "q6",
    //     question: "Have you notified campus security or the student health center?",
    //     category: "hazard",
    //     priority: "important",
    //     followUpQuestions: [
    //         "Can security help while waiting for ambulance?",
    //         "Is there a defibrillator (AED) in this building?",
    //     ],
    // },
    // {
    //     id: "q7",
    //     question: "How long have she been unconscious?",
    //     category: "hazard",
    //     priority: "important",
    //     followUpQuestions: [
    //         "Did they collapse suddenly or gradually lose consciousness?",
    //         "Have there been any seizures or convulsions?",
    //     ],
    // },
    // {
    //     id: "q8",
    //     question: "Do you know what caused her to faint - heat, stress, medication, or medical condition?",
    //     category: "hazard",
    //     priority: "moderate",
    //     followUpQuestions: [
    //         "Were they complaining of dizziness or chest pain before?",
    //         "Do they have any known allergies or medical conditions?",
    //     ],
    // },
];

interface SuggestedQuestionsProps {
    onSendMessage: (message: string) => void;
}

export function SuggestedQuestionsMock({ onSendMessage }: SuggestedQuestionsProps) {
    const [usedQuestions, setUsedQuestions] = useState<string[]>([]);
    const [currentPopupQuestion, setCurrentPopupQuestion] = useState<SuggestedQuestion | null>(null);
    const [buttonDisappear, setButtonDisappear] = useState(false);

    // Auto-play popup questions
    useEffect(() => {
        if (!currentPopupQuestion) return;

        // Auto-hide after 5 seconds
        const timer = setTimeout(() => {
            setCurrentPopupQuestion(null);
        }, 7000);

        return () => clearTimeout(timer);
    }, [currentPopupQuestion]);

    const handleShowQuestion = () => {
        const availableQuestions = MOCK_QUESTIONS.filter(
            (q) => !usedQuestions.includes(q.id)
        );

        if (availableQuestions.length === 0) return;

        const randomQuestion = availableQuestions[
            Math.floor(Math.random() * availableQuestions.length)
        ];
        setButtonDisappear(true);
        setTimeout(() => {
            setCurrentPopupQuestion(randomQuestion);
        }, 1000);

        // setTimeout(() => {
        //     setButtonDisappear(false);
        // }, 8000);
    };

    const handleQuestionClick = (question: SuggestedQuestion) => {
        onSendMessage(question.question);
        setUsedQuestions((prev) => [...prev, question.id]);
        setCurrentPopupQuestion(null);
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

    const availableQuestions = MOCK_QUESTIONS.filter(
        (q) => !usedQuestions.includes(q.id)
    );

    return (
        <>
            {/* Top Center Popup */}
            {currentPopupQuestion && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-500">
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

            <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto ${buttonDisappear ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}>
                {/* Floating Button */}
                <button
                    onClick={handleShowQuestion}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-110 active:scale-95 backdrop-blur-sm border border-red-400/20"
                >
                    <Lightbulb className="w-5 h-5" />
                    {/* <span>AI Suggested Questions</span> */}
                    {availableQuestions.length > 0 && (
                        <Badge className="bg-red-900/60 text-red-100 border border-red-600/50 ml-2">
                            {availableQuestions.length}
                        </Badge>
                    )}
                </button>
            </div>
        </>
    );
}
