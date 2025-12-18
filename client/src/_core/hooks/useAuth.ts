import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();
  const hasAttemptedClaim = useRef(false);
  
  const claimGuestApplicationsMutation = trpc.guestApplication.claimApplications.useMutation({
    onSuccess: (data) => {
      if (data.claimedCount > 0) {
        toast.success(
          `Welcome back! We've linked ${data.claimedCount} previous application${data.claimedCount > 1 ? 's' : ''} to your account.`,
          { duration: 5000 }
        );
      }
    },
    onError: (error) => {
      console.error("Failed to claim guest applications:", error);
    },
  });

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    // Force refetch if we have a token but no user data
    enabled: true,
    staleTime: 0, // Always consider data stale to force refetch
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        // Ignore unauthorized errors during logout
      } else {
        console.error('Logout error:', error);
      }
    } finally {
      // Clear all auth-related data from localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('manus-runtime-user-info');
      
      // Clear tRPC cache
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
      
      // Redirect to home page
      window.location.href = '/';
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    // Store user info in localStorage for persistence (but don't use it for state)
    if (meQuery.data) {
      localStorage.setItem(
        "manus-runtime-user-info",
        JSON.stringify(meQuery.data)
      );
    }
    return {
      user: meQuery.data ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  // Auto-claim guest applications for candidates
  useEffect(() => {
    if (state.user && state.user.role === "candidate" && !hasAttemptedClaim.current) {
      hasAttemptedClaim.current = true;
      setTimeout(() => {
        claimGuestApplicationsMutation.mutate();
      }, 1000);
    }
  }, [state.user]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
