import { useState } from 'react';
import RecruiterLayout from '@/components/RecruiterLayout';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Play, Pause, Users, Target, TrendingUp, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function RecruiterSourcingCampaigns() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);

  // Fetch campaigns
  const { data: campaigns, isLoading, refetch } = trpc.recruiter.getSourcingCampaigns.useQuery();

  // Create campaign mutation
  const createCampaign = trpc.recruiter.createSourcingCampaign.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Sourcing campaign created successfully' });
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Start campaign mutation
  const startCampaign = trpc.recruiter.startSourcingCampaign.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Campaign started! Candidates are being sourced.' });
      refetch();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Pause campaign mutation
  const pauseCampaign = trpc.recruiter.pauseSourcingCampaign.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Campaign paused' });
      refetch();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Form state for new campaign
  const [formData, setFormData] = useState({
    name: '',
    targetRoles: '',
    requiredSkills: '',
    locations: '',
    experienceMin: '',
    experienceMax: '',
    maxCandidates: '100',
    searchLinkedIn: true,
    searchGitHub: true,
    autoEnrich: true,
    autoAddToPool: true,
  });

  const handleCreateCampaign = () => {
    createCampaign.mutate({
      name: formData.name,
      targetRoles: formData.targetRoles.split(',').map(r => r.trim()).filter(Boolean),
      requiredSkills: formData.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
      locations: formData.locations ? formData.locations.split(',').map(l => l.trim()).filter(Boolean) : undefined,
      experienceMin: formData.experienceMin ? parseInt(formData.experienceMin) : undefined,
      experienceMax: formData.experienceMax ? parseInt(formData.experienceMax) : undefined,
      maxCandidates: parseInt(formData.maxCandidates),
      searchLinkedIn: formData.searchLinkedIn,
      searchGitHub: formData.searchGitHub,
      autoEnrich: formData.autoEnrich,
      autoAddToPool: formData.autoAddToPool,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'secondary',
      active: 'default',
      paused: 'outline',
      completed: 'default',
      failed: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <RecruiterLayout title="Candidate Sourcing Automation">
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Candidate Sourcing Automation</h1>
          <p className="text-muted-foreground mt-2">
            Automatically discover and recruit top talent from LinkedIn and GitHub
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Sourcing Campaign</DialogTitle>
              <DialogDescription>
                Define your ideal candidate criteria and let AI find them automatically
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Campaign Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Senior React Developers - Q1 2025"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="targetRoles">Target Roles (comma-separated)</Label>
                <Input
                  id="targetRoles"
                  placeholder="e.g., Senior Software Engineer, Tech Lead, Engineering Manager"
                  value={formData.targetRoles}
                  onChange={(e) => setFormData({ ...formData, targetRoles: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="requiredSkills">Required Skills (comma-separated)</Label>
                <Textarea
                  id="requiredSkills"
                  placeholder="e.g., React, TypeScript, Node.js, AWS, GraphQL"
                  value={formData.requiredSkills}
                  onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="locations">Locations (comma-separated, optional)</Label>
                <Input
                  id="locations"
                  placeholder="e.g., San Francisco, New York, Remote"
                  value={formData.locations}
                  onChange={(e) => setFormData({ ...formData, locations: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="experienceMin">Min Experience (years)</Label>
                  <Input
                    id="experienceMin"
                    type="number"
                    placeholder="e.g., 5"
                    value={formData.experienceMin}
                    onChange={(e) => setFormData({ ...formData, experienceMin: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="experienceMax">Max Experience (years)</Label>
                  <Input
                    id="experienceMax"
                    type="number"
                    placeholder="e.g., 10"
                    value={formData.experienceMax}
                    onChange={(e) => setFormData({ ...formData, experienceMax: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="maxCandidates">Max Candidates to Source</Label>
                <Input
                  id="maxCandidates"
                  type="number"
                  value={formData.maxCandidates}
                  onChange={(e) => setFormData({ ...formData, maxCandidates: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Sourcing Channels</Label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.searchLinkedIn}
                      onChange={(e) => setFormData({ ...formData, searchLinkedIn: e.target.checked })}
                      className="rounded"
                    />
                    <span>LinkedIn</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.searchGitHub}
                      onChange={(e) => setFormData({ ...formData, searchGitHub: e.target.checked })}
                      className="rounded"
                    />
                    <span>GitHub</span>
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Automation Options</Label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.autoEnrich}
                      onChange={(e) => setFormData({ ...formData, autoEnrich: e.target.checked })}
                      className="rounded"
                    />
                    <span>Auto-enrich profiles with AI</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.autoAddToPool}
                      onChange={(e) => setFormData({ ...formData, autoAddToPool: e.target.checked })}
                      className="rounded"
                    />
                    <span>Auto-add to talent pool</span>
                  </label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCampaign} disabled={createCampaign.isPending}>
                {createCampaign.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Campaign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns?.filter(c => c.status === 'active').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Candidates Found</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns?.reduce((sum, c) => sum + (c.candidatesFound || 0), 0) || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Added to Pool</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns?.reduce((sum, c) => sum + (c.candidatesAdded || 0), 0) || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sourcing Campaigns</CardTitle>
          <CardDescription>Manage your automated candidate discovery campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns && campaigns.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Target Roles</TableHead>
                  <TableHead className="text-right">Found</TableHead>
                  <TableHead className="text-right">Enriched</TableHead>
                  <TableHead className="text-right">Added</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {campaign.targetRoles ? JSON.parse(campaign.targetRoles).join(', ') : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">{campaign.candidatesFound || 0}</TableCell>
                    <TableCell className="text-right">{campaign.candidatesEnriched || 0}</TableCell>
                    <TableCell className="text-right">{campaign.candidatesAdded || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {campaign.status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={() => startCampaign.mutate({ id: campaign.id })}
                            disabled={startCampaign.isPending}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Start
                          </Button>
                        )}
                        {campaign.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => pauseCampaign.mutate({ id: campaign.id })}
                            disabled={pauseCampaign.isPending}
                          >
                            <Pause className="h-3 w-3 mr-1" />
                            Pause
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedCampaign(campaign.id)}
                        >
                          View Candidates
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first sourcing campaign to start discovering candidates automatically
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Campaign
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sourced Candidates View */}
      {selectedCampaign && (
        <SourcedCandidatesView
          campaignId={selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
        />
      )}
    </div>
    </RecruiterLayout>
  );
}

// Sourced Candidates Component
function SourcedCandidatesView({ campaignId, onClose }: { campaignId: number; onClose: () => void }) {
  const { data: candidates, isLoading } = trpc.recruiter.getSourcedCandidates.useQuery({ campaignId });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sourced Candidates</DialogTitle>
          <DialogDescription>
            Candidates discovered by this campaign
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : candidates && candidates.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Match Score</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((candidate) => (
                <TableRow key={candidate.id}>
                  <TableCell className="font-medium">{candidate.fullName}</TableCell>
                  <TableCell>{candidate.currentTitle || 'N/A'}</TableCell>
                  <TableCell>{candidate.location || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{candidate.sourceType}</Badge>
                  </TableCell>
                  <TableCell>
                    {candidate.matchScore ? (
                      <Badge>{candidate.matchScore}/100</Badge>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>
                    {candidate.addedToPool ? (
                      <Badge variant="default">Added to Pool</Badge>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No candidates sourced yet
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
