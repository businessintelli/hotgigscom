import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Star, ThumbsUp, ThumbsDown, Loader2, CheckCircle } from "lucide-react";

interface PanelFeedbackFormProps {
  interviewId: number;
  panelistId: number;
  candidateName?: string;
  jobTitle?: string;
  onSuccess?: () => void;
}

const StarRating = ({ 
  value, 
  onChange, 
  label 
}: { 
  value: number; 
  onChange: (v: number) => void; 
  label: string;
}) => {
  const [hover, setHover] = useState(0);
  
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-1 transition-transform hover:scale-110"
          >
            <Star
              className={`h-6 w-6 ${
                star <= (hover || value)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default function PanelFeedbackForm({
  interviewId,
  panelistId,
  candidateName,
  jobTitle,
  onSuccess,
}: PanelFeedbackFormProps) {
  const [overallRating, setOverallRating] = useState(0);
  const [technicalSkills, setTechnicalSkills] = useState(0);
  const [communicationSkills, setCommunicationSkills] = useState(0);
  const [problemSolving, setProblemSolving] = useState(0);
  const [cultureFit, setCultureFit] = useState(0);
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [notes, setNotes] = useState("");
  const [recommendation, setRecommendation] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = trpc.interview.submitPanelistFeedback.useMutation({
    onSuccess: () => {
      toast.success("Feedback submitted successfully!");
      setSubmitted(true);
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

    submitMutation.mutate({
      interviewId,
      panelistId,
      overallRating,
      technicalSkills: technicalSkills || undefined,
      communicationSkills: communicationSkills || undefined,
      problemSolving: problemSolving || undefined,
      cultureFit: cultureFit || undefined,
      strengths: strengths || undefined,
      weaknesses: weaknesses || undefined,
      notes: notes || undefined,
      recommendation: recommendation as any || undefined,
    });
  };

  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-green-800">Feedback Submitted</h3>
              <p className="text-green-600 text-sm mt-1">
                Thank you for your evaluation. Your feedback has been recorded.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interview Evaluation</CardTitle>
        <CardDescription>
          {candidateName && jobTitle ? (
            <>Provide your feedback for <strong>{candidateName}</strong> for the <strong>{jobTitle}</strong> position</>
          ) : (
            "Share your assessment of the candidate's performance"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Rating */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <StarRating
            value={overallRating}
            onChange={setOverallRating}
            label="Overall Rating *"
          />
        </div>

        {/* Skill Ratings */}
        <div className="grid grid-cols-2 gap-4">
          <StarRating
            value={technicalSkills}
            onChange={setTechnicalSkills}
            label="Technical Skills"
          />
          <StarRating
            value={communicationSkills}
            onChange={setCommunicationSkills}
            label="Communication"
          />
          <StarRating
            value={problemSolving}
            onChange={setProblemSolving}
            label="Problem Solving"
          />
          <StarRating
            value={cultureFit}
            onChange={setCultureFit}
            label="Culture Fit"
          />
        </div>

        {/* Strengths */}
        <div className="space-y-2">
          <Label>Key Strengths</Label>
          <Textarea
            placeholder="What stood out positively about this candidate?"
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
            rows={3}
          />
        </div>

        {/* Areas for Improvement */}
        <div className="space-y-2">
          <Label>Areas for Improvement</Label>
          <Textarea
            placeholder="What areas could the candidate improve?"
            value={weaknesses}
            onChange={(e) => setWeaknesses(e.target.value)}
            rows={3}
          />
        </div>

        {/* Additional Notes */}
        <div className="space-y-2">
          <Label>Additional Notes</Label>
          <Textarea
            placeholder="Any other observations or comments..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* Recommendation */}
        <div className="space-y-3">
          <Label>Hiring Recommendation</Label>
          <RadioGroup
            value={recommendation}
            onValueChange={setRecommendation}
            className="grid grid-cols-2 gap-3"
          >
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-green-50 cursor-pointer">
              <RadioGroupItem value="strong_hire" id="strong_hire" />
              <Label htmlFor="strong_hire" className="flex items-center gap-2 cursor-pointer">
                <ThumbsUp className="h-4 w-4 text-green-600" />
                Strong Hire
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-green-50 cursor-pointer">
              <RadioGroupItem value="hire" id="hire" />
              <Label htmlFor="hire" className="flex items-center gap-2 cursor-pointer">
                <ThumbsUp className="h-4 w-4 text-green-500" />
                Hire
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-red-50 cursor-pointer">
              <RadioGroupItem value="no_hire" id="no_hire" />
              <Label htmlFor="no_hire" className="flex items-center gap-2 cursor-pointer">
                <ThumbsDown className="h-4 w-4 text-red-500" />
                No Hire
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-red-50 cursor-pointer">
              <RadioGroupItem value="strong_no_hire" id="strong_no_hire" />
              <Label htmlFor="strong_no_hire" className="flex items-center gap-2 cursor-pointer">
                <ThumbsDown className="h-4 w-4 text-red-600" />
                Strong No Hire
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={submitMutation.isPending || overallRating === 0}
          className="w-full"
        >
          {submitMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Feedback"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
