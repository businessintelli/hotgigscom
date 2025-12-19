import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  User, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Languages, 
  AlertCircle,
  CheckCircle2,
  Edit2,
  Save,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface ParsedData {
  personalInfo: {
    name?: string;
    email?: string;
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
    startDate?: string;
    endDate?: string;
    description?: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    location?: string;
    graduationDate?: string;
    fieldOfStudy?: string;
  }>;
  certifications: string[];
  languages: {
    read: string[];
    speak: string[];
    write: string[];
  };
  projects: Array<{
    name: string;
    description: string;
    technologies?: string[];
  }>;
  metadata?: {
    totalExperienceYears?: number;
    seniorityLevel?: string;
    primaryDomain?: string;
  };
}

interface BiasDetection {
  overallScore: number;
  biasCategories: Array<{
    category: string;
    score: number;
    issues: string[];
  }>;
}

interface ResumeParseWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parsedData: ParsedData | null;
  biasDetection?: BiasDetection | null;
  fileName: string;
  onConfirm: (editedData: ParsedData) => Promise<void>;
  onCancel: () => void;
}

export default function ResumeParseWizard({
  open,
  onOpenChange,
  parsedData,
  biasDetection,
  fileName,
  onConfirm,
  onCancel,
}: ResumeParseWizardProps) {
  const [editedData, setEditedData] = useState<ParsedData | null>(parsedData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  // Update edited data when parsed data changes
  useState(() => {
    if (parsedData) {
      setEditedData(parsedData);
    }
  });

  const handleConfirm = async () => {
    if (!editedData) return;
    
    setIsSubmitting(true);
    try {
      await onConfirm(editedData);
      toast.success('Profile updated successfully!');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update profile');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  const updatePersonalInfo = (field: string, value: string) => {
    setEditedData(prev => prev ? {
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    } : null);
  };

  const updateSummary = (value: string) => {
    setEditedData(prev => prev ? { ...prev, summary: value } : null);
  };

  const updateSkills = (value: string) => {
    const skillsArray = value.split(',').map(s => s.trim()).filter(Boolean);
    setEditedData(prev => prev ? { ...prev, skills: skillsArray } : null);
  };

  if (!editedData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Review Parsed Resume Data
          </DialogTitle>
          <DialogDescription>
            Review and edit the information extracted from <strong>{fileName}</strong>. 
            Make any necessary corrections before saving to your profile.
          </DialogDescription>
        </DialogHeader>

        {/* Bias Detection Alert */}
        {biasDetection && biasDetection.overallScore < 70 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                  Potential Bias Detected (Score: {biasDetection.overallScore}/100)
                </h4>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Some sections may contain biased language. Review the highlighted areas below.
                </p>
              </div>
            </div>
          </div>
        )}

        <ScrollArea className="flex-1 pr-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="personal" className="text-xs">
                <User className="h-4 w-4 mr-1" />
                Personal
              </TabsTrigger>
              <TabsTrigger value="summary" className="text-xs">
                <FileText className="h-4 w-4 mr-1" />
                Summary
              </TabsTrigger>
              <TabsTrigger value="experience" className="text-xs">
                <Briefcase className="h-4 w-4 mr-1" />
                Experience
              </TabsTrigger>
              <TabsTrigger value="education" className="text-xs">
                <GraduationCap className="h-4 w-4 mr-1" />
                Education
              </TabsTrigger>
              <TabsTrigger value="skills" className="text-xs">
                <Award className="h-4 w-4 mr-1" />
                Skills
              </TabsTrigger>
            </TabsList>

            {/* Personal Info Tab */}
            <TabsContent value="personal" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={editedData.personalInfo.name || ''}
                        onChange={(e) => updatePersonalInfo('name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editedData.personalInfo.email || ''}
                        onChange={(e) => updatePersonalInfo('email', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={editedData.personalInfo.phone || ''}
                        onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={editedData.personalInfo.location || ''}
                        onChange={(e) => updatePersonalInfo('location', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <Input
                        id="linkedin"
                        value={editedData.personalInfo.linkedin || ''}
                        onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="github">GitHub</Label>
                      <Input
                        id="github"
                        value={editedData.personalInfo.github || ''}
                        onChange={(e) => updatePersonalInfo('github', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Summary Tab */}
            <TabsContent value="summary" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Professional Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={editedData.summary || ''}
                    onChange={(e) => updateSummary(e.target.value)}
                    rows={10}
                    placeholder="Enter your professional summary..."
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Experience Tab */}
            <TabsContent value="experience" className="space-y-4 mt-4">
              {editedData.experience.map((exp, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>{exp.title} at {exp.company}</span>
                      <Badge variant="secondary">
                        {exp.startDate} - {exp.endDate || 'Present'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      {exp.location}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{exp.description}</p>
                  </CardContent>
                </Card>
              ))}
              {editedData.experience.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No experience information found
                </div>
              )}
            </TabsContent>

            {/* Education Tab */}
            <TabsContent value="education" className="space-y-4 mt-4">
              {editedData.education.map((edu, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-base">{edu.degree}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="font-medium">{edu.institution}</div>
                    {edu.fieldOfStudy && (
                      <div className="text-sm text-muted-foreground">
                        Field: {edu.fieldOfStudy}
                      </div>
                    )}
                    {edu.graduationDate && (
                      <div className="text-sm text-muted-foreground">
                        Graduated: {edu.graduationDate}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {editedData.education.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No education information found
                </div>
              )}
            </TabsContent>

            {/* Skills Tab */}
            <TabsContent value="skills" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Skills</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Skills (comma-separated)</Label>
                    <Textarea
                      value={editedData.skills.join(', ')}
                      onChange={(e) => updateSkills(e.target.value)}
                      rows={6}
                      placeholder="Enter skills separated by commas..."
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editedData.skills.slice(0, 20).map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                    {editedData.skills.length > 20 && (
                      <Badge variant="outline">
                        +{editedData.skills.length - 20} more
                      </Badge>
                    )}
                  </div>

                  {editedData.certifications.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <Label>Certifications</Label>
                      <div className="flex flex-wrap gap-2">
                        {editedData.certifications.map((cert, index) => (
                          <Badge key={index} variant="outline" className="bg-green-50 dark:bg-green-900/20">
                            <Award className="h-3 w-3 mr-1" />
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {editedData.metadata?.totalExperienceYears && (
              <span>
                {editedData.metadata.totalExperienceYears} years experience
                {editedData.metadata.seniorityLevel && ` • ${editedData.metadata.seniorityLevel}`}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirm & Save
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
