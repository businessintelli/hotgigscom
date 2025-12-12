import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Building2, Phone, FileText, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { APP_TITLE } from "@/const";

export default function RecruiterOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [, setLocation] = useLocation();
  
  // Step 1: Company Information
  const [companyName, setCompanyName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  
  // Step 2: Bio
  const [bio, setBio] = useState("");
  
  const updateStepMutation = trpc.profileCompletion.updateRecruiterStep.useMutation();
  const skipMutation = trpc.profileCompletion.skipOnboarding.useMutation();

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  const handleNext = async () => {
    try {
      if (currentStep === 1) {
        // Save company info
        await updateStepMutation.mutateAsync({
          step: 1,
          data: { companyName, phoneNumber },
        });
        setCurrentStep(2);
      } else if (currentStep === 2) {
        // Save bio
        await updateStepMutation.mutateAsync({
          step: 2,
          data: { bio },
        });
        setCurrentStep(3);
      } else if (currentStep === 3) {
        // Mark as completed
        await updateStepMutation.mutateAsync({
          step: 3,
          markCompleted: true,
        });
        setLocation('/recruiter/dashboard');
      }
    } catch (error) {
      console.error('Failed to save step:', error);
    }
  };

  const handleSkip = async () => {
    try {
      await skipMutation.mutateAsync();
      setLocation('/recruiter/dashboard');
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip for now
            </Button>
          </div>
          <CardDescription>
            Step {currentStep} of {totalSteps} - Let's set up your recruiter profile
          </CardDescription>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Step 1: Company Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 text-blue-600">
                <Building2 className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Company Information</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    placeholder="e.g., Acme Corp"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Bio */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 text-blue-600">
                <FileText className="h-5 w-5" />
                <h3 className="text-lg font-semibold">About You</h3>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Professional Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell candidates about yourself and your company..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={6}
                />
                <p className="text-sm text-gray-500">
                  Share your experience, company culture, and what makes your organization a great place to work.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Completion */}
          {currentStep === 3 && (
            <div className="space-y-6 text-center py-8">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-900">You're All Set!</h3>
                <p className="text-gray-600">
                  Your recruiter profile is ready. You can now start posting jobs and finding great candidates.
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h4 className="font-semibold text-blue-900 mb-2">What's next?</h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• Post your first job opening</li>
                  <li>• Browse candidate profiles</li>
                  <li>• Set up AI-powered interviews</li>
                  <li>• Track applications and schedule interviews</li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={currentStep === 1 && !companyName}
            >
              {currentStep === totalSteps ? 'Go to Dashboard' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
