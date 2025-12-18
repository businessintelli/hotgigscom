import { CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProgressSection {
  id: string;
  title: string;
  isComplete: boolean;
  isOptional?: boolean;
  hasError?: boolean;
}

interface ApplicationProgressTrackerProps {
  sections: ProgressSection[];
  currentSection?: string;
}

export default function ApplicationProgressTracker({ sections, currentSection }: ApplicationProgressTrackerProps) {
  const completedCount = sections.filter(s => s.isComplete).length;
  const totalRequired = sections.filter(s => !s.isOptional).length;
  const progressPercentage = (completedCount / sections.length) * 100;

  return (
    <div className="bg-white border rounded-lg p-6 sticky top-4">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg mb-2">Application Progress</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>{completedCount} of {sections.length} sections complete</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1 text-right">
            {Math.round(progressPercentage)}% Complete
          </div>
        </div>

        {/* Section List */}
        <div className="space-y-2">
          {sections.map((section) => (
            <div
              key={section.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg transition-colors",
                currentSection === section.id && "bg-blue-50",
                section.isComplete && "bg-green-50"
              )}
            >
              <div className="flex-shrink-0 mt-0.5">
                {section.hasError ? (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                ) : section.isComplete ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      section.isComplete && "text-green-700",
                      section.hasError && "text-red-700",
                      !section.isComplete && !section.hasError && "text-gray-700"
                    )}
                  >
                    {section.title}
                  </span>
                  {section.isOptional && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      Optional
                    </span>
                  )}
                </div>
                {section.hasError && (
                  <p className="text-xs text-red-600 mt-1">
                    Please complete required fields
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Completion Status */}
        {completedCount >= totalRequired && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Ready to Submit!</p>
                <p className="text-sm text-green-700">
                  All required sections are complete
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
