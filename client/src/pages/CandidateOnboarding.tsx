import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Briefcase, DollarSign, CheckCircle, MapPin, Phone } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function CandidateOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [, setLocation] = useLocation();
  
  // Step 1: Basic Info
  const [title, setTitle] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [location, setLocationValue] = useState("");
  
  // Step 2: Skills & Experience
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");
  
  // Step 3: Preferences
  const [availability, setAvailability] = useState("");
  const [expectedSalaryMin, setExpectedSalaryMin] = useState("");
  const [expectedSalaryMax, setExpectedSalaryMax] = useState("");
  const [willingToRelocate, setWillingToRelocate] = useState(false);
  
  const updateStepMutation = trpc.profileCompletion.updateCandidateStep.useMutation();
  const skipMutation = trpc.profileCompletion.skipOnboarding.useMutation();

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const handleNext = async () => {
    try {
      if (currentStep === 1) {
        // Save basic info
        await updateStepMutation.mutateAsync({
          step: 1,
          data: { title, phoneNumber, location },
        });
        setCurrentStep(2);
      } else if (currentStep === 2) {
        // Save skills & experience
        await updateStepMutation.mutateAsync({
          step: 2,
          data: { skills, experience, bio },
        });
        setCurrentStep(3);
      } else if (currentStep === 3) {
        // Save preferences
        await updateStepMutation.mutateAsync({
          step: 3,
          data: {
            availability,
            expectedSalaryMin: expectedSalaryMin ? parseInt(expectedSalaryMin) : undefined,
            expectedSalaryMax: expectedSalaryMax ? parseInt(expectedSalaryMax) : undefined,
            willingToRelocate,
          },
        });
        setCurrentStep(4);
      } else if (currentStep === 4) {
        // Mark as completed
        await updateStepMutation.mutateAsync({
          step: 4,
          markCompleted: true,
        });
        setLocation('/candidate-dashboard');
      }
    } catch (error) {
      console.error('Failed to save step:', error);
    }
  };

  const handleSkip = async () => {
    try {
      await skipMutation.mutateAsync();
      setLocation('/candidate-dashboard');
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
            Step {currentStep} of {totalSteps} - Let's build your professional profile
          </CardDescription>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 text-blue-600">
                <User className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Basic Information</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Professional Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Senior Software Engineer"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
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
                
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="location"
                      placeholder="e.g., San Francisco, CA"
                      value={location}
                      onChange={(e) => setLocationValue(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Skills & Experience */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 text-blue-600">
                <Briefcase className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Skills & Experience</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="skills">Key Skills *</Label>
                  <Input
                    id="skills"
                    placeholder="e.g., JavaScript, React, Node.js, Python"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">
                    Separate skills with commas
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="experience">Work Experience</Label>
                  <Textarea
                    id="experience"
                    placeholder="Briefly describe your work experience..."
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Professional Summary</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell employers about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 text-blue-600">
                <DollarSign className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Job Preferences</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="availability">Availability</Label>
                  <Select value={availability} onValueChange={setAvailability}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="2-weeks">2 weeks notice</SelectItem>
                      <SelectItem value="1-month">1 month notice</SelectItem>
                      <SelectItem value="2-months">2 months notice</SelectItem>
                      <SelectItem value="not-looking">Not actively looking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Expected Salary Range (Annual)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        type="number"
                        placeholder="Min (e.g., 80000)"
                        value={expectedSalaryMin}
                        onChange={(e) => setExpectedSalaryMin(e.target.value)}
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        placeholder="Max (e.g., 120000)"
                        value={expectedSalaryMax}
                        onChange={(e) => setExpectedSalaryMax(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="relocate"
                    checked={willingToRelocate}
                    onCheckedChange={(checked) => setWillingToRelocate(checked as boolean)}
                  />
                  <label
                    htmlFor="relocate"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Willing to relocate for the right opportunity
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Completion */}
          {currentStep === 4 && (
            <div className="space-y-6 text-center py-8">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-900">Profile Complete!</h3>
                <p className="text-gray-600">
                  Your profile is ready. Start exploring job opportunities that match your skills.
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h4 className="font-semibold text-blue-900 mb-2">What's next?</h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• Browse available job openings</li>
                  <li>• Upload your resume for better matching</li>
                  <li>• Apply to jobs that interest you</li>
                  <li>• Complete AI-powered video interviews</li>
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
              disabled={
                (currentStep === 1 && !title) ||
                (currentStep === 2 && !skills)
              }
            >
              {currentStep === totalSteps ? 'Go to Dashboard' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
