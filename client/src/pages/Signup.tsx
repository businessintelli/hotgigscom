import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { APP_TITLE } from "@/const";

export default function Signup() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"recruiter" | "candidate">("candidate");
  const [isLoading, setIsLoading] = useState(false);

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: () => {
      alert("Account created successfully! Please log in with your credentials");
      
      // Redirect to login page
      setLocation("/login");
    },
    onError: (error) => {
      alert(`Signup failed: ${error.message}`);
      setIsLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation
    if (!email || !password || !confirmPassword) {
      alert("Please fill in all required fields");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      alert("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      alert("Password must contain at least one uppercase letter, one lowercase letter, and one number");
      setIsLoading(false);
      return;
    }

    signupMutation.mutate({ email, password, name: name || undefined, role });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">HG</span>
          </div>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>
            Join {APP_TITLE} and start your journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">I am a</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={role === "candidate" ? "default" : "outline"}
                  className={role === "candidate" ? "bg-gradient-to-r from-purple-600 to-pink-600" : ""}
                  onClick={() => setRole("candidate")}
                  disabled={isLoading}
                >
                  🎯 Candidate
                </Button>
                <Button
                  type="button"
                  variant={role === "recruiter" ? "default" : "outline"}
                  className={role === "recruiter" ? "bg-gradient-to-r from-blue-600 to-purple-600" : ""}
                  onClick={() => setRole("recruiter")}
                  disabled={isLoading}
                >
                  💼 Recruiter
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name (Optional)</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <p className="text-xs text-muted-foreground">
                At least 8 characters with 1 uppercase, 1 lowercase, and 1 number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Button
              variant="link"
              className="p-0 h-auto font-semibold"
              onClick={() => setLocation("/login")}
            >
              Sign in
            </Button>
          </div>

          <div className="mt-4 text-center">
            <Button
              variant="link"
              className="p-0 h-auto text-sm text-muted-foreground"
              onClick={() => setLocation("/")}
            >
              ← Back to home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
