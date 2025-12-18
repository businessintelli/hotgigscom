import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function VerificationRequired() {
  const { user, logout } = useAuth();
  const [emailSent, setEmailSent] = useState(false);
  
  const resendMutation = trpc.auth.resendVerification.useMutation({
    onSuccess: () => {
      setEmailSent(true);
    },
  });

  const handleResend = () => {
    if (!user?.email) return;
    resendMutation.mutate({ email: user.email });
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/signin";
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-purple-600" />
          </div>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription>
            Please verify your email address to access your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!emailSent ? (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  We sent a verification link to <strong>{user.email}</strong>. 
                  Please check your inbox and click the link to verify your account.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  Didn't receive the email? Check your spam folder or request a new one.
                </p>
                
                <Button
                  onClick={handleResend}
                  disabled={resendMutation.isPending}
                  className="w-full"
                  variant="outline"
                >
                  {resendMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Resend Verification Email
                    </>
                  )}
                </Button>

                {resendMutation.isError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {resendMutation.error?.message || "Failed to send email. Please try again."}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </>
          ) : (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Verification email sent successfully! Please check your inbox at <strong>{user.email}</strong>.
              </AlertDescription>
            </Alert>
          )}

          <div className="pt-4 border-t">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full"
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
