import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, Trash2, ArrowRight, Play, Users, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface SequenceStep {
  stepNumber: number;
  delayDays: number;
  subject: string;
  body: string;
  condition?: string;
  templateId?: number;
}

export default function FollowUpSequenceBuilder() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // UI state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState<any>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<SequenceStep[]>([
    {
      stepNumber: 1,
      delayDays: 0,
      subject: "",
      body: "",
      condition: "always",
    },
  ]);

  // Fetch sequences
  const { data: sequences, refetch } = trpc.emailCampaigns.getSequences.useQuery();

  // Mutations
  const createSequenceMutation = trpc.emailCampaigns.createSequence.useMutation({
    onSuccess: () => {
      refetch();
      setCreateDialogOpen(false);
      resetForm();
      toast.success("Sequence created successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to create sequence: ${error.message}`);
    },
  });

  const enrollCandidatesMutation = trpc.emailCampaigns.enrollCandidates.useMutation({
    onSuccess: (data) => {
      refetch();
      setEnrollDialogOpen(false);
      toast.success(`${data.count} candidates enrolled in sequence!`);
    },
    onError: (error) => {
      toast.error(`Failed to enroll candidates: ${error.message}`);
    },
  });

  // Reset form
  const resetForm = () => {
    setName("");
    setDescription("");
    setSteps([
      {
        stepNumber: 1,
        delayDays: 0,
        subject: "",
        body: "",
        condition: "always",
      },
    ]);
  };

  // Add step
  const addStep = () => {
    setSteps([
      ...steps,
      {
        stepNumber: steps.length + 1,
        delayDays: 3,
        subject: "",
        body: "",
        condition: "no_response",
      },
    ]);
  };

  // Remove step
  const removeStep = (index: number) => {
    if (steps.length === 1) {
      toast.error("Sequence must have at least one step");
      return;
    }
    const newSteps = steps.filter((_, i) => i !== index);
    // Renumber steps
    newSteps.forEach((step, i) => {
      step.stepNumber = i + 1;
    });
    setSteps(newSteps);
  };

  // Update step
  const updateStep = (index: number, field: keyof SequenceStep, value: any) => {
    const newSteps = [...steps];
    (newSteps[index] as any)[field] = value;
    setSteps(newSteps);
  };

  // Handle create
  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("Please enter a sequence name");
      return;
    }

    // Validate steps
    for (const step of steps) {
      if (!step.subject.trim() || !step.body.trim()) {
        toast.error(`Step ${step.stepNumber}: Please fill in subject and body`);
        return;
      }
    }

    createSequenceMutation.mutate({
      name,
      description,
      steps,
    });
  };

  // Handle enroll
  const handleEnroll = (sequence: any) => {
    setSelectedSequence(sequence);
    setEnrollDialogOpen(true);
  };

  if (!user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ArrowRight className="w-6 h-6" />
              Follow-Up Sequences
            </h1>
            <p className="text-sm text-gray-600">Automate multi-step email campaigns</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setLocation("/recruiter/campaigns")}>
              Campaigns
            </Button>
            <Button variant="outline" onClick={() => setLocation("/recruiter/dashboard")}>
              Dashboard
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Sequence
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Sequences Grid */}
        {sequences && sequences.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {sequences.map((sequence: any) => (
              <Card key={sequence.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{sequence.name}</CardTitle>
                      {sequence.description && (
                        <CardDescription className="mt-1">{sequence.description}</CardDescription>
                      )}
                      <Badge variant={sequence.isActive ? "default" : "secondary"} className="mt-2">
                        {sequence.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Steps Timeline */}
                    <div className="space-y-3">
                      {sequence.steps?.map((step: any, index: number) => (
                        <div key={step.id} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                              {step.stepNumber}
                            </div>
                            {index < sequence.steps.length - 1 && (
                              <div className="w-0.5 h-12 bg-blue-300 my-1"></div>
                            )}
                          </div>
                          <div className="flex-1 pt-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                {step.delayDays === 0
                                  ? "Immediately"
                                  : `${step.delayDays} day${step.delayDays > 1 ? "s" : ""} after previous step`}
                              </span>
                              {step.condition && step.condition !== "always" && (
                                <Badge variant="outline" className="text-xs">
                                  {step.condition.replace("_", " ")}
                                </Badge>
                              )}
                            </div>
                            <p className="font-medium text-gray-900">{step.subject}</p>
                            <p className="text-sm text-gray-600 line-clamp-2 mt-1">{step.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button size="sm" onClick={() => handleEnroll(sequence)}>
                        <Users className="w-4 h-4 mr-1" />
                        Enroll Candidates
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <ArrowRight className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No sequences yet</p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Sequence
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Sequence Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Follow-Up Sequence</DialogTitle>
            <DialogDescription>
              Build an automated multi-step email sequence
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Sequence Name *</Label>
                <Input
                  placeholder="e.g., Developer Outreach Sequence"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  placeholder="Brief description of the sequence"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Email Steps</Label>
                <Button size="sm" onClick={addStep}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Step
                </Button>
              </div>

              {steps.map((step, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Step {step.stepNumber}</CardTitle>
                      {steps.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeStep(index)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label>Delay (days)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={step.delayDays}
                          onChange={(e) => updateStep(index, "delayDays", parseInt(e.target.value))}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {index === 0 ? "0 = send immediately" : "Days after previous step"}
                        </p>
                      </div>
                      <div>
                        <Label>Condition</Label>
                        <Select
                          value={step.condition}
                          onValueChange={(value) => updateStep(index, "condition", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="always">Always send</SelectItem>
                            <SelectItem value="no_response">No response to previous</SelectItem>
                            <SelectItem value="not_opened">Previous not opened</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Subject Line *</Label>
                      <Input
                        placeholder="Email subject"
                        value={step.subject}
                        onChange={(e) => updateStep(index, "subject", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Email Body *</Label>
                      <Textarea
                        placeholder="Email body with variables like {{name}}, {{title}}, etc."
                        value={step.body}
                        onChange={(e) => updateStep(index, "body", e.target.value)}
                        rows={4}
                        className="font-mono text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createSequenceMutation.isPending}>
              {createSequenceMutation.isPending ? "Creating..." : "Create Sequence"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enroll Candidates Dialog */}
      <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enroll Candidates</DialogTitle>
            <DialogDescription>
              Select candidates from advanced search to enroll in "{selectedSequence?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-gray-600">
              Use the Advanced Search page to find and select candidates, then enroll them in this sequence.
            </p>
            <Button onClick={() => {
              setEnrollDialogOpen(false);
              setLocation("/recruiter/advanced-search");
            }}>
              Go to Advanced Search
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnrollDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
