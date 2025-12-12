import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, X } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

interface ProfileCompletionBannerProps {
  percentage: number;
  role: "recruiter" | "candidate";
  onDismiss?: () => void;
}

export function ProfileCompletionBanner({ percentage, role, onDismiss }: ProfileCompletionBannerProps) {
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

  return (
    <Alert className="mb-6 border-blue-200 bg-blue-50">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1 space-y-2">
            <AlertDescription className="text-blue-900">
              <span className="font-semibold">Your profile is {percentage}% complete.</span>
              {" "}Complete your profile to get better job matches and stand out to employers.
            </AlertDescription>
            <div className="flex items-center gap-4">
              <Progress value={percentage} className="flex-1 max-w-xs" />
              <Button 
                size="sm" 
                onClick={handleComplete}
                className="bg-blue-600 hover:bg-blue-700"
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
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 -mt-1 -mr-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}
