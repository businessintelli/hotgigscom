import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, X, ExternalLink } from "lucide-react";

interface ResumePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeUrl: string;
  resumeFilename: string;
}

export function ResumePreviewModal({
  isOpen,
  onClose,
  resumeUrl,
  resumeFilename,
}: ResumePreviewModalProps) {
  const isPDF = resumeFilename.toLowerCase().endsWith('.pdf');
  const isImage = /\.(jpg|jpeg|png|gif)$/i.test(resumeFilename);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resume Preview
          </DialogTitle>
          <DialogDescription>
            {resumeFilename}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-gray-50 rounded-lg p-4">
          {isPDF ? (
            <iframe
              src={resumeUrl}
              className="w-full h-[600px] border-0 rounded"
              title="Resume Preview"
            />
          ) : isImage ? (
            <img
              src={resumeUrl}
              alt="Resume"
              className="max-w-full h-auto mx-auto"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FileText className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">
                Preview not available for this file type
              </p>
              <p className="text-sm text-gray-500 mb-4">
                {resumeFilename}
              </p>
              <Button variant="outline" asChild>
                <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in New Tab
                </a>
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" asChild>
            <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Full Screen
            </a>
          </Button>
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
