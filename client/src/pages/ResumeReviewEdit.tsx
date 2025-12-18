import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, Edit2, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ParsedResume {
  personalInfo: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
  };
  summary?: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate?: string;
    description: string;
    duration?: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    location?: string;
    graduationDate?: string;
    gpa?: string;
    fieldOfStudy?: string;
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    date?: string;
  }>;
  languages?: Array<{
    language: string;
    proficiency: string;
  }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies?: string[];
  }>;
  metadata?: {
    totalExperienceYears?: number;
    seniorityLevel?: string;
    primaryDomain?: string;
    skillCategories?: Record<string, string[]>;
  };
}

interface ResumeReviewEditProps {
  parsedData: ParsedResume;
  resumeUrl: string;
  resumeFilename: string;
  onSave: (data: ParsedResume) => void;
  onCancel: () => void;
}

export default function ResumeReviewEdit() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [editedData, setEditedData] = useState<ParsedResume | null>(null);
  const [newSkill, setNewSkill] = useState("");
  const [resumeMetadata, setResumeMetadata] = useState<any>(null);

  // Get data from location state
  useEffect(() => {
    const state = (window.history.state as any)?.state;
    if (state?.parsedData) {
      setEditedData(state.parsedData);
      setResumeMetadata({
        resumeUrl: state.resumeUrl,
        fileKey: state.fileKey,
        fileName: state.fileName,
        profileName: state.profileName,
        isDefault: state.isDefault,
        candidateId: state.candidateId,
      });
    }
  }, []);

  const saveProfileMutation = trpc.resumeProfile.saveResumeProfile.useMutation({
    onSuccess: () => {
      toast({
        title: "Resume saved",
        description: "Your resume has been saved to your profile",
      });
      setLocation("/candidate/my-resumes");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save resume",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!editedData || !resumeMetadata) return;

    saveProfileMutation.mutate({
      candidateId: resumeMetadata.candidateId,
      profileName: resumeMetadata.profileName,
      resumeUrl: resumeMetadata.resumeUrl,
      fileKey: resumeMetadata.fileKey,
      fileName: resumeMetadata.fileName,
      parsedData: editedData,
      isDefault: resumeMetadata.isDefault,
    });
  };

  const addSkill = () => {
    if (!newSkill.trim() || !editedData) return;
    setEditedData({
      ...editedData,
      skills: [...editedData.skills, newSkill.trim()],
    });
    setNewSkill("");
  };

  const removeSkill = (index: number) => {
    if (!editedData) return;
    setEditedData({
      ...editedData,
      skills: editedData.skills.filter((_, i) => i !== index),
    });
  };

  const updateExperience = (index: number, field: string, value: string) => {
    if (!editedData) return;
    const newExperience = [...editedData.experience];
    newExperience[index] = { ...newExperience[index], [field]: value };
    setEditedData({ ...editedData, experience: newExperience });
  };

  const updateEducation = (index: number, field: string, value: string) => {
    if (!editedData) return;
    const newEducation = [...editedData.education];
    newEducation[index] = { ...newEducation[index], [field]: value };
    setEditedData({ ...editedData, education: newEducation });
  };

  if (!editedData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading resume data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Review & Edit Your Resume</h1>
          <p className="text-gray-600">
            Review the information we extracted from your resume. Make any necessary corrections before saving to your profile.
          </p>
        </div>

        <div className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit2 className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={editedData.personalInfo.name}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        personalInfo: { ...editedData.personalInfo, name: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editedData.personalInfo.email}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        personalInfo: { ...editedData.personalInfo, email: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={editedData.personalInfo.phone || ""}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        personalInfo: { ...editedData.personalInfo, phone: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    value={editedData.personalInfo.location || ""}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        personalInfo: { ...editedData.personalInfo, location: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label>LinkedIn</Label>
                  <Input
                    value={editedData.personalInfo.linkedin || ""}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        personalInfo: { ...editedData.personalInfo, linkedin: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label>GitHub</Label>
                  <Input
                    value={editedData.personalInfo.github || ""}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        personalInfo: { ...editedData.personalInfo, github: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editedData.summary || ""}
                onChange={(e) => setEditedData({ ...editedData, summary: e.target.value })}
                rows={4}
                placeholder="Add a brief professional summary..."
              />
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
              <CardDescription>Add or remove skills as needed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                {editedData.skills.map((skill, index) => (
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
            </CardContent>
          </Card>

          {/* Experience */}
          <Card>
            <CardHeader>
              <CardTitle>Work Experience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {editedData.experience.map((exp, index) => (
                <div key={index} className="border-b pb-4 last:border-0">
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <Label>Job Title</Label>
                      <Input
                        value={exp.title}
                        onChange={(e) => updateExperience(index, "title", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Company</Label>
                      <Input
                        value={exp.company}
                        onChange={(e) => updateExperience(index, "company", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        value={exp.startDate}
                        onChange={(e) => updateExperience(index, "startDate", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input
                        value={exp.endDate || ""}
                        onChange={(e) => updateExperience(index, "endDate", e.target.value)}
                        placeholder="Present"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={exp.description}
                      onChange={(e) => updateExperience(index, "description", e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Education */}
          <Card>
            <CardHeader>
              <CardTitle>Education</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {editedData.education.map((edu, index) => (
                <div key={index} className="border-b pb-4 last:border-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Degree</Label>
                      <Input
                        value={edu.degree}
                        onChange={(e) => updateEducation(index, "degree", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Institution</Label>
                      <Input
                        value={edu.institution}
                        onChange={(e) => updateEducation(index, "institution", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Field of Study</Label>
                      <Input
                        value={edu.fieldOfStudy || ""}
                        onChange={(e) => updateEducation(index, "fieldOfStudy", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Graduation Date</Label>
                      <Input
                        value={edu.graduationDate || ""}
                        onChange={(e) => updateEducation(index, "graduationDate", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <Button variant="outline" onClick={() => setLocation("/candidate/profile")}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveProfileMutation.isPending}>
              {saveProfileMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save to Profile
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
