import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, Send, Eye, MessageSquare, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";
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

const statusIcons: Record<string, any> = {
  draft: FileText,
  sent: Send,
  viewed: Eye,
  negotiating: MessageSquare,
  accepted: CheckCircle,
  rejected: XCircle,
  withdrawn: XCircle,
  expired: Clock,
};

export default function OfferManagement() {
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [viewOfferDialog, setViewOfferDialog] = useState(false);

  // Fetch offers
  const { data: offersData, isLoading } = trpc.offerManagement.getRecruiterOffers.useQuery({
    page: 1,
    pageSize: 100,
    status: selectedStatus === "all" ? undefined : selectedStatus,
  });

  // Fetch statistics
  const { data: stats } = trpc.offerManagement.getOfferStats.useQuery();

  // Mutations
  const sendOfferMutation = trpc.offerManagement.sendOffer.useMutation({
    onSuccess: () => {
      toast({
        title: "Offer Sent",
        description: "The offer has been sent to the candidate.",
      });
    },
  });

  const withdrawOfferMutation = trpc.offerManagement.withdrawOffer.useMutation({
    onSuccess: () => {
      toast({
        title: "Offer Withdrawn",
        description: "The offer has been withdrawn.",
      });
      setViewOfferDialog(false);
    },
  });

  const handleSendOffer = async (offerId: number) => {
    await sendOfferMutation.mutateAsync({ offerId });
  };

  const handleWithdrawOffer = async (offerId: number) => {
    if (confirm("Are you sure you want to withdraw this offer?")) {
      await withdrawOfferMutation.mutateAsync({ offerId, reason: "Withdrawn by recruiter" });
    }
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

  const offers = offersData?.data || [];

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Offer Management</h1>
          <p className="text-muted-foreground">
            Track and manage job offers sent to candidates
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Offers</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.sent} sent, {stats.draft} drafts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.accepted}</div>
              <p className="text-xs text-muted-foreground">
                {stats.acceptanceRate}% acceptance rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Negotiating</CardTitle>
              <MessageSquare className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.negotiating}</div>
              <p className="text-xs text-muted-foreground">
                Active negotiations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Time to Accept</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgTimeToAccept}</div>
              <p className="text-xs text-muted-foreground">
                days on average
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Offers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Offers</CardTitle>
              <CardDescription>View and manage all job offers</CardDescription>
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="viewed">Viewed</SelectItem>
                <SelectItem value="negotiating">Negotiating</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {offers.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No offers found</h3>
              <p className="text-muted-foreground">
                {selectedStatus === "all"
                  ? "You haven't created any offers yet."
                  : `No offers with status "${selectedStatus}".`}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Compensation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((offer: any) => {
                  const StatusIcon = statusIcons[offer.status] || FileText;
                  return (
                    <TableRow key={offer.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{offer.candidate?.fullName}</div>
                          <div className="text-sm text-muted-foreground">
                            {offer.candidate?.user?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{offer.offerTitle}</div>
                          <div className="text-sm text-muted-foreground">
                            {offer.job?.title}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {formatCurrency(offer.totalCompensation)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {offer.salaryType === "annual" ? "per year" : "per hour"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[offer.status]}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {offer.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(offer.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewOffer(offer)}
                          >
                            View
                          </Button>
                          {offer.status === "draft" && (
                            <Button
                              size="sm"
                              onClick={() => handleSendOffer(offer.id)}
                              disabled={sendOfferMutation.isPending}
                            >
                              Send
                            </Button>
                          )}
                          {(offer.status === "sent" || offer.status === "viewed" || offer.status === "negotiating") && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleWithdrawOffer(offer.id)}
                              disabled={withdrawOfferMutation.isPending}
                            >
                              Withdraw
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
              {/* Status Badge */}
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

              {/* Candidate Info */}
              <div>
                <h3 className="font-semibold mb-2">Candidate</h3>
                <div className="text-sm space-y-1">
                  <div><strong>Name:</strong> {selectedOffer.candidate?.fullName}</div>
                  <div><strong>Email:</strong> {selectedOffer.candidate?.user?.email}</div>
                </div>
              </div>

              {/* Position Info */}
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

              {/* Terms */}
              {(selectedOffer.probationPeriod || selectedOffer.noticePeriod || selectedOffer.nonCompeteClause) && (
                <div>
                  <h3 className="font-semibold mb-2">Terms</h3>
                  <div className="text-sm space-y-1">
                    {selectedOffer.probationPeriod && (
                      <div><strong>Probation Period:</strong> {selectedOffer.probationPeriod} months</div>
                    )}
                    {selectedOffer.noticePeriod && (
                      <div><strong>Notice Period:</strong> {selectedOffer.noticePeriod} months</div>
                    )}
                    {selectedOffer.nonCompeteClause && (
                      <div><strong>Non-Compete:</strong> {selectedOffer.nonCompeteDuration} months</div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedOffer.recruiterNotes && (
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <div className="text-sm whitespace-pre-wrap bg-muted p-3 rounded">
                    {selectedOffer.recruiterNotes}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <h3 className="font-semibold mb-2">Timeline</h3>
                <div className="text-sm space-y-1">
                  <div><strong>Created:</strong> {format(new Date(selectedOffer.createdAt), "MMM d, yyyy 'at' h:mm a")}</div>
                  {selectedOffer.sentAt && (
                    <div><strong>Sent:</strong> {format(new Date(selectedOffer.sentAt), "MMM d, yyyy 'at' h:mm a")}</div>
                  )}
                  {selectedOffer.viewedAt && (
                    <div><strong>Viewed:</strong> {format(new Date(selectedOffer.viewedAt), "MMM d, yyyy 'at' h:mm a")}</div>
                  )}
                  {selectedOffer.acceptedAt && (
                    <div><strong>Accepted:</strong> {format(new Date(selectedOffer.acceptedAt), "MMM d, yyyy 'at' h:mm a")}</div>
                  )}
                  {selectedOffer.rejectedAt && (
                    <div><strong>Rejected:</strong> {format(new Date(selectedOffer.rejectedAt), "MMM d, yyyy 'at' h:mm a")}</div>
                  )}
                </div>
              </div>

              {/* Candidate Response */}
              {selectedOffer.candidateResponse && (
                <div>
                  <h3 className="font-semibold mb-2">Candidate Response</h3>
                  <div className="text-sm whitespace-pre-wrap bg-muted p-3 rounded">
                    {selectedOffer.candidateResponse}
                  </div>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedOffer.rejectionReason && (
                <div>
                  <h3 className="font-semibold mb-2">Rejection Reason</h3>
                  <div className="text-sm whitespace-pre-wrap bg-muted p-3 rounded">
                    {selectedOffer.rejectionReason}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
