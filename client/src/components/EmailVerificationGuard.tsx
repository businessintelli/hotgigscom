import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

interface EmailVerificationGuardProps {
  children: React.ReactNode;
}

export function EmailVerificationGuard({ children }: EmailVerificationGuardProps) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Don't redirect while loading
    if (loading) return;
    
    // If no user, let the auth system handle redirect
    if (!user) return;
    
    // If user is not verified, redirect to verification required page
    if (user.emailVerified === false) {
      console.log("[EmailVerificationGuard] User not verified, redirecting to /verification-required");
      setLocation("/verification-required");
    }
  }, [user, loading, setLocation]);

  // Show loading state while checking
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // If user is not verified, don't render children
  if (user && user.emailVerified === false) {
    return null;
  }

  // User is verified, render children
  return <>{children}</>;
}
