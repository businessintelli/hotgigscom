import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, User, Mail, Phone, MapPin, Briefcase, Calendar, Award, Languages } from "lucide-react";

export default function CandidateProfile() {
  const { user } = useAuth();
  const { data: candidate, isLoading } = trpc.candidate.getByUserId.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    title: "",
    bio: "",
    experienceYears: 0,
    skills: "",
    education: "",
    certifications: "",
    languages: "",
    linkedinUrl: "",
    githubUrl: "",

  });

  useEffect(() => {
    if (candidate) {
      setFormData({
        fullName: candidate.fullName || "",
        email: candidate.email || "",
        phone: candidate.phone || "",
        location: candidate.location || "",
        title: candidate.title || "",
        bio: candidate.bio || "",
        experienceYears: candidate.experienceYears || 0,
        skills: candidate.skills || "",
        education: candidate.education || "",
        certifications: candidate.certifications || "",
        languages: candidate.languages || "",
        linkedinUrl: candidate.linkedinUrl || "",
        githubUrl: candidate.githubUrl || "",

      });
    }
  }, [candidate]);

  const updateMutation = trpc.candidate.update.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully!");
    },
    onError: (error: any) => {
      toast.error("Failed to update profile");
      console.error(error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidate) return;

    updateMutation.mutate({
      id: candidate.id,
      ...formData,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "experienceYears" ? parseInt(value) || 0 : value,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-gray-600 mt-2">Manage your personal information and professional details</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Basic details about yourself</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="pl-10"
                    placeholder="City, Country"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Professional Information
            </CardTitle>
            <CardDescription>Your career details and experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Professional Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Senior Software Engineer"
              />
            </div>
            <div>
              <Label htmlFor="bio">Professional Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                placeholder="Tell us about your professional background and career goals..."
              />
            </div>
            <div>
              <Label htmlFor="experienceYears">Years of Experience</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="experienceYears"
                  name="experienceYears"
                  type="number"
                  value={formData.experienceYears}
                  onChange={handleChange}
                  className="pl-10"
                  min="0"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="skills">Skills</Label>
              <Textarea
                id="skills"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                rows={3}
                placeholder="e.g., JavaScript, React, Node.js, Python..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Education & Certifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Education & Certifications
            </CardTitle>
            <CardDescription>Your educational background and professional certifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="education">Education</Label>
              <Textarea
                id="education"
                name="education"
                value={formData.education}
                onChange={handleChange}
                rows={3}
                placeholder="e.g., Bachelor's in Computer Science, MIT, 2020"
              />
            </div>
            <div>
              <Label htmlFor="certifications">Certifications</Label>
              <Textarea
                id="certifications"
                name="certifications"
                value={formData.certifications}
                onChange={handleChange}
                rows={3}
                placeholder="e.g., AWS Certified Solutions Architect, Google Cloud Professional..."
              />
            </div>
            <div>
              <Label htmlFor="languages">Languages</Label>
              <div className="relative">
                <Languages className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="languages"
                  name="languages"
                  value={formData.languages}
                  onChange={handleChange}
                  className="pl-10"
                  placeholder="e.g., English (Native), Spanish (Fluent)"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Online Presence */}
        <Card>
          <CardHeader>
            <CardTitle>Online Presence</CardTitle>
            <CardDescription>Your professional profiles and portfolio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
              <Input
                id="linkedinUrl"
                name="linkedinUrl"
                value={formData.linkedinUrl}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
            <div>
              <Label htmlFor="githubUrl">GitHub URL</Label>
              <Input
                id="githubUrl"
                name="githubUrl"
                value={formData.githubUrl}
                onChange={handleChange}
                placeholder="https://github.com/yourusername"
              />
            </div>

          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
