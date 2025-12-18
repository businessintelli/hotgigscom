import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Share2, Link2, Mail, MessageCircle, Check } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface JobShareButtonProps {
  jobId: number;
  jobTitle: string;
  companyName?: string;
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function JobShareButton({
  jobId,
  jobTitle,
  companyName,
  variant = "outline",
  size = "sm",
  className = "",
}: JobShareButtonProps) {
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [copied, setCopied] = useState(false);

  // Track share mutation
  const trackShareMutation = trpc.job.trackShare.useMutation();

  // Generate shareable URL
  const getJobUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/jobs/${jobId}`;
  };

  // Copy link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getJobUrl());
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
      // Track the share
      trackShareMutation.mutate({ jobId, channel: "copy" });
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  // Share via email
  const handleEmailShare = () => {
    const subject = `Check out this job: ${jobTitle}${companyName ? ` at ${companyName}` : ""}`;
    const body = emailMessage || `I thought you might be interested in this job opportunity:\n\n${jobTitle}${companyName ? ` at ${companyName}` : ""}\n\n${getJobUrl()}`;
    
    if (recipientEmail) {
      // Open email client with pre-filled content
      window.location.href = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      toast.success("Opening email client...");
      setEmailDialogOpen(false);
      setRecipientEmail("");
      setEmailMessage("");
      // Track the share
      trackShareMutation.mutate({ jobId, channel: "email" });
    } else {
      toast.error("Please enter a recipient email address");
    }
  };

  // Share on LinkedIn
  const handleLinkedInShare = () => {
    const url = getJobUrl();
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(linkedInUrl, "_blank", "width=600,height=600");
    toast.success("Opening LinkedIn...");
    // Track the share
    trackShareMutation.mutate({ jobId, channel: "linkedin" });
  };

  // Share on Twitter
  const handleTwitterShare = () => {
    const text = `Check out this job opportunity: ${jobTitle}${companyName ? ` at ${companyName}` : ""}`;
    const url = getJobUrl();
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, "_blank", "width=600,height=600");
    toast.success("Opening Twitter...");
    // Track the share
    trackShareMutation.mutate({ jobId, channel: "twitter" });
  };

  // Share on Facebook
  const handleFacebookShare = () => {
    const url = getJobUrl();
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, "_blank", "width=600,height=600");
    toast.success("Opening Facebook...");
    // Track the share
    trackShareMutation.mutate({ jobId, channel: "facebook" });
  };

  // Share on WhatsApp
  const handleWhatsAppShare = () => {
    const text = `Check out this job opportunity: ${jobTitle}${companyName ? ` at ${companyName}` : ""}\n${getJobUrl()}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
    toast.success("Opening WhatsApp...");
    // Track the share
    trackShareMutation.mutate({ jobId, channel: "whatsapp" });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} className={className}>
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Share this job</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleCopyLink}>
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4 text-green-600" />
                <span className="text-green-600">Link copied!</span>
              </>
            ) : (
              <>
                <Link2 className="mr-2 h-4 w-4" />
                <span>Copy link</span>
              </>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setEmailDialogOpen(true)}>
            <Mail className="mr-2 h-4 w-4" />
            <span>Share via email</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-gray-500">Social Media</DropdownMenuLabel>
          
          <DropdownMenuItem onClick={handleLinkedInShare}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            <span>LinkedIn</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleTwitterShare}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
            <span>Twitter</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleFacebookShare}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>Facebook</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleWhatsAppShare}>
            <MessageCircle className="mr-2 h-4 w-4" />
            <span>WhatsApp</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Email Share Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share via Email</DialogTitle>
            <DialogDescription>
              Send this job opportunity to someone via email
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recipient-email">Recipient Email</Label>
              <Input
                id="recipient-email"
                type="email"
                placeholder="colleague@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email-message">Personal Message (Optional)</Label>
              <Textarea
                id="email-message"
                placeholder="Add a personal message..."
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-600">
              <p className="font-medium mb-1">Preview:</p>
              <p className="text-xs">
                {jobTitle}{companyName && ` at ${companyName}`}
                <br />
                <span className="text-blue-600">{getJobUrl()}</span>
              </p>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEmailShare}>
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
