import { ReactNode } from "react";
import { Edit, Check, X } from "lucide-react";
import { AssessmentValueLogging } from "@/components/dashboard/AiSummaryLogging";
import { Button } from "@/components/ui/button";

interface EditableAssessmentFieldProps {
    fieldName: string;
    label: string;
    value: string;
    isActive: boolean;
    isEditing: boolean;
    editValue: string;
    reasoning: string;
    onStartEdit: (fieldName: string, value: string) => void;
    onSave: (fieldName: string) => void;
    onCancel: () => void;
    icon?: ReactNode;
    isTextarea?: boolean;
    fullWidth?: boolean;
    onEditValueChange: (value: string) => void;
    placeholder?: string;
}

export function EditableAssessmentField({
    fieldName,
    label,
    value,
    isActive,
    isEditing,
    editValue,
    reasoning,
    onStartEdit,
    onSave,
    onCancel,
    icon,
    isTextarea = false,
    fullWidth = false,
    onEditValueChange,
    placeholder = `Enter ${label.toLowerCase()}`,
}: EditableAssessmentFieldProps) {
    const containerClass = fullWidth ? "col-span-2" : "";

    return (
        <div className={containerClass}>
            <span className="text-muted-foreground">{label}:</span>
            <div className="col-span-2 flex items-center gap-2 mt-1">
                {isEditing ? (
                    <div className="flex gap-1 flex-1">
                        {isTextarea ? (
                            <textarea
                                value={editValue}
                                onChange={(e) => onEditValueChange(e.target.value)}
                                className="flex-1 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white placeholder-slate-400"
                                placeholder={placeholder}
                                rows={2}
                                autoFocus
                            />
                        ) : (
                            <input
                                type="text"
                                value={editValue}
                                onChange={(e) => onEditValueChange(e.target.value)}
                                className={`flex-1 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white placeholder-slate-400 ${fullWidth ? '' : 'w-[90%]'}`}
                                placeholder={placeholder}
                                autoFocus
                            />
                        )}
                        <div className="flex gap-1 items-center">
                            <Button
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => onSave(fieldName)}
                            >
                                ✓
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0"
                                onClick={onCancel}
                            >
                                ✗
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className={`font-semibold flex-1 flex items-center gap-1 ${isTextarea ? "text-sm" : ""}`}>
                            {icon}
                            {isActive ? value : <span className="text-muted-foreground">-</span>}
                        </p>
                        {isActive && (
                            <>
                                <button
                                    onClick={() => onStartEdit(fieldName, value)}
                                    className=" hover:bg-slate-800 rounded transition-colors"
                                >
                                    <Edit className="w-3 h-3 text-slate-400 hover:text-slate-200" />
                                </button>
                                <AssessmentValueLogging
                                    value={value}
                                    isActive={isActive}
                                    reasoning={reasoning}
                                />
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
