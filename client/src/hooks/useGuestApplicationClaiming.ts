import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

/**
 * Hook to automatically claim guest applications when user logs in
 * Should be called in the main App component after authentication
 */
export function useGuestApplicationClaiming(user: any) {
  const hasAttemptedClaim = useRef(false);
  const claimMutation = trpc.guestApplication.claimApplications.useMutation({
    onSuccess: (data) => {
      if (data.claimedCount > 0) {
        toast.success(
          `Welcome back! We've linked ${data.claimedCount} previous application${data.claimedCount > 1 ? 's' : ''} to your account.`,
          {
            duration: 5000,
          }
        );
      }
    },
    onError: (error) => {
      console.error("Failed to claim guest applications:", error);
      // Silent failure - don't bother the user with this
    },
  });

  useEffect(() => {
    // Only attempt to claim once per session
    if (user && user.role === "candidate" && !hasAttemptedClaim.current) {
      hasAttemptedClaim.current = true;
      
      // Delay slightly to let the UI load first
      setTimeout(() => {
        claimMutation.mutate();
      }, 1000);
    }
  }, [user]);

  return {
    isClaiming: claimMutation.isPending,
    claimedCount: claimMutation.data?.claimedCount || 0,
  };
}
