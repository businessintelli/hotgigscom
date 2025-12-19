import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import CandidateLayout from "@/components/CandidateLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Edit2 } from "lucide-react";
import ExtendedCandidateInfoForm, { ExtendedCandidateInfo } from "@/components/ExtendedCandidateInfoForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PhoneInput } from "@/components/ui/phone-input";
import { validatePhoneNumber } from "@shared/phoneValidation";

export default function CandidateProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  // Get candidate profile
  const { data: profile, refetch } = trpc.candidate.getProfile.useQuery(undefined, {
    enabled: !!user,
  });

  // Local state for editing
  const [editedProfile, setEditedProfile] = useState<any>(null);
  const [extendedInfo, setExtendedInfo] = useState<ExtendedCandidateInfo>({});

  // Initialize editing state when profile loads
  const startEditing = () => {
    if (!profile) return;
    
    setEditedProfile({
      title: profile.title || "",
      phoneNumber: profile.phoneNumber || "",
      location: profile.location || "",
      bio: profile.bio || "",
      skills: profile.skills ? JSON.parse(profile.skills) : [],
      linkedinUrl: profile.linkedinUrl || "",
      githubUrl: profile.githubUrl || "",
    });

    setExtendedInfo({
      currentSalary: profile.currentSalary || undefined,
      currentHourlyRate: profile.currentHourlyRate || undefined,
      expectedSalary: profile.expectedSalary || undefined,
      expectedHourlyRate: profile.expectedHourlyRate || undefined,
      salaryType: profile.salaryType || undefined,
      workAuthorization: profile.workAuthorization || undefined,
      workAuthorizationEndDate: profile.workAuthorizationEndDate ? new Date(profile.workAuthorizationEndDate).toISOString().split('T')[0] : undefined,
      w2EmployerName: profile.w2EmployerName || undefined,
      nationality: profile.nationality || undefined,
      gender: profile.gender || undefined,
      dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : undefined,
      highestEducation: profile.highestEducation || undefined,
      specialization: profile.specialization || undefined,
      highestDegreeStartDate: profile.highestDegreeStartDate ? new Date(profile.highestDegreeStartDate).toISOString().split('T')[0] : undefined,
      highestDegreeEndDate: profile.highestDegreeEndDate ? new Date(profile.highestDegreeEndDate).toISOString().split('T')[0] : undefined,
      employmentHistory: profile.employmentHistory ? JSON.parse(profile.employmentHistory) : undefined,
      languagesRead: profile.languagesRead ? JSON.parse(profile.languagesRead) : undefined,
      languagesSpeak: profile.languagesSpeak ? JSON.parse(profile.languagesSpeak) : undefined,
      languagesWrite: profile.languagesWrite ? JSON.parse(profile.languagesWrite) : undefined,
      currentResidenceZipCode: profile.currentResidenceZipCode || undefined,
      passportNumber: profile.passportNumber || undefined,
      sinLast4: profile.sinLast4 || undefined,
      linkedinId: profile.linkedinId || undefined,
      passportCopyUrl: profile.passportCopyUrl || undefined,
      dlCopyUrl: profile.dlCopyUrl || undefined,
    });

    setIsEditing(true);
  };

  const updateProfileMutation = trpc.candidate.updateProfile.useMutation({
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully",
      });
      setIsEditing(false);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!editedProfile) return;

    // Validate required fields
    if (!editedProfile.phoneNumber || !editedProfile.phoneNumber.trim()) {
      toast({
        title: "Validation Error",
        description: "Phone number is required",
        variant: "destructive",
      });
      return;
    }

    if (!editedProfile.location || !editedProfile.location.trim()) {
      toast({
        title: "Validation Error",
        description: "Location is required",
        variant: "destructive",
      });
      return;
    }

    // Validate phone number format
    const phoneValidation = validatePhoneNumber(editedProfile.phoneNumber);
    if (!phoneValidation.isValid) {
      toast({
        title: "Validation Error",
        description: phoneValidation.error || "Invalid phone number format",
        variant: "destructive",
      });
      return;
    }

    updateProfileMutation.mutate({
      title: editedProfile.title,
      phoneNumber: editedProfile.phoneNumber,
      location: editedProfile.location,
      bio: editedProfile.bio,
      skills: JSON.stringify(editedProfile.skills),
      linkedinUrl: editedProfile.linkedinUrl,
      githubUrl: editedProfile.githubUrl,
      // Extended info
      currentSalary: extendedInfo.currentSalary,
      currentHourlyRate: extendedInfo.currentHourlyRate,
      expectedSalary: extendedInfo.expectedSalary,
      expectedHourlyRate: extendedInfo.expectedHourlyRate,
      salaryType: extendedInfo.salaryType,
      workAuthorization: extendedInfo.workAuthorization,
      workAuthorizationEndDate: extendedInfo.workAuthorizationEndDate,
      w2EmployerName: extendedInfo.w2EmployerName,
      nationality: extendedInfo.nationality,
      gender: extendedInfo.gender,
      dateOfBirth: extendedInfo.dateOfBirth,
      highestEducation: extendedInfo.highestEducation,
      specialization: extendedInfo.specialization,
      highestDegreeStartDate: extendedInfo.highestDegreeStartDate,
      highestDegreeEndDate: extendedInfo.highestDegreeEndDate,
      employmentHistory: extendedInfo.employmentHistory ? JSON.stringify(extendedInfo.employmentHistory) : undefined,
      languagesRead: extendedInfo.languagesRead ? JSON.stringify(extendedInfo.languagesRead) : undefined,
      languagesSpeak: extendedInfo.languagesSpeak ? JSON.stringify(extendedInfo.languagesSpeak) : undefined,
      languagesWrite: extendedInfo.languagesWrite ? JSON.stringify(extendedInfo.languagesWrite) : undefined,
      currentResidenceZipCode: extendedInfo.currentResidenceZipCode,
      passportNumber: extendedInfo.passportNumber,
      sinLast4: extendedInfo.sinLast4,
      linkedinId: extendedInfo.linkedinId,
      passportCopyUrl: extendedInfo.passportCopyUrl,
      dlCopyUrl: extendedInfo.dlCopyUrl,
    });
  };

  const addSkill = () => {
    if (!newSkill.trim() || !editedProfile) return;
    setEditedProfile({
      ...editedProfile,
      skills: [...editedProfile.skills, newSkill.trim()],
    });
    setNewSkill("");
  };

  const removeSkill = (index: number) => {
    if (!editedProfile) return;
    setEditedProfile({
      ...editedProfile,
      skills: editedProfile.skills.filter((_: any, i: number) => i !== index),
    });
  };

  if (!profile) {
    return (
      <CandidateLayout title="My Profile">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </CandidateLayout>
    );
  }

  return (
    <CandidateLayout title="My Profile">
      <div className="container max-w-5xl py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-gray-600 mt-1">Manage your professional information</p>
          </div>
          {!isEditing ? (
            <Button onClick={startEditing}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Your core professional details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing && editedProfile ? (
                <>
                  <div>
                    <Label>Professional Title</Label>
                    <Input
                      value={editedProfile.title}
                      onChange={(e) => setEditedProfile({ ...editedProfile, title: e.target.value })}
                      placeholder="e.g., Senior Software Engineer"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Phone Number <span className="text-destructive">*</span></Label>
                      <PhoneInput
                        value={editedProfile.phoneNumber}
                        onChange={(value) => setEditedProfile({ ...editedProfile, phoneNumber: value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Location <span className="text-destructive">*</span></Label>
                      <Input
                        value={editedProfile.location}
                        onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                        placeholder="San Francisco, CA"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Professional Summary</Label>
                    <Textarea
                      value={editedProfile.bio}
                      onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                      rows={4}
                      placeholder="Tell us about your professional background..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>LinkedIn URL</Label>
                      <Input
                        value={editedProfile.linkedinUrl}
                        onChange={(e) => setEditedProfile({ ...editedProfile, linkedinUrl: e.target.value })}
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>
                    <div>
                      <Label>GitHub URL</Label>
                      <Input
                        value={editedProfile.githubUrl}
                        onChange={(e) => setEditedProfile({ ...editedProfile, githubUrl: e.target.value })}
                        placeholder="https://github.com/username"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {profile.title && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Professional Title</p>
                      <p className="text-lg">{profile.title}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {profile.phoneNumber && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Phone</p>
                        <p>{profile.phoneNumber}</p>
                      </div>
                    )}
                    {profile.location && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Location</p>
                        <p>{profile.location}</p>
                      </div>
                    )}
                  </div>
                  {profile.bio && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Professional Summary</p>
                      <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {profile.linkedinUrl && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">LinkedIn</p>
                        <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          View Profile
                        </a>
                      </div>
                    )}
                    {profile.githubUrl && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">GitHub</p>
                        <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          View Profile
                        </a>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
              <CardDescription>Your technical and professional skills</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing && editedProfile ? (
                <>
                  <div className="flex gap-2">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Add a skill..."
                      onKeyPress={(e) => e.key === "Enter" && addSkill()}
                    />
                    <Button onClick={addSkill} variant="outline">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editedProfile.skills.map((skill: string, index: number) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => removeSkill(index)}
                      >
                        {skill} ×
                      </Badge>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.skills && JSON.parse(profile.skills).map((skill: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                  {(!profile.skills || JSON.parse(profile.skills).length === 0) && (
                    <p className="text-gray-500">No skills added yet</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Extended Information */}
          {isEditing ? (
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
                <CardDescription>Compensation, work authorization, education, and more</CardDescription>
              </CardHeader>
              <CardContent>
                <ExtendedCandidateInfoForm
                  data={extendedInfo}
                  onChange={setExtendedInfo}
                />
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Compensation */}
              {(profile.currentSalary || profile.expectedSalary) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Compensation</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    {profile.currentSalary && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Current Salary</p>
                        <p>${profile.currentSalary.toLocaleString()}/year</p>
                      </div>
                    )}
                    {profile.expectedSalary && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Expected Salary</p>
                        <p>${profile.expectedSalary.toLocaleString()}/year</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Work Authorization */}
              {profile.workAuthorization && (
                <Card>
                  <CardHeader>
                    <CardTitle>Work Authorization</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Status</p>
                      <p>{profile.workAuthorization}</p>
                    </div>
                    {profile.workAuthorizationEndDate && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Valid Until</p>
                        <p>{new Date(profile.workAuthorizationEndDate).toLocaleDateString()}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Education */}
              {profile.highestEducation && (
                <Card>
                  <CardHeader>
                    <CardTitle>Education</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Highest Degree</p>
                      <p>{profile.highestEducation}</p>
                    </div>
                    {profile.specialization && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Specialization</p>
                        <p>{profile.specialization}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </CandidateLayout>
  );
}
