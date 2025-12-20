import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Loader2, CheckCircle, Clock, AlertCircle, FileText, 
  Video, Settings, Users, Upload, ChevronDown, ChevronUp 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const taskTypeIcons = {
  'document-upload': FileText,
  'form-completion': FileText,
  'training-video': Video,
  'system-setup': Settings,
  'meeting': Users,
  'other': FileText,
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export default function OnboardingChecklist() {
  const params = useParams();
  const { toast } = useToast();
  const candidateId = params.candidateId ? parseInt(params.candidateId) : null;

  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [completionNotes, setCompletionNotes] = useState<Record<number, string>>({});

  const { data: checklistData, isLoading, refetch } = trpc.selectionOnboarding.getOnboardingChecklist.useQuery(
    { candidateId: candidateId! },
    { enabled: !!candidateId }
  );

  const updateItemMutation = trpc.selectionOnboarding.updateChecklistItem.useMutation({
    onSuccess: () => {
      refetch();
      toast({
        title: "Task Updated",
        description: "Your progress has been saved.",
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

  const updateProgressMutation = trpc.selectionOnboarding.updateChecklistProgress.useMutation({
    onSuccess: (data) => {
      refetch();
      if (data.status === 'completed') {
        toast({
          title: "Congratulations!",
          description: "You've completed all onboarding tasks!",
        });
      }
    },
  });

  const checklist = checklistData?.checklist;
  const items = checklistData?.items || [];

  const toggleExpanded = (itemId: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleToggleComplete = async (itemId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    
    await updateItemMutation.mutateAsync({
      itemId,
      status: newStatus,
      completionNotes: completionNotes[itemId],
    });

    if (checklist) {
      await updateProgressMutation.mutateAsync({
        checklistId: checklist.id,
      });
    }
  };

  const handleUpdateStatus = async (itemId: number, status: 'pending' | 'in-progress' | 'completed' | 'blocked' | 'skipped') => {
    await updateItemMutation.mutateAsync({
      itemId,
      status,
      completionNotes: completionNotes[itemId],
    });

    if (checklist) {
      await updateProgressMutation.mutateAsync({
        checklistId: checklist.id,
      });
    }
  };

  if (!candidateId) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Invalid Request</CardTitle>
            <CardDescription>No candidate ID provided.</CardDescription>
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

  if (!checklist) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>No Onboarding Checklist</CardTitle>
            <CardDescription>
              You don't have an active onboarding checklist yet. It will be created once you're selected for a position.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const pendingTasks = items.filter(item => item.status === 'pending' || item.status === 'in-progress');
  const completedTasks = items.filter(item => item.status === 'completed');

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header Card */}
        <Card>
          <CardHeader>
            <CardTitle>Onboarding Checklist</CardTitle>
            <CardDescription>
              Complete these tasks to finish your onboarding process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-semibold">
                  {checklist.completedTasks} / {checklist.totalTasks} tasks completed
                </span>
              </div>
              <Progress value={checklist.progressPercentage} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {checklist.progressPercentage}% complete
              </p>
            </div>

            {/* Status and Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={checklist.status === 'completed' ? 'default' : 'secondary'}>
                  {checklist.status}
                </Badge>
              </div>
              {checklist.startDate && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="text-sm font-medium">
                    {format(new Date(checklist.startDate), 'MMM dd, yyyy')}
                  </p>
                </div>
              )}
              {checklist.targetCompletionDate && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Target Completion</p>
                  <p className="text-sm font-medium">
                    {format(new Date(checklist.targetCompletionDate), 'MMM dd, yyyy')}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        {pendingTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Tasks ({pendingTasks.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingTasks.map((item) => {
                const Icon = taskTypeIcons[item.taskType];
                const isExpanded = expandedItems.has(item.id);

                return (
                  <div key={item.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={item.status === 'completed'}
                        onCheckedChange={() => handleToggleComplete(item.id, item.status)}
                        className="mt-1"
                      />
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <h4 className="font-medium">{item.title}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={priorityColors[item.priority]} variant="secondary">
                              {item.priority}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpanded(item.id)}
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>

                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {item.category && (
                            <span className="flex items-center gap-1">
                              <span className="font-medium">Category:</span> {item.category}
                            </span>
                          )}
                          {item.dueDate && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Due: {format(new Date(item.dueDate), 'MMM dd')}
                            </span>
                          )}
                          {item.estimatedDuration && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              ~{item.estimatedDuration} min
                            </span>
                          )}
                        </div>

                        {isExpanded && (
                          <div className="pt-3 border-t space-y-3">
                            {/* Status Update */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Status</label>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant={item.status === 'in-progress' ? 'default' : 'outline'}
                                  onClick={() => handleUpdateStatus(item.id, 'in-progress')}
                                  disabled={updateItemMutation.isPending}
                                >
                                  In Progress
                                </Button>
                                <Button
                                  size="sm"
                                  variant={item.status === 'completed' ? 'default' : 'outline'}
                                  onClick={() => handleUpdateStatus(item.id, 'completed')}
                                  disabled={updateItemMutation.isPending}
                                >
                                  Completed
                                </Button>
                                <Button
                                  size="sm"
                                  variant={item.status === 'blocked' ? 'default' : 'outline'}
                                  onClick={() => handleUpdateStatus(item.id, 'blocked')}
                                  disabled={updateItemMutation.isPending}
                                >
                                  Blocked
                                </Button>
                              </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Notes</label>
                              <Textarea
                                value={completionNotes[item.id] || ''}
                                onChange={(e) => setCompletionNotes(prev => ({
                                  ...prev,
                                  [item.id]: e.target.value
                                }))}
                                placeholder="Add any notes or comments..."
                                rows={3}
                              />
                            </div>

                            {/* Document Upload (if applicable) */}
                            {item.taskType === 'document-upload' && (
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Upload Document</label>
                                <Input type="file" />
                                <p className="text-xs text-muted-foreground">
                                  Upload required documents for this task
                                </p>
                              </div>
                            )}

                            {item.instructionsUrl && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={item.instructionsUrl} target="_blank" rel="noopener noreferrer">
                                  View Instructions
                                </a>
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Completed Tasks ({completedTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {completedTasks.map((item) => {
                const Icon = taskTypeIcons[item.taskType];

                return (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium line-through text-muted-foreground">
                        {item.title}
                      </p>
                      {item.completedAt && (
                        <p className="text-xs text-muted-foreground">
                          Completed on {format(new Date(item.completedAt), 'MMM dd, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Completion Message */}
        {checklist.status === 'completed' && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900">Onboarding Complete!</h3>
                  <p className="text-sm text-green-700">
                    Congratulations! You've completed all onboarding tasks. Welcome to the team!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
