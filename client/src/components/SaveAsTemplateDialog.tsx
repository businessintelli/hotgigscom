import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface SaveAsTemplateDialogProps {
  formData: any;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export default function SaveAsTemplateDialog({ formData, trigger, onSuccess }: SaveAsTemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const createTemplateMutation = trpc.job.createTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template saved successfully!");
      setOpen(false);
      resetForm();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(`Failed to save template: ${error.message}`);
    },
  });

  const resetForm = () => {
    setTemplateName("");
    setTemplateDescription("");
    setCategory("");
    setTags("");
    setIsPublic(false);
  };

  const handleSave = () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    const tagArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    createTemplateMutation.mutate({
      name: templateName,
      templateDescription: templateDescription || undefined,
      category: category || undefined,
      tags: tagArray.length > 0 ? tagArray : undefined,
      isPublic,
      // Job data from form
      title: formData.title || undefined,
      companyName: formData.companyName || undefined,
      description: formData.description || undefined,
      requirements: formData.requirements || undefined,
      responsibilities: formData.responsibilities || undefined,
      location: formData.location || undefined,
      employmentType: formData.employmentType || undefined,
      salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : undefined,
      salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : undefined,
      salaryCurrency: formData.salaryCurrency || undefined,
      experienceLevel: formData.experienceLevel || undefined,
      educationLevel: formData.educationLevel || undefined,
      requiredSkills: formData.requiredSkills || undefined,
      preferredSkills: formData.preferredSkills || undefined,
      benefits: formData.benefits || undefined,
      remotePolicy: formData.remotePolicy || undefined,
      travelRequirement: formData.travelRequirement || undefined,
      securityClearance: formData.securityClearance || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Save className="h-4 w-4 mr-2" />
            Save as Template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Save this job posting as a template for future use. You can share it with your company or keep it private.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="templateName">Template Name *</Label>
            <Input
              id="templateName"
              placeholder="e.g., Senior Developer Template"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="templateDescription">Description</Label>
            <Textarea
              id="templateDescription"
              placeholder="Brief description of this template..."
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              placeholder="e.g., Engineering, Sales, Marketing"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              placeholder="e.g., remote, senior, full-time"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="isPublic">Share with Company</Label>
              <p className="text-sm text-muted-foreground">
                Make this template available to all recruiters in your company
              </p>
            </div>
            <Switch
              id="isPublic"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={createTemplateMutation.isPending}
          >
            {createTemplateMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Save Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
