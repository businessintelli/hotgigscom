import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Star, ThumbsUp, ThumbsDown, Loader2, CheckCircle2, MessageSquare, Users, Zap, Building } from "lucide-react";
import { cn } from "@/lib/utils";

interface InterviewFeedbackFormProps {
  interviewId: number;
  jobTitle: string;
  companyName: string;
  onClose?: () => void;
  onSuccess?: () => void;
}

function StarRating({ 
  value, 
  onChange, 
  label,
  icon: Icon
}: { 
  value: number; 
  onChange: (value: number) => void;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-gray-500" />}
        <Label className="text-sm font-medium">{label}</Label>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
          >
            <Star
              className={cn(
                "h-8 w-8 transition-colors",
                (hovered || value) >= star
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              )}
            />
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500">
        {value === 0 && "Click to rate"}
        {value === 1 && "Poor"}
        {value === 2 && "Fair"}
        {value === 3 && "Good"}
        {value === 4 && "Very Good"}
        {value === 5 && "Excellent"}
      </p>
    </div>
  );
}

export function InterviewFeedbackForm({
  interviewId,
  jobTitle,
  companyName,
  onClose,
  onSuccess,
}: InterviewFeedbackFormProps) {
  const [overallRating, setOverallRating] = useState(0);
  const [interviewerRating, setInterviewerRating] = useState(0);
  const [processRating, setProcessRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [positiveAspects, setPositiveAspects] = useState("");
  const [areasForImprovement, setAreasForImprovement] = useState("");
  const [additionalComments, setAdditionalComments] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitFeedback = trpc.interview.submitFeedback.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Thank you for your feedback!");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit feedback");
    },
  });

  const handleSubmit = () => {
    if (overallRating === 0) {
      toast.error("Please provide an overall rating");
      return;
    }

    submitFeedback.mutate({
      interviewId,
      overallRating,
      interviewerRating: interviewerRating || undefined,
      processRating: processRating || undefined,
      communicationRating: communicationRating || undefined,
      positiveAspects: positiveAspects || undefined,
      areasForImprovement: areasForImprovement || undefined,
      additionalComments: additionalComments || undefined,
      wouldRecommend: wouldRecommend ?? undefined,
      isAnonymous,
    });
  };

  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800">Feedback Submitted!</h3>
              <p className="text-green-600 mt-1">
                Thank you for sharing your experience. Your feedback helps improve the interview process.
              </p>
            </div>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Interview Feedback
        </CardTitle>
        <CardDescription>
          Share your experience from the interview for <strong>{jobTitle}</strong> at <strong>{companyName}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Rating */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <StarRating
            value={overallRating}
            onChange={setOverallRating}
            label="Overall Experience *"
            icon={Star}
          />
        </div>

        {/* Category Ratings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 border rounded-lg">
            <StarRating
              value={interviewerRating}
              onChange={setInterviewerRating}
              label="Interviewer"
              icon={Users}
            />
          </div>
          <div className="p-3 border rounded-lg">
            <StarRating
              value={processRating}
              onChange={setProcessRating}
              label="Process"
              icon={Zap}
            />
          </div>
          <div className="p-3 border rounded-lg">
            <StarRating
              value={communicationRating}
              onChange={setCommunicationRating}
              label="Communication"
              icon={MessageSquare}
            />
          </div>
        </div>

        {/* Would Recommend */}
        <div className="p-4 border rounded-lg">
          <Label className="text-sm font-medium mb-3 block">
            Would you recommend this company to other candidates?
          </Label>
          <div className="flex gap-4">
            <Button
              type="button"
              variant={wouldRecommend === true ? "default" : "outline"}
              className={cn(
                "flex-1",
                wouldRecommend === true && "bg-green-600 hover:bg-green-700"
              )}
              onClick={() => setWouldRecommend(true)}
            >
              <ThumbsUp className="h-4 w-4 mr-2" />
              Yes
            </Button>
            <Button
              type="button"
              variant={wouldRecommend === false ? "default" : "outline"}
              className={cn(
                "flex-1",
                wouldRecommend === false && "bg-red-600 hover:bg-red-700"
              )}
              onClick={() => setWouldRecommend(false)}
            >
              <ThumbsDown className="h-4 w-4 mr-2" />
              No
            </Button>
          </div>
        </div>

        {/* Written Feedback */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="positive" className="text-sm font-medium">
              What went well?
            </Label>
            <Textarea
              id="positive"
              placeholder="Share what you liked about the interview experience..."
              value={positiveAspects}
              onChange={(e) => setPositiveAspects(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="improvement" className="text-sm font-medium">
              What could be improved?
            </Label>
            <Textarea
              id="improvement"
              placeholder="Share any suggestions for improvement..."
              value={areasForImprovement}
              onChange={(e) => setAreasForImprovement(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="comments" className="text-sm font-medium">
              Additional Comments (Optional)
            </Label>
            <Textarea
              id="comments"
              placeholder="Any other thoughts you'd like to share..."
              value={additionalComments}
              onChange={(e) => setAdditionalComments(e.target.value)}
              className="mt-1"
              rows={2}
            />
          </div>
        </div>

        {/* Anonymous Option */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <Label htmlFor="anonymous" className="text-sm font-medium">
              Submit Anonymously
            </Label>
            <p className="text-xs text-gray-500 mt-1">
              Your name won't be shared with the recruiter
            </p>
          </div>
          <Switch
            id="anonymous"
            checked={isAnonymous}
            onCheckedChange={setIsAnonymous}
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-2">
          {onClose && (
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={overallRating === 0 || submitFeedback.isPending}
            className="flex-1"
          >
            {submitFeedback.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Feedback"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Dialog wrapper for the feedback form
export function InterviewFeedbackDialog({
  open,
  onOpenChange,
  interviewId,
  jobTitle,
  companyName,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interviewId: number;
  jobTitle: string;
  companyName: string;
  onSuccess?: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share Your Interview Experience</DialogTitle>
          <DialogDescription>
            Your feedback helps improve the interview process for future candidates
          </DialogDescription>
        </DialogHeader>
        <InterviewFeedbackForm
          interviewId={interviewId}
          jobTitle={jobTitle}
          companyName={companyName}
          onClose={() => onOpenChange(false)}
          onSuccess={() => {
            onSuccess?.();
            setTimeout(() => onOpenChange(false), 2000);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
