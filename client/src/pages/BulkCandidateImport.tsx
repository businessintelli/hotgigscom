import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

interface CandidateRow {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  skills?: string;
  workAuthorization?: string;
  nationality?: string;
  currentSalary?: number;
  expectedSalary?: number;
  salaryType?: string;
  validation?: {
    isValid: boolean;
    errors: string[];
  };
}

export default function BulkCandidateImport() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<CandidateRow[]>([]);
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "complete">("upload");
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] }>({
    success: 0,
    failed: 0,
    errors: []
  });

  const parseCSVMutation = trpc.candidate.parseImportFile.useMutation();
  const bulkImportMutation = trpc.candidate.bulkImport.useMutation();

  const downloadTemplate = () => {
    const headers = [
      "name",
      "email",
      "phone",
      "location",
      "skills",
      "workAuthorization",
      "nationality",
      "gender",
      "dateOfBirth",
      "currentSalary",
      "expectedSalary",
      "salaryType",
      "highestEducation",
      "specialization",
      "currentResidenceZipCode",
      "linkedinId"
    ];

    const sampleData = [
      [
        "John Doe",
        "john.doe@example.com",
        "+1-555-0123",
        "New York, NY",
        "JavaScript, React, Node.js",
        "US Citizen",
        "American",
        "Male",
        "1990-01-15",
        "85000",
        "95000",
        "salary",
        "Bachelor's Degree",
        "Computer Science",
        "10001",
        "linkedin.com/in/johndoe"
      ]
    ];

    const csvContent = [
      headers.join(","),
      ...sampleData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "candidate_import_template.csv";
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Template downloaded",
      description: "Fill in the template with candidate information and upload it back.",
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV or Excel file",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);

    // Parse the file
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      
      try {
        const result = await parseCSVMutation.mutateAsync({
          content,
          filename: file.name,
        });

        if (result.success && result.data) {
          setParsedData(result.data);
          setStep("preview");
        } else {
          toast({
            title: "Parse error",
            description: result.error || "Failed to parse file",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        toast({
          title: "Parse error",
          description: error.message || "Failed to parse file",
          variant: "destructive",
        });
      }
    };

    reader.readAsText(file);
  };

  const handleImport = async () => {
    setStep("importing");

    try {
      const result = await bulkImportMutation.mutateAsync({
        candidates: parsedData.filter(row => row.validation?.isValid !== false),
      });

      setImportResults({
        success: result.successCount || 0,
        failed: result.failedCount || 0,
        errors: result.errors || [],
      });

      setStep("complete");

      toast({
        title: "Import complete",
        description: `Successfully imported ${result.successCount} candidates. ${result.failedCount} failed.`,
      });
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message || "Failed to import candidates",
        variant: "destructive",
      });
      setStep("preview");
    }
  };

  const validCandidates = parsedData.filter(row => row.validation?.isValid !== false);
  const invalidCandidates = parsedData.filter(row => row.validation?.isValid === false);

  return (
    <DashboardLayout title="Bulk Candidate Import">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Bulk Candidate Import</h1>
          <p className="text-gray-600 mt-2">
            Import multiple candidates at once using CSV or Excel files
          </p>
        </div>

        {/* Upload Step */}
        {step === "upload" && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Candidate File</CardTitle>
              <CardDescription>
                Upload a CSV or Excel file containing candidate information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
                <span className="text-sm text-gray-500">
                  Download the template to see the required format
                </span>
              </div>

              <div className="border-2 border-dashed rounded-lg p-12 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Upload CSV or Excel File</h3>
                <p className="text-gray-600 mb-4">
                  Drag and drop or click to select a file
                </p>
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button asChild>
                    <span>Select File</span>
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview Step */}
        {step === "preview" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preview Import Data</CardTitle>
                <CardDescription>
                  Review the parsed data before importing. {validCandidates.length} valid candidates, {invalidCandidates.length} with errors.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invalidCandidates.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-yellow-800">Validation Errors</h4>
                          <p className="text-sm text-yellow-700 mt-1">
                            {invalidCandidates.length} candidates have validation errors and will be skipped.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Skills</TableHead>
                          <TableHead>Salary</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedData.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {row.validation?.isValid === false ? (
                                <Badge variant="destructive">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Invalid
                                </Badge>
                              ) : (
                                <Badge variant="default">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Valid
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{row.name}</TableCell>
                            <TableCell>{row.email}</TableCell>
                            <TableCell>{row.phone || "-"}</TableCell>
                            <TableCell>{row.location || "-"}</TableCell>
                            <TableCell className="max-w-xs truncate">{row.skills || "-"}</TableCell>
                            <TableCell>
                              {row.salaryType === 'salary' && row.expectedSalary
                                ? `$${row.expectedSalary.toLocaleString()}/yr`
                                : row.salaryType === 'hourly' && row.expectedSalary
                                ? `$${row.expectedSalary}/hr`
                                : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStep("upload");
                        setSelectedFile(null);
                        setParsedData([]);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleImport}
                      disabled={validCandidates.length === 0}
                    >
                      Import {validCandidates.length} Candidates
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Importing Step */}
        {step === "importing" && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
                <h3 className="text-lg font-semibold mb-2">Importing Candidates...</h3>
                <p className="text-gray-600">
                  Please wait while we import the candidates and send invitation emails.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Complete Step */}
        {step === "complete" && (
          <Card>
            <CardHeader>
              <CardTitle>Import Complete</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-green-700">Successfully Imported</p>
                      <p className="text-2xl font-bold text-green-900">{importResults.success}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm text-red-700">Failed</p>
                      <p className="text-2xl font-bold text-red-900">{importResults.failed}</p>
                    </div>
                  </div>
                </div>
              </div>

              {importResults.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2">Errors:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {importResults.errors.map((error, index) => (
                      <li key={index} className="text-sm text-red-700">{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("upload");
                    setSelectedFile(null);
                    setParsedData([]);
                    setImportResults({ success: 0, failed: 0, errors: [] });
                  }}
                >
                  Import More Candidates
                </Button>
                <Button onClick={() => setLocation("/recruiter/candidates")}>
                  View Candidates
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
