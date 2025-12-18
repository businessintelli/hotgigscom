import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function VerifyEmail() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState("");
  
  const [, setLocation] = useLocation();
  const verifyMutation = trpc.auth.verifyEmail.useMutation();

  useEffect(() => {
    // Get token from URL query parameter
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    
    if (tokenParam) {
      setToken(tokenParam);
      // Automatically verify
      verifyEmail(tokenParam);
    } else {
      setStatus('error');
      setMessage('Invalid verification link. Please check your email for the correct link.');
    }
  }, []);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const result = await verifyMutation.mutateAsync({ token: verificationToken });
      if (result.success) {
        setStatus('success');
        setMessage(result.message || 'Email verified successfully!');
        // Redirect to sign in after 3 seconds
        setTimeout(() => {
          setLocation('/signin');
        }, 3000);
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Failed to verify email. The link may be expired or invalid.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
          <CardDescription>{APP_TITLE}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
              <p className="text-gray-600">Verifying your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold text-green-700">Success!</p>
                <p className="text-gray-600">{message}</p>
                <p className="text-sm text-gray-500">Redirecting to sign in...</p>
              </div>
              <Button onClick={() => setLocation('/signin')} className="w-full">
                Go to Sign In
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center space-y-4">
              <XCircle className="h-16 w-16 text-red-600" />
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold text-red-700">Verification Failed</p>
                <p className="text-gray-600">{message}</p>
              </div>
              <div className="w-full space-y-2">
                <Button onClick={() => setLocation('/signin')} className="w-full">
                  Go to Sign In
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation('/signup')} 
                  className="w-full"
                >
                  Sign Up Again
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
