import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Users, 
  UserPlus, 
  Check, 
  X, 
  Clock, 
  UserCheck,
  Trash2,
  Mail,
  MessageSquare
} from "lucide-react";
import InvitePanelistDialog from "./InvitePanelistDialog";

interface InterviewPanelSectionProps {
  interviewId: number;
  canManage?: boolean;
}

const statusConfig = {
  invited: { label: "Invited", color: "bg-blue-100 text-blue-700", icon: Clock },
  accepted: { label: "Accepted", color: "bg-green-100 text-green-700", icon: Check },
  declined: { label: "Declined", color: "bg-red-100 text-red-700", icon: X },
  attended: { label: "Attended", color: "bg-purple-100 text-purple-700", icon: UserCheck },
};

export default function InterviewPanelSection({
  interviewId,
  canManage = true,
}: InterviewPanelSectionProps) {
  const utils = trpc.useUtils();
  
  const { data: panelists, isLoading } = trpc.interview.getPanelists.useQuery({ interviewId });
  
  const removeMutation = trpc.interview.removePanelist.useMutation({
    onSuccess: () => {
      toast.success("Panel member removed");
      utils.interview.getPanelists.invalidate({ interviewId });
    },
    onError: () => {
      toast.error("Failed to remove panel member");
    },
  });

  const updateStatusMutation = trpc.interview.updatePanelistStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated");
      utils.interview.getPanelists.invalidate({ interviewId });
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Interview Panel
          </CardTitle>
          <CardDescription>
            {panelists?.length || 0} panel member{panelists?.length !== 1 ? "s" : ""} assigned
          </CardDescription>
        </div>
        {canManage && (
          <InvitePanelistDialog interviewId={interviewId} />
        )}
      </CardHeader>
      <CardContent>
        {!panelists || panelists.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No panel members yet</p>
            <p className="text-sm">Invite interviewers to participate and provide feedback</p>
            {canManage && (
              <InvitePanelistDialog 
                interviewId={interviewId}
                trigger={
                  <Button variant="outline" className="mt-4">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite First Panel Member
                  </Button>
                }
              />
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {panelists.map((panelist) => {
              const status = statusConfig[panelist.status as keyof typeof statusConfig] || statusConfig.invited;
              const StatusIcon = status.icon;
              
              return (
                <div
                  key={panelist.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {(panelist.name || panelist.email)[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {panelist.name || panelist.email.split("@")[0]}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Mail className="h-3 w-3" />
                        {panelist.email}
                        {panelist.role && (
                          <>
                            <span className="text-gray-300">•</span>
                            {panelist.role}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={status.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                    
                    {canManage && (
                      <div className="flex gap-1">
                        {panelist.status === 'invited' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => updateStatusMutation.mutate({
                                panelistId: panelist.id,
                                status: 'accepted',
                              })}
                              title="Mark as accepted"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => updateStatusMutation.mutate({
                                panelistId: panelist.id,
                                status: 'declined',
                              })}
                              title="Mark as declined"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {panelist.status === 'accepted' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            onClick={() => updateStatusMutation.mutate({
                              panelistId: panelist.id,
                              status: 'attended',
                            })}
                            title="Mark as attended"
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => removeMutation.mutate({ panelistId: panelist.id })}
                          title="Remove from panel"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
