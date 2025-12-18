import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Mail, User, ArrowRight } from "lucide-react";
import { Loader2 } from "lucide-react";

interface ApplicationTimelineProps {
  applicationId: number;
}

export function ApplicationTimeline({ applicationId }: ApplicationTimelineProps) {
  const { data: history = [], isLoading } = trpc.application.getApplicationHistory.useQuery({
    applicationId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Application Timeline</CardTitle>
          <CardDescription>Loading history...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Application Timeline</CardTitle>
          <CardDescription>No history available</CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center text-gray-500">
          <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No status changes recorded yet</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      submitted: "bg-blue-100 text-blue-800",
      reviewing: "bg-yellow-100 text-yellow-800",
      shortlisted: "bg-purple-100 text-purple-800",
      interviewing: "bg-indigo-100 text-indigo-800",
      offered: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      withdrawn: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      submitted: "Submitted",
      reviewing: "Under Review",
      shortlisted: "Shortlisted",
      interviewing: "Interview Stage",
      offered: "Offer Extended",
      rejected: "Not Selected",
      withdrawn: "Withdrawn",
    };
    return labels[status] || status;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Application Timeline
        </CardTitle>
        <CardDescription>
          Track all status changes and updates for this application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

          {/* Timeline items */}
          <div className="space-y-6">
            {history.map((item, index) => (
              <div key={item.id} className="relative flex gap-4">
                {/* Timeline dot */}
                <div className="relative z-10 flex items-center justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border-2 border-gray-200">
                    <CheckCircle2 className="h-6 w-6 text-blue-600" />
                  </div>
                </div>

                {/* Timeline content */}
                <div className="flex-1 pb-6">
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    {/* Status change */}
                    <div className="flex items-center gap-2 mb-2">
                      {item.fromStatus && (
                        <>
                          <Badge className={getStatusColor(item.fromStatus)}>
                            {getStatusLabel(item.fromStatus)}
                          </Badge>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        </>
                      )}
                      <Badge className={getStatusColor(item.toStatus)}>
                        {getStatusLabel(item.toStatus)}
                      </Badge>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {new Date(item.createdAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {item.changedByName && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>by {item.changedByName}</span>
                        </div>
                      )}

                      {item.emailSent && (
                        <div className="flex items-center gap-1 text-green-600">
                          <Mail className="h-4 w-4" />
                          <span>Email sent</span>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {item.notes && (
                      <div className="mt-2 text-sm text-gray-700 bg-gray-50 rounded p-2">
                        <span className="font-medium">Note:</span> {item.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
