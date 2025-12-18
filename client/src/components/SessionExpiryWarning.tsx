import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function SessionExpiryWarning() {
  const { user } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const extendSessionMutation = trpc.auth.extendSession.useMutation();

  useEffect(() => {
    if (!user || !(user as any).sessionExpiry) return;

    const sessionExpiry = new Date((user as any).sessionExpiry);
    const now = new Date();
    const timeUntilExpiry = sessionExpiry.getTime() - now.getTime();
    
    // Show warning 5 minutes before expiry
    const warningTime = timeUntilExpiry - (5 * 60 * 1000);
    
    if (warningTime > 0) {
      const warningTimeout = setTimeout(() => {
        setShowWarning(true);
        toast.warning(
          <div className="flex flex-col gap-2">
            <p className="font-semibold">Your session will expire soon</p>
            <p className="text-sm">Your session will expire in 5 minutes. Would you like to extend it?</p>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleExtendSession}
                disabled={extendSessionMutation.isPending}
              >
                {extendSessionMutation.isPending ? "Extending..." : "Extend Session"}
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => toast.dismiss()}
              >
                Dismiss
              </Button>
            </div>
          </div>,
          {
            duration: Infinity, // Keep toast visible until user interacts
            closeButton: false,
          }
        );
      }, warningTime);

      return () => clearTimeout(warningTimeout);
    } else if (timeUntilExpiry > 0) {
      // Already within warning window
      setShowWarning(true);
    }
  }, [user]);

  const handleExtendSession = async () => {
    try {
      await extendSessionMutation.mutateAsync();
      toast.success("Session extended successfully! You'll stay signed in for 30 more days.");
      setShowWarning(false);
      // Refresh user data to get new expiry
      window.location.reload();
    } catch (error) {
      toast.error("Failed to extend session. Please sign in again if your session expires.");
    }
  };

  return null; // This component only manages toasts, no UI
}
