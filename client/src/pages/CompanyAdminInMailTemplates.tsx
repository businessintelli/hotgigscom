import { useState } from "react";
import { CompanyAdminLayout } from "@/components/CompanyAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Mail,
  Edit,
  Trash2,
  Copy,
  TrendingUp,
  Star,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Template {
  id: number;
  name: string;
  subject: string;
  body: string;
  category: string;
  usageCount: number;
  responseRate: number;
  isDefault: boolean;
}

export function CompanyAdminInMailTemplates() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateSubject, setTemplateSubject] = useState("");
  const [templateBody, setTemplateBody] = useState("");
  const [templateCategory, setTemplateCategory] = useState("initial_outreach");

  // Mock data - replace with actual API calls
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: 1,
      name: "Initial Outreach - Software Engineer",
      subject: "Exciting opportunity at {company_name}",
      body: "Hi {candidate_name},\n\nI came across your profile and was impressed by your experience with {skills}. We have an exciting {job_title} position at {company_name} that I think would be a great fit for you.\n\nWould you be open to a quick call to discuss this opportunity?\n\nBest regards,\n{recruiter_name}",
      category: "initial_outreach",
      usageCount: 45,
      responseRate: 28,
      isDefault: true,
    },
    {
      id: 2,
      name: "Follow-up Message",
      subject: "Following up on {job_title} opportunity",
      body: "Hi {candidate_name},\n\nI wanted to follow up on my previous message about the {job_title} position at {company_name}. I believe your background in {skills} makes you an excellent candidate for this role.\n\nAre you available for a brief conversation this week?\n\nLooking forward to hearing from you,\n{recruiter_name}",
      category: "follow_up",
      usageCount: 32,
      responseRate: 18,
      isDefault: false,
    },
    {
      id: 3,
      name: "Interview Invitation",
      subject: "Interview invitation for {job_title} at {company_name}",
      body: "Hi {candidate_name},\n\nThank you for your interest in the {job_title} position at {company_name}. We'd love to invite you for an interview to discuss this opportunity further.\n\nWould you be available for a {interview_duration} minute {interview_type} interview next week?\n\nPlease let me know your availability.\n\nBest regards,\n{recruiter_name}",
      category: "interview_invitation",
      usageCount: 28,
      responseRate: 65,
      isDefault: false,
    },
  ]);

  const handleOpenDialog = (template?: Template) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateName(template.name);
      setTemplateSubject(template.subject);
      setTemplateBody(template.body);
      setTemplateCategory(template.category);
    } else {
      setEditingTemplate(null);
      setTemplateName("");
      setTemplateSubject("");
      setTemplateBody("");
      setTemplateCategory("initial_outreach");
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!templateName || !templateSubject || !templateBody) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (editingTemplate) {
      // Update existing template
      setTemplates(templates.map(t =>
        t.id === editingTemplate.id
          ? { ...t, name: templateName, subject: templateSubject, body: templateBody, category: templateCategory }
          : t
      ));
      toast({
        title: "Template updated",
        description: "Your template has been updated successfully",
      });
    } else {
      // Create new template
      const newTemplate: Template = {
        id: Math.max(...templates.map(t => t.id)) + 1,
        name: templateName,
        subject: templateSubject,
        body: templateBody,
        category: templateCategory,
        usageCount: 0,
        responseRate: 0,
        isDefault: false,
      };
      setTemplates([...templates, newTemplate]);
      toast({
        title: "Template created",
        description: "Your new template has been created successfully",
      });
    }

    setDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    setTemplates(templates.filter(t => t.id !== id));
    toast({
      title: "Template deleted",
      description: "The template has been removed",
    });
  };

  const handleDuplicate = (template: Template) => {
    const newTemplate: Template = {
      ...template,
      id: Math.max(...templates.map(t => t.id)) + 1,
      name: `${template.name} (Copy)`,
      usageCount: 0,
      responseRate: 0,
      isDefault: false,
    };
    setTemplates([...templates, newTemplate]);
    toast({
      title: "Template duplicated",
      description: "A copy of the template has been created",
    });
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      initial_outreach: "bg-blue-100 text-blue-800 border-blue-200",
      follow_up: "bg-purple-100 text-purple-800 border-purple-200",
      interview_invitation: "bg-green-100 text-green-800 border-green-200",
    };
    return colors[category] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      initial_outreach: "Initial Outreach",
      follow_up: "Follow Up",
      interview_invitation: "Interview Invitation",
    };
    return labels[category] || category;
  };

  return (
    <CompanyAdminLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">InMail Templates</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage reusable templates for LinkedIn outreach
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{templates.length}</div>
              <p className="text-xs text-muted-foreground">
                {templates.filter(t => t.isDefault).length} default templates
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {templates.reduce((sum, t) => sum + t.usageCount, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Messages sent</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Response Rate</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(
                  templates.reduce((sum, t) => sum + t.responseRate, 0) / templates.length
                )}%
              </div>
              <p className="text-xs text-muted-foreground">Across all templates</p>
            </CardContent>
          </Card>
        </div>

        {/* Templates Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      {template.isDefault && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                    <Badge variant="outline" className={getCategoryBadge(template.category)}>
                      {getCategoryLabel(template.category)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Subject:</p>
                  <p className="text-sm">{template.subject}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Body Preview:</p>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {template.body}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>Used {template.usageCount} times</span>
                    <span>•</span>
                    <span>{template.responseRate}% response rate</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenDialog(template)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicate(template)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                    disabled={template.isDefault}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Template Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Edit Template" : "Create New Template"}
              </DialogTitle>
              <DialogDescription>
                Use variables like {'{candidate_name}'}, {'{job_title}'}, {'{company_name}'}, {'{skills}'}, {'{recruiter_name}'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Initial Outreach - Software Engineer"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                >
                  <option value="initial_outreach">Initial Outreach</option>
                  <option value="follow_up">Follow Up</option>
                  <option value="interview_invitation">Interview Invitation</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line *</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Exciting opportunity at {company_name}"
                  value={templateSubject}
                  onChange={(e) => setTemplateSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Message Body *</Label>
                <Textarea
                  id="body"
                  placeholder="Write your template message here..."
                  value={templateBody}
                  onChange={(e) => setTemplateBody(e.target.value)}
                  rows={10}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingTemplate ? "Update Template" : "Create Template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CompanyAdminLayout>
  );
}
