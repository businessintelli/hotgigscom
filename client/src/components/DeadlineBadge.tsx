import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle } from "lucide-react";

interface DeadlineBadgeProps {
  deadline: Date | string | null | undefined;
  className?: string;
}

export function DeadlineBadge({ deadline, className }: DeadlineBadgeProps) {
  if (!deadline) return null;

  const deadlineDate = typeof deadline === "string" ? new Date(deadline) : deadline;
  const now = new Date();
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Don't show if deadline has passed
  if (diffDays < 0) {
    return (
      <Badge variant="destructive" className={className}>
        <AlertCircle className="w-3 h-3 mr-1" />
        Expired
      </Badge>
    );
  }

  // Color coding based on urgency
  let variant: "default" | "destructive" | "secondary" = "default";
  let bgColor = "";
  let textColor = "";
  
  if (diffDays < 3) {
    // Red for urgent (less than 3 days)
    variant = "destructive";
    bgColor = "bg-red-100";
    textColor = "text-red-700";
  } else if (diffDays <= 7) {
    // Yellow for moderate urgency (3-7 days)
    variant = "secondary";
    bgColor = "bg-yellow-100";
    textColor = "text-yellow-700";
  } else {
    // Green for plenty of time (more than 7 days)
    bgColor = "bg-green-100";
    textColor = "text-green-700";
  }

  const displayText = diffDays === 0 
    ? "Today" 
    : diffDays === 1 
    ? "1 day left" 
    : `${diffDays} days left`;

  return (
    <Badge 
      variant={variant} 
      className={`${bgColor} ${textColor} border-0 ${className}`}
    >
      <Clock className="w-3 h-3 mr-1" />
      {displayText}
    </Badge>
  );
}
