import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Target } from "lucide-react";
import { getLoginUrl } from "@/const";

interface RoleSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleSelectionDialog({ open, onOpenChange }: RoleSelectionDialogProps) {
  const handleSelectRole = (role: 'recruiter' | 'candidate') => {
    // Redirect to OAuth with role parameter
    window.location.href = getLoginUrl(role);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Choose Your Role</DialogTitle>
          <DialogDescription className="text-center">
            Select how you'd like to use the platform
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          {/* Recruiter Card */}
          <Card 
            className="hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-500 cursor-pointer"
            onClick={() => handleSelectRole('recruiter')}
          >
            <CardHeader>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl text-center">I'm a Recruiter</CardTitle>
              <CardDescription className="text-center">
                Post jobs and find candidates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Post unlimited job openings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>AI-powered candidate matching</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Application tracking system</span>
                </li>
              </ul>
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectRole('recruiter');
                }}
              >
                Continue as Recruiter
              </Button>
            </CardContent>
          </Card>

          {/* Candidate Card */}
          <Card 
            className="hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-500 cursor-pointer"
            onClick={() => handleSelectRole('candidate')}
          >
            <CardHeader>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl text-center">I'm a Candidate</CardTitle>
              <CardDescription className="text-center">
                Find your dream job
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Browse thousands of jobs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>AI-powered job recommendations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>One-click applications</span>
                </li>
              </ul>
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectRole('candidate');
                }}
              >
                Continue as Candidate
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
