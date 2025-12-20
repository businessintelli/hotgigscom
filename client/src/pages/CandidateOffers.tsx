import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FileText, CheckCircle, XCircle, MessageSquare, Eye, Clock, DollarSign, MapPin, Calendar, Briefcase } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  draft: "bg-gray-500",
  sent: "bg-blue-500",
  viewed: "bg-purple-500",
  negotiating: "bg-yellow-500",
  accepted: "bg-green-500",
  rejected: "bg-red-500",
  withdrawn: "bg-gray-700",
  expired: "bg-gray-600",
};

export default function CandidateOffers() {
  const { toast } = useToast();
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [viewOfferDialog, setViewOfferDialog] = useState(false);
  const [acceptDialog, setAcceptDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [negotiateDialog, setNegotiateDialog] = useState(false);
  
  const [acceptMessage, setAcceptMessage] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [negotiateMessage, setNegotiateMessage] = useState("");
  const [proposedSalary, setProposedSalary] = useState("");

  // Fetch offers
  const { data: offers, isLoading, refetch } = trpc.offerManagement.getCandidateOffers.useQuery();

  // Mutations
  const acceptOfferMutation = trpc.offerManagement.acceptOffer.useMutation({
    onSuccess: () => {
      toast({
        title: "Offer Accepted",
        description: "Congratulations! You've accepted the offer.",
      });
      setAcceptDialog(false);
      setViewOfferDialog(false);
      refetch();
    },
  });

  const rejectOfferMutation = trpc.offerManagement.rejectOffer.useMutation({
    onSuccess: () => {
      toast({
        title: "Offer Rejected",
        description: "You've declined the offer.",
      });
      setRejectDialog(false);
      setViewOfferDialog(false);
      refetch();
    },
  });

  const startNegotiationMutation = trpc.offerManagement.startNegotiation.useMutation({
    onSuccess: () => {
      toast({
        title: "Negotiation Started",
        description: "Your counter-offer has been sent to the recruiter.",
      });
      setNegotiateDialog(false);
      setViewOfferDialog(false);
      refetch();
    },
  });

  const handleAcceptOffer = async () => {
    if (!selectedOffer) return;
    await acceptOfferMutation.mutateAsync({
      offerId: selectedOffer.id,
      message: acceptMessage,
    });
  };

  const handleRejectOffer = async () => {
    if (!selectedOffer || !rejectReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }
    await rejectOfferMutation.mutateAsync({
      offerId: selectedOffer.id,
      reason: rejectReason,
    });
  };

  const handleStartNegotiation = async () => {
    if (!selectedOffer || !negotiateMessage.trim()) {
      toast({
        title: "Error",
        description: "Please provide a message for negotiation.",
        variant: "destructive",
      });
      return;
    }
    await startNegotiationMutation.mutateAsync({
      offerId: selectedOffer.id,
      message: negotiateMessage,
      proposedSalary: proposedSalary ? parseInt(proposedSalary) : undefined,
    });
  };

  const handleViewOffer = (offer: any) => {
    setSelectedOffer(offer);
    setViewOfferDialog(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading offers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Offers</h1>
        <p className="text-muted-foreground">
          Review and respond to job offers from employers
        </p>
      </div>

      {/* Offers List */}
      {!offers || offers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No offers yet</h3>
            <p className="text-muted-foreground">
              You haven't received any job offers. Keep applying!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {offers.map((offer: any) => (
            <Card key={offer.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{offer.offerTitle}</CardTitle>
                    <CardDescription className="mt-1">
                      {offer.job?.company || "Company"}
                    </CardDescription>
                  </div>
                  <Badge className={statusColors[offer.status]}>
                    {offer.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Key Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{formatCurrency(offer.totalCompensation)}</span>
                    <span className="text-muted-foreground">
                      {offer.salaryType === "annual" ? "/year" : "/hour"}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{offer.workLocation} • {offer.workType}</span>
                  </div>
                  
                  {offer.startDate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Start: {format(new Date(offer.startDate), "MMM d, yyyy")}</span>
                    </div>
                  )}
                  
                  {offer.expiresAt && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Expires: {format(new Date(offer.expiresAt), "MMM d, yyyy")}</span>
                    </div>
                  )}
                </div>

                {/* Benefits Summary */}
                <div className="flex flex-wrap gap-2">
                  {offer.healthInsurance && (
                    <Badge variant="outline">Health Insurance</Badge>
                  )}
                  {offer.retirement401k && (
                    <Badge variant="outline">401(k)</Badge>
                  )}
                  {offer.paidTimeOff && (
                    <Badge variant="outline">{offer.paidTimeOff} days PTO</Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => handleViewOffer(offer)}
                  >
                    View Details
                  </Button>
                  
                  {(offer.status === "sent" || offer.status === "viewed") && (
                    <>
                      <Button
                        className="flex-1"
                        onClick={() => {
                          setSelectedOffer(offer);
                          setAcceptDialog(true);
                        }}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Accept
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Offer Dialog */}
      <Dialog open={viewOfferDialog} onOpenChange={setViewOfferDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Offer Details</DialogTitle>
            <DialogDescription>
              Review the complete offer information
            </DialogDescription>
          </DialogHeader>
          {selectedOffer && (
            <div className="space-y-6">
              {/* Status & Expiration */}
              <div className="flex items-center justify-between">
                <Badge className={statusColors[selectedOffer.status]}>
                  {selectedOffer.status}
                </Badge>
                {selectedOffer.expiresAt && (
                  <div className="text-sm text-muted-foreground">
                    Expires: {format(new Date(selectedOffer.expiresAt), "MMM d, yyyy")}
                  </div>
                )}
              </div>

              {/* Position */}
              <div>
                <h3 className="font-semibold mb-2">Position</h3>
                <div className="text-sm space-y-1">
                  <div><strong>Title:</strong> {selectedOffer.offerTitle}</div>
                  <div><strong>Department:</strong> {selectedOffer.department || "N/A"}</div>
                  <div><strong>Location:</strong> {selectedOffer.workLocation}</div>
                  <div><strong>Work Type:</strong> {selectedOffer.workType}</div>
                  {selectedOffer.startDate && (
                    <div><strong>Start Date:</strong> {format(new Date(selectedOffer.startDate), "MMM d, yyyy")}</div>
                  )}
                </div>
              </div>

              {/* Compensation */}
              <div>
                <h3 className="font-semibold mb-2">Compensation</h3>
                <div className="text-sm space-y-1">
                  <div><strong>Base Salary:</strong> {formatCurrency(selectedOffer.baseSalary)} {selectedOffer.salaryType === "annual" ? "/year" : "/hour"}</div>
                  {selectedOffer.signOnBonus > 0 && (
                    <div><strong>Sign-on Bonus:</strong> {formatCurrency(selectedOffer.signOnBonus)}</div>
                  )}
                  {selectedOffer.performanceBonus > 0 && (
                    <div><strong>Performance Bonus:</strong> {formatCurrency(selectedOffer.performanceBonus)}</div>
                  )}
                  {selectedOffer.equityShares > 0 && (
                    <div><strong>Equity:</strong> {selectedOffer.equityShares} shares ({formatCurrency(selectedOffer.equityValue)})</div>
                  )}
                  <div className="pt-2 border-t">
                    <strong>Total Compensation:</strong> {formatCurrency(selectedOffer.totalCompensation)}
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div>
                <h3 className="font-semibold mb-2">Benefits</h3>
                <div className="text-sm space-y-1">
                  {selectedOffer.healthInsurance && <div>✓ Health Insurance</div>}
                  {selectedOffer.dentalInsurance && <div>✓ Dental Insurance</div>}
                  {selectedOffer.visionInsurance && <div>✓ Vision Insurance</div>}
                  {selectedOffer.retirement401k && (
                    <div>✓ 401(k) {selectedOffer.retirement401kMatch && `(${selectedOffer.retirement401kMatch} match)`}</div>
                  )}
                  {selectedOffer.paidTimeOff && <div>✓ {selectedOffer.paidTimeOff} days PTO</div>}
                  {selectedOffer.sickLeave && <div>✓ {selectedOffer.sickLeave} days sick leave</div>}
                  {selectedOffer.parentalLeave && <div>✓ {selectedOffer.parentalLeave} weeks parental leave</div>}
                  {selectedOffer.relocationAssistance && (
                    <div>✓ Relocation Assistance {selectedOffer.relocationAmount && `(${formatCurrency(selectedOffer.relocationAmount)})`}</div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {(selectedOffer.status === "sent" || selectedOffer.status === "viewed") && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setViewOfferDialog(false);
                      setAcceptDialog(true);
                    }}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Accept Offer
                  </Button>
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => {
                      setViewOfferDialog(false);
                      setNegotiateDialog(true);
                    }}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Negotiate
                  </Button>
                  <Button
                    className="flex-1"
                    variant="destructive"
                    onClick={() => {
                      setViewOfferDialog(false);
                      setRejectDialog(true);
                    }}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Decline
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Accept Offer Dialog */}
      <Dialog open={acceptDialog} onOpenChange={setAcceptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Offer</DialogTitle>
            <DialogDescription>
              Confirm that you want to accept this job offer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="acceptMessage">Message (Optional)</Label>
              <Textarea
                id="acceptMessage"
                value={acceptMessage}
                onChange={(e) => setAcceptMessage(e.target.value)}
                placeholder="Thank you for this opportunity..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleAcceptOffer}
                disabled={acceptOfferMutation.isPending}
              >
                Confirm Accept
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => setAcceptDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Offer Dialog */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Offer</DialogTitle>
            <DialogDescription>
              Please provide a reason for declining this offer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectReason">Reason *</Label>
              <Textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="I have decided to pursue another opportunity..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                variant="destructive"
                onClick={handleRejectOffer}
                disabled={rejectOfferMutation.isPending}
              >
                Confirm Decline
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => setRejectDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Negotiate Offer Dialog */}
      <Dialog open={negotiateDialog} onOpenChange={setNegotiateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Negotiate Offer</DialogTitle>
            <DialogDescription>
              Propose changes to the offer terms
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="proposedSalary">Proposed Salary (Optional)</Label>
              <Input
                id="proposedSalary"
                type="number"
                value={proposedSalary}
                onChange={(e) => setProposedSalary(e.target.value)}
                placeholder="e.g., 130000"
              />
            </div>
            <div>
              <Label htmlFor="negotiateMessage">Message *</Label>
              <Textarea
                id="negotiateMessage"
                value={negotiateMessage}
                onChange={(e) => setNegotiateMessage(e.target.value)}
                placeholder="I'm very interested in this position. However, based on my experience and market research..."
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleStartNegotiation}
                disabled={startNegotiationMutation.isPending}
              >
                Send Counter-Offer
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => setNegotiateDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
