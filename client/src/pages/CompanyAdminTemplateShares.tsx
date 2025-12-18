import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { CompanyAdminLayout } from "@/components/CompanyAdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Eye, Clock, User, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function CompanyAdminTemplateShares() {
  const [selectedShare, setSelectedShare] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve");

  const utils = trpc.useUtils();
  const { data: pendingShares, isLoading } = trpc.companyAdmin.getPendingTemplateShares.useQuery();

  const approveMutation = trpc.companyAdmin.approveTemplateShare.useMutation({
    onSuccess: () => {
      toast.success("Template approved and shared company-wide");
      utils.companyAdmin.getPendingTemplateShares.invalidate();
      setShowReviewDialog(false);
      setReviewNotes("");
      setSelectedShare(null);
    },
    onError: (error) => {
      toast.error(`Failed to approve: ${error.message}`);
    },
  });

  const rejectMutation = trpc.companyAdmin.rejectTemplateShare.useMutation({
    onSuccess: () => {
      toast.success("Template share request rejected");
      utils.companyAdmin.getPendingTemplateShares.invalidate();
      setShowReviewDialog(false);
      setReviewNotes("");
      setSelectedShare(null);
    },
    onError: (error) => {
      toast.error(`Failed to reject: ${error.message}`);
    },
  });

  const handleReview = (share: any, action: "approve" | "reject") => {
    setSelectedShare(share);
    setReviewAction(action);
    setShowReviewDialog(true);
  };

  const handleConfirmReview = async () => {
    if (!selectedShare) return;

    if (reviewAction === "approve") {
      setIsApproving(true);
      await approveMutation.mutateAsync({
        shareId: selectedShare.id,
        reviewNotes: reviewNotes || undefined,
      });
      setIsApproving(false);
    } else {
      if (!reviewNotes.trim()) {
        toast.error("Please provide a reason for rejection");
        return;
      }
      setIsRejecting(true);
      await rejectMutation.mutateAsync({
        shareId: selectedShare.id,
        reviewNotes,
      });
      setIsRejecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading template share requests...</div>
        </div>
      </div>
    );
  }

  return (
    <CompanyAdminLayout>
      <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Template Share Requests</h1>
        <p className="text-muted-foreground">
          Review and approve job templates shared by recruiters for company-wide use
        </p>
      </div>

      {!pendingShares || pendingShares.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No Pending Requests</p>
            <p className="text-sm text-muted-foreground">
              All template share requests have been reviewed
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingShares.map((share) => (
            <Card key={share.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{share.templateName}</CardTitle>
                    <CardDescription className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Shared by {share.sharedByName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(share.requestedAt), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Pending Review
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {share.templateDescription && (
                  <div>
                    <Label className="text-sm font-medium">Template Description</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {share.templateDescription}
                    </p>
                  </div>
                )}
                
                {share.requestMessage && (
                  <div>
                    <Label className="text-sm font-medium">Request Message</Label>
                    <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded-md">
                      {share.requestMessage}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="default"
                    className="flex items-center gap-2"
                    onClick={() => handleReview(share, "approve")}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve & Share Company-Wide
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex items-center gap-2"
                    onClick={() => handleReview(share, "reject")}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? "Approve Template" : "Reject Template"}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "approve"
                ? "This template will be made available company-wide for all recruiters to use."
                : "Please provide a reason for rejecting this template share request."}
            </DialogDescription>
          </DialogHeader>

          {selectedShare && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-sm font-medium">Template Name</Label>
                <p className="text-sm mt-1">{selectedShare.templateName}</p>
              </div>

              <div>
                <Label htmlFor="reviewNotes">
                  {reviewAction === "approve" ? "Review Notes (Optional)" : "Rejection Reason *"}
                </Label>
                <Textarea
                  id="reviewNotes"
                  placeholder={
                    reviewAction === "approve"
                      ? "Add any notes about this approval..."
                      : "Explain why this template cannot be shared company-wide..."
                  }
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowReviewDialog(false);
                setReviewNotes("");
                setSelectedShare(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant={reviewAction === "approve" ? "default" : "destructive"}
              onClick={handleConfirmReview}
              disabled={isApproving || isRejecting}
            >
              {isApproving || isRejecting ? (
                "Processing..."
              ) : reviewAction === "approve" ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm Approval
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Confirm Rejection
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </CompanyAdminLayout>
  );
}
