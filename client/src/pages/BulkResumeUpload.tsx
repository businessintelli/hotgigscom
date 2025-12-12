import { useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '../lib/trpc';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Upload, FileArchive, CheckCircle2, XCircle, Loader2, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function BulkResumeUpload() {
  const [, setLocation] = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [selectedJobId, setSelectedJobId] = useState<number | undefined>();
  const [autoCreateProfiles, setAutoCreateProfiles] = useState(true);

  const { data: jobs } = trpc.job.list.useQuery();
  const bulkUploadMutation = trpc.candidate.bulkUploadResumes.useMutation();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.zip')) {
      setSelectedFile(file);
      setUploadResult(null);
    } else {
      toast.error('Please upload a ZIP file');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.zip')) {
        setSelectedFile(file);
        setUploadResult(null);
      } else {
        toast.error('Please select a ZIP file');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadResult(null);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;

        try {
          const result = await bulkUploadMutation.mutateAsync({
            zipFileData: base64Data,
            jobId: selectedJobId,
            autoCreateProfiles,
          });

          setUploadResult(result);
          toast.success(`Successfully processed ${result.successCount} resumes!`);
        } catch (error) {
          console.error('Upload failed:', error);
          toast.error(error instanceof Error ? error.message : 'Upload failed');
        } finally {
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        toast.error('Failed to read file');
        setIsUploading(false);
      };

      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Upload failed');
      setIsUploading(false);
    }
  };

  const successRate = uploadResult
    ? Math.round((uploadResult.successCount / uploadResult.totalFiles) * 100)
    : 0;

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="outline" onClick={() => setLocation('/recruiter/dashboard')}>
          ← Back to Dashboard
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileArchive className="h-6 w-6" />
            Bulk Resume Upload
          </CardTitle>
          <CardDescription>
            Upload a ZIP file containing multiple resumes (PDF or DOCX). Our AI will automatically parse and create candidate profiles.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Options */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rank Against Job (Optional)</label>
              <Select
                value={selectedJobId?.toString()}
                onValueChange={(value) => setSelectedJobId(value ? parseInt(value) : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a job position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No ranking</SelectItem>
                  {jobs?.map((job) => (
                    <SelectItem key={job.id} value={job.id.toString()}>
                      {job.title} - {job.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Automatically rank uploaded candidates against this job position
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoCreate"
                checked={autoCreateProfiles}
                onCheckedChange={(checked) => setAutoCreateProfiles(checked as boolean)}
              />
              <label
                htmlFor="autoCreate"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Automatically create candidate profiles
              </label>
            </div>
          </div>

          {/* Drag and Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".zip"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={isUploading}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">
                    {selectedFile ? selectedFile.name : 'Drop your ZIP file here'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse (max 100 resumes per ZIP)
                  </p>
                </div>
                {selectedFile && (
                  <Badge variant="secondary" className="mt-2">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </Badge>
                )}
              </div>
            </label>
          </div>

          {/* Upload Button */}
          {selectedFile && !uploadResult && (
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full"
              size="lg"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Resumes...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload and Process
                </>
              )}
            </Button>
          )}

          {/* Upload Results */}
          {uploadResult && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Upload complete! Processed {uploadResult.totalFiles} resumes.
                </AlertDescription>
              </Alert>

              {/* Success Rate */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Success Rate</span>
                  <span className="font-medium">{successRate}%</span>
                </div>
                <Progress value={successRate} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="text-green-600">✓ {uploadResult.successCount} successful</span>
                  <span className="text-red-600">✗ {uploadResult.failedCount} failed</span>
                </div>
              </div>

              {/* Results List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <h4 className="font-medium text-sm">Detailed Results:</h4>
                {uploadResult.candidates.map((candidate: any, index: number) => (
                  <Card key={index} className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {candidate.success ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium text-sm">{candidate.filename}</p>
                          </div>
                          {candidate.success && candidate.parsedData && (
                            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                              {candidate.parsedData.personalInfo?.name && (
                                <p>Name: {candidate.parsedData.personalInfo.name}</p>
                              )}
                              {candidate.parsedData.personalInfo?.email && (
                                <p>Email: {candidate.parsedData.personalInfo.email}</p>
                              )}
                              {candidate.parsedData.skills && candidate.parsedData.skills.length > 0 && (
                                <p>Skills: {candidate.parsedData.skills.slice(0, 5).join(', ')}</p>
                              )}
                              {candidate.parsedData.metadata?.seniorityLevel && (
                                <Badge variant="outline" className="mt-1">
                                  {candidate.parsedData.metadata.seniorityLevel}
                                </Badge>
                              )}
                              {candidate.isDuplicate && candidate.duplicateInfo && (
                                <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                                  <div className="flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                                    <div>
                                      <p className="font-medium text-yellow-800 dark:text-yellow-200">Potential Duplicate</p>
                                      <p className="text-xs text-yellow-700 dark:text-yellow-300">
                                        {candidate.duplicateInfo.confidence}% match confidence • {candidate.duplicateInfo.matchCount} similar profile(s)
                                      </p>
                                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                                        Recommendation: {candidate.duplicateInfo.recommendation.replace('_', ' ')}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          {!candidate.success && (
                            <p className="text-xs text-red-600 mt-1">{candidate.error}</p>
                          )}
                        </div>
                      </div>
                      {candidate.candidateId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/recruiter/candidates/${candidate.candidateId}`)}
                        >
                          View Profile
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedFile(null);
                    setUploadResult(null);
                  }}
                  className="flex-1"
                >
                  Upload Another ZIP
                </Button>
                {selectedJobId && (
                  <Button
                    onClick={() => setLocation(`/recruiter/resume-ranking?jobId=${selectedJobId}`)}
                    className="flex-1"
                  >
                    View Rankings
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          {!uploadResult && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-sm">Instructions:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Create a ZIP file containing PDF or DOCX resumes</li>
                <li>Maximum 100 resumes per upload</li>
                <li>Each resume will be parsed using AI to extract skills, experience, and education</li>
                <li>Candidate profiles will be automatically created if enabled</li>
                <li>Optionally rank candidates against a specific job position</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
