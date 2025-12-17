import RecruiterLayout from "@/components/RecruiterLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Loader2, Mail, Send, Users, TrendingUp, Eye, MousePointerClick, MessageSquare, Plus, Play, Pause, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function RecruiterEmailCampaigns() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  
  // Form state
  const [campaignName, setCampaignName] = useState("");
  const [sourcingCampaignId, setSourcingCampaignId] = useState<number | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [useAiPersonalization, setUseAiPersonalization] = useState(true);

  const utils = trpc.useUtils();

  // Fetch sourcing campaigns
  const { data: sourcingCampaigns = [], isLoading: sourcingLoading } = trpc.recruiter.getSourcingCampaigns.useQuery();

  // Fetch email campaigns
  const { data: emailCampaigns = [], isLoading: campaignsLoading } = trpc.recruiter.getEmailCampaigns.useQuery();

  // Create campaign mutation
  const createCampaignMutation = trpc.recruiter.createEmailCampaign.useMutation({
    onSuccess: () => {
      utils.recruiter.getEmailCampaigns.invalidate();
      setCreateDialogOpen(false);
      resetForm();
      toast.success("Email campaign created successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to create campaign: ${error.message}`);
    },
  });

  // Send campaign mutation
  const sendCampaignMutation = trpc.recruiter.sendEmailCampaign.useMutation({
    onSuccess: () => {
      utils.recruiter.getEmailCampaigns.invalidate();
      toast.success("Email campaign started! Emails are being sent in the background.");
    },
    onError: (error) => {
      toast.error(`Failed to start campaign: ${error.message}`);
    },
  });

  const resetForm = () => {
    setCampaignName("");
    setSourcingCampaignId(null);
    setEmailSubject("");
    setEmailBody("");
    setUseAiPersonalization(true);
  };

  const handleCreateCampaign = () => {
    if (!campaignName || !sourcingCampaignId || !emailSubject || !emailBody) {
      toast.error("Please fill in all required fields");
      return;
    }

    createCampaignMutation.mutate({
      name: campaignName,
      sourcingCampaignId,
      subject: emailSubject,
      body: emailBody,
      useAiPersonalization,
    });
  };

  const handleSendCampaign = (campaignId: number) => {
    sendCampaignMutation.mutate({ campaignId });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      draft: { variant: "outline", label: "Draft" },
      active: { variant: "default", label: "Active" },
      paused: { variant: "secondary", label: "Paused" },
      completed: { variant: "secondary", label: "Completed" },
      failed: { variant: "destructive", label: "Failed" },
    };
    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const insertVariable = (variable: string) => {
    setEmailBody(prev => prev + `{{${variable}}}`);
  };



  return (
    <RecruiterLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Email Campaigns</h1>
            <p className="text-gray-600 mt-2">Manage AI-powered outreach campaigns to sourced candidates</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Email Campaign</DialogTitle>
                <DialogDescription>
                  Create an automated email outreach campaign for sourced candidates
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="campaignName">Campaign Name *</Label>
                  <Input
                    id="campaignName"
                    placeholder="e.g., Senior React Developer Outreach"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="sourcingCampaign">Sourcing Campaign *</Label>
                  <Select
                    value={sourcingCampaignId?.toString() || ""}
                    onValueChange={(value) => setSourcingCampaignId(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a sourcing campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      {sourcingCampaigns.map((campaign: any) => (
                        <SelectItem key={campaign.id} value={campaign.id.toString()}>
                          {campaign.name} ({campaign.candidatesFound || 0} candidates)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Emails will be sent to all candidates from this sourcing campaign
                  </p>
                </div>

                <div>
                  <Label htmlFor="emailSubject">Email Subject *</Label>
                  <Input
                    id="emailSubject"
                    placeholder="e.g., Exciting Senior React Developer Opportunity"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="emailBody">Email Body *</Label>
                  <Textarea
                    id="emailBody"
                    placeholder="Write your email template here. Use variables like {{name}}, {{title}}, {{company}}, {{skills}}, {{jobTitle}}"
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertVariable("name")}
                    >
                      + Name
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertVariable("title")}
                    >
                      + Title
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertVariable("company")}
                    >
                      + Company
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertVariable("skills")}
                    >
                      + Skills
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertVariable("jobTitle")}
                    >
                      + Job Title
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="useAi"
                    checked={useAiPersonalization}
                    onChange={(e) => setUseAiPersonalization(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="useAi" className="cursor-pointer">
                    Use AI personalization (recommended)
                  </Label>
                </div>
                <p className="text-xs text-gray-500">
                  AI will enhance each email with personalized insights based on the candidate's profile
                </p>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCampaign} disabled={createCampaignMutation.isPending}>
                  {createCampaignMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Campaign
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Campaigns List */}
        {campaignsLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : emailCampaigns.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No email campaigns yet</h3>
                <p className="text-gray-600 mb-4">
                  Create your first email campaign to start reaching out to sourced candidates
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Campaign
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {emailCampaigns.map((campaign: any) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{campaign.name}</CardTitle>
                      <CardDescription className="mt-1">
                        Subject: {campaign.subject}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(campaign.status)}
                      {campaign.status === "draft" && (
                        <Button
                          size="sm"
                          onClick={() => handleSendCampaign(campaign.id)}
                          disabled={sendCampaignMutation.isPending}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Send
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-600">{campaign.totalRecipients || 0}</p>
                      <p className="text-xs text-gray-600">Recipients</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <Send className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-600">{campaign.sentCount || 0}</p>
                      <p className="text-xs text-gray-600">Sent</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <Eye className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-purple-600">{campaign.openedCount || 0}</p>
                      <p className="text-xs text-gray-600">Opened</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <MessageSquare className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-orange-600">{campaign.repliedCount || 0}</p>
                      <p className="text-xs text-gray-600">Replied</p>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
                      {campaign.body}
                    </p>
                  </div>

                  {campaign.useAiPersonalization && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-purple-600">
                      <TrendingUp className="h-4 w-4" />
                      <span>AI Personalization Enabled</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RecruiterLayout>
  );
}
