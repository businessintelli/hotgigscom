import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Linkedin, Upload, FileText, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LinkedInImport() {
  const { toast } = useToast();
  const [singleUrl, setSingleUrl] = useState("");
  const [bulkUrls, setBulkUrls] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);

  const importSingleProfile = trpc.recruiter.importLinkedInProfile.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "LinkedIn profile imported successfully",
      });
      setSingleUrl("");
      setIsImporting(false);
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsImporting(false);
    },
  });

  const bulkImportProfiles = trpc.recruiter.bulkImportLinkedInProfiles.useMutation({
    onSuccess: (data) => {
      setImportResults(data);
      toast({
        title: "Bulk Import Complete",
        description: `Successfully imported ${data.successful} profiles, ${data.failed} failed`,
      });
      setIsImporting(false);
    },
    onError: (error) => {
      toast({
        title: "Bulk Import Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsImporting(false);
    },
  });

  const handleSingleImport = async () => {
    if (!singleUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a LinkedIn profile URL",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    importSingleProfile.mutate({ profileUrl: singleUrl.trim() });
  };

  const handleBulkImport = async () => {
    const urls = bulkUrls
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (urls.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one LinkedIn profile URL",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    bulkImportProfiles.mutate({ profileUrls: urls });
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Linkedin className="w-8 h-8 text-blue-600" />
          LinkedIn Profile Import
        </h1>
        <p className="text-muted-foreground mt-2">
          Import candidate profiles from LinkedIn to automatically populate candidate records
        </p>
      </div>

      <Alert className="mb-6">
        <AlertDescription>
          <strong>Note:</strong> This feature uses mock data for demonstration. In production, you would integrate with LinkedIn Recruiter API or a third-party data provider like Proxycurl, RocketReach, or People Data Labs.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="single" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">
            <FileText className="w-4 h-4 mr-2" />
            Single Import
          </TabsTrigger>
          <TabsTrigger value="bulk">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
          </TabsTrigger>
        </TabsList>

        {/* Single Import Tab */}
        <TabsContent value="single">
          <Card>
            <CardHeader>
              <CardTitle>Import Single Profile</CardTitle>
              <CardDescription>
                Enter a LinkedIn profile URL to import candidate data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profileUrl">LinkedIn Profile URL</Label>
                <Input
                  id="profileUrl"
                  placeholder="https://www.linkedin.com/in/username"
                  value={singleUrl}
                  onChange={(e) => setSingleUrl(e.target.value)}
                  disabled={isImporting}
                />
                <p className="text-sm text-muted-foreground">
                  Example: https://www.linkedin.com/in/john-doe-123456
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-sm">What will be imported:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Basic information (name, headline, location)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Current position and company</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Work experience history</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Education background</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Skills and endorsements</span>
                  </li>
                </ul>
              </div>

              <Button
                onClick={handleSingleImport}
                disabled={isImporting || !singleUrl.trim()}
                className="w-full"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Linkedin className="w-4 h-4 mr-2" />
                    Import Profile
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Import Tab */}
        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Import Profiles</CardTitle>
              <CardDescription>
                Import multiple LinkedIn profiles at once (one URL per line)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bulkUrls">LinkedIn Profile URLs</Label>
                <Textarea
                  id="bulkUrls"
                  placeholder="https://www.linkedin.com/in/user1&#10;https://www.linkedin.com/in/user2&#10;https://www.linkedin.com/in/user3"
                  value={bulkUrls}
                  onChange={(e) => setBulkUrls(e.target.value)}
                  disabled={isImporting}
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground">
                  Enter one LinkedIn profile URL per line. Maximum 100 profiles per batch.
                </p>
              </div>

              <Button
                onClick={handleBulkImport}
                disabled={isImporting || !bulkUrls.trim()}
                className="w-full"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import All Profiles
                  </>
                )}
              </Button>

              {importResults && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Import Results</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setImportResults(null);
                        setBulkUrls("");
                      }}
                    >
                      Clear
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="font-medium">Successful</span>
                      </div>
                      <div className="text-3xl font-bold">{importResults.successful}</div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="font-medium">Failed</span>
                      </div>
                      <div className="text-3xl font-bold">{importResults.failed}</div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                    <h5 className="font-medium mb-3">Detailed Results</h5>
                    <div className="space-y-2">
                      {importResults.results.map((result: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 text-sm p-2 rounded border"
                        >
                          {result.success ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="truncate font-mono text-xs">{result.url}</div>
                            {result.error && (
                              <div className="text-red-600 text-xs mt-1">{result.error}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-medium text-sm mb-2">How to find LinkedIn profile URLs:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Go to the candidate's LinkedIn profile</li>
              <li>Click the "More" button (three dots)</li>
              <li>Select "Copy link to profile"</li>
              <li>Paste the URL here</li>
            </ol>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-2">For production use:</h4>
            <p className="text-sm text-muted-foreground">
              Consider integrating with third-party data providers like Proxycurl, RocketReach, or People Data Labs for reliable LinkedIn data access without manual copying.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
