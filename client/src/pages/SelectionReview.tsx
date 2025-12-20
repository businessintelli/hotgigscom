import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, CheckCircle, XCircle, Clock, AlertTriangle, 
  TrendingUp, TrendingDown, Minus, Send 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SelectionReview() {
  const params = useParams();
  const { toast } = useToast();
  const jobId = params.jobId ? parseInt(params.jobId) : null;

  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
  const [decision, setDecision] = useState<'selected' | 'rejected' | 'pending-review' | 'waitlisted'>('pending-review');
  const [reason, setReason] = useState("");
  const [rejectionCategory, setRejectionCategory] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const { data: selections, isLoading, refetch } = trpc.selectionOnboarding.getSelectionsByJob.useQuery(
    { jobId: jobId! },
    { enabled: !!jobId }
  );

  const { data: analysisData } = trpc.botInterview.getAnalysis.useQuery(
    { sessionId: selectedApplicationId! },
    { enabled: !!selectedApplicationId }
  );

  const makeDecisionMutation = trpc.selectionOnboarding.makeDecision.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedApplicationId(null);
      setReason("");
      setRejectionCategory("");
      setInternalNotes("");
      toast({
        title: "Decision Recorded",
        description: "The selection decision has been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const notifyCandidateMutation = trpc.selectionOnboarding.notifyCandidate.useMutation({
    onSuccess: () => {
      refetch();
      toast({
        title: "Notification Sent",
        description: "The candidate has been notified of the decision.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleMakeDecision = async (applicationId: number, candidateId: number) => {
    if (!jobId) return;

    await makeDecisionMutation.mutateAsync({
      applicationId,
      candidateId,
      jobId,
      decision,
      decisionType: 'manual',
      selectionReason: decision === 'selected' ? reason : undefined,
      rejectionReason: decision === 'rejected' ? reason : undefined,
      rejectionCategory: decision === 'rejected' ? rejectionCategory : undefined,
      internalNotes,
    });
  };

  if (!jobId) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Invalid Job</CardTitle>
            <CardDescription>No job ID provided.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const selectedCandidates = selections?.filter(s => s.decision === 'selected') || [];
  const rejectedCandidates = selections?.filter(s => s.decision === 'rejected') || [];
  const pendingCandidates = selections?.filter(s => s.decision === 'pending-review') || [];
  const waitlistedCandidates = selections?.filter(s => s.decision === 'waitlisted') || [];

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Selection Review</h1>
          <p className="text-muted-foreground">Review and make decisions on candidate applications</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Selected</p>
                  <p className="text-2xl font-bold">{selectedCandidates.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold">{rejectedCandidates.length}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{pendingCandidates.length}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Waitlisted</p>
                  <p className="text-2xl font-bold">{waitlistedCandidates.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different statuses */}
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pending Review ({pendingCandidates.length})</TabsTrigger>
            <TabsTrigger value="selected">Selected ({selectedCandidates.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejectedCandidates.length})</TabsTrigger>
            <TabsTrigger value="waitlisted">Waitlisted ({waitlistedCandidates.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingCandidates.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No pending candidates to review
                </CardContent>
              </Card>
            ) : (
              pendingCandidates.map((selection) => (
                <Card key={selection.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>
                          {selection.candidate?.firstName} {selection.candidate?.lastName}
                        </CardTitle>
                        <CardDescription>{selection.candidate?.title}</CardDescription>
                      </div>
                      <Badge variant="secondary">{selection.decision}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Candidate Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <p className="font-medium">{selection.candidate?.userId}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Location:</span>
                        <p className="font-medium">{selection.candidate?.location}</p>
                      </div>
                    </div>

                    {/* Decision Form */}
                    <div className="border-t pt-4 space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Decision</label>
                        <Select value={decision} onValueChange={(value: any) => setDecision(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="selected">Select Candidate</SelectItem>
                            <SelectItem value="rejected">Reject Candidate</SelectItem>
                            <SelectItem value="waitlisted">Add to Waitlist</SelectItem>
                            <SelectItem value="pending-review">Keep Pending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {decision === 'rejected' && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Rejection Category</label>
                          <Select value={rejectionCategory} onValueChange={setRejectionCategory}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="skills-mismatch">Skills Mismatch</SelectItem>
                              <SelectItem value="experience-insufficient">Insufficient Experience</SelectItem>
                              <SelectItem value="cultural-fit">Cultural Fit</SelectItem>
                              <SelectItem value="communication">Communication Issues</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          {decision === 'selected' ? 'Selection Reason' : 'Rejection Reason'}
                        </label>
                        <Textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Provide a reason for your decision..."
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Internal Notes</label>
                        <Textarea
                          value={internalNotes}
                          onChange={(e) => setInternalNotes(e.target.value)}
                          placeholder="Add any internal notes (not visible to candidate)..."
                          rows={2}
                        />
                      </div>

                      <Button
                        onClick={() => handleMakeDecision(selection.applicationId, selection.candidateId)}
                        disabled={makeDecisionMutation.isPending}
                        className="w-full"
                      >
                        {makeDecisionMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Submit Decision"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="selected" className="space-y-4">
            {selectedCandidates.map((selection) => (
              <Card key={selection.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>
                        {selection.candidate?.firstName} {selection.candidate?.lastName}
                      </CardTitle>
                      <CardDescription>{selection.candidate?.title}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Selected</Badge>
                      {selection.candidateNotified && (
                        <Badge variant="outline">Notified</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selection.selectionReason && (
                    <div>
                      <p className="text-sm font-medium">Selection Reason:</p>
                      <p className="text-sm text-muted-foreground">{selection.selectionReason}</p>
                    </div>
                  )}

                  {!selection.candidateNotified && (
                    <Button
                      onClick={() => notifyCandidateMutation.mutate({ selectionId: selection.id })}
                      disabled={notifyCandidateMutation.isPending}
                      variant="outline"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Send Notification
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {rejectedCandidates.map((selection) => (
              <Card key={selection.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>
                        {selection.candidate?.firstName} {selection.candidate?.lastName}
                      </CardTitle>
                      <CardDescription>{selection.candidate?.title}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Rejected</Badge>
                      {selection.candidateNotified && (
                        <Badge variant="outline">Notified</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selection.rejectionCategory && (
                    <div>
                      <p className="text-sm font-medium">Category:</p>
                      <Badge variant="outline">{selection.rejectionCategory}</Badge>
                    </div>
                  )}

                  {selection.rejectionReason && (
                    <div>
                      <p className="text-sm font-medium">Reason:</p>
                      <p className="text-sm text-muted-foreground">{selection.rejectionReason}</p>
                    </div>
                  )}

                  {!selection.candidateNotified && (
                    <Button
                      onClick={() => notifyCandidateMutation.mutate({ selectionId: selection.id })}
                      disabled={notifyCandidateMutation.isPending}
                      variant="outline"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Send Notification
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="waitlisted" className="space-y-4">
            {waitlistedCandidates.map((selection) => (
              <Card key={selection.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>
                        {selection.candidate?.firstName} {selection.candidate?.lastName}
                      </CardTitle>
                      <CardDescription>{selection.candidate?.title}</CardDescription>
                    </div>
                    <Badge variant="secondary">Waitlisted</Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
