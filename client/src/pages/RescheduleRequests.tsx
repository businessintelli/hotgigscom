import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { 
  Loader2, 
  Calendar, 
  Clock, 
  User, 
  Briefcase, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Mail,
  CalendarDays
} from "lucide-react";
import { toast } from "sonner";

export default function RescheduleRequests() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [responseAction, setResponseAction] = useState<"approve" | "reject" | "propose">("approve");
  const [proposedDate, setProposedDate] = useState("");
  const [responseNotes, setResponseNotes] = useState("");

  // Fetch reschedule requests
  const { data: requests, isLoading, refetch } = (trpc as any).reschedule?.getPendingRequests?.useQuery() || { data: [], isLoading: false };

  // Mutations
  const approveMutation = (trpc as any).reschedule?.approveRequest?.useMutation({
    onSuccess: () => {
      toast.success("Reschedule request approved");
      refetch();
      setResponseModalOpen(false);
      setSelectedRequest(null);
    },
    onError: () => {
      toast.error("Failed to approve request");
    },
  });

  const rejectMutation = (trpc as any).reschedule?.rejectRequest?.useMutation({
    onSuccess: () => {
      toast.success("Reschedule request rejected");
      refetch();
      setResponseModalOpen(false);
      setSelectedRequest(null);
    },
    onError: () => {
      toast.error("Failed to reject request");
    },
  });

  const proposeMutation = (trpc as any).reschedule?.proposeAlternative?.useMutation({
    onSuccess: () => {
      toast.success("Alternative time proposed");
      refetch();
      setResponseModalOpen(false);
      setSelectedRequest(null);
    },
    onError: () => {
      toast.error("Failed to propose alternative");
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  const filteredRequests = requests?.filter((req: any) => {
    if (statusFilter === "all") return true;
    return req.status === statusFilter;
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case "alternative_proposed":
        return <Badge className="bg-blue-100 text-blue-800">Alternative Proposed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const handleResponse = (request: any, action: "approve" | "reject" | "propose") => {
    setSelectedRequest(request);
    setResponseAction(action);
    setProposedDate("");
    setResponseNotes("");
    setResponseModalOpen(true);
  };

  const submitResponse = () => {
    if (!selectedRequest) return;

    if (responseAction === "approve") {
      approveMutation.mutate({
        requestId: selectedRequest.id,
        notes: responseNotes,
      });
    } else if (responseAction === "reject") {
      rejectMutation.mutate({
        requestId: selectedRequest.id,
        notes: responseNotes,
      });
    } else if (responseAction === "propose") {
      if (!proposedDate) {
        toast.error("Please select a proposed date and time");
        return;
      }
      proposeMutation.mutate({
        requestId: selectedRequest.id,
        proposedDate,
        notes: responseNotes,
      });
    }
  };

  const stats = {
    total: requests?.length || 0,
    pending: requests?.filter((r: any) => r.status === "pending").length || 0,
    approved: requests?.filter((r: any) => r.status === "approved").length || 0,
    rejected: requests?.filter((r: any) => r.status === "rejected").length || 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setLocation("/recruiter/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Reschedule Requests</h1>
                <p className="text-sm text-gray-600">Manage interview reschedule requests from panelists</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter("all")}>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-600">Total Requests</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter("pending")}>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-xs text-gray-600">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter("approved")}>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                <p className="text-xs text-gray-600">Approved</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter("rejected")}>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                <p className="text-xs text-gray-600">Rejected</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="alternative_proposed">Alternative Proposed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Requests List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No reschedule requests found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request: any) => (
              <Card key={request.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        <h3 className="font-semibold text-lg">Reschedule Request</h3>
                        {getStatusBadge(request.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">Panelist:</span>
                          <span className="font-medium">{request.panelistName || "Unknown"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">Email:</span>
                          <span className="font-medium">{request.panelistEmail || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">Position:</span>
                          <span className="font-medium">{request.jobTitle || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">Candidate:</span>
                          <span className="font-medium">{request.candidateName || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">Original Date:</span>
                          <span className="font-medium">
                            {request.originalDate 
                              ? new Date(request.originalDate).toLocaleString()
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">Requested:</span>
                          <span className="font-medium">
                            {request.createdAt 
                              ? new Date(request.createdAt).toLocaleString()
                              : "N/A"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <p className="text-sm font-medium text-orange-800 mb-1">Reason for Rescheduling:</p>
                        <p className="text-sm text-orange-700">{request.reason}</p>
                      </div>

                      {request.preferredDates && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">Preferred Alternative Times:</p>
                          <div className="flex flex-wrap gap-2">
                            {JSON.parse(request.preferredDates).map((date: string, index: number) => (
                              <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                {new Date(date).toLocaleString()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {request.status === "pending" && (
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleResponse(request, "approve")}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                          onClick={() => handleResponse(request, "propose")}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Propose Time
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => handleResponse(request, "reject")}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Response Modal */}
      <Dialog open={responseModalOpen} onOpenChange={setResponseModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {responseAction === "approve" && "Approve Reschedule Request"}
              {responseAction === "reject" && "Reject Reschedule Request"}
              {responseAction === "propose" && "Propose Alternative Time"}
            </DialogTitle>
            <DialogDescription>
              {responseAction === "approve" && "Confirm approval of this reschedule request. The interview will need to be rescheduled."}
              {responseAction === "reject" && "Provide a reason for rejecting this reschedule request."}
              {responseAction === "propose" && "Suggest an alternative date and time for the interview."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {responseAction === "propose" && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Proposed Date & Time
                </label>
                <Input
                  type="datetime-local"
                  value={proposedDate}
                  onChange={(e) => setProposedDate(e.target.value)}
                  className="w-full"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Notes (optional)
              </label>
              <Textarea
                placeholder={
                  responseAction === "approve" 
                    ? "Add any notes about the approval..."
                    : responseAction === "reject"
                    ? "Explain why the request is being rejected..."
                    : "Add any notes about the proposed time..."
                }
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResponseModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitResponse}
              disabled={approveMutation.isPending || rejectMutation.isPending || proposeMutation.isPending}
              className={
                responseAction === "approve" 
                  ? "bg-green-600 hover:bg-green-700"
                  : responseAction === "reject"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }
            >
              {(approveMutation.isPending || rejectMutation.isPending || proposeMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {responseAction === "approve" && "Approve Request"}
              {responseAction === "reject" && "Reject Request"}
              {responseAction === "propose" && "Propose Time"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
