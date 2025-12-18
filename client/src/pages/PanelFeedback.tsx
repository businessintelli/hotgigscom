import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle, XCircle, Loader2, Star, MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react";

const StarRating = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <Star
              className={`h-8 w-8 transition-colors ${
                star <= value
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300 hover:text-yellow-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default function PanelFeedback() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "expired" | "used" | "success" | "error">("loading");
  
  // Form state
  const [technicalScore, setTechnicalScore] = useState(0);
  const [communicationScore, setCommunicationScore] = useState(0);
  const [problemSolvingScore, setProblemSolvingScore] = useState(0);
  const [cultureFitScore, setCultureFitScore] = useState(0);
  const [overallScore, setOverallScore] = useState(0);
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [notes, setNotes] = useState("");
  const [recommendation, setRecommendation] = useState<"strong_hire" | "hire" | "no_hire" | "strong_no_hire" | "">("");

  const { data: tokenData, isLoading } = (trpc as any).panelPublic.validateToken.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  const submitMutation = (trpc as any).panelPublic.submitFeedback.useMutation({
    onSuccess: (result: any) => {
      if (result.success) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    },
    onError: () => {
      setStatus("error");
    },
  });

  useEffect(() => {
    if (!isLoading && tokenData) {
      if (tokenData.valid) {
        setStatus("valid");
      } else if (tokenData.expired) {
        setStatus("expired");
      } else if (tokenData.used) {
        setStatus("used");
      } else {
        setStatus("invalid");
      }
    }
  }, [tokenData, isLoading]);

  const handleSubmit = () => {
    if (token && recommendation) {
      submitMutation.mutate({
        token,
        technicalScore: technicalScore || 3,
        communicationScore: communicationScore || 3,
        problemSolvingScore: problemSolvingScore || 3,
        cultureFitScore: cultureFitScore || 3,
        overallScore: overallScore || 3,
        strengths,
        weaknesses,
        notes,
        recommendation,
      });
    }
  };

  const isFormValid = recommendation && overallScore > 0;

  if (isLoading || status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading feedback form...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "invalid" || status === "expired" || status === "used") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {status === "expired" ? "Link Expired" : status === "used" ? "Feedback Already Submitted" : "Invalid Link"}
            </h2>
            <p className="text-gray-600">
              {status === "expired"
                ? "This feedback link has expired."
                : status === "used"
                ? "You have already submitted feedback for this interview."
                : "This feedback link is invalid."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Feedback Submitted!</h2>
            <p className="text-gray-600">
              Thank you for your valuable feedback. Your input helps us make better hiring decisions.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8 px-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-8 w-8 text-purple-600" />
          </div>
          <CardTitle className="text-2xl">Interview Feedback</CardTitle>
          <CardDescription>
            Please provide your assessment of the candidate
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tokenData?.details && (
            <div className="space-y-6">
              {/* Interview Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Candidate</p>
                    <p className="font-medium text-gray-900">{tokenData.details.candidateName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Position</p>
                    <p className="font-medium text-gray-900">{tokenData.details.jobTitle}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Interview Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(tokenData.details.interviewDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Company</p>
                    <p className="font-medium text-gray-900">{tokenData.details.companyName || "—"}</p>
                  </div>
                </div>
              </div>

              {/* Ratings */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Skill Ratings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <StarRating
                    label="Technical Skills"
                    value={technicalScore}
                    onChange={setTechnicalScore}
                  />
                  <StarRating
                    label="Communication"
                    value={communicationScore}
                    onChange={setCommunicationScore}
                  />
                  <StarRating
                    label="Problem Solving"
                    value={problemSolvingScore}
                    onChange={setProblemSolvingScore}
                  />
                  <StarRating
                    label="Culture Fit"
                    value={cultureFitScore}
                    onChange={setCultureFitScore}
                  />
                </div>
                <StarRating
                  label="Overall Rating *"
                  value={overallScore}
                  onChange={setOverallScore}
                />
              </div>

              {/* Written Feedback */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="strengths">Strengths</Label>
                  <Textarea
                    id="strengths"
                    placeholder="What did the candidate do well?"
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="weaknesses">Areas for Improvement</Label>
                  <Textarea
                    id="weaknesses"
                    placeholder="What could the candidate improve on?"
                    value={weaknesses}
                    onChange={(e) => setWeaknesses(e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any other observations or comments..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              {/* Recommendation */}
              <div className="space-y-3">
                <Label>Hiring Recommendation *</Label>
                <RadioGroup
                  value={recommendation}
                  onValueChange={(v) => setRecommendation(v as any)}
                  className="grid grid-cols-2 gap-3"
                >
                  <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-green-50 cursor-pointer">
                    <RadioGroupItem value="strong_hire" id="strong_hire" />
                    <Label htmlFor="strong_hire" className="flex items-center gap-2 cursor-pointer">
                      <ThumbsUp className="h-4 w-4 text-green-600" />
                      Strong Hire
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-green-50 cursor-pointer">
                    <RadioGroupItem value="hire" id="hire" />
                    <Label htmlFor="hire" className="flex items-center gap-2 cursor-pointer">
                      <ThumbsUp className="h-4 w-4 text-green-400" />
                      Hire
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-red-50 cursor-pointer">
                    <RadioGroupItem value="no_hire" id="no_hire" />
                    <Label htmlFor="no_hire" className="flex items-center gap-2 cursor-pointer">
                      <ThumbsDown className="h-4 w-4 text-red-400" />
                      No Hire
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-red-50 cursor-pointer">
                    <RadioGroupItem value="strong_no_hire" id="strong_no_hire" />
                    <Label htmlFor="strong_no_hire" className="flex items-center gap-2 cursor-pointer">
                      <ThumbsDown className="h-4 w-4 text-red-600" />
                      Strong No Hire
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={submitMutation.isPending || !isFormValid}
              >
                {submitMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Submit Feedback
              </Button>

              <p className="text-xs text-gray-500 text-center">
                * Required fields. Your feedback is confidential and will only be shared with the hiring team.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
