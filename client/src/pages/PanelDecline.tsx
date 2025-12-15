import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Loader2, Calendar, AlertTriangle } from "lucide-react";

export default function PanelDecline() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "expired" | "used" | "success" | "error">("loading");
  const [reason, setReason] = useState("");

  const { data: tokenData, isLoading } = (trpc as any).panelPublic.validateToken.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  const declineMutation = (trpc as any).panelPublic.declineInvitation.useMutation({
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

  const handleDecline = () => {
    if (token) {
      declineMutation.mutate({ token, reason });
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Response Recorded</h2>
            <p className="text-gray-600">
              Thank you for letting us know. The recruiter has been notified of your response.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl">Decline Interview Invitation</CardTitle>
          <CardDescription>
            We understand you may not be available for this interview
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tokenData?.details && (
            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Interview Details</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Position:</strong> {tokenData.details.jobTitle}</p>
                  <p><strong>Candidate:</strong> {tokenData.details.candidateName}</p>
                  <p><strong>Date:</strong> {new Date(tokenData.details.interviewDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for declining (optional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Let the recruiter know why you can't attend..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                className="w-full bg-red-600 hover:bg-red-700"
                onClick={handleDecline}
                disabled={declineMutation.isPending}
              >
                {declineMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Decline Invitation
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
