import { useRoute } from "wouter";
import { GuestApplicationWizard } from "@/components/GuestApplicationWizard";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

export default function GuestJobApplication() {
  const [, params] = useRoute("/apply/:id");
  const jobId = parseInt(params?.id || "0");

  const { data: job, isLoading } = trpc.job.getById.useQuery(
    { id: jobId },
    { enabled: !!jobId }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Job Not Found</h2>
          <p className="text-gray-600">The job you're trying to apply for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container max-w-4xl py-6">
          <h1 className="text-2xl font-bold mb-2">Apply for {job.title}</h1>
          {job.companyName && (
            <p className="text-gray-600">{job.companyName}</p>
          )}
        </div>
      </div>

      <GuestApplicationWizard
        jobId={job.id}
        jobTitle={job.title}
        companyName={job.companyName || undefined}
      />
    </div>
  );
}
