import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, XCircle, Clock, Building, MapPin, DollarSign, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function OfferAcceptance() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const applicationId = params.applicationId ? parseInt(params.applicationId) : null;

  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  // Fetch application and selection details
  const { data: applicationData, isLoading: applicationLoading } = trpc.applications.getApplicationById.useQuery(
    { id: applicationId! },
    { enabled: !!applicationId }
  );

  const { data: selectionData, isLoading: selectionLoading } = trpc.selectionOnboarding.getSelectionByApplication.useQuery(
    { applicationId: applicationId! },
    { enabled: !!applicationId }
  );

  const { data: jobData } = trpc.jobs.getJobById.useQuery(
    { id: applicationData?.jobId || 0 },
    { enabled: !!applicationData?.jobId }
  );

  const acceptOfferMutation = trpc.selectionOnboarding.acceptOffer.useMutation({
    onSuccess: () => {
      toast({
        title: "Offer Accepted!",
        description: "Congratulations! Your onboarding process will begin shortly.",
      });
      setShowAcceptDialog(false);
      navigate("/candidate/onboarding-checklist");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const declineOfferMutation = trpc.selectionOnboarding.declineOffer.useMutation({
    onSuccess: () => {
      toast({
        title: "Offer Declined",
        description: "We've notified the recruiter of your decision.",
      });
      setShowDeclineDialog(false);
      navigate("/candidate/applications");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAccept = () => {
    if (!applicationId) return;
    acceptOfferMutation.mutate({ applicationId });
  };

  const handleDecline = () => {
    if (!applicationId || !declineReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for declining the offer.",
        variant: "destructive",
      });
      return;
    }
    declineOfferMutation.mutate({
      applicationId,
      declineReason: declineReason.trim(),
    });
  };

  if (!applicationId) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Invalid Request</CardTitle>
            <CardDescription>No application ID provided.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (applicationLoading || selectionLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!applicationData || !selectionData) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>No Offer Found</CardTitle>
            <CardDescription>
              You don't have a pending offer for this application.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (selectionData.decision !== 'selected') {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Application Status</CardTitle>
            <CardDescription>
              This application is currently in {selectionData.decision} status.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Check if already responded
  if (applicationData.status === 'offer-accepted' || applicationData.status === 'offer-declined') {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              {applicationData.status === 'offer-accepted' ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
              <CardTitle>
                {applicationData.status === 'offer-accepted' ? 'Offer Accepted' : 'Offer Declined'}
              </CardTitle>
            </div>
            <CardDescription>
              {applicationData.status === 'offer-accepted'
                ? 'You have already accepted this offer. Check your onboarding checklist for next steps.'
                : 'You have declined this offer.'}
            </CardDescription>
          </CardHeader>
          {applicationData.status === 'offer-accepted' && (
            <CardContent>
              <Button onClick={() => navigate("/candidate/onboarding-checklist")} className="w-full">
                View Onboarding Checklist
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Congratulations! 🎉</CardTitle>
                <CardDescription className="text-lg mt-2">
                  You've been selected for the position
                </CardDescription>
              </div>
              <Badge variant="default" className="text-lg px-4 py-2">
                Offer Extended
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Job Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Position Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building className="h-4 w-4" />
                  <span className="text-sm font-medium">Position</span>
                </div>
                <p className="text-lg font-semibold">{jobData?.title || 'N/A'}</p>
              </div>

              {jobData?.location && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm font-medium">Location</span>
                  </div>
                  <p className="text-lg font-semibold">{jobData.location}</p>
                </div>
              )}

              {jobData?.salaryRange && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm font-medium">Salary Range</span>
                  </div>
                  <p className="text-lg font-semibold">{jobData.salaryRange}</p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">Decision Date</span>
                </div>
                <p className="text-lg font-semibold">
                  {format(new Date(selectionData.decidedAt), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>

            {jobData?.description && (
              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-2">Job Description</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {jobData.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selection Reason Card */}
        {selectionData.selectionReason && (
          <Card>
            <CardHeader>
              <CardTitle>Why You Were Selected</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{selectionData.selectionReason}</p>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Your Decision</CardTitle>
            <CardDescription>
              Please review the offer details carefully and let us know your decision.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Important:</strong> Once you accept or decline this offer, your decision cannot be changed.
                Please take your time to review all the details before making your decision.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => setShowAcceptDialog(true)}
                size="lg"
                className="w-full"
                disabled={acceptOfferMutation.isPending || declineOfferMutation.isPending}
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                Accept Offer
              </Button>

              <Button
                onClick={() => setShowDeclineDialog(true)}
                size="lg"
                variant="outline"
                className="w-full"
                disabled={acceptOfferMutation.isPending || declineOfferMutation.isPending}
              >
                <XCircle className="mr-2 h-5 w-5" />
                Decline Offer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps Card */}
        <Card>
          <CardHeader>
            <CardTitle>What Happens Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium">Accept the Offer</p>
                  <p className="text-sm text-muted-foreground">
                    Click "Accept Offer" to confirm your decision
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium">Complete Onboarding</p>
                  <p className="text-sm text-muted-foreground">
                    You'll receive an onboarding checklist with all required tasks
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <div>
                  <p className="font-medium">Start Your New Role</p>
                  <p className="text-sm text-muted-foreground">
                    Once onboarding is complete, you'll be ready to start!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accept Confirmation Dialog */}
      <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Offer?</DialogTitle>
            <DialogDescription>
              Are you sure you want to accept this offer? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAcceptDialog(false)}
              disabled={acceptOfferMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAccept}
              disabled={acceptOfferMutation.isPending}
            >
              {acceptOfferMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                "Confirm Accept"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline Confirmation Dialog */}
      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Offer?</DialogTitle>
            <DialogDescription>
              We're sorry to see you go. Please let us know why you're declining this offer.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Please provide a reason for declining (required)..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeclineDialog(false);
                setDeclineReason("");
              }}
              disabled={declineOfferMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDecline}
              disabled={declineOfferMutation.isPending || !declineReason.trim()}
            >
              {declineOfferMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Declining...
                </>
              ) : (
                "Confirm Decline"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
