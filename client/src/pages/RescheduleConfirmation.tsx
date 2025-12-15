import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";

export default function RescheduleConfirmation() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const requestId = params.get("requestId");
  const action = params.get("action") as "confirm" | "decline" | null;
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const confirmMutation = (trpc as any).reschedule?.confirmAlternative?.useMutation({
    onSuccess: (data: { message: string }) => {
      setStatus("success");
      setMessage(data.message);
    },
    onError: (error: Error) => {
      setStatus("error");
      setMessage(error.message || "An error occurred while processing your request.");
    },
  });

  useEffect(() => {
    if (requestId && action && confirmMutation) {
      confirmMutation.mutate({
        requestId: parseInt(requestId),
        action,
      });
    } else if (!requestId || !action) {
      setStatus("error");
      setMessage("Invalid confirmation link. Please check your email and try again.");
    }
  }, [requestId, action]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex flex-col items-center gap-4">
            {status === "loading" && (
              <>
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                <span>Processing your response...</span>
              </>
            )}
            {status === "success" && action === "confirm" && (
              <>
                <CheckCircle className="h-12 w-12 text-green-500" />
                <span className="text-green-700">Time Confirmed!</span>
              </>
            )}
            {status === "success" && action === "decline" && (
              <>
                <XCircle className="h-12 w-12 text-red-500" />
                <span className="text-red-700">Time Declined</span>
              </>
            )}
            {status === "error" && (
              <>
                <AlertCircle className="h-12 w-12 text-amber-500" />
                <span className="text-amber-700">Something went wrong</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">{message}</p>
          
          {status !== "loading" && (
            <div className="pt-4">
              <Button onClick={() => setLocation("/")} variant="outline">
                Go to Homepage
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
