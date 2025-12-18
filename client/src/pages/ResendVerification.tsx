import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, CheckCircle } from "lucide-react";
import { useState } from "react";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ResendVerification() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const resendMutation = trpc.auth.resendVerification.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const result = await resendMutation.mutateAsync({ email });
      
      if (result.success) {
        setSuccess(true);
        toast.success('Verification email sent! Please check your inbox.');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send verification email. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Resend Verification Email</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a new verification link
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">Email Sent!</h3>
                <p className="text-sm text-gray-600">
                  We've sent a verification link to <strong>{email}</strong>
                </p>
                <p className="text-sm text-gray-600">
                  Please check your inbox and click the link to verify your account.
                </p>
                <p className="text-xs text-gray-500 mt-4">
                  Don't see the email? Check your spam folder or wait a few minutes.
                </p>
              </div>
              <div className="pt-4 space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setSuccess(false);
                    setEmail("");
                  }}
                >
                  Send to a Different Email
                </Button>
                <Button 
                  className="w-full"
                  onClick={() => window.location.href = '/signin'}
                >
                  Back to Sign In
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Enter the email address you used to sign up
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Verification Email"}
              </Button>

              {/* Back to Sign In Link */}
              <div className="text-center text-sm text-gray-600">
                Remember your password?{" "}
                <a href="/signin" className="text-blue-600 hover:underline">
                  Sign In
                </a>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
