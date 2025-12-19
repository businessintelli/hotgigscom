import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileText, Building2, Clock, TrendingUp, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface TemplateSelectorProps {
  onSelectTemplate: (template: any) => void;
  onManageTemplates?: () => void;
}

export default function TemplateSelector({ onSelectTemplate, onManageTemplates }: TemplateSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch accessible templates
  const { data: templates, isLoading, refetch } = trpc.job.getAccessibleTemplates.useQuery(undefined, {
    enabled: open,
  });

  const deleteTemplateMutation = trpc.job.deleteTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template deleted successfully");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });

  const handleUseTemplate = async (templateId: number) => {
    try {
      const template = await trpc.job.useTemplate.mutate({ templateId });
      onSelectTemplate(template);
      setOpen(false);
      toast.success("Template loaded successfully");
    } catch (error: any) {
      toast.error(`Failed to load template: ${error.message}`);
    }
  };

  const handleDeleteTemplate = async (e: React.MouseEvent, templateId: number) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this template?")) {
      deleteTemplateMutation.mutate({ templateId });
    }
  };

  // Group templates by category
  const groupedTemplates = templates?.reduce((acc: any, template: any) => {
    const category = template.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {}) || {};

  const categories = Object.keys(groupedTemplates);
  const filteredTemplates = selectedCategory 
    ? groupedTemplates[selectedCategory] || []
    : templates || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <FileText className="h-4 w-4 mr-2" />
          Use Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Job Template</DialogTitle>
          <DialogDescription>
            Choose from your saved templates or company-wide templates to quickly create a job posting
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : templates && templates.length > 0 ? (
          <div className="space-y-4">
            {/* Category filters */}
            {categories.length > 1 && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  All ({templates.length})
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category} ({groupedTemplates[category].length})
                  </Button>
                ))}
              </div>
            )}

            {/* Templates grid */}
            <ScrollArea className="h-[400px] pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map((template: any) => (
                  <Card 
                    key={template.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleUseTemplate(template.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          {template.templateDescription && (
                            <CardDescription className="mt-1 text-sm">
                              {template.templateDescription}
                            </CardDescription>
                          )}
                        </div>
                        {template.isOwner && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => handleDeleteTemplate(e, template.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Template details */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">{template.title || "Untitled Position"}</span>
                        </div>
                        {template.companyName && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Building2 className="h-4 w-4" />
                            <span>{template.companyName}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <TrendingUp className="h-4 w-4" />
                          <span>Used {template.usageCount || 0} times</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>
                            {new Date(template.updatedAt || template.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Tags */}
                      {template.tags && template.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {template.tags.slice(0, 3).map((tag: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {template.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{template.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Scope badge */}
                      <div>
                        {template.isPublic ? (
                          <Badge variant="outline" className="text-xs">
                            Company-Wide
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Personal
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            {onManageTemplates && (
              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full" onClick={onManageTemplates}>
                  Manage Templates
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No templates found. Create your first template by saving a job posting.
            </p>
            {onManageTemplates && (
              <Button variant="outline" onClick={onManageTemplates}>
                Manage Templates
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
