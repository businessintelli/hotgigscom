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

  const utils = trpc.useUtils();

  // Save job mutation with optimistic update
  const saveJobMutation = trpc.candidate.saveJob.useMutation({
    onMutate: async () => {
      // Cancel outgoing refetches
      await utils.candidate.isJobSaved.cancel({ candidateId: candidateId || 0, jobId });
      
      // Snapshot the previous value
      const previousStatus = utils.candidate.isJobSaved.getData({ candidateId: candidateId || 0, jobId });
      
      // Optimistically update to saved
      setIsSaved(true);
      utils.candidate.isJobSaved.setData({ candidateId: candidateId || 0, jobId }, true);
      
      // Invalidate saved jobs list to refresh
      utils.candidate.getSavedJobs.invalidate();
      utils.candidate.getSavedJobsPaginated.invalidate();
      
      return { previousStatus };
    },
    onSuccess: () => {
      toast.success("Job saved to your bookmarks");
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousStatus !== undefined) {
        setIsSaved(context.previousStatus);
        utils.candidate.isJobSaved.setData({ candidateId: candidateId || 0, jobId }, context.previousStatus);
      }
      
      if (error.message.includes("Duplicate")) {
        toast.info("Job is already saved");
      } else {
        toast.error("Failed to save job");
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      utils.candidate.isJobSaved.invalidate({ candidateId: candidateId || 0, jobId });
    },
  });

  // Unsave job mutation with optimistic update
  const unsaveJobMutation = trpc.candidate.unsaveJob.useMutation({
    onMutate: async () => {
      // Cancel outgoing refetches
      await utils.candidate.isJobSaved.cancel({ candidateId: candidateId || 0, jobId });
      
      // Snapshot the previous value
      const previousStatus = utils.candidate.isJobSaved.getData({ candidateId: candidateId || 0, jobId });
      
      // Optimistically update to unsaved
      setIsSaved(false);
      utils.candidate.isJobSaved.setData({ candidateId: candidateId || 0, jobId }, false);
      
      // Invalidate saved jobs list to refresh
      utils.candidate.getSavedJobs.invalidate();
      utils.candidate.getSavedJobsPaginated.invalidate();
      
      return { previousStatus };
    },
    onSuccess: () => {
      toast.success("Job removed from bookmarks");
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousStatus !== undefined) {
        setIsSaved(context.previousStatus);
        utils.candidate.isJobSaved.setData({ candidateId: candidateId || 0, jobId }, context.previousStatus);
      }
      toast.error("Failed to remove job");
    },
    onSettled: () => {
      // Refetch to ensure consistency
      utils.candidate.isJobSaved.invalidate({ candidateId: candidateId || 0, jobId });
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
