import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Edit2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ResumeUploadReview() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  // Parsed data state
  const [parsedData, setParsedData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Editable fields
  const [editedData, setEditedData] = useState<any>(null);

  const uploadResumeMutation = trpc.candidate.uploadResume.useMutation();
  const { data: candidateProfile } = trpc.candidate.getProfile.useQuery();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
      ];
      
      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PDF or DOCX file',
          variant: 'destructive',
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please upload a file smaller than 5MB',
          variant: 'destructive',
        });
        return;
      }

      setSelectedFile(file);
      setParsedData(null);
      setEditedData(null);
    }
  };

  const parseResume = async () => {
    if (!selectedFile || !candidateProfile) return;

    setIsUploading(true);
    setIsParsing(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileData = event.target?.result as string;

        try {
          // Upload and parse resume
          await uploadResumeMutation.mutateAsync({
            candidateId: candidateProfile.id,
            fileData,
            fileName: selectedFile.name,
            autoFill: true,
          });

          // Refresh candidate profile to get parsed data
          const updatedProfile = await utils.candidate.getProfile.fetch();
          
          if (!updatedProfile) {
            throw new Error('Failed to fetch updated profile');
          }
          
          // Extract parsed data
          const parsed = updatedProfile.parsedResumeData 
            ? JSON.parse(updatedProfile.parsedResumeData)
            : null;

          setParsedData(parsed);
          setEditedData(parsed);
          setIsEditing(true);

          toast({
            title: 'Resume parsed successfully!',
            description: 'Please review and edit the extracted information below.',
          });
        } catch (error: any) {
          toast({
            title: 'Parsing failed',
            description: error.message || 'Failed to parse resume',
            variant: 'destructive',
          });
        } finally {
          setIsUploading(false);
          setIsParsing(false);
        }
      };

      reader.readAsDataURL(selectedFile);
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload resume',
        variant: 'destructive',
      });
      setIsUploading(false);
      setIsParsing(false);
    }
  };

  const updateProfileMutation = trpc.candidate.updateProfile.useMutation();

  const saveEditedData = async () => {
    if (!candidateProfile || !editedData) return;

    try {
      // Update candidate profile with edited data
      await updateProfileMutation.mutateAsync({
        id: candidateProfile.id,
        phoneNumber: editedData.personalInfo?.phone,
        location: editedData.personalInfo?.location,
        bio: editedData.summary,
        skills: JSON.stringify(editedData.skills),
        experience: JSON.stringify(editedData.experience),
        education: JSON.stringify(editedData.education),
      });

      toast({
        title: 'Profile updated!',
        description: 'Your resume data has been saved to your profile.',
      });

      setIsEditing(false);
      setLocation('/candidate-dashboard');
    } catch (error: any) {
      toast({
        title: 'Save failed',
        description: error.message || 'Failed to save profile',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Upload & Review Resume</h1>
          <p className="text-gray-600 mt-2">
            Upload your resume and we'll automatically extract your information using AI
          </p>
        </div>

        {/* File Upload Section */}
        {!parsedData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Resume
              </CardTitle>
              <CardDescription>
                Supported formats: PDF, DOCX (Max size: 5MB)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Input
                    type="file"
                    accept=".pdf,.docx,.doc"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label
                    htmlFor="resume-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <FileText className="w-12 h-12 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {selectedFile ? selectedFile.name : 'Click to select a file'}
                    </span>
                  </label>
                </div>

                {selectedFile && (
                  <Button
                    onClick={parseResume}
                    disabled={isUploading}
                    className="w-full"
                  >
                    {isParsing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Parsing Resume...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Parse Resume
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Parsed Data Review Section */}
        {parsedData && editedData && (
          <div className="space-y-6">
            {/* Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Resume Parsed Successfully
                    </CardTitle>
                    <CardDescription>
                      Review and edit the extracted information below
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button onClick={saveEditedData} size="sm">
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button
                          onClick={() => {
                            setEditedData(parsedData);
                            setIsEditing(false);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={editedData.personalInfo?.name || ''}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          personalInfo: { ...editedData.personalInfo, name: e.target.value },
                        })
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      value={editedData.personalInfo?.email || ''}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          personalInfo: { ...editedData.personalInfo, email: e.target.value },
                        })
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={editedData.personalInfo?.phone || ''}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          personalInfo: { ...editedData.personalInfo, phone: e.target.value },
                        })
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input
                      value={editedData.personalInfo?.location || ''}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          personalInfo: { ...editedData.personalInfo, location: e.target.value },
                        })
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label>LinkedIn</Label>
                    <Input
                      value={editedData.personalInfo?.linkedin || ''}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          personalInfo: { ...editedData.personalInfo, linkedin: e.target.value },
                        })
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label>GitHub</Label>
                    <Input
                      value={editedData.personalInfo?.github || ''}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          personalInfo: { ...editedData.personalInfo, github: e.target.value },
                        })
                      }
                      disabled={!isEditing}
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
                  value={editedData.summary || ''}
                  onChange={(e) => setEditedData({ ...editedData, summary: e.target.value })}
                  disabled={!isEditing}
                  rows={4}
                  placeholder="Professional summary..."
                />
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {editedData.skills?.map((skill: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                {isEditing && (
                  <p className="text-sm text-gray-500 mt-2">
                    To edit skills, modify the JSON in the raw data section below
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Work Experience */}
            <Card>
              <CardHeader>
                <CardTitle>Work Experience</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editedData.experience?.map((exp: any, index: number) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                    <h4 className="font-semibold">{exp.title || 'Position'}</h4>
                    <p className="text-sm text-gray-600">
                      {exp.company || 'Company'} | {exp.location || 'Location'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {exp.startDate} - {exp.endDate} ({exp.duration})
                    </p>
                    {exp.description && (
                      <p className="text-sm mt-2 text-gray-700">{exp.description}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Education */}
            <Card>
              <CardHeader>
                <CardTitle>Education</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editedData.education?.map((edu: any, index: number) => (
                  <div key={index} className="border-l-4 border-green-500 pl-4 py-2">
                    <h4 className="font-semibold">{edu.degree || 'Degree'}</h4>
                    <p className="text-sm text-gray-600">
                      {edu.institution || 'Institution'} | {edu.location || ''}
                    </p>
                    <p className="text-sm text-gray-500">
                      {edu.fieldOfStudy} | Graduated: {edu.graduationDate}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Certifications */}
            {editedData.certifications && editedData.certifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Certifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-1">
                    {editedData.certifications.map((cert: string, index: number) => (
                      <li key={index} className="text-gray-700">
                        {cert}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            {editedData.metadata && (
              <Card>
                <CardHeader>
                  <CardTitle>Candidate Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm text-gray-500">Total Experience</Label>
                      <p className="text-lg font-semibold">
                        {editedData.metadata.totalExperienceYears} years
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Seniority Level</Label>
                      <p className="text-lg font-semibold capitalize">
                        {editedData.metadata.seniorityLevel}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Primary Domain</Label>
                      <p className="text-lg font-semibold">
                        {editedData.metadata.primaryDomain}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button onClick={saveEditedData} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Save to Profile
              </Button>
              <Button
                onClick={() => {
                  setParsedData(null);
                  setEditedData(null);
                  setSelectedFile(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Upload Another Resume
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
