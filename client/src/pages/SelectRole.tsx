import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Target } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import type { TRPCClientErrorLike } from "@trpc/client";
import { APP_TITLE } from "@/const";
import { useToast } from "@/hooks/use-toast";

export default function SelectRole() {
  const [, setLocation] = useLocation();
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  
  const createRecruiterMutation = trpc.user.createRecruiterProfile.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Recruiter profile created successfully",
      });
      setLocation("/recruiter/dashboard");
    },
    onError: (error: TRPCClientErrorLike<any>) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create recruiter profile",
        variant: "destructive",
      });
      setIsCreating(false);
    },
  });

  const createCandidateMutation = trpc.user.createCandidateProfile.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Candidate profile created successfully",
      });
      setLocation("/candidate-dashboard");
    },
    onError: (error: TRPCClientErrorLike<any>) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create candidate profile",
        variant: "destructive",
      });
      setIsCreating(false);
    },
  });

  const handleSelectRole = (role: 'recruiter' | 'candidate') => {
    setIsCreating(true);
    if (role === 'recruiter') {
      createRecruiterMutation.mutate();
    } else {
      createCandidateMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to {APP_TITLE}!
          </h1>
          <p className="text-xl text-gray-600">
            Choose how you'd like to use the platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Recruiter Card */}
          <Card className="hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-500">
            <CardHeader>
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl text-center">I'm a Recruiter</CardTitle>
              <CardDescription className="text-center text-base">
                Post jobs, find candidates, and manage your recruitment process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Post unlimited job openings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>AI-powered candidate matching</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Application tracking system</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Interview management tools</span>
                </li>
              </ul>
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                onClick={() => handleSelectRole('recruiter')}
                disabled={isCreating}
              >
                {isCreating ? "Creating Profile..." : "Continue as Recruiter"}
              </Button>
            </CardContent>
          </Card>

          {/* Candidate Card */}
          <Card className="hover:shadow-2xl transition-all duration-300 border-2 hover:border-purple-500">
            <CardHeader>
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl text-center">I'm a Candidate</CardTitle>
              <CardDescription className="text-center text-base">
                Find your dream job and connect with top employers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Browse thousands of job openings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>AI-powered job recommendations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>One-click job applications</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Track your application status</span>
                </li>
              </ul>
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                onClick={() => handleSelectRole('candidate')}
                disabled={isCreating}
              >
                {isCreating ? "Creating Profile..." : "Continue as Candidate"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
