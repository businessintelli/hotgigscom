import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import { Loader2, Sparkles, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SuccessScoreBadgeProps {
  applicationId: number;
}

export function SuccessScoreBadge({ applicationId }: SuccessScoreBadgeProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Fetch prediction for this application
  const { data: prediction, isLoading, refetch } = trpc.recruiter.getApplicationPrediction.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  // Predict mutation
  const predictMutation = trpc.recruiter.predictApplicationSuccess.useMutation({
    onSuccess: () => {
      refetch();
      setIsGenerating(false);
      toast.success("Success score calculated!");
    },
    onError: (error) => {
      setIsGenerating(false);
      toast.error(`Failed to calculate score: ${error.message}`);
    },
  });

  const handlePredict = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsGenerating(true);
    predictMutation.mutate({ applicationId });
  };

  if (isLoading) {
    return (
      <Badge variant="outline" className="text-xs">
        <Loader2 className="h-3 w-3 animate-spin mr-1" />
        Loading...
      </Badge>
    );
  }

  if (!prediction) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-xs px-2"
              onClick={handlePredict}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Predicting...
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 mr-1" />
                  Predict Score
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Calculate AI success prediction</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const score = prediction.predictionScore || 0;
  const confidence = prediction.confidence || 0;
  
  // Determine badge color based on score
  let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "outline";
  let badgeColor = "text-gray-600 border-gray-300";
  
  if (score >= 75) {
    badgeVariant = "default";
    badgeColor = "bg-green-500 text-white border-green-600";
  } else if (score >= 50) {
    badgeVariant = "secondary";
    badgeColor = "bg-yellow-500 text-white border-yellow-600";
  } else {
    badgeVariant = "destructive";
    badgeColor = "bg-red-500 text-white border-red-600";
  }

  // Parse factors
  let factors: string[] = [];
  try {
    factors = prediction.factors ? JSON.parse(prediction.factors) : [];
  } catch (e) {
    console.error("Failed to parse factors:", e);
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={badgeVariant} className={`text-xs cursor-help ${badgeColor}`}>
            <TrendingUp className="h-3 w-3 mr-1" />
            Success: {Math.round(score)}%
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <div>
              <p className="font-semibold">Success Prediction: {Math.round(score)}%</p>
              <p className="text-xs text-gray-500">Confidence: {Math.round(confidence)}%</p>
            </div>
            {factors.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-1">Key Factors:</p>
                <ul className="text-xs space-y-1">
                  {factors.map((factor, idx) => (
                    <li key={idx}>• {factor}</li>
                  ))}
                </ul>
              </div>
            )}
            {prediction.recommendation && (
              <div className="pt-2 border-t">
                <p className="text-xs font-semibold mb-1">Recommendation:</p>
                <p className="text-xs">{prediction.recommendation}</p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
