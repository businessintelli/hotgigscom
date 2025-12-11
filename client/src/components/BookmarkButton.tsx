import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface BookmarkButtonProps {
  jobId: number;
  candidateId: number | undefined;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  showText?: boolean;
}

export function BookmarkButton({
  jobId,
  candidateId,
  variant = "ghost",
  size = "icon",
  showText = false,
}: BookmarkButtonProps) {
  const [isSaved, setIsSaved] = useState(false);

  // Check if job is saved
  const { data: savedStatus, refetch } = trpc.candidate.isJobSaved.useQuery(
    { candidateId: candidateId || 0, jobId },
    { enabled: !!candidateId }
  );

  useEffect(() => {
    if (savedStatus !== undefined) {
      setIsSaved(savedStatus);
    }
  }, [savedStatus]);

  // Save job mutation
  const saveJobMutation = trpc.candidate.saveJob.useMutation({
    onSuccess: () => {
      setIsSaved(true);
      toast.success("Job saved to your bookmarks");
      refetch();
    },
    onError: (error) => {
      if (error.message.includes("Duplicate")) {
        toast.info("Job is already saved");
      } else {
        toast.error("Failed to save job");
      }
    },
  });

  // Unsave job mutation
  const unsaveJobMutation = trpc.candidate.unsaveJob.useMutation({
    onSuccess: () => {
      setIsSaved(false);
      toast.success("Job removed from bookmarks");
      refetch();
    },
    onError: () => {
      toast.error("Failed to remove job");
    },
  });

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click events
    
    if (!candidateId) {
      toast.error("Please sign in to bookmark jobs");
      return;
    }

    if (isSaved) {
      unsaveJobMutation.mutate({ candidateId, jobId });
    } else {
      saveJobMutation.mutate({ candidateId, jobId });
    }
  };

  const isPending = saveJobMutation.isPending || unsaveJobMutation.isPending;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      disabled={isPending || !candidateId}
      className={isSaved ? "text-primary" : ""}
    >
      <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
      {showText && <span className="ml-2">{isSaved ? "Saved" : "Save"}</span>}
    </Button>
  );
}
