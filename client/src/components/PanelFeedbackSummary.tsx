import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Star, Users, ThumbsUp, ThumbsDown, 
  CheckCircle, XCircle, Minus, Loader2
} from "lucide-react";

interface PanelFeedbackSummaryProps {
  interviewId: number;
  compact?: boolean;
}

export function PanelFeedbackSummary({ interviewId, compact = false }: PanelFeedbackSummaryProps) {
  const { data: summary, isLoading } = (trpc as any).interview.getPanelistFeedbackSummary.useQuery(
    { interviewId },
    { enabled: !!interviewId }
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading feedback...</span>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <Users className="h-4 w-4" />
        <span>No panel feedback yet</span>
      </div>
    );
  }

  const getConsensusColor = (consensus: string) => {
    switch (consensus) {
      case "positive":
        return "bg-green-100 text-green-800 border-green-200";
      case "negative":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  const getConsensusIcon = (consensus: string) => {
    switch (consensus) {
      case "positive":
        return <ThumbsUp className="h-3 w-3" />;
      case "negative":
        return <ThumbsDown className="h-3 w-3" />;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  const getConsensusLabel = (consensus: string) => {
    switch (consensus) {
      case "positive":
        return "Positive";
      case "negative":
        return "Negative";
      default:
        return "Mixed";
    }
  };

  const renderStars = (score: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= Math.round(score)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-1 text-xs text-gray-600">{score.toFixed(1)}</span>
      </div>
    );
  };

  // Compact view for interview cards
  if (compact) {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        {/* Overall Score */}
        <div className="flex items-center gap-1.5">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="font-semibold text-sm">{summary.averages.overall.toFixed(1)}</span>
        </div>

        {/* Response Count */}
        <div className="flex items-center gap-1 text-gray-500 text-sm">
          <Users className="h-3.5 w-3.5" />
          <span>{summary.totalResponses} response{summary.totalResponses !== 1 ? "s" : ""}</span>
        </div>

        {/* Consensus Badge */}
        <Badge className={`${getConsensusColor(summary.consensus)} text-xs`}>
          {getConsensusIcon(summary.consensus)}
          <span className="ml-1">{getConsensusLabel(summary.consensus)}</span>
        </Badge>

        {/* Recommendation Counts */}
        <div className="flex items-center gap-2 text-xs">
          {summary.recommendations.strongHire > 0 && (
            <span className="flex items-center gap-0.5 text-green-600">
              <CheckCircle className="h-3 w-3" />
              {summary.recommendations.strongHire} Strong Hire
            </span>
          )}
          {summary.recommendations.hire > 0 && (
            <span className="flex items-center gap-0.5 text-green-500">
              <ThumbsUp className="h-3 w-3" />
              {summary.recommendations.hire} Hire
            </span>
          )}
          {summary.recommendations.noHire > 0 && (
            <span className="flex items-center gap-0.5 text-red-500">
              <ThumbsDown className="h-3 w-3" />
              {summary.recommendations.noHire} No Hire
            </span>
          )}
          {summary.recommendations.strongNoHire > 0 && (
            <span className="flex items-center gap-0.5 text-red-600">
              <XCircle className="h-3 w-3" />
              {summary.recommendations.strongNoHire} Strong No
            </span>
          )}
        </div>
      </div>
    );
  }

  // Full view
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Panel Feedback Summary
          </span>
          <Badge className={getConsensusColor(summary.consensus)}>
            {getConsensusIcon(summary.consensus)}
            <span className="ml-1">{getConsensusLabel(summary.consensus)} Consensus</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Overall Rating</span>
          <div className="flex items-center gap-2">
            {renderStars(summary.averages.overall)}
          </div>
        </div>

        {/* Category Scores */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Technical</span>
              <span className="font-medium">{summary.averages.technical}/5</span>
            </div>
            <Progress value={summary.averages.technical * 20} className="h-1.5" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Communication</span>
              <span className="font-medium">{summary.averages.communication}/5</span>
            </div>
            <Progress value={summary.averages.communication * 20} className="h-1.5" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Problem Solving</span>
              <span className="font-medium">{summary.averages.problemSolving}/5</span>
            </div>
            <Progress value={summary.averages.problemSolving * 20} className="h-1.5" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Culture Fit</span>
              <span className="font-medium">{summary.averages.cultureFit}/5</span>
            </div>
            <Progress value={summary.averages.cultureFit * 20} className="h-1.5" />
          </div>
        </div>

        {/* Recommendation Breakdown */}
        <div className="pt-2 border-t">
          <p className="text-xs text-gray-500 mb-2">Recommendations ({summary.totalResponses} panelists)</p>
          <div className="flex gap-2 flex-wrap">
            {summary.recommendations.strongHire > 0 && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Strong Hire ({summary.recommendations.strongHire})
              </Badge>
            )}
            {summary.recommendations.hire > 0 && (
              <Badge className="bg-green-50 text-green-700">
                <ThumbsUp className="h-3 w-3 mr-1" />
                Hire ({summary.recommendations.hire})
              </Badge>
            )}
            {summary.recommendations.noHire > 0 && (
              <Badge className="bg-red-50 text-red-700">
                <ThumbsDown className="h-3 w-3 mr-1" />
                No Hire ({summary.recommendations.noHire})
              </Badge>
            )}
            {summary.recommendations.strongNoHire > 0 && (
              <Badge className="bg-red-100 text-red-800">
                <XCircle className="h-3 w-3 mr-1" />
                Strong No Hire ({summary.recommendations.strongNoHire})
              </Badge>
            )}
          </div>
        </div>

        {/* Individual Panelist Votes */}
        {summary.panelists && summary.panelists.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-gray-500 mb-2">Individual Votes</p>
            <div className="space-y-1">
              {summary.panelists.map((panelist: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{panelist.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {panelist.overallScore}/5
                    </span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        panelist.recommendation?.includes('hire') && !panelist.recommendation?.includes('no')
                          ? 'border-green-300 text-green-700'
                          : 'border-red-300 text-red-700'
                      }`}
                    >
                      {panelist.recommendation?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PanelFeedbackSummary;
