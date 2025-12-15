import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InterviewFeedbackDialog } from "./InterviewFeedbackForm";
import { MessageSquare, Star, X, ChevronRight } from "lucide-react";

export function FeedbackPromptWidget() {
  const { data: awaitingFeedback, refetch } = trpc.interview.getAwaitingFeedback.useQuery();
  const [selectedInterview, setSelectedInterview] = useState<{
    id: number;
    jobTitle: string;
    companyName: string;
  } | null>(null);
  const [dismissed, setDismissed] = useState<number[]>([]);

  // Filter out dismissed interviews
  const pendingFeedback = awaitingFeedback?.filter(
    (interview) => !dismissed.includes(interview.id)
  );

  if (!pendingFeedback || pendingFeedback.length === 0) {
    return null;
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-amber-900">
                Share Your Interview Experience
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                You have {pendingFeedback.length} completed interview{pendingFeedback.length > 1 ? "s" : ""} awaiting feedback
              </p>
              
              <div className="mt-3 space-y-2">
                {pendingFeedback.slice(0, 3).map((interview) => (
                  <div
                    key={interview.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-100 group hover:border-amber-300 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {interview.jobTitle || "Position"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {interview.companyName || "Company"} • {formatDate(interview.scheduledAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                        onClick={() => setDismissed([...dismissed, interview.id])}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setSelectedInterview({
                          id: interview.id,
                          jobTitle: interview.jobTitle || "Position",
                          companyName: interview.companyName || "Company",
                        })}
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Rate
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {pendingFeedback.length > 3 && (
                <p className="text-xs text-amber-600 mt-2">
                  +{pendingFeedback.length - 3} more interview{pendingFeedback.length - 3 > 1 ? "s" : ""} awaiting feedback
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedInterview && (
        <InterviewFeedbackDialog
          open={!!selectedInterview}
          onOpenChange={(open) => !open && setSelectedInterview(null)}
          interviewId={selectedInterview.id}
          jobTitle={selectedInterview.jobTitle}
          companyName={selectedInterview.companyName}
          onSuccess={() => {
            refetch();
            setSelectedInterview(null);
          }}
        />
      )}
    </>
  );
}
