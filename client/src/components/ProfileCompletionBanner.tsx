import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, X, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

interface ProfileCompletionBannerProps {
  percentage: number;
  role: "recruiter" | "candidate";
  onDismiss?: () => void;
  missingFields?: string[];
}

export function ProfileCompletionBanner({ percentage, role, onDismiss, missingFields }: ProfileCompletionBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [, setLocation] = useLocation();

  if (dismissed || percentage === 100) {
    return null;
  }

  const handleComplete = () => {
    if (role === "recruiter") {
      setLocation("/recruiter/onboarding");
    } else {
      setLocation("/candidate/onboarding");
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const getColorClass = () => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getAlertClass = () => {
    if (percentage >= 80) return "border-green-200 bg-green-50";
    if (percentage >= 50) return "border-yellow-200 bg-yellow-50";
    return "border-blue-200 bg-blue-50";
  };

  const getTextClass = () => {
    if (percentage >= 80) return "text-green-900";
    if (percentage >= 50) return "text-yellow-900";
    return "text-blue-900";
  };

  const getButtonClass = () => {
    if (percentage >= 80) return "bg-green-600 hover:bg-green-700";
    if (percentage >= 50) return "bg-yellow-600 hover:bg-yellow-700";
    return "bg-blue-600 hover:bg-blue-700";
  };

  return (
    <Alert className={`mb-6 ${getAlertClass()}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {percentage >= 80 ? (
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          )}
          <div className="flex-1 space-y-2">
            <AlertDescription className={getTextClass()}>
              <span className="font-semibold">Your profile is {percentage}% complete.</span>
              {" "}
              {percentage < 50 && "Complete your profile to get better job matches and increase your visibility."}
              {percentage >= 50 && percentage < 80 && "You're making good progress! Complete a few more fields to maximize your profile."}
              {percentage >= 80 && "Almost there! Just a few more details to complete your profile."}
            </AlertDescription>
            
            {missingFields && missingFields.length > 0 && (
              <div className="text-xs text-gray-600">
                <span className="font-medium">Missing: </span>
                {missingFields.slice(0, 4).join(", ")}
                {missingFields.length > 4 && ` +${missingFields.length - 4} more`}
              </div>
            )}
            
            <div className="flex items-center gap-4">
              <Progress value={percentage} className="flex-1 max-w-xs" />
              <span className={`font-bold text-sm ${getColorClass()}`}>
                {percentage}%
              </span>
              <Button 
                size="sm" 
                onClick={handleComplete}
                className={getButtonClass()}
              >
                Complete Profile
              </Button>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-gray-600 hover:text-gray-700 hover:bg-gray-100 -mt-1 -mr-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}
