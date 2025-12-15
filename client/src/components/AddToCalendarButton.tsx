import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  createInterviewCalendarEvent,
  downloadICS,
  generateGoogleCalendarURL,
  generateOutlookCalendarURL,
  generateYahooCalendarURL,
} from "@/lib/calendarUtils";

interface AddToCalendarButtonProps {
  interview: {
    jobTitle: string;
    companyName: string;
    scheduledAt: Date | string;
    duration: number;
    type: string;
    meetingLink?: string | null;
    location?: string | null;
  };
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function AddToCalendarButton({
  interview,
  variant = "outline",
  size = "sm",
  className,
}: AddToCalendarButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const calendarEvent = createInterviewCalendarEvent(interview);
  
  const handleDownloadICS = () => {
    try {
      downloadICS(calendarEvent);
      toast.success("Calendar file downloaded!");
    } catch (error) {
      toast.error("Failed to download calendar file");
    }
    setIsOpen(false);
  };
  
  const handleGoogleCalendar = () => {
    const url = generateGoogleCalendarURL(calendarEvent);
    window.open(url, '_blank');
    toast.success("Opening Google Calendar...");
    setIsOpen(false);
  };
  
  const handleOutlookCalendar = () => {
    const url = generateOutlookCalendarURL(calendarEvent);
    window.open(url, '_blank');
    toast.success("Opening Outlook Calendar...");
    setIsOpen(false);
  };
  
  const handleYahooCalendar = () => {
    const url = generateYahooCalendarURL(calendarEvent);
    window.open(url, '_blank');
    toast.success("Opening Yahoo Calendar...");
    setIsOpen(false);
  };
  
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Calendar className="h-4 w-4 mr-1" />
          Add to Calendar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleGoogleCalendar} className="cursor-pointer">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google Calendar
            <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleOutlookCalendar} className="cursor-pointer">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.576-.158.152-.352.228-.582.228h-8.547v-6.036l1.387 1.04c.14.093.29.14.453.14.164 0 .313-.047.453-.14l6.836-5.14v-.146c0-.23-.08-.424-.238-.576-.158-.152-.352-.228-.582-.228h-8.547V4.387c0-.23.08-.424.238-.576.158-.152.352-.228.582-.228h8.547c.23 0 .424.076.582.228.158.152.238.346.238.576v3z"/>
              <path fill="#0078D4" d="M14.633 12.633v6.036H.82c-.23 0-.424-.076-.582-.228C.08 18.289 0 18.095 0 17.865V6.387c0-.23.08-.424.238-.576.158-.152.352-.228.582-.228h13.813v7.05z"/>
              <path fill="#28A8EA" d="M14.633 5.583v7.05H.82c-.23 0-.424-.076-.582-.228C.08 12.253 0 12.059 0 11.829V6.387c0-.23.08-.424.238-.576.158-.152.352-.228.582-.228h13.813z"/>
            </svg>
            Outlook
            <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleYahooCalendar} className="cursor-pointer">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#6001D2" d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-3.534 5.653v4.126h-1.721v-4.126L9.106 8.221h1.94l2.454 4.126 2.454-4.126h1.94z"/>
            </svg>
            Yahoo Calendar
            <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleDownloadICS} className="cursor-pointer">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download .ics file
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
