import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Mail } from "lucide-react";
import { toast } from "sonner";

export default function Unsubscribe() {
  const [, params] = useRoute("/unsubscribe/:trackingId");
  const trackingId = params?.trackingId || "";

  const [reason, setReason] = useState("");
  const [unsubscribed, setUnsubscribed] = useState(false);

  // Mutation
  const unsubscribeMutation = trpc.emailCampaigns.unsubscribe.useMutation({
    onSuccess: () => {
      setUnsubscribed(true);
      toast.success("You have been unsubscribed successfully");
    },
    onError: (error) => {
      toast.error(`Failed to unsubscribe: ${error.message}`);
    },
  });

  const handleUnsubscribe = () => {
    if (!trackingId) {
      toast.error("Invalid unsubscribe link");
      return;
    }

    unsubscribeMutation.mutate({
      trackingId,
      reason: reason || undefined,
    });
  };

  if (unsubscribed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle>Successfully Unsubscribed</CardTitle>
            <CardDescription>
              You will no longer receive emails from us
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              We're sorry to see you go. If you change your mind, you can always resubscribe by visiting our website.
            </p>
            <Button onClick={() => window.location.href = "/"}>
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-10 h-10 text-blue-600" />
          </div>
          <CardTitle>Unsubscribe from Emails</CardTitle>
          <CardDescription>
            We're sorry to see you go. You can unsubscribe from our mailing list below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Why are you unsubscribing? (Optional)</Label>
            <Textarea
              placeholder="Let us know how we can improve..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
          <Button
            onClick={handleUnsubscribe}
            disabled={unsubscribeMutation.isPending}
            className="w-full"
          >
            {unsubscribeMutation.isPending ? "Unsubscribing..." : "Unsubscribe"}
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = "/"}
            className="w-full"
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
