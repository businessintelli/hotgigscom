import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Loader2, Calendar, Clock } from "lucide-react";

export default function PanelReschedule() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "expired" | "used" | "success" | "error">("loading");
  const [preferredDate1, setPreferredDate1] = useState("");
  const [preferredDate2, setPreferredDate2] = useState("");
  const [message, setMessage] = useState("");

  const { data: tokenData, isLoading } = (trpc as any).panelPublic.validateToken.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  const rescheduleMutation = (trpc as any).panelPublic.requestReschedule.useMutation({
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

  const handleReschedule = () => {
    if (token) {
      const preferredDates = [preferredDate1, preferredDate2].filter(Boolean);
      rescheduleMutation.mutate({ token, preferredDates, message });
    }
  };

  if (isLoading || status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Validating your invitation...</p>
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
              {status === "expired" ? "Link Expired" : status === "used" ? "Already Responded" : "Invalid Link"}
            </h2>
            <p className="text-gray-600">
              {status === "expired"
                ? "This invitation link has expired."
                : status === "used"
                ? "You have already responded to this invitation."
                : "This invitation link is invalid."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Reschedule Request Sent</h2>
            <p className="text-gray-600">
              The recruiter has been notified of your preferred times. They will reach out with a new interview time.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Request Reschedule</CardTitle>
          <CardDescription>
            Suggest alternative times for the interview
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tokenData?.details && (
            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Current Interview</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Position:</strong> {tokenData.details.jobTitle}</p>
                  <p><strong>Candidate:</strong> {tokenData.details.candidateName}</p>
                  <p><strong>Current Date:</strong> {new Date(tokenData.details.interviewDate).toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="date1">Preferred Date/Time 1</Label>
                  <Input
                    id="date1"
                    type="datetime-local"
                    value={preferredDate1}
                    onChange={(e) => setPreferredDate1(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="date2">Preferred Date/Time 2 (optional)</Label>
                  <Input
                    id="date2"
                    type="datetime-local"
                    value={preferredDate2}
                    onChange={(e) => setPreferredDate2(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="message">Additional Notes (optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Any additional information about your availability..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleReschedule}
                disabled={rescheduleMutation.isPending || !preferredDate1}
              >
                {rescheduleMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Calendar className="h-4 w-4 mr-2" />
                )}
                Request Reschedule
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
