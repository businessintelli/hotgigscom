import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock } from "lucide-react";
import { useState } from "react";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [, setLocation] = useLocation();
  const loginMutation = trpc.auth.login.useMutation();
  const clearSessionMutation = trpc.auth.clearSession.useMutation();

  const handleClearSession = async () => {
    try {
      await clearSessionMutation.mutateAsync();
      toast.success('Session cleared successfully. You can now sign in.');
      // Reload page to clear any cached state
      window.location.reload();
    } catch (err: any) {
      toast.error('Failed to clear session');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await loginMutation.mutateAsync({
        email,
        password,
        rememberMe,
      });

      console.log('Login result:', result);
      console.log('Login success:', result.success);
      console.log('User role:', result.role);

      if (result.success) {
        // Use window.location.href for full page reload to ensure cookie is set
        // This prevents the "Please login" error that occurs when using client-side navigation
        if (result.role === 'recruiter') {
          console.log('Redirecting to recruiter dashboard');
          window.location.href = '/recruiter/dashboard';
        } else if (result.role === 'candidate') {
          console.log('Redirecting to candidate dashboard');
          window.location.href = '/candidate-dashboard';
        } else {
          console.log('No role found, redirecting to role selection');
          // No role assigned yet - redirect to role selection
          window.location.href = '/select-role';
        }
      } else {
        console.log('Login was not successful');
        setError('Login failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.message || 'Sign in failed. Please try again.';
      setError(errorMessage);
      
      // Check if error is due to unverified email
      if (errorMessage.toLowerCase().includes('verify') || errorMessage.toLowerCase().includes('verification')) {
        toast.error(
          <div className="space-y-2">
            <p className="font-semibold">Email Not Verified</p>
            <p className="text-sm">Please verify your email before signing in.</p>
            <a href="/resend-verification" className="text-sm underline hover:text-blue-700">
              Resend verification email
            </a>
          </div>,
          { duration: 8000 }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Sign In to {APP_TITLE}</CardTitle>
          <CardDescription>Welcome back! Please sign in to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Remember me
                </label>
              </div>
              <a href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                Forgot password?
              </a>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm space-y-2">
                <p>{error}</p>
                {(error.toLowerCase().includes('verify') || error.toLowerCase().includes('verification')) && (
                  <p className="text-xs">
                    <a href="/resend-verification" className="underline hover:text-red-700 font-medium">
                      Click here to resend verification email
                    </a>
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>

            {/* Sign Up Link */}
            <div className="text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <a href="/signup" className="text-blue-600 hover:underline">
                Sign Up
              </a>
            </div>
            
            {/* Clear Session Button */}
            <div className="text-center pt-2 border-t">
              <button
                type="button"
                onClick={handleClearSession}
                disabled={clearSessionMutation.isPending}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                {clearSessionMutation.isPending ? "Clearing..." : "Having trouble signing in? Clear session"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
