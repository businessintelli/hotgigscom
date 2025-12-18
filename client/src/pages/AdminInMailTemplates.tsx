import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, Edit, Trash2, CheckCircle, XCircle, TrendingUp, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TemplateFormData {
  name: string;
  subject: string;
  body: string;
  category: string;
}

export default function AdminInMailTemplates() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [formData, setFormData] = useState<TemplateFormData>({
    name: "",
    subject: "",
    body: "",
    category: "initial_outreach",
  });

  // Fetch templates
  const { data: templates, refetch } = trpc.admin.getInMailTemplates.useQuery();

  // Mutations
  const createTemplate = trpc.admin.createInMailTemplate.useMutation({
    onSuccess: () => {
      toast({
        title: "Template created",
        description: "InMail template has been created successfully.",
      });
      refetch();
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error creating template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTemplate = trpc.admin.updateInMailTemplate.useMutation({
    onSuccess: () => {
      toast({
        title: "Template updated",
        description: "InMail template has been updated successfully.",
      });
      refetch();
      setIsEditDialogOpen(false);
      setEditingTemplate(null);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error updating template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTemplate = trpc.admin.deleteInMailTemplate.useMutation({
    onSuccess: () => {
      toast({
        title: "Template deleted",
        description: "InMail template has been deleted successfully.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error deleting template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleTemplateStatus = trpc.admin.toggleInMailTemplateStatus.useMutation({
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "Template status has been updated.",
      });
      refetch();
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      subject: "",
      body: "",
      category: "initial_outreach",
    });
  };

  const handleCreate = () => {
    if (!formData.name || !formData.subject || !formData.body) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createTemplate.mutate(formData);
  };

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body,
      category: template.category || "initial_outreach",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingTemplate || !formData.name || !formData.subject || !formData.body) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    updateTemplate.mutate({
      id: editingTemplate.id,
      ...formData,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this template?")) {
      deleteTemplate.mutate({ id });
    }
  };

  const handlePreview = (template: any) => {
    setPreviewTemplate(template);
    setIsPreviewDialogOpen(true);
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case "initial_outreach":
        return "default";
      case "follow_up":
        return "secondary";
      case "interview_invite":
        return "outline";
      default:
        return "default";
    }
  };

  const renderTemplatePreview = (text: string) => {
    // Replace variables with example values
    return text
      .replace(/\{\{firstName\}\}/g, "John")
      .replace(/\{\{lastName\}\}/g, "Doe")
      .replace(/\{\{company\}\}/g, "Acme Corp")
      .replace(/\{\{title\}\}/g, "Senior Software Engineer")
      .replace(/\{\{skills\}\}/g, "React, Node.js, TypeScript");
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">InMail Templates</h1>
          <p className="text-muted-foreground">
            Create and manage reusable InMail templates for your recruitment team
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create InMail Template</DialogTitle>
              <DialogDescription>
                Create a new template that recruiters can use for LinkedIn outreach
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Software Engineer Outreach"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="initial_outreach">Initial Outreach</SelectItem>
                    <SelectItem value="follow_up">Follow Up</SelectItem>
                    <SelectItem value="interview_invite">Interview Invite</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line *</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Exciting opportunity at {{company}}"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Message Body *</Label>
                <Textarea
                  id="body"
                  placeholder="Hi {{firstName}},&#10;&#10;I came across your profile..."
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  rows={10}
                />
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Available variables:</strong> {"{"}{"{"}{"}"}firstName{"}"}{"}"}, {"{"}{"{"}{"}"}lastName{"}"}{"}"}, {"{"}{"{"}{"}"}company{"}"}{"}"}, {"{"}{"{"}{"}"}title{"}"}{"}"}, {"{"}{"{"}{"}"}skills{"}"}{"}"}<br />
                  These will be automatically replaced when recruiters use the template.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createTemplate.isPending}>
                {createTemplate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Template Library</CardTitle>
          <CardDescription>
            Manage templates that recruiters can use for LinkedIn InMail outreach
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!templates || templates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-4">No templates created yet</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Template
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Times Used</TableHead>
                  <TableHead>Response Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates && Array.isArray(templates) && templates.map((template: any) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <Badge variant={getCategoryBadgeColor(template.category || "")}>
                        {template.category?.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{template.timesUsed || 0}</TableCell>
                    <TableCell>
                      {template.responseRate ? (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-green-600" />
                          {template.responseRate}%
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {template.isActive ? (
                        <Badge variant="default" className="flex items-center gap-1 w-fit">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                          <XCircle className="h-3 w-3" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(template)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTemplateStatus.mutate({ id: template.id })}
                        >
                          {template.isActive ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit InMail Template</DialogTitle>
            <DialogDescription>
              Update the template details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Template Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="initial_outreach">Initial Outreach</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="interview_invite">Interview Invite</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-subject">Subject Line *</Label>
              <Input
                id="edit-subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-body">Message Body *</Label>
              <Textarea
                id="edit-body"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                rows={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateTemplate.isPending}>
              {updateTemplate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview how this template will look with sample data
            </DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Subject:</Label>
                <p className="font-medium mt-1">
                  {renderTemplatePreview(previewTemplate.subject)}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Message:</Label>
                <div className="mt-1 p-4 bg-muted rounded-md whitespace-pre-wrap">
                  {renderTemplatePreview(previewTemplate.body)}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsPreviewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
