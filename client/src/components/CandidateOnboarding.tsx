import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface CandidateOnboardingProps {
  open: boolean;
  onComplete: () => void;
}

export default function CandidateOnboarding({ open, onComplete }: CandidateOnboardingProps) {
  const [title, setTitle] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");

  const { data: profile } = trpc.candidate.getProfile.useQuery();
  
  const updateProfile = trpc.candidate.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile completed successfully!");
      onComplete();
    },
    onError: (error) => {
      toast.error(`Failed to update profile: ${error.message}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Professional title is required");
      return;
    }

    if (!profile?.id) {
      toast.error("Profile not found");
      return;
    }

    updateProfile.mutate({
      id: profile.id,
      title: title.trim(),
      phoneNumber: phoneNumber.trim() || undefined,
      location: location.trim() || undefined,
      bio: bio.trim() || undefined,
    });
  };

  const handleSkip = () => {
    toast.info("You can complete your profile later from settings");
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to HotGigs! 🎉</DialogTitle>
          <DialogDescription>
            Let's set up your candidate profile to help you find your dream job. This information helps recruiters find you.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Professional Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., Senior Full-Stack Developer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., San Francisco, CA"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="e.g., +1-555-0123"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Professional Summary</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about your experience, skills, and career goals..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Highlight your key skills, experience, and what you're looking for in your next role
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
            >
              Skip for Now
            </Button>
            <Button
              type="submit"
              disabled={updateProfile.isPending}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {updateProfile.isPending ? "Saving..." : "Complete Profile"}
            </Button>
          </div>
        </form>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>💡 Next Step:</strong> After completing your profile, upload your resume to get matched with relevant job opportunities!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
