import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import RecruiterLayout from "@/components/RecruiterLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Search, Filter, Trash2, Copy, Edit, BarChart3, Calendar, Tag, Briefcase, TrendingUp, Eye, Share2, Clock, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function TemplateManagement() {
  return (
    <RecruiterLayout>
      <TemplateManagementContent />
    </RecruiterLayout>
  );
}

function TemplateManagementContent() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<"name" | "createdAt" | "usageCount" | "lastUsedAt">("usageCount");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // UI states
  const [selectedTemplates, setSelectedTemplates] = useState<number[]>([]);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [shareRequestTemplate, setShareRequestTemplate] = useState<any>(null);
  const [shareRequestMessage, setShareRequestMessage] = useState("");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showShareHistoryDialog, setShowShareHistoryDialog] = useState(false);
  
  // Fetch share request history
  const { data: shareRequests = [] } = trpc.templateShare.getMyShareRequests.useQuery();
  
  // Fetch templates with search
  const { data: templates = [], isLoading } = trpc.job.searchTemplates.useQuery({
    query: searchQuery || undefined,
    category: categoryFilter || undefined,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    sortBy,
    sortOrder,
  });
  
  // Delete mutation
  const deleteMutation = trpc.job.deleteTemplate.useMutation({
    onSuccess: () => {
      toast({ title: "Template deleted successfully" });
      utils.job.searchTemplates.invalidate();
      setSelectedTemplates([]);
    },
    onError: (error) => {
      toast({ title: "Failed to delete template", description: error.message, variant: "destructive" });
    },
  });
  
  // Bulk delete mutation
  const bulkDeleteMutation = trpc.job.bulkDeleteTemplates.useMutation({
    onSuccess: (result) => {
      toast({ 
        title: `Deleted ${result.deleted.length} template(s)`,
        description: result.failed.length > 0 ? `Failed to delete ${result.failed.length} template(s)` : undefined,
      });
      utils.job.searchTemplates.invalidate();
      setSelectedTemplates([]);
    },
    onError: (error) => {
      toast({ title: "Bulk delete failed", description: error.message, variant: "destructive" });
    },
  });
  
  // Duplicate mutation
  const duplicateMutation = trpc.job.duplicateTemplate.useMutation({
    onSuccess: () => {
      toast({ title: "Template duplicated successfully" });
      utils.job.searchTemplates.invalidate();
    },
    onError: (error) => {
      toast({ title: "Failed to duplicate template", description: error.message, variant: "destructive" });
    },
  });
  
  // Update mutation
  const updateMutation = trpc.job.updateTemplate.useMutation({
    onSuccess: () => {
      toast({ title: "Template updated successfully" });
      utils.job.searchTemplates.invalidate();
      setEditingTemplate(null);
    },
    onError: (error) => {
      toast({ title: "Failed to update template", description: error.message, variant: "destructive" });
    },
  });
  
  // Share request mutation
  const shareRequestMutation = trpc.templateShare.requestShare.useMutation({
    onSuccess: () => {
      toast({ title: "Share request submitted", description: "Company admins will review your request" });
      utils.templateShare.getMyShareRequests.invalidate();
      setShowShareDialog(false);
      setShareRequestMessage("");
      setShareRequestTemplate(null);
    },
    onError: (error) => {
      toast({ title: "Failed to submit request", description: error.message, variant: "destructive" });
    },
  });
  
  // Get all unique categories and tags
  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    templates.forEach(t => {
      if (t.category) categories.add(t.category);
    });
    return Array.from(categories);
  }, [templates]);
  
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    templates.forEach(t => {
      if (t.tags) {
        const templateTags = Array.isArray(t.tags) ? t.tags : [];
        templateTags.forEach((tag: string) => tags.add(tag));
      }
    });
    return Array.from(tags);
  }, [templates]);
  
  // Handle select all
  const handleSelectAll = () => {
    if (selectedTemplates.length === templates.length) {
      setSelectedTemplates([]);
    } else {
      setSelectedTemplates(templates.map(t => t.id));
    }
  };
  
  // Handle individual selection
  const handleSelectTemplate = (id: number) => {
    setSelectedTemplates(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };
  
  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedTemplates.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedTemplates.length} template(s)?`)) {
      bulkDeleteMutation.mutate({ templateIds: selectedTemplates });
    }
  };
  
  // Handle duplicate
  const handleDuplicate = (templateId: number, templateName: string) => {
    duplicateMutation.mutate({ 
      templateId,
      newName: `${templateName} (Copy)`,
    });
  };
  
  // Handle update
  const handleUpdate = () => {
    if (!editingTemplate) return;
    
    updateMutation.mutate({
      templateId: editingTemplate.id,
      name: editingTemplate.name,
      title: editingTemplate.title,
      description: editingTemplate.description,
      category: editingTemplate.category,
      tags: editingTemplate.tags,
    });
  };
  
  return (
    <div className="py-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Template Management</h1>
          <p className="text-muted-foreground">
            Manage your job posting templates with advanced filtering and organization
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowShareHistoryDialog(true)}
          className="flex items-center gap-2"
        >
          <Share2 className="h-4 w-4" />
          My Share Requests
          {shareRequests.filter(r => r.status === 'pending').length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {shareRequests.filter(r => r.status === 'pending').length}
            </Badge>
          )}
        </Button>
      </div>
      
      {/* Search and Filter Bar */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates by name, title, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
        </div>
        
        {showFilters && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All categories</SelectItem>
                      {allCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Sort By</Label>
                  <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usageCount">Usage Count</SelectItem>
                      <SelectItem value="lastUsedAt">Last Used</SelectItem>
                      <SelectItem value="createdAt">Created Date</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Sort Order</Label>
                  <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Descending</SelectItem>
                      <SelectItem value="asc">Ascending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {allTags.length > 0 && (
                <div>
                  <Label className="mb-2 block">Filter by Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map(tag => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedTags(prev =>
                            prev.includes(tag)
                              ? prev.filter(t => t !== tag)
                              : [...prev, tag]
                          );
                        }}
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Bulk Actions Bar */}
      {selectedTemplates.length > 0 && (
        <div className="mb-4 p-4 bg-muted rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedTemplates.length === templates.length}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm font-medium">
              {selectedTemplates.length} template(s) selected
            </span>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={bulkDeleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      )}
      
      {/* Templates Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No templates found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || categoryFilter || selectedTags.length > 0
                ? "Try adjusting your filters"
                : "Create your first template when posting a job"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    <Checkbox
                      checked={selectedTemplates.includes(template.id)}
                      onCheckedChange={() => handleSelectTemplate(template.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="mt-1">{template.title}</CardDescription>
                    </div>
                  </div>
                </div>
                
                {template.category && (
                  <Badge variant="secondary" className="w-fit mt-2">
                    {template.category}
                  </Badge>
                )}
                
                {template.tags && Array.isArray(template.tags) && template.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {template.tags.slice(0, 3).map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {template.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>{template.usageCount || 0} uses</span>
                  </div>
                  {template.lastUsedAt && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDistanceToNow(new Date(template.lastUsedAt), { addSuffix: true })}</span>
                    </div>
                  )}
                </div>
                
                {template.isCompanyWide && (
                  <Badge variant="default" className="w-fit">
                    Company-wide
                  </Badge>
                )}
                
                {!template.isCompanyWide && shareRequests.find(req => req.templateId === template.id) && (
                  <Badge 
                    variant={shareRequests.find(req => req.templateId === template.id)?.status === 'pending' ? 'secondary' : 
                            shareRequests.find(req => req.templateId === template.id)?.status === 'approved' ? 'default' : 'destructive'}
                    className="w-fit"
                  >
                    {shareRequests.find(req => req.templateId === template.id)?.status === 'pending' && (
                      <><Clock className="h-3 w-3 mr-1" />Share Pending</>
                    )}
                    {shareRequests.find(req => req.templateId === template.id)?.status === 'approved' && (
                      <><CheckCircle className="h-3 w-3 mr-1" />Share Approved</>
                    )}
                    {shareRequests.find(req => req.templateId === template.id)?.status === 'rejected' && (
                      <><XCircle className="h-3 w-3 mr-1" />Share Rejected</>
                    )}
                  </Badge>
                )}
                
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setPreviewTemplate(template)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{previewTemplate?.name}</DialogTitle>
                        <DialogDescription>{previewTemplate?.title}</DialogDescription>
                      </DialogHeader>
                      {previewTemplate && (
                        <div className="space-y-4">
                          <div>
                            <Label className="font-semibold">Description</Label>
                            <p className="text-sm mt-1 whitespace-pre-wrap">{previewTemplate.description}</p>
                          </div>
                          
                          {previewTemplate.location && (
                            <div>
                              <Label className="font-semibold">Location</Label>
                              <p className="text-sm mt-1">{previewTemplate.location}</p>
                            </div>
                          )}
                          
                          {previewTemplate.jobType && (
                            <div>
                              <Label className="font-semibold">Job Type</Label>
                              <p className="text-sm mt-1">{previewTemplate.jobType}</p>
                            </div>
                          )}
                          
                          {previewTemplate.experienceLevel && (
                            <div>
                              <Label className="font-semibold">Experience Level</Label>
                              <p className="text-sm mt-1">{previewTemplate.experienceLevel}</p>
                            </div>
                          )}
                          
                          {(previewTemplate.salaryMin || previewTemplate.salaryMax) && (
                            <div>
                              <Label className="font-semibold">Salary Range</Label>
                              <p className="text-sm mt-1">
                                ${previewTemplate.salaryMin?.toLocaleString()} - ${previewTemplate.salaryMax?.toLocaleString()}
                              </p>
                            </div>
                          )}
                          
                          {previewTemplate.requiredSkills && previewTemplate.requiredSkills.length > 0 && (
                            <div>
                              <Label className="font-semibold">Required Skills</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {previewTemplate.requiredSkills.map((skill: string) => (
                                  <Badge key={skill} variant="default">{skill}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {previewTemplate.preferredSkills && previewTemplate.preferredSkills.length > 0 && (
                            <div>
                              <Label className="font-semibold">Preferred Skills</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {previewTemplate.preferredSkills.map((skill: string) => (
                                  <Badge key={skill} variant="secondary">{skill}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="pt-4 border-t">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-4 w-4" />
                                <span>Used {previewTemplate.usageCount || 0} times</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Created {formatDistanceToNow(new Date(previewTemplate.createdAt), { addSuffix: true })}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingTemplate({ ...template })}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Template</DialogTitle>
                      </DialogHeader>
                      {editingTemplate && (
                        <div className="space-y-4">
                          <div>
                            <Label>Template Name</Label>
                            <Input
                              value={editingTemplate.name}
                              onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Job Title</Label>
                            <Input
                              value={editingTemplate.title}
                              onChange={(e) => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Category</Label>
                            <Input
                              value={editingTemplate.category || ""}
                              onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Textarea
                              value={editingTemplate.description}
                              onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                              rows={6}
                            />
                          </div>
                        </div>
                      )}
                      <DialogFooter>
                        <Button
                          onClick={handleUpdate}
                          disabled={updateMutation.isPending}
                        >
                          Save Changes
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicate(template.id, template.name)}
                    disabled={duplicateMutation.isPending}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  
                  {!template.isCompanyWide && !shareRequests.find(req => req.templateId === template.id && req.status === 'pending') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShareRequestTemplate(template);
                        setShowShareDialog(true);
                      }}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this template?")) {
                        deleteMutation.mutate({ templateId: template.id });
                      }
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Share Request Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Company-Wide Sharing</DialogTitle>
            <DialogDescription>
              Request to make this template available to all recruiters in your company
            </DialogDescription>
          </DialogHeader>
          {shareRequestTemplate && (
            <div className="space-y-4">
              <div>
                <Label className="font-semibold">Template</Label>
                <p className="text-sm mt-1">{shareRequestTemplate.name}</p>
                <p className="text-xs text-muted-foreground">{shareRequestTemplate.title}</p>
              </div>
              <div>
                <Label htmlFor="shareMessage">Message to Admins (Optional)</Label>
                <Textarea
                  id="shareMessage"
                  placeholder="Explain why this template would benefit the team..."
                  value={shareRequestMessage}
                  onChange={(e) => setShareRequestMessage(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowShareDialog(false);
                setShareRequestMessage("");
                setShareRequestTemplate(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (shareRequestTemplate) {
                  shareRequestMutation.mutate({
                    templateId: shareRequestTemplate.id,
                    requestMessage: shareRequestMessage || undefined,
                  });
                }
              }}
              disabled={shareRequestMutation.isPending}
            >
              {shareRequestMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Share History Dialog */}
      <Dialog open={showShareHistoryDialog} onOpenChange={setShowShareHistoryDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>My Share Requests</DialogTitle>
            <DialogDescription>
              View the status of your template share requests
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {shareRequests.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No share requests yet
              </p>
            ) : (
              shareRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{request.templateName}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          Requested {formatDistanceToNow(new Date(request.requestedAt), { addSuffix: true })}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={request.status === 'pending' ? 'secondary' : 
                                request.status === 'approved' ? 'default' : 'destructive'}
                      >
                        {request.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  {(request.requestMessage || request.reviewNotes) && (
                    <CardContent className="space-y-2">
                      {request.requestMessage && (
                        <div>
                          <Label className="text-xs">Your Message</Label>
                          <p className="text-sm text-muted-foreground">{request.requestMessage}</p>
                        </div>
                      )}
                      {request.reviewNotes && (
                        <div>
                          <Label className="text-xs">Admin Response</Label>
                          <p className="text-sm text-muted-foreground">{request.reviewNotes}</p>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
