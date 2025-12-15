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
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { 
  Mail, Plus, Send, Calendar, Users, Eye, BarChart3, 
  Clock, CheckCircle2, XCircle, MousePointer, Inbox
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function CampaignBuilder() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // UI state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [recipientDialogOpen, setRecipientDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    companyName: 'Tech Corp',
    jobTitle: 'Software Engineer',
    location: 'San Francisco, CA',
    salary: '$150,000 - $180,000',
    recruiterName: user?.name || 'Recruiter',
    recruiterEmail: user?.email || 'recruiter@example.com',
  });

  // Form state
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState<number | undefined>(undefined);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  // Fetch data
  const { data: campaigns, refetch: refetchCampaigns } = trpc.emailCampaigns.getCampaigns.useQuery();
  const { data: templates } = trpc.emailCampaigns.getTemplates.useQuery();

  // Mutations
  const createCampaignMutation = trpc.emailCampaigns.createCampaign.useMutation({
    onSuccess: () => {
      refetchCampaigns();
      setCreateDialogOpen(false);
      resetForm();
      toast.success("Campaign created successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to create campaign: ${error.message}`);
    },
  });

  const sendCampaignMutation = trpc.emailCampaigns.sendCampaign.useMutation({
    onSuccess: (data) => {
      refetchCampaigns();
      toast.success(`Campaign sent! ${data.sentCount} emails sent, ${data.bouncedCount} bounced`);
    },
    onError: (error) => {
      toast.error(`Failed to send campaign: ${error.message}`);
    },
  });

  // Reset form
  const resetForm = () => {
    setName("");
    setTemplateId(undefined);
    setSubject("");
    setBody("");
    setScheduledAt("");
  };

  // Handle template selection
  const handleTemplateSelect = (templateIdStr: string) => {
    const id = parseInt(templateIdStr);
    setTemplateId(id);
    
    const template = templates?.find((t: any) => t.id === id);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
    }
  };

  // Handle create campaign
  const handleCreate = () => {
    if (!name.trim() || !subject.trim() || !body.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    createCampaignMutation.mutate({
      name,
      templateId,
      subject,
      body,
      scheduledAt: scheduledAt || undefined,
    });
  };

  // Handle send campaign
  const handleSend = (campaignId: number) => {
    if (confirm("Are you sure you want to send this campaign? This action cannot be undone.")) {
      sendCampaignMutation.mutate({ campaignId });
    }
  };

  // Handle view details
  const handleViewDetails = (campaign: any) => {
    setSelectedCampaign(campaign);
    setDetailsDialogOpen(true);
  };

  // Calculate stats
  const getOpenRate = (campaign: any) => {
    if (campaign.sentCount === 0) return 0;
    return Math.round((campaign.openedCount / campaign.sentCount) * 100);
  };

  const getClickRate = (campaign: any) => {
    if (campaign.sentCount === 0) return 0;
    return Math.round((campaign.clickedCount / campaign.sentCount) * 100);
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
              <Send className="w-6 h-6" />
              Email Campaigns
            </h1>
            <p className="text-sm text-gray-600">Create and manage bulk email campaigns</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setLocation("/recruiter/email-templates")}>
              <Mail className="w-4 h-4 mr-2" />
              Templates
            </Button>
            <Button variant="outline" onClick={() => setLocation("/recruiter/dashboard")}>
              Dashboard
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Campaigns Grid */}
        {campaigns && campaigns.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {campaigns.map((item: any) => {
              const campaign = item.campaign;
              const openRate = getOpenRate(campaign);
              const clickRate = getClickRate(campaign);

              return (
                <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{campaign.name}</CardTitle>
                        <CardDescription className="mt-1">
                          Created {new Date(campaign.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          campaign.status === "sent" ? "default" :
                          campaign.status === "sending" ? "secondary" :
                          campaign.status === "scheduled" ? "outline" :
                          "secondary"
                        }
                      >
                        {campaign.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Subject */}
                      <div>
                        <p className="text-sm font-medium text-gray-700">Subject:</p>
                        <p className="text-sm text-gray-600">{campaign.subject}</p>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          <div>
                            <p className="text-xs text-gray-600">Recipients</p>
                            <p className="text-lg font-semibold">{campaign.totalRecipients}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <div>
                            <p className="text-xs text-gray-600">Sent</p>
                            <p className="text-lg font-semibold">{campaign.sentCount}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-purple-600" />
                          <div>
                            <p className="text-xs text-gray-600">Opened</p>
                            <p className="text-lg font-semibold">{campaign.openedCount} ({openRate}%)</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <MousePointer className="w-4 h-4 text-orange-600" />
                          <div>
                            <p className="text-xs text-gray-600">Clicked</p>
                            <p className="text-lg font-semibold">{campaign.clickedCount} ({clickRate}%)</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <div>
                            <p className="text-xs text-gray-600">Bounced</p>
                            <p className="text-lg font-semibold">{campaign.bouncedCount}</p>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bars */}
                      {campaign.status === "sent" && campaign.sentCount > 0 && (
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Open Rate</span>
                              <span>{openRate}%</span>
                            </div>
                            <Progress value={openRate} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Click Rate</span>
                              <span>{clickRate}%</span>
                            </div>
                            <Progress value={clickRate} className="h-2" />
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => handleViewDetails(campaign)}>
                          <BarChart3 className="w-4 h-4 mr-1" />
                          Details
                        </Button>
                        {campaign.status === "draft" && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => setRecipientDialogOpen(true)}>
                              <Users className="w-4 h-4 mr-1" />
                              Add Recipients
                            </Button>
                            <Button size="sm" onClick={() => handleSend(campaign.id)}>
                              <Send className="w-4 h-4 mr-1" />
                              Send Now
                            </Button>
                          </>
                        )}
                        {campaign.status === "scheduled" && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Scheduled for {new Date(campaign.scheduledAt).toLocaleString()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Send className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No campaigns yet</p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Campaign
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Campaign Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Email Campaign</DialogTitle>
            <DialogDescription>
              Create a new bulk email campaign to reach candidates
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Campaign Name *</Label>
              <Input
                placeholder="e.g., Q1 2024 Developer Outreach"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label>Use Template (Optional)</Label>
              <Select value={templateId?.toString()} onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates?.map((template: any) => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.name}
                    </SelectItem>
                  ))}
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

I came across your profile and was impressed by your experience...`}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use variables like {'{'}{'{'} firstName {'}'}{'}'}, {'{'}{'{'} companyName {'}'}{'}'}, {'{'}{'{'} jobTitle {'}'}{'}'}  etc.
              </p>
            </div>
            
            {/* Preview Button */}
            {(subject || body) && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setPreviewDialogOpen(true)}
                className="w-full"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview Email
              </Button>
            )}
            <div>
              <Label>Schedule Send (Optional)</Label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to save as draft
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createCampaignMutation.isPending}>
              {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Email Preview
            </DialogTitle>
            <DialogDescription>
              Preview how your email will look with sample data
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Variables Editor */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700">Preview Variables</h3>
              <p className="text-xs text-gray-500">Edit these values to see how your email will look for different recipients</p>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {Object.entries(previewVariables).map(([key, value]) => (
                  <div key={key}>
                    <Label className="text-xs text-gray-600">{key}</Label>
                    <Input
                      value={value}
                      onChange={(e) => setPreviewVariables(prev => ({ ...prev, [key]: e.target.value }))}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Email Preview */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700">Email Preview</h3>
              <div className="border rounded-lg overflow-hidden">
                {/* Email Header */}
                <div className="bg-gray-100 p-3 border-b">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">To:</span>
                    <span className="font-medium">{previewVariables.firstName} {previewVariables.lastName} &lt;{previewVariables.email}&gt;</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <span className="text-gray-500">Subject:</span>
                    <span className="font-medium">
                      {subject.replace(/\{\{(\w+)\}\}/g, (_, key) => previewVariables[key] || `{{${key}}}`).trim() || 'No subject'}
                    </span>
                  </div>
                </div>
                {/* Email Body */}
                <div className="p-4 bg-white min-h-[300px]">
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                    {body.replace(/\{\{(\w+)\}\}/g, (_, key) => previewVariables[key] || `{{${key}}}`) || 'No content'}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campaign Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCampaign?.name}</DialogTitle>
            <DialogDescription>Campaign Analytics</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{selectedCampaign?.totalRecipients}</p>
                    <p className="text-xs text-gray-600">Recipients</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{selectedCampaign?.sentCount}</p>
                    <p className="text-xs text-gray-600">Sent</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Eye className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{selectedCampaign?.openedCount}</p>
                    <p className="text-xs text-gray-600">Opened ({getOpenRate(selectedCampaign || {})}%)</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <MousePointer className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{selectedCampaign?.clickedCount}</p>
                    <p className="text-xs text-gray-600">Clicked ({getClickRate(selectedCampaign || {})}%)</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Campaign Details */}
            <div>
              <Label>Subject:</Label>
              <p className="text-sm text-gray-700 mt-1">{selectedCampaign?.subject}</p>
            </div>
            <div>
              <Label>Status:</Label>
              <Badge className="mt-1">{selectedCampaign?.status}</Badge>
            </div>
            {selectedCampaign?.sentAt && (
              <div>
                <Label>Sent At:</Label>
                <p className="text-sm text-gray-700 mt-1">
                  {new Date(selectedCampaign.sentAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Recipients Dialog */}
      <Dialog open={recipientDialogOpen} onOpenChange={setRecipientDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Recipients</DialogTitle>
            <DialogDescription>
              Select candidates from advanced search to add to this campaign
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Button onClick={() => {
              setRecipientDialogOpen(false);
              setLocation("/recruiter/advanced-search");
            }}>
              Go to Advanced Search
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecipientDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
