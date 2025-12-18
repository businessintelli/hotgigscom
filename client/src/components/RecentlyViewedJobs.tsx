import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, DollarSign, Clock, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { BookmarkButton } from "./BookmarkButton";

interface RecentlyViewedJobsProps {
  candidateId: number;
  limit?: number;
}

export function RecentlyViewedJobs({ candidateId, limit = 10 }: RecentlyViewedJobsProps) {
  const [, setLocation] = useLocation();
  
  const { data: recentlyViewed, isLoading } = trpc.candidate.getRecentlyViewedJobs.useQuery({
    candidateId,
    limit,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recently Viewed Jobs</CardTitle>
          <CardDescription>Jobs you've recently browsed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recentlyViewed || recentlyViewed.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recently Viewed Jobs</CardTitle>
          <CardDescription>Jobs you've recently browsed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">No recently viewed jobs</p>
            <Button onClick={() => setLocation("/job-browser")}>
              Browse Jobs
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Recently Viewed Jobs</CardTitle>
            <CardDescription>Jobs you've recently browsed</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setLocation("/job-browser")}>
            View All Jobs
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentlyViewed.map(({ viewRecord, job }) => {
            if (!job) return null;
            
            return (
              <div
                key={viewRecord.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setLocation(`/job/${job.id}`)}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{job.title}</h3>
                        <p className="text-gray-600">{job.company}</p>
                      </div>
                      <Badge
                        variant={job.status === "active" ? "default" : "secondary"}
                        className="ml-2"
                      >
                        {job.status}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                      {job.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{job.location}</span>
                        </div>
                      )}
                      {job.salaryRange && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span>{job.salaryRange}</span>
                        </div>
                      )}
                      {job.employmentType && (
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          <span>{job.employmentType}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>
                        Viewed {new Date(viewRecord.viewedAt).toLocaleDateString()} at{" "}
                        {new Date(viewRecord.viewedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <div onClick={(e) => e.stopPropagation()}>
                    <BookmarkButton
                      jobId={job.id}
                      candidateId={candidateId}
                      variant="outline"
                      size="icon"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {recentlyViewed.length >= limit && (
          <div className="mt-4 text-center">
            <Button variant="outline" onClick={() => setLocation("/job-browser")}>
              Browse More Jobs
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
