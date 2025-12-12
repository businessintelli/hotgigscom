import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Mail, Plus, Edit, Trash2, Copy, Eye } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function EmailTemplateManager() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // UI state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  // Form state
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("");

  // Fetch templates
  const { data: templates, refetch } = trpc.emailCampaigns.getTemplates.useQuery();

  // Mutations
  const createTemplateMutation = trpc.emailCampaigns.createTemplate.useMutation({
    onSuccess: () => {
      refetch();
      setCreateDialogOpen(false);
      resetForm();
      toast.success("Template created successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to create template: ${error.message}`);
    },
  });

  const updateTemplateMutation = trpc.emailCampaigns.updateTemplate.useMutation({
    onSuccess: () => {
      refetch();
      setEditDialogOpen(false);
      resetForm();
      toast.success("Template updated successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to update template: ${error.message}`);
    },
  });

  const deleteTemplateMutation = trpc.emailCampaigns.deleteTemplate.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Template deleted successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });

  // Reset form
  const resetForm = () => {
    setName("");
    setSubject("");
    setBody("");
    setCategory("");
    setSelectedTemplate(null);
  };

  // Handle create
  const handleCreate = () => {
    if (!name.trim() || !subject.trim() || !body.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    createTemplateMutation.mutate({
      name,
      subject,
      body,
      category: category || undefined,
    });
  };

  // Handle edit
  const handleEdit = (template: any) => {
    setSelectedTemplate(template);
    setName(template.name);
    setSubject(template.subject);
    setBody(template.body);
    setCategory(template.category || "");
    setEditDialogOpen(true);
  };

  // Handle update
  const handleUpdate = () => {
    if (!selectedTemplate) return;

    updateTemplateMutation.mutate({
      id: selectedTemplate.id,
      name,
      subject,
      body,
      category: category || undefined,
    });
  };

  // Handle delete
  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this template?")) {
      deleteTemplateMutation.mutate({ id });
    }
  };

  // Handle duplicate
  const handleDuplicate = (template: any) => {
    setName(`${template.name} (Copy)`);
    setSubject(template.subject);
    setBody(template.body);
    setCategory(template.category || "");
    setCreateDialogOpen(true);
  };

  // Handle preview
  const handlePreview = (template: any) => {
    setSelectedTemplate(template);
    setPreviewDialogOpen(true);
  };

  if (!user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Mail className="w-6 h-6" />
              Email Templates
            </h1>
            <p className="text-sm text-gray-600">Create and manage reusable email templates</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setLocation("/recruiter/dashboard")}>
              Dashboard
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Variable Guide */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Available Variables</CardTitle>
            <CardDescription>Use these variables in your templates for personalization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Badge variant="secondary" className="justify-center">{"{{name}}"}</Badge>
              <Badge variant="secondary" className="justify-center">{"{{firstName}}"}</Badge>
              <Badge variant="secondary" className="justify-center">{"{{email}}"}</Badge>
              <Badge variant="secondary" className="justify-center">{"{{title}}"}</Badge>
              <Badge variant="secondary" className="justify-center">{"{{location}}"}</Badge>
              <Badge variant="secondary" className="justify-center">{"{{experience}}"}</Badge>
              <Badge variant="secondary" className="justify-center">{"{{jobTitle}}"}</Badge>
              <Badge variant="secondary" className="justify-center">{"{{companyName}}"}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        {templates && templates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template: any) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      {template.category && (
                        <Badge variant="outline" className="mt-2">
                          {template.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Subject:</p>
                      <p className="text-sm text-gray-600 truncate">{template.subject}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Body Preview:</p>
                      <p className="text-sm text-gray-600 line-clamp-3">{template.body.replace(/<[^>]*>/g, "")}</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" onClick={() => handlePreview(template)}>
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(template)}>
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDuplicate(template)}>
                        <Copy className="w-4 h-4 mr-1" />
                        Duplicate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(template.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No templates yet</p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Template
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Template Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Email Template</DialogTitle>
            <DialogDescription>
              Create a reusable email template with personalization variables
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Template Name *</Label>
              <Input
                placeholder="e.g., Initial Outreach"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outreach">Outreach</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                  <SelectItem value="interview-invite">Interview Invite</SelectItem>
                  <SelectItem value="rejection">Rejection</SelectItem>
                  <SelectItem value="offer">Offer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject Line *</Label>
              <Input
                placeholder="e.g., Exciting opportunity at {{companyName}}"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div>
              <Label>Email Body *</Label>
              <Textarea
                placeholder={`Hi {{firstName}},

I came across your profile and was impressed by your experience in {{title}}. We have an exciting opportunity that I think would be a great fit for you.

Would you be interested in learning more?

Best regards`}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createTemplateMutation.isPending}>
              {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Email Template</DialogTitle>
            <DialogDescription>
              Update your email template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Template Name *</Label>
              <Input
                placeholder="e.g., Initial Outreach"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outreach">Outreach</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                  <SelectItem value="interview-invite">Interview Invite</SelectItem>
                  <SelectItem value="rejection">Rejection</SelectItem>
                  <SelectItem value="offer">Offer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject Line *</Label>
              <Input
                placeholder="e.g., Exciting opportunity at {{companyName}}"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div>
              <Label>Email Body *</Label>
              <Textarea
                placeholder="Email body with variables..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateTemplateMutation.isPending}>
              {updateTemplateMutation.isPending ? "Updating..." : "Update Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            <DialogDescription>Template Preview</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Subject:</Label>
              <p className="text-sm text-gray-700 mt-1">{selectedTemplate?.subject}</p>
            </div>
            <div>
              <Label>Body:</Label>
              <div className="mt-2 p-4 bg-gray-50 rounded border text-sm whitespace-pre-wrap">
                {selectedTemplate?.body}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
