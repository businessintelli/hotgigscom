import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Clock, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function SessionInfo() {
  const { user } = useAuth();

  if (!user || !(user as any).sessionExpiry) return null;

  const sessionExpiry = new Date((user as any).sessionExpiry);
  const rememberMe = (user as any).rememberMe;
  const now = new Date();
  const timeUntilExpiry = sessionExpiry.getTime() - now.getTime();
  
  // Don't show if session expires in more than 7 days
  if (timeUntilExpiry > 7 * 24 * 60 * 60 * 1000) return null;

  return (
    <Card className="p-4 bg-blue-50 border-blue-200">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Clock className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm text-blue-900">Session Information</h3>
          <p className="text-sm text-blue-700 mt-1">
            {rememberMe ? (
              <>
                <Shield className="inline h-4 w-4 mr-1" />
                You're staying signed in. Your session expires{" "}
                {formatDistanceToNow(sessionExpiry, { addSuffix: true })}.
              </>
            ) : (
              <>
                Your session expires{" "}
                {formatDistanceToNow(sessionExpiry, { addSuffix: true })}.
                <br />
                <span className="text-xs">
                  Enable "Remember Me" when signing in to stay signed in for 30 days.
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    </Card>
  );
}
