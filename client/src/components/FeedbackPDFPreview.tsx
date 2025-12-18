import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { 
  FileText, 
  Download, 
  Loader2, 
  Star, 
  User, 
  Calendar,
  Briefcase,
  CheckCircle,
  XCircle
} from "lucide-react";
import { toast } from "sonner";

interface FeedbackPDFPreviewProps {
  interviewId: number;
  candidateName?: string;
  jobTitle?: string;
  interviewDate?: string;
  trigger?: React.ReactNode;
}

export function FeedbackPDFPreview({
  interviewId,
  candidateName = "Unknown Candidate",
  jobTitle = "Unknown Position",
  interviewDate,
  trigger,
}: FeedbackPDFPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch feedback data for preview
  const { data: feedbackData, isLoading } = (trpc as any).feedback?.getByInterview?.useQuery(
    { interviewId },
    { enabled: isOpen }
  ) || { data: null, isLoading: false };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      // Call the export PDF endpoint
      const response = await fetch(`/api/trpc/feedback.exportPDF?input=${encodeURIComponent(JSON.stringify({ interviewId }))}`);
      
      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const data = await response.json();
      
      if (data.result?.data?.pdfBase64) {
        // Convert base64 to blob and download
        const byteCharacters = atob(data.result.data.pdfBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `feedback-${candidateName.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success("PDF downloaded successfully");
      } else {
        throw new Error("No PDF data received");
      }
    } catch (error) {
      console.error("PDF download error:", error);
      toast.error("Failed to download PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const getRecommendationBadge = (recommendation: string) => {
    switch (recommendation) {
      case "strong_hire":
        return <Badge className="bg-green-100 text-green-800">Strong Hire</Badge>;
      case "hire":
        return <Badge className="bg-green-50 text-green-700">Hire</Badge>;
      case "no_hire":
        return <Badge className="bg-red-100 text-red-800">No Hire</Badge>;
      case "strong_no_hire":
        return <Badge className="bg-red-200 text-red-900">Strong No Hire</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
    }
  };

  const calculateAverageRating = () => {
    if (!feedbackData?.feedback?.length) return 0;
    const total = feedbackData.feedback.reduce((sum: number, f: any) => {
      const avg = (
        (f.technicalSkillsRating || 0) +
        (f.communicationRating || 0) +
        (f.problemSolvingRating || 0) +
        (f.cultureFitRating || 0)
      ) / 4;
      return sum + avg;
    }, 0);
    return (total / feedbackData.feedback.length).toFixed(1);
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsOpen(true)}>{trigger}</div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="text-blue-600 border-blue-300 hover:bg-blue-50"
        >
          <FileText className="h-4 w-4 mr-2" />
          Export Feedback PDF
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Interview Feedback Report Preview
            </DialogTitle>
            <DialogDescription>
              Review the feedback summary before downloading the PDF report
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Interview Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3">Interview Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Candidate:</span>
                    <span className="font-medium">{candidateName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Position:</span>
                    <span className="font-medium">{jobTitle}</span>
                  </div>
                  {interviewDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">
                        {new Date(interviewDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Average Rating:</span>
                    <span className="font-medium">{calculateAverageRating()}/5</span>
                  </div>
                </div>
              </div>

              {/* Feedback Summary */}
              <div>
                <h3 className="font-semibold text-lg mb-3">
                  Panel Feedback ({feedbackData?.feedback?.length || 0} responses)
                </h3>
                
                {!feedbackData?.feedback?.length ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No feedback submitted yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {feedbackData.feedback.map((feedback: any, index: number) => (
                      <div
                        key={feedback.id || index}
                        className="border rounded-lg p-4 bg-white"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{feedback.panelistName || "Panel Member"}</p>
                              <p className="text-xs text-gray-500">
                                {feedback.submittedAt
                                  ? new Date(feedback.submittedAt).toLocaleString()
                                  : ""}
                              </p>
                            </div>
                          </div>
                          {getRecommendationBadge(feedback.recommendation)}
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Technical Skills</span>
                            {renderStars(feedback.technicalSkillsRating || 0)}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Communication</span>
                            {renderStars(feedback.communicationRating || 0)}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Problem Solving</span>
                            {renderStars(feedback.problemSolvingRating || 0)}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Culture Fit</span>
                            {renderStars(feedback.cultureFitRating || 0)}
                          </div>
                        </div>

                        {feedback.comments && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm text-gray-600 font-medium mb-1">Comments:</p>
                            <p className="text-sm text-gray-700">{feedback.comments}</p>
                          </div>
                        )}

                        {feedback.strengths && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600 font-medium mb-1">Strengths:</p>
                            <p className="text-sm text-green-700">{feedback.strengths}</p>
                          </div>
                        )}

                        {feedback.areasForImprovement && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600 font-medium mb-1">Areas for Improvement:</p>
                            <p className="text-sm text-orange-700">{feedback.areasForImprovement}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Overall Summary */}
              {feedbackData?.feedback?.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">Overall Summary</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm">
                        Hire: {feedbackData.feedback.filter((f: any) => 
                          f.recommendation === "hire" || f.recommendation === "strong_hire"
                        ).length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span className="text-sm">
                        No Hire: {feedbackData.feedback.filter((f: any) => 
                          f.recommendation === "no_hire" || f.recommendation === "strong_no_hire"
                        ).length}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
            <Button
              onClick={handleDownloadPDF}
              disabled={isDownloading || isLoading || !feedbackData?.feedback?.length}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
