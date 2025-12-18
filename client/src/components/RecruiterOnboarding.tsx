import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface RecruiterOnboardingProps {
  open: boolean;
  onComplete: () => void;
}

export default function RecruiterOnboarding({ open, onComplete }: RecruiterOnboardingProps) {
  const [companyName, setCompanyName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bio, setBio] = useState("");

  const utils = trpc.useUtils();
  const { data: profile } = trpc.recruiter.getProfile.useQuery();
  
  const updateProfile = trpc.recruiter.updateProfile.useMutation({
    onSuccess: async () => {
      toast.success("Profile completed successfully!");
      // Invalidate and refetch the profile to update the cache
      await utils.recruiter.getProfile.invalidate();
      onComplete();
    },
    onError: (error) => {
      toast.error(`Failed to update profile: ${error.message}`);
    },
  });

  // Pre-fill form if profile has existing data
  useEffect(() => {
    if (profile) {
      if (profile.companyName) setCompanyName(profile.companyName);
      if (profile.phoneNumber) setPhoneNumber(profile.phoneNumber);
      if (profile.bio) setBio(profile.bio);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyName.trim()) {
      toast.error("Company name is required");
      return;
    }

    if (!profile?.id) {
      toast.error("Profile not found");
      return;
    }

    updateProfile.mutate({
      id: profile.id,
      companyName: companyName.trim(),
      phoneNumber: phoneNumber.trim() || undefined,
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
            Let's set up your recruiter profile to get started. This helps candidates and clients learn more about you.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">
              Company Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="companyName"
              placeholder="e.g., TechRecruit Solutions"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
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
            <Label htmlFor="bio">Professional Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about your recruiting experience and specialties..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Share your experience, areas of expertise, and what makes you a great recruiter
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
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {updateProfile.isPending ? "Saving..." : "Complete Profile"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
