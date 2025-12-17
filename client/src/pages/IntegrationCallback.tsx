import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function IntegrationCallback() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const provider = window.location.pathname.split("/").pop(); // google or calendly
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const connectGoogleCalendar = trpc.recruiter.connectGoogleCalendar.useMutation();
  const connectCalendly = trpc.recruiter.connectCalendly.useMutation();

  useEffect(() => {
    if (error) {
      setStatus("error");
      setMessage(`Authorization failed: ${error}`);
      return;
    }

    if (!code) {
      setStatus("error");
      setMessage("No authorization code received");
      return;
    }

    const handleCallback = async () => {
      try {
        const redirectUri = `${window.location.origin}/integrations/callback/${provider}`;

        if (provider === "google") {
          // Prompt for email and timezone
          const email = prompt("Enter your Google Calendar email:");
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

          if (!email) {
            setStatus("error");
            setMessage("Email is required to complete the integration");
            return;
          }

          await connectGoogleCalendar.mutateAsync({
            code,
            redirectUri,
            calendarEmail: email,
            timezone,
          });

          setStatus("success");
          setMessage("Google Calendar connected successfully!");
        } else if (provider === "calendly") {
          const email = prompt("Enter your Calendly email:");

          if (!email) {
            setStatus("error");
            setMessage("Email is required to complete the integration");
            return;
          }

          await connectCalendly.mutateAsync({
            code,
            redirectUri,
            calendlyEmail: email,
          });

          setStatus("success");
          setMessage("Calendly connected successfully!");
        } else {
          setStatus("error");
          setMessage("Unknown integration provider");
        }
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message || "Failed to complete integration");
      }
    };

    handleCallback();
  }, [code, error, provider]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === "loading" && <Loader2 className="w-5 h-5 animate-spin" />}
            {status === "success" && <CheckCircle2 className="w-5 h-5 text-green-600" />}
            {status === "error" && <XCircle className="w-5 h-5 text-red-600" />}
            Integration {status === "loading" ? "In Progress" : status === "success" ? "Complete" : "Failed"}
          </CardTitle>
          <CardDescription>
            {status === "loading" && "Connecting your account..."}
            {status === "success" && "Your integration is now active"}
            {status === "error" && "Something went wrong"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">{message}</p>

          {status !== "loading" && (
            <div className="flex gap-3">
              <Button
                onClick={() => setLocation("/recruiter/integrations")}
                className="flex-1"
              >
                Go to Integrations
              </Button>
              <Button
                onClick={() => setLocation("/recruiter/dashboard")}
                variant="outline"
                className="flex-1"
              >
                Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
